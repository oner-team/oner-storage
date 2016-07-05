const NULL = null;

/**
 * 变换两个参数的函数到多个参数
 * @param  {Function} fn 基函数
 * @return {Function} 变换后的函数
 * @demo
 *      function add(x, y) { return x+y; }
 *      add = redo(add);
 *      add(1,2,3) => 6
 */
let redo =(fn) => {
	return function () {
		var args = arguments;
		var ret = fn(args[0], args[1]);
		for (var i = 2, l = args.length; i < l; i++) {
			ret = fn(ret, args[i]);
		}
		return ret;
	}
};

const OBJECT = 'object';
let isObject = (v) => {
	return typeof v === OBJECT && v !== NULL;
};

let isWindow = (v) => {
	return v !== NULL && v === v.window;
};

// 参考了zepto
let isPlainObject = (v) => {
	return v !== NULL && isObject(v) && !isWindow(v) && Object.getPrototypeOf(v) === Object.prototype;
};

let isArray = Array.isArray;
if (__BUILD_FALLBACK__) {
	if (!isArray) {
		isArray = (v) => {
			return toString.call(v) === ARRAY_TYPE;
		};
	}
}

/**
 * 对象扩展
 * @param  {Object} receiver
 * @param  {Object} supplier
 * @return {Object} 扩展后的receiver对象
 * @note 这个extend方法是定制的, 不要拷贝到其他地方用!!!
 */
let extend = (receiver = {}, supplier = {}) => {
	for (let key in supplier) {
		// `supplier`中不是未定义的键 都可以执行扩展
		if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
			if (isArray(supplier[key])) {
				receiver[key] = [].concat(supplier[key]);
			} else if (isPlainObject(supplier[key])) {
				receiver[key] = extend({}, supplier[key]);
			} else {
				receiver[key] = supplier[key];
			}
		}
	}
	return receiver;
};

let noop = () => {};

module.exports = {
	extend: redo(extend),
	noop,
	isPlainObject
};
