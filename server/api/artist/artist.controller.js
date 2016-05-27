'use strict'

import _ from 'lodash'
import * as response from '../../modules/response/'
import Artist from './artist.model'

// Gets a list of Artists
export function index ({querymen}, res) {
  const {query, select, cursor} = querymen

  return Artist
    .find(query, select, cursor)
    .then(artists => artists.map(t => t.view()))
    .then(response.success(res))
    .catch(response.error(res))
}

// Gets a single Artist from the DB
export function show ({params}, res) {
  return Artist
    .findById(params.id)
    .then(response.notFound(res))
    .then(artist => artist ? artist.view() : null)
    .then(response.success(res))
    .catch(response.error(res))
}

// Creates a new Artist in the DB
export function create ({body}, res) {
  return Artist
    .createUnique(body)
    .then(artist => artist.view())
    .then(response.success(res, 201))
    .catch(response.error(res))
}

// Updates an existing Artist in the DB
export function update ({body, params}, res) {
  if (body._id) delete body._id

  return Artist
    .findById(params.id)
    .then(response.notFound(res))
    .then(artist => artist ? _.assign(artist, body).save() : null)
    .then(artist => artist ? artist.view() : null)
    .then(response.success(res))
    .catch(response.error(res))
}

// Deletes a Artist from the DB
export function destroy ({params}, res) {
  return Artist
    .findById(params.id)
    .then(response.notFound(res))
    .then(artist => artist ? artist.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res))
}
