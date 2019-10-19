const mongoose = require('mongoose');

const userTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    token: {
        type: String
    }
})

module.exports = UserToken = mongoose.model('usertoken', userTokenSchema)