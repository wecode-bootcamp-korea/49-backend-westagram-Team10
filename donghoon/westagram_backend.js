const http = require("http");
const express = require("express");
const { DataSource } = require("typeorm")

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

//DB Connection via TypeORM
const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "westargram"
});

const app = express();

app.use(express.json()); // for parsing application/json
app.use(bodyParser.json());



// 기능함수 생성
const welcome = async (req, res) => {
    try {
        return res.status(200).json({ message: "Welcome to Roon's server!" })
    } catch (err) {
        console.log(err);
    }
};

const getUser = async (req, res) => {
    try {
        const userData = await myDataSource.query("SELECT users.name, users.email, users.password FROM users");
        console.log(userData);
        return res.status(200).json({ "users": userData })
    } catch (err) {
        console.log(err);
    }
};

const addUser = async (req, res) => {
    try {
        //1. 유저 정보를 FE에서 받는다
        const newUserData = req.body
        console.log(newUserData);
        const name = newUserData.name
        console.log(name)
        const password = newUserData.password
        console.log(password)
        const email = newUserData.email
        console.log(email)
        // const age = newUserData.age
        // console.log(age)
        //3. DATABASE로 정보 저장
        const userData = await myDataSource.query(
            `INSERT INTO users (name, email, password) VALUES ("${name}", "${email}", "${password}");`)
        return res.status(201).json({ "message" : "userCreated"});
    } catch (err) {
        console.log(err);
    }
};
// {"name":"동훈", "password":"자동차좋아요", "email": "email@email.com"}

const delUser = async (req, res) => {
    try {
        const delData = users.pop()
        return res.status(204).json({ "Delete Successful": delData })
    } catch (err) {
        console.log(err)
    }
};

const updateUser = async (req, res) => {
    try {
        const newData = req.body
        users[0].name = newData.data.name
        return res.status(200).json({ "It will Work.": "I Promise" })
    } catch (err) {
        console.log(err)
    }
};

const addPost = async (req, res) => {
    try {
        //1. 유저 정보를 FE에서 받는다
    const newPostData = req.body
    console.log(newPostData);
    const title = newPostData.title
    console.log(title)
    const content = newPostData.content
    console.log(content)
    const user_id = newPostData.user_id
    console.log(user_id)
    // const age = newUserData.age
    // console.log(age)
    //3. DATABASE로 정보 저장
    const userData = await myDataSource.query(
        `INSERT INTO posts (title, content, user_id) VALUES ("${title}", "${content}", "${user_id}");`)
    return res.status(201).json({ "message" : "postCreated"});
    } catch (err) {
        console.log(err);
    }
}; // {"title":"'mycli 개꿀이다'", "content":"동언님 왈, 달다 달아 너무 달아서 이가 썩을것 같다.", "user_id": 6}

const showPosts = async (req, res) => {
    try {
        return res.status(200).json(posts);
    } catch (err) {
        console.log(err);
    }
};

// API Lists

//0. Server Launch Message
app.get("/", welcome);

//1. API 로 users 화면에 보여주기
app.get("/users", getUser);

// Assignment 2. 유저 회원가입 하기
app.post("/add/users", addUser)

// Assignment 3. 게시글 등록하기 
app.post("/add/posts", addPost);

// 가장 마지막 user를 삭제하는 엔드포인트
app.delete("/del/users", delUser);

// 과제 4 UPDATE
// 1번 user의 이름을 'Code Kim'으로 바꾸어 보세요.
app.put("/update/users", jsonParser, updateUser);


// // 4. 게시글 수정하기
// app.get("/foodReview", async (req, res) => {
//     try {
//         return res.status(200).json();
//     } catch (err) {
//         console.log(err);
//     }
// });

const server = http.createServer(app); // express app 으로 서버를 만듭니다.

const start = async () => {
    // 서버를 시작하는 함수입니다.
    try {
        server.listen(8000, () => console.log(`Server is listening on 8000`));
    } catch (err) {
        console.error(err);
    }
};

myDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })

start();
