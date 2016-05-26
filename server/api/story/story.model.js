'use strict'

import mongoose from 'mongoose'
import config from '../../config/environment'
import User from '../user/user.model'
import PlaceService from '../place/place.service'

var deepPopulate = require('mongoose-deep-populate')(mongoose)

var StorySchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.ObjectId,
    ref: 'Song',
    index: true,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  place: {
    type: String,
    ref: 'Place',
    index: true
  },
  text: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {type: String, enum: 'Point', default: 'Point'},
    coordinates: [Number]
  },
})

StorySchema.index({text: 'text'})
StorySchema.index({location: '2dsphere'})

StorySchema.post('save', function (story) {
  if (config.env === 'test') return
  story.postSave()
})

StorySchema.methods.postSave = function () {
  if (this.place) return

  let Story = mongoose.model('Story')
  let ll = [this.location.coordinates[1], this.location.coordinates[0]]

  return PlaceService.sublocality(...ll)
    .then(place => PlaceService.venue(...ll, place))
    .then(place => Story.findByIdAndUpdate(this._id, {$set: {place: place}}, {new: true}).exec())
}

StorySchema.methods.view = function({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  return {
    id: this.id,
    song: this.song ? this.song.view({service: service, country: country}) : undefined,
    user: this.user ? this.user.view() : undefined,
    place: this.place ? this.place.view(true) : this.place,
    text: this.text,
    createdAt: this.createdAt,
    location: {
      latitude: this.location.coordinates[1],
      longitude: this.location.coordinates[0]
    }
  }
}

StorySchema.plugin(deepPopulate, {
  rewrite: {
    artist: 'song.artist',
    tags: 'song.tags',
    place: 'place.parent.parent.parent.parent'
  }
})

export default mongoose.model('Story', StorySchema)
