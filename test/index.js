/* @flow */
//jshint ignore:start

var sinon = require('sinon');
var assert = require('assert');
import * as ud from "../src";

function bomb() {
  throw new Error("Should not be called");
}

describe("ud", function() {
  describe("markReloadable", function() {
    it("calls module.hot.accept when available", function() {
      var _module: any = {
        hot: {
          accept: sinon.spy()
        }
      };
      ud.markReloadable(_module);
      assert(_module.hot.accept.calledOnce);
    });

    it("does nothing if module.hot isn't available", function() {
      ud.markReloadable(({}:any));
    });
  });

  describe("defonce", function() {
    it("works if no module.hot", function() {
      var obj = {};
      assert.strictEqual(ud.defonce(({}:any), ()=>obj), obj);
    });

    it("throws same module and key used multiple times", function() {
      var _module: any = {};
      ud.defonce(_module, ()=>1);
      assert.throws(()=>{
        ud.defonce(_module, ()=>2);
      }, 'ud functions can only be used once per module with a given key');

      ud.defonce(_module, ()=>3, 'foo');
      assert.throws(()=>{
        ud.defonce(_module, ()=>4, 'foo');
      }, 'ud functions can only be used once per module with a given key');
    });

    it("works over two reloads", function() {
      var _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      var obj = {};
      assert.strictEqual(ud.defonce(_module1, ()=>obj), obj);
      assert(_module1.hot.accept.called);

      var hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null; // make sure we don't accidentally re-use this

      var _module2: any = {
        hot: {
          data: hotData1,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defonce(_module2, bomb), obj);
      assert(_module2.hot.accept.called);

      var hotData2 = {};
      _module2.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData2);
      });
      _module2 = null;

      var _module3: any = {
        hot: {
          data: hotData2,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defonce(_module3, bomb), obj);
      assert(_module3.hot.accept.called);
    });
  });

  describe("defobj", function() {
    it("works if no module.hot", function() {
      var obj = {};
      assert.strictEqual(ud.defobj(({}:any), obj), obj);
    });

    it("works", function() {
      var _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      var obj = ud.defobj(_module1, {a:5});
      assert.deepEqual(obj, {a:5});
      assert(_module1.hot.accept.called);

      var hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      var _module2: any = {
        hot: {
          data: hotData1,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defobj(_module2, {a:6,b:7}), obj);
      assert.deepEqual(obj, {a:6,b:7});
      assert(_module2.hot.accept.called);
    });
  });

  describe("defn", function() {
    it("works if no module.hot", function() {
      var fn = ()=>5;
      assert.strictEqual(ud.defn(({}:any), fn), fn);

      class C {}
      var Cproto = C.prototype;
      assert.strictEqual(ud.defn(({}:any), C), C);
      assert.strictEqual(C.prototype, Cproto);
      assert.strictEqual(C.prototype.constructor, C);
    });

    it("works on basic functions", function() {
      var _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      var fn = ud.defn(_module1, ()=>5);
      assert.strictEqual(fn(), 5);
      assert(_module1.hot.accept.called);

      var hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      var _module2: any = {
        hot: {
          data: hotData1,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defn(_module2, ()=>6), fn);
      assert.strictEqual(fn(), 6);
    });

    it("works on classes", function() {
      var _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      var C = ud.defn(_module1, class C {
        x: number;
        constructor() {
          this.x = 1;
        }
        foo() {
          return 'foo';
        }
      });
      var Cfirstproto = C.prototype;
      var c1 = new C();
      assert.strictEqual(c1.constructor, C);
      assert.strictEqual(Object.getPrototypeOf(c1), Cfirstproto);
      assert.strictEqual(c1.x, 1);
      assert.strictEqual(c1.foo(), 'foo');
      assert(_module1.hot.accept.called);

      var hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      var _module2: any = {
        hot: {
          data: hotData1,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defn(_module2, class C {
        x: number;
        constructor() {
          this.x = 2;
        }
        foo() {
          return 'bar';
        }
      }), C);
      assert.strictEqual(C.prototype, Cfirstproto);
      var c2 = new C();
      assert.strictEqual(c2.constructor, C);
      assert.strictEqual(Object.getPrototypeOf(c2), Cfirstproto);
      assert.strictEqual(c2.x, 2);
      assert.strictEqual(c2.foo(), 'bar');
      assert.strictEqual(c1.x, 1);
      assert.strictEqual(c1.foo(), 'bar');

      var hotData2 = {};
      _module2.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData2);
      });
      _module2 = null;

      var _module3: any = {
        hot: {
          data: hotData2,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defn(_module3, class C {
        x: number;
        constructor() {
          this.x = 3;
        }
        foo() {
          return 'baz';
        }
        bar() {
          return 'bar';
        }
      }), C);
      assert.strictEqual(C.prototype, Cfirstproto);
      var c3 = new C();
      assert.strictEqual(c3.constructor, C);
      assert.strictEqual(Object.getPrototypeOf(c3), Cfirstproto);
      assert.strictEqual(c3.x, 3);
      assert.strictEqual(c3.foo(), 'baz');
      assert.strictEqual((c3:any).bar(), 'bar');
      assert.strictEqual(c2.x, 2);
      assert.strictEqual(c2.foo(), 'baz');
      assert.strictEqual((c2:any).bar(), 'bar');
      assert.strictEqual(c1.x, 1);
      assert.strictEqual(c1.foo(), 'baz');
      assert.strictEqual((c1:any).bar(), 'bar');
    });
  });
});
