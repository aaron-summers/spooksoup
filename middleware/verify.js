const jwt = require('jsonwebtoken');

//methods
const {generateToken} = require('../functions/generateToken');

//models
const UserToken = require('../models/UserToken');

module.exports = async function(req, res, next) {
    //extract token
    const token = req.header('Authorization');
    // let decoded;

    if (!token) return res.send({error: {message: "Unauthorized. No Token Provided.", status: 401}})

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.send({status: 401, error: error});
    }
}