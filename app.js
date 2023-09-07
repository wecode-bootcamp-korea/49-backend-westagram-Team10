const http = require('http')
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { DataSource } = require('typeorm');
const jwt = require('jsonwebtoken');
const { error } = require('console');

dotenv.config()

const myDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE
})

myDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!")
  })


const app = express()

app.use(cors())
app.use(express.json()) // for parsing application/json

app.get("/", async (req, res) => {
  try {
    return res.status(200).json({ "message": "Welcome to Soheon's server!" })
  } catch (err) {
    console.log(err)
  }
})

//1. API 로 users 화면에 보여주기!
app.get('/users', async (req, res) => {
  try {
    // Database Source 변수를 가져오고.
    // SELECT id, name, password FROM users;
    const userData = await myDataSource.query(`SELECT id, name, email FROM users`)

    // console 출력

    console.log("USER DATA :", userData)

    // FRONT 전달

    return res.status(200).json({
      "users": userData
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      "message": error.message
    })
  }
})

//과제 2. 회원가입하기 - users 생성

app.post('/user/signup', async (req, res) => {
  try {

    //1. user 정보를 frontend로부터 받는다.
    const me = req.body

    const { name, password, email } = me //구조분해할당

    //2. user 정보 console.log로 확인
    console.log("ME : ", me)

    //3. Error Handling

    // email, name, password가 다 입력되지 않은 경우
    if (email === undefined || name === undefined || password === undefined) {
      const error = new Error("KEY_ERROR")
      error.statusCode = 400
      throw error
    }

    // 비밀번호가 너무 짧을 때
    if (password.length < 8) {
      const error = new Error("INVALID_PASSWORD")
      error.statusCode = 400
      throw error
    }

    // 이메일이 중복되어 이미 가입한 경우
    // 1. 유저가 입력한 Email이 DB에 있는지 확인
    const existingUser = await myDataSource.query(`
       SELECT id, email FROM users WHERE email='${email}';
    `)

    console.log('existing user: ', existingUser)

    // 중복이면 if문 실행
    if (existingUser.length > 0) {
      const error = new Error("DUPLICATED_EMAIL_ADDRESS")
      error.statusCode = 400
      throw error
    }

     // (심화, 선택) 비밀번호에 특수문자 없을 때


      const userData = await myDataSource.query(`
      INSERT INTO users (
        name,
        password,
        email
      )
      VALUES (
        '${name}',
        '${password}',
        '${email}'
      )
    `)

    // 5. send response to FRONTEND
    return res.status(201).json({
      "message": "userCreated"
    })
  } catch (err) {
    console.log(err)
    return res.status(error.statusCode).json({
      "message": error.message
    })
  }
})

// 📟 로그인
app.post("/user/login", async (req, res) => {
  try {
    
    const email = req.body.email
    const password = req.body.password
    // { email, password } = req.body
    
    // email, password KEY_ERROR 확인
    if (email === undefined || password === undefined) {
      const error = new Error("KEY_ERROR")
      error.statusCode = 400
      throw error
    }

    // Email 가진 사람 있는지 확인
    const existingUser = await myDataSource.query(`
       SELECT id, email FROM users WHERE email='${email}';
    `)

    console.log('existing user: ', existingUser)

    // 가입된 유저가 아니라면
    if (existingUser.length === 0) {  //  = 는 대입 연산자
      const error = new Error("NON_EXIST_EMAIL_ADDRESS")
      error.statusCode = 400
      throw error
    }

    // Password 비교
    const passwordCheck = await myDataSource.query(`
       SELECT password FROM users WHERE email='${email}';
    `)

    console.log('passwordCheck : ', passwordCheck)

    if(password !== passwordCheck[0].password) {
      const error = new Error("INCORRECT_PASSPWORD")
      error.statusCode = 400
      throw error
    }

    // generate token
    // 1. use library allowing generating token
    // 2. {"id": 10} // 1hour
    // 3. signature
   // const token = jwt.sign({ id:30 }, 'secret_key')

    console.log("message : 로그인 성공");
    
    return res.status(200).json({
      "message": "LOGIN_SUCCESS"/*,
      "accessToken": token*/
    })

  } catch (error) {
    console.log(error)
    return res.status(error.statusCode).json({
      "message": error.message
    })
  }
})

// 과제 3. 게시글 등록

app.post("/posts", async (req, res) => {
  try {

    // posts 정보를 frontend에서 받는다.
    const newPost = req.body

    // posts 정보 확인해보기
    console.log("newPost : ", newPost)

    // database 에 저장하기
    const title2 = newPost.title
    const content2 = newPost.content
    const user_id2 = newPost.user_id

    const postData = await myDataSource.query(`
      INSERT INTO posts (
        title,
        content,
        user_id
      )
      VALUES (
        '${title2}',
        '${content2}',
        '${user_id2}'
      )
    `)
    // db 저장 여부 확인
    console.log('inserted post id : ', postData.insertId)

    //send response to FRONTEND
    return res.status(201).json({
      "message": "postCreated"
    })
  } catch (err) {
    console.log(err)
  }
})

// 과제 4. 전체 게시글 조회
app.get('/posts', async (req, res) => {
  try {

    // 쿼리문으로 데이터베이스에서 가져오기
    const postData = await myDataSource.query(`SELECT * FROM posts`)

    // console로 확인
    console.log("postData : ", postData)

    // front 전달
    return res.status(201).json({
      "data": postData
    })
  } catch (err) {
    console.log(err)
  }
})

// 과제 5. 유저의 게시글 조회

/*app.get('/posts/:id', async(req, res) => {
  //엔드포인트를 사용하여 특정 사용자의 게시글을 조회하려면 URL의 경로 매개변수로 사용자 ID를 받아와야 합니다. 
  try {

    const userId = req.params.id; // URL에서 사용자 ID를 가져옵니다.
    
    const userPostData = await myDataSource.query(`
      SELECT 
        users.id as userId,
        users.profile_image,
        posts.id,
        posts.image_url,
        posts.content
      FROM users
      JOIN posts ON users.id = posts.user_id
      WHERE users.id = ${userId}
    `)
    // 쿼리문으로 데이터베이스에서 가져오기
    return res.status(201).json({
      "data" : userPostData
    })
  } catch (err) {
    console.log(err)
  }
})*/

// 과제 6. 게시글 수정하기

app.put('/posts/', async (req, res) => {

  try {

    return
  } catch (err) {
    console.log(err)
  }
})

// 과제 7. 게시글 삭제하기

// 과제 8. 좋아요 누르기



// ------------------------서버시작----------------------

const server = http.createServer(app) // express app 으로 서버를 만듭니다.

const start = async () => { // 서버를 시작하는 함수입니다.
  try {
    server.listen(8001, () => console.log(`Server is listening on 8001`))
  } catch (err) {
    console.error(err)
  }
}



start()