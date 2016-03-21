'use strict';

import app from '../../';
import vcr from 'nock-vcr-recorder-mocha';
import Song from './song.model';
import Artist from '../artist/artist.model';

describe('Song Model', function() {
  var artist, song;

  before(function() {
    return Song.remove()
      .then(() => Artist.create({name: 'John Lennon'}))
      .tap(a => { artist = a })
      .then(artist => Song.create({title: 'Imagine', artist: artist}))
      .tap(s => { song = s });
  });

  after(function() {
    return Song.remove();
  });

  it('should return a view', function() {
    var view = song.view();
    view.should.have.property('id', song.id);
    view.should.have.property('title', song.title);
    view.should.have.deep.property('artist.name', artist.name);
  });

  vcr.it('should fetch info', function() {
    return song.fetchInfo('itunes')
      .should.eventually.have.deep.property('info.0.service', 'itunes');
  });

  vcr.it('should fetch tags', function() {
    return song.fetchTags()
      .should.eventually.have.deep.property('tags.0').not.empty;
  });

  vcr.it('should fetch info and update song', function() {
    return song.fetchAndUpdate().then(song => {
      song.should.have.property('info').with.lengthOf(3);
      song.should.have.property('tags').with.length.above(1);
    });
  });

});
