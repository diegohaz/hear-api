'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import config from '../../config/environment';

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var PlaceSchema = new mongoose.Schema({
  _id: String,
  type: String,
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
    q: true
  },
  shortName: {
    type: String,
    q: true
  },
  fullName: String,
  radius: Number,
  location: {
    type: [Number],
    index: '2d',
    required: true
  },
  parent: {
    type: String,
    ref: 'Place'
  }
});

PlaceSchema.pre('save', function(next) {
  if (!this.isModified('parent')) return next();

  let parent = this.parent;
  this.fullName = this.name;

  while (parent) {
    if (parent.type === 'country') {
      this.fullName += ', ' + parent.name;
    } else {
      this.fullName += ', ' + parent.shortName;
    }

    parent = parent.parent;
  }

  next();
});

PlaceSchema.post('remove', function(place) {
  if (config.env === 'test') return;
  place.postRemove();
});

PlaceSchema.methods.postRemove = function() {
  let Place = mongoose.model('Place');

  return Place.update({parent: this}, {$unset: {parent: ''}}, {multi: true}).exec();
};

PlaceSchema.methods.view = function(full) {
  return {
    id: this.id,
    name: this.name,
    shortName: this.shortName,
    fullName: this.fullName,
    type: this.type,
    location: {
      latitude: this.location[1],
      longitude: this.location[0]
    },
    parent: this.parent && full ? this.parent.view(full) : undefined
  }
};

PlaceSchema.plugin(require('../../modules/query/q'));
PlaceSchema.plugin(require('../../modules/combine/'), {path: '_id'});

PlaceSchema.plugin(deepPopulate, {
  rewrite: {
    parent: 'parent.parent.parent.parent'
  }
});

export default mongoose.model('Place', PlaceSchema);
