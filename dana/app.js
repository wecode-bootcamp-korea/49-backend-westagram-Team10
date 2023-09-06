const express = require("express");
const { error } = require("console");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { appendFile } = require("fs");

const { DataSource } = require("typeorm");
const myDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: "3306",
  username: "root",
  password: "1234",
  database: "westagram",
});

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// [Assignment 1] 초기 세팅 및 users 화면에 보여주기

app.get("/users", async (req, res) => {
  try {
    //from database to backend
    const userData = await myDataSource.query(
      `SELECT id, name, password, email FROM users`
    );
    console.log("USER DATA:", userData);

    //from backend to frontend
    return res.status(200).json({ users: userData });
  } catch (err) {
    console.log(err);
  }
});

// [Assignment 2] 유저 회원가입 하기

app.post("/register", async (req, res) => {
  try {
    //front에서 데이터를 받고 확인

    const newUser = req.body;
    console.log("newuser: ", newUser);

    //데이터베이스에 정보 저장

    const newUserName = newUser.name;
    const newUserPassword = newUser.password;
    const newUserEmail = newUser.email;

    //Error handling #1 - password length
    if (newUserPassword.length < 10) {
      const error = new Error("INVALID_PASSWORD")
      error.statusCode = 400;

      throw error;
    }

    //Error handling #2 - email, name, password 누락된 경우
    if (newUserName === undefined || newUserPassword === undefined || newUserEmail=== undefined) {
      const error = new Error("KEY_ERROR")
      error.statusCode = 400;

      throw error;
    }

    //Error handling #3 -  password 특수 문자 포함
    if (/[@!-_]/.test(newUserPassword) === false) {
      const error = new Error("PASSWORD_NO_SYMBOLS")
      error.statusCode = 400

      throw error
    }


    //Error handling #4 -  이메일 중복
    const emailCheck = await myDataSource.query(
      `SELECT email FROM users WHERE email = "${newUserEmail}"`);

    if (emailCheck.length !== 0) {
      const error = new Error("DUPLICATED_EMAIL_ADDRESS")
      error.statusCode = 400;

      throw error;
    }



    const userData = await myDataSource.query(`
       INSERT INTO users (name, password, email) 
       VALUES ("${newUserName}", "${newUserPassword}", "${newUserEmail}")
     `);

    console.log("inserted user id", userData.insertId);


    //from backend to frontend
    return res.status(200).json({ message: "userCreated", users: userData });

  } catch (error) {
    console.log(error);
    return res.status(error.statusCode).json({
      "message": error.message
    })
  }
});

// [Assignment 3] 게시글 등록하기 

app.post("/newpost", async (req, res) => {
  try {
    //front에서 데이터를 받고 확인
    const newPost = req.body;
    console.log("newpost: ", newPost);

    //데이터베이스에 정보 저장
    const newPostTitle = newPost.title;
    const newPostContent = newPost.content;
    const newPostUser = newPost.user_id;

    const postData = await myDataSource.query(`
       INSERT INTO posts (title, content, user_id) 
       VALUES ("${newPostTitle}", "${newPostContent}", "${newPostUser}")
     `);

    console.log("inserted post id", newPost.insertId);

    //from backend to frontend

    return res.status(200).json({
      message: "postCreated",
      posts: postData
    });

  } catch {
    console.log("error");
  }
});



// server

app.listen(3000, () => {
  console.log("Server is running");
});

myDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});
