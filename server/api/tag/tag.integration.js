'use strict';

import app from '../..';
import request from 'supertest-as-promised';
import * as factory from '../../config/factory';
import Tag from './tag.model';

describe('Tag API', function() {
  var tag, user, admin;

  before(function() {
    return factory.clean()
      .then(() => factory.sessions('user', 'admin'))
      .spread((u, a) => {
        user = u;
        admin = a;
      });
  });

  describe('GET /tags', function() {

    before(function() {
      return factory.tags('MBP', 'Pop', 'Rock');
    });

    it('should respond with array', function() {
      return request(app)
        .get('/tags')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond with array to query page', function() {
      return request(app)
        .get('/tags')
        .query({page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
          res.body[0].should.have.property('title', 'pop');
      });
    });

    it('should respond with array to query q', function() {
      return request(app)
        .get('/tags')
        .query({q: 'po'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
          res.body[0].should.have.property('title', 'pop');
        });
    });

    it('should respond with array to query sort', function() {
      return request(app)
        .get('/tags')
        .query({sort: '-title'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(3);
          res.body[0].should.have.property('title', 'rock');
        });
    });

    it('should respond with array to fields', function() {
      return request(app)
        .get('/tags')
        .query({fields: '-title'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body.should.all.not.have.property('title');
        });
    });
  });

  describe('POST /tags', function() {

    it('should respond with the created tag when authenticated as admin', function() {
      return request(app)
        .post('/tags')
        .send({access_token: admin.token, title: 'Pop'})
        .expect(201)
        .then(res => {
          tag = res.body;
          tag.should.have.property('title', 'pop');
        });
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .post('/tags')
        .send({access_token: user.token, title: 'Pop'})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/tags')
        .send({title: 'Pop'})
        .expect(401);
    });

  });

  describe('GET /tags/:id', function() {

    it('should respond with a tag', function() {
      return request(app)
        .get('/tags/' + tag.id)
        .expect(200)
        .then(res => res.body.should.have.property('id', tag.id));
    });

    it('should fail 404 when tag does not exist', function() {
      return request(app)
        .get('/tags/123456789098765432123456')
        .expect(404);
    });

  });

  describe('PUT /tags/:id', function() {

    it('should respond with the updated tag when authenticated as admin', function() {
      return request(app)
        .put('/tags/' + tag.id)
        .send({access_token: admin.token, title: 'Rock'})
        .expect(200)
        .then(res => res.body.should.have.property('title', 'rock'));
    });

    it('should fail 404 when tag does not exist', function() {
      return request(app)
        .put('/tags/123456789098765432123456')
        .send({access_token: admin.token, title: 'Rock'})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .put('/tags/' + tag.id)
        .send({access_token: user.token, title: 'Rock'})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .put('/tags/' + tag.id)
        .send({title: 'Rock'})
        .expect(401);
    });

  });

  describe('DELETE /tags/:id', function() {

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/tags/' + tag.id)
        .send({access_token: admin.token})
        .expect(204);
    });

    it('should fail 404 when tag does not exist', function() {
      return request(app)
        .delete('/tags/' + tag.id)
        .send({access_token: admin.token})
        .expect(404);
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .delete('/tags/' + tag.id)
        .send({access_token: user.token})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/tags/' + tag.id)
        .expect(401);
    });

  });

});
