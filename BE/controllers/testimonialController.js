const {Testimonial,User}=require('../models/index')

exports.create=async(req,res)=>{
    try{
        const user_id=req.user.id
        const {content,rating}=req.body
        if(!content||!content.trim()) return res.status(400).json({error:'Content is required'})

        const existing=await Testimonial.findOne({where:{user_id}})
        if(existing) return res.status(409).json({error:'You have already submitted a testimonial'})

        const testimonial=await Testimonial.create({
            user_id,
            content:content.trim(),
            rating:rating||5,
        })

        const full=await Testimonial.findByPk(testimonial.id,{
            include:[{model:User,attributes:['id','name','role','avatar_url']}],
        })

        return res.status(201).json({testimonial:full})
    }catch(err){
        console.error('Create testimonial error:',err)
        return res.status(500).json({error:'Failed to create testimonial'})
    }
}

exports.getAll=async(req,res)=>{
    try{
        const testimonials=await Testimonial.findAll({
            where:{approved:true},
            include:[{model:User,attributes:['id','name','role','avatar_url']}],
            order:[['createdAt','DESC']],
            limit:12,
        })
        return res.status(200).json({testimonials})
    }catch(err){
        console.error('Get testimonials error:',err)
        return res.status(500).json({error:'Failed to fetch testimonials'})
    }
}

exports.remove=async(req,res)=>{
    try{
        const id=req.params.id
        const testimonial=await Testimonial.findByPk(id)
        if(!testimonial) return res.status(404).json({error:'Testimonial not found'})
        if(testimonial.user_id!==req.user.id) return res.status(403).json({error:'You can only delete your own testimonial'})
        await testimonial.destroy()
        return res.status(200).json({msg:'Testimonial deleted successfully'})
    }catch(err){
        console.error('Delete testimonial error:',err)
        return res.status(500).json({error:'Failed to delete testimonial'})
    }
}
