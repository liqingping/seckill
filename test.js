/**
 * Created by liqp on 2017/12/10.
 */
const seckill = require('../seckill');

seckill.init();


let option = {
	startTime:  new Date('2017-12-09'),
	endTime: new Date('2017-12-20'),
	limit: 20,
};

seckill.addForTime(1,  200, option, function (err, result) {

	for (let a = 0; a<300; a++){
		seckill.getForTime(1,a,function (err, result) {
			console.log(result);
		})
	}
});


seckill.add(1,  20, function (err, result) {
	for (let a = 0; a<30; a++){
		seckill.get(1,a,function (err, result) {
			console.log(result);
		})
	}
});



