'use strict';

import request from 'request-promise';
import geolib from 'geolib';
import _ from 'lodash';
import config from '../../config/environment';
import Place from './place.model.js';

export default class PlaceService {

  static lookup(latitude, longitude) {
    let types = ['country', 'administrative_area_level_1', 'locality', 'sublocality'];

    return request({
      uri: 'https://maps.googleapis.com/maps/api/geocode/json',
      qs: {
        latlng: `${latitude},${longitude}`,
        key: config.gmapsKey
      }
    }).then(res => {
      let data = JSON.parse(res);

      if (data.status === 'OK') {
        let results = data.results.reverse();
        let places = [];
        let place, parent;

        types.forEach(type => {
          let result = _.find(results, result => ~result.types.indexOf(type));
          if (!result) return;

          let location = result.geometry.location;
          let ne = result.geometry.bounds.northeast;
          let sw = result.geometry.bounds.southwest;
          let radius = geolib.getDistance(
            {latitude: ne.lat, longitude: ne.lng},
            {latitude: sw.lat, longitude: sw.lng}
          )/2;

          place = new Place({
            _id: result.place_id,
            name: result.address_components[0].long_name.replace('State of ', ''),
            shortName: result.address_components[0].short_name,
            location: [location.lng, location.lat],
            radius: radius,
            type: type
          });

          if (parent) {
            place.parent = parent;
          }

          places.push(place);
          parent = place;
        });

        return Place.create(places);
      } else {
        throw new Error(data.status);
      }
    }).then(places => {
      return places[places.length - 1];
    });
  }

}
