# natty-storage
storage plus for javascript

## 特点

TODO：这里的每一个特点都加上demo说明。

* 以异步(`Promise`)方式使用`localStorage`和`sessionStorage`，减少阻塞，并优雅地捕获异常(如超出浏览器最大限制)。
* 支持以路径(`Path`)方式设置和获取数据，相对于直接使用原生对象，大大减少了代码量。
* 封装了三种有效性(`validity`)判断，版本号(`version`)、有效期长(`duration`)、有效期至(`validUntil`)，不再重复编码。

## 使用

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
ls.set({x:'x'}).then().catch(); // 设置完整数据
ls.set('x').then().catch(); // 设置任意类型的完整数据
ls.set('foo', 'x').then().catch(); // 设置指定键的数据
ls.set('foo.bar', 'x').then().catch(); // 设置指定路径的数据
ls.set('fo\\.o.bar', 'x').then().catch(); // 如果路径中的某个键包含`.`号, 转义即可
```

获取数据

```js
ls.get().then().catch() // 获取完整数据
ls.get('foo').then().catch() // 获取指定的键的数据
ls.get('foo.bar').then().catch(); // 获取指定的路径的数据
ls.get('fo\\.o.bar').then().catch(); // 如果路径中的某个键包含`.`号, 转义即可
```

删除指定的数据和键

```js
ls.remove('x.y').then().catch(); // 删除设置指定路径的数据和键
ls.remove().then().catch(); // 清空数据为{}
```

销毁LS中的存储

```js
ls.destory();
```

## TODO

* 隐身模式的处理
