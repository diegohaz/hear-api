'use strict'

import mongoose from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import {env} from '../../config'
import User from '../user/user.model'
import PlaceService from '../place/place.service'

var deepPopulate = require('mongoose-deep-populate')(mongoose)

var BroadcastSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {type: String, enum: 'Point', default: 'Point'},
    coordinates: [Number]
  }
})

BroadcastSchema.index({location: '2dsphere'})

BroadcastSchema.post('save', function (broadcast) {
  if (env === 'test') return
  broadcast.postSave()
})

BroadcastSchema.methods.postSave = function () {
  if (this.place) return

  let Broadcast = mongoose.model('Broadcast')
  let ll = [this.location.coordinates[1], this.location.coordinates[0]]

  return PlaceService.sublocality(...ll)
    .then(place => PlaceService.venue(...ll, place))
    .then(place => {
      return Broadcast.findByIdAndUpdate(
        this._id,
        {$set: {place: place}},
        {new: true}
      ).exec()
    })
}

BroadcastSchema.methods.view = function ({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  const {id, song, user, place, createdAt, location} = this
  return {
    id,
    song: song ? song.view({service, country}) : undefined,
    user: user ? user.view() : undefined,
    place: place ? place.view(true) : place,
    createdAt,
    location: {
      latitude: location.coordinates[1],
      longitude: location.coordinates[0]
    }
  }
}

BroadcastSchema.statics.groupView = function (group, {
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  const {id, users, distance, total} = group
  const Broadcast = mongoose.model('Broadcast')
  const broadcast = new Broadcast(group)
  const view = broadcast.view({service, country})

  return {
    ...view,
    id,
    users: users ? users.map(u => new User(u).view()) : undefined,
    distance,
    total
  }
}

BroadcastSchema.statics.findAndGroup = function (location, query = {}, options = {}, items = []) {
  let Broadcast = mongoose.model('Broadcast')
  let aggregate = Broadcast.aggregate()
  let nearLimit = (options.limit || 30) * 10
  let group = {
    _id: '$song',
    id: {$first: '$_id'},
    song: {$first: '$song'},
    user: {$first: '$user'},
    place: {$first: '$place'},
    location: {$first: '$location'},
    createdAt: {$first: '$createdAt'},
    distance: {$first: '$distance'},
    users: {$addToSet: '$user'},
    total: {$sum: 1}
  }

  if (location.latitude && location.longitude) {
    aggregate.near({
      near: {type: 'Point', coordinates: [+location.longitude, +location.latitude]},
      spherical: true,
      distanceField: 'distance',
      limit: nearLimit,
      minDistance: options.min_distance || 0,
      query: query
    })
    options.sort = {'distance': 1}
    options.skip = 0
  } else {
    aggregate.match(query)
    options.sort = options.sort || {createdAt: -1}
  }

  return aggregate
    .group(group)
    .sort(options.sort)
    .skip(options.skip || 0)
    .limit(options.limit || 30)
    .exec()
    .then(aggr => Broadcast.deepPopulate(aggr, 'song user artist tags users place'))
    .then(aggr => Broadcast.populate(aggr, {path: 'users', model: User}))
    .then(aggr => {
      if (!location.latitude || !aggr.length) return items.concat(aggr)
      let total = aggr.reduce((total, curr) => total + curr.total, 0)
      aggr = items.concat(aggr).slice(0, options.limit)

      if (total >= nearLimit) {
        query.song = query.song || {$nin: []}
        query.song.$nin = query.song.$nin.concat(aggr.map(a => a.song._id))
        options.min_distance = aggr[aggr.length - 1].distance + 0.0001
        return Broadcast.findAndGroup(location, query, options, aggr)
      } else {
        return aggr
      }
    })
}

BroadcastSchema.plugin(mongooseKeywords, {paths: ['song', 'place']})
BroadcastSchema.plugin(deepPopulate, {
  rewrite: {
    artist: 'song.artist',
    tags: 'song.tags',
    place: 'place.parent.parent.parent.parent'
  }
})

export default mongoose.model('Broadcast', BroadcastSchema)
