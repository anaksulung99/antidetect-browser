var mf = Object.defineProperty;
var gf = (s, e, t) => e in s ? mf(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var w = (s, e, t) => gf(s, typeof e != "symbol" ? e + "" : e, t);
import yf from "fs";
import wf from "path";
import bf from "os";
import vf from "crypto";
import { ipcMain as Gu, app as Vt, BrowserWindow as Hu } from "electron";
import { createRequire as Sf } from "node:module";
import Be from "node:path";
import { fileURLToPath as _f } from "node:url";
import Ef from "node:fs";
var Ve = { exports: {} };
const Sr = yf, zt = wf, Tf = bf, Cf = vf, vs = [
  "◈ encrypted .env [www.dotenvx.com]",
  "◈ secrets for agents [www.dotenvx.com]",
  "⌁ auth for agents [www.vestauth.com]",
  "⌘ custom filepath { path: '/custom/path/.env' }",
  "⌘ enable debugging { debug: true }",
  "⌘ override existing { override: true }",
  "⌘ suppress logs { quiet: true }",
  "⌘ multiple files { path: ['.env.local', '.env'] }"
];
function Af() {
  return vs[Math.floor(Math.random() * vs.length)];
}
function ct(s) {
  return typeof s == "string" ? !["false", "0", "no", "off", ""].includes(s.toLowerCase()) : !!s;
}
function Pf() {
  return process.stdout.isTTY;
}
function Nf(s) {
  return Pf() ? `\x1B[2m${s}\x1B[0m` : s;
}
const xf = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function If(s) {
  const e = {};
  let t = s.toString();
  t = t.replace(/\r\n?/mg, `
`);
  let r;
  for (; (r = xf.exec(t)) != null; ) {
    const n = r[1];
    let i = r[2] || "";
    i = i.trim();
    const u = i[0];
    i = i.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), u === '"' && (i = i.replace(/\\n/g, `
`), i = i.replace(/\\r/g, "\r")), e[n] = i;
  }
  return e;
}
function Lf(s) {
  s = s || {};
  const e = Zu(s);
  s.path = e;
  const t = pe.configDotenv(s);
  if (!t.parsed) {
    const u = new Error(`MISSING_DATA: Cannot parse ${e} for an unknown reason`);
    throw u.code = "MISSING_DATA", u;
  }
  const r = Yu(s).split(","), n = r.length;
  let i;
  for (let u = 0; u < n; u++)
    try {
      const a = r[u].trim(), f = Bf(t, a);
      i = pe.decrypt(f.ciphertext, f.key);
      break;
    } catch (a) {
      if (u + 1 >= n)
        throw a;
    }
  return pe.parse(i);
}
function Of(s) {
  console.error(`⚠ ${s}`);
}
function _t(s) {
  console.log(`┆ ${s}`);
}
function Ju(s) {
  console.log(`◇ ${s}`);
}
function Yu(s) {
  return s && s.DOTENV_KEY && s.DOTENV_KEY.length > 0 ? s.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
}
function Bf(s, e) {
  let t;
  try {
    t = new URL(e);
  } catch (a) {
    if (a.code === "ERR_INVALID_URL") {
      const f = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      throw f.code = "INVALID_DOTENV_KEY", f;
    }
    throw a;
  }
  const r = t.password;
  if (!r) {
    const a = new Error("INVALID_DOTENV_KEY: Missing key part");
    throw a.code = "INVALID_DOTENV_KEY", a;
  }
  const n = t.searchParams.get("environment");
  if (!n) {
    const a = new Error("INVALID_DOTENV_KEY: Missing environment part");
    throw a.code = "INVALID_DOTENV_KEY", a;
  }
  const i = `DOTENV_VAULT_${n.toUpperCase()}`, u = s.parsed[i];
  if (!u) {
    const a = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${i} in your .env.vault file.`);
    throw a.code = "NOT_FOUND_DOTENV_ENVIRONMENT", a;
  }
  return { ciphertext: u, key: r };
}
function Zu(s) {
  let e = null;
  if (s && s.path && s.path.length > 0)
    if (Array.isArray(s.path))
      for (const t of s.path)
        Sr.existsSync(t) && (e = t.endsWith(".vault") ? t : `${t}.vault`);
    else
      e = s.path.endsWith(".vault") ? s.path : `${s.path}.vault`;
  else
    e = zt.resolve(process.cwd(), ".env.vault");
  return Sr.existsSync(e) ? e : null;
}
function Ss(s) {
  return s[0] === "~" ? zt.join(Tf.homedir(), s.slice(1)) : s;
}
function Df(s) {
  const e = ct(process.env.DOTENV_CONFIG_DEBUG || s && s.debug), t = ct(process.env.DOTENV_CONFIG_QUIET || s && s.quiet);
  (e || !t) && Ju("loading env from encrypted .env.vault");
  const r = pe._parseVault(s);
  let n = process.env;
  return s && s.processEnv != null && (n = s.processEnv), pe.populate(n, r, s), { parsed: r };
}
function Rf(s) {
  const e = zt.resolve(process.cwd(), ".env");
  let t = "utf8", r = process.env;
  s && s.processEnv != null && (r = s.processEnv);
  let n = ct(r.DOTENV_CONFIG_DEBUG || s && s.debug), i = ct(r.DOTENV_CONFIG_QUIET || s && s.quiet);
  s && s.encoding ? t = s.encoding : n && _t("no encoding is specified (UTF-8 is used by default)");
  let u = [e];
  if (s && s.path)
    if (!Array.isArray(s.path))
      u = [Ss(s.path)];
    else {
      u = [];
      for (const d of s.path)
        u.push(Ss(d));
    }
  let a;
  const f = {};
  for (const d of u)
    try {
      const v = pe.parse(Sr.readFileSync(d, { encoding: t }));
      pe.populate(f, v, s);
    } catch (v) {
      n && _t(`failed to load ${d} ${v.message}`), a = v;
    }
  const y = pe.populate(r, f, s);
  if (n = ct(r.DOTENV_CONFIG_DEBUG || n), i = ct(r.DOTENV_CONFIG_QUIET || i), n || !i) {
    const d = Object.keys(y).length, v = [];
    for (const g of u)
      try {
        const S = zt.relative(process.cwd(), g);
        v.push(S);
      } catch (S) {
        n && _t(`failed to load ${g} ${S.message}`), a = S;
      }
    Ju(`injected env (${d}) from ${v.join(",")} ${Nf(`// tip: ${Af()}`)}`);
  }
  return a ? { parsed: f, error: a } : { parsed: f };
}
function Mf(s) {
  if (Yu(s).length === 0)
    return pe.configDotenv(s);
  const e = Zu(s);
  return e ? pe._configVault(s) : (Of(`you set DOTENV_KEY but you are missing a .env.vault file at ${e}`), pe.configDotenv(s));
}
function $f(s, e) {
  const t = Buffer.from(e.slice(-64), "hex");
  let r = Buffer.from(s, "base64");
  const n = r.subarray(0, 12), i = r.subarray(-16);
  r = r.subarray(12, -16);
  try {
    const u = Cf.createDecipheriv("aes-256-gcm", t, n);
    return u.setAuthTag(i), `${u.update(r)}${u.final()}`;
  } catch (u) {
    const a = u instanceof RangeError, f = u.message === "Invalid key length", y = u.message === "Unsupported state or unable to authenticate data";
    if (a || f) {
      const d = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      throw d.code = "INVALID_DOTENV_KEY", d;
    } else if (y) {
      const d = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      throw d.code = "DECRYPTION_FAILED", d;
    } else
      throw u;
  }
}
function qf(s, e, t = {}) {
  const r = !!(t && t.debug), n = !!(t && t.override), i = {};
  if (typeof e != "object") {
    const u = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw u.code = "OBJECT_REQUIRED", u;
  }
  for (const u of Object.keys(e))
    Object.prototype.hasOwnProperty.call(s, u) ? (n === !0 && (s[u] = e[u], i[u] = e[u]), r && _t(n === !0 ? `"${u}" is already defined and WAS overwritten` : `"${u}" is already defined and was NOT overwritten`)) : (s[u] = e[u], i[u] = e[u]);
  return i;
}
const pe = {
  configDotenv: Rf,
  _configVault: Df,
  _parseVault: Lf,
  config: Mf,
  decrypt: $f,
  parse: If,
  populate: qf
};
Ve.exports.configDotenv = pe.configDotenv;
Ve.exports._configVault = pe._configVault;
Ve.exports._parseVault = pe._parseVault;
Ve.exports.config = pe.config;
Ve.exports.decrypt = pe.decrypt;
Ve.exports.parse = pe.parse;
Ve.exports.populate = pe.populate;
Ve.exports = pe;
var kf = Ve.exports;
const nt = {};
process.env.DOTENV_CONFIG_ENCODING != null && (nt.encoding = process.env.DOTENV_CONFIG_ENCODING);
process.env.DOTENV_CONFIG_PATH != null && (nt.path = process.env.DOTENV_CONFIG_PATH);
process.env.DOTENV_CONFIG_QUIET != null && (nt.quiet = process.env.DOTENV_CONFIG_QUIET);
process.env.DOTENV_CONFIG_DEBUG != null && (nt.debug = process.env.DOTENV_CONFIG_DEBUG);
process.env.DOTENV_CONFIG_OVERRIDE != null && (nt.override = process.env.DOTENV_CONFIG_OVERRIDE);
process.env.DOTENV_CONFIG_DOTENV_KEY != null && (nt.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY);
var Qf = nt;
const Ff = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
var jf = function(e) {
  const t = e.reduce(function(r, n) {
    const i = n.match(Ff);
    return i && (r[i[1]] = i[2]), r;
  }, {});
  return "quiet" in t || (t.quiet = "true"), t;
};
(function() {
  kf.config(
    Object.assign(
      {},
      Qf,
      jf(process.argv)
    )
  );
})();
function Uf(s) {
  return (s == null ? void 0 : s.toLowerCase()) === "embedded" ? "embedded" : "neon";
}
function Vf(s) {
  var n;
  const e = (n = process.env.BROWSER_BINARIES_PATH) == null ? void 0 : n.trim();
  if (e)
    return Be.resolve(e);
  const t = process.resourcesPath ? Be.join(process.resourcesPath, "browsers") : "", r = Be.join(s, "resources", "browsers");
  return Ef.existsSync(t) ? t : r;
}
function zf(s) {
  return {
    appMode: "desktop",
    databaseMode: Uf(process.env.DATABASE_MODE),
    browserBinariesPath: Vf(s),
    hasNeonDatabase: !!process.env.DATABASE_URL,
    hasCloudAmqp: !!process.env.CLOUDAMQP_URL,
    hasUpstashRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  };
}
var Wf = Object.create, pt = Object.defineProperty, Kf = Object.getOwnPropertyDescriptor, Gf = Object.getOwnPropertyNames, Hf = Object.getPrototypeOf, Jf = Object.prototype.hasOwnProperty, Yf = (s, e, t) => e in s ? pt(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t, m = (s, e) => pt(s, "name", { value: e, configurable: !0 }), Ce = (s, e) => () => (s && (e = s(s = 0)), e), te = (s, e) => () => (e || s((e = { exports: {} }).exports, e), e.exports), De = (s, e) => {
  for (var t in e) pt(s, t, {
    get: e[t],
    enumerable: !0
  });
}, Xu = (s, e, t, r) => {
  if (e && typeof e == "object" || typeof e == "function") for (let n of Gf(e)) !Jf.call(s, n) && n !== t && pt(s, n, { get: () => e[n], enumerable: !(r = Kf(e, n)) || r.enumerable });
  return s;
}, it = (s, e, t) => (t = s != null ? Wf(Hf(s)) : {}, Xu(e || !s || !s.__esModule ? pt(t, "default", { value: s, enumerable: !0 }) : t, s)), ye = (s) => Xu(pt({}, "__esModule", { value: !0 }), s), Y = (s, e, t) => Yf(s, typeof e != "symbol" ? e + "" : e, t), Zf = te((s) => {
  W(), s.byteLength = f, s.toByteArray = d, s.fromByteArray = S;
  var e = [], t = [], r = typeof Uint8Array < "u" ? Uint8Array : Array, n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (i = 0, u = n.length; i < u; ++i) e[i] = n[i], t[n.charCodeAt(i)] = i;
  var i, u;
  t[45] = 62, t[95] = 63;
  function a(c) {
    var h = c.length;
    if (h % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
    var b = c.indexOf("=");
    b === -1 && (b = h);
    var _ = b === h ? 0 : 4 - b % 4;
    return [b, _];
  }
  m(a, "getLens");
  function f(c) {
    var h = a(c), b = h[0], _ = h[1];
    return (b + _) * 3 / 4 - _;
  }
  m(f, "byteLength");
  function y(c, h, b) {
    return (h + b) * 3 / 4 - b;
  }
  m(y, "_byteLength");
  function d(c) {
    var h, b = a(c), _ = b[0], C = b[1], A = new r(y(c, _, C)), B = 0, R = C > 0 ? _ - 4 : _, E;
    for (E = 0; E < R; E += 4) h = t[c.charCodeAt(E)] << 18 | t[c.charCodeAt(E + 1)] << 12 | t[c.charCodeAt(E + 2)] << 6 | t[c.charCodeAt(E + 3)], A[B++] = h >> 16 & 255, A[B++] = h >> 8 & 255, A[B++] = h & 255;
    return C === 2 && (h = t[c.charCodeAt(
      E
    )] << 2 | t[c.charCodeAt(E + 1)] >> 4, A[B++] = h & 255), C === 1 && (h = t[c.charCodeAt(E)] << 10 | t[c.charCodeAt(E + 1)] << 4 | t[c.charCodeAt(E + 2)] >> 2, A[B++] = h >> 8 & 255, A[B++] = h & 255), A;
  }
  m(d, "toByteArray");
  function v(c) {
    return e[c >> 18 & 63] + e[c >> 12 & 63] + e[c >> 6 & 63] + e[c & 63];
  }
  m(v, "tripletToBase64");
  function g(c, h, b) {
    for (var _, C = [], A = h; A < b; A += 3) _ = (c[A] << 16 & 16711680) + (c[A + 1] << 8 & 65280) + (c[A + 2] & 255), C.push(v(_));
    return C.join("");
  }
  m(g, "encodeChunk");
  function S(c) {
    for (var h, b = c.length, _ = b % 3, C = [], A = 16383, B = 0, R = b - _; B < R; B += A) C.push(g(
      c,
      B,
      B + A > R ? R : B + A
    ));
    return _ === 1 ? (h = c[b - 1], C.push(e[h >> 2] + e[h << 4 & 63] + "==")) : _ === 2 && (h = (c[b - 2] << 8) + c[b - 1], C.push(e[h >> 10] + e[h >> 4 & 63] + e[h << 2 & 63] + "=")), C.join("");
  }
  m(S, "fromByteArray");
}), Xf = te((s) => {
  W(), s.read = function(e, t, r, n, i) {
    var u, a, f = i * 8 - n - 1, y = (1 << f) - 1, d = y >> 1, v = -7, g = r ? i - 1 : 0, S = r ? -1 : 1, c = e[t + g];
    for (g += S, u = c & (1 << -v) - 1, c >>= -v, v += f; v > 0; u = u * 256 + e[t + g], g += S, v -= 8) ;
    for (a = u & (1 << -v) - 1, u >>= -v, v += n; v > 0; a = a * 256 + e[t + g], g += S, v -= 8) ;
    if (u === 0) u = 1 - d;
    else {
      if (u === y) return a ? NaN : (c ? -1 : 1) * (1 / 0);
      a = a + Math.pow(2, n), u = u - d;
    }
    return (c ? -1 : 1) * a * Math.pow(2, u - n);
  }, s.write = function(e, t, r, n, i, u) {
    var a, f, y, d = u * 8 - i - 1, v = (1 << d) - 1, g = v >> 1, S = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, c = n ? 0 : u - 1, h = n ? 1 : -1, b = t < 0 || t === 0 && 1 / t < 0 ? 1 : 0;
    for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (f = isNaN(t) ? 1 : 0, a = v) : (a = Math.floor(Math.log(t) / Math.LN2), t * (y = Math.pow(2, -a)) < 1 && (a--, y *= 2), a + g >= 1 ? t += S / y : t += S * Math.pow(2, 1 - g), t * y >= 2 && (a++, y /= 2), a + g >= v ? (f = 0, a = v) : a + g >= 1 ? (f = (t * y - 1) * Math.pow(2, i), a = a + g) : (f = t * Math.pow(2, g - 1) * Math.pow(2, i), a = 0)); i >= 8; e[r + c] = f & 255, c += h, f /= 256, i -= 8) ;
    for (a = a << i | f, d += i; d > 0; e[r + c] = a & 255, c += h, a /= 256, d -= 8) ;
    e[r + c - h] |= b * 128;
  };
}), ed = te((s) => {
  W();
  var e = Zf(), t = Xf(), r = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
  s.Buffer = a, s.SlowBuffer = C, s.INSPECT_MAX_BYTES = 50;
  var n = 2147483647;
  s.kMaxLength = n, a.TYPED_ARRAY_SUPPORT = i(), !a.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  function i() {
    try {
      let o = new Uint8Array(1), l = { foo: m(function() {
        return 42;
      }, "foo") };
      return Object.setPrototypeOf(l, Uint8Array.prototype), Object.setPrototypeOf(o, l), o.foo() === 42;
    } catch {
      return !1;
    }
  }
  m(i, "typedArraySupport"), Object.defineProperty(a.prototype, "parent", { enumerable: !0, get: m(function() {
    if (a.isBuffer(this)) return this.buffer;
  }, "get") }), Object.defineProperty(a.prototype, "offset", { enumerable: !0, get: m(function() {
    if (a.isBuffer(
      this
    )) return this.byteOffset;
  }, "get") });
  function u(o) {
    if (o > n) throw new RangeError('The value "' + o + '" is invalid for option "size"');
    let l = new Uint8Array(o);
    return Object.setPrototypeOf(l, a.prototype), l;
  }
  m(u, "createBuffer");
  function a(o, l, p) {
    if (typeof o == "number") {
      if (typeof l == "string") throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      );
      return v(o);
    }
    return f(o, l, p);
  }
  m(a, "Buffer"), a.poolSize = 8192;
  function f(o, l, p) {
    if (typeof o == "string") return g(o, l);
    if (ArrayBuffer.isView(o)) return c(o);
    if (o == null) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof o);
    if (Oe(o, ArrayBuffer) || o && Oe(o.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (Oe(o, SharedArrayBuffer) || o && Oe(
      o.buffer,
      SharedArrayBuffer
    ))) return h(o, l, p);
    if (typeof o == "number") throw new TypeError('The "value" argument must not be of type number. Received type number');
    let P = o.valueOf && o.valueOf();
    if (P != null && P !== o) return a.from(P, l, p);
    let L = b(o);
    if (L) return L;
    if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof o[Symbol.toPrimitive] == "function") return a.from(o[Symbol.toPrimitive]("string"), l, p);
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof o);
  }
  m(f, "from"), a.from = function(o, l, p) {
    return f(o, l, p);
  }, Object.setPrototypeOf(
    a.prototype,
    Uint8Array.prototype
  ), Object.setPrototypeOf(a, Uint8Array);
  function y(o) {
    if (typeof o != "number") throw new TypeError(
      '"size" argument must be of type number'
    );
    if (o < 0) throw new RangeError('The value "' + o + '" is invalid for option "size"');
  }
  m(y, "assertSize");
  function d(o, l, p) {
    return y(o), o <= 0 ? u(o) : l !== void 0 ? typeof p == "string" ? u(o).fill(l, p) : u(o).fill(l) : u(o);
  }
  m(d, "alloc"), a.alloc = function(o, l, p) {
    return d(o, l, p);
  };
  function v(o) {
    return y(o), u(o < 0 ? 0 : _(o) | 0);
  }
  m(v, "allocUnsafe"), a.allocUnsafe = function(o) {
    return v(
      o
    );
  }, a.allocUnsafeSlow = function(o) {
    return v(o);
  };
  function g(o, l) {
    if ((typeof l != "string" || l === "") && (l = "utf8"), !a.isEncoding(l)) throw new TypeError("Unknown encoding: " + l);
    let p = A(o, l) | 0, P = u(p), L = P.write(
      o,
      l
    );
    return L !== p && (P = P.slice(0, L)), P;
  }
  m(g, "fromString");
  function S(o) {
    let l = o.length < 0 ? 0 : _(o.length) | 0, p = u(l);
    for (let P = 0; P < l; P += 1) p[P] = o[P] & 255;
    return p;
  }
  m(S, "fromArrayLike");
  function c(o) {
    if (Oe(o, Uint8Array)) {
      let l = new Uint8Array(o);
      return h(l.buffer, l.byteOffset, l.byteLength);
    }
    return S(o);
  }
  m(c, "fromArrayView");
  function h(o, l, p) {
    if (l < 0 || o.byteLength < l) throw new RangeError('"offset" is outside of buffer bounds');
    if (o.byteLength < l + (p || 0)) throw new RangeError('"length" is outside of buffer bounds');
    let P;
    return l === void 0 && p === void 0 ? P = new Uint8Array(o) : p === void 0 ? P = new Uint8Array(o, l) : P = new Uint8Array(
      o,
      l,
      p
    ), Object.setPrototypeOf(P, a.prototype), P;
  }
  m(h, "fromArrayBuffer");
  function b(o) {
    if (a.isBuffer(o)) {
      let l = _(o.length) | 0, p = u(l);
      return p.length === 0 || o.copy(p, 0, 0, l), p;
    }
    if (o.length !== void 0) return typeof o.length != "number" || Mt(o.length) ? u(0) : S(o);
    if (o.type === "Buffer" && Array.isArray(o.data)) return S(o.data);
  }
  m(b, "fromObject");
  function _(o) {
    if (o >= n) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + n.toString(16) + " bytes");
    return o | 0;
  }
  m(_, "checked");
  function C(o) {
    return +o != o && (o = 0), a.alloc(+o);
  }
  m(C, "SlowBuffer"), a.isBuffer = m(function(o) {
    return o != null && o._isBuffer === !0 && o !== a.prototype;
  }, "isBuffer"), a.compare = m(function(o, l) {
    if (Oe(o, Uint8Array) && (o = a.from(o, o.offset, o.byteLength)), Oe(l, Uint8Array) && (l = a.from(l, l.offset, l.byteLength)), !a.isBuffer(o) || !a.isBuffer(l)) throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    );
    if (o === l) return 0;
    let p = o.length, P = l.length;
    for (let L = 0, q = Math.min(p, P); L < q; ++L) if (o[L] !== l[L]) {
      p = o[L], P = l[L];
      break;
    }
    return p < P ? -1 : P < p ? 1 : 0;
  }, "compare"), a.isEncoding = m(function(o) {
    switch (String(o).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return !0;
      default:
        return !1;
    }
  }, "isEncoding"), a.concat = m(function(o, l) {
    if (!Array.isArray(o)) throw new TypeError(
      '"list" argument must be an Array of Buffers'
    );
    if (o.length === 0) return a.alloc(0);
    let p;
    if (l === void 0)
      for (l = 0, p = 0; p < o.length; ++p) l += o[p].length;
    let P = a.allocUnsafe(l), L = 0;
    for (p = 0; p < o.length; ++p) {
      let q = o[p];
      if (Oe(q, Uint8Array)) L + q.length > P.length ? (a.isBuffer(q) || (q = a.from(q)), q.copy(P, L)) : Uint8Array.prototype.set.call(P, q, L);
      else if (a.isBuffer(q)) q.copy(P, L);
      else throw new TypeError('"list" argument must be an Array of Buffers');
      L += q.length;
    }
    return P;
  }, "concat");
  function A(o, l) {
    if (a.isBuffer(o)) return o.length;
    if (ArrayBuffer.isView(o) || Oe(o, ArrayBuffer)) return o.byteLength;
    if (typeof o != "string") throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof o
    );
    let p = o.length, P = arguments.length > 2 && arguments[2] === !0;
    if (!P && p === 0) return 0;
    let L = !1;
    for (; ; ) switch (l) {
      case "ascii":
      case "latin1":
      case "binary":
        return p;
      case "utf8":
      case "utf-8":
        return Rt(o).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return p * 2;
      case "hex":
        return p >>> 1;
      case "base64":
        return pr(o).length;
      default:
        if (L) return P ? -1 : Rt(o).length;
        l = ("" + l).toLowerCase(), L = !0;
    }
  }
  m(A, "byteLength"), a.byteLength = A;
  function B(o, l, p) {
    let P = !1;
    if ((l === void 0 || l < 0) && (l = 0), l > this.length || ((p === void 0 || p > this.length) && (p = this.length), p <= 0) || (p >>>= 0, l >>>= 0, p <= l)) return "";
    for (o || (o = "utf8"); ; ) switch (o) {
      case "hex":
        return X(this, l, p);
      case "utf8":
      case "utf-8":
        return M(this, l, p);
      case "ascii":
        return Z(this, l, p);
      case "latin1":
      case "binary":
        return ne(
          this,
          l,
          p
        );
      case "base64":
        return V(this, l, p);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return Ae(
          this,
          l,
          p
        );
      default:
        if (P) throw new TypeError("Unknown encoding: " + o);
        o = (o + "").toLowerCase(), P = !0;
    }
  }
  m(
    B,
    "slowToString"
  ), a.prototype._isBuffer = !0;
  function R(o, l, p) {
    let P = o[l];
    o[l] = o[p], o[p] = P;
  }
  m(R, "swap"), a.prototype.swap16 = m(function() {
    let o = this.length;
    if (o % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let l = 0; l < o; l += 2) R(this, l, l + 1);
    return this;
  }, "swap16"), a.prototype.swap32 = m(function() {
    let o = this.length;
    if (o % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let l = 0; l < o; l += 4) R(this, l, l + 3), R(this, l + 1, l + 2);
    return this;
  }, "swap32"), a.prototype.swap64 = m(
    function() {
      let o = this.length;
      if (o % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
      for (let l = 0; l < o; l += 8) R(this, l, l + 7), R(this, l + 1, l + 6), R(this, l + 2, l + 5), R(this, l + 3, l + 4);
      return this;
    },
    "swap64"
  ), a.prototype.toString = m(function() {
    let o = this.length;
    return o === 0 ? "" : arguments.length === 0 ? M(
      this,
      0,
      o
    ) : B.apply(this, arguments);
  }, "toString"), a.prototype.toLocaleString = a.prototype.toString, a.prototype.equals = m(function(o) {
    if (!a.isBuffer(o)) throw new TypeError("Argument must be a Buffer");
    return this === o ? !0 : a.compare(this, o) === 0;
  }, "equals"), a.prototype.inspect = m(function() {
    let o = "", l = s.INSPECT_MAX_BYTES;
    return o = this.toString("hex", 0, l).replace(/(.{2})/g, "$1 ").trim(), this.length > l && (o += " ... "), "<Buffer " + o + ">";
  }, "inspect"), r && (a.prototype[r] = a.prototype.inspect), a.prototype.compare = m(function(o, l, p, P, L) {
    if (Oe(o, Uint8Array) && (o = a.from(o, o.offset, o.byteLength)), !a.isBuffer(o)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof o);
    if (l === void 0 && (l = 0), p === void 0 && (p = o ? o.length : 0), P === void 0 && (P = 0), L === void 0 && (L = this.length), l < 0 || p > o.length || P < 0 || L > this.length) throw new RangeError("out of range index");
    if (P >= L && l >= p) return 0;
    if (P >= L) return -1;
    if (l >= p) return 1;
    if (l >>>= 0, p >>>= 0, P >>>= 0, L >>>= 0, this === o) return 0;
    let q = L - P, Q = p - l, oe = Math.min(q, Q), me = this.slice(
      P,
      L
    ), le = o.slice(l, p);
    for (let ae = 0; ae < oe; ++ae) if (me[ae] !== le[ae]) {
      q = me[ae], Q = le[ae];
      break;
    }
    return q < Q ? -1 : Q < q ? 1 : 0;
  }, "compare");
  function E(o, l, p, P, L) {
    if (o.length === 0) return -1;
    if (typeof p == "string" ? (P = p, p = 0) : p > 2147483647 ? p = 2147483647 : p < -2147483648 && (p = -2147483648), p = +p, Mt(p) && (p = L ? 0 : o.length - 1), p < 0 && (p = o.length + p), p >= o.length) {
      if (L) return -1;
      p = o.length - 1;
    } else if (p < 0) if (L) p = 0;
    else return -1;
    if (typeof l == "string" && (l = a.from(
      l,
      P
    )), a.isBuffer(l)) return l.length === 0 ? -1 : I(o, l, p, P, L);
    if (typeof l == "number") return l = l & 255, typeof Uint8Array.prototype.indexOf == "function" ? L ? Uint8Array.prototype.indexOf.call(o, l, p) : Uint8Array.prototype.lastIndexOf.call(o, l, p) : I(o, [l], p, P, L);
    throw new TypeError("val must be string, number or Buffer");
  }
  m(E, "bidirectionalIndexOf");
  function I(o, l, p, P, L) {
    let q = 1, Q = o.length, oe = l.length;
    if (P !== void 0 && (P = String(P).toLowerCase(), P === "ucs2" || P === "ucs-2" || P === "utf16le" || P === "utf-16le")) {
      if (o.length < 2 || l.length < 2) return -1;
      q = 2, Q /= 2, oe /= 2, p /= 2;
    }
    function me(ae, ce) {
      return q === 1 ? ae[ce] : ae.readUInt16BE(ce * q);
    }
    m(me, "read");
    let le;
    if (L) {
      let ae = -1;
      for (le = p; le < Q; le++) if (me(o, le) === me(l, ae === -1 ? 0 : le - ae)) {
        if (ae === -1 && (ae = le), le - ae + 1 === oe) return ae * q;
      } else ae !== -1 && (le -= le - ae), ae = -1;
    } else for (p + oe > Q && (p = Q - oe), le = p; le >= 0; le--) {
      let ae = !0;
      for (let ce = 0; ce < oe; ce++) if (me(o, le + ce) !== me(l, ce)) {
        ae = !1;
        break;
      }
      if (ae) return le;
    }
    return -1;
  }
  m(I, "arrayIndexOf"), a.prototype.includes = m(function(o, l, p) {
    return this.indexOf(
      o,
      l,
      p
    ) !== -1;
  }, "includes"), a.prototype.indexOf = m(function(o, l, p) {
    return E(this, o, l, p, !0);
  }, "indexOf"), a.prototype.lastIndexOf = m(function(o, l, p) {
    return E(this, o, l, p, !1);
  }, "lastIndexOf");
  function N(o, l, p, P) {
    p = Number(p) || 0;
    let L = o.length - p;
    P ? (P = Number(P), P > L && (P = L)) : P = L;
    let q = l.length;
    P > q / 2 && (P = q / 2);
    let Q;
    for (Q = 0; Q < P; ++Q) {
      let oe = parseInt(l.substr(Q * 2, 2), 16);
      if (Mt(oe)) return Q;
      o[p + Q] = oe;
    }
    return Q;
  }
  m(N, "hexWrite");
  function T(o, l, p, P) {
    return bt(Rt(l, o.length - p), o, p, P);
  }
  m(T, "utf8Write");
  function $(o, l, p, P) {
    return bt(ys(l), o, p, P);
  }
  m(
    $,
    "asciiWrite"
  );
  function D(o, l, p, P) {
    return bt(pr(l), o, p, P);
  }
  m(D, "base64Write");
  function U(o, l, p, P) {
    return bt(
      ws(l, o.length - p),
      o,
      p,
      P
    );
  }
  m(U, "ucs2Write"), a.prototype.write = m(function(o, l, p, P) {
    if (l === void 0) P = "utf8", p = this.length, l = 0;
    else if (p === void 0 && typeof l == "string") P = l, p = this.length, l = 0;
    else if (isFinite(l))
      l = l >>> 0, isFinite(p) ? (p = p >>> 0, P === void 0 && (P = "utf8")) : (P = p, p = void 0);
    else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    let L = this.length - l;
    if ((p === void 0 || p > L) && (p = L), o.length > 0 && (p < 0 || l < 0) || l > this.length) throw new RangeError("Attempt to write outside buffer bounds");
    P || (P = "utf8");
    let q = !1;
    for (; ; ) switch (P) {
      case "hex":
        return N(this, o, l, p);
      case "utf8":
      case "utf-8":
        return T(this, o, l, p);
      case "ascii":
      case "latin1":
      case "binary":
        return $(this, o, l, p);
      case "base64":
        return D(this, o, l, p);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return U(this, o, l, p);
      default:
        if (q) throw new TypeError("Unknown encoding: " + P);
        P = ("" + P).toLowerCase(), q = !0;
    }
  }, "write"), a.prototype.toJSON = m(function() {
    return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
  }, "toJSON");
  function V(o, l, p) {
    return l === 0 && p === o.length ? e.fromByteArray(o) : e.fromByteArray(o.slice(l, p));
  }
  m(V, "base64Slice");
  function M(o, l, p) {
    p = Math.min(o.length, p);
    let P = [], L = l;
    for (; L < p; ) {
      let q = o[L], Q = null, oe = q > 239 ? 4 : q > 223 ? 3 : q > 191 ? 2 : 1;
      if (L + oe <= p) {
        let me, le, ae, ce;
        switch (oe) {
          case 1:
            q < 128 && (Q = q);
            break;
          case 2:
            me = o[L + 1], (me & 192) === 128 && (ce = (q & 31) << 6 | me & 63, ce > 127 && (Q = ce));
            break;
          case 3:
            me = o[L + 1], le = o[L + 2], (me & 192) === 128 && (le & 192) === 128 && (ce = (q & 15) << 12 | (me & 63) << 6 | le & 63, ce > 2047 && (ce < 55296 || ce > 57343) && (Q = ce));
            break;
          case 4:
            me = o[L + 1], le = o[L + 2], ae = o[L + 3], (me & 192) === 128 && (le & 192) === 128 && (ae & 192) === 128 && (ce = (q & 15) << 18 | (me & 63) << 12 | (le & 63) << 6 | ae & 63, ce > 65535 && ce < 1114112 && (Q = ce));
        }
      }
      Q === null ? (Q = 65533, oe = 1) : Q > 65535 && (Q -= 65536, P.push(Q >>> 10 & 1023 | 55296), Q = 56320 | Q & 1023), P.push(Q), L += oe;
    }
    return G(P);
  }
  m(M, "utf8Slice");
  var F = 4096;
  function G(o) {
    let l = o.length;
    if (l <= F) return String.fromCharCode.apply(String, o);
    let p = "", P = 0;
    for (; P < l; ) p += String.fromCharCode.apply(String, o.slice(P, P += F));
    return p;
  }
  m(G, "decodeCodePointsArray");
  function Z(o, l, p) {
    let P = "";
    p = Math.min(o.length, p);
    for (let L = l; L < p; ++L) P += String.fromCharCode(o[L] & 127);
    return P;
  }
  m(Z, "asciiSlice");
  function ne(o, l, p) {
    let P = "";
    p = Math.min(o.length, p);
    for (let L = l; L < p; ++L) P += String.fromCharCode(o[L]);
    return P;
  }
  m(ne, "latin1Slice");
  function X(o, l, p) {
    let P = o.length;
    (!l || l < 0) && (l = 0), (!p || p < 0 || p > P) && (p = P);
    let L = "";
    for (let q = l; q < p; ++q) L += pf[o[q]];
    return L;
  }
  m(X, "hexSlice");
  function Ae(o, l, p) {
    let P = o.slice(l, p), L = "";
    for (let q = 0; q < P.length - 1; q += 2) L += String.fromCharCode(P[q] + P[q + 1] * 256);
    return L;
  }
  m(Ae, "utf16leSlice"), a.prototype.slice = m(function(o, l) {
    let p = this.length;
    o = ~~o, l = l === void 0 ? p : ~~l, o < 0 ? (o += p, o < 0 && (o = 0)) : o > p && (o = p), l < 0 ? (l += p, l < 0 && (l = 0)) : l > p && (l = p), l < o && (l = o);
    let P = this.subarray(o, l);
    return Object.setPrototypeOf(P, a.prototype), P;
  }, "slice");
  function ie(o, l, p) {
    if (o % 1 !== 0 || o < 0) throw new RangeError("offset is not uint");
    if (o + l > p) throw new RangeError("Trying to access beyond buffer length");
  }
  m(ie, "checkOffset"), a.prototype.readUintLE = a.prototype.readUIntLE = m(
    function(o, l, p) {
      o = o >>> 0, l = l >>> 0, p || ie(o, l, this.length);
      let P = this[o], L = 1, q = 0;
      for (; ++q < l && (L *= 256); ) P += this[o + q] * L;
      return P;
    },
    "readUIntLE"
  ), a.prototype.readUintBE = a.prototype.readUIntBE = m(function(o, l, p) {
    o = o >>> 0, l = l >>> 0, p || ie(
      o,
      l,
      this.length
    );
    let P = this[o + --l], L = 1;
    for (; l > 0 && (L *= 256); ) P += this[o + --l] * L;
    return P;
  }, "readUIntBE"), a.prototype.readUint8 = a.prototype.readUInt8 = m(
    function(o, l) {
      return o = o >>> 0, l || ie(o, 1, this.length), this[o];
    },
    "readUInt8"
  ), a.prototype.readUint16LE = a.prototype.readUInt16LE = m(function(o, l) {
    return o = o >>> 0, l || ie(
      o,
      2,
      this.length
    ), this[o] | this[o + 1] << 8;
  }, "readUInt16LE"), a.prototype.readUint16BE = a.prototype.readUInt16BE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 2, this.length), this[o] << 8 | this[o + 1];
  }, "readUInt16BE"), a.prototype.readUint32LE = a.prototype.readUInt32LE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 4, this.length), (this[o] | this[o + 1] << 8 | this[o + 2] << 16) + this[o + 3] * 16777216;
  }, "readUInt32LE"), a.prototype.readUint32BE = a.prototype.readUInt32BE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 4, this.length), this[o] * 16777216 + (this[o + 1] << 16 | this[o + 2] << 8 | this[o + 3]);
  }, "readUInt32BE"), a.prototype.readBigUInt64LE = ke(m(function(o) {
    o = o >>> 0, Ye(o, "offset");
    let l = this[o], p = this[o + 7];
    (l === void 0 || p === void 0) && ut(o, this.length - 8);
    let P = l + this[++o] * 2 ** 8 + this[++o] * 2 ** 16 + this[++o] * 2 ** 24, L = this[++o] + this[++o] * 2 ** 8 + this[++o] * 2 ** 16 + p * 2 ** 24;
    return BigInt(P) + (BigInt(L) << BigInt(32));
  }, "readBigUInt64LE")), a.prototype.readBigUInt64BE = ke(m(function(o) {
    o = o >>> 0, Ye(o, "offset");
    let l = this[o], p = this[o + 7];
    (l === void 0 || p === void 0) && ut(o, this.length - 8);
    let P = l * 2 ** 24 + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + this[++o], L = this[++o] * 2 ** 24 + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + p;
    return (BigInt(P) << BigInt(
      32
    )) + BigInt(L);
  }, "readBigUInt64BE")), a.prototype.readIntLE = m(function(o, l, p) {
    o = o >>> 0, l = l >>> 0, p || ie(
      o,
      l,
      this.length
    );
    let P = this[o], L = 1, q = 0;
    for (; ++q < l && (L *= 256); ) P += this[o + q] * L;
    return L *= 128, P >= L && (P -= Math.pow(2, 8 * l)), P;
  }, "readIntLE"), a.prototype.readIntBE = m(function(o, l, p) {
    o = o >>> 0, l = l >>> 0, p || ie(o, l, this.length);
    let P = l, L = 1, q = this[o + --P];
    for (; P > 0 && (L *= 256); ) q += this[o + --P] * L;
    return L *= 128, q >= L && (q -= Math.pow(2, 8 * l)), q;
  }, "readIntBE"), a.prototype.readInt8 = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 1, this.length), this[o] & 128 ? (255 - this[o] + 1) * -1 : this[o];
  }, "readInt8"), a.prototype.readInt16LE = m(function(o, l) {
    o = o >>> 0, l || ie(
      o,
      2,
      this.length
    );
    let p = this[o] | this[o + 1] << 8;
    return p & 32768 ? p | 4294901760 : p;
  }, "readInt16LE"), a.prototype.readInt16BE = m(function(o, l) {
    o = o >>> 0, l || ie(o, 2, this.length);
    let p = this[o + 1] | this[o] << 8;
    return p & 32768 ? p | 4294901760 : p;
  }, "readInt16BE"), a.prototype.readInt32LE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 4, this.length), this[o] | this[o + 1] << 8 | this[o + 2] << 16 | this[o + 3] << 24;
  }, "readInt32LE"), a.prototype.readInt32BE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 4, this.length), this[o] << 24 | this[o + 1] << 16 | this[o + 2] << 8 | this[o + 3];
  }, "readInt32BE"), a.prototype.readBigInt64LE = ke(m(function(o) {
    o = o >>> 0, Ye(o, "offset");
    let l = this[o], p = this[o + 7];
    (l === void 0 || p === void 0) && ut(o, this.length - 8);
    let P = this[o + 4] + this[o + 5] * 2 ** 8 + this[o + 6] * 2 ** 16 + (p << 24);
    return (BigInt(P) << BigInt(
      32
    )) + BigInt(l + this[++o] * 2 ** 8 + this[++o] * 2 ** 16 + this[++o] * 2 ** 24);
  }, "readBigInt64LE")), a.prototype.readBigInt64BE = ke(m(function(o) {
    o = o >>> 0, Ye(o, "offset");
    let l = this[o], p = this[o + 7];
    (l === void 0 || p === void 0) && ut(o, this.length - 8);
    let P = (l << 24) + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + this[++o];
    return (BigInt(P) << BigInt(32)) + BigInt(
      this[++o] * 2 ** 24 + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + p
    );
  }, "readBigInt64BE")), a.prototype.readFloatLE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 4, this.length), t.read(this, o, !0, 23, 4);
  }, "readFloatLE"), a.prototype.readFloatBE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 4, this.length), t.read(this, o, !1, 23, 4);
  }, "readFloatBE"), a.prototype.readDoubleLE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 8, this.length), t.read(this, o, !0, 52, 8);
  }, "readDoubleLE"), a.prototype.readDoubleBE = m(function(o, l) {
    return o = o >>> 0, l || ie(o, 8, this.length), t.read(
      this,
      o,
      !1,
      52,
      8
    );
  }, "readDoubleBE");
  function fe(o, l, p, P, L, q) {
    if (!a.isBuffer(o)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (l > L || l < q) throw new RangeError('"value" argument is out of bounds');
    if (p + P > o.length) throw new RangeError("Index out of range");
  }
  m(fe, "checkInt"), a.prototype.writeUintLE = a.prototype.writeUIntLE = m(function(o, l, p, P) {
    if (o = +o, l = l >>> 0, p = p >>> 0, !P) {
      let Q = Math.pow(2, 8 * p) - 1;
      fe(
        this,
        o,
        l,
        p,
        Q,
        0
      );
    }
    let L = 1, q = 0;
    for (this[l] = o & 255; ++q < p && (L *= 256); ) this[l + q] = o / L & 255;
    return l + p;
  }, "writeUIntLE"), a.prototype.writeUintBE = a.prototype.writeUIntBE = m(function(o, l, p, P) {
    if (o = +o, l = l >>> 0, p = p >>> 0, !P) {
      let Q = Math.pow(2, 8 * p) - 1;
      fe(this, o, l, p, Q, 0);
    }
    let L = p - 1, q = 1;
    for (this[l + L] = o & 255; --L >= 0 && (q *= 256); ) this[l + L] = o / q & 255;
    return l + p;
  }, "writeUIntBE"), a.prototype.writeUint8 = a.prototype.writeUInt8 = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(this, o, l, 1, 255, 0), this[l] = o & 255, l + 1;
  }, "writeUInt8"), a.prototype.writeUint16LE = a.prototype.writeUInt16LE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(this, o, l, 2, 65535, 0), this[l] = o & 255, this[l + 1] = o >>> 8, l + 2;
  }, "writeUInt16LE"), a.prototype.writeUint16BE = a.prototype.writeUInt16BE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(this, o, l, 2, 65535, 0), this[l] = o >>> 8, this[l + 1] = o & 255, l + 2;
  }, "writeUInt16BE"), a.prototype.writeUint32LE = a.prototype.writeUInt32LE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(
      this,
      o,
      l,
      4,
      4294967295,
      0
    ), this[l + 3] = o >>> 24, this[l + 2] = o >>> 16, this[l + 1] = o >>> 8, this[l] = o & 255, l + 4;
  }, "writeUInt32LE"), a.prototype.writeUint32BE = a.prototype.writeUInt32BE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(
      this,
      o,
      l,
      4,
      4294967295,
      0
    ), this[l] = o >>> 24, this[l + 1] = o >>> 16, this[l + 2] = o >>> 8, this[l + 3] = o & 255, l + 4;
  }, "writeUInt32BE");
  function yt(o, l, p, P, L) {
    dr(l, P, L, o, p, 7);
    let q = Number(l & BigInt(4294967295));
    o[p++] = q, q = q >> 8, o[p++] = q, q = q >> 8, o[p++] = q, q = q >> 8, o[p++] = q;
    let Q = Number(l >> BigInt(32) & BigInt(4294967295));
    return o[p++] = Q, Q = Q >> 8, o[p++] = Q, Q = Q >> 8, o[p++] = Q, Q = Q >> 8, o[p++] = Q, p;
  }
  m(yt, "wrtBigUInt64LE");
  function wt(o, l, p, P, L) {
    dr(l, P, L, o, p, 7);
    let q = Number(l & BigInt(4294967295));
    o[p + 7] = q, q = q >> 8, o[p + 6] = q, q = q >> 8, o[p + 5] = q, q = q >> 8, o[p + 4] = q;
    let Q = Number(l >> BigInt(32) & BigInt(4294967295));
    return o[p + 3] = Q, Q = Q >> 8, o[p + 2] = Q, Q = Q >> 8, o[p + 1] = Q, Q = Q >> 8, o[p] = Q, p + 8;
  }
  m(wt, "wrtBigUInt64BE"), a.prototype.writeBigUInt64LE = ke(m(function(o, l = 0) {
    return yt(this, o, l, BigInt(0), BigInt("0xffffffffffffffff"));
  }, "writeBigUInt64LE")), a.prototype.writeBigUInt64BE = ke(m(function(o, l = 0) {
    return wt(this, o, l, BigInt(0), BigInt(
      "0xffffffffffffffff"
    ));
  }, "writeBigUInt64BE")), a.prototype.writeIntLE = m(function(o, l, p, P) {
    if (o = +o, l = l >>> 0, !P) {
      let oe = Math.pow(2, 8 * p - 1);
      fe(this, o, l, p, oe - 1, -oe);
    }
    let L = 0, q = 1, Q = 0;
    for (this[l] = o & 255; ++L < p && (q *= 256); )
      o < 0 && Q === 0 && this[l + L - 1] !== 0 && (Q = 1), this[l + L] = (o / q >> 0) - Q & 255;
    return l + p;
  }, "writeIntLE"), a.prototype.writeIntBE = m(function(o, l, p, P) {
    if (o = +o, l = l >>> 0, !P) {
      let oe = Math.pow(2, 8 * p - 1);
      fe(this, o, l, p, oe - 1, -oe);
    }
    let L = p - 1, q = 1, Q = 0;
    for (this[l + L] = o & 255; --L >= 0 && (q *= 256); ) o < 0 && Q === 0 && this[l + L + 1] !== 0 && (Q = 1), this[l + L] = (o / q >> 0) - Q & 255;
    return l + p;
  }, "writeIntBE"), a.prototype.writeInt8 = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(this, o, l, 1, 127, -128), o < 0 && (o = 255 + o + 1), this[l] = o & 255, l + 1;
  }, "writeInt8"), a.prototype.writeInt16LE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(this, o, l, 2, 32767, -32768), this[l] = o & 255, this[l + 1] = o >>> 8, l + 2;
  }, "writeInt16LE"), a.prototype.writeInt16BE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(this, o, l, 2, 32767, -32768), this[l] = o >>> 8, this[l + 1] = o & 255, l + 2;
  }, "writeInt16BE"), a.prototype.writeInt32LE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(
      this,
      o,
      l,
      4,
      2147483647,
      -2147483648
    ), this[l] = o & 255, this[l + 1] = o >>> 8, this[l + 2] = o >>> 16, this[l + 3] = o >>> 24, l + 4;
  }, "writeInt32LE"), a.prototype.writeInt32BE = m(function(o, l, p) {
    return o = +o, l = l >>> 0, p || fe(
      this,
      o,
      l,
      4,
      2147483647,
      -2147483648
    ), o < 0 && (o = 4294967295 + o + 1), this[l] = o >>> 24, this[l + 1] = o >>> 16, this[l + 2] = o >>> 8, this[l + 3] = o & 255, l + 4;
  }, "writeInt32BE"), a.prototype.writeBigInt64LE = ke(m(function(o, l = 0) {
    return yt(this, o, l, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  }, "writeBigInt64LE")), a.prototype.writeBigInt64BE = ke(
    m(function(o, l = 0) {
      return wt(this, o, l, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    }, "writeBigInt64BE")
  );
  function lr(o, l, p, P, L, q) {
    if (p + P > o.length) throw new RangeError("Index out of range");
    if (p < 0) throw new RangeError("Index out of range");
  }
  m(lr, "checkIEEE754");
  function cr(o, l, p, P, L) {
    return l = +l, p = p >>> 0, L || lr(o, l, p, 4), t.write(o, l, p, P, 23, 4), p + 4;
  }
  m(
    cr,
    "writeFloat"
  ), a.prototype.writeFloatLE = m(function(o, l, p) {
    return cr(this, o, l, !0, p);
  }, "writeFloatLE"), a.prototype.writeFloatBE = m(function(o, l, p) {
    return cr(this, o, l, !1, p);
  }, "writeFloatBE");
  function hr(o, l, p, P, L) {
    return l = +l, p = p >>> 0, L || lr(o, l, p, 8), t.write(
      o,
      l,
      p,
      P,
      52,
      8
    ), p + 8;
  }
  m(hr, "writeDouble"), a.prototype.writeDoubleLE = m(function(o, l, p) {
    return hr(this, o, l, !0, p);
  }, "writeDoubleLE"), a.prototype.writeDoubleBE = m(function(o, l, p) {
    return hr(this, o, l, !1, p);
  }, "writeDoubleBE"), a.prototype.copy = m(function(o, l, p, P) {
    if (!a.isBuffer(o)) throw new TypeError("argument should be a Buffer");
    if (p || (p = 0), !P && P !== 0 && (P = this.length), l >= o.length && (l = o.length), l || (l = 0), P > 0 && P < p && (P = p), P === p || o.length === 0 || this.length === 0) return 0;
    if (l < 0) throw new RangeError("targetStart out of bounds");
    if (p < 0 || p >= this.length) throw new RangeError("Index out of range");
    if (P < 0) throw new RangeError("sourceEnd out of bounds");
    P > this.length && (P = this.length), o.length - l < P - p && (P = o.length - l + p);
    let L = P - p;
    return this === o && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(l, p, P) : Uint8Array.prototype.set.call(o, this.subarray(p, P), l), L;
  }, "copy"), a.prototype.fill = m(function(o, l, p, P) {
    if (typeof o == "string") {
      if (typeof l == "string" ? (P = l, l = 0, p = this.length) : typeof p == "string" && (P = p, p = this.length), P !== void 0 && typeof P != "string") throw new TypeError("encoding must be a string");
      if (typeof P == "string" && !a.isEncoding(P)) throw new TypeError(
        "Unknown encoding: " + P
      );
      if (o.length === 1) {
        let q = o.charCodeAt(0);
        (P === "utf8" && q < 128 || P === "latin1") && (o = q);
      }
    } else typeof o == "number" ? o = o & 255 : typeof o == "boolean" && (o = Number(o));
    if (l < 0 || this.length < l || this.length < p) throw new RangeError("Out of range index");
    if (p <= l) return this;
    l = l >>> 0, p = p === void 0 ? this.length : p >>> 0, o || (o = 0);
    let L;
    if (typeof o == "number") for (L = l; L < p; ++L) this[L] = o;
    else {
      let q = a.isBuffer(o) ? o : a.from(
        o,
        P
      ), Q = q.length;
      if (Q === 0) throw new TypeError('The value "' + o + '" is invalid for argument "value"');
      for (L = 0; L < p - l; ++L) this[L + l] = q[L % Q];
    }
    return this;
  }, "fill");
  var at = {};
  function Dt(o, l, p) {
    var P;
    at[o] = (P = class extends p {
      constructor() {
        super(), Object.defineProperty(this, "message", { value: l.apply(this, arguments), writable: !0, configurable: !0 }), this.name = `${this.name} [${o}]`, this.stack, delete this.name;
      }
      get code() {
        return o;
      }
      set code(L) {
        Object.defineProperty(
          this,
          "code",
          { configurable: !0, enumerable: !0, value: L, writable: !0 }
        );
      }
      toString() {
        return `${this.name} [${o}]: ${this.message}`;
      }
    }, m(P, "NodeError"), P);
  }
  m(Dt, "E"), Dt("ERR_BUFFER_OUT_OF_BOUNDS", function(o) {
    return o ? `${o} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
  }, RangeError), Dt(
    "ERR_INVALID_ARG_TYPE",
    function(o, l) {
      return `The "${o}" argument must be of type number. Received type ${typeof l}`;
    },
    TypeError
  ), Dt("ERR_OUT_OF_RANGE", function(o, l, p) {
    let P = `The value of "${o}" is out of range.`, L = p;
    return Number.isInteger(p) && Math.abs(p) > 2 ** 32 ? L = fr(String(p)) : typeof p == "bigint" && (L = String(
      p
    ), (p > BigInt(2) ** BigInt(32) || p < -(BigInt(2) ** BigInt(32))) && (L = fr(L)), L += "n"), P += ` It must be ${l}. Received ${L}`, P;
  }, RangeError);
  function fr(o) {
    let l = "", p = o.length, P = o[0] === "-" ? 1 : 0;
    for (; p >= P + 4; p -= 3) l = `_${o.slice(p - 3, p)}${l}`;
    return `${o.slice(0, p)}${l}`;
  }
  m(fr, "addNumericalSeparator");
  function ms(o, l, p) {
    Ye(l, "offset"), (o[l] === void 0 || o[l + p] === void 0) && ut(l, o.length - (p + 1));
  }
  m(ms, "checkBounds");
  function dr(o, l, p, P, L, q) {
    if (o > p || o < l) {
      let Q = typeof l == "bigint" ? "n" : "", oe;
      throw q > 3 ? l === 0 || l === BigInt(0) ? oe = `>= 0${Q} and < 2${Q} ** ${(q + 1) * 8}${Q}` : oe = `>= -(2${Q} ** ${(q + 1) * 8 - 1}${Q}) and < 2 ** ${(q + 1) * 8 - 1}${Q}` : oe = `>= ${l}${Q} and <= ${p}${Q}`, new at.ERR_OUT_OF_RANGE("value", oe, o);
    }
    ms(P, L, q);
  }
  m(dr, "checkIntBI");
  function Ye(o, l) {
    if (typeof o != "number") throw new at.ERR_INVALID_ARG_TYPE(l, "number", o);
  }
  m(Ye, "validateNumber");
  function ut(o, l, p) {
    throw Math.floor(o) !== o ? (Ye(o, p), new at.ERR_OUT_OF_RANGE(p || "offset", "an integer", o)) : l < 0 ? new at.ERR_BUFFER_OUT_OF_BOUNDS() : new at.ERR_OUT_OF_RANGE(p || "offset", `>= ${p ? 1 : 0} and <= ${l}`, o);
  }
  m(ut, "boundsError");
  var df = /[^+/0-9A-Za-z-_]/g;
  function gs(o) {
    if (o = o.split("=")[0], o = o.trim().replace(df, ""), o.length < 2) return "";
    for (; o.length % 4 !== 0; ) o = o + "=";
    return o;
  }
  m(gs, "base64clean");
  function Rt(o, l) {
    l = l || 1 / 0;
    let p, P = o.length, L = null, q = [];
    for (let Q = 0; Q < P; ++Q) {
      if (p = o.charCodeAt(Q), p > 55295 && p < 57344) {
        if (!L) {
          if (p > 56319) {
            (l -= 3) > -1 && q.push(239, 191, 189);
            continue;
          } else if (Q + 1 === P) {
            (l -= 3) > -1 && q.push(239, 191, 189);
            continue;
          }
          L = p;
          continue;
        }
        if (p < 56320) {
          (l -= 3) > -1 && q.push(239, 191, 189), L = p;
          continue;
        }
        p = (L - 55296 << 10 | p - 56320) + 65536;
      } else L && (l -= 3) > -1 && q.push(239, 191, 189);
      if (L = null, p < 128) {
        if ((l -= 1) < 0) break;
        q.push(p);
      } else if (p < 2048) {
        if ((l -= 2) < 0) break;
        q.push(p >> 6 | 192, p & 63 | 128);
      } else if (p < 65536) {
        if ((l -= 3) < 0) break;
        q.push(p >> 12 | 224, p >> 6 & 63 | 128, p & 63 | 128);
      } else if (p < 1114112) {
        if ((l -= 4) < 0) break;
        q.push(p >> 18 | 240, p >> 12 & 63 | 128, p >> 6 & 63 | 128, p & 63 | 128);
      } else throw new Error("Invalid code point");
    }
    return q;
  }
  m(Rt, "utf8ToBytes");
  function ys(o) {
    let l = [];
    for (let p = 0; p < o.length; ++p) l.push(o.charCodeAt(p) & 255);
    return l;
  }
  m(
    ys,
    "asciiToBytes"
  );
  function ws(o, l) {
    let p, P, L, q = [];
    for (let Q = 0; Q < o.length && !((l -= 2) < 0); ++Q) p = o.charCodeAt(
      Q
    ), P = p >> 8, L = p % 256, q.push(L), q.push(P);
    return q;
  }
  m(ws, "utf16leToBytes");
  function pr(o) {
    return e.toByteArray(
      gs(o)
    );
  }
  m(pr, "base64ToBytes");
  function bt(o, l, p, P) {
    let L;
    for (L = 0; L < P && !(L + p >= l.length || L >= o.length); ++L)
      l[L + p] = o[L];
    return L;
  }
  m(bt, "blitBuffer");
  function Oe(o, l) {
    return o instanceof l || o != null && o.constructor != null && o.constructor.name != null && o.constructor.name === l.name;
  }
  m(Oe, "isInstance");
  function Mt(o) {
    return o !== o;
  }
  m(Mt, "numberIsNaN");
  var pf = function() {
    let o = "0123456789abcdef", l = new Array(256);
    for (let p = 0; p < 16; ++p) {
      let P = p * 16;
      for (let L = 0; L < 16; ++L) l[P + L] = o[p] + o[L];
    }
    return l;
  }();
  function ke(o) {
    return typeof BigInt > "u" ? bs : o;
  }
  m(ke, "defineBigIntMethod");
  function bs() {
    throw new Error("BigInt not supported");
  }
  m(bs, "BufferBigIntNotDefined");
}), rr, kr, J, ee, W = Ce(() => {
  rr = globalThis, kr = globalThis.setImmediate ?? ((s) => setTimeout(s, 0)), J = typeof globalThis.Buffer == "function" && typeof globalThis.Buffer.allocUnsafe == "function" ? globalThis.Buffer : ed().Buffer, ee = globalThis.process ?? {}, ee.env ?? (ee.env = {});
  try {
    ee.nextTick(() => {
    });
  } catch {
    let s = Promise.resolve();
    ee.nextTick = s.then.bind(s);
  }
}), ot = te((s, e) => {
  W();
  var t = typeof Reflect == "object" ? Reflect : null, r = t && typeof t.apply == "function" ? t.apply : m(function(E, I, N) {
    return Function.prototype.apply.call(E, I, N);
  }, "ReflectApply"), n;
  t && typeof t.ownKeys == "function" ? n = t.ownKeys : Object.getOwnPropertySymbols ? n = m(function(E) {
    return Object.getOwnPropertyNames(E).concat(Object.getOwnPropertySymbols(E));
  }, "ReflectOwnKeys") : n = m(function(E) {
    return Object.getOwnPropertyNames(E);
  }, "ReflectOwnKeys");
  function i(E) {
    console && console.warn && console.warn(E);
  }
  m(
    i,
    "ProcessEmitWarning"
  );
  var u = Number.isNaN || m(function(E) {
    return E !== E;
  }, "NumberIsNaN");
  function a() {
    a.init.call(this);
  }
  m(a, "EventEmitter"), e.exports = a, e.exports.once = A, a.EventEmitter = a, a.prototype._events = void 0, a.prototype._eventsCount = 0, a.prototype._maxListeners = void 0;
  var f = 10;
  function y(E) {
    if (typeof E != "function") throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof E);
  }
  m(y, "checkListener"), Object.defineProperty(a, "defaultMaxListeners", { enumerable: !0, get: m(function() {
    return f;
  }, "get"), set: m(
    function(E) {
      if (typeof E != "number" || E < 0 || u(E)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + E + ".");
      f = E;
    },
    "set"
  ) }), a.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  }, a.prototype.setMaxListeners = m(function(E) {
    if (typeof E != "number" || E < 0 || u(E)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + E + ".");
    return this._maxListeners = E, this;
  }, "setMaxListeners");
  function d(E) {
    return E._maxListeners === void 0 ? a.defaultMaxListeners : E._maxListeners;
  }
  m(d, "_getMaxListeners"), a.prototype.getMaxListeners = m(function() {
    return d(this);
  }, "getMaxListeners"), a.prototype.emit = m(function(E) {
    for (var I = [], N = 1; N < arguments.length; N++) I.push(arguments[N]);
    var T = E === "error", $ = this._events;
    if ($ !== void 0) T = T && $.error === void 0;
    else if (!T) return !1;
    if (T) {
      var D;
      if (I.length > 0 && (D = I[0]), D instanceof Error) throw D;
      var U = new Error("Unhandled error." + (D ? " (" + D.message + ")" : ""));
      throw U.context = D, U;
    }
    var V = $[E];
    if (V === void 0) return !1;
    if (typeof V == "function") r(V, this, I);
    else for (var M = V.length, F = b(V, M), N = 0; N < M; ++N) r(F[N], this, I);
    return !0;
  }, "emit");
  function v(E, I, N, T) {
    var $, D, U;
    if (y(
      N
    ), D = E._events, D === void 0 ? (D = E._events = /* @__PURE__ */ Object.create(null), E._eventsCount = 0) : (D.newListener !== void 0 && (E.emit("newListener", I, N.listener ? N.listener : N), D = E._events), U = D[I]), U === void 0) U = D[I] = N, ++E._eventsCount;
    else if (typeof U == "function" ? U = D[I] = T ? [N, U] : [U, N] : T ? U.unshift(N) : U.push(N), $ = d(E), $ > 0 && U.length > $ && !U.warned) {
      U.warned = !0;
      var V = new Error("Possible EventEmitter memory leak detected. " + U.length + " " + String(I) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      V.name = "MaxListenersExceededWarning", V.emitter = E, V.type = I, V.count = U.length, i(V);
    }
    return E;
  }
  m(v, "_addListener"), a.prototype.addListener = m(function(E, I) {
    return v(this, E, I, !1);
  }, "addListener"), a.prototype.on = a.prototype.addListener, a.prototype.prependListener = m(function(E, I) {
    return v(this, E, I, !0);
  }, "prependListener");
  function g() {
    if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  m(g, "onceWrapper");
  function S(E, I, N) {
    var T = {
      fired: !1,
      wrapFn: void 0,
      target: E,
      type: I,
      listener: N
    }, $ = g.bind(T);
    return $.listener = N, T.wrapFn = $, $;
  }
  m(S, "_onceWrap"), a.prototype.once = m(function(E, I) {
    return y(I), this.on(E, S(this, E, I)), this;
  }, "once"), a.prototype.prependOnceListener = m(function(E, I) {
    return y(I), this.prependListener(E, S(this, E, I)), this;
  }, "prependOnceListener"), a.prototype.removeListener = m(function(E, I) {
    var N, T, $, D, U;
    if (y(I), T = this._events, T === void 0) return this;
    if (N = T[E], N === void 0) return this;
    if (N === I || N.listener === I) --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete T[E], T.removeListener && this.emit("removeListener", E, N.listener || I));
    else if (typeof N != "function") {
      for ($ = -1, D = N.length - 1; D >= 0; D--) if (N[D] === I || N[D].listener === I) {
        U = N[D].listener, $ = D;
        break;
      }
      if ($ < 0) return this;
      $ === 0 ? N.shift() : _(N, $), N.length === 1 && (T[E] = N[0]), T.removeListener !== void 0 && this.emit("removeListener", E, U || I);
    }
    return this;
  }, "removeListener"), a.prototype.off = a.prototype.removeListener, a.prototype.removeAllListeners = m(function(E) {
    var I, N, T;
    if (N = this._events, N === void 0) return this;
    if (N.removeListener === void 0) return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : N[E] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete N[E]), this;
    if (arguments.length === 0) {
      var $ = Object.keys(N), D;
      for (T = 0; T < $.length; ++T) D = $[T], D !== "removeListener" && this.removeAllListeners(
        D
      );
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (I = N[E], typeof I == "function") this.removeListener(E, I);
    else if (I !== void 0) for (T = I.length - 1; T >= 0; T--) this.removeListener(E, I[T]);
    return this;
  }, "removeAllListeners");
  function c(E, I, N) {
    var T = E._events;
    if (T === void 0) return [];
    var $ = T[I];
    return $ === void 0 ? [] : typeof $ == "function" ? N ? [$.listener || $] : [$] : N ? C($) : b($, $.length);
  }
  m(c, "_listeners"), a.prototype.listeners = m(function(E) {
    return c(this, E, !0);
  }, "listeners"), a.prototype.rawListeners = m(function(E) {
    return c(this, E, !1);
  }, "rawListeners"), a.listenerCount = function(E, I) {
    return typeof E.listenerCount == "function" ? E.listenerCount(I) : h.call(E, I);
  }, a.prototype.listenerCount = h;
  function h(E) {
    var I = this._events;
    if (I !== void 0) {
      var N = I[E];
      if (typeof N == "function")
        return 1;
      if (N !== void 0) return N.length;
    }
    return 0;
  }
  m(h, "listenerCount"), a.prototype.eventNames = m(function() {
    return this._eventsCount > 0 ? n(this._events) : [];
  }, "eventNames");
  function b(E, I) {
    for (var N = new Array(I), T = 0; T < I; ++T) N[T] = E[T];
    return N;
  }
  m(b, "arrayClone");
  function _(E, I) {
    for (; I + 1 < E.length; I++) E[I] = E[I + 1];
    E.pop();
  }
  m(_, "spliceOne");
  function C(E) {
    for (var I = new Array(E.length), N = 0; N < I.length; ++N) I[N] = E[N].listener || E[N];
    return I;
  }
  m(C, "unwrapListeners");
  function A(E, I) {
    return new Promise(function(N, T) {
      function $(U) {
        E.removeListener(I, D), T(U);
      }
      m($, "errorListener");
      function D() {
        typeof E.removeListener == "function" && E.removeListener("error", $), N([].slice.call(arguments));
      }
      m(D, "resolver"), R(E, I, D, { once: !0 }), I !== "error" && B(E, $, { once: !0 });
    });
  }
  m(A, "once");
  function B(E, I, N) {
    typeof E.on == "function" && R(E, "error", I, N);
  }
  m(
    B,
    "addErrorHandlerIfEventEmitter"
  );
  function R(E, I, N, T) {
    if (typeof E.on == "function") T.once ? E.once(I, N) : E.on(I, N);
    else if (typeof E.addEventListener == "function") E.addEventListener(I, m(function $(D) {
      T.once && E.removeEventListener(I, $), N(D);
    }, "wrapListener"));
    else throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof E);
  }
  m(R, "eventTargetAgnosticAddListener");
}), el = {};
De(el, { Socket: () => At, isIP: () => tl });
function tl(s) {
  return 0;
}
var _s, mr, vt, At, It = Ce(() => {
  W(), _s = it(ot(), 1), m(tl, "isIP"), mr = /^[^.]+\./, vt = class K extends _s.EventEmitter {
    constructor() {
      super(...arguments), Y(this, "opts", {}), Y(this, "connecting", !1), Y(this, "pending", !0), Y(
        this,
        "writable",
        !0
      ), Y(this, "encrypted", !1), Y(this, "authorized", !1), Y(this, "destroyed", !1), Y(this, "ws", null), Y(this, "writeBuffer"), Y(this, "tlsState", 0), Y(this, "tlsRead"), Y(this, "tlsWrite");
    }
    static get poolQueryViaFetch() {
      return K.opts.poolQueryViaFetch ?? K.defaults.poolQueryViaFetch;
    }
    static set poolQueryViaFetch(e) {
      K.opts.poolQueryViaFetch = e;
    }
    static get fetchEndpoint() {
      return K.opts.fetchEndpoint ?? K.defaults.fetchEndpoint;
    }
    static set fetchEndpoint(e) {
      K.opts.fetchEndpoint = e;
    }
    static get fetchConnectionCache() {
      return !0;
    }
    static set fetchConnectionCache(e) {
      console.warn("The `fetchConnectionCache` option is deprecated (now always `true`)");
    }
    static get fetchFunction() {
      return K.opts.fetchFunction ?? K.defaults.fetchFunction;
    }
    static set fetchFunction(e) {
      K.opts.fetchFunction = e;
    }
    static get webSocketConstructor() {
      return K.opts.webSocketConstructor ?? K.defaults.webSocketConstructor;
    }
    static set webSocketConstructor(e) {
      K.opts.webSocketConstructor = e;
    }
    get webSocketConstructor() {
      return this.opts.webSocketConstructor ?? K.webSocketConstructor;
    }
    set webSocketConstructor(e) {
      this.opts.webSocketConstructor = e;
    }
    static get wsProxy() {
      return K.opts.wsProxy ?? K.defaults.wsProxy;
    }
    static set wsProxy(e) {
      K.opts.wsProxy = e;
    }
    get wsProxy() {
      return this.opts.wsProxy ?? K.wsProxy;
    }
    set wsProxy(e) {
      this.opts.wsProxy = e;
    }
    static get coalesceWrites() {
      return K.opts.coalesceWrites ?? K.defaults.coalesceWrites;
    }
    static set coalesceWrites(e) {
      K.opts.coalesceWrites = e;
    }
    get coalesceWrites() {
      return this.opts.coalesceWrites ?? K.coalesceWrites;
    }
    set coalesceWrites(e) {
      this.opts.coalesceWrites = e;
    }
    static get useSecureWebSocket() {
      return K.opts.useSecureWebSocket ?? K.defaults.useSecureWebSocket;
    }
    static set useSecureWebSocket(e) {
      K.opts.useSecureWebSocket = e;
    }
    get useSecureWebSocket() {
      return this.opts.useSecureWebSocket ?? K.useSecureWebSocket;
    }
    set useSecureWebSocket(e) {
      this.opts.useSecureWebSocket = e;
    }
    static get forceDisablePgSSL() {
      return K.opts.forceDisablePgSSL ?? K.defaults.forceDisablePgSSL;
    }
    static set forceDisablePgSSL(e) {
      K.opts.forceDisablePgSSL = e;
    }
    get forceDisablePgSSL() {
      return this.opts.forceDisablePgSSL ?? K.forceDisablePgSSL;
    }
    set forceDisablePgSSL(e) {
      this.opts.forceDisablePgSSL = e;
    }
    static get disableSNI() {
      return K.opts.disableSNI ?? K.defaults.disableSNI;
    }
    static set disableSNI(e) {
      K.opts.disableSNI = e;
    }
    get disableSNI() {
      return this.opts.disableSNI ?? K.disableSNI;
    }
    set disableSNI(e) {
      this.opts.disableSNI = e;
    }
    static get disableWarningInBrowsers() {
      return K.opts.disableWarningInBrowsers ?? K.defaults.disableWarningInBrowsers;
    }
    static set disableWarningInBrowsers(e) {
      K.opts.disableWarningInBrowsers = e;
    }
    get disableWarningInBrowsers() {
      return this.opts.disableWarningInBrowsers ?? K.disableWarningInBrowsers;
    }
    set disableWarningInBrowsers(e) {
      this.opts.disableWarningInBrowsers = e;
    }
    static get pipelineConnect() {
      return K.opts.pipelineConnect ?? K.defaults.pipelineConnect;
    }
    static set pipelineConnect(e) {
      K.opts.pipelineConnect = e;
    }
    get pipelineConnect() {
      return this.opts.pipelineConnect ?? K.pipelineConnect;
    }
    set pipelineConnect(e) {
      this.opts.pipelineConnect = e;
    }
    static get subtls() {
      return K.opts.subtls ?? K.defaults.subtls;
    }
    static set subtls(e) {
      K.opts.subtls = e;
    }
    get subtls() {
      return this.opts.subtls ?? K.subtls;
    }
    set subtls(e) {
      this.opts.subtls = e;
    }
    static get pipelineTLS() {
      return K.opts.pipelineTLS ?? K.defaults.pipelineTLS;
    }
    static set pipelineTLS(e) {
      K.opts.pipelineTLS = e;
    }
    get pipelineTLS() {
      return this.opts.pipelineTLS ?? K.pipelineTLS;
    }
    set pipelineTLS(e) {
      this.opts.pipelineTLS = e;
    }
    static get rootCerts() {
      return K.opts.rootCerts ?? K.defaults.rootCerts;
    }
    static set rootCerts(e) {
      K.opts.rootCerts = e;
    }
    get rootCerts() {
      return this.opts.rootCerts ?? K.rootCerts;
    }
    set rootCerts(e) {
      this.opts.rootCerts = e;
    }
    wsProxyAddrForHost(e, t) {
      let r = this.wsProxy;
      if (r === void 0) throw new Error("No WebSocket proxy is configured. Please see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#wsproxy-string--host-string-port-number--string--string");
      return typeof r == "function" ? r(e, t) : `${r}?address=${e}:${t}`;
    }
    setNoDelay() {
      return this;
    }
    setKeepAlive() {
      return this;
    }
    ref() {
      return this;
    }
    unref() {
      return this;
    }
    connect(e, t, r) {
      this.connecting = !0, r && this.once("connect", r);
      let n = m(() => {
        this.connecting = !1, this.pending = !1, this.emit("connect"), this.emit("ready");
      }, "handleWebSocketOpen"), i = m((a, f = !1) => {
        a.binaryType = "arraybuffer", a.addEventListener("error", (y) => {
          this.emit("error", y), this.emit("close");
        }), a.addEventListener("message", (y) => {
          if (this.tlsState === 0) {
            let d = J.from(y.data);
            this.emit("data", d);
          }
        }), a.addEventListener("close", () => {
          this.emit("close");
        }), f ? n() : a.addEventListener(
          "open",
          n
        );
      }, "configureWebSocket"), u;
      try {
        u = this.wsProxyAddrForHost(t, typeof e == "string" ? parseInt(e, 10) : e);
      } catch (a) {
        this.emit("error", a), this.emit("close");
        return;
      }
      try {
        let a = (this.useSecureWebSocket ? "wss:" : "ws:") + "//" + u;
        if (this.webSocketConstructor !== void 0) this.ws = new this.webSocketConstructor(a), i(this.ws);
        else try {
          this.ws = new WebSocket(a), i(this.ws);
        } catch {
          this.ws = new __unstable_WebSocket(a), i(this.ws);
        }
      } catch (a) {
        let f = (this.useSecureWebSocket ? "https:" : "http:") + "//" + u;
        fetch(f, { headers: { Upgrade: "websocket" } }).then(
          (y) => {
            if (this.ws = y.webSocket, this.ws == null) throw a;
            this.ws.accept(), i(this.ws, !0);
          }
        ).catch((y) => {
          this.emit(
            "error",
            new Error(`All attempts to open a WebSocket to connect to the database failed. Please refer to https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined. Details: ${y}`)
          ), this.emit("close");
        });
      }
    }
    async startTls(e) {
      if (this.subtls === void 0) throw new Error(
        "For Postgres SSL connections, you must set `neonConfig.subtls` to the subtls library. See https://github.com/neondatabase/serverless/blob/main/CONFIG.md for more information."
      );
      this.tlsState = 1;
      let t = await this.subtls.TrustedCert.databaseFromPEM(this.rootCerts), r = new this.subtls.WebSocketReadQueue(this.ws), n = r.read.bind(r), i = this.rawWrite.bind(this), { read: u, write: a } = await this.subtls.startTls(e, t, n, i, { useSNI: !this.disableSNI, expectPreData: this.pipelineTLS ? new Uint8Array([83]) : void 0 });
      this.tlsRead = u, this.tlsWrite = a, this.tlsState = 2, this.encrypted = !0, this.authorized = !0, this.emit("secureConnection", this), this.tlsReadLoop();
    }
    async tlsReadLoop() {
      for (; ; ) {
        let e = await this.tlsRead();
        if (e === void 0) break;
        {
          let t = J.from(e);
          this.emit("data", t);
        }
      }
    }
    rawWrite(e) {
      if (!this.coalesceWrites) {
        this.ws && this.ws.send(e);
        return;
      }
      if (this.writeBuffer === void 0) this.writeBuffer = e, setTimeout(() => {
        this.ws && this.ws.send(this.writeBuffer), this.writeBuffer = void 0;
      }, 0);
      else {
        let t = new Uint8Array(
          this.writeBuffer.length + e.length
        );
        t.set(this.writeBuffer), t.set(e, this.writeBuffer.length), this.writeBuffer = t;
      }
    }
    write(e, t = "utf8", r = (n) => {
    }) {
      return e.length === 0 ? (r(), !0) : (typeof e == "string" && (e = J.from(e, t)), this.tlsState === 0 ? (this.rawWrite(e), r()) : this.tlsState === 1 ? this.once("secureConnection", () => {
        this.write(
          e,
          t,
          r
        );
      }) : (this.tlsWrite(e), r()), !0);
    }
    end(e = J.alloc(0), t = "utf8", r = () => {
    }) {
      return this.write(e, t, () => {
        this.ws.close(), r();
      }), this;
    }
    destroy() {
      return this.destroyed = !0, this.end();
    }
  }, m(vt, "Socket"), Y(vt, "defaults", {
    poolQueryViaFetch: !1,
    fetchEndpoint: m((s, e, t) => {
      let r;
      return t != null && t.jwtAuth ? r = s.replace(mr, "apiauth.") : r = s.replace(mr, "api."), "https://" + r + "/sql";
    }, "fetchEndpoint"),
    fetchConnectionCache: !0,
    fetchFunction: void 0,
    webSocketConstructor: void 0,
    wsProxy: m((s) => s + "/v2", "wsProxy"),
    useSecureWebSocket: !0,
    forceDisablePgSSL: !0,
    coalesceWrites: !0,
    pipelineConnect: "password",
    subtls: void 0,
    rootCerts: "",
    pipelineTLS: !1,
    disableSNI: !1,
    disableWarningInBrowsers: !1
  }), Y(vt, "opts", {}), At = vt;
}), rl = {};
De(rl, { parse: () => Qr });
function Qr(s, e = !1) {
  let { protocol: t } = new URL(s), r = "http:" + s.substring(
    t.length
  ), { username: n, password: i, host: u, hostname: a, port: f, pathname: y, search: d, searchParams: v, hash: g } = new URL(
    r
  );
  i = decodeURIComponent(i), n = decodeURIComponent(n), y = decodeURIComponent(y);
  let S = n + ":" + i, c = e ? Object.fromEntries(v.entries()) : d;
  return {
    href: s,
    protocol: t,
    auth: S,
    username: n,
    password: i,
    host: u,
    hostname: a,
    port: f,
    pathname: y,
    search: d,
    query: c,
    hash: g
  };
}
var sl = Ce(() => {
  W(), m(Qr, "parse");
}), nl = te((s) => {
  W(), s.parse = function(n, i) {
    return new t(n, i).parse();
  };
  var e = class il {
    constructor(i, u) {
      this.source = i, this.transform = u || r, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0;
    }
    isEof() {
      return this.position >= this.source.length;
    }
    nextCharacter() {
      var i = this.source[this.position++];
      return i === "\\" ? { value: this.source[this.position++], escaped: !0 } : { value: i, escaped: !1 };
    }
    record(i) {
      this.recorded.push(
        i
      );
    }
    newEntry(i) {
      var u;
      (this.recorded.length > 0 || i) && (u = this.recorded.join(""), u === "NULL" && !i && (u = null), u !== null && (u = this.transform(u)), this.entries.push(u), this.recorded = []);
    }
    consumeDimensions() {
      if (this.source[0] === "[") for (; !this.isEof(); ) {
        var i = this.nextCharacter();
        if (i.value === "=") break;
      }
    }
    parse(i) {
      var u, a, f;
      for (this.consumeDimensions(); !this.isEof(); ) if (u = this.nextCharacter(), u.value === "{" && !f) this.dimension++, this.dimension > 1 && (a = new il(this.source.substr(this.position - 1), this.transform), this.entries.push(a.parse(
        !0
      )), this.position += a.position - 2);
      else if (u.value === "}" && !f) {
        if (this.dimension--, !this.dimension && (this.newEntry(), i)) return this.entries;
      } else u.value === '"' && !u.escaped ? (f && this.newEntry(!0), f = !f) : u.value === "," && !f ? this.newEntry() : this.record(u.value);
      if (this.dimension !== 0) throw new Error("array dimension not balanced");
      return this.entries;
    }
  };
  m(e, "ArrayParser");
  var t = e;
  function r(n) {
    return n;
  }
  m(r, "identity");
}), ol = te((s, e) => {
  W();
  var t = nl();
  e.exports = { create: m(function(r, n) {
    return { parse: m(function() {
      return t.parse(r, n);
    }, "parse") };
  }, "create") };
}), td = te((s, e) => {
  W();
  var t = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, r = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, n = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, i = /^-?infinity$/;
  e.exports = m(function(d) {
    if (i.test(d)) return Number(d.replace("i", "I"));
    var v = t.exec(d);
    if (!v) return u(
      d
    ) || null;
    var g = !!v[8], S = parseInt(v[1], 10);
    g && (S = f(S));
    var c = parseInt(v[2], 10) - 1, h = v[3], b = parseInt(
      v[4],
      10
    ), _ = parseInt(v[5], 10), C = parseInt(v[6], 10), A = v[7];
    A = A ? 1e3 * parseFloat(A) : 0;
    var B, R = a(d);
    return R != null ? (B = new Date(Date.UTC(S, c, h, b, _, C, A)), y(S) && B.setUTCFullYear(S), R !== 0 && B.setTime(B.getTime() - R)) : (B = new Date(S, c, h, b, _, C, A), y(S) && B.setFullYear(S)), B;
  }, "parseDate");
  function u(d) {
    var v = r.exec(d);
    if (v) {
      var g = parseInt(v[1], 10), S = !!v[4];
      S && (g = f(g));
      var c = parseInt(v[2], 10) - 1, h = v[3], b = new Date(g, c, h);
      return y(
        g
      ) && b.setFullYear(g), b;
    }
  }
  m(u, "getDate");
  function a(d) {
    if (d.endsWith("+00")) return 0;
    var v = n.exec(d.split(" ")[1]);
    if (v) {
      var g = v[1];
      if (g === "Z") return 0;
      var S = g === "-" ? -1 : 1, c = parseInt(v[2], 10) * 3600 + parseInt(
        v[3] || 0,
        10
      ) * 60 + parseInt(v[4] || 0, 10);
      return c * S * 1e3;
    }
  }
  m(a, "timeZoneOffset");
  function f(d) {
    return -(d - 1);
  }
  m(f, "bcYearToNegativeYear");
  function y(d) {
    return d >= 0 && d < 100;
  }
  m(y, "is0To99");
}), rd = te((s, e) => {
  W(), e.exports = r;
  var t = Object.prototype.hasOwnProperty;
  function r(n) {
    for (var i = 1; i < arguments.length; i++) {
      var u = arguments[i];
      for (var a in u) t.call(u, a) && (n[a] = u[a]);
    }
    return n;
  }
  m(r, "extend");
}), sd = te((s, e) => {
  W();
  var t = rd();
  e.exports = r;
  function r(C) {
    if (!(this instanceof r))
      return new r(C);
    t(this, _(C));
  }
  m(r, "PostgresInterval");
  var n = [
    "seconds",
    "minutes",
    "hours",
    "days",
    "months",
    "years"
  ];
  r.prototype.toPostgres = function() {
    var C = n.filter(this.hasOwnProperty, this);
    return this.milliseconds && C.indexOf("seconds") < 0 && C.push("seconds"), C.length === 0 ? "0" : C.map(function(A) {
      var B = this[A] || 0;
      return A === "seconds" && this.milliseconds && (B = (B + this.milliseconds / 1e3).toFixed(6).replace(
        /\.?0+$/,
        ""
      )), B + " " + A;
    }, this).join(" ");
  };
  var i = { years: "Y", months: "M", days: "D", hours: "H", minutes: "M", seconds: "S" }, u = ["years", "months", "days"], a = ["hours", "minutes", "seconds"];
  r.prototype.toISOString = r.prototype.toISO = function() {
    var C = u.map(B, this).join(""), A = a.map(B, this).join("");
    return "P" + C + "T" + A;
    function B(R) {
      var E = this[R] || 0;
      return R === "seconds" && this.milliseconds && (E = (E + this.milliseconds / 1e3).toFixed(6).replace(
        /0+$/,
        ""
      )), E + i[R];
    }
  };
  var f = "([+-]?\\d+)", y = f + "\\s+years?", d = f + "\\s+mons?", v = f + "\\s+days?", g = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?", S = new RegExp([y, d, v, g].map(function(C) {
    return "(" + C + ")?";
  }).join("\\s*")), c = { years: 2, months: 4, days: 6, hours: 9, minutes: 10, seconds: 11, milliseconds: 12 }, h = ["hours", "minutes", "seconds", "milliseconds"];
  function b(C) {
    var A = C + "000000".slice(C.length);
    return parseInt(
      A,
      10
    ) / 1e3;
  }
  m(b, "parseMilliseconds");
  function _(C) {
    if (!C) return {};
    var A = S.exec(C), B = A[8] === "-";
    return Object.keys(c).reduce(function(R, E) {
      var I = c[E], N = A[I];
      return !N || (N = E === "milliseconds" ? b(N) : parseInt(N, 10), !N) || (B && ~h.indexOf(E) && (N *= -1), R[E] = N), R;
    }, {});
  }
  m(_, "parse");
}), nd = te((s, e) => {
  W(), e.exports = m(function(t) {
    if (/^\\x/.test(t)) return new J(t.substr(
      2
    ), "hex");
    for (var r = "", n = 0; n < t.length; ) if (t[n] !== "\\") r += t[n], ++n;
    else if (/[0-7]{3}/.test(t.substr(n + 1, 3))) r += String.fromCharCode(parseInt(t.substr(n + 1, 3), 8)), n += 4;
    else {
      for (var i = 1; n + i < t.length && t[n + i] === "\\"; ) i++;
      for (var u = 0; u < Math.floor(i / 2); ++u) r += "\\";
      n += Math.floor(i / 2) * 2;
    }
    return new J(r, "binary");
  }, "parseBytea");
}), id = te((s, e) => {
  W();
  var t = nl(), r = ol(), n = td(), i = sd(), u = nd();
  function a(T) {
    return m(function($) {
      return $ === null ? $ : T($);
    }, "nullAllowed");
  }
  m(a, "allowNull");
  function f(T) {
    return T === null ? T : T === "TRUE" || T === "t" || T === "true" || T === "y" || T === "yes" || T === "on" || T === "1";
  }
  m(f, "parseBool");
  function y(T) {
    return T ? t.parse(T, f) : null;
  }
  m(y, "parseBoolArray");
  function d(T) {
    return parseInt(T, 10);
  }
  m(d, "parseBaseTenInt");
  function v(T) {
    return T ? t.parse(T, a(d)) : null;
  }
  m(v, "parseIntegerArray");
  function g(T) {
    return T ? t.parse(T, a(function($) {
      return B($).trim();
    })) : null;
  }
  m(g, "parseBigIntegerArray");
  var S = m(function(T) {
    if (!T) return null;
    var $ = r.create(T, function(D) {
      return D !== null && (D = E(D)), D;
    });
    return $.parse();
  }, "parsePointArray"), c = m(function(T) {
    if (!T) return null;
    var $ = r.create(T, function(D) {
      return D !== null && (D = parseFloat(D)), D;
    });
    return $.parse();
  }, "parseFloatArray"), h = m(function(T) {
    if (!T) return null;
    var $ = r.create(T);
    return $.parse();
  }, "parseStringArray"), b = m(function(T) {
    if (!T) return null;
    var $ = r.create(
      T,
      function(D) {
        return D !== null && (D = n(D)), D;
      }
    );
    return $.parse();
  }, "parseDateArray"), _ = m(function(T) {
    if (!T)
      return null;
    var $ = r.create(T, function(D) {
      return D !== null && (D = i(D)), D;
    });
    return $.parse();
  }, "parseIntervalArray"), C = m(function(T) {
    return T ? t.parse(T, a(u)) : null;
  }, "parseByteAArray"), A = m(function(T) {
    return parseInt(T, 10);
  }, "parseInteger"), B = m(function(T) {
    var $ = String(T);
    return /^\d+$/.test($) ? $ : T;
  }, "parseBigInteger"), R = m(function(T) {
    return T ? t.parse(T, a(JSON.parse)) : null;
  }, "parseJsonArray"), E = m(
    function(T) {
      return T[0] !== "(" ? null : (T = T.substring(1, T.length - 1).split(","), { x: parseFloat(T[0]), y: parseFloat(
        T[1]
      ) });
    },
    "parsePoint"
  ), I = m(function(T) {
    if (T[0] !== "<" && T[1] !== "(") return null;
    for (var $ = "(", D = "", U = !1, V = 2; V < T.length - 1; V++) {
      if (U || ($ += T[V]), T[V] === ")") {
        U = !0;
        continue;
      } else if (!U) continue;
      T[V] !== "," && (D += T[V]);
    }
    var M = E($);
    return M.radius = parseFloat(D), M;
  }, "parseCircle"), N = m(function(T) {
    T(20, B), T(21, A), T(23, A), T(26, A), T(700, parseFloat), T(701, parseFloat), T(16, f), T(1082, n), T(1114, n), T(1184, n), T(
      600,
      E
    ), T(651, h), T(718, I), T(1e3, y), T(1001, C), T(1005, v), T(1007, v), T(1028, v), T(1016, g), T(1017, S), T(1021, c), T(1022, c), T(1231, c), T(1014, h), T(1015, h), T(1008, h), T(1009, h), T(1040, h), T(1041, h), T(
      1115,
      b
    ), T(1182, b), T(1185, b), T(1186, i), T(1187, _), T(17, u), T(114, JSON.parse.bind(JSON)), T(3802, JSON.parse.bind(JSON)), T(199, R), T(3807, R), T(3907, h), T(2951, h), T(791, h), T(1183, h), T(1270, h);
  }, "init");
  e.exports = { init: N };
}), od = te((s, e) => {
  W();
  var t = 1e6;
  function r(n) {
    var i = n.readInt32BE(0), u = n.readUInt32BE(
      4
    ), a = "";
    i < 0 && (i = ~i + (u === 0), u = ~u + 1 >>> 0, a = "-");
    var f = "", y, d, v, g, S, c;
    {
      if (y = i % t, i = i / t >>> 0, d = 4294967296 * y + u, u = d / t >>> 0, v = "" + (d - t * u), u === 0 && i === 0) return a + v + f;
      for (g = "", S = 6 - v.length, c = 0; c < S; c++) g += "0";
      f = g + v + f;
    }
    {
      if (y = i % t, i = i / t >>> 0, d = 4294967296 * y + u, u = d / t >>> 0, v = "" + (d - t * u), u === 0 && i === 0) return a + v + f;
      for (g = "", S = 6 - v.length, c = 0; c < S; c++) g += "0";
      f = g + v + f;
    }
    {
      if (y = i % t, i = i / t >>> 0, d = 4294967296 * y + u, u = d / t >>> 0, v = "" + (d - t * u), u === 0 && i === 0) return a + v + f;
      for (g = "", S = 6 - v.length, c = 0; c < S; c++) g += "0";
      f = g + v + f;
    }
    return y = i % t, d = 4294967296 * y + u, v = "" + d % t, a + v + f;
  }
  m(r, "readInt8"), e.exports = r;
}), ad = te((s, e) => {
  W();
  var t = od(), r = m(function(h, b, _, C, A) {
    _ = _ || 0, C = C || !1, A = A || function(U, V, M) {
      return U * Math.pow(2, M) + V;
    };
    var B = _ >> 3, R = m(function(U) {
      return C ? ~U & 255 : U;
    }, "inv"), E = 255, I = 8 - _ % 8;
    b < I && (E = 255 << 8 - b & 255, I = b), _ && (E = E >> _ % 8);
    var N = 0;
    _ % 8 + b >= 8 && (N = A(0, R(h[B]) & E, I));
    for (var T = b + _ >> 3, $ = B + 1; $ < T; $++) N = A(N, R(
      h[$]
    ), 8);
    var D = (b + _) % 8;
    return D > 0 && (N = A(N, R(h[T]) >> 8 - D, D)), N;
  }, "parseBits"), n = m(function(h, b, _) {
    var C = Math.pow(2, _ - 1) - 1, A = r(h, 1), B = r(h, _, 1);
    if (B === 0) return 0;
    var R = 1, E = m(function(N, T, $) {
      N === 0 && (N = 1);
      for (var D = 1; D <= $; D++) R /= 2, (T & 1 << $ - D) > 0 && (N += R);
      return N;
    }, "parsePrecisionBits"), I = r(h, b, _ + 1, !1, E);
    return B == Math.pow(
      2,
      _ + 1
    ) - 1 ? I === 0 ? A === 0 ? 1 / 0 : -1 / 0 : NaN : (A === 0 ? 1 : -1) * Math.pow(2, B - C) * I;
  }, "parseFloatFromBits"), i = m(function(h) {
    return r(h, 1) == 1 ? -1 * (r(h, 15, 1, !0) + 1) : r(h, 15, 1);
  }, "parseInt16"), u = m(function(h) {
    return r(h, 1) == 1 ? -1 * (r(
      h,
      31,
      1,
      !0
    ) + 1) : r(h, 31, 1);
  }, "parseInt32"), a = m(function(h) {
    return n(h, 23, 8);
  }, "parseFloat32"), f = m(function(h) {
    return n(h, 52, 11);
  }, "parseFloat64"), y = m(function(h) {
    var b = r(h, 16, 32);
    if (b == 49152) return NaN;
    for (var _ = Math.pow(1e4, r(h, 16, 16)), C = 0, A = [], B = r(h, 16), R = 0; R < B; R++) C += r(h, 16, 64 + 16 * R) * _, _ /= 1e4;
    var E = Math.pow(10, r(
      h,
      16,
      48
    ));
    return (b === 0 ? 1 : -1) * Math.round(C * E) / E;
  }, "parseNumeric"), d = m(function(h, b) {
    var _ = r(b, 1), C = r(
      b,
      63,
      1
    ), A = new Date((_ === 0 ? 1 : -1) * C / 1e3 + 9466848e5);
    return h || A.setTime(A.getTime() + A.getTimezoneOffset() * 6e4), A.usec = C % 1e3, A.getMicroSeconds = function() {
      return this.usec;
    }, A.setMicroSeconds = function(B) {
      this.usec = B;
    }, A.getUTCMicroSeconds = function() {
      return this.usec;
    }, A;
  }, "parseDate"), v = m(
    function(h) {
      for (var b = r(
        h,
        32
      ), _ = r(h, 32, 32), C = r(h, 32, 64), A = 96, B = [], R = 0; R < b; R++) B[R] = r(h, 32, A), A += 32, A += 32;
      var E = m(function(N) {
        var T = r(h, 32, A);
        if (A += 32, T == 4294967295) return null;
        var $;
        if (N == 23 || N == 20) return $ = r(h, T * 8, A), A += T * 8, $;
        if (N == 25) return $ = h.toString(this.encoding, A >> 3, (A += T << 3) >> 3), $;
        console.log("ERROR: ElementType not implemented: " + N);
      }, "parseElement"), I = m(function(N, T) {
        var $ = [], D;
        if (N.length > 1) {
          var U = N.shift();
          for (D = 0; D < U; D++) $[D] = I(N, T);
          N.unshift(U);
        } else for (D = 0; D < N[0]; D++) $[D] = E(T);
        return $;
      }, "parse");
      return I(B, C);
    },
    "parseArray"
  ), g = m(function(h) {
    return h.toString("utf8");
  }, "parseText"), S = m(function(h) {
    return h === null ? null : r(h, 8) > 0;
  }, "parseBool"), c = m(function(h) {
    h(20, t), h(21, i), h(23, u), h(26, u), h(1700, y), h(700, a), h(701, f), h(16, S), h(1114, d.bind(null, !1)), h(1184, d.bind(null, !0)), h(1e3, v), h(1007, v), h(1016, v), h(1008, v), h(1009, v), h(25, g);
  }, "init");
  e.exports = { init: c };
}), ud = te((s, e) => {
  W(), e.exports = {
    BOOL: 16,
    BYTEA: 17,
    CHAR: 18,
    INT8: 20,
    INT2: 21,
    INT4: 23,
    REGPROC: 24,
    TEXT: 25,
    OID: 26,
    TID: 27,
    XID: 28,
    CID: 29,
    JSON: 114,
    XML: 142,
    PG_NODE_TREE: 194,
    SMGR: 210,
    PATH: 602,
    POLYGON: 604,
    CIDR: 650,
    FLOAT4: 700,
    FLOAT8: 701,
    ABSTIME: 702,
    RELTIME: 703,
    TINTERVAL: 704,
    CIRCLE: 718,
    MACADDR8: 774,
    MONEY: 790,
    MACADDR: 829,
    INET: 869,
    ACLITEM: 1033,
    BPCHAR: 1042,
    VARCHAR: 1043,
    DATE: 1082,
    TIME: 1083,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    INTERVAL: 1186,
    TIMETZ: 1266,
    BIT: 1560,
    VARBIT: 1562,
    NUMERIC: 1700,
    REFCURSOR: 1790,
    REGPROCEDURE: 2202,
    REGOPER: 2203,
    REGOPERATOR: 2204,
    REGCLASS: 2205,
    REGTYPE: 2206,
    UUID: 2950,
    TXID_SNAPSHOT: 2970,
    PG_LSN: 3220,
    PG_NDISTINCT: 3361,
    PG_DEPENDENCIES: 3402,
    TSVECTOR: 3614,
    TSQUERY: 3615,
    GTSVECTOR: 3642,
    REGCONFIG: 3734,
    REGDICTIONARY: 3769,
    JSONB: 3802,
    REGNAMESPACE: 4089,
    REGROLE: 4096
  };
}), sr = te((s) => {
  W();
  var e = id(), t = ad(), r = ol(), n = ud();
  s.getTypeParser = a, s.setTypeParser = f, s.arrayParser = r, s.builtins = n;
  var i = { text: {}, binary: {} };
  function u(y) {
    return String(y);
  }
  m(u, "noParse");
  function a(y, d) {
    return d = d || "text", i[d] && i[d][y] || u;
  }
  m(a, "getTypeParser");
  function f(y, d, v) {
    typeof d == "function" && (v = d, d = "text"), i[d][y] = v;
  }
  m(f, "setTypeParser"), e.init(function(y, d) {
    i.text[y] = d;
  }), t.init(function(y, d) {
    i.binary[y] = d;
  });
}), Fr = te((s, e) => {
  W();
  var t = sr();
  function r(n) {
    this._types = n || t, this.text = {}, this.binary = {};
  }
  m(r, "TypeOverrides"), r.prototype.getOverrides = function(n) {
    switch (n) {
      case "text":
        return this.text;
      case "binary":
        return this.binary;
      default:
        return {};
    }
  }, r.prototype.setTypeParser = function(n, i, u) {
    typeof i == "function" && (u = i, i = "text"), this.getOverrides(i)[n] = u;
  }, r.prototype.getTypeParser = function(n, i) {
    return i = i || "text", this.getOverrides(i)[n] || this._types.getTypeParser(n, i);
  }, e.exports = r;
});
function Et(s) {
  let e = 1779033703, t = 3144134277, r = 1013904242, n = 2773480762, i = 1359893119, u = 2600822924, a = 528734635, f = 1541459225, y = 0, d = 0, v = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ], g = m((C, A) => C >>> A | C << 32 - A, "rrot"), S = new Uint32Array(64), c = new Uint8Array(64), h = m(() => {
    for (let $ = 0, D = 0; $ < 16; $++, D += 4) S[$] = c[D] << 24 | c[D + 1] << 16 | c[D + 2] << 8 | c[D + 3];
    for (let $ = 16; $ < 64; $++) {
      let D = g(S[$ - 15], 7) ^ g(S[$ - 15], 18) ^ S[$ - 15] >>> 3, U = g(
        S[$ - 2],
        17
      ) ^ g(S[$ - 2], 19) ^ S[$ - 2] >>> 10;
      S[$] = S[$ - 16] + D + S[$ - 7] + U | 0;
    }
    let C = e, A = t, B = r, R = n, E = i, I = u, N = a, T = f;
    for (let $ = 0; $ < 64; $++) {
      let D = g(E, 6) ^ g(E, 11) ^ g(E, 25), U = E & I ^ ~E & N, V = T + D + U + v[$] + S[$] | 0, M = g(C, 2) ^ g(
        C,
        13
      ) ^ g(C, 22), F = C & A ^ C & B ^ A & B, G = M + F | 0;
      T = N, N = I, I = E, E = R + V | 0, R = B, B = A, A = C, C = V + G | 0;
    }
    e = e + C | 0, t = t + A | 0, r = r + B | 0, n = n + R | 0, i = i + E | 0, u = u + I | 0, a = a + N | 0, f = f + T | 0, d = 0;
  }, "process"), b = m((C) => {
    typeof C == "string" && (C = new TextEncoder().encode(C));
    for (let A = 0; A < C.length; A++) c[d++] = C[A], d === 64 && h();
    y += C.length;
  }, "add"), _ = m(() => {
    if (c[d++] = 128, d == 64 && h(), d + 8 > 64) {
      for (; d < 64; ) c[d++] = 0;
      h();
    }
    for (; d < 58; ) c[d++] = 0;
    let C = y * 8;
    c[d++] = C / 1099511627776 & 255, c[d++] = C / 4294967296 & 255, c[d++] = C >>> 24, c[d++] = C >>> 16 & 255, c[d++] = C >>> 8 & 255, c[d++] = C & 255, h();
    let A = new Uint8Array(
      32
    );
    return A[0] = e >>> 24, A[1] = e >>> 16 & 255, A[2] = e >>> 8 & 255, A[3] = e & 255, A[4] = t >>> 24, A[5] = t >>> 16 & 255, A[6] = t >>> 8 & 255, A[7] = t & 255, A[8] = r >>> 24, A[9] = r >>> 16 & 255, A[10] = r >>> 8 & 255, A[11] = r & 255, A[12] = n >>> 24, A[13] = n >>> 16 & 255, A[14] = n >>> 8 & 255, A[15] = n & 255, A[16] = i >>> 24, A[17] = i >>> 16 & 255, A[18] = i >>> 8 & 255, A[19] = i & 255, A[20] = u >>> 24, A[21] = u >>> 16 & 255, A[22] = u >>> 8 & 255, A[23] = u & 255, A[24] = a >>> 24, A[25] = a >>> 16 & 255, A[26] = a >>> 8 & 255, A[27] = a & 255, A[28] = f >>> 24, A[29] = f >>> 16 & 255, A[30] = f >>> 8 & 255, A[31] = f & 255, A;
  }, "digest");
  return s === void 0 ? { add: b, digest: _ } : (b(s), _());
}
var ld = Ce(() => {
  W(), m(Et, "sha256");
}), Qe, _r, cd = Ce(() => {
  W(), Qe = class Le {
    constructor() {
      Y(this, "_dataLength", 0), Y(this, "_bufferLength", 0), Y(this, "_state", new Int32Array(4)), Y(this, "_buffer", new ArrayBuffer(68)), Y(this, "_buffer8"), Y(this, "_buffer32"), this._buffer8 = new Uint8Array(this._buffer, 0, 68), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start();
    }
    static hashByteArray(e, t = !1) {
      return this.onePassHasher.start().appendByteArray(
        e
      ).end(t);
    }
    static hashStr(e, t = !1) {
      return this.onePassHasher.start().appendStr(e).end(t);
    }
    static hashAsciiStr(e, t = !1) {
      return this.onePassHasher.start().appendAsciiStr(e).end(t);
    }
    static _hex(e) {
      let t = Le.hexChars, r = Le.hexOut, n, i, u, a;
      for (a = 0; a < 4; a += 1) for (i = a * 8, n = e[a], u = 0; u < 8; u += 2) r[i + 1 + u] = t.charAt(n & 15), n >>>= 4, r[i + 0 + u] = t.charAt(
        n & 15
      ), n >>>= 4;
      return r.join("");
    }
    static _md5cycle(e, t) {
      let r = e[0], n = e[1], i = e[2], u = e[3];
      r += (n & i | ~n & u) + t[0] - 680876936 | 0, r = (r << 7 | r >>> 25) + n | 0, u += (r & n | ~r & i) + t[1] - 389564586 | 0, u = (u << 12 | u >>> 20) + r | 0, i += (u & r | ~u & n) + t[2] + 606105819 | 0, i = (i << 17 | i >>> 15) + u | 0, n += (i & u | ~i & r) + t[3] - 1044525330 | 0, n = (n << 22 | n >>> 10) + i | 0, r += (n & i | ~n & u) + t[4] - 176418897 | 0, r = (r << 7 | r >>> 25) + n | 0, u += (r & n | ~r & i) + t[5] + 1200080426 | 0, u = (u << 12 | u >>> 20) + r | 0, i += (u & r | ~u & n) + t[6] - 1473231341 | 0, i = (i << 17 | i >>> 15) + u | 0, n += (i & u | ~i & r) + t[7] - 45705983 | 0, n = (n << 22 | n >>> 10) + i | 0, r += (n & i | ~n & u) + t[8] + 1770035416 | 0, r = (r << 7 | r >>> 25) + n | 0, u += (r & n | ~r & i) + t[9] - 1958414417 | 0, u = (u << 12 | u >>> 20) + r | 0, i += (u & r | ~u & n) + t[10] - 42063 | 0, i = (i << 17 | i >>> 15) + u | 0, n += (i & u | ~i & r) + t[11] - 1990404162 | 0, n = (n << 22 | n >>> 10) + i | 0, r += (n & i | ~n & u) + t[12] + 1804603682 | 0, r = (r << 7 | r >>> 25) + n | 0, u += (r & n | ~r & i) + t[13] - 40341101 | 0, u = (u << 12 | u >>> 20) + r | 0, i += (u & r | ~u & n) + t[14] - 1502002290 | 0, i = (i << 17 | i >>> 15) + u | 0, n += (i & u | ~i & r) + t[15] + 1236535329 | 0, n = (n << 22 | n >>> 10) + i | 0, r += (n & u | i & ~u) + t[1] - 165796510 | 0, r = (r << 5 | r >>> 27) + n | 0, u += (r & i | n & ~i) + t[6] - 1069501632 | 0, u = (u << 9 | u >>> 23) + r | 0, i += (u & n | r & ~n) + t[11] + 643717713 | 0, i = (i << 14 | i >>> 18) + u | 0, n += (i & r | u & ~r) + t[0] - 373897302 | 0, n = (n << 20 | n >>> 12) + i | 0, r += (n & u | i & ~u) + t[5] - 701558691 | 0, r = (r << 5 | r >>> 27) + n | 0, u += (r & i | n & ~i) + t[10] + 38016083 | 0, u = (u << 9 | u >>> 23) + r | 0, i += (u & n | r & ~n) + t[15] - 660478335 | 0, i = (i << 14 | i >>> 18) + u | 0, n += (i & r | u & ~r) + t[4] - 405537848 | 0, n = (n << 20 | n >>> 12) + i | 0, r += (n & u | i & ~u) + t[9] + 568446438 | 0, r = (r << 5 | r >>> 27) + n | 0, u += (r & i | n & ~i) + t[14] - 1019803690 | 0, u = (u << 9 | u >>> 23) + r | 0, i += (u & n | r & ~n) + t[3] - 187363961 | 0, i = (i << 14 | i >>> 18) + u | 0, n += (i & r | u & ~r) + t[8] + 1163531501 | 0, n = (n << 20 | n >>> 12) + i | 0, r += (n & u | i & ~u) + t[13] - 1444681467 | 0, r = (r << 5 | r >>> 27) + n | 0, u += (r & i | n & ~i) + t[2] - 51403784 | 0, u = (u << 9 | u >>> 23) + r | 0, i += (u & n | r & ~n) + t[7] + 1735328473 | 0, i = (i << 14 | i >>> 18) + u | 0, n += (i & r | u & ~r) + t[12] - 1926607734 | 0, n = (n << 20 | n >>> 12) + i | 0, r += (n ^ i ^ u) + t[5] - 378558 | 0, r = (r << 4 | r >>> 28) + n | 0, u += (r ^ n ^ i) + t[8] - 2022574463 | 0, u = (u << 11 | u >>> 21) + r | 0, i += (u ^ r ^ n) + t[11] + 1839030562 | 0, i = (i << 16 | i >>> 16) + u | 0, n += (i ^ u ^ r) + t[14] - 35309556 | 0, n = (n << 23 | n >>> 9) + i | 0, r += (n ^ i ^ u) + t[1] - 1530992060 | 0, r = (r << 4 | r >>> 28) + n | 0, u += (r ^ n ^ i) + t[4] + 1272893353 | 0, u = (u << 11 | u >>> 21) + r | 0, i += (u ^ r ^ n) + t[7] - 155497632 | 0, i = (i << 16 | i >>> 16) + u | 0, n += (i ^ u ^ r) + t[10] - 1094730640 | 0, n = (n << 23 | n >>> 9) + i | 0, r += (n ^ i ^ u) + t[13] + 681279174 | 0, r = (r << 4 | r >>> 28) + n | 0, u += (r ^ n ^ i) + t[0] - 358537222 | 0, u = (u << 11 | u >>> 21) + r | 0, i += (u ^ r ^ n) + t[3] - 722521979 | 0, i = (i << 16 | i >>> 16) + u | 0, n += (i ^ u ^ r) + t[6] + 76029189 | 0, n = (n << 23 | n >>> 9) + i | 0, r += (n ^ i ^ u) + t[9] - 640364487 | 0, r = (r << 4 | r >>> 28) + n | 0, u += (r ^ n ^ i) + t[12] - 421815835 | 0, u = (u << 11 | u >>> 21) + r | 0, i += (u ^ r ^ n) + t[15] + 530742520 | 0, i = (i << 16 | i >>> 16) + u | 0, n += (i ^ u ^ r) + t[2] - 995338651 | 0, n = (n << 23 | n >>> 9) + i | 0, r += (i ^ (n | ~u)) + t[0] - 198630844 | 0, r = (r << 6 | r >>> 26) + n | 0, u += (n ^ (r | ~i)) + t[7] + 1126891415 | 0, u = (u << 10 | u >>> 22) + r | 0, i += (r ^ (u | ~n)) + t[14] - 1416354905 | 0, i = (i << 15 | i >>> 17) + u | 0, n += (u ^ (i | ~r)) + t[5] - 57434055 | 0, n = (n << 21 | n >>> 11) + i | 0, r += (i ^ (n | ~u)) + t[12] + 1700485571 | 0, r = (r << 6 | r >>> 26) + n | 0, u += (n ^ (r | ~i)) + t[3] - 1894986606 | 0, u = (u << 10 | u >>> 22) + r | 0, i += (r ^ (u | ~n)) + t[10] - 1051523 | 0, i = (i << 15 | i >>> 17) + u | 0, n += (u ^ (i | ~r)) + t[1] - 2054922799 | 0, n = (n << 21 | n >>> 11) + i | 0, r += (i ^ (n | ~u)) + t[8] + 1873313359 | 0, r = (r << 6 | r >>> 26) + n | 0, u += (n ^ (r | ~i)) + t[15] - 30611744 | 0, u = (u << 10 | u >>> 22) + r | 0, i += (r ^ (u | ~n)) + t[6] - 1560198380 | 0, i = (i << 15 | i >>> 17) + u | 0, n += (u ^ (i | ~r)) + t[13] + 1309151649 | 0, n = (n << 21 | n >>> 11) + i | 0, r += (i ^ (n | ~u)) + t[4] - 145523070 | 0, r = (r << 6 | r >>> 26) + n | 0, u += (n ^ (r | ~i)) + t[11] - 1120210379 | 0, u = (u << 10 | u >>> 22) + r | 0, i += (r ^ (u | ~n)) + t[2] + 718787259 | 0, i = (i << 15 | i >>> 17) + u | 0, n += (u ^ (i | ~r)) + t[9] - 343485551 | 0, n = (n << 21 | n >>> 11) + i | 0, e[0] = r + e[0] | 0, e[1] = n + e[1] | 0, e[2] = i + e[2] | 0, e[3] = u + e[3] | 0;
    }
    start() {
      return this._dataLength = 0, this._bufferLength = 0, this._state.set(Le.stateIdentity), this;
    }
    appendStr(e) {
      let t = this._buffer8, r = this._buffer32, n = this._bufferLength, i, u;
      for (u = 0; u < e.length; u += 1) {
        if (i = e.charCodeAt(u), i < 128) t[n++] = i;
        else if (i < 2048) t[n++] = (i >>> 6) + 192, t[n++] = i & 63 | 128;
        else if (i < 55296 || i > 56319) t[n++] = (i >>> 12) + 224, t[n++] = i >>> 6 & 63 | 128, t[n++] = i & 63 | 128;
        else {
          if (i = (i - 55296) * 1024 + (e.charCodeAt(++u) - 56320) + 65536, i > 1114111) throw new Error(
            "Unicode standard supports code points up to U+10FFFF"
          );
          t[n++] = (i >>> 18) + 240, t[n++] = i >>> 12 & 63 | 128, t[n++] = i >>> 6 & 63 | 128, t[n++] = i & 63 | 128;
        }
        n >= 64 && (this._dataLength += 64, Le._md5cycle(this._state, r), n -= 64, r[0] = r[16]);
      }
      return this._bufferLength = n, this;
    }
    appendAsciiStr(e) {
      let t = this._buffer8, r = this._buffer32, n = this._bufferLength, i, u = 0;
      for (; ; ) {
        for (i = Math.min(e.length - u, 64 - n); i--; ) t[n++] = e.charCodeAt(u++);
        if (n < 64) break;
        this._dataLength += 64, Le._md5cycle(this._state, r), n = 0;
      }
      return this._bufferLength = n, this;
    }
    appendByteArray(e) {
      let t = this._buffer8, r = this._buffer32, n = this._bufferLength, i, u = 0;
      for (; ; ) {
        for (i = Math.min(e.length - u, 64 - n); i--; ) t[n++] = e[u++];
        if (n < 64) break;
        this._dataLength += 64, Le._md5cycle(this._state, r), n = 0;
      }
      return this._bufferLength = n, this;
    }
    getState() {
      let e = this._state;
      return { buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)), buflen: this._bufferLength, length: this._dataLength, state: [e[0], e[1], e[2], e[3]] };
    }
    setState(e) {
      let t = e.buffer, r = e.state, n = this._state, i;
      for (this._dataLength = e.length, this._bufferLength = e.buflen, n[0] = r[0], n[1] = r[1], n[2] = r[2], n[3] = r[3], i = 0; i < t.length; i += 1) this._buffer8[i] = t.charCodeAt(i);
    }
    end(e = !1) {
      let t = this._bufferLength, r = this._buffer8, n = this._buffer32, i = (t >> 2) + 1;
      this._dataLength += t;
      let u = this._dataLength * 8;
      if (r[t] = 128, r[t + 1] = r[t + 2] = r[t + 3] = 0, n.set(Le.buffer32Identity.subarray(i), i), t > 55 && (Le._md5cycle(this._state, n), n.set(Le.buffer32Identity)), u <= 4294967295) n[14] = u;
      else {
        let a = u.toString(16).match(/(.*?)(.{0,8})$/);
        if (a === null) return;
        let f = parseInt(
          a[2],
          16
        ), y = parseInt(a[1], 16) || 0;
        n[14] = f, n[15] = y;
      }
      return Le._md5cycle(this._state, n), e ? this._state : Le._hex(
        this._state
      );
    }
  }, m(Qe, "Md5"), Y(Qe, "stateIdentity", new Int32Array([1732584193, -271733879, -1732584194, 271733878])), Y(Qe, "buffer32Identity", new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])), Y(Qe, "hexChars", "0123456789abcdef"), Y(Qe, "hexOut", []), Y(Qe, "onePassHasher", new Qe()), _r = Qe;
}), jr = {};
De(jr, { createHash: () => ul, createHmac: () => ll, randomBytes: () => al });
function al(s) {
  return crypto.getRandomValues(J.alloc(s));
}
function ul(s) {
  if (s === "sha256") return { update: m(function(e) {
    return { digest: m(
      function() {
        return J.from(Et(e));
      },
      "digest"
    ) };
  }, "update") };
  if (s === "md5") return { update: m(function(e) {
    return {
      digest: m(function() {
        return typeof e == "string" ? _r.hashStr(e) : _r.hashByteArray(e);
      }, "digest")
    };
  }, "update") };
  throw new Error(`Hash type '${s}' not supported`);
}
function ll(s, e) {
  if (s !== "sha256") throw new Error(`Only sha256 is supported (requested: '${s}')`);
  return { update: m(function(t) {
    return { digest: m(
      function() {
        typeof e == "string" && (e = new TextEncoder().encode(e)), typeof t == "string" && (t = new TextEncoder().encode(
          t
        ));
        let r = e.length;
        if (r > 64) e = Et(e);
        else if (r < 64) {
          let f = new Uint8Array(64);
          f.set(e), e = f;
        }
        let n = new Uint8Array(
          64
        ), i = new Uint8Array(64);
        for (let f = 0; f < 64; f++) n[f] = 54 ^ e[f], i[f] = 92 ^ e[f];
        let u = new Uint8Array(t.length + 64);
        u.set(n, 0), u.set(t, 64);
        let a = new Uint8Array(96);
        return a.set(i, 0), a.set(Et(u), 64), J.from(Et(a));
      },
      "digest"
    ) };
  }, "update") };
}
var cl = Ce(() => {
  W(), ld(), cd(), m(al, "randomBytes"), m(ul, "createHash"), m(ll, "createHmac");
}), nr = te((s, e) => {
  W(), e.exports = {
    host: "localhost",
    user: ee.platform === "win32" ? ee.env.USERNAME : ee.env.USER,
    database: void 0,
    password: null,
    connectionString: void 0,
    port: 5432,
    rows: 0,
    binary: !1,
    max: 10,
    idleTimeoutMillis: 3e4,
    client_encoding: "",
    ssl: !1,
    application_name: void 0,
    fallback_application_name: void 0,
    options: void 0,
    parseInputDatesAsUTC: !1,
    statement_timeout: !1,
    lock_timeout: !1,
    idle_in_transaction_session_timeout: !1,
    query_timeout: !1,
    connect_timeout: 0,
    keepalives: 1,
    keepalives_idle: 0
  };
  var t = sr(), r = t.getTypeParser(20, "text"), n = t.getTypeParser(
    1016,
    "text"
  );
  e.exports.__defineSetter__("parseInt8", function(i) {
    t.setTypeParser(20, "text", i ? t.getTypeParser(
      23,
      "text"
    ) : r), t.setTypeParser(1016, "text", i ? t.getTypeParser(1007, "text") : n);
  });
}), ir = te((s, e) => {
  W();
  var t = (cl(), ye(jr)), r = nr();
  function n(c) {
    var h = c.replace(
      /\\/g,
      "\\\\"
    ).replace(/"/g, '\\"');
    return '"' + h + '"';
  }
  m(n, "escapeElement");
  function i(c) {
    for (var h = "{", b = 0; b < c.length; b++) b > 0 && (h = h + ","), c[b] === null || typeof c[b] > "u" ? h = h + "NULL" : Array.isArray(c[b]) ? h = h + i(c[b]) : c[b] instanceof J ? h += "\\\\x" + c[b].toString("hex") : h += n(u(c[b]));
    return h = h + "}", h;
  }
  m(i, "arrayString");
  var u = m(function(c, h) {
    if (c == null) return null;
    if (c instanceof J) return c;
    if (ArrayBuffer.isView(c)) {
      var b = J.from(c.buffer, c.byteOffset, c.byteLength);
      return b.length === c.byteLength ? b : b.slice(c.byteOffset, c.byteOffset + c.byteLength);
    }
    return c instanceof Date ? r.parseInputDatesAsUTC ? d(c) : y(c) : Array.isArray(c) ? i(c) : typeof c == "object" ? a(c, h) : c.toString();
  }, "prepareValue");
  function a(c, h) {
    if (c && typeof c.toPostgres == "function") {
      if (h = h || [], h.indexOf(c) !== -1) throw new Error('circular reference detected while preparing "' + c + '" for query');
      return h.push(c), u(c.toPostgres(u), h);
    }
    return JSON.stringify(c);
  }
  m(a, "prepareObject");
  function f(c, h) {
    for (c = "" + c; c.length < h; ) c = "0" + c;
    return c;
  }
  m(f, "pad");
  function y(c) {
    var h = -c.getTimezoneOffset(), b = c.getFullYear(), _ = b < 1;
    _ && (b = Math.abs(b) + 1);
    var C = f(b, 4) + "-" + f(c.getMonth() + 1, 2) + "-" + f(c.getDate(), 2) + "T" + f(
      c.getHours(),
      2
    ) + ":" + f(c.getMinutes(), 2) + ":" + f(c.getSeconds(), 2) + "." + f(c.getMilliseconds(), 3);
    return h < 0 ? (C += "-", h *= -1) : C += "+", C += f(Math.floor(h / 60), 2) + ":" + f(h % 60, 2), _ && (C += " BC"), C;
  }
  m(y, "dateToString");
  function d(c) {
    var h = c.getUTCFullYear(), b = h < 1;
    b && (h = Math.abs(h) + 1);
    var _ = f(h, 4) + "-" + f(c.getUTCMonth() + 1, 2) + "-" + f(c.getUTCDate(), 2) + "T" + f(c.getUTCHours(), 2) + ":" + f(c.getUTCMinutes(), 2) + ":" + f(c.getUTCSeconds(), 2) + "." + f(
      c.getUTCMilliseconds(),
      3
    );
    return _ += "+00:00", b && (_ += " BC"), _;
  }
  m(d, "dateToStringUTC");
  function v(c, h, b) {
    return c = typeof c == "string" ? { text: c } : c, h && (typeof h == "function" ? c.callback = h : c.values = h), b && (c.callback = b), c;
  }
  m(v, "normalizeQueryConfig");
  var g = m(function(c) {
    return t.createHash("md5").update(c, "utf-8").digest("hex");
  }, "md5"), S = m(
    function(c, h, b) {
      var _ = g(h + c), C = g(J.concat([J.from(_), b]));
      return "md5" + C;
    },
    "postgresMd5PasswordHash"
  );
  e.exports = {
    prepareValue: m(function(c) {
      return u(c);
    }, "prepareValueWrapper"),
    normalizeQueryConfig: v,
    postgresMd5PasswordHash: S,
    md5: g
  };
}), Lt = {};
De(Lt, { default: () => hl });
var hl, or = Ce(() => {
  W(), hl = {};
}), hd = te((s, e) => {
  W();
  var t = (cl(), ye(jr));
  function r(h) {
    if (h.indexOf("SCRAM-SHA-256") === -1) throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
    let b = t.randomBytes(
      18
    ).toString("base64");
    return { mechanism: "SCRAM-SHA-256", clientNonce: b, response: "n,,n=*,r=" + b, message: "SASLInitialResponse" };
  }
  m(r, "startSession");
  function n(h, b, _) {
    if (h.message !== "SASLInitialResponse") throw new Error(
      "SASL: Last message was not SASLInitialResponse"
    );
    if (typeof b != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
    if (typeof _ != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
    let C = y(_);
    if (C.nonce.startsWith(h.clientNonce)) {
      if (C.nonce.length === h.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    var A = J.from(C.salt, "base64"), B = c(b, A, C.iteration), R = S(B, "Client Key"), E = g(
      R
    ), I = "n=*,r=" + h.clientNonce, N = "r=" + C.nonce + ",s=" + C.salt + ",i=" + C.iteration, T = "c=biws,r=" + C.nonce, $ = I + "," + N + "," + T, D = S(E, $), U = v(R, D), V = U.toString("base64"), M = S(B, "Server Key"), F = S(M, $);
    h.message = "SASLResponse", h.serverSignature = F.toString("base64"), h.response = T + ",p=" + V;
  }
  m(n, "continueSession");
  function i(h, b) {
    if (h.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
    if (typeof b != "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
    let { serverSignature: _ } = d(
      b
    );
    if (_ !== h.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
  }
  m(i, "finalizeSession");
  function u(h) {
    if (typeof h != "string") throw new TypeError("SASL: text must be a string");
    return h.split("").map((b, _) => h.charCodeAt(_)).every((b) => b >= 33 && b <= 43 || b >= 45 && b <= 126);
  }
  m(u, "isPrintableChars");
  function a(h) {
    return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(h);
  }
  m(a, "isBase64");
  function f(h) {
    if (typeof h != "string") throw new TypeError("SASL: attribute pairs text must be a string");
    return new Map(h.split(",").map((b) => {
      if (!/^.=/.test(b)) throw new Error("SASL: Invalid attribute pair entry");
      let _ = b[0], C = b.substring(2);
      return [_, C];
    }));
  }
  m(f, "parseAttributePairs");
  function y(h) {
    let b = f(h), _ = b.get("r");
    if (_) {
      if (!u(_)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
    let C = b.get("s");
    if (C) {
      if (!a(C)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
    let A = b.get("i");
    if (A) {
      if (!/^[1-9][0-9]*$/.test(A)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
    let B = parseInt(A, 10);
    return { nonce: _, salt: C, iteration: B };
  }
  m(y, "parseServerFirstMessage");
  function d(h) {
    let b = f(h).get("v");
    if (b) {
      if (!a(b)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
    } else throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
    return { serverSignature: b };
  }
  m(d, "parseServerFinalMessage");
  function v(h, b) {
    if (!J.isBuffer(h)) throw new TypeError("first argument must be a Buffer");
    if (!J.isBuffer(b)) throw new TypeError(
      "second argument must be a Buffer"
    );
    if (h.length !== b.length) throw new Error("Buffer lengths must match");
    if (h.length === 0) throw new Error("Buffers cannot be empty");
    return J.from(h.map((_, C) => h[C] ^ b[C]));
  }
  m(v, "xorBuffers");
  function g(h) {
    return t.createHash("sha256").update(h).digest();
  }
  m(g, "sha256");
  function S(h, b) {
    return t.createHmac("sha256", h).update(b).digest();
  }
  m(S, "hmacSha256");
  function c(h, b, _) {
    for (var C = S(
      h,
      J.concat([b, J.from([0, 0, 0, 1])])
    ), A = C, B = 0; B < _ - 1; B++) C = S(h, C), A = v(A, C);
    return A;
  }
  m(c, "Hi"), e.exports = { startSession: r, continueSession: n, finalizeSession: i };
}), Ur = {};
De(Ur, { join: () => fl });
function fl(...s) {
  return s.join("/");
}
var dl = Ce(() => {
  W(), m(
    fl,
    "join"
  );
}), Vr = {};
De(Vr, { stat: () => pl });
function pl(s, e) {
  e(new Error("No filesystem"));
}
var ml = Ce(() => {
  W(), m(pl, "stat");
}), zr = {};
De(zr, { default: () => gl });
var gl, yl = Ce(() => {
  W(), gl = {};
}), wl = {};
De(wl, { StringDecoder: () => bl });
var gr, bl, fd = Ce(() => {
  W(), gr = class {
    constructor(e) {
      Y(this, "td"), this.td = new TextDecoder(e);
    }
    write(e) {
      return this.td.decode(e, { stream: !0 });
    }
    end(e) {
      return this.td.decode(e);
    }
  }, m(gr, "StringDecoder"), bl = gr;
}), dd = te((s, e) => {
  W();
  var { Transform: t } = (yl(), ye(zr)), { StringDecoder: r } = (fd(), ye(wl)), n = Symbol(
    "last"
  ), i = Symbol("decoder");
  function u(v, g, S) {
    let c;
    if (this.overflow) {
      if (c = this[i].write(v).split(
        this.matcher
      ), c.length === 1) return S();
      c.shift(), this.overflow = !1;
    } else this[n] += this[i].write(v), c = this[n].split(this.matcher);
    this[n] = c.pop();
    for (let h = 0; h < c.length; h++) try {
      f(this, this.mapper(c[h]));
    } catch (b) {
      return S(b);
    }
    if (this.overflow = this[n].length > this.maxLength, this.overflow && !this.skipOverflow) {
      S(new Error(
        "maximum buffer reached"
      ));
      return;
    }
    S();
  }
  m(u, "transform");
  function a(v) {
    if (this[n] += this[i].end(), this[n])
      try {
        f(this, this.mapper(this[n]));
      } catch (g) {
        return v(g);
      }
    v();
  }
  m(a, "flush");
  function f(v, g) {
    g !== void 0 && v.push(g);
  }
  m(f, "push");
  function y(v) {
    return v;
  }
  m(y, "noop");
  function d(v, g, S) {
    switch (v = v || /\r?\n/, g = g || y, S = S || {}, arguments.length) {
      case 1:
        typeof v == "function" ? (g = v, v = /\r?\n/) : typeof v == "object" && !(v instanceof RegExp) && !v[Symbol.split] && (S = v, v = /\r?\n/);
        break;
      case 2:
        typeof v == "function" ? (S = g, g = v, v = /\r?\n/) : typeof g == "object" && (S = g, g = y);
    }
    S = Object.assign({}, S), S.autoDestroy = !0, S.transform = u, S.flush = a, S.readableObjectMode = !0;
    let c = new t(S);
    return c[n] = "", c[i] = new r("utf8"), c.matcher = v, c.mapper = g, c.maxLength = S.maxLength, c.skipOverflow = S.skipOverflow || !1, c.overflow = !1, c._destroy = function(h, b) {
      this._writableState.errorEmitted = !1, b(h);
    }, c;
  }
  m(d, "split"), e.exports = d;
}), pd = te((s, e) => {
  W();
  var t = (dl(), ye(Ur)), r = (yl(), ye(zr)).Stream, n = dd(), i = (or(), ye(Lt)), u = 5432, a = ee.platform === "win32", f = ee.stderr, y = 56, d = 7, v = 61440, g = 32768;
  function S(R) {
    return (R & v) == g;
  }
  m(S, "isRegFile");
  var c = ["host", "port", "database", "user", "password"], h = c.length, b = c[h - 1];
  function _() {
    var R = f instanceof r && f.writable === !0;
    if (R) {
      var E = Array.prototype.slice.call(arguments).concat(`
`);
      f.write(i.format.apply(i, E));
    }
  }
  m(_, "warn"), Object.defineProperty(e.exports, "isWin", { get: m(function() {
    return a;
  }, "get"), set: m(function(R) {
    a = R;
  }, "set") }), e.exports.warnTo = function(R) {
    var E = f;
    return f = R, E;
  }, e.exports.getFileName = function(R) {
    var E = R || ee.env, I = E.PGPASSFILE || (a ? t.join(E.APPDATA || "./", "postgresql", "pgpass.conf") : t.join(E.HOME || "./", ".pgpass"));
    return I;
  }, e.exports.usePgPass = function(R, E) {
    return Object.prototype.hasOwnProperty.call(ee.env, "PGPASSWORD") ? !1 : a ? !0 : (E = E || "<unkn>", S(R.mode) ? R.mode & (y | d) ? (_('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', E), !1) : !0 : (_('WARNING: password file "%s" is not a plain file', E), !1));
  };
  var C = e.exports.match = function(R, E) {
    return c.slice(0, -1).reduce(function(I, N, T) {
      return T == 1 && Number(R[N] || u) === Number(
        E[N]
      ) ? I && !0 : I && (E[N] === "*" || E[N] === R[N]);
    }, !0);
  };
  e.exports.getPassword = function(R, E, I) {
    var N, T = E.pipe(
      n()
    );
    function $(V) {
      var M = A(V);
      M && B(M) && C(R, M) && (N = M[b], T.end());
    }
    m($, "onLine");
    var D = m(function() {
      E.destroy(), I(N);
    }, "onEnd"), U = m(function(V) {
      E.destroy(), _("WARNING: error on reading file: %s", V), I(
        void 0
      );
    }, "onErr");
    E.on("error", U), T.on("data", $).on("end", D).on("error", U);
  };
  var A = e.exports.parseLine = function(R) {
    if (R.length < 11 || R.match(/^\s+#/)) return null;
    for (var E = "", I = "", N = 0, T = 0, $ = 0, D = {}, U = !1, V = m(
      function(F, G, Z) {
        var ne = R.substring(G, Z);
        Object.hasOwnProperty.call(ee.env, "PGPASS_NO_DEESCAPE") || (ne = ne.replace(/\\([:\\])/g, "$1")), D[c[F]] = ne;
      },
      "addToObj"
    ), M = 0; M < R.length - 1; M += 1) {
      if (E = R.charAt(M + 1), I = R.charAt(
        M
      ), U = N == h - 1, U) {
        V(N, T);
        break;
      }
      M >= 0 && E == ":" && I !== "\\" && (V(N, T, M + 1), T = M + 2, N += 1);
    }
    return D = Object.keys(D).length === h ? D : null, D;
  }, B = e.exports.isValidEntry = function(R) {
    for (var E = { 0: function(D) {
      return D.length > 0;
    }, 1: function(D) {
      return D === "*" ? !0 : (D = Number(D), isFinite(D) && D > 0 && D < 9007199254740992 && Math.floor(D) === D);
    }, 2: function(D) {
      return D.length > 0;
    }, 3: function(D) {
      return D.length > 0;
    }, 4: function(D) {
      return D.length > 0;
    } }, I = 0; I < c.length; I += 1) {
      var N = E[I], T = R[c[I]] || "", $ = N(T);
      if (!$) return !1;
    }
    return !0;
  };
}), md = te((s, e) => {
  W(), dl(), ye(Ur);
  var t = (ml(), ye(Vr)), r = pd();
  e.exports = function(n, i) {
    var u = r.getFileName();
    t.stat(u, function(a, f) {
      if (a || !r.usePgPass(f, u)) return i(void 0);
      var y = t.createReadStream(
        u
      );
      r.getPassword(n, y, i);
    });
  }, e.exports.warnTo = r.warnTo;
}), vl = {};
De(vl, { default: () => Sl });
var Sl, gd = Ce(() => {
  W(), Sl = {};
}), yd = te((s, e) => {
  W();
  var t = (sl(), ye(rl)), r = (ml(), ye(Vr));
  function n(i) {
    if (i.charAt(0) === "/") {
      var a = i.split(" ");
      return { host: a[0], database: a[1] };
    }
    var u = t.parse(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(i) ? encodeURI(i).replace(/\%25(\d\d)/g, "%$1") : i, !0), a = u.query;
    for (var f in a) Array.isArray(a[f]) && (a[f] = a[f][a[f].length - 1]);
    var y = (u.auth || ":").split(":");
    if (a.user = y[0], a.password = y.splice(1).join(
      ":"
    ), a.port = u.port, u.protocol == "socket:") return a.host = decodeURI(u.pathname), a.database = u.query.db, a.client_encoding = u.query.encoding, a;
    a.host || (a.host = u.hostname);
    var d = u.pathname;
    if (!a.host && d && /^%2f/i.test(d)) {
      var v = d.split("/");
      a.host = decodeURIComponent(v[0]), d = v.splice(1).join("/");
    }
    switch (d && d.charAt(
      0
    ) === "/" && (d = d.slice(1) || null), a.database = d && decodeURI(d), (a.ssl === "true" || a.ssl === "1") && (a.ssl = !0), a.ssl === "0" && (a.ssl = !1), (a.sslcert || a.sslkey || a.sslrootcert || a.sslmode) && (a.ssl = {}), a.sslcert && (a.ssl.cert = r.readFileSync(a.sslcert).toString()), a.sslkey && (a.ssl.key = r.readFileSync(a.sslkey).toString()), a.sslrootcert && (a.ssl.ca = r.readFileSync(a.sslrootcert).toString()), a.sslmode) {
      case "disable": {
        a.ssl = !1;
        break;
      }
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        break;
      case "no-verify": {
        a.ssl.rejectUnauthorized = !1;
        break;
      }
    }
    return a;
  }
  m(n, "parse"), e.exports = n, n.parse = n;
}), Wr = te((s, e) => {
  W();
  var t = (gd(), ye(vl)), r = nr(), n = yd().parse, i = m(function(v, g, S) {
    return S === void 0 ? S = ee.env["PG" + v.toUpperCase()] : S === !1 || (S = ee.env[S]), g[v] || S || r[v];
  }, "val"), u = m(function() {
    switch (ee.env.PGSSLMODE) {
      case "disable":
        return !1;
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        return !0;
      case "no-verify":
        return { rejectUnauthorized: !1 };
    }
    return r.ssl;
  }, "readSSLConfigFromEnvironment"), a = m(function(v) {
    return "'" + ("" + v).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  }, "quoteParamValue"), f = m(function(v, g, S) {
    var c = g[S];
    c != null && v.push(S + "=" + a(c));
  }, "add"), y = class {
    constructor(g) {
      g = typeof g == "string" ? n(g) : g || {}, g.connectionString && (g = Object.assign({}, g, n(g.connectionString))), this.user = i("user", g), this.database = i("database", g), this.database === void 0 && (this.database = this.user), this.port = parseInt(i("port", g), 10), this.host = i("host", g), Object.defineProperty(this, "password", {
        configurable: !0,
        enumerable: !1,
        writable: !0,
        value: i("password", g)
      }), this.binary = i("binary", g), this.options = i("options", g), this.ssl = typeof g.ssl > "u" ? u() : g.ssl, typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = !0), this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: !1 }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: !1 }), this.client_encoding = i("client_encoding", g), this.replication = i("replication", g), this.isDomainSocket = !(this.host || "").indexOf("/"), this.application_name = i("application_name", g, "PGAPPNAME"), this.fallback_application_name = i("fallback_application_name", g, !1), this.statement_timeout = i("statement_timeout", g, !1), this.lock_timeout = i("lock_timeout", g, !1), this.idle_in_transaction_session_timeout = i("idle_in_transaction_session_timeout", g, !1), this.query_timeout = i("query_timeout", g, !1), g.connectionTimeoutMillis === void 0 ? this.connect_timeout = ee.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(g.connectionTimeoutMillis / 1e3), g.keepAlive === !1 ? this.keepalives = 0 : g.keepAlive === !0 && (this.keepalives = 1), typeof g.keepAliveInitialDelayMillis == "number" && (this.keepalives_idle = Math.floor(g.keepAliveInitialDelayMillis / 1e3));
    }
    getLibpqConnectionString(g) {
      var S = [];
      f(S, this, "user"), f(S, this, "password"), f(S, this, "port"), f(S, this, "application_name"), f(
        S,
        this,
        "fallback_application_name"
      ), f(S, this, "connect_timeout"), f(S, this, "options");
      var c = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
      if (f(S, c, "sslmode"), f(S, c, "sslca"), f(S, c, "sslkey"), f(S, c, "sslcert"), f(S, c, "sslrootcert"), this.database && S.push("dbname=" + a(this.database)), this.replication && S.push("replication=" + a(this.replication)), this.host && S.push("host=" + a(this.host)), this.isDomainSocket) return g(null, S.join(" "));
      this.client_encoding && S.push("client_encoding=" + a(this.client_encoding)), t.lookup(this.host, function(h, b) {
        return h ? g(h, null) : (S.push("hostaddr=" + a(b)), g(null, S.join(" ")));
      });
    }
  };
  m(y, "ConnectionParameters");
  var d = y;
  e.exports = d;
}), wd = te((s, e) => {
  W();
  var t = sr(), r = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, n = class {
    constructor(a, f) {
      this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = f, this.RowCtor = null, this.rowAsArray = a === "array", this.rowAsArray && (this.parseRow = this._parseRowAsArray);
    }
    addCommandComplete(a) {
      var f;
      a.text ? f = r.exec(a.text) : f = r.exec(a.command), f && (this.command = f[1], f[3] ? (this.oid = parseInt(
        f[2],
        10
      ), this.rowCount = parseInt(f[3], 10)) : f[2] && (this.rowCount = parseInt(f[2], 10)));
    }
    _parseRowAsArray(a) {
      for (var f = new Array(
        a.length
      ), y = 0, d = a.length; y < d; y++) {
        var v = a[y];
        v !== null ? f[y] = this._parsers[y](v) : f[y] = null;
      }
      return f;
    }
    parseRow(a) {
      for (var f = {}, y = 0, d = a.length; y < d; y++) {
        var v = a[y], g = this.fields[y].name;
        v !== null ? f[g] = this._parsers[y](
          v
        ) : f[g] = null;
      }
      return f;
    }
    addRow(a) {
      this.rows.push(a);
    }
    addFields(a) {
      this.fields = a, this.fields.length && (this._parsers = new Array(a.length));
      for (var f = 0; f < a.length; f++) {
        var y = a[f];
        this._types ? this._parsers[f] = this._types.getTypeParser(y.dataTypeID, y.format || "text") : this._parsers[f] = t.getTypeParser(y.dataTypeID, y.format || "text");
      }
    }
  };
  m(n, "Result");
  var i = n;
  e.exports = i;
}), bd = te((s, e) => {
  W();
  var { EventEmitter: t } = ot(), r = wd(), n = ir(), i = class extends t {
    constructor(f, y, d) {
      super(), f = n.normalizeQueryConfig(f, y, d), this.text = f.text, this.values = f.values, this.rows = f.rows, this.types = f.types, this.name = f.name, this.binary = f.binary, this.portal = f.portal || "", this.callback = f.callback, this._rowMode = f.rowMode, ee.domain && f.callback && (this.callback = ee.domain.bind(f.callback)), this._result = new r(this._rowMode, this.types), this._results = this._result, this.isPreparedStatement = !1, this._canceledDueToError = !1, this._promise = null;
    }
    requiresPreparation() {
      return this.name || this.rows ? !0 : !this.text || !this.values ? !1 : this.values.length > 0;
    }
    _checkForMultirow() {
      this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new r(this._rowMode, this.types), this._results.push(this._result));
    }
    handleRowDescription(f) {
      this._checkForMultirow(), this._result.addFields(f.fields), this._accumulateRows = this.callback || !this.listeners("row").length;
    }
    handleDataRow(f) {
      let y;
      if (!this._canceledDueToError) {
        try {
          y = this._result.parseRow(
            f.fields
          );
        } catch (d) {
          this._canceledDueToError = d;
          return;
        }
        this.emit("row", y, this._result), this._accumulateRows && this._result.addRow(y);
      }
    }
    handleCommandComplete(f, y) {
      this._checkForMultirow(), this._result.addCommandComplete(
        f
      ), this.rows && y.sync();
    }
    handleEmptyQuery(f) {
      this.rows && f.sync();
    }
    handleError(f, y) {
      if (this._canceledDueToError && (f = this._canceledDueToError, this._canceledDueToError = !1), this.callback) return this.callback(f);
      this.emit("error", f);
    }
    handleReadyForQuery(f) {
      if (this._canceledDueToError) return this.handleError(
        this._canceledDueToError,
        f
      );
      if (this.callback) try {
        this.callback(null, this._results);
      } catch (y) {
        ee.nextTick(() => {
          throw y;
        });
      }
      this.emit(
        "end",
        this._results
      );
    }
    submit(f) {
      if (typeof this.text != "string" && typeof this.name != "string") return new Error(
        "A query must have either text or a name. Supplying neither is unsupported."
      );
      let y = f.parsedStatements[this.name];
      return this.text && y && this.text !== y ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`) : this.values && !Array.isArray(this.values) ? new Error("Query values must be an array") : (this.requiresPreparation() ? this.prepare(f) : f.query(this.text), null);
    }
    hasBeenParsed(f) {
      return this.name && f.parsedStatements[this.name];
    }
    handlePortalSuspended(f) {
      this._getRows(f, this.rows);
    }
    _getRows(f, y) {
      f.execute({ portal: this.portal, rows: y }), y ? f.flush() : f.sync();
    }
    prepare(f) {
      this.isPreparedStatement = !0, this.hasBeenParsed(f) || f.parse({ text: this.text, name: this.name, types: this.types });
      try {
        f.bind({ portal: this.portal, statement: this.name, values: this.values, binary: this.binary, valueMapper: n.prepareValue });
      } catch (y) {
        this.handleError(y, f);
        return;
      }
      f.describe({ type: "P", name: this.portal || "" }), this._getRows(f, this.rows);
    }
    handleCopyInResponse(f) {
      f.sendCopyFail("No source stream defined");
    }
    handleCopyData(f, y) {
    }
  };
  m(i, "Query");
  var u = i;
  e.exports = u;
}), _l = te((s) => {
  W(), Object.defineProperty(s, "__esModule", { value: !0 }), s.NoticeMessage = s.DataRowMessage = s.CommandCompleteMessage = s.ReadyForQueryMessage = s.NotificationResponseMessage = s.BackendKeyDataMessage = s.AuthenticationMD5Password = s.ParameterStatusMessage = s.ParameterDescriptionMessage = s.RowDescriptionMessage = s.Field = s.CopyResponse = s.CopyDataMessage = s.DatabaseError = s.copyDone = s.emptyQuery = s.replicationStart = s.portalSuspended = s.noData = s.closeComplete = s.bindComplete = s.parseComplete = void 0, s.parseComplete = { name: "parseComplete", length: 5 }, s.bindComplete = { name: "bindComplete", length: 5 }, s.closeComplete = { name: "closeComplete", length: 5 }, s.noData = { name: "noData", length: 5 }, s.portalSuspended = { name: "portalSuspended", length: 5 }, s.replicationStart = { name: "replicationStart", length: 4 }, s.emptyQuery = { name: "emptyQuery", length: 4 }, s.copyDone = { name: "copyDone", length: 4 };
  var e = class extends Error {
    constructor(M, F, G) {
      super(M), this.length = F, this.name = G;
    }
  };
  m(e, "DatabaseError");
  var t = e;
  s.DatabaseError = t;
  var r = class {
    constructor(M, F) {
      this.length = M, this.chunk = F, this.name = "copyData";
    }
  };
  m(r, "CopyDataMessage");
  var n = r;
  s.CopyDataMessage = n;
  var i = class {
    constructor(M, F, G, Z) {
      this.length = M, this.name = F, this.binary = G, this.columnTypes = new Array(Z);
    }
  };
  m(i, "CopyResponse");
  var u = i;
  s.CopyResponse = u;
  var a = class {
    constructor(M, F, G, Z, ne, X, Ae) {
      this.name = M, this.tableID = F, this.columnID = G, this.dataTypeID = Z, this.dataTypeSize = ne, this.dataTypeModifier = X, this.format = Ae;
    }
  };
  m(a, "Field");
  var f = a;
  s.Field = f;
  var y = class {
    constructor(M, F) {
      this.length = M, this.fieldCount = F, this.name = "rowDescription", this.fields = new Array(this.fieldCount);
    }
  };
  m(y, "RowDescriptionMessage");
  var d = y;
  s.RowDescriptionMessage = d;
  var v = class {
    constructor(M, F) {
      this.length = M, this.parameterCount = F, this.name = "parameterDescription", this.dataTypeIDs = new Array(this.parameterCount);
    }
  };
  m(v, "ParameterDescriptionMessage");
  var g = v;
  s.ParameterDescriptionMessage = g;
  var S = class {
    constructor(M, F, G) {
      this.length = M, this.parameterName = F, this.parameterValue = G, this.name = "parameterStatus";
    }
  };
  m(S, "ParameterStatusMessage");
  var c = S;
  s.ParameterStatusMessage = c;
  var h = class {
    constructor(M, F) {
      this.length = M, this.salt = F, this.name = "authenticationMD5Password";
    }
  };
  m(h, "AuthenticationMD5Password");
  var b = h;
  s.AuthenticationMD5Password = b;
  var _ = class {
    constructor(M, F, G) {
      this.length = M, this.processID = F, this.secretKey = G, this.name = "backendKeyData";
    }
  };
  m(_, "BackendKeyDataMessage");
  var C = _;
  s.BackendKeyDataMessage = C;
  var A = class {
    constructor(M, F, G, Z) {
      this.length = M, this.processId = F, this.channel = G, this.payload = Z, this.name = "notification";
    }
  };
  m(A, "NotificationResponseMessage");
  var B = A;
  s.NotificationResponseMessage = B;
  var R = class {
    constructor(M, F) {
      this.length = M, this.status = F, this.name = "readyForQuery";
    }
  };
  m(R, "ReadyForQueryMessage");
  var E = R;
  s.ReadyForQueryMessage = E;
  var I = class {
    constructor(M, F) {
      this.length = M, this.text = F, this.name = "commandComplete";
    }
  };
  m(I, "CommandCompleteMessage");
  var N = I;
  s.CommandCompleteMessage = N;
  var T = class {
    constructor(M, F) {
      this.length = M, this.fields = F, this.name = "dataRow", this.fieldCount = F.length;
    }
  };
  m(T, "DataRowMessage");
  var $ = T;
  s.DataRowMessage = $;
  var D = class {
    constructor(M, F) {
      this.length = M, this.message = F, this.name = "notice";
    }
  };
  m(D, "NoticeMessage");
  var U = D;
  s.NoticeMessage = U;
}), vd = te((s) => {
  W(), Object.defineProperty(s, "__esModule", { value: !0 }), s.Writer = void 0;
  var e = class {
    constructor(n = 256) {
      this.size = n, this.offset = 5, this.headerPosition = 0, this.buffer = J.allocUnsafe(n);
    }
    ensure(n) {
      if (this.buffer.length - this.offset < n) {
        let i = this.buffer, u = i.length + (i.length >> 1) + n;
        this.buffer = J.allocUnsafe(u), i.copy(
          this.buffer
        );
      }
    }
    addInt32(n) {
      return this.ensure(4), this.buffer[this.offset++] = n >>> 24 & 255, this.buffer[this.offset++] = n >>> 16 & 255, this.buffer[this.offset++] = n >>> 8 & 255, this.buffer[this.offset++] = n >>> 0 & 255, this;
    }
    addInt16(n) {
      return this.ensure(2), this.buffer[this.offset++] = n >>> 8 & 255, this.buffer[this.offset++] = n >>> 0 & 255, this;
    }
    addCString(n) {
      if (!n) this.ensure(1);
      else {
        let i = J.byteLength(n);
        this.ensure(i + 1), this.buffer.write(n, this.offset, "utf-8"), this.offset += i;
      }
      return this.buffer[this.offset++] = 0, this;
    }
    addString(n = "") {
      let i = J.byteLength(n);
      return this.ensure(i), this.buffer.write(n, this.offset), this.offset += i, this;
    }
    add(n) {
      return this.ensure(
        n.length
      ), n.copy(this.buffer, this.offset), this.offset += n.length, this;
    }
    join(n) {
      if (n) {
        this.buffer[this.headerPosition] = n;
        let i = this.offset - (this.headerPosition + 1);
        this.buffer.writeInt32BE(i, this.headerPosition + 1);
      }
      return this.buffer.slice(n ? 0 : 5, this.offset);
    }
    flush(n) {
      let i = this.join(n);
      return this.offset = 5, this.headerPosition = 0, this.buffer = J.allocUnsafe(this.size), i;
    }
  };
  m(e, "Writer");
  var t = e;
  s.Writer = t;
}), Sd = te((s) => {
  W(), Object.defineProperty(s, "__esModule", { value: !0 }), s.serialize = void 0;
  var e = vd(), t = new e.Writer(), r = m((M) => {
    t.addInt16(3).addInt16(0);
    for (let Z of Object.keys(M)) t.addCString(
      Z
    ).addCString(M[Z]);
    t.addCString("client_encoding").addCString("UTF8");
    let F = t.addCString("").flush(), G = F.length + 4;
    return new e.Writer().addInt32(G).add(F).flush();
  }, "startup"), n = m(() => {
    let M = J.allocUnsafe(
      8
    );
    return M.writeInt32BE(8, 0), M.writeInt32BE(80877103, 4), M;
  }, "requestSsl"), i = m((M) => t.addCString(M).flush(
    112
  ), "password"), u = m(function(M, F) {
    return t.addCString(M).addInt32(J.byteLength(F)).addString(F), t.flush(112);
  }, "sendSASLInitialResponseMessage"), a = m(function(M) {
    return t.addString(M).flush(112);
  }, "sendSCRAMClientFinalMessage"), f = m((M) => t.addCString(M).flush(81), "query"), y = [], d = m((M) => {
    let F = M.name || "";
    F.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", F, F.length), console.error("This can cause conflicts and silent errors executing queries"));
    let G = M.types || y, Z = G.length, ne = t.addCString(F).addCString(M.text).addInt16(Z);
    for (let X = 0; X < Z; X++) ne.addInt32(G[X]);
    return t.flush(80);
  }, "parse"), v = new e.Writer(), g = m(function(M, F) {
    for (let G = 0; G < M.length; G++) {
      let Z = F ? F(M[G], G) : M[G];
      Z == null ? (t.addInt16(0), v.addInt32(-1)) : Z instanceof J ? (t.addInt16(
        1
      ), v.addInt32(Z.length), v.add(Z)) : (t.addInt16(0), v.addInt32(J.byteLength(Z)), v.addString(Z));
    }
  }, "writeValues"), S = m((M = {}) => {
    let F = M.portal || "", G = M.statement || "", Z = M.binary || !1, ne = M.values || y, X = ne.length;
    return t.addCString(F).addCString(G), t.addInt16(X), g(ne, M.valueMapper), t.addInt16(X), t.add(v.flush()), t.addInt16(Z ? 1 : 0), t.flush(66);
  }, "bind"), c = J.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]), h = m((M) => {
    if (!M || !M.portal && !M.rows) return c;
    let F = M.portal || "", G = M.rows || 0, Z = J.byteLength(F), ne = 4 + Z + 1 + 4, X = J.allocUnsafe(1 + ne);
    return X[0] = 69, X.writeInt32BE(ne, 1), X.write(F, 5, "utf-8"), X[Z + 5] = 0, X.writeUInt32BE(G, X.length - 4), X;
  }, "execute"), b = m(
    (M, F) => {
      let G = J.allocUnsafe(16);
      return G.writeInt32BE(16, 0), G.writeInt16BE(1234, 4), G.writeInt16BE(
        5678,
        6
      ), G.writeInt32BE(M, 8), G.writeInt32BE(F, 12), G;
    },
    "cancel"
  ), _ = m((M, F) => {
    let G = 4 + J.byteLength(F) + 1, Z = J.allocUnsafe(1 + G);
    return Z[0] = M, Z.writeInt32BE(G, 1), Z.write(F, 5, "utf-8"), Z[G] = 0, Z;
  }, "cstringMessage"), C = t.addCString("P").flush(68), A = t.addCString("S").flush(68), B = m((M) => M.name ? _(68, `${M.type}${M.name || ""}`) : M.type === "P" ? C : A, "describe"), R = m((M) => {
    let F = `${M.type}${M.name || ""}`;
    return _(67, F);
  }, "close"), E = m((M) => t.add(M).flush(100), "copyData"), I = m((M) => _(102, M), "copyFail"), N = m((M) => J.from([M, 0, 0, 0, 4]), "codeOnlyBuffer"), T = N(72), $ = N(83), D = N(88), U = N(99), V = {
    startup: r,
    password: i,
    requestSsl: n,
    sendSASLInitialResponseMessage: u,
    sendSCRAMClientFinalMessage: a,
    query: f,
    parse: d,
    bind: S,
    execute: h,
    describe: B,
    close: R,
    flush: m(
      () => T,
      "flush"
    ),
    sync: m(() => $, "sync"),
    end: m(() => D, "end"),
    copyData: E,
    copyDone: m(() => U, "copyDone"),
    copyFail: I,
    cancel: b
  };
  s.serialize = V;
}), _d = te((s) => {
  W(), Object.defineProperty(s, "__esModule", { value: !0 }), s.BufferReader = void 0;
  var e = J.allocUnsafe(0), t = class {
    constructor(i = 0) {
      this.offset = i, this.buffer = e, this.encoding = "utf-8";
    }
    setBuffer(i, u) {
      this.offset = i, this.buffer = u;
    }
    int16() {
      let i = this.buffer.readInt16BE(this.offset);
      return this.offset += 2, i;
    }
    byte() {
      let i = this.buffer[this.offset];
      return this.offset++, i;
    }
    int32() {
      let i = this.buffer.readInt32BE(
        this.offset
      );
      return this.offset += 4, i;
    }
    uint32() {
      let i = this.buffer.readUInt32BE(this.offset);
      return this.offset += 4, i;
    }
    string(i) {
      let u = this.buffer.toString(this.encoding, this.offset, this.offset + i);
      return this.offset += i, u;
    }
    cstring() {
      let i = this.offset, u = i;
      for (; this.buffer[u++] !== 0; ) ;
      return this.offset = u, this.buffer.toString(this.encoding, i, u - 1);
    }
    bytes(i) {
      let u = this.buffer.slice(this.offset, this.offset + i);
      return this.offset += i, u;
    }
  };
  m(t, "BufferReader");
  var r = t;
  s.BufferReader = r;
}), Ed = te((s) => {
  W(), Object.defineProperty(s, "__esModule", { value: !0 }), s.Parser = void 0;
  var e = _l(), t = _d(), r = 1, n = 4, i = r + n, u = J.allocUnsafe(0), a = class {
    constructor(d) {
      if (this.buffer = u, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new t.BufferReader(), (d == null ? void 0 : d.mode) === "binary") throw new Error("Binary mode not supported yet");
      this.mode = (d == null ? void 0 : d.mode) || "text";
    }
    parse(d, v) {
      this.mergeBuffer(d);
      let g = this.bufferOffset + this.bufferLength, S = this.bufferOffset;
      for (; S + i <= g; ) {
        let c = this.buffer[S], h = this.buffer.readUInt32BE(
          S + r
        ), b = r + h;
        if (b + S <= g) {
          let _ = this.handlePacket(S + i, c, h, this.buffer);
          v(_), S += b;
        } else break;
      }
      S === g ? (this.buffer = u, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = g - S, this.bufferOffset = S);
    }
    mergeBuffer(d) {
      if (this.bufferLength > 0) {
        let v = this.bufferLength + d.byteLength;
        if (v + this.bufferOffset > this.buffer.byteLength) {
          let g;
          if (v <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) g = this.buffer;
          else {
            let S = this.buffer.byteLength * 2;
            for (; v >= S; ) S *= 2;
            g = J.allocUnsafe(S);
          }
          this.buffer.copy(g, 0, this.bufferOffset, this.bufferOffset + this.bufferLength), this.buffer = g, this.bufferOffset = 0;
        }
        d.copy(this.buffer, this.bufferOffset + this.bufferLength), this.bufferLength = v;
      } else this.buffer = d, this.bufferOffset = 0, this.bufferLength = d.byteLength;
    }
    handlePacket(d, v, g, S) {
      switch (v) {
        case 50:
          return e.bindComplete;
        case 49:
          return e.parseComplete;
        case 51:
          return e.closeComplete;
        case 110:
          return e.noData;
        case 115:
          return e.portalSuspended;
        case 99:
          return e.copyDone;
        case 87:
          return e.replicationStart;
        case 73:
          return e.emptyQuery;
        case 68:
          return this.parseDataRowMessage(d, g, S);
        case 67:
          return this.parseCommandCompleteMessage(
            d,
            g,
            S
          );
        case 90:
          return this.parseReadyForQueryMessage(d, g, S);
        case 65:
          return this.parseNotificationMessage(
            d,
            g,
            S
          );
        case 82:
          return this.parseAuthenticationResponse(d, g, S);
        case 83:
          return this.parseParameterStatusMessage(
            d,
            g,
            S
          );
        case 75:
          return this.parseBackendKeyData(d, g, S);
        case 69:
          return this.parseErrorMessage(d, g, S, "error");
        case 78:
          return this.parseErrorMessage(d, g, S, "notice");
        case 84:
          return this.parseRowDescriptionMessage(
            d,
            g,
            S
          );
        case 116:
          return this.parseParameterDescriptionMessage(d, g, S);
        case 71:
          return this.parseCopyInMessage(
            d,
            g,
            S
          );
        case 72:
          return this.parseCopyOutMessage(d, g, S);
        case 100:
          return this.parseCopyData(d, g, S);
        default:
          return new e.DatabaseError("received invalid response: " + v.toString(16), g, "error");
      }
    }
    parseReadyForQueryMessage(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.string(1);
      return new e.ReadyForQueryMessage(v, S);
    }
    parseCommandCompleteMessage(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.cstring();
      return new e.CommandCompleteMessage(v, S);
    }
    parseCopyData(d, v, g) {
      let S = g.slice(d, d + (v - 4));
      return new e.CopyDataMessage(v, S);
    }
    parseCopyInMessage(d, v, g) {
      return this.parseCopyMessage(
        d,
        v,
        g,
        "copyInResponse"
      );
    }
    parseCopyOutMessage(d, v, g) {
      return this.parseCopyMessage(d, v, g, "copyOutResponse");
    }
    parseCopyMessage(d, v, g, S) {
      this.reader.setBuffer(d, g);
      let c = this.reader.byte() !== 0, h = this.reader.int16(), b = new e.CopyResponse(v, S, c, h);
      for (let _ = 0; _ < h; _++) b.columnTypes[_] = this.reader.int16();
      return b;
    }
    parseNotificationMessage(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.int32(), c = this.reader.cstring(), h = this.reader.cstring();
      return new e.NotificationResponseMessage(v, S, c, h);
    }
    parseRowDescriptionMessage(d, v, g) {
      this.reader.setBuffer(
        d,
        g
      );
      let S = this.reader.int16(), c = new e.RowDescriptionMessage(v, S);
      for (let h = 0; h < S; h++) c.fields[h] = this.parseField();
      return c;
    }
    parseField() {
      let d = this.reader.cstring(), v = this.reader.uint32(), g = this.reader.int16(), S = this.reader.uint32(), c = this.reader.int16(), h = this.reader.int32(), b = this.reader.int16() === 0 ? "text" : "binary";
      return new e.Field(d, v, g, S, c, h, b);
    }
    parseParameterDescriptionMessage(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.int16(), c = new e.ParameterDescriptionMessage(v, S);
      for (let h = 0; h < S; h++)
        c.dataTypeIDs[h] = this.reader.int32();
      return c;
    }
    parseDataRowMessage(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.int16(), c = new Array(S);
      for (let h = 0; h < S; h++) {
        let b = this.reader.int32();
        c[h] = b === -1 ? null : this.reader.string(b);
      }
      return new e.DataRowMessage(v, c);
    }
    parseParameterStatusMessage(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.cstring(), c = this.reader.cstring();
      return new e.ParameterStatusMessage(
        v,
        S,
        c
      );
    }
    parseBackendKeyData(d, v, g) {
      this.reader.setBuffer(d, g);
      let S = this.reader.int32(), c = this.reader.int32();
      return new e.BackendKeyDataMessage(v, S, c);
    }
    parseAuthenticationResponse(d, v, g) {
      this.reader.setBuffer(
        d,
        g
      );
      let S = this.reader.int32(), c = { name: "authenticationOk", length: v };
      switch (S) {
        case 0:
          break;
        case 3:
          c.length === 8 && (c.name = "authenticationCleartextPassword");
          break;
        case 5:
          if (c.length === 12) {
            c.name = "authenticationMD5Password";
            let h = this.reader.bytes(4);
            return new e.AuthenticationMD5Password(v, h);
          }
          break;
        case 10:
          {
            c.name = "authenticationSASL", c.mechanisms = [];
            let h;
            do
              h = this.reader.cstring(), h && c.mechanisms.push(h);
            while (h);
          }
          break;
        case 11:
          c.name = "authenticationSASLContinue", c.data = this.reader.string(v - 8);
          break;
        case 12:
          c.name = "authenticationSASLFinal", c.data = this.reader.string(v - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + S);
      }
      return c;
    }
    parseErrorMessage(d, v, g, S) {
      this.reader.setBuffer(d, g);
      let c = {}, h = this.reader.string(1);
      for (; h !== "\0"; ) c[h] = this.reader.cstring(), h = this.reader.string(1);
      let b = c.M, _ = S === "notice" ? new e.NoticeMessage(v, b) : new e.DatabaseError(b, v, S);
      return _.severity = c.S, _.code = c.C, _.detail = c.D, _.hint = c.H, _.position = c.P, _.internalPosition = c.p, _.internalQuery = c.q, _.where = c.W, _.schema = c.s, _.table = c.t, _.column = c.c, _.dataType = c.d, _.constraint = c.n, _.file = c.F, _.line = c.L, _.routine = c.R, _;
    }
  };
  m(a, "Parser");
  var f = a;
  s.Parser = f;
}), El = te((s) => {
  W(), Object.defineProperty(s, "__esModule", { value: !0 }), s.DatabaseError = s.serialize = s.parse = void 0;
  var e = _l();
  Object.defineProperty(s, "DatabaseError", { enumerable: !0, get: m(
    function() {
      return e.DatabaseError;
    },
    "get"
  ) });
  var t = Sd();
  Object.defineProperty(s, "serialize", {
    enumerable: !0,
    get: m(function() {
      return t.serialize;
    }, "get")
  });
  var r = Ed();
  function n(i, u) {
    let a = new r.Parser();
    return i.on("data", (f) => a.parse(f, u)), new Promise((f) => i.on("end", () => f()));
  }
  m(n, "parse"), s.parse = n;
}), Tl = {};
De(Tl, { connect: () => Cl });
function Cl({ socket: s, servername: e }) {
  return s.startTls(e), s;
}
var Td = Ce(
  () => {
    W(), m(Cl, "connect");
  }
), Al = te((s, e) => {
  W();
  var t = (It(), ye(el)), r = ot().EventEmitter, { parse: n, serialize: i } = El(), u = i.flush(), a = i.sync(), f = i.end(), y = class extends r {
    constructor(g) {
      super(), g = g || {}, this.stream = g.stream || new t.Socket(), this._keepAlive = g.keepAlive, this._keepAliveInitialDelayMillis = g.keepAliveInitialDelayMillis, this.lastBuffer = !1, this.parsedStatements = {}, this.ssl = g.ssl || !1, this._ending = !1, this._emitMessage = !1;
      var S = this;
      this.on("newListener", function(c) {
        c === "message" && (S._emitMessage = !0);
      });
    }
    connect(g, S) {
      var c = this;
      this._connecting = !0, this.stream.setNoDelay(!0), this.stream.connect(g, S), this.stream.once("connect", function() {
        c._keepAlive && c.stream.setKeepAlive(!0, c._keepAliveInitialDelayMillis), c.emit("connect");
      });
      let h = m(function(b) {
        c._ending && (b.code === "ECONNRESET" || b.code === "EPIPE") || c.emit("error", b);
      }, "reportStreamError");
      if (this.stream.on("error", h), this.stream.on("close", function() {
        c.emit("end");
      }), !this.ssl) return this.attachListeners(
        this.stream
      );
      this.stream.once("data", function(b) {
        var _ = b.toString("utf8");
        switch (_) {
          case "S":
            break;
          case "N":
            return c.stream.end(), c.emit("error", new Error("The server does not support SSL connections"));
          default:
            return c.stream.end(), c.emit("error", new Error("There was an error establishing an SSL connection"));
        }
        var C = (Td(), ye(Tl));
        let A = { socket: c.stream };
        c.ssl !== !0 && (Object.assign(A, c.ssl), "key" in c.ssl && (A.key = c.ssl.key)), t.isIP(S) === 0 && (A.servername = S);
        try {
          c.stream = C.connect(A);
        } catch (B) {
          return c.emit(
            "error",
            B
          );
        }
        c.attachListeners(c.stream), c.stream.on("error", h), c.emit("sslconnect");
      });
    }
    attachListeners(g) {
      g.on(
        "end",
        () => {
          this.emit("end");
        }
      ), n(g, (S) => {
        var c = S.name === "error" ? "errorMessage" : S.name;
        this._emitMessage && this.emit("message", S), this.emit(c, S);
      });
    }
    requestSsl() {
      this.stream.write(i.requestSsl());
    }
    startup(g) {
      this.stream.write(i.startup(g));
    }
    cancel(g, S) {
      this._send(i.cancel(g, S));
    }
    password(g) {
      this._send(i.password(g));
    }
    sendSASLInitialResponseMessage(g, S) {
      this._send(i.sendSASLInitialResponseMessage(g, S));
    }
    sendSCRAMClientFinalMessage(g) {
      this._send(i.sendSCRAMClientFinalMessage(
        g
      ));
    }
    _send(g) {
      return this.stream.writable ? this.stream.write(g) : !1;
    }
    query(g) {
      this._send(i.query(g));
    }
    parse(g) {
      this._send(i.parse(g));
    }
    bind(g) {
      this._send(i.bind(g));
    }
    execute(g) {
      this._send(i.execute(g));
    }
    flush() {
      this.stream.writable && this.stream.write(u);
    }
    sync() {
      this._ending = !0, this._send(u), this._send(a);
    }
    ref() {
      this.stream.ref();
    }
    unref() {
      this.stream.unref();
    }
    end() {
      if (this._ending = !0, !this._connecting || !this.stream.writable) {
        this.stream.end();
        return;
      }
      return this.stream.write(f, () => {
        this.stream.end();
      });
    }
    close(g) {
      this._send(i.close(g));
    }
    describe(g) {
      this._send(i.describe(g));
    }
    sendCopyFromChunk(g) {
      this._send(i.copyData(g));
    }
    endCopyFrom() {
      this._send(i.copyDone());
    }
    sendCopyFail(g) {
      this._send(i.copyFail(g));
    }
  };
  m(y, "Connection");
  var d = y;
  e.exports = d;
}), Cd = te((s, e) => {
  W();
  var t = ot().EventEmitter;
  or(), ye(Lt);
  var r = ir(), n = hd(), i = md(), u = Fr(), a = Wr(), f = bd(), y = nr(), d = Al(), v = class extends t {
    constructor(c) {
      super(), this.connectionParameters = new a(c), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(
        this,
        "password",
        { configurable: !0, enumerable: !1, writable: !0, value: this.connectionParameters.password }
      ), this.replication = this.connectionParameters.replication;
      var h = c || {};
      this._Promise = h.Promise || rr.Promise, this._types = new u(h.types), this._ending = !1, this._connecting = !1, this._connected = !1, this._connectionError = !1, this._queryable = !0, this.connection = h.connection || new d({ stream: h.stream, ssl: this.connectionParameters.ssl, keepAlive: h.keepAlive || !1, keepAliveInitialDelayMillis: h.keepAliveInitialDelayMillis || 0, encoding: this.connectionParameters.client_encoding || "utf8" }), this.queryQueue = [], this.binary = h.binary || y.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || !1, this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: !1 }), this._connectionTimeoutMillis = h.connectionTimeoutMillis || 0;
    }
    _errorAllQueries(c) {
      let h = m((b) => {
        ee.nextTick(() => {
          b.handleError(c, this.connection);
        });
      }, "enqueueError");
      this.activeQuery && (h(this.activeQuery), this.activeQuery = null), this.queryQueue.forEach(h), this.queryQueue.length = 0;
    }
    _connect(c) {
      var h = this, b = this.connection;
      if (this._connectionCallback = c, this._connecting || this._connected) {
        let _ = new Error("Client has already been connected. You cannot reuse a client.");
        ee.nextTick(
          () => {
            c(_);
          }
        );
        return;
      }
      this._connecting = !0, this.connectionTimeoutHandle, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
        b._ending = !0, b.stream.destroy(new Error("timeout expired"));
      }, this._connectionTimeoutMillis)), this.host && this.host.indexOf("/") === 0 ? b.connect(this.host + "/.s.PGSQL." + this.port) : b.connect(this.port, this.host), b.on("connect", function() {
        h.ssl ? b.requestSsl() : b.startup(h.getStartupConf());
      }), b.on("sslconnect", function() {
        b.startup(h.getStartupConf());
      }), this._attachListeners(
        b
      ), b.once("end", () => {
        let _ = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
        clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(_), this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(_) : this._handleErrorEvent(_) : this._connectionError || this._handleErrorEvent(_)), ee.nextTick(() => {
          this.emit("end");
        });
      });
    }
    connect(c) {
      if (c) {
        this._connect(c);
        return;
      }
      return new this._Promise((h, b) => {
        this._connect((_) => {
          _ ? b(_) : h();
        });
      });
    }
    _attachListeners(c) {
      c.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)), c.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)), c.on("authenticationSASL", this._handleAuthSASL.bind(this)), c.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)), c.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)), c.on("backendKeyData", this._handleBackendKeyData.bind(this)), c.on("error", this._handleErrorEvent.bind(this)), c.on("errorMessage", this._handleErrorMessage.bind(this)), c.on("readyForQuery", this._handleReadyForQuery.bind(this)), c.on("notice", this._handleNotice.bind(this)), c.on("rowDescription", this._handleRowDescription.bind(this)), c.on("dataRow", this._handleDataRow.bind(this)), c.on("portalSuspended", this._handlePortalSuspended.bind(
        this
      )), c.on("emptyQuery", this._handleEmptyQuery.bind(this)), c.on("commandComplete", this._handleCommandComplete.bind(this)), c.on("parseComplete", this._handleParseComplete.bind(this)), c.on("copyInResponse", this._handleCopyInResponse.bind(this)), c.on("copyData", this._handleCopyData.bind(this)), c.on("notification", this._handleNotification.bind(this));
    }
    _checkPgPass(c) {
      let h = this.connection;
      typeof this.password == "function" ? this._Promise.resolve().then(() => this.password()).then((b) => {
        if (b !== void 0) {
          if (typeof b != "string") {
            h.emit("error", new TypeError(
              "Password must be a string"
            ));
            return;
          }
          this.connectionParameters.password = this.password = b;
        } else this.connectionParameters.password = this.password = null;
        c();
      }).catch((b) => {
        h.emit("error", b);
      }) : this.password !== null ? c() : i(
        this.connectionParameters,
        (b) => {
          b !== void 0 && (this.connectionParameters.password = this.password = b), c();
        }
      );
    }
    _handleAuthCleartextPassword(c) {
      this._checkPgPass(() => {
        this.connection.password(this.password);
      });
    }
    _handleAuthMD5Password(c) {
      this._checkPgPass(
        () => {
          let h = r.postgresMd5PasswordHash(this.user, this.password, c.salt);
          this.connection.password(h);
        }
      );
    }
    _handleAuthSASL(c) {
      this._checkPgPass(() => {
        this.saslSession = n.startSession(c.mechanisms), this.connection.sendSASLInitialResponseMessage(
          this.saslSession.mechanism,
          this.saslSession.response
        );
      });
    }
    _handleAuthSASLContinue(c) {
      n.continueSession(
        this.saslSession,
        this.password,
        c.data
      ), this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
    }
    _handleAuthSASLFinal(c) {
      n.finalizeSession(this.saslSession, c.data), this.saslSession = null;
    }
    _handleBackendKeyData(c) {
      this.processID = c.processID, this.secretKey = c.secretKey;
    }
    _handleReadyForQuery(c) {
      this._connecting && (this._connecting = !1, this._connected = !0, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit("connect"));
      let { activeQuery: h } = this;
      this.activeQuery = null, this.readyForQuery = !0, h && h.handleReadyForQuery(this.connection), this._pulseQueryQueue();
    }
    _handleErrorWhileConnecting(c) {
      if (!this._connectionError) {
        if (this._connectionError = !0, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback) return this._connectionCallback(c);
        this.emit("error", c);
      }
    }
    _handleErrorEvent(c) {
      if (this._connecting) return this._handleErrorWhileConnecting(c);
      this._queryable = !1, this._errorAllQueries(c), this.emit("error", c);
    }
    _handleErrorMessage(c) {
      if (this._connecting) return this._handleErrorWhileConnecting(c);
      let h = this.activeQuery;
      if (!h) {
        this._handleErrorEvent(c);
        return;
      }
      this.activeQuery = null, h.handleError(
        c,
        this.connection
      );
    }
    _handleRowDescription(c) {
      this.activeQuery.handleRowDescription(c);
    }
    _handleDataRow(c) {
      this.activeQuery.handleDataRow(c);
    }
    _handlePortalSuspended(c) {
      this.activeQuery.handlePortalSuspended(this.connection);
    }
    _handleEmptyQuery(c) {
      this.activeQuery.handleEmptyQuery(this.connection);
    }
    _handleCommandComplete(c) {
      this.activeQuery.handleCommandComplete(c, this.connection);
    }
    _handleParseComplete(c) {
      this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text);
    }
    _handleCopyInResponse(c) {
      this.activeQuery.handleCopyInResponse(this.connection);
    }
    _handleCopyData(c) {
      this.activeQuery.handleCopyData(
        c,
        this.connection
      );
    }
    _handleNotification(c) {
      this.emit("notification", c);
    }
    _handleNotice(c) {
      this.emit("notice", c);
    }
    getStartupConf() {
      var c = this.connectionParameters, h = { user: c.user, database: c.database }, b = c.application_name || c.fallback_application_name;
      return b && (h.application_name = b), c.replication && (h.replication = "" + c.replication), c.statement_timeout && (h.statement_timeout = String(parseInt(c.statement_timeout, 10))), c.lock_timeout && (h.lock_timeout = String(parseInt(c.lock_timeout, 10))), c.idle_in_transaction_session_timeout && (h.idle_in_transaction_session_timeout = String(parseInt(c.idle_in_transaction_session_timeout, 10))), c.options && (h.options = c.options), h;
    }
    cancel(c, h) {
      if (c.activeQuery === h) {
        var b = this.connection;
        this.host && this.host.indexOf("/") === 0 ? b.connect(this.host + "/.s.PGSQL." + this.port) : b.connect(this.port, this.host), b.on("connect", function() {
          b.cancel(
            c.processID,
            c.secretKey
          );
        });
      } else c.queryQueue.indexOf(h) !== -1 && c.queryQueue.splice(c.queryQueue.indexOf(h), 1);
    }
    setTypeParser(c, h, b) {
      return this._types.setTypeParser(c, h, b);
    }
    getTypeParser(c, h) {
      return this._types.getTypeParser(c, h);
    }
    escapeIdentifier(c) {
      return '"' + c.replace(/"/g, '""') + '"';
    }
    escapeLiteral(c) {
      for (var h = !1, b = "'", _ = 0; _ < c.length; _++) {
        var C = c[_];
        C === "'" ? b += C + C : C === "\\" ? (b += C + C, h = !0) : b += C;
      }
      return b += "'", h === !0 && (b = " E" + b), b;
    }
    _pulseQueryQueue() {
      if (this.readyForQuery === !0) if (this.activeQuery = this.queryQueue.shift(), this.activeQuery) {
        this.readyForQuery = !1, this.hasExecuted = !0;
        let c = this.activeQuery.submit(this.connection);
        c && ee.nextTick(() => {
          this.activeQuery.handleError(c, this.connection), this.readyForQuery = !0, this._pulseQueryQueue();
        });
      } else this.hasExecuted && (this.activeQuery = null, this.emit("drain"));
    }
    query(c, h, b) {
      var _, C, A, B, R;
      if (c == null) throw new TypeError(
        "Client was passed a null or undefined query"
      );
      return typeof c.submit == "function" ? (A = c.query_timeout || this.connectionParameters.query_timeout, C = _ = c, typeof h == "function" && (_.callback = _.callback || h)) : (A = this.connectionParameters.query_timeout, _ = new f(c, h, b), _.callback || (C = new this._Promise((E, I) => {
        _.callback = (N, T) => N ? I(N) : E(T);
      }))), A && (R = _.callback, B = setTimeout(() => {
        var E = new Error("Query read timeout");
        ee.nextTick(
          () => {
            _.handleError(E, this.connection);
          }
        ), R(E), _.callback = () => {
        };
        var I = this.queryQueue.indexOf(_);
        I > -1 && this.queryQueue.splice(I, 1), this._pulseQueryQueue();
      }, A), _.callback = (E, I) => {
        clearTimeout(B), R(E, I);
      }), this.binary && !_.binary && (_.binary = !0), _._result && !_._result._types && (_._result._types = this._types), this._queryable ? this._ending ? (ee.nextTick(() => {
        _.handleError(new Error("Client was closed and is not queryable"), this.connection);
      }), C) : (this.queryQueue.push(_), this._pulseQueryQueue(), C) : (ee.nextTick(() => {
        _.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
      }), C);
    }
    ref() {
      this.connection.ref();
    }
    unref() {
      this.connection.unref();
    }
    end(c) {
      if (this._ending = !0, !this.connection._connecting) if (c) c();
      else return this._Promise.resolve();
      if (this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), c) this.connection.once("end", c);
      else return new this._Promise((h) => {
        this.connection.once("end", h);
      });
    }
  };
  m(v, "Client");
  var g = v;
  g.Query = f, e.exports = g;
}), Ad = te((s, e) => {
  W();
  var t = ot().EventEmitter, r = m(function() {
  }, "NOOP"), n = m((c, h) => {
    let b = c.findIndex(h);
    return b === -1 ? void 0 : c.splice(b, 1)[0];
  }, "removeWhere"), i = class {
    constructor(h, b, _) {
      this.client = h, this.idleListener = b, this.timeoutId = _;
    }
  };
  m(i, "IdleItem");
  var u = i, a = class {
    constructor(h) {
      this.callback = h;
    }
  };
  m(a, "PendingItem");
  var f = a;
  function y() {
    throw new Error("Release called on client which has already been released to the pool.");
  }
  m(y, "throwOnDoubleRelease");
  function d(c, h) {
    if (h)
      return { callback: h, result: void 0 };
    let b, _, C = m(function(B, R) {
      B ? b(B) : _(R);
    }, "cb"), A = new c(function(B, R) {
      _ = B, b = R;
    }).catch((B) => {
      throw Error.captureStackTrace(B), B;
    });
    return { callback: C, result: A };
  }
  m(d, "promisify");
  function v(c, h) {
    return m(function b(_) {
      _.client = h, h.removeListener("error", b), h.on("error", () => {
        c.log(
          "additional client error after disconnection due to error",
          _
        );
      }), c._remove(h), c.emit("error", _, h);
    }, "idleListener");
  }
  m(v, "makeIdleListener");
  var g = class extends t {
    constructor(h, b) {
      super(), this.options = Object.assign({}, h), h != null && "password" in h && Object.defineProperty(this.options, "password", {
        configurable: !0,
        enumerable: !1,
        writable: !0,
        value: h.password
      }), h != null && h.ssl && h.ssl.key && Object.defineProperty(this.options.ssl, "key", { enumerable: !1 }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.min = this.options.min || 0, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || !1, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
      }, this.Client = this.options.Client || b || ar().Client, this.Promise = this.options.Promise || rr.Promise, typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = !1, this.ended = !1;
    }
    _isFull() {
      return this._clients.length >= this.options.max;
    }
    _isAboveMin() {
      return this._clients.length > this.options.min;
    }
    _pulseQueue() {
      if (this.log("pulse queue"), this.ended) {
        this.log("pulse queue ended");
        return;
      }
      if (this.ending) {
        this.log("pulse queue on ending"), this._idle.length && this._idle.slice().map((b) => {
          this._remove(b.client);
        }), this._clients.length || (this.ended = !0, this._endCallback());
        return;
      }
      if (!this._pendingQueue.length) {
        this.log("no queued requests");
        return;
      }
      if (!this._idle.length && this._isFull()) return;
      let h = this._pendingQueue.shift();
      if (this._idle.length) {
        let b = this._idle.pop();
        clearTimeout(
          b.timeoutId
        );
        let _ = b.client;
        _.ref && _.ref();
        let C = b.idleListener;
        return this._acquireClient(_, h, C, !1);
      }
      if (!this._isFull()) return this.newClient(h);
      throw new Error("unexpected condition");
    }
    _remove(h) {
      let b = n(
        this._idle,
        (_) => _.client === h
      );
      b !== void 0 && clearTimeout(b.timeoutId), this._clients = this._clients.filter(
        (_) => _ !== h
      ), h.end(), this.emit("remove", h);
    }
    connect(h) {
      if (this.ending) {
        let C = new Error("Cannot use a pool after calling end on the pool");
        return h ? h(C) : this.Promise.reject(C);
      }
      let b = d(this.Promise, h), _ = b.result;
      if (this._isFull() || this._idle.length) {
        if (this._idle.length && ee.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis) return this._pendingQueue.push(new f(b.callback)), _;
        let C = m((R, E, I) => {
          clearTimeout(B), b.callback(R, E, I);
        }, "queueCallback"), A = new f(C), B = setTimeout(() => {
          n(
            this._pendingQueue,
            (R) => R.callback === C
          ), A.timedOut = !0, b.callback(new Error("timeout exceeded when trying to connect"));
        }, this.options.connectionTimeoutMillis);
        return B.unref && B.unref(), this._pendingQueue.push(A), _;
      }
      return this.newClient(new f(b.callback)), _;
    }
    newClient(h) {
      let b = new this.Client(this.options);
      this._clients.push(
        b
      );
      let _ = v(this, b);
      this.log("checking client timeout");
      let C, A = !1;
      this.options.connectionTimeoutMillis && (C = setTimeout(() => {
        this.log("ending client due to timeout"), A = !0, b.connection ? b.connection.stream.destroy() : b.end();
      }, this.options.connectionTimeoutMillis)), this.log("connecting new client"), b.connect((B) => {
        if (C && clearTimeout(C), b.on("error", _), B) this.log("client failed to connect", B), this._clients = this._clients.filter((R) => R !== b), A && (B = new Error("Connection terminated due to connection timeout", { cause: B })), this._pulseQueue(), h.timedOut || h.callback(B, void 0, r);
        else {
          if (this.log("new client connected"), this.options.maxLifetimeSeconds !== 0) {
            let R = setTimeout(() => {
              this.log("ending client due to expired lifetime"), this._expired.add(b), this._idle.findIndex((E) => E.client === b) !== -1 && this._acquireClient(
                b,
                new f((E, I, N) => N()),
                _,
                !1
              );
            }, this.options.maxLifetimeSeconds * 1e3);
            R.unref(), b.once("end", () => clearTimeout(R));
          }
          return this._acquireClient(b, h, _, !0);
        }
      });
    }
    _acquireClient(h, b, _, C) {
      C && this.emit("connect", h), this.emit("acquire", h), h.release = this._releaseOnce(h, _), h.removeListener("error", _), b.timedOut ? C && this.options.verify ? this.options.verify(h, h.release) : h.release() : C && this.options.verify ? this.options.verify(h, (A) => {
        if (A) return h.release(A), b.callback(A, void 0, r);
        b.callback(void 0, h, h.release);
      }) : b.callback(void 0, h, h.release);
    }
    _releaseOnce(h, b) {
      let _ = !1;
      return (C) => {
        _ && y(), _ = !0, this._release(h, b, C);
      };
    }
    _release(h, b, _) {
      if (h.on("error", b), h._poolUseCount = (h._poolUseCount || 0) + 1, this.emit("release", _, h), _ || this.ending || !h._queryable || h._ending || h._poolUseCount >= this.options.maxUses) {
        h._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(h), this._pulseQueue();
        return;
      }
      if (this._expired.has(h)) {
        this.log("remove expired client"), this._expired.delete(h), this._remove(h), this._pulseQueue();
        return;
      }
      let C;
      this.options.idleTimeoutMillis && this._isAboveMin() && (C = setTimeout(() => {
        this.log("remove idle client"), this._remove(h);
      }, this.options.idleTimeoutMillis), this.options.allowExitOnIdle && C.unref()), this.options.allowExitOnIdle && h.unref(), this._idle.push(new u(
        h,
        b,
        C
      )), this._pulseQueue();
    }
    query(h, b, _) {
      if (typeof h == "function") {
        let A = d(this.Promise, h);
        return kr(function() {
          return A.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
        }), A.result;
      }
      typeof b == "function" && (_ = b, b = void 0);
      let C = d(this.Promise, _);
      return _ = C.callback, this.connect((A, B) => {
        if (A) return _(A);
        let R = !1, E = m((I) => {
          R || (R = !0, B.release(I), _(I));
        }, "onError");
        B.once("error", E), this.log("dispatching query");
        try {
          B.query(h, b, (I, N) => {
            if (this.log("query dispatched"), B.removeListener(
              "error",
              E
            ), !R) return R = !0, B.release(I), I ? _(I) : _(void 0, N);
          });
        } catch (I) {
          return B.release(I), _(I);
        }
      }), C.result;
    }
    end(h) {
      if (this.log("ending"), this.ending) {
        let _ = new Error("Called end on pool more than once");
        return h ? h(_) : this.Promise.reject(_);
      }
      this.ending = !0;
      let b = d(this.Promise, h);
      return this._endCallback = b.callback, this._pulseQueue(), b.result;
    }
    get waitingCount() {
      return this._pendingQueue.length;
    }
    get idleCount() {
      return this._idle.length;
    }
    get expiredCount() {
      return this._clients.reduce((h, b) => h + (this._expired.has(b) ? 1 : 0), 0);
    }
    get totalCount() {
      return this._clients.length;
    }
  };
  m(g, "Pool");
  var S = g;
  e.exports = S;
}), Pl = {};
De(Pl, { default: () => Nl });
var Nl, Pd = Ce(() => {
  W(), Nl = {};
}), Nd = te((s, e) => {
  e.exports = { name: "pg", version: "8.8.0", description: "PostgreSQL client - pure javascript & libpq with the same API", keywords: [
    "database",
    "libpq",
    "pg",
    "postgre",
    "postgres",
    "postgresql",
    "rdbms"
  ], homepage: "https://github.com/brianc/node-postgres", repository: { type: "git", url: "git://github.com/brianc/node-postgres.git", directory: "packages/pg" }, author: "Brian Carlson <brian.m.carlson@gmail.com>", main: "./lib", dependencies: { "buffer-writer": "2.0.0", "packet-reader": "1.0.0", "pg-connection-string": "^2.5.0", "pg-pool": "^3.5.2", "pg-protocol": "^1.5.0", "pg-types": "^2.1.0", pgpass: "1.x" }, devDependencies: {
    async: "2.6.4",
    bluebird: "3.5.2",
    co: "4.6.0",
    "pg-copy-streams": "0.3.0"
  }, peerDependencies: { "pg-native": ">=3.0.1" }, peerDependenciesMeta: { "pg-native": { optional: !0 } }, scripts: { test: "make test-all" }, files: ["lib", "SPONSORS.md"], license: "MIT", engines: { node: ">= 8.0.0" }, gitHead: "c99fb2c127ddf8d712500db2c7b9a5491a178655" };
}), xd = te((s, e) => {
  W();
  var t = ot().EventEmitter, r = (or(), ye(Lt)), n = ir(), i = e.exports = function(a, f, y) {
    t.call(this), a = n.normalizeQueryConfig(a, f, y), this.text = a.text, this.values = a.values, this.name = a.name, this.callback = a.callback, this.state = "new", this._arrayMode = a.rowMode === "array", this._emitRowEvents = !1, this.on("newListener", (function(d) {
      d === "row" && (this._emitRowEvents = !0);
    }).bind(this));
  };
  r.inherits(i, t);
  var u = { sqlState: "code", statementPosition: "position", messagePrimary: "message", context: "where", schemaName: "schema", tableName: "table", columnName: "column", dataTypeName: "dataType", constraintName: "constraint", sourceFile: "file", sourceLine: "line", sourceFunction: "routine" };
  i.prototype.handleError = function(a) {
    var f = this.native.pq.resultErrorFields();
    if (f) for (var y in f) {
      var d = u[y] || y;
      a[d] = f[y];
    }
    this.callback ? this.callback(a) : this.emit("error", a), this.state = "error";
  }, i.prototype.then = function(a, f) {
    return this._getPromise().then(
      a,
      f
    );
  }, i.prototype.catch = function(a) {
    return this._getPromise().catch(a);
  }, i.prototype._getPromise = function() {
    return this._promise ? this._promise : (this._promise = new Promise((function(a, f) {
      this._once("end", a), this._once("error", f);
    }).bind(this)), this._promise);
  }, i.prototype.submit = function(a) {
    this.state = "running";
    var f = this;
    this.native = a.native, a.native.arrayMode = this._arrayMode;
    var y = m(function(g, S, c) {
      if (a.native.arrayMode = !1, kr(function() {
        f.emit("_done");
      }), g) return f.handleError(g);
      f._emitRowEvents && (c.length > 1 ? S.forEach(
        (h, b) => {
          h.forEach((_) => {
            f.emit("row", _, c[b]);
          });
        }
      ) : S.forEach(function(h) {
        f.emit("row", h, c);
      })), f.state = "end", f.emit("end", c), f.callback && f.callback(null, c);
    }, "after");
    if (ee.domain && (y = ee.domain.bind(y)), this.name) {
      this.name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", this.name, this.name.length), console.error("This can cause conflicts and silent errors executing queries"));
      var d = (this.values || []).map(n.prepareValue);
      if (a.namedQueries[this.name]) {
        if (this.text && a.namedQueries[this.name] !== this.text) {
          let g = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
          return y(g);
        }
        return a.native.execute(this.name, d, y);
      }
      return a.native.prepare(this.name, this.text, d.length, function(g) {
        return g ? y(g) : (a.namedQueries[f.name] = f.text, f.native.execute(f.name, d, y));
      });
    } else if (this.values) {
      if (!Array.isArray(
        this.values
      )) {
        let g = new Error("Query values must be an array");
        return y(g);
      }
      var v = this.values.map(n.prepareValue);
      a.native.query(this.text, v, y);
    } else a.native.query(this.text, y);
  };
}), Id = te((s, e) => {
  W();
  var t = (Pd(), ye(Pl)), r = Fr();
  Nd();
  var n = ot().EventEmitter, i = (or(), ye(Lt)), u = Wr(), a = xd(), f = e.exports = function(y) {
    n.call(this), y = y || {}, this._Promise = y.Promise || rr.Promise, this._types = new r(y.types), this.native = new t({ types: this._types }), this._queryQueue = [], this._ending = !1, this._connecting = !1, this._connected = !1, this._queryable = !0;
    var d = this.connectionParameters = new u(y);
    this.user = d.user, Object.defineProperty(this, "password", { configurable: !0, enumerable: !1, writable: !0, value: d.password }), this.database = d.database, this.host = d.host, this.port = d.port, this.namedQueries = {};
  };
  f.Query = a, i.inherits(f, n), f.prototype._errorAllQueries = function(y) {
    let d = m((v) => {
      ee.nextTick(() => {
        v.native = this.native, v.handleError(y);
      });
    }, "enqueueError");
    this._hasActiveQuery() && (d(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(d), this._queryQueue.length = 0;
  }, f.prototype._connect = function(y) {
    var d = this;
    if (this._connecting) {
      ee.nextTick(() => y(new Error("Client has already been connected. You cannot reuse a client.")));
      return;
    }
    this._connecting = !0, this.connectionParameters.getLibpqConnectionString(function(v, g) {
      if (v) return y(v);
      d.native.connect(g, function(S) {
        if (S) return d.native.end(), y(S);
        d._connected = !0, d.native.on("error", function(c) {
          d._queryable = !1, d._errorAllQueries(c), d.emit("error", c);
        }), d.native.on("notification", function(c) {
          d.emit("notification", { channel: c.relname, payload: c.extra });
        }), d.emit("connect"), d._pulseQueryQueue(!0), y();
      });
    });
  }, f.prototype.connect = function(y) {
    if (y) {
      this._connect(y);
      return;
    }
    return new this._Promise((d, v) => {
      this._connect((g) => {
        g ? v(g) : d();
      });
    });
  }, f.prototype.query = function(y, d, v) {
    var g, S, c, h, b;
    if (y == null) throw new TypeError("Client was passed a null or undefined query");
    if (typeof y.submit == "function") c = y.query_timeout || this.connectionParameters.query_timeout, S = g = y, typeof d == "function" && (y.callback = d);
    else if (c = this.connectionParameters.query_timeout, g = new a(y, d, v), !g.callback) {
      let _, C;
      S = new this._Promise((A, B) => {
        _ = A, C = B;
      }), g.callback = (A, B) => A ? C(A) : _(B);
    }
    return c && (b = g.callback, h = setTimeout(() => {
      var _ = new Error(
        "Query read timeout"
      );
      ee.nextTick(() => {
        g.handleError(_, this.connection);
      }), b(_), g.callback = () => {
      };
      var C = this._queryQueue.indexOf(g);
      C > -1 && this._queryQueue.splice(C, 1), this._pulseQueryQueue();
    }, c), g.callback = (_, C) => {
      clearTimeout(h), b(_, C);
    }), this._queryable ? this._ending ? (g.native = this.native, ee.nextTick(() => {
      g.handleError(
        new Error("Client was closed and is not queryable")
      );
    }), S) : (this._queryQueue.push(g), this._pulseQueryQueue(), S) : (g.native = this.native, ee.nextTick(() => {
      g.handleError(new Error("Client has encountered a connection error and is not queryable"));
    }), S);
  }, f.prototype.end = function(y) {
    var d = this;
    this._ending = !0, this._connected || this.once("connect", this.end.bind(this, y));
    var v;
    return y || (v = new this._Promise(function(g, S) {
      y = m((c) => c ? S(c) : g(), "cb");
    })), this.native.end(function() {
      d._errorAllQueries(new Error("Connection terminated")), ee.nextTick(() => {
        d.emit("end"), y && y();
      });
    }), v;
  }, f.prototype._hasActiveQuery = function() {
    return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
  }, f.prototype._pulseQueryQueue = function(y) {
    if (this._connected && !this._hasActiveQuery()) {
      var d = this._queryQueue.shift();
      if (!d) {
        y || this.emit("drain");
        return;
      }
      this._activeQuery = d, d.submit(this);
      var v = this;
      d.once("_done", function() {
        v._pulseQueryQueue();
      });
    }
  }, f.prototype.cancel = function(y) {
    this._activeQuery === y ? this.native.cancel(function() {
    }) : this._queryQueue.indexOf(y) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(y), 1);
  }, f.prototype.ref = function() {
  }, f.prototype.unref = function() {
  }, f.prototype.setTypeParser = function(y, d, v) {
    return this._types.setTypeParser(
      y,
      d,
      v
    );
  }, f.prototype.getTypeParser = function(y, d) {
    return this._types.getTypeParser(y, d);
  };
}), Es = te((s, e) => {
  W(), e.exports = Id();
}), ar = te((s, e) => {
  W();
  var t = Cd(), r = nr(), n = Al(), i = Ad(), { DatabaseError: u } = El(), a = m(
    (y) => {
      var d;
      return d = class extends i {
        constructor(v) {
          super(v, y);
        }
      }, m(d, "BoundPool"), d;
    },
    "poolFactory"
  ), f = m(
    function(y) {
      this.defaults = r, this.Client = y, this.Query = this.Client.Query, this.Pool = a(this.Client), this._pools = [], this.Connection = n, this.types = sr(), this.DatabaseError = u;
    },
    "PG"
  );
  typeof ee.env.NODE_PG_FORCE_NATIVE < "u" ? e.exports = new f(Es()) : (e.exports = new f(t), Object.defineProperty(e.exports, "native", {
    configurable: !0,
    enumerable: !1,
    get() {
      var y = null;
      try {
        y = new f(Es());
      } catch (d) {
        if (d.code !== "MODULE_NOT_FOUND") throw d;
      }
      return Object.defineProperty(e.exports, "native", { value: y }), y;
    }
  }));
});
W();
W();
It();
sl();
W();
var Ld = Object.defineProperty, Od = Object.defineProperties, Bd = Object.getOwnPropertyDescriptors, Ts = Object.getOwnPropertySymbols, Dd = Object.prototype.hasOwnProperty, Rd = Object.prototype.propertyIsEnumerable, Cs = m(
  (s, e, t) => e in s ? Ld(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t,
  "__defNormalProp"
), Md = m((s, e) => {
  for (var t in e || (e = {})) Dd.call(e, t) && Cs(s, t, e[t]);
  if (Ts) for (var t of Ts(e)) Rd.call(e, t) && Cs(s, t, e[t]);
  return s;
}, "__spreadValues"), $d = m((s, e) => Od(s, Bd(e)), "__spreadProps"), qd = 1008e3, As = new Uint8Array(
  new Uint16Array([258]).buffer
)[0] === 2, kd = new TextDecoder(), Kr = new TextEncoder(), $t = Kr.encode("0123456789abcdef"), qt = Kr.encode("0123456789ABCDEF"), Qd = Kr.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), xl = Qd.slice();
xl[62] = 45;
xl[63] = 95;
var St, kt;
function Il(s, { alphabet: e, scratchArr: t } = {}) {
  if (!St) if (St = new Uint16Array(256), kt = new Uint16Array(256), As) for (let S = 0; S < 256; S++) St[S] = $t[S & 15] << 8 | $t[S >>> 4], kt[S] = qt[S & 15] << 8 | qt[S >>> 4];
  else for (let S = 0; S < 256; S++) St[S] = $t[S & 15] | $t[S >>> 4] << 8, kt[S] = qt[S & 15] | qt[S >>> 4] << 8;
  s.byteOffset % 4 !== 0 && (s = new Uint8Array(s));
  let r = s.length, n = r >>> 1, i = r >>> 2, u = t || new Uint16Array(r), a = new Uint32Array(
    s.buffer,
    s.byteOffset,
    i
  ), f = new Uint32Array(u.buffer, u.byteOffset, n), y = e === "upper" ? kt : St, d = 0, v = 0, g;
  if (As)
    for (; d < i; ) g = a[d++], f[v++] = y[g >>> 8 & 255] << 16 | y[g & 255], f[v++] = y[g >>> 24] << 16 | y[g >>> 16 & 255];
  else for (; d < i; )
    g = a[d++], f[v++] = y[g >>> 24] << 16 | y[g >>> 16 & 255], f[v++] = y[g >>> 8 & 255] << 16 | y[g & 255];
  for (d <<= 2; d < r; ) u[d] = y[s[d++]];
  return kd.decode(u.subarray(0, r));
}
m(Il, "_toHex");
function Ll(s, e = {}) {
  let t = "", r = s.length, n = qd >>> 1, i = Math.ceil(r / n), u = new Uint16Array(i > 1 ? n : r);
  for (let a = 0; a < i; a++) {
    let f = a * n, y = f + n;
    t += Il(s.subarray(f, y), $d(Md(
      {},
      e
    ), { scratchArr: u }));
  }
  return t;
}
m(Ll, "_toHexChunked");
function Ol(s, e = {}) {
  return e.alphabet !== "upper" && typeof s.toHex == "function" ? s.toHex() : Ll(s, e);
}
m(Ol, "toHex");
W();
var Bl = class Dl {
  constructor(e, t) {
    this.strings = e, this.values = t;
  }
  toParameterizedQuery(e = { query: "", params: [] }) {
    var n;
    let { strings: t, values: r } = this;
    for (let i = 0, u = t.length; i < u; i++) if (e.query += t[i], i < r.length) {
      let a = r[i];
      if (a instanceof $l) e.query += a.sql;
      else if (a instanceof Ft) if (a.queryData instanceof Dl) a.queryData.toParameterizedQuery(
        e
      );
      else {
        if ((n = a.queryData.params) != null && n.length) throw new Error("This query is not composable");
        e.query += a.queryData.query;
      }
      else {
        let { params: f } = e;
        f.push(a), e.query += "$" + f.length, (a instanceof J || ArrayBuffer.isView(a)) && (e.query += "::bytea");
      }
    }
    return e;
  }
};
m(Bl, "SqlTemplate");
var Rl = Bl, Ml = class {
  constructor(e) {
    this.sql = e;
  }
};
m(Ml, "UnsafeRawSql");
var $l = Ml;
W();
function Gr() {
  typeof window < "u" && typeof document < "u" && typeof console < "u" && typeof console.warn == "function" && console.warn(`          
        ************************************************************
        *                                                          *
        *  WARNING: Running SQL directly from the browser can have *
        *  security implications. Even if your database is         *
        *  protected by Row-Level Security (RLS), use it at your   *
        *  own risk. This approach is great for fast prototyping,  *
        *  but ensure proper safeguards are in place to prevent    *
        *  misuse or execution of expensive SQL queries by your    *
        *  end users.                                              *
        *                                                          *
        *  If you've assessed the risks, suppress this message     *
        *  using the disableWarningInBrowsers configuration        *
        *  parameter.                                              *
        *                                                          *
        ************************************************************`);
}
m(Gr, "warnIfBrowser");
It();
var Fd = it(Fr()), jd = it(ir()), ql = class kl extends Error {
  constructor(e) {
    super(e), Y(this, "name", "NeonDbError"), Y(this, "severity"), Y(this, "code"), Y(this, "detail"), Y(this, "hint"), Y(this, "position"), Y(this, "internalPosition"), Y(
      this,
      "internalQuery"
    ), Y(this, "where"), Y(this, "schema"), Y(this, "table"), Y(this, "column"), Y(this, "dataType"), Y(this, "constraint"), Y(this, "file"), Y(this, "line"), Y(this, "routine"), Y(this, "sourceError"), "captureStackTrace" in Error && typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, kl);
  }
};
m(
  ql,
  "NeonDbError"
);
var ht = ql, Ps = "transaction() expects an array of queries, or a function returning an array of queries", Ud = ["severity", "code", "detail", "hint", "position", "internalPosition", "internalQuery", "where", "schema", "table", "column", "dataType", "constraint", "file", "line", "routine"];
function Ql(s) {
  return s instanceof J ? "\\x" + Ol(s) : s;
}
m(Ql, "encodeBuffersAsBytea");
function Er(s) {
  let { query: e, params: t } = s instanceof Rl ? s.toParameterizedQuery() : s;
  return { query: e, params: t.map((r) => Ql((0, jd.prepareValue)(r))) };
}
m(Er, "prepareQuery");
function ft(s, {
  arrayMode: e,
  fullResults: t,
  fetchOptions: r,
  isolationLevel: n,
  readOnly: i,
  deferrable: u,
  authToken: a,
  disableWarningInBrowsers: f
} = {}) {
  if (!s) throw new Error("No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?");
  let y;
  try {
    y = Qr(s);
  } catch {
    throw new Error(
      "Database connection string provided to `neon()` is not a valid URL. Connection string: " + String(s)
    );
  }
  let { protocol: d, username: v, hostname: g, port: S, pathname: c } = y;
  if (d !== "postgres:" && d !== "postgresql:" || !v || !g || !c) throw new Error("Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value");
  function h(_, ...C) {
    if (!(Array.isArray(_) && Array.isArray(_.raw) && Array.isArray(C))) throw new Error('This function can now be called only as a tagged-template function: sql`SELECT ${value}`, not sql("SELECT $1", [value], options). For a conventional function call with value placeholders ($1, $2, etc.), use sql.query("SELECT $1", [value], options).');
    return new Ft(
      b,
      new Rl(_, C)
    );
  }
  m(h, "templateFn"), h.query = (_, C, A) => new Ft(b, { query: _, params: C ?? [] }, A), h.unsafe = (_) => new $l(
    _
  ), h.transaction = async (_, C) => {
    if (typeof _ == "function" && (_ = _(h)), !Array.isArray(_)) throw new Error(Ps);
    _.forEach((R) => {
      if (!(R instanceof Ft)) throw new Error(Ps);
    });
    let A = _.map((R) => R.queryData), B = _.map((R) => R.opts ?? {});
    return b(A, B, C);
  };
  async function b(_, C, A) {
    let { fetchEndpoint: B, fetchFunction: R } = At, E = Array.isArray(
      _
    ) ? { queries: _.map((ne) => Er(ne)) } : Er(_), I = r ?? {}, N = e ?? !1, T = t ?? !1, $ = n, D = i, U = u;
    A !== void 0 && (A.fetchOptions !== void 0 && (I = { ...I, ...A.fetchOptions }), A.arrayMode !== void 0 && (N = A.arrayMode), A.fullResults !== void 0 && (T = A.fullResults), A.isolationLevel !== void 0 && ($ = A.isolationLevel), A.readOnly !== void 0 && (D = A.readOnly), A.deferrable !== void 0 && (U = A.deferrable)), C !== void 0 && !Array.isArray(C) && C.fetchOptions !== void 0 && (I = { ...I, ...C.fetchOptions });
    let V = a;
    !Array.isArray(C) && (C == null ? void 0 : C.authToken) !== void 0 && (V = C.authToken);
    let M = typeof B == "function" ? B(g, S, { jwtAuth: V !== void 0 }) : B, F = { "Neon-Connection-String": s, "Neon-Raw-Text-Output": "true", "Neon-Array-Mode": "true" }, G = await jl(V);
    G && (F.Authorization = `Bearer ${G}`), Array.isArray(_) && ($ !== void 0 && (F["Neon-Batch-Isolation-Level"] = $), D !== void 0 && (F["Neon-Batch-Read-Only"] = String(D)), U !== void 0 && (F["Neon-Batch-Deferrable"] = String(U))), f || At.disableWarningInBrowsers || Gr();
    let Z;
    try {
      Z = await (R ?? fetch)(M, { method: "POST", body: JSON.stringify(E), headers: F, ...I });
    } catch (ne) {
      let X = new ht(
        `Error connecting to database: ${ne}`
      );
      throw X.sourceError = ne, X;
    }
    if (Z.ok) {
      let ne = await Z.json();
      if (Array.isArray(_)) {
        let X = ne.results;
        if (!Array.isArray(X)) throw new ht("Neon internal error: unexpected result format");
        return X.map((Ae, ie) => {
          let fe = C[ie] ?? {}, yt = fe.arrayMode ?? N, wt = fe.fullResults ?? T;
          return Tr(
            Ae,
            { arrayMode: yt, fullResults: wt, types: fe.types }
          );
        });
      } else {
        let X = C ?? {}, Ae = X.arrayMode ?? N, ie = X.fullResults ?? T;
        return Tr(ne, { arrayMode: Ae, fullResults: ie, types: X.types });
      }
    } else {
      let { status: ne } = Z;
      if (ne === 400) {
        let X = await Z.json(), Ae = new ht(X.message);
        for (let ie of Ud) Ae[ie] = X[ie] ?? void 0;
        throw Ae;
      } else {
        let X = await Z.text();
        throw new ht(
          `Server error (HTTP status ${ne}): ${X}`
        );
      }
    }
  }
  return m(b, "execute"), h;
}
m(ft, "neon");
var Fl = class {
  constructor(e, t, r) {
    this.execute = e, this.queryData = t, this.opts = r;
  }
  then(e, t) {
    return this.execute(this.queryData, this.opts).then(e, t);
  }
  catch(e) {
    return this.execute(this.queryData, this.opts).catch(e);
  }
  finally(e) {
    return this.execute(
      this.queryData,
      this.opts
    ).finally(e);
  }
};
m(Fl, "NeonQueryPromise");
var Ft = Fl;
function Tr(s, {
  arrayMode: e,
  fullResults: t,
  types: r
}) {
  let n = new Fd.default(r), i = s.fields.map((f) => f.name), u = s.fields.map((f) => n.getTypeParser(
    f.dataTypeID
  )), a = e === !0 ? s.rows.map((f) => f.map((y, d) => y === null ? null : u[d](y))) : s.rows.map((f) => Object.fromEntries(
    f.map((y, d) => [i[d], y === null ? null : u[d](y)])
  ));
  return t ? (s.viaNeonFetch = !0, s.rowAsArray = e, s.rows = a, s._parsers = u, s._types = n, s) : a;
}
m(Tr, "processQueryResult");
async function jl(s) {
  if (typeof s == "string") return s;
  if (typeof s == "function") try {
    return await Promise.resolve(s());
  } catch (e) {
    let t = new ht("Error getting auth token.");
    throw e instanceof Error && (t = new ht(`Error getting auth token: ${e.message}`)), t;
  }
}
m(jl, "getAuthToken");
W();
var Vd = it(ar());
W();
var zd = it(ar()), Ul = class extends zd.Client {
  constructor(e) {
    super(e), this.config = e;
  }
  get neonConfig() {
    return this.connection.stream;
  }
  connect(e) {
    var y, d;
    let { neonConfig: t } = this;
    t.forceDisablePgSSL && (this.ssl = this.connection.ssl = !1), this.ssl && t.useSecureWebSocket && console.warn("SSL is enabled for both Postgres (e.g. ?sslmode=require in the connection string + forceDisablePgSSL = false) and the WebSocket tunnel (useSecureWebSocket = true). Double encryption will increase latency and CPU usage. It may be appropriate to disable SSL in the Postgres connection parameters or set forceDisablePgSSL = true.");
    let r = typeof this.config != "string" && ((y = this.config) == null ? void 0 : y.host) !== void 0 || typeof this.config != "string" && ((d = this.config) == null ? void 0 : d.connectionString) !== void 0 || ee.env.PGHOST !== void 0, n = ee.env.USER ?? ee.env.USERNAME;
    if (!r && this.host === "localhost" && this.user === n && this.database === n && this.password === null) throw new Error(`No database host or connection string was set, and key parameters have default values (host: localhost, user: ${n}, db: ${n}, password: null). Is an environment variable missing? Alternatively, if you intended to connect with these parameters, please set the host to 'localhost' explicitly.`);
    let i = super.connect(e), u = t.pipelineTLS && this.ssl, a = t.pipelineConnect === "password";
    if (!u && !t.pipelineConnect) return i;
    let f = this.connection;
    if (u && f.on(
      "connect",
      () => f.stream.emit("data", "S")
    ), a) {
      f.removeAllListeners("authenticationCleartextPassword"), f.removeAllListeners("readyForQuery"), f.once("readyForQuery", () => f.on("readyForQuery", this._handleReadyForQuery.bind(this)));
      let v = this.ssl ? "sslconnect" : "connect";
      f.on(v, () => {
        this.neonConfig.disableWarningInBrowsers || Gr(), this._handleAuthCleartextPassword(), this._handleReadyForQuery();
      });
    }
    return i;
  }
  async _handleAuthSASLContinue(e) {
    if (typeof crypto > "u" || crypto.subtle === void 0 || crypto.subtle.importKey === void 0) throw new Error("Cannot use SASL auth when `crypto.subtle` is not defined");
    let t = crypto.subtle, r = this.saslSession, n = this.password, i = e.data;
    if (r.message !== "SASLInitialResponse" || typeof n != "string" || typeof i != "string") throw new Error(
      "SASL: protocol error"
    );
    let u = Object.fromEntries(i.split(",").map((ne) => {
      if (!/^.=/.test(ne)) throw new Error(
        "SASL: Invalid attribute pair entry"
      );
      let X = ne[0], Ae = ne.substring(2);
      return [X, Ae];
    })), a = u.r, f = u.s, y = u.i;
    if (!a || !/^[!-+--~]+$/.test(a)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing/unprintable");
    if (!f || !/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(f)) throw new Error(
      "SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing/not base64"
    );
    if (!y || !/^[1-9][0-9]*$/.test(y)) throw new Error(
      "SASL: SCRAM-SERVER-FIRST-MESSAGE: missing/invalid iteration count"
    );
    if (!a.startsWith(r.clientNonce))
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    if (a.length === r.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    let d = parseInt(y, 10), v = J.from(f, "base64"), g = new TextEncoder(), S = g.encode(n), c = await t.importKey(
      "raw",
      S,
      { name: "HMAC", hash: { name: "SHA-256" } },
      !1,
      ["sign"]
    ), h = new Uint8Array(await t.sign("HMAC", c, J.concat(
      [v, J.from([0, 0, 0, 1])]
    ))), b = h;
    for (var _ = 0; _ < d - 1; _++) h = new Uint8Array(await t.sign("HMAC", c, h)), b = J.from(
      b.map((ne, X) => b[X] ^ h[X])
    );
    let C = b, A = await t.importKey(
      "raw",
      C,
      { name: "HMAC", hash: { name: "SHA-256" } },
      !1,
      ["sign"]
    ), B = new Uint8Array(await t.sign("HMAC", A, g.encode("Client Key"))), R = await t.digest(
      "SHA-256",
      B
    ), E = "n=*,r=" + r.clientNonce, I = "r=" + a + ",s=" + f + ",i=" + d, N = "c=biws,r=" + a, T = E + "," + I + "," + N, $ = await t.importKey(
      "raw",
      R,
      { name: "HMAC", hash: { name: "SHA-256" } },
      !1,
      ["sign"]
    );
    var D = new Uint8Array(await t.sign(
      "HMAC",
      $,
      g.encode(T)
    )), U = J.from(B.map((ne, X) => B[X] ^ D[X])), V = U.toString("base64");
    let M = await t.importKey(
      "raw",
      C,
      { name: "HMAC", hash: { name: "SHA-256" } },
      !1,
      ["sign"]
    ), F = await t.sign("HMAC", M, g.encode("Server Key")), G = await t.importKey("raw", F, { name: "HMAC", hash: { name: "SHA-256" } }, !1, ["sign"]);
    var Z = J.from(
      await t.sign("HMAC", G, g.encode(T))
    );
    r.message = "SASLResponse", r.serverSignature = Z.toString("base64"), r.response = N + ",p=" + V, this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
  }
};
m(
  Ul,
  "NeonClient"
);
var Wd = Ul;
It();
var Kd = it(Wr());
function Vl(s, e) {
  if (e) return { callback: e, result: void 0 };
  let t, r, n = m(function(u, a) {
    u ? t(u) : r(a);
  }, "cb"), i = new s(function(u, a) {
    r = u, t = a;
  });
  return { callback: n, result: i };
}
m(Vl, "promisify");
var Gd = class extends Vd.Pool {
  constructor() {
    super(...arguments), Y(this, "Client", Wd), Y(this, "hasFetchUnsupportedListeners", !1), Y(this, "addListener", this.on);
  }
  on(e, t) {
    return e !== "error" && (this.hasFetchUnsupportedListeners = !0), super.on(e, t);
  }
  query(e, t, r) {
    var i;
    if (!At.poolQueryViaFetch || this.hasFetchUnsupportedListeners || typeof e == "function") return super.query(
      e,
      t,
      r
    );
    typeof t == "function" && (r = t, t = void 0);
    let n = Vl(this.Promise, r);
    r = n.callback;
    try {
      let u = new Kd.default(
        this.options
      ), a = encodeURIComponent, f = encodeURI, y = `postgresql://${a(u.user)}:${a(u.password)}@${a(u.host)}/${f(u.database)}`, d = typeof e == "string" ? e : e.text, v = t ?? e.values ?? [];
      ft(y, { fullResults: !0, arrayMode: e.rowMode === "array" }).query(d, v, { types: e.types ?? ((i = this.options) == null ? void 0 : i.types) }).then((g) => r(void 0, g)).catch((g) => r(
        g
      ));
    } catch (u) {
      r(u);
    }
    return n.result;
  }
};
m(Gd, "NeonPool");
It();
var Ot = it(ar());
Ot.DatabaseError;
Ot.defaults;
Ot.escapeIdentifier;
Ot.escapeLiteral;
var Pe = Ot.types;
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
const O = Symbol.for("drizzle:entityKind");
function k(s, e) {
  if (!s || typeof s != "object")
    return !1;
  if (s instanceof e)
    return !0;
  if (!Object.prototype.hasOwnProperty.call(e, O))
    throw new Error(
      `Class "${e.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  let t = Object.getPrototypeOf(s).constructor;
  if (t)
    for (; t; ) {
      if (O in t && t[O] === e[O])
        return !0;
      t = Object.getPrototypeOf(t);
    }
  return !1;
}
var Rs;
Rs = O;
class zl {
  write(e) {
    console.log(e);
  }
}
w(zl, Rs, "ConsoleLogWriter");
var Ms;
Ms = O;
class Wl {
  constructor(e) {
    w(this, "writer");
    this.writer = (e == null ? void 0 : e.writer) ?? new zl();
  }
  logQuery(e, t) {
    const r = t.map((i) => {
      try {
        return JSON.stringify(i);
      } catch {
        return String(i);
      }
    }), n = r.length ? ` -- params: [${r.join(", ")}]` : "";
    this.writer.write(`Query: ${e}${n}`);
  }
}
w(Wl, Ms, "DefaultLogger");
var $s;
$s = O;
class Kl {
  logQuery() {
  }
}
w(Kl, $s, "NoopLogger");
var qs, ks;
ks = O, qs = Symbol.toStringTag;
class He {
  constructor() {
    w(this, qs, "QueryPromise");
  }
  catch(e) {
    return this.then(void 0, e);
  }
  finally(e) {
    return this.then(
      (t) => (e == null || e(), t),
      (t) => {
        throw e == null || e(), t;
      }
    );
  }
  then(e, t) {
    return this.execute().then(e, t);
  }
}
w(He, ks, "QueryPromise");
var Qs;
Qs = O;
class he {
  constructor(e, t) {
    w(this, "name");
    w(this, "keyAsName");
    w(this, "primary");
    w(this, "notNull");
    w(this, "default");
    w(this, "defaultFn");
    w(this, "onUpdateFn");
    w(this, "hasDefault");
    w(this, "isUnique");
    w(this, "uniqueName");
    w(this, "uniqueType");
    w(this, "dataType");
    w(this, "columnType");
    w(this, "enumValues");
    w(this, "generated");
    w(this, "generatedIdentity");
    w(this, "config");
    this.table = e, this.config = t, this.name = t.name, this.keyAsName = t.keyAsName, this.notNull = t.notNull, this.default = t.default, this.defaultFn = t.defaultFn, this.onUpdateFn = t.onUpdateFn, this.hasDefault = t.hasDefault, this.primary = t.primaryKey, this.isUnique = t.isUnique, this.uniqueName = t.uniqueName, this.uniqueType = t.uniqueType, this.dataType = t.dataType, this.columnType = t.columnType, this.generated = t.generated, this.generatedIdentity = t.generatedIdentity;
  }
  mapFromDriverValue(e) {
    return e;
  }
  mapToDriverValue(e) {
    return e;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
}
w(he, Qs, "Column");
var Fs;
Fs = O;
class Gl {
  constructor(e, t, r) {
    w(this, "config");
    /**
     * Alias for {@link $defaultFn}.
     */
    w(this, "$default", this.$defaultFn);
    /**
     * Alias for {@link $onUpdateFn}.
     */
    w(this, "$onUpdate", this.$onUpdateFn);
    this.config = {
      name: e,
      keyAsName: e === "",
      notNull: !1,
      default: void 0,
      hasDefault: !1,
      primaryKey: !1,
      isUnique: !1,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType: t,
      columnType: r,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    return this.config.notNull = !0, this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(e) {
    return this.config.default = e, this.config.hasDefault = !0, this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(e) {
    return this.config.defaultFn = e, this.config.hasDefault = !0, this;
  }
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(e) {
    return this.config.onUpdateFn = e, this.config.hasDefault = !0, this;
  }
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    return this.config.primaryKey = !0, this.config.notNull = !0, this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(e) {
    this.config.name === "" && (this.config.name = e);
  }
}
w(Gl, Fs, "ColumnBuilder");
const Ke = Symbol.for("drizzle:Name");
var js;
js = O;
class Hl {
  constructor(e, t) {
    /** @internal */
    w(this, "reference");
    /** @internal */
    w(this, "_onUpdate", "no action");
    /** @internal */
    w(this, "_onDelete", "no action");
    this.reference = () => {
      const { name: r, columns: n, foreignColumns: i } = e();
      return { name: r, columns: n, foreignTable: i[0].table, foreignColumns: i };
    }, t && (this._onUpdate = t.onUpdate, this._onDelete = t.onDelete);
  }
  onUpdate(e) {
    return this._onUpdate = e === void 0 ? "no action" : e, this;
  }
  onDelete(e) {
    return this._onDelete = e === void 0 ? "no action" : e, this;
  }
  /** @internal */
  build(e) {
    return new Jl(e, this);
  }
}
w(Hl, js, "PgForeignKeyBuilder");
var Us;
Us = O;
class Jl {
  constructor(e, t) {
    w(this, "reference");
    w(this, "onUpdate");
    w(this, "onDelete");
    this.table = e, this.reference = t.reference, this.onUpdate = t._onUpdate, this.onDelete = t._onDelete;
  }
  getName() {
    const { name: e, columns: t, foreignColumns: r } = this.reference(), n = t.map((a) => a.name), i = r.map((a) => a.name), u = [
      this.table[Ke],
      ...n,
      r[0].table[Ke],
      ...i
    ];
    return e ?? `${u.join("_")}_fk`;
  }
}
w(Jl, Us, "PgForeignKey");
function Hd(s, ...e) {
  return s(...e);
}
function Jd(s, e) {
  return `${s[Ke]}_${e.join("_")}_unique`;
}
function Ns(s, e, t) {
  for (let r = e; r < s.length; r++) {
    const n = s[r];
    if (n === "\\") {
      r++;
      continue;
    }
    if (n === '"')
      return [s.slice(e, r).replace(/\\/g, ""), r + 1];
    if (!t && (n === "," || n === "}"))
      return [s.slice(e, r).replace(/\\/g, ""), r];
  }
  return [s.slice(e).replace(/\\/g, ""), s.length];
}
function Yl(s, e = 0) {
  const t = [];
  let r = e, n = !1;
  for (; r < s.length; ) {
    const i = s[r];
    if (i === ",") {
      (n || r === e) && t.push(""), n = !0, r++;
      continue;
    }
    if (n = !1, i === "\\") {
      r += 2;
      continue;
    }
    if (i === '"') {
      const [f, y] = Ns(s, r + 1, !0);
      t.push(f), r = y;
      continue;
    }
    if (i === "}")
      return [t, r + 1];
    if (i === "{") {
      const [f, y] = Yl(s, r + 1);
      t.push(f), r = y;
      continue;
    }
    const [u, a] = Ns(s, r, !1);
    t.push(u), r = a;
  }
  return [t, r];
}
function Yd(s) {
  const [e] = Yl(s, 1);
  return e;
}
function Zl(s) {
  return `{${s.map((e) => Array.isArray(e) ? Zl(e) : typeof e == "string" ? `"${e.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : `${e}`).join(",")}}`;
}
var Vs, zs;
class se extends (zs = Gl, Vs = O, zs) {
  constructor() {
    super(...arguments);
    w(this, "foreignKeyConfigs", []);
  }
  array(t) {
    return new ec(this.config.name, this, t);
  }
  references(t, r = {}) {
    return this.foreignKeyConfigs.push({ ref: t, actions: r }), this;
  }
  unique(t, r) {
    return this.config.isUnique = !0, this.config.uniqueName = t, this.config.uniqueType = r == null ? void 0 : r.nulls, this;
  }
  generatedAlwaysAs(t) {
    return this.config.generated = {
      as: t,
      type: "always",
      mode: "stored"
    }, this;
  }
  /** @internal */
  buildForeignKeys(t, r) {
    return this.foreignKeyConfigs.map(({ ref: n, actions: i }) => Hd(
      (u, a) => {
        const f = new Hl(() => {
          const y = u();
          return { columns: [t], foreignColumns: [y] };
        });
        return a.onUpdate && f.onUpdate(a.onUpdate), a.onDelete && f.onDelete(a.onDelete), f.build(r);
      },
      n,
      i
    ));
  }
  /** @internal */
  buildExtraConfigColumn(t) {
    return new Xl(t, this.config);
  }
}
w(se, Vs, "PgColumnBuilder");
var Ws, Ks;
class H extends (Ks = he, Ws = O, Ks) {
  constructor(e, t) {
    t.uniqueName || (t.uniqueName = Jd(e, [t.name])), super(e, t), this.table = e;
  }
}
w(H, Ws, "PgColumn");
var Gs, Hs;
class Xl extends (Hs = H, Gs = O, Hs) {
  constructor() {
    super(...arguments);
    w(this, "indexConfig", {
      order: this.config.order ?? "asc",
      nulls: this.config.nulls ?? "last",
      opClass: this.config.opClass
    });
    w(this, "defaultConfig", {
      order: "asc",
      nulls: "last",
      opClass: void 0
    });
  }
  getSQLType() {
    return this.getSQLType();
  }
  asc() {
    return this.indexConfig.order = "asc", this;
  }
  desc() {
    return this.indexConfig.order = "desc", this;
  }
  nullsFirst() {
    return this.indexConfig.nulls = "first", this;
  }
  nullsLast() {
    return this.indexConfig.nulls = "last", this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(t) {
    return this.indexConfig.opClass = t, this;
  }
}
w(Xl, Gs, "ExtraConfigColumn");
var Js;
Js = O;
class jt {
  constructor(e, t, r, n) {
    w(this, "name");
    w(this, "keyAsName");
    w(this, "type");
    w(this, "indexConfig");
    this.name = e, this.keyAsName = t, this.type = r, this.indexConfig = n;
  }
}
w(jt, Js, "IndexedColumn");
var Ys, Zs;
class ec extends (Zs = se, Ys = O, Zs) {
  constructor(e, t, r) {
    super(e, "array", "PgArray"), this.config.baseBuilder = t, this.config.size = r;
  }
  /** @internal */
  build(e) {
    const t = this.config.baseBuilder.build(e);
    return new Cr(
      e,
      this.config,
      t
    );
  }
}
w(ec, Ys, "PgArrayBuilder");
var Xs, en;
const Zt = class Zt extends (en = H, Xs = O, en) {
  constructor(t, r, n, i) {
    super(t, r);
    w(this, "size");
    this.baseColumn = n, this.range = i, this.size = r.size;
  }
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size == "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(t) {
    return typeof t == "string" && (t = Yd(t)), t.map((r) => this.baseColumn.mapFromDriverValue(r));
  }
  mapToDriverValue(t, r = !1) {
    const n = t.map(
      (i) => i === null ? null : k(this.baseColumn, Zt) ? this.baseColumn.mapToDriverValue(i, !0) : this.baseColumn.mapToDriverValue(i)
    );
    return r ? n : Zl(n);
  }
};
w(Zt, Xs, "PgArray");
let Cr = Zt;
var tn, rn;
class tc extends (rn = se, tn = O, rn) {
  constructor(e, t) {
    super(e, "string", "PgEnumObjectColumn"), this.config.enum = t;
  }
  /** @internal */
  build(e) {
    return new rc(
      e,
      this.config
    );
  }
}
w(tc, tn, "PgEnumObjectColumnBuilder");
var sn, nn;
class rc extends (nn = H, sn = O, nn) {
  constructor(t, r) {
    super(t, r);
    w(this, "enum");
    w(this, "enumValues", this.config.enum.enumValues);
    this.enum = r.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
w(rc, sn, "PgEnumObjectColumn");
const Wt = Symbol.for("drizzle:isPgEnum");
function Zd(s) {
  return !!s && typeof s == "function" && Wt in s && s[Wt] === !0;
}
var on, an;
class sc extends (an = se, on = O, an) {
  constructor(e, t) {
    super(e, "string", "PgEnumColumn"), this.config.enum = t;
  }
  /** @internal */
  build(e) {
    return new nc(
      e,
      this.config
    );
  }
}
w(sc, on, "PgEnumColumnBuilder");
var un, ln;
class nc extends (ln = H, un = O, ln) {
  constructor(t, r) {
    super(t, r);
    w(this, "enum", this.config.enum);
    w(this, "enumValues", this.config.enum.enumValues);
    this.enum = r.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
}
w(nc, un, "PgEnumColumn");
function Re(s, e) {
  return Array.isArray(e) ? Xd(s, [...e], void 0) : ep(s, e, void 0);
}
function Xd(s, e, t) {
  const r = Object.assign(
    (n) => new sc(n ?? "", r),
    {
      enumName: s,
      enumValues: e,
      schema: t,
      [Wt]: !0
    }
  );
  return r;
}
function ep(s, e, t) {
  const r = Object.assign(
    (n) => new tc(n ?? "", r),
    {
      enumName: s,
      enumValues: Object.values(e),
      schema: t,
      [Wt]: !0
    }
  );
  return r;
}
var cn;
cn = O;
class be {
  constructor(e, t, r, n = !1, i = []) {
    this._ = {
      brand: "Subquery",
      sql: e,
      selectedFields: t,
      alias: r,
      isWith: n,
      usedTables: i
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
}
w(be, cn, "Subquery");
var hn, fn;
class Hr extends (fn = be, hn = O, fn) {
}
w(Hr, hn, "WithSubquery");
const Ie = {
  startActiveSpan(s, e) {
    return e();
  }
}, de = Symbol.for("drizzle:ViewBaseConfig"), dt = Symbol.for("drizzle:Schema"), Ar = Symbol.for("drizzle:Columns"), xs = Symbol.for("drizzle:ExtraConfigColumns"), yr = Symbol.for("drizzle:OriginalName"), wr = Symbol.for("drizzle:BaseName"), Kt = Symbol.for("drizzle:IsAlias"), Is = Symbol.for("drizzle:ExtraConfigBuilder"), tp = Symbol.for("drizzle:IsDrizzleTable");
var dn, pn, mn, gn, yn, wn, bn, vn, Sn, _n;
_n = O, Sn = Ke, vn = yr, bn = dt, wn = Ar, yn = xs, gn = wr, mn = Kt, pn = tp, dn = Is;
class j {
  constructor(e, t, r) {
    /**
     * @internal
     * Can be changed if the table is aliased.
     */
    w(this, Sn);
    /**
     * @internal
     * Used to store the original name of the table, before any aliasing.
     */
    w(this, vn);
    /** @internal */
    w(this, bn);
    /** @internal */
    w(this, wn);
    /** @internal */
    w(this, yn);
    /**
     *  @internal
     * Used to store the table name before the transformation via the `tableCreator` functions.
     */
    w(this, gn);
    /** @internal */
    w(this, mn, !1);
    /** @internal */
    w(this, pn, !0);
    /** @internal */
    w(this, dn);
    this[Ke] = this[yr] = e, this[dt] = t, this[wr] = r;
  }
}
w(j, _n, "Table"), /** @internal */
w(j, "Symbol", {
  Name: Ke,
  Schema: dt,
  OriginalName: yr,
  Columns: Ar,
  ExtraConfigColumns: xs,
  BaseName: wr,
  IsAlias: Kt,
  ExtraConfigBuilder: Is
});
function je(s) {
  return s[Ke];
}
function Pt(s) {
  return `${s[dt] ?? "public"}.${s[Ke]}`;
}
function ic(s) {
  return s != null && typeof s.getSQL == "function";
}
function rp(s) {
  var t;
  const e = { sql: "", params: [] };
  for (const r of s)
    e.sql += r.sql, e.params.push(...r.params), (t = r.typings) != null && t.length && (e.typings || (e.typings = []), e.typings.push(...r.typings));
  return e;
}
var En;
En = O;
class ge {
  constructor(e) {
    w(this, "value");
    this.value = Array.isArray(e) ? e : [e];
  }
  getSQL() {
    return new z([this]);
  }
}
w(ge, En, "StringChunk");
var Tn;
Tn = O;
const Xe = class Xe {
  constructor(e) {
    /** @internal */
    w(this, "decoder", oc);
    w(this, "shouldInlineParams", !1);
    /** @internal */
    w(this, "usedTables", []);
    this.queryChunks = e;
    for (const t of e)
      if (k(t, j)) {
        const r = t[j.Symbol.Schema];
        this.usedTables.push(
          r === void 0 ? t[j.Symbol.Name] : r + "." + t[j.Symbol.Name]
        );
      }
  }
  append(e) {
    return this.queryChunks.push(...e.queryChunks), this;
  }
  toQuery(e) {
    return Ie.startActiveSpan("drizzle.buildSQL", (t) => {
      const r = this.buildQueryFromSourceParams(this.queryChunks, e);
      return t == null || t.setAttributes({
        "drizzle.query.text": r.sql,
        "drizzle.query.params": JSON.stringify(r.params)
      }), r;
    });
  }
  buildQueryFromSourceParams(e, t) {
    const r = Object.assign({}, t, {
      inlineParams: t.inlineParams || this.shouldInlineParams,
      paramStartIndex: t.paramStartIndex || { value: 0 }
    }), {
      casing: n,
      escapeName: i,
      escapeParam: u,
      prepareTyping: a,
      inlineParams: f,
      paramStartIndex: y
    } = r;
    return rp(e.map((d) => {
      var v;
      if (k(d, ge))
        return { sql: d.value.join(""), params: [] };
      if (k(d, Gt))
        return { sql: i(d.value), params: [] };
      if (d === void 0)
        return { sql: "", params: [] };
      if (Array.isArray(d)) {
        const g = [new ge("(")];
        for (const [S, c] of d.entries())
          g.push(c), S < d.length - 1 && g.push(new ge(", "));
        return g.push(new ge(")")), this.buildQueryFromSourceParams(g, r);
      }
      if (k(d, Xe))
        return this.buildQueryFromSourceParams(d.queryChunks, {
          ...r,
          inlineParams: f || d.shouldInlineParams
        });
      if (k(d, j)) {
        const g = d[j.Symbol.Schema], S = d[j.Symbol.Name];
        return {
          sql: g === void 0 || d[Kt] ? i(S) : i(g) + "." + i(S),
          params: []
        };
      }
      if (k(d, he)) {
        const g = n.getColumnCasing(d);
        if (t.invokeSource === "indexes")
          return { sql: i(g), params: [] };
        const S = d.table[j.Symbol.Schema];
        return {
          sql: d.table[Kt] || S === void 0 ? i(d.table[j.Symbol.Name]) + "." + i(g) : i(S) + "." + i(d.table[j.Symbol.Name]) + "." + i(g),
          params: []
        };
      }
      if (k(d, Je)) {
        const g = d[de].schema, S = d[de].name;
        return {
          sql: g === void 0 || d[de].isAlias ? i(S) : i(g) + "." + i(S),
          params: []
        };
      }
      if (k(d, Ue)) {
        if (k(d.value, tt))
          return { sql: u(y.value++, d), params: [d], typings: ["none"] };
        const g = d.value === null ? null : d.encoder.mapToDriverValue(d.value);
        if (k(g, Xe))
          return this.buildQueryFromSourceParams([g], r);
        if (f)
          return { sql: this.mapInlineParam(g, r), params: [] };
        let S = ["none"];
        return a && (S = [a(d.encoder)]), { sql: u(y.value++, g), params: [g], typings: S };
      }
      return k(d, tt) ? { sql: u(y.value++, d), params: [d], typings: ["none"] } : k(d, Xe.Aliased) && d.fieldAlias !== void 0 ? { sql: i(d.fieldAlias), params: [] } : k(d, be) ? d._.isWith ? { sql: i(d._.alias), params: [] } : this.buildQueryFromSourceParams([
        new ge("("),
        d._.sql,
        new ge(") "),
        new Gt(d._.alias)
      ], r) : Zd(d) ? d.schema ? { sql: i(d.schema) + "." + i(d.enumName), params: [] } : { sql: i(d.enumName), params: [] } : ic(d) ? (v = d.shouldOmitSQLParens) != null && v.call(d) ? this.buildQueryFromSourceParams([d.getSQL()], r) : this.buildQueryFromSourceParams([
        new ge("("),
        d.getSQL(),
        new ge(")")
      ], r) : f ? { sql: this.mapInlineParam(d, r), params: [] } : { sql: u(y.value++, d), params: [d], typings: ["none"] };
    }));
  }
  mapInlineParam(e, { escapeString: t }) {
    if (e === null)
      return "null";
    if (typeof e == "number" || typeof e == "boolean")
      return e.toString();
    if (typeof e == "string")
      return t(e);
    if (typeof e == "object") {
      const r = e.toString();
      return t(r === "[object Object]" ? JSON.stringify(e) : r);
    }
    throw new Error("Unexpected param value: " + e);
  }
  getSQL() {
    return this;
  }
  as(e) {
    return e === void 0 ? this : new Xe.Aliased(this, e);
  }
  mapWith(e) {
    return this.decoder = typeof e == "function" ? { mapFromDriverValue: e } : e, this;
  }
  inlineParams() {
    return this.shouldInlineParams = !0, this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(e) {
    return e ? this : void 0;
  }
};
w(Xe, Tn, "SQL");
let z = Xe;
var Cn;
Cn = O;
class Gt {
  constructor(e) {
    w(this, "brand");
    this.value = e;
  }
  getSQL() {
    return new z([this]);
  }
}
w(Gt, Cn, "Name");
function sp(s) {
  return typeof s == "object" && s !== null && "mapToDriverValue" in s && typeof s.mapToDriverValue == "function";
}
const oc = {
  mapFromDriverValue: (s) => s
}, ac = {
  mapToDriverValue: (s) => s
};
({
  ...oc,
  ...ac
});
var An;
An = O;
class Ue {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(e, t = ac) {
    w(this, "brand");
    this.value = e, this.encoder = t;
  }
  getSQL() {
    return new z([this]);
  }
}
w(Ue, An, "Param");
function x(s, ...e) {
  const t = [];
  (e.length > 0 || s.length > 0 && s[0] !== "") && t.push(new ge(s[0]));
  for (const [r, n] of e.entries())
    t.push(n, new ge(s[r + 1]));
  return new z(t);
}
((s) => {
  function e() {
    return new z([]);
  }
  s.empty = e;
  function t(f) {
    return new z(f);
  }
  s.fromList = t;
  function r(f) {
    return new z([new ge(f)]);
  }
  s.raw = r;
  function n(f, y) {
    const d = [];
    for (const [v, g] of f.entries())
      v > 0 && y !== void 0 && d.push(y), d.push(g);
    return new z(d);
  }
  s.join = n;
  function i(f) {
    return new Gt(f);
  }
  s.identifier = i;
  function u(f) {
    return new tt(f);
  }
  s.placeholder = u;
  function a(f, y) {
    return new Ue(f, y);
  }
  s.param = a;
})(x || (x = {}));
((s) => {
  var t;
  t = O;
  const r = class r {
    constructor(i, u) {
      /** @internal */
      w(this, "isSelectionField", !1);
      this.sql = i, this.fieldAlias = u;
    }
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new r(this.sql, this.fieldAlias);
    }
  };
  w(r, t, "SQL.Aliased");
  let e = r;
  s.Aliased = e;
})(z || (z = {}));
var Pn;
Pn = O;
class tt {
  constructor(e) {
    this.name = e;
  }
  getSQL() {
    return new z([this]);
  }
}
w(tt, Pn, "Placeholder");
function br(s, e) {
  return s.map((t) => {
    if (k(t, tt)) {
      if (!(t.name in e))
        throw new Error(`No value for placeholder "${t.name}" was provided`);
      return e[t.name];
    }
    if (k(t, Ue) && k(t.value, tt)) {
      if (!(t.value.name in e))
        throw new Error(`No value for placeholder "${t.value.name}" was provided`);
      return t.encoder.mapToDriverValue(e[t.value.name]);
    }
    return t;
  });
}
const np = Symbol.for("drizzle:IsDrizzleView");
var Nn, xn, In;
In = O, xn = de, Nn = np;
class Je {
  constructor({ name: e, schema: t, selectedFields: r, query: n }) {
    /** @internal */
    w(this, xn);
    /** @internal */
    w(this, Nn, !0);
    this[de] = {
      name: e,
      originalName: e,
      schema: t,
      selectedFields: r,
      query: n,
      isExisting: !n,
      isAlias: !1
    };
  }
  getSQL() {
    return new z([this]);
  }
}
w(Je, In, "View");
he.prototype.getSQL = function() {
  return new z([this]);
};
j.prototype.getSQL = function() {
  return new z([this]);
};
be.prototype.getSQL = function() {
  return new z([this]);
};
var Ln;
Ln = O;
class Nt {
  constructor(e) {
    this.table = e;
  }
  get(e, t) {
    return t === "table" ? this.table : e[t];
  }
}
w(Nt, Ln, "ColumnAliasProxyHandler");
var On;
On = O;
class ur {
  constructor(e, t) {
    this.alias = e, this.replaceOriginalName = t;
  }
  get(e, t) {
    if (t === j.Symbol.IsAlias)
      return !0;
    if (t === j.Symbol.Name)
      return this.alias;
    if (this.replaceOriginalName && t === j.Symbol.OriginalName)
      return this.alias;
    if (t === de)
      return {
        ...e[de],
        name: this.alias,
        isAlias: !0
      };
    if (t === j.Symbol.Columns) {
      const n = e[j.Symbol.Columns];
      if (!n)
        return n;
      const i = {};
      return Object.keys(n).map((u) => {
        i[u] = new Proxy(
          n[u],
          new Nt(new Proxy(e, this))
        );
      }), i;
    }
    const r = e[t];
    return k(r, he) ? new Proxy(r, new Nt(new Proxy(e, this))) : r;
  }
}
w(ur, On, "TableAliasProxyHandler");
function vr(s, e) {
  return new Proxy(s, new ur(e, !1));
}
function Fe(s, e) {
  return new Proxy(
    s,
    new Nt(new Proxy(s.table, new ur(e, !1)))
  );
}
function uc(s, e) {
  return new z.Aliased(Ht(s.sql, e), s.fieldAlias);
}
function Ht(s, e) {
  return x.join(s.queryChunks.map((t) => k(t, he) ? Fe(t, e) : k(t, z) ? Ht(t, e) : k(t, z.Aliased) ? uc(t, e) : t));
}
var Bn;
Bn = O;
const Xt = class Xt {
  constructor(e) {
    w(this, "config");
    this.config = { ...e };
  }
  get(e, t) {
    if (t === "_")
      return {
        ...e._,
        selectedFields: new Proxy(
          e._.selectedFields,
          this
        )
      };
    if (t === de)
      return {
        ...e[de],
        selectedFields: new Proxy(
          e[de].selectedFields,
          this
        )
      };
    if (typeof t == "symbol")
      return e[t];
    const n = (k(e, be) ? e._.selectedFields : k(e, Je) ? e[de].selectedFields : e)[t];
    if (k(n, z.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !n.isSelectionField)
        return n.sql;
      const i = n.clone();
      return i.isSelectionField = !0, i;
    }
    if (k(n, z)) {
      if (this.config.sqlBehavior === "sql")
        return n;
      throw new Error(
        `You tried to reference "${t}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    return k(n, he) ? this.config.alias ? new Proxy(
      n,
      new Nt(
        new Proxy(
          n.table,
          new ur(this.config.alias, this.config.replaceOriginalName ?? !1)
        )
      )
    ) : n : typeof n != "object" || n === null ? n : new Proxy(n, new Xt(this.config));
  }
};
w(Xt, Bn, "SelectionProxyHandler");
let _e = Xt;
function ip(s, e, t) {
  const r = {}, n = s.reduce(
    (i, { path: u, field: a }, f) => {
      let y;
      k(a, he) ? y = a : k(a, z) ? y = a.decoder : k(a, be) ? y = a._.sql.decoder : y = a.sql.decoder;
      let d = i;
      for (const [v, g] of u.entries())
        if (v < u.length - 1)
          g in d || (d[g] = {}), d = d[g];
        else {
          const S = e[f], c = d[g] = S === null ? null : y.mapFromDriverValue(S);
          if (t && k(a, he) && u.length === 2) {
            const h = u[0];
            h in r ? typeof r[h] == "string" && r[h] !== je(a.table) && (r[h] = !1) : r[h] = c === null ? je(a.table) : !1;
          }
        }
      return i;
    },
    {}
  );
  if (t && Object.keys(r).length > 0)
    for (const [i, u] of Object.entries(r))
      typeof u == "string" && !t[u] && (n[i] = null);
  return n;
}
function rt(s, e) {
  return Object.entries(s).reduce((t, [r, n]) => {
    if (typeof r != "string")
      return t;
    const i = e ? [...e, r] : [r];
    return k(n, he) || k(n, z) || k(n, z.Aliased) || k(n, be) ? t.push({ path: i, field: n }) : k(n, j) ? t.push(...rt(n[j.Symbol.Columns], i)) : t.push(...rt(n, i)), t;
  }, []);
}
function Jr(s, e) {
  const t = Object.keys(s), r = Object.keys(e);
  if (t.length !== r.length)
    return !1;
  for (const [n, i] of t.entries())
    if (i !== r[n])
      return !1;
  return !0;
}
function lc(s, e) {
  const t = Object.entries(e).filter(([, r]) => r !== void 0).map(([r, n]) => k(n, z) || k(n, he) ? [r, n] : [r, new Ue(n, s[j.Symbol.Columns][r])]);
  if (t.length === 0)
    throw new Error("No values to set");
  return Object.fromEntries(t);
}
function op(s, e) {
  for (const t of e)
    for (const r of Object.getOwnPropertyNames(t.prototype))
      r !== "constructor" && Object.defineProperty(
        s.prototype,
        r,
        Object.getOwnPropertyDescriptor(t.prototype, r) || /* @__PURE__ */ Object.create(null)
      );
}
function ap(s) {
  return s[j.Symbol.Columns];
}
function Ze(s) {
  return k(s, be) ? s._.alias : k(s, Je) ? s[de].name : k(s, z) ? void 0 : s[j.Symbol.IsAlias] ? s[j.Symbol.Name] : s[j.Symbol.BaseName];
}
function we(s, e) {
  return {
    name: typeof s == "string" && s.length > 0 ? s : "",
    config: typeof s == "object" ? s : e
  };
}
function up(s) {
  if (typeof s != "object" || s === null || s.constructor.name !== "Object") return !1;
  if ("logger" in s) {
    const e = typeof s.logger;
    return !(e !== "boolean" && (e !== "object" || typeof s.logger.logQuery != "function") && e !== "undefined");
  }
  if ("schema" in s) {
    const e = typeof s.schema;
    return !(e !== "object" && e !== "undefined");
  }
  if ("casing" in s) {
    const e = typeof s.casing;
    return !(e !== "string" && e !== "undefined");
  }
  if ("mode" in s)
    return !(s.mode !== "default" || s.mode !== "planetscale" || s.mode !== void 0);
  if ("connection" in s) {
    const e = typeof s.connection;
    return !(e !== "string" && e !== "object" && e !== "undefined");
  }
  if ("client" in s) {
    const e = typeof s.client;
    return !(e !== "object" && e !== "function" && e !== "undefined");
  }
  return Object.keys(s).length === 0;
}
typeof TextDecoder > "u" || new TextDecoder();
var Dn, Rn;
class Bt extends (Rn = se, Dn = O, Rn) {
  generatedAlwaysAsIdentity(e) {
    if (e) {
      const { name: t, ...r } = e;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: t,
        sequenceOptions: r
      };
    } else
      this.config.generatedIdentity = {
        type: "always"
      };
    return this.config.hasDefault = !0, this.config.notNull = !0, this;
  }
  generatedByDefaultAsIdentity(e) {
    if (e) {
      const { name: t, ...r } = e;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: t,
        sequenceOptions: r
      };
    } else
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    return this.config.hasDefault = !0, this.config.notNull = !0, this;
  }
}
w(Bt, Dn, "PgIntColumnBaseBuilder");
var Mn, $n;
class cc extends ($n = Bt, Mn = O, $n) {
  constructor(e) {
    super(e, "number", "PgBigInt53");
  }
  /** @internal */
  build(e) {
    return new hc(e, this.config);
  }
}
w(cc, Mn, "PgBigInt53Builder");
var qn, kn;
class hc extends (kn = H, qn = O, kn) {
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(e) {
    return typeof e == "number" ? e : Number(e);
  }
}
w(hc, qn, "PgBigInt53");
var Qn, Fn;
class fc extends (Fn = Bt, Qn = O, Fn) {
  constructor(e) {
    super(e, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(e) {
    return new dc(
      e,
      this.config
    );
  }
}
w(fc, Qn, "PgBigInt64Builder");
var jn, Un;
class dc extends (Un = H, jn = O, Un) {
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(e) {
    return BigInt(e);
  }
}
w(dc, jn, "PgBigInt64");
function lp(s, e) {
  const { name: t, config: r } = we(s, e);
  return r.mode === "number" ? new cc(t) : new fc(t);
}
var Vn, zn;
class pc extends (zn = se, Vn = O, zn) {
  constructor(e) {
    super(e, "number", "PgBigSerial53"), this.config.hasDefault = !0, this.config.notNull = !0;
  }
  /** @internal */
  build(e) {
    return new mc(
      e,
      this.config
    );
  }
}
w(pc, Vn, "PgBigSerial53Builder");
var Wn, Kn;
class mc extends (Kn = H, Wn = O, Kn) {
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(e) {
    return typeof e == "number" ? e : Number(e);
  }
}
w(mc, Wn, "PgBigSerial53");
var Gn, Hn;
class gc extends (Hn = se, Gn = O, Hn) {
  constructor(e) {
    super(e, "bigint", "PgBigSerial64"), this.config.hasDefault = !0;
  }
  /** @internal */
  build(e) {
    return new yc(
      e,
      this.config
    );
  }
}
w(gc, Gn, "PgBigSerial64Builder");
var Jn, Yn;
class yc extends (Yn = H, Jn = O, Yn) {
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(e) {
    return BigInt(e);
  }
}
w(yc, Jn, "PgBigSerial64");
function cp(s, e) {
  const { name: t, config: r } = we(s, e);
  return r.mode === "number" ? new pc(t) : new gc(t);
}
var Zn, Xn;
class wc extends (Xn = se, Zn = O, Xn) {
  constructor(e) {
    super(e, "boolean", "PgBoolean");
  }
  /** @internal */
  build(e) {
    return new bc(e, this.config);
  }
}
w(wc, Zn, "PgBooleanBuilder");
var ei, ti;
class bc extends (ti = H, ei = O, ti) {
  getSQLType() {
    return "boolean";
  }
}
w(bc, ei, "PgBoolean");
function vc(s) {
  return new wc(s ?? "");
}
var ri, si;
class Sc extends (si = se, ri = O, si) {
  constructor(e, t) {
    super(e, "string", "PgChar"), this.config.length = t.length, this.config.enumValues = t.enum;
  }
  /** @internal */
  build(e) {
    return new _c(
      e,
      this.config
    );
  }
}
w(Sc, ri, "PgCharBuilder");
var ni, ii;
class _c extends (ii = H, ni = O, ii) {
  constructor() {
    super(...arguments);
    w(this, "length", this.config.length);
    w(this, "enumValues", this.config.enumValues);
  }
  getSQLType() {
    return this.length === void 0 ? "char" : `char(${this.length})`;
  }
}
w(_c, ni, "PgChar");
function hp(s, e = {}) {
  const { name: t, config: r } = we(s, e);
  return new Sc(t, r);
}
var oi, ai;
class Ec extends (ai = se, oi = O, ai) {
  constructor(e) {
    super(e, "string", "PgCidr");
  }
  /** @internal */
  build(e) {
    return new Tc(e, this.config);
  }
}
w(Ec, oi, "PgCidrBuilder");
var ui, li;
class Tc extends (li = H, ui = O, li) {
  getSQLType() {
    return "cidr";
  }
}
w(Tc, ui, "PgCidr");
function fp(s) {
  return new Ec(s ?? "");
}
var ci, hi;
class Cc extends (hi = se, ci = O, hi) {
  constructor(e, t, r) {
    super(e, "custom", "PgCustomColumn"), this.config.fieldConfig = t, this.config.customTypeParams = r;
  }
  /** @internal */
  build(e) {
    return new Ac(
      e,
      this.config
    );
  }
}
w(Cc, ci, "PgCustomColumnBuilder");
var fi, di;
class Ac extends (di = H, fi = O, di) {
  constructor(t, r) {
    super(t, r);
    w(this, "sqlName");
    w(this, "mapTo");
    w(this, "mapFrom");
    this.sqlName = r.customTypeParams.dataType(r.fieldConfig), this.mapTo = r.customTypeParams.toDriver, this.mapFrom = r.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(t) {
    return typeof this.mapFrom == "function" ? this.mapFrom(t) : t;
  }
  mapToDriverValue(t) {
    return typeof this.mapTo == "function" ? this.mapTo(t) : t;
  }
}
w(Ac, fi, "PgCustomColumn");
function dp(s) {
  return (e, t) => {
    const { name: r, config: n } = we(e, t);
    return new Cc(r, n, s);
  };
}
var pi, mi;
class mt extends (mi = se, pi = O, mi) {
  defaultNow() {
    return this.default(x`now()`);
  }
}
w(mt, pi, "PgDateColumnBaseBuilder");
var gi, yi;
class Pc extends (yi = mt, gi = O, yi) {
  constructor(e) {
    super(e, "date", "PgDate");
  }
  /** @internal */
  build(e) {
    return new Yr(e, this.config);
  }
}
w(Pc, gi, "PgDateBuilder");
var wi, bi;
class Yr extends (bi = H, wi = O, bi) {
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(e) {
    return typeof e == "string" ? new Date(e) : e;
  }
  mapToDriverValue(e) {
    return e.toISOString();
  }
}
w(Yr, wi, "PgDate");
var vi, Si;
class Nc extends (Si = mt, vi = O, Si) {
  constructor(e) {
    super(e, "string", "PgDateString");
  }
  /** @internal */
  build(e) {
    return new Zr(
      e,
      this.config
    );
  }
}
w(Nc, vi, "PgDateStringBuilder");
var _i, Ei;
class Zr extends (Ei = H, _i = O, Ei) {
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(e) {
    return typeof e == "string" ? e : e.toISOString().slice(0, -14);
  }
}
w(Zr, _i, "PgDateString");
function pp(s, e) {
  const { name: t, config: r } = we(s, e);
  return (r == null ? void 0 : r.mode) === "date" ? new Pc(t) : new Nc(t);
}
var Ti, Ci;
class xc extends (Ci = se, Ti = O, Ci) {
  constructor(e) {
    super(e, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(e) {
    return new Ic(
      e,
      this.config
    );
  }
}
w(xc, Ti, "PgDoublePrecisionBuilder");
var Ai, Pi;
class Ic extends (Pi = H, Ai = O, Pi) {
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(e) {
    return typeof e == "string" ? Number.parseFloat(e) : e;
  }
}
w(Ic, Ai, "PgDoublePrecision");
function mp(s) {
  return new xc(s ?? "");
}
var Ni, xi;
class Lc extends (xi = se, Ni = O, xi) {
  constructor(e) {
    super(e, "string", "PgInet");
  }
  /** @internal */
  build(e) {
    return new Oc(e, this.config);
  }
}
w(Lc, Ni, "PgInetBuilder");
var Ii, Li;
class Oc extends (Li = H, Ii = O, Li) {
  getSQLType() {
    return "inet";
  }
}
w(Oc, Ii, "PgInet");
function gp(s) {
  return new Lc(s ?? "");
}
var Oi, Bi;
class Bc extends (Bi = Bt, Oi = O, Bi) {
  constructor(e) {
    super(e, "number", "PgInteger");
  }
  /** @internal */
  build(e) {
    return new Dc(e, this.config);
  }
}
w(Bc, Oi, "PgIntegerBuilder");
var Di, Ri;
class Dc extends (Ri = H, Di = O, Ri) {
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(e) {
    return typeof e == "string" ? Number.parseInt(e) : e;
  }
}
w(Dc, Di, "PgInteger");
function xt(s) {
  return new Bc(s ?? "");
}
var Mi, $i;
class Rc extends ($i = se, Mi = O, $i) {
  constructor(e, t) {
    super(e, "string", "PgInterval"), this.config.intervalConfig = t;
  }
  /** @internal */
  build(e) {
    return new Mc(e, this.config);
  }
}
w(Rc, Mi, "PgIntervalBuilder");
var qi, ki;
class Mc extends (ki = H, qi = O, ki) {
  constructor() {
    super(...arguments);
    w(this, "fields", this.config.intervalConfig.fields);
    w(this, "precision", this.config.intervalConfig.precision);
  }
  getSQLType() {
    const t = this.fields ? ` ${this.fields}` : "", r = this.precision ? `(${this.precision})` : "";
    return `interval${t}${r}`;
  }
}
w(Mc, qi, "PgInterval");
function yp(s, e = {}) {
  const { name: t, config: r } = we(s, e);
  return new Rc(t, r);
}
var Qi, Fi;
class $c extends (Fi = se, Qi = O, Fi) {
  constructor(e) {
    super(e, "json", "PgJson");
  }
  /** @internal */
  build(e) {
    return new Xr(e, this.config);
  }
}
w($c, Qi, "PgJsonBuilder");
var ji, Ui;
class Xr extends (Ui = H, ji = O, Ui) {
  constructor(e, t) {
    super(e, t);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(e) {
    return JSON.stringify(e);
  }
  mapFromDriverValue(e) {
    if (typeof e == "string")
      try {
        return JSON.parse(e);
      } catch {
        return e;
      }
    return e;
  }
}
w(Xr, ji, "PgJson");
function wp(s) {
  return new $c(s ?? "");
}
var Vi, zi;
class qc extends (zi = se, Vi = O, zi) {
  constructor(e) {
    super(e, "json", "PgJsonb");
  }
  /** @internal */
  build(e) {
    return new es(e, this.config);
  }
}
w(qc, Vi, "PgJsonbBuilder");
var Wi, Ki;
class es extends (Ki = H, Wi = O, Ki) {
  constructor(e, t) {
    super(e, t);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(e) {
    return JSON.stringify(e);
  }
  mapFromDriverValue(e) {
    if (typeof e == "string")
      try {
        return JSON.parse(e);
      } catch {
        return e;
      }
    return e;
  }
}
w(es, Wi, "PgJsonb");
function Ne(s) {
  return new qc(s ?? "");
}
var Gi, Hi;
class kc extends (Hi = se, Gi = O, Hi) {
  constructor(e) {
    super(e, "array", "PgLine");
  }
  /** @internal */
  build(e) {
    return new Qc(
      e,
      this.config
    );
  }
}
w(kc, Gi, "PgLineBuilder");
var Ji, Yi;
class Qc extends (Yi = H, Ji = O, Yi) {
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(e) {
    const [t, r, n] = e.slice(1, -1).split(",");
    return [Number.parseFloat(t), Number.parseFloat(r), Number.parseFloat(n)];
  }
  mapToDriverValue(e) {
    return `{${e[0]},${e[1]},${e[2]}}`;
  }
}
w(Qc, Ji, "PgLine");
var Zi, Xi;
class Fc extends (Xi = se, Zi = O, Xi) {
  constructor(e) {
    super(e, "json", "PgLineABC");
  }
  /** @internal */
  build(e) {
    return new jc(
      e,
      this.config
    );
  }
}
w(Fc, Zi, "PgLineABCBuilder");
var eo, to;
class jc extends (to = H, eo = O, to) {
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(e) {
    const [t, r, n] = e.slice(1, -1).split(",");
    return { a: Number.parseFloat(t), b: Number.parseFloat(r), c: Number.parseFloat(n) };
  }
  mapToDriverValue(e) {
    return `{${e.a},${e.b},${e.c}}`;
  }
}
w(jc, eo, "PgLineABC");
function bp(s, e) {
  const { name: t, config: r } = we(s, e);
  return !(r != null && r.mode) || r.mode === "tuple" ? new kc(t) : new Fc(t);
}
var ro, so;
class Uc extends (so = se, ro = O, so) {
  constructor(e) {
    super(e, "string", "PgMacaddr");
  }
  /** @internal */
  build(e) {
    return new Vc(e, this.config);
  }
}
w(Uc, ro, "PgMacaddrBuilder");
var no, io;
class Vc extends (io = H, no = O, io) {
  getSQLType() {
    return "macaddr";
  }
}
w(Vc, no, "PgMacaddr");
function vp(s) {
  return new Uc(s ?? "");
}
var oo, ao;
class zc extends (ao = se, oo = O, ao) {
  constructor(e) {
    super(e, "string", "PgMacaddr8");
  }
  /** @internal */
  build(e) {
    return new Wc(e, this.config);
  }
}
w(zc, oo, "PgMacaddr8Builder");
var uo, lo;
class Wc extends (lo = H, uo = O, lo) {
  getSQLType() {
    return "macaddr8";
  }
}
w(Wc, uo, "PgMacaddr8");
function Sp(s) {
  return new zc(s ?? "");
}
var co, ho;
class Kc extends (ho = se, co = O, ho) {
  constructor(e, t, r) {
    super(e, "string", "PgNumeric"), this.config.precision = t, this.config.scale = r;
  }
  /** @internal */
  build(e) {
    return new ts(e, this.config);
  }
}
w(Kc, co, "PgNumericBuilder");
var fo, po;
class ts extends (po = H, fo = O, po) {
  constructor(t, r) {
    super(t, r);
    w(this, "precision");
    w(this, "scale");
    this.precision = r.precision, this.scale = r.scale;
  }
  mapFromDriverValue(t) {
    return typeof t == "string" ? t : String(t);
  }
  getSQLType() {
    return this.precision !== void 0 && this.scale !== void 0 ? `numeric(${this.precision}, ${this.scale})` : this.precision === void 0 ? "numeric" : `numeric(${this.precision})`;
  }
}
w(ts, fo, "PgNumeric");
var mo, go;
class Gc extends (go = se, mo = O, go) {
  constructor(e, t, r) {
    super(e, "number", "PgNumericNumber"), this.config.precision = t, this.config.scale = r;
  }
  /** @internal */
  build(e) {
    return new Hc(
      e,
      this.config
    );
  }
}
w(Gc, mo, "PgNumericNumberBuilder");
var yo, wo;
class Hc extends (wo = H, yo = O, wo) {
  constructor(t, r) {
    super(t, r);
    w(this, "precision");
    w(this, "scale");
    w(this, "mapToDriverValue", String);
    this.precision = r.precision, this.scale = r.scale;
  }
  mapFromDriverValue(t) {
    return typeof t == "number" ? t : Number(t);
  }
  getSQLType() {
    return this.precision !== void 0 && this.scale !== void 0 ? `numeric(${this.precision}, ${this.scale})` : this.precision === void 0 ? "numeric" : `numeric(${this.precision})`;
  }
}
w(Hc, yo, "PgNumericNumber");
var bo, vo;
class Jc extends (vo = se, bo = O, vo) {
  constructor(e, t, r) {
    super(e, "bigint", "PgNumericBigInt"), this.config.precision = t, this.config.scale = r;
  }
  /** @internal */
  build(e) {
    return new Yc(
      e,
      this.config
    );
  }
}
w(Jc, bo, "PgNumericBigIntBuilder");
var So, _o;
class Yc extends (_o = H, So = O, _o) {
  constructor(t, r) {
    super(t, r);
    w(this, "precision");
    w(this, "scale");
    w(this, "mapFromDriverValue", BigInt);
    w(this, "mapToDriverValue", String);
    this.precision = r.precision, this.scale = r.scale;
  }
  getSQLType() {
    return this.precision !== void 0 && this.scale !== void 0 ? `numeric(${this.precision}, ${this.scale})` : this.precision === void 0 ? "numeric" : `numeric(${this.precision})`;
  }
}
w(Yc, So, "PgNumericBigInt");
function _p(s, e) {
  const { name: t, config: r } = we(s, e), n = r == null ? void 0 : r.mode;
  return n === "number" ? new Gc(t, r == null ? void 0 : r.precision, r == null ? void 0 : r.scale) : n === "bigint" ? new Jc(t, r == null ? void 0 : r.precision, r == null ? void 0 : r.scale) : new Kc(t, r == null ? void 0 : r.precision, r == null ? void 0 : r.scale);
}
var Eo, To;
class Zc extends (To = se, Eo = O, To) {
  constructor(e) {
    super(e, "array", "PgPointTuple");
  }
  /** @internal */
  build(e) {
    return new Xc(
      e,
      this.config
    );
  }
}
w(Zc, Eo, "PgPointTupleBuilder");
var Co, Ao;
class Xc extends (Ao = H, Co = O, Ao) {
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(e) {
    if (typeof e == "string") {
      const [t, r] = e.slice(1, -1).split(",");
      return [Number.parseFloat(t), Number.parseFloat(r)];
    }
    return [e.x, e.y];
  }
  mapToDriverValue(e) {
    return `(${e[0]},${e[1]})`;
  }
}
w(Xc, Co, "PgPointTuple");
var Po, No;
class eh extends (No = se, Po = O, No) {
  constructor(e) {
    super(e, "json", "PgPointObject");
  }
  /** @internal */
  build(e) {
    return new th(
      e,
      this.config
    );
  }
}
w(eh, Po, "PgPointObjectBuilder");
var xo, Io;
class th extends (Io = H, xo = O, Io) {
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(e) {
    if (typeof e == "string") {
      const [t, r] = e.slice(1, -1).split(",");
      return { x: Number.parseFloat(t), y: Number.parseFloat(r) };
    }
    return e;
  }
  mapToDriverValue(e) {
    return `(${e.x},${e.y})`;
  }
}
w(th, xo, "PgPointObject");
function Ep(s, e) {
  const { name: t, config: r } = we(s, e);
  return !(r != null && r.mode) || r.mode === "tuple" ? new Zc(t) : new eh(t);
}
function Tp(s) {
  const e = [];
  for (let t = 0; t < s.length; t += 2)
    e.push(Number.parseInt(s.slice(t, t + 2), 16));
  return new Uint8Array(e);
}
function Ls(s, e) {
  const t = new ArrayBuffer(8), r = new DataView(t);
  for (let n = 0; n < 8; n++)
    r.setUint8(n, s[e + n]);
  return r.getFloat64(0, !0);
}
function rh(s) {
  const e = Tp(s);
  let t = 0;
  const r = e[t];
  t += 1;
  const n = new DataView(e.buffer), i = n.getUint32(t, r === 1);
  if (t += 4, i & 536870912 && (n.getUint32(t, r === 1), t += 4), (i & 65535) === 1) {
    const u = Ls(e, t);
    t += 8;
    const a = Ls(e, t);
    return t += 8, [u, a];
  }
  throw new Error("Unsupported geometry type");
}
var Lo, Oo;
class sh extends (Oo = se, Lo = O, Oo) {
  constructor(e) {
    super(e, "array", "PgGeometry");
  }
  /** @internal */
  build(e) {
    return new nh(
      e,
      this.config
    );
  }
}
w(sh, Lo, "PgGeometryBuilder");
var Bo, Do;
class nh extends (Do = H, Bo = O, Do) {
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(e) {
    return rh(e);
  }
  mapToDriverValue(e) {
    return `point(${e[0]} ${e[1]})`;
  }
}
w(nh, Bo, "PgGeometry");
var Ro, Mo;
class ih extends (Mo = se, Ro = O, Mo) {
  constructor(e) {
    super(e, "json", "PgGeometryObject");
  }
  /** @internal */
  build(e) {
    return new oh(
      e,
      this.config
    );
  }
}
w(ih, Ro, "PgGeometryObjectBuilder");
var $o, qo;
class oh extends (qo = H, $o = O, qo) {
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(e) {
    const t = rh(e);
    return { x: t[0], y: t[1] };
  }
  mapToDriverValue(e) {
    return `point(${e.x} ${e.y})`;
  }
}
w(oh, $o, "PgGeometryObject");
function Cp(s, e) {
  const { name: t, config: r } = we(s, e);
  return !(r != null && r.mode) || r.mode === "tuple" ? new sh(t) : new ih(t);
}
var ko, Qo;
class ah extends (Qo = se, ko = O, Qo) {
  constructor(e, t) {
    super(e, "number", "PgReal"), this.config.length = t;
  }
  /** @internal */
  build(e) {
    return new uh(e, this.config);
  }
}
w(ah, ko, "PgRealBuilder");
var Fo, jo;
class uh extends (jo = H, Fo = O, jo) {
  constructor(t, r) {
    super(t, r);
    w(this, "mapFromDriverValue", (t) => typeof t == "string" ? Number.parseFloat(t) : t);
  }
  getSQLType() {
    return "real";
  }
}
w(uh, Fo, "PgReal");
function Ap(s) {
  return new ah(s ?? "");
}
var Uo, Vo;
class lh extends (Vo = se, Uo = O, Vo) {
  constructor(e) {
    super(e, "number", "PgSerial"), this.config.hasDefault = !0, this.config.notNull = !0;
  }
  /** @internal */
  build(e) {
    return new ch(e, this.config);
  }
}
w(lh, Uo, "PgSerialBuilder");
var zo, Wo;
class ch extends (Wo = H, zo = O, Wo) {
  getSQLType() {
    return "serial";
  }
}
w(ch, zo, "PgSerial");
function Pp(s) {
  return new lh(s ?? "");
}
var Ko, Go;
class hh extends (Go = Bt, Ko = O, Go) {
  constructor(e) {
    super(e, "number", "PgSmallInt");
  }
  /** @internal */
  build(e) {
    return new fh(e, this.config);
  }
}
w(hh, Ko, "PgSmallIntBuilder");
var Ho, Jo;
class fh extends (Jo = H, Ho = O, Jo) {
  constructor() {
    super(...arguments);
    w(this, "mapFromDriverValue", (t) => typeof t == "string" ? Number(t) : t);
  }
  getSQLType() {
    return "smallint";
  }
}
w(fh, Ho, "PgSmallInt");
function Np(s) {
  return new hh(s ?? "");
}
var Yo, Zo;
class dh extends (Zo = se, Yo = O, Zo) {
  constructor(e) {
    super(e, "number", "PgSmallSerial"), this.config.hasDefault = !0, this.config.notNull = !0;
  }
  /** @internal */
  build(e) {
    return new ph(
      e,
      this.config
    );
  }
}
w(dh, Yo, "PgSmallSerialBuilder");
var Xo, ea;
class ph extends (ea = H, Xo = O, ea) {
  getSQLType() {
    return "smallserial";
  }
}
w(ph, Xo, "PgSmallSerial");
function xp(s) {
  return new dh(s ?? "");
}
var ta, ra;
class mh extends (ra = se, ta = O, ra) {
  constructor(e, t) {
    super(e, "string", "PgText"), this.config.enumValues = t.enum;
  }
  /** @internal */
  build(e) {
    return new gh(e, this.config);
  }
}
w(mh, ta, "PgTextBuilder");
var sa, na;
class gh extends (na = H, sa = O, na) {
  constructor() {
    super(...arguments);
    w(this, "enumValues", this.config.enumValues);
  }
  getSQLType() {
    return "text";
  }
}
w(gh, sa, "PgText");
function re(s, e = {}) {
  const { name: t, config: r } = we(s, e);
  return new mh(t, r);
}
var ia, oa;
class yh extends (oa = mt, ia = O, oa) {
  constructor(e, t, r) {
    super(e, "string", "PgTime"), this.withTimezone = t, this.precision = r, this.config.withTimezone = t, this.config.precision = r;
  }
  /** @internal */
  build(e) {
    return new rs(e, this.config);
  }
}
w(yh, ia, "PgTimeBuilder");
var aa, ua;
class rs extends (ua = H, aa = O, ua) {
  constructor(t, r) {
    super(t, r);
    w(this, "withTimezone");
    w(this, "precision");
    this.withTimezone = r.withTimezone, this.precision = r.precision;
  }
  getSQLType() {
    return `time${this.precision === void 0 ? "" : `(${this.precision})`}${this.withTimezone ? " with time zone" : ""}`;
  }
}
w(rs, aa, "PgTime");
function Ip(s, e = {}) {
  const { name: t, config: r } = we(s, e);
  return new yh(t, r.withTimezone ?? !1, r.precision);
}
var la, ca;
class wh extends (ca = mt, la = O, ca) {
  constructor(e, t, r) {
    super(e, "date", "PgTimestamp"), this.config.withTimezone = t, this.config.precision = r;
  }
  /** @internal */
  build(e) {
    return new ss(e, this.config);
  }
}
w(wh, la, "PgTimestampBuilder");
var ha, fa;
class ss extends (fa = H, ha = O, fa) {
  constructor(t, r) {
    super(t, r);
    w(this, "withTimezone");
    w(this, "precision");
    w(this, "mapToDriverValue", (t) => t.toISOString());
    this.withTimezone = r.withTimezone, this.precision = r.precision;
  }
  getSQLType() {
    return `timestamp${this.precision === void 0 ? "" : ` (${this.precision})`}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(t) {
    return typeof t == "string" ? new Date(this.withTimezone ? t : t + "+0000") : t;
  }
}
w(ss, ha, "PgTimestamp");
var da, pa;
class bh extends (pa = mt, da = O, pa) {
  constructor(e, t, r) {
    super(e, "string", "PgTimestampString"), this.config.withTimezone = t, this.config.precision = r;
  }
  /** @internal */
  build(e) {
    return new ns(
      e,
      this.config
    );
  }
}
w(bh, da, "PgTimestampStringBuilder");
var ma, ga;
class ns extends (ga = H, ma = O, ga) {
  constructor(t, r) {
    super(t, r);
    w(this, "withTimezone");
    w(this, "precision");
    this.withTimezone = r.withTimezone, this.precision = r.precision;
  }
  getSQLType() {
    return `timestamp${this.precision === void 0 ? "" : `(${this.precision})`}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(t) {
    if (typeof t == "string") return t;
    const r = t.toISOString().slice(0, -1).replace("T", " ");
    if (this.withTimezone) {
      const n = t.getTimezoneOffset(), i = n <= 0 ? "+" : "-";
      return `${r}${i}${Math.floor(Math.abs(n) / 60).toString().padStart(2, "0")}`;
    }
    return r;
  }
}
w(ns, ma, "PgTimestampString");
function ve(s, e = {}) {
  const { name: t, config: r } = we(s, e);
  return (r == null ? void 0 : r.mode) === "string" ? new bh(t, r.withTimezone ?? !1, r.precision) : new wh(t, (r == null ? void 0 : r.withTimezone) ?? !1, r == null ? void 0 : r.precision);
}
var ya, wa;
class vh extends (wa = se, ya = O, wa) {
  constructor(e) {
    super(e, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(x`gen_random_uuid()`);
  }
  /** @internal */
  build(e) {
    return new is(e, this.config);
  }
}
w(vh, ya, "PgUUIDBuilder");
var ba, va;
class is extends (va = H, ba = O, va) {
  getSQLType() {
    return "uuid";
  }
}
w(is, ba, "PgUUID");
function ue(s) {
  return new vh(s ?? "");
}
var Sa, _a;
class Sh extends (_a = se, Sa = O, _a) {
  constructor(e, t) {
    super(e, "string", "PgVarchar"), this.config.length = t.length, this.config.enumValues = t.enum;
  }
  /** @internal */
  build(e) {
    return new _h(
      e,
      this.config
    );
  }
}
w(Sh, Sa, "PgVarcharBuilder");
var Ea, Ta;
class _h extends (Ta = H, Ea = O, Ta) {
  constructor() {
    super(...arguments);
    w(this, "length", this.config.length);
    w(this, "enumValues", this.config.enumValues);
  }
  getSQLType() {
    return this.length === void 0 ? "varchar" : `varchar(${this.length})`;
  }
}
w(_h, Ea, "PgVarchar");
function Lp(s, e = {}) {
  const { name: t, config: r } = we(s, e);
  return new Sh(t, r);
}
var Ca, Aa;
class Eh extends (Aa = se, Ca = O, Aa) {
  constructor(e, t) {
    super(e, "string", "PgBinaryVector"), this.config.dimensions = t.dimensions;
  }
  /** @internal */
  build(e) {
    return new Th(
      e,
      this.config
    );
  }
}
w(Eh, Ca, "PgBinaryVectorBuilder");
var Pa, Na;
class Th extends (Na = H, Pa = O, Na) {
  constructor() {
    super(...arguments);
    w(this, "dimensions", this.config.dimensions);
  }
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
}
w(Th, Pa, "PgBinaryVector");
function Op(s, e) {
  const { name: t, config: r } = we(s, e);
  return new Eh(t, r);
}
var xa, Ia;
class Ch extends (Ia = se, xa = O, Ia) {
  constructor(e, t) {
    super(e, "array", "PgHalfVector"), this.config.dimensions = t.dimensions;
  }
  /** @internal */
  build(e) {
    return new Ah(
      e,
      this.config
    );
  }
}
w(Ch, xa, "PgHalfVectorBuilder");
var La, Oa;
class Ah extends (Oa = H, La = O, Oa) {
  constructor() {
    super(...arguments);
    w(this, "dimensions", this.config.dimensions);
  }
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(t) {
    return JSON.stringify(t);
  }
  mapFromDriverValue(t) {
    return t.slice(1, -1).split(",").map((r) => Number.parseFloat(r));
  }
}
w(Ah, La, "PgHalfVector");
function Bp(s, e) {
  const { name: t, config: r } = we(s, e);
  return new Ch(t, r);
}
var Ba, Da;
class Ph extends (Da = se, Ba = O, Da) {
  constructor(e, t) {
    super(e, "string", "PgSparseVector"), this.config.dimensions = t.dimensions;
  }
  /** @internal */
  build(e) {
    return new Nh(
      e,
      this.config
    );
  }
}
w(Ph, Ba, "PgSparseVectorBuilder");
var Ra, Ma;
class Nh extends (Ma = H, Ra = O, Ma) {
  constructor() {
    super(...arguments);
    w(this, "dimensions", this.config.dimensions);
  }
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
}
w(Nh, Ra, "PgSparseVector");
function Dp(s, e) {
  const { name: t, config: r } = we(s, e);
  return new Ph(t, r);
}
var $a, qa;
class xh extends (qa = se, $a = O, qa) {
  constructor(e, t) {
    super(e, "array", "PgVector"), this.config.dimensions = t.dimensions;
  }
  /** @internal */
  build(e) {
    return new Ih(
      e,
      this.config
    );
  }
}
w(xh, $a, "PgVectorBuilder");
var ka, Qa;
class Ih extends (Qa = H, ka = O, Qa) {
  constructor() {
    super(...arguments);
    w(this, "dimensions", this.config.dimensions);
  }
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(t) {
    return JSON.stringify(t);
  }
  mapFromDriverValue(t) {
    return t.slice(1, -1).split(",").map((r) => Number.parseFloat(r));
  }
}
w(Ih, ka, "PgVector");
function Rp(s, e) {
  const { name: t, config: r } = we(s, e);
  return new xh(t, r);
}
function Mp() {
  return {
    bigint: lp,
    bigserial: cp,
    boolean: vc,
    char: hp,
    cidr: fp,
    customType: dp,
    date: pp,
    doublePrecision: mp,
    inet: gp,
    integer: xt,
    interval: yp,
    json: wp,
    jsonb: Ne,
    line: bp,
    macaddr: vp,
    macaddr8: Sp,
    numeric: _p,
    point: Ep,
    geometry: Cp,
    real: Ap,
    serial: Pp,
    smallint: Np,
    smallserial: xp,
    text: re,
    time: Ip,
    timestamp: ve,
    uuid: ue,
    varchar: Lp,
    bit: Op,
    halfvec: Bp,
    sparsevec: Dp,
    vector: Rp
  };
}
const Pr = Symbol.for("drizzle:PgInlineForeignKeys"), Os = Symbol.for("drizzle:EnableRLS");
var Fa, ja, Ua, Va, za, Wa;
class Se extends (Wa = j, za = O, Va = Pr, Ua = Os, ja = j.Symbol.ExtraConfigBuilder, Fa = j.Symbol.ExtraConfigColumns, Wa) {
  constructor() {
    super(...arguments);
    /**@internal */
    w(this, Va, []);
    /** @internal */
    w(this, Ua, !1);
    /** @internal */
    w(this, ja);
    /** @internal */
    w(this, Fa, {});
  }
}
w(Se, za, "PgTable"), /** @internal */
w(Se, "Symbol", Object.assign({}, j.Symbol, {
  InlineForeignKeys: Pr,
  EnableRLS: Os
}));
function $p(s, e, t, r, n = s) {
  const i = new Se(s, r, n), u = typeof e == "function" ? e(Mp()) : e, a = Object.fromEntries(
    Object.entries(u).map(([d, v]) => {
      const g = v;
      g.setName(d);
      const S = g.build(i);
      return i[Pr].push(...g.buildForeignKeys(S, i)), [d, S];
    })
  ), f = Object.fromEntries(
    Object.entries(u).map(([d, v]) => {
      const g = v;
      g.setName(d);
      const S = g.buildExtraConfigColumn(i);
      return [d, S];
    })
  ), y = Object.assign(i, a);
  return y[j.Symbol.Columns] = a, y[j.Symbol.ExtraConfigColumns] = f, t && (y[Se.Symbol.ExtraConfigBuilder] = t), Object.assign(y, {
    enableRLS: () => (y[Se.Symbol.EnableRLS] = !0, y)
  });
}
const Me = (s, e, t) => $p(s, e, t, void 0);
var Ka;
Ka = O;
class os {
  constructor(e, t) {
    this.unique = e, this.name = t;
  }
  on(...e) {
    return new Ut(
      e.map((t) => {
        if (k(t, z))
          return t;
        t = t;
        const r = new jt(t.name, !!t.keyAsName, t.columnType, t.indexConfig);
        return t.indexConfig = JSON.parse(JSON.stringify(t.defaultConfig)), r;
      }),
      this.unique,
      !1,
      this.name
    );
  }
  onOnly(...e) {
    return new Ut(
      e.map((t) => {
        if (k(t, z))
          return t;
        t = t;
        const r = new jt(t.name, !!t.keyAsName, t.columnType, t.indexConfig);
        return t.indexConfig = t.defaultConfig, r;
      }),
      this.unique,
      !0,
      this.name
    );
  }
  /**
   * Specify what index method to use. Choices are `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed access methods like `bloom`. The default method is `btree.
   *
   * If you have the `pg_vector` extension installed in your database, you can use the `hnsw` and `ivfflat` options, which are predefined types.
   *
   * **You can always specify any string you want in the method, in case Drizzle doesn't have it natively in its types**
   *
   * @param method The name of the index method to be used
   * @param columns
   * @returns
   */
  using(e, ...t) {
    return new Ut(
      t.map((r) => {
        if (k(r, z))
          return r;
        r = r;
        const n = new jt(r.name, !!r.keyAsName, r.columnType, r.indexConfig);
        return r.indexConfig = JSON.parse(JSON.stringify(r.defaultConfig)), n;
      }),
      this.unique,
      !0,
      this.name,
      e
    );
  }
}
w(os, Ka, "PgIndexBuilderOn");
var Ga;
Ga = O;
class Ut {
  constructor(e, t, r, n, i = "btree") {
    /** @internal */
    w(this, "config");
    this.config = {
      name: n,
      columns: e,
      unique: t,
      only: r,
      method: i
    };
  }
  concurrently() {
    return this.config.concurrently = !0, this;
  }
  with(e) {
    return this.config.with = e, this;
  }
  where(e) {
    return this.config.where = e, this;
  }
  /** @internal */
  build(e) {
    return new Lh(this.config, e);
  }
}
w(Ut, Ga, "PgIndexBuilder");
var Ha;
Ha = O;
class Lh {
  constructor(e, t) {
    w(this, "config");
    this.config = { ...e, table: t };
  }
}
w(Lh, Ha, "PgIndex");
function Ee(s) {
  return new os(!1, s);
}
function Ge(s) {
  return new os(!0, s);
}
var Ja;
Ja = O;
class Oh {
  constructor(e, t) {
    /** @internal */
    w(this, "columns");
    /** @internal */
    w(this, "name");
    this.columns = e, this.name = t;
  }
  /** @internal */
  build(e) {
    return new Bh(e, this.columns, this.name);
  }
}
w(Oh, Ja, "PgPrimaryKeyBuilder");
var Ya;
Ya = O;
class Bh {
  constructor(e, t, r) {
    w(this, "columns");
    w(this, "name");
    this.table = e, this.columns = t, this.name = r;
  }
  getName() {
    return this.name ?? `${this.table[Se.Symbol.Name]}_${this.columns.map((e) => e.name).join("_")}_pk`;
  }
}
w(Bh, Ya, "PgPrimaryKey");
function qp(s) {
  return (s.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? []).map((t) => t.toLowerCase()).join("_");
}
function kp(s) {
  return (s.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? []).reduce((t, r, n) => {
    const i = n === 0 ? r.toLowerCase() : `${r[0].toUpperCase()}${r.slice(1)}`;
    return t + i;
  }, "");
}
function Qp(s) {
  return s;
}
var Za;
Za = O;
class Dh {
  constructor(e) {
    /** @internal */
    w(this, "cache", {});
    w(this, "cachedTables", {});
    w(this, "convert");
    this.convert = e === "snake_case" ? qp : e === "camelCase" ? kp : Qp;
  }
  getColumnCasing(e) {
    if (!e.keyAsName) return e.name;
    const t = e.table[j.Symbol.Schema] ?? "public", r = e.table[j.Symbol.OriginalName], n = `${t}.${r}.${e.name}`;
    return this.cache[n] || this.cacheTable(e.table), this.cache[n];
  }
  cacheTable(e) {
    const t = e[j.Symbol.Schema] ?? "public", r = e[j.Symbol.OriginalName], n = `${t}.${r}`;
    if (!this.cachedTables[n]) {
      for (const i of Object.values(e[j.Symbol.Columns])) {
        const u = `${n}.${i.name}`;
        this.cache[u] = this.convert(i.name);
      }
      this.cachedTables[n] = !0;
    }
  }
  clearCache() {
    this.cache = {}, this.cachedTables = {};
  }
}
w(Dh, Za, "CasingCache");
var Xa, eu;
class Rh extends (eu = Error, Xa = O, eu) {
  constructor({ message: e, cause: t }) {
    super(e), this.name = "DrizzleError", this.cause = t;
  }
}
w(Rh, Xa, "DrizzleError");
class We extends Error {
  constructor(e, t, r) {
    super(`Failed query: ${e}
params: ${t}`), this.query = e, this.params = t, this.cause = r, Error.captureStackTrace(this, We), r && (this.cause = r);
  }
}
function Te(s, e) {
  return sp(e) && !ic(s) && !k(s, Ue) && !k(s, tt) && !k(s, he) && !k(s, j) && !k(s, Je) ? new Ue(s, e) : s;
}
const Mh = (s, e) => x`${s} = ${Te(e, s)}`, Fp = (s, e) => x`${s} <> ${Te(e, s)}`;
function Nr(...s) {
  const e = s.filter(
    (t) => t !== void 0
  );
  if (e.length !== 0)
    return e.length === 1 ? new z(e) : new z([
      new ge("("),
      x.join(e, new ge(" and ")),
      new ge(")")
    ]);
}
function jp(...s) {
  const e = s.filter(
    (t) => t !== void 0
  );
  if (e.length !== 0)
    return e.length === 1 ? new z(e) : new z([
      new ge("("),
      x.join(e, new ge(" or ")),
      new ge(")")
    ]);
}
function Up(s) {
  return x`not ${s}`;
}
const Vp = (s, e) => x`${s} > ${Te(e, s)}`, zp = (s, e) => x`${s} >= ${Te(e, s)}`, Wp = (s, e) => x`${s} < ${Te(e, s)}`, Kp = (s, e) => x`${s} <= ${Te(e, s)}`;
function Gp(s, e) {
  return Array.isArray(e) ? e.length === 0 ? x`false` : x`${s} in ${e.map((t) => Te(t, s))}` : x`${s} in ${Te(e, s)}`;
}
function Hp(s, e) {
  return Array.isArray(e) ? e.length === 0 ? x`true` : x`${s} not in ${e.map((t) => Te(t, s))}` : x`${s} not in ${Te(e, s)}`;
}
function Jp(s) {
  return x`${s} is null`;
}
function Yp(s) {
  return x`${s} is not null`;
}
function Zp(s) {
  return x`exists ${s}`;
}
function Xp(s) {
  return x`not exists ${s}`;
}
function em(s, e, t) {
  return x`${s} between ${Te(e, s)} and ${Te(
    t,
    s
  )}`;
}
function tm(s, e, t) {
  return x`${s} not between ${Te(
    e,
    s
  )} and ${Te(t, s)}`;
}
function rm(s, e) {
  return x`${s} like ${e}`;
}
function sm(s, e) {
  return x`${s} not like ${e}`;
}
function nm(s, e) {
  return x`${s} ilike ${e}`;
}
function im(s, e) {
  return x`${s} not ilike ${e}`;
}
function om(s) {
  return x`${s} asc`;
}
function am(s) {
  return x`${s} desc`;
}
var tu;
tu = O;
class as {
  constructor(e, t, r) {
    w(this, "referencedTableName");
    w(this, "fieldName");
    this.sourceTable = e, this.referencedTable = t, this.relationName = r, this.referencedTableName = t[j.Symbol.Name];
  }
}
w(as, tu, "Relation");
var ru;
ru = O;
class $h {
  constructor(e, t) {
    this.table = e, this.config = t;
  }
}
w($h, ru, "Relations");
var su, nu;
const er = class er extends (nu = as, su = O, nu) {
  constructor(e, t, r, n) {
    super(e, t, r == null ? void 0 : r.relationName), this.config = r, this.isNullable = n;
  }
  withFieldName(e) {
    const t = new er(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    return t.fieldName = e, t;
  }
};
w(er, su, "One");
let st = er;
var iu, ou;
const tr = class tr extends (ou = as, iu = O, ou) {
  constructor(e, t, r) {
    super(e, t, r == null ? void 0 : r.relationName), this.config = r;
  }
  withFieldName(e) {
    const t = new tr(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    return t.fieldName = e, t;
  }
};
w(tr, iu, "Many");
let Jt = tr;
function um() {
  return {
    and: Nr,
    between: em,
    eq: Mh,
    exists: Zp,
    gt: Vp,
    gte: zp,
    ilike: nm,
    inArray: Gp,
    isNull: Jp,
    isNotNull: Yp,
    like: rm,
    lt: Wp,
    lte: Kp,
    ne: Fp,
    not: Up,
    notBetween: tm,
    notExists: Xp,
    notLike: sm,
    notIlike: im,
    notInArray: Hp,
    or: jp,
    sql: x
  };
}
function lm() {
  return {
    sql: x,
    asc: om,
    desc: am
  };
}
function cm(s, e) {
  var i;
  Object.keys(s).length === 1 && "default" in s && !k(s.default, j) && (s = s.default);
  const t = {}, r = {}, n = {};
  for (const [u, a] of Object.entries(s))
    if (k(a, j)) {
      const f = Pt(a), y = r[f];
      t[f] = u, n[u] = {
        tsName: u,
        dbName: a[j.Symbol.Name],
        schema: a[j.Symbol.Schema],
        columns: a[j.Symbol.Columns],
        relations: (y == null ? void 0 : y.relations) ?? {},
        primaryKey: (y == null ? void 0 : y.primaryKey) ?? []
      };
      for (const v of Object.values(
        a[j.Symbol.Columns]
      ))
        v.primary && n[u].primaryKey.push(v);
      const d = (i = a[j.Symbol.ExtraConfigBuilder]) == null ? void 0 : i.call(a, a[j.Symbol.ExtraConfigColumns]);
      if (d)
        for (const v of Object.values(d))
          k(v, Oh) && n[u].primaryKey.push(...v.columns);
    } else if (k(a, $h)) {
      const f = Pt(a.table), y = t[f], d = a.config(
        e(a.table)
      );
      let v;
      for (const [g, S] of Object.entries(d))
        if (y) {
          const c = n[y];
          c.relations[g] = S;
        } else
          f in r || (r[f] = {
            relations: {},
            primaryKey: v
          }), r[f].relations[g] = S;
    }
  return { tables: n, tableNamesMap: t };
}
function hm(s) {
  return function(t, r) {
    return new st(
      s,
      t,
      r,
      (r == null ? void 0 : r.fields.reduce((n, i) => n && i.notNull, !0)) ?? !1
    );
  };
}
function fm(s) {
  return function(t, r) {
    return new Jt(s, t, r);
  };
}
function dm(s, e, t) {
  if (k(t, st) && t.config)
    return {
      fields: t.config.fields,
      references: t.config.references
    };
  const r = e[Pt(t.referencedTable)];
  if (!r)
    throw new Error(
      `Table "${t.referencedTable[j.Symbol.Name]}" not found in schema`
    );
  const n = s[r];
  if (!n)
    throw new Error(`Table "${r}" not found in schema`);
  const i = t.sourceTable, u = e[Pt(i)];
  if (!u)
    throw new Error(
      `Table "${i[j.Symbol.Name]}" not found in schema`
    );
  const a = [];
  for (const f of Object.values(
    n.relations
  ))
    (t.relationName && t !== f && f.relationName === t.relationName || !t.relationName && f.referencedTable === t.sourceTable) && a.push(f);
  if (a.length > 1)
    throw t.relationName ? new Error(
      `There are multiple relations with name "${t.relationName}" in table "${r}"`
    ) : new Error(
      `There are multiple relations between "${r}" and "${t.sourceTable[j.Symbol.Name]}". Please specify relation name`
    );
  if (a[0] && k(a[0], st) && a[0].config)
    return {
      fields: a[0].config.references,
      references: a[0].config.fields
    };
  throw new Error(
    `There is not enough information to infer relation "${u}.${t.fieldName}"`
  );
}
function pm(s) {
  return {
    one: hm(s),
    many: fm(s)
  };
}
function xr(s, e, t, r, n = (i) => i) {
  const i = {};
  for (const [
    u,
    a
  ] of r.entries())
    if (a.isJson) {
      const f = e.relations[a.tsKey], y = t[u], d = typeof y == "string" ? JSON.parse(y) : y;
      i[a.tsKey] = k(f, st) ? d && xr(
        s,
        s[a.relationTableTsKey],
        d,
        a.selection,
        n
      ) : d.map(
        (v) => xr(
          s,
          s[a.relationTableTsKey],
          v,
          a.selection,
          n
        )
      );
    } else {
      const f = n(t[u]), y = a.field;
      let d;
      k(y, he) ? d = y : k(y, z) ? d = y.decoder : d = y.sql.decoder, i[a.tsKey] = f === null ? null : d.mapFromDriverValue(f);
    }
  return i;
}
var au, uu;
class us extends (uu = Je, au = O, uu) {
}
w(us, au, "PgViewBase");
var lu;
lu = O;
class Tt {
  constructor(e) {
    /** @internal */
    w(this, "casing");
    this.casing = new Dh(e == null ? void 0 : e.casing);
  }
  async migrate(e, t, r) {
    const n = typeof r == "string" ? "__drizzle_migrations" : r.migrationsTable ?? "__drizzle_migrations", i = typeof r == "string" ? "drizzle" : r.migrationsSchema ?? "drizzle", u = x`
			CREATE TABLE IF NOT EXISTS ${x.identifier(i)}.${x.identifier(n)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await t.execute(x`CREATE SCHEMA IF NOT EXISTS ${x.identifier(i)}`), await t.execute(u);
    const f = (await t.all(
      x`select id, hash, created_at from ${x.identifier(i)}.${x.identifier(n)} order by created_at desc limit 1`
    ))[0];
    await t.transaction(async (y) => {
      for await (const d of e)
        if (!f || Number(f.created_at) < d.folderMillis) {
          for (const v of d.sql)
            await y.execute(x.raw(v));
          await y.execute(
            x`insert into ${x.identifier(i)}.${x.identifier(n)} ("hash", "created_at") values(${d.hash}, ${d.folderMillis})`
          );
        }
    });
  }
  escapeName(e) {
    return `"${e.replace(/"/g, '""')}"`;
  }
  escapeParam(e) {
    return `$${e + 1}`;
  }
  escapeString(e) {
    return `'${e.replace(/'/g, "''")}'`;
  }
  buildWithCTE(e) {
    if (!(e != null && e.length)) return;
    const t = [x`with `];
    for (const [r, n] of e.entries())
      t.push(x`${x.identifier(n._.alias)} as (${n._.sql})`), r < e.length - 1 && t.push(x`, `);
    return t.push(x` `), x.join(t);
  }
  buildDeleteQuery({ table: e, where: t, returning: r, withList: n }) {
    const i = this.buildWithCTE(n), u = r ? x` returning ${this.buildSelection(r, { isSingleTable: !0 })}` : void 0, a = t ? x` where ${t}` : void 0;
    return x`${i}delete from ${e}${a}${u}`;
  }
  buildUpdateSet(e, t) {
    const r = e[j.Symbol.Columns], n = Object.keys(r).filter(
      (u) => {
        var a;
        return t[u] !== void 0 || ((a = r[u]) == null ? void 0 : a.onUpdateFn) !== void 0;
      }
    ), i = n.length;
    return x.join(n.flatMap((u, a) => {
      var g;
      const f = r[u], y = (g = f.onUpdateFn) == null ? void 0 : g.call(f), d = t[u] ?? (k(y, z) ? y : x.param(y, f)), v = x`${x.identifier(this.casing.getColumnCasing(f))} = ${d}`;
      return a < i - 1 ? [v, x.raw(", ")] : [v];
    }));
  }
  buildUpdateQuery({ table: e, set: t, where: r, returning: n, withList: i, from: u, joins: a }) {
    const f = this.buildWithCTE(i), y = e[Se.Symbol.Name], d = e[Se.Symbol.Schema], v = e[Se.Symbol.OriginalName], g = y === v ? void 0 : y, S = x`${d ? x`${x.identifier(d)}.` : void 0}${x.identifier(v)}${g && x` ${x.identifier(g)}`}`, c = this.buildUpdateSet(e, t), h = u && x.join([x.raw(" from "), this.buildFromTable(u)]), b = this.buildJoins(a), _ = n ? x` returning ${this.buildSelection(n, { isSingleTable: !u })}` : void 0, C = r ? x` where ${r}` : void 0;
    return x`${f}update ${S} set ${c}${h}${b}${C}${_}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(e, { isSingleTable: t = !1 } = {}) {
    const r = e.length, n = e.flatMap(({ field: i }, u) => {
      const a = [];
      if (k(i, z.Aliased) && i.isSelectionField)
        a.push(x.identifier(i.fieldAlias));
      else if (k(i, z.Aliased) || k(i, z)) {
        const f = k(i, z.Aliased) ? i.sql : i;
        t ? a.push(
          new z(
            f.queryChunks.map((y) => k(y, H) ? x.identifier(this.casing.getColumnCasing(y)) : y)
          )
        ) : a.push(f), k(i, z.Aliased) && a.push(x` as ${x.identifier(i.fieldAlias)}`);
      } else if (k(i, he))
        t ? a.push(x.identifier(this.casing.getColumnCasing(i))) : a.push(i);
      else if (k(i, be)) {
        const f = Object.entries(i._.selectedFields);
        if (f.length === 1) {
          const y = f[0][1], d = k(y, z) ? y.decoder : k(y, he) ? { mapFromDriverValue: (v) => y.mapFromDriverValue(v) } : y.sql.decoder;
          d && (i._.sql.decoder = d);
        }
        a.push(i);
      }
      return u < r - 1 && a.push(x`, `), a;
    });
    return x.join(n);
  }
  buildJoins(e) {
    if (!e || e.length === 0)
      return;
    const t = [];
    for (const [r, n] of e.entries()) {
      r === 0 && t.push(x` `);
      const i = n.table, u = n.lateral ? x` lateral` : void 0, a = n.on ? x` on ${n.on}` : void 0;
      if (k(i, Se)) {
        const f = i[Se.Symbol.Name], y = i[Se.Symbol.Schema], d = i[Se.Symbol.OriginalName], v = f === d ? void 0 : n.alias;
        t.push(
          x`${x.raw(n.joinType)} join${u} ${y ? x`${x.identifier(y)}.` : void 0}${x.identifier(d)}${v && x` ${x.identifier(v)}`}${a}`
        );
      } else if (k(i, Je)) {
        const f = i[de].name, y = i[de].schema, d = i[de].originalName, v = f === d ? void 0 : n.alias;
        t.push(
          x`${x.raw(n.joinType)} join${u} ${y ? x`${x.identifier(y)}.` : void 0}${x.identifier(d)}${v && x` ${x.identifier(v)}`}${a}`
        );
      } else
        t.push(
          x`${x.raw(n.joinType)} join${u} ${i}${a}`
        );
      r < e.length - 1 && t.push(x` `);
    }
    return x.join(t);
  }
  buildFromTable(e) {
    if (k(e, j) && e[j.Symbol.IsAlias]) {
      let t = x`${x.identifier(e[j.Symbol.OriginalName])}`;
      return e[j.Symbol.Schema] && (t = x`${x.identifier(e[j.Symbol.Schema])}.${t}`), x`${t} ${x.identifier(e[j.Symbol.Name])}`;
    }
    return e;
  }
  buildSelectQuery({
    withList: e,
    fields: t,
    fieldsFlat: r,
    where: n,
    having: i,
    table: u,
    joins: a,
    orderBy: f,
    groupBy: y,
    limit: d,
    offset: v,
    lockingClause: g,
    distinct: S,
    setOperators: c
  }) {
    const h = r ?? rt(t);
    for (const M of h)
      if (k(M.field, he) && je(M.field.table) !== (k(u, be) ? u._.alias : k(u, us) ? u[de].name : k(u, z) ? void 0 : je(u)) && !((F) => a == null ? void 0 : a.some(
        ({ alias: G }) => G === (F[j.Symbol.IsAlias] ? je(F) : F[j.Symbol.BaseName])
      ))(M.field.table)) {
        const F = je(M.field.table);
        throw new Error(
          `Your "${M.path.join("->")}" field references a column "${F}"."${M.field.name}", but the table "${F}" is not part of the query! Did you forget to join it?`
        );
      }
    const b = !a || a.length === 0, _ = this.buildWithCTE(e);
    let C;
    S && (C = S === !0 ? x` distinct` : x` distinct on (${x.join(S.on, x`, `)})`);
    const A = this.buildSelection(h, { isSingleTable: b }), B = this.buildFromTable(u), R = this.buildJoins(a), E = n ? x` where ${n}` : void 0, I = i ? x` having ${i}` : void 0;
    let N;
    f && f.length > 0 && (N = x` order by ${x.join(f, x`, `)}`);
    let T;
    y && y.length > 0 && (T = x` group by ${x.join(y, x`, `)}`);
    const $ = typeof d == "object" || typeof d == "number" && d >= 0 ? x` limit ${d}` : void 0, D = v ? x` offset ${v}` : void 0, U = x.empty();
    if (g) {
      const M = x` for ${x.raw(g.strength)}`;
      g.config.of && M.append(
        x` of ${x.join(
          Array.isArray(g.config.of) ? g.config.of : [g.config.of],
          x`, `
        )}`
      ), g.config.noWait ? M.append(x` nowait`) : g.config.skipLocked && M.append(x` skip locked`), U.append(M);
    }
    const V = x`${_}select${C} ${A} from ${B}${R}${E}${T}${I}${N}${$}${D}${U}`;
    return c.length > 0 ? this.buildSetOperations(V, c) : V;
  }
  buildSetOperations(e, t) {
    const [r, ...n] = t;
    if (!r)
      throw new Error("Cannot pass undefined values to any set operator");
    return n.length === 0 ? this.buildSetOperationQuery({ leftSelect: e, setOperator: r }) : this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect: e, setOperator: r }),
      n
    );
  }
  buildSetOperationQuery({
    leftSelect: e,
    setOperator: { type: t, isAll: r, rightSelect: n, limit: i, orderBy: u, offset: a }
  }) {
    const f = x`(${e.getSQL()}) `, y = x`(${n.getSQL()})`;
    let d;
    if (u && u.length > 0) {
      const c = [];
      for (const h of u)
        if (k(h, H))
          c.push(x.identifier(h.name));
        else if (k(h, z)) {
          for (let b = 0; b < h.queryChunks.length; b++) {
            const _ = h.queryChunks[b];
            k(_, H) && (h.queryChunks[b] = x.identifier(_.name));
          }
          c.push(x`${h}`);
        } else
          c.push(x`${h}`);
      d = x` order by ${x.join(c, x`, `)} `;
    }
    const v = typeof i == "object" || typeof i == "number" && i >= 0 ? x` limit ${i}` : void 0, g = x.raw(`${t} ${r ? "all " : ""}`), S = a ? x` offset ${a}` : void 0;
    return x`${f}${g}${y}${d}${v}${S}`;
  }
  buildInsertQuery({ table: e, values: t, onConflict: r, returning: n, withList: i, select: u, overridingSystemValue_: a }) {
    const f = [], y = e[j.Symbol.Columns], d = Object.entries(y).filter(([_, C]) => !C.shouldDisableInsert()), v = d.map(
      ([, _]) => x.identifier(this.casing.getColumnCasing(_))
    );
    if (u) {
      const _ = t;
      k(_, z) ? f.push(_) : f.push(_.getSQL());
    } else {
      const _ = t;
      f.push(x.raw("values "));
      for (const [C, A] of _.entries()) {
        const B = [];
        for (const [R, E] of d) {
          const I = A[R];
          if (I === void 0 || k(I, Ue) && I.value === void 0)
            if (E.defaultFn !== void 0) {
              const N = E.defaultFn(), T = k(N, z) ? N : x.param(N, E);
              B.push(T);
            } else if (!E.default && E.onUpdateFn !== void 0) {
              const N = E.onUpdateFn(), T = k(N, z) ? N : x.param(N, E);
              B.push(T);
            } else
              B.push(x`default`);
          else
            B.push(I);
        }
        f.push(B), C < _.length - 1 && f.push(x`, `);
      }
    }
    const g = this.buildWithCTE(i), S = x.join(f), c = n ? x` returning ${this.buildSelection(n, { isSingleTable: !0 })}` : void 0, h = r ? x` on conflict ${r}` : void 0, b = a === !0 ? x`overriding system value ` : void 0;
    return x`${g}insert into ${e} ${v} ${b}${S}${h}${c}`;
  }
  buildRefreshMaterializedViewQuery({ view: e, concurrently: t, withNoData: r }) {
    const n = t ? x` concurrently` : void 0, i = r ? x` with no data` : void 0;
    return x`refresh materialized view${n} ${e}${i}`;
  }
  prepareTyping(e) {
    return k(e, es) || k(e, Xr) ? "json" : k(e, ts) ? "decimal" : k(e, rs) ? "time" : k(e, ss) || k(e, ns) ? "timestamp" : k(e, Yr) || k(e, Zr) ? "date" : k(e, is) ? "uuid" : "none";
  }
  sqlToQuery(e, t) {
    return e.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource: t
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema: e,
    schema: t,
    tableNamesMap: r,
    table: n,
    tableConfig: i,
    queryConfig: u,
    tableAlias: a,
    nestedQueryRelation: f,
    joinOn: y
  }) {
    let d = [], v, g, S = [], c;
    const h = [];
    if (u === !0)
      d = Object.entries(i.columns).map(([C, A]) => ({
        dbKey: A.name,
        tsKey: C,
        field: Fe(A, a),
        relationTableTsKey: void 0,
        isJson: !1,
        selection: []
      }));
    else {
      const _ = Object.fromEntries(
        Object.entries(i.columns).map(([I, N]) => [I, Fe(N, a)])
      );
      if (u.where) {
        const I = typeof u.where == "function" ? u.where(_, um()) : u.where;
        c = I && Ht(I, a);
      }
      const C = [];
      let A = [];
      if (u.columns) {
        let I = !1;
        for (const [N, T] of Object.entries(u.columns))
          T !== void 0 && N in i.columns && (!I && T === !0 && (I = !0), A.push(N));
        A.length > 0 && (A = I ? A.filter((N) => {
          var T;
          return ((T = u.columns) == null ? void 0 : T[N]) === !0;
        }) : Object.keys(i.columns).filter((N) => !A.includes(N)));
      } else
        A = Object.keys(i.columns);
      for (const I of A) {
        const N = i.columns[I];
        C.push({ tsKey: I, value: N });
      }
      let B = [];
      u.with && (B = Object.entries(u.with).filter((I) => !!I[1]).map(([I, N]) => ({ tsKey: I, queryConfig: N, relation: i.relations[I] })));
      let R;
      if (u.extras) {
        R = typeof u.extras == "function" ? u.extras(_, { sql: x }) : u.extras;
        for (const [I, N] of Object.entries(R))
          C.push({
            tsKey: I,
            value: uc(N, a)
          });
      }
      for (const { tsKey: I, value: N } of C)
        d.push({
          dbKey: k(N, z.Aliased) ? N.fieldAlias : i.columns[I].name,
          tsKey: I,
          field: k(N, he) ? Fe(N, a) : N,
          relationTableTsKey: void 0,
          isJson: !1,
          selection: []
        });
      let E = typeof u.orderBy == "function" ? u.orderBy(_, lm()) : u.orderBy ?? [];
      Array.isArray(E) || (E = [E]), S = E.map((I) => k(I, he) ? Fe(I, a) : Ht(I, a)), v = u.limit, g = u.offset;
      for (const {
        tsKey: I,
        queryConfig: N,
        relation: T
      } of B) {
        const $ = dm(t, r, T), D = Pt(T.referencedTable), U = r[D], V = `${a}_${I}`, M = Nr(
          ...$.fields.map(
            (Z, ne) => Mh(
              Fe($.references[ne], V),
              Fe(Z, a)
            )
          )
        ), F = this.buildRelationalQueryWithoutPK({
          fullSchema: e,
          schema: t,
          tableNamesMap: r,
          table: e[U],
          tableConfig: t[U],
          queryConfig: k(T, st) ? N === !0 ? { limit: 1 } : { ...N, limit: 1 } : N,
          tableAlias: V,
          joinOn: M,
          nestedQueryRelation: T
        }), G = x`${x.identifier(V)}.${x.identifier("data")}`.as(I);
        h.push({
          on: x`true`,
          table: new be(F.sql, {}, V),
          alias: V,
          joinType: "left",
          lateral: !0
        }), d.push({
          dbKey: I,
          tsKey: I,
          field: G,
          relationTableTsKey: U,
          isJson: !0,
          selection: F.selection
        });
      }
    }
    if (d.length === 0)
      throw new Rh({ message: `No fields selected for table "${i.tsName}" ("${a}")` });
    let b;
    if (c = Nr(y, c), f) {
      let _ = x`json_build_array(${x.join(
        d.map(
          ({ field: B, tsKey: R, isJson: E }) => E ? x`${x.identifier(`${a}_${R}`)}.${x.identifier("data")}` : k(B, z.Aliased) ? B.sql : B
        ),
        x`, `
      )})`;
      k(f, Jt) && (_ = x`coalesce(json_agg(${_}${S.length > 0 ? x` order by ${x.join(S, x`, `)}` : void 0}), '[]'::json)`);
      const C = [{
        dbKey: "data",
        tsKey: "data",
        field: _.as("data"),
        isJson: !0,
        relationTableTsKey: i.tsName,
        selection: d
      }];
      v !== void 0 || g !== void 0 || S.length > 0 ? (b = this.buildSelectQuery({
        table: vr(n, a),
        fields: {},
        fieldsFlat: [{
          path: [],
          field: x.raw("*")
        }],
        where: c,
        limit: v,
        offset: g,
        orderBy: S,
        setOperators: []
      }), c = void 0, v = void 0, g = void 0, S = []) : b = vr(n, a), b = this.buildSelectQuery({
        table: k(b, Se) ? b : new be(b, {}, a),
        fields: {},
        fieldsFlat: C.map(({ field: B }) => ({
          path: [],
          field: k(B, he) ? Fe(B, a) : B
        })),
        joins: h,
        where: c,
        limit: v,
        offset: g,
        orderBy: S,
        setOperators: []
      });
    } else
      b = this.buildSelectQuery({
        table: vr(n, a),
        fields: {},
        fieldsFlat: d.map(({ field: _ }) => ({
          path: [],
          field: k(_, he) ? Fe(_, a) : _
        })),
        joins: h,
        where: c,
        limit: v,
        offset: g,
        orderBy: S,
        setOperators: []
      });
    return {
      tableTsKey: i.tsName,
      sql: b,
      selection: d
    };
  }
}
w(Tt, lu, "PgDialect");
var cu;
cu = O;
class qh {
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
}
w(qh, cu, "TypedQueryBuilder");
var hu;
hu = O;
class xe {
  constructor(e) {
    w(this, "fields");
    w(this, "session");
    w(this, "dialect");
    w(this, "withList", []);
    w(this, "distinct");
    w(this, "authToken");
    this.fields = e.fields, this.session = e.session, this.dialect = e.dialect, e.withList && (this.withList = e.withList), this.distinct = e.distinct;
  }
  /** @internal */
  setToken(e) {
    return this.authToken = e, this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(e) {
    const t = !!this.fields, r = e;
    let n;
    return this.fields ? n = this.fields : k(r, be) ? n = Object.fromEntries(
      Object.keys(r._.selectedFields).map((i) => [i, r[i]])
    ) : k(r, us) ? n = r[de].selectedFields : k(r, z) ? n = {} : n = ap(r), new ls({
      table: r,
      fields: n,
      isPartialSelect: t,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
}
w(xe, hu, "PgSelectBuilder");
var fu, du;
class kh extends (du = qh, fu = O, du) {
  constructor({ table: t, fields: r, isPartialSelect: n, session: i, dialect: u, withList: a, distinct: f }) {
    super();
    w(this, "_");
    w(this, "config");
    w(this, "joinsNotNullableMap");
    w(this, "tableName");
    w(this, "isPartialSelect");
    w(this, "session");
    w(this, "dialect");
    w(this, "cacheConfig");
    w(this, "usedTables", /* @__PURE__ */ new Set());
    /**
     * Executes a `left join` operation by adding another table to the current query.
     *
     * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
     *
     * @param table the table to join.
     * @param on the `on` clause.
     *
     * @example
     *
     * ```ts
     * // Select all users and their pets
     * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
     *   .from(users)
     *   .leftJoin(pets, eq(users.id, pets.ownerId))
     *
     * // Select userId and petId
     * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
     *   userId: users.id,
     *   petId: pets.id,
     * })
     *   .from(users)
     *   .leftJoin(pets, eq(users.id, pets.ownerId))
     * ```
     */
    w(this, "leftJoin", this.createJoin("left", !1));
    /**
     * Executes a `left join lateral` operation by adding subquery to the current query.
     *
     * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
     *
     * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
     *
     * @param table the subquery to join.
     * @param on the `on` clause.
     */
    w(this, "leftJoinLateral", this.createJoin("left", !0));
    /**
     * Executes a `right join` operation by adding another table to the current query.
     *
     * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
     *
     * @param table the table to join.
     * @param on the `on` clause.
     *
     * @example
     *
     * ```ts
     * // Select all users and their pets
     * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
     *   .from(users)
     *   .rightJoin(pets, eq(users.id, pets.ownerId))
     *
     * // Select userId and petId
     * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
     *   userId: users.id,
     *   petId: pets.id,
     * })
     *   .from(users)
     *   .rightJoin(pets, eq(users.id, pets.ownerId))
     * ```
     */
    w(this, "rightJoin", this.createJoin("right", !1));
    /**
     * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
     *
     * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
     *
     * @param table the table to join.
     * @param on the `on` clause.
     *
     * @example
     *
     * ```ts
     * // Select all users and their pets
     * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
     *   .from(users)
     *   .innerJoin(pets, eq(users.id, pets.ownerId))
     *
     * // Select userId and petId
     * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
     *   userId: users.id,
     *   petId: pets.id,
     * })
     *   .from(users)
     *   .innerJoin(pets, eq(users.id, pets.ownerId))
     * ```
     */
    w(this, "innerJoin", this.createJoin("inner", !1));
    /**
     * Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
     *
     * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
     *
     * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
     *
     * @param table the subquery to join.
     * @param on the `on` clause.
     */
    w(this, "innerJoinLateral", this.createJoin("inner", !0));
    /**
     * Executes a `full join` operation by combining rows from two tables into a new table.
     *
     * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
     *
     * @param table the table to join.
     * @param on the `on` clause.
     *
     * @example
     *
     * ```ts
     * // Select all users and their pets
     * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
     *   .from(users)
     *   .fullJoin(pets, eq(users.id, pets.ownerId))
     *
     * // Select userId and petId
     * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
     *   userId: users.id,
     *   petId: pets.id,
     * })
     *   .from(users)
     *   .fullJoin(pets, eq(users.id, pets.ownerId))
     * ```
     */
    w(this, "fullJoin", this.createJoin("full", !1));
    /**
     * Executes a `cross join` operation by combining rows from two tables into a new table.
     *
     * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
     *
     * @param table the table to join.
     *
     * @example
     *
     * ```ts
     * // Select all users, each user with every pet
     * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
     *   .from(users)
     *   .crossJoin(pets)
     *
     * // Select userId and petId
     * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
     *   userId: users.id,
     *   petId: pets.id,
     * })
     *   .from(users)
     *   .crossJoin(pets)
     * ```
     */
    w(this, "crossJoin", this.createJoin("cross", !1));
    /**
     * Executes a `cross join lateral` operation by combining rows from two queries into a new table.
     *
     * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
     *
     * Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
     *
     * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
     *
     * @param table the query to join.
     */
    w(this, "crossJoinLateral", this.createJoin("cross", !0));
    /**
     * Adds `union` set operator to the query.
     *
     * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
     *
     * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
     *
     * @example
     *
     * ```ts
     * // Select all unique names from customers and users tables
     * await db.select({ name: users.name })
     *   .from(users)
     *   .union(
     *     db.select({ name: customers.name }).from(customers)
     *   );
     * // or
     * import { union } from 'drizzle-orm/pg-core'
     *
     * await union(
     *   db.select({ name: users.name }).from(users),
     *   db.select({ name: customers.name }).from(customers)
     * );
     * ```
     */
    w(this, "union", this.createSetOperator("union", !1));
    /**
     * Adds `union all` set operator to the query.
     *
     * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
     *
     * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
     *
     * @example
     *
     * ```ts
     * // Select all transaction ids from both online and in-store sales
     * await db.select({ transaction: onlineSales.transactionId })
     *   .from(onlineSales)
     *   .unionAll(
     *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
     *   );
     * // or
     * import { unionAll } from 'drizzle-orm/pg-core'
     *
     * await unionAll(
     *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
     *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
     * );
     * ```
     */
    w(this, "unionAll", this.createSetOperator("union", !0));
    /**
     * Adds `intersect` set operator to the query.
     *
     * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
     *
     * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
     *
     * @example
     *
     * ```ts
     * // Select course names that are offered in both departments A and B
     * await db.select({ courseName: depA.courseName })
     *   .from(depA)
     *   .intersect(
     *     db.select({ courseName: depB.courseName }).from(depB)
     *   );
     * // or
     * import { intersect } from 'drizzle-orm/pg-core'
     *
     * await intersect(
     *   db.select({ courseName: depA.courseName }).from(depA),
     *   db.select({ courseName: depB.courseName }).from(depB)
     * );
     * ```
     */
    w(this, "intersect", this.createSetOperator("intersect", !1));
    /**
     * Adds `intersect all` set operator to the query.
     *
     * Calling this method will retain only the rows that are present in both result sets including all duplicates.
     *
     * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
     *
     * @example
     *
     * ```ts
     * // Select all products and quantities that are ordered by both regular and VIP customers
     * await db.select({
     *   productId: regularCustomerOrders.productId,
     *   quantityOrdered: regularCustomerOrders.quantityOrdered
     * })
     * .from(regularCustomerOrders)
     * .intersectAll(
     *   db.select({
     *     productId: vipCustomerOrders.productId,
     *     quantityOrdered: vipCustomerOrders.quantityOrdered
     *   })
     *   .from(vipCustomerOrders)
     * );
     * // or
     * import { intersectAll } from 'drizzle-orm/pg-core'
     *
     * await intersectAll(
     *   db.select({
     *     productId: regularCustomerOrders.productId,
     *     quantityOrdered: regularCustomerOrders.quantityOrdered
     *   })
     *   .from(regularCustomerOrders),
     *   db.select({
     *     productId: vipCustomerOrders.productId,
     *     quantityOrdered: vipCustomerOrders.quantityOrdered
     *   })
     *   .from(vipCustomerOrders)
     * );
     * ```
     */
    w(this, "intersectAll", this.createSetOperator("intersect", !0));
    /**
     * Adds `except` set operator to the query.
     *
     * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
     *
     * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
     *
     * @example
     *
     * ```ts
     * // Select all courses offered in department A but not in department B
     * await db.select({ courseName: depA.courseName })
     *   .from(depA)
     *   .except(
     *     db.select({ courseName: depB.courseName }).from(depB)
     *   );
     * // or
     * import { except } from 'drizzle-orm/pg-core'
     *
     * await except(
     *   db.select({ courseName: depA.courseName }).from(depA),
     *   db.select({ courseName: depB.courseName }).from(depB)
     * );
     * ```
     */
    w(this, "except", this.createSetOperator("except", !1));
    /**
     * Adds `except all` set operator to the query.
     *
     * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
     *
     * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
     *
     * @example
     *
     * ```ts
     * // Select all products that are ordered by regular customers but not by VIP customers
     * await db.select({
     *   productId: regularCustomerOrders.productId,
     *   quantityOrdered: regularCustomerOrders.quantityOrdered,
     * })
     * .from(regularCustomerOrders)
     * .exceptAll(
     *   db.select({
     *     productId: vipCustomerOrders.productId,
     *     quantityOrdered: vipCustomerOrders.quantityOrdered,
     *   })
     *   .from(vipCustomerOrders)
     * );
     * // or
     * import { exceptAll } from 'drizzle-orm/pg-core'
     *
     * await exceptAll(
     *   db.select({
     *     productId: regularCustomerOrders.productId,
     *     quantityOrdered: regularCustomerOrders.quantityOrdered
     *   })
     *   .from(regularCustomerOrders),
     *   db.select({
     *     productId: vipCustomerOrders.productId,
     *     quantityOrdered: vipCustomerOrders.quantityOrdered
     *   })
     *   .from(vipCustomerOrders)
     * );
     * ```
     */
    w(this, "exceptAll", this.createSetOperator("except", !0));
    this.config = {
      withList: a,
      table: t,
      fields: { ...r },
      distinct: f,
      setOperators: []
    }, this.isPartialSelect = n, this.session = i, this.dialect = u, this._ = {
      selectedFields: r,
      config: this.config
    }, this.tableName = Ze(t), this.joinsNotNullableMap = typeof this.tableName == "string" ? { [this.tableName]: !0 } : {};
    for (const y of et(t)) this.usedTables.add(y);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(t, r) {
    return (n, i) => {
      var f;
      const u = this.tableName, a = Ze(n);
      for (const y of et(n)) this.usedTables.add(y);
      if (typeof a == "string" && ((f = this.config.joins) != null && f.some((y) => y.alias === a)))
        throw new Error(`Alias "${a}" is already used in this query`);
      if (!this.isPartialSelect && (Object.keys(this.joinsNotNullableMap).length === 1 && typeof u == "string" && (this.config.fields = {
        [u]: this.config.fields
      }), typeof a == "string" && !k(n, z))) {
        const y = k(n, be) ? n._.selectedFields : k(n, Je) ? n[de].selectedFields : n[j.Symbol.Columns];
        this.config.fields[a] = y;
      }
      if (typeof i == "function" && (i = i(
        new Proxy(
          this.config.fields,
          new _e({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      )), this.config.joins || (this.config.joins = []), this.config.joins.push({ on: i, table: n, joinType: t, alias: a, lateral: r }), typeof a == "string")
        switch (t) {
          case "left": {
            this.joinsNotNullableMap[a] = !1;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([y]) => [y, !1])
            ), this.joinsNotNullableMap[a] = !0;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[a] = !0;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([y]) => [y, !1])
            ), this.joinsNotNullableMap[a] = !1;
            break;
          }
        }
      return this;
    };
  }
  createSetOperator(t, r) {
    return (n) => {
      const i = typeof n == "function" ? n(mm()) : n;
      if (!Jr(this.getSelectedFields(), i.getSelectedFields()))
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      return this.config.setOperators.push({ type: t, isAll: r, rightSelect: i }), this;
    };
  }
  /** @internal */
  addSetOperators(t) {
    return this.config.setOperators.push(...t), this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(t) {
    return typeof t == "function" && (t = t(
      new Proxy(
        this.config.fields,
        new _e({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
      )
    )), this.config.where = t, this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(t) {
    return typeof t == "function" && (t = t(
      new Proxy(
        this.config.fields,
        new _e({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
      )
    )), this.config.having = t, this;
  }
  groupBy(...t) {
    if (typeof t[0] == "function") {
      const r = t[0](
        new Proxy(
          this.config.fields,
          new _e({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(r) ? r : [r];
    } else
      this.config.groupBy = t;
    return this;
  }
  orderBy(...t) {
    if (typeof t[0] == "function") {
      const r = t[0](
        new Proxy(
          this.config.fields,
          new _e({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      ), n = Array.isArray(r) ? r : [r];
      this.config.setOperators.length > 0 ? this.config.setOperators.at(-1).orderBy = n : this.config.orderBy = n;
    } else {
      const r = t;
      this.config.setOperators.length > 0 ? this.config.setOperators.at(-1).orderBy = r : this.config.orderBy = r;
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(t) {
    return this.config.setOperators.length > 0 ? this.config.setOperators.at(-1).limit = t : this.config.limit = t, this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(t) {
    return this.config.setOperators.length > 0 ? this.config.setOperators.at(-1).offset = t : this.config.offset = t, this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(t, r = {}) {
    return this.config.lockingClause = { strength: t, config: r }, this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: t, ...r } = this.dialect.sqlToQuery(this.getSQL());
    return r;
  }
  as(t) {
    const r = [];
    if (r.push(...et(this.config.table)), this.config.joins)
      for (const n of this.config.joins) r.push(...et(n.table));
    return new Proxy(
      new be(this.getSQL(), this.config.fields, t, !1, [...new Set(r)]),
      new _e({ alias: t, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new _e({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
  $withCache(t) {
    return this.cacheConfig = t === void 0 ? { config: {}, enable: !0, autoInvalidate: !0 } : t === !1 ? { enable: !1 } : { enable: !0, autoInvalidate: !0, ...t }, this;
  }
}
w(kh, fu, "PgSelectQueryBuilder");
var pu, mu;
class ls extends (mu = kh, pu = O, mu) {
  constructor() {
    super(...arguments);
    w(this, "authToken");
    w(this, "execute", (t) => Ie.startActiveSpan("drizzle.operation", () => this._prepare().execute(t, this.authToken)));
  }
  /** @internal */
  _prepare(t) {
    const { session: r, config: n, dialect: i, joinsNotNullableMap: u, authToken: a, cacheConfig: f, usedTables: y } = this;
    if (!r)
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    const { fields: d } = n;
    return Ie.startActiveSpan("drizzle.prepareQuery", () => {
      const v = rt(d), g = r.prepareQuery(i.sqlToQuery(this.getSQL()), v, t, !0, void 0, {
        type: "select",
        tables: [...y]
      }, f);
      return g.joinsNotNullableMap = u, g.setToken(a);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(t) {
    return this._prepare(t);
  }
  /** @internal */
  setToken(t) {
    return this.authToken = t, this;
  }
}
w(ls, pu, "PgSelect");
op(ls, [He]);
function gt(s, e) {
  return (t, r, ...n) => {
    const i = [r, ...n].map((u) => ({
      type: s,
      isAll: e,
      rightSelect: u
    }));
    for (const u of i)
      if (!Jr(t.getSelectedFields(), u.rightSelect.getSelectedFields()))
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
    return t.addSetOperators(i);
  };
}
const mm = () => ({
  union: gm,
  unionAll: ym,
  intersect: wm,
  intersectAll: bm,
  except: vm,
  exceptAll: Sm
}), gm = gt("union", !1), ym = gt("union", !0), wm = gt("intersect", !1), bm = gt("intersect", !0), vm = gt("except", !1), Sm = gt("except", !0);
var gu;
gu = O;
class cs {
  constructor(e) {
    w(this, "dialect");
    w(this, "dialectConfig");
    w(this, "$with", (e, t) => {
      const r = this;
      return { as: (i) => (typeof i == "function" && (i = i(r)), new Proxy(
        new Hr(
          i.getSQL(),
          t ?? ("getSelectedFields" in i ? i.getSelectedFields() ?? {} : {}),
          e,
          !0
        ),
        new _e({ alias: e, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      )) };
    });
    this.dialect = k(e, Tt) ? e : void 0, this.dialectConfig = k(e, Tt) ? void 0 : e;
  }
  with(...e) {
    const t = this;
    function r(u) {
      return new xe({
        fields: u ?? void 0,
        session: void 0,
        dialect: t.getDialect(),
        withList: e
      });
    }
    function n(u) {
      return new xe({
        fields: u ?? void 0,
        session: void 0,
        dialect: t.getDialect(),
        distinct: !0
      });
    }
    function i(u, a) {
      return new xe({
        fields: a ?? void 0,
        session: void 0,
        dialect: t.getDialect(),
        distinct: { on: u }
      });
    }
    return { select: r, selectDistinct: n, selectDistinctOn: i };
  }
  select(e) {
    return new xe({
      fields: e ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(e) {
    return new xe({
      fields: e ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: !0
    });
  }
  selectDistinctOn(e, t) {
    return new xe({
      fields: t ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on: e }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    return this.dialect || (this.dialect = new Tt(this.dialectConfig)), this.dialect;
  }
}
w(cs, gu, "PgQueryBuilder");
function et(s) {
  return k(s, Se) ? [s[dt] ? `${s[dt]}.${s[j.Symbol.BaseName]}` : s[j.Symbol.BaseName]] : k(s, be) ? s._.usedTables ?? [] : k(s, z) ? s.usedTables ?? [] : [];
}
var yu, wu;
class Ir extends (wu = He, yu = O, wu) {
  constructor(t, r, n, i) {
    super();
    w(this, "config");
    w(this, "cacheConfig");
    w(this, "authToken");
    w(this, "execute", (t) => Ie.startActiveSpan("drizzle.operation", () => this._prepare().execute(t, this.authToken)));
    this.session = r, this.dialect = n, this.config = { table: t, withList: i };
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(t) {
    return this.config.where = t, this;
  }
  returning(t = this.config.table[j.Symbol.Columns]) {
    return this.config.returningFields = t, this.config.returning = rt(t), this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: t, ...r } = this.dialect.sqlToQuery(this.getSQL());
    return r;
  }
  /** @internal */
  _prepare(t) {
    return Ie.startActiveSpan("drizzle.prepareQuery", () => this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, t, !0, void 0, {
      type: "delete",
      tables: et(this.config.table)
    }, this.cacheConfig));
  }
  prepare(t) {
    return this._prepare(t);
  }
  /** @internal */
  setToken(t) {
    return this.authToken = t, this;
  }
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new _e({
        alias: je(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
}
w(Ir, yu, "PgDelete");
var bu;
bu = O;
class Lr {
  constructor(e, t, r, n, i) {
    w(this, "authToken");
    this.table = e, this.session = t, this.dialect = r, this.withList = n, this.overridingSystemValue_ = i;
  }
  /** @internal */
  setToken(e) {
    return this.authToken = e, this;
  }
  overridingSystemValue() {
    return this.overridingSystemValue_ = !0, this;
  }
  values(e) {
    if (e = Array.isArray(e) ? e : [e], e.length === 0)
      throw new Error("values() must be called with at least one value");
    const t = e.map((r) => {
      const n = {}, i = this.table[j.Symbol.Columns];
      for (const u of Object.keys(r)) {
        const a = r[u];
        n[u] = k(a, z) ? a : new Ue(a, i[u]);
      }
      return n;
    });
    return new Or(
      this.table,
      t,
      this.session,
      this.dialect,
      this.withList,
      !1,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(e) {
    const t = typeof e == "function" ? e(new cs()) : e;
    if (!k(t, z) && !Jr(this.table[Ar], t._.selectedFields))
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    return new Or(this.table, t, this.session, this.dialect, this.withList, !0);
  }
}
w(Lr, bu, "PgInsertBuilder");
var vu, Su;
class Or extends (Su = He, vu = O, Su) {
  constructor(t, r, n, i, u, a, f) {
    super();
    w(this, "config");
    w(this, "cacheConfig");
    w(this, "authToken");
    w(this, "execute", (t) => Ie.startActiveSpan("drizzle.operation", () => this._prepare().execute(t, this.authToken)));
    this.session = n, this.dialect = i, this.config = { table: t, values: r, withList: u, select: a, overridingSystemValue_: f };
  }
  returning(t = this.config.table[j.Symbol.Columns]) {
    return this.config.returningFields = t, this.config.returning = rt(t), this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(t = {}) {
    if (t.target === void 0)
      this.config.onConflict = x`do nothing`;
    else {
      let r = "";
      r = Array.isArray(t.target) ? t.target.map((i) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(i))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(t.target));
      const n = t.where ? x` where ${t.where}` : void 0;
      this.config.onConflict = x`(${x.raw(r)})${n} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(t) {
    if (t.where && (t.targetWhere || t.setWhere))
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    const r = t.where ? x` where ${t.where}` : void 0, n = t.targetWhere ? x` where ${t.targetWhere}` : void 0, i = t.setWhere ? x` where ${t.setWhere}` : void 0, u = this.dialect.buildUpdateSet(this.config.table, lc(this.config.table, t.set));
    let a = "";
    return a = Array.isArray(t.target) ? t.target.map((f) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(f))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(t.target)), this.config.onConflict = x`(${x.raw(a)})${n} do update set ${u}${r}${i}`, this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: t, ...r } = this.dialect.sqlToQuery(this.getSQL());
    return r;
  }
  /** @internal */
  _prepare(t) {
    return Ie.startActiveSpan("drizzle.prepareQuery", () => this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, t, !0, void 0, {
      type: "insert",
      tables: et(this.config.table)
    }, this.cacheConfig));
  }
  prepare(t) {
    return this._prepare(t);
  }
  /** @internal */
  setToken(t) {
    return this.authToken = t, this;
  }
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new _e({
        alias: je(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
}
w(Or, vu, "PgInsert");
var _u, Eu;
class Qh extends (Eu = He, _u = O, Eu) {
  constructor(t, r, n) {
    super();
    w(this, "config");
    w(this, "authToken");
    w(this, "execute", (t) => Ie.startActiveSpan("drizzle.operation", () => this._prepare().execute(t, this.authToken)));
    this.session = r, this.dialect = n, this.config = { view: t };
  }
  concurrently() {
    if (this.config.withNoData !== void 0)
      throw new Error("Cannot use concurrently and withNoData together");
    return this.config.concurrently = !0, this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0)
      throw new Error("Cannot use concurrently and withNoData together");
    return this.config.withNoData = !0, this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: t, ...r } = this.dialect.sqlToQuery(this.getSQL());
    return r;
  }
  /** @internal */
  _prepare(t) {
    return Ie.startActiveSpan("drizzle.prepareQuery", () => this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, t, !0));
  }
  prepare(t) {
    return this._prepare(t);
  }
  /** @internal */
  setToken(t) {
    return this.authToken = t, this;
  }
}
w(Qh, _u, "PgRefreshMaterializedView");
var Tu;
Tu = O;
class Br {
  constructor(e, t, r, n) {
    w(this, "authToken");
    this.table = e, this.session = t, this.dialect = r, this.withList = n;
  }
  setToken(e) {
    return this.authToken = e, this;
  }
  set(e) {
    return new Fh(
      this.table,
      lc(this.table, e),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
}
w(Br, Tu, "PgUpdateBuilder");
var Cu, Au;
class Fh extends (Au = He, Cu = O, Au) {
  constructor(t, r, n, i, u) {
    super();
    w(this, "config");
    w(this, "tableName");
    w(this, "joinsNotNullableMap");
    w(this, "cacheConfig");
    w(this, "leftJoin", this.createJoin("left"));
    w(this, "rightJoin", this.createJoin("right"));
    w(this, "innerJoin", this.createJoin("inner"));
    w(this, "fullJoin", this.createJoin("full"));
    w(this, "authToken");
    w(this, "execute", (t) => this._prepare().execute(t, this.authToken));
    this.session = n, this.dialect = i, this.config = { set: r, table: t, withList: u, joins: [] }, this.tableName = Ze(t), this.joinsNotNullableMap = typeof this.tableName == "string" ? { [this.tableName]: !0 } : {};
  }
  from(t) {
    const r = t, n = Ze(r);
    return typeof n == "string" && (this.joinsNotNullableMap[n] = !0), this.config.from = r, this;
  }
  getTableLikeFields(t) {
    return k(t, Se) ? t[j.Symbol.Columns] : k(t, be) ? t._.selectedFields : t[de].selectedFields;
  }
  createJoin(t) {
    return (r, n) => {
      const i = Ze(r);
      if (typeof i == "string" && this.config.joins.some((u) => u.alias === i))
        throw new Error(`Alias "${i}" is already used in this query`);
      if (typeof n == "function") {
        const u = this.config.from && !k(this.config.from, z) ? this.getTableLikeFields(this.config.from) : void 0;
        n = n(
          new Proxy(
            this.config.table[j.Symbol.Columns],
            new _e({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          u && new Proxy(
            u,
            new _e({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (this.config.joins.push({ on: n, table: r, joinType: t, alias: i }), typeof i == "string")
        switch (t) {
          case "left": {
            this.joinsNotNullableMap[i] = !1;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([u]) => [u, !1])
            ), this.joinsNotNullableMap[i] = !0;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[i] = !0;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([u]) => [u, !1])
            ), this.joinsNotNullableMap[i] = !1;
            break;
          }
        }
      return this;
    };
  }
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(t) {
    return this.config.where = t, this;
  }
  returning(t) {
    if (!t && (t = Object.assign({}, this.config.table[j.Symbol.Columns]), this.config.from)) {
      const r = Ze(this.config.from);
      if (typeof r == "string" && this.config.from && !k(this.config.from, z)) {
        const n = this.getTableLikeFields(this.config.from);
        t[r] = n;
      }
      for (const n of this.config.joins) {
        const i = Ze(n.table);
        if (typeof i == "string" && !k(n.table, z)) {
          const u = this.getTableLikeFields(n.table);
          t[i] = u;
        }
      }
    }
    return this.config.returningFields = t, this.config.returning = rt(t), this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: t, ...r } = this.dialect.sqlToQuery(this.getSQL());
    return r;
  }
  /** @internal */
  _prepare(t) {
    const r = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, t, !0, void 0, {
      type: "insert",
      tables: et(this.config.table)
    }, this.cacheConfig);
    return r.joinsNotNullableMap = this.joinsNotNullableMap, r;
  }
  prepare(t) {
    return this._prepare(t);
  }
  /** @internal */
  setToken(t) {
    return this.authToken = t, this;
  }
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new _e({
        alias: je(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
}
w(Fh, Cu, "PgUpdate");
var Pu, Nu, xu;
const Ct = class Ct extends (xu = z, Nu = O, Pu = Symbol.toStringTag, xu) {
  constructor(t) {
    super(Ct.buildEmbeddedCount(t.source, t.filters).queryChunks);
    w(this, "sql");
    w(this, "token");
    w(this, Pu, "PgCountBuilder");
    w(this, "session");
    this.params = t, this.mapWith(Number), this.session = t.session, this.sql = Ct.buildCount(
      t.source,
      t.filters
    );
  }
  static buildEmbeddedCount(t, r) {
    return x`(select count(*) from ${t}${x.raw(" where ").if(r)}${r})`;
  }
  static buildCount(t, r) {
    return x`select count(*) as count from ${t}${x.raw(" where ").if(r)}${r};`;
  }
  /** @intrnal */
  setToken(t) {
    return this.token = t, this;
  }
  then(t, r) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      t,
      r
    );
  }
  catch(t) {
    return this.then(void 0, t);
  }
  finally(t) {
    return this.then(
      (r) => (t == null || t(), r),
      (r) => {
        throw t == null || t(), r;
      }
    );
  }
};
w(Ct, Nu, "PgCountBuilder");
let Dr = Ct;
var Iu;
Iu = O;
class jh {
  constructor(e, t, r, n, i, u, a) {
    this.fullSchema = e, this.schema = t, this.tableNamesMap = r, this.table = n, this.tableConfig = i, this.dialect = u, this.session = a;
  }
  findMany(e) {
    return new Rr(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      e || {},
      "many"
    );
  }
  findFirst(e) {
    return new Rr(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      e ? { ...e, limit: 1 } : { limit: 1 },
      "first"
    );
  }
}
w(jh, Iu, "PgRelationalQueryBuilder");
var Lu, Ou;
class Rr extends (Ou = He, Lu = O, Ou) {
  constructor(t, r, n, i, u, a, f, y, d) {
    super();
    w(this, "authToken");
    this.fullSchema = t, this.schema = r, this.tableNamesMap = n, this.table = i, this.tableConfig = u, this.dialect = a, this.session = f, this.config = y, this.mode = d;
  }
  /** @internal */
  _prepare(t) {
    return Ie.startActiveSpan("drizzle.prepareQuery", () => {
      const { query: r, builtQuery: n } = this._toSQL();
      return this.session.prepareQuery(
        n,
        void 0,
        t,
        !0,
        (i, u) => {
          const a = i.map(
            (f) => xr(this.schema, this.tableConfig, f, r.selection, u)
          );
          return this.mode === "first" ? a[0] : a;
        }
      );
    });
  }
  prepare(t) {
    return this._prepare(t);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const t = this._getQuery(), r = this.dialect.sqlToQuery(t.sql);
    return { query: t, builtQuery: r };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  setToken(t) {
    return this.authToken = t, this;
  }
  execute() {
    return Ie.startActiveSpan("drizzle.operation", () => this._prepare().execute(void 0, this.authToken));
  }
}
w(Rr, Lu, "PgRelationalQuery");
var Bu, Du;
class Uh extends (Du = He, Bu = O, Du) {
  constructor(e, t, r, n) {
    super(), this.execute = e, this.sql = t, this.query = r, this.mapBatchResult = n;
  }
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(e, t) {
    return t ? this.mapBatchResult(e) : e;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return !1;
  }
}
w(Uh, Bu, "PgRaw");
var Ru;
Ru = O;
class Vh {
  constructor(e, t, r) {
    w(this, "query");
    /**
     * Creates a subquery that defines a temporary named result set as a CTE.
     *
     * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
     *
     * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
     *
     * @param alias The alias for the subquery.
     *
     * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
     *
     * @example
     *
     * ```ts
     * // Create a subquery with alias 'sq' and use it in the select query
     * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
     *
     * const result = await db.with(sq).select().from(sq);
     * ```
     *
     * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
     *
     * ```ts
     * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
     * const sq = db.$with('sq').as(db.select({
     *   name: sql<string>`upper(${users.name})`.as('name'),
     * })
     * .from(users));
     *
     * const result = await db.with(sq).select({ name: sq.name }).from(sq);
     * ```
     */
    w(this, "$with", (e, t) => {
      const r = this;
      return { as: (i) => (typeof i == "function" && (i = i(new cs(r.dialect))), new Proxy(
        new Hr(
          i.getSQL(),
          t ?? ("getSelectedFields" in i ? i.getSelectedFields() ?? {} : {}),
          e,
          !0
        ),
        new _e({ alias: e, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      )) };
    });
    w(this, "$cache");
    w(this, "authToken");
    if (this.dialect = e, this.session = t, this._ = r ? {
      schema: r.schema,
      fullSchema: r.fullSchema,
      tableNamesMap: r.tableNamesMap,
      session: t
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session: t
    }, this.query = {}, this._.schema)
      for (const [n, i] of Object.entries(this._.schema))
        this.query[n] = new jh(
          r.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          r.fullSchema[n],
          i,
          e,
          t
        );
    this.$cache = { invalidate: async (n) => {
    } };
  }
  $count(e, t) {
    return new Dr({ source: e, filters: t, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...e) {
    const t = this;
    function r(y) {
      return new xe({
        fields: y ?? void 0,
        session: t.session,
        dialect: t.dialect,
        withList: e
      });
    }
    function n(y) {
      return new xe({
        fields: y ?? void 0,
        session: t.session,
        dialect: t.dialect,
        withList: e,
        distinct: !0
      });
    }
    function i(y, d) {
      return new xe({
        fields: d ?? void 0,
        session: t.session,
        dialect: t.dialect,
        withList: e,
        distinct: { on: y }
      });
    }
    function u(y) {
      return new Br(y, t.session, t.dialect, e);
    }
    function a(y) {
      return new Lr(y, t.session, t.dialect, e);
    }
    function f(y) {
      return new Ir(y, t.session, t.dialect, e);
    }
    return { select: r, selectDistinct: n, selectDistinctOn: i, update: u, insert: a, delete: f };
  }
  select(e) {
    return new xe({
      fields: e ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(e) {
    return new xe({
      fields: e ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: !0
    });
  }
  selectDistinctOn(e, t) {
    return new xe({
      fields: t ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on: e }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(e) {
    return new Br(e, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(e) {
    return new Lr(e, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(e) {
    return new Ir(e, this.session, this.dialect);
  }
  refreshMaterializedView(e) {
    return new Qh(e, this.session, this.dialect);
  }
  execute(e) {
    const t = typeof e == "string" ? x.raw(e) : e.getSQL(), r = this.dialect.sqlToQuery(t), n = this.session.prepareQuery(
      r,
      void 0,
      void 0,
      !1
    );
    return new Uh(
      () => n.execute(void 0, this.authToken),
      t,
      r,
      (i) => n.mapResult(i, !0)
    );
  }
  transaction(e, t) {
    return this.session.transaction(e, t);
  }
}
w(Vh, Ru, "PgDatabase");
var Mu;
Mu = O;
class zh {
}
w(zh, Mu, "Cache");
var $u, qu;
class hs extends (qu = zh, $u = O, qu) {
  strategy() {
    return "all";
  }
  async get(e) {
  }
  async put(e, t, r, n) {
  }
  async onMutate(e) {
  }
}
w(hs, $u, "NoopCache");
async function Bs(s, e) {
  const t = `${s}-${JSON.stringify(e)}`, n = new TextEncoder().encode(t), i = await crypto.subtle.digest("SHA-256", n);
  return [...new Uint8Array(i)].map((f) => f.toString(16).padStart(2, "0")).join("");
}
var ku;
ku = O;
class Wh {
  constructor(e, t, r, n) {
    w(this, "authToken");
    /** @internal */
    w(this, "joinsNotNullableMap");
    var i;
    this.query = e, this.cache = t, this.queryMetadata = r, this.cacheConfig = n, t && t.strategy() === "all" && n === void 0 && (this.cacheConfig = { enable: !0, autoInvalidate: !0 }), (i = this.cacheConfig) != null && i.enable || (this.cacheConfig = void 0);
  }
  getQuery() {
    return this.query;
  }
  mapResult(e, t) {
    return e;
  }
  /** @internal */
  setToken(e) {
    return this.authToken = e, this;
  }
  /** @internal */
  async queryWithCache(e, t, r) {
    if (this.cache === void 0 || k(this.cache, hs) || this.queryMetadata === void 0)
      try {
        return await r();
      } catch (n) {
        throw new We(e, t, n);
      }
    if (this.cacheConfig && !this.cacheConfig.enable)
      try {
        return await r();
      } catch (n) {
        throw new We(e, t, n);
      }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0)
      try {
        const [n] = await Promise.all([
          r(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return n;
      } catch (n) {
        throw new We(e, t, n);
      }
    if (!this.cacheConfig)
      try {
        return await r();
      } catch (n) {
        throw new We(e, t, n);
      }
    if (this.queryMetadata.type === "select") {
      const n = await this.cache.get(
        this.cacheConfig.tag ?? await Bs(e, t),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (n === void 0) {
        let i;
        try {
          i = await r();
        } catch (u) {
          throw new We(e, t, u);
        }
        return await this.cache.put(
          this.cacheConfig.tag ?? await Bs(e, t),
          i,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        ), i;
      }
      return n;
    }
    try {
      return await r();
    } catch (n) {
      throw new We(e, t, n);
    }
  }
}
w(Wh, ku, "PgPreparedQuery");
var Qu;
Qu = O;
class Kh {
  constructor(e) {
    this.dialect = e;
  }
  /** @internal */
  execute(e, t) {
    return Ie.startActiveSpan("drizzle.operation", () => Ie.startActiveSpan("drizzle.prepareQuery", () => this.prepareQuery(
      this.dialect.sqlToQuery(e),
      void 0,
      void 0,
      !1
    )).setToken(t).execute(void 0, t));
  }
  all(e) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(e),
      void 0,
      void 0,
      !1
    ).all();
  }
  /** @internal */
  async count(e, t) {
    const r = await this.execute(e, t);
    return Number(
      r[0].count
    );
  }
}
w(Kh, Qu, "PgSession");
const Qt = {
  arrayMode: !1,
  fullResults: !0
}, Mr = {
  arrayMode: !0,
  fullResults: !0
};
var Fu, ju;
class Gh extends (ju = Wh, Fu = O, ju) {
  constructor(t, r, n, i, u, a, f, y, d) {
    super(r, i, u, a);
    w(this, "clientQuery");
    this.client = t, this.logger = n, this.fields = f, this._isResponseInArrayMode = y, this.customResultMapper = d, this.clientQuery = t.query ?? t;
  }
  /** @internal */
  async execute(t = {}, r = this.authToken) {
    const n = br(this.query.params, t);
    this.logger.logQuery(this.query.sql, n);
    const { fields: i, clientQuery: u, query: a, customResultMapper: f } = this;
    if (!i && !f)
      return this.queryWithCache(a.sql, n, async () => u(
        a.sql,
        n,
        r === void 0 ? Qt : {
          ...Qt,
          authToken: r
        }
      ));
    const y = await this.queryWithCache(a.sql, n, async () => await u(
      a.sql,
      n,
      r === void 0 ? Mr : {
        ...Mr,
        authToken: r
      }
    ));
    return this.mapResult(y);
  }
  mapResult(t) {
    if (!this.fields && !this.customResultMapper)
      return t;
    const r = t.rows;
    return this.customResultMapper ? this.customResultMapper(r) : r.map((n) => ip(this.fields, n, this.joinsNotNullableMap));
  }
  all(t = {}) {
    const r = br(this.query.params, t);
    return this.logger.logQuery(this.query.sql, r), this.clientQuery(
      this.query.sql,
      r,
      this.authToken === void 0 ? Qt : {
        ...Qt,
        authToken: this.authToken
      }
    ).then((n) => n.rows);
  }
  /** @internal */
  values(t = {}, r) {
    const n = br(this.query.params, t);
    return this.logger.logQuery(this.query.sql, n), this.clientQuery(this.query.sql, n, { arrayMode: !0, fullResults: !0, authToken: r }).then((i) => i.rows);
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
}
w(Gh, Fu, "NeonHttpPreparedQuery");
var Uu, Vu;
class Hh extends (Vu = Kh, Uu = O, Vu) {
  constructor(t, r, n, i = {}) {
    super(r);
    w(this, "clientQuery");
    w(this, "logger");
    w(this, "cache");
    this.client = t, this.schema = n, this.options = i, this.clientQuery = t.query ?? t, this.logger = i.logger ?? new Kl(), this.cache = i.cache ?? new hs();
  }
  prepareQuery(t, r, n, i, u, a, f) {
    return new Gh(
      this.client,
      t,
      this.logger,
      this.cache,
      a,
      f,
      r,
      i,
      u
    );
  }
  async batch(t) {
    const r = [], n = [];
    for (const u of t) {
      const a = u._prepare(), f = a.getQuery();
      r.push(a), n.push(
        this.clientQuery(f.sql, f.params, {
          fullResults: !0,
          arrayMode: a.isResponseInArrayMode()
        })
      );
    }
    return (await this.client.transaction(n, Mr)).map((u, a) => r[a].mapResult(u, !0));
  }
  // change return type to QueryRows<true>
  async query(t, r) {
    return this.logger.logQuery(t, r), await this.clientQuery(t, r, { arrayMode: !0, fullResults: !0 });
  }
  // change return type to QueryRows<false>
  async queryObjects(t, r) {
    return this.clientQuery(t, r, { arrayMode: !1, fullResults: !0 });
  }
  /** @internal */
  async count(t, r) {
    const n = await this.execute(t, r);
    return Number(
      n.rows[0].count
    );
  }
  async transaction(t, r = {}) {
    throw new Error("No transactions support in neon-http driver");
  }
}
w(Hh, Uu, "NeonHttpSession");
var zu;
zu = O;
class Jh {
  constructor(e, t, r = {}) {
    this.client = e, this.dialect = t, this.options = r, this.initMappers();
  }
  createSession(e) {
    return new Hh(this.client, this.dialect, e, {
      logger: this.options.logger,
      cache: this.options.cache
    });
  }
  initMappers() {
    Pe.setTypeParser(Pe.builtins.TIMESTAMPTZ, (e) => e), Pe.setTypeParser(Pe.builtins.TIMESTAMP, (e) => e), Pe.setTypeParser(Pe.builtins.DATE, (e) => e), Pe.setTypeParser(Pe.builtins.INTERVAL, (e) => e), Pe.setTypeParser(1231, (e) => e), Pe.setTypeParser(1115, (e) => e), Pe.setTypeParser(1185, (e) => e), Pe.setTypeParser(1187, (e) => e), Pe.setTypeParser(1182, (e) => e);
  }
}
w(Jh, zu, "NeonHttpDriver");
function Yt(s, e, t, r) {
  return new Proxy(s, {
    get(n, i) {
      const u = n[i];
      return typeof u != "function" && (typeof u != "object" || u === null) ? u : r ? Yt(u, e, t) : i === "query" ? Yt(u, e, t, !0) : new Proxy(u, {
        apply(a, f, y) {
          const d = a.call(f, ...y);
          return typeof d == "object" && d !== null && "setToken" in d && typeof d.setToken == "function" && d.setToken(e), t(a, i, d);
        }
      });
    }
  });
}
var Wu, Ku;
class Yh extends (Ku = Vh, Wu = O, Ku) {
  $withAuth(e) {
    return this.authToken = e, Yt(this, e, (t, r, n) => r === "with" ? Yt(n, e, (i, u, a) => a) : n);
  }
  async batch(e) {
    return this.session.batch(e);
  }
}
w(Yh, Wu, "NeonHttpDatabase");
function lt(s, e = {}) {
  var f;
  const t = new Tt({ casing: e.casing });
  let r;
  e.logger === !0 ? r = new Wl() : e.logger !== !1 && (r = e.logger);
  let n;
  if (e.schema) {
    const y = cm(
      e.schema,
      pm
    );
    n = {
      fullSchema: e.schema,
      schema: y.tables,
      tableNamesMap: y.tableNamesMap
    };
  }
  const u = new Jh(s, t, { logger: r, cache: e.cache }).createSession(n), a = new Yh(
    t,
    u,
    n
  );
  return a.$client = s, a.$cache = e.cache, a.$cache && (a.$cache.invalidate = (f = e.cache) == null ? void 0 : f.onMutate), a;
}
function $r(...s) {
  if (typeof s[0] == "string") {
    const e = ft(s[0]);
    return lt(e, s[1]);
  }
  if (up(s[0])) {
    const { connection: e, client: t, ...r } = s[0];
    if (t) return lt(t, r);
    if (typeof e == "object") {
      const { connectionString: i, ...u } = e, a = ft(i, u);
      return lt(a, r);
    }
    const n = ft(e);
    return lt(n, r);
  }
  return lt(s[0], s[1]);
}
((s) => {
  function e(t) {
    return lt({}, t);
  }
  s.mock = e;
})($r || ($r = {}));
const $e = {
  createdAt: ve("created_at", { withTimezone: !0 }).defaultNow().notNull(),
  updatedAt: ve("updated_at", { withTimezone: !0 }).defaultNow().notNull()
}, fs = Re("user_role", ["admin", "user"]), Zh = Re("user_status", [
  "active",
  "inactive",
  "invited",
  "suspended"
]), ds = Re("resource_status", [
  "active",
  "inactive"
]), Xh = Re("browser_engine", [
  "chromium",
  "firefox",
  "webkit"
]), ef = Re("device_type", ["desktop", "mobile"]), tf = Re("os_name", [
  "windows",
  "macos",
  "linux",
  "android",
  "ios"
]), rf = Re("proxy_protocol", [
  "http",
  "https",
  "socks4",
  "socks5"
]), sf = Re("proxy_check_status", [
  "queued",
  "running",
  "success",
  "failed"
]), nf = Re("browser_profile_status", [
  "active",
  "inactive",
  "starting",
  "running",
  "stopping",
  "stopped",
  "error"
]), of = Re("language_mode", ["proxy", "custom"]), qe = Me(
  "users",
  {
    id: ue("id").defaultRandom().primaryKey(),
    email: re("email").notNull(),
    name: re("name").notNull(),
    role: fs("role").default("user").notNull(),
    status: Zh("status").default("invited").notNull(),
    passwordHash: re("password_hash"),
    lastLoginAt: ve("last_login_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ge("users_email_unique").on(s.email),
    Ee("users_status_idx").on(s.status)
  ]
), _m = Me(
  "invitations",
  {
    id: ue("id").defaultRandom().primaryKey(),
    email: re("email").notNull(),
    role: fs("role").default("user").notNull(),
    tokenHash: re("token_hash").notNull(),
    invitedBy: ue("invited_by").notNull().references(() => qe.id),
    expiresAt: ve("expires_at", { withTimezone: !0 }).notNull(),
    acceptedAt: ve("accepted_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ge("invitations_token_hash_unique").on(s.tokenHash),
    Ee("invitations_email_idx").on(s.email),
    Ee("invitations_expires_at_idx").on(s.expiresAt)
  ]
), Em = Me(
  "sessions",
  {
    id: ue("id").defaultRandom().primaryKey(),
    userId: ue("user_id").notNull().references(() => qe.id, { onDelete: "cascade" }),
    sessionHash: re("session_hash").notNull(),
    expiresAt: ve("expires_at", { withTimezone: !0 }).notNull(),
    lastSeenAt: ve("last_seen_at", { withTimezone: !0 }),
    revokedAt: ve("revoked_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ge("sessions_session_hash_unique").on(s.sessionHash),
    Ee("sessions_user_idx").on(s.userId),
    Ee("sessions_expires_at_idx").on(s.expiresAt)
  ]
), af = Me(
  "fingerprints",
  {
    id: ue("id").defaultRandom().primaryKey(),
    ownerId: ue("owner_id").notNull().references(() => qe.id),
    name: re("name").notNull(),
    status: ds("status").default("active").notNull(),
    deviceType: ef("device_type").notNull(),
    osName: tf("os_name").notNull(),
    osVersion: re("os_version").notNull(),
    browserName: re("browser_name").notNull(),
    browserVersion: re("browser_version").notNull(),
    userAgent: re("user_agent").notNull(),
    locale: re("locale").default("en-US").notNull(),
    timezone: re("timezone").default("America/New_York").notNull(),
    viewport: Ne("viewport").notNull(),
    screen: Ne("screen").notNull(),
    clientHints: Ne("client_hints"),
    webgl: Ne("webgl"),
    fonts: Ne("fonts"),
    media: Ne("media"),
    hardware: Ne("hardware"),
    seed: re("seed"),
    presetVersion: re("preset_version").notNull(),
    compatibilityWarnings: Ne("compatibility_warnings"),
    deletedAt: ve("deleted_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ge("fingerprints_owner_name_unique").on(s.ownerId, s.name),
    Ee("fingerprints_owner_status_idx").on(s.ownerId, s.status)
  ]
), ps = Me(
  "proxies",
  {
    id: ue("id").defaultRandom().primaryKey(),
    ownerId: ue("owner_id").notNull().references(() => qe.id),
    name: re("name").notNull(),
    protocol: rf("protocol").notNull(),
    host: re("host").notNull(),
    port: xt("port").notNull(),
    credentialRef: re("credential_ref"),
    status: ds("status").default("active").notNull(),
    country: re("country"),
    city: re("city"),
    isp: re("isp"),
    timezone: re("timezone"),
    detectedIp: re("detected_ip"),
    latencyMs: xt("latency_ms"),
    lastCheckedAt: ve("last_checked_at", { withTimezone: !0 }),
    checkError: re("check_error"),
    deletedAt: ve("deleted_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ge("proxies_owner_name_unique").on(s.ownerId, s.name),
    Ee("proxies_owner_status_idx").on(s.ownerId, s.status),
    Ee("proxies_last_checked_idx").on(s.lastCheckedAt)
  ]
), Tm = Me(
  "proxy_checks",
  {
    id: ue("id").defaultRandom().primaryKey(),
    proxyId: ue("proxy_id").notNull().references(() => ps.id, { onDelete: "cascade" }),
    requestedBy: ue("requested_by").notNull().references(() => qe.id),
    status: sf("status").default("queued").notNull(),
    latencyMs: xt("latency_ms"),
    metadata: Ne("metadata"),
    error: re("error"),
    startedAt: ve("started_at", { withTimezone: !0 }),
    finishedAt: ve("finished_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ee("proxy_checks_proxy_idx").on(s.proxyId, s.createdAt),
    Ee("proxy_checks_status_idx").on(s.status)
  ]
), uf = Me(
  "browser_profiles",
  {
    id: ue("id").defaultRandom().primaryKey(),
    ownerId: ue("owner_id").notNull().references(() => qe.id),
    name: re("name").notNull(),
    status: nf("status").default("inactive").notNull(),
    engine: Xh("engine").notNull(),
    fingerprintId: ue("fingerprint_id").notNull().references(() => af.id),
    proxyId: ue("proxy_id").references(() => ps.id),
    proxyEnabled: vc("proxy_enabled").default(!1).notNull(),
    languageMode: of("language_mode").default("custom").notNull(),
    language: re("language").default("en-US").notNull(),
    timezone: re("timezone"),
    userDataDirKey: re("user_data_dir_key").notNull(),
    lastStartedAt: ve("last_started_at", { withTimezone: !0 }),
    lastStoppedAt: ve("last_stopped_at", { withTimezone: !0 }),
    deletedAt: ve("deleted_at", { withTimezone: !0 }),
    ...$e
  },
  (s) => [
    Ge("browser_profiles_owner_name_unique").on(
      s.ownerId,
      s.name
    ),
    Ge("browser_profiles_data_dir_unique").on(s.userDataDirKey),
    Ee("browser_profiles_owner_status_idx").on(s.ownerId, s.status)
  ]
), Cm = Me(
  "browser_events",
  {
    id: ue("id").defaultRandom().primaryKey(),
    browserProfileId: ue("browser_profile_id").notNull().references(() => uf.id, { onDelete: "cascade" }),
    actorId: ue("actor_id").references(() => qe.id),
    action: re("action").notNull(),
    result: re("result").notNull(),
    errorCode: re("error_code"),
    errorMessage: re("error_message"),
    durationMs: xt("duration_ms"),
    metadata: Ne("metadata"),
    ...$e
  },
  (s) => [
    Ee("browser_events_profile_idx").on(
      s.browserProfileId,
      s.createdAt
    ),
    Ee("browser_events_actor_idx").on(s.actorId)
  ]
), Am = Me(
  "app_settings",
  {
    id: ue("id").defaultRandom().primaryKey(),
    key: re("key").notNull(),
    value: Ne("value").notNull(),
    scope: re("scope").default("global").notNull(),
    updatedBy: ue("updated_by").references(() => qe.id),
    ...$e
  },
  (s) => [
    Ge("app_settings_key_scope_unique").on(s.key, s.scope)
  ]
), Pm = Me(
  "audit_logs",
  {
    id: ue("id").defaultRandom().primaryKey(),
    actorId: ue("actor_id").references(() => qe.id),
    action: re("action").notNull(),
    entity: re("entity").notNull(),
    entityId: ue("entity_id"),
    result: re("result").notNull(),
    metadata: Ne("metadata"),
    ...$e
  },
  (s) => [
    Ee("audit_logs_actor_idx").on(s.actorId, s.createdAt),
    Ee("audit_logs_entity_idx").on(s.entity, s.entityId)
  ]
), Nm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  appSettings: Am,
  auditLogs: Pm,
  browserEngineEnum: Xh,
  browserEvents: Cm,
  browserProfileStatusEnum: nf,
  browserProfiles: uf,
  deviceTypeEnum: ef,
  fingerprints: af,
  invitations: _m,
  languageModeEnum: of,
  osNameEnum: tf,
  proxies: ps,
  proxyCheckStatusEnum: sf,
  proxyChecks: Tm,
  proxyProtocolEnum: rf,
  resourceStatusEnum: ds,
  sessions: Em,
  userRoleEnum: fs,
  userStatusEnum: Zh,
  users: qe
}, Symbol.toStringTag, { value: "Module" }));
function xm(s) {
  const e = ft(s);
  return $r(e, { schema: Nm });
}
let Ds;
function Im(s) {
  if (s.databaseMode === "embedded")
    throw new Error(
      "Embedded database mode is not implemented yet. Use DATABASE_MODE=neon."
    );
  const e = process.env.DATABASE_URL;
  if (!e)
    throw new Error("DATABASE_URL is missing. Configure Neon before starting.");
  return Ds ?? (Ds = xm(e)), Ds;
}
async function Lm(s) {
  if (s.databaseMode === "embedded")
    return {
      mode: "embedded",
      configured: !1,
      reachable: !1,
      message: "Embedded database adapter is not implemented yet."
    };
  if (!process.env.DATABASE_URL)
    return {
      mode: "neon",
      configured: !1,
      reachable: !1,
      message: "DATABASE_URL is not configured."
    };
  try {
    return await Im(s).execute("select 1"), {
      mode: "neon",
      configured: !0,
      reachable: !0,
      message: "Neon database is reachable."
    };
  } catch (e) {
    return {
      mode: "neon",
      configured: !0,
      reachable: !1,
      message: e instanceof Error ? e.message : "Database health check failed."
    };
  }
}
Sf(import.meta.url);
const lf = Be.dirname(_f(import.meta.url));
process.env.APP_ROOT = Be.join(lf, "..");
const qr = process.env.VITE_DEV_SERVER_URL, wg = Be.join(process.env.APP_ROOT, "dist-electron"), cf = Be.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = qr ? Be.join(process.env.APP_ROOT, "public") : cf;
const hf = zf(process.env.APP_ROOT);
Gu.handle("app-runtime:get-info", () => hf);
Gu.handle("database:get-status", () => Lm(hf));
let ze;
function ff() {
  ze = new Hu({
    icon: Be.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: Be.join(lf, "preload.cjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !0
    }
  }), ze.webContents.on("did-finish-load", () => {
    ze == null || ze.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), qr ? ze.loadURL(qr) : ze.loadFile(Be.join(cf, "index.html"));
}
Vt.on("window-all-closed", () => {
  process.platform !== "darwin" && (Vt.quit(), ze = null);
});
Vt.on("activate", () => {
  Hu.getAllWindows().length === 0 && ff();
});
Vt.whenReady().then(ff);
export {
  wg as MAIN_DIST,
  cf as RENDERER_DIST,
  qr as VITE_DEV_SERVER_URL
};
