/**
 * Created by liqp on 2017/12/10.
 */
const seckill = require('../seckill');

seckill.init();

let option = {
	startTime:  new Date('2018-5-13'),
	endTime: new Date('2018-6-29'),
	limit: 1,
};
/*
 * @desc num 为 -1则无总量限制
 * */
seckill.addForTime(1, 20, option, function (err, result) {
	console.log(err);
	console.log(result);
});

for (let a = 0; a<25; a++){
	seckill.getForTime(1,a,function (err, result) {
		console.log(result);
	});
}

seckill.updateForTime(1, false, 1, function (err, result) {
	console.log('修改操作'+err,result);
});

seckill.delForTime(1, function (err, result) {
	console.log(result);
});

