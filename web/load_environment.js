var fileSystem = require('fs');
var environmentFile = '/home/dotcloud/environment.json';
try {
  var environment = JSON.parse(fileSystem.readFileSync(environmentFile));
  environment.forEach(function(variable) {
    console.log('Setting '+variable+'...');
    process.env[variable] = environment[variable];
  });
} catch(e) { /* o_O */ }

require(__dirname+'/'+process.argv.slice(2)[0]);