'use strict';

import {Router} from 'express';
import menquery from 'menquery';
import * as controller from './tag.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/', menquery({sort: 'title'}), controller.index);

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
