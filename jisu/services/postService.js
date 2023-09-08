const {
  throwError,
  createColumnsQueryText,
  createValuesQueryText,
} = require("../functions");
const appDataSource = require('../appDataSource');

const createPost = async (req, res) => {
  try {
    const body = req.body;
    const { user_id, post_image_url } = body;

    const isInputNotExist = !user_id || !post_image_url;
    throwError(isInputNotExist, 400, "KEY_ERROR");

    const columnsQueryText = createColumnsQueryText(body);
    const valuesQueryText = createValuesQueryText(body);

    await appDataSource.query(
      `INSERT INTO posts
        (${columnsQueryText})
        VALUES
        ('${valuesQueryText}')`
    );
    return res.status(201).json({ message: "postCreated" });
  } catch (error) {
    console.log(error);
    if (error.errno === 1452) {
      return res.status(400).json({ message: "INVALID_USER_ID" });
    }
    if (error.errno === 1054) {
      return res.status(400).json({ message: "KEY_ERROR" });
    }
    return res.status(error.status).json({ message: error.message });
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
    return res.status(200).json({ data: result });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ message: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.user_id;
    throwError(!userId, 400, "KEY_ERROR");

    const user = await appDataSource.query(
      `SELECT
        users.id AS userId,
        users.profile_image AS userProfileImage
        FROM users
        WHERE users.id = ${userId};`
    );
    const result = user[0];
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
    result["postings"] = posts;
    return res.status(200).json({ data: result });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ message: error.message });
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

    throwError(oldPost[0].user_id !== body.user_id, 401, "UNAUTHORIZED");

    await appDataSource.query(
      `UPDATE posts
        SET content = '${body.content}',
        post_image_url = '${body.post_image_url}'
        WHERE posts.id = ${post_id};`
    );

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

    return res.status(200).json({ data: result });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.post_id;

    throwError(!postId, 400, "KEY_ERROR");

    const existingPost = await appDataSource.query(`
        SELECT * FROM posts WHERE id = ${postId};
      `);
    throwError(existingPost.length === 0, 400, "POST_NOT_FOUND");

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

    return res.status(200).json({ message: "postingDeleted" });
  } catch (error) {
    console.log(error);
  }
};

const createLike = async (req, res) => {
  try {
    const postId = req.body.post_id;
    const userId = req.body.user_id;
    const duplicateLike = await appDataSource.query(
      `SELECT * FROM likes
        WHERE user_id = ${userId} AND post_id = ${postId};`
    );

    throwError(duplicateLike.length > 0, 400, "DUPLICATE_LIKES_REQUESTED");

    await appDataSource.query(
      `INSERT INTO likes
        (user_id, post_id)
        VALUES
        ('${userId}', '${postId}');`
    );

    return res.status(200).json({ message: "likeCreated" });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ message: error.message });
  }
};

const deleteLike = async (req, res) => {
  try {
    const postId = req.body.post_id;
    const userId = req.body.user_id;
    const duplicateLike = await appDataSource.query(
      `SELECT * FROM likes
        WHERE user_id = ${userId} AND post_id = ${postId};`
    );

    throwError(duplicateLike.length === 0, 400, "LIKES_NOT_FOUND");

    await appDataSource.query(
      `DELETE FROM likes
        WHERE likes.id = ${duplicateLike[0].id};`
    );
    return res.status(200).json({ message: "likeDeleted" });
  } catch (error) {
    console.log(error);
    return res.status(error.status).json({ message: error.message });
  }
};

module.exports = {
    createPost,
    getPosts,
    getUserPosts,
    updatePost,
    deletePost,
    createLike,
    deleteLike
};