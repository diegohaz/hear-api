'use strict'

import _ from 'lodash'
import mongoose from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import Promise from 'bluebird'
import service from './song.service'
import User from '../user/user.model'
import Artist from '../artist/artist.model'
import Tag from '../tag/tag.model'
import config from '../../config/environment'

var SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  artist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Artist',
    required: true
  },
  tags: {
    type: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Tag'
    }],
    index: true
  },
  isrc: {
    type: String,
    uppercase: true,
    trim: true,
    maxlength: 12
  },
  info: [{
    service: {
      type: String,
      lowercase: true
    },
    id: String,
    previewUrl: String,
    url: String,
    images: {
      small: String,
      medium: String,
      big: String
    }
  }]
})

// ArtistSchema.post('remove', function(artist) {
//   if (config.env === 'test') return
//   artist.postRemove()
// })

// ArtistSchema.methods.postRemove = function() {
//   return Song.find({artist: this}).exec().map(song => song.remove())
// }

SongSchema.post('save', function(song) {
  if (config.env === 'test') return
  song.postSave()
})

SongSchema.methods.postSave = function() {
  let Song = mongoose.model('Song')

  return this.populate('artist').execPopulate()
    .then(song => service.allServices())
    .each(service => this.match(service))
    .then(song => this.tag())
    .then(song => {
      return Song.findByIdAndUpdate(
        this._id,
        {$set: {info: this.info, tags: this.tags}},
        {new: true}
      ).exec()
    })
}

SongSchema.methods.view = function({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  var view = {}
  var info = _.find(this.info, {service: service})

  view.id     = this.id
  view.title  = this.title
  view.artist = this.artist ? this.artist.view() : undefined
  view.isrc   = this.isrc
  view.tags   = this.tags ? this.tags.map(t => t.view()) : undefined

  if (info) {
    view.previewUrl = info.previewUrl
    view.images     = info.images
    view.service    = info.service
    view.serviceId  = info.id
    view.serviceUrl = info.url

    if (service === 'itunes') {
      view.serviceUrl.replace(/(apple\.com\/)[a-z]{2}/i, '$1' + country.toLowerCase())
    }
  }

  return view
}

SongSchema.methods.match = function(svc) {
  let info = _.find(this.info, {service: svc})
  if (info) return Promise.resolve(this)

  return service.match(this, svc).then(match => this.translate(match))
}

SongSchema.methods.tag = function() {
  if (this.tags.length) return Promise.resolve(this)

  return service.tag(this).each(tag => {
    return Tag.create({title: tag}).then(tag => {
      this.tags.push(tag)
    })
  }).return(this)
}

SongSchema.methods.translate = function(serviceSong) {
  let promise = Promise.resolve(this)

  this.title = this.title || serviceSong.title

  if (!this.artist) {
    promise = Artist.create({name: serviceSong.artist}).then(artist => {
      this.artist = artist
      return this
    })
  }

  if (!_.find(this.info, {service: serviceSong.service})) {
    let info = {}

    info.service    = serviceSong.service
    info.id         = serviceSong.serviceId
    info.previewUrl = serviceSong.previewUrl
    info.url        = serviceSong.serviceUrl
    info.images     = serviceSong.images

    this.info.push(info)
  }

  if (!this.isrc && serviceSong.isrc) {
    this.isrc = serviceSong.isrc
  }

  return promise
}

SongSchema.statics.createByServiceId = function(id, svc) {
  let Song = mongoose.model('Song')

  return Song.findOne({info: {$elemMatch: {service: svc, id: id}}}).then(song => {
    if (song) {
      return song
    } else {
      return service.lookup(id, svc).then(serviceSong => {
        let song = new Song()
        return song.translate(serviceSong)
      }).then(song => {
        return song.save()
      })
    }
  })
}

SongSchema.plugin(mongooseKeywords, {paths: ['title', 'artist', 'tags']})

export default mongoose.model('Song', SongSchema)
