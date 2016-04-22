'use strict';

import {Router} from 'express';
import {Types} from 'mongoose';
import menquery from 'menquery';
import * as controller from './broadcast.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  auth.bearer(),
  menquery({
    exclude: {type: Types.ObjectId, paths: ['song'], multiple: true, operator: '$ne'},
    service: {bindTo: 'query'},
    min_distance: {type: Number, bindTo: 'options'},
    song: {type: Types.ObjectId, multiple: true},
    user: {type: Types.ObjectId, multiple: true},
    tags: {type: Types.ObjectId, multiple: true, bindTo: 'query'},
    artists: {type: Types.ObjectId, multiple: true, paths: ['artist'], bindTo: 'query'},
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
