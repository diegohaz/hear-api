import app from './'
import mongoose from 'mongoose'

after((done) => {
  mongoose.connection.close()
  app.server.close()
  app.server.on('close', () => done())
})
