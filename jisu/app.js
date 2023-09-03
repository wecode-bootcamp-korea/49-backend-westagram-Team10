const http = require('http');
const express = require('express');
const {DataSource} = require('typeorm');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const appDataSource = new DataSource({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

appDataSource.initialize()
  .then(() => {
    console.log('Datasource inialized!');
  });

const app = express();

app.use(express.json());
app.use(cors({
  origin: '*'
}));
app.use(morgan('dev'));

const getGreeting = async (req, res) => {
  try {
    return res.status(200).json({ "message": "good" });
  } catch (error) {
    console.log(error);
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

const createUser = async (req, res) => {
  try {
    const newUser =req.body;
    const result = await appDataSource.query(
      `INSERT INTO users
      (name, email, password, profile_image)
      VALUES
      ('${newUser.name}', '${newUser.email}',
      '${newUser.password}', '${newUser.profile_image}')`);
    return res.status(201).json({ "message": "userCreated" });
  } catch (error) {
    console.log(error);
  }
};

const createPost = async (req, res) => {
  try {
    const body = req.body;
    const result = await appDataSource.query(
      `INSERT INTO posts
      (title, content, user_id, post_image_url)
      VALUES
      ('${body.title}', '${body.content}',
      '${body.user_id}', '${body.post_image_url}')`);
    return res.status(201).json({ "message": "postCreated" });
  } catch (error) {
    console.log(error);
  }
};

const getPosts = async (req, res) => {
  try {
    const result = await appDataSource.query(
      `SELECT
      posts.user_id AS userId,
      users.profile_image AS userProfileImage,
      posts.id AS postingId,
      posts.post_image_url AS postingImageURL,
      posts.content AS postingContent
      FROM posts
      JOIN users ON posts.user_id = users.id`
    );
    return res.status(200).json({ "data": result });
  } catch (error) {
    console.log(error);
  }
};

app.get('/', getGreeting);
app.get('/users', getUsers);
app.post('/users', createUser);
app.post('/posts', createPost);
app.get('/posts', getPosts);

const server = http.createServer(app);

const start = async () => {
  try {
    server.listen(8000, () => {console.log("server up and listening on 8000")});
  } catch (err) {
    console.log(err);
  }
};

start();

