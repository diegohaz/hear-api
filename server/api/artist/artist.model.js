'use strict'

import mongoose from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import mongooseCreateUnique from 'mongoose-create-unique'
import {env} from '../../config'
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

ArtistSchema.post('remove', function (artist) {
  if (env === 'test') return
  artist.postRemove()
})

ArtistSchema.methods.postRemove = function () {
  return Song.find({artist: this}).exec().map(song => song.remove())
}

ArtistSchema.methods.view = function () {
  return {
    id: this.id,
    name: this.name
  }
}

ArtistSchema.plugin(mongooseKeywords, {paths: ['name']})
ArtistSchema.plugin(mongooseCreateUnique)

export default mongoose.model('Artist', ArtistSchema)
