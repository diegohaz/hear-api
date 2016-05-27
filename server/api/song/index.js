'use strict'

import {Router} from 'express'
import {middleware as querymen} from 'querymen'
import apicache from 'apicache'
import {index, search, show, create, update, destroy} from './song.controller'
import {bearer} from '../../modules/auth'

var router = new Router()

router.get('/',
  bearer(),
  querymen({
    tags: [String],
    sort: 'title'
  }),
  index)

router.get('/search',
  bearer(),
  querymen({}, {sort: false}),
  apicache.options({appendKey: ['user', 'service']}).middleware('1 day'),
  search)

router.get('/:id', bearer(), show)
router.post('/', bearer({required: true, roles: ['admin']}), create)
router.put('/:id', bearer({required: true, roles: ['admin']}), update)
router.patch('/:id', bearer({required: true, roles: ['admin']}), update)
router.delete('/:id', bearer({required: true, roles: ['admin']}), destroy)

export default router
