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