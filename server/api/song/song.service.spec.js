'use strict';

import vcr from 'nock-vcr-recorder-mocha';
import Artist from '../artist/artist.model';
import Song from '../song/song.model';
import service from './song.service';

var ids = {
  itunes: '1044543493',
  spotify: '1Cml3fnCNLZUC1EEtkcgVb',
  deezer: '108075536'
};

vcr.describe('Song Service', function() {

  service().allServices.forEach(function(svc) {
    describe(svc, function() {

      it('should search for a song', function() {
        var options = {q: 'Anitta', limit: 5};
        return service(svc)
        .search(options)
        .should.be.eventually.instanceOf(Array);
      });

      it('should match a song', function() {
        var artist = new Artist({name: 'Anitta'});
        var song = new Song({artist: artist, title: 'Bang'});

        return service(svc)
        .match(song)
        .should.be.eventually.instanceOf(Object)
        .and.have.property('artist', 'Anitta');
      });

      it('should lookup for a song', function() {
        return service(svc)
        .lookup(ids[svc])
        .should.be.eventually.instanceOf(Object)
        .and.have.property('title', 'Bang');
      });

    });
  });

});