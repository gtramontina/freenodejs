var reds = require('reds');
var redis = require('redis');
var agent = require('superagent');
var fileSystem = require('fs');

//var logs = fileSystem.readFileSync(__dirname+'/logs', 'utf8').split('\n');

var stripHTMLTags = function(html) {
  return html.replace(/(<([^>]+)>)/ig, '');
};

exports.go = function(client, namespace) {
  /*
  var search = reds.createSearch(namespace);
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
  */
  console.log('Indexing...');
};