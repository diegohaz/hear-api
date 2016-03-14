'use strict';

import app from '../..';
import vcr from 'nock-vcr-recorder';
import * as factory from '../../config/factory';
import request from 'supertest-as-promised';
import Song from './song.model';
import SongService from './song.service';
import Artist from '../artist/artist.model';

describe('Song API', function() {
  var song, user, admin;

  before(function() {
    return factory.clean()
      .then(() => factory.sessions('user', 'admin'))
      .spread((u, a) => {
        user = u;
        admin = a;
      });
  });

  after(function() {
    return factory.clean();
  });

  describe('GET /songs', function() {

    before(function() {
      return factory.songs(
        ['Imagine', 'John Lennon'],
        ['Mother', 'John Lennon'],
        ['Woman', 'John Lennon']
      );
    });

    it('should respond with array', function() {
      return request(app)
        .get('/songs')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond to pagination with array', function() {
      return request(app)
        .get('/songs')
        .query({page: 2, per_page: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Mother');
        });
    });

    it('should respond to query search with array', function() {
      return request(app)
        .get('/songs')
        .query({q: 'woma'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should respond to sort with array', function() {
      return request(app)
        .get('/songs')
        .query({sort: '-title'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should fail 400 to page out of range', function() {
      return request(app)
        .get('/songs')
        .query({page: 31})
        .expect(400);
    });

    it('should fail 400 to per_page out of range', function() {
      return request(app)
        .get('/songs')
        .query({per_page: 101})
        .expect(400);
    });

  });

  describe('GET /songs/search', function() {
    SongService.allServices().forEach(function(service) {

      it('should respond with array when authenticated to ' + service, function() {
        return vcr.useCassette(`Song API/${this.test.parent.title}/${this.test.title}`, function() {
          user.user.service = service;
          return user.user.save().then(user => {
            return request(app)
              .get('/songs/search')
              .query({access_token: user.token, q: 'Anitta', per_page: 5})
              .expect(200)
              .then(res => {
                res.body.should.be.instanceOf(Array).and.have.lengthOf(5);
                res.body.should.all.have.property('title');
              })
          });
        });
      });

    });
  });

  SongService.allServices().forEach(function(service) {
    describe('GET /songs/search?service=' + service, function() {

      it('should respond to query search with array', function() {
        return vcr.useCassette(`Song API/${this.test.parent.title}/${this.test.title}`, function() {
          return request(app)
            .get('/songs/search')
            .query({q: 'Imagine', per_page: 5, service: service})
            .expect(200)
            .then(res => {
              res.body.should.be.instanceOf(Array).and.have.lengthOf(5);
              res.body.should.all.have.property('title');
            });
        });
      });

    });
  });

  describe('POST /songs', function() {
    var artist;

    before(function() {
      return factory.artist('Anitta').then(a => artist = a);
    });

    it('should respond with the created song when authenticated as admin', function() {
      return request(app)
        .post('/songs')
        .send({access_token: admin.token, title: 'Bang', artist: artist})
        .expect(201)
        .then(res => {
          song = res.body;
          song.should.have.property('title', 'Bang');
        });
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .post('/songs')
        .send({access_token: user.token, title: 'Bang', artist: artist})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/songs')
        .send({title: 'Bang', artist: artist})
        .expect(401);
    });

  });

  describe('GET /songs/:id', function() {

    it('should respond with a song', function() {
      return request(app)
        .get('/songs/' + song.songId)
        .expect(200)
        .then(res => res.body.should.have.property('songId', song.songId));
    });

    it('should fail 404 when song does not exist', function() {
      return request(app)
        .get('/songs/123456789098765432123456')
        .expect(404);
    });

  });

  describe('PUT /songs/:id', function() {

    it('should respond with the updated song when authenticated as admin', function() {
      return request(app)
        .put('/songs/' + song.songId)
        .send({access_token: admin.token, title: 'Woman'})
        .expect(200)
        .then(res => res.body.should.have.property('title', 'Woman'));
    });

    it('should fail 404 when song does not exist', function() {
      return request(app)
        .put('/songs/123456789098765432123456')
        .send({access_token: admin.token, title: 'Woman'})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .put('/songs/' + song.songId)
        .send({access_token: user.token, title: 'Woman'})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .put('/songs/' + song.songId)
        .send({title: 'Woman'})
        .expect(401);
    });

  });

  describe('DELETE /songs/:id', function() {

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/songs/' + song.songId)
        .send({access_token: admin.token})
        .expect(204);
    });

    it('should fail 404 when user does not exist', function() {
      return request(app)
        .delete('/songs/' + song.songId)
        .send({access_token: admin.token})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .delete('/songs/' + song.songId)
        .send({access_token: user.token})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/songs/' + song.songId)
        .expect(401);
    });

  });

});
