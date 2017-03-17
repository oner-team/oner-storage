# natty-storage

Storage plus for javascript!

开发者的体验至关重要！ `natty`系列的小工具，在微小的技术点上追求极致的开发体验。如果对你有帮助，请`Star`支持一下，感谢 :D

## Features

* 较直接使用浏览器原生`localStorage`对象，`natty-storage`在性能上做了很多改进。
  - 只有`set`和`remove`方法，才真正调用了原生`localStorage`对象。`get`和`has`方法，根本没有调用。
  - 进一步，`set`和`remove`方法只调用一次原生`localStorage`对象(如果直接使用浏览器原生`localStorage`对象，先从`localStorage`中取出数据，然后修改数据，最后再存入`localStorage`)。
* `set`、`get`、`has`和`remove`方法都支持`path`参数，相对于直接使用原生`localStorage/sessionStorage`对象，大大减少了代码量。
* 同步和异步方法同时支持。`set/asyncSet`、`get/asyncGet`、`has/asyncHas`、`remove/asyncRemove`和`destroy/asyncDestroy`。
* 封装了三种有效性判断，标记(`tag`)、有效期长(`duration`)、有效期至(`until`)，不再重复编码。
* 隐身模式下，有些浏览器不支持`localStorage`和`sessionStorage`，此时自动降级为`variable`模式。
* `gzip`后的只有`2K`。

## Install

```shell
npm install natty-storage --save
```

## nattyStorage(options)

创建缓存对象

参数

- type {String} 可选。指定缓存对象存储数据的方式，可选值为`localStorage`、`sessionStorage`和`variable`。默认为`variable `。注意：当指定`type`的值为`localStorage/sessionStorage`，但浏览器的`localStorage/sessionStorage`不可用时(比如`Safari`浏览器的隐身模式)，会自动降级到`varable`方式存储。

- key {String} 必选。指定缓存对象存储数据所使用的唯一标识。如果两个缓存对象的`key`值相同，则缓存的数据也是相同的。

- tag {String} 可选。用于验证数据有效性的标识(之一)。通过一个标记来判断缓存对象所存储的数据是否有效。`tag`不同则缓存失效。通常`tag`值是一个字符串标识，比如版本号。

- duration {Number} 可选。单位为毫秒。用于验证数据有效性的标识(之二)。通过"有效期长"来判断缓存对象所存储的数据是否有效。过期则缓存失效，不过期则顺延。

- `until` {Number} 可选。值为13位长度的时间戳。用于验证数据有效性的标识(之三)。通过"有效期至"来判断缓存对象所存储的数据是否有效。过期则缓存失效。


示例

```js
const storage = nattyStorage({
    type:     'localStorage',  // 缓存方式, 默认为'localStorage'
    key:      'ChinaCity',     // !!! 唯一必选的参数, 用于内部存储 !!!
    tag:      'v1.0',          // 缓存的标记, 用于判断是否有效
    duration: 1000*60*10,      // 缓存的有效期长, 以毫秒数指定
    until:    1464759086797    // 缓存的到期时间, 以具体日期时间的时间戳指定
})
```

## storage.set(path, value)

在缓存对象上存储数据，没有返回值。

参数

- path {String} 必选。键或路径。路径可以用`.`分割。
- value {Any} 必选。要存的任意类型的数据。

示例

```js
storage.set('foo', 'x')
storage.set('boo.y', 'y')
```

## storage.get(path, [fallbackValue])

获取缓存对象上存储的数据。返回指定路径下对应的值。

参数

- path {String} 必选。键或路径。路径可以用`.`分割。
- fallbackValue {Any} 可选。当指定的路径没有对应的值时，如果指定了该参数，则返回这个参数。

示例

```js
const storage = nattyStorage({
  key: 'test',
  type: 'localStorage'
})

// 获取存在的值
storage.set('foo', 'x')
storage.get('foo') // => 'x'

// 获取不存在的值
storage.get('boo') // => undefined
storage.get('boo', 'x') // => 'x'
storage.get('foo.boo') // => undefined

// 值为0
storage.set('zero', 0)
storage.get('zero', 'x') // => 0
```

## storage.has(path)

判断指定路径的数据在缓存对象中是否存在。

参数

- path {String} 必选。键或路径。

返回 {Object}，包括两个属性

- has {Boolean} 是否存在
- value {Any} 如果存在，`value`为对应的值。否则为`undefined`。

示例

```js
const storage = nattyStorage({
  key: 'test',
  type: 'localStorage'
})

storage.set('foo', 'x')

storage.has('foo') // => {has: true, value: 'x'}
storage.has('boo') // => {has: false, value: undefined}
```

## storage.remove([path])

从缓存对象中删除指定路径的数据，包括键和值，没有返回值。

参数

- path {String} 可选。键或路径，如果不传，则删除所有数据。如果路径找不到，不会报错，当然也不删除任何数据。

示例

```js
// 参数为键
storage.remove('foo')

// 参数为路径
storage.remove('foo.bar')

// 不传参数，删除所有数据
storage.remove()
```

## storage.destroy()

销毁缓存对象，销毁后不能再调用任何方法，没有返回值。

示例

```js
storage.destroy()
```

## async[Set|Get|Has|Remove|Destroy]

上面的`set`、`get`、`has`、`remove`、`destroy`方法都是同步的，同时还有一一对应的一套异步方法，`asyncSet`、`asyncSet`、`asyncHas`、`asyncRemove`、`asyncDestroy`，这些异步方法返回一个标准的`Promise`对象。

```js
ls.asyncSet('foo', 'x').then(() => {
    ls.asyncGet().then(data => {
        // data 值为 {"foo":"x"}
    })
})

```



## storage.dump()

在控制台输出当前缓存对象的所有数据，没有返回值。

示例

```js
storage.set('foo', 'x')
storage.dump()
// 控制台输入如下结果
// {
//    "foo": "x"
// }
```

## nattyStorage.clean()

清理掉因为`until`和`duration`的有效期而过期的数据。在`natty-storage`加载后，内部会自动执行一次。

示例

```js
nattyStorage.clean()
```

## nattyStorage.list()

在浏览器控制台打印出所有由`natty-storage`创建的缓存数据。三个类别的缓存都会被打印。该方法通常仅用于调试。

示例

```js
nattyStorage.list()
```

## nattyStorage.each(fn)

遍历由`natty-storage`创建的所有缓存对象，回调函数接受一个参数，即`storage`对象。上面的`clean`和`list`方法，内部就是调用该方法实现的。

示例

```js
// `nattyStorage.list`方法的内部实现
nattyStorage.list = function () {
    this.each(function (storage) {
        hasConsole && console.log(storage.config.type, storage.config.key, storage.get())
    })
}
```



## IE8和IE9的兼容性

`nattyStorage`依赖现代浏览器的两个对象。在非现代浏览器下，可以通过引入`polyfill`解决。

* `Promise`对象，推荐的`polyfill`：[lie](https://github.com/calvinmetcalf/lie)
* `JSON`对象，推荐的`polyfill`：[json2](https://github.com/douglascrockford/JSON-js)

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

## 本地开发

把代码`clone`到本地，在根目录下执行：

```shell
npm install
npm start
```

## 构建

```shell
npm run build
```
