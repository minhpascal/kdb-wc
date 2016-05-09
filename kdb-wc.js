// Generated by CoffeeScript 1.10.0
(function() {
  var KDBChart, KDBQuery, KDBSrv, KDBTable, _KDBChart, _KDBQuery, _KDBSrv, _KDBTable,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  (function() {
    var CE, error1;
    try {
      return new CustomEvent('test');
    } catch (error1) {
      CE = function(event, params) {
        var evt;
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: void 0
        };
        evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };
      CE.prototype = window.CustomEvent.prototype;
      return window.CustomEvent = CE;
    }
  })();

  _KDBSrv = (function(superClass) {
    extend(_KDBSrv, superClass);

    function _KDBSrv() {
      return _KDBSrv.__super__.constructor.apply(this, arguments);
    }

    _KDBSrv.prototype.createdCallback = function() {
      var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8;
      this.srvType = ((ref = this.attributes['k-srv-type']) != null ? ref.textContent : void 0) || "http";
      this.target = ((ref1 = this.attributes['k-target']) != null ? ref1.textContent : void 0) || null;
      this.wsSrv = ((ref2 = this.attributes['k-srv-uri']) != null ? ref2.textContent : void 0) || location.host;
      this.srvUser = ((ref3 = this.attributes['k-srv-user']) != null ? ref3.textContent : void 0) || null;
      this.srvPass = ((ref4 = this.attributes['k-srv-pass']) != null ? ref4.textContent : void 0) || null;
      this.qPrefix = ((ref5 = this.attributes['k-prefix']) != null ? ref5.textContent : void 0) || "";
      this.debug = ((ref6 = this.attributes['debug']) != null ? ref6.textContent : void 0) || null;
      this.rType = ((ref7 = this.attributes['k-return-type']) != null ? ref7.textContent : void 0) || "json";
      this.fixJson = ((ref8 = this.attributes['fix-json']) != null ? ref8.textContent : void 0) || null;
      this.hidden = true;
      this.ws = this.wsReq = null;
      this.wsQueue = [];
      if (this.debug) {
        return console.log("kdb-connect inited: srvType:" + this.srvType + ", target:" + this.target + ", prefix:" + this.qPrefix + ", rType:" + this.rType);
      }
    };

    _KDBSrv.prototype.runQuery = function(q, cb) {
      if (!cb) {
        cb = function(r, e) {
          return null;
        };
      }
      if (this.srvType === 'http') {
        return this.sendHTTP(q, cb);
      }
      return this.sendWS(q, cb);
    };

    _KDBSrv.prototype.sendWS = function(qq, clb) {
      this.wsQueue.push({
        q: qq,
        cb: clb
      });
      if (!this.ws) {
        this.ws = new WebSocket("ws://" + this.wsSrv + "/");
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = (function(_this) {
          return function() {
            if (_this.debug) {
              console.log("kdb-connect-ws: opened");
            }
            return _this.processWSQueue();
          };
        })(this);
        this.ws.onclose = (function(_this) {
          return function() {
            if (_this.debug) {
              console.log("kdb-connect-ws: closed");
            }
            _this.ws = null;
            return _this.sendWSRes(null, 'closed');
          };
        })(this);
        this.ws.onerror = (function(_this) {
          return function(e) {
            if (_this.debug) {
              console.log("kdb-connect-ws: error " + e.data);
            }
            return _this.sendWSRes(null, e.data);
          };
        })(this);
        this.ws.onmessage = (function(_this) {
          return function(e) {
            var error, error1, res;
            if (_this.debug) {
              console.log("kdb-connect-ws: msg");
            }
            try {
              res = _this.rType === "json" && typeof e.data === 'string' ? JSON.parse(e.data) : typeof e.data === 'object' ? deserialize(e.data) : e.data;
            } catch (error1) {
              error = error1;
              if (_this.debug) {
                console.log("kdb-connect-ws: exception in ws parse " + error);
              }
              return _this.sendWSRes(null, "result parse error: " + error.toString());
            }
            return _this.sendWSRes(res, null);
          };
        })(this);
        return;
      }
      if (this.ws.readyState === 1) {
        return this.processWSQueue();
      }
    };

    _KDBSrv.prototype.sendWSRes = function(r, e) {
      var err, error1, req;
      if (!(req = this.wsReq)) {
        return;
      }
      this.wsReq = null;
      try {
        req.cb(r, e);
      } catch (error1) {
        err = error1;
        console.log("kdb-connect-ws: exception in callback");
        console.log(err);
      }
      return this.processWSQueue();
    };

    _KDBSrv.prototype.processWSQueue = function() {
      var error, error1, req;
      if (this.wsReq || this.wsQueue.length === 0) {
        return;
      }
      this.wsReq = this.wsQueue.shift();
      req = this.wsReq.q;
      if (typeof req === 'string' && this.qPrefix) {
        req = this.qPrefix + req;
      }
      if (this.rType === 'q') {
        try {
          if (typeof req === 'string' && req[0] === '`') {
            req = ' ' + req;
          }
          req = serialize(req);
        } catch (error1) {
          error = error1;
          if (this.debug) {
            console.log("kdb-connect-ws: exception in ws send " + error);
          }
          return this.sendWSRes(null, 'send');
        }
      }
      if (this.ws && this.ws.readyState === 1) {
        return this.ws.send(req);
      }
      this.sendWS(this.wsReq.q, this.wsReq.cb);
      return this.wsReq = null;
    };

    _KDBSrv.prototype.sendHTTP = function(q, cb) {
      var xhr;
      if (this.fixJson) {
        this.fixJson = null;
        if (!this.qPrefix) {
          this.qPrefix = "jsn?enlist ";
        }
        return this.runQuery("{.h.tx[`jsn]:(.j.j');1}[]", (function(_this) {
          return function(r, e) {
            return _this.runQuery(q, cb);
          };
        })(this));
      }
      if (!this.qPrefix && this.srvType === "http" && this.rType === "json") {
        this.qPrefix = "json?enlist ";
      }
      xhr = new XMLHttpRequest();
      xhr.onerror = (function(_this) {
        return function() {
          if (_this.debug) {
            console.log("kdb-connect error: " + xhr.statusText);
          }
          return cb(null, xhr.statusText);
        };
      })(this);
      xhr.ontimeout = (function(_this) {
        return function() {
          if (_this.debug) {
            console.log("kdb-connect timeout");
          }
          return cb(null, "timeout");
        };
      })(this);
      xhr.onload = (function(_this) {
        return function() {
          var error, error1, res;
          if (xhr.status !== 200) {
            return xhr.onerror();
          }
          if (_this.debug) {
            console.log("kdb-connect data: " + xhr.responseText.slice(0, 50));
          }
          try {
            res = _this.rType === "json" ? JSON.parse(xhr.responseText) : _this.rType === "xml" ? xhr.responseXML : xhr.responseText;
          } catch (error1) {
            error = error1;
            if (_this.debug) {
              console.log("kdb-connect: exception in JSON.parse");
            }
            return cb(null, "JSON.parse error: " + error.toString());
          }
          return cb(res, null);
        };
      })(this);
      q = this.qPrefix + encodeURIComponent(q);
      if (this.target) {
        q = q + "&target=" + this.target;
      }
      if (this.debug) {
        console.log("kdb-connect sending request:" + q);
      }
      xhr.open('GET', q, true, this.srvUser, this.srvPass);
      return xhr.send();
    };

    return _KDBSrv;

  })(HTMLElement);

  _KDBQuery = (function(superClass) {
    extend(_KDBQuery, superClass);

    function _KDBQuery() {
      return _KDBQuery.__super__.constructor.apply(this, arguments);
    }

    _KDBQuery.prototype.createdCallback = function() {
      this.hidden = true;
      return this.setupQuery();
    };

    _KDBQuery.prototype.setupQuery = function() {
      var prvExec, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
      prvExec = this.exec;
      this.query = ((ref = this.attributes['k-query']) != null ? ref.textContent : void 0) || this.textContent;
      this.srv = ((ref1 = this.attributes['k-srv']) != null ? ref1.textContent : void 0) || "";
      this.exec = ((ref2 = this.attributes['k-execute-on']) != null ? ref2.textContent : void 0) || "load";
      this.debug = ((ref3 = this.attributes['debug']) != null ? ref3.textContent : void 0) || null;
      this.escapeQ = ((ref4 = this.attributes['k-escape-q']) != null ? ref4.textContent : void 0) || "";
      this.updObjs = ((ref5 = this.attributes['k-update-elements']) != null ? ref5.textContent.split(' ').filter(function(e) {
        return e.length > 0;
      }) : void 0) || [];
      this.result = null;
      if (this.exec === 'load' && !(prvExec === 'load')) {
        if ((ref6 = document.readyState) === 'complete' || ref6 === 'interactive') {
          setTimeout(((function(_this) {
            return function() {
              return _this.runQuery();
            };
          })(this)), 100);
        } else {
          document.addEventListener("DOMContentLoaded", (function(_this) {
            return function(ev) {
              return _this.runQuery();
            };
          })(this));
        }
      }
      this.kRefs = (ref7 = this.query.match(/\$\w+\$/g)) != null ? ref7.map(function(e) {
        return e.slice(1, e.length - 1);
      }) : void 0;
      this.kMap = null;
      if (this.debug) {
        return console.log("kdb-query inited: srv:" + this.srv + ", query:" + this.query + ", executeOn:" + this.exec + ", updateObs:" + this.updObjs + ", refs:" + this.kRefs);
      }
    };

    _KDBQuery.prototype.rerunQuery = function() {
      this.result = null;
      return this.runQuery();
    };

    _KDBQuery.prototype.runQuery = function() {
      var ref;
      if (this.result) {
        return;
      }
      if (typeof this.srv === 'string') {
        this.srv = this.srv === "" ? (ref = document.getElementsByTagName("kdb-srv")) != null ? ref[0] : void 0 : document.querySelector("[k-id='" + this.srv + "']");
      }
      if (this.debug) {
        console.log("kdb-query: executing query");
      }
      return this.srv.runQuery(this.resolveRefs(this.query), (function(_this) {
        return function(r, e) {
          if (_this.debug) {
            console.log("kdb-query: got response with status " + e);
          }
          if (!e) {
            _this.result = r;
            _this.sendEv();
            return _this.updateObjects();
          }
        };
      })(this));
    };

    _KDBQuery.prototype.sendEv = function() {
      if (this.result) {
        return this.dispatchEvent(this.getEv());
      }
    };

    _KDBQuery.prototype.getEv = function() {
      return new CustomEvent("newResult", {
        detail: this.result,
        bubbles: true,
        cancelable: true
      });
    };

    _KDBQuery.prototype.onresult = function(f) {
      this.addEventListener('newResult', f);
      if (this.result) {
        return f(this.getEv());
      }
    };

    _KDBQuery.prototype.updateObjects = function() {
      var j, len, o, ref, results;
      ref = this.updObjs;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        o = ref[j];
        results.push(this.updateObj(document.querySelector("[k-id='" + o + "']")));
      }
      return results;
    };

    _KDBQuery.prototype.updateObj = function(o) {
      var a, e, i, j, len, opt, ref, ref1, results, s;
      if (!o) {
        return;
      }
      if (o.kdbUpd) {
        return o.kdbUpd(this.result);
      } else if (o.nodeName === 'SELECT') {
        o.innerHTML = '';
        ref = this.result;
        results = [];
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          e = ref[i];
          opt = document.createElement('option');
          opt.value = i;
          opt.text = e.toString();
          results.push(o.add(opt));
        }
        return results;
      } else {
        a = ((ref1 = o.attributes['k-append']) != null ? ref1.textContent : void 0) || 'overwrite';
        s = o.textContent ? '\n' : '';
        if (a === 'top') {
          return o.textContent = this.result.toString() + s + o.textContent;
        } else if (a === 'bottom') {
          return o.textContent += s + this.result.toString();
        } else {
          return o.textContent = this.result.toString();
        }
      }
    };

    _KDBQuery.prototype.resolveRefs = function(q) {
      var e, j, len, n, ref, ref1, ref2, txt, v;
      if (!this.kRefs) {
        return q;
      }
      if (!this.kMap) {
        this.kMap = {};
        ref = this.kRefs;
        for (j = 0, len = ref.length; j < len; j++) {
          e = ref[j];
          this.kMap[e] = null;
        }
        for (e in this.kMap) {
          this.kMap[e] = document.querySelector("[k-id='" + e + "']");
        }
      }
      ref1 = this.kMap;
      for (n in ref1) {
        v = ref1[n];
        if (!v) {
          txt = n;
        } else if (v.nodeName === 'SELECT') {
          txt = v.options[v.selectedIndex].text;
        } else if (v.nodeName === 'INPUT') {
          if (v.type === 'checkbox') {
            txt = v.checked ? '1b' : '0b';
          } else if (v.type === 'radio') {
            txt = ((ref2 = v.form.querySelector("input[type='radio'][name='" + v.name + "']:checked")) != null ? ref2.value : void 0) || '';
          } else {
            txt = (v != null ? v.value : void 0) || 'unsupported';
          }
        } else if (v.nodeName === 'TEXTAREA') {
          txt = v.value;
        } else {
          txt = v.textContent;
        }
        q = q.replace(new RegExp("\\$" + n + "\\$", "g"), this.escape(txt));
      }
      return q;
    };

    _KDBQuery.prototype.escape = function(s) {
      if (this.escapeQ) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      } else {
        return s;
      }
    };

    return _KDBQuery;

  })(HTMLElement);

  _KDBTable = (function(superClass) {
    extend(_KDBTable, superClass);

    function _KDBTable() {
      return _KDBTable.__super__.constructor.apply(this, arguments);
    }

    _KDBTable.prototype.createdCallback = function() {
      var ref, ref1, ref2, ref3;
      this.srv = ((ref = this.attributes['k-srv']) != null ? ref.textContent : void 0) || "";
      this.query = ((ref1 = this.attributes['k-query']) != null ? ref1.textContent : void 0) || this.textContent;
      this.debug = ((ref2 = this.attributes['debug']) != null ? ref2.textContent : void 0) || null;
      this.escHtml = (((ref3 = this.attributes['k-escape-html']) != null ? ref3.textContent : void 0) || 'true') === 'true';
      return this.inited = false;
    };

    _KDBTable.prototype.attachedCallback = function() {
      var q, ref, srv;
      if (!this.inited) {
        if (this.debug) {
          console.log("kdb-table: initing");
        }
        this.inited = true;
        if (this.query === "") {
          return;
        }
        if (/\w+/.test(this.query)) {
          if (srv = document.querySelector("[k-id='" + this.query + "']")) {
            this.query = srv;
          }
        }
        if (typeof this.query === 'string') {
          if (this.debug) {
            console.log("kdb-table: creating a query");
          }
          q = new KDBQuery();
          q.setAttribute('k-query', this.query);
          if (this.srv) {
            q.setAttribute('k-srv', this.srv);
          }
          if (this.debug) {
            q.setAttribute('debug', this.debug);
          }
          q.setupQuery();
          this.query = q;
        }
        if (!((ref = this.query) != null ? ref.runQuery : void 0)) {
          return;
        }
        this.query.onresult((function(_this) {
          return function(ev) {
            return _this.onResult(ev);
          };
        })(this));
        if (this.debug) {
          return console.log("kdb-table: init complete");
        }
      }
    };

    _KDBTable.prototype.onResult = function(ev) {
      if (this.debug) {
        console.log("kdb-table: got event");
      }
      if (this.debug) {
        console.log(ev.detail);
      }
      return this.updateTbl(ev.detail);
    };

    _KDBTable.prototype.kdbUpd = function(r) {
      return this.updateTbl(r);
    };

    _KDBTable.prototype.updateTbl = function(r) {
      var c, d, e, j, len, tbl;
      if ((r.length || 0) === 0) {
        return;
      }
      tbl = "<table class='kdb-table'><tr>";
      for (c in r[0]) {
        tbl += "<th>" + (this.escapeHtml(c)) + "</th>";
      }
      tbl += "</tr>";
      for (j = 0, len = r.length; j < len; j++) {
        e = r[j];
        tbl += "<tr>";
        for (c in e) {
          d = e[c];
          tbl += "<td>" + (this.escapeHtml(d)) + "</td>";
        }
        tbl += "</tr>";
      }
      tbl += "</table>";
      return this.innerHTML = tbl;
    };

    _KDBTable.prototype.escapeHtml = function(s) {
      s = s.toString();
      if (this.escHtml) {
        return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      } else {
        return s;
      }
    };

    return _KDBTable;

  })(HTMLElement);

  _KDBChart = (function(superClass) {
    extend(_KDBChart, superClass);

    function _KDBChart() {
      return _KDBChart.__super__.constructor.apply(this, arguments);
    }

    _KDBChart.prototype.createdCallback = function() {
      var kClass, kStyle, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8;
      this.srv = ((ref = this.attributes['k-srv']) != null ? ref.textContent : void 0) || "";
      this.query = ((ref1 = this.attributes['k-query']) != null ? ref1.textContent : void 0) || this.textContent;
      this.debug = ((ref2 = this.attributes['debug']) != null ? ref2.textContent : void 0) || null;
      this.kAppend = ((ref3 = this.attributes['k-append']) != null ? ref3.textContent : void 0) || "";
      kClass = ((ref4 = this.attributes['k-class']) != null ? ref4.textContent : void 0) || "";
      kStyle = ((ref5 = this.attributes['k-style']) != null ? ref5.textContent : void 0) || "";
      this.kChType = ((ref6 = this.attributes['k-chart-type']) != null ? ref6.textContent : void 0) || "line";
      this.kTime = (ref7 = this.attributes['k-time-col']) != null ? ref7.textContent : void 0;
      this.kData = (ref8 = this.attributes['k-data-cols']) != null ? ref8.textContent.split(' ').filter(function(el) {
        return el.length > 0;
      }) : void 0;
      this.inited = false;
      this.chart = null;
      this.kCont = document.createElement('div');
      this.kCont.className = kClass;
      this.kCont.style.cssText = kStyle;
      this.appendChild(this.kCont);
      if (this.debug) {
        return console.log("kdb-chart: query:" + this.query + ", type:" + this.kChType);
      }
    };

    _KDBChart.prototype.attachedCallback = function() {
      var q, ref, srv;
      if (!this.inited) {
        if (this.debug) {
          console.log("kdb-chart: initing");
        }
        this.inited = true;
        if (this.query === "") {
          return;
        }
        if (/\w+/.test(this.query)) {
          if (srv = document.querySelector("[k-id='" + this.query + "']")) {
            this.query = srv;
          }
        }
        if (typeof this.query === 'string') {
          if (this.debug) {
            console.log("kdb-chart: creating a query");
          }
          q = new KDBQuery();
          q.setAttribute('k-query', this.query);
          if (this.srv) {
            q.setAttribute('k-srv', this.srv);
          }
          if (this.debug) {
            q.setAttribute('debug', this.debug);
          }
          q.setupQuery();
          this.query = q;
        }
        if (!((ref = this.query) != null ? ref.runQuery : void 0)) {
          return;
        }
        this.query.onresult((function(_this) {
          return function(ev) {
            return _this.onResult(ev);
          };
        })(this));
        if (this.debug) {
          return console.log("kdb-chart: init complete");
        }
      }
    };

    _KDBChart.prototype.onResult = function(ev) {
      if (this.debug) {
        console.log("kdb-chart: got event");
      }
      if (this.debug) {
        console.log(ev.detail);
      }
      return this.updateChart(ev.detail);
    };

    _KDBChart.prototype.kdbUpd = function(r) {
      if (this.debug) {
        console.log("kdb-chart: got update");
      }
      if (this.debug) {
        console.log(r);
      }
      return this.updateChart(r);
    };

    _KDBChart.prototype.updateChart = function(r) {
      var cfg, dt, fmt, tm, xfmt;
      if (typeof r === 'object' && r.data) {
        if (this.debug) {
          console.log("C3 format detected");
        }
        if (this.debug) {
          console.log(r);
        }
        return this.updateChartWithData(r);
      }
      if (typeof r === 'object' && r.length > 0) {
        if (this.debug) {
          console.log("Will detect the user format");
        }
        if (!(tm = this.detectTime(r[0]))) {
          return;
        }
        fmt = this.detectTimeFmt(r[0][tm]);
        xfmt = this.detectTimeXFmt(r, tm, fmt);
        if (this.debug) {
          console.log("Time is " + tm + ", fmt is " + fmt + ", xfmt is " + xfmt);
        }
        dt = this.detectData(r[0]);
        if (this.debug) {
          console.log("Data is " + dt);
        }
        if (dt.length === 0) {
          return;
        }
        cfg = {
          data: {
            x: tm,
            rows: this.convertTbl(r, tm, dt),
            type: this.kChType,
            xFormat: fmt
          },
          axis: {
            x: {
              type: 'timeseries',
              tick: {
                fit: true,
                format: xfmt
              }
            }
          }
        };
        if (this.debug) {
          console.log("kdb-chart: cfg is");
        }
        if (this.debug) {
          console.log(cfg);
        }
        return this.updateChartWithData(cfg);
      }
    };

    _KDBChart.prototype.updateChartWithData = function(d) {
      d['bindto'] = this.kCont;
      return this.chart = c3.generate(d);
    };

    _KDBChart.prototype.convertTbl = function(t, tm, dt) {
      var cols, j, len, n, rec, rows;
      cols = [];
      for (n in t[0]) {
        if (n === tm || indexOf.call(dt, n) >= 0) {
          cols.push(n);
        }
      }
      rows = [cols];
      for (j = 0, len = t.length; j < len; j++) {
        rec = t[j];
        rows.push((function() {
          var k, len1, results;
          results = [];
          for (k = 0, len1 = cols.length; k < len1; k++) {
            n = cols[k];
            results.push(n === tm ? this.convTime(rec[n]) : rec[n]);
          }
          return results;
        }).call(this));
      }
      return rows;
    };

    _KDBChart.prototype.detectData = function(r) {
      var n, v;
      if (this.kData) {
        return this.kData;
      }
      for (n in r) {
        v = r[n];
        if (typeof v === 'number' || v instanceof Number) {
          return [n];
        }
      }
      return [];
    };

    _KDBChart.prototype.detectTime = function(r) {
      var n, t, v;
      if (this.kTime && r[this.kTime]) {
        return this.kTime;
      }
      t = null;
      for (n in r) {
        v = r[n];
        if (v instanceof Date) {
          return n;
        }
        if (typeof v === 'string' && this.detectTimeFmt(v)) {
          return n;
        }
        if (!t && v instanceof Number) {
          t = n;
        }
      }
      return t;
    };

    _KDBChart.prototype.detectTimeFmt = function(v) {
      if (v instanceof Date) {
        return (function(d) {
          return d;
        });
      }
      if (/^\d\d:\d\d:\d\d\.\d\d\d/.test(v)) {
        return '%H:%M:%S.%L';
      }
      if (/^\d\d\d\d[-\.]\d\d[-\.]\d\d[DT]\d\d:\d\d:\d\d\.\d\d\d/.test(v)) {
        return '%Y-%m-%dT%H:%M:%S.%L';
      }
      if (/^\d\d\d\d-\d\d-\d\d/.test(v)) {
        return '%Y-%m-%d';
      }
      if (/^\d\d\d\d\.\d\d\.\d\d/.test(v)) {
        return '%Y.%m.%d';
      }
      if (/^\d+D\d\d:\d\d:\d\d\.\d\d\d/.test(v)) {
        return '%jT%H:%M:%S.%L';
      }
      if (/^\d\d:\d\d:\d\d/.test(v)) {
        return '%H:%M:%S';
      }
      if (/^\d\d:\d\d/.test(v)) {
        return '%H:%M';
      }
    };

    _KDBChart.prototype.detectTimeXFmt = function(r, tm, f) {
      var fmt, i;
      if (typeof f === 'string' && f.length < 12) {
        return f;
      }
      if (typeof f === 'string') {
        fmt = d3.time.format(f);
        f = function(d) {
          return fmt.parse(d);
        };
      }
      i = Math.abs((f(this.convTime(r[r.length - 1][tm]))) - (f(this.convTime(r[0][tm]))));
      if (i < 86400000) {
        return '%H:%M:%S.%L';
      }
      return '%Y.%m.%dT%H:%M';
    };

    _KDBChart.prototype.convTime = function(d) {
      if (!(typeof d === 'string' && d.length >= 20)) {
        return d;
      }
      if (d[d.length - 4] !== ".") {
        d = d.slice(0, -6);
      }
      if (d[4] === '.') {
        d = d.replace('.', '-').replace('.', '-');
      }
      return d.replace('D', 'T');
    };

    return _KDBChart;

  })(HTMLElement);

  KDBChart = document.registerElement('kdb-chart', {
    prototype: _KDBChart.prototype
  });

  KDBSrv = document.registerElement('kdb-srv', {
    prototype: _KDBSrv.prototype
  });

  KDBQuery = document.registerElement('kdb-query', {
    prototype: _KDBQuery.prototype
  });

  KDBTable = document.registerElement('kdb-table', {
    prototype: _KDBTable.prototype
  });

}).call(this);
