'use strict';

import app from '../..';
import * as factory from '../../config/factory';
import request from 'supertest-as-promised';
import Session from './session.model';

describe('Session API', function() {
  var session, anonymousSession, userSession, adminSession;

  before(function() {
    return factory.clean()
      .then(() => factory.sessions('user', 'admin'))
      .spread((u, a) => {
        userSession = u;
        adminSession = a;
      });
  });

  describe('GET /sessions', function() {

    it('should respond with array when authenticated as admin', function() {
      return request(app)
        .get('/sessions')
        .query({access_token: adminSession.token})
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond with array to query page when authenticated as admin', function() {
      return request(app)
        .get('/sessions')
        .query({access_token: adminSession.token, page: 2, limit: 1})
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array).and.have.lengthOf(1));
    });

    it('should respond with array to query q when authenticated as admin', function() {
      return request(app)
        .get('/sessions')
        .query({access_token: adminSession.token, q: 'anonymous'})
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array).and.have.lengthOf(2));
    });

    it('should respond with array to query user when authenticated as admin', function() {
      return request(app)
        .get('/sessions')
        .query({access_token: adminSession.token, user: userSession.user.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
          res.body[0].should.have.deep.property('user.id', userSession.user.id);
        });
    });

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .get('/sessions')
        .query({access_token: userSession.token})
        .expect(401);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .get('/sessions')
        .expect(401);
    });

  });

  describe('POST /sessions', function() {

    it('should respond with the created session', function() {
      return request(app)
        .post('/sessions')
        .auth('test@example.com', 'password')
        .expect(201)
        .then(res => {
          session = res.body;
          res.body.should.have.property('access_token');
        });
    });

    it('should respond with the logged session with registered user', function() {
      return request(app)
        .post('/sessions')
        .auth('test@example.com', 'password')
        .expect(201)
        .then(res => res.body.should.have.property('access_token'));
    });

    it('should respond with the created anonymous session', function() {
      return request(app)
        .post('/sessions')
        .auth('anonymous', 'password')
        .expect(201)
        .then(res => {
          anonymousSession = res.body;
          res.body.should.have.property('access_token');
        });
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/sessions')
        .expect(401);
    });

  });

  describe('DELETE /sessions', function() {

    it('should delete all sessions of the authenticated user', function() {
      return request(app)
        .delete('/sessions')
        .query({access_token: session.access_token})
        .expect(204);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/sessions')
        .expect(401);
    });

  });

  describe('DELETE /sessions/:token', function() {

    before(function() {
      return factory.session().then(s => session = s);
    });

    it('should not delete another user session when not authenticated', function() {
      return request(app)
        .delete('/sessions/' + adminSession.token)
        .expect(401);
    });

    it('should delete another user session when authenticated as admin', function() {
      return request(app)
        .delete('/sessions/' + session.token)
        .query({access_token: adminSession.token})
        .expect(204);
    });

    it('should fail 404 when session does not exit', function() {
      return request(app)
        .delete('/sessions/' + session.token)
        .query({access_token: adminSession.token})
        .expect(404);
    });

    it('should delete one session from current user when authenticated', function() {
      return request(app)
        .delete('/sessions/' + anonymousSession.access_token)
        .query({access_token: anonymousSession.access_token})
        .expect(204);
    });

  });

});
