/**
 * Created by liqp on 2017/12/10.
 */
const redis = require('redis');

class Seckill {
	constructor(host, port){
		this.host = host;
		this.port = port;
	}

	addForTime(id, number, startTime, endTime, callback){
		let time = new Date(endTime) - new Date();
		const client = redis.createClient(this.port, this.host);
		client.on('error', function (err) {
			return callback(err, null);
		});

		client.setex(`${id}option`, parseInt(time/1000), new Date(startTime).getTime(), function (err, result) {
			if (err) {
				return callback(err, null);
			}
			client.setex(id, parseInt(time/1000), number, callback);
		});
	};

	getForTime(id, callback){
		let self = this;
		function seckill(client) {
			if (!client) {
				client = redis.createClient(self.port, self.host);
			}

			client.on('error', function (err) {
				return callback(err, null);
			});

			client.get(`${id}option`, function (err, result) {
				if (!result) {
					return callback(null, '活动结束/不存在');
				}

				if ( new Date().getTime() < parseInt(result)) {
					client.end(true);
					return callback(null, '秒杀还未开始');
				}

				client.watch(id);
				client.get(id, function (err, reply) {
					if (~~reply <= 0) {
						client.end(true);
						return callback(null, '抢完了');
					}

					let multi = client.multi();
					multi.decr(id);
					multi.exec(function (err, replies) {
						if (!replies) {
							seckill(client);
						} else {
							client.end(true);
							callback(null, '完成')
						}
					})
				})
			});

		}
		seckill();
	}
}

exports.Seckill = Seckill;


