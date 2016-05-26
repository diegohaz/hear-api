'use strict'

import app from '../../'
import vcr from 'nock-vcr-recorder-mocha'
import * as factory from '../../config/factory'
import Song from './song.model'
import SongService from './song.service'
import Artist from '../artist/artist.model'

describe('Song Model', function() {
  var song, ids = {}

  before(function() {
    return factory.clean()
      .then(() => factory.song('Imagine', 'John Lennon'))
      .then(so => song = so)
  })

  it('should return a view', function() {
    var view = song.view()
    view.should.have.property('id', song.id)
    view.should.have.property('title', song.title)
    view.should.have.deep.property('artist.name', song.artist.name)
  })

  vcr.it('should retrieve tags', function() {
    return song.tag().should.eventually.have.deep.property('tags.0').not.empty
  })

  SongService.allServices().forEach((service, i) => {
    vcr.it(`should match with service ${service}`, function() {
      return song.match(service).then(song => {
        song.should.have.deep.property(`info.${i}.service`, service)
        ids[service] = song.info[i].id
      })
    })

    vcr.it(`should create song with ${service} id`, function() {
      return Song.createByServiceId(ids[service], service)
        .should.eventually.have.property('id').not.eql(song.id)
    })
  })

  vcr.it('should fetch info and update song', function() {
    return song.postSave().then(song => {
      song.should.have.property('info').with.lengthOf(3)
      song.should.have.property('tags').with.length.above(1)
    })
  })

  SongService.allServices().forEach((service, i) => {
    it(`should not duplicate songs with same ${service} id`, function() {
      return Song.createByServiceId(ids[service], service)
        .should.eventually.have.property('id', song.id)
    })
  })

  vcr.it('should fetch and update info after save', function() {
    return factory.clean()
      .then(() => factory.song('Imagine', 'John Lennon'))
      .then(song => song.postSave())
      .should.eventually.have.property('info').with.lengthOf(3)
  })

})
