const dotenv = require("dotenv").config();
const { DataSource } = require("typeorm");

//DB Connection via TypeORM
const myDataSource = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
  });

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

module.exports = {
    "addPost" : addPost,
    "showPosts": showPosts,
    "searchPostsByUserId" : searchPostsByUserId,
    "updatePost" : updatePost,
    "delPosts" : delPosts,
    "likePost" : likePost,
    "myDataSource" : myDataSource
}
