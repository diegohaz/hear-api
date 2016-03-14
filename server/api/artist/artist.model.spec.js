'use strict';

import app from '../..';
import * as factory from '../../config/factory';
import Artist from './artist.model';
import Song from '../song/song.model';

describe('Artist Model:', function() {

  before(function() {
    return factory.clean();
  });

  afterEach(function() {
    return factory.clean();
  });

  it('should return a view', function() {
    return factory.artist('Anitta').then(artist => {
      var view = artist.view();
      view.should.have.property('id');
      view.should.have.property('name', 'Anitta');
    });
  });

  it('should combine artists with same name', function() {
    return factory.artists('Shakira', 'Shakira').then(artists => {
      artists.should.have.lengthOf(2);
      artists[0].should.have.property('id', artists[1].id);
    });
  });

  it('should remove artist songs after removing artist', function() {
    var artist;

    return factory.songs(
      ['Imagine', 'John Lennon'],
      ['Woman', 'John Lennon'],
      ['Yesterday', 'John Lennon']
    ).then(songs => {
      artist = songs[0].artist;
      songs.should.all.have.deep.property('artist.id', artist.id);
      return Song.find({artist: artist}).exec().should.eventually.have.lengthOf(3);
    }).then(() => {
      return artist.remove();
    }).then(artist => {
      return artist.postRemove();
    }).then(() => {
      return Song.find({}).exec().should.eventually.have.lengthOf(0);
    });
  });

});
