var fileSystem = require('fs');
var environmentFile = '/home/dotcloud/environment.json';

var environment = JSON.parse(fileSystem.readFileSync(environmentFile));
for (variable in environment) {
  console.log('Setting '+variable+'...');
  process.env[variable] = environment[variable];
};

require(__dirname+'/'+process.argv.slice(2)[0]);