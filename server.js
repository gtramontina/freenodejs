var express = require('express');
var agent = require('superagent');
var io = require('socket.io');
var reds = require('reds');
var redis = require('redis');
var indexer = require('./indexer');
var search;

var stripHTMLTags = function(html) {
  return html.replace(/(<([^>]+)>)/ig, '');
};

var app = express.createServer();
app.configure(function() {
  app.set('views', __dirname+'/public');
  app.set('view options', {layout: false});
  app.use(express.bodyParser());
  app.use(express.static(__dirname+'/public'));
  app.register('.html', {
    compile: function(string, _) {
      return function(_) { return string; };
    }
  });
});

app.get('/', function(request, response) { response.render('index.html'); });

var listenOnEvents = function() {
  io.sockets.on('connection', function(socket) {
    
    socket.on('search', function(term, results_cb) {
      search.query(term, function(_, indexes) {
        var results = [];
        indexes.forEach(function(index) {
          var split = index.split('#');
          results.push({ log: split[0], line: split[1] });
        });
        results_cb(results);
      }, 'union');
    });

    socket.on('fetch', function(params, logLines_cb) {
      var log = params.log;
      var line = params.line;
      var surrounding = params.surroundingLines;
      fetch(log, line, surrounding, logLines_cb);
    });
  });
};

var maxRequests = 20;
var requestCount = 0;
var doFetch = function(log, line, surrounding, logLines_cb) {
  requestCount++;
  agent.get(log, function(_, __, body) {
    var from = line - surrounding > 0 ? line-surrounding : 0;
    var totalLines = 2*surrounding + 1;
    var lines = stripHTMLTags(body).split('\n').splice(from, totalLines);
    requestCount--;
    logLines_cb(lines);
  });
}

var fetch = function(log, line, surrounding, logLines_cb) {
  var t = setInterval(function() {
    if (requestCount > maxRequests) return;
    doFetch(log, line, surrounding, logLines_cb);
    clearInterval(t);
  }, 100);
};

var redisClient = redis.createClient(
  process.env.DOTCLOUD_DATA_REDIS_PORT,
  process.env.DOTCLOUD_DATA_REDIS_HOST
);

redisClient.auth(process.env.DOTCLOUD_DATA_REDIS_PASSWORD, function() {
  reds.client = redisClient;
  //indexer.go(reds, 'nodejs_logs');
  
  search = reds.createSearch('nodejs_logs');
  app.listen(8080);
  io = io.listen(app);
  io.set('log level', 2);
  listenOnEvents();
});