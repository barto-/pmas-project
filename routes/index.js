function IsNumeric(data){
    return parseFloat(data)==data;
}

function IsInt(value){
    var er = /^[0-9]+$/;
    return ( er.test(value) ) ? true : false;
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
  password: PASSWORD,
  database: DATABASE
});

var url = require('url');

exports.send_temp = function(req, res){
	res.header("Content-Type", "application/json");
	var res_json;
	if (req.body.temp == undefined){
		res_json = {result: 'FAIL',
			    err_code: 1,
			    err_msg: 'Wrong request format'};
		res.send(JSON.stringify(res_json)); 	
	}
	else if (!IsNumeric(req.body.temp)) {
		res_json = {result: 'FAIL',
                            err_code: 1,
                            err_msg: 'Wrong request format'};
		res.send(JSON.stringify(res_json));
	}
	else {
		console.log('Saving current temperature: '+req.body.temp);
		client.query('INSERT INTO temperature SET temp = ?', [req.body.temp], function(err, result) {
			if (err){
				res_json = {result: 'FAIL',
                            		    err_code: 2,
                            		    err_msg: 'Database error'};
				res.send(JSON.stringify(res_json));
				throw err;
			}
			else {
				res_json = {result: 'OK'};
				res.send(JSON.stringify(res_json));
			}
		});
	}
}

exports.read_temp = function(req, res){
        res.header("Content-Type", "application/json");
        client.query('SELECT temp, UNIX_TIMESTAMP(time) AS time  FROM temperature ORDER BY time DESC LIMIT 0,1', function(err, result) {
        	if (err){
                	res_json = {result: 'FAIL',
                        	    err_code: 2,
                                    err_msg: 'Database error'};          
                        res.send(JSON.stringify(res_json));
                        throw err;
                }
                else {
                	res.send(JSON.stringify({result: 'OK', result[0]}));
                }
	});
}

exports.read_multi = function(req, res){
        res.header("Content-Type", "application/json");
        var res_json;
	var query = url.parse(req.url, true).query;
	console.log(query);
        if (query.start == undefined || query.stop == undefined || query.sampling_int == undefined){
                res_json = {result: 'FAIL',
                            err_code: 1,
                            err_msg: 'Wrong request format'};
                res.send(JSON.stringify(res_json));
        }
        else if (!IsInt(query.start) || !IsInt(query.stop) || (query.sampling_int != 0 && query.sampling_int != 1 && query.sampling_int != 2)) {
                res_json = {result: 'FAIL',
                            err_code: 1,
                            err_msg: 'Wrong request format'};
                res.send(JSON.stringify(res_json));
        }
        else {
                client.query('SELECT temp, UNIX_TIMESTAMP(time) AS time FROM  temperature HAVING time >= ? AND time <= ?', [query.start, query.stop], function(err, result) {
                        if (err){
                                res_json = {result: 'FAIL',
                                            err_code: 2,
                                            err_msg: 'Database error'};          
                                res.send(JSON.stringify(res_json));
                                throw err;
                        }
                        else {
                                res_json = {result: 'OK',
					    samples: result};
                                res.send(JSON.stringify(res_json));
                        }
                });
        }
}

exports.set_sampling = function(req, res){
	res.header("Content-Type", "application/json");
	var res_json;
	var samp_t=['1 m', '1 h', '1 d'];
	if (req.body.sampling_int == undefined){
		res_json = {result: 'FAIL',
			    err_code: 1,
			    err_msg: 'Wrong request format'};
		res.send(JSON.stringify(res_json)); 	
	}
	else if (req.body.sampling_int != 0 && req.body.sampling_int != 1 && req.body.sampling_int != 2) {
		res_json = {result: 'FAIL',
                            err_code: 1,
                            err_msg: 'Wrong request format'};
		res.send(JSON.stringify(res_json));
	}
	else {
		console.log('Setting sampling time to: '+samp_t[req.body.sampling_int]);
		client.query('UPDATE sampling_int SET sampling=? WHERE id=1;', [req.body.sampling_int], function(err, result) {
			if (err){
				res_json = {result: 'FAIL',
                            		    err_code: 2,
                            		    err_msg: 'Database error'};
				res.send(JSON.stringify(res_json));
				throw err;
			}
			else {
				res_json = {result: 'OK'};
				res.send(JSON.stringify(res_json));
			}
		});
	}
}

exports.get_sampling = function(req, res){
        res.header("Content-Type", "application/json");
        client.query('SELECT sampling FROM sampling_int WHERE id = 1', function(err, result) {
        	if (err){
                	res_json = {result: 'FAIL',
                        	    err_code: 2,
                                    err_msg: 'Database error'};          
                        res.send(JSON.stringify(res_json));
                        throw err;
                }
                else {
                	res.send(JSON.stringify({result: 'OK', result[0]}));
                }
	});
}
