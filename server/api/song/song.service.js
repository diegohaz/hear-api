'use strict';

import request from 'request-promise';

export default function(service) {

  var allServices = ['itunes', 'spotify', 'deezer'];

  function search(options) {
    return request(_formatSearchRequest(options))
      .then(res => _parseSearchResponse(res));
  }

  function lookup(id) {
    return request(_formatLookupRequest(id))
      .then(res => _parseLookupResponse(res));
  }

  function match(song) {
    if (service === 'deezer' && song.isrc) {
      return lookup('isrc:' + song.isrc);
    }

    var q = '';
    var title = _sanitize(song.title);

    switch (service) {
      case 'itunes':
        q = title + ' ' + song.artist.name;
        break;
      case 'spotify':
        q = song.isrc ? 'isrc:' + song.isrc : 'track:' + title + ' artist:' + song.artist.name;
        break;
      case 'deezer':
        q = 'track:"' + title + '" artist:"' + song.artist.name + '"';
        break;
    }

    var options = {q: q, limit : 1};

    return search(options).then(result => result[0]);
  }

  function _sanitize(string) {
    return string.replace(/ ?\-.+$|\.|,| ?\(.+\)/g, '');
  }

  function _formatSearchRequest(options) {
    var request = {};

    switch (service) {
      case 'itunes':
        request.uri = 'https://itunes.apple.com/search';
        request.qs = {
          term: options.q,
          limit: options.limit,
          media: 'music'
        };
        break;
      case 'spotify':
        request.uri = 'https://api.spotify.com/v1/search';
        request.qs = {
          q: options.q,
          limit: options.limit,
          offset: options.skip,
          type: 'track'
        };
        break;
      case 'deezer':
        request.uri = 'http://api.deezer.com/search/track/';
        request.qs = {
          q: options.q,
          limit: options.limit,
          index: options.skip
        };
        break;
    }

    return request;
  }

  function _formatLookupRequest(id) {
    var request = {};

    switch (service) {
      case 'itunes':
        request.uri = 'https://itunes.apple.com/lookup';
        request.qs = {id: id, limit: 1};
        break;
      case 'spotify':
        request.uri = 'https://api.spotify.com/v1/tracks/' + id;
        break;
      case 'deezer':
        request.uri = 'http://api.deezer.com/track/' + id;
        break;
    }

    return request;
  }

  function _parseSearchResponse(response) {
    var result = [];

    if (typeof response === 'string') {
      response = JSON.parse(response);
    }

    switch (service) {
      case 'itunes':  response = response.results;      break;
      case 'spotify': response = response.tracks.items; break;
      case 'deezer':  response = response.data;         break;
    }

    for (var i = 0; i < response.length; i++) {
      if (service === 'itunes' && !response[i].isStreamable) continue;
      result.push(_parseLookupResponse(response[i]));
    }

    return result;
  }

  function _parseLookupResponse(response) {
    var result = {};

    if (typeof response === 'string') {
      response = JSON.parse(response);
    }

    switch (service) {
      case 'itunes':
        response = response.results? response.results[0] : response;
        if (response) {
          result.title      = response.trackName;
          result.artist     = response.artistName;
          result.previewUrl = response.previewUrl;
          result.service    = service;
          result.serviceId  = '' + response.trackId;
          result.serviceUrl = response.trackViewUrl;
          result.images     = {
            small: response.artworkUrl100.replace('100x100', '96x96'),
            medium: response.artworkUrl100.replace('100x100', '288x288'),
            big: response.artworkUrl100.replace('100x100', '640x640')
          };
        }
        break;
      case 'spotify':
        if (response) {
          result.title      = response.name;
          result.artist     = response.artists[0].name;
          result.previewUrl = response.preview_url;
          result.service    = service;
          result.serviceId  = response.id;
          result.serviceUrl = response.external_urls.spotify;
          result.images     = {
            small: response.album.images[2].url,
            medium: response.album.images[1].url,
            big: response.album.images[0].url
          };

          if (response.external_ids && response.external_ids.isrc) {
            result.isrc = response.external_ids.isrc;
          }
        }
        break;
      case 'deezer':
        if (response) {
          result.title      = response.title;
          result.artist     = response.artist.name;
          result.previewUrl = response.preview;
          result.service    = service;
          result.serviceId  = response.id;
          result.serviceUrl = response.link;
          result.images     = {
            small: response.album.cover_medium.replace('250x250', '96x96'),
            medium: response.album.cover_medium.replace('250x250', '288x288'),
            big: response.album.cover_medium.replace('250x250', '640x640')
          };

          if (response.isrc) {
            result.isrc = response.isrc;
          }
        }
        break;
    }

    return result;
  }

  return {
    allServices: allServices,
    search: search,
    lookup: lookup,
    match: match
  }

}