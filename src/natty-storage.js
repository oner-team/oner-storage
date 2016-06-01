"use strict";

const {extend, isPlainObject} = require('./util');
const win = window;
const hasWindow = 'undefined' !== typeof win;
const NULL = null;
const EMPTY = '';
const TRUE = true;
const FALSE = !TRUE;
const PLACEHOLDER = '_placeholder';

let VERSION;
__BUILD_VERSION__

let support = {
    localStorage: hasWindow && !!win.localStorage && test('localStorage'),
    sessionStorage: hasWindow && !!win.sessionStorage && test('sessionStorage')
};

function test(type) {
    let data = {'x':'x'};
    let key = 'natty-storage-test';
    let tester = createStorage(type);
    tester.set(key, data);
    let useable = JSON.stringify(tester.get(key)) === JSON.stringify(data);
    tester.remove(key);
    return useable;
}

// 全局默认配置
const defaultGlobalConfig = {
    // localStorage, sessionStorage, variable
    type: 'localStorage',

    // 存到浏览器缓存中使用的键
    key: '',

    // 版本号
    tag: '',

    // 有效期长, 单位ms
    duration: 0,

    // 有效期至, 时间戳
    until: 0
};

// 运行时的全局配置
let runtimeGlobalConfig = extend({}, defaultGlobalConfig);

/**
 *  let ls = new NattyStorage({
 *     type: 'localstorage', // sessionstorage, variable
 *       key: 'city',
 *       // 验证是否有效，如果是首次创建该LS，则不执行验证
 *       tag: '1.0'
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

        t._storage = support[t.config.type] ? createStorage(t.config.type) : createVariable();

        t._CHECK_KEY = 'natty-storage-check-' + t.config.key;
        t._DATA_KEY = 'natty-storage-data-' + t.config.key;
        t._placeholderUsed = FALSE;

        // 每个`storage`实例对象都是全新的, 只有`storage`实例的数据才可能是缓存的.
        t._createStamp = +new Date();
    }

    /**
     * 惰性初始化 在首次调用`set、get、remove`方法时才执行一次 且只执行一次
     * @private
     * @note 为什么要做惰性初始化, 因为
     */
    _lazyInit() {
        let t = this;

        t._checkData = t._storage.get(t._CHECK_KEY);

        // 当前`key`的`storage`是否已经存在
        t._isNew = t._checkData === NULL;
        // console.log('is new t._checkData', t._isNew);

        // 没有对应的本地缓存 或 本地缓存已过期 则 创建新的`storage`实例
        if (t._isNew || t.isOutdated()) {
            // console.log('create new t._checkData');
            // 新的数据内容
            t._storage.set(t._DATA_KEY, t._data = {});
        }
        // 使用已有的本地缓存
        else {
            // console.log('use cached t._checkData');
            t._data = t._storage.get(t._DATA_KEY);
            if (t._data === NULL) {
                t._storage.set(t._DATA_KEY, t._data = {});
            }
        }

        // 更新验证数据
        t._storage.set(t._CHECK_KEY, t._checkData = {
            tag:    t.config.tag,
            lastUpdate: t._createStamp,
            duration:   t.config.duration,
            until: t.config.until
        });
    }

    /**
     * 判断当前`key`的`storage`是否已经过期
     * @returns {boolean}
     */
    isOutdated() {
        let t = this;
        if (t.config.tag && t.config.tag !== t._checkData.tag) {
            return TRUE;
        }

        let now = +new Date();
        // 注意要使用`_checkData`的`duration`验证, 而不是用`config`的`duration`验证!!
        if (t._checkData.duration && now - t._checkData.lastUpdate > t._checkData.duration) {
            return TRUE;
        }

        if (t._checkData.until && now > t._checkData.until) {
            return TRUE;
        }

        // console.log('outdated: false');
        return FALSE;
    }

    /**
     * 设置指指定路径的数据
     * @param path {Any} optional 要设置的值的路径 或 要设置的完整值
     * @param value {Any} 值
     *
     * instance.set(object)
     * instance.set('foo', any-type)
     * instance.set('foo.bar', any-type)
     * @note ls.set('x') 则 整个值为 'x'
     */
    set(path, data) {

        let t = this;
        let argumentLength = arguments.length;

        // 同步到storage
        return new Promise(function(resolve, reject) {
            try {
                if (!t._data) {
                    t._lazyInit();
                }

                if (argumentLength === 1) {
                    if (isPlainObject(path)) {
                        t._data = path;
                    } else {
                        t._data[PLACEHOLDER] = path;
                        t._placeholderUsed = TRUE;
                    }
                } else {
                    setValueByPath(path, data, t._data);
                }
                t._storage.set(t._DATA_KEY, t._data);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
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
        return new Promise(function (resolve, reject) {
            try {
                let data;
                if (!t._data) {
                    t._lazyInit();
                }

                if (path) {
                    data = getValueByPath(path, t._data);
                } else if (t._placeholderUsed) {
                    data = t._data[PLACEHOLDER];
                } else {
                    data = t._data;
                }
                resolve(data);
            } catch (e) {
                reject(e);
            }
        });
    }

    has(path) {
        let t = this;
        return new Promise(function (resolve, reject) {
            try {
                let has;
                if (!t._data) {
                    t._lazyInit();
                }
                if (!t._placeholderUsed) {
                    if (!path) {
                        throw new Error('a `path` argument should be passed into the `has` method');
                    }
                    has = hasValueByPath(path, t._data);
                } else {
                    has = t._data.hasOwnProperty(PLACEHOLDER);
                }
                
                let data = {
                    has: has
                };

                if (has) {
                    data.value = getValueByPath(path, t._data);
                }
                
                resolve(data);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * 删除指定的路径的数据, 包括键本身
     * @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
     */
    remove(path) {
        let t = this;
        return new Promise(function (resolve, reject) {
            try {
                if (!t._data) {
                    t._lazyInit();
                }
                if (path) {
                    removeKeyAndValueByPath(path, t._data);
                    t._storage.set(t._DATA_KEY, t._data);
                } else {
                    // 删除所有数据, 复原到初始空对象
                    t.set({});
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * 销毁当前`storage`实例
     */
    destroy() {
        let t = this;
        t._storage.remove(t._CHECK_KEY);
        t._storage.remove(t._DATA_KEY);
    }

    dump() {
        if (JSON && console) {
            console.log(JSON.stringify(this._data, NULL, 4));
        }
    }
}

NattyStorage.version = VERSION;
// TODO 加入隐身模式判断
NattyStorage.supportLocalStorage = support.localStorage;
NattyStorage.supportSessionStorage = support.sessionStorage;
NattyStorage._variable = {};

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


function createStorage(storage) {
    // TODO 降级到variable模式
    storage = win[storage]
    return {
        // NOTE  值为undefined的情况, JSON.stringify方法会将键删除
        // JSON.stringify({x:undefined}) === "{}"
        set: function (key, value) {
            // TODO 看看safari是否还有bug
            // storage.removeItem(key);
            storage.setItem(key, JSON.stringify(value));
        },
        get: function (key) {
            var value = storage.getItem(key);
            // alert(localStorage[key]);
            if (!value) return NULL;
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
    let storage = NattyStorage._variable;
    return {
        set: function (key, value) {
            storage[key] = value;
        },
        get: function (key) {
            // 当对应的键不存在时, 返回值保持和`storage`一致。
            if (!(key in storage)) {
                return NULL;
            }
            return storage[key]
        },
        remove: function (key) {
            delete storage[key];
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

function hasValueByPath(path, data, isKey) {
    // 首次调用, 如果没有`.`, 就是key的含义
    isKey = isKey || path.indexOf('.') === -1;
    if (isKey) {
        return data.hasOwnProperty(path);
    } else {
        let keys = splitPathToKeys(path);
        while(keys.length) {
            let key = keys.shift();
            // console.log('check key: ', key);
            let hasKey = data.hasOwnProperty(key);
            if (hasKey && keys.length) {
                data = getValueByPath(key, data, true);
                if (!isPlainObject(data)) {
                    return FALSE;
                }
            } else {
                return hasKey;
            }
        }
    }
}

// TODO 移到单测里
// let aa = {
//     bb: {
//         cc: {}
//     },
//     dd: 'dd',
//     ee: {
//         cc: 0
//     }
// }
//
// console.log('has key: bb.cc', hasValueByPath('bb.cc', aa));
// console.log('has key: bb.dd', hasValueByPath('bb.dd', aa));
// console.log('has key: dd.cc', hasValueByPath('dd.cc', aa));
// console.log('has key: dd.length', hasValueByPath('dd.length', aa));
// console.log('has key: ee.cc', hasValueByPath('ee.cc', aa));
// console.log('has key: ee.dd', hasValueByPath('ee.dd', aa));

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

module.exports = NattyStorage;
