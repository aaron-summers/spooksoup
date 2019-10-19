const express = require("express");
const router = express.Router();

const jwt = require('jsonwebtoken');

//models
const UserToken = require('../models/UserToken');

//methods
const {generateToken} = require("../functions/generateToken");

router.post('/token/renew', async (req, res) => {
    const token = req.header("Authorization");
    // if (error.message.toLowerCase() === "jwt expired".toLowerCase()) {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {ignoreExpiration: true})
    const userAuth = await UserToken.find({$and: [{ user:  {$eq: payload.user.id}}, { token: {$eq: token} }]})
    if (!userAuth) return res.status(400).send({error: {message: "Invalid token.", status: 400}})

    try {
        generateToken(res, payload.user.id)
    } catch (error) {
        res.send(error)
    }
})

module.exports = router;