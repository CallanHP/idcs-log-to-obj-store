//Load a local OCI config, assuming there will be a similar
//setup to OCI CLI, which puts config information in ~/.oci/config
//Just going to do really primitive parsing and throw errors, since
//this shouldn't really be used beyond local testing
const fs = require('fs');

module.exports.loadLocalConfig = function(filepath, profile){
  //Attempt to read the file
  var configStr = fs.readFileSync(filepath, {encoding: 'utf8'});
  var configLines = configStr.split("\n");
  var configs = {};
  var currentConfig;
  var firstConfig;
  for(var line of configLines){
    line = line.trim();
    if(line.length == 0 || line.startsWith("#") || line.startsWith("!")){
      continue;
    }
    if(line.startsWith("[")){
      //This is a profile
      try{
        let configName = line.match(/\[(.+)\]/)[1].trim().toLowerCase();
        configs[configName] = {};
        if(!currentConfig){
          firstConfig = configName;
        }
        currentConfig = configName;
      }catch(e){
        throw new SyntaxError("Config file is malformed - profile name line: \"" +line +"\" is invalid!");
      }
    }else{
      try{
        //Slightly primative regex (it doens't handle escaped quotations, so um.. don't use them...)
        let [match, key, val] = line.match(/(.+)=\s*"{0,1}([^"#]*)/);
        if(!currentConfig){
          configs["default"]={};
          currentConfig = "default";
        }
        if(val && val.trim().length != 0){
          configs[currentConfig][key.trim()] = val.trim();
        }        
      }catch(e){
        throw new SyntaxError("Config file is malformed - line: \"" +line +"\" is invalid!");
      }
    }
  }
  //If a particular profile was requested...
  if(profile){
    //Yeah yeah... validate profile is a string etc...
    if(configs[profile.toLowerCase()]){
      return configs[profile.toLowerCase()];
    }else{
      throw new Error("No profile \"" +profile +"\" in config file!");
    }
  }
  //If a default was specified, or profile was unnamed...
  if(configs["default"]){
    return configs["default"];
  }
  //If we only have one...
  if(Object.keys(configs).length = 1){
    return configs[Object.keys(configs)[0]];
  }
  //Otherwise... return the first
  return configs[firstConfig];
}