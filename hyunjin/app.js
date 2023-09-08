const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { dataSource } = require('./models');
const { signUpController } = require('./controllers/user.controller');
const { throwError } = require('./middlewares');
const app = express();

app.set('port', process.env.PORT || 8000);
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dataSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error(err);
  });
app.get('/', (_, res, next) => {
  try {
    res.status(200).json({ message: 'westagram' });
  } catch (err) {
    console.error(err);
    next(err);
  }
});
app.get('/users', async (_, res, next) => {
  try {
    await dataSource.query(`SELECT * FROM users`, (err, rows) => {
      return res.status(200).json({ users: rows });
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});
// 회원가입
app.post('/users/signup', signUpController);
// 로그인
app.post('/users/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [existUser] = await dataSource.query(
      `SELECT id, email, password FROM users WHERE email = ?`,
      [email],
    );
    if (existUser && existUser.email) {
      const result = await bcrypt.compare(password, existUser.password);
      if (result) {
        res.header(
          'accessToken',
          jwt.sign({ id: existUser.id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
          }),
        );
        return res.status(201).json({ message: 'token created' });
      }
    }
    throwError(400, "user does'nt exist");
  } catch (err) {
    console.error(err);
    next(err);
  }
});
//  app.get('/posts', async (_, res, next) => {
//   try {
//     const rows = await  dataSource.query(
//       `SELECT users.id, users.profile_image, users.name, posts.id AS post_id, posts.content
//       FROM users
//       LEFT JOIN posts ON users.id = posts.user_id
//       `,
//     );
//     return res.status(200).json({
//       data: rows.map((row) => ({
//         userId: row.id,
//         userProfileImage: row.profile_image,
//         postingId: row.post_id,
//         postingContent: row.content,
//       })),
//     });
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });
app.get('/posts', async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    const id = jwt.verify(token, process.env.JWT_SECRET);
    if (id) {
      const rows = await dataSource.query(
        `SELECT users.id, users.name, users.profile_image, posts.id, posts.content
        FROM users
        LEFT JOIN posts ON users.id = posts.user_id
        WHERE users.id =?`,
        [parseInt(id)],
      );
      if (!rows.length) {
        throwError(400);
      }
      return res.status(200).json({
        data: {
          userId: rows[0].id,
          userProfileImage: rows[0].profile_image,
          postings: rows.map((raw) => {
            return { postingId: raw.id, postingContent: raw.content };
          }),
        },
      });
    }
    throwError(401);
    return;
  } catch (err) {
    next(err);
  }
});
app.post('/posts', async (req, res, next) => {
  try {
    const { title, content, user_id } = req.body;
    if (user_id) {
      await dataSource.query(
        `
        INSERT INTO posts (title, content, user_id) VALUES (?,?,?)
        `,
        [title, content, user_id],
      );
      return res.status(201).json({ message: 'post created' });
    }
    throwError(401);
  } catch (err) {
    console.error(err);
    next(err);
  }
});
app.patch('/posts', async (req, res, next) => {
  try {
    const { content, post_id } = req.body;
    const { id } = req.query;
    if (id) {
      await dataSource.query(
        `
        UPDATE posts SET content = ? WHERE user_id = ? AND id = ?
        `,
        [content, parseInt(id), post_id],
      );
      const rows = await dataSource.query(
        `SELECT users.id, users.name, posts.id AS post_id, posts.title, posts.content
        FROM users
        LEFT JOIN posts ON users.id = posts.user_id
        WHERE user_id = ? AND posts.id = ?
        `,
        [parseInt(id), post_id],
      );
      return res.status(201).json({ data: rows });
    }
    throwError(401);
  } catch (err) {
    console.error(err);
    next(err);
  }
});
app.delete('/posts', async (req, res, next) => {
  try {
    const { post_id } = req.body;
    const { id } = req.query;
    if (id) {
      await dataSource.query(
        `DELETE FROM posts WHERE posts.id=? AND posts.user_id=?`,
        [post_id, id],
      );
      return res.status(200).json({ message: 'post deleted' });
    }
    throwError(401);
  } catch (err) {
    console.error(err);
    next(err);
  }
});
app.post('/likes', async (req, res, next) => {
  try {
    const { user_id, post_id, isLikeOn } = req.body;
    if (isLikeOn === 'Y') {
      await dataSource.query(
        `INSERT INTO likes (user_id, post_id) VALUES (?,?)`,
        [user_id, post_id],
      );
      return res.status(200).json({ message: 'like created', isLikeON: 'Y' });
    }
    throwError(400);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.use((req, _, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});
app.use((err, _, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  return res.json({
    error: `${err.status ? err.status : ''} ${err.message}`,
  });
});

app.listen(app.get('port'), () => {
  console.log(`listening.... 🦻http://localhost:${app.get('port')}`);
});
