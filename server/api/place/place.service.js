'use strict';

import request from 'request-promise';
import geolib from 'geolib';
import _ from 'lodash';
import config from '../../config/environment';
import Place from './place.model.js';

export default class PlaceService {

  static sublocality(latitude, longitude, parent) {
    let types = ['country', 'administrative_area_level_1', 'locality', 'sublocality'];

    return request({
      uri: 'https://maps.googleapis.com/maps/api/geocode/json',
      qs: {
        latlng: `${latitude},${longitude}`,
        key: config.googlemapsKey
      }
    }).then(res => {
      let data = JSON.parse(res);

      if (data.status === 'OK') {
        let results = data.results.reverse();
        let places = [];
        let place;

        types.forEach(type => {
          let result = _.find(results, result => result.types.indexOf(type) !== -1);
          if (!result) return;

          let location = result.geometry.location;
          let ne = result.geometry.bounds.northeast;
          let sw = result.geometry.bounds.southwest;
          let radius = geolib.getDistance(
            {latitude: ne.lat, longitude: ne.lng},
            {latitude: sw.lat, longitude: sw.lng}
          ) / 2;

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

  static venue(latitude, longitude, parent, radius = 500) {
    return request({
      uri: 'https://api.foursquare.com/v2/venues/trending',
      qs: {
        client_id: config.foursquareId,
        client_secret: config.foursquareSecret,
        v: 20160315,
        m: 'swarm',
        ll: `${latitude},${longitude}`,
        radius: 500
      }
    }).then(res => {
      let data = JSON.parse(res);
      let exclude = ['City', 'County', 'Country', 'Neighborhood', 'State', 'Town', 'Village'];

      if (data.meta.code === 200) {
        let venues = _.filter(data.response.venues, venue => {
          return _.find(venue.categories, cat => exclude.indexOf(cat.name) === -1);
        });
        let venue = venues.length ? venues[0] : null;

        if (!venue) return parent;

        let place = new Place({
          _id: venue.id,
          name: venue.name,
          shortName: venue.name,
          location: [venue.location.lng, venue.location.lat],
          radius: 250,
          type: 'venue'
        });

        if (parent) {
          place.parent = parent;
        }

        return Place.create(place);
      } else {
        throw new Error(data.meta.code);
      }
    });
  }

}
