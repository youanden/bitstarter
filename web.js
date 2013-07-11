var express = require('express'),
	fs		= require('fs');

var app = express.createServer(express.logger());
app.get('/', function(request, response) {
	response.send( readFromFile('index.html') );
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

var readFromFile = function(filename) {
	return fs.readFileSync(filename, "utf8");
};
