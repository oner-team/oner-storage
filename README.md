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

设置数据

```js
ls.set({x:'x'}); // 设置完整数据
ls.set('x'); // 设置任意类型的完整数据
ls.set('foo', 'x'); // 设置指定键的数据
ls.set('foo.bar', 'x'); // 设置指定路径的数据
ls.set('fo\\.o.bar', 'x'); // 如果路径中的某个键包含`.`号, 转义即可
```

获取数据

```js
ls.get() // 获取完整数据
ls.get('foo') // 获取指定的键的数据
ls.get('foo.bar'); // 获取指定的路径的数据
ls.get('fo\\.o.bar'); // 如果路径中的某个键包含`.`号, 转义即可
```

删除指定的数据和键

```js
ls.remove('x.y'); // 删除设置指定路径的数据和键
ls.remove(); // 清空数据为{}
```

销毁LS中的存储

```js
ls.destory();
```

## todo

加入promise，将存取过程改已异步