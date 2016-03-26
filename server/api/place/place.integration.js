'use strict';

import app from '../..';
import vcr from 'nock-vcr-recorder';
import * as factory from '../../config/factory';
import request from 'supertest-as-promised';
import Place from './place.model';
import PlaceService from './place.service';

describe('Place API', function() {
  var place, user, admin;

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

  describe('GET /places', function() {

    before(function() {
      return factory.places([37.757815,-122.5076406], [-22.9790625,-43.2345556]);
    });

    it('should respond with array when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token})
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond with array to query type when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token, type: 'sublocality'})
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array).with.lengthOf(1));
    });

    it('should respond with array to query page when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token, page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('name', 'California');
        });
    });

    it('should respond with array to query q name when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token, q: 'cali'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('name', 'California');
        });
    });

    it('should respond with array to query q short name when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token, q: 'us'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.property('name', 'United States');
        });
    });

    it('should respond with array to query location when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token, latitude: 36.578261, longitude: -119.6179324})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body[0].should.have.property('name', 'California');
        });
    });

    it('should respond with array to query sort when authenticated as user', function() {
      return request(app)
        .get('/places')
        .query({access_token: user.token, sort: '-name'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body[0].should.have.property('name', 'United States');
        });
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .get('/places')
        .expect(401);
    });

  });

  describe('POST /places', function() {

    it('should respond with the created place when authenticated as user', function() {
      return vcr.useCassette(`Place API/${this.test.title}`, function() {
        return request(app)
          .post('/places')
          .send({access_token: user.token, latitude: -22.9790625, longitude: -43.2345556})
          .expect(201)
          .then(res => {
            place = res.body;
            res.body.should.have.property('name').which.contains('Gávea');
          });
        });
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/places')
        .send({latitude: 37.757815, longitude: -122.5076406})
        .expect(401);
    });

  });

  describe('GET /places/:id', function() {

    it('should respond with a place', function() {
      return request(app)
        .get('/places/' + place.id)
        .expect(200)
        .then(res => res.body.should.have.deep.property('parent.parent').not.undefined);
    });

    it('should fail 404 when place does not exist', function() {
      return request(app)
        .get('/places/123456789098765432123456')
        .query({access_token: user.token})
        .expect(404);
    });

  });

  describe('PUT /places/:id', function() {

    it('should respond with the updated place when authenticated as admin', function() {
      return request(app)
        .put('/places/' + place.id)
        .send({access_token: admin.token, name: 'São Francisco'})
        .expect(200)
        .then(res => res.body.should.have.property('name', 'São Francisco'));
    });

    it('should fail 404 when place does not exist', function() {
      return request(app)
        .put('/places/123456789098765432123456')
        .send({access_token: admin.token, name: 'São Francisco'})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .put('/places/' + place.id)
        .send({access_token: user.token, name: 'São Francisco'})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .put('/places/' + place.id)
        .send({name: 'São Francisco'})
        .expect(401);
    });

  });

  describe('DELETE /places/:id', function() {

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/places/' + place.id)
        .send({access_token: admin.token})
        .expect(204);
    });

    it('should fail 404 when user does not exist', function() {
      return request(app)
        .delete('/places/' + place.id)
        .send({access_token: admin.token})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .delete('/places/' + place.id)
        .send({access_token: user.token})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/places/' + place.id)
        .expect(401);
    });

  });

});
