# hear-api

This project is a REST API for a geolocalized music app (Hear) using MongoDB, Expressjs and Nodejs (MEN). It was built based on [this rest-api boilerplate](https://github.com/diegohaz/rest-api) and is still in development.

## Business logic summary

- client must be able to list songs
- client must be able to list places
- client must be able to put a song on a place (it creates a broadcast)
- client must be able to attach a story on a broadcast
- client must be able to list broadcasts
- client must be able to list stories

## Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and npm](nodejs.org) Node ^4.2.3, npm ^2.14.7
- [Grunt](http://gruntjs.com/) (`npm install --global grunt-cli`)
- [MongoDB](https://www.mongodb.org/) - Keep a running daemon with `mongod`

## External API keys

You will not be able to start the server without set some external api keys. Take a look at `server/config/local.env.sample.js` to see a list of required keys. Just duplicate that file and rename it to `local.env.js` replacing with the keys or start the server with proper environment variables.

- [Get Last.fm API key](http://www.last.fm/pt/api)
- [Get Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [Get Foursquare API key](https://developer.foursquare.com/start)

## Usage

1. Run `git clone htps://github.com/diegohaz/hear-api && cd hear-api && npm install` and wait for npm to install dependencies.

2. Run `mongod` in a separate shell to keep an instance of the MongoDB Daemon running

3. Run `grunt` to execute tests and build the project.

4. Run `npm start` to start server in development mode or `cd dist && NODE_ENV=production npm start` to start it in production mode.

## License and contribution

This is a single part of a larger project. I still don't know with which license it will be released or even if it will be open source. But until there you can use the code in this repository. If it can be useful for you, I only ask you to help me to improve the code filing issues and/or sending PRs.

## TODO

- add Stories API
- add Taste API (using Echonest API)
- return error messages in errors 400
- write documentation
- improve query module (and maybe release it as a npm package)
