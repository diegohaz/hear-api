'use strict';

import app from '../../';
import nock from 'nock';
import vcr from 'nock-vcr-recorder-mocha';
import Story from './story.model';
import * as factory from '../../config/factory';

describe('Story Model', function() {
  var story;

  before(function() {
    return factory.clean()
      .then(() => factory.story('Testing', 'Imagine', 'John Lennon', 'Rock'))
      .then(st => st.deepPopulate('song artist tags user place'))
      .then(st => story = st);
  });

  vcr.it('should fetch place after save', function() {
    return story.postSave().then(story => {
      story.should.have.property('place').not.empty;
    });
  });

  it('should return a view', function() {
    var view = story.view();
    view.should.have.property('id', story.id);
  });

});
