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
    // console.log(token)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded.user;
        next();
        // req.user = decoded.user;
        // next();
    } catch (error) {
        res.send({status: 401, error: error});
    }
    // jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    //     if (err) {
    //         // return console.log(decoded)
    //         // console.log("token needs refreshing")
    //         if (err.message === "jwt expired") {
    //             console.log('refresh token')
    //         }
    //         res.send({error:err, valid: false})
    //     } else {
    //         // console.log(decoded);
    //         req.user = decoded.user;
    //         next();
    //     }
    // })
}