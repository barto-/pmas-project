var express = require('express'), http=require('http');

var app = express.createServer(express.logger());

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
});

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.post('/send_temp', function(request, response) {
    //response.writeHead(200, JSON.stringify({'Content-Type': 'application/json'}));
    response.header("Content-Type", "application/json");
    response.send(JSON.stringify({result: 'OK'}));
    //console.log(JSON.stringify(request.headers));
    console.log('Current Temperature: '+request.body.temp);
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
