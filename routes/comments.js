const express = require("express");
const router = express.Router();

//custom imports
const verify = require("../middleware/verify");
const User = require("../models/User");
const Post = require("../models/Post");
const Like = require("../models/Like");
const Comment = require("../models/Comment");

//create a comment
router.post('/posts/:id/comments', verify, async (req, res) => {
    if (!req.params.id) return res.status(400).send({error: "Invalid parameters."});

    try {
        // console.log(new_comment);
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send({ error: "Not found." });

        const new_comment = new Comment({
            content: req.body.content,
            user: req.user.id,
            post: req.params.id
        });

        post.comments.unshift(new_comment);
        await new_comment.save();
        await post.save();

        res.status(201).send(post);

    } catch (error) {
        // console.log(new_comment);
        res.status(500).send({error: "Something went wrong."});
    }
});

router.get("/post/:id/comments", verify, async (req, res) => {
  if (!req.params.id)
    return res.status(400).send({ error: "Invalid parameters." });

  const post = await Post.findById(req.params.id).select("-comments -__v");
  if (!post) return res.status(404).send({ error: "Content not found." });

  try {

    const postComments = await Comment.aggregate([
        { $match: { post: post._id } },
        { $sort: { date: -1 } },
        {
        $facet: {
            comments: [
            { $skip: parseInt(req.query.offset) },
            { $limit: 2 },
            { $project: { _id: 1, content: 1, user: 1, replies: 1 } }
            ]
        }
        }
    ]);

    res.status(200).send(...postComments);

  } catch (error) {
    res.status(500).send({ error: "Internal server error." });
  }
});

//delete comment if it belongs to req.user
router.patch('/posts/:postId/comments/:commentId', verify, async (req, res) => {
    if (!req.params.postId) return res.status(400).send({ error: "Invalid parameters." });
    if (!req.params.commentId) return res.status(400).send({ error: "Invalid parameters." });

    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).send({ error: "Post not found." });

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).send({error: "Not Found"})

        if (comment.user.toString() === req.user.id) {
            const postIndex = post.comments
            .map(comment => comment.user)
            .indexOf(req.user.id);
            
            await Comment.findByIdAndDelete(comment.id)
            post.comments.splice(postIndex, 1);
            await post.save();

            res.status(202).send(post)
        } else {
            res.status(401).send({error: "Unauthorized request."})
        }

    } catch (error) {
        res.status(500).send({error: "Internal Server Error."})
    }

   
});

module.exports = router;