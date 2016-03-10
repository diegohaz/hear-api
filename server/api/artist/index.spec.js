'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var artistCtrlStub = {
  index: 'artistCtrl.index',
  show: 'artistCtrl.show',
  create: 'artistCtrl.create',
  update: 'artistCtrl.update',
  destroy: 'artistCtrl.destroy'
};

var queryStub = function() { return 'query' };

var authStub = {
  basic() { return 'auth.basic' },
  bearer() { return 'auth.bearer' }
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var artistIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './artist.controller': artistCtrlStub,
  '../../middleware/auth': authStub,
  '../../middleware/query/': queryStub
});

describe('Artist API Router:', function() {

  it('should return an express router instance', function() {
    artistIndex.should.equal(routerStub);
  });

  describe('GET /artists', function() {

    it('should route to artist.controller.index', function() {
      routerStub.get
        .withArgs('/', 'query', 'artistCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /artists/:id', function() {

    it('should route to artist.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'artistCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /artists', function() {

    it('should route to artist.controller.create', function() {
      routerStub.post
        .withArgs('/', 'auth.bearer', 'artistCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /artists/:id', function() {

    it('should route to artist.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'auth.bearer', 'artistCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /artists/:id', function() {

    it('should route to artist.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'auth.bearer', 'artistCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /artists/:id', function() {

    it('should route to artist.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'auth.bearer', 'artistCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
