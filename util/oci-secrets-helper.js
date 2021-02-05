const fetch = require('node-fetch');

/*
 * Just splitting out this API functionality... in case
 * Get the content of a secret by ID from the Secrets in Vault Service.
 */
module.exports.getSecret = function(signer, region, secretId){
  return new Promise((resolve, reject) => {
    var request = {
      url: "https://secrets.vaults." + region + ".oci.oraclecloud.com/20190301/secretbundles/" + secretId,
      method: "GET",
      headers: {}
    }
    request = signer.signRequest(request);
    fetch(request.url, request).then(res => {
      return res.json();
    }).then(json => {
      if (!json.secretBundleContent || !json.secretBundleContent.content) {
        return reject("Error pulling secret from Vault! No secret in response!")
      }
      return resolve(json.secretBundleContent.content);
    }).catch(err => {
      reject(err);
    })
  });
};

/*
 * Use the RSA key in the Vaults service to sign a message.
 * This assumes you are signing a smallish message, less than 4096 bytes
 */
module.exports.signMessage = function(signer, region, vaultSubdomain, keyId, message, algorithm){
  return new Promise((resolve, reject) => {
    //Need to base64 encode the message, since the Signing API expects a 
    //base64 encoded binary representation, even if the message is already in 
    //base64 as it is a JWT string...
    var messageToSign = Buffer.from(message, 'utf8').toString('base64')
    var signingRequest = {
      keyId: keyId,
      message: messageToSign, 
      signingAlgorithm: algorithm
    };
    var request = {
      url: "https://" +vaultSubdomain +".kms" + region + ".oci.oraclecloud.com/20180608/sign",
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(signingRequest)
    }
    request = signer.signRequest(request);
    fetch(request.url, request).then(res => {
      return res.json();
    }).then(json => {
      if (!json.signature) {
        return reject("Error signing the message with key in Vault!")
      }
      return resolve(json.signature);
    }).catch(reject)
  });
};