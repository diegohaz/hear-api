'use strict';

import bcrypt from 'bcrypt';
import randtoken from 'rand-token';
import mongoose from 'mongoose';
import {Schema} from 'mongoose';
import Session from '../session/session.model';

var compare = require('bluebird').promisify(bcrypt.compare);
var roles = ['user', 'admin'];

var UserSchema = new Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: roles,
    default: 'user'
  },
  pictureUrl: {
    type: String,
    trim: true
  },
  service: {
    type: String,
    default: 'itunes',
    lowercase: true
  },
  removedSongs: [{
    type: Schema.ObjectId,
    ref: 'Song'
  }],
  country: {
    type: String,
    default: 'BR',
    uppercase: true
  },
  language: {
    type: String,
    default: 'pt',
    lowercase: true
  },
  location: {
    type: [Number],
    index: '2d',
    sparse: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Allow anonymous registration
 */
UserSchema.path('email').set(function(email) {
  if (email === 'anonymous') {
    return randtoken.generate(16) + '@anonymous.com';
  } else {
    return email;
  }
});

/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();

  var rounds = process.env.NODE_ENV === 'test'? 1 : 9;

  bcrypt.hash(this.password, rounds, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

/**
 * Post-remove hook
 */
UserSchema.post('remove', function(user) {
  Session.find({user: user}).exec().map(session => {
    session.remove();
  });
});

/**
 * View
 */
UserSchema.methods.view = function(full) {
  var view = {};
  var fields = ['id', 'name', 'pictureUrl', 'role'];

  if (full) {
    fields = fields.concat(['email', 'service', 'country', 'language', 'createdAt']);
  }

  fields.forEach(field => { view[field] = this[field] });

  return view;
};

/**
 * Authenticate
 */
UserSchema.methods.authenticate = function(password) {
  return compare(password, this.password).then(valid => {
    return valid ? this : false;
  });
};

/**
 * roles
 */
UserSchema.statics.roles = roles;

export default mongoose.model('User', UserSchema);
