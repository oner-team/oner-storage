# natty-storage
storage plus for javascript

```js
// 创建城市LS对象实例
let cityLocalStorage = new NattyStorage({
	level: 'localstorage', // sessionstorage, variable
	type: 'json', // script, style, text
	key: 'city',
	// 验证是否有效，如果是首次创建该LS，则不执行验证
	check: {
		version: '1.0'
	},
	// or
	check: function () {}
});

// 获取数据
cityLocalStorage.get()
cityLocalStorage.get('foo')
cityLocalStorage.get('foo.bar');

// 设置数据
cityLocalStorage.set(object); // 取决于构造函数参数type的配置
cityLocalStorage.set('foo', any-type);
cityLocalStorage.set('foo.bar', any-type);

// 销毁LS中的存储
cityLocalStorage.destory();
```