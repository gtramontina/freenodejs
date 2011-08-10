var reds = require('reds');
var redis = require('redis');
var agent = require('superagent');
var fileSystem = require('fs');

var logs = fileSystem.readFileSync(__dirname+'/logs', 'utf8').split('\n');

var stripHTMLTags = function(html) {
  return html.replace(/(<([^>]+)>)/ig, '');
};

var indexLogs = function(client) {
  var search = reds.createSearch('nodejs_logs');
  logs.forEach(function(log) {
    agent.get(log, function(error, response, body) {
      if (error) throw error;
      var lines = stripHTMLTags(body).split('\n')
      lines.forEach(function(line, index) {
        search.index(line, log+'#'+index);
      });
      console.log('Indexed '+log+':'+lines.length);
    });
  });
};

console.log('Starting...');
var client = redis.createClient(
  process.env.DOTCLOUD_DATA_REDIS_PORT,
  process.env.DOTCLOUD_DATA_REDIS_HOST
);

client.auth(
  process.env.DOTCLOUD_DATA_REDIS_PASSWORD,
  function() {
    reds.client = client;
    indexLogs();
  }
);