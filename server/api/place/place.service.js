'use strict'

import request from 'request-promise'
import geolib from 'geolib'
import _ from 'lodash'
import Promise from 'bluebird'
import config from '../../config/environment'
import Place from './place.model.js'

export default class PlaceService {

  static sublocality (latitude, longitude, parent) {
    let types = ['country', 'administrative_area_level_1', 'locality', 'sublocality']

    return request({
      uri: 'https://maps.googleapis.com/maps/api/geocode/json',
      qs: {
        latlng: `${latitude},${longitude}`,
        key: config.googlemapsKey
      }
    }).then(res => {
      let data = JSON.parse(res)

      if (data.status === 'OK') {
        let results = data.results.reverse()
        let places = []
        let place

        types.forEach(type => {
          let result = _.find(results, result => result.types.indexOf(type) !== -1)
          if (!result) return

          place = this._parsePlace(result, 'google')
          place.type = type

          if (parent) {
            place.parent = parent._id
          }

          parent = place
          places.push(place)
        })

        return Promise.each(places, (place, i) => {
          return Place.createUnique(place).tap(place => places[i] = place)
        }).return(places)
      } else {
        throw new Error(data.status)
      }
    }).then(places => {
      return places[places.length - 1]
    })
  }

  static venue (latitude, longitude, parent, radius = 500) {
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
      let data = JSON.parse(res)
      let exclude = ['City', 'County', 'Country', 'Neighborhood', 'State', 'Town', 'Village']

      if (data.meta.code === 200) {
        let venues = _.filter(data.response.venues, venue => {
          return _.find(venue.categories, cat => exclude.indexOf(cat.name) === -1)
        })

        if (!venues.length) return parent

        let venue = venues[0]
        let place = this._parsePlace(venue, 'foursquare')

        if (parent) {
          place.parent = parent._id
        }

        return Place.createUnique(place)
      } else {
        throw new Error(data.meta.code)
      }
    })
  }

  static _parsePlace (place, service) {
    if (service === 'google') {
      let location = place.geometry.location
      let ne = place.geometry.bounds.northeast
      let sw = place.geometry.bounds.southwest
      let radius = geolib.getDistance(
        {latitude: ne.lat, longitude: ne.lng},
        {latitude: sw.lat, longitude: sw.lng}
      ) / 2

      return {
        _id: place.place_id,
        name: place.address_components[0].long_name.replace('State of ', ''),
        shortName: place.address_components[0].short_name,
        location: [location.lng, location.lat],
        radius: radius
      }
    } else if (service === 'foursquare') {
      return {
        _id: place.id,
        name: place.name,
        shortName: place.name,
        location: [place.location.lng, place.location.lat],
        radius: 250,
        type: 'venue'
      }
    }
  }

}
