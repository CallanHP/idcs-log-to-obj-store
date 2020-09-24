//Just going to use base nodeJS Crypto for signing - because we are old school like that
const crypto = require('crypto');

//We are also going to throw our old-school reputation away immediately by using ES6 classes...
class OciRequestSigner {
  constructor(keyId, key, passphrase) {
    this.keyId = keyId;
    this.key = key;
    this.passphrase = passphrase;
  }

  /* Sign a 'request' with the given KeyID and Key.
   * A request is an object with:
   *  - url
   *  - method
   *  - headers
   *  - body
   * Returns an updated request, with all of the headers needed for Auth populated
   */
  signRequest(request) {
    var headersToSign = [
      "date",
      "(request-target)",
      "host"
    ];
    var nowDate = new Date().toGMTString();
    var hostname = /^https?:\/\/([^\/]+)/.exec(request.url.trim())[1];
    var reqTarget = request.method.toLowerCase() + " " + request.url.trim().replace(/^https?:\/\/[^\/]+/, "");
    var headerSigningValues = {
      "(request-target)": reqTarget,
      "host": hostname,
      "date": nowDate
    };
    var methodsThatRequireExtraHeaders = ["POST", "PUT"];
    if (methodsThatRequireExtraHeaders.indexOf(request.method.toUpperCase()) !== -1) {
      var body = request.body;
      //Calculate the hash of the body, then set a variable for it.
      const hash = crypto.createHash('sha256');
      hash.update(body)
      var sha256digest = hash.digest("base64");
      headersToSign = headersToSign.concat([
        "content-type",
        "content-length",
        "x-content-sha256"
      ]);
      headerSigningValues["content-type"] = request.headers["content-type"];
      request.headers["Content-Length"] = body.length;
      headerSigningValues["content-length"] = body.length;
      request.headers["x-content-sha256"] = sha256digest;
      headerSigningValues["x-content-sha256"] = sha256digest;

    }
    //Establish the signing string
    var signingBase = '';
    headersToSign.forEach(function (h) {
      if (signingBase !== '') {
        signingBase += '\n';
      }
      signingBase += h.toLowerCase() + ": " + headerSigningValues[h];
    });
    //Sign it with our private key
    const sign = crypto.createSign('SHA256');
    sign.update(signingBase);
    sign.end();
    var key;
    if(this.passphrase && this.key.includes("ENCRYPTED")){
      key = crypto.createPrivateKey({key: this.key, passphrase: this.passphrase});
    }else{
      key = crypto.createPrivateKey(this.key);
    }
    var hash = sign.sign( key, "base64");
    var signatureOptions = {
      version: "1",
      keyId: this.keyId,
      algorithm: "rsa-sha256",
      headers: headersToSign,
      signature: hash
    };
    //Parametised template for the signature string
    var template = 'Signature version="${version}",keyId="${keyId}",algorithm="${algorithm}",headers="${headers}",signature="${signature}"';
    var signature = template;
    //Fill in the parametised string using the signatureOptions we just built
    Object.keys(signatureOptions).forEach(function (key) {
      var pattern = "${" + key + "}";
      var value = (typeof signatureOptions[key] != 'string') ? signatureOptions[key].join(' ') : signatureOptions[key];
      signature = signature.replace(pattern, value);
    });
    //Set the request headers
    request.headers["Authorization"] = signature;
    request.headers["hostname"] = hostname;
    request.headers["date"] = nowDate;
    return request;
  }
}

module.exports = OciRequestSigner;