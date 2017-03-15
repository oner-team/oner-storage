// https://github.com/Automattic/expect.js
document.getElementById('mode').innerHTML = nattyStorage.supportStorage ? 'localStorage可用' : 'localStorage不可用'

const OneKB = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaa'

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

    describe('sync `set/has` method', function () {
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


    describe('sync `set/get` method', function () {
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

        it('`get` method without `key` argument should return all data', function () {
            ls.set('foo', 'x')

            // 没有传入`path`，则返回整个缓存值
            expect(JSON.stringify(ls.get())).to.be('{"foo":"x"}')
        })
    })

    describe('validity checking', function() {

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
            const id = 'test-valid-until'
            const ls = nattyStorage({
                key: id,
                until: new Date(new Date().getTime() -1000).getTime() // 永远的上一秒
            })

            ls.set('foo', 'x')

            const ls2 = nattyStorage({
                key: id
            })

            expect(JSON.stringify(ls2.get())).to.be('{}')
            ls.destroy()
            ls2.destroy()
        })

        it('`until` checking: valid', function () {
            const id = 'test-valid-until'
            const ls = nattyStorage({
                key: id,
                until: new Date().getTime() + 1000*60*60
            })

            ls.set('x', 'x')

            const ls2 = nattyStorage({
                key: id
            })

            expect(JSON.stringify(ls2.get())).to.be('{"x":"x"}')
            ls.destroy()
            ls2.destroy()
        })
    })
})
