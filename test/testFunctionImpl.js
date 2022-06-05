const expect = require('chai').expect;
const sinon = require('sinon');
const fetch = require('node-fetch');
const log4js = require("log4js");

const OciConfigLoader = require('../util/oci-config-loader');
const idcsHelper = require('../util/idcs-token-helper');

const impl = require("../funcImpl");

describe("FuncImpl Config Validation", function () {
  //turn off in-function logging...
  before(function(){
    log4js.getLogger().level = "off";
  });
  it("Should proceed when config values present (for secrets)", function(done){
    //Stub the config loader so we always fail on that step.
    var configStub = sinon.stub(OciConfigLoader, "loadLocalConfig").throws();
    var expectedError = "Could not load config.";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsCertSecretId":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      configStub.restore();
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError);
      configStub.restore();
      done();
    });
  });
  it("Should proceed when config values present (for vault)", function(done){
    //Stub the config loader so we always fail on that step.
    var configStub = sinon.stub(OciConfigLoader, "loadLocalConfig").throws();
    var expectedError = "Could not load config.";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsSigningKeyId":"abc",
          "vaultSubdomain":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      configStub.restore();
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError);
      configStub.restore();
      done();
    });
  });
  it("Should fail when missing the object Storage URL", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          //"objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsCertSecretId":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  it("Should fail when missing the region", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          //"ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsCertSecretId":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  it("Should fail when missing the idcsUrl", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          //"idcsBaseUrl":"abc",
          "idcsCertSecretId":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  it("Should fail when missing the idcs Cert Alias", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsCertSecretId":"abc",
          //"idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  it("Should fail when missing the idcs Client ID", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsCertSecretId":"abc",
          "idcsCertAlias":"abc",
          //"idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  it("Should fail when missing the idcsCertSecretId, and Vault signing details not provided", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          //"idcsCertSecretId":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  it("Should fail when Vault signing ID provided, without vault subdomain", function(done){
    var expectedError = "Function hasn't been configured correctly yet!";
    var context = {
      config:{
          "objStoreBucketURL":"abc",
          "ociRegion":"abc",
          "idcsBaseUrl":"abc",
          "idcsCertSigningKeyId":"abc",
          "idcsCertAlias":"abc",
          "idcsClientId":"abc",
      },
      httpGateway:{}
    };
    impl.handler("test", context).then(()=>{
      expect("success").to.equal(false);
      done();
    }).catch(err =>{
      expect(err.error).to.equal(expectedError)
      expect(context.httpGateway.statusCode).to.equal(500);
      done();
    });
  });
  
  after(function(){
    log4js.getLogger().level = process.env["LOG_LEVEL"] || "error";
  });
});

describe("ObjectStorage Timestamp retrieval", function () {
  describe("getLastTimestampForDay", function () {
    it("Should successfully retrieve a timestamp for the same day", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {
            "objects": [
              { "name": "2020-09-08T01:15:10.000Z-2020-09-08T01:30:10.000Z-idcs-audit-events.json" }
            ]
          };
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var testingDate = new Date("2020-09-08T02:00:00.000Z");
      var expectedTimestamp = "2020-09-08T01:30:10.000Z";
      impl._getLastTimestampForDay(signer, objUrl, testingDate).then(timestamp => {
        expect(timestamp).to.equal(expectedTimestamp);
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
    it("Should return null if no items exist for the given day", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {
            "objects": []
          };
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var testingDate = new Date("2020-09-07T02:00:00.000Z");
      impl._getLastTimestampForDay(signer, objUrl, testingDate).then(timestamp => {
        expect(timestamp).to.be.null;
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
  });
  describe("getLastObjectTimestamp", function () {
    //Stub the date method to set it to the sample time
    before(function () { clock = sinon.useFakeTimers(new Date("2020-09-08T02:00:00.000Z")); })
    after(function () { clock.restore(); })
    it("Should return the timestamp for the same day if one is returned", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {
            "objects": [
              { "name": "2020-09-08T01:15:10.000Z-2020-09-08T01:30:10.000Z-idcs-audit-events.json" }
            ]
          };
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var expectedTimestamp = "2020-09-08T01:30:10.000Z";
      impl._getLastObjectTimestamp(signer, objUrl).then(timestamp => {
        expect(timestamp).to.equal(expectedTimestamp);
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
    it("Should fall back on yesterday's results when none returned for today", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise');
      fetchStub.callsFake(function () {
        if (this.callCount == 1) {
          return Promise.resolve({
            json: () => {
              return { "objects": [] };
            }
          });
        } else {
          return Promise.resolve({
            json: () => {
              return {
                "objects": [
                  { "name": "2020-09-07T23:30:10.000Z-2020-09-07T23:45:10.000Z-idcs-audit-events.json" }
                ]
              };
            }
          });
        }
      }.bind(fetchStub));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var expectedTimestamp = "2020-09-07T23:45:10.000Z";
      impl._getLastObjectTimestamp(signer, objUrl).then(timestamp => {
        expect(timestamp).to.equal(expectedTimestamp);
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
    it("Should fall back on the start of yesterday if no results", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return { "objects": [] };
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var expectedTimestamp = "2020-09-07T00:00:00.000Z";
      impl._getLastObjectTimestamp(signer, objUrl).then(timestamp => {
        expect(timestamp).to.equal(expectedTimestamp);
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
    it("Should fall back on other results if the last object name is malformed", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return { "objects": [
            { "name": "2020-09-08T01:15:10.000Z-2020-09-08T01:15:10.000Z-idcs-audit-events.json" },
            { "name": "2020-09-08T01:15:10.000Z-2020-09-08T01:30:10.000Z-idcs-audit-events.json" },
            { "name": "2020-09-08T01:15:10.000Z-GARBLED!.json" }
          ] };
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var expectedTimestamp = "2020-09-08T01:30:10.000Z";
      impl._getLastObjectTimestamp(signer, objUrl).then(timestamp => {
        expect(timestamp).to.equal(expectedTimestamp);
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
    it("Should fall back on the start of yesterday if all of the objects are malformed", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return { "objects": [
            { "name": "2020-09-08T01:15:10.000Z-GARBLED!.json" },
            { "name": "2020-09-08T01:30:10.000Z-GARBLED!.json" },
            { "name": "2020-09-08T01:45:10.000Z-GARBLED!.json" }
          ] };
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var objUrl = "https://dummy";
      var expectedTimestamp = "2020-09-07T00:00:00.000Z";
      impl._getLastObjectTimestamp(signer, objUrl).then(timestamp => {
        expect(timestamp).to.equal(expectedTimestamp);
        fetchStub.restore();
        done();
      }).catch(err => {
        fetchStub.restore();
        done(err);
      });
    });
  })
});

describe("IDCS Audit Event retreival", function () {
  describe("getIDCSAuditEventsPaginated", function () {
    it("Retrieving Audit events from IDCS shouldn't explode...", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {};
        }
      }));
      //There isn't actually much logic in this function, 
      //it is really just a parameterised fetch
      impl._getIDCSAuditEventsPaginated("https://dummy", "123", "2020-09-07T00:00:00.000Z", 1, 0).then(res => {
        fetchStub.restore();
        done();
      }).catch((e) => {
        fetchStub.restore();
        done(e);
      });
    });
  });
  describe("getIDCSAuditEvents", function () {
    it("Retrieves events from IDCS", function(done){
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {
            "totalResults": 1,
            "Resources": [{"event":"yes?"}]
          };
        }
      }));
      //There isn't actually much logic in this function when we are requesting <1000 events
      impl._getIDCSAuditEvents("https://dummy", "123", "2020-09-07T00:00:00.000Z", 1).then(events => {
        expect(events).to.deep.equal([{"event":"yes?"}]);
        expect(fetchStub.callCount).to.equal(1);
        fetchStub.restore();
        done();
      }).catch((e) => {
        fetchStub.restore();
        done(e);
      });
    });
    it("Makes multiple calls to retrieve events when maxEvents > 1000", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise');
      //Silly iteration because we struggle to stub with 'calledWith'
      fetchStub.callsFake(function () {
          var val = "" +this.callCount;
          return Promise.resolve({
            json: () => {
              return {
                "totalResults": 2500,
                "Resources": [parseInt(val)]
              };
            }
          });
      }.bind(fetchStub));
      //There isn't actually much logic in this function, 
      //it is really just a parameterised fetch
      impl._getIDCSAuditEvents("https://dummy", "123", "2020-09-07T00:00:00.000Z", 2500).then(events => {
        expect(fetchStub.callCount).to.equal(3);
        expect(events).to.have.members([1,2,3]);
        fetchStub.restore();
        done();
      }).catch((e) => {
        fetchStub.restore();
        done(e)
      });
    });
    it("Makes only enough calls to return maxEvents, even when there are more events than this", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise');
      //Silly iteration because we struggle to stub with 'calledWith'
      fetchStub.callsFake(function () {
          var val = "" +this.callCount;
          return Promise.resolve({
            json: () => {
              return {
                "totalResults": 10000,
                "Resources": [parseInt(val)]
              };
            }
          });
      }.bind(fetchStub));
      //There isn't actually much logic in this function, 
      //it is really just a parameterised fetch
      impl._getIDCSAuditEvents("https://dummy", "123", "2020-09-07T00:00:00.000Z", 2500).then(events => {
        expect(fetchStub.callCount).to.equal(3);
        expect(events).to.have.members([1,2,3]);
        fetchStub.restore();
        done();
      }).catch((e) => {
        fetchStub.restore();
        done(e)
      });
    });

  });
});


describe("IDCS Client Assertion Creation", function () {
  describe("getSignedIDCSAssertion", function () {
    //Stub the date method to set it to the sample time
    before(function () { clock = sinon.useFakeTimers(new Date("2020-09-08T02:00:00.000Z")); })
    after(function () { clock.restore(); })
    it("Makes a call into Vault to sign an assertion", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {"signature":"abc+/="};
        }
      }));
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var expectedJWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3RhbGlhcyJ9."
      +"eyJzdWIiOiJ0ZXN0aWQiLCJpc3MiOiJ0ZXN0aWQiLCJhdWQiOlsiaHR0cHM6Ly9pZGVudGl0eS5vcmFjbGVj"
      +"bG91ZC5jb20vIl0sImlhdCI6MTU5OTUzMDQwMCwiZXhwIjoxNTk5NTMwNDMwfQ.abc-_";
      impl._getSignedIDCSAssertion(signer, "region", "vault-subdomain", null, "ocid123", "testid", "testalias").then(res => {
        expect(res).to.equal(expectedJWT);
        fetchStub.restore();
        done();
      }).catch((e) => {
        fetchStub.restore();
        done(e);
      });
    });
    it("Makes a call into Secrets to obtain a key to sign an assertion", function (done) {
      var fetchStub = sinon.stub(fetch, 'Promise').returns(Promise.resolve({
        json: () => {
          return {"secretBundleContent":{"content":"key"}};
        }
      }));
      var signStub = sinon.stub(idcsHelper, "generateClientAssertion").returns("assertion");
      var signer = { signRequest: sinon.fake((request) => { return request; }) };
      var expectedJWT = "assertion";
      impl._getSignedIDCSAssertion(signer, "region", null, "ocid123", null, "testid", "testalias").then(res => {
        expect(res).to.equal(expectedJWT);
        fetchStub.restore();
        signStub.restore();
        done();
      }).catch((e) => {
        fetchStub.restore();
        signStub.restore();
        done(e);
      });
    });
  });
});
