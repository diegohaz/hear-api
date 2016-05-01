'use strict';

import {Router} from 'express';
import querymen from 'querymen';
import * as controller from './session.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer({required: true, roles: ['admin']}),
  querymen.middleware({
    q: {paths: ['_q']},
    user: String,
    sort: '-createdAt'
  }),
  controller.index);

router.post('/', auth.basic(), controller.create);

router.delete('/:token?', auth.bearer({required: true}), controller.destroy);

export default router;
