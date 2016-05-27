'use strict'

import * as response from '../../modules/response/'
import Session from './session.model'

// Gets a list of Sessions
export function index (req, res) {
  let query = req.querymen

  return Session
    .find(query.query, null, query.cursor)
    .populate('user')
    .then(sessions => sessions.map(s => s.view()))
    .then(response.success(res))
    .catch(response.error(res))
}

// Creates a new Session in the DB
export function create (req, res) {
  return Session
    .create({user: req.user})
    .then(session => session.view(true))
    .then(response.success(res, 201))
    .catch(response.error(res))
}

// Deletes a Session from the DB
export function destroy (req, res) {
  if (req.params.token) {
    return Session
      .findOne({token: req.params.token})
      .then(response.notFound(res))
      .then(session => session ? session.remove() : null)
      .then(response.success(res, 204))
      .catch(response.error(res))
  } else {
    return Session
      .find({user: req.user})
      .then(sessions => sessions.map(s => s.remove()))
      .then(response.success(res, 204))
      .catch(response.error(res))
  }
}
