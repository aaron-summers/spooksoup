const _ = require("lodash");

const images = "./assets";
const fs = require("fs");

const fileName = () => {
  let imagesArray = fs.readdirSync(images);
  return _.sample(imagesArray)
};

module.exports.fileName = fileName;