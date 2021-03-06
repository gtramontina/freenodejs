var agent = require('superagent');
var nodeio = require('node.io');

var reds;
var namespace;
var redisClient;
var redsSearch;

var logsSource = 'http://nodejs.debuggable.com/'

var stripHTMLTags = function(html) {
  return html.replace(/(<([^>]+)>)/ig, '');
};

var index = function(logs) {
  console.log('# Number of logs to index: '+logs.length);
  var numberOfRequests = 0;
  logs.forEach(function(log) {
    var t = setTimeout(function() {
      if (numberOfRequests == 25) return;
      numberOfRequests++;
      agent.get(log, function(error, response, body) {
        if (error) throw error;
        var lines = stripHTMLTags(body).split('\n')
        lines.forEach(function(line, index) {
          redsSearch.index(line, log+'#'+index);
        });
        redisClient.set(log, true, function() {
          console.log('# Indexed '+log+': '+lines.length+' lines.');
          numberOfRequests--;
        });
        redisClient.save();
      });
      clearTimeout(t);
    }, 100);
  });
};

var scrapNodejsDotDebuggableDotCom = function() {
  return new nodeio.Job({
    input: false,
    run: function() {
      console.log('# Scraping ' + logsSource + ' ...');
      this.getHtml(logsSource, function(err, $) {
        var logs = [];
        $('a').each(function(link) {
          var href = link.attribs.href;
          if (href == '../') return;
          logs.push(logsSource + href);
        });
        this.emit(logs);
      });
    }
  });
};

var lookForNewLogFiles = function() {
  nodeio.start(scrapNodejsDotDebuggableDotCom(), function(error, existingLogs) {
    var toBeIndexed = [];
    var remaining = existingLogs.length;
    existingLogs.forEach(function(log) {
      redisClient.get(log, function(error, reply) {
        !reply && toBeIndexed.push(log);
        --remaining || index(toBeIndexed);
      });
    });
  }, true);
};

exports.go = function(reds, namespace) {
  this.reds = reds;
  this.namespace = namespace;
  redisClient = reds.client;
  redsSearch = reds.createSearch(namespace);

  lookForNewLogFiles();
  //setInterval(lookForNewLogFiles, 18000000); // 5 hours
};