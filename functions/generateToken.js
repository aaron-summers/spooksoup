const jwt = require('jsonwebtoken');

//models
const UserToken = require("../models/UserToken");

const generateToken = async (res, userId) => {
    // let userToken;
    const payload = {
      user: {
        id: userId
      }
    };    

    jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "30 seconds"}, async (err, token) => {
        let tokenCollection = await UserToken.findOne({ user: payload.user.id });
        if (!tokenCollection) {
            let newUserToken = new UserToken({
                user: payload.user.id,
                token: token
            })
            await newUserToken.save();
        } else {
            await tokenCollection.updateOne({token: token})
        }
        res.send({data: {token: token, a_id: userId}})
    })
}

module.exports.generateToken = generateToken;