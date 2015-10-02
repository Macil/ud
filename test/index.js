/* @flow */
//jshint ignore:start

const sinon = require('sinon');
const assert = require('assert');
import * as ud from "../src";

function bomb() {
  throw new Error("Should not be called");
}

function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

describe("ud", function() {
  describe("markReloadable", function() {
    it("calls module.hot.accept when available", function() {
      const _module: any = {
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
      const obj = {};
      assert.strictEqual(ud.defonce(({}:any), ()=>obj), obj);
    });

    it("throws if same module and key used multiple times", function() {
      const _module: any = {};
      ud.defonce(_module, ()=>1);
      (assert:any).throws(()=>{
        ud.defonce(_module, ()=>2);
      }, 'ud functions can only be used once per module with a given key');

      ud.defonce(_module, ()=>3, 'foo');
      (assert:any).throws(()=>{
        ud.defonce(_module, ()=>4, 'foo');
      }, 'ud functions can only be used once per module with a given key');
    });

    it("works over two reloads", function() {
      let _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      const obj = {};
      assert.strictEqual(ud.defonce(_module1, ()=>obj), obj);
      assert(_module1.hot.accept.called);

      const hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null; // make sure we don't accidentally re-use this

      let _module2: any = {
        hot: {
          data: hotData1,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      assert.strictEqual(ud.defonce(_module2, bomb), obj);
      assert(_module2.hot.accept.called);

      const hotData2 = {};
      _module2.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData2);
      });
      _module2 = null;

      let _module3: any = {
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
      const obj = {};
      assert.strictEqual(ud.defobj(({}:any), obj), obj);
    });

    it("works", function() {
      let _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      const obj = ud.defobj(_module1, {a:5,c:10});
      assert.deepEqual(obj, {a:5,c:10});
      assert(_module1.hot.accept.called);

      const hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      let _module2: any = {
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
      const fn = ()=>5;
      assert.strictEqual(ud.defn(({}:any), fn), fn);

      class C {}
      const Cproto = C.prototype;
      assert.strictEqual(ud.defn(({}:any), C), C);
      assert.strictEqual(C.prototype, Cproto);
      assert.strictEqual(C.prototype.constructor, C);
    });

    it("works on basic functions", function() {
      let _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      const fn = ud.defn(_module1, ()=>5);
      assert.strictEqual(fn(), 5);
      assert(_module1.hot.accept.called);

      const hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      let _module2: any = {
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
      let _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      const C = ud.defn(_module1, class C {
        x: number;
        constructor() {
          this.x = 1;
        }
        foo() {return 'foo';}
        static sfoo() {return 'foo';}
        one() {return 1;}
        static one() {return 1.1;}
      });
      const Cfirstproto = C.prototype;
      const c1 = new C();
      assert.strictEqual(c1.constructor, C);
      assert.strictEqual(Object.getPrototypeOf(c1), Cfirstproto);
      assert.strictEqual(c1.x, 1);
      assert.strictEqual(c1.foo(), 'foo');
      assert.strictEqual(c1.one(), 1);
      assert.strictEqual(C.sfoo(), 'foo');
      assert.strictEqual(C.one(), 1.1);
      assert(_module1.hot.accept.called);

      const hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      let _module2: any = {
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
        foo() {return 'bar';}
        static sfoo() {return 'bar';}
        two() {return 2;}
        static two() {return 2.1;}
      }), C);
      assert.strictEqual(C.prototype, Cfirstproto);
      const c2 = new C();
      assert.strictEqual(c2.constructor, C);
      assert.strictEqual(Object.getPrototypeOf(c2), Cfirstproto);
      assert.strictEqual(c2.x, 2);
      assert.strictEqual(c2.foo(), 'bar');
      assert(!has(c2, 'one'));
      assert.strictEqual((c2:any).two(), 2);
      assert.strictEqual(c1.x, 1);
      assert.strictEqual(c1.foo(), 'bar');
      assert(!has(c1, 'one'));
      assert.strictEqual((c1:any).two(), 2);
      assert.strictEqual(C.sfoo(), 'bar');
      assert(!has(C, 'one'));
      assert.strictEqual((C:any).two(), 2.1);

      const hotData2 = {};
      _module2.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData2);
      });
      _module2 = null;

      let _module3: any = {
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
        foo() {return 'baz';}
        static sfoo() {return 'baz';}
        three() {return 3;}
        static three() {return 3.1;}
      }), C);
      assert.strictEqual(C.prototype, Cfirstproto);
      const c3 = new C();
      assert.strictEqual(c3.constructor, C);
      assert.strictEqual(Object.getPrototypeOf(c3), Cfirstproto);
      assert.strictEqual(c3.x, 3);
      assert.strictEqual(c3.foo(), 'baz');
      assert(!has(c3, 'one'));
      assert(!has(c3, 'two'));
      assert.strictEqual((c3:any).three(), 3);
      assert.strictEqual(c2.x, 2);
      assert.strictEqual(c2.foo(), 'baz');
      assert(!has(c2, 'one'));
      assert(!has(c2, 'two'));
      assert.strictEqual((c2:any).three(), 3);
      assert.strictEqual(c1.x, 1);
      assert.strictEqual(c1.foo(), 'baz');
      assert(!has(c1, 'one'));
      assert(!has(c1, 'two'));
      assert.strictEqual((c1:any).three(), 3);
      assert.strictEqual(C.sfoo(), 'baz');
      assert(!has(C, 'one'));
      assert(!has(C, 'two'));
      assert.strictEqual((C:any).three(), 3.1);
    });

    it("can change a class's superclass", function() {
      let _module1: any = {
        hot: {
          data: null,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      class S1 {
        s: number;
        constructor() {
          this.s = 1;
        }
        calls() {
          return 1;
        }
        static scalls() {
          return 1;
        }
      }
      const C = ud.defn(_module1, class C extends S1 {
        c: number;
        constructor() {
          super();
          this.c = 1;
        }
        callc() {
          return 1;
        }
        static scallc() {
          return 1;
        }
      });
      const c1 = new C();
      assert(c1 instanceof C);
      assert(c1 instanceof S1);
      assert.strictEqual(c1.s, 1);
      assert.strictEqual(c1.calls(), 1);
      assert.strictEqual(c1.c, 1);
      assert.strictEqual(c1.callc(), 1);
      assert.strictEqual(C.scalls(), 1);
      assert.strictEqual(C.scallc(), 1);

      const hotData1 = {};
      _module1.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData1);
      });
      _module1 = null;

      let _module2: any = {
        hot: {
          data: hotData1,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      class S2 {
        s: number;
        constructor() {
          this.s = 2;
        }
        calls() {
          return 2;
        }
        static scalls() {
          return 2;
        }
      }
      assert.strictEqual(ud.defn(_module2, class C extends S2 {
        c: number;
        constructor() {
          super();
          this.c = 2;
        }
        callc() {
          return 2;
        }
        static scallc() {
          return 2;
        }
      }), C);
      const c2 = new C();
      assert(c2 instanceof C);
      assert(c2 instanceof S2);
      assert(!(c2 instanceof S1));
      assert.strictEqual(c2.s, 2);
      assert.strictEqual(c2.calls(), 2);
      assert.strictEqual(c2.c, 2);
      assert.strictEqual(c2.callc(), 2);
      assert(c1 instanceof C);
      assert(c1 instanceof S2);
      assert(!(c1 instanceof S1));
      assert.strictEqual(c1.s, 1);
      assert.strictEqual(c1.calls(), 2);
      assert.strictEqual(c1.c, 1);
      assert.strictEqual(c1.callc(), 2);
      assert.strictEqual(C.scalls(), 2);
      assert.strictEqual(C.scallc(), 2);

      const hotData2 = {};
      _module2.hot.dispose.getCalls().forEach(call => {
        call.args[0].call(null, hotData2);
      });
      _module2 = null;

      let _module3: any = {
        hot: {
          data: hotData2,
          accept: sinon.spy(),
          dispose: sinon.spy()
        }
      };
      class S3 {
        s: number;
        constructor() {
          this.s = 3;
        }
        calls() {
          return 3;
        }
        static scalls() {
          return 3;
        }
      }
      assert.strictEqual(ud.defn(_module3, class C extends S3 {
        c: number;
        constructor() {
          super();
          this.c = 3;
        }
        callc() {
          return 3;
        }
        static scallc() {
          return 3;
        }
      }), C);
      const c3 = new C();
      assert(c3 instanceof C);
      assert(c3 instanceof S3);
      assert(!(c3 instanceof S2));
      assert(!(c3 instanceof S1));
      assert.strictEqual(c3.s, 3);
      assert.strictEqual(c3.calls(), 3);
      assert.strictEqual(c3.c, 3);
      assert.strictEqual(c3.callc(), 3);
      assert(c2 instanceof C);
      assert(c2 instanceof S3);
      assert(!(c2 instanceof S2));
      assert(!(c2 instanceof S1));
      assert.strictEqual(c2.s, 2);
      assert.strictEqual(c2.calls(), 3);
      assert.strictEqual(c2.c, 2);
      assert.strictEqual(c2.callc(), 3);
      assert(c1 instanceof C);
      assert(c1 instanceof S3);
      assert(!(c1 instanceof S2));
      assert(!(c1 instanceof S1));
      assert.strictEqual(c1.s, 1);
      assert.strictEqual(c1.calls(), 3);
      assert.strictEqual(c1.c, 1);
      assert.strictEqual(c1.callc(), 3);
      assert.strictEqual(C.scalls(), 3);
      assert.strictEqual(C.scallc(), 3);
    });
  });
});
