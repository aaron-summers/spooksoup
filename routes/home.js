const express = require("express");
const router = express.Router();

//models
const Post = require('../models/Post');
const User = require('../models/User');

//methods
const verify = require('../middleware/verify');

//get 10 most popular posts
router.get('/recommended', verify, async (req, res) => {
    try {
        const posts = await Post.aggregate([
          { $sort: { likes: -1, date: -1 } },
          { $limit: 10 },
          { $project: { _id: 1, title: 1, content: 1, likes: 1, tags: 1, media: 1, user: 1, userAvatar: 1 } }
        ]);

        // console.log(posts)
        
        res.status(200).send({posts: posts})
    } catch {
        res.status(500).send({error: "Something went wrong. Couldn't fetch requested content."})
    }
});

module.exports = router;