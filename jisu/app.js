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

function throwError (condition, statusCode, message) {
  if (condition) {
    const error = new Error(message);
    error.status = statusCode;
    throw error;
  }
}

function createColumnsQueryText (reqBody) {
  const keys = Object.keys(reqBody);
  return keys.join(",");  
}

function createValuesQueryText (reqBody) {
  const keys = Object.values(reqBody);
  return keys.join("','");  
}

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
    const body = req.body;
    const { name, email, password } = body;

    const isInputNotExist = !name || !email || !password;
    throwError(isInputNotExist, 400, "KEY_ERROR");

    const isPasswordTooShort = password.length < 8;
    throwError(isPasswordTooShort, 400, "INVALID_PASSWORD");

    const columnsQueryText = createColumnsQueryText(body);
    const valuesQueryText = createValuesQueryText(body);

    await appDataSource.query(
      `INSERT INTO users
      (${columnsQueryText})
      VALUES
      ('${valuesQueryText}')`);
    
    return res.status(201).json({ "message": "userCreated" });
  } catch (error) {
    console.log(error);
    if (error.errno === 1062) {
      return res.status(400).json({ "message": "DUPLICATE_USER_EMAIL"});
    }
    if (error.errno === 1054) {
      return res.status(400).json({ "message": "KEY_ERROR"});
    }
    return res.status(error.status).json({ "message": error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const body = req.body;
    const { user_id, post_image_url} = body;
    
    const isInputNotExist = !user_id || !post_image_url;
    throwError(isInputNotExist, 400, "KEY_ERROR");
    
    const columnsQueryText = createColumnsQueryText(body);
    const valuesQueryText = createValuesQueryText(body);
    
    const result = await appDataSource.query(
      `INSERT INTO posts
      (${columnsQueryText})
      VALUES
      ('${valuesQueryText}')`);
    return res.status(201).json({ "message": "postCreated" });
  } catch (error) {
    console.log(error);
    if (error.errno === 1452) {
      return res.status(400).json({ "message": "INVALID_USER_ID" });
    }
    if (error.errno === 1054) {
      return res.status(400).json({ "message": "KEY_ERROR"});
    }
    return res.status(error.status).json({ "message": error.message });
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

const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const user = await appDataSource.query(
      `SELECT
      users.id AS userId,
      users.profile_image AS userProfileImage
      FROM users
      WHERE users.id = ${userId};`
    );

    
    result = user[0];
    const userNotFound = !result;
    throwError(userNotFound, 404, "USER_NOT_FOUND");

    const posts = await appDataSource.query(
      `SELECT
      posts.id AS postingId,
      posts.post_image_url AS postingImageURL,
      posts.content AS postingContent
      FROM posts
      WHERE posts.user_id = ${userId};`
    );
    result['postings'] = posts;
    return res.status(200).json({ "data": result });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ "message": error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const post_id = req.params.post_id;
    const body = req.body;
    const oldPost = await appDataSource.query(
      `SELECT * 
      FROM posts 
      WHERE posts.id = ${post_id};`
    );

    if (oldPost[0].user_id !== body.user_id) {
      return res.status(401).json({ "error": "Unauthorized" });
    }
    
    await appDataSource.query(
      `UPDATE posts
      SET content = '${body.content}',
      post_image_url = '${body.post_image_url}'
      WHERE posts.id = ${post_id};`);

    const result = await appDataSource.query(
      `SELECT
      users.id AS userId,
      users.name AS userName,
      posts.id AS postingId,
      posts.post_image_url AS postingImageURL,
      posts.content AS postingContent
      FROM users
      JOIN posts ON posts.user_id = users.id
      WHERE posts.id = ${post_id};`
    );
    
    return res.status(200).json({ "data": result });
  } catch (error) {
    console.log(error);
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.post_id;
    await appDataSource.query(
      `DELETE FROM likes
      WHERE post_id = ${postId}`
    );

    await appDataSource.query(
      `DELETE FROM comments
      WHERE post_id = ${postId}`
    );
    
    await appDataSource.query(
      `DELETE FROM posts
      WHERE posts.id = ${postId};`
    );
    
    return res.status(200).json({ "message": "postingDeleted" });
  } catch (error) {
    console.log(error);
  }
};

const toggleLike = async (req, res) => {
  try {
    const postId = req.body.post_id;
    const userId = req.body.user_id;
    const duplicateLike = await appDataSource.query(
      `SELECT * FROM likes
      WHERE user_id = ${userId} AND post_id = ${postId};`
    );

    if (duplicateLike.length > 0) {
      await appDataSource.query(
        `DELETE FROM likes
        WHERE likes.id = ${duplicateLike[0].id};`
      );
      return res.status(200).json({ "message": "likeDeleted" });
    }

    await appDataSource.query(
      `INSERT INTO likes
      (user_id, post_id)
      VALUES
      ('${userId}', '${postId}');`
    );
    
    return res.status(200).json({ "message": "likeCreated" });
  } catch (error) {
    console.log(error);
  }
};

app.get('/', getGreeting);
app.get('/users', getUsers);
app.post('/users', createUser);
app.post('/posts', createPost);
app.get('/posts', getPosts);
app.get('/users/:user_id/posts', getUserPosts);
app.put('/posts/:post_id', updatePost);
app.delete('/posts/:post_id', deletePost);
app.post('/likes', toggleLike);

const server = http.createServer(app);

const start = async () => {
  try {
    server.listen(8000, () => {console.log("server up and listening on 8000")});
  } catch (err) {
    console.log(err);
  }
};

start();

