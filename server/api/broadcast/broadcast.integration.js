'use strict';

import app from '../..';
import vcr from 'nock-vcr-recorder';
import * as factory from '../../config/factory';
import request from 'supertest-as-promised';
import Broadcast from './broadcast.model';
import Artist from '../artist/artist.model';

describe.skip('Broadcast API', function() {
  var broadcast, user, admin;

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

  describe('GET /broadcasts', function() {

    before(function() {
      return factory.broadcasts(
        ['Imagine', 'John Lennon'],
        ['Mother', 'John Lennon'],
        ['Woman', 'John Lennon', '70s']
      );
    });

    it('should respond with array', function() {
      return request(app)
        .get('/broadcasts')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond to pagination with array', function() {
      return request(app)
        .get('/broadcasts')
        .query({page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Mother');
        });
    });

    it('should respond to query tag with array', function() {
      return request(app)
        .get('/broadcasts')
        .query({tag: '70s'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should respond to query search tag with array', function() {
      return request(app)
        .get('/broadcasts')
        .query({q: '70'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should respond to query search with array', function() {
      return request(app)
        .get('/broadcasts')
        .query({q: 'wo'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should respond to sort with array', function() {
      return request(app)
        .get('/broadcasts')
        .query({order: 'desc'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body[0].should.have.property('title', 'Woman');
        });
    });

    it('should fail 400 to page out of range', function() {
      return request(app)
        .get('/broadcasts')
        .query({page: 31})
        .expect(400);
    });

    it('should fail 400 to limit out of range', function() {
      return request(app)
        .get('/broadcasts')
        .query({limit: 101})
        .expect(400);
    });

  });

  describe('POST /broadcasts', function() {
    var artist;

    before(function() {
      return factory.artist('Anitta').then(a => artist = a);
    });

    it('should respond with the created broadcast when authenticated as admin', function() {
      return request(app)
        .post('/broadcasts')
        .send({access_token: admin.token, title: 'Bang', artist: artist})
        .expect(201)
        .then(res => {
          broadcast = res.body;
          broadcast.should.have.property('title', 'Bang');
        });
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .post('/broadcasts')
        .send({access_token: user.token, title: 'Bang', artist: artist})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/broadcasts')
        .send({title: 'Bang', artist: artist})
        .expect(401);
    });

  });

  describe('GET /broadcasts/:id', function() {

    it('should respond with a broadcast', function() {
      return request(app)
        .get('/broadcasts/' + broadcast.broadcastId)
        .expect(200)
        .then(res => res.body.should.have.property('broadcastId', broadcast.broadcastId));
    });

    it('should fail 404 when broadcast does not exist', function() {
      return request(app)
        .get('/broadcasts/123456789098765432123456')
        .expect(404);
    });

  });

  describe('PUT /broadcasts/:id', function() {

    it('should respond with the updated broadcast when authenticated as admin', function() {
      return request(app)
        .put('/broadcasts/' + broadcast.broadcastId)
        .send({access_token: admin.token, title: 'Woman'})
        .expect(200)
        .then(res => res.body.should.have.property('title', 'Woman'));
    });

    it('should fail 404 when broadcast does not exist', function() {
      return request(app)
        .put('/broadcasts/123456789098765432123456')
        .send({access_token: admin.token, title: 'Woman'})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .put('/broadcasts/' + broadcast.broadcastId)
        .send({access_token: user.token, title: 'Woman'})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .put('/broadcasts/' + broadcast.broadcastId)
        .send({title: 'Woman'})
        .expect(401);
    });

  });

  describe('DELETE /broadcasts/:id', function() {

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.broadcastId)
        .send({access_token: admin.token})
        .expect(204);
    });

    it('should fail 404 when user does not exist', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.broadcastId)
        .send({access_token: admin.token})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.broadcastId)
        .send({access_token: user.token})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.broadcastId)
        .expect(401);
    });

  });

});
