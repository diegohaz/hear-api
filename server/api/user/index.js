'use strict'

import {Router} from 'express'
import {middleware as querymen} from 'querymen'
import {index, me, show, create, update, destroy} from './user.controller'
import {bearer} from '../../modules/auth'

var router = new Router()

router.get('/',
  bearer({required: true, roles: ['admin']}),
  querymen({
    country: String,
    language: String,
    sort: '-createdAt'
  }),
  index)

router.get('/me', bearer({required: true}), me)
router.get('/:id', show)
router.post('/', bearer({required: true, roles: ['admin']}), create)
router.put('/:id', bearer({required: true}), update)
router.patch('/:id', bearer({required: true}), update)
router.delete('/:id', bearer({required: true, roles: ['admin']}), destroy)

export default router
