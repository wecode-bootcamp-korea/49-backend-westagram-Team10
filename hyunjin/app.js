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
    this.app.get('/posts/:id', async (req, res) => {
      try {
        const { id } = req.params;
        console.log(id);
        if (id) {
          await this.dataSource.query(
            `SELECT users.id, users.name, users.profile_image,posts.id, posts.content
            FROM users  
            LEFT JOIN posts ON users.id = posts.user_id
            WHERE users.id = ${parseInt(id)}`,
            (err, rows) => {
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
        return res.status(401).json({ message: 'anAuthorized' });
      } catch (err) {
        console.error(err);
      }
    });
    this.app.post('/posts', async (req, res, next) => {
      try {
        const { title, content } = req.body;
        const { id } = req.query;
        if (id) {
          await this.dataSource.query(
            `
            INSERT INTO posts (title, content, user_id) VALUES (?,?,?)
            `,
            [title, content, parseInt(id)],
          );
          return res.status(201).json({ message: 'userCreated' });
        }
        return res.status(401).json({ message: 'anAuthorized' });
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
      res.json({ 'error code': err.status });
    });
  }
}

const app = new App().app;
app.listen(app.get('port'), () => {
  console.log(`listening.... 🦻http://localhost:${app.get('port')}`);
});
