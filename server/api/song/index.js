'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './song.controller';
import * as auth from '../../modules/auth';
import Artist from '../artist/artist.model';

var router = new Router();

router.get('/',
  auth.bearer(),
  query({
    tags: String,
    sort: 'title'
  }),
  controller.index);

router.get('/search',
  auth.bearer(),
  query({}, {sort: false, order: false}),
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
