const express=require('express')
const router=express.Router()
const {auth}=require('../middlewares/authMiddleware')
const {requireRole}=require('../middlewares/roleMiddleware')
const {getStats,getUsers,deleteUser,updateUserRole,getProperties,deleteProperty,getTestimonials,deleteTestimonial,approveTestimonial,rejectTestimonial,getVisitors,getTrends}=require('../controllers/adminController')

router.use(auth,requireRole('Admin'))

router.get('/stats',getStats)
router.get('/trends',getTrends)
router.get('/users',getUsers)
router.delete('/users/:id',deleteUser)
router.patch('/users/:id/role',updateUserRole)
router.get('/properties',getProperties)
router.delete('/properties/:id',deleteProperty)
router.get('/testimonials',getTestimonials)
router.delete('/testimonials/:id',deleteTestimonial)
router.patch('/testimonials/:id/approve',approveTestimonial)
router.patch('/testimonials/:id/reject',rejectTestimonial)
router.get('/visitors',getVisitors)

module.exports=router
