// const _describe = function () {}
// const _it = function (name, fn) {fn()}

describe('onerStorage.env', function() {

  it('get value by env', function () {
    const storage = onerStorage({
      type: 'variable',
      key: 'config',
    })

    // 使用场景下这个值不是写死的，是运行环境的值
    const NODE_ENV = 'development'

    storage.set('api', onerStorage.env(NODE_ENV, {
      development: 'http://0.0.0.0/api',
      production: 'http://foo.com/api',
    }))

    expect(storage.get('api')).to.be('http://0.0.0.0/api')
  })

  it('get `undefined` by env', function () {
    const storage = onerStorage({
      type: 'variable',
      key: 'config',
    })

    // 使用场景下这个值不是写死的，是运行环境的值
    const NODE_ENV = 'test'

    storage.set('api', onerStorage.env(NODE_ENV, {
      development: 'http://0.0.0.0/api',
      production: 'http://foo.com/api',
    }))

    expect(storage.get('api')).to.be(undefined)
  })

  it('can not set value on env instance', function () {
    const storage = onerStorage({
      type: 'variable',
      key: 'config',
    })

    // 使用场景下这个值不是写死的，是运行环境的值
    const NODE_ENV = 'production'

    storage.set('foo.api', onerStorage.env(NODE_ENV, {
      development: 'http://0.0.0.0/api',
      production: 'http://foo.com/api',
    }))

    // `env`对象不是`PlantObject`节点，所以不能有下层`path`，继续赋值会抛错
    const hasErrorFn = () => {
      storage.set('foo.api.test', 'hello')
    }
    expect(hasErrorFn).to.throwError()
  })

  it('env can not be used for localStorage', function () {
    const storage = onerStorage({
      type: 'localStorage',
      key: 'config',
    })

    const hasErrorFn = () => {
      storage.set('api', onerStorage.env('development', {
        development: 'http://0.0.0.0/api',
      }))
    }

    expect(hasErrorFn).to.throwError()
  })

  it('env can not be used for sessionStorage', function () {
    const storage = onerStorage({
      type: 'sessionStorage',
      key: 'config',
    })

    const hasErrorFn = () => {
      storage.set('api', onerStorage.env('development', {
        development: 'http://0.0.0.0/api',
      }))
    }

    expect(hasErrorFn).to.throwError()
  })
})