var freenodejs = function(socket) {
  var dom = {
    results: $('#results'),
    surroundingLines: $('#surroundingLines'),
    surroundingLinesDisplay: $('#surroundingLinesDisplay'),
    search: $('#search')
  };
  var renderResults = function(results) {
    dom.results.empty();
    results.forEach(function(result) {
      var entry = View('entry');
      entry.log(result.log);
      entry.appendTo(dom.results);

      var surroundingLines = dom.surroundingLines.attr('value');
      entry.el.appear({
        fetch(result.log, result.line, surroundingLines, function(lines) {
          entry.searching().remove();
          lines.forEach(function(line) {
            entry.lines.add(View('line').line(line));
          });
        });
      });
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

  dom.search.keyup(function() {
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