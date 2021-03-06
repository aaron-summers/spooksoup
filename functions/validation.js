const Joi = require("@hapi/joi");

//user validation
const signupValidation = (data) => {
  const schema = Joi.object({
    // username: Joi.string()
    //   .regex(/^[a-zA-Z0-9]+(?:[ _-][A-Za-z0-9]+)*$/)
    //   .min(2)
    //   .required(),
    // email: Joi.string()
    //   .email()
    //   .min(6)
    //   .required(),
    password: Joi.string()
      .min(8)
      .required()
  });
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(2)
      .required(),
    password: Joi.string()
      .min(8)
      .required()
  });
  return schema.validate(data);
};

const trimValues = (vals) => {
    return vals.toLowerCase().trim().replace(/[^\w-]/g, '')
}

const trimWithCasing = (vals) => {
  return vals.trim().replace(/\s+/g, " ").replace(/[^\w- ]+/gi, "").replace(/\s+/g, " ")
};

// const validatePassword = () => {

// }


module.exports.signupValidation = signupValidation;
module.exports.loginValidation = loginValidation;
module.exports.trimValues = trimValues;
module.exports.trimWithCasing = trimWithCasing;