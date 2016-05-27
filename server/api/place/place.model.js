'use strict'

import {uid} from 'rand-token'
import mongoose, {Schema} from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import mongooseCreateUnique from 'mongoose-create-unique'
import {env} from '../../config'

var PlaceSchema = new Schema({
  _id: {
    type: String,
    unique: true,
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
    index: true
  },
  shortName: {
    type: String
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
})

PlaceSchema.pre('save', function (next) {
  this.shortName = this.shortName || this.name
  this.fullName = this.fullName || this.name

  if (this.fullName !== this.name) return next()

  this.deepPopulate('parent').then(place => {
    let parent = this.parent

    while (parent) {
      this.fullName += ', '
      this.fullName += parent.type === 'country' ? parent.name : parent.shortName
      parent = parent.parent
    }

    next()
  }).catch(next)
})

PlaceSchema.post('remove', function (place) {
  if (env === 'test') return
  place.postRemove()
})

PlaceSchema.methods.postRemove = function () {
  let Place = mongoose.model('Place')

  return Place.update({parent: this}, {$unset: {parent: ''}}, {multi: true}).exec()
}

PlaceSchema.methods.view = function (full) {
  const {id, name, shortName, fullName, radius, type, location, parent} = this
  return {
    id,
    name,
    shortName,
    fullName,
    radius,
    type,
    location: location ? {
      latitude: location[1],
      longitude: location[0]
    } : undefined,
    parent: full && parent && parent.view ? parent.view(full) : parent
  }
}

PlaceSchema.plugin(mongooseKeywords, {paths: ['name', 'shortName']})
PlaceSchema.plugin(mongooseCreateUnique)
PlaceSchema.plugin(require('mongoose-deep-populate')(mongoose), {
  rewrite: {
    parent: 'parent.parent.parent.parent'
  }
})

export default mongoose.model('Place', PlaceSchema)
