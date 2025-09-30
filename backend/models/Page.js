const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Page = sequelize.define('Page', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('images');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('images', JSON.stringify(value || []));
        }
    },
    videos: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('videos');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('videos', JSON.stringify(value || []));
        }
    }
});

module.exports = Page;