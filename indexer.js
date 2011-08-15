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

var maxRequests = 20;
var requestCount = 0;
var doIndex = function(log) {
  requestCount++;
  agent.get(log, function(error, response, body) {
    if (error) throw error;
    var lines = stripHTMLTags(body).split('\n')
    lines.forEach(function(line, index) {
      redsSearch.index(line, log+'#'+index);
    });
    redisClient.set(log, true, function() {
      console.log('> Indexed '+log+': '+lines.length+' lines.');
      requestCount--;
    });
  });
}

var index = function(log) {
  var t = setInterval(function() {
    if (requestCount > maxRequests) return;
    doIndex(log);
    clearInterval(t);
  }, 200);
};

var scrapNodejsDotDebuggableDotCom = function() {
  return new nodeio.Job({
    input: false,
    run: function() {
      console.log('> Scraping ' + logsSource + ' ...');
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
    existingLogs.forEach(function(log) {
      redisClient.get(log, function(error, reply) {
        if (!reply) index(log);
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
  //setInterval(lookForNewLogFiles, 15000);
};