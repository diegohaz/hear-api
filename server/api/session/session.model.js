'use strict'

import mongoose, {Schema} from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import {uid} from 'rand-token'
import moment from 'moment'

var SessionSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    index: true
  },
  token: {
    type: String,
    unique: true,
    index: true,
    default: () => uid(32)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
})

SessionSchema.pre('save', function (next) {
  this.expiresAt = moment().add(1, 'years').toDate()
  next()
})

SessionSchema.methods.view = function (full) {
  return full ? {
    user: this.user.view(),
    access_token: this.token
  } : {
    user: this.user.view()
  }
}

SessionSchema.methods.expired = function () {
  return moment().isSameOrAfter(this.expiresAt)
}

SessionSchema.methods.updateExpirationTime = function (done) {
  return this.save(done)
}

SessionSchema.statics.login = function (token) {
  var Session = mongoose.model('Session')

  return Session.findOne({token}).populate('user').then(session => {
    if (!session) throw new Error('Invalid session')

    if (session.expired()) {
      session.remove()
      throw new Error('Session has expired')
    }

    session.updateExpirationTime()

    return session
  })
}

SessionSchema.plugin(mongooseKeywords, {paths: ['user']})

export default mongoose.model('Session', SessionSchema)
