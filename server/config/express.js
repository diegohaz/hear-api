/**
 * Express configuration
 */

'use strict';

import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import errorHandler from 'errorhandler';
import path from 'path';
import config from './environment';
import mongoose from 'mongoose';

export default function(app) {
  var env = app.get('env');

  if ('production' === env) {
    app.use(function(req, res, next) {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        res.redirect('https://' + req.headers.host + req.path);
      } else {
        return next();
      }
    });
  }

  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    next();
  });

  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  if ('production' === env || 'development' === env) {
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(errorHandler()); // Error handler - has to be last
  }
}
