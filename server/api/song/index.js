'use strict';

import {Router} from 'express';
import querymen from 'querymen';
import * as controller from './song.controller';
import * as auth from '../../modules/auth';
import Artist from '../artist/artist.model';

var router = new Router();

router.get('/',
  auth.bearer(),
  querymen.middleware({
    q: {paths: ['_q']},
    tags: [String],
    sort: 'title'
  }),
  controller.index);

router.get('/search',
  auth.bearer(),
  querymen.middleware({}, {sort: false}),
  controller.search);

router.get('/:id', auth.bearer(), controller.show);

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
