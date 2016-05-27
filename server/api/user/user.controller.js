'use strict'

import _ from 'lodash'
import {success, error, notFound} from '../../modules/response/'
import User from './user.model'

// Gets a list of Users
export function index ({querymen}, res) {
  const {query, select, cursor} = querymen

  return User
    .find(query, select, cursor)
    .then(users => users.map(t => t.view()))
    .then(success(res))
    .catch(error(res))
}

// Get single User
export function show ({params}, res, next) {
  return User
    .findById(params.id)
    .then(notFound(res))
    .then(user => user ? user.view() : null)
    .then(success(res))
    .catch(error(res))
}

// Get my info
export function me ({user}, res, next) {
  res.json(user.view(true))
}

// Creates a new User in the DB
export function create ({body}, res) {
  return User
    .create(body)
    .then(user => user.view(true))
    .then(success(res, 201))
    .catch(error(res))
}

// Updates an existing User in the DB
export function update (req, res) {
  if (req.body._id) delete req.body._id
  if (req.body.role) delete req.body.role
  if (req.body.createdAt) delete req.body.createdAt
  if (req.body.updatedAt) delete req.body.updatedAt

  return User
    .findById(req.params.id)
    .then(notFound(res))
    .then(user => {
      if (req.user.role !== 'admin' && req.user.id !== user.id) {
        res.status(401).end()
      } else if (req.user.role === 'admin' && req.body.password) {
        res.status(400).end()
      } else return user
    })
    .then(user => user ? _.merge(user, req.body).save() : null)
    .then(user => user ? user.view(true) : null)
    .then(success(res))
    .catch(error(res))
}

// Deletes a User from the DB
export function destroy ({params}, res) {
  return User
    .findById(params.id)
    .then(notFound(res))
    .then(user => user ? user.remove() : null)
    .then(success(res, 204))
    .catch(error(res))
}
