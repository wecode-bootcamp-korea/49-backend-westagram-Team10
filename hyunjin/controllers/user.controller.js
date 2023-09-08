const { throwError } = require('../middlewares');
const { signUp } = require('../services/user.service');
const isValidData = (reg, validationTarget) => {
  return reg.test(validationTarget);
};

exports.signUpController = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const emailRegExp = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    const passwordRegExp = /[ !@#$%^&*(),.?":{}|<>]/g;
    if (!email || !name || !password) {
      throwError(400, 'key error');
    }
    if (
      isValidData(emailRegExp, email) &&
      isValidData(passwordRegExp, password)
    ) {
      const successMessage = signUp(req.body, next);
      if (successMessage === 'user created') {
        return res.status(201).json({ message: successMessage });
      } else {
        throwError(400, 'duplicated email');
      }
    } else {
      throwError(400);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};
