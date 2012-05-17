var express = require('express');

var app = express.createServer(express.logger());

app.configure(function(){
  //app.set('views', __dirname + '/views');
  //app.set('view engine', 'ejs');
  //app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  //app.use(express.bodyParser());
  //app.use(express.methodOverride());
  //app.use(app.router);
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
