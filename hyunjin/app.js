const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { DataSource } = require('typeorm');

class App {
  constructor() {
    this.app = express();
    this.dataSource;
    this.setPort();
    this.setMiddleware();
    this.setTypeORM();
    this.useRouting();
    this.status404();
    this.errorHandler();
  }
  setPort() {
    this.app.set('port', process.env.PORT || 8000);
  }
  setMiddleware() {
    this.app.use(cors());
    this.app.use(morgan('dev'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }
  setTypeORM() {
    this.dataSource = new DataSource({
      type: process.env.TYPEORM_CONNECTION,
      host: process.env.TYPEORM_HOST,
      port: process.env.TYPEORM_PORT,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
    });
    this.dataSource
      .initialize()
      .then(() => {
        console.log('Data Source has been initialized!');
      })
      .catch((err) => {
        console.error(err);
      });
  }
  useRouting() {
    this.app.get('/', (_, res, next) => {
      try {
        res.status(200).json({ message: 'westagram' });
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.get('/users', async (_, res, next) => {
      try {
        await this.dataSource.query(`SELECT * FROM users`, (err, rows) => {
          return res.status(200).json({ users: rows });
        });
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    // 회원가입
    this.app.post('/signup', async (req, res, next) => {
      try {
        const { email, name, password } = req.body;
        const emailRegExp = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        const passwordRegExp = /[ !@#$%^&*(),.?":{}|<>]/g;
        const [existUser] = await this.dataSource.query(
          `SELECT email FROM users WHERE email = ?`,
          [email],
        );
        if (!email || !name || !password) {
          this.throwError(400, 'key error');
        }
        const hash = await bcrypt.hash(password, 12);
        if (!existUser) {
          if (
            this.isValidData(emailRegExp, email) &&
            this.isValidData(passwordRegExp, password)
          ) {
            await this.dataSource.query(
              `
            INSERT INTO users (email, name, profile_image, password) VALUES (?,?,"baseUrl",?)
            `,
              [email, name, hash],
            );
            return res.status(201).json({ message: 'userCreated' });
          } else {
            this.throwError(400);
          }
        } else {
          this.throwError(400, 'duplicated email');
        }
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    // 로그인
    this.app.post('/signin', async (req, res, next) => {
      try {
        const { email, password } = req.body;
        const [existUser] = await this.dataSource.query(
          `SELECT id, email, password FROM users WHERE email = ?`,
          [email],
        );
        if (existUser && existUser.email) {
          const result = await bcrypt.compare(password, existUser.password);
          if (result) {
            res.header(
              'accessToken',
              jwt.sign(existUser.id, process.env.JWT_SECRET),
            );
            return res.status(201).json({ message: 'token created' });
          }
        }
        this.throwError(400);
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.get('/posts', async (_, res, next) => {
      try {
        const rows = await this.dataSource.query(
          `SELECT users.id, users.profile_image, users.name, posts.id AS post_id, posts.content
          FROM users
          LEFT JOIN posts ON users.id = posts.user_id
          `,
        );
        return res.status(200).json({
          data: rows.map((row) => ({
            userId: row.id,
            userProfileImage: row.profile_image,
            postingId: row.post_id,
            postingContent: row.content,
          })),
        });
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.get('/posts/:id', async (req, res, next) => {
      try {
        const { id } = req.params;
        if (id) {
          const rows = await this.dataSource.query(
            `SELECT users.id, users.name, users.profile_image, posts.id, posts.content
            FROM users  
            LEFT JOIN posts ON users.id = posts.user_id
            WHERE users.id =?`,
            [parseInt(id)],
          );
          if (!rows.length) {
            this.throwError(400);
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
        this.throwError(401);
      } catch (err) {
        next(err);
      }
    });
    this.app.post('/posts', async (req, res, next) => {
      try {
        const { title, content, user_id } = req.body;
        if (user_id) {
          await this.dataSource.query(
            `
            INSERT INTO posts (title, content, user_id) VALUES (?,?,?)
            `,
            [title, content, user_id],
          );
          return res.status(201).json({ message: 'post created' });
        }
        this.throwError(401);
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.patch('/posts', async (req, res, next) => {
      try {
        const { content, post_id } = req.body;
        const { id } = req.query;
        if (id) {
          await this.dataSource.query(
            `
            UPDATE posts SET content = ? WHERE user_id = ? AND id = ?
            `,
            [content, parseInt(id), post_id],
          );
          const rows = await this.dataSource.query(
            `SELECT users.id, users.name, posts.id AS post_id, posts.title, posts.content
            FROM users
            LEFT JOIN posts ON users.id = posts.user_id
            WHERE user_id = ? AND posts.id = ?
            `,
            [parseInt(id), post_id],
          );
          return res.status(201).json({ data: rows });
        }
        this.throwError(401);
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.delete('/posts', async (req, res, next) => {
      try {
        const { post_id } = req.body;
        const { id } = req.query;
        if (id) {
          await this.dataSource.query(
            `DELETE FROM posts WHERE posts.id=? AND posts.user_id=?`,
            [post_id, id],
          );
          return res.status(200).json({ message: 'post deleted' });
        }
        this.throwError(401);
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.post('/likes', async (req, res, next) => {
      try {
        const { user_id, post_id, isLikeOn } = req.body;
        if (isLikeOn === 'Y') {
          await this.dataSource.query(
            `INSERT INTO likes (user_id, post_id) VALUES (?,?)`,
            [user_id, post_id],
          );
          return res
            .status(200)
            .json({ message: 'like created', isLikeON: 'Y' });
        }
        this.throwError(400);
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
  }
  isValidData(reg, validationTarget) {
    return reg.test(validationTarget);
  }
  throwError(code, message) {
    if (!code) return;
    const error = new Error();
    let errorMessage = new Map([
      [400, 'bad request'],
      [401, 'unAuthorized'],
      [500, 'internal server error'],
    ]);
    if (!errorMessage.get(code) || message) {
      errorMessage.set(code, message);
    }
    error.message = errorMessage.get(code);
    error.status = code;
    throw error;
  }
  status404() {
    this.app.use((req, _, next) => {
      const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
      error.status = 404;
      next(error);
    });
  }
  errorHandler() {
    this.app.use((err, _, res, next) => {
      res.locals.message = err.message;
      res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
      res.status(err.status || 500);
      return res.json({
        error: `${err.status ? err.status : ''} ${err.message}`,
      });
    });
  }
}

const app = new App().app;
app.listen(app.get('port'), () => {
  console.log(`listening.... 🦻http://localhost:${app.get('port')}`);
});
