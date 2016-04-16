'use strict';

import {Router} from 'express';
import query from '../../modules/query/';
import * as controller from './broadcast.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  query({
    exclude: {id: true},
    service: {bindTo: 'query'},
    min_distance: {type: Number, bindTo: 'options'},
    song: {id: true},
    user: {id: true},
    tags: {id: true, bindTo: 'query'},
    artists: {id: true, paths: ['artist'], bindTo: 'query'},
    sort: '-createdAt'
  }),
  controller.index);

router.get('/:id', controller.show);

router.post('/',
  auth.bearer({required: true}),
  controller.create);

router.delete('/:id',
  auth.bearer({required: true}),
  controller.destroy);

export default router;
