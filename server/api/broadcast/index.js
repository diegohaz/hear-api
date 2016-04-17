'use strict';

import {Router} from 'express';
import {Types} from 'mongoose';
import query from '../../modules/query/';
import * as controller from './broadcast.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  query({
    exclude: {type: Types.ObjectId, paths: ['song'], operator: '$nin'},
    service: {bindTo: 'query'},
    min_distance: {type: Number, bindTo: 'options'},
    song: Types.ObjectId,
    user: Types.ObjectId,
    tags: {type: Types.ObjectId, bindTo: 'query'},
    artists: {type: Types.ObjectId, paths: ['artist'], bindTo: 'query'},
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
