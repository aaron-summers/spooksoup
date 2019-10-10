const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 2
    },
    displayName: {
        type: String,
        min: 2,
        max: 255
    },
    email: {
        type: String, 
        required: true,
        max: 254,
        min: 6
    },
    password: {
        type: String, 
        required: true,
        min: 6
    },
    avatar: {
        type: String
    },
    forename: {
        type: String,
        default: null,
        min: 2,
        max: 255
    },
    surname: {
        type: String,
        default: null,
        min: 2,
        max: 255
    },
    contacts: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'user'
        }
    }],
    created: {
        type: Date, 
        default: Date.now()
    },
    updated: {
        type: Date, 
        default: Date.now()
    }
})

module.exports = User = mongoose.model('user', userSchema);