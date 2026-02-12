const {User,Property,PropertyImage,AgentReview,Favorite}=require('../models/index')
const {Op,fn,col}=require('sequelize')

exports.getAgentProfile=async(req,res)=>{
    try{
        const agentId=parseInt(req.params.id)
        const agent=await User.findOne({
            where:{id:agentId,role:'Agent'},
            attributes:['id','name','email','phone','avatar_url','createdAt'],
        })
        if(!agent) return res.status(404).json({error:'Agent not found'})

        const properties=await Property.findAll({where:{agent_id:agentId},attributes:['id','status']})
        const totalListings=properties.length
        const available=properties.filter(p=>p.status==='Available').length
        const sold=properties.filter(p=>p.status==='Sold').length
        const rented=properties.filter(p=>p.status==='Rented').length

        const reviewStats=await AgentReview.findOne({
            where:{agent_id:agentId},
            attributes:[
                [fn('AVG',col('rating')),'avgRating'],
                [fn('COUNT',col('id')),'totalReviews'],
            ],
            raw:true,
        })

        return res.json({
            agent,
            stats:{
                totalListings,
                available,
                sold,
                rented,
                avgRating:reviewStats?.avgRating?parseFloat(parseFloat(reviewStats.avgRating).toFixed(1)):0,
                totalReviews:parseInt(reviewStats?.totalReviews)||0,
            },
        })
    }catch(e){
        console.error('Get agent profile error:',e)
        return res.status(500).json({error:'Failed to fetch agent profile'})
    }
}

exports.getAgentProperties=async(req,res)=>{
    try{
        const agentId=parseInt(req.params.id)
        const agent=await User.findOne({where:{id:agentId,role:'Agent'}})
        if(!agent) return res.status(404).json({error:'Agent not found'})

        const page=Math.max(parseInt(req.query.page)||1,1)
        const limit=Math.min(Math.max(parseInt(req.query.limit)||12,1),100)
        const offset=(page-1)*limit
        const status=req.query.status||'Available'

        const where={agent_id:agentId}
        if(status&&status!=='All') where.status=status

        const {count,rows}=await Property.findAndCountAll({
            where,
            include:[{model:PropertyImage,where:{is_primary:true},required:false}],
            order:[['createdAt','DESC']],
            limit,
            offset,
        })

        return res.json({
            properties:rows,
            totalCount:count,
            page,
            totalPages:Math.ceil(count/limit),
        })
    }catch(e){
        console.error('Get agent properties error:',e)
        return res.status(500).json({error:'Failed to fetch agent properties'})
    }
}

exports.getAgentReviews=async(req,res)=>{
    try{
        const agentId=parseInt(req.params.id)
        const page=Math.max(parseInt(req.query.page)||1,1)
        const limit=Math.min(Math.max(parseInt(req.query.limit)||10,1),50)
        const offset=(page-1)*limit

        const {count,rows}=await AgentReview.findAndCountAll({
            where:{agent_id:agentId},
            include:[{model:User,as:'Reviewer',attributes:['id','name','avatar_url']}],
            order:[['createdAt','DESC']],
            limit,
            offset,
        })

        return res.json({
            reviews:rows,
            totalCount:count,
            page,
            totalPages:Math.ceil(count/limit),
        })
    }catch(e){
        console.error('Get agent reviews error:',e)
        return res.status(500).json({error:'Failed to fetch reviews'})
    }
}

exports.createReview=async(req,res)=>{
    try{
        const agentId=parseInt(req.params.id)
        const reviewerId=req.user.id

        if(reviewerId===agentId) return res.status(400).json({error:'You cannot review yourself'})
        if(req.user.role!=='Buyer') return res.status(403).json({error:'Only buyers can review agents'})

        const agent=await User.findOne({where:{id:agentId,role:'Agent'}})
        if(!agent) return res.status(404).json({error:'Agent not found'})

        const {rating,content}=req.body
        if(!rating||!content) return res.status(400).json({error:'Rating and content are required'})
        if(rating<1||rating>5) return res.status(400).json({error:'Rating must be between 1 and 5'})

        const existing=await AgentReview.findOne({where:{agent_id:agentId,reviewer_id:reviewerId}})
        if(existing) return res.status(409).json({error:'You have already reviewed this agent'})

        const review=await AgentReview.create({agent_id:agentId,reviewer_id:reviewerId,rating:parseInt(rating),content})
        const reviewWithUser=await AgentReview.findByPk(review.id,{
            include:[{model:User,as:'Reviewer',attributes:['id','name','avatar_url']}],
        })

        return res.status(201).json({review:reviewWithUser})
    }catch(e){
        console.error('Create review error:',e)
        return res.status(500).json({error:'Failed to create review'})
    }
}

exports.deleteReview=async(req,res)=>{
    try{
        const reviewId=parseInt(req.params.reviewId)
        const review=await AgentReview.findByPk(reviewId)
        if(!review) return res.status(404).json({error:'Review not found'})
        if(review.reviewer_id!==req.user.id) return res.status(403).json({error:'You can only delete your own reviews'})

        await review.destroy()
        return res.json({message:'Review deleted'})
    }catch(e){
        console.error('Delete review error:',e)
        return res.status(500).json({error:'Failed to delete review'})
    }
}
