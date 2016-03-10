'use strict';

import mongoose from 'mongoose';

var ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    required: true
  }
});

ArtistSchema.methods.view = function() {
  return {
    id: this.id,
    name: this.name
  };
};

export default mongoose.model('Artist', ArtistSchema);
