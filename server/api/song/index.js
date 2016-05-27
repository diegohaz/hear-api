'use strict'

import {Router} from 'express'
import querymen from 'querymen'
import apicache from 'apicache'
import * as controller from './song.controller'
import * as auth from '../../modules/auth'

var router = new Router()

router.get('/',
  auth.bearer(),
  querymen.middleware({
    tags: [String],
    sort: 'title'
  }),
  controller.index)

router.get('/search',
  auth.bearer(),
  querymen.middleware({}, {sort: false}),
  apicache.options({appendKey: ['user', 'service']}).middleware('1 day'),
  controller.search)

router.get('/:id', auth.bearer(), controller.show)

router.post('/',
  auth.bearer({required: true, roles: ['admin']}),
  controller.create)

router.put('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.update)

router.patch('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.update)

router.delete('/:id',
  auth.bearer({required: true, roles: ['admin']}),
  controller.destroy)

export default router
