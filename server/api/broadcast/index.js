'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './broadcast.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  query({
    user: {id: true},
    tags: {id: true},
    artists: {paths: ['artist'], id: true},
    sort: '-createdAt'
  }),
  controller.index);

router.get('/:id', controller.show);

router.post('/',
  auth.bearer({required: true}),
  controller.create);

router.delete('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.destroy);

export default router;
