const http = require("http");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const userService = require("./services/userServices.js")
const postService = require("./services/postServices.js")
const app = express();
const express_port = 8000;

app.use(cors()); //모든 request에 대해 CORS 요청을 설정하는 법
app.use(morgan("combined"));
app.use(express.json()); // for parsing application/json

// API Lists

//0. Server Launch Message
app.get("/", userService.welcome);

// userServices
app.post("/users", userService.signUp);

app.post("/login", userService.logIn);

app.get("/users", userService.getUsers);

app.post("/posts", postService.addPost);


// postServices
app.get("/posts", postService.showPosts);

app.get("/posts/:user_id", postService.searchPostsByUserId); // /posts/"숫자" 로 get요청!

app.post("/posts/:post_id", postService.updatePost);

app.put("/posts/:post_id", postService.delPosts);

app.post("/likes/:user_id", postService.likePost);

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

userService.myDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

start();
