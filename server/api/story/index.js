'use strict';

import {Router} from 'express';
import {Types} from 'mongoose';
import querymen from 'querymen';
import * as controller from './story.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  querymen.middleware({
    q: {paths: ['text']},
    user: [Types.ObjectId],
    song: [Types.ObjectId],
    sort: '-createdAt'
  }, {near: true}),
  controller.index);

router.get('/:id', controller.show);

router.post('/',
  auth.bearer({required: true}),
  controller.create);

router.put('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.update);

router.patch('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.update);

router.delete('/:id',
  auth.bearer({required: true}),
  controller.destroy);

export default router;
