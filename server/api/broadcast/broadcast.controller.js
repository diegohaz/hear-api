'use strict';

import _ from 'lodash';
import Promise from 'bluebird';
import * as response from '../../modules/response/';
import Broadcast from './broadcast.model';
import Song from '../song/song.model';

// Gets a list of Broadcasts
export function index(req, res) {
  let aggregations;
  let promise = Promise.resolve();
  let query = req.query;

  if (req.search.tags || req.search.artist) {
    let search = {};
    if (req.search.tags) {
      search.tags = req.search.tags;
      delete req.search.tags;
    }
    if (req.search.artist) {
      search.artist = req.search.artist;
      delete req.search.artist;
    }
    promise = Song
      .find(search, null, req.options)
      .select('_id')
      .lean()
      .then(songs => {
        req.search.song = {$in: songs.map(s => s._id)};
      });
  }

  return promise
    .then(() => {
      let aggregate = Broadcast.aggregate();

      if (query.latitude && query.longitude) {
        aggregate.near({
          near: [+query.longitude, +query.latitude],
          distanceField: 'distance',
          limit: req.options.limit * 100,
          query: req.search
        });
        req.options.sort = 'distance';
      } else {
        aggregate.match(req.search);
      }

      return aggregate.group({
        _id: '$song',
        id: {$first: '$_id'},
        song: {$first: '$song'},
        user: {$first: '$user'},
        place: {$first: '$place'},
        location: {$first: '$location'},
        createdAt: {$first: '$createdAt'},
        distance: {$first: '$distance'},
        total: {$sum: 1}
      })
      .sort(req.options.sort)
      .skip(req.options.skip)
      .limit(req.options.limit)
      .exec();
    })
    // .tap(console.log)
    .then(aggr => Broadcast.deepPopulate(aggr, 'user song artist tags place'))
    .tap(aggr => aggregations = aggr)
    // .tap(console.log)
    .then(aggr => aggr.map(a => new Broadcast(a)))
    // .tap(console.log)
    .then(broadcasts => broadcasts.map((b, i) => {
      let view = b.view(req.user);
      view.distance = aggregations[i].distance;
      view.total = aggregations[i].total;
      return view;
    }))
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

  let location = [req.body.longitude, req.body.latitude];
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
    .then(broadcast => broadcast ? broadcast.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res));
}
