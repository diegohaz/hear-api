'use strict'

import Promise from 'bluebird'
import {success, error, notFound} from '../../modules/response/'
import Broadcast from './broadcast.model'
import Song from '../song/song.model'

// Gets a list of Broadcasts
export function index (req, res) {
  let promise = Promise.resolve()
  let query = req.querymen
  let search = query.search
  let filter = query.query

  if (search.tags || search.artist) {
    let s = {}
    if (search.tags) s.tags = search.tags
    if (search.artist) s.artist = search.artist

    promise = Song.find(s, {_id: 1}, query.cursor).lean().then(songs => {
      filter.song = {$in: songs.map(s => s._id)}
    })
  }

  if (req.user && req.user.removedSongs.length) {
    if (filter.song && filter.song.$nin) {
      filter.song.$nin = filter.song.$nin.concat(req.user.removedSongs)
    } else if (filter.song) {
      filter.song = {$nin: req.user.removedSongs.concat(filter.song)}
    } else {
      filter.song = {$nin: req.user.removedSongs}
    }
  }

  if (search.service) {
    req.user = req.user || {}
    req.user.service = search.service
  }

  return promise
    .then(() => Broadcast.findAndGroup(req.query, filter, query.cursor))
    .then(groups => groups.map(g => Broadcast.groupView(g, req.user)))
    .then(success(res))
    .catch(error(res))
}

// Gets a single Broadcast from the DB
export function show ({params, user}, res) {
  return Broadcast
    .findById(params.id)
    .deepPopulate('user song artist tags place')
    .then(notFound(res))
    .then(broadcast => broadcast ? broadcast.view(user) : null)
    .then(success(res))
    .catch(error(res))
}

// Creates a new Broadcast in the DB
export function create ({body, user}, res) {
  if (body._id) delete body._id

  const {longitude, latitude, serviceId, service = user.service} = body

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
    .then(song => Broadcast.create({location, song, user}))
    .then(broadcast => broadcast.deepPopulate('user song artist tags'))
    .then(broadcast => broadcast.view(user))
    .then(success(res, 201))
    .catch(error(res))
}

// Deletes a Broadcast from the DB
export function destroy ({params, user}, res) {
  return Broadcast
    .findById(params.id)
    .then(notFound(res))
    .then(broadcast => {
      if (broadcast) {
        if (user.role === 'admin' || user.id === broadcast.user) {
          return broadcast.remove()
            .then(success(res, 204))
        } else {
          user.removedSongs.addToSet(broadcast.song)
          return user.save()
            .then(user => user.view(true))
            .then(success(res, 200))
        }
      }
    })
    .catch(error(res))
}
