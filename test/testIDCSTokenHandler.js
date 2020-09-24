const expect = require('chai').expect;
const sinon = require('sinon');

const crypto = require('crypto');

var impl = require("../util/idcs-token-helper");

//If only there was some annotation to stop getting the alerts for having
//a private key in my repo...
//This is a test key! It is a dummy generated value!
const samplePrivate = "-----BEGIN PRIVATE KEY-----\n"
+"MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC69yGkgz86tKUN\n"
+"7eY6WJ45bw0i2fh5zEnyLubD+BahP9FeHN7ccMV+ENNoS3YwERCW3YccBrtpmaK0\n"
+"lW76+dP/9yeOdG5YmjP8guiUpI+Pg7EIjKPajj53FoO5O/in9JgpiEKp6hsBsuaj\n"
+"2Xn2/V0vMFnHPEOKvTl3Z4o2jlnGgRCyiuTtcMr+sQi4/m2eOCkQpQxuiCEWV73y\n"
+"cTsDD3EmqQXiVbkd8B6+TZTKLfwR2xYovXaxPKkGIRmiGd53yz4px/cRlB2dEnvF\n"
+"7ZUIlmGiNZ3Oyj04OZBmNxS8/k0jQsh8NbNaapXv2Ps3tvdkqtkl+h9iIpFt99Io\n"
+"Ou+R1vYLAgMBAAECggEAP4yovsZtw4KLZ8SpMMPWZCc/C82TC7NIny0Z+xpkdsK+\n"
+"Y4LkrYEXX9ZQRW8A6S2juePqfLg9E5PJHiB87InmaWaU53Lj3vHrIbVNYNjegyV8\n"
+"Ey/asfsPeGMKuveLeWtGHTfXkPGl5Fnu01qkfjN4bQW+Pl5ZhtryoYdsD0crdLDs\n"
+"1431dVUc3v3fRXRROH92ycG/DBZoj0c7atc3PvTxRSxakygWIlmlUfVoSMSSL9jv\n"
+"D4kdWI6xXs0xA/jfTjh00Yp5YsRuQAtsNaACxMGaVtSUE+7CETxR9Fq49ljlreRL\n"
+"dWZfeCq2nAGkDQc6NXAtSc5yDUN1oORtrHXMRJ0fQQKBgQDsF9SbXj8k2op7L7Ec\n"
+"rXlypHPtUr7DBp2jlITHyfYnG/rYVugIFUoQma4H3y9iT9d5mN8KOv9aa0j+OEND\n"
+"kyJJnKPwEi+oCIBUsdilA5iRLAa4EPcN7L3/Mj94Rx9mBTa3mJhk7vzZXcuJxDjK\n"
+"7N45Lpwnqqd8XWVkNCBdjHUCqQKBgQDKutul9vY7Zos+kdtf9nuyxu2VjIf+Dy1/\n"
+"41c2Js0SBwe6WkHeVLq+tq48FHLSVzFc75LjCsObCKJTY9c2AJDVLXzls7T8IBzi\n"
+"KMPj3/t69G0Dhfx82B6gr8ydgWMzWPTWE1rfGaAKXUcKlp8M1XTLD+rdDuVf8ZyD\n"
+"XWDZJydXkwKBgQDfGHG+U2PlxmF/oISDreWKkJ4/T6aVkiXaUtjaFh11vXnfftgJ\n"
+"81wmraIHLD6RbxMVg4CYIUH1RlYWbEIbk+idmNhNXlIMPeROpDQtUmWUIP9EZjue\n"
+"u+yaPvg9BzBDbn/TI+41yqPCH2DbkUF9eDFR5ZqH3TohSfwqoRtIaxaS6QKBgBR4\n"
+"zhlyWOciscj9vaNxJoilIfTKHil/qt6RPItRW8AISbV9y80BzWHY3LtgbT/kYi26\n"
+"W6Dlw17yfkHhgSgI4pdEYqpnfU1AiOolp7JpOeHusNt8OkT5Jg6f8g+tszDKON8t\n"
+"US3aTpj9VmExWJpZK9QdpV/xUyRfJ6j0UwVauNRVAoGASbzlgb4af17azrjz7+5/\n"
+"n+t/cbnRzrP8rBo4kNYpP2/CdOtmwOEbH3iAyoY4kni9FxIPGl+hOl/fr6xir0kw\n"
+"JCMGO46wqFa1ZRhVU7L+fYCSzWZ6VhmfqK1xXji8NzyDNHWPmpOhLxiOxIqPUQvj\n"
+"18ViBNONv1o5pDGyoPgYsy0=\n"
+"-----END PRIVATE KEY-----";

const sampleCert = "-----BEGIN CERTIFICATE-----\n"
+"MIIDazCCAlOgAwIBAgIUd7ES5s6cHhWDl93lj8bPnkk7eMAwDQYJKoZIhvcNAQEL\n"
+"BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM\n"
+"GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMDA5MjQwMzQzMDlaFw0yMzA3\n"
+"MTUwMzQzMDlaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw\n"
+"HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB\n"
+"AQUAA4IBDwAwggEKAoIBAQC69yGkgz86tKUN7eY6WJ45bw0i2fh5zEnyLubD+Bah\n"
+"P9FeHN7ccMV+ENNoS3YwERCW3YccBrtpmaK0lW76+dP/9yeOdG5YmjP8guiUpI+P\n"
+"g7EIjKPajj53FoO5O/in9JgpiEKp6hsBsuaj2Xn2/V0vMFnHPEOKvTl3Z4o2jlnG\n"
+"gRCyiuTtcMr+sQi4/m2eOCkQpQxuiCEWV73ycTsDD3EmqQXiVbkd8B6+TZTKLfwR\n"
+"2xYovXaxPKkGIRmiGd53yz4px/cRlB2dEnvF7ZUIlmGiNZ3Oyj04OZBmNxS8/k0j\n"
+"Qsh8NbNaapXv2Ps3tvdkqtkl+h9iIpFt99IoOu+R1vYLAgMBAAGjUzBRMB0GA1Ud\n"
+"DgQWBBQZtPhWahGxoq4pzSpgnhKw1J9w1zAfBgNVHSMEGDAWgBQZtPhWahGxoq4p\n"
+"zSpgnhKw1J9w1zAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCz\n"
+"d9OJapv1spLJ2+fpp+63JfV/7/NAvvV00QOdLgnYsxSxbt362eRb/W12mdDsDSoP\n"
+"3z8ntqPE+gDLuxkRLaUhvqf9Bzxm9i2NEysS04a2/ccDuSqrCgRoPSNwsgguzE5S\n"
+"WuVBUVPH4jyTsNK+O+u27WOSRHxqBILQF3SuaAVDAqoQM5X9Ije0IE2uB0BBXNq7\n"
+"v80dX82PnakNsIDl7hrFR6K21brxhuo9JxFFGmVBR87C7X0yi1dY7zybJweWPuus\n"
+"1XGsP2hJe/q3EuHjs1WW1T8pvo99tYJ93zPInIn9TY2anNUgs8ewTOoVcq6R+Qzl\n"
+"2gRDFVJMFmdTFYX3AnXE\n"
+"-----END CERTIFICATE-----";

describe("IDCS token helper", function(){
  describe("generateClientAssertion", function(){
    //Stub the date method to set it to the sample time
    before(function () { clock = sinon.useFakeTimers(new Date("2020-09-08T02:00:00.000Z")); })
    after(function () { clock.restore(); })
    it("Generates a valid signed JWT", function(){
      var assertion = impl._generateClientAssertion("testid", "testalias", samplePrivate, 100);
      var expectedAssertion = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3RhbGlhcyJ9."
      +"eyJzdWIiOiJ0ZXN0aWQiLCJpc3MiOiJ0ZXN0aWQiLCJhdWQiOlsiaHR0cHM6Ly9pZGVudGl0eS5vcmFjbGVj"
      +"bG91ZC5jb20vIl0sImlhdCI6MTU5OTUzMDQwMCwiZXhwIjoxNTk5NTMwNTAwfQ.k0tw7-dlk0lvFCRdNm2E9"
      +"zeScqjgwRCutlvXpTeydd8cRpP2_5C5lv4VKN_Bi-ke_5KyRTrNgdNVhNA7TDOArupChPBULgHNE5GvP7w80"
      +"Rvg9d2NziLSHCYzsIHiT2wA5Imc7UsD-d4P8ifHOmFUB88I-J_CdS_jY18urCWnHNd9uM03F70AUNQblKx_d"
      +"UkQZphGvj-ZfxNL3W1by5LddCul64k6E6hqqlLNl3mE1hAidXZg6j_l6D0gy4VKllCPjM-SkyNOhWE5dhOKpW"
      +"GnukDM-jauHroIBva1fAdygBnb7ZjPnt95cceVWTf3xAJt_tINB9HDwdo9GLikGZHtDA";
      expect(assertion).to.equal(expectedAssertion);
      var verifier = crypto.createVerify('RSA-SHA256');
      var assertionParts = assertion.split(".");
      verifier.update(assertionParts[0]+"."+assertionParts[1]);
      expect(verifier.verify(sampleCert, assertionParts[2], 'base64')).to.equal(true);
    });
  });
});