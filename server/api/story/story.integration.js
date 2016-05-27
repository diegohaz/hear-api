'use strict'

import app from '../..'
import _ from 'lodash'
import vcr from 'nock-vcr-recorder'
import geolib from 'geolib'
import * as factory from '../../modules/factory'
import request from 'supertest-as-promised'
import Story from './story.model'
import SongService from '../song/song.service'

describe('Story API', function () {
  var story, user, admin

  before(function () {
    return factory.clean()
      .then(() => factory.sessions('user', 'admin'))
      .spread((u, a) => {
        user = u
        admin = a
      })
  })

  after(function () {
    return factory.clean()
  })

  describe('GET /stories', function () {
    let bang, imagine, author, list

    let verifyDistances = function (location, res) {
      res.body = res.body.map(item => {
        item.distance = geolib.getDistance(location, item.location)
        return item
      })

      for (var i = 0; i < res.body.length; i++) {
        let current = res.body[i]
        let next = res.body[i + 1]
        if (!next) break
        current.should.have.property('distance').below(next.distance)
      }
    }

    before(function () {
      let geoSample = () => [_.random(-89.9, 89.9), _.random(-89.9, 89.9)]

      return factory.songs(
        ['Bang', 'Anitta'],
        ['Imagine', 'John Lennon']
      ).tap(songs => {
        bang = songs[0]
        imagine = songs[1]
      }).each(song => {
        return Story.create(..._.times(5, i => ({
          song: song,
          user: admin.user,
          text: `I'm in love with ${song.title} ${i}`,
          location: {coordinates: geoSample()}
        })))
      }).then(() => {
        return factory.story('This is a unique story', [-22.03, -43.01], 'Ameno', 'ERA')
      }).then(story => {
        author = story.user
      })
    })

    it('should respond with array', function () {
      return request(app)
        .get('/stories')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array))
    })

    it.skip('should respond with array to query page', function () {
      return request(app)
        .get('/stories')
        .query({page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1)
          res.body[0].should.have.deep.property('text', 'I\'m in love with Imagine 4')
        })
    })

    it('should respond with array to query song', function () {
      return request(app)
        .get('/stories')
        .query({song: bang.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(5)
          res.body[0].should.have.deep.property('song.title', 'Bang')
        })
    })

    it('should respond with array to query multiple songs', function () {
      return request(app)
        .get('/stories')
        .query({song: `${bang.id}, ${imagine.id}`})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(10)
          res.body[0].should.have.deep.property('song.title', 'Imagine')
          res.body[5].should.have.deep.property('song.title', 'Bang')
        })
    })

    it('should respond with array to query user', function () {
      return request(app)
        .get('/stories')
        .query({user: author.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1)
          res.body[0].should.have.deep.property('song.title', 'Ameno')
        })
    })

    it('should respond with array to query multiple users', function () {
      return request(app)
        .get('/stories')
        .query({user: `${author.id}, ${admin.user.id}`})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(11)
        })
    })

    it('should respond with array to query q text', function () {
      return request(app)
        .get('/stories')
        .query({q: 'love'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(10)
        })
    })

    it('should respond with array to query location', function () {
      return request(app)
        .get('/stories')
        .query({near: '-22.03, -43.01'})
        .expect(200)
        .then(res => {
          list = res.body
          res.body.should.be.instanceOf(Array).with.lengthOf(11)
          verifyDistances({latitude: -22.03, longitude: -43.01}, res)
        })
    })

    it('should respond with array to query location q', function () {
      return request(app)
        .get('/stories')
        .query({near: '-22.03, -43.01', q: 'in love'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(10)
          verifyDistances({latitude: -22.03, longitude: -43.01}, res)
        })
    })

    it('should respond with array to query sort', function () {
      return request(app)
        .get('/stories')
        .query({sort: '+createdAt'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array)
          res.body[0].should.have.deep.property('song.title', 'Bang')
        })
    })

    it('should respond with array to fields', function () {
      return request(app)
        .get('/stories')
        .query({fields: '-song'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array)
          res.body.should.all.not.have.property('song')
        })
    })

    it('should fail 400 to query page out of range', function () {
      return request(app)
        .get('/stories')
        .query({page: 31})
        .expect(400)
    })

    it('should fail 400 to query limit out of range', function () {
      return request(app)
        .get('/stories')
        .query({limit: 101})
        .expect(400)
    })

  })

  describe('POST /stories', function () {
    let artist
    let ids = {
      itunes: '664709257',
      spotify: '28aUFtkMnJaqNQkLHR0weV',
      deezer: '108075540'
    }

    before(function () {
      return factory.artist('Anitta').then(a => artist = a)
    })

    it('should respond with the created story when authenticated as user', function () {
      return request(app)
        .post('/stories')
        .query({access_token: user.token})
        .send({latitude: -22.1, longitude: -43.1, text: 'Test', title: 'Bang', artist: artist})
        .expect(201)
        .then(res => {
          res.body.should.have.deep.property('song.title', 'Bang')
          story = res.body
        })
    })

    SongService.allServices().forEach(function (service) {

      it(`should respond with the created story by sending serviceId when authenticated to ${service} as user`, function () {
        return vcr.useCassette(`Story API/${this.test.title}`, function () {
          user.user.service = service
          return user.user.save().then(() => {
            return request(app)
              .post('/stories')
              .query({access_token: user.token})
              .send({
                text: 'Test',
                latitude: -22.1,
                longitude: -43.1,
                serviceId: ids[service]
              })
              .expect(201)
              .then(res => {
                res.body.should.have.deep.property('song.service', service)
              })
          })
        })
      })

      it(`should respond with the created story by sending serviceId and service ${service} when authenticated as user`, function () {
        return vcr.useCassette(`Story API/${this.test.title}`, function () {
          return request(app)
            .post('/stories')
            .query({access_token: user.token})
            .send({
              text: 'Test',
              latitude: -22.1,
              longitude: -43.1,
              service: service,
              serviceId: ids[service]
            })
            .expect(201)
            .then(res => {
              res.body.should.have.deep.property('song.service', service)
            })
        })
      })

    })

    it('should fail 400 when missing latitude/longitude', function () {
      return request(app)
        .post('/stories')
        .query({access_token: user.token})
        .send({title: 'Bang', artist: artist})
        .expect(400)
    })

    it('should fail 401 when not authenticated', function () {
      return request(app)
        .post('/stories')
        .send({latitude: -22.1, longitude: -43.1, title: 'Bang', artist: artist})
        .expect(401)
    })

  })

  describe('GET /stories/:id', function () {

    it('should respond with a story', function () {
      return request(app)
        .get('/stories/' + story.id)
        .expect(200)
        .then(res => res.body.should.have.property('id', story.id))
    })

    it('should fail 404 when story does not exist', function () {
      return request(app)
        .get('/stories/123456789098765432123456')
        .expect(404)
    })

  })

  describe('DELETE /stories/:id', function () {

    it('should delete when authenticated as admin', function () {
      return request(app)
        .delete('/stories/' + story.id)
        .send({access_token: admin.token})
        .expect(204)
    })

    it('should fail 404 when story does not exist', function () {
      return request(app)
        .delete('/stories/' + story.id)
        .send({access_token: admin.token})
        .expect(404)
    })

    it('should fail 401 when not authenticated', function () {
      return request(app)
        .delete('/stories/' + story.id)
        .expect(401)
    })

  })

})
