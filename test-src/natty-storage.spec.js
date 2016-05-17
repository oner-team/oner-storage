"use strict";

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-storage')已被`webpack`映射到全局`NattyDB`对象
const NattyStorage = require('natty-storage');

let count = 1;
let getId = function () {
    return count++;
}

let _describe = function () {

};

let VERSION;
__BUILD_VERSION__

describe('NattyStorage v' + VERSION + ' Unit Test', function() {

    describe('static',function() {
        it('version v' + VERSION, function() {
            expect(NattyStorage.version).to.equal(VERSION);
        });
    });

    describe('environment',function() {
        it.skip('support localStorage: ' + NattyStorage.supportLocalStorage);
        it.skip('support sessionStorage: ' + NattyStorage.supportSessionStorage);
    });

    describe('localStorage', function() {

        describe('storage checking', function() {
            it('create storage instance with cached data', function(){
                let id = getId();
                let ls = new NattyStorage({
                    type: 'localStorage',
                    key: id // 保证之前不存在
                });

                expect(JSON.stringify(ls.get())).to.be('{}');
                ls.set('x', 'x');

                let ls2 = new NattyStorage({
                    type: 'localStorage',
                    key: id // 保证之前存在
                });

                expect(JSON.stringify(ls2.get())).to.be('{"x":"x"}');

                ls.destroy();
            });

            it('create storage instance with version checking: outdated', function(){
                let id = getId();
                let ls = new NattyStorage({
                    type: 'localStorage',
                    key: id, // 保证之前不存在
                    version: '1.0'
                });

                let value = {x:'x'};
                ls.set(value);

                // 版本过期
                let ls2 = new NattyStorage({
                    type: 'localStorage',
                    key: id, // 保证之前存在
                    version: '2.0'
                });

                expect(JSON.stringify(ls2.get())).to.be('{}');

                ls.destroy();
            });


            it('create storage instance without version checking', function(){
                let id = getId();
                let ls = new NattyStorage({
                    type: 'localStorage',
                    key: id, // 保证之前不存在
                    version: '1.0'
                });

                let value = {x:'x'};
                ls.set(value);

                // 版本不过期
                let ls2 = new NattyStorage({
                    type: 'localStorage',
                    key: id // 保证之前存在
                });

                expect(JSON.stringify(ls2.get())).to.be(JSON.stringify(value));

                ls.destroy();
            });

            it('check `lastUpdate` is updated when an new storage was initialized', function (done) {
                let id = 'test-last-update'
                let ls = new NattyStorage({
                    type: 'localStorage',
                    key: id,
                    duration: 200
                });

                // 未过期
                setTimeout(function () {
                    let ls2 = new NattyStorage({
                        type: 'localStorage',
                        key: id,
                        duration: 300
                    });
                    expect(ls2._checkData.lastUpdate - ls._checkData.lastUpdate).to.be.above(40);
                    ls.destroy();
                    done();
                }, 50);
            });

            it('create storage with expire checking', function (done) {
                let id = 'test-expire';
                let ls = new NattyStorage({
                    type: 'localStorage',
                    key: id,
                    duration: 200
                });
                ls.set('x', 'x');

                // 未过期
                setTimeout(function () {
                    let ls2 = new NattyStorage({
                        type: 'localStorage',
                        key: id,
                        duration: 100
                    });
                    ls2.set('y', 'y');
                    expect(ls2.get('x')).to.be('x');
                    expect(ls2.get('y')).to.be('y');
                }, 50);

                // 过期
                setTimeout(function () {
                    let ls3 = new NattyStorage({
                        type: 'localStorage',
                        key: id,
                        duration: 300
                    });

                    expect(JSON.stringify(ls3.get())).to.be('{}');;
                    ls.destroy();
                    done();
                }, 300);
            });
        });

        describe('set/get', function() {

            let ls;

            beforeEach('reset', function () {
                ls = new NattyStorage({
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach('clear', function () {
                ls.destroy();
            });

            it('set pure string value without `key`', function () {
                let value = 'foo';
                ls.set(value);
                expect(ls.get()).to.be(value);
            });

            it('set pure string value with `key`', function () {
                let value = 'x';
                ls.set('x', value);
                expect(ls.get('x')).to.be(value);
            });

            it('set value with `path`', function () {
                let value = 'x';
                ls.set('x.y', value);
                expect(ls.get('x').y).to.be(value);
                expect(ls.get('x.y')).to.be(value);
            });

            it('set/get value with `path:\\\.`', function () {
                let value = 'x';
                ls.set('x.y\\.y.z', value);
                expect(ls.get('x.y\\.y').z).to.be(value);
                expect(ls.get('x.y\\.y.z')).to.be(value);
            });

            it('set path value with merging', function () {
                ls.set({
                    x: {
                        y: 'y'
                    }
                });

                // x 应该同时有 y 和 z
                ls.set('x.z', 'z');

                expect(ls.get('x.y')).to.be('y');
                expect(ls.get('x.z')).to.be('z');

                // ls.delete();
            });

            it('set path value with override', function () {
                ls.set({
                    x: {
                        y: {
                            z: 'z'
                        }
                    }
                });

                // 原 y 对应的对象值将被覆盖
                ls.set('x.y', 'y');

                expect(ls.get('x.y')).to.be('y');
            });

            it('set undefined', function () {
                ls.set('x', undefined);
                // 此时
                // `storage`里对应的值的"{}"
                // 而`ls._data`的值是 {x: undefined}
                // `JSON.stringify`会删除值为`undefined`的键
                expect(JSON.stringify(ls.get())).to.be("{}");
            });

            it('setting invalid value should throw an error', function () {
                ls.set('x', 'x');
                expect(function () {
                    ls.set('x.y', 'y');
                }).to.throwError();
            });

        });

        describe('remove', function () {

            let ls;
            let data = {
                x: {
                    y: {
                        z: 'z',
                        zz: 'zz'
                    }
                }
            };

            beforeEach('reset', function () {
                ls = new NattyStorage({
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach(function () {
                ls.destroy();
            });

            it('remove partial data by path', function() {
                ls.set(data);
                ls.remove('x.y.z');
                expect(ls.get('x.y').zz).to.be('zz');
            });

            it('remove complete data by path', function () {
                ls.set(data);
                ls.remove('x.y');
                expect(JSON.stringify(ls.get('x'))).to.be('{}');
                expect(ls.get('x.y')).to.be(undefined);
            });

            it('remove by a un-existed path', function () {
                ls.set(data);
                ls.remove('x.y.foo');
                expect(JSON.stringify(ls.get())).to.be(JSON.stringify(data));
            });

            it('remove all data', function () {
                ls.set(data);
                ls.remove();
                expect(JSON.stringify(ls.get())).to.be('{}');
            });
        });

        describe('big data', function () {
            this.timeout(1000*60*5);
            let ls;
            let s1MB = require('./1m');
            let s1KB = require('./1k');

            ls = new NattyStorage({
                type: 'localStorage',
                key: 'big'
            });


            // beforeEach('reset', function () {
            //     ls = new NattyStorage({
            //         type: 'localStorage',
            //         key: 'big'
            //     });
            // });
            //
            // afterEach(function () {
            //     // ls.destroy();
            // });

            // it.only('1m', function (done) {
                console.time('t1');
                let s4MB = s1MB + s1MB + s1MB;
                let s100KB = '';
                for (let i=1, l=100; i<=l; i++) {
                    s100KB += s1KB;
                }
                // let s10KB = '';
                // for (let i=1, l=10; i<=l; i++) {
                //     s10KB += s1KB;
                // }

                // ls.set('x', s100KB);
                // console.log(ls.get('x').length);
                // ls.set('x', s4MB);
                // console.log(ls.get('x').length);

                let data = s4MB;
                let i = 1;
                while(i<=30){
                    i++;
                    data += s100KB;
                    // console.log('+100KB', data.length);
                    try {
                        ls.set('x', data);
                    } catch (e) {
                        while(i<=30){
                            i++;
                            data += s1KB;
                            // console.log('+1KB', data.length);
                            try {
                                ls.set('x', data);
                            } catch (e) {
                                console.log(e);
                                console.log('data: ' + data.length/1024/1024 + 'MB');
                                break;
                            }
                        }
                        break;
                    }
                }
                console.timeEnd('t1');
                it.skip('max storage length: ' + (data.length/1024/1024).toFixed(2) + 'MB');
            // });
        });
    });
});
