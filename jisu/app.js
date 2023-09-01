const http = require('http');
const express = require('express');
const {DataSource} = require('typeorm');

const appDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'wltn1!',
  database: 'westagram'
});

appDataSource.initialize()
  .then(() => {
    console.log('Datasource inialized!');
  });

const app = express();

app.use(express.json());

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

app.get('/', getGreeting);
app.get('/users', getUsers);
app.post('/users', createUser);

const server = http.createServer(app);

const start = async () => {
  try {
    server.listen(8000, () => {console.log("server up and listening on 8000")});
  } catch (err) {
    console.log(err);
  }
};

start();

