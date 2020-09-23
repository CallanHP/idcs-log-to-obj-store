const expect = require('chai').expect;
const sinon = require('sinon');

var OciRequestSigner = require("../util/oci-sign");

//Using the samples from the OCI Docs
const samplePrivate = "-----BEGIN RSA PRIVATE KEY-----\n"
+"MIICXgIBAAKBgQDCFENGw33yGihy92pDjZQhl0C36rPJj+CvfSC8+q28hxA161QF\n"
+"NUd13wuCTUcq0Qd2qsBe/2hFyc2DCJJg0h1L78+6Z4UMR7EOcpfdUE9Hf3m/hs+F\n"
+"UR45uBJeDK1HSFHD8bHKD6kv8FPGfJTotc+2xjJwoYi+1hqp1fIekaxsyQIDAQAB\n"
+"AoGBAJR8ZkCUvx5kzv+utdl7T5MnordT1TvoXXJGXK7ZZ+UuvMNUCdN2QPc4sBiA\n"
+"QWvLw1cSKt5DsKZ8UETpYPy8pPYnnDEz2dDYiaew9+xEpubyeW2oH4Zx71wqBtOK\n"
+"kqwrXa/pzdpiucRRjk6vE6YY7EBBs/g7uanVpGibOVAEsqH1AkEA7DkjVH28WDUg\n"
+"f1nqvfn2Kj6CT7nIcE3jGJsZZ7zlZmBmHFDONMLUrXR/Zm3pR5m0tCmBqa5RK95u\n"
+"412jt1dPIwJBANJT3v8pnkth48bQo/fKel6uEYyboRtA5/uHuHkZ6FQF7OUkGogc\n"
+"mSJluOdc5t6hI1VsLn0QZEjQZMEOWr+wKSMCQQCC4kXJEsHAve77oP6HtG/IiEn7\n"
+"kpyUXRNvFsDE0czpJJBvL/aRFUJxuRK91jhjC68sA7NsKMGg5OXb5I5Jj36xAkEA\n"
+"gIT7aFOYBFwGgQAQkWNKLvySgKbAZRTeLBacpHMuQdl1DfdntvAyqpAZ0lY0RKmW\n"
+"G6aFKaqQfOXKCyWoUiVknQJAXrlgySFci/2ueKlIE1QqIiLSZ8V8OlpFLRnb1pzI\n"
+"7U1yQXnTAEFYM560yJlzUpOb1V4cScGd365tiSMvxLOvTA==\n"
+"-----END RSA PRIVATE KEY-----";

const sampleKeyId = "ocid1.tenancy.oc1..aaaaaaaaba3pv6wkcr4jqae5f15p2b2m2yt2j6rx32uzr4h25vqstifsfdsq/ocid1.user.oc1..aaaaaaaat5nvwcna5j6aqzjcaty5eqbb6qt2jvpkanghtgdaqedqw3rynjq/73:61:a2:21:67:e0:df:be:7e:4b:93:1e:15:98:a5:b7";

var clock;

describe("API Signing implementation", function(){
  //Stub the date method to set it to the sample time
  before(function(){ clock = sinon.useFakeTimers(1388957500000);})
  after(function(){clock.restore();})
  it("Should successfully sign a GET request", function(){
    var signer = new OciRequestSigner(sampleKeyId, samplePrivate);
    //Using the samples from the OCI Docs
    var request = {
      url: "https://iaas.us-phoenix-1.oraclecloud.com/20160918/instances?availabilityDomain=Pjwf%3A%20PHX-AD-1&compartmentId=ocid1.compartment.oc1..aaaaaaaam3we6vgnherjq5q2idnccdflvjsnog7mlr6rtdb25gilchfeyjxa&displayName=TeamXInstances&volumeId=ocid1.volume.oc1.phx.abyhqljrgvttnlx73nmrwfaux7kcvzfs3s66izvxf2h4lgvyndsdsnoiwr5q",
      method: "GET",
      headers:{}
    }
    var expectedAuthZ = 'Signature version="1",'
    +'keyId="ocid1.tenancy.oc1..aaaaaaaaba3pv6wkcr4jqae5f15p2b2m2yt2j6rx32uzr4h'
    +'25vqstifsfdsq/ocid1.user.oc1..aaaaaaaat5nvwcna5j6aqzjcaty5eqbb6qt2jvpkang'
    +'htgdaqedqw3rynjq/73:61:a2:21:67:e0:df:be:7e:4b:93:1e:15:98:a5:b7",'
    +'algorithm="rsa-sha256",'
    +'headers="date (request-target) host",'
    +'signature="JDFdcwTJ0TbiDFvAv5Q2irKMwrvEQoVzw9qYvcVianMskb8XrLLFlvs3Yr9uz/'
    +'d9y74rMqxRlWS0KATOlhD1ao2+/FnyOj2yjdWCSjDnKR56uV8IsWCum0g7eY5jXnfOSACBj01'
    +'gwbM28JYrJ//DLmyUzF4QPScgFYXrAmrwQO0="';
    var expectedHostname = "iaas.us-phoenix-1.oraclecloud.com";
    request = signer.signRequest(request, sampleKeyId, samplePrivate);
    expect(request.headers["Authorization"]).to.equal(expectedAuthZ);
    expect(request.headers["hostname"]).to.equal(expectedHostname);
    expect(request.headers["date"]).to.not.be.null;
  });
  
});