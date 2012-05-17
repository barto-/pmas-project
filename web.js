var express = require('express');

var app = express.createServer(express.logger());

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.post('/send_temp', function(request, response) {
    response.send(reqquest.body.json);
};

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
