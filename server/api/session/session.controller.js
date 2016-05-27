'use strict'

import {success, error, notFound} from '../../modules/response/'
import Session from './session.model'

// Gets a list of Sessions
export function index ({querymen}, res) {
  const {query, cursor} = querymen

  return Session
    .find(query, null, cursor)
    .populate('user')
    .then(sessions => sessions.map(s => s.view()))
    .then(success(res))
    .catch(error(res))
}

// Creates a new Session in the DB
export function create ({user}, res) {
  return Session
    .create({user})
    .then(session => session.view(true))
    .then(success(res, 201))
    .catch(error(res))
}

// Deletes a Session from the DB
export function destroy ({params, user}, res) {
  if (params.token) {
    return Session
      .findOne({token: params.token})
      .then(notFound(res))
      .then(session => session ? session.remove() : null)
      .then(success(res, 204))
      .catch(error(res))
  } else {
    return Session
      .find({user: user})
      .then(sessions => sessions.map(s => s.remove()))
      .then(success(res, 204))
      .catch(error(res))
  }
}
