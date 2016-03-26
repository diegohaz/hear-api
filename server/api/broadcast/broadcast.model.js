'use strict';

import mongoose from 'mongoose';
import config from '../../config/environment';
import User from '../user/user.model';
import PlaceService from '../place/place.service';

var deepPopulate = require('mongoose-deep-populate')(mongoose);

var BroadcastSchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.ObjectId,
    ref: 'Song',
    index: true,
    q: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    index: true
  },
  place: {
    type: String,
    ref: 'Place',
    index: true,
    q: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: [Number],
    index: '2d',
    required: true
  },
});

BroadcastSchema.post('save', function(broadcast) {
  if (config.env === 'test') return;
  broadcast.postSave();
});

BroadcastSchema.methods.postSave = function() {
  if (this.place) return;

  let Broadcast = mongoose.model('Broadcast');
  let ll = [this.location[1], this.location[0]];

  return PlaceService.sublocality(...ll)
    .then(place => PlaceService.venue(...ll, place))
    .then(place => {
      return Broadcast.findByIdAndUpdate(
        this._id,
        {$set: {place: place}},
        {new: true}
      ).exec();
    });
};

BroadcastSchema.methods.view = function({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  var view = {};

  view.id = this.id;
  view.song = this.song.view({service: service, country: country});
  view.user = this.user.view();
  view.place = this.place && this.place.view ? this.place.view(true) : this.place;
  view.createdAt = this.createdAt;
  view.location = {
    latitude: this.location[1],
    longitude: this.location[0]
  };

  return view;
};

BroadcastSchema.plugin(require('../../modules/query/q'));
BroadcastSchema.plugin(deepPopulate, {
  rewrite: {
    artist: 'song.artist',
    tags: 'song.tags',
    place: 'place.parent.parent.parent.parent'
  }
});

export default mongoose.model('Broadcast', BroadcastSchema);
