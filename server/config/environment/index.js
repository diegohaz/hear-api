'use strict'

var path = require('path')
var _ = require('lodash')

function requiredProcessEnv (name) {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  lastfmKey: requiredProcessEnv('LASTFM_KEY'),
  googlemapsKey: requiredProcessEnv('GOOGLEMAPS_KEY'),
  foursquareId: requiredProcessEnv('FOURSQUARE_ID'),
  foursquareSecret: requiredProcessEnv('FOURSQUARE_SECRET')
}

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {})
