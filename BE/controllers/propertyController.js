const { Op, fn, col } = require('sequelize')
const Property=require('../models/Property')
const User=require('../models/User')
const PropertyImage=require('../models/PropertyImage')
const {AgentReview,Favorite,Conversation,Message}=require('../models/index')

exports.search=async(req,res)=>{
    try{
 const { location, type, purpose, minPrice, maxPrice, bedrooms, minArea, maxArea } = req.query
 const page = Math.max(parseInt(req.query.page) || 1, 1)
 const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100)
 const sortBy = ['price','createdAt','bedrooms','area'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt'
 const order = req.query.order === 'ASC' ? 'ASC' : 'DESC'
 const offset = (page - 1) * limit

 const where={}
 if(req.query.agent_id) where.agent_id=parseInt(req.query.agent_id)
 if(req.query.agent_name){
     const matchingAgents=await User.findAll({where:{role:'Agent',name:{[Op.iLike]:`%${req.query.agent_name}%`}},attributes:['id'],raw:true})
     where.agent_id={[Op.in]:matchingAgents.map(a=>a.id)}
 }
 if(location) where.location= {[Op.iLike]:`%${location}%`}
 if(type && type!=='All') where.type=type
 if(purpose && purpose!=='All') where.purpose=purpose
 if(minPrice!=null && minPrice!=='' && !isNaN(Number(minPrice))) where.price={...(where.price||{}),[Op.gte]:Number(minPrice)}
 if(maxPrice!=null && maxPrice!=='' && !isNaN(Number(maxPrice))) where.price={...(where.price||{}),[Op.lte]:Number(maxPrice)}
 if(bedrooms && !isNaN(Number(bedrooms))) where.bedrooms=Number(bedrooms)
 if(minArea!=null && minArea!=='' && !isNaN(Number(minArea))) where.area={...(where.area||{}),[Op.gte]:Number(minArea)}
 if(maxArea!=null && maxArea!=='' && !isNaN(Number(maxArea))) where.area={...(where.area||{}),[Op.lte]:Number(maxArea)}
 const status=req.query.status
 if(status && status!=='All') where.status=status
 else if(!status) where.status='Available'

const { count, rows } = await Property.findAndCountAll({
    where,
    include: [{ model: PropertyImage, where: { is_primary: true }, required: false }],
    order:[[sortBy, order]],
    limit,
    offset,
})

res.status(200).json({
    properties: rows,
    totalCount: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
})
    }
    catch(e)
    {
        console.error("Search error:", e)
        return res.status(500).json({error:'Failed to search properties'})
    }
}
exports.getproperty=async(req,res)=>{
    try{
        const {id}=req.params
        if(!id) return res.status(400).json({error:'Property ID is required'})
         const property= await Property.findByPk(id, { include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'avatar_url'] }, { model: PropertyImage }] })
        if(!property) return res.status(404).json({error:'Property not found'})
        return res.status(200).json({property})
    }
    catch(e){
     console.error("Get property error:", e)
     return res.status(500).json({error:'Failed to fetch property'})
    }
}
exports.createProperty=async(req,res)=>{
    try{
        const agent_id=req.user.id
        const {type,purpose,price,location,bedrooms,area,description}=req.body
        const required=['type','purpose','price','location','area','description']
        for(const key of required)
        {
            if(req.body[key]==null||req.body[key]=='')
            return res.status(400).json({error:`${key} is required`})
        }
        const property=await Property.create({agent_id,type,purpose,price,location,bedrooms:bedrooms||null,area,description})
        return res.status(201).json({property})
    }
    catch(e){
        console.error("Create property error:", e)
        return res.status(500).json({error:'Failed to create property'})
    }
}
exports.updateProperty=async(req,res)=>{
    try{
        const id=req.params.id
        const { type, purpose, price, location, bedrooms, area, description } = req.body
     if(!id) return res.status(400).json({error:'Property ID is required'})
        const property=await Property.findByPk(id)
    if(!property) return res.status(404).json({error:'Property not found'})
    if(property.agent_id!=req.user.id)return res.status(403).json({error:'You do not own this property'})
        property.type=type??property.type
        property.purpose=purpose??property.purpose
        property.price=price??property.price
        property.location=location??property.location
        property.bedrooms=bedrooms??property.bedrooms
        property.area=area??property.area
        property.description=description??property.description
        const oldStatus=property.status
        if(req.body.status && ['Available','Sold','Rented'].includes(req.body.status)){
            property.status=req.body.status
        }
        await property.save()

        // Send system message to all conversations when property is sold/rented
        // Wrapped in its own try/catch so a failure here doesn't break the property update response
        if(property.status!==oldStatus && (property.status==='Sold'||property.status==='Rented')){
            try{
                const statusLabel=property.status==='Sold'?'sold':'rented'
                const systemBody=`This property has been ${statusLabel}. It is no longer available.`
                const conversations=await Conversation.findAll({where:{property_id:id}})
                const io=req.app.get('io')
                for(const conv of conversations){
                    const msg=await Message.create({
                        conversation_id:conv.id,
                        sender_id:null,
                        body:systemBody,
                        read:false,
                    })
                    if(io){
                        const payload={message:msg.toJSON(),conversationId:conv.id}
                        io.to(`user_${conv.buyer_id}`).to(`user_${conv.agent_id}`).emit('new_message',payload)
                    }
                }
            }catch(msgErr){
                console.error("Failed to send system message for status change:",msgErr)
            }
        }

    return res.status(200).json(property)
    }
    catch(e){
        console.error("Update property error:", e)
        return res.status(500).json({error:'Failed to update property'})
    }
}
exports.deleteProperty=async(req,res)=>{
    try{
const id=req.params.id
const property=await Property.findByPk(id)
if(!property)return res.status(404).json({error:'Property not found'})
if(property.agent_id!=req.user.id)return res.status(403).json({error:'You do not own this property'})

// Notify conversation participants before cascade delete
const conversations=await Conversation.findAll({where:{property_id:id}})
const io=req.app.get('io')
if(io){
  conversations.forEach(conv=>{
    io.to(`user_${conv.buyer_id}`).to(`user_${conv.agent_id}`).emit('conversation_deleted',{
      conversationId:conv.id,
    })
  })
}

await property.destroy()
res.status(200).json({msg:'Property Deleted Successfully'})
    }
    catch(e){
      console.error("Delete property error:", e)
      return res.status(500).json({error:'Failed to delete property'})
    }
}
exports.getLocationSuggestions=async(req,res)=>{
    try{
        const q=req.query.q
        if(!q||!q.trim()) return res.json({suggestions:[]})
        const trimmed=q.trim()
        const [locations,agents]=await Promise.all([
            Property.findAll({
                where:{status:'Available',location:{[Op.iLike]:`%${trimmed}%`}},
                attributes:[[fn('DISTINCT',col('location')),'location']],
                limit:4,
                raw:true,
            }),
            User.findAll({
                where:{role:'Agent',name:{[Op.iLike]:`%${trimmed}%`}},
                attributes:['id','name'],
                limit:4,
                raw:true,
            }),
        ])
        const suggestions=[
            ...locations.map(r=>({text:r.location,type:'location'})),
            ...agents.map(r=>({text:r.name,type:'agent',id:r.id})),
        ]
        return res.json({suggestions})
    }catch(e){
        console.error("Location suggestions error:",e)
        return res.status(500).json({error:'Failed to fetch suggestions'})
    }
}
exports.getAgentStats=async(req,res)=>{
    try{
        const agentId=req.user.id
        const all=await Property.findAll({where:{agent_id:agentId},attributes:['id','status','purpose']})
        const total=all.length
        const available=all.filter(p=>p.status==='Available').length
        const sold=all.filter(p=>p.status==='Sold').length
        const rented=all.filter(p=>p.status==='Rented').length
        const forSale=all.filter(p=>p.purpose==='Sale'&&p.status==='Available').length
        const forRent=all.filter(p=>p.purpose==='Rent'&&p.status==='Available').length

        const reviewStats=await AgentReview.findOne({
            where:{agent_id:agentId},
            attributes:[
                [fn('AVG',col('rating')),'avgRating'],
                [fn('COUNT',col('id')),'totalReviews'],
            ],
            raw:true,
        })
        const avgRating=reviewStats?.avgRating?parseFloat(parseFloat(reviewStats.avgRating).toFixed(1)):0
        const totalReviews=parseInt(reviewStats?.totalReviews)||0

        const propertyIds=all.map(p=>p.id)
        let totalFavorites=0
        if(propertyIds.length>0){
            totalFavorites=await Favorite.count({where:{property_id:{[Op.in]:propertyIds}}})
        }

        const recentReviews=await AgentReview.findAll({
            where:{agent_id:agentId},
            include:[{model:User,as:'Reviewer',attributes:['id','name','avatar_url']}],
            order:[['createdAt','DESC']],
            limit:3,
        })

        return res.json({total,available,sold,rented,forSale,forRent,joinedAt:req.user.createdAt,avgRating,totalReviews,totalFavorites,recentReviews})
    }catch(e){
        console.error("Agent stats error:",e)
        return res.status(500).json({error:'Failed to fetch stats'})
    }
}
