# natty-storage
storage plus for javascript

创建缓存对象的实例

```js
let ls = new NattyStorage({
	type: 'localStorage', // sessionStorage
	key: 'foo',
	version: '1.0'
});
```

获取数据

```js
ls.get() // 获取完整数据
ls.get('foo') // 获取指定的键的数据
ls.get('foo.bar'); // 获取指定的路径的数据
ls.get('fo\\.o.bar'); // 如果路径中的某个键包含`.`号, 转义即可
```

设置数据

```js
ls.set(null, 'x'); // 设置完整数据
ls.set('foo', 'x'); // 设置指定键的数据
ls.set('foo.bar', 'x'); // 指定指定路径的数据
ls.set('fo\\.o.bar', 'x'); // 如果路径中的某个键包含`.`号, 转义即可
```

销毁LS中的存储

```js
ls.destory();
```