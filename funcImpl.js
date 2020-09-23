const fs = require('fs');
const fetch = require('node-fetch');

const OciRequestSigner = require("./util/oci-sign");
const idcsHelper = require("./util/idcs-token-helper");
const secretsHelper = require('./util/oci-secrets-helper');

const log4js = require("log4js");
const path = require('path');
var logger = log4js.getLogger();
logger.level = process.env["LOG_LEVEL"] || "error";

const IDCS_MAX_COUNT = 1000;

/* Function implementation designed to handle pulling logs out of IDCS in a '
 * controlled manner and write them to an object storage bucket for archiving.
 *
 * This implementation takes advantage of a number of OCI services to secure 
 * access to a lot of the backend APIs. It uses Secrets in Vault to store 
 * sensitive config information, and uses resource principals where possible.
 * 
 * The function is dynamically configured at runtime, and expects the following
 * in the function config:
 * 
 * objStoreBucketURL - full URL for the object store bucket inc. region, bucket, etc
 * ociRegion - region code, e.g. ap-sydney-1
 * idcsBaseUrl - idcs idenfier e.g. idcs-<host>.identity.oraclecloud.com
 * idcsCertSecretId - OCID of the secret which stores IDCS signing keys
 * idcsCertAlias - Alias assigned to the public key uploaded in IDCS
 * idcsClientId - Client Identifier for an IDCS client with Audit privileges
 * maxEvents - Maximum number of Audit events to handle in one iteration (default 2500)
 * minElapsedTime - Minimum time between runs in seconds (optional)
 */
var exportIDCSEvents = function (input, context) {
  return new Promise((resolve, reject) => {
    //Initialise our config from the function context
    const objUrl = context.config.objStoreBucketURL || process.env["OBJ_STORE_URL"];
    const region = context.config.ociRegion || process.env["OCI_REGION"];
    const idcsUrl = context.config.idcsBaseUrl || process.env["IDCS_URL"];
    const idcsCertSecretId = context.config.idcsCertSecretId || process.env["IDCS_SECRET_ID"];
    const idcsCertAlias = context.config.idcsCertAlias || process.env["IDCS_CERT_ALIAS"];
    const idcsClientId = context.config.idcsClientId || process.env["IDCS_CLIENT_ID"];
    const maxEvents = parseInt(context.config.maxEvents) || parseInt(process.env["MAX_EVENTS"]) || 2500

    const minTime = context.config.minElapsedTime || process.env["MIN_TIME"] || null;

    if (context.config.logLevel) {
      logger.level = context.config.logLevel;
    }

    if (!objUrl || !region || !idcsUrl || !idcsCertSecretId || !idcsCertAlias || isNaN(maxEvents)) {
      logger.error("Function lacking critical config information.");
      logger.error("objUrl:" + objUrl);
      logger.error("region:" + region);
      logger.error("idcsUrl:" + idcsUrl);
      logger.error("idcsCertSecretId:" + idcsCertSecretId);
      logger.error("idcsCertAlias:" + idcsCertAlias);
      logger.error("maxEvents:" + maxEvents);
      if (context.httpGateway) {
        context.httpGateway.statusCode = 500;
      }
      return resolve({ "error": "Function hasn't been configured correctly yet!" });
    }

    //Initially we need to establish our identity for the subsequent OCI API calls
    //Functions lets us use resource principals, and injects the values into the fn at runtime
    var ociSigner;
    //This is used as an identifier
    const sessionTokenFilePath = process.env.OCI_RESOURCE_PRINCIPAL_RPST;
    //This is our Private key for the resource principal
    const privateKeyPath = process.env.OCI_RESOURCE_PRINCIPAL_PRIVATE_PEM;
    if (sessionTokenFilePath && privateKeyPath) {
      logger.debug("Loading resource principal info.");
      let rpst = fs.readFileSync(sessionTokenFilePath, { encoding: 'utf8' });
      let privateKey = fs.readFileSync(privateKeyPath, { encoding: 'utf8' });
      ociSigner = new OciRequestSigner("ST$" + rpst, privateKey);
    } else {
      logger.debug("Attempting to load local oci config.");
      //we might be running locally, so do local setup if needed
      const OciConfigLoader = require('./util/oci-config-loader');
      var config;
      try {
        config = OciConfigLoader.loadLocalConfig(path.join(require('os').homedir(), "/.oci/config"));
      } catch (e) {
        logger.error("Error loading local config file.")
        logger.error(e);
        return resolve({ "error": "Could not load config." });
      }
      //validate.. etc...
      let keyId = config.tenancy + "/" + config.user + "/" + config.fingerprint;
      ociSigner = new OciRequestSigner(keyId, fs.readFileSync(config.key_file), config.passphrase || null);
    }

    //Step 1. Check when the most recent push of logs happened
    logger.debug("Getting the last timestamp from the retained logs...");
    getLastObjectTimestamp(ociSigner, objUrl).then(timestamp => {
      logger.debug("Last log time: " + timestamp);
      //Step 1a. If we are not at min time elapsed, bail out.
      if (minTime) {
        var elapsed = Date.now() - Date.parse(timestamp);
        if (elapsed / 1000 < minTime) {
          let e = new Error("Min time not elapsed");
          e.statusCode = 417;
          throw e;
        }
      }
      //Step 2. Get the audit events from IDCS
      //Get an IDCS token
      logger.debug("Getting the signing key from vault...");
      return getIDCSSigningKey(ociSigner, region, idcsCertSecretId).then(jwtKey => {
        logger.debug("Obtaining IDCS token...");
        return idcsHelper.getAccessToken(idcsUrl, idcsClientId, idcsCertAlias, jwtKey);
      }).then(token => {
        //Use it to get the events
        logger.debug("Pulling IDCS Audit Events...");
        return getIDCSAuditEvents(idcsUrl, token, timestamp, maxEvents);
      }).then(events => {
        //Step 3. Write the events back to Object Storage
        //I guess if there are no events, don't do anything?
        if (events.length != 0) {
          var lastEventTimestamp = events[events.length - 1].timestamp;
          logger.debug("Writing " + events.length + " to object store.");
          return writeEvents(ociSigner, objUrl, timestamp, lastEventTimestamp, events);
        }
        return null;
      }).catch(err => {
        //Throw this to the higher level catcher.
        throw err;
      });
    }).then((res) => {
      logger.debug("Events written (or not, if 0), returning!");
      return resolve({
        "done": "yes!"
      });      
    }).catch(err => {
      logger.error(err);
      if (context.httpGateway) {
        context.httpGateway.statusCode = err.statusCode || 500;
      }
      return resolve({ "error": "Error while invoking function." });
    })
  });
}

/*
 * Get the timestamp of the last log entry by checking what has previously
 * been written to object store.
 * Log naming is the range of timestamps covered, i.e.
 * 2020-09-21T00:00:00.001Z-2020-09-21T00:10:00.001Z-idcs-audit-events.json
 * 
 * Start point is the latest log for today. If there are no logs for today,
 * then the latest from yesterday. If there are no logs for yesterday, then
 * start pulling logs from 00:00:000 yesterday.
 */
var getLastObjectTimestamp = function (signer, objUrl) {
  return new Promise((resolve, reject) => {
    //First, lets get the list of objects for today!
    var now = new Date();
    getLastTimestampForDay(signer, objUrl, now).then(timestamp => {
      //If no results, get yesterday's results.
      if (!timestamp) {
        now.setUTCDate(now.getUTCDate() - 1);
        return getLastTimestampForDay(signer, objUrl, now);
      }
      return timestamp;
    }).then(timestamp => {
      //If still no results, just start from yesterday morning
      if (!timestamp) {
        now.setUTCHours(0);
        now.setUTCMinutes(0);
        now.setUTCSeconds(0);
        now.setUTCMilliseconds(0);
        logger.debug("Falling back on default date: " + now);
        timestamp = now.toISOString();
      }
      return resolve(timestamp);
    }).catch(reject);
  });
};

/*
 * Get the timestamp from the name of the last object for a given day.
 */
var getLastTimestampForDay = function (signer, objUrl, date) {
  return new Promise((resolve, reject) => {
    //We are using object prefixes to sort objects by day - this is done so it is easy to pull
    //the logs we need from the UI at a later stage. This also means we can do some query logic to
    //minimise the number of objects we get back.
    logger.debug("In getLastTimestamp for day: " + date.toISOString());
    var request = {
      url: objUrl + "/o?prefix=" + date.toISOString().split("T")[0],
      method: "GET",
      headers: {}
    }
    request = signer.signRequest(request);
    fetch(request.url, request).then(res => {
      return res.json();
    }).then(json => {
      //If there are results, then get the last one to determine our timestamp (results are sorted alphabetically)
      if (json.objects && json.objects.length != 0) {
        while(json.objects.length > 0){
          var objName = json.objects.pop().name;
          //Since the name is <start timestamp>-<end timestamp>, we will match the latter using regex
          var objNameMatches = objName.match(/.*Z-(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)/);
          if (!objNameMatches || objNameMatches.length != 2) {
            //Um? Malformed record in the store... so we will lookup previous entry
            //return reject("Malformed object name returned from Object Store - \"" + objName + "\"");
            continue;
          }
          return resolve(objNameMatches[1]);
        }
      }
      //No timestamps for today...
      return resolve(null);
    }).catch(err => {
      return reject(err);
    });
  });
}

/*
 * Write back to object store...
 */
var writeEvents = function (signer, objUrl, startTimestamp, endTimestamp, events) {
  return new Promise((resolve, reject) => {
    //Writing simple text to object store is actually really easy...
    var request = {
      url: objUrl + "/o/" +startTimestamp + "-" + endTimestamp + "-idcs-audit-events.json",
      method: "PUT",
      headers: {
        "content-type": "text/plain"
      },
      body: JSON.stringify(events, null, 2)
    }
    request = signer.signRequest(request);
    fetch(request.url, request).then(resolve).catch(reject);
  });
}

/*
 * We need to obtain an IDCS access token using a fiddly, but probably best 
 * practice mechanism.
 * We have a private key stored in Secrets, and we will use the resource principal
 * of our function to obtain that key, then subsequently use the key to generate
 * a client assertion, which in turn we exchange for an access token.
 * This lets us avoid having any sensitive information stored in configs anywhere.
 */
var getIDCSSigningKey = function (signer, region, idcsCertSecretId) {
  return new Promise((resolve, reject) => {
    secretsHelper.getSecret(signer, region, idcsCertSecretId).then((secret) => {
      //The assumption is that the key is in PEM format, which is base64 encoded anyway
      var keyString = "-----BEGIN PRIVATE KEY-----\n" + secret + "\n-----END PRIVATE KEY-----";
      resolve(keyString);
    }).catch(reject);
  });
}

/*
 * Need some smarts around the Audit API, to facilitate the sorts of logging 
 * behaviour we are looking for.
 * When pulling these, we need to be aware of our function runtime limitations,
 * which include memory and execution time. As such, we have a 'maxEvents' 
 * parameter, which should be tuned to fit.
 * The thinking behind this is if you have a lot of events, they will take
 * time to write, and our function might be killed. So, in very busy periods
 * we just write the max, rather than all of the way up until now.
 * The smarts around 'lastTimestamp' in how we write the events should allow
 * us to play 'catch-up' if we fall behind, getting back to recording events
 * up until 'now' when there are fewer audit events coming out of IDCS.
 */
var getIDCSAuditEvents = function (idcsUrl, token, startTimestamp, maxEvents) {
  logger.debug("Get events - startTimestamp: " + startTimestamp);
  //TODO: Handle maxEvents > 1000, since that is the most that IDCS returns
  return new Promise((resolve, reject) => {
    getIDCSAuditEventsPaginated(idcsUrl, token, startTimestamp, maxEvents<IDCS_MAX_COUNT?maxEvents:IDCS_MAX_COUNT, 1).then((data) => {
      if(!data.totalResults || !data.Resources){
        throw new Error("Audit Events response from IDCS malformed.");
      }
      var events = data.Resources;
      if(maxEvents>IDCS_MAX_COUNT && data.totalResults > IDCS_MAX_COUNT){
        var requests = [];
        maxEvents -= IDCS_MAX_COUNT;
        //IDCS indexes start from 1... strange
        var offset = IDCS_MAX_COUNT+1;
        while(offset < data.totalResults && maxEvents > 0){
          requests.push(getIDCSAuditEventsPaginated(idcsUrl, token, startTimestamp, maxEvents<IDCS_MAX_COUNT?maxEvents:IDCS_MAX_COUNT, offset));
          maxEvents -= IDCS_MAX_COUNT;
          offset += IDCS_MAX_COUNT;
        }
        Promise.all(requests).then((responses)=>{
          for(var i=0; i<responses.length; i++){
            if(responses[i].Resources){
              events = events.concat(responses[i].Resources);
            }else{
              throw new Error("Audit Events response from IDCS malformed.");
            }
          }
          resolve(events);
        }).catch((err)=>{throw err});
      }else{
        resolve(events);
      }
    }).catch(reject);
    // var request = {
    //   url: (idcsUrl.startsWith("http") ? idcsUrl : "https://" + idcsUrl) + "/admin/v1/AuditEvents"
    //     + "?filter=timestamp+gt+%22" + startTimestamp + "%22&count=" + maxEvents + "&sortBy=timestamp&sortOrder=ascending",
    //   method: "GET",
    //   headers: {
    //     "Authorization": "Bearer " + token
    //   }
    // }
    // fetch(request.url, request).then(res => {
    //   return res.json();
    // }).then(json => {
    //   //strip out the surrounding meta
    //   if (json.Resources) {
    //     return resolve(json.Resources);
    //   } else {
    //     //logger.debug(json);
    //     throw new Error("Audit Events response from IDCS malformed.");
    //   }
    // }).catch(reject);
  });
}

var getIDCSAuditEventsPaginated = function(idcsUrl, token, startTimestamp, maxEvents, offset){
  return new Promise((resolve,reject)=> {
    var request = {
      url: (idcsUrl.startsWith("http") ? idcsUrl : "https://" + idcsUrl) + "/admin/v1/AuditEvents"
        + "?filter=timestamp+gt+%22" + startTimestamp + "%22&count=" + maxEvents + "&startIndex=" 
        + offset +"&sortBy=timestamp&sortOrder=ascending",
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    }
    fetch(request.url, request).then(res => {
      return res.json();
    }).then(resolve).catch(reject);
  });  
}

//Export for testing
module.exports._getLastTimestampForDay = getLastTimestampForDay;
module.exports._getLastObjectTimestamp = getLastObjectTimestamp;
module.exports._getIDCSAuditEvents = getIDCSAuditEvents;
module.exports._getIDCSAuditEventsPaginated = getIDCSAuditEventsPaginated;


module.exports.handler = exportIDCSEvents;

//Just for local end-to-end
// exportIDCSEvents(null, {config:{}}).then(()=>{
//   console.log("Done!");
// });