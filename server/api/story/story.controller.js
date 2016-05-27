'use strict'

import _ from 'lodash'
import {success, error, notFound} from '../../modules/response/'
import Story from './story.model'
import Song from '../song/song.model'

// Gets a list of Storys
export function index ({querymen}, res) {
  const {query, select, cursor} = querymen

  return Story
    .find(query, select, cursor)
    .deepPopulate('user song artist tags place')
    .then(places => places.map(s => s.view()))
    .then(success(res))
    .catch(error(res))
}

// Gets a single Story from the DB
export function show ({params, user}, res) {
  return Story
    .findById(params.id)
    .deepPopulate('user song artist tags place')
    .then(notFound(res))
    .then(story => story ? story.view(user) : null)
    .then(success(res))
    .catch(error(res))
}

// Creates a new Story in the DB
export function create ({body, user}, res) {
  if (body._id) delete body._id

  const {text, longitude, latitude, serviceId, service = user.service} = body

  if (!latitude || !longitude) {
    return res.status(400).send('Missing latitude/longitude')
  }

  const location = {coordinates: [longitude, latitude]}
  let promise

  if (serviceId) {
    promise = Song.createByServiceId(serviceId, service)
  } else {
    promise = Song.create(body)
  }

  return promise
    .then(song => song.populate('artist').execPopulate())
    .then(song => Story.create({location, song, user, text}))
    .then(story => story.deepPopulate('user song artist tags'))
    .then(story => story.view(user))
    .then(success(res, 201))
    .catch(error(res))
}

// Updates an existing Story in the DB
export function update ({body, params}, res) {
  if (body._id) delete body._id

  return Story
    .findById(params.id)
    .deepPopulate('user song artist tags place')
    .then(notFound(res))
    .then(story => story ? _.assign(story, body).save() : null)
    .then(story => story ? story.view(true) : null)
    .then(success(res))
    .catch(error(res))
}

// Deletes a Story from the DB
export function destroy ({params, user}, res) {
  return Story
    .findById(params.id)
    .then(notFound(res))
    .then(story => {
      if (story) {
        if (user.role === 'admin' || user.id === story.user) {
          return story.remove()
            .then(success(res, 204))
        } else {
          return error(res, 403)
        }
      }
    })
    .catch(error(res))
}
