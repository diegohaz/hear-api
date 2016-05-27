'use strict'

import express from 'express'
import mongoose from 'mongoose'
import bluebird from 'bluebird'
import http from 'http'
import morgan from 'morgan'
import compression from 'compression'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import errorHandler from 'errorhandler'
import cors from 'cors'
import httpsRedirect from 'express-https-redirect'

import {env, mongo, port, ip} from './config'
import routes from './routes'

const app = express()

if (env === 'production') {
  app.use(httpsRedirect())
}

app.use(cors())
app.use(compression())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(methodOverride())

if (env === 'production' || env === 'development') {
  app.use(morgan('dev'))
}

app.use(routes)

if (env === 'development' || env === 'test') {
  app.use(errorHandler())
}

mongoose.Promise = bluebird
mongoose.connect(mongo.uri, mongo.options)
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error: ' + err)
  process.exit(-1)
})

const server = http.createServer(app)

function startServer () {
  app.server = server.listen(port, ip, function () {
    console.log('Express server listening on %d, in %s mode', port, env)
  })
}

setImmediate(startServer)

export default app
