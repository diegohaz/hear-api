'use strict';

import {Router} from 'express';
import querymen from 'querymen';
import * as controller from './place.controller';
import * as auth from '../../modules/auth';

var router = new Router();

router.get('/',
  querymen.middleware({
    type: String,
    near: {geojson: false}
  }, {near: true}),
  controller.index);

router.get('/lookup', controller.lookup);

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
