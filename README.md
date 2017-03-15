# natty-storage

storage plus for javascript

> 🍻 开发者的体验至关重要！  
> `natty`系列的小工具，以垂直的思路和工匠的精神，在微小的技术点上追求极致的开发体验。如果对你有帮助，考虑支持一下吧 :D

## 特点

* 支持异步方式使用`localStorage`和`sessionStorage`，避免阻塞，并优雅地捕获异常(如超出浏览器最大限制)。当然，同步方式使用依然是默认的使用方式。
* 支持以路径(`Path`)方式设置、获取和删除数据，相对于直接使用原生`localStorage/sessionStorage`对象，大大减少了代码量。
* 封装了三种有效性判断，标记(`tag`)、有效期长(`duration`)、有效期至(`until`)，不再重复编码。
* 隐身模式下，有些浏览器不支持`localStorage`，此时自动降级为`variable`模式。
* `gzip`后的只有`2.5K`。

> TODO：这里的每一个特点都加上demo说明。

## 安装

```shell
npm install natty-storage --save
```

## 创建缓存对象

方法

```js
const storage = nattyStorage(options)
```

示例

```js
const storage = nattyStorage({
    type:     'localStorage',  // 缓存方式, 默认为'localStorage'
    key:      'ChinaCity',     // !!! 唯一必选的参数, 用于内部存储 !!!
    tag:      'v1.0',          // 缓存的标记, 用于判断是否有效
    duration: 1000*60*10,      // 缓存的有效期长, 以毫秒数指定
    until:    1464759086797    // 缓存的到期时间, 以具体日期时间的时间戳指定
});
```

参数

#### `type`(可选)：枚举值

指定缓存对象存储数据的方式，可选值为`localStorage`、`sessionStorage`和`variable`。默认为`localStorage`。

注意：当指定`type`的值为`localStorage/sessionStorage`，但浏览器的`localStorage/sessionStorage`不可用时(比如`Safari`浏览器的隐身模式)，会自动降级到`varable`方式存储。

#### `key`(必选)：字符串

指定缓存对象存储数据所使用的唯一标识。如果两个缓存对象的`key`值相同，则缓存的数据也是相同的。

#### `tag`(可选)：字符串

用于验证数据有效性的标识(一)。通过一个标记来判断缓存对象所存储的数据是否有效。`tag`不同则缓存失效。

> 通常`tag`的值是一个字符串标识，比如版本号。

#### `duration`(可选)：毫秒数

用于验证数据有效性的标识(二)。通过"有效期长"来判断缓存对象所存储的数据是否有效。过期则缓存失效，不过期则顺延。

#### `until`(可选)：时间戳

用于验证数据有效性的标识(三)。通过"有效期至"来判断缓存对象所存储的数据是否有效。过期则缓存失效。


## 同步存取数据

方法

```js
// 同步存
storage.set(key, value)  
// 同步取
storage.get(key)
```

参数

- `key`: 字符串或以`.`分割的路径值
- `value`: 任意类型的数据

示例

```js
storage.set('foo', 'x')
storage.get('foo) // => 'x'

// 可以直接存字面量对象
storage.set('foo', {x: 'x'})
storage.get('foo) // => {x: 'x'}

// 设置指定路径的数据
storage.set('foo.bar', 'x')
storage.get('foo.bar') // => 'x'
storage.get('foo') // => {bar: 'x', ...}

// 如果路径中的某个键包含`.`号, 转义即可
storage.set('fo\\.o.bar', 'x')
storage.get('fo\\.o.bar') // => 'x'
```

## 异步存取数据

方法

```js
// 异步存
storage.async.set(key, value).then(data => {}).catch(error => {})
// 取异步
storage.async.get(key).then(data => {}).catch(error => {})
```
> 提示：`storage.async.set/storage.async.get`方法返回一个`Promise`实例对象

参数

- `key`: 字符串或以`.`分割的路径值
- `value`: 任意类型的数据
- `fn`: 函数

示例

```js
// 异步存
storage.async.set('foo', 'x').then(data => {
    // do something
    // data 为存入的值 'x'
}).catch(error => {
    // deal the error
})

// 异步取
storage.async.get('foo').then(data => {
    // do something
    // data 为取出的值 'x'
}).catch(error => {
    // deal the error
})
```

## 判断数据是否存在

```js
// 同步方式
const result = storage.has('foo.bar') // => {has: true, value: 'x'}

// 异步方式
storage.async.has('foo.bar').then(result => {
	// 存在
	// result = {
	//    has: true,
	//    value: 'value'
	// }

	// 不存在
	// result = {
	//    has: false,
	//    value: undefined
	// }
}).catch(error => {})
```

## 打印数据

在控制台输出当前缓存对象的所有数据，没有返回值

```js
storage.dump()
```


## 删除键和值

同时删除指定的键和对应的值

```js
// 同步删除
storage.remove('foo.bar')

// 同步删除所有数据
storage.remove()

// 异步删除
storage.async.remove('foo.bar').then(() => {}).catch(error => {})

// 异步删除所有数据
storage.async.remove().then(() => {}).catch(error => {})
```

## 销毁缓存对象实例

storage.destroy()

```js
// 同步销毁
storage.destroy()

// 异步销毁
storage.async.destroy().then(() => {}).catch(error => {})
```

## 非现代浏览器的外部依赖

`nattyStorage`依赖现代浏览器的两个对象。在非现代浏览器下，可以通过引入`polyfill`解决。

* `Promise`对象，推荐的`polyfill`：[lie](https://github.com/calvinmetcalf/lie)
* `JSON`对象，推荐的`polyfill`：[json2](https://github.com/douglascrockford/JSON-js)

## IE8和IE9的兼容性

如果需要兼容`IE8`和`IE9`，需要引入`es5-shim`和`es5-sham`。

安装

```shell
npm install es5-shim --save
```

将下面的代码添加到`nattyStorage`标签之前

```html
<!--[if lt IE 10]>
<script type="text/javascript" src="./node_modules/es5-shim/es5-shim.min.js"></script>
<script type="text/javascript" src="./node_modules/es5-shim/es5-sham.min.js"></script>
<![endif]-->
```

## Next TODO

* 添加静态方法`nattyStorage.clean()`，清理失效的缓存。
  - 有效期长(`duration`)已到，删除。
  - 有效期至(`until`)已过，删除。
  - 其他待定：最后读取日期超过指定时间(比如：一周)的，删除。
* 添加静态方法`nattyStorage.list()`，列出当前页面所有的由`natty-storage`所创建的缓存数据。

## dev

把代码`clone`到本地，在根目录下执行：

```shell
npm install
npm start
```

## build

```shell
npm run build
```

## ref

https://www.html5rocks.com/en/tutorials/offline/quota-research/
