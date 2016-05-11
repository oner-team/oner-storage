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


var ls = {
	set: function (key, value) {
		value = typeof value === 'object' ? JSON.stringify(value) : value;
		ls.removeItem(key);
		ls.setItem(key, value);
	},
	get: function (key) {
		var value = ls.getItem(key);
		if (!value) return null;
		if (value.indexOf('{"') === 0 || value.indexOf('["') === 0
			|| (value.length === 2 && (value === '{}' || value === '[]'))) {
			try {
				value = JSON.parse(value);
			} catch (e) {
			}
		}
		return value;
	},
	remove: function (key) {
		ls.removeItem(key);
	}
};

function createStorage(storage) {
	storage = window[storage];
	return {
		set: function (key, value) {
			value = typeof value === 'object' ? JSON.stringify(value) : value;
			storage.removeItem(key);
			storage.setItem(key, value);
		},
		get: function (key) {
			var value = storage.getItem(key);
			if (!value) return null;
			if (value.indexOf('{"') === 0 || value.indexOf('["') === 0
				|| (value.length === 2 && (value === '{}' || value === '[]'))) {
				try {
					value = JSON.parse(value);
				} catch (e) {
				}
			}
			return value;
		},
		remove: function (key) {
			storage.removeItem(key);
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
			bottomData[key] = {};
			bottomData = bottomData[key];
		} else {
			bottomData[key] = value;
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

// 全局默认配置
const defaultGlobalConfig = {
	type: 'localStorage', // localStorage, sessionStorage
	key: '',
	version: '',
	expired: null
};

// 运行时的全局配置
let runtimeGlobalConfig = extend({}, defaultGlobalConfig);

/**
 *  let ls = new NattyStorage({
 *     type: 'localstorage', // sessionstorage, variable
 *	   key: 'city',
 *	   // 验证是否有效，如果是首次创建该LS，则不执行验证
 *	   check: {
 *	   	   version: '1.0'
 *	   }
 *  })
 */
class NattyStorage {
	constructor(options = {}) {
		let t = this;


		// TODO use or not
		// t.storageId = 'NS_' + NattyStorage.count++;

		t.config = extend({}, runtimeGlobalConfig, options);

		if (!t.config.key) {
			throw new Error('`key` is missing, please check the options passed in `NattyStorage` constructor.');
		}

		t._storage = createStorage(t.config.type);

		t._CHECK_KEY = 'natty-storage-check-' + t.config.key;
		t._checkData = t._storage.get(t._CHECK_KEY);

		t._DATA_KEY = 'natty-storage-data-' + t.config.key;
		t._placeholderUsed = FALSE;

		if (!t.isExisted() || t.isOutdated()) {
			t._storage.set(t._CHECK_KEY, {
				version: t.config.version
			});
			t._storage.set(t._DATA_KEY, t._data = {});
		} else {
			t._data = t._storage.get(t._DATA_KEY);
			if (t._data === null) {
				t._storage.set(t._DATA_KEY, t._data = {});
			}
		}
	}

	/**
	 * @param pathOrData {String|Any} 取决于构造函数参数type的配置
	 * @param value {Any} 值
	 *
	 * instance.set(null, object)
	 * instance.set('foo', any-type)
	 * instance.set('foo.bar', any-type)
	 * @note instance.set(data) 这种是不支持的, 因为不严谨, 第二个参数不传 或 传的值就是undefined, 无法明确区分
	 */
	set(path, data) {
		let t = this;
		if (path !== null) {
			setValueByPath(path, data, t._data);
		} else {
			if (isPlainObject(data)) {
				t._data = data;
			} else {
				t._data[PLACEHOLDER] = data;
				t._placeholderUsed = TRUE;
			}
		}
		t._storage.set(t._DATA_KEY, t._data);
		return t;
	}

	/**
	 * @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
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

	isExisted() {
		return this._checkData !== null;
	}

	isOutdated() {
		let t = this;
		let outdated = false;
		if (t.config.version && t.config.version !== t._checkData.version) {
			outdated = true;
		}

		return outdated;
	}

	/**
	 * 销毁缓存
	 */
	destroy() {
		let t = this;
		t._storage.remove(t._CHECK_KEY);
		t._storage.remove(t._DATA_KEY);
	}
}

// NattyStorage.count = 0;


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
