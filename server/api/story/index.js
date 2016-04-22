'use strict';

import {Router} from 'express';
import {Types} from 'mongoose';
import menquery from 'menquery';
import * as controller from './story.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  menquery({
    q: {paths: ['text']},
    user: {type: Types.ObjectId, multiple: true},
    song: {type: Types.ObjectId, multiple: true},
    sort: '-createdAt'
  }),
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
