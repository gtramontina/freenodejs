var freenodejs = function(socket) {
  var MAX_NUMBER_OF_RESULTS = 2000;

  var dom = {
    results: $('#results'),
    searchMessage: $('#searchMessage'),
    surroundingLines: $('#surroundingLines'),
    surroundingLinesDisplay: $('#surroundingLinesDisplay'),
    search: $('#search')
  };
  var renderResults = function(results) {
    dom.results.empty();
    if (results.length > MAX_NUMBER_OF_RESULTS) {
      dom.searchMessage.addClass('error');
      dom.searchMessage.text('Your search returned more than ' + MAX_NUMBER_OF_RESULTS + ' results. Please be more specific.');
      return;
    }

    dom.searchMessage.removeClass('error');
    dom.searchMessage.text('Results: '+results.length);
    $(results).each(function(index, result) {
      var entry = View('entry');
      entry.log(result.log);
      var surroundingLines = dom.surroundingLines.attr('value');
      
      fetch(result.log, result.line, surroundingLines, function(lines) {
          entry.searching().remove();
        lines.forEach(function(line) {
          entry.lines.add(View('line').line(line));
        });
      });        
      entry.appendTo(dom.results);
    });
  };

  var doSearch = function(term, surroundingLines) {
    socket.emit('search', term, renderResults);
  };

  var fetch = function(log, line, surroundingLines, renderLogLines) {
    socket.emit('fetch', {log: log, line: line, surroundingLines: surroundingLines}, renderLogLines);
  };


  var lastTerm;
  var search = function(term) {
    var term = term.trim();
    if(!term || lastTerm == term) return;
    doSearch(lastTerm = term);
  };

  dom.search.keyup(function(event) {
    search(this.value);
  });

  dom.surroundingLines.change(function() {
    dom.surroundingLinesDisplay.text(this.value);
    doSearch(dom.search.val());
  });
};

$(function() {
  var socket = io.connect();
  freenodejs(socket);
});