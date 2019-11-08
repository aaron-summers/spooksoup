const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Tag = require("../models/Tag");

//$and logic operation to specify multiple conditions to find documents
//$set adds a field(s)
//$unset removes fields

const updateSchema = async () => {
  const user = User.find({ spotlight: { $exists: false } });

  await user.updateMany({}, { $set: { spotlight: true } }, { multi: true });
};

const deleteField = async () => {
  await User.updateMany(
    { contacts: { $exists: true }},
    { $unset: { contacts: null } },
    { multi: true }
  );
}; 

const deleteFields = async () => {
  await User.updateMany(
    {$and: [{ middlename: { $exists: true } }, { isActive: { $exists: true } }]},
    { $unset: { middlename: null, isActive: true } },
    { multi: true }
  );
};


module.exports.updateSchema = updateSchema;
module.exports.deleteFields = deleteFields;
module.exports.deleteField = deleteField;