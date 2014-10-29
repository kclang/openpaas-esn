'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The Webserver module', function() {
  var config = null,
      expressMock = null,
      httpMock = null,
      httpsMock = null,
      serverInstance = null,
      sslserverInstance = null;

  function mockServer(basePath) {
    httpMock.serverInstance.listen = function(serverPort) {
      returnData.serverHttpPort = serverPort;
      return serverInstance;
    };
    httpsMock.serverInstance.listen = function(serverPort) {
      returnData.serverHttpsPort = serverPort;
      return sslserverInstance;
    };

    mockery.registerMock('./middleware/setup-sessions', function() {});
    mockery.registerMock('http', httpMock);
    mockery.registerMock('https', httpsMock);
    mockery.registerMock('express', expressMock);

    var webserver = require(basePath + '/backend/webserver');

    var returnData = {
      webserver: webserver,
      serverHttpPort: undefined,
      serverHttpsPort: undefined
    };
    return returnData;
  }

  it('should contains all needed properties', function() {
    var webserver = require(this.testEnv.basePath + '/backend/webserver');
    expect(webserver).to.exist;
    expect(webserver).to.be.an.Object;
    expect(webserver.application).to.exist;
    expect(webserver.application).to.be.a.Function;
    expect(webserver.virtualhosts).to.exist;
    expect(webserver.virtualhosts).to.be.an.Array;
    expect(webserver).to.have.property('server');
    expect(webserver.server).to.be.null;
    expect(webserver).to.have.property('port');
    expect(webserver.port).to.be.null;
    expect(webserver).to.have.property('ssl_port');
    expect(webserver.ssl_port).to.be.null;
    expect(webserver).to.have.property('ssl_key');
    expect(webserver.ssl_key).to.be.null;
    expect(webserver).to.have.property('ssl_cert');
    expect(webserver.ssl_cert).to.be.null;
    expect(webserver).to.have.property('started');
    expect(webserver.started).to.be.false;
    expect(webserver).to.have.property('start');
    expect(webserver.start).to.be.a.Function;
  });

  before(function() {
    config = require(this.testEnv.basePath + '/backend/core').config('default');
    var expressFixtures = require(this.testEnv.fixtures + '/express');
    expressMock = expressFixtures.express();
    httpMock = expressFixtures.http();
    httpsMock = expressFixtures.https();
    serverInstance = {
        me: true,
        on: function(event, callback) {
          if (event === 'listening') {
            process.nextTick(callback);
          }
        },
        removeListener: function() {}
      };
    sslserverInstance = Object.create(serverInstance);
  });

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('the start property', function() {
    it('should start the web server (http only)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort).to.be.undefined;
        expect(serverMock.serverHttpPort).to.be.equal(config.webserver.port);
        done();
      });
    });

    it('should start the web server (https only)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort).to.be.equal(config.webserver.ssl_port);
        expect(serverMock.serverHttpPort).to.be.undefined;
        done();
      });
    });

    it('should start the web server (both types)', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverMock.serverHttpsPort).to.be.equal(config.webserver.ssl_port);
        expect(serverMock.serverHttpPort).to.be.equal(config.webserver.port);
        done();
      });
    });
  });

  describe('when started', function() {
    it('should set the webserver into the server property', function(done) {
      var serverMock = mockServer(this.testEnv.basePath);
      serverMock.webserver.port = config.webserver.port;
      serverMock.webserver.ssl_port = config.webserver.ssl_port;
      serverMock.webserver.ssl_cert = this.testEnv.fixtures + '/ssl.crt';
      serverMock.webserver.ssl_key = this.testEnv.fixtures + '/ssl.key';
      serverMock.webserver.start(function() {
        expect(serverInstance === serverMock.webserver.server).to.be.true;
        expect(sslserverInstance === serverMock.webserver.sslserver).to.be.true;
        done();
      });
    });
  });

  describe('The AwesomeWebServer', function() {
    it('should provide a start state', function() {
      var module = require(this.testEnv.basePath + '/backend/webserver').awesomeWebServer;
      expect(module.settings.start).to.exist;
      expect(module.settings.start).to.be.a('function');
    });
  });
});
