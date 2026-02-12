// require('dotenv').config()
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express=require('express')
const app=express()
const sequelize=require('./config/db')
const cors=require('cors')
app.use(express.json())
app.use(cors())
require('./models/index')
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
app.get('/',async(req,res)=>{
res.send("Real Estate is Running")
})

require("dotenv").config();

// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
// console.log("DB_NAME:", process.env.DB_NAME);


const port=process.env.PORT || 6000
app.listen(port,async()=>{
    console.log(`port is listening at ${port}`)
    try{
     await sequelize.authenticate();
     console.log("DB Connected")
     await sequelize.sync({alter:true});
     console.log("tables synced")
    }
    catch(err){
         console.log("db cant connect ",err)
    }
})
