'use strict';

import vcr from 'nock-vcr-recorder-mocha';
import * as factory from '../../config/factory';
import service from './tag.service';

describe('Tag Service', function() {
  var song;

  before(function() {
    return factory.clean()
      .then(() => factory.song())
      .then(so => song = so);
  });

  vcr.it('should retrieve tags for a song', function() {
    return service.reveal(song).should.eventually.be.instanceOf(Array);
  });

});