const jwt = require("jsonwebtoken");

const {
  createColumnsQueryText,
  createValuesQueryText,
} = require("../functions");
const appDataSource = require("../appDataSource");

const createUser = async (req, res) => {
  try {
    const body = req.body;
    const { name, email, password } = body;

    const isInputNotExist = !name || !email || !password;
    throwError(isInputNotExist, 400, "KEY_ERROR");

    const isPasswordInvalid = new RegExp(
      "^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,30})"
    ).test(password);
    throwError(!isPasswordInvalid, 400, "INVALID_PASSWORD");

    const columnsQueryText = createColumnsQueryText(body);
    const valuesQueryText = createValuesQueryText(body);

    await appDataSource.query(
      `INSERT INTO users
        (${columnsQueryText})
        VALUES
        ('${valuesQueryText}')`
    );

    return res.status(201).json({ message: "userCreated" });
  } catch (error) {
    console.log(error);
    if (error.errno === 1062) {
      return res.status(400).json({ message: "DUPLICATE_USER_EMAIL" });
    }
    if (error.errno === 1054) {
      return res.status(400).json({ message: "KEY_ERROR" });
    }
    return res.status(error.status).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await appDataSource.query(`SELECT * FROM users`);

    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isEmailPasswordEmpty = !email || !password;
    throwError(isEmailPasswordEmpty, 400, "KEY_ERROR");

    const existingUser = await appDataSource.query(`
        SELECT id, email, password
        FROM users
        WHERE email = '${email}'`);
    const userNotFound = existingUser.length === 0;
    throwError(userNotFound, 400, "AUTENTICATION_FAILED");

    const wrongPassword = password !== existingUser[0].password;
    throwError(wrongPassword, 400, "AUTENTICATION_FAILED");

    const token = jwt.sign(
      { aud: existingUser[0].id, iat: Date.now() },
      process.env.JWT_SECRET
    );
    return res.status(200).json({ message: "loginSuccess", token: token });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ message: error.message });
  }
};

module.exports = {
  createUser: createUser,
  login: login,
  getUsers: getUsers,
};
