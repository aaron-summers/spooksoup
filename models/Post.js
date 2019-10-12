const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    min: 2
  },
  content: {
      type: String,
      required: true,
      min: 1
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
  },
  username: {
    type: String
  },
  likes: {
    type: Number,
    default: 0
  },
  date: {
    type: Date, 
    default: Date.now()
  }
});

module.exports = Post = mongoose.model("post", postSchema);