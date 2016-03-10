'use strict';

import _ from 'lodash';
import Artist from './artist.model';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Artists
export function index(req, res) {
  return Artist
    .find(req.search, null, req.options)
    .then(artists => artists.map(t => t.view()))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Artist from the DB
export function show(req, res) {
  return Artist
    .findById(req.params.id)
    .then(handleEntityNotFound(res))
    .then(artist => artist ? artist.view() : null)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Artist in the DB
export function create(req, res) {
  return Artist
    .create(req.body)
    .then(artist => artist.view())
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing Artist in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;

  return Artist
    .findById(req.params.id)
    .then(handleEntityNotFound(res))
    .then(artist => artist ? _.merge(artist, req.body).save() : null)
    .then(artist => artist ? artist.view() : null)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Artist from the DB
export function destroy(req, res) {
  return Artist
    .findById(req.params.id)
    .then(handleEntityNotFound(res))
    .then(artist => artist ? artist.remove() : null)
    .then(respondWithResult(res, 204))
    .catch(handleError(res));
}
