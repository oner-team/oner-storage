"use strict";

const {extend, isPlainObject} = require('./util');

const hasWindow = 'undefined' !== typeof window;
const NULL = null;
const EMPTY = '';
const TRUE = true;
const FALSE = !TRUE;
const PLACEHOLDER = '_placeholder';

let VERSION;
__BUILD_VERSION__

function createStorage(storage) {
	storage = window[storage];
	return {
		// NOTE  值为undefined的情况, JSON.stringify方法会将键删除
		// JSON.stringify({x:undefined}) === "{}"
		set: function (key, value) {
			storage.removeItem(key);
			storage.setItem(key, JSON.stringify(value));
		},
		get: function (key) {
			var value = storage.getItem(key);
			if (!value) return null;
			try {
				value = JSON.parse(value);
			} catch (e) {
			}
			return value;
		},
		remove: function (key) {
			storage.removeItem(key);
		}
	}
}

function createVariable() {
	let storage = {};
	return {
		set: function (key, value) {
			storage[key] = value;
		},
		get: function (key) {

		}
	}
}

function reserveString (str) {
	return str.split('').reverse().join('');
}

function splitPathToKeys (path) {
	var ret;
	if (path.indexOf('\\.') === -1) {
		ret = path.split('.');
	} else {
		ret = reserveString(path).split(/\.(?!\\)/).reverse();
		for (var i=0, l=ret.length; i<l; i++) {
			ret[i] = reserveString(ret[i].replace(/\.\\/g, '.'));
		}
	}
	return ret;
}

function setValueByPath(path, value, data) {
	let keys = splitPathToKeys(path);
	let bottomData = data;
	while (keys.length) {
		let key = keys.shift();
		if (keys.length) {
			bottomData[key] = bottomData[key] || {};
			bottomData = bottomData[key];
		} else {
			if (isPlainObject(bottomData)) {
				bottomData[key] = value;
			} else {
				throw new Error('Cannot create property `'+key+'` on non-object value, path:`'+path+'`');
			}
		}
	}
	return data;
}


function getValueByPath(path, data, isKey) {
	isKey = isKey || false;
	if (isKey === true || path.indexOf('.') === -1) {
		return data[path];
	} else {
		let keys = splitPathToKeys(path);

		while(keys.length) {
			let key = keys.shift();
			data = getValueByPath(key, data, true);

			if (typeof data !== 'object' || data === undefined) {
				if (keys.length) data = undefined;
				break;
			}
		}
		return data;
	}
}

function removeKeyAndValueByPath(path, data) {
	let keys = splitPathToKeys(path);
	let bottomData = data;
	while (keys.length) {
		let key = keys.shift();
		if (keys.length) {
			bottomData[key] = bottomData[key] || {};
			bottomData = bottomData[key];
		} else {
			delete bottomData[key];
		}
	}
	return data;
}

// 全局默认配置
const defaultGlobalConfig = {
	// localStorage, sessionStorage
	type: 'localStorage',

	// 存到浏览器缓存中使用的键
	key: '',

	// 版本号
	version: '',

	// 有效期长, 单位ms
	duration: 0,

    // 有效期至, 时间戳
    validUntil: 0
};

// 运行时的全局配置
let runtimeGlobalConfig = extend({}, defaultGlobalConfig);

/**
 *  let ls = new NattyStorage({
 *     type: 'localstorage', // sessionstorage, variable
 *	   key: 'city',
 *	   // 验证是否有效，如果是首次创建该LS，则不执行验证
 *	   version: '1.0'
 *  })
 */
class NattyStorage {
	/**
	 * 构造函数
	 * @param options
	 */
	constructor(options = {}) {
		let t = this;

		t.config = extend({}, runtimeGlobalConfig, options);

		if (!t.config.key) {
			throw new Error('`key` is missing, please check the options passed in `NattyStorage` constructor.');
		}

		t._storage = createStorage(t.config.type);

		t._CHECK_KEY = 'natty-storage-check-' + t.config.key;

		t._checkData = t._storage.get(t._CHECK_KEY);

		// 当前`key`的`storage`是否已经存在
		t._isNew = t._checkData === null;
		// console.log('is new t._checkData', t._isNew);

		t._DATA_KEY = 'natty-storage-data-' + t.config.key;
		t._placeholderUsed = FALSE;

		// 每个`storage`实例对象都是全新的, 只有`storage`实例的数据才可能是缓存的.
		t._createStamp = +new Date();

		// 没有对应的本地缓存 或 本地缓存已过期 则 创建新的`storage`实例
		// debugger
		if (t._isNew || t.isOutdated()) {
			// console.log('create new t._checkData');
			// 新的数据内容
			t._storage.set(t._DATA_KEY, t._data = {});
		}
		// 使用已有的本地缓存
		else {
			// console.log('use cached t._checkData');
			t._data = t._storage.get(t._DATA_KEY);
			if (t._data === null) {
				t._storage.set(t._DATA_KEY, t._data = {});
			}
		}

		// 更新验证数据
		t._storage.set(t._CHECK_KEY, t._checkData = {
			version:    t.config.version,
			lastUpdate: t._createStamp,
			duration:   t.config.duration,
			validUntil: t.config.validUntil
		});

	}

	/**
	 * 判断当前`key`的`storage`是否已经过期
	 * @returns {boolean}
	 */
	isOutdated() {
		let t = this;
		if (t.config.version && t.config.version !== t._checkData.version) {
			return TRUE;
		}

		let now = +new Date();
		// 注意要使用`_checkData`的`duration`验证, 而不是用`config`的`duration`验证!!
		if (t._checkData.duration && now - t._checkData.lastUpdate > t._checkData.duration) {
			return TRUE;
		}


		// console.log('outdated: false');
		return FALSE;
	}

	/**
	 * 设置指指定路径的数据
	 * @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
	 * @param value {Any} 值
	 *
	 * instance.set(null, object)
	 * instance.set('foo', any-type)
	 * instance.set('foo.bar', any-type)
	 * @note ls.set('x') 相当于 ls.set('x', undefined)
	 */
	set(path, data) {

		let t = this;

		if (arguments.length === 1) {
			if (isPlainObject(path)) {
				t._data = path;
			} else {
				t._data[PLACEHOLDER] = path;
				t._placeholderUsed = TRUE;
			}
		} else {
			setValueByPath(path, data, t._data);
		}

		// 同步到storage
		t._storage.set(t._DATA_KEY, t._data);
		return t;
	}

	/**
	 * 获取指定的路径的数据
	 * @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
	 * @returns {ny}
	 *
	 * instance.get()
	 * instance.get('foo')
	 * instance.get('foo.bar')
	 */
	get(path) {
		let t = this;
		if (path) {
			return getValueByPath(path, t._data);
		} else if (t._placeholderUsed) {
			return t._data[PLACEHOLDER];
		} else {
			return t._data;
		}
	}

	/**
	 * 删除指定的路径的数据, 包括键本身
	 * @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
	 */
	remove(path) {
		let t = this;
		if (path) {
			removeKeyAndValueByPath(path, t._data);
			t._storage.set(t._DATA_KEY, t._data);
		} else {
			t.set({});
		}
		return t;
	}

	/**
	 * 销毁当前`storage`实例
	 */
	destroy() {
		let t = this;
		t._storage.remove(t._CHECK_KEY);
		t._storage.remove(t._DATA_KEY);
	}
}

NattyStorage.count = 0;


NattyStorage.version = VERSION;


NattyStorage.supportLocalStorage = hasWindow ? !!window.localStorage : FALSE;
NattyStorage.supportSessionStorage = hasWindow ? !!window.sessionStorage : FALSE;

/**
 * 执行全局配置
 * @param options
 */
NattyStorage.setGlobal = (options) => {
	runtimeGlobalConfig = extend({}, defaultGlobalConfig, options);
	return this;
}

/**
 * 获取全局配置
 * @param property {String} optional
 * @returns {*}
 */
NattyStorage.getGlobal = (property) => {
	return property ? runtimeGlobalConfig[property] : runtimeGlobalConfig;
}

//
// let context = new NattyFetch.Context(/*..*/);
//
// /**
//  * `Context.namespace`方法用于声明一个名称空间, 可以
//  * 重复调用, 如果指定的名称空间已存在, 则返回已有的.
//  * 这样, `Context.namespace`方法可以重复调用, 解决
//  * 旧版的`Context.create`方法必须把所有`api`都声集中
//  * 声明, 而不能追加声明的限制.
//  */
// context.subject('order').api({
// 	create: {},
// 	pay: {}
// });






module.exports = NattyStorage;
