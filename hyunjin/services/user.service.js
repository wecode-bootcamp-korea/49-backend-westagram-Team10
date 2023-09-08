const { dataSource } = require('../models');
const bcrypt = require('bcrypt');

exports.signUp = async ({ email, name, password }, next) => {
  try {
    const [existUser] = await dataSource.query(
      `SELECT email FROM users WHERE email = ?`,
      [email],
    );
    const hash = await bcrypt.hash(password, 12);
    if (!existUser) {
      await dataSource.query(
        `INSERT INTO users (email, name, password) VALUES (?,?,?)`,
        [email, name, hash],
      );
      return 'user created';
    }
    return 'duplicated email';
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.signIn = () => {};
