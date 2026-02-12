const {DataTypes}=require('sequelize')
const sequelize=require('../config/db')

const AgentReview=sequelize.define('AgentReview',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true,
    },
    agent_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:'users',
            key:'id',
        },
        onDelete:'CASCADE',
    },
    reviewer_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:'users',
            key:'id',
        },
        onDelete:'CASCADE',
    },
    rating:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:5,
        validate:{
            min:1,
            max:5,
        },
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:false,
    },
},{
    tableName:'agent_reviews',
    timestamps:true,
    indexes:[
        {unique:true,fields:['agent_id','reviewer_id'],name:'idx_agent_reviewer_unique'},
    ],
})

module.exports=AgentReview
