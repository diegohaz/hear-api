'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './user.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer({required: true, roles: ['admin']}),
  query({
    q: {paths: {name: 'name', email: 'email'}},
    country: String,
    language: String,
    sort: 'createdAt',
    order: 'desc'
  }),
  controller.index);

router.get('/me', auth.bearer({required: true}), controller.me);
router.get('/:id', controller.show);

router.post('/',
  auth.bearer({required: true, roles: ['admin']}),
  controller.create);

router.put('/:id', auth.bearer({required: true}), controller.update);
router.patch('/:id', auth.bearer({required: true}), controller.update);

router.delete('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.destroy);

export default router;
