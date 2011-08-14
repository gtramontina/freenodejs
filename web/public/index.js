var freenodejs = function(socket) {
  var renderResults = function(results) {
    $('#results').empty();
    results.forEach(function(result) {
      var entry = View('entry');
      entry.log(result.log);
      entry.appendTo('#results');

      var surroundingLines = $('#surroundingLines').attr('value');
      fetch(result.log, result.line, surroundingLines, function(lines) {
        lines.forEach(function(line) {
          entry.lines.add(View('line').line(line));
        });
      });
    });
  };

  var search = function(term, surroundingLines) {
    socket.emit('search', term, renderResults);
  };

  var fetch = function(log, line, surroundingLines, renderLogLines) {
    socket.emit('fetch', {log: log, line: line, surroundingLines: surroundingLines}, renderLogLines);
  };

  $('#search').keyup(function() {
    var term = this.value.trim();
    if(term) search(term);
  });

  $('#surroundingLines').change(function() {
    $('#surroundingLinesDisplay').text(this.value);
  });
};

$(function() {
  var socket = io.connect();
  freenodejs(socket);
});