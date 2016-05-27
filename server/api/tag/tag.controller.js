'use strict'

import _ from 'lodash'
import {success, error, notFound} from '../../modules/response/'
import Tag from './tag.model'

// Gets a list of Tags
export function index ({querymen}, res) {
  const {query, select, cursor} = querymen

  return Tag
    .find(query, select, cursor)
    .then(tags => tags.map(t => t.view()))
    .then(success(res))
    .catch(error(res))
}

// Gets a single Tag from the DB
export function show ({params}, res) {
  return Tag
    .findById(params.id)
    .then(notFound(res))
    .then(tag => tag ? tag.view() : null)
    .then(success(res))
    .catch(error(res))
}

// Creates a new Tag in the DB
export function create ({body}, res) {
  return Tag
    .createUnique(body)
    .then(tag => tag.view())
    .then(success(res, 201))
    .catch(error(res))
}

// Updates an existing Tag in the DB
export function update ({body, params}, res) {
  if (body._id) delete body._id

  return Tag
    .findById(params.id)
    .then(notFound(res))
    .then(tag => tag ? _.merge(tag, body).save() : null)
    .then(tag => tag ? tag.view() : null)
    .then(success(res))
    .catch(error(res))
}

// Deletes a Tag from the DB
export function destroy ({params}, res) {
  return Tag
    .findById(params.id)
    .then(notFound(res))
    .then(tag => tag ? tag.remove() : null)
    .then(success(res, 204))
    .catch(error(res))
}
