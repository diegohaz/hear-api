'use strict';

import bcrypt from 'bcrypt';
import randtoken from 'rand-token';
import mongoose from 'mongoose';
import mongooseKeywords from 'mongoose-keywords';
import {Schema} from 'mongoose';
import config from '../../config/environment';
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
    index: true,
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

UserSchema.path('email').set(function(email) {
  if (email === 'anonymous') {
    return randtoken.generate(16) + '@anonymous.com';
  } else {
    return email;
  }
});

UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();

  var rounds = config.env === 'test' ? 1 : 9;

  bcrypt.hash(this.password, rounds, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

UserSchema.post('remove', function(user) {
  if (config.env === 'test') return;
  user.postRemove();
});

UserSchema.methods.postRemove = function() {
  return Session.find({user: this}).exec().map(session => session.remove());
};

UserSchema.methods.view = function(full) {
  var view = {};
  var fields = ['id', 'name', 'pictureUrl'];

  if (full) {
    fields = fields.concat(['email', 'service', 'country', 'language', 'createdAt', 'removedSongs']);
  }

  fields.forEach(field => { view[field] = this[field] });

  return view;
};

UserSchema.methods.authenticate = function(password) {
  return compare(password, this.password).then(valid => {
    return valid ? this : false;
  });
};


UserSchema.statics.default = function(path) {
  return this.schema.path(path).default();
};

UserSchema.statics.roles = roles;

UserSchema.plugin(mongooseKeywords, {paths: ['email', 'name']});

export default mongoose.model('User', UserSchema);
