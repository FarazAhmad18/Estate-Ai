const {DataTypes}=require('sequelize')
const sequelize=require('../config/db')

const User= sequelize.define('User',{
    id:{
        type:DataTypes.INTEGER,
autoIncrement:true,
        primaryKey:true
    },
    name:{
type:DataTypes.STRING,
allowNull:false,
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,    
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    role:{
     type:DataTypes.ENUM('Agent','Buyer','Admin'),
     allowNull:false,
     defaultValue:'Buyer',
    },
    phone:{
        type:DataTypes.STRING,
        allowNull:true,
    },
    avatar_url:{
        type:DataTypes.STRING,
        allowNull:true,
    },
    resetToken:{
        type:DataTypes.STRING,
        allowNull:true,
    },
    resetTokenExpiry:{
        type:DataTypes.DATE,
        allowNull:true,
    },
    otpCode:{
        type:DataTypes.STRING,
        allowNull:true,
    },
    otpExpiry:{
        type:DataTypes.DATE,
        allowNull:true,
    },

},{
    tableName:'users',
    timestamps:true,
    paranoid:true,
})

module.exports=User;