const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'conversations', key: 'id' },
    onDelete: 'CASCADE',
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['conversation_id', 'createdAt'], name: 'idx_conv_created' },
  ],
});

module.exports = Message;
