import {randomString} from './util'

class ParentEnv {}

// 工厂函数，返回`env`实例对象
// `env`对象的特点：
//   - `env`对象一旦创建，它对应的值就不可以再更改
//   - `env`对象取值的唯一方式是调用`get`方法
const factory = (env, hash) => {
  const random = randomString(6)
  const hashKey = `_${random}`
  const envKey = `_${random}:env`

  class Env extends ParentEnv {
    constructor() {
      super()
      this[hashKey] = hash
      this[envKey] = env
    }

    get() {
      return this[hashKey][env] !== undefined ? this[hashKey][env] : undefined
    }
  }
  return new Env()
}

// 判断是不是`Env`的实例对象，因为`Env`类是由工厂方法动态生成的，所以用`ParentEnv`即可
export const isEnv = v => v instanceof ParentEnv

// @param {String} key 环境变量
// @param {Object} hash 环境变量所有值的映射
// @demo
//   env(NODE_ENV, {
//     development: 'http://0.0.0.0/api',
//     production: 'http://foo.com/api',
//   })
export const env = (key, hash) => {
  return factory(key, hash)
}