
/*
 * GET root of the API folder.
 */

exports.index = function(req, res){
	res.format({
		'application/json': function() {
			res.send({
				ok: true
			});
		},

		'text/html': function() {
			res.send('This set of endpoints is designed for software.');
		}
	});
}
