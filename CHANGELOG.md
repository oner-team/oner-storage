## Change log


#### v2.2.0 / 2017-12-04

* 添加[`data`](https://github.com/jias/natty-storage#storagedatapath)方法, 把指定的`plain object`对象设置为`storage`的值。

#### v2.1.1 / 2017-08-10

* 旧疾复发！[MagicCube](https://github.com/MagicCube) in [#53](https://github.com/jias/natty-fetch/issues/53)。
* 添加[`sure`](https://github.com/jias/natty-storage#storagesurepath)方法。

#### v2.1.0 / 2017-08-10

* 添加[`nattyStorage.env`](https://github.com/jias/natty-storage#nattystorageenvenv-hash)方法。
* 针对多级路径的取值性能做的进一步优化。多次调用`storage.get('ni.hao.shi.jie')`时，不会多次拆分`path`并递归取值。

#### v2.0.1 / 2017-03-17

* `natty-storage`内部自动执行一次`nattyStorage.clean()`方法。
* `get`和`asyncGet`方法支持`fallbackValue`参数。

#### v2.0.0 / 2017-03-16

* 删除了创建缓存对象时的`async`参数，现在一个缓存对象可以同时使用同步和异步方法。
* 缓存对象添加了一套异步方法，`asyncSet`、`asyncSet`、`asyncHas`、`asyncRemove`、`asyncDestroy`。
* 添加了`nattyStorage.clean`方法，用于清理因为`until`和`duration`的有效期而过期的数据。
* 添加了`nattyStorage.list`方法，方便开发时调试。
* 添加了`nattyStorage.each`方法，方便自定义处理所有缓存对象。
* `Gzip`后的文件大小由`2.5K`降到`2K`。

#### v1.1.2 / 2016-11-07

* 修复`Safari`隐身模式下`storage`被禁用导致的异常。([@pfdgithub](https://github.com/pfdgithub) in [#32](https://github.com/jias/natty-fetch/issues/32))

#### v1.1.1 / 2016-06-30

* `nattyStorage.support`对象添加`variable`值，解决和[`natty-fetch`](https://github.com/Jias/natty-fetch)对接的完整性。
* 删除多余的`setGlobal`和`getGlobal`静态方法。

#### v1.1.0 / 2016-06-29

* 将`nattyStorage`的参数`id`修改为`tag`, 更达意。

#### v1.0.1 / 2016-06-29

* 兼容一下`node`环境

#### v1.0.0 / 2016-06-22

* 第一个正式版
