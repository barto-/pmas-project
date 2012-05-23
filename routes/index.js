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
		client.query('SELECT sampling FROM sampling_int WHERE id=1', function(err, result) {
			if (err){
				res_json = {result: 'FAIL',
                            		    err_code: 2,
                            		    err_msg: 'Database error'};
				res.send(JSON.stringify(res_json));
				throw err;
			}
			else {
				var sampling_int = result[0].sampling;
				var samp_t = [60, 60*60, 60*60*24];
				var q='INSERT INTO temperature(id, temp, time) VALUES ';
				var maxit=samp_t[sampling_int]/60;
				for (var i=0; i<maxit; i++){
					q=q +'(NULL, '+ req.body.temp +', DATE_ADD(NOW(), INTERVAL -'+ maxit+i-1 +' MINUTE))'+(i!=maxit-1?', ':'');
				}
				console.log(q);
				console.log(maxit);
				client.query(q, function(err, result) {
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
			res_json = {result: 'OK', temp: result[0].temp};
                	res.send(JSON.stringify(res_json));
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
			var samp_t = [60, 60*60, 60*60*24]; // sampling intervals
			var tol = 10; //10 sec tolerance
			q='SELECT temp1 AS temp, time1 AS time FROM (SELECT t1.id AS id1, t2.id AS id2, t1.temp AS temp1, t2.temp AS temp2, UNIX_TIMESTAMP(t1.time) AS time1, UNIX_TIMESTAMP(t2.time) AS time2 FROM temperature AS t1, temperature AS t2 HAVING time1 >= ? AND time1 <= ? AND time2 >= ? AND time2 <= ? AND id2 >= id1 + 10 AND id2 <= id1 + ? AND time2 - time1 >= ? AND time2-time1 <= ?) AS dummy';
                client.query(q, [query.start, query.stop, query.start, query.stop, 10*samp_t[query.sampling_int]/60, samp_t[query.sampling_int]-tol, samp_t[query.sampling_int]+tol], function(err, result) {
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
					res_json = {result: 'OK', sampling_int:result[0].sampling};
                	res.send(JSON.stringify(res_json));
                }
	});
}
