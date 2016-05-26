'use strict'

import app from '../..'
import request from 'supertest-as-promised'
import * as factory from '../../config/factory'
import Artist from './artist.model'

describe('Artist API', function() {
  var artist, user, admin

  before(function() {
    return factory.clean()
      .then(() => factory.sessions('user', 'admin'))
      .spread((u, a) => {
        user = u
        admin = a
      })
  })

  describe('GET /artists', function() {

    before(function() {
      return factory.artists('Anitta', 'Michael Jackson', 'Shakira')
    })

    it('should respond with array', function() {
      return request(app)
        .get('/artists')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array))
    })

    it('should respond with array to pagination', function() {
      return request(app)
        .get('/artists')
        .query({page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(1)
          res.body[0].should.have.property('name', 'Michael Jackson')
        })
    })

    it('should respond with array to query search', function() {
      return request(app)
        .get('/artists')
        .query({q: 'shak'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(1)
          res.body[0].should.have.property('name', 'Shakira')
        })
    })

    it('should respond with array to sort', function() {
      return request(app)
        .get('/artists')
        .query({sort: '-name'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(3)
          res.body[0].should.have.property('name', 'Shakira')
        })
    })

    it('should respond with array to fields', function() {
      return request(app)
        .get('/artists')
        .query({fields: '-name'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).and.have.lengthOf(3)
          res.body.should.all.not.have.property('name')
        })
    })
  })

  describe('POST /artists', function() {

    it('should respond with the created artist when authenticated as admin', function() {
      return request(app)
        .post('/artists')
        .query({access_token: admin.token})
        .send({name: 'Shakira'})
        .expect(201)
        .then(res => {
          artist = res.body
          artist.should.have.property('name', 'Shakira')
        })
    })

    it('should fail 400 when missing parameter', function() {
      return request(app)
        .post('/artists')
        .query({access_token: admin.token})
        .expect(400)
    })

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .post('/artists')
        .query({access_token: user.token})
        .send({name: 'Shakira'})
        .expect(401)
    })

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/artists')
        .send({name: 'Shakira'})
        .expect(401)
    })

  })

  describe('GET /artists/:id', function() {

    it('should respond with an artist', function() {
      return request(app)
        .get('/artists/' + artist.id)
        .expect(200)
        .then(res => res.body.should.have.property('name', artist.name))
    })

    it('should fail 404 when artist does not exist', function() {
      return request(app)
        .get('/artists/123456789098765432123456')
        .expect(404)
    })

  })

  describe('PUT /artists/:id', function() {

    it('should respond with the updated artist when authenticated as admin', function() {
      return request(app)
        .put('/artists/' + artist.id)
        .query({access_token: admin.token})
        .send({name: 'Anitta'})
        .expect(200)
        .then(res => res.body.should.have.property('name', 'Anitta'))
    })

    it('should fail 400 when missing parameter', function() {
      return request(app)
        .put('/artists/' + artist.id)
        .query({access_token: admin.token})
        .send({name: ''})
        .expect(400)
    })

    it('should fail 404 when artist does not exist', function() {
      return request(app)
        .put('/artists/123456789098765432123456')
        .query({access_token: admin.token})
        .send({name: 'Anitta'})
        .expect(404)
    })

    it('should fail 401 when authenticated as user', function() {
      return request(app)
        .put('/artists/' + artist.id)
        .query({access_token: user.token})
        .send({name: 'Anitta'})
        .expect(401)
    })

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .put('/artists/' + artist.id)
        .send({name: 'Anitta'})
        .expect(401)
    })

  })

  describe('DELETE /artists/:id', function() {

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/artists/' + artist.id)
        .query({access_token: admin.token})
        .expect(204)
    })

    it('should fail 404 when artist does not exist', function() {
      return request(app)
        .delete('/artists/' + artist.id)
        .query({access_token: admin.token})
        .expect(404)
    })

    it('should fail when authenticated as user', function() {
      return request(app)
        .delete('/artists/' + artist.id)
        .query({access_token: user.token})
        .expect(401)
    })

    it('should fail when not authenticated', function() {
      return request(app)
        .delete('/artists/' + artist.id)
        .expect(401)
    })

  })

})
