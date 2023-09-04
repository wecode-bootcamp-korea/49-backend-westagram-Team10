const http = require('http')
const express = require('express')
const dotenv = require('dotenv')
const { DataSource } = require('typeorm');

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

app.use(express.json()) // for parsing application/json

app.get("/", async(req, res) => {
  try {
    return res.status(200).json({"message": "Welcome to Soheon's server!"})
  } catch (err) {
    console.log(err)
  }
})

//1. API 로 users 화면에 보여주기!
app.get('/users', async(req, res) => {
	try {
    // query DB with SQL
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
	}
})

//과제 2. users 생성

app.post('/users', async(req, res) => {
  try {

    //1. user 정보를 frontend로부터 받는다.
    const me = req.body

    //2. user 정보 console.log로 확인
    console.log("ME : ", me)

    //3. DATABASE 정보 저장.
    const name2 = me.name
    const password2 = me.password
    const email2 = me.email

    const userData = await myDataSource.query(`
      INSERT INTO users (
        name,
        password,
        email
      )
      VALUES (
        '${name2}',
        '${password2}',
        '${email2}'
      )
    `)

    //4. DB data 저장 여부 확인
    // : insertId는 주로 데이터 삽입 작업에서만 사용되며, 데이터베이스 작업의 성공 여부나 삽입된 (단일)레코드의 고유 식별자를 가져오는 데 사용
    console.log('inserted user id : ', userData.insertId)

    // 5. send response to FRONTEND
		return res.status(201).json({
      "message": "userCreated" 
		})
	} catch (err) {
		console.log(err)
	}
})

// 과제 3. 게시글 등록

app.post("/posts", async(req, res) => {
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
    console.log('inserted post id : ', postData.insertId )

    //send response to FRONTEND
		return res.status(201).json({
      "message": "postCreated" 
		})
  } catch (err) {
    console.log(err)
  }
})

// 과제 4. 전체 게시글 조회
  app.get('/posts', async(req, res) => {
    try {

      // 쿼리문으로 데이터베이스에서 가져오기
      const postData = await myDataSource.query(`SELECT * FROM posts`)

      // console로 확인
      console.log("postData : ", postData)

      // front 전달
      return res.status(201).json({
        "data" : postData
      })
    } catch (err){
      console.log(err)
    }
  })

// 과제 5. 유저의 게시글 조회
app.get('/posts/{id}', async(req, res) => {
  try {

    const userPostData = await myDataSource.query(`
      SELECT 
        i
    `)
    // 쿼리문으로 데이터베이스에서 가져오기
    return res.status(201).json({
      "data" : userPostData
    })
  } catch (err) {
    console.log(err)
  }
})

// 과제 6. 게시글 수정하기

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