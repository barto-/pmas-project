/*
var express = require('express'), http=require('http');

var app = express.createServer(express.logger());

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
});

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
*/

var express = require('express')
  , routes = require('./routes')
  , http = require('http');

var app = express();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


//app.get('/', routes.index);
app.post('/send_temp', routes.send_temp);
app.get('/read_temp', routes.read_temp);
app.get('/read_multi', routes.read_multi);
//app.post('/set_sampling', routes.set_sampling);
//app.get('/get_sampling', routes.get_sampling);

var port = process.env.PORT || 3000;
http.createServer(app).listen(port);

console.log("Express server listening on port " + port);
