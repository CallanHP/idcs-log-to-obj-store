//Just using plain node crypto... I don't know if this means I am progressing
//or regressing as a developer.
const crypto = require('crypto');
const fetch = require('node-fetch');

//Helper function for performing Base64 URL encoding as required for JWTs
function urlEncode(s) {
  s = s.split('=')[0];
  s = s.replace(/\+/g, '-');
  s = s.replace(/\//g, '_');
  return s;
}

/*
 * Generate a client assertion and get an IDCS access token 
 */
module.exports.getAccessToken = function (idcsUrl, clientId, certAlias, key) {
  return new Promise((resolve, reject) => {
    var clientAssertion = generateClientAssertion(clientId, certAlias, key);
    //Yeah, we are sending un-validated parameters here... this is bad. Don't do this.
    //On the other hand, in this use case, in order to manipulate these parameters, the
    //user has to have admin access to your Functions environment, so...
    var request = {
      url: (idcsUrl.startsWith("http") ? idcsUrl : "https://" + idcsUrl) + "/oauth2/v1/token",
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: "grant_type=client_credentials&scope=urn:opc:idm:__myscopes__"
        + "&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
        + "&clientId=" + clientId + "&client_assertion=" + clientAssertion
    }
    fetch(request.url, request).then(res => {
      return res.json();
    }).then(json => {
      if(json.access_token){
        return resolve(json.access_token);
      }
      return reject("Error obtaining token from IDCS - response: " +JSON.stringify(json));
    }).catch(err => {
      reject(err)
    });
  });
}

/*
 * Generate a signed JWT in a valid format for IDCS to be used as a client 
 * assertion.
 */
var generateClientAssertion = function (clientId, certAlias, key, expiry) {
  if (!expiry) {
    expiry = 30; //30 seconds
  }
  var tokenIssued = Math.floor(Date.now() / 1000);
  var tokenExpiry = tokenIssued + expiry;
  var header = {
    "alg": "RS256",
    "typ": "JWT",
    "kid": certAlias
  };
  var payload = {
    "sub": clientId,
    "iss": clientId,
    "aud": ["https://identity.oraclecloud.com/"],
    "iat": tokenIssued,
    "exp": tokenExpiry
  };
  var tokenstr = urlEncode(Buffer.from(JSON.stringify(header)).toString('base64')) + "."
    + urlEncode(Buffer.from(JSON.stringify(payload)).toString('base64'));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(tokenstr);
  sign.end();
  var sig = sign.sign(key, "base64");
  return tokenstr + "." + urlEncode(sig);
  //const altsign = crypto.createSign('id-rsassa-pkcs1-v1_5-with-sha3-256');
}

