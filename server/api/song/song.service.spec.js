'use strict';

import vcr from 'nock-vcr-recorder-mocha';
import * as factory from '../../config/factory';
import Song from './song.model';
import SongService from './song.service';

vcr.describe('Song Service', function() {
  var song, ids = {};

  before(function() {
    return factory.clean()
      .then(() => factory.artist('John Lennon'))
      .then(artist => Song.create({title: 'Imagine', artist: artist}))
      .then(so => song = so);
  });

  it('should retrieve tags for a song', function() {
    return SongService.tags(song).should.eventually.be.instanceOf(Array);
  });

  SongService.allServices().forEach(function(service) {
    describe(service, function() {

      it('should search for a song', function() {
        return SongService.search({q: 'John Lennon', limit: 5}, service).then(songs => {
          songs.should.have.lengthOf(5);
          songs.should.all.have.property('title');
          songs.should.all.have.property('artist');
        });
      });

      it('should match a song', function() {
        return SongService.match(song, service).then(match => {
          match.should.have.property('serviceId');
          match.should.have.property('title').contain('Imagine');
          match.should.have.property('artist').contain('John Lennon');
          ids[service] = match.serviceId;
        });
      });

      it('should lookup for a song', function() {
        return SongService.lookup(ids[service], service).then(song => {
          song.should.have.property('title').contain('Imagine');
          song.should.have.property('artist').contain('John Lennon');
        });
      });

    });
  });

});
