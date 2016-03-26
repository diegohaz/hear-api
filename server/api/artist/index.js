'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './artist.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  query(),
  controller.index);

router.get('/:id', controller.show);

router.post('/',
  auth.bearer({required: true, roles: ['admin']}),
  controller.create);

router.put('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.update);

router.patch('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.update);

router.delete('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.destroy);

export default router;
