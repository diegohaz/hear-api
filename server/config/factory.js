'use strict';

import Promise from 'bluebird';
import mongoose from 'mongoose';
import _ from 'lodash';
import vcr from 'nock-vcr-recorder';

import User from '../api/user/user.model';
import Session from '../api/session/session.model';
import Artist from '../api/artist/artist.model';
import Tag from '../api/tag/tag.model';
import Song from '../api/song/song.model';
import PlaceService from '../api/place/place.service';
import Broadcast from '../api/broadcast/broadcast.model';

export function clean() {
  let collections = mongoose.connection.collections;
  return Promise.each(_.values(collections), collection => collection.remove());
}

export function user(role = 'user') {
  return User.create({email: 'anonymous', password: 'password', role: role});
}

export function users(...roles) {
  return Promise.all(_.times(roles.length || 1, i => user(roles[i])));
}

export function session(role) {
  return user(role).then(user => Session.create({user: user}));
}

export function sessions(...roles) {
  return Promise.all(_.times(roles.length || 1, i => session(roles[i])));
}

export function artist(name = 'John Lennon') {
  return Artist.create({name: name});
}

export function artists(...names) {
  let artists = [];

  return Promise.each(names, (name, i) => {
    artists[i] = artist(name);
    return artists[i];
  }).return(artists).all();
}

export function tag(title = 'Rock') {
  return Tag.create({title: title});
}

export function tags(...titles) {
  let tags = [];

  return Promise.each(titles, (title, i) => {
    tags[i] = tag(title);
    return tags[i];
  }).return(tags).all();
}

export function song(title = 'Imagine', artistName = undefined, tagTitle = undefined) {
  return Promise.join(artist(artistName), tag(tagTitle), (artist, tag) => {
    return Song.create({title: title, artist: artist, tags: [tag]})
  });
}

export function songs(...titles) {
  let songs = [];

  return Promise.each(titles, (title, i) => {
    songs[i] = _.isArray(title) ? song(...title) : song(title);
    return songs[i];
  }).return(songs).all();
}

export function place(point = [37.757815,-122.5076406]) {
  return vcr.useCassette(`Place Service/Factory/${point[0]}.${point[1]}`, function() {
    return PlaceService.sublocality(point[0], point[1]);
  });
}

export function places(...points) {
  let places = [];

  return Promise.each(points, (point, i) => {
    places[i] = place(point);
    return places[i];
  }).return(places).all();
}

export function broadcast(songTitle = 'Imagine', artistName = undefined, tagTitle = undefined) {
  return Promise.join(user(), song(songTitle, artistName, tagTitle), (user, song) => {
    return Broadcast.create({user: user, song: song, location: [-122.5076406,37.757815]})
  });
}

export function broadcasts(...songTitles) {
  let broadcasts = [];

  return Promise.each(songTitles, (title, i) => {
    broadcasts[i] = _.isArray(title) ? broadcast(...title) : broadcast(title);
    return broadcasts[i];
  }).return(broadcasts).all();
}
