const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const multer = require('multer');
const uuid = require('uuid/v4');

//custom imports
const User = require("../models/User");
const UserToken = require('../models/UserToken');
const Media = require("../models/Media");
const Post = require("../models/Post")

//custom methods
const verify = require('../middleware/verify');
const { signupValidation, trimValues, trimWithCasing } = require("../functions/validation");
const {fileName} = require("../functions/files")
const {aws} = require("../middleware/awsauth");
const s3 = new aws.S3();

//check for existing username
const checkUsername = reqUsername => {
  return User.findOne({ username: reqUsername });
};

//check for existing email
const checkEmail = userEmail => {
  return User.findOne({ email: userEmail });
};

//avatar image upload multer middleware max 5MB
let upload = multer({dest: 'temp/', limits: {files: 1, fieldSize: 5 * (1024 * 1024)}});


//-----------------------------USER SIGN UP---------------------------------//
router.post("/register", async (req, res) => {
  const { error } = signupValidation({password: req.body.password});

  if (error) {
    const details = {...error.details[0]}
    return res.send({error: {status: 400, message: "Password must be 8 characters long." }});
  }

  // automated username validation
  const trimmedUsername = trimValues(req.body.username);

  const isUsernameTaken = await checkUsername(trimmedUsername);
  if (isUsernameTaken) {
    return res.send({error: {status: 409, message: "This username is taken." }});
  }


  try {
    let existingEmail = await checkEmail(req.body.email);
    if (existingEmail) {
      return res.send({error: { status: 409, message: "An account with this email already exists." }});
    }

    //encryption
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);


    //-----------------------------NEW USER---------------------------------//
    const user = new User;
    if (!req.body.displayName) user.displayName = trimmedUsername;
    
      user.username = trimmedUsername
      if (req.body.displayName) {
        user.displayName = trimWithCasing(req.body.displayName);
      } 
      user.email = req.body.email
      user.password = hashedPassword
    // });
      await user.save()
      //-----------------------------NEW USER---------------------------------//


      //-----------------------------AWS IMAGE UPLOAD (DEFAULT AVATAR)---------------------------------//
      //random image file name
      const path = fileName();

      //defining parameters for s3 upload
      const randUid = uuid();
      const prefix = uuid();
      let params = {
        ACL: "public-read",
        Bucket: process.env.BUCKET_NAME,
        Body: fs.createReadStream(`./assets/${path}`),
        ContentType: "image/png",
        ServerSideEncryption: "AES256",
        Key: `${user._id}/default/${randUid}-${path}`
      };

      //upload image
  s3.upload(params, async (err, data) => {
    if (err) res.send({ error: err });

    if (data) {
      const location = data.Location;
      await User.updateOne({"_id": user._id}, {$set: {avatar: location, update: Date.now()}})
    }

    const media = new Media({
      user: user._id,
      url: data.Location,
      key: data.key
    });

    media.save();
  });
  //-----------------------------AWS IMAGE UPLOAD (DEFAULT AVATAR)---------------------------------//


  //-----------------------------JSON WEB TOKEN---------------------------------//
    const payload = {
      user: {
        id: user._id
      }
    };

    //json web token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "10 seconds" },
      async (err, token) => {
        if (err) throw err;
        let auth = new UserToken ({
          user: user._id,
          token: token
        })
        await auth.save()
        res.send({token: token});
      }
    );
    //-----------------------------JSON WEB TOKEN---------------------------------//
  } catch (error) {
    res.status(500).send({error: "Something went wrong."});
  }
});
//-----------------------------USER SIGN UP---------------------------------//

//get user by id 
router.get("/users/:id", verify, async (req, res) => {
  try {
    const current_user = await User.findById(req.params.id).select(
      "_id displayName"
    );

    if (!current_user)
      return res.send({ status: 401, error: "Unauthorized request." });

    res.send(current_user);
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

//get user avatar
router.get("/users/:id/avatar", verify, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("avatar");

    if (!user) return res.send({status: 401, error: "Unauthorized request."});

    res.send(user)
  } catch (error) {
    res.status(500).send(error)
  }
})

//get logged in user
router.get("/home/me", verify, async (req, res) => {
  try {
    const current_user = await User.findById(req.user.id).select("-password -__v -forename -surname -created -updated -email")

    if (!current_user)
      return res.send({ status: 401, error: "Unauthorized request." });
      // console.log("WOIUG")
      res.send(current_user);
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

//get all posts from current user
router.get("/user/posts", verify, async (req, res) => {
  try {
    const current_user = await User.findById(req.user.id).select(
      "-password -__v"
    );

    if (!current_user)
      return res.status(401).send({ error: "Unauthorized request." });

    const userPosts = await Post.find({ user: current_user._id }).select(
      "id title content likes comments"
    );

    res.send({ data: [{ user: current_user, posts: userPosts }] });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Couldn't get posts." });
  }
});

//search for users
router.patch('/:username', verify, async (req, res) => {
    const user = await User.find({username: {'$regex': req.params.username}}, '_id displayName email');
    if (!user) return res.send({status: 404, error: "Not Found."});

    try {
        res.send(user)
    } catch (error) {
        res.status(500).send({error: "Something went wrong."})
    }
});


//edit profile - upload avatar image
router.patch('/user/avatar', verify, upload.single('avatar'), async (req, res) => {
  let user = await User.findById(req.user.id).select("-password -__v");
  if (!user) return res.status(400).send({error: "Invalid request."});
  if (!req.file) return res.status(400).send({error: "No file uploaded"});

  console.log(req.file)

  try {
    //paramaters for calling upload
    const randUid = uuid();
    let params = {
      ACL: 'public-read',
      Bucket: process.env.BUCKET_NAME,
      Body: fs.createReadStream(req.file.path),
      ContentType: req.file.mimetype,
      ServerSideEncryption: 'AES256',
      Key: `${user._id}/avatar/${randUid}-${req.file.originalname}`
    };

    //upload image
    s3.upload(params, async (err, data) => {
      if (err) res.send({error: err});
      
      if (data) {
        // console.log(data)
        const location = data.Location;

        user.avatar = location;
        user.updated = Date.now();
        await Post.updateMany({ user: user._id }, { $set: { userAvatar: location } });
        await user.save();
        res.status(202).send(user);
      }
      //delete from temp folder on host
      const path = req.file.path;
      fs.unlinkSync(path);

      const media = new Media({
        user: user._id,
        url: data.Location,
        key: data.key
      })

      media.save();

    });
  } catch (error) {
    res.status(500).send({error: "Something went wrong."})
  }
});

module.exports = router;
