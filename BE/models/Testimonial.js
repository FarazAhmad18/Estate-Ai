const {DataTypes}=require('sequelize')
const sequelize=require('../config/db')

const Testimonial=sequelize.define('Testimonial',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true,
    },
    user_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        unique:true,
        references:{
            model:'users',
            key:'id',
        },
        onDelete:'CASCADE',
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:false,
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
    approved:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:true,
    },
},{
    tableName:'testimonials',
    timestamps:true,
    indexes:[
        {unique:true,fields:['user_id'],name:'idx_testimonial_user_unique'},
    ],
})

module.exports=Testimonial
