'use strict';

import request from 'request-promise';
import config from '../../config/environment';

function reveal(song) {
  return request({
    uri: 'http://ws.audioscrobbler.com/2.0/',
    qs: {
      method: 'track.getInfo',
      api_key: config.lastfmKey,
      format: 'json',
      track: _sanitize(song.title),
      artist: song.artist.name
    }
  }).then(res => {
    return JSON.parse(res).track.toptags.tag.map(t => t.name);
  });
}

function _sanitize(string) {
  return string.replace(/ ?\-.+$|\.|,| ?\(.+\)/g, '');
}

export default {
  reveal: reveal
}