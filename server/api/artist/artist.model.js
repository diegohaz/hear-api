'use strict';

import mongoose from 'mongoose';
import mongooseKeywords from 'mongoose-keywords';
import Promise from 'bluebird';
import config from '../../config/environment';
import Song from '../song/song.model';

var ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    trim: true,
    required: true
  }
});

ArtistSchema.post('remove', function(artist) {
  if (config.env === 'test') return;
  artist.postRemove();
});

ArtistSchema.methods.postRemove = function() {
  return Song.find({artist: this}).exec().map(song => song.remove());
};

ArtistSchema.methods.view = function() {
  return {
    id: this.id,
    name: this.name
  };
};

ArtistSchema.plugin(mongooseKeywords, {paths: ['name']});
ArtistSchema.plugin(require('../../modules/combine/'), {path: 'name'});

export default mongoose.model('Artist', ArtistSchema);
