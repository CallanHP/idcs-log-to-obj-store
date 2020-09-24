const expect = require('chai').expect;
const sinon = require('sinon');
const fetch = require('node-fetch');

const impl = require("../funcImpl");

describe("ObjectStorage Timestamp retreival", function () {
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