'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import Promise from 'bluebird';
import service from './song.service';
import User from '../user/user.model';
import Tag from '../tag/tag.model';

var SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  artist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Artist',
    required: true
  },
  tags: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Tag'
  }],
  isrc: {
    type: String,
    uppercase: true,
    trim: true,
    maxlength: 12
  },
  info: [{
    service: {
      type: String,
      lowercase: true
    },
    id: String,
    previewUrl: String,
    url: String,
    images: {
      small: String,
      medium: String,
      big: String
    }
  }]
});

SongSchema.methods.view = function({
  service = User.default('service'),
  country = User.default('country')
} = {}) {
  var view = {};
  var info = _.find(this.info, {service: service});

  view.id     = this.id;
  view.title  = this.title;
  view.artist = this.artist.view();
  view.isrc   = this.isrc;
  view.tags   = this.tags.map(t => t.view());

  if (info) {
    view.previewUrl = info.previewUrl;
    view.images     = info.images;
    view.service    = info.service;
    view.serviceId  = info.id;
    view.serviceUrl = info.url;

    if (service === 'itunes') {
      view.serviceUrl.replace(/(apple\.com\/)[a-z]{2}/i, '$1' + country.toLowerCase());
    }
  }

  return view;
};

SongSchema.methods.fetchAndUpdate = function() {
  let Song = mongoose.model('Song');

  return this.populate('artist').execPopulate()
    .then(song => service.allServices())
    .each(service => this.fetchInfo(service))
    .then(tags => this.fetchTags())
    .then(song => {
      return Song.findByIdAndUpdate(
        this._id,
        {$set: {info: this.info, tags: this.tags}},
        {new: true}
      ).exec();
    });
};

SongSchema.methods.fetchInfo = function(svc) {
  var info = _.find(this.info, {service: svc});
  if (info) return Promise.resolve(this);

  return service.match(this, svc).then(match => this.translate(match));
};

SongSchema.methods.fetchTags = function() {
  if (this.tags.length) return Promise.resolve(this);

  return service.tags(this).each(tag => {
    return Tag.create({title: tag}).then(tag => {
      this.tags.push(tag);
    });
  }).return(this);
}

SongSchema.methods.translate = function(serviceSong) {
  var info = {};

  info.service    = serviceSong.service;
  info.id         = serviceSong.serviceId;
  info.previewUrl = serviceSong.previewUrl;
  info.url        = serviceSong.serviceUrl;
  info.images     = serviceSong.images;

  this.info.push(info);

  if (serviceSong.isrc) {
    this.isrc = serviceSong.isrc;
  }

  return this;
};

export default mongoose.model('Song', SongSchema);
