'use strict'

import request from 'request-promise'
import {lastfmKey} from '../../config'

export default class SongService {
  constructor (service) {
    this.service = service
  }

  search (options) {
    return SongService.search(options, this.service)
  }

  lookup (id) {
    return SongService.lookup(id, this.service)
  }

  match (song) {
    return SongService.match(song, this.service)
  }

  static allServices () {
    return ['itunes', 'spotify', 'deezer']
  }

  static search (options, service) {
    return request(this._formatSearchRequest(options, service))
      .then(res => this._parseSearchResponse(res, service))
  }

  static lookup (id, service) {
    return request(this._formatLookupRequest(id, service))
      .then(res => this._parseLookupResponse(res, service))
  }

  static match (song, service) {
    if (service === 'deezer' && song.isrc) {
      return this.lookup('isrc:' + song.isrc, service)
    }

    var q = ''
    var title = this._sanitize(song.title)

    switch (service) {
      case 'itunes':
        q = title + ' ' + song.artist.name
        break
      case 'spotify':
        q = song.isrc ? 'isrc:' + song.isrc : 'track:' + title + ' artist:' + song.artist.name
        break
      case 'deezer':
        q = 'track:"' + title + '" artist:"' + song.artist.name + '"'
        break
    }

    var options = {q: q, limit: 1}

    return this.search(options, service).then(result => result[0])
  }

  static tag (song) {
    return request({
      uri: 'http://ws.audioscrobbler.com/2.0/',
      qs: {
        method: 'track.getInfo',
        api_key: lastfmKey,
        format: 'json',
        track: this._sanitize(song.title),
        artist: song.artist.name
      }
    }).then(res => {
      return JSON.parse(res).track.toptags.tag.map(t => t.name)
    })
  }

  static _sanitize (string) {
    return string.replace(/ ?\-.+$|\.|,| ?\(.+\)/g, '')
  }

  static _formatSearchRequest (options, service) {
    var request = {}

    switch (service) {
      case 'itunes':
        request.uri = 'https://itunes.apple.com/search'
        request.qs = {
          term: options.q,
          limit: options.limit || 20,
          media: 'music'
        }
        break
      case 'spotify':
        request.uri = 'https://api.spotify.com/v1/search'
        request.qs = {
          q: options.q,
          limit: options.limit || 20,
          offset: options.skip || 0,
          type: 'track'
        }
        break
      case 'deezer':
        request.uri = 'http://api.deezer.com/search/track/'
        request.qs = {
          q: options.q,
          limit: options.limit || 20,
          index: options.skip || 0
        }
        break
    }

    return request
  }

  static _formatLookupRequest (id, service) {
    var request = {}

    switch (service) {
      case 'itunes':
        request.uri = 'https://itunes.apple.com/lookup'
        request.qs = {id: id, limit: 1}
        break
      case 'spotify':
        request.uri = 'https://api.spotify.com/v1/tracks/' + id
        break
      case 'deezer':
        request.uri = 'http://api.deezer.com/track/' + id
        break
    }

    return request
  }

  static _parseSearchResponse (response, service) {
    var result = []

    if (typeof response === 'string') {
      response = JSON.parse(response)
    }

    switch (service) {
      case 'itunes':
        response = response.results
        break
      case 'spotify':
        response = response.tracks.items
        break
      case 'deezer':
        response = response.data
    }

    for (var i = 0; i < response.length; i++) {
      if (service === 'itunes' && !response[i].isStreamable) continue
      result.push(this._parseLookupResponse(response[i], service))
    }

    return result
  }

  static _parseLookupResponse (response, service) {
    var result = {}

    if (typeof response === 'string') {
      response = JSON.parse(response)
    }

    switch (service) {
      case 'itunes':
        response = response.results ? response.results[0] : response
        if (response) {
          result.title = response.trackName
          result.artist = response.artistName
          result.previewUrl = response.previewUrl
          result.service = service
          result.serviceId = '' + response.trackId
          result.serviceUrl = response.trackViewUrl
          result.images = {
            small: response.artworkUrl100.replace('100x100', '96x96'),
            medium: response.artworkUrl100.replace('100x100', '288x288'),
            big: response.artworkUrl100.replace('100x100', '640x640')
          }
        }
        break
      case 'spotify':
        if (response) {
          result.title = response.name
          result.artist = response.artists[0].name
          result.previewUrl = response.preview_url
          result.service = service
          result.serviceId = response.id
          result.serviceUrl = response.external_urls.spotify
          result.images = {
            small: response.album.images[2].url,
            medium: response.album.images[1].url,
            big: response.album.images[0].url
          }

          if (response.external_ids && response.external_ids.isrc) {
            result.isrc = response.external_ids.isrc
          }
        }
        break
      case 'deezer':
        if (response) {
          result.title = response.title_short || response.title
          result.artist = response.artist.name
          result.previewUrl = response.preview
          result.service = service
          result.serviceId = response.id
          result.serviceUrl = response.link
          result.images = {
            small: response.album.cover_medium.replace('250x250', '96x96'),
            medium: response.album.cover_medium.replace('250x250', '288x288'),
            big: response.album.cover_medium.replace('250x250', '640x640')
          }

          if (response.isrc) {
            result.isrc = response.isrc
          }
        }
        break
    }

    return result
  }
}
