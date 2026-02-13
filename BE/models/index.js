const User=require('./User')
const Property= require('./Property')
const AiAnalysis=require('./AiAnalysis')
const PropertyImage=require('./PropertyImage')
const Favorite=require('./Favorite')
const Testimonial=require('./Testimonial')
const Visitor=require('./Visitor')
const AgentReview=require('./AgentReview')
const Conversation=require('./Conversation')
const Message=require('./Message')

User.hasMany(Property,{foreignKey:'agent_id',onDelete:'CASCADE'});
Property.belongsTo(User,{foreignKey:'agent_id'})

Property.hasOne(AiAnalysis,{foreignKey:'property_id',onDelete:'CASCADE'})
AiAnalysis.belongsTo(Property,{foreignKey:'property_id'})

Property.hasMany(PropertyImage,{foreignKey:'property_id',onDelete:'CASCADE'})
PropertyImage.belongsTo(Property,{foreignKey:'property_id'})

User.belongsToMany(Property,{through:Favorite,foreignKey:'user_id',as:'SavedProperties'})
Property.belongsToMany(User,{through:Favorite,foreignKey:'property_id',as:'SavedByUsers'})
User.hasMany(Favorite,{foreignKey:'user_id',onDelete:'CASCADE'})
Favorite.belongsTo(User,{foreignKey:'user_id'})
Property.hasMany(Favorite,{foreignKey:'property_id',onDelete:'CASCADE'})
Favorite.belongsTo(Property,{foreignKey:'property_id'})

User.hasMany(Testimonial,{foreignKey:'user_id',onDelete:'CASCADE'})
Testimonial.belongsTo(User,{foreignKey:'user_id'})

User.hasMany(Visitor,{foreignKey:'user_id',onDelete:'SET NULL'})
Visitor.belongsTo(User,{foreignKey:'user_id'})

User.hasMany(AgentReview,{foreignKey:'agent_id',as:'ReceivedReviews',onDelete:'CASCADE'})
User.hasMany(AgentReview,{foreignKey:'reviewer_id',as:'GivenReviews',onDelete:'CASCADE'})
AgentReview.belongsTo(User,{foreignKey:'agent_id',as:'Agent'})
AgentReview.belongsTo(User,{foreignKey:'reviewer_id',as:'Reviewer'})

// Conversation associations
User.hasMany(Conversation,{foreignKey:'buyer_id',as:'BuyerConversations',onDelete:'CASCADE'})
User.hasMany(Conversation,{foreignKey:'agent_id',as:'AgentConversations',onDelete:'CASCADE'})
Conversation.belongsTo(User,{foreignKey:'buyer_id',as:'Buyer'})
Conversation.belongsTo(User,{foreignKey:'agent_id',as:'Agent'})
Property.hasMany(Conversation,{foreignKey:'property_id',onDelete:'CASCADE'})
Conversation.belongsTo(Property,{foreignKey:'property_id'})

// Message associations
Conversation.hasMany(Message,{foreignKey:'conversation_id',onDelete:'CASCADE'})
Message.belongsTo(Conversation,{foreignKey:'conversation_id'})
Message.belongsTo(User,{foreignKey:'sender_id',as:'Sender'})

module.exports={User,Property,AiAnalysis,PropertyImage,Favorite,Testimonial,Visitor,AgentReview,Conversation,Message};
