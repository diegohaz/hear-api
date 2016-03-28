'use strict';

import app from '../..';
import _ from 'lodash';
import vcr from 'nock-vcr-recorder';
import * as factory from '../../config/factory';
import request from 'supertest-as-promised';
import Broadcast from './broadcast.model';
import SongService from '../song/song.service';

describe('Broadcast API', function() {
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
    let bang, anitta, john, pop, folk, author, list;

    let verifyDistances = function(res) {
      for (var i = 0; i < res.body.length; i++) {
        let current = res.body[i];
        let next = res.body[i + 1];
        if (!next) break;
        current.should.have.property('distance').below(next.distance);
      }
    }

    before(function() {
      let geoSample = () => [_.random(-89.9, 89.9), _.random(-89.9, 89.9)];

      return factory.songs(
        ['Bang', 'Anitta', 'pop'],
        ['Meiga e Abusada', 'Anitta'],
        ['Mother', 'John Lennon', 'folk'],
        ['Woman', 'John Lennon', '70s'],
        ['MMMBop', 'Hanson', 'pop'],
        ['Survivor', 'Clarice Falcão'],
        ['In the End', 'Linkin Park']
      ).tap(songs => {
        bang = songs[0];
        anitta = songs[0].artist;
        john = songs[2].artist;
        pop = songs[0].tags[0];
        folk = songs[2].tags[0];
      }).each(song => {
        return Broadcast.create(..._.times(_.random(1,30), () => ({
          user: admin.user,
          location: {coordinates: geoSample()},
          song: song
        })));
      }).then(() => {
        return factory.broadcast([-22.0301,-43.01011], 'Ameno', 'ERA');
      }).then(broadcast => {
        author = broadcast.user;
        bang.info.push({service: 'deezer'});
        return bang.save();
      });
    });

    it('should respond with array', function() {
      return request(app)
        .get('/broadcasts')
        .expect(200)
        .then(res => res.body.should.be.instanceOf(Array));
    });

    it('should respond with array to query service', function() {
      return request(app)
        .get('/broadcasts')
        .query({service: 'deezer'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(8);
          res.body.should.contain.one.with.deep.property('song.service', 'deezer');
        });
    });

    it('should respond with array to query page', function() {
      return request(app)
        .get('/broadcasts')
        .query({page: 2, limit: 1})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.deep.property('song.title', 'In the End');
        });
    });

    it('should respond with array to query user', function() {
      return request(app)
        .get('/broadcasts')
        .query({user: author.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.deep.property('song.title', 'Ameno');
        });
    });

    it('should respond with array to query multiple users', function() {
      return request(app)
        .get('/broadcasts')
        .query({user: `${author.id}, ${admin.user.id}`})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(8);
        });
    });

    it('should respond with array to query tags', function() {
      return request(app)
        .get('/broadcasts')
        .query({tags: pop.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(2);
        });
    });

    it('should respond with array to query multiple tags', function() {
      return request(app)
        .get('/broadcasts')
        .query({tags: `${pop.id}, ${folk.id}`})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(3);
        });
    });

    it('should respond with array to query artists', function() {
      return request(app)
        .get('/broadcasts')
        .query({artists: anitta.id})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(2);
        });
    });

    it('should respond with array to query multiple artists', function() {
      return request(app)
        .get('/broadcasts')
        .query({artists: `${anitta.id}, ${john.id}`})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(4);
        });
    });

    it('should respond with array to query q tag', function() {
      return request(app)
        .get('/broadcasts')
        .query({q: '70'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.deep.property('song.title', 'Woman');
        });
    });

    it('should respond with array to query q title', function() {
      return request(app)
        .get('/broadcasts')
        .query({q: 'wo'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(1);
          res.body[0].should.have.deep.property('song.title', 'Woman');
        });
    });

    it('should respond with array to query q artist', function() {
      return request(app)
        .get('/broadcasts')
        .query({q: 'lennon'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(2);
        });
    });

    it('should respond with array to query location', function() {
      return request(app)
        .get('/broadcasts')
        .query({latitude: -22.03, longitude: -43.01})
        .expect(200)
        .then(res => {
          list = res.body;
          res.body.should.be.instanceOf(Array).with.lengthOf(8);
          res.body.should.all.have.property('distance').not.empty;
          verifyDistances(res);
        });
    });

    it('should respond with array to query location q', function() {
      return request(app)
        .get('/broadcasts')
        .query({latitude: -22.03, longitude: -43.01, q: 'john'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(2);
          verifyDistances(res);
        });
    });

    it('should respond with array to query location min_distance exclude', function() {

      return request(app)
        .get('/broadcasts')
        .query({
          latitude: -22.03,
          longitude: -43.01,
          limit: 3,
          min_distance: list[2].distance + 0.0001,
          exclude: list.slice(0, 3).map(b => b.song.id).join(',')
        })
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array).with.lengthOf(3);
          res.body[0].should.have.property('id', list[3].id);
          verifyDistances(res);
        });
    });

    it('should respond with array to query sort', function() {
      return request(app)
        .get('/broadcasts')
        .query({sort: '+createdAt'})
        .expect(200)
        .then(res => {
          res.body.should.be.instanceOf(Array);
          res.body[0].should.have.deep.property('song.title', 'Bang');
        });
    });

    it('should respond with array without removedSongs', function() {
      user.user.removedSongs.addToSet(bang.id);

      return user.user.save().then(() => {
        return request(app)
          .get('/broadcasts')
          .query({access_token: user.token})
          .expect(200)
      }).then(res => {
        res.body.should.be.instanceOf(Array).with.lengthOf(7);
        res.body.should.not.contain.something.with.deep.property('song.id', bang.id);
      });
    });

    it('should fail 400 to query page out of range', function() {
      return request(app)
        .get('/broadcasts')
        .query({page: 31})
        .expect(400);
    });

    it('should fail 400 to query limit out of range', function() {
      return request(app)
        .get('/broadcasts')
        .query({limit: 101})
        .expect(400);
    });

  });

  describe('POST /broadcasts', function() {
    let artist;
    let ids = {
      itunes: '664709257',
      spotify: '28aUFtkMnJaqNQkLHR0weV',
      deezer: '108075540'
    };

    before(function() {
      return factory.artist('Anitta').then(a => artist = a);
    });

    it('should respond with the created broadcast when authenticated as user', function() {
      return request(app)
        .post('/broadcasts')
        .query({access_token: user.token})
        .send({latitude: -22.1, longitude: -43.1, title: 'Bang', artist: artist})
        .expect(201)
        .then(res => {
          res.body.should.have.deep.property('song.title', 'Bang');
          broadcast = res.body;
        });
    });

    SongService.allServices().forEach(function(service) {

      it(`should respond with the created broadcast by sending serviceId when authenticated to ${service} as user`, function() {
        return vcr.useCassette(`Broadcast API/${this.test.title}`, function() {
          user.user.service = service;
          return user.user.save().then(() => {
            return request(app)
              .post('/broadcasts')
              .query({access_token: user.token})
              .send({
                latitude: -22.1,
                longitude: -43.1,
                serviceId: ids[service]
              })
              .expect(201)
              .then(res => {
                res.body.should.have.deep.property('song.service', service);
              })
          });
        });
      });

      it(`should respond with the created broadcast by sending serviceId and service ${service} when authenticated as user`, function() {
        return vcr.useCassette(`Broadcast API/${this.test.title}`, function() {
          return request(app)
            .post('/broadcasts')
            .query({access_token: user.token})
            .send({
              latitude: -22.1,
              longitude: -43.1,
              service: service,
              serviceId: ids[service]
            })
            .expect(201)
            .then(res => {
              res.body.should.have.deep.property('song.service', service);
            });
        });
      });

    });

    it('should fail 400 when missing latitude/longitude', function() {
      return request(app)
        .post('/broadcasts')
        .query({access_token: user.token})
        .send({title: 'Bang', artist: artist})
        .expect(400);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .post('/broadcasts')
        .send({latitude: -22.1, longitude: -43.1, title: 'Bang', artist: artist})
        .expect(401);
    });

  });

  describe('GET /broadcasts/:id', function() {

    it('should respond with a broadcast', function() {
      return request(app)
        .get('/broadcasts/' + broadcast.id)
        .expect(200)
        .then(res => res.body.should.have.property('id', broadcast.id));
    });

    it('should fail 404 when broadcast does not exist', function() {
      return request(app)
        .get('/broadcasts/123456789098765432123456')
        .expect(404);
    });

  });

  describe('DELETE /broadcasts/:id', function() {

    it('should add song to removedSongs when delete broadcast of another user authenticated as user', function() {
      return factory.session('user').then(session => {
        return request(app)
          .delete('/broadcasts/' + broadcast.id)
          .send({access_token: session.token})
          .expect(200);
      });

    });

    it('should delete when authenticated as admin', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.id)
        .send({access_token: admin.token})
        .expect(204);
    });

    it('should fail 404 when broadcast does not exist', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.id)
        .send({access_token: admin.token})
        .expect(404);
    });

    it('should fail 401 when not authenticated', function() {
      return request(app)
        .delete('/broadcasts/' + broadcast.id)
        .expect(401);
    });

  });

});
