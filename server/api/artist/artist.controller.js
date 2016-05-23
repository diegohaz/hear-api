'use strict';

import _ from 'lodash';
import * as response from '../../modules/response/';
import Artist from './artist.model';

// Gets a list of Artists
export function index(req, res) {
  let query = req.querymen;

  return Artist
    .find(query.query, query.select, query.cursor)
    .then(artists => artists.map(t => t.view()))
    .then(response.success(res))
    .catch(response.error(res));
}

// Gets a single Artist from the DB
export function show(req, res) {
  return Artist
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(artist => artist ? artist.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Creates a new Artist in the DB
export function create(req, res) {
  return Artist
    .create(req.body)
    .then(artist => artist.view())
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Updates an existing Artist in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;

  return Artist
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(artist => artist ? _.assign(artist, req.body).save() : null)
    .then(artist => artist ? artist.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Deletes a Artist from the DB
export function destroy(req, res) {
  return Artist
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(artist => artist ? artist.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res));
}
