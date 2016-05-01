'use strict';

import {Router} from 'express';
import {Types} from 'mongoose';
import querymen from 'querymen';
import * as controller from './broadcast.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  querymen.middleware({
    q: {paths: ['_q']},
    exclude: {type: [Types.ObjectId], paths: ['song'], operator: '$ne'},
    service: {bindTo: 'search'},
    min_distance: {type: Number, bindTo: 'cursor'},
    song: [Types.ObjectId],
    user: [Types.ObjectId],
    artists: {type: [Types.ObjectId], paths: ['artist'], bindTo: 'search'},
    tags: {type: [Types.ObjectId], bindTo: 'search'},
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
