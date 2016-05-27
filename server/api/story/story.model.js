'use strict'

import mongoose, {Schema} from 'mongoose'
import {env} from '../../config'
import User from '../user/user.model'
import PlaceService from '../place/place.service'

var deepPopulate = require('mongoose-deep-populate')(mongoose)

var StorySchema = new Schema({
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
  }
})

StorySchema.index({text: 'text'})
StorySchema.index({location: '2dsphere'})

StorySchema.post('save', function (story) {
  if (env === 'test') return
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

StorySchema.methods.view = function ({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  const {id, song, user, place, text, createdAt, location} = this
  return {
    id,
    text,
    createdAt,
    song: song ? song.view({service, country}) : undefined,
    user: user ? user.view() : undefined,
    place: place ? place.view(true) : place,
    location: {
      latitude: location.coordinates[1],
      longitude: location.coordinates[0]
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
