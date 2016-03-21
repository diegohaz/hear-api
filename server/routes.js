/**
 * Main application routes
 */

'use strict';

import path from 'path';

export default function(app) {
  // Insert routes below
  app.use('/artists', require('./api/artist'));
  app.use('/broadcasts', require('./api/broadcast'));
  app.use('/places', require('./api/place'));
  app.use('/sessions', require('./api/session'));
  app.use('/songs', require('./api/song'));
  app.use('/tags', require('./api/tag'));
  app.use('/users', require('./api/user'));

}
