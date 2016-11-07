"use strict";

const {extend, isPlainObject, isObject, noop} = require('./util');

let VERSION;
__BUILD_VERSION__

const NULL = null;
const EMPTY = '';
const TRUE = true;
const FALSE = !TRUE;
const PLACEHOLDER = '_placeholder';
const UNDEFINED = undefined;

// 只是判断有没有`storage`对象, 注意, 有了也不一定能用!!! 比如隐身模式
const has = {
    localStorage: typeof localStorage === 'object',
    sessionStorage: typeof sessionStorage === 'object'
};

// 真正判断能不能用
let support = {
    localStorage: test('localStorage'),
    sessionStorage: test('sessionStorage'),
    variable: TRUE
};

// 能力测试
function test(type) {
    if (!has[type]) {
        return FALSE;
    }
    let data = {'x':'x'};
    let key = 'natty-storage-test';
        let tester = createStorage(type);
    try {
        tester.set(key, data);
        let useable = JSON.stringify(tester.get(key)) === JSON.stringify(data);
        tester.remove(key);
        return useable;
    } catch(e) {
        return false;
    }
}

// 全局默认配置
let defaultGlobalConfig = {
    // localStorage, sessionStorage, variable
    type: 'localStorage',

    // 存到浏览器缓存中使用的键
    key: EMPTY,

    // 版本号
    tag: EMPTY,

    // 有效期长, 单位ms
    duration: 0,

    // 有效期至, 时间戳
    until: 0,

    // 是否以异步方式使用set/get/has/remove
    async: false
};

/**
 *  let ls = new nattyStorage({
 *     type: 'localstorage', // sessionstorage, variable
 *       key: 'city',
 *       // 验证是否有效，如果是首次创建该LS，则不执行验证
 *       tag: '1.0'
 *  })
 */
class Storage {
    /**
     * 构造函数
     * @param options
     */
    constructor(options = {}) {

        let t = this;

        t.config = extend({}, defaultGlobalConfig, options);

        // 必须配置`key`!!! 无论什么类型!!!
        if (!t.config.key) {
            throw new Error('`key` is required when using natty-storage!');
        }

        t._storage = (t.config.type !== 'variable' && support[t.config.type]) ? createStorage(t.config.type) : createVariable();

        t._CHECK_KEY = 'nattyStorageCheck:' + t.config.key;
        t._DATA_KEY = 'nattyStorageData:' + t.config.key;
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

        let todo = (resolve, reject) => {
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
        }

        if (t.config.async) {
            return new Promise(todo);
        } else {
            todo(noop, throwError);
        }
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
        let data;
        let todo = function (resolve, reject) {
            try {
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
        }

        if (t.config.async) {
            return new Promise(todo);
        } else {
            todo(noop, throwError);
            return data;
        }
    }

    /**
     * 返回指定的路径是否有值
     * @param path {String} optional 要查询的路径
     * @returns {Promise}
     */
    has(path) {
        let t = this;
        let result;
        let todo = function (resolve, reject) {
            try {
                if (!t._data) {
                    t._lazyInit();
                }

                // 如果有数据 且 没有使用内置`placeholder`, 说明是使用`path`方式设置的值
                if (!t._placeholderUsed && !isEmptyPlainObject(t._data)) {
                    if (!path) {
                        throw new Error('a `path` argument should be passed into the `has` method');
                    }

                    result = hasValueByPath(path, t._data) ? {
                        has: true,
                        value: getValueByPath(path, t._data)
                    }: {}

                    resolve(result);
                } else {
                    result = t._data.hasOwnProperty(PLACEHOLDER) ? {
                        has: true,
                        value: t._data[PLACEHOLDER]
                    } : {}
                    resolve(result);
                }
            } catch (e) {
                reject(e);
            }
        }

        if (t.config.async) {
            return new Promise(todo);
        } else {
            todo(noop, throwError);
            return result;
        }
    }

    /**
     * 删除指定的路径的数据, 包括键本身
     * @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
     */
    remove(path) {
        let t = this;
        let todo = function (resolve, reject) {
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
        }

        if (t.config.async) {
            return new Promise(todo);
        } else {
            todo(noop, throwError);
        }
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
        const t = this;
        if (!t._data) {
            t._lazyInit();
        }

        if (JSON && console) {
            console.log(JSON.stringify(this._data, NULL, 4));
        }
    }
}

function throwError(e) {
    throw new Error(e);
}

function createStorage(storage) {
    //  不用担心这个window, 这个函数能调用, 说明已经是在浏览器端了
    storage = window[storage];
    // storage = storage === 'localStorage' ? localStorage : sessionStorage;
    return {
        // NOTE  值为undefined的情况, JSON.stringify方法会将键删除
        // JSON.stringify({x:undefined}) === "{}"
        set: function (key, value) {
            // TODO 看看safari是否还有bug
            // storage.removeItem(key);
            storage.setItem(key, JSON.stringify(value));
        },
        get: function (key) {
            let value = storage.getItem(key);
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

let variable = {};
function createVariable() {
    let storage = variable;
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
    return str.split(EMPTY).reverse().join(EMPTY);
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

            if (typeof data !== 'object' || data === UNDEFINED) {
                if (keys.length) data = UNDEFINED;
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

function isEmptyPlainObject(v) {
    let ret = TRUE;
    for (let i in v) {
        ret = FALSE;
        break;
    }
    return ret;
}

let nattyStorage = (options) => {
    return new Storage(options);
}

nattyStorage.version = VERSION;
nattyStorage._variable = variable;
nattyStorage.support = support;

module.exports = nattyStorage;
