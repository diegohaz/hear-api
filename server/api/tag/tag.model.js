'use strict'

import mongoose from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import mongooseCreateUnique from 'mongoose-create-unique'
import config from '../../config/environment'
import Song from '../song/song.model'

var TagSchema = new mongoose.Schema({
  title: {
    type: String,
    index: true,
    lowercase: true,
    trim: true,
    required: true,
    unique: true
  }
})

TagSchema.post('remove', function (tag) {
  if (config.env === 'test') return
  tag.postRemove()
})

TagSchema.methods.postRemove = function () {
  return Song.update({tags: this}, {$pull: {tags: this._id}}, {multi: true}).exec()
}

TagSchema.methods.view = function () {
  return {
    id: this.id,
    title: this.title
  }
}

TagSchema.plugin(mongooseKeywords, {paths: ['title']})
TagSchema.plugin(mongooseCreateUnique)

export default mongoose.model('Tag', TagSchema)
