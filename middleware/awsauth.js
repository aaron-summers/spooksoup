const aws = require("aws-sdk");

//aws config
aws.config.setPromisesDependency();
aws.config.update({
region: process.env.REGION,
accessKeyId: process.env.ACCESS_KEY_ID,
secretAccessKey: process.env.SECRET_ACCESS_KEY
});

module.exports = {
    aws
}