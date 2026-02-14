const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { Op } = require('sequelize');
const Property = require('../models/Property');
const PropertyImage = require('../models/PropertyImage');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- In-memory rate limiters ---

// generateDescription: 10 requests per user per hour
const descRateMap = new Map();
function checkDescRate(userId) {
  const now = Date.now();
  const key = String(userId);
  const entry = descRateMap.get(key);
  if (!entry || now - entry.windowStart > 3600000) {
    descRateMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// chat: 20 requests per IP per hour
const chatRateMap = new Map();
function checkChatRate(ip) {
  const now = Date.now();
  const key = String(ip);
  const entry = chatRateMap.get(key);
  if (!entry || now - entry.windowStart > 3600000) {
    chatRateMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

// --- Generate Description ---

exports.generateDescription = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    if (!checkDescRate(req.user.id)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Max 10 requests per hour.' });
    }

    const { type, purpose, price, location, bedrooms, area, features } = req.body;

    if (!type || !price) {
      return res.status(400).json({ error: 'At least type and price are required' });
    }

    const prompt = `Write a professional, engaging 2-3 paragraph property listing description for a real estate website. Use the following details:

- Property Type: ${type}
- Purpose: For ${purpose || 'Sale'}
- Price: PKR ${Number(price).toLocaleString()}
- Location: ${location || 'Not specified'}
- Bedrooms: ${bedrooms || 'Not specified'}
- Area: ${area ? area + ' sq ft' : 'Not specified'}
${features ? `- Features: ${features}` : ''}

Requirements:
- Write in a warm, professional tone suitable for a Pakistani real estate market
- Highlight the key selling points
- Keep it concise but compelling (2-3 paragraphs)
- Do NOT include the price in the description (it's shown separately)
- Do NOT use markdown formatting, just plain text
- Do NOT start with "Welcome" or use cliché openings`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ description: text.trim() });
  } catch (e) {
    console.error('AI generate description error:', e);
    if (e.status === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please try again later.' });
    }
    return res.status(500).json({ error: 'Failed to generate description' });
  }
};

// --- Chat with function calling ---

const searchPropertiesTool = {
  functionDeclarations: [{
    name: 'searchProperties',
    description: 'Search for real estate properties in the database based on filters. Use this when the user asks about available properties, wants to find homes, apartments, or any real estate listings.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        location: {
          type: SchemaType.STRING,
          description: 'City, area, or neighborhood to search in (e.g. "Lahore", "DHA Phase 5")',
        },
        type: {
          type: SchemaType.STRING,
          description: 'Property type',
          enum: ['House', 'Apartment', 'Villa', 'Commercial', 'Land'],
        },
        purpose: {
          type: SchemaType.STRING,
          description: 'Whether the property is for sale or rent',
          enum: ['Sale', 'Rent'],
        },
        minPrice: {
          type: SchemaType.NUMBER,
          description: 'Minimum price in PKR',
        },
        maxPrice: {
          type: SchemaType.NUMBER,
          description: 'Maximum price in PKR',
        },
        bedrooms: {
          type: SchemaType.NUMBER,
          description: 'Number of bedrooms',
        },
        minArea: {
          type: SchemaType.NUMBER,
          description: 'Minimum area in square feet',
        },
        maxArea: {
          type: SchemaType.NUMBER,
          description: 'Maximum area in square feet',
        },
      },
    },
  }],
};

async function executePropertySearch(filters) {
  const where = { status: 'Available' };

  if (filters.location) where.location = { [Op.iLike]: `%${filters.location}%` };
  if (filters.type) where.type = filters.type;
  if (filters.purpose) where.purpose = filters.purpose;
  if (filters.minPrice) where.price = { ...(where.price || {}), [Op.gte]: filters.minPrice };
  if (filters.maxPrice) where.price = { ...(where.price || {}), [Op.lte]: filters.maxPrice };
  if (filters.bedrooms) where.bedrooms = filters.bedrooms;
  if (filters.minArea) where.area = { ...(where.area || {}), [Op.gte]: filters.minArea };
  if (filters.maxArea) where.area = { ...(where.area || {}), [Op.lte]: filters.maxArea };

  const properties = await Property.findAll({
    where,
    include: [
      { model: PropertyImage, where: { is_primary: true }, required: false },
      { model: User, attributes: ['id', 'name', 'email', 'phone', 'avatar_url'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 6,
  });

  return properties.map(p => p.toJSON());
}

exports.chat = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!checkChatRate(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Max 20 requests per hour.' });
    }

    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [searchPropertiesTool],
      systemInstruction: `You are a helpful real estate assistant for a Pakistani property website. You help users find properties, answer questions about real estate, and provide guidance.

Key rules:
- When users ask about finding properties, searching for homes, or anything related to property listings, use the searchProperties function to find relevant results.
- Prices are in PKR (Pakistani Rupees). Common units: 1 Lac = 100,000 PKR, 1 Crore = 10,000,000 PKR.
- Property types available: House, Apartment, Villa, Commercial, Land.
- Properties can be for Sale or Rent.
- Be conversational and helpful. Keep responses concise.
- If search returns no results, suggest broadening the search criteria.
- Do NOT use markdown formatting like **bold** or bullet points with *. Use plain text only.`,
    });

    // Build chat history from client
    const chatHistory = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'model') {
          chatHistory.push({
            role: msg.role,
            parts: [{ text: msg.text }],
          });
        }
      }
    }

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Check if Gemini wants to call a function
    const functionCall = response.functionCalls()?.[0];

    if (functionCall && functionCall.name === 'searchProperties') {
      const filters = functionCall.args || {};
      const properties = await executePropertySearch(filters);

      // Send function result back to Gemini
      const result2 = await chat.sendMessage([{
        functionResponse: {
          name: 'searchProperties',
          response: {
            results: properties.map(p => ({
              id: p.id,
              type: p.type,
              purpose: p.purpose,
              price: p.price,
              location: p.location,
              bedrooms: p.bedrooms,
              area: p.area,
              status: p.status,
              image: p.PropertyImages?.[0]?.image_url || null,
              agent: p.User?.name || 'Unknown',
            })),
            totalFound: properties.length,
          },
        },
      }]);

      const aiText = result2.response.text();
      return res.json({
        reply: aiText.trim(),
        properties: properties,
      });
    }

    // Direct text response (no function call)
    return res.json({
      reply: response.text().trim(),
      properties: [],
    });
  } catch (e) {
    console.error('AI chat error:', e);
    if (e.status === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please try again later.' });
    }
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
};
