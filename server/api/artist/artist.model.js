'use strict'

import mongoose from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import mongooseCreateUnique from 'mongoose-create-unique'
import Promise from 'bluebird'
import config from '../../config/environment'
import Song from '../song/song.model'

var ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    trim: true,
    required: true,
    unique: true
  }
})

ArtistSchema.post('remove', function(artist) {
  if (config.env === 'test') return
  artist.postRemove()
})

ArtistSchema.methods.postRemove = function() {
  return Song.find({artist: this}).exec().map(song => song.remove())
}

ArtistSchema.methods.view = function() {
  return {
    id: this.id,
    name: this.name
  }
}

ArtistSchema.plugin(mongooseKeywords, {paths: ['name']})
ArtistSchema.plugin(mongooseCreateUnique)

export default mongoose.model('Artist', ArtistSchema)
