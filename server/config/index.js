'use strict'

import path from 'path'
import _ from 'lodash'

const requireProcessEnv = (name) => {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}

const config = {
  all: {
    env: process.env.NODE_ENV || 'development',
    root: path.join(__dirname, '../../..'),
    port: process.env.PORT || 9000,
    ip: process.env.IP || '0.0.0.0',
    lastfmKey: requireProcessEnv('LASTFM_KEY'),
    googlemapsKey: requireProcessEnv('GOOGLEMAPS_KEY'),
    foursquareId: requireProcessEnv('FOURSQUARE_ID'),
    foursquareSecret: requireProcessEnv('FOURSQUARE_SECRET'),
    mongo: {
      options: {
        db: {
          safe: true
        }
      }
    }
  },
  test: {
    mongo: {
      uri: 'mongodb://localhost/hear-api-test'
    }
  },
  development: {
    mongo: {
      uri: 'mongodb://localhost/hear-api-dev'
    }
  },
  production: {
    ip: process.env.IP || undefined,
    port: process.env.PORT || 8080,
    mongo: {
      uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/hear-api'
    }
  }
}

export default _.merge(config.all, config[config.all.env])
