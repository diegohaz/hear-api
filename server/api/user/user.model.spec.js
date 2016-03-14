'use strict';

import app from '../..';
import * as factory from '../../config/factory';
import User from './user.model';
import Session from '../session/session.model';


describe('User Model', function() {
  before(function() {
    return factory.clean();
  });

  afterEach(function() {
    return factory.clean();
  });

  it('should return full view', function() {
    return factory.user().then(user => {
      user.view(true).should.include.keys(
        'email', 'service', 'country', 'language', 'createdAt'
      );
    });
  });

  it('should remove user sessions after removing user', function() {
    var user;
    return factory.session()
      .then(session => user = session.user)
      .then(() => Session.find({user: user}).should.eventually.have.lengthOf(1))
      .then(() => user.postRemove())
      .then(() => Session.find({user: user}).should.eventually.have.lengthOf(0));
  });

  it('should authenticate user when valid password', function() {
    return factory.user()
      .then(user => user.authenticate('password').should.eventually.not.be.false);
  });

  it('should not authenticate user when invalid password', function() {
    return factory.user()
      .then(user => user.authenticate('blah').should.eventually.be.false);
  });

});
