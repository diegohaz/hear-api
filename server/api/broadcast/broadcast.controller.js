'use strict';

import _ from 'lodash';
import * as response from '../../modules/response/';
import Broadcast from './broadcast.model';
import User from '../user/user.model';

// Gets a list of Broadcasts
export function index(req, res) {
  return Broadcast
    .find(req.search, null, req.options)
    .populate('artist tags')
    .then(broadcasts => broadcasts.map(s => s.view()))
    .then(response.success(res))
    .catch(response.error(res));
}

// Search for broadcasts in service
export function search(req, res) {
  let service = req.query.service || (req.user ? req.user.service : User.default('service'));
  req.options.q = req.query.q;

  return BroadcastService
    .search(req.options, service)
    .then(response.success(res))
    .catch(response.error(res));
}

// Gets a single Broadcast from the DB
export function show(req, res) {
  return Broadcast
    .findById(req.params.id)
    .populate('artist tags')
    .then(response.notFound(res))
    .then(broadcast => broadcast ? broadcast.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Creates a new Broadcast in the DB
export function create(req, res) {
  return Broadcast
    .create(req.body)
    .then(broadcast => Broadcast.populate(broadcast, 'artist tags'))
    .then(broadcast => broadcast.view())
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Updates an existing Broadcast in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;

  return Broadcast
    .findById(req.params.id)
    .populate('artist tags')
    .then(response.notFound(res))
    .then(broadcast => broadcast ? _.merge(broadcast, req.body).save() : null)
    .then(broadcast => broadcast ? broadcast.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Deletes a Broadcast from the DB
export function destroy(req, res) {
  return Broadcast
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(broadcast => broadcast ? broadcast.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res));
}
