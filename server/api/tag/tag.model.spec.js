'use strict'

import app from '../../'
import * as factory from '../../config/factory'
import Tag from './tag.model'
import Artist from '../artist/artist.model'
import Song from '../song/song.model'

describe('Tag Model', function() {

  before(function() {
    return factory.clean()
  })

  it('should return a view', function() {
    return factory.tag('Rock').then(tag => {
      var view = tag.view()
      view.should.have.property('id')
      view.should.have.property('title', 'rock')
    })
  })

  it('should combine tags with same name', function() {
    return factory.tags('mundO ', ' Mundo  ').then(tags => {
      tags.should.have.lengthOf(2)
      tags[0].should.have.property('id', tags[1].id)
    })
  })

  it('should remove tag from songs after removing tag', function() {
    var tag

    return factory.songs(
      ['Bang', 'Anitta', 'Pop'],
      ['Waka Waka', 'Shakira', 'Pop'],
      ['Show das Poderosas', 'Anitta', 'Pop']
    ).then(songs => {
      tag = songs[0].tags[0]
      songs.should.all.have.deep.property('tags[0].id', tag.id)
      return Song.find({tags: tag}).exec().should.eventually.have.lengthOf(3)
    }).then(() => {
      return tag.remove()
    }).then(tag => {
      return tag.postRemove()
    }).then(() => {
      return Song.find({tags: tag}).exec().should.eventually.have.lengthOf(0)
    })
  })

})
