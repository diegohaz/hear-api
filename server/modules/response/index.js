'use strict'

import mongoose from 'mongoose'
import _ from 'lodash'

export function success (res, statusCode) {
  statusCode = statusCode || 200
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity)
    }
  }
}

export function error (res, statusCode) {
  return function (err) {
    if (err instanceof mongoose.Error) {
      statusCode = statusCode || 400
      var errors = err.errors
      var message = errors ? errors[_.keys(errors)[0]].message : err.message
      return res.status(statusCode).send(message)
    } else {
      statusCode = statusCode || 500
      res.status(statusCode).send(err.message)
      throw err
    }
  }
}

export function notFound (res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end()
      return null
    }
    return entity
  }
}
