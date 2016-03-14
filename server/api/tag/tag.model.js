'use strict';

import mongoose from 'mongoose';
import Song from '../song/song.model';

var TagSchema = new mongoose.Schema({
  title: {
    type: String,
    index: true,
    lowercase: true,
    trim: true,
    required: true
  }
});

TagSchema.post('remove', function(tag) {
  if (process.env.NODE_ENV === 'test') return;
  tag.postRemove();
});

TagSchema.methods.postRemove = function() {
  return Song.update({tags: this}, {$pull: {tags: this._id}}, {multi: true}).exec();
};

TagSchema.methods.view = function() {
  return {
    id: this.id,
    title: this.title
  };
};

TagSchema.statics.create = function(doc) {
  var Tag = mongoose.model('Tag');

  if (!Array.isArray(doc)) {
    doc = new Tag(doc);
    doc.title = doc.title.toLowerCase().trim();

    return doc.validate().then(() => {
      return Tag.findOneAndUpdate({title: doc.title}, {}, {upsert: true, new: true}).exec();
    });
  }

  var promises = doc.map(d => Tag.create(d));

  return Promise.all(promises);
};

export default mongoose.model('Tag', TagSchema);
