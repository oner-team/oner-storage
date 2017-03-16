// https://github.com/Automattic/expect.js
document.getElementById('mode').innerHTML = nattyStorage.supportStorage ? 'localStorage可用' : 'localStorage不可用'

let count = 1
const getId = function () {
    return count++
}

const _describe = function () {}
const _it = function (name, fn) {fn()}



describe('nattyStorage v__VERSION__ Unit Test', function() {

    describe('static', function () {
        it('version v__VERSION__', function () {
            expect(nattyStorage.version).to.equal('__VERSION__')
        })
        it('supportStorage', function () {
            expect(nattyStorage.supportStorage).to.be.a('boolean')
        })
    })

    describe('`set/has` method', function () {
        let ls

        beforeEach('reset', function () {
            ls = nattyStorage({
                type: 'localStorage',
                key: 'foo'
            })
        })

        afterEach('clear', function () {
            ls.destroy()
        })

        it('`has` method without any argument: throw error', function () {
            ls.set('foo', 'x')
            const hasErrorFn = function () {
                ls.has()
            }
            expect(hasErrorFn).to.throwError()
        })

        it('`has` method with `key`: has value', function () {
            ls.set('foo', 'x')
            const result = ls.has('foo')
            expect(result.has).to.be(true)
            expect(result.value).to.be('x')
        })

        it('`has` method with `key`: no value', function () {
            ls.set('foo', 'x')
            const result = ls.has('boo')
            expect(result.has).to.be(false)
            expect(result.value).to.be(undefined)
        })

        it('`has` method with `path`: has value', function () {
            ls.set('foo.y', 'y')
            const result = ls.has('foo')
            expect(result.has).to.be(true)
            expect(result.value.y).to.be('y')
        })

        it('`has` method with `path`: no value', function () {
            ls.set('foo.y', 'y')
            const result = ls.has('foo.y.z')
            expect(result.has).to.be(false)
            expect(result.value).to.be(undefined)
        })
    })


    describe('`set/get` method', function () {
        let ls

        beforeEach('reset', function () {
            ls = nattyStorage({
                type: 'localStorage',
                key: 'foo'
            })
        })

        afterEach('clear', function () {
            ls.destroy()
        })

        it('`get` method without `key|path` argument should return all data', function () {
            ls.set('foo', 'x')

            // 没有传入`path`，则返回整个缓存值
            expect(JSON.stringify(ls.get())).to.be('{"foo":"x"}')
        })

        it('`get` method with `key`', function () {
            ls.set('foo', 'x')

            // 没有传入`path`，则返回整个缓存值
            expect(ls.get('foo')).to.be('x')
        })

        it('`set` method with wrong `path`', function () {
            ls.set('foo', 'x')

            const errorSet = function () {
                // 给字符串又设置了属性值 应该抛错
                ls.set('foo.boo', 'y')
            }
            expect(errorSet).to.throwError()
            // set出错以后 需要恢复原值
            expect(JSON.stringify(ls.get())).to.be('{"foo":"x"}')
        })

        it('`get` method with `\\\\ path`', function () {
            ls.set('x.y\\.y.z', 'x')

            // 没有传入`path`，则返回整个缓存值
            expect(ls.get('x.y\\.y.z')).to.be('x')
        })

        it('`set` method with `undefined` value', function () {
            ls.set('foo', undefined)
            // 此时
            // `storage`里对应的值的"{}"
            // 而`ls._data`的值是 {x: undefined}
            // `JSON.stringify`会删除值为`undefined`的键
            // 没有传入`path`，则返回整个缓存值
            expect(JSON.stringify(ls.get())).to.be('{}')
        })
    })

    describe('`set/remove` method', function () {
        let ls
        const value = {
            x: {
                y: {
                    z: 'z',
                    zz: 'zz'
                }
            }
        }

        beforeEach('reset', function () {
            ls = nattyStorage({
                type: 'localStorage',
                key: 'foo'
            })
        })

        afterEach('clear', function () {
            ls.destroy()
        })

        it('remove partial data by path', function() {
            ls.set('foo', value)
            ls.remove('foo.x.y.z')
            expect(ls.get('foo.x.y.zz')).to.be('zz')
        })

        it('remove complete data by path', function () {
            ls.set('foo', value)
            ls.remove('foo.x.y')
            expect(JSON.stringify(ls.get('foo.x'))).to.be('{}')
        })

        it('remove by a un-existed path', function () {
            ls.set('foo', value)
            ls.remove('foo.boo')
            expect(JSON.stringify(ls.get('foo'))).to.be(JSON.stringify(value))
        })

        it('remove all data', function () {
            ls.set('foo', value)
            ls.remove()
            expect(JSON.stringify(ls.get())).to.be('{}')
        })
    })
    
    describe('destroy', function () {
        it('call method after `destroy` should throw error', function () {
            const ls = nattyStorage({
                type: 'localStorage',
                key: 'foo'
            })
            ls.set('foo', 'x')
            ls.destroy()

            // 销毁之后就不能再调用任何方法了
            const hasError = function () {
                ls.get()
            }
            expect(hasError).to.throwError()
        })
    })

    describe('`asyncSet/asyncGet` method', function () {
        let ls

        beforeEach('reset', function () {
            ls = nattyStorage({
                type: 'localStorage',
                key: 'foo'
            })
        })

        afterEach('clear', function () {
            ls.destroy()
        })

        it('`asyncGet` method without `key` argument should return all data', function (done) {
            ls.asyncSet('foo', 'x').then(() => {
                // 没有传入`path`，则返回整个缓存值
                ls.asyncGet().then(data => {
                    expect(JSON.stringify(data)).to.be('{"foo":"x"}')
                    done()
                })
            })
        })

        it('`asyncSet` method with wrong `path`', function (done) {
            ls.set('foo', 'x')

            // 给字符串又设置了属性值 应该抛错
            ls.asyncSet('foo.boo', 'y').then(() => {}).catch(() => {
                // set出错以后 需要恢复原值
                expect(JSON.stringify(ls.get())).to.be('{"foo":"x"}')
                done()
            })
        })
    })

    describe('valid checking', function() {

        it('`tag` checking: invalid', function(){
            const id = getId()
            const ls = nattyStorage({
                type: 'localStorage',
                key: id, // 保证之前不存在
                tag: '1.0'
            })

            ls.set('foo', 'x')

            // 版本过期
            const ls2 = nattyStorage({
                type: 'localStorage',
                key: id, // 保证之前存在
                tag: '2.0'
            })

            expect(JSON.stringify(ls2.get())).to.be('{}')
            ls.destroy()
            ls2.destroy()
        })

        it('`tag` checking: valid', function() {
            const id = getId()
            const ls = nattyStorage({
                type: 'localStorage',
                key: id, // 保证之前不存在
                tag: '1.0'
            })

            ls.set('foo', 'x')

            // 版本不过期
            const ls2 = nattyStorage({
                type: 'localStorage',
                key: id, // 保证之前存在
                tag: '1.0'
            })

            expect(ls2.get('foo')).to.be('x')

            ls.destroy()
        })

        it('`duration` checking：invalid', function (done) {
            const id = 'test-expire'
            const ls = nattyStorage({
                type: 'localStorage',
                key: id,
                duration: 200
            })

            ls.set('foo', 'x')

            // 利用`setTimeout`创建过期
            setTimeout(function () {
                const ls2 = nattyStorage({
                    type: 'localStorage',
                    key: id,
                    duration: 200
                })

                try {
                    expect(JSON.stringify(ls2.get())).to.be('{}')
                    ls.destroy()
                    ls2.destroy()
                    done()
                } catch (e) {
                    done(e)
                }
            }, 300)
        })

        it('`duration` checking：valid', function () {
            const id = 'test-expire'
            const ls = nattyStorage({
                type: 'localStorage',
                key: id,
                duration: 200
            })

            ls.set('foo', 'x')

            const ls2 = nattyStorage({
                type: 'localStorage',
                key: id,
                duration: 200
            })

            expect(ls2.get().foo).to.be('x')
            ls.destroy()
            ls2.destroy()
        })

        it('`until` checking: invalid', function () {
            const id = 'until-invalid'
            const ls = nattyStorage({
                type: 'localStorage',
                key: id,
                until: new Date(new Date().getTime() -1000).getTime() // 永远的上一秒
            })

            ls.set('foo', 'x')

            const ls2 = nattyStorage({
                type: 'localStorage',
                key: id
            })

            expect(JSON.stringify(ls2.get())).to.be('{}')
            ls.destroy()
            ls2.destroy()
        })

        it('`until` checking: valid', function () {
            const id = 'until-valid'
            const ls = nattyStorage({
                type: 'localStorage',
                key: id,
                until: new Date().getTime() + 1000*60*60
            })

            ls.set('x', 'x')

            const ls2 = nattyStorage({
                type: 'localStorage',
                key: id
            })

            expect(JSON.stringify(ls2.get())).to.be('{"x":"x"}')
            ls.destroy()
            ls2.destroy()
        })
    })

    describe('clean', function () {
        it('clean up `until` invalid storage', function () {

            // 这是一个过期的缓存对象
            const ls1 = nattyStorage({
                type: 'localStorage',
                key: 'clean',
                until: new Date(new Date().getTime() -1000).getTime() // 永远的上一秒
            })

            ls1.set('foo', 'x')

            // ls1的数据被清掉了
            nattyStorage.clean()

            // 不会有数据
            const ls1next = nattyStorage({
                type: 'localStorage',
                key: 'clean-until',
            })

            expect(JSON.stringify(ls1next.get())).to.be('{}')
            ls1next.destroy()
        })

        it('clean up `duration` invalid storage', function (done) {
            // 这是一个过期的缓存对象
            const ls1 = nattyStorage({
                type: 'localStorage',
                key: 'clean-duration',
                duration: 100
            })

            ls1.set('foo', 'x')

            // ls1的数据被清掉了
            nattyStorage.clean()

            setTimeout(function () {
                // 不会有数据
                const ls1next = nattyStorage({
                    type: 'localStorage',
                    key: 'clean-duration',
                })
                expect(JSON.stringify(ls1next.get())).to.be('{}')
                ls1next.destroy()
                done()
            }, 300)
        })


    })
})
