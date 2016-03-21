'use strict';

import app from '../../';
import Broadcast from './broadcast.model';
import * as factory from '../../config/factory';

describe('Broadcast Model', function() {
  var broadcast;

  before(function() {
    return factory.clean()
      .then(() => factory.broadcast('Imagine', 'John Lennon', 'Rock'))
      .then(br => br.deepPopulate('song user song.artist song.tags'))
      .then(br => broadcast = br);
  });

  it('should return a view', function() {
    var view = broadcast.view();
    view.should.have.property('id', broadcast.id);
  });

});
