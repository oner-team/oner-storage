# natty-storage

storage plus for javascript

> The experience for developers is crucial！
> Widgets of `Natty` series, with vertical thinking and the spirit of the craftsman, concentrates on improving the user experiences of Web developers. if it does help you, please give a support. :D

## Characteristic

* It uses `localStorage` and `sessionStorage` asynchronously(`Promise`) which is non-blocking, and it can decently catch exceptions (for instance, the biggest limitation of browsers is exceeded)。
* It supports using path (`Path`) to set、retrieve and delete data, and it significantly reduces los of code compared with using native objects.
* It encapsulates three estimation of validity(`validity`), including tags(`tag`)、long validity(`duration`)、validUntil(`validUntil`), to avoid redundant coding.
* In the incognito mode, `localStorage` is not supported in some browsers, now it is automatically demoted to the `variable` mode.
* After `gzip`, only `2.3K`.

> TODO：demo added as further explaination for each characteristic

## Create the cache object

create the object cache instances

```js
let ls = new NattyStorage({
    type: 'localStorage',
    key: 'foo',
    tag: '1.0',
    ...
});
```

#### `type`(optionally)：enumerations

Specify how the cache object stores data. optional values are `localStorage`、`sessionStorage` and`variable`. The default value is `localStorage`。

When the value of `type` is `localStorage` and the `localStorage` is not available (such as in incognito mode in some browsers)，it is automatically demoted to `variable` mode to store data.

#### `key`(required)：string

A unique identification of the cache object. If `key` of two cache objects are the same, then cached data also should be the same.

#### `tag`(optionally)：string

Using tags to find out whether the stored data is valid or invalid。If the tags are differnt, the cache is invalidated.

> Used for caching the data which is not likely to change, such as city data.

#### `duration`(optionally)：timestamp

Using "long validity" to find out whether the stored data is valid or invalid. The cache is invalidated when it expires, or it would be postpone to the expiry date。

#### `until`(optionally)：timestamp

Using "validUntil" to find out whether the stored data is valid or invalid. The cache is invalidated when it expires.

## Set Data

Setting data includes adding new data and modifying existing data .

```js
// set complete data
ls.set({x:'x'}).then(function(){
    // do something
}).catch(function(e){
    // deal the error
});

// set any type of complete data
ls.set('x').then().catch();

// set specified data
ls.set('foo', 'x').then().catch();

// set the data for the specified path
ls.set('foo.bar', 'x').then().catch();

// if there is `.` in the path , it needs to be escaped
ls.set('fo\\.o.bar', 'x').then().catch();
```

## Get Data

Getting complete data and getting some data by means of a path are supported

```js
// get complete data
ls.get().then(function(data){
    // do something with data
}).catch(function(e){
    // deal the error
});

// get specified data
ls.get('foo').then().catch();

// get the data for the specified path
ls.get('foo.bar').then().catch();

// if there is `.` in the path , it needs to be escaped
ls.get('fo\\.o.bar').then().catch();
```

##  Determine whether data exists.

```js
// Based on the specified path, determine whether data exists
ls.has('x.y').then(function(result){
	// presence
	// {
	//    has: true,
	//    value: 'value'
	// }
	//
	// absent
	// {
	//    has: false,
	//    value: undefined
	// }
}).catch();

// If you don't specify a path, you need to determine whether the global value is set
// If the global value is not set，and you don't specify a path, it will report an error
ls.has().then().catch();
```


## Delete Data

when data is deleted, the key you specify and the corresponding value will be deleted.

```js
// delete the data and key values of the specified path
ls.remove('x.y').then().catch();

//  clean up the data
ls.remove().then().catch();
```

## Destroy instance

destroy the cache object instance

```js
ls.destory();
```

## External dependencies

`NattyStorage` is based on two objects of modern browsers. If it is not on modern browsers, it should be solved by introducing `polyfill`.

* `Promise` object, recommended `polyfill`：[lie](https://github.com/calvinmetcalf/lie)
* `JSON` object, recommended `polyfill`：[json2](https://github.com/douglascrockford/JSON-js)

## Develop

`clone` the code, and to be run in the root directory：

```shell
npm install
npm run dev
```


