'use strict';

import app from '../../';
import nock from 'nock';
import vcr from 'nock-vcr-recorder-mocha';
import Broadcast from './broadcast.model';
import * as factory from '../../config/factory';

describe('Broadcast Model', function() {
  var broadcast;

  before(function() {
    return factory.clean()
      .then(() => factory.broadcast('Imagine', 'John Lennon', 'Rock'))
      .then(br => br.deepPopulate('song artist tags user place'))
      .then(br => broadcast = br);
  });

  vcr.it('should fetch place after save', function() {
    return broadcast.postSave().then(broadcast => {
      broadcast.should.have.property('place').not.empty;
    });
  });

  it('should return a view', function() {
    var view = broadcast.view();
    view.should.have.property('id', broadcast.id);
  });

});
