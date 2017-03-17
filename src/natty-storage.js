import {extend, isPlainObject, noop, hasWindow, hasConsole} from './util'

const NULL = null
const EMPTY = ''
const TRUE = true
const FALSE = !TRUE
const UNDEFINED = undefined
const supportStorage = isSupportStorage()

// 全局默认配置
let defaultGlobalConfig = {
    // localStorage, sessionStorage, variable
    type: 'variable',

    // 存到浏览器缓存中使用的键
    key: EMPTY,

    // 版本号
    tag: EMPTY,

    // 有效期长, 单位ms
    duration: 0,

    // 有效期至, 时间戳
    until: 0
}

class Storage {
    constructor(options = {}) {

        this.config = extend({}, defaultGlobalConfig, options)

        // 必须配置`key`!!! 无论什么类型!!!
        if (!this.config.key) {
            throw new Error('`key` is required when creating a storage!')
        }

        this._storage = (this.config.type !== 'variable' && supportStorage) ?
            createStorage(this.config.type) : createVariable()

        this._CHECK_KEY = 'NSCheck:' + this.config.key
        this._DATA_KEY = 'NSData:' + this.config.key

        // 每个`storage`实例对象都是全新的, 只有`storage`实例的数据才可能是缓存的.
        this._createStamp = +new Date()

        // 数据备份
        // 每次set新值之前，先备份当前数据，如果set过程中失败了，则恢复该备份数据
        this._backupData = {}

        // 用于有效性验证的数据
        this._checkData = this._storage.get(this._CHECK_KEY)

        // 当前`key`的`storage`是否已经存在
        this._isNew = this._checkData === NULL
    }

    // 惰性初始化 在首次调用`set、get、remove`方法时才执行一次 且只执行一次
    // @private
    // @note 为什么要做惰性初始化, 因为当数据大时，可以把读取数据的时间推迟
    // 到第一次调用`set、get、remove`方法时, 从而可以非常快的创建`storage`实例
    _lazyInit() {

        // 没有对应的本地缓存 或 本地缓存已过期 则 创建新的`storage`实例
        if (this._isNew || this.isOutdated()) {
            // 新的数据内容
            this._storage.set(this._DATA_KEY, this._data = {})
        }

        // 如果有对应的本地缓存，则将数据添加到`this._data`上
        else {
            this._data = this._storage.get(this._DATA_KEY)
            if (this._data === NULL) {
                this._storage.set(this._DATA_KEY, this._data = {})
            }
        }

        // 更新验证条件，用于下次检查有效性
        // 只有真正调用了实例方法，才会更新验证数据。
        // 这样可以在`nattyStorage.clean`方法中，将那些仅实例化但不使用的缓存实例清理掉。
        this._storage.set(this._CHECK_KEY, this._checkData = {
            key: this.config.key,
            tag: this.config.tag,
            lastUpdate: this._createStamp,
            duration: this.config.duration,
            until: this.config.until
        })
    }

    // 判断当前`key`的`storage`是否已经过期
    // @returns {boolean}
    isOutdated() {

        if (this.config.tag && this.config.tag !== this._checkData.tag) {
            return TRUE
        }

        const now = +new Date()
        // 注意要使用`_checkData`的`duration`验证, 而不是用`config`的`duration`验证!!
        if (this._checkData.duration && now - this._checkData.lastUpdate > this._checkData.duration) {
            return TRUE
        }

        if (this._checkData.until && now > this._checkData.until) {
            return TRUE
        }

        return FALSE
    }

    // 同步设置数据
    // @param path {Any} optional 要设置的值的路径 或 要设置的完整值
    // @param value {Any} 要设置的值
    set(path, data) {
        if (!this._data) {
            this._lazyInit()
        }

        // step1: 备份数据
        this._backupData = this._data


        try {
            // step2: 更新`this._data`
            // 注意 `setValueByPath`方法是有抛错场景的 比如给字符串值又添加了新的属性
            setValueByPath(path, data, this._data)

            // step3: 将`this._data`存储到`storage`中
            this._storage.set(this._DATA_KEY, this._data)
        } catch (e) {
            // 如果存储失败了，恢复原有数据
            // 保持`this._data`和`storage`中的值同步，是最基本的功能
            this._storage.set(this._DATA_KEY, this._data = this._backupData)

            throw new Error(e)
        }
    }

    // 获取指定的路径的数据
    // @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
    // @returns {Any}
    // instance.get()
    // instance.get('foo')
    // instance.get('foo.bar')
    get(path, fallbackValue) {
        if (!this._data) {
            this._lazyInit()
        }

        let data

        try {
            if (path) {
                data = getValueByPath(path, this._data)
            } else {
                data = this._data
            }
        } catch (e) {
            throw new Error(e)
        }

        return data !== UNDEFINED ? data : fallbackValue
    }

    // 返回指定的路径是否有值
    // @param path {String} optional 要查询的路径
    has(path) {
        if (!this._data) {
            this._lazyInit()
        }

        if (!path) {
            throw new Error('a `key|path` argument should be passed into the `has` method')
        }

        return hasValueByPath(path, this._data) ? {
            has: TRUE,
            value: getValueByPath(path, this._data)
        }: {
            has: FALSE,
            value: UNDEFINED
        }
    }

    // 删除指定的路径的数据, 包括键本身
    // @param path {String} optional 要获取的值的路径 如果不传 则返回整体值
    remove(path) {
        if (!this._data) {
            this._lazyInit()
        }

        // step1: 备份数据
        this._backupData = this._data

        // step2: 更新`this._data`
        if (path) {
            // 如果有`path` 删除对应的键值对
            removeKeyAndValueByPath(path, this._data)
        } else {
            // 删除所有数据, 即复原到初始空对象
            this._data = {}
        }

        // step3: 将`this._data`存储到`storage`中
        try {
            this._storage.set(this._DATA_KEY, this._data)
        } catch (e) {
            // 如果存储失败了，恢复原有数据
            // 保持`this._data`和`storage`中的值同步，是最基本的功能
            this._storage.set(this._DATA_KEY, this._data = this._backupData)
            throw new Error(e)
        }
    }

    // 销毁当前`storage`实例
    destroy() {
        this._data = NULL
        this._checkData = NULL
        this._storage.remove(this._DATA_KEY)
        this._storage.remove(this._CHECK_KEY)
        for (let prop in this.constructor.prototype) {
            if (this.constructor.prototype.hasOwnProperty(prop)) {
                this[prop] = UNDEFINED
            }
        }
    }

    dump() {
        if (!this._data) {
            this._lazyInit()
        }

        if (JSON && hasConsole) {
            console.log(JSON.stringify(this._data, NULL, 4))
        }
    }
}

// 添加异步方法：asyncSet asyncGet asyncHas asyncRemove asyncDestroy
const methodHasAsyncMode = ['set', 'get', 'has', 'remove', 'destroy']
for (let i=0, l=methodHasAsyncMode.length; i<l; i++) {
    let method = methodHasAsyncMode[i]
    Storage.prototype['async' + method.charAt(0).toUpperCase() + method.substr(1)] = function () {
        return new Promise((resolve, reject) => {
            try {
                resolve(this[method].apply(this, arguments))
            } catch(e) {
                reject(e)
            }
        })
    }
}

function createStorage(storage) {
    //  不用担心这个window, 这个函数能调用, 说明已经是在浏览器端了
    storage = window[storage]
    // storage = storage === 'localStorage' ? localStorage : sessionStorage
    return {
        // NOTE  值为undefined的情况, JSON.stringify方法会将键删除
        // JSON.stringify({x:undefined}) === "{}"
        set: function (key, value) {
            storage.setItem(key, JSON.stringify(value))
        },
        get: function (key) {
            let value = storage.getItem(key)
            // alert(localStorage[key])
            if (!value) return NULL
            try {
                value = JSON.parse(value)
            } catch (e) {
            }
            return value
        },
        remove: function (key) {
            storage.removeItem(key)
        }
    }
}

let variable = {}
function createVariable() {
    let storage = variable
    return {
        set: function (key, value) {
            storage[key] = value
        },
        get: function (key) {
            // 当对应的键不存在时, 返回值保持和`storage`一致。
            if (!(key in storage)) {
                return NULL
            }
            return storage[key]
        },
        remove: function (key) {
            delete storage[key]
        }
    }
}

function reserveString (str) {
    return str.split(EMPTY).reverse().join(EMPTY)
}

function splitPathToKeys (path) {
    var ret
    if (path.indexOf('\\.') === -1) {
        ret = path.split('.')
    } else {
        ret = reserveString(path).split(/\.(?!\\)/).reverse()
        for (var i=0, l=ret.length; i<l; i++) {
            ret[i] = reserveString(ret[i].replace(/\.\\/g, '.'))
        }
    }
    return ret
}

// 注意 该方法是有抛错场景的
function setValueByPath(path, value, data) {
    let keys = splitPathToKeys(path)
    let bottomData = data
    while (keys.length) {
        let key = keys.shift()
        if (keys.length) {
            bottomData[key] = bottomData[key] || {}
            bottomData = bottomData[key]
        } else {
            if (isPlainObject(bottomData)) {
                bottomData[key] = value
            } else {
                throw new Error('Cannot create property `'+key+'` on non-object value, path:`'+path+'`')
            }
        }
    }
    return data
}

function getValueByPath(path, data, isKey) {
    isKey = isKey || false
    if (isKey === true || path.indexOf('.') === -1) {
        return data[path]
    } else {
        let keys = splitPathToKeys(path)

        while(keys.length) {
            let key = keys.shift()
            data = getValueByPath(key, data, true)

            if (typeof data !== 'object' || data === UNDEFINED) {
                if (keys.length) data = UNDEFINED
                break
            }
        }
        return data
    }
}

function hasValueByPath(path, data, isKey) {
    // 首次调用, 如果没有`.`, 就是key的含义
    isKey = isKey || path.indexOf('.') === -1
    if (isKey) {
        return data.hasOwnProperty(path)
    } else {
        let keys = splitPathToKeys(path)
        while(keys.length) {
            let key = keys.shift()
            let hasKey = data.hasOwnProperty(key)
            if (hasKey && keys.length) {
                data = getValueByPath(key, data, true)
                if (!isPlainObject(data)) {
                    return FALSE
                }
            } else {
                return hasKey
            }
        }
    }
}

function removeKeyAndValueByPath(path, data) {
    let keys = splitPathToKeys(path)
    let bottomData = data
    while (keys.length) {
        let key = keys.shift()
        if (keys.length) {
            bottomData[key] = bottomData[key] || {}
            bottomData = bottomData[key]
        } else {
            delete bottomData[key]
        }
    }
    return data
}

function isSupportStorage() {
    if (!hasWindow) {
        return FALSE
    }

    if (typeof localStorage !== 'object') {
        return FALSE
    }

    // 执行到这里，说明存在`storage`对象, 但, 有了也不一定能用!!! 比如隐身模式, 所以需要进一步验证
    // `Safari`在隐身模式下会触发错误
    let support = TRUE
    try {
        const a = '__nstest__'
        localStorage.setItem(a, a)
        support = localStorage.getItem(a) === a
        localStorage.removeItem(a)
    } catch (e) {
        support = FALSE
    }
    return support
}

const nattyStorage = (options) => {
    return new Storage(options)
}

nattyStorage.version = '__VERSION__'
nattyStorage._variable = variable
nattyStorage.supportStorage = supportStorage

nattyStorage.each = function (fn = noop) {
    const map = {
        variable: nattyStorage._variable
    }

    if (supportStorage) {
        map.localStorage = localStorage
        map.sessionStorage = sessionStorage
    }

    for (let type in map) {
        for (let key in map[type]) {
            if (key.indexOf('NSCheck:') > -1) {
                let storage = nattyStorage({
                    key: key.match(/NSCheck:(.*)/)[1],
                    type: type
                })
                fn(storage)
            }
        }
    }
}

// 清理localStorage中过期的缓存
nattyStorage.clean = function () {
    this.each(function (storage) {
        if (storage.isOutdated()) {
            storage.destroy()
        }
    })
}

nattyStorage.list = function () {
    this.each(function (storage) {
        hasConsole && console.log(storage.config.type, storage.config.key, storage.get())
    })
}

// 内置处理一次过期数据
nattyStorage.clean()

export default nattyStorage