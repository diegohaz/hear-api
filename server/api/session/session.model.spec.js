'use strict'

import app from '../../'
import moment from 'moment'
import tk from 'timekeeper'
import * as factory from '../../modules/factory'
import Session from './session.model'

describe('Session Model', function () {

  before(function () {
    return factory.clean()
  })

  afterEach(function () {
    tk.reset()
    return factory.clean()
  })

  it('should return a view', function () {
    return factory.session().then(session => {
      var view = session.view(true)
      view.should.have.property('user')
      view.should.have.property('access_token')
    })
  })

  it('should set expiration date automatically', function () {
    return factory.session().then(session => {
      var nextYear = moment().add(1, 'years')
      nextYear.diff(moment(session.expiresAt)).should.be.within(0, 30)
    })
  })

  it('should update expiration time', function () {
    return factory.session().delay(50).then(session => {
      return session.save()
    }).then(session => {
      var nextYear = moment().add(1, 'years')
      nextYear.diff(moment(session.expiresAt)).should.be.within(0, 30)
    })
  })

  it('should expire after 1 year', function () {
    return factory.session().then(session => {
      var nextYear = moment().add(1, 'years')
      tk.freeze(nextYear.toDate())
      session.expired().should.be.true
    })
  })

  it('should not expire until 1 year later', function () {
    return factory.session().then(session => {
      var almostNextYear = moment().add(1, 'years').subtract(1, 'seconds')
      tk.freeze(almostNextYear.toDate())
      session.expired().should.be.false
    })
  })

  it('should not login with invalid token', function () {
    return factory.session().then(session => {
      return Session.login('wrong token').should.be.rejected
    })
  })

  it('should not login with expired token', function () {
    return factory.session().then(session => {
      var nextYear = moment().add(1, 'years')
      tk.freeze(nextYear.toDate())
      return Session.login(session.token).should.be.rejected
    })
  })


})
