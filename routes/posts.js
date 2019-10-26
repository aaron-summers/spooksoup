const express = require('express');
const router = express.Router();
const validator = require('validator');

//custom imports
const verify = require('../middleware/verify');

//models
const User = require('../models/User');
const Post = require('../models/Post');
const Like = require('../models/Like');
const Tag = require('../models/Tag');

const trimValues = (vals) => {
    return vals.toLowerCase().trim().replace(/[^\w]/gi, '')
}

//create a post
router.post('/posts', verify, async (req, res) => {
    const doesTitleExist = validator.isEmpty(req.body.title);
    // console.log(doesTitleExist)

    if(doesTitleExist) return res.status(400).send({error: "Title is required."});

    const user = await User.findById(req.user.id).select('-password');

    if (!user) return res.status(401).send({error: "Unauthorized request."}) 

    const new_post = new Post({
        title: req.body.title,
        content: req.body.content,
        user: req.user.id,
        username: user.username,
        likes: 0
    })

    try {
        if (req.body.tags && req.body.tags.length <= 25) {
          let postTags = [];
          postTags.push(...req.body.tags);

          postTags = postTags.filter(tag => /\S/.test(tag));

        //   console.log(postTags)

          for (let i = 0; i < postTags.length; i++) {

            const trimmedTags = trimValues(postTags[i]);

            // console.log(trimmedTags)

            const tags = await Tag.find({
              name: { $eq: postTags[i].toLowerCase().trim().replace(/[^\w]/gi, '') }
            });

            console.log(tags)

            if (!tags.length) {
                console.log("creating")
                const newTag = new Tag;
                newTag.name = trimmedTags
                await newTag.save(); 
            }
            
            new_post.tags.push(trimmedTags);
          }
        }
        const post = new_post;
        await post.save();
        //the following two lines will probably not be scalable
        // user.posts.push(post._id);
        // await user.save();
        res.status(201).send(post);

    } catch (error) {
        console.log(error)
        res.status(500).send({error: error})
    }
})

//get all posts
router.get('/posts', verify, async (req, res) => {
    try {
        const posts = await Post.find({}).sort({date: -1})
        res.send(posts)
    } catch (error) {
        res.status(500).send({error: "Oops! Something went wrong."})
    }
});

//get post by ID
router.get(`/posts/:id`, verify, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select('-__v');

        if (!post) return res.status(404).send({error: "Post not found."});

        res.status(200).send(post);

    } catch (error) {

        if (error.kind === 'ObjectId') return res.status(404).send({error: "Oops! Something went wrong. Couldn't fetch requested content."})

        res.status(500).send({error: "Internal Server Error."})
    }
});

//delete post by ID
router.delete('/posts/:id', verify, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).send({error: "Post not found."});
        if (req.user.id !== post.user.toString()) return res.status(401).send({error: "Unauthorized delete request."});

        await post.remove();

        res.status(200).send({confirmation: "Post Removed."});

    } catch (error) {

        if (error.kind === 'ObjectId') return res.status(404).send({error: "Invalid path."});

        res.status(500).send({error: "Internal Server Error."})
    }
});

//create or remove like and update post likes
router.patch("/posts/:id/like", verify, async (req, res) => {
    if (!req.params.id) return res.status(400).send({ error: "Invalid parameters." });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found." });

    try {
        const isLiked = await Like.findOne({$and: [{user: req.user.id}, {post: req.params.id}]})

        if (!isLiked) {
            const like = new Like({
                user: req.user.id,
                post: post.id
            });

            await like.save();
            post.likes++;
            await post.save();
            res.status(201).send(post);

        } else {
            await Like.findByIdAndDelete(isLiked.id);
            post.likes--;
            await post.save();

            res.send(post);
        }

    } catch (error) {
        res.status(500).send({error: "Internal Server Error."})
    }

});

module.exports = router;
