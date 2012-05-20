function IsNumeric(data){
    return parseFloat(data)==data;
}

var HOST;
var USERNAME;
var PASSWORD;
var DATABASE;

var connect_string_splitted = process.env.CLEARDB_DATABASE_URL.split(":");
USERNAME = connect_string_splitted[1].split("//")[1];
PASSWORD = connect_string_splitted[2].split("@")[0];
HOST = connect_string_splitted[2].split("@")[1].split("/")[0];
DATABASE = connect_string_splitted[2].split("@")[1].split("/")[1].split("?")[0];

var mysql = require('mysql');

var client = mysql.createClient({
  host: HOST,
  user: USERNAME,
  password: PASSWORD
});


// If no callback is provided, any errors will be emitted as `'error'`
// events by the client
client.query('USE '+DATABASE);

exports.send_temp = function(req, res){
	res.header("Content-Type", "application/json");
	var res_json;
	if (req.body.temp == undefined){
		res_json = {result: 'FAIL',
			    err_code: 1,
			    err_msg: 'Wrong request format'}; 	
	}
	else if (!IsNumeric(req.body.temp))
		res_json = {result: 'FAIL',
                            err_code: 1,
                            err_msg: 'Wrong request format'};
	}
	else {
		client.query('INSERT INTO temperature SET temperature = ?', req.body.temp, function() {
			if (err){
				throw err;
				res_json = {result: 'FAIL',
                            		    err_code: 2,
                            		    err_msg: 'Database error.'};
			}
			else {
				res_json = {result: 'OK'};
			}
		}
	}
	res.send(JSON.stringify(res_json));
}

