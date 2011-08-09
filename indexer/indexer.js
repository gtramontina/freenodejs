var reds = require('reds');
var agent = require('superagent');
var fileSystem = require('fs');

var logs = fileSystem.readFileSync(__dirname+'/logs', 'utf8').split('\n');
var search = reds.createSearch('nodejs_logs');

var stripHTMLTags = function(html) {
  return html.replace(/(<([^>]+)>)/ig, '');
}

logs.forEach(function(log, index) {
  agent.get(log, function(error, response, body) {
    if (error) throw error;
    search.index(stripHTMLTags(body), index);
  });
});