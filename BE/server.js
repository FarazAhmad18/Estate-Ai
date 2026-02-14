require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express=require('express')
const http=require('http')
const { Server }=require('socket.io')
const jwt=require('jsonwebtoken')
const app=express()
const sequelize=require('./config/db')
const cors=require('cors')
app.use(express.json())
const allowedOrigins=process.env.FRONTEND_URL?process.env.FRONTEND_URL.split(','):['http://localhost:5173']
app.use(cors({origin:allowedOrigins,credentials:true}))
const { Conversation, User } = require('./models/index')
const {trackVisitor}=require('./middlewares/visitorMiddleware')
app.use(trackVisitor)
const authRoutes=require('./routes/authRoutes')
app.use('/api',authRoutes)
const adminRoutes=require('./routes/adminRoutes')
app.use('/api/admin',adminRoutes)
const uploadRoutes=require('./routes/uploadRoutes')
app.use('/api',uploadRoutes)
const propertyRoutes=require('./routes/propertyRoutes')
app.use('/api',propertyRoutes)
const favoriteRoutes=require('./routes/favoriteRoutes')
app.use('/api',favoriteRoutes)
const testimonialRoutes=require('./routes/testimonialRoutes')
app.use('/api',testimonialRoutes)
const agentRoutes=require('./routes/agentRoutes')
app.use('/api',agentRoutes)
const messageRoutes=require('./routes/messageRoutes')
app.use('/api',messageRoutes)
const aiRoutes=require('./routes/aiRoutes')
app.use('/api/ai',aiRoutes)

app.get('/',async(req,res)=>{
res.send("Real Estate is Running")
})

// HTTP server + Socket.io
const server=http.createServer(app)
const io=new Server(server,{
  cors:{
    origin:allowedOrigins,
    methods:['GET','POST'],
    credentials:true,
  },
})

// JWT auth middleware for Socket.io
io.use(async(socket,next)=>{
  const token=socket.handshake.auth.token
  if(!token) return next(new Error('Authentication required'))
  try{
    const payload=jwt.verify(token,process.env.JWT_SECRET_KEY)
    const user=await User.findByPk(payload.id)
    if(!user) return next(new Error('User not found'))
    socket.userId=payload.id
    next()
  }catch{
    next(new Error('Invalid token'))
  }
})

io.on('connection',(socket)=>{
  // Join user's personal room
  socket.join(`user_${socket.userId}`)

  // Join/leave conversation rooms
  socket.on('join_conversation',async({conversationId})=>{
    const conv=await Conversation.findByPk(conversationId)
    if(!conv||(conv.buyer_id!==socket.userId&&conv.agent_id!==socket.userId)) return
    socket.join(`conversation_${conversationId}`)
  })
  socket.on('leave_conversation',({conversationId})=>{
    socket.leave(`conversation_${conversationId}`)
  })

  // Typing indicators (room-scoped)
  socket.on('typing',({conversationId})=>{
    socket.to(`conversation_${conversationId}`).emit('user_typing',{conversationId,userId:socket.userId})
  })
  socket.on('stop_typing',({conversationId})=>{
    socket.to(`conversation_${conversationId}`).emit('user_stop_typing',{conversationId,userId:socket.userId})
  })

  socket.on('disconnect',()=>{})
})

// Store io instance for controllers
app.set('io',io)

const port=process.env.PORT || 6000
server.listen(port,async()=>{
    console.log(`port is listening at ${port}`)
    try{
     await sequelize.authenticate();
     console.log("DB Connected")
     await sequelize.sync({alter:true});
     // Ensure sender_id allows NULL for system messages
     await sequelize.query('ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL').catch(()=>{})
     console.log("tables synced")
    }
    catch(err){
         console.log("db cant connect ",err)
    }
})
