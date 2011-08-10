var http = require('http');
var reds = require('reds');
var redis = require('redis');
var parse = require('url').parse;
var agent = require('superagent');
var qs = require('querystring');
var fs = require('fs');
var search;

var stripHTMLTags = function(html) {
  return html.replace(/(<([^>]+)>)/ig, '');
};

var handleSearchRequest = function(query, response) {
  search.query(query.q, function(error, indexes) {
    var json = JSON.stringify(indexes.map(function(index) {
      var values = index.split('#');
      return { log: values[0], line: values[1] };
    }));
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Length', json.length);
    response.end(json);
  }, 'union');
};

var handleFetchRequest = function(query, response) {
  agent.get(query.log, function(error, _, body) {
    if (error) throw error;
    var from = query.line - query.surrounding > 0 ? query.line-query.surrounding : 0;
    var lines = 2*query.surrounding + 1;
    body = JSON.stringify(stripHTMLTags(body).split('\n').splice(from, lines));
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Type', body.length);
    response.end(body);
  });
};

var renderSearchForm = function(response) {
  response.setHeader('Content-Type', 'text/html');
  fs.readFile(__dirname + '/public/form.html', 'utf8', function(error, buffer) {
    response.end(buffer);
  });
};

var handleRequest = function(request, response) {
  var url = parse(request.url);
  var query = qs.parse(url.query);
  switch (url.pathname) {
    case '/search': handleSearchRequest(query, response); break;
    case '/fetch' : handleFetchRequest(query, response); break;
    default: renderSearchForm(response); break;
  }
};

var client = redis.createClient(
  process.env.DOTCLOUD_DATA_REDIS_PORT,
  process.env.DOTCLOUD_DATA_REDIS_HOST
);

client.auth(process.env.DOTCLOUD_DATA_REDIS_PASSWORD, function() {
    reds.client = client;
    search = reds.createSearch('nodejs_logs');
    http.createServer(handleRequest).listen(8080);
  }
);