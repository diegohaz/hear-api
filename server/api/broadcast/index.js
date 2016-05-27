'use strict'

import {Router} from 'express'
import {Types} from 'mongoose'
import {middleware as querymen} from 'querymen'
import {index, show, create, destroy} from './broadcast.controller'
import {bearer} from '../../modules/auth'

var router = new Router()

router.get('/',
  bearer(),
  querymen({
    exclude: {type: [Types.ObjectId], paths: ['song'], operator: '$ne'},
    service: {bindTo: 'search'},
    min_distance: {type: Number, bindTo: 'cursor'},
    song: [Types.ObjectId],
    user: [Types.ObjectId],
    artists: {type: [Types.ObjectId], paths: ['artist'], bindTo: 'search'},
    tags: {type: [Types.ObjectId], bindTo: 'search'},
    sort: '-createdAt'
  }),
  index)

router.get('/:id', show)

router.post('/', bearer({required: true}), create)

router.delete('/:id', bearer({required: true}), destroy)

export default router
