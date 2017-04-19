
export const hasWindow = 'undefined' !== typeof window;
export const hasConsole = 'undefined' !== typeof console;
const NULL = null

/**
 * 变换两个参数的函数到多个参数
 * @param  {Function} fn 基函数
 * @return {Function} 变换后的函数
 * @demo
 *      function add(x, y) { return x+y; }
 *      add = redo(add);
 *      add(1,2,3) => 6
 */
const redo = fn => {
	return function() {
		const args = arguments
		let ret = fn(args[0], args[1])
		for (let i = 2, l = args.length; i < l; i++) {
			ret = fn(ret, args[i])
		}
		return ret
	}
};

const OBJECT = 'object'
const isObject = v => {
	return typeof v === OBJECT && v !== NULL
}

const isWindow = v => {
	return v !== NULL && v === v.window
}

// 参考了zepto
export const isPlainObject = v => {
	return v !== NULL && isObject(v) && !isWindow(v) && Object.getPrototypeOf(v) === Object.prototype
}

const ARRAY_TYPE = '[object Array]'
export const isArray = Array.isArray || (v => Object.prototype.toString.call(v) === ARRAY_TYPE)

/**
 * 对象扩展
 * @param  {Object} receiver
 * @param  {Object} supplier
 * @return {Object} 扩展后的receiver对象
 * @note 这个extend方法是定制的, 不要拷贝到其他地方用!!!
 */
let _extend = (receiver = {}, supplier = {}) => {
    for (let key in supplier) {
        // `supplier`中不是未定义的键 都可以执行扩展
        if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
            if (isArray(supplier[key])) {
                receiver[key] = [].concat(supplier[key]);
            } else if (isPlainObject(supplier[key])) {
                receiver[key] = _extend({}, supplier[key]);
            } else {
                receiver[key] = supplier[key];
            }
        }
    }
    return receiver;
};

export const extend = redo(_extend)

export const noop = function () {}
