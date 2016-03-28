'use strict';

import _ from 'lodash';
import {uid} from 'rand-token';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import config from '../../config/environment';

var PlaceSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uid(24)
  },
  type: {
    type: String,
    default: 'place',
    lowercase: true,
    trim: true
  },
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
  radius: {
    type: Number,
    default: 50
  },
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
  this.shortName = this.shortName || this.name;
  this.fullName = this.fullName || this.name;

  if (this.fullName !== this.name) return next();

  this.deepPopulate('parent').then(place => {
    let parent = this.parent;

    while (parent) {
      this.fullName += ', ';
      this.fullName += parent.type === 'country' ? parent.name : parent.shortName;
      parent = parent.parent;
    }

    next();
  }).catch(next);
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
    parent: full && this.parent && this.parent.view ?
            this.parent.view(full) :
            this.parent
  };
};

PlaceSchema.plugin(require('../../modules/query/q'));
PlaceSchema.plugin(require('../../modules/combine/'), {path: '_id'});
PlaceSchema.plugin(require('mongoose-deep-populate')(mongoose), {
  rewrite: {
    parent: 'parent.parent.parent.parent'
  }
});

export default mongoose.model('Place', PlaceSchema);
