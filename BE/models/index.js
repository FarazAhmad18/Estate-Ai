const User=require('./user')
const Property= require('./Property')
const AiAnalysis=require('./AiAnalysis')
const PropertyImage=require('./PropertyImage')
const Favorite=require('./Favorite')
const Testimonial=require('./Testimonial')
const Visitor=require('./Visitor')
const AgentReview=require('./AgentReview')

User.hasMany(Property,{foreignKey:'agent_id'});
Property.belongsTo(User,{foreignKey:'agent_id'})

Property.hasOne(AiAnalysis,{foreignKey:'property_id'})
AiAnalysis.belongsTo(Property,{foreignKey:'property_id'})

Property.hasMany(PropertyImage,{foreignKey:'property_id'})
PropertyImage.belongsTo(Property,{foreignKey:'property_id'})

User.belongsToMany(Property,{through:Favorite,foreignKey:'user_id',as:'SavedProperties'})
Property.belongsToMany(User,{through:Favorite,foreignKey:'property_id',as:'SavedByUsers'})
User.hasMany(Favorite,{foreignKey:'user_id'})
Favorite.belongsTo(User,{foreignKey:'user_id'})
Property.hasMany(Favorite,{foreignKey:'property_id'})
Favorite.belongsTo(Property,{foreignKey:'property_id'})

User.hasMany(Testimonial,{foreignKey:'user_id'})
Testimonial.belongsTo(User,{foreignKey:'user_id'})

User.hasMany(Visitor,{foreignKey:'user_id'})
Visitor.belongsTo(User,{foreignKey:'user_id'})

User.hasMany(AgentReview,{foreignKey:'agent_id',as:'ReceivedReviews'})
User.hasMany(AgentReview,{foreignKey:'reviewer_id',as:'GivenReviews'})
AgentReview.belongsTo(User,{foreignKey:'agent_id',as:'Agent'})
AgentReview.belongsTo(User,{foreignKey:'reviewer_id',as:'Reviewer'})

module.exports={User,Property,AiAnalysis,PropertyImage,Favorite,Testimonial,Visitor,AgentReview};


