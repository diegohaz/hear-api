'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './session.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer({required: true, roles: ['admin']}),
  query({
    q: {paths: {user: 'User.email'}},
    userid: {paths: {user: 'User._id'}},
    sort: 'createdAt',
    order: 'desc'
  }),
  controller.index);

router.post('/', auth.basic(), controller.create);

router.delete('/:token?', auth.bearer({required: true}), controller.destroy);

export default router;
