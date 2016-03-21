'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import User from '../user/user.model';

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var BroadcastSchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.ObjectId,
    ref: 'Song'
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  location: {
    type: [Number],
    index: '2d',
    required: true
  },
});

BroadcastSchema.methods.view = function({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  var view = {};

  view.id = this.id;
  view.user = this.user.view();
  view.song = this.song.view({service: service, country: country});

  return view;
};

BroadcastSchema.plugin(deepPopulate);

export default mongoose.model('Broadcast', BroadcastSchema);
