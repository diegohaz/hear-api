'use strict'

import _ from 'lodash'
import * as response from '../../modules/response/'
import Place from './place.model'
import PlaceService from './place.service'
import User from '../user/user.model'

// Gets a list of Places
export function index (req, res) {
  let query = req.querymen

  return Place
    .find(query.query, query.select, query.cursor)
    .then(places => places.map(s => s.view()))
    .then(response.success(res))
    .catch(response.error(res))
}

// Gets a single Place from the DB
export function show (req, res) {
  return Place
    .findById(req.params.id)
    .deepPopulate('parent')
    .then(response.notFound(res))
    .then(place => place ? place.view(true) : null)
    .then(response.success(res))
    .catch(response.error(res))
}

// Lookup for a single Place in Service
export function lookup (req, res) {
  if (!req.query.latitude || !req.query.longitude) {
    return res.status(400).send('Missing latitude/longitude')
  }

  let ll = [req.query.latitude, req.query.longitude]

  return PlaceService
    .sublocality(...ll)
    .then(place => PlaceService.venue(...ll, place))
    .then(place => place.deepPopulate('parent'))
    .then(place => place.view(true))
    .then(response.success(res))
    .catch(response.error(res))
}

// Creates a new Place in the DB
export function create (req, res) {
  if (!req.body.latitude || !req.body.longitude) {
    return res.status(400).send('Missing latitude/longitude')
  }

  let location = req.body.location = [req.body.longitude, req.body.latitude]

  return PlaceService
    .sublocality(location[1], location[0])
    .tap(parent => req.body.parent = parent.id)
    .then(() => Place.createUnique(req.body))
    .then(place => place.deepPopulate('parent'))
    .then(place => place.view(true))
    .then(response.success(res, 201))
    .catch(response.error(res))
}

// Updates an existing Place in the DB
export function update (req, res) {
  if (req.body._id) delete req.body._id

  return Place
    .findById(req.params.id)
    .deepPopulate('parent')
    .then(response.notFound(res))
    .then(place => place ? _.assign(place, req.body).save() : null)
    .then(place => place ? place.view(true) : null)
    .then(response.success(res))
    .catch(response.error(res))
}

// Deletes a Place from the DB
export function destroy (req, res) {
  return Place
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(place => place ? place.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res))
}
