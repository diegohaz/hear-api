'use strict';

var app = require('../..');
import request from 'supertest';
import Artist from './artist.model';
import User from '../user/user.model';
import Session from '../session/session.model';

var artist;

describe('Artist API:', function() {
  var userSession, adminSession;

  before(function() {
    return User.remove().then(() => {
      return User.create({
        name: 'Fake Admin',
        email: 'admin@example.com',
        password: 'password',
        role: 'admin'
      });
    }).then(admin => {
      adminSession = new Session({user: admin});
      return adminSession.save();
    }).then(adminSession => {
      return User.create({
        name: 'Fake User',
        email: 'user@example.com',
        password: 'pass'
      });
    }).then(user => {
      userSession = new Session({user: user});
      return userSession.save();
    });
  });

  after(function() {
    return User.remove().then(() => Session.remove());
  });

  describe('GET /artists', function() {

    it('should respond with array', function(done) {
      request(app)
        .get('/artists')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          done();
        });
    });

    describe('GET /artists?options', function() {

      before(function() {
        var artists = ['Anitta', 'Michael Jackson', 'Shakira'].map(a => ({name: a}));
        return Artist.remove().then(() => Artist.create(artists));
      });

      after(function() {
        return Artist.remove();
      });

      it('should respond with pagination', function(done) {
        request(app)
          .get('/artists')
          .query({page: 2, per_page: 1})
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0].should.have.property('name', 'Michael Jackson');
            done();
        });
      });

      it('should respond with query search', function(done) {
        request(app)
          .get('/artists')
          .query({q: 'shak'})
          .expect(200)
          .end((err, res) => {
            if (err) done(err);
            res.body.should.be.instanceOf(Array).and.have.lengthOf(1);
            res.body[0].should.have.property('name', 'Shakira');
            done();
          });
      });
    });

  });

  describe('POST /artists', function() {

    it('should respond with the created artist when authenticated as admin', function(done) {
      request(app)
        .post('/artists')
        .send({access_token: adminSession.token, name: 'Shakira'})
        .expect(201)
        .end((err, res) => {
          if (err) done(err);
          artist = res.body;
          artist.should.have.property('id');
          done();
        });
    });

    it('should fail when authenticated as artist', function(done) {
      request(app)
        .post('/artists')
        .send({access_token: userSession.token, name: 'Shakira'})
        .expect(401)
        .end(done);
    });

    it('should fail when not authenticated', function(done) {
      request(app)
        .post('/artists')
        .send({name: 'Shakira'})
        .expect(401)
        .end(done);
    });

  });

  describe('GET /artists/:id', function() {

    it('should retrieve an artist', function(done) {
      request(app)
        .get('/artists/' + artist.id)
        .expect(200)
        .end((err, res) => {
          if (err) done(err);
          res.body.should.have.property('id', artist.id);
          done();
        });
    });

  });

  describe('PUT /artists/:id', function() {

    it('should respond with the updated artist when authenticated as admin', function(done) {
      request(app)
        .put('/artists/' + artist.id)
        .send({access_token: adminSession.token, name: 'Anitta'})
        .expect(200)
        .end((err, res) => {
          if (err) done(err);
          res.body.should.have.property('name', 'Anitta');
          done();
        });
    });

    it('should fail when authenticated as artist', function(done) {
      request(app)
        .put('/artists/' + artist.id)
        .send({access_token: userSession.token, name: 'Anitta'})
        .expect(401)
        .end(done);
    });

    it('should fail when not authenticated', function(done) {
      request(app)
        .put('/artists/' + artist.id)
        .send({name: 'Anitta'})
        .expect(401)
        .end(done);
    });

  });

  describe('DELETE /artists/:id', function() {

    it('should delete when authenticated as admin', function(done) {
      request(app)
        .delete('/artists/' + artist.id)
        .send({access_token: adminSession.token})
        .expect(204)
        .end(done);
    });

    it('should respond with 404 when user does not exist', function(done) {
      request(app)
        .delete('/artists/' + artist.id)
        .send({access_token: adminSession.token})
        .expect(404)
        .end(done);
    });

    it('should fail when authenticated as user', function(done) {
      request(app)
        .delete('/artists/' + artist.id)
        .send({access_token: userSession.token})
        .expect(401)
        .end(done);
    });

    it('should fail when not authenticated', function(done) {
      request(app)
        .delete('/artists/' + artist.id)
        .expect(401)
        .end(done);
    });

  });

});
