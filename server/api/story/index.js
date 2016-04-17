'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './story.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  query({
    q: {paths: ['text']},
    user: {id: true},
    song: {id: true},
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
