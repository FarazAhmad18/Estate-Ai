const {Op}=require('sequelize')
const sequelize=require('../config/db')
const {User,Property,Testimonial,Visitor,PropertyImage}=require('../models')
const {sanitizeSearch,parsePositiveInt,isValidId}=require('../utils/sanitize')

const VALID_ROLES=['Agent','Buyer','Admin']

// GET /api/admin/stats
async function getStats(req,res){
    try{
        const now=new Date()
        const todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate())
        const weekAgo=new Date(todayStart)
        weekAgo.setDate(weekAgo.getDate()-7)
        const twoWeeksAgo=new Date(todayStart)
        twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14)

        const [totalUsers,totalProperties,totalTestimonials,visitorsToday,visitorsThisWeek,newUsersThisWeek,prevWeekVisitors,prevWeekNewUsers,deletedAccountsThisWeek,prevWeekDeletedAccounts,soldProperties,rentedProperties]=await Promise.all([
            User.count(),
            Property.count(),
            Testimonial.count(),
            Visitor.count({where:{createdAt:{[Op.gte]:todayStart}}}),
            Visitor.count({where:{createdAt:{[Op.gte]:weekAgo}}}),
            User.count({where:{createdAt:{[Op.gte]:weekAgo}}}),
            Visitor.count({where:{createdAt:{[Op.gte]:twoWeeksAgo,[Op.lt]:weekAgo}}}),
            User.count({where:{createdAt:{[Op.gte]:twoWeeksAgo,[Op.lt]:weekAgo}}}),
            User.count({where:{deletedAt:{[Op.gte]:weekAgo}},paranoid:false}),
            User.count({where:{deletedAt:{[Op.gte]:twoWeeksAgo,[Op.lt]:weekAgo}},paranoid:false}),
            Property.count({where:{status:'Sold'}}),
            Property.count({where:{status:'Rented'}}),
        ])

        const totalDeletedAccounts=await User.count({where:{deletedAt:{[Op.ne]:null}},paranoid:false})

        res.json({totalUsers,totalProperties,totalTestimonials,visitorsToday,visitorsThisWeek,newUsersThisWeek,prevWeekVisitors,prevWeekNewUsers,deletedAccountsThisWeek,prevWeekDeletedAccounts,totalDeletedAccounts,soldProperties,rentedProperties})
    }catch(err){
        console.error('Admin getStats error:',err)
        res.status(500).json({error:'Failed to fetch stats'})
    }
}

// GET /api/admin/trends
async function getTrends(req,res){
    try{
        const thirtyDaysAgo=new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30)

        const [usersPerDay,propertiesPerDay,visitorsPerDay,deletedAccountsPerDay]=await Promise.all([
            User.findAll({
                attributes:[
                    [sequelize.fn('DATE',sequelize.col('createdAt')),'date'],
                    [sequelize.fn('COUNT','*'),'count'],
                ],
                where:{createdAt:{[Op.gte]:thirtyDaysAgo}},
                group:[sequelize.fn('DATE',sequelize.col('createdAt'))],
                order:[[sequelize.fn('DATE',sequelize.col('createdAt')),'ASC']],
                raw:true,
            }),
            Property.findAll({
                attributes:[
                    [sequelize.fn('DATE',sequelize.col('createdAt')),'date'],
                    [sequelize.fn('COUNT','*'),'count'],
                ],
                where:{createdAt:{[Op.gte]:thirtyDaysAgo}},
                group:[sequelize.fn('DATE',sequelize.col('createdAt'))],
                order:[[sequelize.fn('DATE',sequelize.col('createdAt')),'ASC']],
                raw:true,
            }),
            Visitor.findAll({
                attributes:[
                    [sequelize.fn('DATE',sequelize.col('createdAt')),'date'],
                    [sequelize.fn('COUNT','*'),'count'],
                ],
                where:{createdAt:{[Op.gte]:thirtyDaysAgo}},
                group:[sequelize.fn('DATE',sequelize.col('createdAt'))],
                order:[[sequelize.fn('DATE',sequelize.col('createdAt')),'ASC']],
                raw:true,
            }),
            User.findAll({
                attributes:[
                    [sequelize.fn('DATE',sequelize.col('deletedAt')),'date'],
                    [sequelize.fn('COUNT','*'),'count'],
                ],
                where:{deletedAt:{[Op.gte]:thirtyDaysAgo}},
                group:[sequelize.fn('DATE',sequelize.col('deletedAt'))],
                order:[[sequelize.fn('DATE',sequelize.col('deletedAt')),'ASC']],
                paranoid:false,
                raw:true,
            }),
        ])

        res.json({usersPerDay,propertiesPerDay,visitorsPerDay,deletedAccountsPerDay})
    }catch(err){
        console.error('Admin getTrends error:',err)
        res.status(500).json({error:'Failed to fetch trends'})
    }
}

// GET /api/admin/users?search=&role=&includeDeleted=
async function getUsers(req,res){
    try{
        const search=sanitizeSearch(req.query.search)
        const {role,includeDeleted}=req.query
        const where={}

        if(search){
            where[Op.or]=[
                {name:{[Op.iLike]:`%${search}%`}},
                {email:{[Op.iLike]:`%${search}%`}},
            ]
        }
        if(role&&VALID_ROLES.includes(role)){
            where.role=role
        }

        const paranoid=includeDeleted!=='true'

        const users=await User.findAll({
            where,
            attributes:{exclude:['password']},
            order:[['createdAt','DESC']],
            paranoid,
        })
        res.json(users)
    }catch(err){
        console.error('Admin getUsers error:',err)
        res.status(500).json({error:'Failed to fetch users'})
    }
}

// DELETE /api/admin/users/:id
async function deleteUser(req,res){
    try{
        const {id}=req.params
        if(!isValidId(id)) return res.status(400).json({error:'Invalid user ID'})
        if(parseInt(id)===req.user.id){
            return res.status(400).json({error:'Cannot delete yourself'})
        }
        const user=await User.findByPk(id,{paranoid:false})
        if(!user) return res.status(404).json({error:'User not found'})
        if(user.role==='Admin') return res.status(400).json({error:'Cannot delete admin users'})
        await user.destroy({force:true})
        res.json({message:'User deleted'})
    }catch(err){
        console.error('Admin deleteUser error:',err)
        res.status(500).json({error:'Failed to delete user'})
    }
}

// PATCH /api/admin/users/:id/role
async function updateUserRole(req,res){
    try{
        const {id}=req.params
        if(!isValidId(id)) return res.status(400).json({error:'Invalid user ID'})
        if(parseInt(id)===req.user.id) return res.status(400).json({error:'Cannot change your own role'})

        const {role}=req.body
        if(!role||!VALID_ROLES.includes(role)) return res.status(400).json({error:`Role must be one of: ${VALID_ROLES.join(', ')}`})

        const user=await User.findByPk(id)
        if(!user) return res.status(404).json({error:'User not found'})

        user.role=role
        await user.save()

        const {password,...userData}=user.toJSON()
        res.json(userData)
    }catch(err){
        console.error('Admin updateUserRole error:',err)
        res.status(500).json({error:'Failed to update user role'})
    }
}

// GET /api/admin/properties?search=&page=&limit=&type=&status=
async function getProperties(req,res){
    try{
        const search=sanitizeSearch(req.query.search)
        const page=parsePositiveInt(req.query.page,1,1000)
        const limit=parsePositiveInt(req.query.limit,20,100)
        const offset=(page-1)*limit
        const where={}

        if(search) where.location={[Op.iLike]:`%${search}%`}
        if(req.query.type) where.type=req.query.type
        if(req.query.status) where.status=req.query.status

        const {count,rows}=await Property.findAndCountAll({
            where,
            include:[
                {model:User,attributes:['id','name','email','avatar_url']},
                {model:PropertyImage,limit:1,order:[['is_primary','DESC'],['id','ASC']]},
            ],
            order:[['createdAt','DESC']],
            limit,
            offset,
        })

        res.json({
            properties:rows,
            total:count,
            page,
            totalPages:Math.ceil(count/limit),
        })
    }catch(err){
        console.error('Admin getProperties error:',err)
        res.status(500).json({error:'Failed to fetch properties'})
    }
}

// DELETE /api/admin/properties/:id
async function deleteProperty(req,res){
    try{
        const {id}=req.params
        if(!isValidId(id)) return res.status(400).json({error:'Invalid property ID'})
        const property=await Property.findByPk(id)
        if(!property) return res.status(404).json({error:'Property not found'})
        await property.destroy()
        res.json({message:'Property deleted'})
    }catch(err){
        console.error('Admin deleteProperty error:',err)
        res.status(500).json({error:'Failed to delete property'})
    }
}

// GET /api/admin/testimonials
async function getTestimonials(req,res){
    try{
        const testimonials=await Testimonial.findAll({
            include:[{model:User,attributes:['id','name','email','avatar_url']}],
            order:[['createdAt','DESC']],
        })
        res.json(testimonials)
    }catch(err){
        console.error('Admin getTestimonials error:',err)
        res.status(500).json({error:'Failed to fetch testimonials'})
    }
}

// DELETE /api/admin/testimonials/:id
async function deleteTestimonial(req,res){
    try{
        const {id}=req.params
        if(!isValidId(id)) return res.status(400).json({error:'Invalid testimonial ID'})
        const testimonial=await Testimonial.findByPk(id)
        if(!testimonial) return res.status(404).json({error:'Testimonial not found'})
        await testimonial.destroy()
        res.json({message:'Testimonial deleted'})
    }catch(err){
        console.error('Admin deleteTestimonial error:',err)
        res.status(500).json({error:'Failed to delete testimonial'})
    }
}

// PATCH /api/admin/testimonials/:id/approve
async function approveTestimonial(req,res){
    try{
        const {id}=req.params
        if(!isValidId(id)) return res.status(400).json({error:'Invalid testimonial ID'})
        const testimonial=await Testimonial.findByPk(id)
        if(!testimonial) return res.status(404).json({error:'Testimonial not found'})
        testimonial.approved=true
        await testimonial.save()
        res.json({message:'Testimonial approved'})
    }catch(err){
        console.error('Admin approveTestimonial error:',err)
        res.status(500).json({error:'Failed to approve testimonial'})
    }
}

// PATCH /api/admin/testimonials/:id/reject
async function rejectTestimonial(req,res){
    try{
        const {id}=req.params
        if(!isValidId(id)) return res.status(400).json({error:'Invalid testimonial ID'})
        const testimonial=await Testimonial.findByPk(id)
        if(!testimonial) return res.status(404).json({error:'Testimonial not found'})
        testimonial.approved=false
        await testimonial.save()
        res.json({message:'Testimonial rejected'})
    }catch(err){
        console.error('Admin rejectTestimonial error:',err)
        res.status(500).json({error:'Failed to reject testimonial'})
    }
}

// GET /api/admin/visitors?page=&limit=
async function getVisitors(req,res){
    try{
        const page=parsePositiveInt(req.query.page,1,1000)
        const limit=parsePositiveInt(req.query.limit,50,100)
        const offset=(page-1)*limit
        const weekAgo=new Date()
        weekAgo.setDate(weekAgo.getDate()-7)

        const {count,rows}=await Visitor.findAndCountAll({
            where:{createdAt:{[Op.gte]:weekAgo}},
            include:[{model:User,attributes:['id','name','email'],required:false}],
            order:[['createdAt','DESC']],
            limit,
            offset,
        })

        res.json({
            visitors:rows,
            total:count,
            page,
            totalPages:Math.ceil(count/limit),
        })
    }catch(err){
        console.error('Admin getVisitors error:',err)
        res.status(500).json({error:'Failed to fetch visitors'})
    }
}

module.exports={getStats,getUsers,deleteUser,updateUserRole,getProperties,deleteProperty,getTestimonials,deleteTestimonial,approveTestimonial,rejectTestimonial,getVisitors,getTrends}
