const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    url: {
        type: String,
        default: null
    },
    key: {
        type: String,
        default: null
    }
})

module.exports = Media = mongoose.model("media", mediaSchema)