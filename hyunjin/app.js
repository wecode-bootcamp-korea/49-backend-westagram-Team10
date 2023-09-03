const express = require('express')
const morgan = require('morgan')
require('dotenv').config()
const { DataSource } = require('typeorm')

class App {
    constructor() {
        this.app = express()
        this.dataSource
        this.setPort()
        this.setMiddleware()
        this.setTypeORM()
        this.useRouting()
        this.status404()
        this.errorHandler()
    }
    setPort() {
        this.app.set('port', process.env.PORT || 8000)
    }
    setMiddleware() {
        this.app.use(morgan('dev'))
        this.app.use(express.json())
        this.app.use(express.urlencoded({ extended: true }))
    }
    setTypeORM() {
        this.dataSource = new DataSource({
            type: process.env.TYPEORM_CONNECTION,
            host: process.env.TYPEORM_HOST,
            port: process.env.TYPEORM_PORT,
            username: process.env.TYPEORM_USERNAME,
            password: process.env.TYPEORM_PASSWORD,
            database: process.env.TYPEORM_DATABASE,
        })
        this.dataSource
            .initialize()
            .then(() => {
                console.log('Data Source has been initialized!')
            })
            .catch((err) => {
                console.error(err)
            })
    }
    useRouting() {}
    status404() {
        this.app.use((req, res, next) => {
            const error = new Error(
                `${req.method} ${req.url} 라우터가 없습니다.`
            )
            error.status = 404
            next(error)
        })
    }
    errorHandler() {
        this.app.use((err, req, res, next) => {
            res.locals.message = err.message
            res.locals.error = process.env.NODE_ENV !== 'production' ? err : {}
            res.status(err.status || 500)
            res.json({ 'error code': err.status })
        })
    }
}

const app = new App().app
app.listen(app.get('port'), () => {
    console.log(`listening.... 🦻http://localhost:${app.get('port')}`)
})
