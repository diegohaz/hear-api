'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import config from '../../config/environment';
import service from './place.service';

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var PlaceSchema = new mongoose.Schema({
  _id: String,
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  type: String,
  shortName: String,
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
    type: this.type,
    location : {
      latitude: this.location[1],
      longitude: this.location[0]
    },
    parent: this.parent && full ? this.parent.view(full) : undefined
  }
};

PlaceSchema.statics.create = function(doc) {
  var Place = mongoose.model('Place');

  if (!Array.isArray(doc)) {
    doc = new Place(doc);

    return doc.validate().then(() => {
      return Place.findByIdAndUpdate(doc._id, doc, {upsert: true, new: true}).exec();
    });
  }

  var promises = doc.map(d => Place.create(d));

  return Promise.all(promises);
};

PlaceSchema.plugin(deepPopulate, {
  rewrite: {
    parent: 'parent.parent.parent.parent'
  }
});

export default mongoose.model('Place', PlaceSchema);
