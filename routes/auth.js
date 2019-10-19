 const express = require('express');
 const router = express.Router();
 const jwt = require('jsonwebtoken');
 const validator = require("validator");
 const bcrypt = require('bcryptjs');

 //models
 const User = require('../models/User');
//  const UserToken = require('../models/UserToken');

 //custom methods
 const verify = require('../middleware/verify');
 const {generateToken} = require("../functions/generateToken");
 const {loginValidation} = require('../functions/validation');
 
//token authorization
router.get('/auth/verify', verify, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id displayName");
    res.send( user )
  } catch (error) {
    res.status(401).send({error: error})
  }
});

//user login
router.post('/auth', async (req, res) => {
  const {error} = loginValidation(res.body);
  if (error) return res.status(401).send({error: error.details[0]})

  try {
    let user;

    if (req.body.email) user = await User.findOne({ email: req.body.email });
    
    if (req.body.username) user = await User.findOne({ username: req.body.username.toLowerCase() });

    if (!user) return res.status(401).send({error: {message: "Unauthorized. Invalid Credentials.", status: 401}});

    const isAuthenticated = await bcrypt.compare(req.body.password, user.password);

    if (!isAuthenticated) return res.status(401).send({error: {message: "Invalid Credentials.", status: 401}})

    const token = generateToken(res, user._id)

  } catch (error) {
    res.status(500).send({error: error})
  }

})

module.exports = router;