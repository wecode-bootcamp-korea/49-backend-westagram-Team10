const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('dotenv').config();

const {appDataSource} = require('./appDataSource');
const userService = require('./services/userService');
const postService = require('./services/postService');
const {getGreeting} = require('./services/greeting');

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(morgan('dev'));

appDataSource.initialize().then(() => {
  console.log("Datasource inialized!");
});

app.get('/', getGreeting);
app.get('/users', userService.getUsers);
app.post('/users', userService.createUser);
app.post('/posts', postService.createPost);
app.get('/posts', postService.getPosts);
app.get('/users/:user_id/posts', postService.getUserPosts);
app.put('/posts/:post_id', postService.updatePost);
app.delete('/posts/:post_id', postService.deletePost);
app.post('/posts/likes', postService.createLike);
app.delete('/posts/likes', postService.deleteLike);
app.post('/users/login', userService.login);

const server = http.createServer(app);

const start = async () => {
  try {
    server.listen(8000, () => {console.log("server up and listening on 8000")});
  } catch (err) {
    console.log(err);
  }
};

start();

