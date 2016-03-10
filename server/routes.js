/**
 * Main application routes
 */

'use strict';

import path from 'path';

export default function(app) {
  // Insert routes below
  app.use('/artists', require('./api/artist'));
  app.use('/sessions', require('./api/session'));
  app.use('/users', require('./api/user'));

}
