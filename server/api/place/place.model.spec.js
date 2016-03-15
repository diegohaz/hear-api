'use strict';

import app from '../..';
import * as factory from '../../config/factory';
import Place from './place.model';

describe('Place Model', function() {
  var place;

  before(function() {
    return factory.clean()
      .then(() => factory.place([37.757815,-122.5076406]))
      .then(pl => pl.deepPopulate('parent'))
      .then(pl => place = pl);
  });

  it('should return full view', function() {
    var view = place.view(true);
    view.should.have.deep.property('parent.parent').not.undefined;
  });

  it('should combine places with same id', function() {
    return factory.place([37.757815,-122.5076406])
      .then(place => Place.find({}).should.eventually.have.lengthOf(3));
  });

  it('should remove parent from places after removing place', function() {
    let parent = place.parent;

    return Place.find({parent: parent}).exec().should.eventually.have.lengthOf(1)
      .then(() => parent.remove())
      .then(() => parent.postRemove())
      .then(() => Place.find({parent: parent}).exec().should.eventually.have.lengthOf(0));
  });

});
