'use strict'

import mongoose from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import {uid} from 'rand-token'
import moment from 'moment'
import {Schema} from 'mongoose'

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

SessionSchema.pre('save', function(next) {
  this.expiresAt = moment().add(1, 'years').toDate()
  next()
})

SessionSchema.methods.view = function(full) {
  if (full) return {
    user: this.user.view(),
    access_token: this.token
  }

  else return {
    user: this.user.view()
  }
}

SessionSchema.methods.expired = function() {
  return moment().isSameOrAfter(this.expiresAt)
}

SessionSchema.methods.updateExpirationTime = function(done) {
  return this.save(done)
}

SessionSchema.statics.login = function(token) {
  var Session = mongoose.model('Session')

  return Session.findOne({token: token}).populate('user').then(session => {
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
