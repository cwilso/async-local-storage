(function() {
"use strict";

var deleteDb = function() {
  window.indexedDB.deleteDatabase("async_local_storage");
};

var t = doh;
var storage = navigator.alsPolyfillStorage;
var log = console.log.bind(console);
log(storage);

var async = function(desc, test) {
  return {
    name: desc,
    runTest: function() {
      var d = new doh.Deferred();
      test(d, d.callback.bind(d), d.errback.bind(d));
      return d;
    }
  };
};

t.add("async-local-storage", [
  function sanity() {
    t.is("object",   typeof storage);
    t.is("function", typeof storage.has);
    t.is("function", typeof storage.set);
    t.is("function", typeof storage.delete);
    t.is("function", typeof storage.clear);
    t.is("function", typeof storage.forEach);
  },

  async("clear", function(d) {
    storage.clear().then(function() { d.callback(); });
  }),

  async("set", function(d) {
    storage.set("foo", "bar").
      then(storage.get.bind(storage, "foo")).
      then(d.callback.bind(d));
  }),

  async("clear with items", function(d) {
    storage.set("foo", "bar").
      then(function() {
        storage.has("foo").then(function(v) {
          t.t(!!v);
          storage.clear().then(function() {
            storage.count().then(function(c) {
              storage.has("foo").then(function(value) {
                t.is(false, value);
                d.callback();
              });
            })
          });
        });
      });
  }),

  async("get", function(d) {
    var key = "thinger";
    var value = "blarg";
    storage.set(key, value).then(function() {
      storage.get(key).then(function(v) {
        t.is(value, v);
        d.callback();
      });
    });
  }),

  async("has", function(d) {
    var key = "thinger";
    var value = "blarg";
    storage.clear().then(function() {
      storage.set(key, value).then(function() {
        storage.has(key).then(function(v) {
          t.is("boolean", typeof v);
          t.is(true, v);
        });
      }).
      then(function() {
        storage.has("thing that doesn't exist").then(function(v) {
          t.is("boolean", typeof v);
          t.is(false, v);
          d.callback();
        });
      });
    });
  }),

  async("delete", function(d) {
    var key = "thinger";
    var value = "blarg";
    storage.clear().then(function() {
      storage.set(key, value).then(function() {
        storage.has(key).then(function(v) {
          t.is("boolean", typeof v);
          t.is(true, v);
        });
      }).
      then(function() { return storage.delete(key); }).
      then(function() {
        storage.has(key).then(function(v) {
          t.is("boolean", typeof v);
          t.is(false, v);
          d.callback();
        });
      });
    });
  }),

  async("forEach", function(d) {
    storage.clear().then(function() {
      storage.set("foo", "bar");
      return storage.set("thinger", "blarg");
    }).then(function() {
      return storage.count().then(function(c) {
        t.is(2, c);
      });
    }).then(function() {
      var count = 0;
      return storage.forEach(function() {
        count++;
      }).then(function() {
        t.is(count, 2);
        d.callback();
      });
    });
  }),

  async("forEach stops on exception", function(d) {
    storage.clear().then(function() {
      storage.set("foo", "bar");
      return storage.set("thinger", "blarg");
    }).then(function() {

      return storage.count().then(function(c) {
        t.is(2, c);
      });

    }).then(function(c) {

      return storage.forEach(
        function(value, key) {
          throw new Error("synthetic");
        }
      ).catch(
        function(e) {
          t.t(e instanceof Error);
        }
      ).then(
        function(value) {
          storage.get("foo").then(function(v) {
            t.is("bar", v);
            d.callback();
          });
        },
        console.error.bind(console)
      );
    });
  }),

  async("correctly store deep cloneable objects", function(d) {
    var deepCloneable = {
      "key with spaces": true,
      "key with object value": { thinger: "blarg" },
      "key with integer value": 12,
    };
    storage.clear().then(function() {
      return storage.set("cloneable", deepCloneable);
    }).then(function() {
      return storage.get("cloneable");
    }).then(function(value) {
      t.is(deepCloneable, value);
      d.callback();
    });
  }),

  async("correctly stores blobs", function(d) {
    // WTF...YUNO "new Blob()", web platform!?!
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "test.html", true);
    xhr.responseType = "blob";
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        // TODOC(slightlyoff):
        //    Does not pass in Chrome, IDB fails on Blobs!
        storage.set("blob", xhr.response).then(function() {
          return storage.get("blob").then(function(value) {
            t.t(value instanceof Blob);
            d.callback();
          }, log);
        }, function(e) { d.errback(e); });
      }
    };
  }),
], deleteDb, deleteDb);

})();
