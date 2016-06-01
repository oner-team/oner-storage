# natty-storage

storage plus for javascript

> 开发者的体验至关重要！  
> `Natty`系列的小工具，以垂直的思路和工匠的精神，在微小的技术点上追求极致的精美，专注于提升前端同学的开发体验。如果对你有帮助，考虑支持一下吧 :D

## 特点

* 以异步(`Promise`)方式使用`localStorage`和`sessionStorage`，减少阻塞，并优雅地捕获异常(如超出浏览器最大限制)。
* 支持以路径(`Path`)方式设置、获取和删除数据，相对于直接使用原生对象，大大减少了代码量。
* 封装了三种有效性(`validity`)判断，标记(`tag`)、有效期长(`duration`)、有效期至(`validUntil`)，不再重复编码。
* 隐身模式下，有些浏览器不支持`localStorage`，此时自动降级为`variable`模式。
* `gzip`后的只有`2.3K`。

> TODO：这里的每一个特点都加上demo说明。

## 创建缓存对象

创建缓存对象的实例

```js
let ls = new NattyStorage({
    type: 'localStorage',
    key: 'foo',
    tag: '1.0',
    ...
});
```

#### `type`(可选)：枚举值

指定缓存对象存储数据的方式，可选值为`localStorage`、`sessionStorage`和`variable`。默认为`localStorage`。

当指定`type`值为`localStorage`且`localStorage`不可用时(比如部分浏览器的隐身模式下)，则自动降级到`varable`方式存储。

#### `key`(必选)：字符串

指定缓存对象存储数据所使用的唯一标识。如果两个缓存对象的`key`值相同，则缓存的数据也是相同的。

#### `tag`(可选)：字符串

通过一个标记来判断缓存对象所存储的数据是否有效。标记不同则缓存失效。

> 通常用于缓存一些不经常变化的数据，比如城市数据。

#### `duration`(可选)：时间戳

通过"有效期长"来判断缓存对象所存储的数据是否有效。过期则缓存失效，不过期则顺延。

#### `until`(可选)：时间戳

通过"有效期至"来判断缓存对象所存储的数据是否有效。过期则缓存失效。


## 设置数据

设置数据包括添加新数据和修改已有的数据，都很方便。

```js
// 设置完整数据
ls.set({x:'x'}).then(function(){
    // do something
}).catch(function(e){
    // deal the error
});

// 设置任意类型的完整数据
ls.set('x').then().catch();

// 设置指定键的数据
ls.set('foo', 'x').then().catch();

// 设置指定路径的数据
ls.set('foo.bar', 'x').then().catch();

// 如果路径中的某个键包含`.`号, 转义即可
ls.set('fo\\.o.bar', 'x').then().catch();
```

## 获取数据

获取数据支持获取全部数据和以路径方式获取部分数据。

```js
// 获取完整数据
ls.get().then(function(data){
    // do something with data
}).catch(function(e){
    // deal the error
});

// 获取指定的键的数据
ls.get('foo').then().catch();

// 获取指定的路径的数据
ls.get('foo.bar').then().catch();

// 如果路径中的某个键包含`.`号, 转义即可
ls.get('fo\\.o.bar').then().catch();
```

## 判断数据是否存在

```js
// 根据指定的路径，判断数据是否存在
ls.has('x.y').then(function(result){
	// 存在
	// {
	//    has: true,
	//    value: 'value'
	// }
	//
	// 不存在
	// {
	//    has: false,
	//    value: undefined
	// }
}).catch();

// 不指定路径，判断是否设置过全量的值
// 如果没有设置过全量的值，又没有指定查找路径，则报错
ls.has().then().catch();
```


## 删除数据

删除数据会同时删除指定的键和对应的值。

```js
// 删除设置指定路径的数据和键
ls.remove('x.y').then().catch();

// 清空数据为{}
ls.remove().then().catch();
```

## 销毁实例

销毁缓存对象实例

```js
ls.destory();
```

## 外部依赖

`NattyStorage`依赖现代浏览器的两个对象。在非现代浏览器下，可以通过引入`polyfill`解决。

* `Promise`对象，推荐的`polyfill`：[lie](https://github.com/calvinmetcalf/lie)
* `JSON`对象，推荐的`polyfill`：[json2](https://github.com/douglascrockford/JSON-js)

## 开发

把代码`clone`到本地，在根目录下执行：

```shell
npm install
npm run dev
```
