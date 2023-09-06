const http = require("http");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { DataSource } = require("typeorm");
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");
const { check } = require("yargs");

const app = express();
const express_port = 8000;

//DB Connection via TypeORM
const myDataSource = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
});

app.use(cors()); //모든 request에 대해 CORS 요청을 설정하는 법
app.use(morgan("combined"));
app.use(express.json()); // for parsing application/json

// 기능함수 생성
const welcome = async (req, res) => {
    try {
        return res.status(200).json({ message: "Welcome to Roon's server!" });
    } catch (err) {
        console.log(err);
    }
};

const getUser = async (req, res) => {
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
const addUser = async (req, res,) => {
    try {
        const newUserData = req.body;
        const name = newUserData.name;
        const password = newUserData.password;
        const email = newUserData.email;
        const age = newUserData.age;

        // const { name, password, email, age } = newUserData

        if (email === undefined || name === undefined || password === undefined) {
            const error = new Error("KEY_ERROR");
            error.statusCode = 400;
            error.message = "Missing email, name, or password in the request body."
            throw error;
        }

        if (password.length < 8) {
            const error = new Error("INVALID_PASSWORD_(TOO_SHORT)");
            error.statusCode = 400;
            error.message = "Password must be at least 8 characters long.";
            throw error;
        }

        // (심화, 진행) 이메일이 중복되어 이미 가입한 경우
        const existingUser = await myDataSource.query(`
      SELECT id, email FROM users WHERE email='${email}';
    `);
        if (existingUser.length > 0) {
            const error = new Error("EMAIL_ALREADY_EXIST")
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
        const regex_pattern = /.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|-].*/

        if (!regex_pattern.test(password)) {
            const error = new Error("PASSWORD_MUST_CONTAIN_AT_LEASE_ONE_SPECIAL_CHARACTER")
            error.statusCode = 400
            throw error
        }

        const userData = await myDataSource.query(
            `INSERT INTO users (name, email, password) VALUES ("${name}", "${email}", "${password}");`
        );
        return res.status(201).json({ message: "userCreated" });
    } catch (error) {
        console.log(error);
        return res.status(error.statusCode).json({ "message": error });
    }
};
// {"name":"동훈", "password":"자동차좋아요", "email": "email@email.com"}

const addPost = async (req, res) => {
    try {
        //1. 유저 정보를 FE에서 받는다
        const newPostData = req.body;
        // console.log(newPostData);
        const title = newPostData.title;
        // console.log(title)
        const content = newPostData.content;
        // console.log(content)
        const user_id = newPostData.user_id;
        // console.log(user_id)
        // const age = newUserData.age
        // console.log(age)
        //3. DATABASE로 정보 저장
        const userData = await myDataSource.query(
            `INSERT INTO posts (title, content, user_id) VALUES ("${title}", "${content}", "${user_id}");`
        );
        return res.status(201).json({ message: "postCreated" });
    } catch (err) {
        console.log(err);
    }
}; // {"title":"'mycli 개꿀이다'", "content":"동언님 왈, 달다 달아 너무 달아서 이가 썩을것 같다.", "user_id": 6}

const showPosts = async (req, res) => {
    try {
        const postsData = await myDataSource.query(
            "SELECT posts.user_id, users.profile_image AS userProfileImage, posts.id AS postingId, posts.content AS postingContent FROM posts JOIN users ON posts.user_id = users.id;"
        );
        console.log(postsData);
        return res.status(200).json({ Data: postsData });
    } catch (err) {
        console.log(err);
    }
};

const searchPostsByUserId = async (req, res) => {
    try {
        const userId = req.params.user_id;
        // console.log("유저아이디가 뭡니까?" + userId);
        const userPosts = await myDataSource.query(
            `SELECT * FROM posts WHERE posts.user_id = ${userId}`
        );
        return res.status(200).json({ Data: { userPosts } });
    } catch (err) {
        console.log(err);
    }
};

const updatePost = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const content_string = req.body.content;
        console.log(postId);
        console.log();
        console.log(content_string);
        const updatePost = await myDataSource.query(
            `UPDATE posts SET content = ${content_string} WHERE posts.id = ${postId}`
        );
        console.log(postId);
        return res.status(200).json({ updatePost });
    } catch (err) {
        console.log(err);
    }
};

const delPosts = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const deletePost = await myDataSource.query(
            `DELETE FROM posts WHERE id = ${postId}`
        );
        return res.status(204).json({ message: "postingDeleted" });
    } catch (err) {
        console.log(err);
    }
};

const likePost = async (req, res) => {
    try {
        const userId = req.params.user_id;
        console.log(userId);
        const postId = req.body.postId;
        console.log(postId);
        const likePost = await myDataSource.query(
            `INSERT INTO likes (user_id, post_id) VALUES ("${userId}", "${postId}")`
        );
        return res.status(204).json({ message: "likeCreated" });
    } catch (err) {
        console.log(err);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingEmail = await myDataSource.query(
            `SELECT id, password FROM users WHERE email = '${email}'`
        );

        console.log("existingEmail :", existingEmail);
        console.log("access inside? :", existingEmail[0].id);

        if (email === undefined || password === undefined) {
            const error = new Error("KEY_ERROR");
            error.statusCode = 400;
            error.message = "Missing email, name, or password in the request body."
            throw error;
        }

        if (existingEmail.length = 0) {
            const error = new Error("CREDENTIAL_INFO_ERROR1")
            error.statusCode = 400;
            error.message = "CANNOT LOGIN, PLEASE REGISTER";
            throw error;
        }

        const checkPassword = await myDataSource.query(
            `SELECT id, password FROM users WHERE password = '${password}'`
        );

        console.log();
        console.log("checkPassword? : ", checkPassword);



        if (checkPassword[0].password !== password) {
            const error = new Error("CREDENTIAL_INFO_ERROR2")
            error.statusCode = 400;
            error.message = "CANNOT LOGIN, PLEASE CHECK PW";
            throw error;
        }

        const userId = checkPassword[0].id
        const secretKey = "MapMethod";
        const payload = { id: userId };
        const token = jwt.sign(payload, secretKey);

        console.log(token);

        return res.status(200).json({
            "message": "Login Successful",
            "token": token
        })
    } catch (error) {
        console.log(error);
        return res.status(error.statusCode).json({ "message": error.message, })
    }
};

// API Lists

//0. Server Launch Message
app.get("/", welcome);

//1. API 로 users 화면에 보여주기
app.get("/users", getUser);

// Assignment 2. 유저 회원가입 하기
app.post("/users", addUser);

// Assignment 3. 게시글 등록하기
app.post("/posts", addPost);

// Assignment 4. 전체 게시글 조회하기
app.get("/posts", showPosts);

// Assignment 5. 유저의 게시글 조회하기
app.get("/posts/:user_id", searchPostsByUserId); // /posts/"숫자" 로 get요청!

// Assignment 6. 게시글 수정하기
app.post("/posts/:post_id", updatePost);

// Assignment 7. 게시글 삭제하기
app.put("/posts/:post_id", delPosts);

// Assignment 8. 좋아요 누르기
app.post("/likes/:user_id", likePost);

// 로그인
app.post("/login", login)


const server = http.createServer(app); // express app 으로 서버를 만듭니다.

const start = async () => {
    // 서버를 시작하는 함수입니다.
    try {
        server.listen(express_port, () =>
            console.log(`Server is listening on ${express_port}`)
        );
    } catch (err) {
        console.error(err);
    }
};

myDataSource.initialize().then(() => {
    console.log("Data Source has been initialized!");
});

start();
