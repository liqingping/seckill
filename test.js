/**
 * Created by liqp on 2017/12/10.
 */
const seckill = require('./index').Seckill;

let sec = new seckill('127.0.0.1', '6379');

sec.addForTime(1,  2, new Date('2017-12-09'), new Date('2017-12-12'), function (err, result) {
	console.log(result);
});


for (let a = 0; a<30; a++){
	sec.getForTime(1,function (err, result) {
		console.log(result);
	})
}