'use strict';

import _ from 'lodash';
import Promise from 'bluebird';
import * as response from '../../modules/response/';
import Broadcast from './broadcast.model';
import Song from '../song/song.model';

// Gets a list of Broadcasts
export function index(req, res) {
  let promise = Promise.resolve();
  let query = req.query;
  let search = req.search;

  if (query.tags || query.artist) {
    let s = {};
    if (query.tags)   s.tags   = query.tags;
    if (query.artist) s.artist = query.artist;

    promise = Song.find(s, null, req.options).select('_id').lean().then(songs => {
      search.song = {$in: songs.map(s => s._id)};
    });
  }

  if (req.search.song) {
    req.search.song = {$nin: req.search.song.$in || req.search.song};
  }

  if (req.user && req.user.removedSongs.length) {
    if (req.search.song && req.search.song.$nin) {
      req.search.song.$nin = req.search.song.$nin.concat(req.user.removedSongs);
    } else if (req.search.song) {
      req.search.song = {$nin: req.user.removedSongs.concat(req.search.song)};
    } else {
      req.search.song = {$nin: req.user.removedSongs};
    }
  }

  if (query.service) {
    req.user = req.user || {};
    req.user.service = query.service;
  }

  return promise
    .then(() => Broadcast.findAndGroup(query, search, req.options))
    .then(groups => groups.map(g => Broadcast.groupView(g, req.user)))
    .then(response.success(res))
    .catch(response.error(res));
}

// Gets a single Broadcast from the DB
export function show(req, res) {
  return Broadcast
    .findById(req.params.id)
    .deepPopulate('user song artist tags place')
    .then(response.notFound(res))
    .then(broadcast => broadcast ? broadcast.view(req.user) : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Creates a new Broadcast in the DB
export function create(req, res) {
  if (req.body._id) delete req.body._id;
  if (!req.body.latitude || !req.body.longitude) {
    return res.status(400).send('Missing latitude/longitude');
  }

  let location = {coordinates: [req.body.longitude, req.body.latitude]};
  let service = req.body.service || req.user.service;
  let serviceId = req.body.serviceId;
  let promise;

  if (serviceId) {
    promise = Song.createByServiceId(serviceId, service);
  } else {
    promise = Song.create(req.body);
  }

  return promise
    .then(song => song.populate('artist').execPopulate())
    .then(song => Broadcast.create({location: location, song: song, user: req.user}))
    .then(broadcast => broadcast.deepPopulate('user song artist tags'))
    .then(broadcast => broadcast.view(req.user))
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Deletes a Broadcast from the DB
export function destroy(req, res) {
  return Broadcast
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(broadcast => {
      if (broadcast) {
        if (req.user.role === 'admin' || req.user.id === broadcast.user) {
          return broadcast.remove()
            .then(response.success(res, 204));
        } else {
          req.user.removedSongs.addToSet(broadcast.song);
          return req.user.save()
            .then(user => user.view(true))
            .then(response.success(res, 200));
        }
      }
    })
    .catch(response.error(res));
}
