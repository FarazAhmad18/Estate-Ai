const express=require('express')
const router=express.Router()
const {auth}=require('../middlewares/authMiddleware')
const {getAgentProfile,getAgentProperties,getAgentReviews,createReview,deleteReview}=require('../controllers/agentController')

router.get('/agents/:id',getAgentProfile)
router.get('/agents/:id/properties',getAgentProperties)
router.get('/agents/:id/reviews',getAgentReviews)
router.post('/agents/:id/reviews',auth,createReview)
router.delete('/agents/reviews/:reviewId',auth,deleteReview)

module.exports=router
