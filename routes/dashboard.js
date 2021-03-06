const express = require("express");
const router = express.Router();

//custom imports
const User = require("../models/User");
const Post = require("../models/Post");
const verify = require("../middleware/verify");


//get user profile 
router.get("/user/:username", verify, async (req, res) => {
  try {
    const current_user = await User.findById(req.user.id).select(
      "-password -__v"
    );

    if (!current_user)
      return res.send({ status: 401, error: "Unauthorized request." });

    const requestedUser = await User.findOne({
      username: req.params.username
    }).select("-password -__v");
    if (!requestedUser)
      return res.send({ status: 404, error: "user not found" });

      // console.log(current_user._id)
      // console.log(requestedUser._id)


    if (current_user._id.toString() === requestedUser._id.toString()) {
      console.log("your profile");
    } else {
      console.log("public data only")
    }

    res.send(requestedUser);
  } catch (error) {
    res.status(500).send({ error: "Oops! Something went wrong." });
  }
});

//get 15 initial posts
router.get("/profile/posts", verify, async (req, res) => {
  try {
    const current_user = await User.findById(req.user.id).select(
      "-password -__v -email"
    );

    if (!current_user)
      return res.status(401).send({ error: "Unauthorized request." });

    const userPosts = await Post.aggregate([
      { $match: { user: current_user._id } },
      { $sort: { date: -1 } },
      {
        $facet: {
          posts: [
            { $limit: 10 },
            { $project: { _id: 1, title: 1, content: 1 } }
          ]
        }
      }
    ]);

    if (!userPosts) return res.status(206).send({data: {user: current_user}});

    res.send({ data: [{ user: current_user }, ...userPosts] });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't get posts." });
  }
});

//paginated posts after the initial request with an offset query
router.get('/profile/posts', verify, async (req, res) => {
  const current_user = await User.findById(req.user.id).select("-password -__v -email");
  if (!current_user) return res.send({status: 404, error: "User not found."});

  try {

    if (!req.query.offset)
      return res
        .status(206)
        .send([
          { user: current_user },
          { error: "Couldn't fetch more posts at this time." }
        ]);

    const userPosts = await Post.aggregate([
      { $match: { user: current_user._id } },
      { $sort: { date: -1 } },
      {
        $facet: {
          posts: [
            { $skip: parseInt(req.query.offset) },
            { $limit: 3 },
            { $project: { _id: 1, title: 1, content: 1 } }
          ]
        }
      }
    ]);

    res.send([...userPosts]);       
  } catch (error) {
    res.status(500).send({error: "Could not fetch posts at this time."})
  }

});

//paginated comments
router.get("/posts/:id/comments", verify, async (req, res) => {
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

module.exports = router;