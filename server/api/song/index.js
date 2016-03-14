'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './song.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  query({searchField: 'title', sortingField: 'title', querySorting: true}),
  controller.index);

router.get('/search', auth.bearer(), query(), controller.search);

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
