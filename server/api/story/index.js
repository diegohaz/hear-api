'use strict'

import {Router} from 'express'
import {Types} from 'mongoose'
import {middleware as querymen} from 'querymen'
import {index, show, create, update, destroy} from './story.controller'
import {bearer} from '../../modules/auth'

var router = new Router()

router.get('/',
  bearer(),
  querymen({
    q: {paths: ['text']},
    user: [Types.ObjectId],
    song: [Types.ObjectId],
    sort: '-createdAt'
  }, {
    near: true
  }),
  index)

router.get('/:id', show)
router.post('/', bearer({required: true}), create)
router.put('/:id', bearer({required: true, roles: ['admin']}), update)
router.patch('/:id', bearer({required: true, roles: ['admin']}), update)
router.delete('/:id', bearer({required: true}), destroy)

export default router
