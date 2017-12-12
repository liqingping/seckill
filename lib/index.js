/**
 * Created by liqp on 2017/12/10.
 */
const redis = require('redis');
const EventEmitter = require('events');
EventEmitter.EventEmitter.defaultMaxListeners = 0;

let config = {
	host: '127.0.0.1',
	port: 6379,
	db: 0,
};
let time = 0;

module.exports = {
	init: function (host, port, db, password) {
		if (host) {
		    config.host = host
		}

		if (port) {
			config.port = port
		}

		if (db) {
			config.db = db
		}

		if (password) {
			config.password = password
		}
	},

	addForTime: function (id, number, option, callback){
		time = new Date(option.endTime) - new Date();
		let val = {
			startTime: new Date(option.startTime).getTime(),
			endTime: new Date(option.endTime).getTime(),
			limit: ~~option.limit,
		};

		if (time <= 0 || val.startTime >= val.endTime) {
		    return callback(new Error('startTime or endTime is error'))
		}

		const client = redis.createClient(config);
		client.on('error', function (err) {
			return callback(err, null);
		});

		client.setex(`${id}option`, parseInt(time/1000), JSON.stringify(val), function (err, result) {
			if (err) {
				client.end(true);
				return callback(err, null);
			}
			client.setex(id, parseInt(time/1000), number, function (err, result) {
				client.end(true);
				callback(err, result);
			});
		});
	},

	getForTime: function (id, userId, callback){
		function seckill(client) {
			if (!client) {
				client = redis.createClient(config);
			}

			client.on('error', function (err) {
				return callback(err, null);
			});

			//获取该id的配置参数
			client.get(`${id}option`, function (err, result) {
				if (!result) {
					return callback(null, '活动结束/不存在');
				}

				result = JSON.parse(result);
				let limit = result.limit;


				//根据配置判断活动是否开始
				if ( new Date().getTime() < parseInt(result.startTime)) {
					client.end(true);
					return callback(null, '活动还未开始');
				}

				//监听活动id获取剩余量
				client.watch(id);
				client.get(id, function (err, reply) {
					if (~~reply <= 0) {
						client.end(true);
						return callback(null, '抢完了');
					}

					client.get(`${id}${userId}`,function (err, result) {
						//判断是否达到领取现在
						if (result >= limit) {
							client.end(true);
							return callback(null, '已经达到最大领取数量')
						}

						//事务开始
						let multi = client.multi();
						//总量减一,添加领取记录并设置生成时间
						multi.decr(id);
						multi.incr(`${id}${userId}`);
						multi.expire(`${id}${userId}`,parseInt(time/1000)+3600*24*7);
						//提交事务
						multi.exec(function (err, replies) {
							//事务是否还存在
							if (!replies) {
								seckill(client);
							} else {
								client.end(true);
								callback(null, '完成')
							}
						})
					});
				})
			});

		}
		seckill();
	},
};


