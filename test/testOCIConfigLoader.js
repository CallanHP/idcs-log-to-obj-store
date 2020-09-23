const expect = require('chai').expect;
const assert = require('chai').assert;
const sinon = require('sinon');
//Take advantage of Node module caching to stub the base modules
const fs = require('fs');

var OCIConfigLoader = require("../util/oci-config-loader");

describe("OCI Config File Parser", function(){
  //Stub the date method to set it to the sample time
  it("Should parse a config file holding 'key=value' pairs", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "key1=value1\nkey2=value2"});
    var expectedConfig = {"key1":"value1", "key2":"value2"};
    var config = OCIConfigLoader.loadLocalConfig("/dummy");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });

  it("Should handle requesting a profile", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1]\nkey1=value1\nkey2=value2\n[profile2]\nkey3=value3"});
    var expectedProfile1 = {"key1":"value1", "key2":"value2"};
    var expectedProfile2 = {"key3":"value3"};
    var config = OCIConfigLoader.loadLocalConfig("/dummy", "profile1");
    expect(config).to.deep.equal(expectedProfile1);
    config = OCIConfigLoader.loadLocalConfig("/dummy", "profile2");
    expect(config).to.deep.equal(expectedProfile2);
    fakefs.restore();
  });

  it("Should return the default profile if none requested", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1]\nkey1=value1\nkey2=value2\n[default]\nkey3=value3"});
    var expectedDefaultProfile = {"key3":"value3"};
    var config = OCIConfigLoader.loadLocalConfig("/dummy");
    expect(config).to.deep.equal(expectedDefaultProfile);
    fakefs.restore();
  });

  it("Should return the only profile if there is only one", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1]\nkey1=value1\nkey2=value2\nkey3=value3"});
    var expectedConfig = {"key1":"value1", "key2":"value2","key3":"value3"};
    var config = OCIConfigLoader.loadLocalConfig("/dummy");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });

  it("Should throw a syntax error if the profile name is malformed", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1\nkey1=value1\nkey2=value2\nkey3=value3"});
    var expectedConfig = {"key1":"value1", "key2":"value2","key3":"value3"};
    try{
      var config = OCIConfigLoader.loadLocalConfig("/dummy");
      assert.fail("Error should have been thrown from passing malformed profile");
    }catch(e){
      expect(e).to.be.an("error");
      expect(e.message).to.equal("Config file is malformed - profile name line: \"[profile1\" is invalid!")
    }
    fakefs.restore();
  });

  it("Should throw a syntax error if a key/value line is malformed", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1]\nkey1=value1\nkey2 value2\nkey3=value3"});
    var expectedConfig = {"key1":"value1", "key2":"value2","key3":"value3"};
    try{
      var config = OCIConfigLoader.loadLocalConfig("/dummy");
      assert.fail("Error should have been thrown from passing malformed profile");
    }catch(e){
      expect(e).to.be.an("error");
      expect(e.message).to.equal("Config file is malformed - line: \"key2 value2\" is invalid!")
    }
    fakefs.restore();
  });

  it("Should parse, but not include a key if the value is empty", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1]\nkey1=value1\nkey2=value2\nkeyNoValue=\nkeyNoValSpace=    \n"});
    var expectedConfig = {"key1":"value1", "key2":"value2"};
    var config = OCIConfigLoader.loadLocalConfig("/dummy");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });

  it("Should handle comments in the file", function(){
    var fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(()=>{return "[profile1]\nkey1=value1\n#This is key 2\nkey2=value2 #value2 is here\n!this is key3\nkey3=value3"});
    var expectedConfig = {"key1":"value1", "key2":"value2", "key3":"value3"};
    var config = OCIConfigLoader.loadLocalConfig("/dummy");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });
});