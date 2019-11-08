const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    posts: {
        type: Number,
        default: 0
    }
})

module.exports = Tag = mongoose.model('Tag', TagSchema);