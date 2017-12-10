# seckill
This is a hold in the amount of seconds kill lock pack, used to control the high concurrency in the middle of the pack，the package is implemented based on redis things

Install with:

    npm install seckill

## Usage Example

```js
var seckill = require("seckill").Seckill,

let sec = new seckill('6379', '127.0.0.1');

// addForTime(seckillName, seckillNumber, seckillStartTime, seckillEndTime);
sec.addForTime(1,  2, new Date('2017-12-09'), new Date('2017-12-12'), function (err, result) {
	console.log(result);
});


for (let a = 0; a<30; a++){
	sec.getForTime(1,function (err, result) {
		console.log(result);
	})
}
```

## License

[MIT](LICENSE)