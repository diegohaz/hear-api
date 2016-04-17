'use strict';

import _ from 'lodash';
import * as response from '../../modules/response/';
import User from './user.model';

// Gets a list of Users
export function index(req, res) {
  return User
    .find(req.filter, null, req.options)
    .then(users => users.map(t => t.view()))
    .then(response.success(res))
    .catch(response.error(res));
}

// Get single User
export function show(req, res, next) {
  return User
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(user => user ? user.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Get my info
export function me(req, res, next) {
  res.json(req.user.view(true));
}

// Creates a new User in the DB
export function create(req, res) {
  return User
    .create(req.body)
    .then(user => user.view(true))
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Updates an existing User in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;
  if (req.body.role) delete req.body.role;
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;

  return User
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(user => {
      if (req.user.role !== 'admin' && req.user.id !== user.id) {
        res.status(401).end();
      } else if (req.user.role === 'admin' && req.body.password) {
        res.status(400).end();
      } else return user;
    })
    .then(user => user ? _.merge(user, req.body).save() : null)
    .then(user => user ? user.view(true) : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Deletes a User from the DB
export function destroy(req, res) {
  return User
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(user => user ? user.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res));
}
