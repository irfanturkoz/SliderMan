const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    name: {  
        type: String,
        required: true,
        unique: true
    },
    images: [{
        type: { 
            type: String,
            enum: ['url', 'file', 'local'],
            required: true
        },
        url: String,
        filename: String,
        originalname: String,
        order: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    videos: [{
        type: { 
            type: String,
            enum: ['url', 'file', 'local'],
            required: true
        },
        url: String,
        filename: String,
        originalname: String,
        order: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Page', pageSchema);