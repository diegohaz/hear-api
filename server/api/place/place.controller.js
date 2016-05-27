'use strict'

import _ from 'lodash'
import {success, error, notFound} from '../../modules/response/'
import Place from './place.model'
import PlaceService from './place.service'

// Gets a list of Places
export function index ({querymen}, res) {
  const {query, select, cursor} = querymen

  return Place
    .find(query, select, cursor)
    .then(places => places.map(s => s.view()))
    .then(success(res))
    .catch(error(res))
}

// Gets a single Place from the DB
export function show ({params}, res) {
  return Place
    .findById(params.id)
    .deepPopulate('parent')
    .then(notFound(res))
    .then(place => place ? place.view(true) : null)
    .then(success(res))
    .catch(error(res))
}

// Lookup for a single Place in Service
export function lookup ({query}, res) {
  const {latitude, longitude} = query

  if (!latitude || !longitude) {
    return res.status(400).send('Missing latitude/longitude')
  }

  let ll = [latitude, longitude]

  return PlaceService
    .sublocality(...ll)
    .then(place => PlaceService.venue(...ll, place))
    .then(place => place.deepPopulate('parent'))
    .then(place => place.view(true))
    .then(success(res))
    .catch(error(res))
}

// Creates a new Place in the DB
export function create ({body}, res) {
  const {latitude, longitude} = body

  if (!latitude || !longitude) {
    return res.status(400).send('Missing latitude/longitude')
  }

  const location = body.location = [longitude, latitude]

  return PlaceService
    .sublocality(location[1], location[0])
    .tap(parent => { body.parent = parent.id })
    .then(() => Place.createUnique(body))
    .then(place => place.deepPopulate('parent'))
    .then(place => place.view(true))
    .then(success(res, 201))
    .catch(error(res))
}

// Updates an existing Place in the DB
export function update ({body, params}, res) {
  if (body._id) delete body._id

  return Place
    .findById(params.id)
    .deepPopulate('parent')
    .then(notFound(res))
    .then(place => place ? _.assign(place, body).save() : null)
    .then(place => place ? place.view(true) : null)
    .then(success(res))
    .catch(error(res))
}

// Deletes a Place from the DB
export function destroy ({params}, res) {
  return Place
    .findById(params.id)
    .then(notFound(res))
    .then(place => place ? place.remove() : null)
    .then(success(res, 204))
    .catch(error(res))
}
