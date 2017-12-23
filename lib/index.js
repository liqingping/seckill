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
			client.hincrby(`${id}hash`, 'userId', 1, function (err) {
				if (err) {
					client.end(true);
					return callback(err, null);
				}
				client.expire(`${id}hash`, parseInt(time/1000)+3600*24*7, function (err, result) {
					if (err) {
						client.end(true);
						return callback(err, null);
					}
					client.setex(id, parseInt(time/1000), number, function (err, result) {
						client.end(true);
						callback(err, result);
					});
				})
			});

		});
	},

	getRedPack: function (id, userId, callback){
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
					return callback(null, {msg: '活动结束/不存在', num: null});
				}

				result = JSON.parse(result);
				let limit = result.limit;


				//根据配置判断活动是否开始
				if ( new Date().getTime() < parseInt(result.startTime)) {
					client.end(true);
					return callback(null, {msg: '活动还未开始', num: null});
				}

				//监听活动id获取剩余量
				client.watch(id);
				client.get(id, function (err, reply) {
					if (~~reply <= 0) {
						client.end(true);
						return callback(null, {msg: '抢完了', num: null});
					}

					client.hget(`${id}hash`, userId, function (err, result) {
						//判断是否达到领取现在
						if (result >= limit) {
							client.end(true);
							return callback(null, {msg: '已经达到最大领取数量', num: null})
						}

						let num;
						//事务开始
						let multi = client.multi();
						//总量减一,返回剩余数
						multi.decr(id, function (err, result) {
							num = result;
						});
						//添加领取记录到hash中
						multi.hincrby(`${id}hash`, userId, 1);
						//提交事务
						multi.exec(function (err, replies) {
							//事务是否还存在
							if (!replies) {
								seckill(client);
							} else {
								client.end(true);
								callback(null, {msg: '完成', num: num})
							}
						})
					});
				})
			});

		}
		seckill();
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

					//获取用户领取详情
					client.hget(`${id}hash`, userId, function (err, result) {
						//判断是否达到领取限制
						if (result >= limit) {
							client.end(true);
							return callback(null, '已经达到最大领取数量')
						}

						//事务开始
						let multi = client.multi();
						//总量减一
						multi.decr(id);
						//添加领取记录到hash中
						multi.hincrby(`${id}hash`, userId, 1);
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

	updateForTime: function (id, isAdd, number, callback) {
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
					client.end(true);
					return callback(null, '活动结束/不存在');
				}

				//监听活动id获取剩余量
				client.watch(id);
				client.get(id, function (err, reply) {
					if (!isAdd) {
						if (reply < number) {
							client.end(true);
							return callback(null, '剩余量小于操作量')
						}
						//事务开始
						let multi = client.multi();
						multi.decrby(id, ~~number);
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
					} else {
						//事务开始
						let multi = client.multi();
						multi.incrby(id, ~~number);
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
					}

				})
			});

		}
		seckill();
	},

	delForTime: function (id, callback) {
		const client = redis.createClient(config);
		client.on('error', function (err) {
			return callback(err, null);
		});

		client.del([id, `${id}option`], function (err, result) {
			client.end(true);
			callback(err, result);
		})
	}
};


