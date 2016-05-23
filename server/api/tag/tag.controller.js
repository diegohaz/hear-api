'use strict';

import _ from 'lodash';
import * as response from '../../modules/response/';
import Tag from './tag.model';

// Gets a list of Tags
export function index(req, res) {
  let query = req.querymen;

  return Tag
    .find(query.query, query.select, query.cursor)
    .then(tags => tags.map(t => t.view()))
    .then(response.success(res))
    .catch(response.error(res));
}

// Gets a single Tag from the DB
export function show(req, res) {
  return Tag
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(tag => tag ? tag.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Creates a new Tag in the DB
export function create(req, res) {
  return Tag
    .createUnique(req.body)
    .then(tag => tag.view())
    .then(response.success(res, 201))
    .catch(response.error(res));
}

// Updates an existing Tag in the DB
export function update(req, res) {
  if (req.body._id) delete req.body._id;

  return Tag
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(tag => tag ? _.merge(tag, req.body).save() : null)
    .then(tag => tag ? tag.view() : null)
    .then(response.success(res))
    .catch(response.error(res));
}

// Deletes a Tag from the DB
export function destroy(req, res) {
  return Tag
    .findById(req.params.id)
    .then(response.notFound(res))
    .then(tag => tag ? tag.remove() : null)
    .then(response.success(res, 204))
    .catch(response.error(res));
}
