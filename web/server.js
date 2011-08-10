var http = require('http');
var reds = require('reds');
var redis = require('redis');
var parse = require('url').parse;
var qs = require('querystring');
var fs = require('fs');

//var urls = fs.readFileSync(__dirname + '/urls', 'utf8').split('\n');
var urls = [ '1', '2' ];

var client = redis.createClient(
  process.env.DOTCLOUD_DATA_REDIS_PORT,
  process.env.DOTCLOUD_DATA_REDIS_HOST
);

client.auth(
  process.env.DOTCLOUD_DATA_REDIS_PASSWORD,
  function() {
    reds.client = client;
    createServer();
  }
);

var createServer = function() {
  var search = reds.createSearch('nodejs_logs')
  http.createServer(function(request, response){
    var url = parse(request.url)
    var query = qs.parse(url.query);

    if ('/search' == url.pathname) {
      search.query(query.q).end(function(error, ids){
        var json = JSON.stringify(ids.map(function(id){ return urls[id]; }));
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Content-Length', json.length);
        response.end(json);
      });
    } else {
      response.setHeader('Content-Type', 'text/html');
      fs.readFile(__dirname + '/form.html', 'utf8', function(error, buffer){
        response.end(buffer);
      });
    }
  }).listen(8080);
};