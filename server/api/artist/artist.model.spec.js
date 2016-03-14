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

  it('should unify equal artists', function() {
    return factory.artists('Shakira', 'Shakira').then(artists => {
      artists.should.have.lengthOf(2);
      artists[0].should.have.property('id', artists[1].id);
    });
  });

  it('should remove artist songs after removing artist', function() {
    return factory.songs(
      ['Bang', 'John'],
      ['Meiga e Abusada', 'John'],
      ['Show das Poderosas', 'John']
    ).then(songs => {
      songs.should.all.have.deep.property('artist.id', songs[0].artist.id);
      return songs[0].artist.remove();
    }).then(artist => {
      return artist.postRemove();
    }).then(() => {
      return Song.find({}).exec().should.eventually.have.lengthOf(0);
    });
  });

});
