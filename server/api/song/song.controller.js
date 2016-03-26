'use strict';

import _ from 'lodash';
import * as response from '../../modules/response/';
import Song from './song.model';
import SongService from './song.service';
import User from '../user/user.model';

// Gets a list of Songs
export function index(req, res) {
  return Song
    .find(req.search, null, req.options)
    .populate('artist tags')
    .then(songs => songs.map(s => s.view(req.user)))
    .then(response.success(res))
    .catch(response.error(res));
}

// Search for songs in service
export function search(req, res) {
  let service = req.query.service || (req.user ? req.user.service : User.default('service'));
  req.options.q = req.query.q;

  return SongService
    .search(req.options, service)
    .then(response.success(res))
    .catch(response.error(res));
}

// Gets a single Song from the DB
export function show(req, res) {
  return Song
    .findById(req.params.id)
    .populate('artist tags')
    .then(response.notFound(res))
    .then(song => song ? song.view(req.user) : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Creates a new Song in the DB
export function create(req, res) {
  let service = req.body.service || (req.user ? req.user.service : User.default('service'));
  let serviceId = req.body.serviceId;
  let promise;

  if (serviceId) {
    promise = Song.createByServiceId(serviceId, service);
  } else {
    promise = Song.create(req.body);
  }

  return promise
    .then(song => song.populate('artist').execPopulate())
    .then(song => song.view(req.user))
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Updates an existing Song in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;

  return Song
    .findById(req.params.id)
    .populate('artist tags')
    .then(response.notFound(res))
    .then(song => song ? _.assign(song, req.body).save() : null)
    .then(song => song ? song.view(req.user) : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Deletes a Song from the DB
export function destroy(req, res) {
  return Song
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(song => song ? song.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res));
}
