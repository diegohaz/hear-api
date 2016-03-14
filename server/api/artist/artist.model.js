'use strict';

import mongoose from 'mongoose';
import Promise from 'bluebird';
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
  if (process.env.NODE_ENV === 'test') return;
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

ArtistSchema.statics.create = function(doc) {
  var Artist = mongoose.model('Artist');

  if (!Array.isArray(doc)) {
    doc = new Artist(doc);
    return doc.validate().then(() => {
      return Artist.findOneAndUpdate({name: doc.name}, {}, {upsert: true, new: true}).exec();
    });
  }

  var promises = doc.map(d => Artist.create(d));

  return Promise.all(promises);
};

export default mongoose.model('Artist', ArtistSchema);
