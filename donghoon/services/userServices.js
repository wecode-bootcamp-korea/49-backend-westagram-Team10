const dotenv = require("dotenv").config();
const { DataSource } = require("typeorm");
const jwt = require("jsonwebtoken");


//DB Connection via TypeORM
const myDataSource = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
  });

// 기능함수 생성
const welcome = async (req, res) => {
try {
    return res.status(200).json({ message: "Welcome to Roon's server!" });
} catch (err) {
    console.log(err);
}
};

const getUsers = async (req, res) => {
try {
    const userData = await myDataSource.query(
    "SELECT users.name, users.email, users.password FROM users"
    );
    console.log(userData);
    return res.status(200).json({ users: userData });
} catch (err) {
    console.log(err);
}
};

//회원가입
const signUp = async (req, res) => {
try {
    const { name, password, email, age } = req.body;

    if (email === undefined || password === undefined) {
    // if (email === undefined || name === undefined || password === undefined) {
    const error = new Error("KEY_ERROR");
    error.statusCode = 400;
    error.message = "Missing email, name, or password in the request body.";
    throw error;
    }

    if (password.length < 8) {
    const error = new Error("INVALID_PASSWORD_(TOO_SHORT)");
    error.statusCode = 400;
    error.message = "Password must be at least 8 characters long.";
    throw error;
    }

    // (심화, 진행) 이메일이 중복되어 이미 가입한 경우
    const existingUser = await myDataSource.query(
    `SELECT id, email FROM users WHERE email='${email}';`
    );
    if (existingUser.length > 0) {
    const error = new Error("EMAIL_ALREADY_EXIST");
    error.statusCode = 400;
    error.message = "Email address is already registered.";
    throw error;
    }
    // console.log("existing user: ", existingUser);
    // console.log("typeof ", typeof existingUser);
    // console.log("T/F", existingUser === []);
    // console.log("Object length : ", existingUser.length)
    // console.log("Object Length Not 0 :", existingUser.length != 0)

    // (심화, 선택) 비밀번호에 특수문자 없을 때
    const regex_pattern = /.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|-].*/;

    if (!regex_pattern.test(password)) {
    const error = new Error("PASSWORD_MUST_CONTAIN_AT_LEASE_ONE_SPECIAL_CHARACTER");
    error.statusCode = 400;
    throw error;
    }

    const userData = await myDataSource.query(
    `INSERT INTO users (name, email, password) VALUES ("${name}", "${email}", "${password}");`
    );
    return res.status(201).json({ message: "userCreated" });
} catch (error) {
    console.log(error);
    return res.status(error.statusCode).json({ message: error });
}
};
// {"name":"동훈", "password":"자동차좋아요", "email": "email@email.com"}


const logIn = async (req, res) => {
try {
    //이메일, 비밀번호를 받고
    const { email, password } = req.body;

    // 이메일과, 비밀번호가 DB에 있는지 확인
    const existingEmail = await myDataSource.query(
    `SELECT id, password FROM users WHERE email = '${email}'`
    );

    console.log("existingEmail :", existingEmail);
    console.log("access inside? :", existingEmail[0].id);

    // 이메일, 비밀 번호가 없을때 확인.
    if (email === undefined || password === undefined) {
    const error = new Error("KEY_ERROR");
    error.statusCode = 400;
    error.message = "Missing email, name, or password in the request body.";
    throw error;
    }

    // 이메일이 없으면...
    if (existingEmail.length = 0) {
    const error = new Error("CREDENTIAL_INFO_ERROR1");
    error.statusCode = 400;
    error.message = "CANNOT LOGIN, PLEASE REGISTER";
    throw error;
    }

    // 비밀번호가 일치 하는지?
    const checkPassword = await myDataSource.query(
    `SELECT id, password FROM users WHERE password = '${password}'`
    );

    console.log();
    console.log("checkPassword? : ", checkPassword);

    if (checkPassword[0].password !== password) {
    const error = new Error("CREDENTIAL_INFO_ERROR2");
    error.statusCode = 400;
    error.message = "CANNOT LOGIN, PLEASE CHECK PW";
    throw error;
    }

    const userId = checkPassword[0].id;
    const secretKey = process.env.SECRET_KEY
    const payload = { id: userId };
    const token = jwt.sign(payload, secretKey);

    console.log(token);

    return res.status(200).json({
    message: "Login Successful",
    token: token,
    });
} catch (error) {
    console.log(error);
    return res.status(error.statusCode).json({ message: error.message });
}
};

module.exports = {
    "welcome" : welcome,
    "signUp" : signUp,
    "logIn" : logIn,
    "getUsers" : getUsers,
    "myDataSource" : myDataSource
}