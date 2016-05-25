'use strict'

import {errorHandler} from 'querymen'
import {Router} from 'express'
import artist from './api/artist'
import broadcast from './api/broadcast'
import place from './api/place'
import session from './api/session'
import song from './api/song'
import story from './api/story'
import tag from './api/tag'
import user from './api/user'

const router = new Router()

router.use('/artists', artist)
router.use('/broadcasts', broadcast)
router.use('/places', place)
router.use('/sessions', session)
router.use('/songs', song)
router.use('/stories', story)
router.use('/tags', tag)
router.use('/users', user)

router.use(errorHandler())

export default router
