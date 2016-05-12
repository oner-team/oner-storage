"use strict";

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-storage')已被`webpack`映射到全局`NattyDB`对象
const NattyStorage = require('natty-storage');

let count = 1;
let getId = function () {
    return count++;
}

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

    describe('constructor', function() {
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
            ls.set(null, value);

            // 版本过期
            // debugger
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
            ls.set(null, value);

            // 版本过期
            let ls2 = new NattyStorage({
                type: 'localStorage',
                key: id // 保证之前存在
            });

            expect(JSON.stringify(ls2.get())).to.be(JSON.stringify(value));

            ls.destroy();
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
            ls.set(null, value);
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
            ls.set(null, {
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
            ls.set(null, {
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

        it('remove partial data by path', function() {
            ls.set(null, data);
            ls.remove('x.y.z');
            expect(ls.get('x.y').zz).to.be('zz');
        });

        it('remove complete data by path', function () {
            ls.set(null, data);
            ls.remove('x.y');
            expect(JSON.stringify(ls.get('x'))).to.be('{}');
            expect(ls.get('x.y')).to.be(undefined);
        });

        it('remove by a un-existed path', function () {
            ls.set(null, data);
            ls.remove('x.y.foo');
            expect(JSON.stringify(ls.get())).to.be(JSON.stringify(data));
        });

        it('remove all data', function () {
            ls.set(null, data);
            ls.remove();
            expect(JSON.stringify(ls.get())).to.be('{}');
        });
        
    });
});
