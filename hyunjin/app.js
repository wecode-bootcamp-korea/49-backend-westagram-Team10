const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
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
    this.app.post('/users', async (req, res, next) => {
      try {
        const { email, name, profile_image, password } = req.body;
        await this.dataSource.query(
          `
            INSERT INTO users (email, name, profile_image, password) VALUES (?,?,?,?)
            `,
          [email, name, profile_image, password],
        );
        return res.status(201).json({ message: 'userCreated' });
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.get('/posts', async (_, res, next) => {
      try {
        await this.dataSource.query(
          `SELECT users.id, users.profile_image, users.name, posts.id AS post_id, posts.content
          FROM users
          LEFT JOIN posts ON users.id = posts.user_id
          `,
          (err, rows) => {
            return res.status(200).json({
              data: rows.map((row) => ({
                userId: row.id,
                userProfileImage: row.profile_image,
                postingId: row.post_id,
                postingContent: row.content,
              })),
            });
          },
        );
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.get('/posts/:id', async (req, res, next) => {
      try {
        const error = new Error();
        const { id } = req.params;
        if (id) {
          await this.dataSource.query(
            `SELECT users.id, users.name, users.profile_image, posts.id, posts.content
            FROM users  
            LEFT JOIN posts ON users.id = posts.user_id
            WHERE users.id = ${parseInt(id)}`,
            (err, rows) => {
              if (!rows.length) {
                error.message = 'key error';
                error.status = 400;
                throw error;
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
            },
          );
        }
        error.message = 'unAuthorized';
        error.status = 401;
        throw error;
      } catch (err) {
        next(err);
      }
    });
    this.app.post('/posts', async (req, res, next) => {
      try {
        const error = new Error();
        const { title, content } = req.body;
        const { id } = req.query;
        if (id) {
          await this.dataSource.query(
            `
            INSERT INTO posts (title, content, user_id) VALUES (?,?,?)
            `,
            [title, content, parseInt(id)],
          );
          return res.status(201).json({ message: 'post created' });
        }
        error.message = 'unAuthorized';
        error.status = 401;
        throw error;
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.patch('/posts', async (req, res, next) => {
      const error = new Error();
      try {
        const { content, post_id } = req.body;
        const { id } = req.query;
        if (id) {
          await this.dataSource.query(
            `
            UPDATE posts SET content="${content}" WHERE user_id=${parseInt(
              id,
            )} AND id=${post_id}
            `,
          );
          await this.dataSource.query(
            `SELECT users.id, users.name, posts.id AS post_id, posts.title, posts.content
            FROM users
            LEFT JOIN posts ON users.id = posts.user_id
            WHERE user_id = ${parseInt(id)} AND posts.id = ${post_id}
            `,
            (err, rows) => {
              return res.status(201).json({ data: rows });
            },
          );
        }
        error.message = 'unAuthorized';
        error.status = 401;
        throw error;
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
    this.app.delete('/posts', async (req, res, next) => {
      try {
        const error = new Error();
        const { post_id } = req.body;
        const { id } = req.query;
        if (id) {
          await this.dataSource.query(
            `DELETE FROM posts WHERE posts.id=${post_id} AND posts.user_id=${id}`,
          );
          return res.status(200).json({ message: 'post deleted' });
        }
        error.message = 'unAuthorized';
        error.status = 401;
        throw error;
      } catch (err) {
        console.error(err);
        next(err);
      }
    });
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
      return res.json({ error: `${err.status} ${err.message}` });
    });
  }
}

const app = new App().app;
app.listen(app.get('port'), () => {
  console.log(`listening.... 🦻http://localhost:${app.get('port')}`);
});
