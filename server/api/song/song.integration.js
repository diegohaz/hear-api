'use strict';

import app from '../..';
import vcr from 'nock-vcr-recorder';
import * as factory from '../../config/factory';
import request from 'supertest-as-promised';
import Song from './song.model';
import SongService from './song.service';
import Artist from '../artist/artist.model';

describe('Song API', function() {
  var song, user, admin, ids = {};

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
    let tag1, tag2;

    before(function() {
      return factory.songs(
        ['Imagine', 'John Lennon'],
        ['Mother', 'John Lennon', 'folk'],
        ['Woman', 'John Lennon', '70s']
      ).spread((song1, song2, song3) => {
        tag1 = song2.tags[0];
        tag2 = song3.tags[0];
      });
    });

    it('should respond with array', function() {
      return request(app)
        .get('/songs')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond with array to query page', function() {
      return request(app)
        .get('/songs')
        .query({page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Mother');
        });
    });

    it('should respond with array to query tags', function() {
      return request(app)
        .get('/songs')
        .query({tags: tag1.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Mother');
        });
    });

    it('should respond with array to query multiple tags', function() {
      return request(app)
        .get('/songs')
        .query({tags: `${tag1.id}, ${tag2.id}`})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(2);
        });
    });

    it('should respond with array to query q tag', function() {
      return request(app)
        .get('/songs')
        .query({q: '70'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should respond with array to query q title', function() {
      return request(app)
        .get('/songs')
        .query({q: 'wo'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should respond with array to query q artist', function() {
      return request(app)
        .get('/songs')
        .query({q: 'lennon'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(3);
        });
    });

    it('should respond with array to query sort', function() {
      return request(app)
        .get('/songs')
        .query({sort: '-title'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should fail 400 to query page out of range', function() {
      return request(app)
        .get('/songs')
        .query({page: 31})
        .expect(400);
    });

    it('should fail 400 to query limit out of range', function() {
      return request(app)
        .get('/songs')
        .query({limit: 101})
        .expect(400);
    });

  });

  describe('GET /songs/search', function() {
    SongService.allServices().forEach(function(service) {

      it('should respond with array when authenticated to ' + service, function() {
        return vcr.useCassette(`Song API/${this.test.title}`, function() {
          user.user.service = service;
          return user.user.save().then(() => {
            return request(app)
              .get('/songs/search')
              .query({access_token: user.token, q: 'Anitta', limit: 5})
              .expect(200)
              .then(res => {
                res.body.should.be.instanceOf(Array).and.have.lengthOf(5);
                res.body.should.all.have.property('service', service);
                ids[service] = res.body[4].serviceId;
              })
          });
        });
      });

    });
  });

  SongService.allServices().forEach(function(service) {
    describe('GET /songs/search?service=' + service, function() {

      it('should respond with array to query q', function() {
        return vcr.useCassette(`Song API/${this.test.parent.title}/${this.test.title}`, function() {
          return request(app)
            .get('/songs/search')
            .query({q: 'Imagine', limit: 5, service: service})
            .expect(200)
            .then(res => {
              res.body.should.be.instanceOf(Array).and.have.lengthOf(5);
              res.body.should.all.have.property('service', service);
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

    SongService.allServices().forEach(function(service) {

      it('should respond with the created song by sending serviceId when authenticated to ' + service + ' as admin', function() {
        return vcr.useCassette(`Song API/${this.test.title}`, function() {
          admin.user.service = service;
          return admin.user.save().then(() => {
            return request(app)
              .post('/songs')
              .query({access_token: admin.token})
              .send({service: service, serviceId: ids[service]})
              .expect(201)
              .then(res => {
                res.body.should.have.property('service', service);
              })
          });
        });
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
        .get('/songs/' + song.id)
        .expect(200)
        .then(res => res.body.should.have.property('id', song.id));
    });

    it('should fail 404 when song does not exist', function() {
      return request(app)
        .get('/songs/123456789098765432123456')
        .expect(404);
    });

  });

  describe('PUT /songs/:id', function() {

    it('should respond with the updated song when update title authenticated as admin', function() {
      return request(app)
        .put('/songs/' + song.id)
        .send({access_token: admin.token, title: 'Woman'})
        .expect(200)
        .then(res => res.body.should.have.property('title', 'Woman'));
    });

    it('should respond with the updated song when update artist authenticated as admin', function() {
      return factory.artist('John Lennon').then(artist => {
        return request(app)
          .put('/songs/' + song.id)
          .send({access_token: admin.token, artist: artist})
          .expect(200)
      }).then(res => res.body.should.have.deep.property('artist.name', 'John Lennon'));
    });

    it('should fail 404 when song does not exist', function() {
      return request(app)
        .put('/songs/123456789098765432123456')
        .send({access_token: admin.token, title: 'Woman'})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .put('/songs/' + song.id)
        .send({access_token: user.token, title: 'Woman'})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .put('/songs/' + song.id)
        .send({title: 'Woman'})
        .expect(401);
    });

  });

  describe('DELETE /songs/:id', function() {

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/songs/' + song.id)
        .send({access_token: admin.token})
        .expect(204);
    });

    it('should fail 404 when user does not exist', function() {
      return request(app)
        .delete('/songs/' + song.id)
        .send({access_token: admin.token})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .delete('/songs/' + song.id)
        .send({access_token: user.token})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/songs/' + song.id)
        .expect(401);
    });

  });

});
