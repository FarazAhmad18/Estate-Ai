const User=require('../models/User')
const jwt=require('jsonwebtoken')

async function  auth (req,res,next){
    try{
const header=req.headers.authorization
if(!header)
    {return res.status(401).json({error:'Authorization header missing'})
    }
if(!header.startsWith('Bearer '))
    {return res.status(401).json({error:"Authorization header must be 'Bearer <token>'"})
    }
    const token=header.split(' ')[1]
    const payload=jwt.verify(token,process.env.JWT_SECRET_KEY)
    if(!payload)
    {
        return res.status(401).json({error:'Invalid token'})
    }
    const user=await User.findByPk(payload.id,{
        attributes:['id','name','email','role','phone','avatar_url','createdAt'],}
    )
    if(!user) return res.status(401).json({error:'User not found'})
    req.user=user;
    next()
}
catch(err)
{
    if(err.name==='TokenExpiredError'){
        return res.status(401).json({error:'Token has expired'})
    }
    console.error("Auth middleware error:", err)
    return res.status(401).json({error:'Invalid token'})
}
}
module.exports={auth}
