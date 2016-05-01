'use strict';

import _ from 'lodash';
import Promise from 'bluebird';
import * as response from '../../modules/response/';
import Story from './story.model';
import Song from '../song/song.model';

// Gets a list of Storys
export function index(req, res) {
  let query = req.querymen;

  return Story
    .find(query.query, null, query.cursor)
    .deepPopulate('user song artist tags place')
    .then(places => places.map(s => s.view()))
    .then(response.success(res))
    .catch(response.error(res));
}

// Gets a single Story from the DB
export function show(req, res) {
  return Story
    .findById(req.params.id)
    .deepPopulate('user song artist tags place')
    .then(response.notFound(res))
    .then(story => story ? story.view(req.user) : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Creates a new Story in the DB
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
    .then(song => Story.create({
      location: location,
      song: song,
      user: req.user,
      text: req.body.text
    }))
    .then(story => story.deepPopulate('user song artist tags'))
    .then(story => story.view(req.user))
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Updates an existing Story in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;

  return Story
    .findById(req.params.id)
    .deepPopulate('user song artist tags place')
    .then(response.notFound(res))
    .then(story => story ? _.assign(story, req.body).save() : null)
    .then(story => story ? story.view(true) : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Deletes a Story from the DB
export function destroy(req, res) {
  return Story
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(story => {
      if (story) {
        if (req.user.role === 'admin' || req.user.id === story.user) {
          return story.remove()
            .then(response.success(res, 204));
        } else {
          return response.error(res, 403);
        }
      }
    })
    .catch(response.error(res));
}
