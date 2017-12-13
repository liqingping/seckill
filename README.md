# seckill
This is a hold in the amount of seconds kill lock pack, used to control the high concurrency in the middle of the pack，the package is implemented based on redis things

Install with:

    npm install seckill

## Usage Example

```js
const seckill = require('seckill');

seckill.init(host, port, db, password);

// addForTime(seckillName, seckillNumber, option);
// option is object

let option = {
	startTime:  new Date('2017-12-09'),         //activity start dataTime
	endTime: new Date('2017-12-20'),            //activity end dataTime
	limit: 1,                                   //person receive limit
};

sec.addForTime(1,  2, option, function (err, result) {
	console.log(result);
});

// addForTime(seckillName, receiveUserId);
for (let i = 0; i<30; i++){
	sec.getForTime(1,i,function (err, result) {
		console.log(result);
	})
}

// updateForTime(seckillName, isAdd, number)     //idAdd eq true  is +    eq false  is  -
seckill.updateForTime(1, false, 1, function (err, result) {
	console.log(result);
});

// delForTime(seckillName)
seckill.delForTime(1, function (err, result) {
	console.log(result);
});
```

## License

[MIT](LICENSE)