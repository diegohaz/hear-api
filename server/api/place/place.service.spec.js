'use strict';

import vcr from 'nock-vcr-recorder-mocha';
import PlaceService from './place.service';
import Place from './place.model';

vcr.describe('Place Service', function() {
  let place;

  it('should lookup for a sublocality', function() {
    return PlaceService
      .sublocality(-22.9790625,-43.2345556)
      .then(sublocality => {
        place = sublocality;
        sublocality.should.have.property('name', 'Gávea');
      });
  });

  it('should lookup for a venue', function() {
    return PlaceService
      .venue(-22.9790625,-43.2345556, place)
      .then(venue => {
        venue.should.have.property('name').which.contains('PUC-Rio');
      });
  });

});
