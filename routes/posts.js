const express = require("express");
const router = express.Router();
const validator = require("validator");
const fs = require("fs");
const multer = require("multer");
const uuid = require("uuid/v4");

//methods
const { trimValues } = require("../functions/validation");
const verify = require("../middleware/verify");
const { aws } = require("../middleware/awsauth");
const s3 = new aws.S3();

//models
const User = require("../models/User");
const Post = require("../models/Post");
const Like = require("../models/Like");
const Tag = require("../models/Tag");
const Media = require("../models/Media");

// const trimValues = (vals) => {
//     return vals.toLowerCase().trim().replace(/[^\w]/gi, '')
// }
//avatar image upload multer middleware max 5MB
let upload = multer({
  dest: "temp/",
  limits: { files: 1, fieldSize: 5 * (1024 * 1024) }
});

//create a post
router.post("/posts", verify, upload.single("post"), async (req, res) => {
  // const doesTitleExist = validator.isEmpty(req.body.title);
  // console.log(doesTitleExist)

  // if(doesTitleExist) return res.status(400).send({error: "Title is required."});

  const user = await User.findById(req.user.id).select("-password");

  if (!user) return res.status(401).send({ error: "Unauthorized request." });

  const new_post = new Post();
  if (req.body.title) new_post.title = req.body.title;
  new_post.content = req.body.content;
  new_post.user = req.user.id;
  new_post.username = user.username;
  if (req.body.story === true) new_post.story = true;
  if (req.body.journal === true) new_post.journal = true;
  new_post.likes = 0;  


  try {

    if (req.body.tags && req.body.tags.length <= 25) {
      let postTags = [];
      postTags.push(...req.body.tags);

      postTags = postTags.filter(tag => /\S/.test(tag));

      for (let i = 0; i < postTags.length; i++) {
        const trimmedTags = postTags[i]
          .toLowerCase()
          .trim()
          .replace(/[^\w]/g, "");

        const tags = await Tag.find({
          name: {
            $eq: postTags[i]
              .toLowerCase()
              .trim()
              .replace(/[^\w]/gi, "")
          }
        });

        //maybe store how many posts are associated with a tag?
        // if (tags.length) {
        //     console.log(tags)
        // }

        if (!tags.length) {
          const newTag = new Tag();
          newTag.name = trimmedTags;
          await newTag.save();
        }

        new_post.tags.push(trimmedTags);
      }
    }

    if (req.file) {
    const randUid = uuid();
    let params = {
        ACL: "public-read",
        Bucket: process.env.BUCKET_NAME,
        Body: fs.createReadStream(req.file.path),
        ContentType: req.file.mimetype,
        ServerSideEncryption: "AES256",
        Key: `${user._id}/posts/${randUid}-${req.file.originalname}`
    };

    //upload image
    s3.upload(params, async (err, data) => {
        if (err) res.send({ error: "Oops! Couldn't upload file. Please try again." });
        // console.log(data);
        const location = data.Location;
        new_post.media = location;
        // console.log(new_post)
        await new_post.save();

        //add to media collections
        const media = new Media({
        user: user._id,
        url: data.Location,
        key: data.key
        });
        media.save();

        //delete from temp folder on host
        const path = req.file.path;
        // console.log(path)
        fs.unlinkSync(path);        

        res.status(201).send(new_post);
    });
    }

  } catch (error) {
    // console.log(error);
    res.status(500).send({ error: error });
  }
});

//get all posts
router.get("/posts", verify, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ date: -1 });
    res.send(posts);
  } catch (error) {
    res.status(500).send({ error: "Oops! Something went wrong." });
  }
});

//get post by ID
router.get(`/posts/:id`, verify, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select("-__v");

    if (!post) return res.status(404).send({ error: "Post not found." });

    res.status(200).send(post);
  } catch (error) {
    if (error.kind === "ObjectId")
      return res
        .status(404)
        .send({
          error: "Oops! Something went wrong. Couldn't fetch requested content."
        });

    res.status(500).send({ error: "Internal Server Error." });
  }
});

//delete post by ID
router.delete("/posts/:id", verify, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send({ error: "Post not found." });
    if (req.user.id !== post.user.toString())
      return res.status(401).send({ error: "Unauthorized delete request." });

    await post.remove();

    res.status(200).send({ confirmation: "Post Removed." });
  } catch (error) {
    if (error.kind === "ObjectId")
      return res.status(404).send({ error: "Invalid path." });

    res.status(500).send({ error: "Internal Server Error." });
  }
});

//create or remove like and update post likes
router.patch("/posts/:id/like", verify, async (req, res) => {
  if (!req.params.id)
    return res.status(400).send({ error: "Invalid parameters." });

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send({ error: "Post not found." });

  try {
    const isLiked = await Like.findOne({
      $and: [{ user: req.user.id }, { post: req.params.id }]
    });

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
    res.status(500).send({ error: "Internal Server Error." });
  }
});

router.get("/tags", verify, async (req, res) => {
  // const
});

module.exports = router;
