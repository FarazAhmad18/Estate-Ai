const express=require('express')
const router=express.Router()
const{getproperty,createProperty,updateProperty,deleteProperty,search,getAgentStats,getLocationSuggestions}=require('../controllers/propertyController')
const {auth}=require('../middlewares/authMiddleware')
const{requireRole}=require('../middlewares/roleMiddleware')
//public routes
router.get('/properties/suggestions',getLocationSuggestions)
router.get('/properties',search)
router.get('/properties/:id',getproperty)
router.get('/search',search)
//private
router.get('/agent/stats',auth,requireRole('Agent'),getAgentStats)
router.post('/properties',auth,requireRole('Agent'),createProperty)
router.put('/properties/:id',auth,requireRole('Agent'),updateProperty)
router.delete('/properties/:id',auth,requireRole('Agent'),deleteProperty)

module.exports=router
