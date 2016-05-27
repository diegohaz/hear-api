'use strict'

import _ from 'lodash'
import {success, error, notFound} from '../../modules/response/'
import Song from './song.model'
import SongService from './song.service'
import User from '../user/user.model'

// Gets a list of Songs
export function index ({user, querymen}, res) {
  const {query, select, cursor} = querymen

  return Song
    .find(query, select, cursor)
    .populate('artist tags')
    .then(songs => songs.map(s => s.view(user)))
    .then(success(res))
    .catch(error(res))
}

// Search for songs in service
export function search ({user, query, querymen}, res) {
  const {q, service = user && user.service || User.default('service')} = query
  const {cursor} = querymen

  return SongService
    .search({q, ...cursor}, service)
    .then(success(res))
    .catch(error(res))
}

// Gets a single Song from the DB
export function show ({params, user}, res) {
  return Song
    .findById(params.id)
    .populate('artist tags')
    .then(notFound(res))
    .then(song => song ? song.view(user) : null)
    .then(success(res))
    .catch(error(res))
}

// Creates a new Song in the DB
export function create ({user, body}, res) {
  const {serviceId, service = user && user.service || User.default('service')} = body
  let promise

  if (serviceId) {
    promise = Song.createByServiceId(serviceId, service)
  } else {
    promise = Song.create(body)
  }

  return promise
    .then(song => song.populate('artist').execPopulate())
    .then(song => song.view(user))
    .then(success(res, 201))
    .catch(error(res))
}

// Updates an existing Song in the DB
export function update ({body, params, user}, res) {
  if (body._id) delete body._id

  return Song
    .findById(params.id)
    .populate('artist tags')
    .then(notFound(res))
    .then(song => song ? _.assign(song, body).save() : null)
    .then(song => song ? song.view(user) : null)
    .then(success(res))
    .catch(error(res))
}

// Deletes a Song from the DB
export function destroy ({params}, res) {
  return Song
    .findById(params.id)
    .then(notFound(res))
    .then(song => song ? song.remove() : null)
    .then(success(res, 204))
    .catch(error(res))
}
