'use strict';

import vcr from 'nock-vcr-recorder-mocha';
import PlaceService from './place.service';
import Place from './place.model';

vcr.describe('Place Service', function() {

  it('should lookup for a place', function() {
    return PlaceService
      .lookup(-22.9790625,-43.2345556)
      .should.eventually.have.property('name', 'Gávea');
  });

});
