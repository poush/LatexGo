var Module = typeof Module !== "undefined" ? Module : {};

var Module = {};

var is_browser = typeof self !== "undefined" || typeof window !== "undefined";

if (is_browser) {
 Module["print"] = function(a) {
  self["postMessage"](JSON.stringify({
   "command": "stdout",
   "contents": a
  }));
 };
 Module["printErr"] = function(a) {
  self["postMessage"](JSON.stringify({
   "command": "stderr",
   "contents": a
  }));
 };
}

Module["preInit"] = function() {
 Module["FS_root"] = function() {
  return FS.root.contents;
 };
};

var FS_createLazyFilesFromList = function(msg_id, parent, list, parent_url, canRead, canWrite) {
 var xhr = new XMLHttpRequest();
 xhr.open("GET", list, false);
 xhr.responseType = "text";
 xhr.onload = function() {
  var lines = this.response.split("\n");
  var path, pos, filename;
  for (var i in lines) {
   pos = lines[i].lastIndexOf("/");
   filename = lines[i].slice(pos + 1);
   path = lines[i].slice(0, pos);
   if (filename === ".") Module["FS_createPath"]("/", parent + path, canRead, canWrite); else if (filename.length > 0) Module["FS_createLazyFile"](parent + path, filename, parent_url + path + "/" + filename, canRead, canWrite);
  }
  self["postMessage"](JSON.stringify({
   "command": "result",
   "result": 0,
   "msg_id": msg_id
  }));
 };
 xhr.send();
};

var preparePRNG = function(argument) {
 if ("egd-pool" in FS.root.contents["dev"].contents) {
  var rand_count = 0;
  var rand_contents = FS.root.contents["dev"].contents["egd-pool"].contents;
  var rand = new Uint8Array(rand_contents);
  FS.createDevice("/dev", "urandom", function() {
   rand_count++;
   if (rand_count >= rand.length) {
    Module.print("Out of entropy!");
    throw Error("Out of entropy");
   }
   return rand[rand_count - 1];
  });
  FS.createDevice("/dev", "random", function() {
   rand_count++;
   if (rand_count >= rand.length) {
    Module.print("Out of entropy!");
    throw Error("Out of entropy");
   }
   return rand[rand_count - 1];
  });
 }
};

self["onmessage"] = function(ev) {
 var data = JSON.parse(ev["data"]);
 var args = data["arguments"];
 args = [].concat(args);
 var res = undefined;
 var cmd = data["command"];
 switch (cmd) {
 case "run":
  shouldRunNow = true;
  preparePRNG();
  try {
   res = Module["run"](args);
  } catch (e) {
   self["postMessage"](JSON.stringify({
    "msg_id": data["msg_id"],
    "command": "error",
    "message": e.toString()
   }));
   return;
  }
  self["postMessage"](JSON.stringify({
   "msg_id": data["msg_id"],
   "command": "success",
   "result": res
  }));
  res = undefined;
  break;

 case "FS_createLazyFilesFromList":
  args.unshift(data["msg_id"]);
  res = FS_createLazyFilesFromList.apply(this, args);
  break;

 case "FS_createDataFile":
  FS.createDataFile.apply(FS, args);
  res = true;
  break;

 case "FS_createLazyFile":
  FS.createLazyFile.apply(FS, args);
  res = true;
  break;

 case "FS_createFolder":
  FS.createFolder.apply(FS, args);
  res = true;
  break;

 case "FS_createPath":
  FS.createPath.apply(FS, args);
  res = true;
  break;

 case "FS_unlink":
  FS.unlink.apply(FS, args);
  res = true;
  break;

 case "FS_readFile":
  var tmp = FS.readFile.apply(FS, args);
  var res = "";
  var chunk = 8 * 1024;
  var i;
  for (i = 0; i < tmp.length / chunk; i++) {
   res += String.fromCharCode.apply(null, tmp.subarray(i * chunk, (i + 1) * chunk));
  }
  res += String.fromCharCode.apply(null, tmp.subarray(i * chunk));
  break;

 case "set_TOTAL_MEMORY":
  Module.TOTAL_MEMORY = args[0];
  res = Module.TOTAL_MEMORY;
  break;

 case "test":
  break;
 }
 if (typeof res !== "undefined") self["postMessage"](JSON.stringify({
  "command": "result",
  "result": res,
  "msg_id": data["msg_id"]
 }));
};

var moduleOverrides = {};

var key;

for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}

Module["arguments"] = [];

Module["thisProgram"] = "./this.program";

Module["quit"] = function(status, toThrow) {
 throw toThrow;
};

Module["preRun"] = [];

Module["postRun"] = [];

var ENVIRONMENT_IS_WEB = false;

var ENVIRONMENT_IS_WORKER = false;

var ENVIRONMENT_IS_NODE = false;

var ENVIRONMENT_IS_SHELL = false;

ENVIRONMENT_IS_WEB = typeof window === "object";

ENVIRONMENT_IS_WORKER = typeof importScripts === "function";

ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;

ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 } else {
  return scriptDirectory + path;
 }
}

if (ENVIRONMENT_IS_NODE) {
 scriptDirectory = __dirname + "/";
 var nodeFS;
 var nodePath;
 Module["read"] = function shell_read(filename, binary) {
  var ret;
  ret = tryParseAsDataURI(filename);
  if (!ret) {
   if (!nodeFS) nodeFS = require("fs");
   if (!nodePath) nodePath = require("path");
   filename = nodePath["normalize"](filename);
   ret = nodeFS["readFileSync"](filename);
  }
  return binary ? ret : ret.toString();
 };
 Module["readBinary"] = function readBinary(filename) {
  var ret = Module["read"](filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 if (process["argv"].length > 1) {
  Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 });
 process["on"]("unhandledRejection", abort);
 Module["quit"] = function(status) {
  process["exit"](status);
 };
 Module["inspect"] = function() {
  return "[Emscripten Module object]";
 };
} else if (ENVIRONMENT_IS_SHELL) {
 if (typeof read != "undefined") {
  Module["read"] = function shell_read(f) {
   var data = tryParseAsDataURI(f);
   if (data) {
    return intArrayToString(data);
   }
   return read(f);
  };
 }
 Module["readBinary"] = function readBinary(f) {
  var data;
  data = tryParseAsDataURI(f);
  if (data) {
   return data;
  }
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof quit === "function") {
  Module["quit"] = function(status) {
   quit(status);
  };
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 Module["read"] = function shell_read(url) {
  try {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  } catch (err) {
   var data = tryParseAsDataURI(url);
   if (data) {
    return intArrayToString(data);
   }
   throw err;
  }
 };
 if (ENVIRONMENT_IS_WORKER) {
  Module["readBinary"] = function readBinary(url) {
   try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   } catch (err) {
    var data = tryParseAsDataURI(url);
    if (data) {
     return data;
    }
    throw err;
   }
  };
 }
 Module["readAsync"] = function readAsync(url, onload, onerror) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
    return;
   }
   var data = tryParseAsDataURI(url);
   if (data) {
    onload(data.buffer);
    return;
   }
   onerror();
  };
  xhr.onerror = onerror;
  xhr.send(null);
 };
 Module["setWindowTitle"] = function(title) {
  document.title = title;
 };
} else {}

var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);

var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : typeof console !== "undefined" && console.warn.bind(console) || out);

for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}

moduleOverrides = undefined;

var STACK_ALIGN = 16;

function dynamicAlloc(size) {
 var ret = HEAP32[DYNAMICTOP_PTR >> 2];
 var end = ret + size + 15 & -16;
 if (end <= _emscripten_get_heap_size()) {
  HEAP32[DYNAMICTOP_PTR >> 2] = end;
 } else {
  return 0;
 }
 return ret;
}

function getNativeTypeSize(type) {
 switch (type) {
 case "i1":
 case "i8":
  return 1;

 case "i16":
  return 2;

 case "i32":
  return 4;

 case "i64":
  return 8;

 case "float":
  return 4;

 case "double":
  return 8;

 default:
  {
   if (type[type.length - 1] === "*") {
    return 4;
   } else if (type[0] === "i") {
    var bits = parseInt(type.substr(1));
    assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
    return bits / 8;
   } else {
    return 0;
   }
  }
 }
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  err(text);
 }
}

var jsCallStartIndex = 1;

var functionPointers = new Array(0);

var funcWrappers = {};

function dynCall(sig, ptr, args) {
 if (args && args.length) {
  return Module["dynCall_" + sig].apply(null, [ ptr ].concat(args));
 } else {
  return Module["dynCall_" + sig].call(null, ptr);
 }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
 tempRet0 = value;
};

var getTempRet0 = function() {
 return tempRet0;
};

var GLOBAL_BASE = 8;

var ABORT = false;

var EXITSTATUS = 0;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}

function getCFunc(ident) {
 var func = Module["_" + ident];
 assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
 return func;
}

function ccall(ident, returnType, argTypes, args, opts) {
 var toC = {
  "string": function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    var len = (str.length << 2) + 1;
    ret = stackAlloc(len);
    stringToUTF8(str, ret, len);
   }
   return ret;
  },
  "array": function(arr) {
   var ret = stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }
 };
 function convertReturnValue(ret) {
  if (returnType === "string") return UTF8ToString(ret);
  if (returnType === "boolean") return Boolean(ret);
  return ret;
 }
 var func = getCFunc(ident);
 var cArgs = [];
 var stack = 0;
 if (args) {
  for (var i = 0; i < args.length; i++) {
   var converter = toC[argTypes[i]];
   if (converter) {
    if (stack === 0) stack = stackSave();
    cArgs[i] = converter(args[i]);
   } else {
    cArgs[i] = args[i];
   }
  }
 }
 var ret = func.apply(null, cArgs);
 ret = convertReturnValue(ret);
 if (stack !== 0) stackRestore(stack);
 return ret;
}

function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;

 case "i8":
  HEAP8[ptr >> 0] = value;
  break;

 case "i16":
  HEAP16[ptr >> 1] = value;
  break;

 case "i32":
  HEAP32[ptr >> 2] = value;
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], 
  HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;

 case "float":
  HEAPF32[ptr >> 2] = value;
  break;

 case "double":
  HEAPF64[ptr >> 3] = value;
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

var ALLOC_NONE = 3;

function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ _malloc, stackAlloc, dynamicAlloc ][allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var stop;
  ptr = ret;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (;ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}

function getMemory(size) {
 if (!runtimeInitialized) return dynamicAlloc(size);
 return _malloc(size);
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
 } else {
  var str = "";
  while (idx < endPtr) {
   var u0 = u8Array[idx++];
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   var u1 = u8Array[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   var u2 = u8Array[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63;
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4;
 }
 return len;
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function allocateUTF8(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8Array(str, HEAP8, ret, size);
 return ret;
}

function allocateUTF8OnStack(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = stackAlloc(size);
 stringToUTF8Array(str, HEAP8, ret, size);
 return ret;
}

function writeArrayToMemory(array, buffer) {
 HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}

function demangle(func) {
 return func;
}

function demangleAll(text) {
 var regex = /__Z[\w\d_]+/g;
 return text.replace(regex, function(x) {
  var y = demangle(x);
  return x === y ? x : y + " [" + x + "]";
 });
}

function jsStackTrace() {
 var err = new Error();
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}

function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferViews() {
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}

var STACK_BASE = 35344, DYNAMIC_BASE = 5278224, DYNAMICTOP_PTR = 35088;

var TOTAL_STACK = 5242880;

var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;

if (TOTAL_MEMORY < TOTAL_STACK) err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

if (Module["buffer"]) {
 buffer = Module["buffer"];
} else {
 {
  buffer = new ArrayBuffer(TOTAL_MEMORY);
 }
 Module["buffer"] = buffer;
}

updateGlobalBufferViews();

HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Module["dynCall_v"](func);
   } else {
    Module["dynCall_vi"](func, callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeExited = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var Math_abs = Math.abs;

var Math_ceil = Math.ceil;

var Math_floor = Math.floor;

var Math_min = Math.min;

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
 return id;
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

var memoryInitializer = null;

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
}

__ATINIT__.push({
 func: function() {
  ___emscripten_environ_constructor();
 }
});

memoryInitializer = "data:application/octet-stream;base64,AAAAAAAAAABcDQAAhA0AAMANAADlDQAALA4AAGEOAACTDgAAAAAAAAIAAMADAADABAAAwAUAAMAGAADABwAAwAgAAMAJAADACgAAwAsAAMAMAADADQAAwA4AAMAPAADAEAAAwBEAAMASAADAEwAAwBQAAMAVAADAFgAAwBcAAMAYAADAGQAAwBoAAMAbAADAHAAAwB0AAMAeAADAHwAAwAAAALMBAADDAgAAwwMAAMMEAADDBQAAwwYAAMMHAADDCAAAwwkAAMMKAADDCwAAwwwAAMMNAADTDgAAww8AAMMAAAy7AQAMwwIADMMDAAzDBAAM0wAAAAARAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAARMJCwsAAAkGCwAACwAGEQAAABEREQAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAARAAoKERERAAoAAAIACQsAAAAJAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAA0AAAAEDQAAAAAJDgAAAAAADgAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAAAA8AAAAACRAAAAAAABAAABAAABIAAAASEhIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAABISEgAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAAoAAAAACgAAAAAJCwAAAAAACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUZUISIZDQECAxFLHAwQBAsdEh4naG5vcHFiIAUGDxMUFRoIFgcoJBcYCQoOGx8lI4OCfSYqKzw9Pj9DR0pNWFlaW1xdXl9gYWNkZWZnaWprbHJzdHl6e3wAAAAAAAAAAABJbGxlZ2FsIGJ5dGUgc2VxdWVuY2UARG9tYWluIGVycm9yAFJlc3VsdCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkYXRhIHR5cGUATm8gc3BhY2UgbGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlvbiBpbiBwcm9ncmVzcwBTdGFsZSBmaWxlIGhhbmRsZQBSZW1vdGUgSS9PIGVycm9yAFF1b3RhIGV4Y2VlZGVkAE5vIG1lZGl1bSBmb3VuZABXcm9uZyBtZWRpdW0gdHlwZQBObyBlcnJvciBpbmZvcm1hdGlvbgAAAAAAAIo2AACXNgAA6DgAAO04AAAAAAAAaAoAAAUAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAA+YgAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAP//////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADoCgAACQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAIAAACIagAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgLAAAFAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAgAAAJhuAAAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAK/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAsAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC0iAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFVzYWdlOiBiaWJ0ZXggW09QVElPTl0uLi4gQVVYRklMRVsuYXV4XQAgIFdyaXRlIGJpYmxpb2dyYXBoeSBmb3IgZW50cmllcyBpbiBBVVhGSUxFIHRvIEFVWEZJTEUuYmJsLAAgIGFsb25nIHdpdGggYSBsb2cgZmlsZSBBVVhGSUxFLmJsZy4ALW1pbi1jcm9zc3JlZnM9TlVNQkVSICBpbmNsdWRlIGl0ZW0gYWZ0ZXIgTlVNQkVSIGNyb3NzLXJlZnM7IGRlZmF1bHQgMgAtdGVyc2UgICAgICAgICAgICAgICAgIGRvIG5vdCBwcmludCBwcm9ncmVzcyByZXBvcnRzAC1oZWxwICAgICAgICAgICAgICAgICAgZGlzcGxheSB0aGlzIGhlbHAgYW5kIGV4aXQALXZlcnNpb24gICAgICAgICAgICAgICBvdXRwdXQgdmVyc2lvbiBpbmZvcm1hdGlvbiBhbmQgZXhpdABTb3JyeS0tLXlvdSd2ZSBleGNlZWRlZCBCaWJUZVgncyAALS0tdGhpcyBjYW4ndCBoYXBwZW4AKlBsZWFzZSBub3RpZnkgdGhlIEJpYlRlWCBtYWludGFpbmVyKgBSZWFsbG9jYXRlZCAlcyAoZWx0X3NpemU9JWxkKSB0byAlbGQgaXRlbXMgZnJvbSAlbGQuCgBidWZmZXIAc3ZfYnVmZmVyAGV4X2J1ZgBvdXRfYnVmAG5hbWVfdG9rAG5hbWVfc2VwX2NoYXIAJXMlbGQASWxsZWdhbCBzdHJpbmcgbnVtYmVyOgBzdHJfcG9vbAAgOiAAKEVycm9yIG1heSBoYXZlIGJlZW4gb24gcHJldmlvdXMgbGluZSkASSdtIHNraXBwaW5nIHdoYXRldmVyIHJlbWFpbnMgb2YgdGhpcyAARmlsZSBuYW1lIGAAJyBpcyB0b28gbG9uZwBJIGNvdWxkbid0IG9wZW4gZmlsZSBuYW1lIGAAJXMlbGQlcwAtLS1saW5lIAAgb2YgZmlsZSAAY29tbWFuZABJbGxlZ2FsLCBhbm90aGVyIFxiaWIAZGF0YQBzdHlsZQBJbGxlZ2FsIGF1eGlsaWFyeS1maWxlIGNvbW1hbmQAIGNvbW1hbmQAJXMlYyVjAE5vICIAU3R1ZmYgYWZ0ZXIgIgBXaGl0ZSBzcGFjZSBpbiBhcmd1bWVudABDaXRlIGhhc2ggZXJyb3IAY2l0ZV9saXN0AHR5cGVfbGlzdABlbnRyeV9leGlzdHMAY2l0ZV9pbmZvAEkgZm91bmQgbm8gAC0tLXdoaWxlIHJlYWRpbmcgZmlsZSAALS1saW5lIABJbGxlZ2FsIGVuZCBvZiBzdHlsZSBmaWxlIGluIGNvbW1hbmQ6IABVbmtub3duIGZ1bmN0aW9uIGNsYXNzAGJ1aWx0LWluAHdpemFyZC1kZWZpbmVkAGludGVnZXItbGl0ZXJhbABzdHJpbmctbGl0ZXJhbABmaWVsZABpbnRlZ2VyLWVudHJ5LXZhcmlhYmxlAHN0cmluZy1lbnRyeS12YXJpYWJsZQBpbnRlZ2VyLWdsb2JhbC12YXJpYWJsZQBzdHJpbmctZ2xvYmFsLXZhcmlhYmxlAElkZW50aWZpZXIgc2Nhbm5pbmcgZXJyb3IAJWMlYyVzACIgYmVnaW5zIGlkZW50aWZpZXIsIGNvbW1hbmQ6IAAiIGltbWVkaWF0ZWx5IGZvbGxvd3MgaWRlbnRpZmllciwgY29tbWFuZDogACIgaXMgbWlzc2luZyBpbiBjb21tYW5kOiAAIGlzIGFscmVhZHkgYSB0eXBlICIAIiBmdW5jdGlvbiBuYW1lAGVudHJ5AGZpZWxkX2luZm8ASWxsZWdhbCBlbmQgb2YgZGF0YWJhc2UgZmlsZQAlcyVjJXMlYyVjAEkgd2FzIGV4cGVjdGluZyBhIGAAJyBvciBhIGAASSB3YXMgZXhwZWN0aW5nIGFuICIAVW5iYWxhbmNlZCBicmFjZXMAWW91ciBmaWVsZCBpcyBtb3JlIHRoYW4gACBjaGFyYWN0ZXJzAFdhcm5pbmctLXN0cmluZyBuYW1lICIAIiBpcyAAWW91J3JlIG1pc3NpbmcgACIgaW1tZWRpYXRlbHkgZm9sbG93cyAAVW5rbm93biBkYXRhYmFzZS1maWxlIGNvbW1hbmQAQSBjaXRlIGtleSBkaXNhcHBlYXJlZAAtLWVudHJ5ICIAcmVmZXJzIHRvIGVudHJ5ICIAQSBiYWQgY3Jvc3MgcmVmZXJlbmNlLQAiLCB3aGljaCBkb2Vzbid0IGV4aXN0AFdhcm5pbmctLUkgZGlkbid0IGZpbmQgYSBkYXRhYmFzZSBlbnRyeSBmb3IgIgAgZm9yIGVudHJ5IAB3aGlsZSBleGVjdXRpbmctAHdoaWxlIGV4ZWN1dGluZwBZb3UgY2FuJ3QgbWVzcyB3aXRoIGVudHJpZXMgaGVyZQBJbGxlZ2FsIGxpdGVyYWwgdHlwZQBVbmtub3duIGxpdGVyYWwgdHlwZQAlbGQlcwAgaXMgYW4gaW50ZWdlciBsaXRlcmFsACIgaXMgYSBzdHJpbmcgbGl0ZXJhbAAnIGlzIGEgZnVuY3Rpb24gbGl0ZXJhbAAnIGlzIGEgbWlzc2luZyBmaWVsZAAlbGQKAFdhcm5pbmctLXlvdSd2ZSBleGNlZWRlZCAALXN0cmluZy1zaXplLAAqUGxlYXNlIG5vdGlmeSB0aGUgYmlic3R5bGUgZGVzaWduZXIqAFdhcm5pbmctLSIAIiBpc24ndCBhIGJyYWNlLWJhbGFuY2VkIHN0cmluZwBVbmtub3duIHR5cGUgb2YgY2FzZSBjb252ZXJzaW9uAFlvdSd2ZSB1c2VkIAAgZW50cnksACBlbnRyaWVzLAAlcyVsZCVzCgAgICAgICAgICAgICAAIHdpel9kZWZpbmVkLWZ1bmN0aW9uIGxvY2F0aW9ucywAJXMlbGQlcyVsZCVzCgAgc3RyaW5ncyB3aXRoIAAgY2hhcmFjdGVycywAYW5kIHRoZSBidWlsdF9pbiBmdW5jdGlvbi1jYWxsIGNvdW50cywgACBpbiBhbGwsIGFyZToAJXMlbGQKACAtLSAAbnVtYmVyIG9mIHN0cmluZ3MgAGhhc2ggc2l6ZSAARHVwbGljYXRlIHNvcnQga2V5AC5hdXggICAgICAgIAAuYmJsICAgICAgICAALmJsZyAgICAgICAgAC5ic3QgICAgICAgIAAuYmliICAgICAgICAAdGV4aW5wdXRzOiAgAHRleGJpYjogICAgIABcY2l0YXRpb24gICAAXGJpYmRhdGEgICAgAFxiaWJzdHlsZSAgIABcQGlucHV0ICAgICAAZW50cnkgICAgICAgAGV4ZWN1dGUgICAgIABmdW5jdGlvbiAgICAAaW50ZWdlcnMgICAgAGl0ZXJhdGUgICAgIABtYWNybyAgICAgICAAcmVhZCAgICAgICAgAHJldmVyc2UgICAgIABzb3J0ICAgICAgICAAc3RyaW5ncyAgICAgAGNvbW1lbnQgICAgIABwcmVhbWJsZSAgICAAc3RyaW5nICAgICAgAD0gICAgICAgICAgIAA+ICAgICAgICAgICAAPCAgICAgICAgICAgACsgICAgICAgICAgIAAtICAgICAgICAgICAAKiAgICAgICAgICAgADo9ICAgICAgICAgIABhZGQucGVyaW9kJCAAY2FsbC50eXBlJCAgAGNoYW5nZS5jYXNlJABjaHIudG8uaW50JCAAY2l0ZSQgICAgICAgAGR1cGxpY2F0ZSQgIABlbXB0eSQgICAgICAAZm9ybWF0Lm5hbWUkAGlmJCAgICAgICAgIABpbnQudG8uY2hyJCAAaW50LnRvLnN0ciQgAG1pc3NpbmckICAgIABuZXdsaW5lJCAgICAAbnVtLm5hbWVzJCAgAHBvcCQgICAgICAgIABwcmVhbWJsZSQgICAAcHVyaWZ5JCAgICAgAHF1b3RlJCAgICAgIABza2lwJCAgICAgICAAc3RhY2skICAgICAgAHN1YnN0cmluZyQgIABzd2FwJCAgICAgICAAdGV4dC5sZW5ndGgkAHRleHQucHJlZml4JAB0b3AkICAgICAgICAAdHlwZSQgICAgICAgAHdhcm5pbmckICAgIAB3aGlsZSQgICAgICAAd2lkdGgkICAgICAgAHdyaXRlJCAgICAgIABkZWZhdWx0LnR5cGUAaSAgICAgICAgICAgAGogICAgICAgICAgIABvZSAgICAgICAgICAAT0UgICAgICAgICAgAGFlICAgICAgICAgIABBRSAgICAgICAgICAAYWEgICAgICAgICAgAEFBICAgICAgICAgIABvICAgICAgICAgICAATyAgICAgICAgICAgAGwgICAgICAgICAgIABMICAgICAgICAgICAAc3MgICAgICAgICAgAGNyb3NzcmVmICAgIABzb3J0LmtleSQgICAAZW50cnkubWF4JCAgAGdsb2JhbC5tYXgkIABDdXJzZSB5b3UsIHdpemFyZCwgYmVmb3JlIHlvdSByZWN1cnNlIG1lOgBmdW5jdGlvbiAAIGlzIGlsbGVnYWwgaW4gaXRzIG93biBkZWZpbml0aW9uACBpcyBhbiB1bmtub3duIGZ1bmN0aW9uACIgY2FuJ3QgZm9sbG93IGEgbGl0ZXJhbABmdW5jdGlvbgBJbGxlZ2FsIGludGVnZXIgaW4gaW50ZWdlciBsaXRlcmFsAHNpbmdsX2Z1bmN0aW9uACVzJWMlcwBObyBgACcgdG8gZW5kIHN0cmluZyBsaXRlcmFsAEFscmVhZHkgZW5jb3VudGVyZWQgaW1wbGljaXQgZnVuY3Rpb24Ad2l6X2Z1bmN0aW9ucwBBIGRpZ2l0IGRpc2FwcGVhcmVkAGEgZmllbGQgcGFydAB1c2VkIGluIGl0cyBvd24gZGVmaW5pdGlvbgB1bmRlZmluZWQAZmllbGRfaW5mbyBpbmRleCBpcyBvdXQgb2YgcmFuZ2UAV2FybmluZy0tSSdtIGlnbm9yaW5nIAAncyBleHRyYSAiACIgZmllbGQAQ29udHJvbC1zZXF1ZW5jZSBoYXNoIGVycm9yAFRoZSBmb3JtYXQgc3RyaW5nICIAIiBoYXMgYW4gaWxsZWdhbCBicmFjZS1sZXZlbC0xIGxldHRlcgBsaXRfc3RhY2sAbGl0X3N0a190eXBlAFlvdSBjYW4ndCBwb3AgYW4gZW1wdHkgbGl0ZXJhbCBzdGFjawBOb250b3AgdG9wIG9mIHN0cmluZyBzdGFjawAsIG5vdCBhbiBpbnRlZ2VyLAAsIG5vdCBhIHN0cmluZywALCBub3QgYSBmdW5jdGlvbiwARW1wdHkgbGl0ZXJhbABwdHI9ACwgc3RhY2s9AC0tLXRoZSBsaXRlcmFsIHN0YWNrIGlzbid0IGVtcHR5AE5vbmVtcHR5IGVtcHR5IHN0cmluZyBzdGFjawAsIAAtLS10aGV5IGFyZW4ndCB0aGUgc2FtZSBsaXRlcmFsIHR5cGVzACwgbm90IGFuIGludGVnZXIgb3IgYSBzdHJpbmcsACwgdGhlIGVudHJ5ACwgdGhlIGdsb2JhbABZb3UgY2FuJ3QgYXNzaWduIHRvIHR5cGUgACwgYSBub252YXJpYWJsZSBmdW5jdGlvbiBjbGFzcwAgaXMgYW4gaWxsZWdhbCBjYXNlLWNvbnZlcnNpb24gc3RyaW5nACIgaXNuJ3QgYSBzaW5nbGUgY2hhcmFjdGVyACwgbm90IGEgc3RyaW5nIG9yIG1pc3NpbmcgZmllbGQsAFRoZXJlIGlzIG5vIG5hbWUgaW4gIgBUaGVyZSBhcmVuJ3QgACBuYW1lcyBpbiAiAE5hbWUgACBpbiAiACIgaGFzIGEgY29tbWEgYXQgdGhlIGVuZABUb28gbWFueSBjb21tYXMgaW4gbmFtZSAAIG9mICIAIiBpc24ndCBicmFjZSBiYWxhbmNlZABJbGxlZ2FsIG51bWJlciBvZiBjb21tYSxzACBpc24ndCB2YWxpZCBBU0NJSQBXYXJuaW5nLS0AVW5rbm93biBidWlsdC1pbiBmdW5jdGlvbgByYgBBbHJlYWR5IGVuY291bnRlcmVkIGF1eGlsaWFyeSBmaWxlAHRlcnNlAG1pbi1jcm9zc3JlZnMAaGVscAB2ZXJzaW9uAGJpYnRleABUaGlzIGlzIEJpYlRlWCwgVmVyc2lvbiAwLjk5ZABPcmVuIFBhdGFzaG5pawAlcyVzCgA6IE5lZWQgZXhhY3RseSBvbmUgZmlsZSBhcmd1bWVudC4AYmliX2xpc3QAYmliX2ZpbGUAc19wcmVhbWJsZQBUaGlzIGRhdGFiYXNlIGZpbGUgYXBwZWFycyBtb3JlIHRoYW4gb25jZTogAEkgY291bGRuJ3Qgb3BlbiBkYXRhYmFzZSBmaWxlIABBbHJlYWR5IGVuY291bnRlcmVkIHN0eWxlIGZpbGUASSBjb3VsZG4ndCBvcGVuIHN0eWxlIGZpbGUgAFRoZSBzdHlsZSBmaWxlOiAATXVsdGlwbGUgaW5jbHVzaW9ucyBvZiBlbnRpcmUgZGF0YWJhc2UAQ2FzZSBtaXNtYXRjaCBlcnJvciBiZXR3ZWVuIGNpdGUga2V5cyAAIGFuZCAAOiAAYXV4aWxpYXJ5IGZpbGUgZGVwdGggACBoYXMgYSB3cm9uZyBleHRlbnNpb24AQWxyZWFkeSBlbmNvdW50ZXJlZCBmaWxlIABJIGNvdWxkbid0IG9wZW4gYXV4aWxpYXJ5IGZpbGUgAEEgbGV2ZWwtACBhdXhpbGlhcnkgZmlsZTogAFVua25vd24gYXV4aWxpYXJ5LWZpbGUgY29tbWFuZABcY2l0YXRpb24gY29tbWFuZHMAY2l0ZSBrZXlzAFxiaWJkYXRhIGNvbW1hbmQAZGF0YWJhc2UgZmlsZXMAXGJpYnN0eWxlIGNvbW1hbmQAc3R5bGUgZmlsZQBJbGxlZ2FsLCBhbm90aGVyIGVudHJ5IGNvbW1hbmQAV2FybmluZy0tSSBkaWRuJ3QgZmluZCBhbnkgZmllbGRzACBoYXMgYmFkIGZ1bmN0aW9uIHR5cGUgAElsbGVnYWwsIGV4ZWN1dGUgY29tbWFuZCBiZWZvcmUgcmVhZCBjb21tYW5kAGV4ZWN1dGUAaW50ZWdlcnMASWxsZWdhbCwgaXRlcmF0ZSBjb21tYW5kIGJlZm9yZSByZWFkIGNvbW1hbmQAaXRlcmF0ZQBJbGxlZ2FsLCBtYWNybyBjb21tYW5kIGFmdGVyIHJlYWQgY29tbWFuZABtYWNybwAgaXMgYWxyZWFkeSBkZWZpbmVkIGFzIGEgbWFjcm8AQSBtYWNybyBkZWZpbml0aW9uIG11c3QgYmUgAC1kZWxpbWl0ZWQAVGhlcmUncyBubyBgACcgdG8gZW5kIG1hY3JvIGRlZmluaXRpb24AQW4gIgAiIGRpc2FwcGVhcmVkAGFuIGVudHJ5IHR5cGUATWlzc2luZyAiACIgaW4gcHJlYW1ibGUgY29tbWFuZABhIHN0cmluZyBuYW1lACIgaW4gc3RyaW5nIGNvbW1hbmQAVGhlIGNpdGUgbGlzdCBpcyBtZXNzZWQgdXAAUmVwZWF0ZWQgZW50cnkAV2FybmluZy0tZW50cnkgdHlwZSBmb3IgIgAiIGlzbid0IHN0eWxlLWZpbGUgZGVmaW5lZABhIGZpZWxkIG5hbWUASWxsZWdhbCwgYW5vdGhlciByZWFkIGNvbW1hbmQASWxsZWdhbCwgcmVhZCBjb21tYW5kIGJlZm9yZSBlbnRyeSBjb21tYW5kAERhdGFiYXNlIGZpbGUgIwBXYXJuaW5nLS15b3UndmUgbmVzdGVkIGNyb3NzIHJlZmVyZW5jZXMAIiwgd2hpY2ggYWxzbyByZWZlcnMgdG8gc29tZXRoaW5nAElsbGVnYWwsIHJldmVyc2UgY29tbWFuZCBiZWZvcmUgcmVhZCBjb21tYW5kAHJldmVyc2UASWxsZWdhbCwgc29ydCBjb21tYW5kIGJlZm9yZSByZWFkIGNvbW1hbmQAc3RyaW5ncwBnbGJfc3RyX3B0cgBnbG9iYWxfc3RycwBnbGJfc3RyX2VuZAAiIGNhbid0IHN0YXJ0IGEgc3R5bGUtZmlsZSBjb21tYW5kACBpcyBhbiBpbGxlZ2FsIHN0eWxlLWZpbGUgY29tbWFuZABVbmtub3duIHN0eWxlLWZpbGUgY29tbWFuZABlbnRfc3RyX3NpemUAZ2xvYl9zdHJfc2l6ZQBtYXhfc3RyaW5ncwAlbGQlcwoAIGlzIGEgYmFkIGJhZAAlcyVsZCVzJWxkJXMlbGQKAENhcGFjaXR5OiBtYXhfc3RyaW5ncz0ALCBoYXNoX3NpemU9ACwgaGFzaF9wcmltZT0AVGhlIHRvcC1sZXZlbCBhdXhpbGlhcnkgZmlsZTogAEFib3J0ZWQgYXQgbGluZSAAKFRoZXJlIHdhcyAxIHdhcm5pbmcpAChUaGVyZSB3ZXJlIAAgd2FybmluZ3MpAChUaGVyZSB3YXMgMSBlcnJvciBtZXNzYWdlKQAgZXJyb3IgbWVzc2FnZXMpAChUaGF0IHdhcyBhIGZhdGFsIGVycm9yKQBIaXN0b3J5IGlzIGJ1bmsAJXM6IE9vcHM7IG5vdCBlbm91Z2ggYXJndW1lbnRzLgoASU5QVVQAJXMgJXMKAC5mbHMAd2IAUFdEICVzCgBPVVRQVVQAZmNsb3NlAHByb2dfbmFtZV9lbmQgJiYgcHJvZ192ZXJzaW9uAC4uLy4uLy4uLy4uL3RleGxpdmUtMjAxODA0MTQtc291cmNlL3RleGsvd2ViMmMvbGliL3ByaW50dmVyc2lvbi5jAHByaW50dmVyc2lvbmFuZGV4aXQAJXMgJXMlcwoAQ29weXJpZ2h0IDIwMTggJXMuCgBUaGVyZSBpcyBOTyB3YXJyYW50eS4gIFJlZGlzdHJpYnV0aW9uIG9mIHRoaXMgc29mdHdhcmUgaXMAY292ZXJlZCBieSB0aGUgdGVybXMgb2YgAGJvdGggdGhlICVzIGNvcHlyaWdodCBhbmQKAHRoZSBMZXNzZXIgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UuAEZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZXNlIG1hdHRlcnMsIHNlZSB0aGUgZmlsZQBuYW1lZCBDT1BZSU5HIGFuZCB0aGUgJXMgc291cmNlLgoAUHJpbWFyeSBhdXRob3Igb2YgJXM6ICVzLgoAJXM6IEJhZCB2YWx1ZSAoJWxkKSBpbiBlbnZpcm9ubWVudCBvciB0ZXhtZi5jbmYgZm9yICVzLCBrZWVwaW5nICVsZC4KAFRyeSBgJXMgLS1oZWxwJyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4KAHRleC1rQHR1Zy5vcmcAJXMKAApFbWFpbCBidWcgcmVwb3J0cyB0byAlcy4KACAoVGVYIExpdmUgMjAxOCkAcGsAbWYAdGV4AHRmbQBmbXQAb2ZtAG9jcABnZgAvbm9uZXN1Y2gAR0ZGT05UUwBHTFlQSEZPTlRTAFRFWEZPTlRTAG1rdGV4cGsALS1tZm1vZGUAJE1BS0VURVhfTU9ERQAtLWJkcGkAJE1BS0VURVhfQkFTRV9EUEkALS1tYWcAJE1BS0VURVhfTUFHAC0tZHBpACRLUEFUSFNFQV9EUEkAUEtGT05UUwBURVhQS1MAYml0bWFwIGZvbnQAbWt0ZXh0Zm0AVEZNRk9OVFMALnRmbQBhZm0AQUZNRk9OVFMALmFmbQBta3RleGZtdABiYXNlAE1GQkFTRVMAVEVYTUZJTkkALmJhc2UAYmliAEJJQklOUFVUUwBURVhCSUIALmJpYgBic3QAQlNUSU5QVVRTAC5ic3QAY25mAHskU0VMRkFVVE9MT0MsJFNFTEZBVVRPTE9DL3NoYXJlL3RleG1mLWxvY2FsL3dlYjJjLCRTRUxGQVVUT0xPQy9zaGFyZS90ZXhtZi1kaXN0L3dlYjJjLCRTRUxGQVVUT0xPQy9zaGFyZS90ZXhtZi93ZWIyYywkU0VMRkFVVE9MT0MvdGV4bWYtbG9jYWwvd2ViMmMsJFNFTEZBVVRPTE9DL3RleG1mLWRpc3Qvd2ViMmMsJFNFTEZBVVRPTE9DL3RleG1mL3dlYjJjLCRTRUxGQVVUT0RJUiwkU0VMRkFVVE9ESVIvc2hhcmUvdGV4bWYtbG9jYWwvd2ViMmMsJFNFTEZBVVRPRElSL3NoYXJlL3RleG1mLWRpc3Qvd2ViMmMsJFNFTEZBVVRPRElSL3NoYXJlL3RleG1mL3dlYjJjLCRTRUxGQVVUT0RJUi90ZXhtZi1sb2NhbC93ZWIyYywkU0VMRkFVVE9ESVIvdGV4bWYtZGlzdC93ZWIyYywkU0VMRkFVVE9ESVIvdGV4bWYvd2ViMmMsJFNFTEZBVVRPR1JBTkRQQVJFTlQvdGV4bWYtbG9jYWwvd2ViMmMsJFNFTEZBVVRPUEFSRU5ULCRTRUxGQVVUT1BBUkVOVC9zaGFyZS90ZXhtZi1sb2NhbC93ZWIyYywkU0VMRkFVVE9QQVJFTlQvc2hhcmUvdGV4bWYtZGlzdC93ZWIyYywkU0VMRkFVVE9QQVJFTlQvc2hhcmUvdGV4bWYvd2ViMmMsJFNFTEZBVVRPUEFSRU5UL3RleG1mLWxvY2FsL3dlYjJjLCRTRUxGQVVUT1BBUkVOVC90ZXhtZi1kaXN0L3dlYjJjLCRTRUxGQVVUT1BBUkVOVC90ZXhtZi93ZWIyY30AVEVYTUZDTkYALmNuZgBscy1SAFRFWE1GREJTAGxzLXIAVEVYRk9STUFUUwAuZm10AG1hcABURVhGT05UTUFQUwAubWFwAG1lbQBNUE1FTVMALm1lbQBta3RleG1mAE1GSU5QVVRTAC5tZgBtZnQATUZUSU5QVVRTAC5tZnQAbWZwb29sAE1GUE9PTAAucG9vbABtcABNUElOUFVUUwAubXAAbXBwb29sAE1QUE9PTABNZXRhUG9zdCBzdXBwb3J0AE1QU1VQUE9SVABta29jcABPQ1BJTlBVVFMALm9jcABta29mbQBPRk1GT05UUwAub2ZtAG9wbABPUExGT05UUwAub3BsAC5wbABvdHAAT1RQSU5QVVRTAC5vdHAAb3ZmAE9WRkZPTlRTAC5vdmYALnZmAG92cABPVlBGT05UUwAub3ZwAC52cGwAZ3JhcGhpYy9maWd1cmUAVEVYUElDVFMAVEVYSU5QVVRTAC5lcHMALmVwc2kAbWt0ZXh0ZXgALnRleAAuc3R5AC5jbHMALmZkAC5hdXgALmJibAAuZGVmAC5jbG8ALmxkZgBQb3N0U2NyaXB0IGhlYWRlcgBURVhQU0hFQURFUlMAUFNIRUFERVJTAC5wcm8AVGVYIHN5c3RlbSBkb2N1bWVudGF0aW9uAFRFWERPQ1MAdGV4cG9vbABURVhQT09MAFRlWCBzeXN0ZW0gc291cmNlcwBURVhTT1VSQ0VTAC5kdHgALmlucwBUcm9mZiBmb250cwAvdXNyey9sb2NhbCx9L3NoYXJlL2dyb2ZmL3tjdXJyZW50L2ZvbnQsc2l0ZS1mb250fS9kZXZwcwBUUkZPTlRTAHR5cGUxIGZvbnRzAFQxRk9OVFMAVDFJTlBVVFMALnBmYQAucGZiAHZmAFZGRk9OVFMAZHZpcHMgY29uZmlnAFRFWENPTkZJRwBpc3QAVEVYSU5ERVhTVFlMRQBJTkRFWFNUWUxFAC5pc3QAdHJ1ZXR5cGUgZm9udHMAVFRGT05UUwAudHRmAC50dGMALlRURgAuVFRDAC5kZm9udAB0eXBlNDIgZm9udHMAVDQyRk9OVFMALnQ0MgAuVDQyAHdlYjJjIGZpbGVzAFdFQjJDAG90aGVyIHRleHQgZmlsZXMAJFRFWE1GAElOUFVUUwBvdGhlciBiaW5hcnkgZmlsZXMAbWlzYyBmb250cwBNSVNDRk9OVFMAd2ViAFdFQklOUFVUUwAud2ViAC5jaABjd2ViAENXRUJJTlBVVFMALncAZW5jIGZpbGVzAEVOQ0ZPTlRTAC5lbmMAY21hcCBmaWxlcwBDTUFQRk9OVFMAc3ViZm9udCBkZWZpbml0aW9uIGZpbGVzAFNGREZPTlRTAC5zZmQAb3BlbnR5cGUgZm9udHMAT1BFTlRZUEVGT05UUwAub3RmAC5PVEYAcGRmdGV4IGNvbmZpZwBQREZURVhDT05GSUcAbGlnIGZpbGVzAExJR0ZPTlRTAC5saWcAdGV4bWZzY3JpcHRzAFRFWE1GU0NSSVBUUwBsdWEATFVBSU5QVVRTAC5sdWEALmx1YXRleAAubHVjAC5sdWN0ZXgALnRleGx1YQAudGV4bHVjAC50bHUAZm9udCBmZWF0dXJlIGZpbGVzAEZPTlRGRUFUVVJFUwAuZmVhAGNpZCBtYXBzAEZPTlRDSURNQVBTAC5jaWQALmNpZG1hcABtbGJpYgBNTEJJQklOUFVUUwAubWxiaWIAbWxic3QATUxCU1RJTlBVVFMALm1sYnN0AGNsdWEALjokU0VMRkFVVE9MT0MvbGliL3skcHJvZ25hbWUsJGVuZ2luZSx9L2x1YS8vAENMVUFJTlBVVFMALmRsbAAuc28AcmlzAFJJU0lOUFVUUwAucmlzAGJsdHhtbABCTFRYTUxJTlBVVFMALmJsdHhtbABrcHNlX2luaXRfZm9ybWF0OiBVbmtub3duIGZvcm1hdCAlZAAKAFNlYXJjaCBwYXRoIGZvciAlcyBmaWxlcyAoZnJvbSAlcykKACAgPSAlcwoAICBiZWZvcmUgZXhwYW5zaW9uID0gJXMKAChub25lKQAgIGFwcGxpY2F0aW9uIG92ZXJyaWRlIHBhdGggPSAlcwoAICBhcHBsaWNhdGlvbiBjb25maWcgZmlsZSBwYXRoID0gJXMKACAgdGV4bWYuY25mIHBhdGggPSAlcwoAICBjb21waWxlLXRpbWUgcGF0aCA9ICVzCgAgIGVudmlyb25tZW50IHZhcmlhYmxlcyA9ICVzCgAgIGRlZmF1bHQgc3VmZml4ZXMgPQAgKG5vbmUpCgAgIG90aGVyIHN1ZmZpeGVzID0AICBzZWFyY2ggb25seSB3aXRoIHN1ZmZpeCA9ICVkCgAgIHJ1bnRpbWUgZ2VuZXJhdGlvbiBwcm9ncmFtID0gJXMKACAgcnVudGltZSBnZW5lcmF0aW9uIGNvbW1hbmQgPQAgIHByb2dyYW0gZW5hYmxlZCA9ICVkCgAgIHByb2dyYW0gZW5hYmxlIGxldmVsID0gJWQKACAgb3BlbiBmaWxlcyBpbiBiaW5hcnkgbW9kZSA9ICVkCgAgIG51bWVyaWMgZm9ybWF0IHZhbHVlID0gJWQKAGNvbXBpbGUtdGltZSBwYXRocy5oAHByb2dyYW0gY29uZmlnIGZpbGUAIGVudmlyb25tZW50IHZhcmlhYmxlAGFwcGxpY2F0aW9uIG92ZXJyaWRlIHZhcmlhYmxlAGNvbnN0X25hbWUALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS90ZXgtZmlsZS5jAGtwYXRoc2VhX2ZpbmRfZmlsZV9nZW5lcmljAGtwc2VfZmluZF9maWxlOiBzZWFyY2hpbmcgZm9yICVzIG9mIHR5cGUgJXMgKGZyb20gJXMpCgB0cnlfc3RkX2V4dGVuc2lvbl9maXJzdABvcGVuaW5fYW55AAolczogTm90ICVzICVzICglcyA9ICVzKS4KAHJlYWRpbmcgZnJvbQB3cml0aW5nIHRvAG9wZW5vdXRfYW55AHAALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS9jbmYuYwBrcGF0aHNlYV9jbmZfZ2V0AHRleG1mLmNuZgAlczolZDogKGtwYXRoc2VhKSBMYXN0IGxpbmUgb2YgZmlsZSBlbmRzIHdpdGggXAAlczolZDogKGtwYXRoc2VhKSAlcyBvbiBsaW5lOiAlcwBLUEFUSFNFQV9XQVJOSU5HADAAa3BhdGhzZWE6IGNvbmZpZ3VyYXRpb24gZmlsZSB0ZXhtZi5jbmYgbm90IGZvdW5kIGluIHRoZXNlIGRpcmVjdG9yaWVzOiAlcwBObyBjbmYgdmFyaWFibGUgbmFtZQBObyBjbmYgdmFsdWUAZGI6aW5pdCgpOiBza2lwcGluZyBkYiBzYW1lX2ZpbGVfcCAlcywgd2lsbCBhZGQgJXMuCgBkYjppbml0KCk6IHVzaW5nIGRiIGZpbGUgJXMuCgBhbGlhc2VzACVzOiAldSBhbGlhc2VzLgoAYWxpYXMgaGFzaCB0YWJsZToAa3BhdGhzZWE6ICVzOiBObyB1c2FibGUgZW50cmllcyBpbiBscy1SAGtwYXRoc2VhOiBTZWUgdGhlIG1hbnVhbCBmb3IgaG93IHRvIGdlbmVyYXRlIGxzLVIAJXM6ICV1IGVudHJpZXMgaW4gJWQgZGlyZWN0b3JpZXMgKCVkIGhpZGRlbikuCgBscy1SIGhhc2ggdGFibGU6AGxzLXIAbHMtUgBkYjptYXRjaCglcywlcykgPSAlZAoAZm9wZW4oJXMsICVzKSA9PiAweCVseAoAZmNsb3NlKDB4JWx4KSA9PiAlZAoAZGlyX2xpbmtzKCVzKSA9PiAlbGQKADoAS1BTRV9ET1QAa3BhdGhzZWE6ICVzOiBVbm1hdGNoZWQgewB0ZXhmb250cy5tYXAAcgBAYwBpbmNsdWRlAGtwYXRoc2VhOiAlczoldTogRmlsZW5hbWUgYXJndW1lbnQgZm9yIGluY2x1ZGUgZGlyZWN0aXZlIG1pc3NpbmcAa3BhdGhzZWE6ICVzOiV1OiBDYW4ndCBmaW5kIGZvbnRuYW1lIGluY2x1ZGUgZmlsZSBgJXMnAGtwYXRoc2VhOiAlczoldTogRm9udG5hbWUgYWxpYXMgbWlzc2luZyBmb3IgZmlsZW5hbWUgYCVzJwBoYXNoX2xvb2t1cCglcykgPT4AIChuaWwpCgAlbGQAJTRkIAA6JS01ZAAgJXM9PiVzACV1IGJ1Y2tldHMsICV1IG5vbmVtcHR5ICgldSUlKTsgJXUgZW50cmllcywgYXZlcmFnZSBjaGFpbiAlLjFmLgoAZmFsbGJhY2sALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS9rZGVmYXVsdC5jAGtwYXRoc2VhX2V4cGFuZF9kZWZhdWx0AGtwc2UtPnBhdGgALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS9wYXRoLWVsdC5jAGVsZW1lbnQAc3RhcnQgZ2VuZXJpYyBzZWFyY2goZmlsZXM9ACwgbXVzdF9leGlzdD0lZCwgZmluZF9hbGw9JWQsIHBhdGg9JXMpCgAgZ2VuZXJpYyBzZWFyY2g6IGFsbCBhYnNvbHV0ZSwgY2FuZGlkYXRlcyBhcmU6AHRleG1mX2Nhc2Vmb2xkX3NlYXJjaAByZXR1cm5pbmcgZnJvbSBnZW5lcmljIHNlYXJjaCgAKSA9PgBURVhNRkxPRwAlbHUgJXMKACAgIGNhc2Vmb2xkX3JlYWRhYmxlX2ZpbGUoJXMpIGluICVzID0+IAB7Y2FzZWZvbGRlZCBjYW5kaWRhdGUgJXMgbm90IHJlYWRhYmxlLCBjb250aW51aW5nfQB5ZXMAbm8AICBkaXJfbGlzdF9zZWFyY2hfbGlzdChmaWxlcz0ALCBmaW5kX2FsbD0lZCwgY2FzZWZvbGQ9JXMpCgAgYWJzb2x1dGVfc2VhcmNoKCVzKSA9PiAlcwoAICBjYXNlZm9sZCBzZWFyY2goJXMpID0+ICVzCgBbACAAXQBzdGFydCBzZWFyY2goeG5hbWU9JXMsIG11c3RfZXhpc3Q9JWQsIGZpbmRfYWxsPSVkLCBwYXRoPSVzKS4KAHJldHVybmluZyBmcm9tIHNlYXJjaCglcykgPT4AIHBhdGhfc2VhcmNoKGZpbGU9JXMsIG11c3RfZXhpc3Q9JWQsIGZpbmRfYWxsPSVkLCBwYXRoPSVzKQoAICBkaXJfbGlzdF9zZWFyY2goZmlsZT0lcywgZmluZF9hbGw9JWQsIGNhc2Vmb2xkPSVzKQoAUEFUSABrcGF0aHNlYTogQ2FuJ3QgZ2V0IGRpcmVjdG9yeSBvZiBwcm9ncmFtIG5hbWU6ICVzCgAuLgByZXQALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS9wcm9nbmFtZS5jAHJlbW92ZV9kb3RzAGxzdGF0KCVzKSBmYWlsZWQ6IABbJXNdJXMlcyAtPiBbJXNdJXMlcwoAJXMlc1slc10lcyVzACVzIC0+ICVzJXNbJXNdJXMlcwoALy4uACVzID09ICVzJXMlcyVzJXMKACVzID09ICVzJXMlcwoAS1BBVEhTRUFfREVCVUcAU0VMRkFVVE9MT0MAU0VMRkFVVE9ESVIAU0VMRkFVVE9QQVJFTlQAU0VMRkFVVE9HUkFORFBBUkVOVABleGUAb2xkAGEAc25wcmludGYgKGJ1ZiwgMiwgImEiKSA9PSAxICYmIGJ1ZlsxXSA9PSAnXDAnAGtwYXRoc2VhX3NldF9wcm9ncmFtX25hbWUAKHVuc2lnbmVkKXNucHJpbnRmIChidWYsIDIsICJhYiIpID49IDIgJiYgYnVmWzFdID09ICdcMCcAYWJjACh1bnNpZ25lZClzbnByaW50ZiAoYnVmLCAyLCAiYWJjIikgPj0gMiAmJiBidWZbMV0gPT0gJ1wwJwBwcm9nbmFtZQByZWFkYWJsZQBURVhfSFVTSABhbGwAbm9uZQBrcGF0aHNlYTptYWtlX3RleDogSW52YWxpZCBmaWxlbmFtZSBgJXMnLCBzdGFydHMgd2l0aCAnJWMnCgBrcGF0aHNlYTptYWtlX3RleDogSW52YWxpZCBmaWxlbmFtZSBgJXMnLCBjb250YWlucyAnJWMnCgAKa3BhdGhzZWE6IFJ1bm5pbmcAL2Rldi9udWxsAGtwYXRoc2VhOiBvcGVuKCIvZGV2L251bGwiLCBPX1JET05MWSkAa3BhdGhzZWE6IHBpcGUoKQBrcGF0aHNlYTogb3BlbigiL2Rldi9udWxsIiwgT19XUk9OTFkpAGtwYXRoc2VhOiBmb3JrKCkAa3BhdGhzZWE6IHJlYWQoKQBrcGF0aHNlYTogJXMgb3V0cHV0IGAlcycgaW5zdGVhZCBvZiBhIGZpbGVuYW1lAE1JU1NGT05UX0xPRwBtaXNzZm9udC5sb2cAYWIAVEVYTUZPVVRQVVQAa3BhdGhzZWE6IEFwcGVuZGluZyBmb250IGNyZWF0aW9uIGNvbW1hbmRzIHRvICVzLgoAS1BBVEhTRUFfRFBJAE1BS0VURVhfQkFTRV9EUEkAZHBpICE9IDAgJiYgYmRwaSAhPSAwAC4uLy4uLy4uL3RleGxpdmUtMjAxODA0MTQtc291cmNlL3RleGsva3BhdGhzZWEvdGV4LW1ha2UuYwBzZXRfbWFrZXRleF9tYWcAJXUrJXUvJXUAJXUrJXUvKCV1KiV1KyV1KQAldSsldS8oJXUqJXUpACV1KyV1Lyg0MDAwKyV1KQAtAG1hZ3N0ZXBcKCVzJWQuJWRcKQBNQUtFVEVYX01BRwBuYW1lAC4uLy4uLy4uL3RleGxpdmUtMjAxODA0MTQtc291cmNlL3RleGsva3BhdGhzZWEvdGlsZGUuYwBrcGF0aHNlYV90aWxkZV9leHBhbmQAISEASE9NRQBrcHNlLT5wcm9ncmFtX25hbWUALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS92YXJpYWJsZS5jAGtwYXRoc2VhX3Zhcl92YWx1ZQBfAChuaWwpAHZhcmlhYmxlOiAlcyA9ICVzCgB3YXJuaW5nOiAAa3BhdGhzZWE6ICVzOiBObyBtYXRjaGluZyB9IGZvciAkewBrcGF0aHNlYTogJXM6IFVucmVjb2duaXplZCB2YXJpYWJsZSBjb25zdHJ1Y3QgYCQlYycAa3BhdGhzZWE6IHZhcmlhYmxlIGAlcycgcmVmZXJlbmNlcyBpdHNlbGYgKGV2ZW50dWFsbHkpAGtwYXRoc2VhIHZlcnNpb24gNi4zLjAAZmlsZW5hbWUgJiYgbW9kZQAuLi8uLi8uLi90ZXhsaXZlLTIwMTgwNDE0LXNvdXJjZS90ZXhrL2twYXRoc2VhL3hmb3Blbi5jAHhmb3BlbgBmAHhmY2xvc2UAJXM6IABnZXRjd2QAZmF0YWw6IG1lbW9yeSBleGhhdXN0ZWQgKHhtYWxsb2Mgb2YgJWx1IGJ5dGVzKS4KAGNsb3NlZGlyIGZhaWxlZAA9ACVzOiBmYXRhbDogAHB1dGVudiglcykALgoAZmF0YWw6IG1lbW9yeSBleGhhdXN0ZWQgKHJlYWxsb2Mgb2YgJWx1IGJ5dGVzKS4KAGtkZWJ1ZzoAa3BzZV9ub3JtYWxpemVfcGF0aCAoJXMpID0+ICV1CgBwYXRoIGVsZW1lbnQgJXMgPT4AICVzAC8AZWx0X2xlbmd0aCA+IDAgJiYgKElTX0RJUl9TRVBfQ0ggKGVsdFtlbHRfbGVuZ3RoIC0gMV0pIHx8IElTX0RFVklDRV9TRVAgKGVsdFtlbHRfbGVuZ3RoIC0gMV0pKQAuLi8uLi8uLi90ZXhsaXZlLTIwMTgwNDE0LXNvdXJjZS90ZXhrL2twYXRoc2VhL2VsdC1kaXJzLmMAZG9fc3ViZGlyAEZOX1NUUklORyAoKmYpICE9IE5VTEwALi4vLi4vLi4vdGV4bGl2ZS0yMDE4MDQxNC1zb3VyY2UvdGV4ay9rcGF0aHNlYS9mbi5jAGZuX2ZyZWUARk5fTEVOR1RIICgqZikgPiBsb2MAZm5fc2hyaW5rX3RvAC0rICAgMFgweAAobnVsbCkALTBYKzBYIDBYLTB4KzB4IDB4AGluZgBJTkYAbmFuAE5BTgAuAHJ3YQA6IG9wdGlvbiBkb2VzIG5vdCB0YWtlIGFuIGFyZ3VtZW50OiAAOiBvcHRpb24gcmVxdWlyZXMgYW4gYXJndW1lbnQ6IAA6IHVucmVjb2duaXplZCBvcHRpb246IAA6IG9wdGlvbiBpcyBhbWJpZ3VvdXM6IA==";

var tempDoublePtr = 35328;

function ___assert_fail(condition, filename, line, func) {
 abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

var ENV = {};

function ___buildEnvironment(environ) {
 var MAX_ENV_VALUES = 64;
 var TOTAL_ENV_SIZE = 1024;
 var poolPtr;
 var envPtr;
 if (!___buildEnvironment.called) {
  ___buildEnvironment.called = true;
  ENV["USER"] = ENV["LOGNAME"] = "web_user";
  ENV["PATH"] = "/";
  ENV["PWD"] = "/";
  ENV["HOME"] = "/home/web_user";
  ENV["LANG"] = "C.UTF-8";
  ENV["_"] = Module["thisProgram"];
  poolPtr = getMemory(TOTAL_ENV_SIZE);
  envPtr = getMemory(MAX_ENV_VALUES * 4);
  HEAP32[envPtr >> 2] = poolPtr;
  HEAP32[environ >> 2] = envPtr;
 } else {
  envPtr = HEAP32[environ >> 2];
  poolPtr = HEAP32[envPtr >> 2];
 }
 var strings = [];
 var totalSize = 0;
 for (var key in ENV) {
  if (typeof ENV[key] === "string") {
   var line = key + "=" + ENV[key];
   strings.push(line);
   totalSize += line.length;
  }
 }
 if (totalSize > TOTAL_ENV_SIZE) {
  throw new Error("Environment size exceeded TOTAL_ENV_SIZE!");
 }
 var ptrSize = 4;
 for (var i = 0; i < strings.length; i++) {
  var line = strings[i];
  writeAsciiToMemory(line, poolPtr);
  HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
  poolPtr += line.length + 1;
 }
 HEAP32[envPtr + strings.length * ptrSize >> 2] = 0;
}

function ___lock() {}

function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
}

var PATH = {
 splitPath: function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 },
 normalizeArray: function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (;up; up--) {
    parts.unshift("..");
   }
  }
  return parts;
 },
 normalize: function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(function(p) {
   return !!p;
  }), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 },
 dirname: function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 },
 basename: function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 },
 extname: function(path) {
  return PATH.splitPath(path)[3];
 },
 join: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 },
 join2: function(l, r) {
  return PATH.normalize(l + "/" + r);
 },
 resolve: function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = i >= 0 ? arguments[i] : FS.cwd();
   if (typeof path !== "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    return "";
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
   return !!p;
  }), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
 },
 relative: function(from, to) {
  from = PATH.resolve(from).substr(1);
  to = PATH.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (;start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (;end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 }
};

var TTY = {
 ttys: [],
 init: function() {},
 shutdown: function() {},
 register: function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 },
 stream_ops: {
  open: function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   stream.tty = tty;
   stream.seekable = false;
  },
  close: function(stream) {
   stream.tty.ops.flush(stream.tty);
  },
  flush: function(stream) {
   stream.tty.ops.flush(stream.tty);
  },
  read: function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  },
  write: function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   try {
    for (var i = 0; i < length; i++) {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    }
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES.EIO);
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  }
 },
 default_tty_ops: {
  get_char: function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     var BUFSIZE = 256;
     var buf = new Buffer(BUFSIZE);
     var bytesRead = 0;
     var isPosixPlatform = process.platform != "win32";
     var fd = process.stdin.fd;
     if (isPosixPlatform) {
      var usingDevice = false;
      try {
       fd = fs.openSync("/dev/stdin", "r");
       usingDevice = true;
      } catch (e) {}
     }
     try {
      bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
     } catch (e) {
      if (e.toString().indexOf("EOF") != -1) bytesRead = 0; else throw e;
     }
     if (usingDevice) {
      fs.closeSync(fd);
     }
     if (bytesRead > 0) {
      result = buf.slice(0, bytesRead).toString("utf-8");
     } else {
      result = null;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  },
  put_char: function(tty, val) {
   if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  flush: function(tty) {
   if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 },
 default_tty1_ops: {
  put_char: function(tty, val) {
   if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  flush: function(tty) {
   if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 }
};

var MEMFS = {
 ops_table: null,
 mount: function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 },
 createNode: function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap,
      msync: MEMFS.stream_ops.msync
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 },
 getFileDataAsRegularArray: function(node) {
  if (node.contents && node.contents.subarray) {
   var arr = [];
   for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
   return arr;
  }
  return node.contents;
 },
 getFileDataAsTypedArray: function(node) {
  if (!node.contents) return new Uint8Array();
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 },
 expandFileStorage: function(node, newCapacity) {
  var prevCapacity = node.contents ? node.contents.length : 0;
  if (prevCapacity >= newCapacity) return;
  var CAPACITY_DOUBLING_MAX = 1024 * 1024;
  newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
  if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
  var oldContents = node.contents;
  node.contents = new Uint8Array(newCapacity);
  if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
  return;
 },
 resizeFileStorage: function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
   return;
  }
  if (!node.contents || node.contents.subarray) {
   var oldContents = node.contents;
   node.contents = new Uint8Array(new ArrayBuffer(newSize));
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
   return;
  }
  if (!node.contents) node.contents = [];
  if (node.contents.length > newSize) node.contents.length = newSize; else while (node.contents.length < newSize) node.contents.push(0);
  node.usedBytes = newSize;
 },
 node_ops: {
  getattr: function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  },
  setattr: function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  },
  lookup: function(parent, name) {
   throw FS.genericErrors[ERRNO_CODES.ENOENT];
  },
  mknod: function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  },
  rename: function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   old_node.parent = new_dir;
  },
  unlink: function(parent, name) {
   delete parent.contents[name];
  },
  rmdir: function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
   }
   delete parent.contents[name];
  },
  readdir: function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  },
  symlink: function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  },
  readlink: function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return node.link;
  }
 },
 stream_ops: {
  read: function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   assert(size >= 0);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  },
  write: function(stream, buffer, offset, length, position, canOwn) {
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  },
  llseek: function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  },
  allocate: function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  },
  mmap: function(stream, buffer, offset, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < stream.node.usedBytes) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = _malloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
    }
    buffer.set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  },
  msync: function(stream, buffer, offset, length, mmapFlags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   if (mmapFlags & 2) {
    return 0;
   }
   var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  }
 }
};

var IDBFS = {
 dbs: {},
 indexedDB: function() {
  if (typeof indexedDB !== "undefined") return indexedDB;
  var ret = null;
  if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  assert(ret, "IDBFS used, but indexedDB not supported");
  return ret;
 },
 DB_VERSION: 21,
 DB_STORE_NAME: "FILE_DATA",
 mount: function(mount) {
  return MEMFS.mount.apply(null, arguments);
 },
 syncfs: function(mount, populate, callback) {
  IDBFS.getLocalSet(mount, function(err, local) {
   if (err) return callback(err);
   IDBFS.getRemoteSet(mount, function(err, remote) {
    if (err) return callback(err);
    var src = populate ? remote : local;
    var dst = populate ? local : remote;
    IDBFS.reconcile(src, dst, callback);
   });
  });
 },
 getDB: function(name, callback) {
  var db = IDBFS.dbs[name];
  if (db) {
   return callback(null, db);
  }
  var req;
  try {
   req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
   return callback(e);
  }
  if (!req) {
   return callback("Unable to connect to IndexedDB");
  }
  req.onupgradeneeded = function(e) {
   var db = e.target.result;
   var transaction = e.target.transaction;
   var fileStore;
   if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
   } else {
    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
   }
   if (!fileStore.indexNames.contains("timestamp")) {
    fileStore.createIndex("timestamp", "timestamp", {
     unique: false
    });
   }
  };
  req.onsuccess = function() {
   db = req.result;
   IDBFS.dbs[name] = db;
   callback(null, db);
  };
  req.onerror = function(e) {
   callback(this.error);
   e.preventDefault();
  };
 },
 getLocalSet: function(mount, callback) {
  var entries = {};
  function isRealDir(p) {
   return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
   return function(p) {
    return PATH.join2(root, p);
   };
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
   var path = check.pop();
   var stat;
   try {
    stat = FS.stat(path);
   } catch (e) {
    return callback(e);
   }
   if (FS.isDir(stat.mode)) {
    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
   }
   entries[path] = {
    timestamp: stat.mtime
   };
  }
  return callback(null, {
   type: "local",
   entries: entries
  });
 },
 getRemoteSet: function(mount, callback) {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, function(err, db) {
   if (err) return callback(err);
   try {
    var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readonly");
    transaction.onerror = function(e) {
     callback(this.error);
     e.preventDefault();
    };
    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
    var index = store.index("timestamp");
    index.openKeyCursor().onsuccess = function(event) {
     var cursor = event.target.result;
     if (!cursor) {
      return callback(null, {
       type: "remote",
       db: db,
       entries: entries
      });
     }
     entries[cursor.primaryKey] = {
      timestamp: cursor.key
     };
     cursor.continue();
    };
   } catch (e) {
    return callback(e);
   }
  });
 },
 loadLocalEntry: function(path, callback) {
  var stat, node;
  try {
   var lookup = FS.lookupPath(path);
   node = lookup.node;
   stat = FS.stat(path);
  } catch (e) {
   return callback(e);
  }
  if (FS.isDir(stat.mode)) {
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode
   });
  } else if (FS.isFile(stat.mode)) {
   node.contents = MEMFS.getFileDataAsTypedArray(node);
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode,
    contents: node.contents
   });
  } else {
   return callback(new Error("node type not supported"));
  }
 },
 storeLocalEntry: function(path, entry, callback) {
  try {
   if (FS.isDir(entry.mode)) {
    FS.mkdir(path, entry.mode);
   } else if (FS.isFile(entry.mode)) {
    FS.writeFile(path, entry.contents, {
     canOwn: true
    });
   } else {
    return callback(new Error("node type not supported"));
   }
   FS.chmod(path, entry.mode);
   FS.utime(path, entry.timestamp, entry.timestamp);
  } catch (e) {
   return callback(e);
  }
  callback(null);
 },
 removeLocalEntry: function(path, callback) {
  try {
   var lookup = FS.lookupPath(path);
   var stat = FS.stat(path);
   if (FS.isDir(stat.mode)) {
    FS.rmdir(path);
   } else if (FS.isFile(stat.mode)) {
    FS.unlink(path);
   }
  } catch (e) {
   return callback(e);
  }
  callback(null);
 },
 loadRemoteEntry: function(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = function(event) {
   callback(null, event.target.result);
  };
  req.onerror = function(e) {
   callback(this.error);
   e.preventDefault();
  };
 },
 storeRemoteEntry: function(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = function() {
   callback(null);
  };
  req.onerror = function(e) {
   callback(this.error);
   e.preventDefault();
  };
 },
 removeRemoteEntry: function(store, path, callback) {
  var req = store.delete(path);
  req.onsuccess = function() {
   callback(null);
  };
  req.onerror = function(e) {
   callback(this.error);
   e.preventDefault();
  };
 },
 reconcile: function(src, dst, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach(function(key) {
   var e = src.entries[key];
   var e2 = dst.entries[key];
   if (!e2 || e.timestamp > e2.timestamp) {
    create.push(key);
    total++;
   }
  });
  var remove = [];
  Object.keys(dst.entries).forEach(function(key) {
   var e = dst.entries[key];
   var e2 = src.entries[key];
   if (!e2) {
    remove.push(key);
    total++;
   }
  });
  if (!total) {
   return callback(null);
  }
  var errored = false;
  var completed = 0;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= total) {
    return callback(null);
   }
  }
  transaction.onerror = function(e) {
   done(this.error);
   e.preventDefault();
  };
  create.sort().forEach(function(path) {
   if (dst.type === "local") {
    IDBFS.loadRemoteEntry(store, path, function(err, entry) {
     if (err) return done(err);
     IDBFS.storeLocalEntry(path, entry, done);
    });
   } else {
    IDBFS.loadLocalEntry(path, function(err, entry) {
     if (err) return done(err);
     IDBFS.storeRemoteEntry(store, path, entry, done);
    });
   }
  });
  remove.sort().reverse().forEach(function(path) {
   if (dst.type === "local") {
    IDBFS.removeLocalEntry(path, done);
   } else {
    IDBFS.removeRemoteEntry(store, path, done);
   }
  });
 }
};

var NODEFS = {
 isWindows: false,
 staticInit: function() {
  NODEFS.isWindows = !!process.platform.match(/^win/);
  var flags = process["binding"]("constants");
  if (flags["fs"]) {
   flags = flags["fs"];
  }
  NODEFS.flagsForNodeMap = {
   1024: flags["O_APPEND"],
   64: flags["O_CREAT"],
   128: flags["O_EXCL"],
   0: flags["O_RDONLY"],
   2: flags["O_RDWR"],
   4096: flags["O_SYNC"],
   512: flags["O_TRUNC"],
   1: flags["O_WRONLY"]
  };
 },
 bufferFrom: function(arrayBuffer) {
  return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
 },
 mount: function(mount) {
  assert(ENVIRONMENT_IS_NODE);
  return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
 },
 createNode: function(parent, name, mode, dev) {
  if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = FS.createNode(parent, name, mode);
  node.node_ops = NODEFS.node_ops;
  node.stream_ops = NODEFS.stream_ops;
  return node;
 },
 getMode: function(path) {
  var stat;
  try {
   stat = fs.lstatSync(path);
   if (NODEFS.isWindows) {
    stat.mode = stat.mode | (stat.mode & 292) >> 2;
   }
  } catch (e) {
   if (!e.code) throw e;
   throw new FS.ErrnoError(ERRNO_CODES[e.code]);
  }
  return stat.mode;
 },
 realPath: function(node) {
  var parts = [];
  while (node.parent !== node) {
   parts.push(node.name);
   node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  return PATH.join.apply(null, parts);
 },
 flagsForNode: function(flags) {
  flags &= ~2097152;
  flags &= ~2048;
  flags &= ~32768;
  flags &= ~524288;
  var newFlags = 0;
  for (var k in NODEFS.flagsForNodeMap) {
   if (flags & k) {
    newFlags |= NODEFS.flagsForNodeMap[k];
    flags ^= k;
   }
  }
  if (!flags) {
   return newFlags;
  } else {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
 },
 node_ops: {
  getattr: function(node) {
   var path = NODEFS.realPath(node);
   var stat;
   try {
    stat = fs.lstatSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (NODEFS.isWindows && !stat.blksize) {
    stat.blksize = 4096;
   }
   if (NODEFS.isWindows && !stat.blocks) {
    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
   }
   return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    rdev: stat.rdev,
    size: stat.size,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    blksize: stat.blksize,
    blocks: stat.blocks
   };
  },
  setattr: function(node, attr) {
   var path = NODEFS.realPath(node);
   try {
    if (attr.mode !== undefined) {
     fs.chmodSync(path, attr.mode);
     node.mode = attr.mode;
    }
    if (attr.timestamp !== undefined) {
     var date = new Date(attr.timestamp);
     fs.utimesSync(path, date, date);
    }
    if (attr.size !== undefined) {
     fs.truncateSync(path, attr.size);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  lookup: function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   var mode = NODEFS.getMode(path);
   return NODEFS.createNode(parent, name, mode);
  },
  mknod: function(parent, name, mode, dev) {
   var node = NODEFS.createNode(parent, name, mode, dev);
   var path = NODEFS.realPath(node);
   try {
    if (FS.isDir(node.mode)) {
     fs.mkdirSync(path, node.mode);
    } else {
     fs.writeFileSync(path, "", {
      mode: node.mode
     });
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return node;
  },
  rename: function(oldNode, newDir, newName) {
   var oldPath = NODEFS.realPath(oldNode);
   var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
   try {
    fs.renameSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  unlink: function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.unlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  rmdir: function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.rmdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  readdir: function(node) {
   var path = NODEFS.realPath(node);
   try {
    return fs.readdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  symlink: function(parent, newName, oldPath) {
   var newPath = PATH.join2(NODEFS.realPath(parent), newName);
   try {
    fs.symlinkSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  readlink: function(node) {
   var path = NODEFS.realPath(node);
   try {
    path = fs.readlinkSync(path);
    path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
    return path;
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }
 },
 stream_ops: {
  open: function(stream) {
   var path = NODEFS.realPath(stream.node);
   try {
    if (FS.isFile(stream.node.mode)) {
     stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  close: function(stream) {
   try {
    if (FS.isFile(stream.node.mode) && stream.nfd) {
     fs.closeSync(stream.nfd);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  read: function(stream, buffer, offset, length, position) {
   if (length === 0) return 0;
   try {
    return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  write: function(stream, buffer, offset, length, position) {
   try {
    return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  },
  llseek: function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     try {
      var stat = fs.fstatSync(stream.nfd);
      position += stat.size;
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES[e.code]);
     }
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  }
 }
};

var WORKERFS = {
 DIR_MODE: 16895,
 FILE_MODE: 33279,
 reader: null,
 mount: function(mount) {
  assert(ENVIRONMENT_IS_WORKER);
  if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
  var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
  var createdParents = {};
  function ensureParent(path) {
   var parts = path.split("/");
   var parent = root;
   for (var i = 0; i < parts.length - 1; i++) {
    var curr = parts.slice(0, i + 1).join("/");
    if (!createdParents[curr]) {
     createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
    }
    parent = createdParents[curr];
   }
   return parent;
  }
  function base(path) {
   var parts = path.split("/");
   return parts[parts.length - 1];
  }
  Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
   WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
  });
  (mount.opts["blobs"] || []).forEach(function(obj) {
   WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
  });
  (mount.opts["packages"] || []).forEach(function(pack) {
   pack["metadata"].files.forEach(function(file) {
    var name = file.filename.substr(1);
    WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end));
   });
  });
  return root;
 },
 createNode: function(parent, name, mode, dev, contents, mtime) {
  var node = FS.createNode(parent, name, mode);
  node.mode = mode;
  node.node_ops = WORKERFS.node_ops;
  node.stream_ops = WORKERFS.stream_ops;
  node.timestamp = (mtime || new Date()).getTime();
  assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
  if (mode === WORKERFS.FILE_MODE) {
   node.size = contents.size;
   node.contents = contents;
  } else {
   node.size = 4096;
   node.contents = {};
  }
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 },
 node_ops: {
  getattr: function(node) {
   return {
    dev: 1,
    ino: undefined,
    mode: node.mode,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: undefined,
    size: node.size,
    atime: new Date(node.timestamp),
    mtime: new Date(node.timestamp),
    ctime: new Date(node.timestamp),
    blksize: 4096,
    blocks: Math.ceil(node.size / 4096)
   };
  },
  setattr: function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
  },
  lookup: function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  },
  mknod: function(parent, name, mode, dev) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  },
  rename: function(oldNode, newDir, newName) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  },
  unlink: function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  },
  rmdir: function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  },
  readdir: function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  },
  symlink: function(parent, newName, oldPath) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  },
  readlink: function(node) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
 },
 stream_ops: {
  read: function(stream, buffer, offset, length, position) {
   if (position >= stream.node.size) return 0;
   var chunk = stream.node.contents.slice(position, position + length);
   var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
   buffer.set(new Uint8Array(ab), offset);
   return chunk.size;
  },
  write: function(stream, buffer, offset, length, position) {
   throw new FS.ErrnoError(ERRNO_CODES.EIO);
  },
  llseek: function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.size;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  }
 }
};

var FS = {
 root: null,
 mounts: [],
 devices: {},
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 trackingDelegate: {},
 tracking: {
  openFlags: {
   READ: 1,
   WRITE: 2
  }
 },
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 syncFSRequests: 0,
 handleFSError: function(e) {
  if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
  return ___setErrNo(e.errno);
 },
 lookupPath: function(path, opts) {
  path = PATH.resolve(FS.cwd(), path);
  opts = opts || {};
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  for (var key in defaults) {
   if (opts[key] === undefined) {
    opts[key] = defaults[key];
   }
  }
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(40);
  }
  var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
   return !!p;
  }), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(40);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 },
 getPath: function(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
   node = node.parent;
  }
 },
 hashName: function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 },
 hashAddNode: function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 },
 hashRemoveNode: function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 },
 lookupNode: function(parent, name) {
  var err = FS.mayLookup(parent);
  if (err) {
   throw new FS.ErrnoError(err, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 },
 createNode: function(parent, name, mode, rdev) {
  if (!FS.FSNode) {
   FS.FSNode = function(parent, name, mode, rdev) {
    if (!parent) {
     parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
   };
   FS.FSNode.prototype = {};
   var readMode = 292 | 73;
   var writeMode = 146;
   Object.defineProperties(FS.FSNode.prototype, {
    read: {
     get: function() {
      return (this.mode & readMode) === readMode;
     },
     set: function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
     }
    },
    write: {
     get: function() {
      return (this.mode & writeMode) === writeMode;
     },
     set: function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
     }
    },
    isFolder: {
     get: function() {
      return FS.isDir(this.mode);
     }
    },
    isDevice: {
     get: function() {
      return FS.isChrdev(this.mode);
     }
    }
   });
  }
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 },
 destroyNode: function(node) {
  FS.hashRemoveNode(node);
 },
 isRoot: function(node) {
  return node === node.parent;
 },
 isMountpoint: function(node) {
  return !!node.mounted;
 },
 isFile: function(mode) {
  return (mode & 61440) === 32768;
 },
 isDir: function(mode) {
  return (mode & 61440) === 16384;
 },
 isLink: function(mode) {
  return (mode & 61440) === 40960;
 },
 isChrdev: function(mode) {
  return (mode & 61440) === 8192;
 },
 isBlkdev: function(mode) {
  return (mode & 61440) === 24576;
 },
 isFIFO: function(mode) {
  return (mode & 61440) === 4096;
 },
 isSocket: function(mode) {
  return (mode & 49152) === 49152;
 },
 flagModes: {
  "r": 0,
  "rs": 1052672,
  "r+": 2,
  "w": 577,
  "wx": 705,
  "xw": 705,
  "w+": 578,
  "wx+": 706,
  "xw+": 706,
  "a": 1089,
  "ax": 1217,
  "xa": 1217,
  "a+": 1090,
  "ax+": 1218,
  "xa+": 1218
 },
 modeStringToFlags: function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
 },
 flagsToPermissionString: function(flag) {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 },
 nodePermissions: function(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
   return 13;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
   return 13;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
   return 13;
  }
  return 0;
 },
 mayLookup: function(dir) {
  var err = FS.nodePermissions(dir, "x");
  if (err) return err;
  if (!dir.node_ops.lookup) return 13;
  return 0;
 },
 mayCreate: function(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return 17;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 },
 mayDelete: function(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var err = FS.nodePermissions(dir, "wx");
  if (err) {
   return err;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return 20;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return 16;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return 21;
   }
  }
  return 0;
 },
 mayOpen: function(node, flags) {
  if (!node) {
   return 2;
  }
  if (FS.isLink(node.mode)) {
   return 40;
  } else if (FS.isDir(node.mode)) {
   if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
    return 21;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 },
 MAX_OPEN_FDS: 4096,
 nextfd: function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(24);
 },
 getStream: function(fd) {
  return FS.streams[fd];
 },
 createStream: function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
   FS.FSStream = function() {};
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     get: function() {
      return this.node;
     },
     set: function(val) {
      this.node = val;
     }
    },
    isRead: {
     get: function() {
      return (this.flags & 2097155) !== 1;
     }
    },
    isWrite: {
     get: function() {
      return (this.flags & 2097155) !== 0;
     }
    },
    isAppend: {
     get: function() {
      return this.flags & 1024;
     }
    }
   });
  }
  var newStream = new FS.FSStream();
  for (var p in stream) {
   newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 },
 closeStream: function(fd) {
  FS.streams[fd] = null;
 },
 chrdev_stream_ops: {
  open: function(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  },
  llseek: function() {
   throw new FS.ErrnoError(29);
  }
 },
 major: function(dev) {
  return dev >> 8;
 },
 minor: function(dev) {
  return dev & 255;
 },
 makedev: function(ma, mi) {
  return ma << 8 | mi;
 },
 registerDevice: function(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 },
 getDevice: function(dev) {
  return FS.devices[dev];
 },
 getMounts: function(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 },
 syncfs: function(populate, callback) {
  if (typeof populate === "function") {
   callback = populate;
   populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
   console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(err) {
   assert(FS.syncFSRequests > 0);
   FS.syncFSRequests--;
   return callback(err);
  }
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return doCallback(err);
    }
    return;
   }
   if (++completed >= mounts.length) {
    doCallback(null);
   }
  }
  mounts.forEach(function(mount) {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  });
 },
 mount: function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(16);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(16);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(20);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 },
 unmount: function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(22);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach(function(hash) {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.indexOf(current.mount) !== -1) {
     FS.destroyNode(current);
    }
    current = next;
   }
  });
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  assert(idx !== -1);
  node.mount.mounts.splice(idx, 1);
 },
 lookup: function(parent, name) {
  return parent.node_ops.lookup(parent, name);
 },
 mknod: function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(22);
  }
  var err = FS.mayCreate(parent, name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(1);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 },
 create: function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 },
 mkdir: function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 },
 mkdirTree: function(path, mode) {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
   if (!dirs[i]) continue;
   d += "/" + dirs[i];
   try {
    FS.mkdir(d, mode);
   } catch (e) {
    if (e.errno != 17) throw e;
   }
  }
 },
 mkdev: function(path, mode, dev) {
  if (typeof dev === "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 },
 symlink: function(oldpath, newpath) {
  if (!PATH.resolve(oldpath)) {
   throw new FS.ErrnoError(2);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(2);
  }
  var newname = PATH.basename(newpath);
  var err = FS.mayCreate(parent, newname);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(1);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 },
 rename: function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  try {
   lookup = FS.lookupPath(old_path, {
    parent: true
   });
   old_dir = lookup.node;
   lookup = FS.lookupPath(new_path, {
    parent: true
   });
   new_dir = lookup.node;
  } catch (e) {
   throw new FS.ErrnoError(16);
  }
  if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(18);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(22);
  }
  relative = PATH.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(39);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var err = FS.mayDelete(old_dir, old_name, isdir);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(16);
  }
  if (new_dir !== old_dir) {
   err = FS.nodePermissions(old_dir, "w");
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  try {
   if (FS.trackingDelegate["willMovePath"]) {
    FS.trackingDelegate["willMovePath"](old_path, new_path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
  try {
   if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
   console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
 },
 rmdir: function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, true);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(16);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 },
 readdir: function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(20);
  }
  return node.node_ops.readdir(node);
 },
 unlink: function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, false);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(16);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 },
 readlink: function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(2);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(22);
  }
  return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 },
 stat: function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(2);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(1);
  }
  return node.node_ops.getattr(node);
 },
 lstat: function(path) {
  return FS.stat(path, true);
 },
 chmod: function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(1);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 },
 lchmod: function(path, mode) {
  FS.chmod(path, mode, true);
 },
 fchmod: function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(9);
  }
  FS.chmod(stream.node, mode);
 },
 chown: function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(1);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 },
 lchown: function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 },
 fchown: function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(9);
  }
  FS.chown(stream.node, uid, gid);
 },
 truncate: function(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(22);
  }
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(1);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(21);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(22);
  }
  var err = FS.nodePermissions(node, "w");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 },
 ftruncate: function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(9);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(22);
  }
  FS.truncate(stream.node, len);
 },
 utime: function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 },
 open: function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
   throw new FS.ErrnoError(2);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path === "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(17);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(2);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(20);
  }
  if (!created) {
   var err = FS.mayOpen(node, flags);
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  if (flags & 512) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  }, fd_start, fd_end);
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
    console.log("FS.trackingDelegate error on read file: " + path);
   }
  }
  try {
   if (FS.trackingDelegate["onOpenFile"]) {
    var trackingFlags = 0;
    if ((flags & 2097155) !== 1) {
     trackingFlags |= FS.tracking.openFlags.READ;
    }
    if ((flags & 2097155) !== 0) {
     trackingFlags |= FS.tracking.openFlags.WRITE;
    }
    FS.trackingDelegate["onOpenFile"](path, trackingFlags);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
 },
 close: function(stream) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
  stream.fd = null;
 },
 isClosed: function(stream) {
  return stream.fd === null;
 },
 llseek: function(stream, offset, whence) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(29);
  }
  if (whence != 0 && whence != 1 && whence != 2) {
   throw new FS.ErrnoError(22);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 },
 read: function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(22);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(9);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(21);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(22);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(29);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 },
 write: function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(22);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(9);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(21);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(22);
  }
  if (stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(29);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  try {
   if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
   console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
 },
 allocate: function(stream, offset, length) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(9);
  }
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(22);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(9);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(19);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(95);
  }
  stream.stream_ops.allocate(stream, offset, length);
 },
 mmap: function(stream, buffer, offset, length, position, prot, flags) {
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(13);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(19);
  }
  return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
 },
 msync: function(stream, buffer, offset, length, mmapFlags) {
  if (!stream || !stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 },
 munmap: function(stream) {
  return 0;
 },
 ioctl: function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(25);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 },
 readFile: function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "r";
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 },
 writeFile: function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "w";
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data === "string") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
   FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
  } else {
   throw new Error("Unsupported data type");
  }
  FS.close(stream);
 },
 cwd: function() {
  return FS.currentPath;
 },
 chdir: function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (lookup.node === null) {
   throw new FS.ErrnoError(2);
  }
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(20);
  }
  var err = FS.nodePermissions(lookup.node, "x");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  FS.currentPath = lookup.path;
 },
 createDefaultDirectories: function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 },
 createDefaultDevices: function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: function() {
    return 0;
   },
   write: function(stream, buffer, offset, length, pos) {
    return length;
   }
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device;
  if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
   var randomBuffer = new Uint8Array(1);
   random_device = function() {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0];
   };
  } else if (ENVIRONMENT_IS_NODE) {
   try {
    var crypto_module = require("crypto");
    random_device = function() {
     return crypto_module["randomBytes"](1)[0];
    };
   } catch (e) {
    random_device = function() {
     return Math.random() * 256 | 0;
    };
   }
  } else {
   random_device = function() {
    abort("random_device");
   };
  }
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 },
 createSpecialDirectories: function() {
  FS.mkdir("/proc");
  FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount: function() {
    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
    node.node_ops = {
     lookup: function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(9);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: function() {
         return stream.path;
        }
       }
      };
      ret.parent = ret;
      return ret;
     }
    };
    return node;
   }
  }, {}, "/proc/self/fd");
 },
 createStandardStreams: function() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", "r");
  assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
  var stdout = FS.open("/dev/stdout", "w");
  assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
  var stderr = FS.open("/dev/stderr", "w");
  assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
 },
 ensureErrnoError: function() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno, node) {
   this.node = node;
   this.setErrno = function(errno) {
    this.errno = errno;
   };
   this.setErrno(errno);
   this.message = "FS error";
   if (this.stack) Object.defineProperty(this, "stack", {
    value: new Error().stack,
    writable: true
   });
  };
  FS.ErrnoError.prototype = new Error();
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ 2 ].forEach(function(code) {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  });
 },
 staticInit: function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS,
   "IDBFS": IDBFS,
   "NODEFS": NODEFS,
   "WORKERFS": WORKERFS
  };
 },
 init: function(input, output, error) {
  assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 },
 quit: function() {
  FS.init.initialized = false;
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 },
 getMode: function(canRead, canWrite) {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
 },
 joinPath: function(parts, forceRelative) {
  var path = PATH.join.apply(null, parts);
  if (forceRelative && path[0] == "/") path = path.substr(1);
  return path;
 },
 absolutePath: function(relative, base) {
  return PATH.resolve(base, relative);
 },
 standardizePath: function(path) {
  return PATH.normalize(path);
 },
 findObject: function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
   return ret.object;
  } else {
   ___setErrNo(ret.error);
   return null;
  }
 },
 analyzePath: function(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 },
 createFolder: function(parent, name, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.mkdir(path, mode);
 },
 createPath: function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 },
 createFile: function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 },
 createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data === "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, "w");
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 },
 createDevice: function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: function(stream) {
    stream.seekable = false;
   },
   close: function(stream) {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   },
   read: function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(5);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(11);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   },
   write: function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(5);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   }
  });
  return FS.mkdev(path, mode, dev);
 },
 createLink: function(parent, name, target, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  return FS.symlink(target, path);
 },
 forceLoadFile: function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  var success = true;
  if (typeof XMLHttpRequest !== "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (Module["read"]) {
   try {
    obj.contents = intArrayFromString(Module["read"](obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    success = false;
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
  if (!success) ___setErrNo(5);
  return success;
 },
 createLazyFile: function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = idx / this.chunkSize | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest();
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = function(from, to) {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    } else {
     return intArrayFromString(xhr.responseText || "", true);
    }
   };
   var lazyArray = this;
   lazyArray.setDataGetter(function(chunkNum) {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   });
   if (usesGzip || !datalength) {
    chunkSize = datalength = 1;
    datalength = this.getter(0).length;
    chunkSize = datalength;
    console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
   }
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array();
   Object.defineProperties(lazyArray, {
    length: {
     get: function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._length;
     }
    },
    chunkSize: {
     get: function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._chunkSize;
     }
    }
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperties(node, {
   usedBytes: {
    get: function() {
     return this.contents.length;
    }
   }
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach(function(key) {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    if (!FS.forceLoadFile(node)) {
     throw new FS.ErrnoError(5);
    }
    return fn.apply(null, arguments);
   };
  });
  stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
   if (!FS.forceLoadFile(node)) {
    throw new FS.ErrnoError(5);
   }
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   assert(size >= 0);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  };
  node.stream_ops = stream_ops;
  return node;
 },
 createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  Browser.init();
  var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
   function finish(byteArray) {
    if (preFinish) preFinish();
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency(dep);
   }
   var handled = false;
   Module["preloadPlugins"].forEach(function(plugin) {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
     plugin["handle"](byteArray, fullname, finish, function() {
      if (onerror) onerror();
      removeRunDependency(dep);
     });
     handled = true;
    }
   });
   if (!handled) finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
   Browser.asyncLoad(url, function(byteArray) {
    processData(byteArray);
   }, onerror);
  } else {
   processData(url);
  }
 },
 indexedDB: function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 },
 DB_NAME: function() {
  return "EM_FS_" + window.location.pathname;
 },
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: function(paths, onload, onerror) {
  onload = onload || function() {};
  onerror = onerror || function() {};
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
   console.log("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach(function(path) {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = function putRequest_onsuccess() {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = function putRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   });
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 },
 loadFilesFromDB: function(paths, onload, onerror) {
  onload = onload || function() {};
  onerror = onerror || function() {};
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach(function(path) {
    var getRequest = files.get(path);
    getRequest.onsuccess = function getRequest_onsuccess() {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = function getRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   });
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 }
};

var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};

var SYSCALLS = {
 DEFAULT_POLLMASK: 5,
 mappings: {},
 umask: 511,
 calculateAt: function(dirfd, path) {
  if (path[0] !== "/") {
   var dir;
   if (dirfd === -100) {
    dir = FS.cwd();
   } else {
    var dirstream = FS.getStream(dirfd);
    if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
    dir = dirstream.path;
   }
   path = PATH.join2(dir, path);
  }
  return path;
 },
 doStat: function(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -ERRNO_CODES.ENOTDIR;
   }
   throw e;
  }
  HEAP32[buf >> 2] = stat.dev;
  HEAP32[buf + 4 >> 2] = 0;
  HEAP32[buf + 8 >> 2] = stat.ino;
  HEAP32[buf + 12 >> 2] = stat.mode;
  HEAP32[buf + 16 >> 2] = stat.nlink;
  HEAP32[buf + 20 >> 2] = stat.uid;
  HEAP32[buf + 24 >> 2] = stat.gid;
  HEAP32[buf + 28 >> 2] = stat.rdev;
  HEAP32[buf + 32 >> 2] = 0;
  HEAP32[buf + 36 >> 2] = stat.size;
  HEAP32[buf + 40 >> 2] = 4096;
  HEAP32[buf + 44 >> 2] = stat.blocks;
  HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
  HEAP32[buf + 52 >> 2] = 0;
  HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
  HEAP32[buf + 60 >> 2] = 0;
  HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
  HEAP32[buf + 68 >> 2] = 0;
  HEAP32[buf + 72 >> 2] = stat.ino;
  return 0;
 },
 doMsync: function(addr, stream, len, flags) {
  var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
  FS.msync(stream, buffer, 0, len, flags);
 },
 doMkdir: function(path, mode) {
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
 },
 doMknod: function(path, mode, dev) {
  switch (mode & 61440) {
  case 32768:
  case 8192:
  case 24576:
  case 4096:
  case 49152:
   break;

  default:
   return -ERRNO_CODES.EINVAL;
  }
  FS.mknod(path, mode, dev);
  return 0;
 },
 doReadlink: function(path, buf, bufsize) {
  if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
  var ret = FS.readlink(path);
  var len = Math.min(bufsize, lengthBytesUTF8(ret));
  var endChar = HEAP8[buf + len];
  stringToUTF8(ret, buf, bufsize + 1);
  HEAP8[buf + len] = endChar;
  return len;
 },
 doAccess: function(path, amode) {
  if (amode & ~7) {
   return -ERRNO_CODES.EINVAL;
  }
  var node;
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  node = lookup.node;
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
   return -ERRNO_CODES.EACCES;
  }
  return 0;
 },
 doDup: function(path, flags, suggestFD) {
  var suggest = FS.getStream(suggestFD);
  if (suggest) FS.close(suggest);
  return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
 },
 doReadv: function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.read(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
   if (curr < len) break;
  }
  return ret;
 },
 doWritev: function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.write(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
  }
  return ret;
 },
 varargs: 0,
 get: function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 },
 getStr: function() {
  var ret = UTF8ToString(SYSCALLS.get());
  return ret;
 },
 getStreamFromFD: function() {
  var stream = FS.getStream(SYSCALLS.get());
  if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return stream;
 },
 getSocketFromFD: function() {
  var socket = SOCKFS.getSocket(SYSCALLS.get());
  if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return socket;
 },
 getSocketAddress: function(allowNull) {
  var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
  if (allowNull && addrp === 0) return null;
  var info = __read_sockaddr(addrp, addrlen);
  if (info.errno) throw new FS.ErrnoError(info.errno);
  info.addr = DNS.lookup_addr(info.addr) || info.addr;
  return info;
 },
 get64: function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  return low;
 },
 getZero: function() {
  SYSCALLS.get();
 }
};

function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall145(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  return SYSCALLS.doReadv(stream, iov, iovcnt);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  return SYSCALLS.doWritev(stream, iov, iovcnt);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall183(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var buf = SYSCALLS.get(), size = SYSCALLS.get();
  if (size === 0) return -ERRNO_CODES.EINVAL;
  var cwd = FS.cwd();
  var cwdLengthInBytes = lengthBytesUTF8(cwd);
  if (size < cwdLengthInBytes + 1) return -ERRNO_CODES.ERANGE;
  stringToUTF8(cwd, buf, size);
  return buf;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall195(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var path = SYSCALLS.getStr(), buf = SYSCALLS.get();
  return SYSCALLS.doStat(FS.stat, path, buf);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall196(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var path = SYSCALLS.getStr(), buf = SYSCALLS.get();
  return SYSCALLS.doStat(FS.lstat, path, buf);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

var PROCINFO = {
 ppid: 1,
 pid: 42,
 sid: 42,
 pgid: 42
};

function ___syscall20(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  return PROCINFO.pid;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall220(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), dirp = SYSCALLS.get(), count = SYSCALLS.get();
  if (!stream.getdents) {
   stream.getdents = FS.readdir(stream.path);
  }
  var pos = 0;
  while (stream.getdents.length > 0 && pos + 268 <= count) {
   var id;
   var type;
   var name = stream.getdents.pop();
   if (name[0] === ".") {
    id = 1;
    type = 4;
   } else {
    var child = FS.lookupNode(stream.node, name);
    id = child.id;
    type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8;
   }
   HEAP32[dirp + pos >> 2] = id;
   HEAP32[dirp + pos + 4 >> 2] = stream.position;
   HEAP16[dirp + pos + 8 >> 1] = 268;
   HEAP8[dirp + pos + 10 >> 0] = type;
   stringToUTF8(name, dirp + pos + 11, 256);
   pos += 268;
  }
  return pos;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall221(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
  switch (cmd) {
  case 0:
   {
    var arg = SYSCALLS.get();
    if (arg < 0) {
     return -ERRNO_CODES.EINVAL;
    }
    var newStream;
    newStream = FS.open(stream.path, stream.flags, 0, arg);
    return newStream.fd;
   }

  case 1:
  case 2:
   return 0;

  case 3:
   return stream.flags;

  case 4:
   {
    var arg = SYSCALLS.get();
    stream.flags |= arg;
    return 0;
   }

  case 12:
   {
    var arg = SYSCALLS.get();
    var offset = 0;
    HEAP16[arg + offset >> 1] = 2;
    return 0;
   }

  case 13:
  case 14:
   return 0;

  case 16:
  case 8:
   return -ERRNO_CODES.EINVAL;

  case 9:
   ___setErrNo(ERRNO_CODES.EINVAL);
   return -1;

  default:
   {
    return -ERRNO_CODES.EINVAL;
   }
  }
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall3(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
  return FS.read(stream, HEAP8, buf, count);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall33(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var path = SYSCALLS.getStr(), amode = SYSCALLS.get();
  return SYSCALLS.doAccess(path, amode);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall41(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var old = SYSCALLS.getStreamFromFD();
  return FS.open(old.path, old.flags, 0).fd;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

var PIPEFS = {
 BUCKET_BUFFER_SIZE: 8192,
 mount: function(mount) {
  return FS.createNode(null, "/", 16384 | 511, 0);
 },
 createPipe: function() {
  var pipe = {
   buckets: []
  };
  pipe.buckets.push({
   buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
   offset: 0,
   roffset: 0
  });
  var rName = PIPEFS.nextname();
  var wName = PIPEFS.nextname();
  var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
  var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
  rNode.pipe = pipe;
  wNode.pipe = pipe;
  var readableStream = FS.createStream({
   path: rName,
   node: rNode,
   flags: FS.modeStringToFlags("r"),
   seekable: false,
   stream_ops: PIPEFS.stream_ops
  });
  rNode.stream = readableStream;
  var writableStream = FS.createStream({
   path: wName,
   node: wNode,
   flags: FS.modeStringToFlags("w"),
   seekable: false,
   stream_ops: PIPEFS.stream_ops
  });
  wNode.stream = writableStream;
  return {
   readable_fd: readableStream.fd,
   writable_fd: writableStream.fd
  };
 },
 stream_ops: {
  poll: function(stream) {
   var pipe = stream.node.pipe;
   if ((stream.flags & 2097155) === 1) {
    return 256 | 4;
   } else {
    if (pipe.buckets.length > 0) {
     for (var i = 0; i < pipe.buckets.length; i++) {
      var bucket = pipe.buckets[i];
      if (bucket.offset - bucket.roffset > 0) {
       return 64 | 1;
      }
     }
    }
   }
   return 0;
  },
  ioctl: function(stream, request, varargs) {
   return ERRNO_CODES.EINVAL;
  },
  read: function(stream, buffer, offset, length, position) {
   var pipe = stream.node.pipe;
   var currentLength = 0;
   for (var i = 0; i < pipe.buckets.length; i++) {
    var bucket = pipe.buckets[i];
    currentLength += bucket.offset - bucket.roffset;
   }
   assert(buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer));
   var data = buffer.subarray(offset, offset + length);
   if (length <= 0) {
    return 0;
   }
   if (currentLength == 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
   }
   var toRead = Math.min(currentLength, length);
   var totalRead = toRead;
   var toRemove = 0;
   for (var i = 0; i < pipe.buckets.length; i++) {
    var currBucket = pipe.buckets[i];
    var bucketSize = currBucket.offset - currBucket.roffset;
    if (toRead <= bucketSize) {
     var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
     if (toRead < bucketSize) {
      tmpSlice = tmpSlice.subarray(0, toRead);
      currBucket.roffset += toRead;
     } else {
      toRemove++;
     }
     data.set(tmpSlice);
     break;
    } else {
     var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
     data.set(tmpSlice);
     data = data.subarray(tmpSlice.byteLength);
     toRead -= tmpSlice.byteLength;
     toRemove++;
    }
   }
   if (toRemove && toRemove == pipe.buckets.length) {
    toRemove--;
    pipe.buckets[toRemove].offset = 0;
    pipe.buckets[toRemove].roffset = 0;
   }
   pipe.buckets.splice(0, toRemove);
   return totalRead;
  },
  write: function(stream, buffer, offset, length, position) {
   var pipe = stream.node.pipe;
   assert(buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer));
   var data = buffer.subarray(offset, offset + length);
   var dataLen = data.byteLength;
   if (dataLen <= 0) {
    return 0;
   }
   var currBucket = null;
   if (pipe.buckets.length == 0) {
    currBucket = {
     buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
     offset: 0,
     roffset: 0
    };
    pipe.buckets.push(currBucket);
   } else {
    currBucket = pipe.buckets[pipe.buckets.length - 1];
   }
   assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
   var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
   if (freeBytesInCurrBuffer >= dataLen) {
    currBucket.buffer.set(data, currBucket.offset);
    currBucket.offset += dataLen;
    return dataLen;
   } else if (freeBytesInCurrBuffer > 0) {
    currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
    currBucket.offset += freeBytesInCurrBuffer;
    data = data.subarray(freeBytesInCurrBuffer, data.byteLength);
   }
   var numBuckets = data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE | 0;
   var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
   for (var i = 0; i < numBuckets; i++) {
    var newBucket = {
     buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
     offset: PIPEFS.BUCKET_BUFFER_SIZE,
     roffset: 0
    };
    pipe.buckets.push(newBucket);
    newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
    data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength);
   }
   if (remElements > 0) {
    var newBucket = {
     buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
     offset: data.byteLength,
     roffset: 0
    };
    pipe.buckets.push(newBucket);
    newBucket.buffer.set(data);
   }
   return dataLen;
  },
  close: function(stream) {
   var pipe = stream.node.pipe;
   pipe.buckets = null;
  }
 },
 nextname: function() {
  if (!PIPEFS.nextname.current) {
   PIPEFS.nextname.current = 0;
  }
  return "pipe[" + PIPEFS.nextname.current++ + "]";
 }
};

function ___syscall42(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var fdPtr = SYSCALLS.get();
  if (fdPtr == 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EFAULT);
  }
  var res = PIPEFS.createPipe();
  HEAP32[fdPtr >> 2] = res.readable_fd;
  HEAP32[fdPtr + 4 >> 2] = res.writable_fd;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall5(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get();
  var stream = FS.open(pathname, flags, mode);
  return stream.fd;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall54(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
  switch (op) {
  case 21509:
  case 21505:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }

  case 21510:
  case 21511:
  case 21512:
  case 21506:
  case 21507:
  case 21508:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }

  case 21519:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    var argp = SYSCALLS.get();
    HEAP32[argp >> 2] = 0;
    return 0;
   }

  case 21520:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return -ERRNO_CODES.EINVAL;
   }

  case 21531:
   {
    var argp = SYSCALLS.get();
    return FS.ioctl(stream, op, argp);
   }

  case 21523:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }

  case 21524:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }

  default:
   abort("bad ioctl syscall " + op);
  }
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall85(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var path = SYSCALLS.getStr(), buf = SYSCALLS.get(), bufsize = SYSCALLS.get();
  return SYSCALLS.doReadlink(path, buf, bufsize);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___unlock() {}

function ___wait() {}

function _exit(status) {
 exit(status);
}

function __exit(a0) {
 return _exit(a0);
}

function _emscripten_get_heap_size() {
 return TOTAL_MEMORY;
}

function abortOnCannotGrowMemory(requestedSize) {
 abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}

function _emscripten_resize_heap(requestedSize) {
 abortOnCannotGrowMemory(requestedSize);
}

function _execl() {
 ___setErrNo(8);
 return -1;
}

function _execvp() {
 return _execl.apply(null, arguments);
}

function _fork() {
 ___setErrNo(11);
 return -1;
}

function _getenv(name) {
 if (name === 0) return 0;
 name = UTF8ToString(name);
 if (!ENV.hasOwnProperty(name)) return 0;
 if (_getenv.ret) _free(_getenv.ret);
 _getenv.ret = allocateUTF8(ENV[name]);
 return _getenv.ret;
}

function _getpwnam() {
 throw "getpwnam: TODO";
}

function _longjmp(env, value) {
 _setThrew(env, value || 1);
 throw "longjmp";
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
}

function _putenv(string) {
 if (string === 0) {
  ___setErrNo(22);
  return -1;
 }
 string = UTF8ToString(string);
 var splitPoint = string.indexOf("=");
 if (string === "" || string.indexOf("=") === -1) {
  ___setErrNo(22);
  return -1;
 }
 var name = string.slice(0, splitPoint);
 var value = string.slice(splitPoint + 1);
 if (!(name in ENV) || ENV[name] !== value) {
  ENV[name] = value;
  ___buildEnvironment(__get_environ());
 }
 return 0;
}

function _time(ptr) {
 var ret = Date.now() / 1e3 | 0;
 if (ptr) {
  HEAP32[ptr >> 2] = ret;
 }
 return ret;
}

function _wait(stat_loc) {
 ___setErrNo(10);
 return -1;
}

FS.staticInit();

__ATINIT__.unshift(function() {
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
});

__ATMAIN__.push(function() {
 FS.ignorePermissions = false;
});

__ATEXIT__.push(function() {
 FS.quit();
});

Module["FS_createFolder"] = FS.createFolder;

Module["FS_createPath"] = FS.createPath;

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

Module["FS_createLazyFile"] = FS.createLazyFile;

Module["FS_createLink"] = FS.createLink;

Module["FS_createDevice"] = FS.createDevice;

Module["FS_unlink"] = FS.unlink;

__ATINIT__.unshift(function() {
 TTY.init();
});

__ATEXIT__.push(function() {
 TTY.shutdown();
});

if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var NODEJS_PATH = require("path");
 NODEFS.staticInit();
}

__ATINIT__.push(function() {
 PIPEFS.root = FS.mount(PIPEFS, {}, null);
});

var ASSERTIONS = false;

function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}

function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   if (ASSERTIONS) {
    assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
   }
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}

var decodeBase64 = typeof atob === "function" ? atob : function(input) {
 var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var output = "";
 var chr1, chr2, chr3;
 var enc1, enc2, enc3, enc4;
 var i = 0;
 input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 do {
  enc1 = keyStr.indexOf(input.charAt(i++));
  enc2 = keyStr.indexOf(input.charAt(i++));
  enc3 = keyStr.indexOf(input.charAt(i++));
  enc4 = keyStr.indexOf(input.charAt(i++));
  chr1 = enc1 << 2 | enc2 >> 4;
  chr2 = (enc2 & 15) << 4 | enc3 >> 2;
  chr3 = (enc3 & 3) << 6 | enc4;
  output = output + String.fromCharCode(chr1);
  if (enc3 !== 64) {
   output = output + String.fromCharCode(chr2);
  }
  if (enc4 !== 64) {
   output = output + String.fromCharCode(chr3);
  }
 } while (i < input.length);
 return output;
};

function intArrayFromBase64(s) {
 if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
  var buf;
  try {
   buf = Buffer.from(s, "base64");
  } catch (_) {
   buf = new Buffer(s, "base64");
  }
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
 }
 try {
  var decoded = decodeBase64(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0; i < decoded.length; ++i) {
   bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
 } catch (_) {
  throw new Error("Converting base64 string to bytes failed.");
 }
}

function tryParseAsDataURI(filename) {
 if (!isDataURI(filename)) {
  return;
 }
 return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}

function invoke_i(index) {
 var sp = stackSave();
 try {
  return dynCall_i(index);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_ii(index, a1) {
 var sp = stackSave();
 try {
  return dynCall_ii(index, a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iii(index, a1, a2) {
 var sp = stackSave();
 try {
  return dynCall_iii(index, a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return dynCall_iiii(index, a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_v(index) {
 var sp = stackSave();
 try {
  dynCall_v(index);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

function invoke_vi(index, a1) {
 var sp = stackSave();
 try {
  dynCall_vi(index, a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0 && e !== "longjmp") throw e;
  _setThrew(1, 0);
 }
}

var asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array
};

var asmLibraryArg = {
 "a": abort,
 "b": setTempRet0,
 "c": getTempRet0,
 "d": invoke_i,
 "e": invoke_ii,
 "f": invoke_iii,
 "g": invoke_iiii,
 "h": invoke_v,
 "i": invoke_vi,
 "j": ___assert_fail,
 "k": ___buildEnvironment,
 "l": ___lock,
 "m": ___setErrNo,
 "n": ___syscall140,
 "o": ___syscall145,
 "p": ___syscall146,
 "q": ___syscall183,
 "r": ___syscall195,
 "s": ___syscall196,
 "t": ___syscall20,
 "u": ___syscall220,
 "v": ___syscall221,
 "w": ___syscall3,
 "x": ___syscall33,
 "y": ___syscall41,
 "z": ___syscall42,
 "A": ___syscall5,
 "B": ___syscall54,
 "C": ___syscall6,
 "D": ___syscall85,
 "E": ___unlock,
 "F": ___wait,
 "G": __exit,
 "H": _emscripten_get_heap_size,
 "I": _emscripten_memcpy_big,
 "J": _emscripten_resize_heap,
 "K": _execl,
 "L": _execvp,
 "M": _exit,
 "N": _fork,
 "O": _getenv,
 "P": _getpwnam,
 "Q": _longjmp,
 "R": _putenv,
 "S": _time,
 "T": _wait,
 "U": abortOnCannotGrowMemory,
 "V": tempDoublePtr,
 "W": DYNAMICTOP_PTR
};

// EMSCRIPTEN_START_ASM


var asm = (/** @suppress {uselessCode} */ function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer),b=new global.Int16Array(buffer),c=new global.Int32Array(buffer),d=new global.Uint8Array(buffer),e=new global.Uint16Array(buffer),f=new global.Float32Array(buffer),g=new global.Float64Array(buffer),h=env.V|0,i=env.W|0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=global.Math.imul,s=global.Math.clz32,t=env.a,u=env.b,v=env.c,w=env.d,x=env.e,y=env.f,z=env.g,A=env.h,B=env.i,C=env.j,D=env.k,E=env.l,F=env.m,G=env.n,H=env.o,I=env.p,J=env.q,K=env.r,L=env.s,M=env.t,N=env.u,O=env.v,P=env.w,Q=env.x,R=env.y,S=env.z,T=env.A,U=env.B,V=env.C,W=env.D,X=env.E,Y=env.F,Z=env.G,_=env.H,$=env.I,aa=env.J,ba=env.K,ca=env.L,da=env.M,ea=env.N,fa=env.O,ga=env.P,ha=env.Q,ia=env.R,ja=env.S,ka=env.T,la=env.U,ma=35344,na=5278224,oa=0.0;
// EMSCRIPTEN_START_FUNCS
function Rd(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;g=ma;ma=ma+48|0;e=g+32|0;f=g+16|0;b=g;if(!(rc()|0)){hb();Pi(9578,c[7337]|0)|0;Pi(9578,c[7338]|0)|0;fb();ma=g;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(9578,c[7337]|0)|0;Pi(9578,c[7338]|0)|0;fb();ma=g;return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(9578,c[7337]|0)|0;Pi(9578,c[7338]|0)|0;fb();ma=g;return}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){b=21;break}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){b=11;break}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,1)|0;if(c[7393]|0){b=13;break}a[(c[7372]|0)+(c[7460]|0)>>0]=8;c[(c[7401]|0)+(c[7460]<<2)>>2]=c[7563];a:do if((c[7563]|0)==(c[7564]|0)){h=c[7337]|0;i=(c[7564]|0)+10|0;k=c[7564]|0;c[b>>2]=9586;c[b+4>>2]=4;c[b+8>>2]=i;c[b+12>>2]=k;Ki(h,3883,b)|0;c[7523]=Bg(c[7523]|0,(c[7564]|0)+10+1<<2)|0;h=c[7337]|0;k=(c[7457]|0)+1|0;i=(c[7564]|0)+10|0;j=c[7564]|0;c[f>>2]=9598;c[f+4>>2]=k;c[f+8>>2]=i;c[f+12>>2]=j;Ki(h,3883,f)|0;c[7525]=Bg(c[7525]|0,r((c[7564]|0)+10|0,(c[7457]|0)+1|0)|0)|0;h=c[7337]|0;j=(c[7564]|0)+10|0;i=c[7564]|0;c[e>>2]=9610;c[e+4>>2]=4;c[e+8>>2]=j;c[e+12>>2]=i;Ki(h,3883,e)|0;c[7526]=Bg(c[7526]|0,(c[7564]|0)+10+1<<2)|0;c[7564]=(c[7564]|0)+10;c[7522]=c[7563];while(1){if((c[7522]|0)>=(c[7564]|0))break a;c[(c[7523]|0)+(c[7522]<<2)>>2]=0;c[(c[7526]|0)+(c[7522]<<2)>>2]=0;c[7522]=(c[7522]|0)+1}}while(0);c[7563]=(c[7563]|0)+1;if(!(rc()|0)){b=19;break}}if((b|0)==11){lb();Pi(9578,c[7337]|0)|0;Pi(9578,c[7338]|0)|0;fb();ma=g;return}else if((b|0)==13){ob(c[7460]|0);ma=g;return}else if((b|0)==19){hb();Pi(9578,c[7337]|0)|0;Pi(9578,c[7338]|0)|0;fb();ma=g;return}else if((b|0)==21){c[7354]=(c[7354]|0)+1;ma=g;return}}function Sd(){var a=0,b=0,e=0,f=0,g=0;e=ma;ma=ma+32|0;b=e+16|0;a=e;if(!(mc()|0)){f=c[7337]|0;g=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[a>>2]=34;c[a+4>>2]=g;c[a+8>>2]=9622;Ki(f,4667,a)|0;a=c[7338]|0;f=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[b>>2]=34;c[b+4>>2]=f;c[b+8>>2]=9622;Ki(a,4667,b)|0;fb();ma=e;return}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);g=c[7401]|0;c[7471]=c[g+((Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,4,0)|0)<<2)>>2];if(!(c[7393]|0)){La();Pi(9657,c[7337]|0)|0;Pi(9657,c[7338]|0)|0;fb();ma=e;return}do switch(c[7471]|0){case 0:{Gd();ma=e;return}case 1:{Id();ma=e;return}case 2:{Jd();ma=e;return}case 3:{Kd();ma=e;return}case 4:{Ld();ma=e;return}case 5:{Md();ma=e;return}case 6:{Od();ma=e;return}case 7:{Pd();ma=e;return}case 8:{Qd();ma=e;return}case 9:{Rd();ma=e;return}default:{Pi(9691,c[7337]|0)|0;Pi(9691,c[7338]|0)|0;Ea();ha(18656,1)}}while(0)}function Td(){var a=0,b=0,d=0;d=ma;ma=ma+16|0;a=d+4|0;b=d;Wf(c[c[7569]>>2]|0,8142);c[a>>2]=100;c[b>>2]=9718;he(29640,c[b>>2]|0,c[a>>2]|0);if((c[7410]|0)<(c[a>>2]|0))c[7410]=c[a>>2];c[a>>2]=1e3;c[b>>2]=9731;he(29828,c[b>>2]|0,c[a>>2]|0);if((c[7457]|0)<(c[a>>2]|0))c[7457]=c[a>>2];c[a>>2]=4e3;c[b>>2]=9745;he(29396,c[b>>2]|0,c[a>>2]|0);if((c[7349]|0)<(c[a>>2]|0))c[7349]=c[a>>2];b=c[7349]|0;c[7397]=b;c[7397]=(c[7397]|0)<5e3?5e3:b;c[7565]=(c[7397]|0)+1-1;c[7463]=(c[7565]|0)+1;c[7536]=(c[7565]|0)+1;ma=d;return}function Ud(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+32|0;a=j+24|0;b=j+20|0;d=j+16|0;e=j+12|0;f=j+8|0;g=j+4|0;i=j;c[a>>2]=((c[7397]|0)/20|0)*17;c[d>>2]=1;c[b>>2]=1;c[7392]=2;c[(c[7395]|0)+(c[b>>2]<<2)>>2]=c[7392];c[e>>2]=2;c[f>>2]=9;while(1){if((c[7392]|0)>=(c[a>>2]|0))break;do{c[d>>2]=(c[d>>2]|0)+2;if((c[d>>2]|0)==(c[f>>2]|0)){c[(c[7373]|0)+(c[e>>2]<<2)>>2]=c[d>>2];c[d>>2]=(c[d>>2]|0)+2;c[e>>2]=(c[e>>2]|0)+1;c[f>>2]=r(c[(c[7395]|0)+(c[e>>2]<<2)>>2]|0,c[(c[7395]|0)+(c[e>>2]<<2)>>2]|0)|0}c[g>>2]=2;c[i>>2]=1;while(1){if(!((c[g>>2]|0)<(c[e>>2]|0)?(c[i>>2]|0)!=0:0))break;while(1){h=c[(c[7373]|0)+(c[g>>2]<<2)>>2]|0;if((c[(c[7373]|0)+(c[g>>2]<<2)>>2]|0)>=(c[d>>2]|0))break;c[(c[7373]|0)+(c[g>>2]<<2)>>2]=h+(c[(c[7395]|0)+(c[g>>2]<<2)>>2]<<1)}if((h|0)==(c[d>>2]|0))c[i>>2]=0;c[g>>2]=(c[g>>2]|0)+1}}while((c[i>>2]|0)!=0^1);c[b>>2]=(c[b>>2]|0)+1;c[7392]=c[d>>2];c[(c[7395]|0)+(c[b>>2]<<2)>>2]=c[7392]}ma=j;return}function Vd(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;t=ma;ma=ma+80|0;s=t;b=t+64|0;e=t+60|0;k=t+56|0;l=t+52|0;m=t+48|0;n=t+44|0;o=t+40|0;p=t+36|0;q=t+32|0;r=t+28|0;f=t+24|0;g=t+20|0;h=t+16|0;i=t+12|0;j=t+8|0;c[7566]=0;if(79>=(c[7340]|0))c[7566]=((c[7566]|0)*10|0)+3;if((c[7392]|0)<128)c[7566]=((c[7566]|0)*10|0)+4;if((c[7392]|0)>(c[7397]|0))c[7566]=((c[7566]|0)*10|0)+5;if((c[7349]|0)>(c[7397]|0))c[7566]=((c[7566]|0)*10|0)+7;if((c[7365]|0)>(c[7349]|0))c[7566]=((c[7566]|0)*10|0)+8;if((c[7566]|0)>0){u=c[7338]|0;c[s>>2]=c[7566];c[s+4>>2]=9764;Ki(u,9757,s)|0;ie(1)}a[35048]=0;a[18848]=32;a[18849]=33;a[18850]=34;a[18851]=35;a[18852]=36;a[18853]=37;a[18854]=38;a[18855]=39;a[18856]=40;a[18857]=41;a[18858]=42;a[18859]=43;a[18860]=44;a[18861]=45;a[18862]=46;a[18863]=47;a[18864]=48;a[18865]=49;a[18866]=50;a[18867]=51;a[18868]=52;a[18869]=53;a[18870]=54;a[18871]=55;a[18872]=56;a[18873]=57;a[18874]=58;a[18875]=59;a[18876]=60;a[18877]=61;a[18878]=62;a[18879]=63;a[18880]=64;a[18881]=65;a[18882]=66;a[18883]=67;a[18884]=68;a[18885]=69;a[18886]=70;a[18887]=71;a[18888]=72;a[18889]=73;a[18890]=74;a[18891]=75;a[18892]=76;a[18893]=77;a[18894]=78;a[18895]=79;a[18896]=80;a[18897]=81;a[18898]=82;a[18899]=83;a[18900]=84;a[18901]=85;a[18902]=86;a[18903]=87;a[18904]=88;a[18905]=89;a[18906]=90;a[18907]=91;a[18908]=92;a[18909]=93;a[18910]=94;a[18911]=95;a[18912]=96;a[18913]=97;a[18914]=98;a[18915]=99;a[18916]=100;a[18917]=101;a[18918]=102;a[18919]=103;a[18920]=104;a[18921]=105;a[18922]=106;a[18923]=107;a[18924]=108;a[18925]=109;a[18926]=110;a[18927]=111;a[18928]=112;a[18929]=113;a[18930]=114;a[18931]=115;a[18932]=116;a[18933]=117;a[18934]=118;a[18935]=119;a[18936]=120;a[18937]=121;a[18938]=122;a[18939]=123;a[18940]=124;a[18941]=125;a[18942]=126;a[18816]=32;a[18943]=32;c[b>>2]=0;c[k>>2]=31;if((c[b>>2]|0)<=(c[k>>2]|0))do{a[18816+(c[b>>2]|0)>>0]=c[b>>2];u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[k>>2]|0));c[b>>2]=127;c[l>>2]=255;if((c[b>>2]|0)<=(c[l>>2]|0))do{a[18816+(c[b>>2]|0)>>0]=c[b>>2];u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[l>>2]|0));c[b>>2]=0;c[m>>2]=255;if((c[b>>2]|0)<=(c[m>>2]|0))do{a[18144+(d[18816+(c[b>>2]|0)>>0]|0)>>0]=c[b>>2];u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[m>>2]|0));c[b>>2]=0;c[n>>2]=127;if((c[b>>2]|0)<=(c[n>>2]|0))do{a[18400+(c[b>>2]|0)>>0]=5;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[n>>2]|0));c[b>>2]=128;c[o>>2]=255;if((c[b>>2]|0)<=(c[o>>2]|0))do{a[18400+(c[b>>2]|0)>>0]=2;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[o>>2]|0));c[b>>2]=0;c[p>>2]=31;if((c[b>>2]|0)<=(c[p>>2]|0))do{a[18400+(c[b>>2]|0)>>0]=0;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[p>>2]|0));a[18527]=0;a[18409]=1;a[18413]=1;a[18432]=1;a[18526]=4;a[18445]=4;c[b>>2]=48;c[q>>2]=57;if((c[b>>2]|0)<=(c[q>>2]|0))do{a[18400+(c[b>>2]|0)>>0]=3;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[q>>2]|0));c[b>>2]=65;c[r>>2]=90;if((c[b>>2]|0)<=(c[r>>2]|0))do{a[18400+(c[b>>2]|0)>>0]=2;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[r>>2]|0));c[b>>2]=97;c[f>>2]=122;if((c[b>>2]|0)<=(c[f>>2]|0))do{a[18400+(c[b>>2]|0)>>0]=2;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[f>>2]|0));c[b>>2]=0;c[g>>2]=255;if((c[b>>2]|0)<=(c[g>>2]|0))do{a[19744+(c[b>>2]|0)>>0]=1;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[g>>2]|0));c[b>>2]=0;c[h>>2]=31;if((c[b>>2]|0)<=(c[h>>2]|0))do{a[19744+(c[b>>2]|0)>>0]=0;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[h>>2]|0));a[19776]=0;a[19753]=0;a[19778]=0;a[19779]=0;a[19781]=0;a[19783]=0;a[19784]=0;a[19785]=0;a[19788]=0;a[19805]=0;a[19867]=0;a[19869]=0;c[b>>2]=0;c[i>>2]=127;if((c[b>>2]|0)<=(c[i>>2]|0))do{c[2e4+(c[b>>2]<<2)>>2]=0;u=c[b>>2]|0;c[b>>2]=u+1}while((u|0)<(c[i>>2]|0));c[5032]=278;c[5033]=278;c[5034]=500;c[5035]=833;c[5036]=500;c[5037]=833;c[5038]=778;c[5039]=278;c[5040]=389;c[5041]=389;c[5042]=500;c[5043]=778;c[5044]=278;c[5045]=333;c[5046]=278;c[5047]=500;c[5048]=500;c[5049]=500;c[5050]=500;c[5051]=500;c[5052]=500;c[5053]=500;c[5054]=500;c[5055]=500;c[5056]=500;c[5057]=500;c[5058]=278;c[5059]=278;c[5060]=278;c[5061]=778;c[5062]=472;c[5063]=472;c[5064]=778;c[5065]=750;c[5066]=708;c[5067]=722;c[5068]=764;c[5069]=681;c[5070]=653;c[5071]=785;c[5072]=750;c[5073]=361;c[5074]=514;c[5075]=778;c[5076]=625;c[5077]=917;c[5078]=750;c[5079]=778;c[5080]=681;c[5081]=778;c[5082]=736;c[5083]=556;c[5084]=722;c[5085]=750;c[5086]=750;c[5087]=1028;c[5088]=750;c[5089]=750;c[5090]=611;c[5091]=278;c[5092]=500;c[5093]=278;c[5094]=500;c[5095]=278;c[5096]=278;c[5097]=500;c[5098]=556;c[5099]=444;c[5100]=556;c[5101]=444;c[5102]=306;c[5103]=500;c[5104]=556;c[5105]=278;c[5106]=306;c[5107]=528;c[5108]=278;c[5109]=833;c[5110]=556;c[5111]=500;c[5112]=556;c[5113]=528;c[5114]=392;c[5115]=394;c[5116]=389;c[5117]=556;c[5118]=528;c[5119]=722;c[5120]=528;c[5121]=528;c[5122]=444;c[5123]=500;c[5124]=1e3;c[5125]=500;c[5126]=500;c[e>>2]=1;c[j>>2]=c[7565];if((c[e>>2]|0)<=(c[j>>2]|0))do{c[(c[7395]|0)+(c[e>>2]<<2)>>2]=0;c[(c[7373]|0)+(c[e>>2]<<2)>>2]=0;u=c[e>>2]|0;c[e>>2]=u+1}while((u|0)<(c[j>>2]|0));c[7396]=(c[7565]|0)+1;c[7389]=0;c[7348]=1;c[(c[7350]|0)+(c[7348]<<2)>>2]=c[7389];c[7361]=0;c[7538]=0;c[7363]=0;c[7540]=0;c[7378]=0;c[7542]=0;c[7478]=0;c[7386]=0;c[7519]=0;c[7407]=0;c[7399]=0;c[7522]=0;while(1){if((c[7522]|0)>=(c[7564]|0))break;c[(c[7523]|0)+(c[7522]<<2)>>2]=0;c[(c[7526]|0)+(c[7522]<<2)>>2]=0;c[7522]=(c[7522]|0)+1}c[7563]=0;c[7545]=0;c[7546]=0;c[7555]=0;c[7556]=0;c[7462]=0;c[7381]=0;gc();xd();ma=t;return}function Wd(){var a=0,b=0,e=0,f=0,g=0,h=0,i=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;I=ma;ma=ma+192|0;F=I+184|0;E=I+176|0;D=I+160|0;C=I+144|0;t=I+136|0;s=I+128|0;q=I+112|0;p=I+96|0;o=I+88|0;n=I+80|0;m=I+64|0;l=I+48|0;i=I+24|0;h=I+16|0;g=I+8|0;f=I;H=4;G=Xg(40)|0;c[G>>2]=0;c[7567]=c[697];c[7338]=c[729];c[7352]=65e3;c[7340]=2e4;c[7539]=20;c[7564]=10;c[7376]=5e3;c[7365]=750;c[7464]=3e3;c[7513]=50;j=0;A(1);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;a:do switch(b|0){case 1:{b=63;break}case 2:{b=33;break}default:{j=0;e=x(2,(c[7539]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7466]=e;j=0;b=x(2,(c[7539]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7360]=b;c[7518]=0;c[7409]=0;j=0;b=x(2,(c[7464]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7465]=b;j=0;b=x(2,(c[7376]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7377]=b;j=0;b=x(2,(c[7539]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7475]=b;j=0;b=x(2,(c[7352]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7351]=b;j=0;b=x(2,(c[7340]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7341]=b;j=0;b=x(2,(c[7340]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7342]=b;j=0;b=x(2,(c[7340]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7343]=b;j=0;b=x(2,(c[7340]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7344]=b;j=0;b=x(2,(c[7340]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7345]=b;j=0;b=x(2,(c[7340]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7346]=b;j=0;b=x(2,c[7564]<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7523]=b;b=r(c[7564]|0,(c[7457]|0)+1|0)|0;j=0;b=x(2,b|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7525]=b;j=0;b=x(2,c[7564]<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7526]=b;j=0;b=x(2,(c[7365]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7366]=b;j=0;b=x(2,(c[7365]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7367]=b;j=0;b=x(2,(c[7365]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7368]=b;j=0;b=x(2,(c[7365]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7369]=b;j=0;b=x(2,(c[7349]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7350]=b;j=0;b=x(2,(c[7565]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7395]=b;j=0;b=x(2,(c[7565]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7373]=b;j=0;b=x(2,(c[7565]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7394]=b;j=0;b=x(2,(c[7565]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7401]=b;j=0;b=x(2,(c[7565]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7372]=b;j=0;b=x(2,(c[7513]|0)+1<<2|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7510]=b;j=0;b=x(2,(c[7513]|0)+1|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}c[7512]=b;j=0;A(2);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}j=0;A(3);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}G=Ej(18656,2,G|0,H|0)|0;H=v()|0;j=0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;break a}case 2:{b=33;break a}default:{}}a=0;b=33}}while(0);b:while(1){if((b|0)==33){b=0;if((a|0)!=1){b=(c[7541]|0)!=0;j=0;y(1,8149,c[7337]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}if(b){j=0;y(1,8149,c[7338]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7337]|0;j=0;c[f>>2]=10665;z(6,a|0,10634,f|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;j=0;c[g>>2]=10665;z(6,a|0,10634,g|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}else{a=c[7337]|0;j=0;c[h>>2]=10665;z(6,a|0,10634,h|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}a=c[7337]|0;J=c[7349]|0;b=c[7397]|0;e=c[7392]|0;j=0;c[i>>2]=9795;c[i+4>>2]=J;c[i+8>>2]=9818;c[i+12>>2]=b;c[i+16>>2]=9831;c[i+20>>2]=e;z(6,a|0,9778,i|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}b=(c[7541]|0)!=0;j=0;y(1,9845,c[7337]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}if(b){j=0;y(1,9845,c[7338]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}j=0;A(4);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}else{j=0;A(5);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}while(1){if(c[7336]|0)break;c[19168+(c[7359]<<2)>>2]=(c[19168+(c[7359]<<2)>>2]|0)+1;j=0;b=x(3,c[21024+(c[7359]<<2)>>2]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}if(b|0){j=0;A(7);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}else{j=0;A(6);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}}j=0;A(8);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}if(!(c[7363]|0))b=71;else{c[7370]=0;c[7384]=1;c[7354]=c[7347];G=Ej(19264,1,G|0,H|0)|0;H=v()|0;j=0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=0;b=63;continue}}}else if((b|0)==63){c:do if(!a)while(1){j=0;b=w(1)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){e=Fj(c[a>>2]|0,G|0,H|0)|0;if(!e)ha(a|0,k|0);u(k|0)}else e=-1;a=v()|0;switch(e|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}if(!b)break c;j=0;A(9);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}while(0);j=0;B(1,c[7371]|0);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}b=71}if((b|0)==71){j=0;B(1,c[7383]|0);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}if(!((c[7555]|0)==0|(c[7556]|0)!=0)){a=c[7337]|0;J=c[7374]|0;j=0;c[l>>2]=9876;c[l+4>>2]=J;c[l+8>>2]=4183;z(6,a|0,4166,l|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;J=c[7374]|0;j=0;c[m>>2]=9876;c[m+4>>2]=J;c[m+8>>2]=4183;z(6,a|0,4166,m|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}j=0;A(10);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}j=0;A(11);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}d:do switch(d[35048]|0|0){case 0:break;case 1:{a=c[7337]|0;if((c[7339]|0)==1){j=0;c[n>>2]=9893;z(6,a|0,10634,n|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;j=0;c[o>>2]=9893;z(6,a|0,10634,o|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}break d}else{J=c[7339]|0;j=0;c[p>>2]=9915;c[p+4>>2]=J;c[p+8>>2]=9928;z(6,a|0,5620,p|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;J=c[7339]|0;j=0;c[q>>2]=9915;c[q+4>>2]=J;c[q+8>>2]=9928;z(6,a|0,5620,q|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}break d}}case 2:{a=c[7337]|0;if((c[7339]|0)==1){j=0;c[s>>2]=9939;z(6,a|0,10634,s|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;j=0;c[t>>2]=9939;z(6,a|0,10634,t|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}break d}else{J=c[7339]|0;j=0;c[C>>2]=9915;c[C+4>>2]=J;c[C+8>>2]=9967;z(6,a|0,5620,C|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;J=c[7339]|0;j=0;c[D>>2]=9915;c[D+4>>2]=J;c[D+8>>2]=9967;z(6,a|0,5620,D|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}break d}}case 3:{a=c[7337]|0;j=0;c[E>>2]=9984;z(6,a|0,10634,E|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}a=c[7338]|0;j=0;c[F>>2]=9984;z(6,a|0,10634,F|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}break}default:{j=0;y(1,10009,c[7337]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}j=0;y(1,10009,c[7338]|0)|0;a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}j=0;A(12);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}}}while(0);j=0;B(1,c[7337]|0);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;continue b}case 2:{b=33;continue b}default:{}}if((d[35048]|0|0)<=1){b=105;break}j=0;B(2,d[35048]|0|0);a=j;j=0;if((a|0)!=0&(k|0)!=0){b=Fj(c[a>>2]|0,G|0,H|0)|0;if(!b)ha(a|0,k|0);u(k|0)}else b=-1;a=v()|0;switch(b|0){case 1:{b=63;break}case 2:{b=33;break}default:{b=104;break b}}}if((b|0)!=104)if((b|0)==105){Yg(G|0);ma=I;return}}function Xd(a){a=a|0;var b=0,d=0,e=0,f=0;f=ma;ma=ma+16|0;b=f+8|0;d=f+4|0;e=f;c[d>>2]=a;do if(c[d>>2]|0){if(Xi(c[d>>2]|0)|0){c[b>>2]=1;break}a=Ui(c[d>>2]|0)|0;c[e>>2]=a;if((a|0)==-1){c[b>>2]=1;break}else{yi(c[e>>2]|0,c[d>>2]|0)|0;c[b>>2]=0;break}}else c[b>>2]=1;while(0);ma=f;return c[b>>2]|0}function Yd(a){a=a|0;var b=0,d=0,e=0,f=0;f=ma;ma=ma+16|0;e=f+8|0;b=f+4|0;d=f;c[b>>2]=a;if(Xi(c[b>>2]|0)|0){c[e>>2]=1;e=c[e>>2]|0;ma=f;return e|0}c[d>>2]=Ui(c[b>>2]|0)|0;if((c[d>>2]|0)!=-1)yi(c[d>>2]|0,c[b>>2]|0)|0;if((c[d>>2]|0)==10|(c[d>>2]|0)==13)a=1;else a=(c[d>>2]|0)==-1;c[e>>2]=a&1;e=c[e>>2]|0;ma=f;return e|0}function Zd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[d+8>>2]=0;c[f>>2]=a;c[e>>2]=b;c[7568]=c[f>>2];c[7569]=c[e>>2];Wd();ma=d;return 0}function _d(a){a=a|0;var b=0,d=0,e=0;e=ma;ma=ma+16|0;d=e;b=e+4|0;c[b>>2]=a;if((c[b>>2]|0)>=(c[7568]|0)){e=c[665]|0;c[d>>2]=c[c[7569]>>2];Ki(e,10025,d)|0;ie(1)}else{ma=e;return c[(c[7569]|0)+(c[b>>2]<<2)>>2]|0}return 0}function $d(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;ae(10058,c[d>>2]|0);ma=b;return}function ae(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=ma;ma=ma+16|0;f=g;d=g+12|0;e=g+8|0;c[d>>2]=a;c[e>>2]=b;if(!0){ma=g;return}if(!(c[7571]|0))be();b=c[7571]|0;e=c[e>>2]|0;c[f>>2]=c[d>>2];c[f+4>>2]=e;Ki(b,10064,f)|0;Ai(c[7571]|0)|0;ma=g;return}function be(){var a=0,b=0,d=0,e=0,f=0,g=0;e=ma;ma=ma+48|0;d=e+32|0;g=e+24|0;a=e+40|0;f=e;b=e+36|0;c[g>>2]=hj()|0;wi(f,14935,g)|0;c[7572]=Me(c[7601]|0,f,10071)|0;if(0){c[b>>2]=Me(0,17682,c[7572]|0)|0;Yg(c[7572]|0);c[7572]=c[b>>2]}c[7571]=vg(c[7572]|0,10076)|0;c[a>>2]=xg()|0;g=c[7571]|0;c[d>>2]=c[a>>2];Ki(g,10079,d)|0;Yg(c[a>>2]|0);ma=e;return}function ce(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;ae(10087,c[d>>2]|0);ma=b;return}function de(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+32|0;g=l+20|0;h=l+16|0;i=l+12|0;j=l+8|0;f=l+4|0;k=l;c[g>>2]=b;c[h>>2]=d;c[i>>2]=e;c[j>>2]=0;c[c[g>>2]>>2]=0;if(c[7570]|0)Yg(c[7570]|0);c[7570]=0;do if(0?(He((c[7357]|0)+1|0,0)|0)==0:0){c[j>>2]=Me(0,17682,(c[7357]|0)+1|0)|0;e=Bi(c[j>>2]|0,c[i>>2]|0)|0;c[c[g>>2]>>2]=e;if(c[c[g>>2]>>2]|0?$e(c[j>>2]|0)|0:0){Ci(c[c[g>>2]>>2]|0)|0;c[c[g>>2]>>2]=0}if(c[c[g>>2]>>2]|0){Yg(c[7357]|0);c[7358]=$h(c[j>>2]|0)|0;c[7357]=yg((c[7358]|0)+2|0)|0;fi((c[7357]|0)+1|0,c[j>>2]|0)|0;c[7570]=c[j>>2];break}else{Yg(c[j>>2]|0);break}}while(0);do if(!(c[c[g>>2]>>2]|0)){if((c[h>>2]|0)<0){k=Bi((c[7357]|0)+1|0,c[i>>2]|0)|0;c[c[g>>2]>>2]=k;break}if((c[h>>2]|0)!=26|0!=0)b=(c[h>>2]|0)!=33;else b=0;c[f>>2]=b&1;c[j>>2]=ze((c[7357]|0)+1|0,c[h>>2]|0,c[f>>2]|0)|0;if(c[j>>2]|0){c[7570]=Cg(c[j>>2]|0)|0;do if((a[c[j>>2]>>0]|0)==46?(a[(c[j>>2]|0)+1>>0]|0)==47:0){if((a[(c[7357]|0)+1>>0]|0)==46?(a[(c[7357]|0)+2>>0]|0)==47:0)break;c[k>>2]=0;while(1){b=c[j>>2]|0;d=c[k>>2]|0;if(!(a[(c[j>>2]|0)+((c[k>>2]|0)+2)>>0]|0))break;a[(c[j>>2]|0)+(c[k>>2]|0)>>0]=a[b+(d+2)>>0]|0;c[k>>2]=(c[k>>2]|0)+1}a[b+d>>0]=0}while(0);Yg(c[7357]|0);c[7358]=$h(c[j>>2]|0)|0;c[7357]=yg((c[7358]|0)+2|0)|0;fi((c[7357]|0)+1|0,c[j>>2]|0)|0;Yg(c[j>>2]|0);k=vg((c[7357]|0)+1|0,c[i>>2]|0)|0;c[c[g>>2]>>2]=k}}while(0);if(!(c[c[g>>2]>>2]|0)){k=c[g>>2]|0;k=c[k>>2]|0;k=(k|0)!=0;k=k&1;ma=l;return k|0}$d((c[7357]|0)+1|0);if((c[h>>2]|0)==3){Ui(c[c[g>>2]>>2]|0)|0;k=c[g>>2]|0;k=c[k>>2]|0;k=(k|0)!=0;k=k&1;ma=l;return k|0}if((c[h>>2]|0)==19){Ui(c[c[g>>2]>>2]|0)|0;k=c[g>>2]|0;k=c[k>>2]|0;k=(k|0)!=0;k=k&1;ma=l;return k|0}if((c[h>>2]|0)!=20){k=c[g>>2]|0;k=c[k>>2]|0;k=(k|0)!=0;k=k&1;ma=l;return k|0}Ui(c[c[g>>2]>>2]|0)|0;k=c[g>>2]|0;k=c[k>>2]|0;k=(k|0)!=0;k=k&1;ma=l;return k|0}function ee(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+32|0;e=j+16|0;f=j+12|0;g=j+8|0;h=j+4|0;i=j;c[e>>2]=b;c[f>>2]=d;c[h>>2]=He((c[7357]|0)+1|0,0)|0;b=(c[7357]|0)+1|0;if(0==0|(c[h>>2]|0)!=0)c[g>>2]=b;else c[g>>2]=Me(0,17682,b)|0;d=Bi(c[g>>2]|0,c[f>>2]|0)|0;c[c[e>>2]>>2]=d;if(((c[c[e>>2]>>2]|0)==0?(c[i>>2]=og(16709)|0,c[i>>2]|0):0)?!(c[h>>2]|0?1:(a[c[i>>2]>>0]|0)==0):0){if((c[g>>2]|0)!=((c[7357]|0)+1|0))Yg(c[g>>2]|0);c[g>>2]=Me(c[i>>2]|0,17682,(c[7357]|0)+1|0)|0;i=Bi(c[g>>2]|0,c[f>>2]|0)|0;c[c[e>>2]>>2]=i}if(c[c[e>>2]>>2]|0){if((c[g>>2]|0)!=((c[7357]|0)+1|0)){Yg(c[7357]|0);c[7358]=$h(c[g>>2]|0)|0;c[7357]=yg((c[7358]|0)+2|0)|0;fi((c[7357]|0)+1|0,c[g>>2]|0)|0}ce(c[g>>2]|0)}if((c[g>>2]|0)==((c[7357]|0)+1|0)){i=c[e>>2]|0;i=c[i>>2]|0;i=(i|0)!=0;i=i&1;ma=j;return i|0}Yg(c[g>>2]|0);i=c[e>>2]|0;i=c[i>>2]|0;i=(i|0)!=0;i=i&1;ma=j;return i|0}function fe(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;c[b>>2]=a;if(c[b>>2]|0?(Ci(c[b>>2]|0)|0)==-1:0)Si(10094);ma=d;return}function ge(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=ma;ma=ma+80|0;q=h+40|0;p=h+32|0;s=h+24|0;r=h+16|0;o=h;i=h+76|0;j=h+72|0;k=h+68|0;l=h+64|0;m=h+60|0;n=h+56|0;g=h+52|0;h=h+48|0;c[i>>2]=b;c[j>>2]=d;c[k>>2]=e;c[l>>2]=f;c[g>>2]=bi(c[i>>2]|0,44)|0;c[h>>2]=ni(c[i>>2]|0,32)|0;if(!((c[g>>2]|0)!=0&(c[h>>2]|0)!=0))C(10101,10131,33,10197);c[h>>2]=(c[h>>2]|0)+1;c[n>>2]=(c[g>>2]|0)-(c[i>>2]|0)-8;c[m>>2]=yg((c[n>>2]|0)+1|0)|0;vi(c[m>>2]|0,(c[i>>2]|0)+8|0,c[n>>2]|0)|0;a[(c[m>>2]|0)+(c[n>>2]|0)>>0]=0;n=c[h>>2]|0;c[o>>2]=c[m>>2];c[o+4>>2]=n;c[o+8>>2]=10665;Oi(10217,o)|0;Vi(17352)|0;if(c[j>>2]|0?(c[r>>2]=c[j>>2],Oi(10226,r)|0,(c[k>>2]|0)==0):0)c[k>>2]=c[j>>2];Vi(10246)|0;Pi(10304,c[729]|0)|0;c[s>>2]=c[m>>2];Oi(10329,s)|0;Vi(10356)|0;Vi(10395)|0;c[p>>2]=c[m>>2];Oi(10450,p)|0;s=c[k>>2]|0;c[q>>2]=c[m>>2];c[q+4>>2]=s;Oi(10484,q)|0;if(!(c[l>>2]|0))ie(0);Pi(c[l>>2]|0,c[729]|0)|0;ie(0)}function he(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+48|0;j=k;e=k+32|0;f=k+28|0;g=k+24|0;h=k+20|0;i=k+16|0;c[e>>2]=a;c[f>>2]=b;c[g>>2]=d;c[h>>2]=og(c[f>>2]|0)|0;c[c[e>>2]>>2]=c[g>>2];if(!(c[h>>2]|0)){ma=k;return}c[i>>2]=lj(c[h>>2]|0)|0;if((c[i>>2]|0)>=0?!((c[i>>2]|0)==0&(c[g>>2]|0)>0):0)c[c[e>>2]>>2]=c[i>>2];else{e=c[665]|0;d=c[i>>2]|0;f=c[f>>2]|0;i=c[g>>2]|0;c[j>>2]=c[7599];c[j+4>>2]=d;c[j+8>>2]=f;c[j+12>>2]=i;Ki(e,10511,j)|0}Yg(c[h>>2]|0);ma=k;return}function ie(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d+4|0;c[b>>2]=a;do if(c[b>>2]|0)if((c[b>>2]|0)==1){c[d>>2]=1;break}else{c[d>>2]=c[b>>2];break}else c[d>>2]=0;while(0);da(c[d>>2]|0)}function je(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;d=d+4|0;c[d>>2]=a;a=c[665]|0;c[b>>2]=c[d>>2];Ki(a,10581,b)|0;ie(1)}function ke(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;e=ma;ma=ma+32|0;g=e+8|0;f=e;d=e+16|0;e=e+12|0;c[d>>2]=a;c[e>>2]=b;c[e>>2]=c[e>>2]|0?b:10620;while(1){if(!(c[c[d>>2]>>2]|0))break;c[f>>2]=c[c[d>>2]>>2];Oi(10634,f)|0;c[d>>2]=(c[d>>2]|0)+4}c[g>>2]=c[e>>2];Oi(10638,g)|0;ie(0)}function le(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;i=ma;ma=ma+32|0;k=i+16|0;j=i+12|0;f=i+8|0;g=i+4|0;h=i;c[k>>2]=a;c[j>>2]=b;c[f>>2]=d;c[g>>2]=e;c[h>>2]=(c[k>>2]|0)+132+((c[j>>2]|0)*68|0);if((c[g>>2]|0)>>>0<(c[(c[h>>2]|0)+60>>2]|0)>>>0){ma=i;return}c[(c[h>>2]|0)+56>>2]=c[f>>2];c[(c[h>>2]|0)+60>>2]=c[g>>2];ma=i;return}function me(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=ma;ma=ma+32|0;j=f+24|0;i=f+20|0;h=f+16|0;g=f;c[j>>2]=a;c[i>>2]=b;c[h>>2]=d;c[g>>2]=e;ne(c[j>>2]|0,c[i>>2]|0,c[h>>2]|0,g);ma=f;return}function ne(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;k=ma;ma=ma+32|0;n=k+28|0;m=k+24|0;l=k+20|0;h=k+16|0;i=k+12|0;j=k+8|0;f=k+4|0;g=k;c[n>>2]=a;c[m>>2]=b;c[l>>2]=d;c[h>>2]=e;c[f>>2]=0;a=(c[n>>2]|0)+132+((c[m>>2]|0)*68|0)|0;if(c[l>>2]|0)c[i>>2]=a+36;else c[i>>2]=a+32;while(1){m=c[h>>2]|0;l=(c[m>>2]|0)+(4-1)&~(4-1);n=c[l>>2]|0;c[m>>2]=l+4;c[g>>2]=n;n=c[g>>2]|0;c[j>>2]=n;if(!n)break;c[f>>2]=(c[f>>2]|0)+1;n=Bg(c[c[i>>2]>>2]|0,(c[f>>2]|0)+1<<2)|0;c[c[i>>2]>>2]=n;c[(c[c[i>>2]>>2]|0)+((c[f>>2]|0)-1<<2)>>2]=c[j>>2]}c[(c[c[i>>2]>>2]|0)+(c[f>>2]<<2)>>2]=0;ma=k;return}function oe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=a;c[e>>2]=b;if(!(c[(c[d>>2]|0)+132+((c[e>>2]|0)*68|0)+4>>2]|0))pe(c[d>>2]|0,c[e>>2]|0)|0;ma=f;return c[(c[d>>2]|0)+132+((c[e>>2]|0)*68|0)+4>>2]|0}function pe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0,Ac=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Gc=0,Hc=0,Ic=0,Jc=0,Kc=0,Lc=0,Mc=0,Nc=0,Oc=0,Pc=0,Qc=0,Rc=0,Sc=0,Tc=0,Uc=0,Vc=0,Wc=0,Xc=0,Yc=0;Yc=ma;ma=ma+2240|0;Xc=Yc+2200|0;Wc=Yc+2192|0;Vc=Yc+2184|0;Uc=Yc+2176|0;Tc=Yc+2168|0;Oc=Yc+2160|0;Nc=Yc+2152|0;Mc=Yc+2144|0;Kc=Yc+2136|0;Ic=Yc+2128|0;Hc=Yc+2120|0;Gc=Yc+2112|0;Fc=Yc+2104|0;Ec=Yc+2096|0;xc=Yc+2088|0;wc=Yc+2080|0;vc=Yc+2072|0;uc=Yc+2064|0;tc=Yc+2056|0;sc=Yc+2048|0;rc=Yc+2040|0;qc=Yc+2032|0;pc=Yc+2024|0;oc=Yc+2016|0;mc=Yc+2008|0;lc=Yc+1992|0;kc=Yc+1984|0;jc=Yc+1976|0;ic=Yc+1960|0;hc=Yc+1952|0;gc=Yc+1936|0;fc=Yc+1920|0;ec=Yc+1904|0;cc=Yc+1888|0;bc=Yc+1872|0;ac=Yc+1864|0;$b=Yc+1856|0;_b=Yc+1848|0;Zb=Yc+1840|0;Yb=Yc+1832|0;Xb=Yc+1800|0;Wb=Yc+1792|0;Ub=Yc+1784|0;Tb=Yc+1776|0;Sb=Yc+1768|0;Rb=Yc+1760|0;Qb=Yc+1752|0;Pb=Yc+1736|0;Ob=Yc+1728|0;Nb=Yc+1720|0;Mb=Yc+1704|0;Lb=Yc+1696|0;Kb=Yc+1680|0;Jb=Yc+1672|0;Hb=Yc+1664|0;Gb=Yc+1648|0;Fb=Yc+1640|0;Eb=Yc+1624|0;Db=Yc+1616|0;Cb=Yc+1608|0;Bb=Yc+1592|0;zb=Yc+1584|0;yb=Yc+1568|0;xb=Yc+1560|0;wb=Yc+1552|0;vb=Yc+1544|0;ub=Yc+1536|0;tb=Yc+1528|0;sb=Yc+1520|0;rb=Yc+1512|0;qb=Yc+1496|0;ob=Yc+1488|0;nb=Yc+1480|0;mb=Yc+1448|0;lb=Yc+1440|0;kb=Yc+1432|0;jb=Yc+1400|0;ib=Yc+1392|0;hb=Yc+1384|0;gb=Yc+1368|0;fb=Yc+1360|0;db=Yc+1344|0;cb=Yc+1320|0;bb=Yc+1312|0;ab=Yc+1296|0;$a=Yc+1288|0;_a=Yc+1280|0;Za=Yc+1264|0;Ya=Yc+1256|0;Xa=Yc+1248|0;Wa=Yc+1240|0;Va=Yc+1232|0;Ua=Yc+1216|0;Ta=Yc+1200|0;Sa=Yc+1176|0;Ra=Yc+1152|0;Qa=Yc+1144|0;Pa=Yc+1136|0;Oa=Yc+1120|0;Na=Yc+1112|0;Ma=Yc+1104|0;La=Yc+1096|0;Ka=Yc+1088|0;Ja=Yc+1072|0;Ia=Yc+1064|0;Ga=Yc+1056|0;Fa=Yc+1048|0;Ea=Yc+1040|0;Ca=Yc+1024|0;Ba=Yc+984|0;Aa=Yc+976|0;za=Yc+968|0;ya=Yc+960|0;xa=Yc+952|0;va=Yc+936|0;ua=Yc+928|0;ta=Yc+912|0;sa=Yc+904|0;ra=Yc+896|0;qa=Yc+888|0;pa=Yc+872|0;oa=Yc+856|0;na=Yc+848|0;la=Yc+832|0;ka=Yc+824|0;ja=Yc+816|0;ia=Yc+808|0;ha=Yc+800|0;fa=Yc+792|0;ea=Yc+784|0;ca=Yc+768|0;ba=Yc+752|0;aa=Yc+744|0;$=Yc+728|0;_=Yc+720|0;Z=Yc+712|0;Y=Yc+704|0;X=Yc+696|0;W=Yc+688|0;V=Yc+680|0;U=Yc+672|0;T=Yc+664|0;S=Yc+656|0;R=Yc+640|0;Q=Yc+632|0;P=Yc+624|0;N=Yc+616|0;M=Yc+608|0;L=Yc+600|0;K=Yc+584|0;J=Yc+576|0;I=Yc+568|0;H=Yc+560|0;G=Yc+552|0;F=Yc+544|0;E=Yc+536|0;D=Yc+528|0;C=Yc+520|0;B=Yc+512|0;A=Yc+496|0;z=Yc+488|0;y=Yc+480|0;x=Yc+472|0;w=Yc+456|0;v=Yc+448|0;u=Yc+440|0;t=Yc+424|0;s=Yc+416|0;r=Yc+400|0;q=Yc+392|0;p=Yc+384|0;o=Yc+376|0;n=Yc+368|0;m=Yc+360|0;k=Yc+352|0;j=Yc+344|0;i=Yc+336|0;h=Yc+328|0;g=Yc+320|0;f=Yc+304|0;e=Yc+296|0;Dc=Yc+288|0;Cc=Yc+272|0;Bc=Yc+264|0;zc=Yc+256|0;yc=Yc+248|0;nc=Yc+232|0;dc=Yc+224|0;Vb=Yc+216|0;Ib=Yc+200|0;Ab=Yc+192|0;pb=Yc+184|0;eb=Yc+168|0;Ha=Yc+128|0;wa=Yc+120|0;ga=Yc+104|0;O=Yc+80|0;l=Yc+40|0;Ac=Yc+32|0;Da=Yc+16|0;d=Yc;Pc=Yc+2224|0;Qc=Yc+2220|0;Rc=Yc+2216|0;Jc=Yc+2212|0;Lc=Yc+2208|0;Sc=Yc+2204|0;c[Pc>>2]=a;c[Qc>>2]=b;do switch(c[Qc>>2]|0){case 0:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10708;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[d>>2]=10721;c[d+4>>2]=10729;c[d+8>>2]=10740;c[d+12>>2]=0;qe(Dc,Cc,10711,d);c[Da>>2]=10729;c[Da+4>>2]=10740;c[Da+8>>2]=0;c[Rc>>2]=re(10721,Da)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Ac>>2]=10708;c[Ac+4>>2]=0;me(Cc,Dc,0,Ac);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 1:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[l>>2]=10757;c[l+4>>2]=10766;c[l+8>>2]=10780;c[l+12>>2]=10787;c[l+16>>2]=10805;c[l+20>>2]=10811;c[l+24>>2]=10824;c[l+28>>2]=10830;c[l+32>>2]=0;se(Cc,Dc,10749,l);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10682;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[O>>2]=10844;c[O+4>>2]=10852;c[O+8>>2]=10729;c[O+12>>2]=10740;c[O+16>>2]=0;qe(Dc,Cc,10711,O);c[ga>>2]=10852;c[ga+4>>2]=10729;c[ga+8>>2]=10740;c[ga+12>>2]=0;c[Rc>>2]=re(10844,ga)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[wa>>2]=10682;c[wa+4>>2]=0;me(Cc,Dc,0,wa);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 2:{Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[Ha>>2]=10757;c[Ha+4>>2]=10766;c[Ha+8>>2]=10780;c[Ha+12>>2]=10787;c[Ha+16>>2]=10805;c[Ha+20>>2]=10811;c[Ha+24>>2]=10824;c[Ha+28>>2]=10830;c[Ha+32>>2]=0;se(Dc,Cc,10749,Ha);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10859;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[eb>>2]=10729;c[eb+4>>2]=10740;c[eb+8>>2]=0;qe(Cc,Dc,10711,eb);c[pb>>2]=10740;c[pb+4>>2]=0;c[Rc>>2]=re(10729,pb)|0;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 3:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Ab>>2]=0;se(Cc,Dc,10871,Ab);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10692;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ib>>2]=10880;c[Ib+4>>2]=10740;c[Ib+8>>2]=0;qe(Dc,Cc,10711,Ib);c[Vb>>2]=10740;c[Vb+4>>2]=0;c[Rc>>2]=re(10880,Vb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[dc>>2]=10889;c[dc+4>>2]=0;me(Cc,Dc,0,dc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 4:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10894;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[nc>>2]=10898;c[nc+4>>2]=10740;c[nc+8>>2]=0;qe(Dc,Cc,10711,nc);c[yc>>2]=10740;c[yc+4>>2]=0;c[Rc>>2]=re(10898,yc)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[zc>>2]=10907;c[zc+4>>2]=0;me(Cc,Dc,0,zc);break}case 5:{zc=c[Pc>>2]|0;Ac=c[Qc>>2]|0;c[Bc>>2]=0;se(zc,Ac,10912,Bc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10921;Ac=c[Pc>>2]|0;Bc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Cc>>2]=10926;c[Cc+4>>2]=10934;c[Cc+8>>2]=0;qe(Ac,Bc,10711,Cc);c[Dc>>2]=10934;c[Dc+4>>2]=0;c[Rc>>2]=re(10926,Dc)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[e>>2]=10943;c[e+4>>2]=0;me(Cc,Dc,0,e);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 6:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10949;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[f>>2]=10953;c[f+4>>2]=10963;c[f+8>>2]=0;qe(Dc,Cc,10711,f);c[g>>2]=10963;c[g+4>>2]=0;c[Rc>>2]=re(10953,g)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[h>>2]=10970;c[h+4>>2]=0;me(Cc,Dc,0,h);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 7:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10975;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[i>>2]=10979;c[i+4>>2]=0;qe(Dc,Cc,10711,i);c[j>>2]=0;c[Rc>>2]=re(10979,j)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[k>>2]=10989;c[k+4>>2]=0;me(Cc,Dc,0,k);break}case 8:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10994;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[m>>2]=11669;c[m+4>>2]=0;qe(Dc,Cc,10998,m);c[n>>2]=0;c[Rc>>2]=re(11669,n)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[o>>2]=11678;c[o+4>>2]=0;me(Cc,Dc,0,o);break}case 9:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11683;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[p>>2]=11688;c[p+4>>2]=0;qe(Dc,Cc,10711,p);c[q>>2]=0;c[Rc>>2]=re(11688,q)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[r>>2]=11683;c[r+4>>2]=11697;c[r+8>>2]=0;me(Cc,Dc,0,r);Dc=te(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+4>>2]|0)|0;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+4>>2]=Dc;break}case 10:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[s>>2]=0;se(Cc,Dc,10912,s);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10696;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[t>>2]=11702;c[t+4>>2]=10934;c[t+8>>2]=0;qe(Dc,Cc,10711,t);c[u>>2]=10934;c[u+4>>2]=0;c[Rc>>2]=re(11702,u)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[v>>2]=11713;c[v+4>>2]=0;me(Cc,Dc,0,v);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 11:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11718;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[w>>2]=11722;c[w+4>>2]=10740;c[w+8>>2]=0;qe(Dc,Cc,10711,w);c[x>>2]=10740;c[x+4>>2]=0;c[Rc>>2]=re(11722,x)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[y>>2]=11734;c[y+4>>2]=0;me(Cc,Dc,0,y);break}case 12:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[z>>2]=0;se(Cc,Dc,10912,z);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11739;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[A>>2]=11743;c[A+4>>2]=10934;c[A+8>>2]=0;qe(Dc,Cc,10711,A);c[B>>2]=10934;c[B+4>>2]=0;c[Rc>>2]=re(11743,B)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[C>>2]=11750;c[C+4>>2]=0;me(Cc,Dc,0,C);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 13:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[D>>2]=0;se(Cc,Dc,11755,D);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10685;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[E>>2]=11763;c[E+4>>2]=0;qe(Dc,Cc,10711,E);c[F>>2]=0;c[Rc>>2]=re(11763,F)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[G>>2]=11772;c[G+4>>2]=0;me(Cc,Dc,0,G);break}case 15:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11776;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[H>>2]=11780;c[H+4>>2]=0;qe(Dc,Cc,10711,H);c[I>>2]=0;c[Rc>>2]=re(11780,I)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[J>>2]=11790;c[J+4>>2]=0;me(Cc,Dc,0,J);break}case 14:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11795;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[K>>2]=11802;c[K+4>>2]=10934;c[K+8>>2]=0;qe(Dc,Cc,10711,K);c[L>>2]=10934;c[L+4>>2]=0;c[Rc>>2]=re(11802,L)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[M>>2]=11809;c[M+4>>2]=0;me(Cc,Dc,0,M);break}case 16:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11815;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[N>>2]=11818;c[N+4>>2]=0;qe(Dc,Cc,10711,N);c[P>>2]=0;c[Rc>>2]=re(11818,P)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Q>>2]=11827;c[Q+4>>2]=0;me(Cc,Dc,0,Q);break}case 17:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11831;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[R>>2]=11838;c[R+4>>2]=10934;c[R+8>>2]=0;qe(Dc,Cc,10711,R);c[S>>2]=10934;c[S+4>>2]=0;c[Rc>>2]=re(11838,S)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[T>>2]=11809;c[T+4>>2]=0;me(Cc,Dc,0,T);break}case 18:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11845;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[U>>2]=11862;c[U+4>>2]=0;qe(Cc,Dc,10711,U);c[V>>2]=0;c[Rc>>2]=re(11862,V)|0;break}case 19:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[W>>2]=0;se(Cc,Dc,11872,W);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10704;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[X>>2]=11878;c[X+4>>2]=0;qe(Dc,Cc,10711,X);c[Y>>2]=0;c[Rc>>2]=re(11878,Y)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Z>>2]=11888;c[Z+4>>2]=0;me(Cc,Dc,0,Z);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 20:{Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[_>>2]=0;se(Cc,Dc,11893,_);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10700;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[$>>2]=11899;c[$+4>>2]=10740;c[$+8>>2]=0;qe(Dc,Cc,10711,$);c[aa>>2]=10740;c[aa+4>>2]=0;c[Rc>>2]=re(11899,aa)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[ba>>2]=11908;c[ba+4>>2]=10889;c[ba+8>>2]=0;me(Cc,Dc,0,ba);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 21:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11913;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[ca>>2]=11917;c[ca+4>>2]=10740;c[ca+8>>2]=0;qe(Cc,Dc,10711,ca);c[ea>>2]=10740;c[ea+4>>2]=0;c[Rc>>2]=re(11917,ea)|0;Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[fa>>2]=11926;c[fa+4>>2]=0;me(Dc,Cc,0,fa);Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[ha>>2]=11931;c[ha+4>>2]=0;me(Cc,Dc,1,ha);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 22:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11935;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[ia>>2]=11939;c[ia+4>>2]=0;qe(Dc,Cc,10711,ia);c[ja>>2]=0;c[Rc>>2]=re(11939,ja)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[ka>>2]=11949;c[ka+4>>2]=0;me(Cc,Dc,0,ka);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 23:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11954;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[la>>2]=11958;c[la+4>>2]=10740;c[la+8>>2]=0;qe(Dc,Cc,10711,la);c[na>>2]=10740;c[na+4>>2]=0;c[Rc>>2]=re(11958,na)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[oa>>2]=11967;c[oa+4>>2]=11972;c[oa+8>>2]=0;me(Cc,Dc,0,oa);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 24:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11976;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[pa>>2]=11980;c[pa+4>>2]=10740;c[pa+8>>2]=0;qe(Cc,Dc,10711,pa);c[qa>>2]=10740;c[qa+4>>2]=0;c[Rc>>2]=re(11980,qa)|0;Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[ra>>2]=11989;c[ra+4>>2]=0;me(Dc,Cc,0,ra);Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[sa>>2]=11994;c[sa+4>>2]=0;me(Cc,Dc,1,sa);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 25:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=11999;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[ta>>2]=12014;c[ta+4>>2]=12023;c[ta+8>>2]=0;qe(Dc,Cc,10711,ta);c[ua>>2]=12023;c[ua+4>>2]=0;c[Rc>>2]=re(12014,ua)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[va>>2]=12033;c[va+4>>2]=12038;c[va+8>>2]=0;me(Cc,Dc,1,va);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 26:{Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[xa>>2]=0;se(Dc,Cc,12044,xa);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=10688;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[ya>>2]=12023;c[ya+4>>2]=0;qe(Cc,Dc,10711,ya);c[za>>2]=0;c[Rc>>2]=re(12023,za)|0;Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[Aa>>2]=12053;c[Aa+4>>2]=0;me(Dc,Cc,0,Aa);Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Ba>>2]=12058;c[Ba+4>>2]=12063;c[Ba+8>>2]=12068;c[Ba+12>>2]=12072;c[Ba+16>>2]=12077;c[Ba+20>>2]=12082;c[Ba+24>>2]=12087;c[Ba+28>>2]=12092;c[Ba+32>>2]=0;me(Cc,Dc,1,Ba);break}case 30:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12097;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ca>>2]=12115;c[Ca+4>>2]=12128;c[Ca+8>>2]=0;qe(Dc,Cc,10711,Ca);c[Ea>>2]=12128;c[Ea+4>>2]=0;c[Rc>>2]=re(12115,Ea)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Fa>>2]=12138;c[Fa+4>>2]=0;me(Cc,Dc,1,Fa);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 27:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12143;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ga>>2]=12168;c[Ga+4>>2]=0;qe(Cc,Dc,10711,Ga);c[Ia>>2]=0;c[Rc>>2]=re(12168,Ia)|0;break}case 28:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12176;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ja>>2]=12184;c[Ja+4>>2]=10934;c[Ja+8>>2]=0;qe(Dc,Cc,10711,Ja);c[Ka>>2]=10934;c[Ka+4>>2]=0;c[Rc>>2]=re(12184,Ka)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[La>>2]=11809;c[La+4>>2]=0;me(Cc,Dc,0,La);break}case 29:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12192;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ma>>2]=12211;c[Ma+4>>2]=0;qe(Dc,Cc,10711,Ma);c[Na>>2]=0;c[Rc>>2]=re(12211,Na)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Oa>>2]=12222;c[Oa+4>>2]=12227;c[Oa+8>>2]=0;me(Cc,Dc,1,Oa);break}case 31:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12232;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Pa>>2]=12301;c[Pa+4>>2]=0;qe(Cc,Dc,12244,Pa);c[Qa>>2]=0;c[Rc>>2]=re(12301,Qa)|0;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 32:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12309;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ra>>2]=12321;c[Ra+4>>2]=12329;c[Ra+8>>2]=10740;c[Ra+12>>2]=12115;c[Ra+16>>2]=12128;c[Ra+20>>2]=0;qe(Dc,Cc,10711,Ra);c[Sa>>2]=12329;c[Sa+4>>2]=10740;c[Sa+8>>2]=12115;c[Sa+12>>2]=12128;c[Sa+16>>2]=0;c[Rc>>2]=re(12321,Sa)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Ta>>2]=12338;c[Ta+4>>2]=12343;c[Ta+8>>2]=0;me(Cc,Dc,0,Ta);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 33:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12348;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ua>>2]=12351;c[Ua+4>>2]=10740;c[Ua+8>>2]=0;qe(Dc,Cc,10711,Ua);c[Va>>2]=10740;c[Va+4>>2]=0;c[Rc>>2]=re(12351,Va)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Wa>>2]=11972;c[Wa+4>>2]=0;me(Cc,Dc,0,Wa);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 34:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12359;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Xa>>2]=12372;c[Xa+4>>2]=0;qe(Cc,Dc,10711,Xa);c[Ya>>2]=0;c[Rc>>2]=re(12372,Ya)|0;break}case 35:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12382;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Za>>2]=12386;c[Za+4>>2]=12400;c[Za+8>>2]=0;qe(Dc,Cc,10711,Za);c[_a>>2]=12400;c[_a+4>>2]=0;c[Rc>>2]=re(12386,_a)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[$a>>2]=12411;c[$a+4>>2]=0;me(Cc,Dc,0,$a);break}case 36:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12416;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[ab>>2]=12431;c[ab+4>>2]=10740;c[ab+8>>2]=0;qe(Dc,Cc,10711,ab);c[bb>>2]=10740;c[bb+4>>2]=0;c[Rc>>2]=re(12431,bb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[cb>>2]=12439;c[cb+4>>2]=12444;c[cb+8>>2]=12449;c[cb+12>>2]=12454;c[cb+16>>2]=12459;c[cb+20>>2]=0;me(Cc,Dc,0,cb);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=0;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 37:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12466;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[db>>2]=12479;c[db+4>>2]=10740;c[db+8>>2]=0;qe(Dc,Cc,10711,db);c[fb>>2]=10740;c[fb+4>>2]=0;c[Rc>>2]=re(12479,fb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[gb>>2]=12488;c[gb+4>>2]=12493;c[gb+8>>2]=0;me(Cc,Dc,0,gb);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 38:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12498;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[hb>>2]=12510;c[hb+4>>2]=0;qe(Cc,Dc,10711,hb);c[ib>>2]=0;c[Rc>>2]=re(12510,ib)|0;break}case 39:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12516;Bc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;Dc=c[(c[Pc>>2]|0)+112>>2]|0;c[jb>>2]=14667;c[jb+4>>2]=12533;c[jb+8>>2]=17682;c[jb+12>>2]=Dc;c[jb+16>>2]=17682;c[jb+20>>2]=17682;c[jb+24>>2]=0;Dc=Ne(18016,jb)|0;c[kb>>2]=Le(mg(c[(c[Pc>>2]|0)+112>>2]|0)|0,12540)|0;c[kb+4>>2]=0;qe(Bc,Cc,Dc,kb);Dc=Le(mg(c[(c[Pc>>2]|0)+112>>2]|0)|0,12540)|0;c[lb>>2]=0;c[Rc>>2]=re(Dc,lb)|0;break}case 40:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12547;Bc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;Dc=c[(c[Pc>>2]|0)+112>>2]|0;c[mb>>2]=14667;c[mb+4>>2]=12533;c[mb+8>>2]=17682;c[mb+12>>2]=Dc;c[mb+16>>2]=17682;c[mb+20>>2]=17682;c[mb+24>>2]=0;Dc=Ne(18016,mb)|0;c[nb>>2]=Le(mg(c[(c[Pc>>2]|0)+112>>2]|0)|0,12540)|0;c[nb+4>>2]=0;qe(Bc,Cc,Dc,nb);Dc=Le(mg(c[(c[Pc>>2]|0)+112>>2]|0)|0,12540)|0;c[ob>>2]=0;c[Rc>>2]=re(Dc,ob)|0;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 41:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12566;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[qb>>2]=12577;c[qb+4>>2]=10740;c[qb+8>>2]=0;qe(Cc,Dc,10711,qb);c[rb>>2]=10740;c[rb+4>>2]=0;c[Rc>>2]=re(12577,rb)|0;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 42:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12587;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[sb>>2]=12591;c[sb+4>>2]=0;qe(Cc,Dc,10711,sb);c[tb>>2]=0;c[Rc>>2]=re(12591,tb)|0;Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[ub>>2]=12601;c[ub+4>>2]=0;me(Dc,Cc,0,ub);Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[vb>>2]=12606;c[vb+4>>2]=0;me(Cc,Dc,1,vb);break}case 43:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12610;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[wb>>2]=12615;c[wb+4>>2]=0;qe(Cc,Dc,10711,wb);c[xb>>2]=0;c[Rc>>2]=re(12615,xb)|0;Dc=c[Pc>>2]|0;Cc=c[Qc>>2]|0;c[yb>>2]=12626;c[yb+4>>2]=12601;c[yb+8>>2]=0;me(Dc,Cc,0,yb);Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[zb>>2]=12606;c[zb+4>>2]=0;me(Cc,Dc,1,zb);break}case 44:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12629;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Bb>>2]=12639;c[Bb+4>>2]=10740;c[Bb+8>>2]=0;qe(Dc,Cc,10711,Bb);c[Cb>>2]=10740;c[Cb+4>>2]=0;c[Rc>>2]=re(12639,Cb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Db>>2]=12648;c[Db+4>>2]=0;me(Cc,Dc,0,Db);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 45:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12653;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Eb>>2]=12664;c[Eb+4>>2]=10740;c[Eb+8>>2]=0;qe(Cc,Dc,10711,Eb);c[Fb>>2]=10740;c[Fb+4>>2]=0;c[Rc>>2]=re(12664,Fb)|0;break}case 46:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12674;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Gb>>2]=12699;c[Gb+4>>2]=10740;c[Gb+8>>2]=0;qe(Dc,Cc,10711,Gb);c[Hb>>2]=10740;c[Hb+4>>2]=0;c[Rc>>2]=re(12699,Hb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Jb>>2]=12708;c[Jb+4>>2]=0;me(Cc,Dc,0,Jb);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 47:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12713;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Kb>>2]=12728;c[Kb+4>>2]=10740;c[Kb+8>>2]=0;qe(Dc,Cc,10711,Kb);c[Lb>>2]=10740;c[Lb+4>>2]=0;c[Rc>>2]=re(12728,Lb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Mb>>2]=12742;c[Mb+4>>2]=12747;c[Mb+8>>2]=0;me(Cc,Dc,0,Mb);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2]=1;break}case 48:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12752;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Nb>>2]=12766;c[Nb+4>>2]=0;qe(Cc,Dc,10711,Nb);c[Ob>>2]=0;c[Rc>>2]=re(12766,Ob)|0;break}case 49:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12779;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Pb>>2]=12789;c[Pb+4>>2]=10740;c[Pb+8>>2]=0;qe(Dc,Cc,10711,Pb);c[Qb>>2]=10740;c[Qb+4>>2]=0;c[Rc>>2]=re(12789,Qb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Rb>>2]=12798;c[Rb+4>>2]=0;me(Cc,Dc,0,Rb);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 50:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12803;Cc=c[Pc>>2]|0;Dc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Sb>>2]=12816;c[Sb+4>>2]=0;qe(Cc,Dc,10711,Sb);c[Tb>>2]=0;c[Rc>>2]=re(12816,Tb)|0;break}case 51:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12829;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Ub>>2]=12833;c[Ub+4>>2]=0;qe(Dc,Cc,10711,Ub);c[Wb>>2]=0;c[Rc>>2]=re(12833,Wb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[Xb>>2]=12843;c[Xb+4>>2]=12848;c[Xb+8>>2]=12856;c[Xb+12>>2]=12861;c[Xb+16>>2]=12869;c[Xb+20>>2]=12877;c[Xb+24>>2]=12885;c[Xb+28>>2]=0;me(Cc,Dc,0,Xb);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 52:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12890;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[Yb>>2]=12909;c[Yb+4>>2]=0;qe(Dc,Cc,10711,Yb);c[Zb>>2]=0;c[Rc>>2]=re(12909,Zb)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[_b>>2]=12922;c[_b+4>>2]=0;me(Cc,Dc,0,_b);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 53:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12927;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[$b>>2]=12936;c[$b+4>>2]=0;qe(Dc,Cc,10711,$b);c[ac>>2]=0;c[Rc>>2]=re(12936,ac)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[bc>>2]=12948;c[bc+4>>2]=12953;c[bc+8>>2]=0;me(Cc,Dc,0,bc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 54:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12961;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[cc>>2]=12967;c[cc+4>>2]=10953;c[cc+8>>2]=10963;c[cc+12>>2]=0;qe(Dc,Cc,10711,cc);c[ec>>2]=10953;c[ec+4>>2]=10963;c[ec+8>>2]=0;c[Rc>>2]=re(12967,ec)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[fc>>2]=12979;c[fc+4>>2]=10970;c[fc+8>>2]=0;me(Cc,Dc,0,fc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 55:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=12986;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[gc>>2]=12992;c[gc+4>>2]=10979;c[gc+8>>2]=0;qe(Dc,Cc,10711,gc);c[hc>>2]=10979;c[hc+4>>2]=0;c[Rc>>2]=re(12992,hc)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[ic>>2]=13004;c[ic+4>>2]=10989;c[ic+8>>2]=0;me(Cc,Dc,0,ic);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 56:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=13011;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[jc>>2]=13062;c[jc+4>>2]=0;qe(Dc,Cc,13016,jc);c[kc>>2]=0;c[Rc>>2]=re(13062,kc)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[lc>>2]=13073;c[lc+4>>2]=13078;c[lc+8>>2]=0;me(Cc,Dc,0,lc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 57:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=13082;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[mc>>2]=13086;c[mc+4>>2]=0;qe(Dc,Cc,10711,mc);c[oc>>2]=0;c[Rc>>2]=re(13086,oc)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[pc>>2]=13096;c[pc+4>>2]=0;me(Cc,Dc,0,pc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}case 58:{c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2]=13101;Dc=c[Pc>>2]|0;Cc=(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)|0;c[qc>>2]=13108;c[qc+4>>2]=0;qe(Dc,Cc,10711,qc);c[rc>>2]=0;c[Rc>>2]=re(13108,rc)|0;Cc=c[Pc>>2]|0;Dc=c[Qc>>2]|0;c[sc>>2]=13121;c[sc+4>>2]=0;me(Cc,Dc,0,sc);c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2]=1;break}default:{Dc=c[665]|0;c[tc>>2]=c[(c[Pc>>2]|0)+104>>2];Ki(Dc,17544,tc)|0;Dc=c[665]|0;c[uc>>2]=c[Qc>>2];Ki(Dc,13129,uc)|0;Pi(17567,c[665]|0)|0;da(1)}}while(0);if(!(c[(c[Pc>>2]|0)+44>>2]&8)){Xc=c[Rc>>2]|0;ma=Yc;return Xc|0}if((c[Qc>>2]|0)==8)Pi(13165,c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;Dc=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+12>>2]|0;c[vc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)>>2];c[vc+4>>2]=Dc;Ki(a,13167,vc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;c[wc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+4>>2];Ki(a,13203,wc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;c[xc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+8>>2];Ki(a,13211,xc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+16>>2]|0)b=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+16>>2]|0;else b=13236;c[Ec>>2]=b;Ki(a,13243,Ec)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+20>>2]|0)b=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+20>>2]|0;else b=13236;c[Fc>>2]=b;Ki(a,13277,Fc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+24>>2]|0)b=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+24>>2]|0;else b=13236;c[Gc>>2]=b;Ki(a,13314,Gc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+28>>2]|0)b=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+28>>2]|0;else b=13236;c[Hc>>2]=b;Ki(a,13337,Hc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Hc=c[665]|0;c[Ic>>2]=c[Rc>>2];Ki(Hc,13363,Ic)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Pi(13393,c[665]|0)|0;Ai(c[665]|0)|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+32>>2]|0){c[Jc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+32>>2];while(1){if(c[Jc>>2]|0)b=(c[c[Jc>>2]>>2]|0)!=0;else b=0;a=c[665]|0;if(!b)break;c[Kc>>2]=c[c[Jc>>2]>>2];Ki(a,17678,Kc)|0;c[Jc>>2]=(c[Jc>>2]|0)+4}Ri(10,a)|0}else Pi(13414,c[665]|0)|0;Pi(17619,c[665]|0)|0;Pi(13423,c[665]|0)|0;Ai(c[665]|0)|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+36>>2]|0){c[Lc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+36>>2];while(1){if(c[Lc>>2]|0)b=(c[c[Lc>>2]>>2]|0)!=0;else b=0;a=c[665]|0;if(!b)break;c[Mc>>2]=c[c[Lc>>2]>>2];Ki(a,17678,Mc)|0;c[Lc>>2]=(c[Lc>>2]|0)+4}Ri(10,a)|0}else Pi(13414,c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;c[Nc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+40>>2];Ki(a,13442,Nc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;a=c[665]|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+44>>2]|0)b=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+44>>2]|0;else b=13236;c[Oc>>2]=b;Ki(a,13474,Oc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Pi(13509,c[665]|0)|0;Ai(c[665]|0)|0;if(c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+52>>2]|0){c[Sc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+52>>2];while(1){a=c[665]|0;if(!(c[c[Sc>>2]>>2]|0))break;c[Tc>>2]=c[c[Sc>>2]>>2];Ki(a,17678,Tc)|0;c[Sc>>2]=(c[Sc>>2]|0)+4}Ri(10,a)|0}else Pi(13414,c[665]|0)|0;Pi(17619,c[665]|0)|0;Tc=c[665]|0;c[Uc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+56>>2];Ki(Tc,13540,Uc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Uc=c[665]|0;c[Vc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+60>>2];Ki(Uc,13564,Vc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Vc=c[665]|0;c[Wc>>2]=c[(c[Pc>>2]|0)+132+((c[Qc>>2]|0)*68|0)+64>>2];Ki(Vc,13593,Wc)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Wc=c[665]|0;c[Xc>>2]=c[Qc>>2];Ki(Wc,13627,Xc)|0;Ai(c[665]|0)|0;Xc=c[Rc>>2]|0;ma=Yc;return Xc|0}function qe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;q=ma;ma=ma+64|0;k=q+52|0;l=q+48|0;r=q+44|0;m=q+40|0;n=q+36|0;o=q+32|0;p=q+28|0;g=q;h=q+24|0;i=q+20|0;j=q+16|0;c[k>>2]=b;c[l>>2]=d;c[r>>2]=e;c[n>>2]=0;c[o>>2]=0;c[(c[l>>2]|0)+28>>2]=c[r>>2];c[g>>2]=f;do{f=(c[g>>2]|0)+(4-1)&~(4-1);r=c[f>>2]|0;c[g>>2]=f+4;c[h>>2]=r;r=c[h>>2]|0;c[m>>2]=r;if(!r)break;do if(!(c[o>>2]|0)){c[i>>2]=Me(c[m>>2]|0,18016,c[(c[k>>2]|0)+112>>2]|0)|0;c[n>>2]=fa(c[i>>2]|0)|0;if(c[n>>2]|0?a[c[n>>2]>>0]|0:0){c[o>>2]=c[i>>2];break}Yg(c[i>>2]|0);c[i>>2]=Me(c[m>>2]|0,17173,c[(c[k>>2]|0)+112>>2]|0)|0;c[n>>2]=fa(c[i>>2]|0)|0;if(c[n>>2]|0?a[c[n>>2]>>0]|0:0){c[o>>2]=c[i>>2];break}Yg(c[i>>2]|0);c[n>>2]=fa(c[m>>2]|0)|0;if(c[n>>2]|0?a[c[n>>2]>>0]|0:0)c[o>>2]=c[m>>2]}while(0);if((c[(c[l>>2]|0)+24>>2]|0)==0?(c[l>>2]|0)!=((c[k>>2]|0)+132+544|0):0){r=Ie(c[k>>2]|0,c[m>>2]|0)|0;c[(c[l>>2]|0)+24>>2]=r}}while(!(c[o>>2]|0?c[(c[l>>2]|0)+24>>2]|0:0));c[(c[l>>2]|0)+8>>2]=c[(c[l>>2]|0)+28>>2];r=Cg(c[(c[l>>2]|0)+8>>2]|0)|0;c[(c[l>>2]|0)+4>>2]=r;c[(c[l>>2]|0)+12>>2]=13656;if(c[(c[l>>2]|0)+24>>2]|0){c[(c[l>>2]|0)+8>>2]=c[(c[l>>2]|0)+24>>2];c[p>>2]=c[(c[l>>2]|0)+4>>2];r=wf(c[k>>2]|0,c[(c[l>>2]|0)+24>>2]|0,c[(c[l>>2]|0)+4>>2]|0)|0;c[(c[l>>2]|0)+4>>2]=r;Yg(c[p>>2]|0);c[(c[l>>2]|0)+12>>2]=14070}if(c[(c[l>>2]|0)+20>>2]|0){c[(c[l>>2]|0)+8>>2]=c[(c[l>>2]|0)+20>>2];c[p>>2]=c[(c[l>>2]|0)+4>>2];r=wf(c[k>>2]|0,c[(c[l>>2]|0)+20>>2]|0,c[(c[l>>2]|0)+4>>2]|0)|0;c[(c[l>>2]|0)+4>>2]=r;Yg(c[p>>2]|0);c[(c[l>>2]|0)+12>>2]=13677}if(c[o>>2]|0){c[n>>2]=Cg(c[n>>2]|0)|0;c[j>>2]=c[n>>2];while(1){if(!(a[c[j>>2]>>0]|0))break;if((a[c[j>>2]>>0]|0)==59)a[c[j>>2]>>0]=58;c[j>>2]=(c[j>>2]|0)+1}if(c[n>>2]|0){c[(c[l>>2]|0)+8>>2]=c[n>>2];c[p>>2]=c[(c[l>>2]|0)+4>>2];r=wf(c[k>>2]|0,c[n>>2]|0,c[(c[l>>2]|0)+4>>2]|0)|0;c[(c[l>>2]|0)+4>>2]=r;Yg(c[p>>2]|0);r=Le(c[o>>2]|0,13697)|0;c[(c[l>>2]|0)+12>>2]=r}}if(!(c[(c[l>>2]|0)+16>>2]|0)){r=c[l>>2]|0;r=r+4|0;r=c[r>>2]|0;c[p>>2]=r;r=c[k>>2]|0;f=c[l>>2]|0;f=f+4|0;f=c[f>>2]|0;f=cf(r,f)|0;r=c[l>>2]|0;r=r+4|0;c[r>>2]=f;r=c[p>>2]|0;Yg(r);ma=q;return}c[(c[l>>2]|0)+8>>2]=c[(c[l>>2]|0)+16>>2];c[p>>2]=c[(c[l>>2]|0)+4>>2];r=wf(c[k>>2]|0,c[(c[l>>2]|0)+16>>2]|0,c[(c[l>>2]|0)+4>>2]|0)|0;c[(c[l>>2]|0)+4>>2]=r;Yg(c[p>>2]|0);c[(c[l>>2]|0)+12>>2]=13719;r=c[l>>2]|0;r=r+4|0;r=c[r>>2]|0;c[p>>2]=r;r=c[k>>2]|0;f=c[l>>2]|0;f=f+4|0;f=c[f>>2]|0;f=cf(r,f)|0;r=c[l>>2]|0;r=r+4|0;c[r>>2]=f;r=c[p>>2]|0;Yg(r);ma=q;return}function re(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+48|0;d=k+36|0;e=k+32|0;f=k+28|0;g=k+24|0;h=k;i=k+20|0;j=k+16|0;c[e>>2]=a;if(!(c[e>>2]|0)){c[d>>2]=0;b=c[d>>2]|0;ma=k;return b|0}c[g>>2]=Cg(c[e>>2]|0)|0;c[h>>2]=b;while(1){e=(c[h>>2]|0)+(4-1)&~(4-1);b=c[e>>2]|0;c[h>>2]=e+4;c[i>>2]=b;b=c[i>>2]|0;c[f>>2]=b;if(!b)break;c[j>>2]=Me(c[g>>2]|0,15597,c[f>>2]|0)|0;Yg(c[g>>2]|0);c[g>>2]=c[j>>2]}c[d>>2]=c[g>>2];b=c[d>>2]|0;ma=k;return b|0}function se(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=ma;ma=ma+64|0;j=q+48|0;k=q+44|0;l=q+40|0;m=q+36|0;n=q+32|0;o=q+28|0;p=q+24|0;g=q+20|0;h=q;i=q+16|0;c[j>>2]=b;c[k>>2]=d;c[l>>2]=e;c[m>>2]=(c[j>>2]|0)+132+((c[k>>2]|0)*68|0);if(c[(c[m>>2]|0)+44>>2]|0)b=c[(c[m>>2]|0)+44>>2]|0;else b=c[l>>2]|0;c[n>>2]=b;c[o>>2]=mg(c[n>>2]|0)|0;c[p>>2]=ng(c[j>>2]|0,c[o>>2]|0)|0;c[(c[m>>2]|0)+44>>2]=c[n>>2];c[(c[m>>2]|0)+48>>2]=0;e=yg(8)|0;c[(c[m>>2]|0)+52>>2]=e;e=c[l>>2]|0;l=c[(c[m>>2]|0)+52>>2]|0;d=(c[m>>2]|0)+48|0;n=c[d>>2]|0;c[d>>2]=n+1;c[l+(n<<2)>>2]=e;c[h>>2]=f;while(1){n=(c[h>>2]|0)+(4-1)&~(4-1);f=c[n>>2]|0;c[h>>2]=n+4;c[i>>2]=f;f=c[i>>2]|0;c[g>>2]=f;if(!f)break;f=(c[m>>2]|0)+48|0;c[f>>2]=(c[f>>2]|0)+1;f=Bg(c[(c[m>>2]|0)+52>>2]|0,(c[(c[m>>2]|0)+48>>2]|0)+1<<2)|0;c[(c[m>>2]|0)+52>>2]=f;c[(c[(c[m>>2]|0)+52>>2]|0)+((c[(c[m>>2]|0)+48>>2]|0)-1<<2)>>2]=c[g>>2]}c[(c[(c[m>>2]|0)+52>>2]|0)+(c[(c[m>>2]|0)+48>>2]<<2)>>2]=0;if(!(c[p>>2]|0)){f=c[o>>2]|0;Yg(f);ma=q;return}if(!(a[c[p>>2]>>0]|0)){f=c[o>>2]|0;Yg(f);ma=q;return}le(c[j>>2]|0,c[k>>2]|0,(a[c[p>>2]>>0]|0)==49&1,3);f=c[o>>2]|0;Yg(f);ma=q;return}function te(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;h=ma;ma=ma+32|0;i=h+16|0;d=h+12|0;e=h+8|0;f=h+4|0;g=h;c[i>>2]=b;c[d>>2]=yg(($h(c[i>>2]|0)|0)+1|0)|0;c[e>>2]=c[d>>2];c[f>>2]=c[i>>2];c[g>>2]=1;while(1){if(!(a[c[f>>2]>>0]|0))break;if(((c[g>>2]|0?a[c[f>>2]>>0]|0:0)?(a[c[f>>2]>>0]|0)==33:0)?(a[(c[f>>2]|0)+1>>0]|0)==33:0)c[f>>2]=(c[f>>2]|0)+2;else{c[g>>2]=(a[c[f>>2]>>0]|0)==58&1;b=c[f>>2]|0;c[f>>2]=b+1;b=a[b>>0]|0;i=c[e>>2]|0;c[e>>2]=i+1;a[i>>0]=b}}a[c[e>>2]>>0]=0;ma=h;return c[d>>2]|0}function ue(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;g=ma;ma=ma+32|0;l=g+20|0;k=g+16|0;j=g+12|0;i=g+8|0;h=g+4|0;f=g;c[l>>2]=a;c[k>>2]=b;c[j>>2]=d;c[i>>2]=e;c[h>>2]=ve(c[l>>2]|0,c[k>>2]|0,c[j>>2]|0,c[i>>2]|0,0)|0;c[f>>2]=c[c[h>>2]>>2];Yg(c[h>>2]|0);ma=g;return c[f>>2]|0}function ve(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;B=ma;ma=ma+96|0;j=B;y=B+80|0;i=B+76|0;z=B+72|0;A=B+68|0;s=B+64|0;u=B+60|0;v=B+56|0;l=B+52|0;w=B+48|0;m=B+44|0;n=B+40|0;o=B+36|0;p=B+32|0;q=B+28|0;x=B+24|0;h=B+20|0;k=B+16|0;r=B+12|0;c[y>>2]=b;c[i>>2]=d;c[z>>2]=e;c[A>>2]=f;c[s>>2]=g;c[m>>2]=0;c[n>>2]=0;c[o>>2]=0;c[p>>2]=0;if((c[z>>2]|0)==3|(c[z>>2]|0)==0|(c[z>>2]|0)==1)b=1;else b=(c[z>>2]|0)==20;c[q>>2]=b&1;c[x>>2]=0;if(!(c[i>>2]|0))C(13749,13760,1036,13818);if(!(c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+4>>2]|0))oe(c[y>>2]|0,c[z>>2]|0)|0;if(c[(c[y>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;g=c[665]|0;e=c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)>>2]|0;f=c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+12>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=e;c[j+8>>2]=f;Ki(g,13845,j)|0;Ai(c[665]|0)|0}c[v>>2]=bf(c[y>>2]|0,c[i>>2]|0)|0;c[o>>2]=ni(c[v>>2]|0,46)|0;if(c[o>>2]|0?(c[h>>2]=bi(c[o>>2]|0,47)|0,c[h>>2]|0):0)c[o>>2]=0;c[m>>2]=$h(c[v>>2]|0)|0;a:do if(c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+32>>2]|0){c[l>>2]=c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+32>>2];while(1){if(c[n>>2]|0)break a;if(!(c[c[l>>2]>>2]|0))break a;c[k>>2]=$h(c[c[l>>2]>>2]|0)|0;if(((c[m>>2]|0)>>>0>=(c[k>>2]|0)>>>0?c[c[l>>2]>>2]|0:0)?(c[v>>2]|0)+(c[m>>2]|0)+(0-(c[k>>2]|0))|0:0)b=(Ph(c[c[l>>2]>>2]|0,(c[v>>2]|0)+(c[m>>2]|0)+(0-(c[k>>2]|0))|0)|0)==0;else b=0;c[n>>2]=b&1;c[l>>2]=(c[l>>2]|0)+4}}while(0);b:do if((c[n>>2]|0)==0?c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+36>>2]|0:0){c[l>>2]=c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+36>>2];while(1){if(c[n>>2]|0)break b;if(!(c[c[l>>2]>>2]|0))break b;c[r>>2]=$h(c[c[l>>2]>>2]|0)|0;if(((c[m>>2]|0)>>>0>=(c[r>>2]|0)>>>0?c[c[l>>2]>>2]|0:0)?(c[v>>2]|0)+(c[m>>2]|0)+(0-(c[r>>2]|0))|0:0)b=(Ph(c[c[l>>2]>>2]|0,(c[v>>2]|0)+(c[m>>2]|0)+(0-(c[r>>2]|0))|0)|0)==0;else b=0;c[n>>2]=b&1;c[l>>2]=(c[l>>2]|0)+4}}while(0);c[w>>2]=0;c[u>>2]=yg(4)|0;c[p>>2]=ng(c[y>>2]|0,13900)|0;do if(c[o>>2]|0){if(((c[p>>2]|0?a[c[p>>2]>>0]|0:0)?(a[c[p>>2]>>0]|0)!=102:0)?(a[c[p>>2]>>0]|0)!=48:0){t=37;break}we(c[y>>2]|0,u,w,c[z>>2]|0,c[v>>2]|0,c[q>>2]|0,c[n>>2]|0,c[o>>2]|0);xe(c[y>>2]|0,u,w,c[z>>2]|0,c[v>>2]|0,c[q>>2]|0,c[n>>2]|0)}else t=37;while(0);if((t|0)==37){xe(c[y>>2]|0,u,w,c[z>>2]|0,c[v>>2]|0,c[q>>2]|0,c[n>>2]|0);we(c[y>>2]|0,u,w,c[z>>2]|0,c[v>>2]|0,c[q>>2]|0,c[n>>2]|0,c[o>>2]|0)}c[(c[u>>2]|0)+(c[w>>2]<<2)>>2]=0;if(c[p>>2]|0)Yg(c[p>>2]|0);c[x>>2]=Bf(c[y>>2]|0,c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+4>>2]|0,c[u>>2]|0,0,c[s>>2]|0)|0;if(c[A>>2]|0?(c[c[x>>2]>>2]|0)==0:0){c[w>>2]=0;while(1){if(!(c[(c[u>>2]|0)+(c[w>>2]<<2)>>2]|0))break;Yg(c[(c[u>>2]|0)+(c[w>>2]<<2)>>2]|0);c[w>>2]=(c[w>>2]|0)+1}c[w>>2]=0;c:do if((c[n>>2]|0)==0?c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+40>>2]|0:0){c[l>>2]=c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+32>>2];while(1){if(!(c[c[l>>2]>>2]|0))break c;q=Le(c[v>>2]|0,c[c[l>>2]>>2]|0)|0;r=c[u>>2]|0;t=c[w>>2]|0;c[w>>2]=t+1;c[r+(t<<2)>>2]=q;c[l>>2]=(c[l>>2]|0)+4}}while(0);if(!(!(c[n>>2]|0)?(c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+40>>2]|0)!=0:0)){q=Cg(c[v>>2]|0)|0;r=c[u>>2]|0;t=c[w>>2]|0;c[w>>2]=t+1;c[r+(t<<2)>>2]=q}c[(c[u>>2]|0)+(c[w>>2]<<2)>>2]=0;c[x>>2]=Bf(c[y>>2]|0,c[(c[y>>2]|0)+132+((c[z>>2]|0)*68|0)+4>>2]|0,c[u>>2]|0,1,c[s>>2]|0)|0}c[w>>2]=0;while(1){b=c[u>>2]|0;if(!(c[(c[u>>2]|0)+(c[w>>2]<<2)>>2]|0))break;Yg(c[b+(c[w>>2]<<2)>>2]|0);c[w>>2]=(c[w>>2]|0)+1}Yg(b);if(!(c[A>>2]|0?(c[c[x>>2]>>2]|0)==0:0)){A=c[v>>2]|0;Yg(A);A=c[x>>2]|0;ma=B;return A|0}c[x>>2]=yg(8)|0;A=hg(c[y>>2]|0,c[z>>2]|0,c[v>>2]|0)|0;c[c[x>>2]>>2]=A;if(!(c[c[x>>2]>>2]|0)){A=c[v>>2]|0;Yg(A);A=c[x>>2]|0;ma=B;return A|0}c[(c[x>>2]|0)+4>>2]=0;A=c[v>>2]|0;Yg(A);A=c[x>>2]|0;ma=B;return A|0}function we(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;o=ma;ma=ma+32|0;m=o+28|0;n=o+24|0;j=o+20|0;p=o+16|0;k=o+12|0;l=o+8|0;q=o+4|0;c[m>>2]=a;c[n>>2]=b;c[j>>2]=d;c[p>>2]=e;c[k>>2]=f;c[l>>2]=g;c[q>>2]=h;c[o>>2]=i;if((c[q>>2]|0)==0?c[(c[m>>2]|0)+132+((c[p>>2]|0)*68|0)+40>>2]|0:0){ma=o;return}q=Cg(c[k>>2]|0)|0;c[(c[c[n>>2]>>2]|0)+(c[c[j>>2]>>2]<<2)>>2]=q;q=c[j>>2]|0;c[q>>2]=(c[q>>2]|0)+1;q=Bg(c[c[n>>2]>>2]|0,(c[c[j>>2]>>2]|0)+1<<2)|0;c[c[n>>2]>>2]=q;if(!(c[l>>2]|0)){ma=o;return}ye(c[m>>2]|0,c[n>>2]|0,c[j>>2]|0,c[k>>2]|0);ma=o;return}function xe(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;q=ma;ma=ma+48|0;n=q+32|0;o=q+28|0;p=q+24|0;i=q+20|0;j=q+16|0;k=q+12|0;r=q+8|0;l=q+4|0;m=q;c[n>>2]=a;c[o>>2]=b;c[p>>2]=d;c[i>>2]=e;c[j>>2]=f;c[k>>2]=g;c[r>>2]=h;if(c[r>>2]|0){ma=q;return}if(!(c[(c[n>>2]|0)+132+((c[i>>2]|0)*68|0)+32>>2]|0)){ma=q;return}c[l>>2]=c[(c[n>>2]|0)+132+((c[i>>2]|0)*68|0)+32>>2];while(1){if(!(c[c[l>>2]>>2]|0))break;c[m>>2]=Le(c[j>>2]|0,c[c[l>>2]>>2]|0)|0;c[(c[c[o>>2]>>2]|0)+(c[c[p>>2]>>2]<<2)>>2]=c[m>>2];r=c[p>>2]|0;c[r>>2]=(c[r>>2]|0)+1;r=Bg(c[c[o>>2]>>2]|0,(c[c[p>>2]>>2]|0)+1<<2)|0;c[c[o>>2]>>2]=r;if(c[k>>2]|0)ye(c[n>>2]|0,c[o>>2]|0,c[p>>2]|0,c[m>>2]|0);c[l>>2]=(c[l>>2]|0)+4}ma=q;return}function ye(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;j=ma;ma=ma+32|0;l=j+20|0;f=j+16|0;g=j+12|0;k=j+8|0;h=j+4|0;i=j;c[l>>2]=a;c[f>>2]=b;c[g>>2]=d;c[k>>2]=e;c[h>>2]=kf(c[l>>2]|0,c[k>>2]|0)|0;if(!(c[h>>2]|0)){ma=j;return}while(1){l=c[h>>2]|0;c[h>>2]=l+4;l=c[l>>2]|0;c[i>>2]=l;if(!l)break;l=Cg(c[i>>2]|0)|0;c[(c[c[f>>2]>>2]|0)+(c[c[g>>2]>>2]<<2)>>2]=l;l=c[g>>2]|0;c[l>>2]=(c[l>>2]|0)+1;l=Bg(c[c[f>>2]>>2]|0,(c[c[g>>2]>>2]|0)+1<<2)|0;c[c[f>>2]>>2]=l}ma=j;return}function ze(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=ma;ma=ma+16|0;h=e+8|0;g=e+4|0;f=e;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;d=ue(30292,c[h>>2]|0,c[g>>2]|0,c[f>>2]|0)|0;ma=e;return d|0}function Ae(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=ma;ma=ma+80|0;u=w;q=w+64|0;r=w+60|0;s=w+56|0;t=w+52|0;i=w+48|0;j=w+44|0;k=w+40|0;l=w+36|0;m=w+32|0;n=w+28|0;o=w+24|0;p=w+20|0;c[r>>2]=b;c[s>>2]=d;c[t>>2]=e;c[i>>2]=f;c[j>>2]=g;c[k>>2]=h;c[l>>2]=ng(c[r>>2]|0,c[t>>2]|0)|0;if(!(c[l>>2]|0))c[l>>2]=c[i>>2];if(((a[c[l>>2]>>0]|0)!=97?(a[c[l>>2]>>0]|0)!=121:0)?(a[c[l>>2]>>0]|0)!=49:0){c[n>>2]=c[s>>2];a:while(1){h=bi(c[n>>2]|0,46)|0;c[m>>2]=h;if(!h){v=17;break}if(!((c[m>>2]|0)!=(c[s>>2]|0)?(a[(c[m>>2]|0)+-1>>0]|0)!=47:0))v=11;do if((v|0)==11?(v=0,(a[(c[m>>2]|0)+1>>0]|0)!=47):0){if((a[(c[m>>2]|0)+1>>0]|0)==46?(a[(c[m>>2]|0)+2>>0]|0)==47:0)break;if(!(c[m>>2]|0))break a;if(Ph(c[m>>2]|0,12053)|0)break a}while(0);c[n>>2]=(c[m>>2]|0)+1}b:do if((v|0)==17){if(((a[c[l>>2]>>0]|0)!=114?(a[c[l>>2]>>0]|0)!=110:0)?(a[c[l>>2]>>0]|0)!=48:0){if(Ge(c[r>>2]|0,c[s>>2]|0,0)|0){c[o>>2]=ng(c[r>>2]|0,16709)|0;if(!(c[o>>2]|0))break;if(!(a[c[o>>2]>>0]|0))break;v=c[s>>2]|0;if((v|0)!=(qi(c[s>>2]|0,c[o>>2]|0)|0))break;v=c[s>>2]|0;if((a[v+($h(c[o>>2]|0)|0)>>0]|0)!=47)break}if(((a[c[s>>2]>>0]|0)==46?(a[(c[s>>2]|0)+1>>0]|0)==46:0)?(a[(c[s>>2]|0)+2>>0]|0)==47:0)break;c[p>>2]=qi(c[s>>2]|0,15862)|0;while(1){if(!(c[p>>2]|0))break;if((a[(c[p>>2]|0)+2>>0]|0)==47?(a[(c[p>>2]|0)+-1>>0]|0)==47:0)break b;c[p>>2]=qi((c[p>>2]|0)+2|0,15862)|0}c[q>>2]=1;v=c[q>>2]|0;ma=w;return v|0}c[q>>2]=1;v=c[q>>2]|0;ma=w;return v|0}while(0);if(!(c[k>>2]|0)){v=c[665]|0;g=c[2640+(c[j>>2]<<2)>>2]|0;h=c[s>>2]|0;s=c[t>>2]|0;t=c[l>>2]|0;c[u>>2]=c[(c[r>>2]|0)+104>>2];c[u+4>>2]=g;c[u+8>>2]=h;c[u+12>>2]=s;c[u+16>>2]=t;Ki(v,13935,u)|0}c[q>>2]=0;v=c[q>>2]|0;ma=w;return v|0}c[q>>2]=1;v=c[q>>2]|0;ma=w;return v|0}function Be(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[f>>2]=a;c[e>>2]=b;b=Ae(c[f>>2]|0,c[e>>2]|0,13924,16131,0,0)|0;ma=d;return b|0}function Ce(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=ma;ma=ma+16|0;h=e+8|0;g=e+4|0;f=e;c[h>>2]=a;c[g>>2]=b;c[f>>2]=d;d=Ae(c[h>>2]|0,c[g>>2]|0,13986,13998,1,c[f>>2]|0)|0;ma=e;return d|0}function De(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[f>>2]=a;c[e>>2]=b;b=Ce(c[f>>2]|0,c[e>>2]|0,0)|0;ma=d;return b|0}function Ee(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;a=Be(30292,c[d>>2]|0)|0;ma=b;return a|0}function Fe(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;a=De(30292,c[d>>2]|0)|0;ma=b;return a|0}function Ge(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+32|0;f=i+12|0;j=i+8|0;g=i+4|0;h=i;c[i+16>>2]=b;c[f>>2]=d;c[j>>2]=e;c[g>>2]=(a[c[f>>2]>>0]|0)==47&1;if(c[j>>2]|0?(a[c[f>>2]>>0]|0)==46:0)if((a[(c[f>>2]|0)+1>>0]|0)!=47)if((a[(c[f>>2]|0)+1>>0]|0)==46)b=(a[(c[f>>2]|0)+2>>0]|0)==47;else b=0;else b=1;else b=0;c[h>>2]=b&1;ma=i;return (c[g>>2]|0?1:(c[h>>2]|0)!=0)&1|0}function He(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[f>>2]=a;c[e>>2]=b;b=Ge(30292,c[f>>2]|0,c[e>>2]|0)|0;ma=d;return b|0}function Ie(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;d=k+24|0;e=k+20|0;f=k+16|0;g=k+12|0;h=k+8|0;i=k+4|0;j=k;c[f>>2]=a;c[g>>2]=b;if(c[(c[f>>2]|0)+16>>2]|0){c[e>>2]=0;j=c[e>>2]|0;ma=k;return j|0}if(!(c[(c[f>>2]|0)+8+4>>2]|0)){c[(c[f>>2]|0)+16>>2]=1;Je(c[f>>2]|0);c[(c[f>>2]|0)+16>>2]=0;Pe(c[f>>2]|0)}if(!(c[(c[f>>2]|0)+112>>2]|0))C(17077,14e3,279,14053);c[h>>2]=Me(c[g>>2]|0,18016,c[(c[f>>2]|0)+112>>2]|0)|0;a=(c[f>>2]|0)+8|0;b=c[h>>2]|0;c[d>>2]=c[a>>2];c[d+4>>2]=c[a+4>>2];c[j>>2]=tf(d,b)|0;Yg(c[h>>2]|0);do if(!(c[j>>2]|0)){f=(c[f>>2]|0)+8|0;h=c[g>>2]|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[j>>2]=tf(d,h)|0;if(c[j>>2]|0){c[i>>2]=c[c[j>>2]>>2];Yg(c[j>>2]|0);break}else{c[i>>2]=0;break}}else{c[i>>2]=c[c[j>>2]>>2];Yg(c[j>>2]|0)}while(0);c[e>>2]=c[i>>2];j=c[e>>2]|0;ma=k;return j|0}function Je(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;t=ma;ma=ma+96|0;r=t+24|0;s=t+8|0;q=t;e=t+84|0;j=t+80|0;k=t+76|0;l=t+72|0;u=t+64|0;m=t+56|0;n=t+52|0;o=t+48|0;p=t+44|0;f=t+40|0;g=t+36|0;h=t+32|0;i=t+28|0;c[e>>2]=b;c[l>>2]=oe(c[e>>2]|0,8)|0;b=(c[e>>2]|0)+8|0;of(u,751);c[b>>2]=c[u>>2];c[b+4>>2]=c[u+4>>2];c[j>>2]=Mf(c[e>>2]|0,c[l>>2]|0,14070)|0;if(c[j>>2]|0?c[c[j>>2]>>2]|0:0){c[k>>2]=c[j>>2];while(1){if(!(c[c[k>>2]>>2]|0))break;c[o>>2]=0;c[p>>2]=vg(c[c[k>>2]>>2]|0,14717)|0;if(c[c[e>>2]>>2]|0)ua[c[c[e>>2]>>2]&3](c[c[k>>2]>>2]|0);while(1){u=xf(c[p>>2]|0)|0;c[m>>2]=u;if(!u)break;c[o>>2]=(c[o>>2]|0)+1;c[f>>2]=$h(c[m>>2]|0)|0;while(1){if((c[f>>2]|0)>>>0<=0)break;if((a[(c[m>>2]|0)+((c[f>>2]|0)-1)>>0]|0)>>>0>=128)break;if(!(ci(d[(c[m>>2]|0)+((c[f>>2]|0)-1)>>0]|0)|0))break;a[(c[m>>2]|0)+((c[f>>2]|0)-1)>>0]=0;c[f>>2]=(c[f>>2]|0)+-1}while(1){if((c[f>>2]|0)>>>0<=0)break;if((a[(c[m>>2]|0)+((c[f>>2]|0)-1)>>0]|0)!=92)break;c[g>>2]=xf(c[p>>2]|0)|0;c[o>>2]=(c[o>>2]|0)+1;a[(c[m>>2]|0)+((c[f>>2]|0)-1)>>0]=0;if(c[g>>2]|0){c[h>>2]=Le(c[m>>2]|0,c[g>>2]|0)|0;Yg(c[m>>2]|0);c[m>>2]=c[h>>2];c[f>>2]=$h(c[m>>2]|0)|0}else{Pi(17200,c[665]|0)|0;u=c[665]|0;r=c[o>>2]|0;c[q>>2]=c[c[k>>2]>>2];c[q+4>>2]=r;Ki(u,14080,q)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0}}c[n>>2]=Ke(c[e>>2]|0,c[m>>2]|0)|0;if(c[n>>2]|0){Pi(17200,c[665]|0)|0;u=c[665]|0;i=c[o>>2]|0;l=c[n>>2]|0;r=c[m>>2]|0;c[s>>2]=c[c[k>>2]>>2];c[s+4>>2]=i;c[s+8>>2]=l;c[s+12>>2]=r;Ki(u,14128,s)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0}Yg(c[m>>2]|0)}wg(c[p>>2]|0,c[c[k>>2]>>2]|0);Yg(c[c[k>>2]>>2]|0);c[k>>2]=(c[k>>2]|0)+4}Yg(c[j>>2]|0);ma=t;return}c[i>>2]=fa(14161)|0;if((c[i>>2]|0)!=0&(c[i>>2]|0)!=0?(Ph(c[i>>2]|0,14178)|0)==0:0){ma=t;return}Pi(17200,c[665]|0)|0;u=c[665]|0;c[r>>2]=c[l>>2];Ki(u,14180,r)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;ma=t;return}function Ke(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=ma;ma=ma+48|0;j=q+36|0;k=q+32|0;g=q+28|0;l=q+24|0;m=q+20|0;n=q+16|0;o=q+12|0;p=q+8|0;h=q+4|0;i=q;c[k>>2]=b;c[g>>2]=e;c[p>>2]=0;while(1){if(a[c[g>>2]>>0]|0?(a[c[g>>2]>>0]|0)>>>0<128:0)e=(ci(d[c[g>>2]>>0]|0)|0)!=0;else e=0;b=c[g>>2]|0;if(!e)break;c[g>>2]=b+1}if((a[b>>0]|0?(a[c[g>>2]>>0]|0)!=37:0)?(a[c[g>>2]>>0]|0)!=35:0){e=c[g>>2]|0;c[n>>2]=e+($h(c[g>>2]|0)|0)+-1;while(1){if((c[n>>2]|0)>>>0<=(c[g>>2]|0)>>>0)break;if(!((a[c[n>>2]>>0]|0)!=37?(a[c[n>>2]>>0]|0)!=35:0))f=15;a:do if((f|0)==15){f=0;c[n>>2]=(c[n>>2]|0)+-1;while(1){if((a[c[n>>2]>>0]|0)>>>0>=128)break a;if(!(ci(d[c[n>>2]>>0]|0)|0))break a;e=c[n>>2]|0;c[n>>2]=e+-1;a[e>>0]=0}}while(0);c[n>>2]=(c[n>>2]|0)+-1}c[m>>2]=c[g>>2];while(1){do if(a[c[g>>2]>>0]|0){if((a[c[g>>2]>>0]|0)>>>0<128?ci(d[c[g>>2]>>0]|0)|0:0){b=0;break}if((a[c[g>>2]>>0]|0)!=61)b=(a[c[g>>2]>>0]|0)!=46;else b=0}else b=0;while(0);e=c[g>>2]|0;if(!b)break;c[g>>2]=e+1}c[l>>2]=e-(c[m>>2]|0);if(!(c[l>>2]|0)){c[j>>2]=14254;p=c[j>>2]|0;ma=q;return p|0}c[o>>2]=yg((c[l>>2]|0)+1|0)|0;vi(c[o>>2]|0,c[m>>2]|0,c[l>>2]|0)|0;a[(c[o>>2]|0)+(c[l>>2]|0)>>0]=0;while(1){if(a[c[g>>2]>>0]|0?(a[c[g>>2]>>0]|0)>>>0<128:0)e=(ci(d[c[g>>2]>>0]|0)|0)!=0;else e=0;b=c[g>>2]|0;if(!e)break;c[g>>2]=b+1}if((a[b>>0]|0)==46){c[g>>2]=(c[g>>2]|0)+1;while(1){if((a[c[g>>2]>>0]|0)>>>0<128)e=(ci(d[c[g>>2]>>0]|0)|0)!=0;else e=0;b=c[g>>2]|0;if(!e)break;c[g>>2]=b+1}c[m>>2]=b;while(1){do if(a[c[g>>2]>>0]|0){if((a[c[g>>2]>>0]|0)>>>0<128?ci(d[c[g>>2]>>0]|0)|0:0){e=0;break}e=(a[c[g>>2]>>0]|0)!=61}else e=0;while(0);b=c[g>>2]|0;if(!e)break;c[g>>2]=b+1}c[l>>2]=b-(c[m>>2]|0);c[p>>2]=yg((c[l>>2]|0)+1|0)|0;vi(c[p>>2]|0,c[m>>2]|0,c[l>>2]|0)|0;a[(c[p>>2]|0)+(c[l>>2]|0)>>0]=0}while(1){if(a[c[g>>2]>>0]|0?(a[c[g>>2]>>0]|0)>>>0<128:0)e=(ci(d[c[g>>2]>>0]|0)|0)!=0;else e=0;b=c[g>>2]|0;if(!e)break;c[g>>2]=b+1}b:do if((a[b>>0]|0)==61){c[g>>2]=(c[g>>2]|0)+1;while(1){if(!(a[c[g>>2]>>0]|0))break b;if((a[c[g>>2]>>0]|0)>>>0>=128)break b;if(!(ci(d[c[g>>2]>>0]|0)|0))break b;c[g>>2]=(c[g>>2]|0)+1}}while(0);c[m>>2]=c[g>>2];c[l>>2]=$h(c[m>>2]|0)|0;while(1){if((c[l>>2]|0)>>>0>0?(a[(c[m>>2]|0)+((c[l>>2]|0)-1)>>0]|0)>>>0<128:0)e=(ci(d[(c[m>>2]|0)+((c[l>>2]|0)-1)>>0]|0)|0)!=0;else e=0;b=c[l>>2]|0;if(!e)break;c[l>>2]=b+-1}if(!b){c[j>>2]=14275;p=c[j>>2]|0;ma=q;return p|0}c[n>>2]=yg((c[l>>2]|0)+1|0)|0;vi(c[n>>2]|0,c[m>>2]|0,c[l>>2]|0)|0;a[(c[n>>2]|0)+(c[l>>2]|0)>>0]=0;c[h>>2]=c[n>>2];while(1){if(!(a[c[h>>2]>>0]|0))break;if((a[c[h>>2]>>0]|0)==59)a[c[h>>2]>>0]=58;c[h>>2]=(c[h>>2]|0)+1}if(c[p>>2]|0){c[i>>2]=Me(c[o>>2]|0,18016,c[p>>2]|0)|0;Yg(c[o>>2]|0);Yg(c[p>>2]|0);c[o>>2]=c[i>>2]}pf((c[k>>2]|0)+8|0,c[o>>2]|0,c[n>>2]|0);c[j>>2]=0;p=c[j>>2]|0;ma=q;return p|0}c[j>>2]=0;p=c[j>>2]|0;ma=q;return p|0}function Le(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;e=ma;ma=ma+32|0;h=e+16|0;f=e+12|0;g=e+8|0;i=e+4|0;d=e;c[h>>2]=a;c[f>>2]=b;c[g>>2]=$h(c[h>>2]|0)|0;c[i>>2]=$h(c[f>>2]|0)|0;c[d>>2]=yg((c[g>>2]|0)+(c[i>>2]|0)+1|0)|0;fi(c[d>>2]|0,c[h>>2]|0)|0;ki((c[d>>2]|0)+(c[g>>2]|0)|0,c[f>>2]|0)|0;ma=e;return c[d>>2]|0}function Me(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;e=k+20|0;f=k+16|0;g=k+12|0;h=k+8|0;i=k+4|0;j=k;c[e>>2]=a;c[f>>2]=b;c[g>>2]=d;if(c[f>>2]|0)a=$h(c[f>>2]|0)|0;else a=0;c[h>>2]=a;if(c[g>>2]|0)a=$h(c[g>>2]|0)|0;else a=0;c[i>>2]=a;d=$h(c[e>>2]|0)|0;c[j>>2]=yg(d+(c[h>>2]|0)+(c[i>>2]|0)+1|0)|0;fi(c[j>>2]|0,c[e>>2]|0)|0;if(c[f>>2]|0)ki(c[j>>2]|0,c[f>>2]|0)|0;if(!(c[g>>2]|0)){j=c[j>>2]|0;ma=k;return j|0}ki(c[j>>2]|0,c[g>>2]|0)|0;j=c[j>>2]|0;ma=k;return j|0}function Ne(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+48|0;d=k+36|0;e=k+32|0;f=k+28|0;g=k+24|0;h=k;i=k+20|0;j=k+16|0;c[e>>2]=a;if(!(c[e>>2]|0)){c[d>>2]=0;b=c[d>>2]|0;ma=k;return b|0}c[g>>2]=Cg(c[e>>2]|0)|0;c[h>>2]=b;while(1){e=(c[h>>2]|0)+(4-1)&~(4-1);b=c[e>>2]|0;c[h>>2]=e+4;c[i>>2]=b;b=c[i>>2]|0;c[f>>2]=b;if(!b)break;c[j>>2]=Le(c[g>>2]|0,c[f>>2]|0)|0;Yg(c[g>>2]|0);c[g>>2]=c[j>>2]}c[d>>2]=c[g>>2];b=c[d>>2]|0;ma=k;return b|0}function Oe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;e=k+20|0;f=k+16|0;g=k+12|0;h=k+8|0;i=k+4|0;j=k;c[e>>2]=b;c[f>>2]=d;if(!(c[(c[e>>2]|0)+20>>2]|0)){ma=k;return}c[h>>2]=Cg(c[f>>2]|0)|0;d=c[h>>2]|0;f=tg(c[h>>2]|0)|0;c[i>>2]=d+(f-(c[h>>2]|0));c[j>>2]=Cg(c[i>>2]|0)|0;a[c[i>>2]>>0]=0;c[g>>2]=c[h>>2];pf((c[e>>2]|0)+20|0,c[j>>2]|0,c[g>>2]|0);ma=k;return}function Pe(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;p=ma;ma=ma+80|0;o=p+8|0;n=p;b=p+76|0;g=p+72|0;h=p+68|0;i=p+64|0;j=p+56|0;k=p+52|0;l=p+48|0;q=p+40|0;m=p+36|0;d=p+32|0;e=p+24|0;f=p+16|0;c[b>>2]=a;c[l>>2]=0;c[g>>2]=oe(c[b>>2]|0,9)|0;c[h>>2]=Bf(c[b>>2]|0,c[g>>2]|0,2648,1,1)|0;c[i>>2]=c[h>>2];c[k>>2]=0;Qe(q);c[j>>2]=c[q>>2];c[j+4>>2]=c[q+4>>2];while(1){if(!(c[(c[h>>2]|0)+(c[k>>2]<<2)>>2]|0))break;c[m>>2]=c[(c[h>>2]|0)+(c[k>>2]<<2)>>2];c[d>>2]=c[(c[h>>2]|0)+((c[k>>2]|0)+1<<2)>>2];if((c[d>>2]|0?(Vh(c[m>>2]|0,c[d>>2]|0)|0)==0:0)?jf(c[m>>2]|0,c[d>>2]|0)|0:0){if(c[(c[b>>2]|0)+44>>2]&2|0){Pi(17619,c[665]|0)|0;q=c[665]|0;a=c[d>>2]|0;c[n>>2]=c[m>>2];c[n+4>>2]=a;Ki(q,14288,n)|0;Ai(c[665]|0)|0}Yg(c[m>>2]|0)}else{if(c[(c[b>>2]|0)+44>>2]&2|0){Pi(17619,c[665]|0)|0;q=c[665]|0;c[o>>2]=c[m>>2];Ki(q,14341,o)|0;Ai(c[665]|0)|0}Zf(j,c[m>>2]|0)}c[k>>2]=(c[k>>2]|0)+1}Zf(j,0);Yg(c[i>>2]|0);c[h>>2]=c[j+4>>2];c[i>>2]=c[h>>2];q=(c[b>>2]|0)+20|0;of(e,64007);c[q>>2]=c[e>>2];c[q+4>>2]=c[e+4>>2];while(1){if(!(c[h>>2]|0))break;if(!(c[c[h>>2]>>2]|0))break;if(Re(c[b>>2]|0,(c[b>>2]|0)+20|0,c[c[h>>2]>>2]|0)|0)c[l>>2]=1;Yg(c[c[h>>2]>>2]|0);c[h>>2]=(c[h>>2]|0)+4}if(!(c[l>>2]|0)){Yg(c[(c[b>>2]|0)+20>>2]|0);c[(c[b>>2]|0)+20>>2]=0}Yg(c[i>>2]|0);c[l>>2]=0;c[h>>2]=Mf(c[b>>2]|0,c[g>>2]|0,14371)|0;c[i>>2]=c[h>>2];q=(c[b>>2]|0)+28|0;of(f,1009);c[q>>2]=c[f>>2];c[q+4>>2]=c[f+4>>2];while(1){if(!(c[h>>2]|0))break;if(!(c[c[h>>2]>>2]|0))break;if(Se(c[b>>2]|0,(c[b>>2]|0)+28|0,c[c[h>>2]>>2]|0)|0)c[l>>2]=1;Yg(c[c[h>>2]>>2]|0);c[h>>2]=(c[h>>2]|0)+4}if(c[l>>2]|0){q=c[i>>2]|0;Yg(q);ma=p;return}Yg(c[(c[b>>2]|0)+28>>2]|0);c[(c[b>>2]|0)+28>>2]=0;q=c[i>>2]|0;Yg(q);ma=p;return}function Qe(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=0;c[d+4>>2]=0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];ma=b;return}function Re(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;u=ma;ma=ma+80|0;f=u+8|0;s=u;l=u+68|0;m=u+64|0;n=u+60|0;o=u+56|0;p=u+52|0;q=u+48|0;r=u+44|0;g=u+40|0;h=u+36|0;i=u+32|0;j=u+28|0;k=u+24|0;c[l>>2]=b;c[m>>2]=d;c[n>>2]=e;c[p>>2]=0;c[q>>2]=0;c[r>>2]=0;c[g>>2]=($h(c[n>>2]|0)|0)-5+1;c[h>>2]=yg((c[g>>2]|0)+1|0)|0;c[i>>2]=0;c[j>>2]=Ye(c[n>>2]|0,14717)|0;vi(c[h>>2]|0,c[n>>2]|0,c[g>>2]|0)|0;a[(c[h>>2]|0)+(c[g>>2]|0)>>0]=0;if(!(c[j>>2]|0)){t=c[h>>2]|0;Yg(t);t=c[j>>2]|0;t=(t|0)!=0;t=t&1;ma=u;return t|0}while(1){e=xf(c[j>>2]|0)|0;c[o>>2]=e;if(!e)break;c[g>>2]=$h(c[o>>2]|0)|0;do if(((c[g>>2]|0)>>>0>0?(a[(c[o>>2]|0)+((c[g>>2]|0)-1)>>0]|0)==58:0)?Ge(c[l>>2]|0,c[o>>2]|0,1)|0:0){if(Te(c[o>>2]|0)|0){c[i>>2]=0;c[r>>2]=(c[r>>2]|0)+1;break}a[(c[o>>2]|0)+((c[g>>2]|0)-1)>>0]=47;if((a[c[o>>2]>>0]|0)==46)b=Le(c[h>>2]|0,(c[o>>2]|0)+2|0)|0;else b=Cg(c[o>>2]|0)|0;c[i>>2]=b;c[p>>2]=(c[p>>2]|0)+1}else t=13;while(0);do if((t|0)==13?(t=0,c[i>>2]|0?(a[c[o>>2]>>0]|0)!=0:0):0){if((a[c[o>>2]>>0]|0)==46){if(!(a[(c[o>>2]|0)+1>>0]|0))break;if((a[(c[o>>2]|0)+1>>0]|0)==46?(a[(c[o>>2]|0)+2>>0]|0)==0:0)break}d=c[m>>2]|0;e=Cg(c[o>>2]|0)|0;rf(d,e,c[i>>2]|0);c[q>>2]=(c[q>>2]|0)+1}while(0);Yg(c[o>>2]|0)}wg(c[j>>2]|0,c[n>>2]|0);if(!(c[q>>2]|0)){Pi(17200,c[665]|0)|0;t=c[665]|0;c[s>>2]=c[n>>2];Ki(t,14414,s)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;Pi(17200,c[665]|0)|0;Pi(14454,c[665]|0)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;c[j>>2]=0}else{t=(c[l>>2]|0)+36|0;Zf(t,Cg(c[h>>2]|0)|0)}if(!(c[(c[l>>2]|0)+44>>2]&2)){t=c[h>>2]|0;Yg(t);t=c[j>>2]|0;t=(t|0)!=0;t=t&1;ma=u;return t|0}c[k>>2]=1;Pi(17619,c[665]|0)|0;s=c[665]|0;o=c[q>>2]|0;q=c[p>>2]|0;t=c[r>>2]|0;c[f>>2]=c[n>>2];c[f+4>>2]=o;c[f+8>>2]=q;c[f+12>>2]=t;Ki(s,14504,f)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Pi(14551,c[665]|0)|0;Ai(c[665]|0)|0;s=c[m>>2]|0;t=c[k>>2]|0;c[f>>2]=c[s>>2];c[f+4>>2]=c[s+4>>2];vf(f,t);Ai(c[665]|0)|0;t=c[h>>2]|0;Yg(t);t=c[j>>2]|0;t=(t|0)!=0;t=t&1;ma=u;return t|0}function Se(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=ma;ma=ma+48|0;g=q;j=q+40|0;k=q+36|0;l=q+32|0;m=q+28|0;n=q+24|0;o=q+20|0;p=q+16|0;h=q+12|0;i=q+8|0;c[j>>2]=b;c[k>>2]=e;c[l>>2]=f;c[p>>2]=0;c[h>>2]=Ye(c[l>>2]|0,14717)|0;if(!(c[h>>2]|0)){p=c[h>>2]|0;p=(p|0)!=0;p=p&1;ma=q;return p|0}while(1){f=xf(c[h>>2]|0)|0;c[m>>2]=f;if(!f)break;if((a[c[m>>2]>>0]|0?(a[c[m>>2]>>0]|0)!=37:0)?(a[c[m>>2]>>0]|0)!=35:0){c[n>>2]=c[m>>2];while(1){if(a[c[n>>2]>>0]|0?(a[c[n>>2]>>0]|0)>>>0<128:0)b=(ci(d[c[n>>2]>>0]|0)|0)!=0;else b=0;e=c[n>>2]|0;if(!b)break;c[n>>2]=e+1}c[o>>2]=e;do{if(a[c[o>>2]>>0]|0){if((a[c[o>>2]>>0]|0)>>>0<128)b=(ci(d[c[o>>2]>>0]|0)|0)!=0;else b=0;b=b^1}else b=0;e=c[o>>2]|0;c[o>>2]=e+1}while(b);a[e>>0]=0;while(1){if(!(a[c[o>>2]>>0]|0))break;if((a[c[o>>2]>>0]|0)>>>0>=128)break;if(!(ci(d[c[o>>2]>>0]|0)|0))break;c[o>>2]=(c[o>>2]|0)+1}if($h(c[n>>2]|0)|0?$h(c[o>>2]|0)|0:0){e=c[k>>2]|0;f=Cg(c[o>>2]|0)|0;rf(e,f,Cg(c[n>>2]|0)|0);c[p>>2]=(c[p>>2]|0)+1}}Yg(c[m>>2]|0)}if(c[(c[j>>2]|0)+44>>2]&2|0){c[i>>2]=1;Pi(17619,c[665]|0)|0;o=c[665]|0;p=c[p>>2]|0;c[g>>2]=c[l>>2];c[g+4>>2]=p;Ki(o,14379,g)|0;Ai(c[665]|0)|0;Pi(17619,c[665]|0)|0;Pi(14396,c[665]|0)|0;Ai(c[665]|0)|0;o=c[k>>2]|0;p=c[i>>2]|0;c[g>>2]=c[o>>2];c[g+4>>2]=c[o+4>>2];vf(g,p);Ai(c[665]|0)|0}wg(c[h>>2]|0,c[l>>2]|0);p=c[h>>2]|0;p=(p|0)!=0;p=p&1;ma=q;return p|0}function Te(b){b=b|0;var d=0,e=0,f=0,g=0;f=ma;ma=ma+16|0;e=f+8|0;g=f+4|0;d=f;c[g>>2]=b;c[d>>2]=c[g>>2];while(1){g=bi((c[d>>2]|0)+1|0,46)|0;c[d>>2]=g;if(!g){b=8;break}if(((a[(c[d>>2]|0)+-1>>0]|0)==47?a[(c[d>>2]|0)+1>>0]|0:0)?(a[(c[d>>2]|0)+1>>0]|0)!=47:0){b=6;break}}if((b|0)==6){c[e>>2]=1;g=c[e>>2]|0;ma=f;return g|0}else if((b|0)==8){c[e>>2]=0;g=c[e>>2]|0;ma=f;return g|0}return 0}function Ue(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;J=ma;ma=ma+144|0;p=J+128|0;I=J;E=J+120|0;F=J+116|0;n=J+112|0;o=J+108|0;G=J+104|0;H=J+100|0;q=J+96|0;g=J+92|0;r=J+88|0;s=J+84|0;t=J+80|0;h=J+76|0;u=J+72|0;v=J+68|0;w=J+64|0;i=J+60|0;j=J+56|0;k=J+52|0;l=J+48|0;m=J+44|0;x=J+40|0;y=J+32|0;z=J+28|0;A=J+24|0;B=J+20|0;C=J+16|0;D=J+12|0;c[F>>2]=b;c[n>>2]=d;c[o>>2]=e;c[G>>2]=f;c[s>>2]=0;c[u>>2]=0;c[i>>2]=0;if(!(c[(c[F>>2]|0)+20>>2]|0)){c[E>>2]=0;I=c[E>>2]|0;ma=J;return I|0}c[g>>2]=ni(c[n>>2]|0,47)|0;if(c[g>>2]|0?(c[g>>2]|0)!=(c[n>>2]|0):0){c[j>>2]=(c[g>>2]|0)-(c[n>>2]|0)+1;c[k>>2]=yg(c[j>>2]|0)|0;vi(c[k>>2]|0,c[n>>2]|0,(c[j>>2]|0)-1|0)|0;a[(c[k>>2]|0)+((c[j>>2]|0)-1)>>0]=0;o=Me(c[o>>2]|0,17682,c[k>>2]|0)|0;c[s>>2]=o;c[r>>2]=o;c[n>>2]=(c[g>>2]|0)+1;Yg(c[k>>2]|0)}else c[r>>2]=c[o>>2];c[h>>2]=0;while(1){if(c[i>>2]|0)break;if((c[h>>2]|0)>>>0>=(c[(c[F>>2]|0)+36>>2]|0)>>>0)break;c[i>>2]=Ve(c[(c[(c[F>>2]|0)+36+4>>2]|0)+(c[h>>2]<<2)>>2]|0,c[r>>2]|0)|0;c[h>>2]=(c[h>>2]|0)+1}if(!(c[i>>2]|0)){c[E>>2]=0;I=c[E>>2]|0;ma=J;return I|0}if(c[(c[F>>2]|0)+28>>2]|0){f=(c[F>>2]|0)+28|0;o=c[n>>2]|0;c[p>>2]=c[f>>2];c[p+4>>2]=c[f+4>>2];c[v>>2]=tf(p,o)|0}else c[v>>2]=0;if(!(c[v>>2]|0)){c[v>>2]=yg(4)|0;c[c[v>>2]>>2]=0}c[m>>2]=1;c[w>>2]=c[v>>2];while(1){if(!(c[c[w>>2]>>2]|0))break;c[m>>2]=(c[m>>2]|0)+1;c[w>>2]=(c[w>>2]|0)+4}c[v>>2]=Bg(c[v>>2]|0,(c[m>>2]|0)+1<<2)|0;c[l>>2]=c[m>>2];while(1){if((c[l>>2]|0)>>>0<=0)break;c[(c[v>>2]|0)+(c[l>>2]<<2)>>2]=c[(c[v>>2]|0)+((c[l>>2]|0)-1<<2)>>2];c[l>>2]=(c[l>>2]|0)+-1}c[c[v>>2]>>2]=c[n>>2];c[t>>2]=0;c[w>>2]=c[v>>2];while(1){if(c[t>>2]|0)break;if(!(c[c[w>>2]>>2]|0))break;c[x>>2]=c[c[w>>2]>>2];n=(c[F>>2]|0)+20|0;o=c[x>>2]|0;c[p>>2]=c[n>>2];c[p+4>>2]=c[n+4>>2];o=tf(p,o)|0;c[H>>2]=o;c[q>>2]=o;c[u>>2]=yg(8)|0;o=c[u>>2]|0;Qe(y);c[o>>2]=c[y>>2];c[o+4>>2]=c[y+4>>2];while(1){if(!((c[t>>2]|0)==0&(c[H>>2]|0)!=0))break;if(!(c[c[H>>2]>>2]|0))break;c[z>>2]=Le(c[c[H>>2]>>2]|0,c[x>>2]|0)|0;c[A>>2]=We(c[z>>2]|0,c[r>>2]|0)|0;if(c[(c[F>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;o=c[665]|0;f=c[r>>2]|0;n=c[A>>2]|0;c[I>>2]=c[z>>2];c[I+4>>2]=f;c[I+8>>2]=n;Ki(o,14578,I)|0;Ai(c[665]|0)|0}if(c[A>>2]|0){c[B>>2]=0;o=(Xf(c[F>>2]|0,c[z>>2]|0)|0)!=0;b=c[z>>2]|0;a:do if(o)c[B>>2]=b;else{Yg(b);c[C>>2]=(c[v>>2]|0)+4;while(1){if(!(c[c[C>>2]>>2]|0))break a;if(!((c[B>>2]|0)!=0^1))break a;c[D>>2]=Le(c[c[H>>2]>>2]|0,c[c[C>>2]>>2]|0)|0;o=(Xf(c[F>>2]|0,c[D>>2]|0)|0)!=0;b=c[D>>2]|0;if(o)c[B>>2]=b;else Yg(b);c[C>>2]=(c[C>>2]|0)+4}}while(0);if(c[B>>2]|0?(Zf(c[u>>2]|0,c[B>>2]|0),(c[G>>2]|0)==0&(c[B>>2]|0)!=0):0)c[t>>2]=1}else Yg(c[z>>2]|0);c[H>>2]=(c[H>>2]|0)+4}if(c[q>>2]|0?c[c[q>>2]>>2]|0:0)Yg(c[q>>2]|0);c[w>>2]=(c[w>>2]|0)+4}Yg(c[v>>2]|0);if(c[s>>2]|0)Yg(c[s>>2]|0);c[E>>2]=c[u>>2];I=c[E>>2]|0;ma=J;return I|0}function Ve(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i=ma;ma=ma+16|0;e=i+12|0;f=i+8|0;g=i+4|0;h=i;c[f>>2]=b;c[g>>2]=d;c[h>>2]=0;if((c[f>>2]|0?!((c[g>>2]|0)==0?1:(a[c[f>>2]>>0]|0)==0):0)?a[c[g>>2]>>0]|0:0){while(1){if(c[h>>2]|0)break;b=c[f>>2]|0;c[f>>2]=b+1;b=a[b>>0]|0;d=c[g>>2]|0;c[g>>2]=d+1;if((b|0)!=(a[d>>0]|0))break;if(a[c[f>>2]>>0]|0){if(!(a[c[g>>2]>>0]|0))break}else c[h>>2]=1}c[e>>2]=c[h>>2];h=c[e>>2]|0;ma=i;return h|0}c[e>>2]=0;h=c[e>>2]|0;ma=i;return h|0}function We(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;h=j+12|0;f=j+8|0;g=j+4|0;i=j;c[h>>2]=b;c[f>>2]=d;c[g>>2]=c[h>>2];c[i>>2]=0;while(1){if(!(a[c[h>>2]>>0]|0))break;if(!(a[c[f>>2]>>0]|0))break;if((a[c[h>>2]>>0]|0)!=(a[c[f>>2]>>0]|0)){e=5;break}c[h>>2]=(c[h>>2]|0)+1;c[f>>2]=(c[f>>2]|0)+1}a:do if((((e|0)==5?(a[c[f>>2]>>0]|0)==47:0)?(c[g>>2]|0)>>>0<(c[h>>2]|0)>>>0:0)?(a[(c[f>>2]|0)+-1>>0]|0)==47:0){while(1){b=c[f>>2]|0;if((a[c[f>>2]>>0]|0)!=47)break;c[f>>2]=b+1}if(!(a[b>>0]|0)){c[i>>2]=1;break}while(1){if(c[i>>2]|0)break a;if(!(a[c[h>>2]>>0]|0))break a;if((a[(c[h>>2]|0)+-1>>0]|0)==47?(a[c[h>>2]>>0]|0)==(a[c[f>>2]>>0]|0):0)c[i>>2]=We(c[h>>2]|0,c[f>>2]|0)|0;c[h>>2]=(c[h>>2]|0)+1}}while(0);if(c[i>>2]|0){i=c[i>>2]|0;ma=j;return i|0}if(a[c[f>>2]>>0]|0){i=c[i>>2]|0;ma=j;return i|0}if((a[c[h>>2]>>0]|0)==47)c[h>>2]=(c[h>>2]|0)+1;if((c[g>>2]|0)!=(c[h>>2]|0)?(a[(c[h>>2]|0)+-1>>0]|0)!=47:0){i=c[i>>2]|0;ma=j;return i|0}while(1){if(a[c[h>>2]>>0]|0)b=(a[c[h>>2]>>0]|0)==47^1;else b=0;d=c[h>>2]|0;if(!b)break;c[h>>2]=d+1}c[i>>2]=(a[d>>0]|0)==0&1;i=c[i>>2]|0;ma=j;return i|0}function Xe(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;L=ma;ma=ma+144|0;j=L+136|0;K=L;E=L+132|0;F=L+128|0;G=L+124|0;H=L+120|0;I=L+116|0;J=L+112|0;k=L+108|0;l=L+104|0;m=L+100|0;n=L+96|0;o=L+92|0;p=L+88|0;g=L+84|0;q=L+80|0;r=L+76|0;s=L+72|0;t=L+68|0;h=L+64|0;i=L+56|0;u=L+48|0;v=L+44|0;w=L+40|0;x=L+36|0;y=L+32|0;z=L+28|0;A=L+24|0;B=L+20|0;C=L+16|0;D=L+12|0;c[F>>2]=b;c[G>>2]=d;c[H>>2]=e;c[I>>2]=f;c[o>>2]=0;c[t>>2]=0;c[h>>2]=0;if(!(c[(c[F>>2]|0)+20>>2]|0)){c[E>>2]=0;K=c[E>>2]|0;ma=L;return K|0}c[g>>2]=0;while(1){if(c[h>>2]|0)break;if((c[g>>2]|0)>>>0>=(c[(c[F>>2]|0)+36>>2]|0)>>>0)break;c[h>>2]=Ve(c[(c[(c[F>>2]|0)+36+4>>2]|0)+(c[g>>2]<<2)>>2]|0,c[H>>2]|0)|0;c[g>>2]=(c[g>>2]|0)+1}if(!(c[h>>2]|0)){c[E>>2]=0;K=c[E>>2]|0;ma=L;return K|0}c[p>>2]=0;c[t>>2]=yg(8)|0;f=c[t>>2]|0;Qe(i);c[f>>2]=c[i>>2];c[f+4>>2]=c[i+4>>2];c[s>>2]=0;while(1){if(c[p>>2]|0)break;if(!(c[(c[G>>2]|0)+(c[s>>2]<<2)>>2]|0))break;c[m>>2]=c[(c[G>>2]|0)+(c[s>>2]<<2)>>2];if(!(Ge(c[F>>2]|0,c[m>>2]|0,1)|0)){c[l>>2]=ni(c[m>>2]|0,47)|0;if(c[l>>2]|0?(c[l>>2]|0)!=(c[m>>2]|0):0){c[u>>2]=(c[l>>2]|0)-(c[m>>2]|0)+1;c[v>>2]=yg(c[u>>2]|0)|0;vi(c[v>>2]|0,c[m>>2]|0,(c[u>>2]|0)-1|0)|0;a[(c[v>>2]|0)+((c[u>>2]|0)-1)>>0]=0;f=Me(c[H>>2]|0,17682,c[v>>2]|0)|0;c[o>>2]=f;c[n>>2]=f;c[m>>2]=(c[l>>2]|0)+1;Yg(c[v>>2]|0)}else c[n>>2]=c[H>>2];if(c[(c[F>>2]|0)+28>>2]|0){i=(c[F>>2]|0)+28|0;f=c[m>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=c[i+4>>2];c[q>>2]=tf(j,f)|0}else c[q>>2]=0;if(!(c[q>>2]|0)){c[q>>2]=yg(4)|0;c[c[q>>2]>>2]=0}c[x>>2]=1;c[r>>2]=c[q>>2];while(1){if(!(c[c[r>>2]>>2]|0))break;c[x>>2]=(c[x>>2]|0)+1;c[r>>2]=(c[r>>2]|0)+4}c[q>>2]=Bg(c[q>>2]|0,(c[x>>2]|0)+1<<2)|0;c[w>>2]=c[x>>2];while(1){if((c[w>>2]|0)>>>0<=0)break;c[(c[q>>2]|0)+(c[w>>2]<<2)>>2]=c[(c[q>>2]|0)+((c[w>>2]|0)-1<<2)>>2];c[w>>2]=(c[w>>2]|0)+-1}c[c[q>>2]>>2]=c[m>>2];c[r>>2]=c[q>>2];while(1){if(c[p>>2]|0)break;if(!(c[c[r>>2]>>2]|0))break;c[y>>2]=c[c[r>>2]>>2];i=(c[F>>2]|0)+20|0;f=c[y>>2]|0;c[j>>2]=c[i>>2];c[j+4>>2]=c[i+4>>2];f=tf(j,f)|0;c[J>>2]=f;c[k>>2]=f;while(1){if(!((c[p>>2]|0)==0&(c[J>>2]|0)!=0))break;if(!(c[c[J>>2]>>2]|0))break;c[z>>2]=Le(c[c[J>>2]>>2]|0,c[y>>2]|0)|0;c[A>>2]=We(c[z>>2]|0,c[n>>2]|0)|0;if(c[(c[F>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;f=c[665]|0;h=c[n>>2]|0;i=c[A>>2]|0;c[K>>2]=c[z>>2];c[K+4>>2]=h;c[K+8>>2]=i;Ki(f,14578,K)|0;Ai(c[665]|0)|0}do if(c[A>>2]|0){c[B>>2]=0;f=(Xf(c[F>>2]|0,c[z>>2]|0)|0)!=0;b=c[z>>2]|0;a:do if(f)c[B>>2]=b;else{Yg(b);c[C>>2]=(c[q>>2]|0)+4;while(1){if(!(c[c[C>>2]>>2]|0))break a;if(!((c[B>>2]|0)!=0^1))break a;c[D>>2]=Le(c[c[J>>2]>>2]|0,c[c[C>>2]>>2]|0)|0;f=(Xf(c[F>>2]|0,c[D>>2]|0)|0)!=0;b=c[D>>2]|0;if(f)c[B>>2]=b;else Yg(b);c[C>>2]=(c[C>>2]|0)+4}}while(0);if(!(c[B>>2]|0))break;Zf(c[t>>2]|0,c[B>>2]|0);if(c[I>>2]|0)break;c[p>>2]=1}else Yg(c[z>>2]|0);while(0);c[J>>2]=(c[J>>2]|0)+4}if(c[k>>2]|0?c[c[k>>2]>>2]|0:0)Yg(c[k>>2]|0);c[r>>2]=(c[r>>2]|0)+4}Yg(c[q>>2]|0);if(c[o>>2]|0)Yg(c[o>>2]|0)}c[s>>2]=(c[s>>2]|0)+1}c[E>>2]=c[t>>2];K=c[E>>2]|0;ma=L;return K|0}function Ye(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;h=ma;ma=ma+32|0;g=h;d=h+24|0;e=h+20|0;f=h+16|0;i=h+12|0;c[d>>2]=a;c[e>>2]=b;c[f>>2]=Bi(c[d>>2]|0,c[e>>2]|0)|0;c[i>>2]=30292;if(!(c[(c[i>>2]|0)+44>>2]&4)){i=c[f>>2]|0;ma=h;return i|0}Pi(17619,c[665]|0)|0;i=c[665]|0;b=c[e>>2]|0;e=c[f>>2]|0;c[g>>2]=c[d>>2];c[g+4>>2]=b;c[g+8>>2]=e;Ki(i,14600,g)|0;Ai(c[665]|0)|0;i=c[f>>2]|0;ma=h;return i|0}function Ze(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;f=ma;ma=ma+32|0;e=f;b=f+16|0;d=f+12|0;g=f+8|0;c[b>>2]=a;c[d>>2]=Ci(c[b>>2]|0)|0;c[g>>2]=30292;if(!(c[(c[g>>2]|0)+44>>2]&4)){g=c[d>>2]|0;ma=f;return g|0}Pi(17619,c[665]|0)|0;g=c[665]|0;a=c[d>>2]|0;c[e>>2]=c[b>>2];c[e+4>>2]=a;Ki(g,14624,e)|0;Ai(c[665]|0)|0;g=c[d>>2]|0;ma=f;return g|0}function _e(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;e=ma;ma=ma+96|0;f=e+76|0;d=e;c[e+80>>2]=a;c[f>>2]=b;if(kh(c[f>>2]|0,d)|0){f=0;f=f&1;ma=e;return f|0}f=(c[d+12>>2]&61440|0)==16384;f=f&1;ma=e;return f|0}function $e(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;a=_e(30292,c[d>>2]|0)|0;ma=b;return a|0}function af(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=ma;ma=ma+128|0;e=m+112|0;l=m;f=m+108|0;g=m+104|0;h=m+100|0;i=m+96|0;j=m+88|0;k=m+8|0;c[f>>2]=a;c[g>>2]=b;c[h>>2]=d;if(!(c[(c[f>>2]|0)+48+4>>2]|0)){d=(c[f>>2]|0)+48|0;of(j,457);c[d>>2]=c[j>>2];c[d+4>>2]=c[j+4>>2]}if(c[(c[f>>2]|0)+44>>2]&2|0)c[(c[f>>2]|0)+76>>2]=1;d=(c[f>>2]|0)+48|0;j=c[g>>2]|0;c[e>>2]=c[d>>2];c[e+4>>2]=c[d+4>>2];c[i>>2]=tf(e,j)|0;if(c[(c[f>>2]|0)+44>>2]&2|0)c[(c[f>>2]|0)+76>>2]=0;if(c[i>>2]|0){c[h>>2]=c[c[i>>2]>>2];l=c[h>>2]|0;ma=m;return l|0}if((kh(c[g>>2]|0,k)|0)==0?(c[k+12>>2]&61440|0)==16384:0)c[h>>2]=c[k+16>>2];else c[h>>2]=-1;j=(c[f>>2]|0)+48|0;k=Cg(c[g>>2]|0)|0;pf(j,k,c[h>>2]|0);if(!(c[(c[f>>2]|0)+44>>2]&1)){l=c[h>>2]|0;ma=m;return l|0}Pi(17619,c[665]|0)|0;k=c[665]|0;j=c[h>>2]|0;c[l>>2]=c[g>>2];c[l+4>>2]=j;Ki(k,14645,l)|0;Ai(c[665]|0)|0;l=c[h>>2]|0;ma=m;return l|0}function bf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;f=ma;ma=ma+16|0;g=f+12|0;h=f+8|0;d=f+4|0;e=f;c[g>>2]=a;c[h>>2]=b;c[d>>2]=pg(c[g>>2]|0,c[h>>2]|0)|0;c[e>>2]=lg(c[g>>2]|0,c[d>>2]|0)|0;if((c[e>>2]|0)==(c[d>>2]|0)){h=c[e>>2]|0;ma=f;return h|0}Yg(c[d>>2]|0);h=c[e>>2]|0;ma=f;return h|0}function cf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;m=ma;ma=ma+48|0;f=m+32|0;n=m+28|0;g=m+24|0;h=m+20|0;i=m+16|0;j=m+12|0;k=m+8|0;l=m+4|0;e=m;c[f>>2]=b;c[n>>2]=d;c[j>>2]=pg(c[f>>2]|0,c[n>>2]|0)|0;c[k>>2]=yg(1)|0;a[c[k>>2]>>0]=0;c[h>>2]=yf(c[f>>2]|0,c[j>>2]|0)|0;while(1){b=c[k>>2]|0;if(!(c[h>>2]|0))break;c[l>>2]=b;c[e>>2]=df(c[f>>2]|0,c[h>>2]|0)|0;c[k>>2]=Me(c[k>>2]|0,c[e>>2]|0,14667)|0;Yg(c[e>>2]|0);Yg(c[l>>2]|0);c[h>>2]=yf(c[f>>2]|0,0)|0}c[i>>2]=$h(b)|0;if(c[i>>2]|0)a[(c[k>>2]|0)+((c[i>>2]|0)-1)>>0]=0;Yg(c[j>>2]|0);c[g>>2]=ef(c[f>>2]|0,c[k>>2]|0)|0;if((c[g>>2]|0)==(c[k>>2]|0)){n=c[g>>2]|0;ma=m;return n|0}Yg(c[k>>2]|0);n=c[g>>2]|0;ma=m;return n|0}function df(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;l=ma;ma=ma+48|0;e=l+32|0;m=l+28|0;f=l+24|0;g=l+16|0;h=l+12|0;i=l+8|0;j=l+4|0;k=l;c[e>>2]=b;c[m>>2]=d;ff(g,c[e>>2]|0,m);c[h>>2]=yg(1)|0;a[c[h>>2]>>0]=0;c[f>>2]=0;while(1){if((c[f>>2]|0)==(c[g>>2]|0))break;c[i>>2]=bf(c[e>>2]|0,c[(c[g+4>>2]|0)+(c[f>>2]<<2)>>2]|0)|0;c[j>>2]=c[h>>2];if(!((c[i>>2]|0?c[(c[g+4>>2]|0)+(c[f>>2]<<2)>>2]|0:0)?!(Ph(c[i>>2]|0,c[(c[g+4>>2]|0)+(c[f>>2]<<2)>>2]|0)|0):0)){c[k>>2]=c[i>>2];c[i>>2]=df(c[e>>2]|0,c[i>>2]|0)|0;Yg(c[k>>2]|0)}c[h>>2]=Me(c[h>>2]|0,c[i>>2]|0,14667)|0;Yg(c[j>>2]|0);Yg(c[i>>2]|0);c[f>>2]=(c[f>>2]|0)+1}c[f>>2]=0;while(1){if((c[f>>2]|0)==(c[g>>2]|0))break;Yg(c[(c[g+4>>2]|0)+(c[f>>2]<<2)>>2]|0);c[f>>2]=(c[f>>2]|0)+1}bg(g);m=c[h>>2]|0;a[m+(($h(c[h>>2]|0)|0)-1)>>0]=0;ma=l;return c[h>>2]|0}function ef(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;p=ma;ma=ma+80|0;n=p+16|0;m=p;f=p+64|0;g=p+60|0;e=p+56|0;h=p+52|0;i=p+48|0;j=p+44|0;k=p+40|0;l=p+36|0;c[g>>2]=b;c[e>>2]=d;c[j>>2]=fa(14669)|0;if(!(c[j>>2]|0)){c[f>>2]=c[e>>2];o=c[f>>2]|0;ma=p;return o|0}c[h>>2]=yg(1)|0;a[c[h>>2]>>0]=0;c[i>>2]=yf(c[g>>2]|0,c[e>>2]|0)|0;while(1){b=c[h>>2]|0;if(!(c[i>>2]|0))break;c[k>>2]=b;c[l>>2]=1;do if(!(Ge(c[g>>2]|0,c[i>>2]|0,0)|0)){if((a[c[i>>2]>>0]|0)==33?(a[(c[i>>2]|0)+1>>0]|0)==33:0){o=8;break}if((a[c[i>>2]>>0]|0)==46?(a[(c[i>>2]|0)+1>>0]|0)==0:0){c[h>>2]=Me(c[h>>2]|0,c[j>>2]|0,14667)|0;break}if((a[c[i>>2]>>0]|0)==46?(a[(c[i>>2]|0)+1>>0]|0)==47:0){e=c[h>>2]|0;d=(c[i>>2]|0)+1|0;c[m>>2]=c[j>>2];c[m+4>>2]=d;c[m+8>>2]=14667;c[m+12>>2]=0;c[h>>2]=Ne(e,m)|0;break}if(a[c[i>>2]>>0]|0){e=c[h>>2]|0;d=c[i>>2]|0;c[n>>2]=c[j>>2];c[n+4>>2]=17682;c[n+8>>2]=d;c[n+12>>2]=14667;c[n+16>>2]=0;c[h>>2]=Ne(e,n)|0;break}else{c[l>>2]=0;break}}else o=8;while(0);if((o|0)==8){o=0;c[h>>2]=Me(c[h>>2]|0,c[i>>2]|0,14667)|0}if(c[l>>2]|0)Yg(c[k>>2]|0);c[i>>2]=yf(c[g>>2]|0,0)|0}a[b+(($h(c[h>>2]|0)|0)-1)>>0]=0;c[f>>2]=c[h>>2];o=c[f>>2]|0;ma=p;return o|0}function ff(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;q=ma;ma=ma+96|0;f=q+80|0;o=q;i=q+76|0;j=q+72|0;k=q+64|0;l=q+56|0;m=q+48|0;n=q+40|0;s=q+32|0;r=q+24|0;g=q+16|0;h=q+8|0;c[i>>2]=d;c[j>>2]=e;gf(s);c[k>>2]=c[s>>2];c[k+4>>2]=c[s+4>>2];gf(r);c[l>>2]=c[r>>2];c[l+4>>2]=c[r+4>>2];c[n>>2]=c[c[j>>2]>>2];while(1){if(!(a[c[n>>2]>>0]|0)){p=17;break}if((a[c[n>>2]>>0]|0)==125){p=17;break}a:do if((a[c[n>>2]>>0]|0)!=58?(a[c[n>>2]>>0]|0)!=44:0){if((a[c[n>>2]>>0]|0)==123){hf(l,c[c[j>>2]>>2]|0,c[n>>2]|0);c[n>>2]=(c[n>>2]|0)+1;ff(h,c[i>>2]|0,n);c[m>>2]=c[h>>2];c[m+4>>2]=c[h+4>>2];c[f>>2]=c[m>>2];c[f+4>>2]=c[m+4>>2];ag(l,f);bg(m);if((a[c[n>>2]>>0]|0)!=125){Pi(17200,c[665]|0)|0;s=c[665]|0;c[o>>2]=c[c[j>>2]>>2];Ki(s,14678,o)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;c[n>>2]=(c[n>>2]|0)+-1}c[c[j>>2]>>2]=(c[n>>2]|0)+1;break}if((a[c[n>>2]>>0]|0)==36?(a[(c[n>>2]|0)+1>>0]|0)==123:0){c[n>>2]=(c[n>>2]|0)+2;while(1){if((a[c[n>>2]>>0]|0)==125)break a;c[n>>2]=(c[n>>2]|0)+1}}}else p=6;while(0);if((p|0)==6){p=0;hf(l,c[c[j>>2]>>2]|0,c[n>>2]|0);c[f>>2]=c[l>>2];c[f+4>>2]=c[l+4>>2];$f(k,f);bg(l);c[c[j>>2]>>2]=(c[n>>2]|0)+1;gf(g);c[l>>2]=c[g>>2];c[l+4>>2]=c[g+4>>2]}c[n>>2]=(c[n>>2]|0)+1}if((p|0)==17){hf(l,c[c[j>>2]>>2]|0,c[n>>2]|0);c[f>>2]=c[l>>2];c[f+4>>2]=c[l+4>>2];$f(k,f);bg(l);c[c[j>>2]>>2]=c[n>>2];c[b>>2]=c[k>>2];c[b+4>>2]=c[k+4>>2];ma=q;return}}function gf(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=0;c[d+4>>2]=0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];ma=b;return}function hf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=ma;ma=ma+48|0;g=f+40|0;i=f+32|0;l=f+28|0;m=f+24|0;j=f+20|0;k=f+16|0;h=f+8|0;n=f;c[i>>2]=b;c[l>>2]=d;c[m>>2]=e;gf(n);c[h>>2]=c[n>>2];c[h+4>>2]=c[n+4>>2];c[k>>2]=(c[m>>2]|0)-(c[l>>2]|0);c[j>>2]=yg((c[k>>2]|0)+1|0)|0;vi(c[j>>2]|0,c[l>>2]|0,c[k>>2]|0)|0;a[(c[j>>2]|0)+(c[k>>2]|0)>>0]=0;Zf(h,c[j>>2]|0);e=c[i>>2]|0;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];ag(e,g);ma=f;return}function jf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;f=ma;ma=ma+176|0;j=f+164|0;i=f+160|0;d=f+84|0;e=f+8|0;h=f+4|0;g=f;c[j>>2]=a;c[i>>2]=b;c[h>>2]=kh(c[j>>2]|0,d)|0;c[g>>2]=kh(c[i>>2]|0,e)|0;if(!((c[h>>2]|0)==0&(c[g>>2]|0)==0)){j=0;ma=f;return j|0}if((c[d+72>>2]|0)==(c[e+72>>2]|0))a=(c[d>>2]|0)==(c[e>>2]|0);else a=0;j=a&1;ma=f;return j|0}function kf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;d=k+24|0;e=k+20|0;f=k+16|0;g=k+12|0;h=k+8|0;i=k+4|0;j=k;c[e>>2]=a;c[f>>2]=b;c[h>>2]=Mg(c[f>>2]|0)|0;if(!(c[(c[e>>2]|0)+64+4>>2]|0))lf(c[e>>2]|0);a=(c[e>>2]|0)+64|0;b=c[f>>2]|0;c[d>>2]=c[a>>2];c[d+4>>2]=c[a+4>>2];c[g>>2]=tf(d,b)|0;if((c[g>>2]|0)==0&(c[h>>2]|0)!=0){c[i>>2]=Yf(c[f>>2]|0)|0;e=(c[e>>2]|0)+64|0;f=c[i>>2]|0;c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[g>>2]=tf(d,f)|0;Yg(c[i>>2]|0)}if(!((c[g>>2]|0)!=0&(c[h>>2]|0)!=0)){j=c[g>>2]|0;ma=k;return j|0}c[j>>2]=c[g>>2];while(1){if(!(c[c[j>>2]>>2]|0))break;i=Lg(c[c[j>>2]>>2]|0,c[h>>2]|0)|0;c[c[j>>2]>>2]=i;c[j>>2]=(c[j>>2]|0)+4}j=c[g>>2]|0;ma=k;return j|0}function lf(a){a=a|0;var b=0,d=0,e=0,f=0;e=ma;ma=ma+16|0;b=e+12|0;d=e+8|0;f=e;c[b>>2]=a;a=oe(c[b>>2]|0,11)|0;c[(c[b>>2]|0)+72>>2]=a;c[d>>2]=Mf(c[b>>2]|0,c[(c[b>>2]|0)+72>>2]|0,14704)|0;a=(c[b>>2]|0)+64|0;of(f,4001);c[a>>2]=c[f>>2];c[a+4>>2]=c[f+4>>2];while(1){if(!(c[c[d>>2]>>2]|0))break;mf(c[b>>2]|0,c[c[d>>2]>>2]|0);c[d>>2]=(c[d>>2]|0)+4}ma=e;return}function mf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;s=ma;ma=ma+80|0;r=s+24|0;q=s+8|0;p=s;h=s+72|0;i=s+68|0;j=s+64|0;k=s+60|0;l=s+56|0;m=s+52|0;n=s+48|0;o=s+44|0;f=s+40|0;g=s+36|0;c[h>>2]=b;c[i>>2]=e;c[k>>2]=0;c[l>>2]=vg(c[i>>2]|0,14717)|0;if(c[c[h>>2]>>2]|0)ua[c[c[h>>2]>>2]&3](c[i>>2]|0);while(1){e=xf(c[l>>2]|0)|0;c[j>>2]=e;if(!e)break;c[n>>2]=c[j>>2];c[o>>2]=ni(c[n>>2]|0,37)|0;if(!(c[o>>2]|0))c[o>>2]=qi(c[n>>2]|0,14719)|0;if(c[o>>2]|0)a[c[o>>2]>>0]=0;c[k>>2]=(c[k>>2]|0)+1;while(1){if(a[c[n>>2]>>0]|0?(a[c[n>>2]>>0]|0)>>>0<128:0)b=(ci(d[c[n>>2]>>0]|0)|0)!=0;else b=0;e=c[n>>2]|0;if(!b)break;c[n>>2]=e+1}c[m>>2]=nf(e)|0;do if(c[m>>2]|0){e=c[n>>2]|0;c[f>>2]=nf(e+($h(c[m>>2]|0)|0)|0)|0;if(c[m>>2]|0?(Ph(c[m>>2]|0,14722)|0)==0:0){if(!(c[f>>2]|0)){Pi(17200,c[665]|0)|0;e=c[665]|0;b=c[k>>2]|0;c[p>>2]=c[i>>2];c[p+4>>2]=b;Ki(e,14730,p)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;break}c[g>>2]=If(c[h>>2]|0,c[(c[h>>2]|0)+72>>2]|0,c[f>>2]|0,0)|0;if(c[g>>2]|0){mf(c[h>>2]|0,c[g>>2]|0);if((c[g>>2]|0)!=(c[f>>2]|0))Yg(c[g>>2]|0)}else{Pi(17200,c[665]|0)|0;e=c[665]|0;t=c[k>>2]|0;b=c[f>>2]|0;c[q>>2]=c[i>>2];c[q+4>>2]=t;c[q+8>>2]=b;Ki(e,14795,q)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0}Yg(c[f>>2]|0);Yg(c[m>>2]|0);break}if(!(c[f>>2]|0)){Pi(17200,c[665]|0)|0;t=c[665]|0;b=c[k>>2]|0;e=c[m>>2]|0;c[r>>2]=c[i>>2];c[r+4>>2]=b;c[r+8>>2]=e;Ki(t,14850,r)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;Yg(c[m>>2]|0);break}else{rf((c[h>>2]|0)+64|0,c[f>>2]|0,c[m>>2]|0);break}}while(0);Yg(c[j>>2]|0)}wg(c[l>>2]|0,c[i>>2]|0);ma=s;return}function nf(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;f=j+12|0;g=j+8|0;h=j+4|0;i=j;c[f>>2]=b;while(1){if(a[c[f>>2]>>0]|0?(a[c[f>>2]>>0]|0)>>>0<128:0)e=(ci(d[c[f>>2]>>0]|0)|0)!=0;else e=0;b=c[f>>2]|0;if(!e)break;c[f>>2]=b+1}c[h>>2]=b;while(1){if(a[c[f>>2]>>0]|0){if((a[c[f>>2]>>0]|0)>>>0<128)b=(ci(d[c[f>>2]>>0]|0)|0)!=0;else b=0;e=b^1}else e=0;b=c[f>>2]|0;if(!e)break;c[f>>2]=b+1}c[g>>2]=b-(c[h>>2]|0);c[i>>2]=yg((c[g>>2]|0)+1|0)|0;vi(c[i>>2]|0,c[h>>2]|0,c[g>>2]|0)|0;a[(c[i>>2]|0)+(c[g>>2]|0)>>0]=0;ma=j;return c[i>>2]|0}function of(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;f=ma;ma=ma+32|0;g=f+16|0;d=f+8|0;e=f;c[g>>2]=b;c[d>>2]=yg(c[g>>2]<<2)|0;c[d+4>>2]=c[g>>2];c[e>>2]=0;while(1){if((c[e>>2]|0)>>>0>=(c[d+4>>2]|0)>>>0)break;c[(c[d>>2]|0)+(c[e>>2]<<2)>>2]=0;c[e>>2]=(c[e>>2]|0)+1}c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];ma=f;return}function pf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;i=ma;ma=ma+32|0;l=i+24|0;e=i+20|0;k=i+16|0;j=i+12|0;f=i+8|0;g=i+4|0;h=i;c[e>>2]=a;c[k>>2]=b;c[j>>2]=d;b=c[e>>2]|0;d=c[k>>2]|0;c[l>>2]=c[b>>2];c[l+4>>2]=c[b+4>>2];c[f>>2]=qf(l,d)|0;c[g>>2]=yg(12)|0;c[c[g>>2]>>2]=c[k>>2];c[(c[g>>2]|0)+4>>2]=c[j>>2];c[(c[g>>2]|0)+8>>2]=0;if(!(c[(c[c[e>>2]>>2]|0)+(c[f>>2]<<2)>>2]|0)){c[(c[c[e>>2]>>2]|0)+(c[f>>2]<<2)>>2]=c[g>>2];ma=i;return}c[h>>2]=c[(c[c[e>>2]>>2]|0)+(c[f>>2]<<2)>>2];while(1){if(!(c[(c[h>>2]|0)+8>>2]|0))break;c[h>>2]=c[(c[h>>2]|0)+8>>2]}c[(c[h>>2]|0)+8>>2]=c[g>>2];ma=i;return}function qf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;g=ma;ma=ma+16|0;e=g+4|0;f=g;c[e>>2]=d;c[f>>2]=0;while(1){d=c[f>>2]|0;if(!(a[c[e>>2]>>0]|0))break;h=d+(c[f>>2]|0)|0;d=c[e>>2]|0;c[e>>2]=d+1;c[f>>2]=((h+(a[d>>0]|0)|0)>>>0)%((c[b+4>>2]|0)>>>0)|0}ma=g;return d|0}function rf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;i=ma;ma=ma+32|0;l=i+24|0;e=i+20|0;k=i+16|0;j=i+12|0;f=i+8|0;g=i+4|0;h=i;c[e>>2]=a;c[k>>2]=b;c[j>>2]=d;b=c[e>>2]|0;d=c[k>>2]|0;c[l>>2]=c[b>>2];c[l+4>>2]=c[b+4>>2];c[f>>2]=sf(l,d)|0;c[g>>2]=yg(12)|0;c[c[g>>2]>>2]=c[k>>2];c[(c[g>>2]|0)+4>>2]=c[j>>2];c[(c[g>>2]|0)+8>>2]=0;if(!(c[(c[c[e>>2]>>2]|0)+(c[f>>2]<<2)>>2]|0)){c[(c[c[e>>2]>>2]|0)+(c[f>>2]<<2)>>2]=c[g>>2];ma=i;return}c[h>>2]=c[(c[c[e>>2]>>2]|0)+(c[f>>2]<<2)>>2];while(1){if(!(c[(c[h>>2]|0)+8>>2]|0))break;c[h>>2]=c[(c[h>>2]|0)+8>>2]}c[(c[h>>2]|0)+8>>2]=c[g>>2];ma=i;return}function sf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;g=ma;ma=ma+16|0;e=g+4|0;f=g;c[e>>2]=d;c[f>>2]=0;while(1){d=c[f>>2]|0;if(!(a[c[e>>2]>>0]|0))break;h=d+(c[f>>2]|0)|0;d=c[e>>2]|0;c[e>>2]=d+1;c[f>>2]=((h+(a[d>>0]|0)|0)>>>0)%((c[b+4>>2]|0)>>>0)|0}ma=g;return d|0}function tf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;k=ma;ma=ma+64|0;n=k+56|0;j=k+8|0;f=k;d=k+52|0;e=k+48|0;g=k+40|0;l=k+32|0;m=k+24|0;h=k+16|0;i=k+12|0;c[d>>2]=b;b=c[d>>2]|0;c[n>>2]=c[a>>2];c[n+4>>2]=c[a+4>>2];c[l>>2]=qf(n,b)|0;uf(m);c[g>>2]=c[m>>2];c[g+4>>2]=c[m+4>>2];c[e>>2]=c[(c[a>>2]|0)+(c[l>>2]<<2)>>2];while(1){if(!(c[e>>2]|0))break;if((c[d>>2]|0?c[c[e>>2]>>2]|0:0)?(Ph(c[d>>2]|0,c[c[e>>2]>>2]|0)|0)==0:0)_f(g,c[(c[e>>2]|0)+4>>2]|0);c[e>>2]=c[(c[e>>2]|0)+8>>2]}if(c[g+4>>2]|0)_f(g,0);c[h>>2]=30292;if(!(c[(c[h>>2]|0)+44>>2]&2)){n=g+4|0;n=c[n>>2]|0;ma=k;return n|0}Pi(17619,c[665]|0)|0;n=c[665]|0;c[f>>2]=c[d>>2];Ki(n,14908,f)|0;Ai(c[665]|0)|0;if(c[g+4>>2]|0){c[i>>2]=c[g+4>>2];while(1){a=c[665]|0;if(!(c[c[i>>2]>>2]|0))break;Ri(32,a)|0;if(c[(c[h>>2]|0)+76>>2]|0){n=c[665]|0;c[j>>2]=c[c[i>>2]>>2];Ki(n,14935,j)|0}else Pi(c[c[i>>2]>>2]|0,c[665]|0)|0;c[i>>2]=(c[i>>2]|0)+4}Ri(10,a)|0}else Pi(14927,c[665]|0)|0;Ai(c[665]|0)|0;n=g+4|0;n=c[n>>2]|0;ma=k;return n|0}function uf(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=0;c[d+4>>2]=0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];ma=b;return}function vf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0;p=ma;ma=ma+80|0;o=p+24|0;l=p+16|0;k=p+8|0;j=p;d=p+72|0;e=p+68|0;m=p+64|0;n=p+60|0;f=p+56|0;h=p+52|0;i=p+48|0;c[d>>2]=b;c[m>>2]=0;c[n>>2]=0;c[e>>2]=0;while(1){if((c[e>>2]|0)>>>0>=(c[a+4>>2]|0)>>>0)break;c[f>>2]=c[(c[a>>2]|0)+(c[e>>2]<<2)>>2];if(c[f>>2]|0){c[h>>2]=1;c[n>>2]=(c[n>>2]|0)+1;if(!(c[d>>2]|0)){b=c[665]|0;c[j>>2]=c[e>>2];Ki(b,14939,j)|0}c[i>>2]=c[(c[f>>2]|0)+8>>2];while(1){if(!(c[i>>2]|0))break;c[h>>2]=(c[h>>2]|0)+1;c[i>>2]=c[(c[i>>2]|0)+8>>2]}if(!(c[d>>2]|0)){b=c[665]|0;c[k>>2]=c[h>>2];Ki(b,14944,k)|0}c[m>>2]=(c[m>>2]|0)+(c[h>>2]|0);if(!(c[d>>2]|0)){c[i>>2]=c[f>>2];while(1){b=c[665]|0;if(!(c[i>>2]|0))break;q=c[(c[i>>2]|0)+4>>2]|0;c[l>>2]=c[c[i>>2]>>2];c[l+4>>2]=q;Ki(b,14950,l)|0;c[i>>2]=c[(c[i>>2]|0)+8>>2]}Ri(10,b)|0}}c[e>>2]=(c[e>>2]|0)+1}e=c[665]|0;f=c[a+4>>2]|0;h=c[n>>2]|0;b=(((c[n>>2]|0)*100|0)>>>0)/((c[a+4>>2]|0)>>>0)|0;d=c[m>>2]|0;if(!(c[n>>2]|0)){r=0.0;c[o>>2]=f;q=o+4|0;c[q>>2]=h;q=o+8|0;c[q>>2]=b;q=o+12|0;c[q>>2]=d;q=o+16|0;g[q>>3]=r;Ki(e,14958,o)|0;ma=p;return}r=+((c[m>>2]|0)>>>0)/+((c[n>>2]|0)>>>0);c[o>>2]=f;q=o+4|0;c[q>>2]=h;q=o+8|0;c[q>>2]=b;q=o+12|0;c[q>>2]=d;q=o+16|0;g[q>>3]=r;Ki(e,14958,o)|0;ma=p;return}function wf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;i=k+16|0;f=k+12|0;g=k+8|0;j=k+4|0;h=k;c[k+20>>2]=b;c[i>>2]=d;c[f>>2]=e;if(!(c[f>>2]|0))C(15023,15032,41,15090);if(c[i>>2]|0?a[c[i>>2]>>0]|0:0){d=c[i>>2]|0;if((a[c[i>>2]>>0]|0)==58){b=c[f>>2]|0;if(!(a[d+1>>0]|0))b=Cg(b)|0;else b=Le(b,c[i>>2]|0)|0;c[j>>2]=b;j=c[j>>2]|0;ma=k;return j|0}e=$h(c[i>>2]|0)|0;c[g>>2]=e;b=c[i>>2]|0;if((a[d+(e-1)>>0]|0)==58){c[j>>2]=Le(b,c[f>>2]|0)|0;j=c[j>>2]|0;ma=k;return j|0}c[h>>2]=b;while(1){if(!(a[c[h>>2]>>0]|0))break;if((a[c[h>>2]>>0]|0)==58?(a[(c[h>>2]|0)+1>>0]|0)==58:0)break;c[h>>2]=(c[h>>2]|0)+1}if(a[c[h>>2]>>0]|0){g=c[g>>2]|0;c[j>>2]=yg(g+($h(c[f>>2]|0)|0)+1|0)|0;vi(c[j>>2]|0,c[i>>2]|0,(c[h>>2]|0)-(c[i>>2]|0)+1|0)|0;a[(c[j>>2]|0)+((c[h>>2]|0)-(c[i>>2]|0)+1)>>0]=0;ki(c[j>>2]|0,c[f>>2]|0)|0;ki(c[j>>2]|0,(c[h>>2]|0)+1|0)|0;j=c[j>>2]|0;ma=k;return j|0}else{c[j>>2]=Cg(c[i>>2]|0)|0;j=c[j>>2]|0;ma=k;return j|0}}c[j>>2]=Cg(c[f>>2]|0)|0;j=c[j>>2]|0;ma=k;return j|0}function xf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;i=ma;ma=ma+32|0;e=i+16|0;f=i+12|0;d=i+8|0;g=i+4|0;h=i;c[e>>2]=b;c[d>>2]=75;c[g>>2]=0;c[h>>2]=yg(c[d>>2]|0)|0;Yi(c[e>>2]|0);while(1){b=Wi(c[e>>2]|0)|0;c[f>>2]=b;if(!((b|0)!=-1&(c[f>>2]|0)!=10&(c[f>>2]|0)!=13))break;a[(c[h>>2]|0)+(c[g>>2]|0)>>0]=c[f>>2];c[g>>2]=(c[g>>2]|0)+1;if((c[g>>2]|0)==(c[d>>2]|0)){c[d>>2]=(c[d>>2]|0)+75;c[h>>2]=Bg(c[h>>2]|0,c[d>>2]|0)|0}}b=c[h>>2]|0;if((c[g>>2]|0)==0&(c[f>>2]|0)==-1){Yg(b);c[h>>2]=0;g=c[e>>2]|0;$i(g);h=c[h>>2]|0;ma=i;return h|0}a[b+(c[g>>2]|0)>>0]=0;if((c[f>>2]|0)!=13){g=c[e>>2]|0;$i(g);h=c[h>>2]|0;ma=i;return h|0}c[f>>2]=Wi(c[e>>2]|0)|0;if((c[f>>2]|0)==10){g=c[e>>2]|0;$i(g);h=c[h>>2]|0;ma=i;return h|0}yi(c[f>>2]|0,c[e>>2]|0)|0;g=c[e>>2]|0;$i(g);h=c[h>>2]|0;ma=i;return h|0}function yf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[f>>2]=a;c[e>>2]=b;b=zf(c[f>>2]|0,c[e>>2]|0,1)|0;ma=d;return b|0}function zf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;n=ma;ma=ma+32|0;h=n+28|0;i=n+24|0;f=n+20|0;j=n+16|0;k=n+12|0;l=n+8|0;m=n+4|0;g=n;c[i>>2]=b;c[f>>2]=d;c[j>>2]=e;if(!(c[f>>2]|0)){if(!(c[(c[i>>2]|0)+88>>2]|0)){c[h>>2]=0;m=c[h>>2]|0;ma=n;return m|0}}else c[(c[i>>2]|0)+88>>2]=c[f>>2];if(!(c[(c[i>>2]|0)+88>>2]|0))C(15114,15125,49,15183);c[k>>2]=c[(c[i>>2]|0)+88>>2];c[m>>2]=0;while(1){if(a[c[k>>2]>>0]|0){if(!(c[m>>2]|0)){b=a[c[k>>2]>>0]|0;b=((c[j>>2]|0?(b|0)==58&1:(b|0)==47&1)|0)!=0}else b=0;b=b^1}else b=0;d=c[k>>2]|0;if(!b)break;if((a[d>>0]|0)!=123){if((a[c[k>>2]>>0]|0)==125)c[m>>2]=(c[m>>2]|0)+-1}else c[m>>2]=(c[m>>2]|0)+1;c[k>>2]=(c[k>>2]|0)+1}c[g>>2]=d-(c[(c[i>>2]|0)+88>>2]|0);if(((c[g>>2]|0)+1|0)>>>0>(c[(c[i>>2]|0)+84>>2]|0)>>>0){c[(c[i>>2]|0)+84>>2]=(c[g>>2]|0)+1;m=Bg(c[(c[i>>2]|0)+80>>2]|0,c[(c[i>>2]|0)+84>>2]|0)|0;c[(c[i>>2]|0)+80>>2]=m}vi(c[(c[i>>2]|0)+80>>2]|0,c[(c[i>>2]|0)+88>>2]|0,c[g>>2]|0)|0;a[(c[(c[i>>2]|0)+80>>2]|0)+(c[g>>2]|0)>>0]=0;c[l>>2]=c[(c[i>>2]|0)+80>>2];if(!(a[(c[(c[i>>2]|0)+88>>2]|0)+(c[g>>2]|0)>>0]|0))c[(c[i>>2]|0)+88>>2]=0;else{m=(c[i>>2]|0)+88|0;c[m>>2]=(c[m>>2]|0)+((c[g>>2]|0)+1)}c[h>>2]=c[l>>2];m=c[h>>2]|0;ma=n;return m|0}function Af(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[f>>2]=a;c[e>>2]=b;b=zf(c[f>>2]|0,c[e>>2]|0,0)|0;ma=d;return b|0}function Bf(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;C=ma;ma=ma+128|0;y=C+120|0;n=C+16|0;j=C;A=C+112|0;l=C+108|0;B=C+104|0;v=C+100|0;w=C+96|0;z=C+88|0;h=C+84|0;o=C+80|0;p=C+76|0;k=C+72|0;D=C+64|0;i=C+56|0;m=C+52|0;q=C+48|0;r=C+44|0;s=C+40|0;t=C+32|0;u=C+24|0;c[A>>2]=b;c[l>>2]=d;c[B>>2]=e;c[v>>2]=f;c[w>>2]=g;c[p>>2]=0;c[k>>2]=1;Cf(D);c[z>>2]=c[D>>2];c[z+4>>2]=c[D+4>>2];if(c[(c[A>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;Pi(15191,c[665]|0)|0;Ai(c[665]|0)|0;Df(c[665]|0,c[B>>2]|0);D=c[665]|0;f=c[w>>2]|0;g=c[l>>2]|0;c[j>>2]=c[v>>2];c[j+4>>2]=f;c[j+8>>2]=g;Ki(D,15219,j)|0}c[h>>2]=c[B>>2];while(1){if(!(c[c[h>>2]>>2]|0)){x=10;break}if(Ge(c[A>>2]|0,c[c[h>>2]>>2]|0,1)|0){Ef(i,c[A>>2]|0,c[c[h>>2]>>2]|0);if(c[i>>2]|0?(Zf(z,c[c[i+4>>2]>>2]|0),(c[w>>2]|0)==0):0)break}else c[k>>2]=0;c[h>>2]=(c[h>>2]|0)+4}a:do if((x|0)==10){b=c[A>>2]|0;if(c[k>>2]|0){if(!(c[b+44>>2]&32))break;Pi(17619,c[665]|0)|0;Pi(15259,c[665]|0)|0;Ai(c[665]|0)|0;c[m>>2]=0;while(1){b=c[665]|0;if((c[m>>2]|0)>>>0>=(c[z>>2]|0)>>>0)break;c[n>>2]=c[(c[z+4>>2]|0)+(c[m>>2]<<2)>>2];Ki(b,17678,n)|0;c[m>>2]=(c[m>>2]|0)+1}Pi(17567,b)|0;break}c[o>>2]=yf(b,c[l>>2]|0)|0;while(1){if(!(c[p>>2]|0?0:(c[o>>2]|0)!=0))break a;c[r>>2]=1;if((a[c[o>>2]>>0]|0)==33?(a[(c[o>>2]|0)+1>>0]|0)==33:0){c[r>>2]=0;c[o>>2]=(c[o>>2]|0)+2}Dg(c[A>>2]|0,c[o>>2]|0)|0;if(c[(c[A>>2]|0)+92>>2]|0)b=Xe(c[A>>2]|0,c[B>>2]|0,c[o>>2]|0,c[w>>2]|0)|0;else b=0;c[q>>2]=b;do if(c[r>>2]|0){if(c[q>>2]|0){if(!(c[v>>2]|0))break;if(c[(c[q>>2]|0)+4>>2]|0)break}c[s>>2]=Eg(c[A>>2]|0,c[o>>2]|0)|0;if(c[s>>2]|0?c[c[s>>2]>>2]|0:0){if(!(c[q>>2]|0))c[q>>2]=yg(8)|0;D=c[q>>2]|0;Ff(t,c[A>>2]|0,c[s>>2]|0,c[B>>2]|0,c[w>>2]|0,2);c[D>>2]=c[t>>2];c[D+4>>2]=c[t+4>>2];if(((((c[(c[q>>2]|0)+4>>2]|0)==0?ng(c[A>>2]|0,15306)|0:0)?a[(ng(c[A>>2]|0,15306)|0)>>0]|0:0)?(a[(ng(c[A>>2]|0,15306)|0)>>0]|0)!=102:0)?(a[(ng(c[A>>2]|0,15306)|0)>>0]|0)!=48:0){D=c[q>>2]|0;Ff(u,c[A>>2]|0,c[s>>2]|0,c[B>>2]|0,c[w>>2]|0,3);c[D>>2]=c[u>>2];c[D+4>>2]=c[u+4>>2]}}}while(0);do if(c[q>>2]|0?c[(c[q>>2]|0)+4>>2]|0:0){b=c[q>>2]|0;if(c[w>>2]|0){c[y>>2]=c[b>>2];c[y+4>>2]=c[b+4>>2];$f(z,y);break}else{Zf(z,c[c[b+4>>2]>>2]|0);c[p>>2]=1;break}}while(0);c[o>>2]=yf(c[A>>2]|0,0)|0}}while(0);cg(z);if(c[z>>2]|0){if(c[w>>2]|0?c[(c[z+4>>2]|0)+((c[z>>2]|0)-1<<2)>>2]|0:0)x=46}else x=46;if((x|0)==46)Zf(z,0);b=c[A>>2]|0;if(!(c[(c[A>>2]|0)+92>>2]|0)){c[b+92>>2]=1;D=z+4|0;D=c[D>>2]|0;ma=C;return D|0}if(c[b+44>>2]&32|0){Pi(17619,c[665]|0)|0;Pi(15328,c[665]|0)|0;Ai(c[665]|0)|0;Df(c[665]|0,c[B>>2]|0);Pi(15359,c[665]|0)|0}D=c[A>>2]|0;c[y>>2]=c[z>>2];c[y+4>>2]=c[z+4>>2];Hf(D,y);if(!(c[(c[A>>2]|0)+44>>2]&32)){D=z+4|0;D=c[D>>2]|0;ma=C;return D|0}Ri(10,c[665]|0)|0;D=z+4|0;D=c[D>>2]|0;ma=C;return D|0}function Cf(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=0;c[d+4>>2]=0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];ma=b;return}function Df(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;e=f+4|0;d=f;c[e>>2]=a;c[d>>2]=b;Pi(15595,c[e>>2]|0)|0;while(1){if(!(c[d>>2]|0)){a=7;break}if(!(c[c[d>>2]>>2]|0)){a=7;break}Pi(c[c[d>>2]>>2]|0,c[e>>2]|0)|0;c[d>>2]=(c[d>>2]|0)+4;if(c[c[d>>2]>>2]|0)Pi(15597,c[e>>2]|0)|0}if((a|0)==7){Pi(15599,c[e>>2]|0)|0;ma=f;return}}function Ef(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;l=ma;ma=ma+48|0;k=l+8|0;j=l;f=l+44|0;g=l+40|0;h=l+32|0;i=l+24|0;m=l+16|0;c[f>>2]=d;c[g>>2]=e;Cf(m);c[h>>2]=c[m>>2];c[h+4>>2]=c[m+4>>2];c[i>>2]=Xf(c[f>>2]|0,c[g>>2]|0)|0;if(c[(c[f>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;m=c[665]|0;e=c[i>>2]|0?c[i>>2]|0:17175;c[j>>2]=c[g>>2];c[j+4>>2]=e;Ki(m,15538,j)|0;Ai(c[665]|0)|0}if(c[i>>2]|0)c[i>>2]=Cg(c[i>>2]|0)|0;if((((((c[i>>2]|0)==0?ng(c[f>>2]|0,15306)|0:0)?a[(ng(c[f>>2]|0,15306)|0)>>0]|0:0)?(a[(ng(c[f>>2]|0,15306)|0)>>0]|0)!=102:0)?(a[(ng(c[f>>2]|0,15306)|0)>>0]|0)!=48:0)?(c[i>>2]=Gf(c[f>>2]|0,c[g>>2]|0)|0,c[(c[f>>2]|0)+44>>2]&32|0):0){Pi(17619,c[665]|0)|0;m=c[665]|0;j=c[i>>2]|0?c[i>>2]|0:17175;c[k>>2]=c[g>>2];c[k+4>>2]=j;Ki(m,15566,k)|0;Ai(c[665]|0)|0}if(!(c[i>>2]|0)){c[b>>2]=c[h>>2];c[b+4>>2]=c[h+4>>2];ma=l;return}Zf(h,c[i>>2]|0);c[b>>2]=c[h>>2];c[b+4>>2]=c[h+4>>2];ma=l;return}function Ff(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;A=ma;ma=ma+96|0;x=A;t=A+88|0;u=A+84|0;v=A+80|0;w=A+76|0;h=A+72|0;i=A+68|0;j=A+64|0;y=A+56|0;k=A+48|0;z=A+44|0;l=A+40|0;m=A+32|0;n=A+28|0;o=A+24|0;p=A+20|0;q=A+16|0;r=A+12|0;s=A+8|0;c[t>>2]=b;c[u>>2]=d;c[v>>2]=e;c[w>>2]=f;c[h>>2]=g;c[k>>2]=75;c[z>>2]=yg(c[k>>2]|0)|0;if(c[(c[t>>2]|0)+44>>2]&32|0){c[l>>2]=(c[h>>2]|0)==3?15472:15476;Pi(17619,c[665]|0)|0;Pi(15479,c[665]|0)|0;Ai(c[665]|0)|0;Df(c[665]|0,c[v>>2]|0);g=c[665]|0;f=c[l>>2]|0;c[x>>2]=c[w>>2];c[x+4>>2]=f;Ki(g,15509,x)|0}Cf(m);c[y>>2]=c[m>>2];c[y+4>>2]=c[m+4>>2];c[i>>2]=c[c[u>>2]>>2];a:while(1){if(!(c[i>>2]|0)){b=17;break}c[p>>2]=c[c[i>>2]>>2];c[q>>2]=$h(c[p>>2]|0)|0;c[j>>2]=c[(c[i>>2]|0)+8>>2];c[n>>2]=0;while(1){if(!(c[(c[v>>2]|0)+(c[n>>2]<<2)>>2]|0))break;c[r>>2]=c[(c[v>>2]|0)+(c[n>>2]<<2)>>2];if(!(Ge(c[t>>2]|0,c[r>>2]|0,1)|0)){c[s>>2]=$h(c[r>>2]|0)|0;while(1){if(((c[q>>2]|0)+(c[s>>2]|0)+1|0)>>>0<=(c[k>>2]|0)>>>0)break;c[k>>2]=(c[k>>2]|0)+(c[k>>2]|0);c[z>>2]=Bg(c[z>>2]|0,c[k>>2]|0)|0}fi(c[z>>2]|0,c[p>>2]|0)|0;ki((c[z>>2]|0)+(c[q>>2]|0)|0,c[r>>2]|0)|0;c[o>>2]=ra[c[h>>2]&3](c[t>>2]|0,c[z>>2]|0)|0;if(c[o>>2]|0){Zf(y,c[o>>2]|0);fg(c[u>>2]|0,c[i>>2]|0);if(!(c[w>>2]|0)){b=13;break a}c[k>>2]=75;c[z>>2]=yg(c[k>>2]|0)|0}}c[n>>2]=(c[n>>2]|0)+1}c[i>>2]=c[j>>2]}if((b|0)==13){c[a>>2]=c[y>>2];c[a+4>>2]=c[y+4>>2];ma=A;return}else if((b|0)==17){Yg(c[z>>2]|0);c[a>>2]=c[y>>2];c[a+4>>2]=c[y+4>>2];ma=A;return}}function Gf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;l=ma;ma=ma+48|0;k=l+8|0;j=l;d=l+36|0;m=l+32|0;e=l+28|0;f=l+24|0;g=l+20|0;h=l+16|0;i=l+12|0;c[d>>2]=a;c[m>>2]=b;c[e>>2]=0;c[f>>2]=tg(c[m>>2]|0)|0;c[g>>2]=ug(c[m>>2]|0)|0;c[h>>2]=bj(c[g>>2]|0)|0;if(c[(c[d>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;m=c[665]|0;b=c[g>>2]|0;c[j>>2]=c[f>>2];c[j+4>>2]=b;Ki(m,15381,j)|0;Ai(c[665]|0)|0}if(c[h>>2]|0){while(1){m=aj(c[h>>2]|0)|0;c[i>>2]=m;if(!m)break;if(!(Vh((c[i>>2]|0)+11|0,c[f>>2]|0)|0)){c[e>>2]=Me(c[g>>2]|0,17682,(c[i>>2]|0)+11|0)|0;if(Xf(c[d>>2]|0,c[e>>2]|0)|0)break;if(c[(c[d>>2]|0)+44>>2]&32|0){m=c[665]|0;c[k>>2]=c[e>>2];Ki(m,15421,k)|0}Yg(c[e>>2]|0);c[e>>2]=0}}zg(c[h>>2]|0)}Yg(c[g>>2]|0);if(!(c[(c[d>>2]|0)+44>>2]&32)){m=c[e>>2]|0;ma=l;return m|0}Pi(c[e>>2]|0?c[e>>2]|0:17175,c[665]|0)|0;Ti(10,c[665]|0)|0;m=c[e>>2]|0;ma=l;return m|0}function Hf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+32|0;h=i;d=i+20|0;e=i+16|0;f=i+12|0;g=i+8|0;c[d>>2]=a;if((c[(c[d>>2]|0)+100>>2]|0)==0?(c[e>>2]=ng(c[d>>2]|0,15364)|0,c[(c[d>>2]|0)+100>>2]=1,c[e>>2]|0):0){a=Ye(c[e>>2]|0,16706)|0;c[(c[d>>2]|0)+96>>2]=a;if(!(c[(c[d>>2]|0)+96>>2]|0))Si(c[e>>2]|0);Yg(c[e>>2]|0)}if((c[(c[d>>2]|0)+44>>2]&32|0)==0?(c[(c[d>>2]|0)+96>>2]|0)==0:0){ma=i;return}c[f>>2]=0;while(1){if((c[f>>2]|0)>>>0>=(c[b>>2]|0)>>>0){a=17;break}if(!(c[(c[b+4>>2]|0)+(c[f>>2]<<2)>>2]|0)){a=17;break}c[g>>2]=c[(c[b+4>>2]|0)+(c[f>>2]<<2)>>2];if(c[(c[d>>2]|0)+96>>2]|0?Ge(c[d>>2]|0,c[g>>2]|0,0)|0:0){e=c[(c[d>>2]|0)+96>>2]|0;j=ja(0)|0;a=c[g>>2]|0;c[h>>2]=j;c[h+4>>2]=a;Ki(e,15373,h)|0}if(c[(c[d>>2]|0)+44>>2]&32|0){Ri(32,c[665]|0)|0;Pi(c[g>>2]|0,c[665]|0)|0}c[f>>2]=(c[f>>2]|0)+1}if((a|0)==17){ma=i;return}}function If(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;g=ma;ma=ma+32|0;l=g+20|0;k=g+16|0;j=g+12|0;i=g+8|0;h=g+4|0;f=g;c[l>>2]=a;c[k>>2]=b;c[j>>2]=d;c[i>>2]=e;c[h>>2]=Jf(c[l>>2]|0,c[k>>2]|0,c[j>>2]|0,c[i>>2]|0,0)|0;c[f>>2]=c[c[h>>2]>>2];Yg(c[h>>2]|0);ma=g;return c[f>>2]|0}function Jf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;u=ma;ma=ma+96|0;o=u+80|0;t=u+16|0;g=u;r=u+72|0;k=u+68|0;s=u+64|0;l=u+60|0;m=u+56|0;p=u+48|0;q=u+44|0;h=u+40|0;i=u+32|0;j=u+24|0;c[r>>2]=a;c[k>>2]=b;c[s>>2]=d;c[l>>2]=e;c[m>>2]=f;c[q>>2]=bf(c[r>>2]|0,c[s>>2]|0)|0;if(c[(c[r>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;f=c[665]|0;b=c[l>>2]|0;d=c[m>>2]|0;e=c[k>>2]|0;c[g>>2]=c[q>>2];c[g+4>>2]=b;c[g+8>>2]=d;c[g+12>>2]=e;Ki(f,15601,g)|0;Ai(c[665]|0)|0}c[h>>2]=Ge(c[r>>2]|0,c[q>>2]|0,1)|0;a=c[r>>2]|0;if(c[h>>2]|0){Ef(i,a,c[q>>2]|0);c[p>>2]=c[i>>2];c[p+4>>2]=c[i+4>>2]}else{Kf(j,a,c[k>>2]|0,c[q>>2]|0,c[l>>2]|0,c[m>>2]|0);c[p>>2]=c[j>>2];c[p+4>>2]=c[j+4>>2]}if(c[p>>2]|0){if(c[m>>2]|0?c[(c[p+4>>2]|0)+((c[p>>2]|0)-1<<2)>>2]|0:0)n=9}else n=9;if((n|0)==9)Zf(p,0);a=c[r>>2]|0;if(!(c[(c[r>>2]|0)+92>>2]|0)){c[a+92>>2]=1;t=c[q>>2]|0;Yg(t);t=p+4|0;t=c[t>>2]|0;ma=u;return t|0}if(c[a+44>>2]&32|0){Pi(17619,c[665]|0)|0;n=c[665]|0;c[t>>2]=c[s>>2];Ki(n,15663,t)|0;Ai(c[665]|0)|0}t=c[r>>2]|0;c[o>>2]=c[p>>2];c[o+4>>2]=c[p+4>>2];Hf(t,o);if(!(c[(c[r>>2]|0)+44>>2]&32)){t=c[q>>2]|0;Yg(t);t=p+4|0;t=c[t>>2]|0;ma=u;return t|0}Ri(10,c[665]|0)|0;t=c[q>>2]|0;Yg(t);t=p+4|0;t=c[t>>2]|0;ma=u;return t|0}function Kf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;x=ma;ma=ma+112|0;k=x+96|0;j=x;u=x+92|0;i=x+88|0;v=x+84|0;w=x+80|0;l=x+76|0;m=x+72|0;n=x+64|0;o=x+56|0;y=x+48|0;p=x+40|0;q=x+36|0;r=x+32|0;s=x+24|0;t=x+16|0;c[u>>2]=d;c[i>>2]=e;c[v>>2]=f;c[w>>2]=g;c[l>>2]=h;c[o>>2]=0;Cf(y);c[n>>2]=c[y>>2];c[n+4>>2]=c[y+4>>2];if(c[(c[u>>2]|0)+44>>2]&32|0){Pi(17619,c[665]|0)|0;y=c[665]|0;f=c[l>>2]|0;g=c[w>>2]|0;h=c[i>>2]|0;c[j>>2]=c[v>>2];c[j+4>>2]=f;c[j+8>>2]=g;c[j+12>>2]=h;Ki(y,15692,j)|0;Ai(c[665]|0)|0}c[m>>2]=yf(c[u>>2]|0,c[i>>2]|0)|0;while(1){if(!(c[o>>2]|0?0:(c[m>>2]|0)!=0))break;c[q>>2]=1;if((a[c[m>>2]>>0]|0)==33?(a[(c[m>>2]|0)+1>>0]|0)==33:0){c[q>>2]=0;c[m>>2]=(c[m>>2]|0)+2}Dg(c[u>>2]|0,c[m>>2]|0)|0;if(c[(c[u>>2]|0)+92>>2]|0)d=Ue(c[u>>2]|0,c[v>>2]|0,c[m>>2]|0,c[l>>2]|0)|0;else d=0;c[p>>2]=d;do if(c[q>>2]|0){if(c[p>>2]|0){if(!(c[w>>2]|0))break;if(c[(c[p>>2]|0)+4>>2]|0)break}c[r>>2]=Eg(c[u>>2]|0,c[m>>2]|0)|0;if(c[r>>2]|0?c[c[r>>2]>>2]|0:0){if(!(c[p>>2]|0))c[p>>2]=yg(8)|0;y=c[p>>2]|0;Lf(s,c[u>>2]|0,c[r>>2]|0,c[v>>2]|0,c[l>>2]|0,2);c[y>>2]=c[s>>2];c[y+4>>2]=c[s+4>>2];if(((((c[(c[p>>2]|0)+4>>2]|0)==0?ng(c[u>>2]|0,15306)|0:0)?a[(ng(c[u>>2]|0,15306)|0)>>0]|0:0)?(a[(ng(c[u>>2]|0,15306)|0)>>0]|0)!=102:0)?(a[(ng(c[u>>2]|0,15306)|0)>>0]|0)!=48:0){y=c[p>>2]|0;Lf(t,c[u>>2]|0,c[r>>2]|0,c[v>>2]|0,c[l>>2]|0,3);c[y>>2]=c[t>>2];c[y+4>>2]=c[t+4>>2]}}}while(0);do if(c[p>>2]|0?c[(c[p>>2]|0)+4>>2]|0:0){d=c[p>>2]|0;if(c[l>>2]|0){c[k>>2]=c[d>>2];c[k+4>>2]=c[d+4>>2];$f(n,k);break}else{Zf(n,c[c[d+4>>2]>>2]|0);c[o>>2]=1;break}}while(0);if(c[p>>2]|0){bg(c[p>>2]|0);Yg(c[p>>2]|0)}c[m>>2]=yf(c[u>>2]|0,0)|0}c[b>>2]=c[n>>2];c[b+4>>2]=c[n+4>>2];ma=x;return}function Lf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;y=ma;ma=ma+96|0;v=y;r=y+80|0;s=y+76|0;t=y+72|0;u=y+68|0;h=y+64|0;i=y+60|0;j=y+56|0;w=y+48|0;k=y+44|0;l=y+40|0;x=y+36|0;m=y+32|0;n=y+24|0;o=y+20|0;p=y+16|0;q=y+12|0;c[r>>2]=b;c[s>>2]=d;c[t>>2]=e;c[u>>2]=f;c[h>>2]=g;c[k>>2]=$h(c[t>>2]|0)|0;c[l>>2]=75;c[x>>2]=yg(c[l>>2]|0)|0;if(c[(c[r>>2]|0)+44>>2]&32|0){c[m>>2]=(c[h>>2]|0)==3?15472:15476;Pi(17619,c[665]|0)|0;g=c[665]|0;e=c[u>>2]|0;f=c[m>>2]|0;c[v>>2]=c[t>>2];c[v+4>>2]=e;c[v+8>>2]=f;Ki(g,15752,v)|0;Ai(c[665]|0)|0}Cf(n);c[w>>2]=c[n>>2];c[w+4>>2]=c[n+4>>2];c[i>>2]=c[c[s>>2]>>2];while(1){if(!(c[i>>2]|0)){b=13;break}c[p>>2]=c[c[i>>2]>>2];c[q>>2]=$h(c[p>>2]|0)|0;c[j>>2]=c[(c[i>>2]|0)+8>>2];while(1){if(((c[q>>2]|0)+(c[k>>2]|0)+1|0)>>>0<=(c[l>>2]|0)>>>0)break;c[l>>2]=(c[l>>2]|0)+(c[l>>2]|0);c[x>>2]=Bg(c[x>>2]|0,c[l>>2]|0)|0}fi(c[x>>2]|0,c[p>>2]|0)|0;ki(c[x>>2]|0,c[t>>2]|0)|0;c[o>>2]=ra[c[h>>2]&3](c[r>>2]|0,c[x>>2]|0)|0;if(c[o>>2]|0){Zf(w,c[o>>2]|0);fg(c[s>>2]|0,c[i>>2]|0);if(!(c[u>>2]|0)){b=10;break}c[l>>2]=75;c[x>>2]=yg(c[l>>2]|0)|0}c[i>>2]=c[j>>2]}if((b|0)==10){c[a>>2]=c[w>>2];c[a+4>>2]=c[w+4>>2];ma=y;return}else if((b|0)==13){Yg(c[x>>2]|0);c[a>>2]=c[w>>2];c[a+4>>2]=c[w+4>>2];ma=y;return}}function Mf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;f=ma;ma=ma+16|0;i=f+12|0;h=f+8|0;g=f+4|0;e=f;c[i>>2]=a;c[h>>2]=b;c[g>>2]=d;c[e>>2]=Jf(c[i>>2]|0,c[h>>2]|0,c[g>>2]|0,1,1)|0;ma=f;return c[e>>2]|0}function Nf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=ma;ma=ma+112|0;l=m;e=m+100|0;f=m+96|0;g=m+92|0;h=m+88|0;i=m+84|0;j=m+80|0;k=m+4|0;c[e>>2]=b;c[f>>2]=d;c[i>>2]=0;a:do if(Ge(c[e>>2]|0,c[f>>2]|0,1)|0)c[i>>2]=Cg(c[f>>2]|0)|0;else{d=c[e>>2]|0;c[j>>2]=yf(d,fa(15806)|0)|0;while(1){if(!(c[i>>2]|0?0:(c[j>>2]|0)!=0))break a;if(!(a[c[j>>2]>>0]|0))c[j>>2]=18016;c[g>>2]=Me(c[j>>2]|0,17682,c[f>>2]|0)|0;if(((kh(c[g>>2]|0,k)|0)==0?c[k+12>>2]&73|0:0)?(c[k+12>>2]&61440|0)!=16384:0)c[i>>2]=c[g>>2];else Yg(c[g>>2]|0);c[j>>2]=yf(c[e>>2]|0,0)|0}}while(0);if(!(c[i>>2]|0))c[i>>2]=Me(18016,17682,c[f>>2]|0)|0;c[g>>2]=Of(c[e>>2]|0,c[i>>2]|0)|0;if(c[g>>2]|0){c[g>>2]=Pf(c[e>>2]|0,c[g>>2]|0)|0;Yg(c[i>>2]|0);c[h>>2]=ug(c[g>>2]|0)|0;Yg(c[g>>2]|0);ma=m;return c[h>>2]|0}else{m=c[665]|0;c[l>>2]=c[i>>2];Ki(m,15811,l)|0;da(1)}return 0}function Of(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;u=ma;ma=ma+8416|0;q=u+8296|0;p=u+8272|0;o=u+8248|0;n=u+8224|0;r=u+8200|0;t=u+8192|0;s=u+8404|0;h=u+8400|0;v=u+8396|0;i=u+6144|0;j=u+4096|0;k=u+2048|0;l=u;m=u+8392|0;e=u+8408|0;f=u+8316|0;g=u+8312|0;c[h>>2]=b;c[v>>2]=d;fi(i,c[v>>2]|0)|0;fi(21120,35056)|0;while(1){if(!((a[i>>0]|0)==0^1)){b=59;break}Qf(21120,i);if(jh(21120,f)|0){b=4;break}if((c[f+12>>2]&61440|0)==40960){Rf(21120,j);if(ai(j,17682,1)|0){a[e>>0]=a[21120]|0;fi(k,Sf(21120)|0)|0;if((a[21120]|0)==0?(a[e>>0]|0)==47:0)fi(21120,17682)|0;if(c[(c[h>>2]|0)+116>>2]|0){if(!(a[21120]|0))b=0;else b=(Ph(21120,17682)|0)!=0;if(!(a[i>>0]|0))d=0;else d=(Ph(i,17682)|0)!=0;c[n>>2]=21120;c[n+4>>2]=b?17682:35056;c[n+8>>2]=k;c[n+12>>2]=d?17682:35056;c[n+16>>2]=i;wi(l,15980,n)|0;if(!(a[21120]|0))b=0;else b=(Ph(21120,17682)|0)!=0;if(!(a[i>>0]|0))d=0;else d=(Ph(i,17682)|0)!=0;c[o>>2]=l;c[o+4>>2]=21120;c[o+8>>2]=b?17682:35056;c[o+12>>2]=j;c[o+16>>2]=d?17682:35056;c[o+20>>2]=i;Oi(15993,o)|0}c[g>>2]=0;a[e>>0]=a[21120]|0;while(1){if(ai(j,15862,2)|0)break;if(a[j+2>>0]|0?(a[j+2>>0]|0)!=47:0)break;if(!(a[21120]|0))break;if(!(Ph(21120,18016)|0))break;if(!(Ph(21120,15862)|0))break;if(($h(21120)|0)>>>0>=3?(Ph(21120+($h(21120)|0)+-3|0,16013)|0)==0:0)break;c[g>>2]=1;Tf(j)|0;Sf(21120)|0}do if(c[g>>2]|0?c[(c[h>>2]|0)+116>>2]|0:0){c[m>>2]=l;while(1){if(!(a[c[m>>2]>>0]|0))break;v=c[m>>2]|0;c[m>>2]=v+1;a[v>>0]=32}if(!($h(j)|0)){if(!(a[i>>0]|0))b=0;else b=(Ph(i,17682)|0)!=0;c[q>>2]=l;c[q+4>>2]=21120;c[q+8>>2]=b?17682:35056;c[q+12>>2]=i;Oi(16035,q)|0;break}if(!(a[21120]|0))b=0;else b=(Ph(21120,17682)|0)!=0;if(!(a[i>>0]|0))d=0;else d=(Ph(i,17682)|0)!=0;c[p>>2]=l;c[p+4>>2]=21120;c[p+8>>2]=b?17682:35056;c[p+12>>2]=j;c[p+16>>2]=d?17682:35056;c[p+20>>2]=i;Oi(16017,p)|0}while(0);if((a[21120]|0)==0?(a[e>>0]|0)==47:0)fi(21120,17682)|0}else{if(c[(c[h>>2]|0)+116>>2]|0){if(!(a[i>>0]|0))b=0;else b=(Ph(i,17682)|0)!=0;if(!(a[i>>0]|0))d=0;else d=(Ph(i,17682)|0)!=0;c[r>>2]=21120;c[r+4>>2]=b?17682:35056;c[r+8>>2]=i;c[r+12>>2]=j;c[r+16>>2]=d?17682:35056;c[r+20>>2]=i;Oi(15958,r)|0}fi(21120,35056)|0}if(a[i>>0]|0?a[j>>0]|0:0)ki(j,17682)|0;ki(j,i)|0;fi(i,j)|0}}if((b|0)==4){v=c[665]|0;c[t>>2]=21120;Ki(v,15939,t)|0;Si(21120);c[s>>2]=0;v=c[s>>2]|0;ma=u;return v|0}else if((b|0)==59){c[s>>2]=21120;v=c[s>>2]|0;ma=u;return v|0}return 0}function Pf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;n=ma;ma=ma+48|0;f=n+32|0;o=n+28|0;g=n+24|0;h=n+20|0;i=n+16|0;j=n+12|0;k=n+8|0;l=n+4|0;e=n;c[f>>2]=b;c[o>>2]=d;c[i>>2]=0;c[g>>2]=Af(c[f>>2]|0,c[o>>2]|0)|0;while(1){if(!(c[g>>2]|0))break;if(c[g>>2]|0?(Ph(c[g>>2]|0,18016)|0)==0:0){if(!(c[i>>2]|0))c[i>>2]=xg()|0}else m=7;a:do if((m|0)==7){m=0;if(c[g>>2]|0?(Ph(c[g>>2]|0,15862)|0)==0:0){if(!(c[i>>2]|0)){c[j>>2]=xg()|0;c[i>>2]=ug(c[j>>2]|0)|0;Yg(c[j>>2]|0);break}c[l>>2]=c[i>>2];c[k>>2]=$h(c[l>>2]|0)|0;while(1){if((c[k>>2]|0)>>>0<=0)break a;if((a[(c[l>>2]|0)+((c[k>>2]|0)-1)>>0]|0)==47)break;c[k>>2]=(c[k>>2]|0)+-1}a[(c[l>>2]|0)+((c[k>>2]|0)>>>0>1?(c[k>>2]|0)-1|0:1)>>0]=0;break}if(c[i>>2]|0){c[e>>2]=c[i>>2];c[h>>2]=$h(c[i>>2]|0)|0;c[i>>2]=Me(c[i>>2]|0,(a[(c[i>>2]|0)+((c[h>>2]|0)-1)>>0]|0)==47?35056:17682,c[g>>2]|0)|0;Yg(c[e>>2]|0);break}else{c[i>>2]=Le(17682,c[g>>2]|0)|0;break}}while(0);c[g>>2]=Af(c[f>>2]|0,0)|0}if(!(c[i>>2]|0))C(15865,15869,302,15927);c[h>>2]=$h(c[i>>2]|0)|0;if((c[h>>2]|0)>>>0<=0){o=c[i>>2]|0;ma=n;return o|0}if((a[(c[i>>2]|0)+((c[h>>2]|0)-1)>>0]|0)!=47){o=c[i>>2]|0;ma=n;return o|0}a[(c[i>>2]|0)+((c[h>>2]|0)-1)>>0]=0;o=c[i>>2]|0;ma=n;return o|0}function Qf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;e=h+8|0;f=h+4|0;g=h;c[e>>2]=b;c[f>>2]=d;c[g>>2]=$h(c[e>>2]|0)|0;if((c[g>>2]|0)>0?(a[(c[e>>2]|0)+((c[g>>2]|0)-1)>>0]|0)!=47:0){a[(c[e>>2]|0)+(c[g>>2]|0)>>0]=47;a[(c[e>>2]|0)+((c[g>>2]|0)+1)>>0]=0}g=c[e>>2]|0;ki(g,Tf(c[f>>2]|0)|0)|0;ma=h;return}function Rf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;e=h+8|0;f=h+4|0;g=h;c[e>>2]=b;c[f>>2]=d;c[g>>2]=ej(c[e>>2]|0,c[f>>2]|0,2048)|0;if((c[g>>2]|0)<0){Si(c[e>>2]|0);da(1)}else{a[(c[f>>2]|0)+(c[g>>2]|0)>>0]=0;ma=h;return}}function Sf(b){b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=b;b=c[d>>2]|0;c[e>>2]=b+($h(c[d>>2]|0)|0);while(1){if((c[e>>2]|0)>>>0<=(c[d>>2]|0)>>>0)break;if((a[c[e>>2]>>0]|0)==47)break;c[e>>2]=(c[e>>2]|0)+-1}fi(25216,(c[e>>2]|0)+((a[c[e>>2]>>0]|0)==47&1)|0)|0;a[c[e>>2]>>0]=0;ma=f;return 25216}function Tf(b){b=b|0;var d=0,e=0,f=0,g=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=b;c[e>>2]=c[d>>2];while(1){if(!(a[c[e>>2]>>0]|0))break;if((a[c[e>>2]>>0]|0)==47?(c[e>>2]|0)!=(c[d>>2]|0):0)break;c[e>>2]=(c[e>>2]|0)+1}vi(23168,c[d>>2]|0,(c[e>>2]|0)-(c[d>>2]|0)|0)|0;a[23168+((c[e>>2]|0)-(c[d>>2]|0))>>0]=0;if((a[c[e>>2]>>0]|0)==47)c[e>>2]=(c[e>>2]|0)+1;do{b=c[e>>2]|0;c[e>>2]=b+1;b=a[b>>0]|0;g=c[d>>2]|0;c[d>>2]=g+1;a[g>>0]=b}while((b<<24>>24|0)!=0);ma=f;return 23168}function Uf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=ma;ma=ma+64|0;r=s+16|0;q=s+8|0;p=s;i=s+52|0;j=s+48|0;k=s+44|0;l=s+40|0;m=s+36|0;n=s+32|0;o=s+28|0;f=s+24|0;g=s+20|0;h=s+56|0;c[i>>2]=b;c[j>>2]=d;c[k>>2]=e;c[g>>2]=fa(16049)|0;if(c[g>>2]|0){g=lj(c[g>>2]|0)|0;e=(c[i>>2]|0)+44|0;c[e>>2]=c[e>>2]|g}j=Cg(c[j>>2]|0)|0;c[(c[i>>2]|0)+104>>2]=j;c[m>>2]=Nf(c[i>>2]|0,c[(c[i>>2]|0)+104>>2]|0)|0;j=c[i>>2]|0;Ag(j,16064,Vf(c[m>>2]|0)|0);c[n>>2]=ug(c[m>>2]|0)|0;j=c[i>>2]|0;Ag(j,16076,Vf(c[n>>2]|0)|0);c[o>>2]=ug(c[n>>2]|0)|0;j=c[i>>2]|0;Ag(j,16088,Vf(c[o>>2]|0)|0);c[f>>2]=ug(c[o>>2]|0)|0;j=c[i>>2]|0;Ag(j,16103,Vf(c[f>>2]|0)|0);Yg(c[m>>2]|0);Yg(c[n>>2]|0);Yg(c[o>>2]|0);Yg(c[f>>2]|0);o=Cg(tg(c[(c[i>>2]|0)+104>>2]|0)|0)|0;c[(c[i>>2]|0)+108>>2]=o;do if(c[k>>2]|0){o=Cg(c[k>>2]|0)|0;c[(c[i>>2]|0)+112>>2]=o}else{c[l>>2]=Mg(c[(c[i>>2]|0)+108>>2]|0)|0;if((c[l>>2]|0)!=0&(c[l>>2]|0)!=0?(Ph(c[l>>2]|0,16123)|0)==0:0){o=Yf(c[(c[i>>2]|0)+108>>2]|0)|0;c[(c[i>>2]|0)+112>>2]=o;break}o=Cg(c[(c[i>>2]|0)+108>>2]|0)|0;c[(c[i>>2]|0)+112>>2]=o}while(0);a[h>>0]=a[16127]|0;a[h+1>>0]=a[16128]|0;a[h+2>>0]=a[16129]|0;a[h+3>>0]=a[16130]|0;if((mh(h,2,16131,p)|0)!=1)C(16133,15869,701,16179);if(a[h+1>>0]|0)C(16133,15869,701,16179);if((mh(h,2,16706,q)|0)>>>0<2)C(16205,15869,702,16179);if(a[h+1>>0]|0)C(16205,15869,702,16179);if((mh(h,2,16262,r)|0)>>>0<2)C(16266,15869,703,16179);if(a[h+1>>0]|0)C(16266,15869,703,16179);if((c[i>>2]|0)==30292){q=c[i>>2]|0;r=c[i>>2]|0;r=r+112|0;r=c[r>>2]|0;Ag(q,16324,r);ma=s;return}c[7599]=Cg(c[(c[i>>2]|0)+104>>2]|0)|0;c[7600]=Cg(c[(c[i>>2]|0)+108>>2]|0)|0;q=c[i>>2]|0;r=c[i>>2]|0;r=r+112|0;r=c[r>>2]|0;Ag(q,16324,r);ma=s;return}function Vf(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;c[b>>2]=a;ma=d;return c[b>>2]|0}function Wf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;f=d+4|0;e=d;c[f>>2]=a;c[e>>2]=b;Uf(30292,c[f>>2]|0,c[e>>2]|0);ma=d;return}function Xf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+112|0;f=l+96|0;e=l+92|0;g=l+88|0;h=l+12|0;i=l+8|0;j=l+4|0;k=l;c[e>>2]=b;c[g>>2]=d;Dg(c[e>>2]|0,c[g>>2]|0)|0;if(((jj(c[g>>2]|0,4)|0)==0?(kh(c[g>>2]|0,h)|0)==0:0)?(c[h+12>>2]&61440|0)!=16384:0){c[f>>2]=c[g>>2];k=c[f>>2]|0;ma=l;return k|0}if((c[(fh()|0)>>2]|0)==36){c[i>>2]=0;c[j>>2]=c[g>>2];c[k>>2]=c[g>>2];while(1){b=c[i>>2]|0;if(!(a[c[j>>2]>>0]|0))break;if(b>>>0<=255)c[k>>2]=c[j>>2];b=c[i>>2]|0;if((a[c[j>>2]>>0]|0)==47){if(b>>>0>255){d=c[k>>2]|0;e=c[j>>2]|0;Ij(d|0,e|0,($h(c[j>>2]|0)|0)+1|0)|0;c[j>>2]=c[k>>2]}c[i>>2]=0}else c[i>>2]=b+1;c[j>>2]=(c[j>>2]|0)+1}if(b>>>0>255)a[c[k>>2]>>0]=0;if(((jj(c[g>>2]|0,4)|0)==0?(kh(c[g>>2]|0,h)|0)==0:0)?(c[h+12>>2]&61440|0)!=16384:0){c[f>>2]=c[g>>2];k=c[f>>2]|0;ma=l;return k|0}}else if((c[(fh()|0)>>2]|0)==13?(gg(c[e>>2]|0,16333)|0)==0:0)Si(c[g>>2]|0);c[f>>2]=0;k=c[f>>2]|0;ma=l;return k|0}function Yf(b){b=b|0;var d=0,e=0,f=0,g=0;g=ma;ma=ma+16|0;d=g+8|0;e=g+4|0;f=g;c[d>>2]=b;c[f>>2]=Mg(c[d>>2]|0)|0;if(c[f>>2]|0){c[f>>2]=(c[f>>2]|0)+-1;c[e>>2]=yg((c[f>>2]|0)-(c[d>>2]|0)+1|0)|0;vi(c[e>>2]|0,c[d>>2]|0,(c[f>>2]|0)-(c[d>>2]|0)|0)|0;a[(c[e>>2]|0)+((c[f>>2]|0)-(c[d>>2]|0))>>0]=0;f=c[e>>2]|0;ma=g;return f|0}else{c[e>>2]=Cg(c[d>>2]|0)|0;f=c[e>>2]|0;ma=g;return f|0}return 0}function Zf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;e=d+4|0;f=d;c[e>>2]=a;c[f>>2]=b;b=c[e>>2]|0;c[b>>2]=(c[b>>2]|0)+1;b=Bg(c[(c[e>>2]|0)+4>>2]|0,c[c[e>>2]>>2]<<2)|0;c[(c[e>>2]|0)+4>>2]=b;c[(c[(c[e>>2]|0)+4>>2]|0)+((c[c[e>>2]>>2]|0)-1<<2)>>2]=c[f>>2];ma=d;return}function _f(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ma;ma=ma+16|0;e=d+4|0;f=d;c[e>>2]=a;c[f>>2]=b;b=c[e>>2]|0;c[b>>2]=(c[b>>2]|0)+1;b=Bg(c[(c[e>>2]|0)+4>>2]|0,c[c[e>>2]>>2]<<2)|0;c[(c[e>>2]|0)+4>>2]=b;c[(c[(c[e>>2]|0)+4>>2]|0)+((c[c[e>>2]>>2]|0)-1<<2)>>2]=c[f>>2];ma=d;return}function $f(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=ma;ma=ma+16|0;d=g+8|0;e=g+4|0;f=g;c[d>>2]=a;c[f>>2]=c[c[d>>2]>>2];a=c[d>>2]|0;c[a>>2]=(c[a>>2]|0)+(c[b>>2]|0);a=Bg(c[(c[d>>2]|0)+4>>2]|0,c[c[d>>2]>>2]<<2)|0;c[(c[d>>2]|0)+4>>2]=a;c[e>>2]=0;while(1){if((c[e>>2]|0)>>>0>=(c[b>>2]|0)>>>0)break;c[(c[(c[d>>2]|0)+4>>2]|0)+((c[f>>2]|0)+(c[e>>2]|0)<<2)>>2]=c[(c[b+4>>2]|0)+(c[e>>2]<<2)>>2];c[e>>2]=(c[e>>2]|0)+1}ma=g;return}function ag(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+32|0;f=j+20|0;d=j+16|0;g=j+12|0;h=j+8|0;i=j+4|0;e=j;c[f>>2]=a;if(!(c[b>>2]|0)){ma=j;return}if(!(c[c[f>>2]>>2]|0)){c[c[f>>2]>>2]=c[b>>2];i=yg(c[b>>2]<<2)|0;c[(c[f>>2]|0)+4>>2]=i;c[d>>2]=0;while(1){if((c[d>>2]|0)==(c[b>>2]|0))break;i=Cg(c[(c[b+4>>2]|0)+(c[d>>2]<<2)>>2]|0)|0;c[(c[(c[f>>2]|0)+4>>2]|0)+(c[d>>2]<<2)>>2]=i;c[d>>2]=(c[d>>2]|0)+1}ma=j;return}c[h>>2]=yg((r(c[c[f>>2]>>2]|0,c[b>>2]|0)|0)<<2)|0;c[g>>2]=0;c[e>>2]=0;while(1){d=(c[e>>2]|0)!=(c[b>>2]|0);c[i>>2]=0;if(!d)break;while(1){if((c[i>>2]|0)==(c[c[f>>2]>>2]|0))break;d=Le(c[(c[(c[f>>2]|0)+4>>2]|0)+(c[i>>2]<<2)>>2]|0,c[(c[b+4>>2]|0)+(c[e>>2]<<2)>>2]|0)|0;c[(c[h>>2]|0)+(c[g>>2]<<2)>>2]=d;c[g>>2]=(c[g>>2]|0)+1;c[i>>2]=(c[i>>2]|0)+1}c[e>>2]=(c[e>>2]|0)+1}while(1){a=c[(c[f>>2]|0)+4>>2]|0;if((c[i>>2]|0)==(c[c[f>>2]>>2]|0))break;Yg(c[a+(c[i>>2]<<2)>>2]|0);c[i>>2]=(c[i>>2]|0)+1}Yg(a);c[c[f>>2]>>2]=c[g>>2];c[(c[f>>2]|0)+4>>2]=c[h>>2];ma=j;return}function bg(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;c[b>>2]=a;if(!(c[(c[b>>2]|0)+4>>2]|0)){ma=d;return}Yg(c[(c[b>>2]|0)+4>>2]|0);c[(c[b>>2]|0)+4>>2]=0;ma=d;return}function cg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;i=ma;ma=ma+32|0;b=i+28|0;d=i+24|0;e=i+16|0;f=i+8|0;g=i+4|0;h=i;c[b>>2]=a;dg(e);c[d>>2]=0;while(1){a=c[b>>2]|0;if((c[d>>2]|0)>>>0>=(c[c[b>>2]>>2]|0)>>>0)break;c[f>>2]=c[(c[a+4>>2]|0)+(c[d>>2]<<2)>>2];c[g>>2]=(c[d>>2]|0)+1;while(1){if((c[g>>2]|0)>>>0>=(c[c[b>>2]>>2]|0)>>>0)break;c[h>>2]=c[(c[(c[b>>2]|0)+4>>2]|0)+(c[g>>2]<<2)>>2];if((c[f>>2]|0)!=0&(c[h>>2]|0)!=0?(Ph(c[f>>2]|0,c[h>>2]|0)|0)==0:0)break;c[g>>2]=(c[g>>2]|0)+1}a=c[f>>2]|0;if((c[g>>2]|0)==(c[c[b>>2]>>2]|0))Zf(e,a);else Yg(a);c[d>>2]=(c[d>>2]|0)+1}c[a>>2]=c[e>>2];c[a+4>>2]=c[e+4>>2];ma=i;return}function dg(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=0;c[d+4>>2]=0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];ma=b;return}function eg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;g=ma;ma=ma+16|0;e=g+12|0;h=g+8|0;f=g+4|0;d=g;c[e>>2]=a;c[h>>2]=b;c[d>>2]=yg(12)|0;c[c[d>>2]>>2]=c[h>>2];c[(c[d>>2]|0)+4>>2]=0;c[(c[d>>2]|0)+8>>2]=0;c[f>>2]=c[c[e>>2]>>2];while(1){if(!(c[f>>2]|0))break;if(!(c[(c[f>>2]|0)+8>>2]|0))break;c[f>>2]=c[(c[f>>2]|0)+8>>2]}a=c[d>>2]|0;if(c[f>>2]|0){c[(c[f>>2]|0)+8>>2]=a;ma=g;return}else{c[c[e>>2]>>2]=a;ma=g;return}}function fg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+32|0;g=j+20|0;h=j+16|0;i=j+12|0;d=j+8|0;e=j+4|0;f=j;c[g>>2]=a;c[h>>2]=b;if(c[(c[h>>2]|0)+4>>2]|0){ma=j;return}c[i>>2]=0;c[d>>2]=c[c[g>>2]>>2];while(1){a=c[d>>2]|0;if(!(c[(c[d>>2]|0)+4>>2]|0))break;c[i>>2]=a;c[d>>2]=c[(c[d>>2]|0)+8>>2]}do if((a|0)!=(c[h>>2]|0)){c[f>>2]=c[(c[h>>2]|0)+8>>2];c[e>>2]=c[d>>2];while(1){if((c[(c[e>>2]|0)+8>>2]|0)==(c[h>>2]|0))break;c[e>>2]=c[(c[e>>2]|0)+8>>2]}c[(c[e>>2]|0)+8>>2]=c[f>>2];c[(c[h>>2]|0)+8>>2]=c[d>>2];a=c[h>>2]|0;if(c[i>>2]|0){c[(c[i>>2]|0)+8>>2]=a;break}else{c[c[g>>2]>>2]=a;break}}while(0);c[(c[h>>2]|0)+4>>2]=1;ma=j;return}
function va(a){a=a|0;var b=0;b=ma;ma=ma+a|0;ma=ma+15&-16;return b|0}function wa(){return ma|0}function xa(a){a=a|0;ma=a}function ya(a,b){a=a|0;b=b|0;ma=a;na=b}function za(){Ri(10,c[7337]|0)|0;Ri(10,c[7338]|0)|0;return}function Aa(){if((d[35048]|0|0)==1){c[7339]=(c[7339]|0)+1;return}if(d[35048]|0|0)return;a[35048]=1;c[7339]=1;return}function Ba(){if((d[35048]|0|0)<2){a[35048]=2;c[7339]=1;return}else{c[7339]=(c[7339]|0)+1;return}}function Ca(){a[35048]=3;return}function Da(){Pi(3790,c[7337]|0)|0;Pi(3790,c[7338]|0)|0;Ca();return}function Ea(){var a=0,b=0,d=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+24|0;d=a+16|0;e=a+8|0;f=a;g=c[7337]|0;c[f>>2]=3824;Ki(g,10634,f)|0;f=c[7338]|0;c[e>>2]=3824;Ki(f,10634,e)|0;e=c[7337]|0;c[d>>2]=3845;Ki(e,10634,d)|0;d=c[7338]|0;c[b>>2]=3845;Ki(d,10634,b)|0;Ca();ma=a;return}function Fa(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;a=ma;ma=ma+96|0;b=a+80|0;d=a+64|0;f=a+48|0;g=a+32|0;h=a+16|0;i=a;j=c[7337]|0;k=(c[7340]|0)+2e4|0;e=c[7340]|0;c[i>>2]=3937;c[i+4>>2]=1;c[i+8>>2]=k;c[i+12>>2]=e;Ki(j,3883,i)|0;c[7341]=Bg(c[7341]|0,(c[7340]|0)+2e4+1|0)|0;i=c[7337]|0;j=(c[7340]|0)+2e4|0;e=c[7340]|0;c[h>>2]=3944;c[h+4>>2]=1;c[h+8>>2]=j;c[h+12>>2]=e;Ki(i,3883,h)|0;c[7342]=Bg(c[7342]|0,(c[7340]|0)+2e4+1|0)|0;h=c[7337]|0;i=(c[7340]|0)+2e4|0;e=c[7340]|0;c[g>>2]=3954;c[g+4>>2]=1;c[g+8>>2]=i;c[g+12>>2]=e;Ki(h,3883,g)|0;c[7343]=Bg(c[7343]|0,(c[7340]|0)+2e4+1|0)|0;g=c[7337]|0;h=(c[7340]|0)+2e4|0;e=c[7340]|0;c[f>>2]=3961;c[f+4>>2]=1;c[f+8>>2]=h;c[f+12>>2]=e;Ki(g,3883,f)|0;c[7344]=Bg(c[7344]|0,(c[7340]|0)+2e4+1|0)|0;f=c[7337]|0;g=(c[7340]|0)+2e4|0;e=c[7340]|0;c[d>>2]=3969;c[d+4>>2]=4;c[d+8>>2]=g;c[d+12>>2]=e;Ki(f,3883,d)|0;c[7345]=Bg(c[7345]|0,(c[7340]|0)+2e4+1<<2)|0;d=c[7337]|0;f=(c[7340]|0)+2e4|0;e=c[7340]|0;c[b>>2]=3978;c[b+4>>2]=1;c[b+8>>2]=f;c[b+12>>2]=e;Ki(d,3883,b)|0;c[7346]=Bg(c[7346]|0,(c[7340]|0)+2e4+1|0)|0;c[7340]=(c[7340]|0)+2e4;ma=a;return}function Ga(b){b=b|0;var e=0,f=0,g=0;g=ma;ma=ma+16|0;e=g+4|0;f=g;c[e>>2]=b;c[7347]=0;if(Xd(c[e>>2]|0)|0){c[f>>2]=0;f=c[f>>2]|0;ma=g;return f|0}while(1){if(!((Yd(c[e>>2]|0)|0)!=0^1))break;if((c[7347]|0)>=(c[7340]|0))Fa();b=a[18144+(Ui(c[e>>2]|0)|0)>>0]|0;a[(c[7341]|0)+(c[7347]|0)>>0]=b;c[7347]=(c[7347]|0)+1}Ui(c[e>>2]|0)|0;while(1){if((c[7347]|0)<=0)break;if((d[18400+(d[(c[7341]|0)+((c[7347]|0)-1)>>0]|0)>>0]|0|0)!=1)break;c[7347]=(c[7347]|0)-1}c[f>>2]=1;f=c[f>>2]|0;ma=g;return f|0}function Ha(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;j=k+8|0;i=k;e=k+28|0;f=k+24|0;g=k+20|0;h=k+16|0;c[e>>2]=a;c[f>>2]=b;if(((c[f>>2]|0)>=0?(c[f>>2]|0)<((c[7348]|0)+3|0):0)?(c[f>>2]|0)<(c[7349]|0):0){c[g>>2]=c[(c[7350]|0)+(c[f>>2]<<2)>>2];c[h>>2]=(c[(c[7350]|0)+((c[f>>2]|0)+1<<2)>>2]|0)-1;if((c[g>>2]|0)>(c[h>>2]|0)){ma=k;return}do{Ri(d[18816+(d[(c[7351]|0)+(c[g>>2]|0)>>0]|0)>>0]|0,c[e>>2]|0)|0;j=c[g>>2]|0;c[g>>2]=j+1}while((j|0)<(c[h>>2]|0));ma=k;return}k=c[7337]|0;h=c[f>>2]|0;c[i>>2]=3998;c[i+4>>2]=h;Ki(k,3992,i)|0;k=c[7338]|0;i=c[f>>2]|0;c[j>>2]=3998;c[j+4>>2]=i;Ki(k,3992,j)|0;Ea();ha(18656,1)}function Ia(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;Ha(c[7338]|0,c[d>>2]|0);Ha(c[7337]|0,c[d>>2]|0);ma=b;return}function Ja(){var a=0,b=0,d=0,e=0,f=0;a=ma;ma=ma+16|0;b=a;d=c[7337]|0;f=(c[7352]|0)+65e3|0;e=c[7352]|0;c[b>>2]=4021;c[b+4>>2]=1;c[b+8>>2]=f;c[b+12>>2]=e;Ki(d,3883,b)|0;c[7351]=Bg(c[7351]|0,(c[7352]|0)+65e3+1|0)|0;c[7352]=(c[7352]|0)+65e3;ma=a;return}function Ka(a){a=a|0;var b=0,e=0,f=0;f=ma;ma=ma+16|0;b=f+4|0;e=f;c[b>>2]=a;c[e>>2]=c[7353];while(1){if((c[e>>2]|0)>=(c[7354]|0))break;Ri(d[18816+(d[(c[7341]|0)+(c[e>>2]|0)>>0]|0)>>0]|0,c[b>>2]|0)|0;c[e>>2]=(c[e>>2]|0)+1}ma=f;return}function La(){Ka(c[7338]|0);Ka(c[7337]|0);return}function Ma(){var a=0,b=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;g=h+8|0;f=h;a=h+12|0;Pi(4030,c[7337]|0)|0;Pi(4030,c[7338]|0)|0;c[a>>2]=0;while(1){if((c[a>>2]|0)>=(c[7354]|0))break;if((d[18400+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0|0)==1){Ri(d[18848]|0,c[7337]|0)|0;Ri(d[18848]|0,c[7338]|0)|0}else{Ri(d[18816+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0,c[7337]|0)|0;Ri(d[18816+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0,c[7338]|0)|0}c[a>>2]=(c[a>>2]|0)+1}za();Pi(4030,c[7337]|0)|0;Pi(4030,c[7338]|0)|0;c[a>>2]=0;while(1){if((c[a>>2]|0)>=(c[7354]|0))break;Ri(d[18848]|0,c[7337]|0)|0;Ri(d[18848]|0,c[7338]|0)|0;c[a>>2]=(c[a>>2]|0)+1}c[a>>2]=c[7354];while(1){if((c[a>>2]|0)>=(c[7347]|0))break;if((d[18400+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0|0)==1){Ri(d[18848]|0,c[7337]|0)|0;Ri(d[18848]|0,c[7338]|0)|0}else{Ri(d[18816+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0,c[7337]|0)|0;Ri(d[18816+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0,c[7338]|0)|0}c[a>>2]=(c[a>>2]|0)+1}za();c[a>>2]=0;while(1){if((c[a>>2]|0)<(c[7354]|0))e=(d[18400+(d[(c[7341]|0)+(c[a>>2]|0)>>0]|0)>>0]|0|0)==1;else e=0;b=c[a>>2]|0;if(!e)break;c[a>>2]=b+1}if((b|0)!=(c[7354]|0)){Ba();ma=h;return}e=c[7337]|0;c[f>>2]=4034;Ki(e,10634,f)|0;f=c[7338]|0;c[g>>2]=4034;Ki(f,10634,g)|0;Ba();ma=h;return}function Na(){Pi(4073,c[7337]|0)|0;Pi(4073,c[7338]|0)|0;return}function Oa(){var a=0,b=0,e=0;b=ma;ma=ma+16|0;a=b;Pi(4112,c[7338]|0)|0;c[7355]=1;while(1){if((c[7355]|0)>(c[7356]|0))break;Ri(d[(c[7357]|0)+(c[7355]|0)>>0]|0,c[7338]|0)|0;c[7355]=(c[7355]|0)+1}e=c[7338]|0;c[a>>2]=4124;Ki(e,10634,a)|0;ma=b;return}function Pa(){Pi(4138,c[7338]|0)|0;c[7355]=1;while(1){if((c[7355]|0)>(c[7358]|0))break;Ri(d[(c[7357]|0)+(c[7355]|0)>>0]|0,c[7338]|0)|0;c[7355]=(c[7355]|0)+1}Ri(39,c[7338]|0)|0;Ri(10,c[7338]|0)|0;return}function Qa(){Ia(c[19072+(c[7359]<<2)>>2]|0);za();return}function Ra(){Ha(c[7337]|0,c[19072+(c[7359]<<2)>>2]|0);Ri(10,c[7337]|0)|0;return}function Sa(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0;a=ma;ma=ma+48|0;b=a+40|0;d=a+32|0;e=a+16|0;f=a;g=c[7337]|0;h=c[19168+(c[7359]<<2)>>2]|0;c[f>>2]=4174;c[f+4>>2]=h;c[f+8>>2]=4183;Ki(g,4166,f)|0;f=c[7338]|0;g=c[19168+(c[7359]<<2)>>2]|0;c[e>>2]=4174;c[e+4>>2]=g;c[e+8>>2]=4183;Ki(f,4166,e)|0;Qa();Ma();Na();e=c[7337]|0;c[d>>2]=4193;Ki(e,10634,d)|0;d=c[7338]|0;c[b>>2]=4193;Ki(d,10634,b)|0;ma=a;return}function Ta(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;Pi(4201,c[7337]|0)|0;Pi(4201,c[7338]|0)|0;switch(c[d>>2]|0){case 0:{Pi(4223,c[7337]|0)|0;Pi(4223,c[7338]|0)|0;d=c[7337]|0;Pi(4265,d)|0;d=c[7338]|0;Pi(4265,d)|0;ma=b;return}case 1:{Pi(4228,c[7337]|0)|0;Pi(4228,c[7338]|0)|0;d=c[7337]|0;Pi(4265,d)|0;d=c[7338]|0;Pi(4265,d)|0;ma=b;return}default:{Pi(4234,c[7337]|0)|0;Pi(4234,c[7338]|0)|0;Ea();ha(18656,1)}}}function Ua(){var a=0,b=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+16|0;e=a;f=c[7337]|0;g=d[18941]|0;c[e>>2]=4281;c[e+4>>2]=g;c[e+8>>2]=34;Ki(f,4274,e)|0;e=c[7338]|0;f=d[18941]|0;c[b>>2]=4281;c[b+4>>2]=f;c[b+8>>2]=34;Ki(e,4274,b)|0;ma=a;return}function Va(){var a=0,b=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+16|0;e=a;f=c[7337]|0;g=d[18941]|0;c[e>>2]=4286;c[e+4>>2]=g;c[e+8>>2]=34;Ki(f,4274,e)|0;e=c[7338]|0;f=d[18941]|0;c[b>>2]=4286;c[b+4>>2]=f;c[b+8>>2]=34;Ki(e,4274,b)|0;ma=a;return}function Wa(){Pi(4300,c[7337]|0)|0;Pi(4300,c[7338]|0)|0;return}function Xa(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;n=ma;ma=ma+32|0;f=n+16|0;g=n+12|0;h=n+8|0;i=n+4|0;j=n;k=n+21|0;l=n+20|0;c[f>>2]=b;c[g>>2]=e;c[h>>2]=0;if(((c[(c[7350]|0)+((c[g>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[g>>2]<<2)>>2]|0)|0)>((c[(c[7350]|0)+((c[f>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[f>>2]<<2)>>2]|0)|0)){m=c[h>>2]|0;ma=n;return m|0}c[i>>2]=(c[(c[7350]|0)+((c[f>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[f>>2]<<2)>>2]|0)-1;c[j>>2]=(c[(c[7350]|0)+((c[g>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[g>>2]<<2)>>2]|0)-1;while(1){if((c[j>>2]|0)<0)break;a[k>>0]=a[(c[7351]|0)+((c[(c[7350]|0)+(c[f>>2]<<2)>>2]|0)+(c[i>>2]|0))>>0]|0;a[l>>0]=a[(c[7351]|0)+((c[(c[7350]|0)+(c[g>>2]<<2)>>2]|0)+(c[j>>2]|0))>>0]|0;if((d[k>>0]|0|0)!=(d[l>>0]|0|0)){m=7;break}c[i>>2]=(c[i>>2]|0)-1;c[j>>2]=(c[j>>2]|0)-1}if((m|0)==7){m=c[h>>2]|0;ma=n;return m|0}c[h>>2]=1;m=c[h>>2]|0;ma=n;return m|0}function Ya(){Ia(c[(c[7360]|0)+(c[7361]<<2)>>2]|0);if(Xa(c[(c[7360]|0)+(c[7361]<<2)>>2]|0,c[7362]|0)|0){za();return}Ia(c[7362]|0);za();return}function Za(){var a=0;Ha(c[7337]|0,c[(c[7360]|0)+(c[7361]<<2)>>2]|0);if(Xa(c[(c[7360]|0)+(c[7361]<<2)>>2]|0,c[7362]|0)|0){a=c[7337]|0;Ri(10,a)|0;return}Ha(c[7337]|0,c[7362]|0);a=c[7337]|0;Ri(10,a)|0;return}function _a(){Ia(c[7363]|0);Ia(c[7364]|0);za();return}function $a(){Ha(c[7337]|0,c[7363]|0);Ha(c[7337]|0,c[7364]|0);Ri(10,c[7337]|0)|0;return}function ab(){Pi(4324,c[7337]|0)|0;Pi(4324,c[7338]|0)|0;Ea();ha(18656,1)}function bb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;h=ma;ma=ma+80|0;f=h+48|0;e=h+32|0;g=h+16|0;d=h;b=h+64|0;c[b>>2]=a;if((c[b>>2]|0)!=(c[7365]|0)){ma=h;return}a=c[7337]|0;j=(c[7365]|0)+750|0;i=c[7365]|0;c[d>>2]=4340;c[d+4>>2]=4;c[d+8>>2]=j;c[d+12>>2]=i;Ki(a,3883,d)|0;c[7366]=Bg(c[7366]|0,(c[7365]|0)+750+1<<2)|0;a=c[7337]|0;i=(c[7365]|0)+750|0;d=c[7365]|0;c[g>>2]=4350;c[g+4>>2]=4;c[g+8>>2]=i;c[g+12>>2]=d;Ki(a,3883,g)|0;c[7367]=Bg(c[7367]|0,(c[7365]|0)+750+1<<2)|0;g=c[7337]|0;a=(c[7365]|0)+750|0;d=c[7365]|0;c[e>>2]=4360;c[e+4>>2]=4;c[e+8>>2]=a;c[e+12>>2]=d;Ki(g,3883,e)|0;c[7368]=Bg(c[7368]|0,(c[7365]|0)+750+1<<2)|0;g=c[7337]|0;d=(c[7365]|0)+750|0;e=c[7365]|0;c[f>>2]=4373;c[f+4>>2]=4;c[f+8>>2]=d;c[f+12>>2]=e;Ki(g,3883,f)|0;c[7369]=Bg(c[7369]|0,(c[7365]|0)+750+1<<2)|0;c[7365]=(c[7365]|0)+750;while(1){if((c[b>>2]|0)>=(c[7365]|0))break;c[(c[7367]|0)+(c[b>>2]<<2)>>2]=0;c[(c[7369]|0)+(c[b>>2]<<2)>>2]=0;c[b>>2]=(c[b>>2]|0)+1}ma=h;return}function cb(){Pi(4383,c[7337]|0)|0;Pi(4383,c[7338]|0)|0;return}function db(){Pi(4395,c[7337]|0)|0;Pi(4395,c[7338]|0)|0;Qa();Ba();return}function eb(){var a=0,b=0,d=0,e=0,f=0;a=ma;ma=ma+32|0;b=a+16|0;d=a;e=c[7337]|0;f=c[7370]|0;c[d>>2]=4418;c[d+4>>2]=f;c[d+8>>2]=4183;Ki(e,4166,d)|0;d=c[7338]|0;e=c[7370]|0;c[b>>2]=4418;c[b+4>>2]=e;c[b+8>>2]=4183;Ki(d,4166,b)|0;_a();ma=a;return}function fb(){var a=0;Ri(45,c[7337]|0)|0;Ri(45,c[7338]|0)|0;eb();Ma();while(1){if(!(c[7347]|0)){a=6;break}if(!(Ga(c[7371]|0)|0)){a=4;break}c[7370]=(c[7370]|0)+1}if((a|0)==4)ha(19264,1);else if((a|0)==6){c[7354]=c[7347];return}}function gb(){eb();Aa();return}function hb(){Pi(4426,c[7337]|0)|0;Pi(4426,c[7338]|0)|0;return}function ib(){Pi(4465,c[7337]|0)|0;Pi(4465,c[7338]|0)|0;Ea();ha(18656,1)}function jb(a){a=a|0;var b=0,e=0;b=ma;ma=ma+16|0;e=b;c[e>>2]=a;do switch(d[(c[7372]|0)+(c[e>>2]|0)>>0]|0|0){case 0:{Pi(4488,c[7337]|0)|0;Pi(4488,c[7338]|0)|0;break}case 1:{Pi(4497,c[7337]|0)|0;Pi(4497,c[7338]|0)|0;break}case 2:{Pi(4512,c[7337]|0)|0;Pi(4512,c[7338]|0)|0;break}case 3:{Pi(4528,c[7337]|0)|0;Pi(4528,c[7338]|0)|0;break}case 4:{Pi(4543,c[7337]|0)|0;Pi(4543,c[7338]|0)|0;break}case 5:{Pi(4549,c[7337]|0)|0;Pi(4549,c[7338]|0)|0;break}case 6:{Pi(4572,c[7337]|0)|0;Pi(4572,c[7338]|0)|0;break}case 7:{Pi(4594,c[7337]|0)|0;Pi(4594,c[7338]|0)|0;break}case 8:{Pi(4618,c[7337]|0)|0;Pi(4618,c[7338]|0)|0;break}default:ib()}while(0);ma=b;return}function kb(){Pi(4641,c[7337]|0)|0;Pi(4641,c[7338]|0)|0;Ea();ha(18656,1)}function lb(){var a=0,b=0,e=0,f=0,g=0;g=ma;ma=ma+64|0;b=g+48|0;f=g+32|0;e=g+16|0;a=g;if(!(d[35049]|0)){f=c[7337]|0;b=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[a>>2]=34;c[a+4>>2]=b;c[a+8>>2]=4674;Ki(f,4667,a)|0;f=c[7338]|0;b=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[e>>2]=34;c[e+4>>2]=b;c[e+8>>2]=4674;Ki(f,4667,e)|0;ma=g;return}if((d[35049]|0|0)==2){e=c[7337]|0;a=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[f>>2]=34;c[f+4>>2]=a;c[f+8>>2]=4705;Ki(e,4667,f)|0;f=c[7338]|0;e=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[b>>2]=34;c[b+4>>2]=e;c[b+8>>2]=4705;Ki(f,4667,b)|0;ma=g;return}else{kb();ma=g;return}}function mb(){var a=0,b=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+16|0;e=a;f=c[7337]|0;g=d[18939]|0;c[e>>2]=34;c[e+4>>2]=g;c[e+8>>2]=4749;Ki(f,4667,e)|0;e=c[7338]|0;f=d[18939]|0;c[b>>2]=34;c[b+4>>2]=f;c[b+8>>2]=4749;Ki(e,4667,b)|0;ma=a;return}function nb(){var a=0,b=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+16|0;e=a;f=c[7337]|0;g=d[18941]|0;c[e>>2]=34;c[e+4>>2]=g;c[e+8>>2]=4749;Ki(f,4667,e)|0;e=c[7338]|0;f=d[18941]|0;c[b>>2]=34;c[b+4>>2]=f;c[b+8>>2]=4749;Ki(e,4667,b)|0;ma=a;return}function ob(a){a=a|0;var b=0,d=0,e=0,f=0;b=ma;ma=ma+16|0;d=b+8|0;e=b;f=b+12|0;c[f>>2]=a;Ia(c[(c[7373]|0)+(c[f>>2]<<2)>>2]|0);Pi(4775,c[7337]|0)|0;Pi(4775,c[7338]|0)|0;jb(c[f>>2]|0);a=c[7337]|0;c[e>>2]=4796;Ki(a,10634,e)|0;a=c[7338]|0;c[d>>2]=4796;Ki(a,10634,d)|0;fb();ma=b;return}function pb(){var a=0,b=0,d=0,e=0,f=0;a=ma;ma=ma+32|0;b=a+16|0;d=a;e=c[7337]|0;f=c[7374]|0;c[d>>2]=4418;c[d+4>>2]=f;c[d+8>>2]=4183;Ki(e,4166,d)|0;d=c[7338]|0;e=c[7374]|0;c[b>>2]=4418;c[b+4>>2]=e;c[b+8>>2]=4183;Ki(d,4166,b)|0;Ya();ma=a;return}function qb(){var a=0,b=0,d=0,e=0,f=0,g=0;g=ma;ma=ma+32|0;f=g+24|0;e=g+16|0;d=g+8|0;b=g;Ri(45,c[7337]|0)|0;Ri(45,c[7338]|0)|0;pb();Ma();Na();a=c[7337]|0;if(c[7375]|0){c[b>>2]=4193;Ki(a,10634,b)|0;f=c[7338]|0;c[d>>2]=4193;Ki(f,10634,d)|0;ma=g;return}else{c[e>>2]=4812;Ki(a,10634,e)|0;e=c[7338]|0;c[f>>2]=4812;Ki(e,10634,f)|0;ma=g;return}}function rb(){pb();Aa();return}function sb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;h=ma;ma=ma+32|0;g=h;b=h+28|0;d=h+24|0;e=h+20|0;f=h+16|0;c[b>>2]=a;if((c[b>>2]|0)<=(c[7376]|0)){ma=h;return}c[e>>2]=c[7376];a=c[7337]|0;j=(c[b>>2]|0)+5e3|0;i=c[7376]|0;c[g>>2]=4818;c[g+4>>2]=4;c[g+8>>2]=j;c[g+12>>2]=i;Ki(a,3883,g)|0;c[7377]=Bg(c[7377]|0,(c[b>>2]|0)+5e3+1<<2)|0;c[7376]=(c[b>>2]|0)+5e3;c[d>>2]=c[e>>2];c[f>>2]=(c[7376]|0)-1;if((c[d>>2]|0)>(c[f>>2]|0)){ma=h;return}do{c[(c[7377]|0)+(c[d>>2]<<2)>>2]=0;j=c[d>>2]|0;c[d>>2]=j+1}while((j|0)<(c[f>>2]|0));ma=h;return}function tb(){Pi(4829,c[7337]|0)|0;Pi(4829,c[7338]|0)|0;qb();return}function ub(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=ma;ma=ma+48|0;g=f+24|0;j=f;h=f+45|0;i=f+44|0;a[h>>0]=b;a[i>>0]=e;e=c[7337]|0;k=d[18816+(d[h>>0]|0)>>0]|0;b=d[18816+(d[i>>0]|0)>>0]|0;c[j>>2]=4869;c[j+4>>2]=k;c[j+8>>2]=4889;c[j+12>>2]=b;c[j+16>>2]=39;Ki(e,4858,j)|0;e=c[7338]|0;h=d[18816+(d[h>>0]|0)>>0]|0;b=d[18816+(d[i>>0]|0)>>0]|0;c[g>>2]=4869;c[g+4>>2]=h;c[g+8>>2]=4889;c[g+12>>2]=b;c[g+16>>2]=39;Ki(e,4858,g)|0;qb();ma=f;return}function vb(){var a=0,b=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+16|0;e=a;f=c[7337]|0;g=d[18877]|0;c[e>>2]=4898;c[e+4>>2]=g;c[e+8>>2]=34;Ki(f,4274,e)|0;e=c[7338]|0;f=d[18877]|0;c[b>>2]=4898;c[b+4>>2]=f;c[b+8>>2]=34;Ki(e,4274,b)|0;qb();ma=a;return}function wb(){Pi(4919,c[7337]|0)|0;Pi(4919,c[7338]|0)|0;qb();return}function xb(){var a=0,b=0,d=0,e=0,f=0;a=ma;ma=ma+32|0;b=a+16|0;d=a;e=c[7337]|0;f=c[7340]|0;c[d>>2]=4937;c[d+4>>2]=f;c[d+8>>2]=4962;Ki(e,4166,d)|0;d=c[7338]|0;e=c[7340]|0;c[b>>2]=4937;c[b+4>>2]=e;c[b+8>>2]=4962;Ki(d,4166,b)|0;qb();ma=a;return}function yb(){Pi(4974,c[7337]|0)|0;Pi(4974,c[7338]|0)|0;La();Pi(4997,c[7337]|0)|0;Pi(4997,c[7338]|0)|0;return}function zb(){var a=0,b=0,e=0,f=0,g=0;e=ma;ma=ma+32|0;b=e+16|0;a=e;if(!(d[35049]|0)){Pi(5003,c[7337]|0)|0;Pi(5003,c[7338]|0)|0;ma=e;return}if((d[35049]|0|0)==2){f=c[7337]|0;g=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[a>>2]=34;c[a+4>>2]=g;c[a+8>>2]=5019;Ki(f,4667,a)|0;a=c[7338]|0;f=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[b>>2]=34;c[b+4>>2]=f;c[b+8>>2]=5019;Ki(a,4667,b)|0;ma=e;return}else{kb();ma=e;return}}function Ab(){Pi(5042,c[7337]|0)|0;Pi(5042,c[7338]|0)|0;Ea();ha(18656,1)}function Bb(){Pi(5072,c[7337]|0)|0;Pi(5072,c[7338]|0)|0;Ea();ha(18656,1)}function Cb(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;Pi(5095,c[7337]|0)|0;Pi(5095,c[7338]|0)|0;Ia(c[(c[7366]|0)+(c[7378]<<2)>>2]|0);Ri(34,c[7337]|0)|0;Ri(10,c[7337]|0)|0;Ri(34,c[7338]|0)|0;Ri(10,c[7338]|0)|0;Pi(5105,c[7337]|0)|0;Pi(5105,c[7338]|0)|0;Ia(c[d>>2]|0);ma=b;return}function Db(){var a=0,b=0,d=0,e=0;a=ma;ma=ma+16|0;b=a+8|0;d=a;Pi(5123,c[7337]|0)|0;Pi(5123,c[7338]|0)|0;Cb(c[(c[7377]|0)+(c[7379]<<2)>>2]|0);e=c[7337]|0;c[d>>2]=5146;Ki(e,10634,d)|0;d=c[7338]|0;c[b>>2]=5146;Ki(d,10634,b)|0;Ba();ma=a;return}function Eb(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;Pi(5169,c[7337]|0)|0;Pi(5169,c[7338]|0)|0;Ia(c[d>>2]|0);Ri(34,c[7337]|0)|0;Ri(10,c[7337]|0)|0;Ri(34,c[7338]|0)|0;Ri(10,c[7338]|0)|0;Aa();ma=b;return}function Fb(){if(c[7380]|0){Pi(5215,c[7337]|0)|0;Pi(5215,c[7338]|0)|0;Ia(c[(c[7366]|0)+(c[7378]<<2)>>2]|0)}za();Pi(5227,c[7337]|0)|0;Pi(5227,c[7338]|0)|0;eb();Ba();return}function Gb(){if(c[7380]|0){Pi(5215,c[7337]|0)|0;Pi(5215,c[7338]|0)|0;Ia(c[(c[7366]|0)+(c[7378]<<2)>>2]|0)}za();Pi(5244,c[7337]|0)|0;Pi(5244,c[7338]|0)|0;gb();return}function Hb(){Pi(5260,c[7337]|0)|0;Pi(5260,c[7338]|0)|0;Fb();return}function Ib(){Pi(5293,c[7337]|0)|0;Pi(5293,c[7338]|0)|0;Ea();ha(18656,1)}function Jb(){Pi(5314,c[7337]|0)|0;Pi(5314,c[7338]|0)|0;Ea();ha(18656,1)}function Kb(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+32|0;h=i+8|0;g=i;f=i+16|0;j=i+20|0;c[f>>2]=b;a[j>>0]=e;switch(d[j>>0]|0|0){case 0:{j=c[7337]|0;c[g>>2]=c[f>>2];c[g+4>>2]=5341;Ki(j,5335,g)|0;j=c[7338]|0;c[h>>2]=c[f>>2];c[h+4>>2]=5341;Ki(j,5335,h)|0;ma=i;return}case 1:{Ri(34,c[7337]|0)|0;Ri(34,c[7338]|0)|0;Ia(c[f>>2]|0);Pi(5364,c[7337]|0)|0;Pi(5364,c[7338]|0)|0;ma=i;return}case 2:{Ri(96,c[7337]|0)|0;Ri(96,c[7338]|0)|0;Ia(c[(c[7373]|0)+(c[f>>2]<<2)>>2]|0);Pi(5386,c[7337]|0)|0;Pi(5386,c[7338]|0)|0;ma=i;return}case 3:{Ri(96,c[7337]|0)|0;Ri(96,c[7338]|0)|0;Ia(c[f>>2]|0);Pi(5410,c[7337]|0)|0;Pi(5410,c[7338]|0)|0;ma=i;return}case 4:{Ib();ma=i;return}default:{Jb();ma=i;return}}}function Lb(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+32|0;h=i+8|0;g=i;f=i+12|0;j=i+16|0;c[f>>2]=b;a[j>>0]=e;switch(d[j>>0]|0|0){case 0:{j=c[7337]|0;c[g>>2]=c[f>>2];Ki(j,5431,g)|0;j=c[7338]|0;c[h>>2]=c[f>>2];Ki(j,5431,h)|0;ma=i;return}case 1:{Ia(c[f>>2]|0);za();ma=i;return}case 2:{Ia(c[(c[7373]|0)+(c[f>>2]<<2)>>2]|0);za();ma=i;return}case 3:{Ia(c[f>>2]|0);za();ma=i;return}case 4:{Ib();ma=i;return}default:{Jb();ma=i;return}}}function Mb(){a:do if(c[7381]|0){while(1){if((c[7381]|0)<=0)break;if((d[18400+(d[(c[7344]|0)+((c[7381]|0)-1)>>0]|0)>>0]|0|0)!=1)break;c[7381]=(c[7381]|0)-1}if(!(c[7381]|0))return;c[7382]=0;while(1){if((c[7382]|0)>=(c[7381]|0))break a;Ri(d[18816+(d[(c[7344]|0)+(c[7382]|0)>>0]|0)>>0]|0,c[7383]|0)|0;c[7382]=(c[7382]|0)+1}}while(0);Ri(10,c[7383]|0)|0;c[7384]=(c[7384]|0)+1;c[7381]=0;return}function Nb(){Pi(5436,c[7337]|0)|0;Pi(5436,c[7338]|0)|0;return}function Ob(){var a=0,b=0,d=0,e=0;a=ma;ma=ma+16|0;b=a+8|0;d=a;Pi(5462,c[7337]|0)|0;Pi(5462,c[7338]|0)|0;Gb();e=c[7337]|0;c[d>>2]=5476;Ki(e,10634,d)|0;d=c[7338]|0;c[b>>2]=5476;Ki(d,10634,b)|0;ma=a;return}function Pb(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;Pi(5514,c[7337]|0)|0;Pi(5514,c[7338]|0)|0;Ia(c[d>>2]|0);Pi(5525,c[7337]|0)|0;Pi(5525,c[7338]|0)|0;Gb();ma=b;return}function Qb(){Pi(5557,c[7337]|0)|0;Pi(5557,c[7338]|0)|0;Ea();ha(18656,1)}function Rb(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;i=ma;ma=ma+96|0;f=i+80|0;e=i+64|0;b=i+40|0;h=i+24|0;g=i+16|0;d=i+8|0;a=i;j=c[7337]|0;k=c[7385]|0;c[a>>2]=5589;c[a+4>>2]=k;Ki(j,3992,a)|0;a=c[7337]|0;if((c[7385]|0)==1){c[d>>2]=5602;Ki(a,10634,d)|0}else{c[g>>2]=5610;Ki(a,10634,g)|0}k=c[7337]|0;j=c[7386]|0;c[h>>2]=5629;c[h+4>>2]=j;c[h+8>>2]=5642;Ki(k,5620,h)|0;k=c[7337]|0;h=c[7348]|0;j=c[(c[7350]|0)+(c[7348]<<2)>>2]|0;c[b>>2]=5629;c[b+4>>2]=h;c[b+8>>2]=5689;c[b+12>>2]=j;c[b+16>>2]=5704;Ki(k,5675,b)|0;c[7387]=0;c[7388]=0;while(1){if((c[7387]|0)>=37)break;c[7388]=(c[7388]|0)+(c[19424+(c[7387]<<2)>>2]|0);c[7387]=(c[7387]|0)+1}k=c[7337]|0;j=c[7388]|0;c[e>>2]=5717;c[e+4>>2]=j;c[e+8>>2]=5757;Ki(k,5620,e)|0;c[7387]=0;while(1){if((c[7387]|0)>=37)break;Ha(c[7337]|0,c[(c[7373]|0)+(c[19584+(c[7387]<<2)>>2]<<2)>>2]|0);k=c[7337]|0;j=c[19424+(c[7387]<<2)>>2]|0;c[f>>2]=5778;c[f+4>>2]=j;Ki(k,5771,f)|0;c[7387]=(c[7387]|0)+1}ma=i;return}function Sb(b){b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=b;Yg(c[7357]|0);c[7357]=yg((c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[d>>2]<<2)>>2]|0)+1+1|0)|0;c[7355]=1;c[e>>2]=c[(c[7350]|0)+(c[d>>2]<<2)>>2];while(1){if((c[e>>2]|0)>=(c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0))break;a[(c[7357]|0)+(c[7355]|0)>>0]=a[(c[7351]|0)+(c[e>>2]|0)>>0]|0;c[7355]=(c[7355]|0)+1;c[e>>2]=(c[e>>2]|0)+1}c[7358]=(c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[d>>2]<<2)>>2]|0);a[(c[7357]|0)+((c[7358]|0)+1)>>0]=0;ma=f;return}function Tb(b){b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=b;c[7355]=(c[7358]|0)+1;c[e>>2]=c[(c[7350]|0)+(c[d>>2]<<2)>>2];while(1){if((c[e>>2]|0)>=(c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0))break;a[(c[7357]|0)+(c[7355]|0)>>0]=a[(c[7351]|0)+(c[e>>2]|0)>>0]|0;c[7355]=(c[7355]|0)+1;c[e>>2]=(c[e>>2]|0)+1}c[7358]=(c[7358]|0)+((c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[d>>2]<<2)>>2]|0));a[(c[7357]|0)+((c[7358]|0)+1)>>0]=0;ma=f;return}function Ub(){var a=0,b=0,d=0,e=0;e=ma;ma=ma+32|0;d=e+8|0;b=e;a=e+16|0;if((c[7348]|0)==(c[7349]|0)){Da();e=c[7337]|0;a=c[7349]|0;c[b>>2]=5783;c[b+4>>2]=a;Ki(e,5771,b)|0;e=c[7338]|0;b=c[7349]|0;c[d>>2]=5783;c[d+4>>2]=b;Ki(e,5771,d)|0;ha(18656,1)}else{c[7348]=(c[7348]|0)+1;c[(c[7350]|0)+(c[7348]<<2)>>2]=c[7389];c[a>>2]=(c[7348]|0)-1;ma=e;return c[a>>2]|0}return 0}function Vb(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;m=ma;ma=ma+32|0;h=m+24|0;i=m+20|0;j=m+16|0;n=m+12|0;l=m+8|0;k=m+4|0;g=m;c[h>>2]=a;c[i>>2]=b;c[j>>2]=e;c[n>>2]=f;if(((c[(c[7350]|0)+((c[h>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[h>>2]<<2)>>2]|0)|0)!=(c[n>>2]|0)){c[l>>2]=0;n=c[l>>2]|0;ma=m;return n|0}c[k>>2]=c[j>>2];c[g>>2]=c[(c[7350]|0)+(c[h>>2]<<2)>>2];while(1){if((c[g>>2]|0)>=(c[(c[7350]|0)+((c[h>>2]|0)+1<<2)>>2]|0)){a=8;break}if((d[(c[7351]|0)+(c[g>>2]|0)>>0]|0|0)!=(d[(c[i>>2]|0)+(c[k>>2]|0)>>0]|0|0)){a=6;break}c[k>>2]=(c[k>>2]|0)+1;c[g>>2]=(c[g>>2]|0)+1}if((a|0)==6){c[l>>2]=0;n=c[l>>2]|0;ma=m;return n|0}else if((a|0)==8){c[l>>2]=1;n=c[l>>2]|0;ma=m;return n|0}return 0}function Wb(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;e=h+8|0;f=h+4|0;g=h;c[e>>2]=a;c[f>>2]=b;if(((c[(c[7350]|0)+((c[e>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[e>>2]<<2)>>2]|0)|0)!=((c[(c[7350]|0)+((c[f>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[f>>2]<<2)>>2]|0)|0)){c[g>>2]=0;g=c[g>>2]|0;ma=h;return g|0}c[7390]=c[(c[7350]|0)+(c[e>>2]<<2)>>2];c[7391]=c[(c[7350]|0)+(c[f>>2]<<2)>>2];while(1){if((c[7390]|0)>=(c[(c[7350]|0)+((c[e>>2]|0)+1<<2)>>2]|0)){a=8;break}if((d[(c[7351]|0)+(c[7390]|0)>>0]|0|0)!=(d[(c[7351]|0)+(c[7391]|0)>>0]|0|0)){a=6;break}c[7390]=(c[7390]|0)+1;c[7391]=(c[7391]|0)+1}if((a|0)==6){c[g>>2]=0;g=c[g>>2]|0;ma=h;return g|0}else if((a|0)==8){c[g>>2]=1;g=c[g>>2]|0;ma=h;return g|0}return 0}function Xb(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+32|0;g=l+16|0;h=l+12|0;i=l+8|0;j=l+4|0;k=l;c[g>>2]=b;c[h>>2]=e;c[i>>2]=f;if((c[i>>2]|0)<=0){ma=l;return}c[j>>2]=c[h>>2];c[k>>2]=(c[h>>2]|0)+(c[i>>2]|0)-1;if((c[j>>2]|0)>(c[k>>2]|0)){ma=l;return}do{if((d[(c[g>>2]|0)+(c[j>>2]|0)>>0]|0|0)>=65?(d[(c[g>>2]|0)+(c[j>>2]|0)>>0]|0|0)<=90:0)a[(c[g>>2]|0)+(c[j>>2]|0)>>0]=(d[(c[g>>2]|0)+(c[j>>2]|0)>>0]|0)+32;i=c[j>>2]|0;c[j>>2]=i+1}while((i|0)<(c[k>>2]|0));ma=l;return}function Yb(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+32|0;g=l+16|0;h=l+12|0;i=l+8|0;j=l+4|0;k=l;c[g>>2]=b;c[h>>2]=e;c[i>>2]=f;if((c[i>>2]|0)<=0){ma=l;return}c[j>>2]=c[h>>2];c[k>>2]=(c[h>>2]|0)+(c[i>>2]|0)-1;if((c[j>>2]|0)>(c[k>>2]|0)){ma=l;return}do{if((d[(c[g>>2]|0)+(c[j>>2]|0)>>0]|0|0)>=97?(d[(c[g>>2]|0)+(c[j>>2]|0)>>0]|0|0)<=122:0)a[(c[g>>2]|0)+(c[j>>2]|0)>>0]=(d[(c[g>>2]|0)+(c[j>>2]|0)>>0]|0)-32;i=c[j>>2]|0;c[j>>2]=i+1}while((i|0)<(c[k>>2]|0));ma=l;return}function Zb(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=ma;ma=ma+64|0;t=v+8|0;s=v;n=v+48|0;o=v+44|0;p=v+40|0;q=v+52|0;r=v+36|0;i=v+32|0;j=v+28|0;k=v+24|0;l=v+20|0;m=v+16|0;c[n>>2]=b;c[o>>2]=e;c[p>>2]=f;a[q>>0]=g;c[r>>2]=h;c[j>>2]=0;c[l>>2]=c[o>>2];while(1){b=c[j>>2]|0;if((c[l>>2]|0)>=((c[o>>2]|0)+(c[p>>2]|0)|0))break;c[j>>2]=b+(c[j>>2]|0)+(d[(c[n>>2]|0)+(c[l>>2]|0)>>0]|0);while(1){if((c[j>>2]|0)<(c[7392]|0))break;c[j>>2]=(c[j>>2]|0)-(c[7392]|0)}c[l>>2]=(c[l>>2]|0)+1}c[k>>2]=b+1;c[7393]=0;c[m>>2]=0;while(1){if((c[(c[7373]|0)+(c[k>>2]<<2)>>2]|0)>0?Vb(c[(c[7373]|0)+(c[k>>2]<<2)>>2]|0,c[n>>2]|0,c[o>>2]|0,c[p>>2]|0)|0:0){if((d[(c[7394]|0)+(c[k>>2]|0)>>0]|0|0)==(d[q>>0]|0|0)){u=11;break}c[m>>2]=c[(c[7373]|0)+(c[k>>2]<<2)>>2]}if(!(c[(c[7395]|0)+(c[k>>2]<<2)>>2]|0))break;c[k>>2]=c[(c[7395]|0)+(c[k>>2]<<2)>>2]}if((u|0)==11){c[7393]=1;u=c[k>>2]|0;c[i>>2]=u;u=c[i>>2]|0;ma=v;return u|0}if(!(c[r>>2]|0)){u=c[k>>2]|0;c[i>>2]=u;u=c[i>>2]|0;ma=v;return u|0}do if((c[(c[7373]|0)+(c[k>>2]<<2)>>2]|0)>0){while(1){if((c[7396]|0)==1){u=18;break}c[7396]=(c[7396]|0)-1;if(!((c[(c[7373]|0)+(c[7396]<<2)>>2]|0)==0^1)){u=20;break}}if((u|0)==18){Da();u=c[7337]|0;r=c[7397]|0;c[s>>2]=5802;c[s+4>>2]=r;Ki(u,5771,s)|0;u=c[7338]|0;s=c[7397]|0;c[t>>2]=5802;c[t+4>>2]=s;Ki(u,5771,t)|0;ha(18656,1)}else if((u|0)==20){c[(c[7395]|0)+(c[k>>2]<<2)>>2]=c[7396];c[k>>2]=c[7396];break}}while(0);if((c[m>>2]|0)>0)c[(c[7373]|0)+(c[k>>2]<<2)>>2]=c[m>>2];else{while(1){if(((c[7389]|0)+(c[p>>2]|0)|0)<=(c[7352]|0))break;Ja()}c[l>>2]=c[o>>2];while(1){if((c[l>>2]|0)>=((c[o>>2]|0)+(c[p>>2]|0)|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[n>>2]|0)+(c[l>>2]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[l>>2]=(c[l>>2]|0)+1}u=Ub()|0;c[(c[7373]|0)+(c[k>>2]<<2)>>2]=u}a[(c[7394]|0)+(c[k>>2]|0)>>0]=a[q>>0]|0;u=c[k>>2]|0;c[i>>2]=u;u=c[i>>2]|0;ma=v;return u|0}function _b(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+16|0;g=l+4|0;h=l+10|0;i=l+9|0;j=l+8|0;k=l;c[g>>2]=b;a[h>>0]=e;a[i>>0]=f;a[j>>0]=1;c[k>>2]=d[h>>0];if((d[j>>0]|0|0)>(c[k>>2]|0)){g=c[7341]|0;j=a[h>>0]|0;j=j&255;k=a[i>>0]|0;k=Zb(g,1,j,k,1)|0;c[7398]=k;ma=l;return}do{a[(c[7341]|0)+(d[j>>0]|0)>>0]=a[18144+(d[(c[g>>2]|0)+((d[j>>0]|0)-1)>>0]|0)>>0]|0;f=a[j>>0]|0;a[j>>0]=f+1<<24>>24}while((f&255|0)<(c[k>>2]|0));g=c[7341]|0;j=a[h>>0]|0;j=j&255;k=a[i>>0]|0;k=Zb(g,1,j,k,1)|0;c[7398]=k;ma=l;return}function $b(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;m=ma;ma=ma+32|0;h=m+20|0;i=m+16|0;n=m+12|0;j=m+8|0;k=m+4|0;l=m;g=m+24|0;c[h>>2]=b;c[i>>2]=d;c[n>>2]=e;c[j>>2]=f;c[k>>2]=c[n>>2];if((c[h>>2]|0)<0){if((c[k>>2]|0)==(c[7340]|0))Fa();a[(c[i>>2]|0)+(c[k>>2]|0)>>0]=45;c[k>>2]=(c[k>>2]|0)+1;c[h>>2]=0-(c[h>>2]|0)}c[l>>2]=c[k>>2];do{if((c[k>>2]|0)==(c[7340]|0))Fa();a[(c[i>>2]|0)+(c[k>>2]|0)>>0]=48+((c[h>>2]|0)%10|0);c[k>>2]=(c[k>>2]|0)+1;c[h>>2]=(c[h>>2]|0)/10|0}while((c[h>>2]|0)==0^1);c[c[j>>2]>>2]=c[k>>2];c[k>>2]=(c[k>>2]|0)-1;while(1){if((c[l>>2]|0)>=(c[k>>2]|0))break;a[g>>0]=a[(c[i>>2]|0)+(c[l>>2]|0)>>0]|0;a[(c[i>>2]|0)+(c[l>>2]|0)>>0]=a[(c[i>>2]|0)+(c[k>>2]|0)>>0]|0;a[(c[i>>2]|0)+(c[k>>2]|0)>>0]=a[g>>0]|0;c[k>>2]=(c[k>>2]|0)-1;c[l>>2]=(c[l>>2]|0)+1}ma=m;return}function ac(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;bb(c[c[d>>2]>>2]|0);sb(r(c[7399]|0,(c[c[d>>2]>>2]|0)+1|0)|0);c[(c[7366]|0)+(c[c[d>>2]>>2]<<2)>>2]=c[(c[7373]|0)+(c[7400]<<2)>>2];c[(c[7401]|0)+(c[7400]<<2)>>2]=c[c[d>>2]>>2];c[(c[7401]|0)+(c[7402]<<2)>>2]=c[7400];c[c[d>>2]>>2]=(c[c[d>>2]>>2]|0)+1;ma=b;return}function bc(b){b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=b;c[7403]=0;c[7404]=c[(c[7350]|0)+(c[d>>2]<<2)>>2];c[7405]=c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2];while(1){if((c[7404]|0)>=(c[7405]|0))break;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7404]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7404]=(c[7404]|0)+1}c[7400]=Zb(c[7343]|0,0,(c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[d>>2]<<2)>>2]|0)|0,9,0)|0;c[7406]=c[7393];Xb(c[7343]|0,0,(c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[d>>2]<<2)>>2]|0)|0);c[7402]=Zb(c[7343]|0,0,(c[(c[7350]|0)+((c[d>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[d>>2]<<2)>>2]|0)|0,10,0)|0;if(c[7393]|0){c[e>>2]=1;e=c[e>>2]|0;ma=f;return e|0}else{c[e>>2]=0;e=c[e>>2]|0;ma=f;return e|0}return 0}function cc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=ma;ma=ma+16|0;e=d+8|0;g=d+4|0;f=d;c[e>>2]=a;c[g>>2]=b;c[f>>2]=c[(c[7369]|0)+(c[g>>2]<<2)>>2];c[(c[7369]|0)+(c[g>>2]<<2)>>2]=c[(c[7369]|0)+(c[e>>2]<<2)>>2];c[(c[7369]|0)+(c[e>>2]<<2)>>2]=c[f>>2];ma=d;return}function dc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;n=ma;ma=ma+32|0;k=n+20|0;l=n+16|0;m=n+12|0;f=n+8|0;g=n+4|0;h=n;i=n+25|0;j=n+24|0;c[k>>2]=b;c[l>>2]=e;e=r(c[k>>2]|0,c[7407]|0)|0;c[g>>2]=e+(c[7408]|0);e=r(c[l>>2]|0,c[7407]|0)|0;c[h>>2]=e+(c[7408]|0);c[f>>2]=0;while(1){e=r(c[g>>2]|0,(c[7410]|0)+1|0)|0;a[i>>0]=a[(c[7409]|0)+(e+(c[f>>2]|0))>>0]|0;e=r(c[h>>2]|0,(c[7410]|0)+1|0)|0;a[j>>0]=a[(c[7409]|0)+(e+(c[f>>2]|0))>>0]|0;e=(d[j>>0]|0|0)==127;if((d[i>>0]|0|0)==127){b=3;break}if(e){b=11;break}if((d[i>>0]|0|0)<(d[j>>0]|0|0)){b=13;break}if((d[i>>0]|0|0)>(d[j>>0]|0|0)){b=15;break}c[f>>2]=(c[f>>2]|0)+1}if((b|0)==3){if(!e){c[m>>2]=1;m=c[m>>2]|0;ma=n;return m|0}if((c[k>>2]|0)<(c[l>>2]|0)){c[m>>2]=1;m=c[m>>2]|0;ma=n;return m|0}if((c[k>>2]|0)<=(c[l>>2]|0)){Pi(5813,c[7337]|0)|0;Pi(5813,c[7338]|0)|0;Ea();ha(18656,1)}c[m>>2]=0;m=c[m>>2]|0;ma=n;return m|0}else if((b|0)==11){c[m>>2]=0;m=c[m>>2]|0;ma=n;return m|0}else if((b|0)==13){c[m>>2]=1;m=c[m>>2]|0;ma=n;return m|0}else if((b|0)==15){c[m>>2]=0;m=c[m>>2]|0;ma=n;return m|0}return 0}function ec(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=ma;ma=ma+48|0;h=m+32|0;i=m+28|0;j=m+24|0;k=m+20|0;e=m+16|0;g=m+12|0;l=m+8|0;f=m+4|0;d=m;c[h>>2]=a;c[i>>2]=b;a=c[h>>2]|0;if(((c[i>>2]|0)-(c[h>>2]|0)|0)<10){c[e>>2]=a+1;c[f>>2]=c[i>>2];if((c[e>>2]|0)>(c[f>>2]|0)){ma=m;return}do{c[k>>2]=c[e>>2];c[d>>2]=(c[h>>2]|0)+1;a:do if((c[k>>2]|0)>=(c[d>>2]|0))do{if(dc(c[(c[7369]|0)+((c[k>>2]|0)-1<<2)>>2]|0,c[(c[7369]|0)+(c[k>>2]<<2)>>2]|0)|0)break a;cc((c[k>>2]|0)-1|0,c[k>>2]|0);l=c[k>>2]|0;c[k>>2]=l+-1}while((l|0)>(c[d>>2]|0));while(0);l=c[e>>2]|0;c[e>>2]=l+1}while((l|0)<(c[f>>2]|0));ma=m;return}c[j>>2]=a+4;c[g>>2]=((c[h>>2]|0)+(c[i>>2]|0)|0)/2|0;c[k>>2]=(c[i>>2]|0)-4;f=(dc(c[(c[7369]|0)+(c[j>>2]<<2)>>2]|0,c[(c[7369]|0)+(c[g>>2]<<2)>>2]|0)|0)!=0;a=c[7369]|0;do if(f){if(dc(c[a+(c[g>>2]<<2)>>2]|0,c[(c[7369]|0)+(c[k>>2]<<2)>>2]|0)|0){cc(c[h>>2]|0,c[g>>2]|0);break}g=(dc(c[(c[7369]|0)+(c[j>>2]<<2)>>2]|0,c[(c[7369]|0)+(c[k>>2]<<2)>>2]|0)|0)!=0;a=c[h>>2]|0;if(g){cc(a,c[k>>2]|0);break}else{cc(a,c[j>>2]|0);break}}else{if(dc(c[a+(c[k>>2]<<2)>>2]|0,c[(c[7369]|0)+(c[g>>2]<<2)>>2]|0)|0){cc(c[h>>2]|0,c[g>>2]|0);break}g=(dc(c[(c[7369]|0)+(c[k>>2]<<2)>>2]|0,c[(c[7369]|0)+(c[j>>2]<<2)>>2]|0)|0)!=0;a=c[h>>2]|0;if(g){cc(a,c[k>>2]|0);break}else{cc(a,c[j>>2]|0);break}}while(0);c[l>>2]=c[(c[7369]|0)+(c[h>>2]<<2)>>2];c[j>>2]=(c[h>>2]|0)+1;c[k>>2]=c[i>>2];do{while(1){if(!(dc(c[(c[7369]|0)+(c[j>>2]<<2)>>2]|0,c[l>>2]|0)|0))break;c[j>>2]=(c[j>>2]|0)+1}while(1){if(!(dc(c[l>>2]|0,c[(c[7369]|0)+(c[k>>2]<<2)>>2]|0)|0))break;c[k>>2]=(c[k>>2]|0)-1}if((c[j>>2]|0)<(c[k>>2]|0)){cc(c[j>>2]|0,c[k>>2]|0);c[j>>2]=(c[j>>2]|0)+1;c[k>>2]=(c[k>>2]|0)-1}}while((c[j>>2]|0)==((c[k>>2]|0)+1|0)^1);cc(c[h>>2]|0,c[k>>2]|0);ec(c[h>>2]|0,(c[k>>2]|0)-1|0);ec(c[j>>2]|0,c[i>>2]|0);ma=m;return}function fc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=ma;ma=ma+16|0;k=g+8|0;j=g+12|0;i=g+4|0;h=g;c[k>>2]=b;a[j>>0]=d;c[i>>2]=e;c[h>>2]=f;_b(c[k>>2]|0,a[j>>0]|0,11);c[c[i>>2]>>2]=c[7398];a[(c[7372]|0)+(c[c[i>>2]>>2]|0)>>0]=0;c[(c[7401]|0)+(c[c[i>>2]>>2]<<2)>>2]=c[h>>2];c[19584+(c[h>>2]<<2)>>2]=c[c[i>>2]>>2];c[19424+(c[h>>2]<<2)>>2]=0;ma=g;return}function gc(){_b(5832,4,7);c[7411]=c[(c[7373]|0)+(c[7398]<<2)>>2];_b(5845,4,7);c[7412]=c[(c[7373]|0)+(c[7398]<<2)>>2];_b(5858,4,7);c[7413]=c[(c[7373]|0)+(c[7398]<<2)>>2];_b(5871,4,7);c[7364]=c[(c[7373]|0)+(c[7398]<<2)>>2];_b(5884,4,7);c[7362]=c[(c[7373]|0)+(c[7398]<<2)>>2];_b(5897,10,8);_b(5910,7,8);_b(5923,9,2);c[(c[7401]|0)+(c[7398]<<2)>>2]=2;_b(5936,8,2);c[(c[7401]|0)+(c[7398]<<2)>>2]=0;_b(5949,9,2);c[(c[7401]|0)+(c[7398]<<2)>>2]=1;_b(5962,7,2);c[(c[7401]|0)+(c[7398]<<2)>>2]=3;_b(5975,5,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=0;_b(5988,7,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=1;_b(6001,8,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=2;_b(6014,8,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=3;_b(6027,7,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=4;_b(6040,5,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=5;_b(6053,4,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=6;_b(6066,7,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=7;_b(6079,4,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=8;_b(6092,7,4);c[(c[7401]|0)+(c[7398]<<2)>>2]=9;_b(6105,7,12);c[(c[7401]|0)+(c[7398]<<2)>>2]=0;_b(6118,8,12);c[(c[7401]|0)+(c[7398]<<2)>>2]=1;_b(6131,6,12);c[(c[7401]|0)+(c[7398]<<2)>>2]=2;fc(6144,1,29656,0);fc(6157,1,29660,1);fc(6170,1,29664,2);fc(6183,1,29668,3);fc(6196,1,29672,4);fc(6209,1,29676,5);fc(6222,2,29680,6);fc(6235,11,29684,7);fc(6248,10,29688,8);fc(6261,12,29692,9);fc(6274,11,29696,10);fc(6287,5,29700,11);fc(6300,10,29704,12);fc(6313,6,29708,13);fc(6326,12,29712,14);fc(6339,3,29716,15);fc(6352,11,29720,16);fc(6365,11,29724,17);fc(6378,8,29728,18);fc(6391,8,29732,19);fc(6404,10,29736,20);fc(6417,4,29740,21);fc(6430,9,29744,22);fc(6443,7,29748,23);fc(6456,6,29752,24);fc(6469,5,29756,25);fc(6482,6,29760,26);fc(6495,10,29764,27);fc(6508,5,29768,28);fc(6521,12,29772,29);fc(6534,12,29776,30);fc(6547,4,29780,31);fc(6560,5,29784,32);fc(6573,8,29788,33);fc(6586,6,29792,34);fc(6599,6,29796,35);fc(6612,6,29800,36);_b(5629,0,0);c[7451]=c[(c[7373]|0)+(c[7398]<<2)>>2];a[(c[7372]|0)+(c[7398]|0)>>0]=3;_b(6625,12,0);c[7452]=c[(c[7373]|0)+(c[7398]<<2)>>2];a[(c[7372]|0)+(c[7398]|0)>>0]=3;c[7453]=c[7439];c[7454]=0;_b(6638,1,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=0;_b(6651,1,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=1;_b(6664,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=2;_b(6677,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=3;_b(6690,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=4;_b(6703,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=5;_b(6716,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=6;_b(6729,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=7;_b(6742,1,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=8;_b(6755,1,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=9;_b(6768,1,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=10;_b(6781,1,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=11;_b(6794,2,14);c[(c[7401]|0)+(c[7398]<<2)>>2]=12;_b(6807,8,11);a[(c[7372]|0)+(c[7398]|0)>>0]=4;c[(c[7401]|0)+(c[7398]<<2)>>2]=c[7399];c[7455]=c[7399];c[7399]=(c[7399]|0)+1;c[7456]=c[7399];_b(6820,9,11);a[(c[7372]|0)+(c[7398]|0)>>0]=6;c[(c[7401]|0)+(c[7398]<<2)>>2]=c[7407];c[7408]=c[7407];c[7407]=(c[7407]|0)+1;_b(6833,10,11);a[(c[7372]|0)+(c[7398]|0)>>0]=7;c[(c[7401]|0)+(c[7398]<<2)>>2]=c[7410];_b(6846,11,11);a[(c[7372]|0)+(c[7398]|0)>>0]=7;c[(c[7401]|0)+(c[7398]<<2)>>2]=c[7457];return}function hc(b){b=b|0;var e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;f=h+4|0;g=h;a[f>>0]=b;c[7353]=c[7354];while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[f>>0]|0|0))e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if((b|0)<(c[7347]|0)){c[g>>2]=1;g=c[g>>2]|0;ma=h;return g|0}else{c[g>>2]=0;g=c[g>>2]|0;ma=h;return g|0}return 0}function ic(b){b=b|0;var e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;f=h+4|0;g=h;a[f>>0]=b;c[7353]=c[7354];while(1){if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[f>>0]|0|0):0)e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if((b|0)<(c[7347]|0)){c[g>>2]=1;g=c[g>>2]|0;ma=h;return g|0}else{c[g>>2]=0;g=c[g>>2]|0;ma=h;return g|0}return 0}function jc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0;i=ma;ma=ma+16|0;f=i+5|0;g=i+4|0;h=i;a[f>>0]=b;a[g>>0]=e;c[7353]=c[7354];while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[f>>0]|0|0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[g>>0]|0|0):0)e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if((b|0)<(c[7347]|0)){c[h>>2]=1;h=c[h>>2]|0;ma=i;return h|0}else{c[h>>2]=0;h=c[h>>2]|0;ma=i;return h|0}return 0}function kc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0;i=ma;ma=ma+16|0;f=i+5|0;g=i+4|0;h=i;a[f>>0]=b;a[g>>0]=e;c[7353]=c[7354];while(1){if(((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[f>>0]|0|0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[g>>0]|0|0):0)?(d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1:0)e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if((b|0)<(c[7347]|0)){c[h>>2]=1;h=c[h>>2]|0;ma=i;return h|0}else{c[h>>2]=0;h=c[h>>2]|0;ma=i;return h|0}return 0}function lc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+16|0;g=k+6|0;h=k+5|0;i=k+4|0;j=k;a[g>>0]=b;a[h>>0]=e;a[i>>0]=f;c[7353]=c[7354];while(1){if(((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[g>>0]|0|0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[h>>0]|0|0):0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[i>>0]|0|0):0)e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if((b|0)<(c[7347]|0)){c[j>>2]=1;j=c[j>>2]|0;ma=k;return j|0}else{c[j>>2]=0;j=c[j>>2]|0;ma=k;return j|0}return 0}function mc(){var a=0,b=0,e=0,f=0;f=ma;ma=ma+16|0;a=f;c[7353]=c[7354];while(1){if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)==2)e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if(!(b-(c[7353]|0)|0)){c[a>>2]=0;e=c[a>>2]|0;ma=f;return e|0}else{c[a>>2]=1;e=c[a>>2]|0;ma=f;return e|0}return 0}function nc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;g=j+2|0;h=j+1|0;i=j;a[g>>0]=b;a[h>>0]=e;a[i>>0]=f;c[7353]=c[7354];a:do if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=3)while(1){if((d[19744+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1)break a;if((c[7354]|0)>=(c[7347]|0))break a;c[7354]=(c[7354]|0)+1}while(0);if(!((c[7354]|0)-(c[7353]|0)|0)){a[35049]=0;ma=j;return}if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0){if(((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[g>>0]|0|0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[h>>0]|0|0):0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[i>>0]|0|0):0){a[35049]=2;ma=j;return}a[35049]=1;ma=j;return}a[35049]=3;ma=j;return}function oc(){var a=0,b=0;b=ma;ma=ma+16|0;a=b;c[7353]=c[7354];c[7458]=0;while(1){if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=3)break;if((c[7354]|0)>=(c[7347]|0))break;c[7458]=((c[7458]|0)*10|0)+((d[(c[7341]|0)+(c[7354]|0)>>0]|0)-48);c[7354]=(c[7354]|0)+1}if(!((c[7354]|0)-(c[7353]|0)|0)){c[a>>2]=0;a=c[a>>2]|0;ma=b;return a|0}else{c[a>>2]=1;a=c[a>>2]|0;ma=b;return a|0}return 0}function pc(){var b=0,e=0,f=0;f=ma;ma=ma+16|0;b=f;e=f+4|0;c[7353]=c[7354];if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==45){a[e>>0]=1;c[7354]=(c[7354]|0)+1}else a[e>>0]=0;c[7458]=0;while(1){if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=3)break;if((c[7354]|0)>=(c[7347]|0))break;c[7458]=((c[7458]|0)*10|0)+((d[(c[7341]|0)+(c[7354]|0)>>0]|0)-48);c[7354]=(c[7354]|0)+1}if((d[e>>0]|0|0)==1)c[7458]=0-(c[7458]|0);if(((c[7354]|0)-(c[7353]|0)|0)==(d[e>>0]|0|0)){c[b>>2]=0;e=c[b>>2]|0;ma=f;return e|0}else{c[b>>2]=1;e=c[b>>2]|0;ma=f;return e|0}return 0}function qc(){var a=0,b=0,e=0,f=0;f=ma;ma=ma+16|0;a=f;while(1){if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)==1)e=(c[7354]|0)<(c[7347]|0);else e=0;b=c[7354]|0;if(!e)break;c[7354]=b+1}if((b|0)<(c[7347]|0)){c[a>>2]=1;e=c[a>>2]|0;ma=f;return e|0}else{c[a>>2]=0;e=c[a>>2]|0;ma=f;return e|0}return 0}function rc(){var a=0,b=0,e=0;e=ma;ma=ma+16|0;a=e;while(1){if(qc()|0?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=37:0){b=4;break}if(!(Ga(c[7371]|0)|0)){b=6;break}c[7370]=(c[7370]|0)+1;c[7354]=0}if((b|0)==4){c[a>>2]=1;b=c[a>>2]|0;ma=e;return b|0}else if((b|0)==6){c[a>>2]=0;b=c[a>>2]|0;ma=e;return b|0}return 0}function sc(){Ri(45,c[7337]|0)|0;Ri(45,c[7338]|0)|0;eb();Ba();kc(125,37)|0;return}function tc(){var a=0,b=0,d=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+24|0;d=a+16|0;e=a+8|0;f=a;g=c[7337]|0;c[f>>2]=6859;Ki(g,10634,f)|0;f=c[7338]|0;c[e>>2]=6859;Ki(f,10634,e)|0;Pi(6901,c[7337]|0)|0;Pi(6901,c[7338]|0)|0;La();e=c[7337]|0;c[d>>2]=6911;Ki(e,10634,d)|0;d=c[7338]|0;c[b>>2]=6911;Ki(d,10634,b)|0;sc();ma=a;return}function uc(){La();Pi(6945,c[7337]|0)|0;Pi(6945,c[7338]|0)|0;sc();return}function vc(){var a=0,b=0,e=0,f=0,g=0;a=ma;ma=ma+32|0;b=a+16|0;e=a;f=c[7337]|0;g=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[e>>2]=34;c[e+4>>2]=g;c[e+8>>2]=6969;Ki(f,4667,e)|0;e=c[7338]|0;f=d[18816+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0;c[b>>2]=34;c[b+4>>2]=f;c[b+8>>2]=6969;Ki(e,4667,b)|0;sc();ma=a;return}function wc(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;w=ma;ma=ma+208|0;v=w+160|0;u=w+144|0;n=w+128|0;l=w+112|0;k=w+96|0;j=w+80|0;i=w+64|0;h=w+48|0;o=w+32|0;m=w+16|0;g=w;p=w+200|0;q=w+196|0;r=w+192|0;s=w+188|0;t=w+184|0;e=w+180|0;f=w+176|0;c[p>>2]=b;c[r>>2]=50;c[q>>2]=yg((c[r>>2]|0)+1<<2)|0;if(!(rc()|0)){hb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();v=c[q>>2]|0;Yg(v);ma=w;return}c[s>>2]=0;a:while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){b=54;break}b:do switch(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0){case 35:{c[7354]=(c[7354]|0)+1;if(!(pc()|0)){Pi(7003,c[7337]|0)|0;Pi(7003,c[7338]|0)|0;sc();break b}c[7459]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,1,1)|0;if(!(c[7393]|0)){a[(c[7372]|0)+(c[7459]|0)>>0]=2;c[(c[7401]|0)+(c[7459]<<2)>>2]=c[7458]}if((((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)<(c[7347]|0):0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125:0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=37:0){vc();break b}c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=c[7459];if((c[s>>2]|0)==(c[r>>2]|0)){b=c[7337]|0;y=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[g>>2]=7038;c[g+4>>2]=4;c[g+8>>2]=y;c[g+12>>2]=x;Ki(b,3883,g)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;break}case 34:{c[7354]=(c[7354]|0)+1;if(!(hc(34)|0)){y=c[7337]|0;x=d[18850]|0;c[m>>2]=7060;c[m+4>>2]=x;c[m+8>>2]=7065;Ki(y,7053,m)|0;y=c[7338]|0;x=d[18850]|0;c[o>>2]=7060;c[o+4>>2]=x;c[o+8>>2]=7065;Ki(y,7053,o)|0;sc();break b}c[7459]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,0,1)|0;a[(c[7372]|0)+(c[7459]|0)>>0]=3;c[7354]=(c[7354]|0)+1;if((((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)<(c[7347]|0):0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125:0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=37:0){vc();break b}c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=c[7459];if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;b=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[h>>2]=7038;c[h+4>>2]=4;c[h+8>>2]=b;c[h+12>>2]=x;Ki(y,3883,h)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;break}case 39:{c[7354]=(c[7354]|0)+1;kc(125,37)|0;Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,0)|0;if(!(c[7393]|0)){uc();break b}if((c[7460]|0)==(c[7461]|0)){tc();break b}c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=0;if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;b=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[i>>2]=7038;c[i+4>>2]=4;c[i+8>>2]=b;c[i+12>>2]=x;Ki(y,3883,i)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=c[7460];if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;b=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[j>>2]=7038;c[j+4>>2]=4;c[j+8>>2]=b;c[j+12>>2]=x;Ki(y,3883,j)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;break}case 123:{a[c[7343]>>0]=39;$b(c[7462]|0,c[7343]|0,1,e);c[f>>2]=Zb(c[7343]|0,0,c[e>>2]|0,11,1)|0;if(c[7393]|0){b=38;break a}c[7462]=(c[7462]|0)+1;a[(c[7372]|0)+(c[f>>2]|0)>>0]=1;c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=0;if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;b=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[k>>2]=7038;c[k+4>>2]=4;c[k+8>>2]=b;c[k+12>>2]=x;Ki(y,3883,k)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=c[f>>2];if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;b=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[l>>2]=7038;c[l+4>>2]=4;c[l+8>>2]=b;c[l+12>>2]=x;Ki(y,3883,l)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;c[7354]=(c[7354]|0)+1;wc(c[f>>2]|0);break}default:{kc(125,37)|0;Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,0)|0;if(!(c[7393]|0)){uc();break b}if((c[7460]|0)==(c[7461]|0)){tc();break b}c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=c[7460];if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;b=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[n>>2]=7038;c[n+4>>2]=4;c[n+8>>2]=b;c[n+12>>2]=x;Ki(y,3883,n)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1}}while(0);if(!(rc()|0)){b=52;break}}if((b|0)==38){Pi(7089,c[7337]|0)|0;Pi(7089,c[7338]|0)|0;Ea();ha(18656,1)}else if((b|0)==52){hb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();y=c[q>>2]|0;Yg(y);ma=w;return}else if((b|0)==54){c[(c[q>>2]|0)+(c[s>>2]<<2)>>2]=c[7463];if((c[s>>2]|0)==(c[r>>2]|0)){y=c[7337]|0;o=(c[r>>2]|0)+50|0;x=c[r>>2]|0;c[u>>2]=7038;c[u+4>>2]=4;c[u+8>>2]=o;c[u+12>>2]=x;Ki(y,3883,u)|0;c[q>>2]=Bg(c[q>>2]|0,(c[r>>2]|0)+50+1<<2)|0;c[r>>2]=(c[r>>2]|0)+50}c[s>>2]=(c[s>>2]|0)+1;while(1){if(((c[s>>2]|0)+(c[7386]|0)|0)<=(c[7464]|0))break;y=c[7337]|0;u=(c[7464]|0)+3e3|0;x=c[7464]|0;c[v>>2]=7127;c[v+4>>2]=4;c[v+8>>2]=u;c[v+12>>2]=x;Ki(y,3883,v)|0;c[7465]=Bg(c[7465]|0,(c[7464]|0)+3e3+1<<2)|0;c[7464]=(c[7464]|0)+3e3}c[(c[7401]|0)+(c[p>>2]<<2)>>2]=c[7386];c[t>>2]=0;while(1){if((c[t>>2]|0)>=(c[s>>2]|0))break;c[(c[7465]|0)+(c[7386]<<2)>>2]=c[(c[q>>2]|0)+(c[t>>2]<<2)>>2];c[t>>2]=(c[t>>2]|0)+1;c[7386]=(c[7386]|0)+1}c[7354]=(c[7354]|0)+1;y=c[q>>2]|0;Yg(y);ma=w;return}}function xc(){var a=0,b=0,d=0;d=ma;ma=ma+16|0;a=d;while(1){if(!((qc()|0)!=0^1)){b=6;break}if(!(Ga(c[(c[7466]|0)+(c[7361]<<2)>>2]|0)|0)){b=4;break}c[7374]=(c[7374]|0)+1;c[7354]=0}if((b|0)==4){c[a>>2]=0;b=c[a>>2]|0;ma=d;return b|0}else if((b|0)==6){c[a>>2]=1;b=c[a>>2]|0;ma=d;return b|0}return 0}function yc(){var b=0,d=0,e=0;e=ma;ma=ma+16|0;b=e;c[b>>2]=0;if((c[7403]|0)==(c[7340]|0)){xb();d=c[b>>2]|0;ma=e;return d|0}a[(c[7343]|0)+(c[7403]|0)>>0]=32;c[7403]=(c[7403]|0)+1;while(1){if(!((qc()|0)!=0^1)){d=8;break}if(!(Ga(c[(c[7466]|0)+(c[7361]<<2)>>2]|0)|0)){d=6;break}c[7374]=(c[7374]|0)+1;c[7354]=0}if((d|0)==6){tb();d=c[b>>2]|0;ma=e;return d|0}else if((d|0)==8){c[b>>2]=1;d=c[b>>2]|0;ma=e;return d|0}return 0}function zc(){var b=0,e=0,f=0;f=ma;ma=ma+16|0;b=f;c[b>>2]=0;c[7354]=(c[7354]|0)+1;if(!((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0))e=3;if((e|0)==3?(yc()|0)==0:0){e=c[b>>2]|0;ma=f;return e|0}if(((c[7403]|0)>1?(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0|0)==32:0)?(d[(c[7343]|0)+((c[7403]|0)-2)>>0]|0|0)==32:0)c[7403]=(c[7403]|0)-1;c[7467]=0;a:do if(c[7468]|0){b:while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==(d[35050]|0|0))break a;c:do switch(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0){case 125:{e=36;break b}case 123:{c[7467]=(c[7467]|0)+1;if((c[7403]|0)==(c[7340]|0)){e=13;break b}a[(c[7343]|0)+(c[7403]|0)>>0]=123;c[7403]=(c[7403]|0)+1;c[7354]=(c[7354]|0)+1;if(!((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0))e=16;if((e|0)==16?(e=0,(yc()|0)==0):0){e=67;break b}while(1)d:do switch(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0){case 125:{c[7467]=(c[7467]|0)-1;if((c[7403]|0)==(c[7340]|0)){e=20;break b}a[(c[7343]|0)+(c[7403]|0)>>0]=125;c[7403]=(c[7403]|0)+1;c[7354]=(c[7354]|0)+1;if(!((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0))e=23;if((e|0)==23?(e=0,(yc()|0)==0):0){e=67;break b}if(!(c[7467]|0))break c;break}case 123:{c[7467]=(c[7467]|0)+1;if((c[7403]|0)==(c[7340]|0)){e=26;break b}a[(c[7343]|0)+(c[7403]|0)>>0]=123;c[7403]=(c[7403]|0)+1;c[7354]=(c[7354]|0)+1;if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0)break d;if(!(yc()|0)){e=67;break b}break}default:{if((c[7403]|0)==(c[7340]|0)){e=31;break b}a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7341]|0)+(c[7354]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7354]=(c[7354]|0)+1;if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0)break d;if(!(yc()|0)){e=67;break b}}}while(0)}default:{if((c[7403]|0)==(c[7340]|0)){e=38;break b}a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7341]|0)+(c[7354]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7354]=(c[7354]|0)+1;if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)!=1?(c[7354]|0)!=(c[7347]|0):0)break c;if(!(yc()|0)){e=67;break b}}}while(0)}if((e|0)==13){xb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==20){xb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==26){xb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==31){xb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==36){wb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==38){xb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==67){e=c[b>>2]|0;ma=f;return e|0}}else{e:while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==(d[35050]|0|0))break a;f:do if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){e=61;break e}c[7354]=(c[7354]|0)+1;if((lc(a[35050]|0,123,125)|0)==0?(xc()|0)==0:0){e=64;break e}}else{c[7467]=(c[7467]|0)+1;c[7354]=(c[7354]|0)+1;if(!(xc()|0)){e=47;break e}while(1){if((c[7467]|0)<=0)break f;do if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){c[7467]=(c[7467]|0)-1;c[7354]=(c[7354]|0)+1;if(!(xc()|0)){e=52;break e}}else{if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==123){c[7467]=(c[7467]|0)+1;c[7354]=(c[7354]|0)+1;if(xc()|0)break;else{e=55;break e}}c[7354]=(c[7354]|0)+1;if((jc(125,123)|0)==0?(xc()|0)==0:0){e=58;break e}}while(0)}}while(0)}if((e|0)==47){tb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==52){tb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==55){tb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==58){tb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==61){wb();e=c[b>>2]|0;ma=f;return e|0}else if((e|0)==64){tb();e=c[b>>2]|0;ma=f;return e|0}}while(0);c[7354]=(c[7354]|0)+1;c[b>>2]=1;e=c[b>>2]|0;ma=f;return e|0}function Ac(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+32|0;g=i+24|0;f=i+16|0;e=i+8|0;b=i;h=i+28|0;c[h>>2]=0;a:do switch(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0){case 123:{a[35050]=125;if(!(zc()|0)){h=c[h>>2]|0;ma=i;return h|0}break}case 34:{a[35050]=34;if(!(zc()|0)){h=c[h>>2]|0;ma=i;return h|0}break}case 57:case 56:case 55:case 54:case 53:case 52:case 51:case 50:case 49:case 48:{if(!(oc()|0)){Pi(7141,c[7337]|0)|0;Pi(7141,c[7338]|0)|0;Ea();ha(18656,1)}if(c[7468]|0){c[7404]=c[7353];while(1){if((c[7404]|0)>=(c[7354]|0))break a;if((c[7403]|0)==(c[7340]|0))break;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7341]|0)+(c[7404]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7404]=(c[7404]|0)+1}xb();h=c[h>>2]|0;ma=i;return h|0}break}default:{nc(44,a[35051]|0,35);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){zb();Pi(7161,c[7337]|0)|0;Pi(7161,c[7338]|0)|0;qb();h=c[h>>2]|0;ma=i;return h|0}if(c[7468]|0){Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7469]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,13,0)|0;c[7470]=1;if((c[7375]|0)!=0&(c[7471]|0)==2?(c[7469]|0)==(c[7472]|0):0){c[7470]=0;yb();j=c[7337]|0;c[b>>2]=7174;Ki(j,10634,b)|0;b=c[7338]|0;c[e>>2]=7174;Ki(b,10634,e)|0;rb()}if(!(c[7393]|0)){c[7470]=0;yb();j=c[7337]|0;c[f>>2]=7201;Ki(j,10634,f)|0;j=c[7338]|0;c[g>>2]=7201;Ki(j,10634,g)|0;rb()}if(c[7470]|0){c[7404]=c[(c[7350]|0)+(c[(c[7401]|0)+(c[7469]<<2)>>2]<<2)>>2];c[7405]=c[(c[7350]|0)+((c[(c[7401]|0)+(c[7469]<<2)>>2]|0)+1<<2)>>2];b:do if(((c[7403]|0)==0?(d[18400+(d[(c[7351]|0)+(c[7404]|0)>>0]|0)>>0]|0|0)==1:0)?(c[7404]|0)<(c[7405]|0):0){if((c[7403]|0)==(c[7340]|0)){xb();j=c[h>>2]|0;ma=i;return j|0}a[(c[7343]|0)+(c[7403]|0)>>0]=32;c[7403]=(c[7403]|0)+1;c[7404]=(c[7404]|0)+1;while(1){if((d[18400+(d[(c[7351]|0)+(c[7404]|0)>>0]|0)>>0]|0|0)!=1)break b;if((c[7404]|0)>=(c[7405]|0))break b;c[7404]=(c[7404]|0)+1}}while(0);while(1){if((c[7404]|0)>=(c[7405]|0))break a;if((d[18400+(d[(c[7351]|0)+(c[7404]|0)>>0]|0)>>0]|0|0)==1){if((d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0|0)!=32){if((c[7403]|0)==(c[7340]|0)){b=39;break}a[(c[7343]|0)+(c[7403]|0)>>0]=32;c[7403]=(c[7403]|0)+1}}else{if((c[7403]|0)==(c[7340]|0)){b=35;break}a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7404]|0)>>0]|0;c[7403]=(c[7403]|0)+1}c[7404]=(c[7404]|0)+1}if((b|0)==35){xb();j=c[h>>2]|0;ma=i;return j|0}else if((b|0)==39){xb();j=c[h>>2]|0;ma=i;return j|0}}}}}while(0);if(xc()|0){c[h>>2]=1;j=c[h>>2]|0;ma=i;return j|0}else{tb();j=c[h>>2]|0;ma=i;return j|0}return 0}function Bc(){var b=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;f=h+8|0;e=h;b=h+12|0;c[b>>2]=0;c[7403]=0;if(!(Ac()|0)){g=c[b>>2]|0;ma=h;return g|0}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=35){g=8;break}c[7354]=(c[7354]|0)+1;if(!(xc()|0)){g=5;break}if(!(Ac()|0)){g=36;break}}if((g|0)==5){tb();g=c[b>>2]|0;ma=h;return g|0}else if((g|0)==8){a:do if(c[7468]|0){if((c[7375]|0)==0&(c[7403]|0)>0?(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0|0)==32:0)c[7403]=(c[7403]|0)-1;if(!(c[7375]|0)?((c[7403]|0)>0?(d[c[7343]>>0]|0|0)==32:0):0)c[7473]=1;else c[7473]=0;c[7474]=Zb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0,0,1)|0;a[(c[7372]|0)+(c[7474]|0)>>0]=3;if(c[7375]|0)switch(c[7471]|0){case 1:{c[(c[7475]|0)+(c[7454]<<2)>>2]=c[(c[7373]|0)+(c[7474]<<2)>>2];c[7454]=(c[7454]|0)+1;break a}case 2:{c[(c[7401]|0)+(c[7472]<<2)>>2]=c[(c[7373]|0)+(c[7474]<<2)>>2];break a}default:{Ab();break a}}g=r(c[7476]|0,c[7399]|0)|0;c[7379]=g+(c[(c[7401]|0)+(c[7477]<<2)>>2]|0);if((c[7379]|0)>=(c[7376]|0)){Pi(7211,c[7337]|0)|0;Pi(7211,c[7338]|0)|0;Ea();ha(18656,1)}if(c[(c[7377]|0)+(c[7379]<<2)>>2]|0){Pi(7244,c[7337]|0)|0;Pi(7244,c[7338]|0)|0;Ia(c[(c[7366]|0)+(c[7476]<<2)>>2]|0);Pi(7267,c[7337]|0)|0;Pi(7267,c[7338]|0)|0;Ia(c[(c[7373]|0)+(c[7477]<<2)>>2]|0);g=c[7337]|0;c[e>>2]=7278;Ki(g,10634,e)|0;g=c[7338]|0;c[f>>2]=7278;Ki(g,10634,f)|0;rb();break}c[(c[7377]|0)+(c[7379]<<2)>>2]=c[(c[7373]|0)+(c[7474]<<2)>>2];if(!(c[7478]|0?1:(c[(c[7401]|0)+(c[7477]<<2)>>2]|0)!=(c[7455]|0))){c[7404]=c[7473];while(1){if((c[7404]|0)>=(c[7403]|0))break;a[(c[7344]|0)+(c[7404]|0)>>0]=a[(c[7343]|0)+(c[7404]|0)>>0]|0;c[7404]=(c[7404]|0)+1}Xb(c[7344]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0);c[7402]=Zb(c[7344]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0,10,1)|0;if(c[7393]|0){c[7400]=c[(c[7401]|0)+(c[7402]<<2)>>2];if((c[(c[7401]|0)+(c[7400]<<2)>>2]|0)<(c[7479]|0))break;c[(c[7369]|0)+(c[(c[7401]|0)+(c[7400]<<2)>>2]<<2)>>2]=(c[(c[7369]|0)+(c[(c[7401]|0)+(c[7400]<<2)>>2]<<2)>>2]|0)+1;break}c[7400]=Zb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0,9,1)|0;if(c[7393]|0)ab();ac(29512);c[(c[7369]|0)+(c[(c[7401]|0)+(c[7400]<<2)>>2]<<2)>>2]=1}}while(0);c[b>>2]=1;g=c[b>>2]|0;ma=h;return g|0}else if((g|0)==36){g=c[b>>2]|0;ma=h;return g|0}return 0}function Cc(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;c[b>>2]=a;if(!(c[7480]|0)){Pb(c[b>>2]|0);ma=d;return}else{c[7480]=(c[7480]|0)-1;ma=d;return}}function Dc(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;c[b>>2]=a;if((c[7480]|0)<=0){ma=d;return}Pb(c[b>>2]|0);ma=d;return}function Ec(a){a=a|0;var b=0,e=0;e=ma;ma=ma+16|0;b=e;c[b>>2]=a;c[7480]=0;c[7481]=0;c[7482]=0;while(1){if(c[7482]|0){a=28;break}if((c[7403]|0)>=(c[7483]|0)){a=28;break}a:do switch(d[(c[7343]|0)+(c[7403]|0)>>0]|0|0){case 65:case 97:{c[7403]=(c[7403]|0)+1;do if(c[7481]|0?(c[7403]|0)<=((c[7483]|0)-3|0):0){if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=110?(d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=78:0)break;if((d[(c[7343]|0)+((c[7403]|0)+1)>>0]|0|0)!=100?(d[(c[7343]|0)+((c[7403]|0)+1)>>0]|0|0)!=68:0)break;if((d[18400+(d[(c[7343]|0)+((c[7403]|0)+2)>>0]|0)>>0]|0|0)==1){c[7403]=(c[7403]|0)+2;c[7482]=1}}while(0);c[7481]=0;break}case 123:{c[7480]=(c[7480]|0)+1;c[7403]=(c[7403]|0)+1;while(1){if((c[7480]|0)<=0)break;if((c[7403]|0)>=(c[7483]|0))break;if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=125){if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==123)c[7480]=(c[7480]|0)+1}else c[7480]=(c[7480]|0)-1;c[7403]=(c[7403]|0)+1}c[7481]=0;break}case 125:{Cc(c[b>>2]|0);c[7403]=(c[7403]|0)+1;c[7481]=0;break}default:{a=(d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)==1;c[7403]=(c[7403]|0)+1;if(a){c[7481]=1;break a}else{c[7481]=0;break a}}}while(0)}if((a|0)==28){Dc(c[b>>2]|0);ma=e;return}}function Fc(){var a=0,b=0,e=0;e=ma;ma=ma+16|0;a=e;c[7484]=0;c[a>>2]=0;a:while(1){if((c[7485]|0)>=(c[7486]|0)){b=41;break}if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)>=65?(d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)<=90:0){b=41;break}if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)>=97?(d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)<=122:0){b=7;break}b:do if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)==123){c[7484]=(c[7484]|0)+1;c[7485]=(c[7485]|0)+1;if(((c[7485]|0)+2|0)<(c[7486]|0)?(d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)==92:0){b=11;break a}while(1){if((c[7484]|0)<=0)break b;if((c[7485]|0)>=(c[7486]|0))break b;if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)!=125){if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)==123)c[7484]=(c[7484]|0)+1}else c[7484]=(c[7484]|0)-1;c[7485]=(c[7485]|0)+1}}else c[7485]=(c[7485]|0)+1;while(0)}if((b|0)==7){c[a>>2]=1;b=c[a>>2]|0;ma=e;return b|0}else if((b|0)==11){c[7485]=(c[7485]|0)+1;c[7487]=c[7485];while(1){if((c[7485]|0)>=(c[7486]|0))break;if((d[18400+(d[(c[7342]|0)+(c[7485]|0)>>0]|0)>>0]|0|0)!=2)break;c[7485]=(c[7485]|0)+1}c[7488]=Zb(c[7342]|0,c[7487]|0,(c[7485]|0)-(c[7487]|0)|0,14,0)|0;if(c[7393]|0)switch(c[(c[7401]|0)+(c[7488]<<2)>>2]|0){case 12:case 10:case 8:case 6:case 4:case 2:case 1:case 0:{c[a>>2]=1;b=c[a>>2]|0;ma=e;return b|0}case 11:case 9:case 7:case 5:case 3:{b=c[a>>2]|0;ma=e;return b|0}default:{Pi(7286,c[7337]|0)|0;Pi(7286,c[7338]|0)|0;Ea();ha(18656,1)}}while(1){if(!((c[7485]|0)<(c[7486]|0)?(c[7484]|0)>0:0)){b=41;break}if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)>=65?(d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)<=90:0){b=41;break}if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)>=97?(d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)<=122:0){b=25;break}if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)!=125){if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)==123)c[7484]=(c[7484]|0)+1}else c[7484]=(c[7484]|0)-1;c[7485]=(c[7485]|0)+1}if((b|0)==25){c[a>>2]=1;b=c[a>>2]|0;ma=e;return b|0}else if((b|0)==41){b=c[a>>2]|0;ma=e;return b|0}}else if((b|0)==41){b=c[a>>2]|0;ma=e;return b|0}return 0}function Gc(){var a=0;c[7490]=(c[7489]|0)-1;while(1){if((c[7490]|0)<=(c[7491]|0)){a=5;break}c[7485]=c[(c[7345]|0)+((c[7490]|0)-1<<2)>>2];c[7486]=c[(c[7345]|0)+(c[7490]<<2)>>2];if(Fc()|0){a=5;break}c[7490]=(c[7490]|0)-1}if((a|0)==5)return}function Hc(){var a=0;while(1){if((c[7492]|0)<=1){a=9;break}if((c[7493]|0)>=(c[7494]|0)){a=9;break}if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=125){if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==123)c[7492]=(c[7492]|0)+1}else c[7492]=(c[7492]|0)-1;c[7493]=(c[7493]|0)+1}if((a|0)==9)return}function Ic(){Pi(7314,c[7337]|0)|0;Pi(7314,c[7338]|0)|0;Ia(c[7495]|0);Pi(7334,c[7337]|0)|0;Pi(7334,c[7338]|0)|0;Fb();return}function Jc(a){a=a|0;var b=0,e=0,f=0;f=ma;ma=ma+16|0;b=f+4|0;e=f;c[b>>2]=a;c[7496]=0;c[7497]=c[7473];while(1){if((c[7497]|0)>=(c[7403]|0))break;if((c[7496]|0)>=(c[b>>2]|0))break;c[7497]=(c[7497]|0)+1;a:do if((d[(c[7343]|0)+((c[7497]|0)-1)>>0]|0|0)==123){c[7480]=(c[7480]|0)+1;if(((c[7480]|0)==1?(c[7497]|0)<(c[7403]|0):0)?(d[(c[7343]|0)+(c[7497]|0)>>0]|0|0)==92:0){c[7497]=(c[7497]|0)+1;while(1){if(!((c[7497]|0)<(c[7403]|0)?(c[7480]|0)>0:0))break a;if((d[(c[7343]|0)+(c[7497]|0)>>0]|0|0)!=125){if((d[(c[7343]|0)+(c[7497]|0)>>0]|0|0)==123)c[7480]=(c[7480]|0)+1}else c[7480]=(c[7480]|0)-1;c[7497]=(c[7497]|0)+1}}}else if((d[(c[7343]|0)+((c[7497]|0)-1)>>0]|0|0)==125)c[7480]=(c[7480]|0)-1;while(0);c[7496]=(c[7496]|0)+1}if((c[7496]|0)<(c[b>>2]|0)){c[e>>2]=0;e=c[e>>2]|0;ma=f;return e|0}else{c[e>>2]=1;e=c[e>>2]|0;ma=f;return e|0}return 0}function Kc(){var b=0,e=0;c[7403]=0;c[7492]=0;c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;do if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==123){c[7492]=(c[7492]|0)+1;c[7493]=(c[7493]|0)+1;c[7498]=c[7493];c[7499]=0;c[7500]=0;c[7501]=0;c[7502]=1;while(1){if(c[7501]|0)break;if((c[7493]|0)>=(c[7494]|0))break;do if((d[18400+(d[(c[7351]|0)+(c[7493]|0)>>0]|0)>>0]|0|0)!=2){if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==125){c[7492]=(c[7492]|0)-1;c[7493]=(c[7493]|0)+1;c[7501]=1;break}if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==123){c[7492]=(c[7492]|0)+1;c[7493]=(c[7493]|0)+1;Hc();break}else{c[7493]=(c[7493]|0)+1;break}}else{c[7493]=(c[7493]|0)+1;if(!(c[7499]|0)){a:do switch(d[(c[7351]|0)+((c[7493]|0)-1)>>0]|0|0){case 70:case 102:{c[7504]=c[7503];c[7506]=c[7505];if((c[7504]|0)==(c[7506]|0))c[7502]=0;if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=102?(d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=70:0)break a;c[7500]=1;break}case 86:case 118:{c[7504]=c[7491];c[7506]=c[7490];if((c[7504]|0)==(c[7506]|0))c[7502]=0;if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=118?(d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=86:0)break a;c[7500]=1;break}case 76:case 108:{c[7504]=c[7490];c[7506]=c[7489];if((c[7504]|0)==(c[7506]|0))c[7502]=0;if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=108?(d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=76:0)break a;c[7500]=1;break}case 74:case 106:{c[7504]=c[7489];c[7506]=c[7507];if((c[7504]|0)==(c[7506]|0))c[7502]=0;if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=106?(d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=74:0)break a;c[7500]=1;break}default:{Ic();c[7502]=0}}while(0);if(c[7500]|0)c[7493]=(c[7493]|0)+1}else{Ic();c[7502]=0}c[7499]=1}while(0)}if((c[7501]|0)!=0&(c[7502]|0)!=0){c[7473]=c[7403];c[7493]=c[7498];c[7492]=1;while(1){if((c[7492]|0)<=0)break;do if((c[7492]|0)==1?(d[18400+(d[(c[7351]|0)+(c[7493]|0)>>0]|0)>>0]|0|0)==2:0){c[7493]=(c[7493]|0)+1;if(c[7500]|0)c[7493]=(c[7493]|0)+1;c[7508]=1;c[7509]=c[7493];if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==123){c[7508]=0;c[7492]=(c[7492]|0)+1;c[7493]=(c[7493]|0)+1;c[7498]=c[7493];Hc();c[7509]=(c[7493]|0)-1}while(1){if((c[7504]|0)>=(c[7506]|0))break;e=(c[7500]|0)!=0;c[7485]=c[(c[7345]|0)+(c[7504]<<2)>>2];c[7486]=c[(c[7345]|0)+((c[7504]|0)+1<<2)>>2];b:do if(e){if(((c[7483]|0)+((c[7486]|0)-(c[7485]|0))|0)>(c[7340]|0))Fa();while(1){if((c[7485]|0)>=(c[7486]|0))break b;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7342]|0)+(c[7485]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7485]=(c[7485]|0)+1}}else{c:while(1){if((c[7485]|0)>=(c[7486]|0))break b;if((d[18400+(d[(c[7342]|0)+(c[7485]|0)>>0]|0)>>0]|0|0)==2){b=60;break}do if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)==123){if(((c[7485]|0)+1|0)>=(c[7486]|0))break;if((d[(c[7342]|0)+((c[7485]|0)+1)>>0]|0|0)==92)break c}while(0);c[7485]=(c[7485]|0)+1}if((b|0)==60){b=0;if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7342]|0)+(c[7485]|0)>>0]|0;c[7403]=(c[7403]|0)+1;break}if(((c[7403]|0)+2|0)>(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=123;c[7403]=(c[7403]|0)+1;a[(c[7343]|0)+(c[7403]|0)>>0]=92;c[7403]=(c[7403]|0)+1;c[7485]=(c[7485]|0)+2;c[7484]=1;while(1){if(!((c[7485]|0)<(c[7486]|0)?(c[7484]|0)>0:0))break b;do if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)==125)c[7484]=(c[7484]|0)-1;else{if((d[(c[7342]|0)+(c[7485]|0)>>0]|0|0)!=123)break;c[7484]=(c[7484]|0)+1}while(0);if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7342]|0)+(c[7485]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7485]=(c[7485]|0)+1}}while(0);c[7504]=(c[7504]|0)+1;d:do if((c[7504]|0)<(c[7506]|0)){if(!(c[7508]|0)){if(((c[7483]|0)+((c[7509]|0)-(c[7498]|0))|0)>(c[7340]|0))Fa();c[7493]=c[7498];while(1){if((c[7493]|0)>=(c[7509]|0))break d;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7493]=(c[7493]|0)+1}}if(!(c[7500]|0)){if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=46;c[7403]=(c[7403]|0)+1}if((d[18400+(d[(c[7346]|0)+(c[7504]|0)>>0]|0)>>0]|0|0)==4){if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7346]|0)+(c[7504]|0)>>0]|0;c[7403]=(c[7403]|0)+1;break}do if((c[7504]|0)!=((c[7506]|0)-1|0)){if(!(Jc(3)|0))break;if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=32;c[7403]=(c[7403]|0)+1;break d}while(0);if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=126;c[7403]=(c[7403]|0)+1}while(0)}if(!(c[7508]|0))c[7493]=(c[7509]|0)+1}else{if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==125){c[7492]=(c[7492]|0)-1;c[7493]=(c[7493]|0)+1;if((c[7492]|0)<=0)break;if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=125;c[7403]=(c[7403]|0)+1;break}if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==123){c[7492]=(c[7492]|0)+1;c[7493]=(c[7493]|0)+1;if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=123;c[7403]=(c[7403]|0)+1;break}else{if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7493]=(c[7493]|0)+1;break}}while(0)}if(((c[7403]|0)>0?(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0|0)==126:0)?(c[7403]=(c[7403]|0)-1,(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0|0)!=126):0)if(Jc(3)|0){a[(c[7343]|0)+(c[7403]|0)>>0]=32;c[7403]=(c[7403]|0)+1;break}else{c[7403]=(c[7403]|0)+1;break}}}else{if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==125){Pb(c[7495]|0);c[7493]=(c[7493]|0)+1;break}if((c[7403]|0)==(c[7340]|0))Fa();a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7493]=(c[7493]|0)+1}while(0)}if((c[7492]|0)<=0){e=c[7403]|0;c[7483]=e;return}Pb(c[7495]|0);e=c[7403]|0;c[7483]=e;return}function Lc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;g=ma;ma=ma+48|0;f=g+16|0;e=g;i=g+32|0;h=g+36|0;c[i>>2]=b;a[h>>0]=d;c[(c[7510]|0)+(c[7511]<<2)>>2]=c[i>>2];a[(c[7512]|0)+(c[7511]|0)>>0]=a[h>>0]|0;if((c[7511]|0)!=(c[7513]|0)){i=c[7511]|0;i=i+1|0;c[7511]=i;ma=g;return}i=c[7337]|0;d=(c[7513]|0)+50|0;h=c[7513]|0;c[e>>2]=7372;c[e+4>>2]=4;c[e+8>>2]=d;c[e+12>>2]=h;Ki(i,3883,e)|0;c[7510]=Bg(c[7510]|0,(c[7513]|0)+50+1<<2)|0;i=c[7337]|0;e=(c[7513]|0)+50|0;h=c[7513]|0;c[f>>2]=7382;c[f+4>>2]=1;c[f+8>>2]=e;c[f+12>>2]=h;Ki(i,3883,f)|0;c[7512]=Bg(c[7512]|0,(c[7513]|0)+50+1|0)|0;c[7513]=(c[7513]|0)+50;i=c[7511]|0;i=i+1|0;c[7511]=i;ma=g;return}function Mc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;h=ma;ma=ma+16|0;f=h+4|0;g=h;c[f>>2]=b;c[g>>2]=e;if(!(c[7511]|0)){Pi(7395,c[7337]|0)|0;Pi(7395,c[7338]|0)|0;Fb();a[c[g>>2]>>0]=4;ma=h;return}c[7511]=(c[7511]|0)-1;c[c[f>>2]>>2]=c[(c[7510]|0)+(c[7511]<<2)>>2];a[c[g>>2]>>0]=a[(c[7512]|0)+(c[7511]|0)>>0]|0;if((d[c[g>>2]>>0]|0|0)!=1){ma=h;return}if((c[c[f>>2]>>2]|0)<(c[7514]|0)){ma=h;return}if((c[c[f>>2]>>2]|0)!=((c[7348]|0)-1|0)){Pi(7432,c[7337]|0)|0;Pi(7432,c[7338]|0)|0;Ea();ha(18656,1)}c[7348]=(c[7348]|0)-1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2];ma=h;return}function Nc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;g=j;h=j+5|0;i=j+4|0;c[g>>2]=b;a[h>>0]=e;a[i>>0]=f;if((d[h>>0]|0|0)==4){ma=j;return}Kb(c[g>>2]|0,a[h>>0]|0);switch(d[i>>0]|0|0){case 0:{Pi(7459,c[7337]|0)|0;Pi(7459,c[7338]|0)|0;break}case 1:{Pi(7477,c[7337]|0)|0;Pi(7477,c[7338]|0)|0;break}case 2:{Pi(7493,c[7337]|0)|0;Pi(7493,c[7338]|0)|0;break}case 4:case 3:{Ib();break}default:Jb()}Fb();ma=j;return}function Oc(){var b=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+32|0;g=h+8|0;f=h;b=h+12|0;e=h+16|0;Mc(b,e);if((d[e>>0]|0|0)==4){e=c[7337]|0;c[f>>2]=7511;Ki(e,10634,f)|0;f=c[7338]|0;c[g>>2]=7511;Ki(f,10634,g)|0;ma=h;return}else{Lb(c[b>>2]|0,a[e>>0]|0);ma=h;return}}function Pc(){while(1){if((c[7511]|0)<=0)break;Oc()}return}function Qc(){c[7511]=0;c[7514]=c[7348];return}function Rc(){var a=0,b=0,d=0,e=0,f=0;d=ma;ma=ma+32|0;b=d+16|0;a=d;if(c[7511]|0){e=c[7337]|0;f=c[7511]|0;c[a>>2]=7525;c[a+4>>2]=f;c[a+8>>2]=7530;Ki(e,5620,a)|0;a=c[7338]|0;e=c[7511]|0;c[b>>2]=7525;c[b+4>>2]=e;c[b+8>>2]=7530;Ki(a,5620,b)|0;Pc();Pi(7539,c[7337]|0)|0;Pi(7539,c[7338]|0)|0;Fb()}if((c[7514]|0)!=(c[7348]|0)){Pi(7572,c[7337]|0)|0;Pi(7572,c[7338]|0)|0;Ea();ha(18656,1)}else{ma=d;return}}function Sc(){while(1){if(((c[7389]|0)+(c[7483]|0)|0)<=(c[7352]|0))break;Ja()}c[7403]=0;while(1){if((c[7403]|0)>=(c[7483]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7343]|0)+(c[7403]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7403]=(c[7403]|0)+1}Lc(Ub()|0,1);return}function Tc(b){b=b|0;var d=0,e=0;d=ma;ma=ma+16|0;e=d;c[e>>2]=b;c[7390]=c[(c[7350]|0)+(c[e>>2]<<2)>>2];c[7391]=c[(c[7350]|0)+((c[e>>2]|0)+1<<2)>>2];if(((c[7483]|0)+((c[7391]|0)-(c[7390]|0))|0)>(c[7340]|0))Fa();c[7403]=c[7483];while(1){if((c[7390]|0)>=(c[7391]|0))break;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7390]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7390]=(c[7390]|0)+1}c[7483]=c[7403];ma=d;return}function Uc(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+32|0;j=i+16|0;e=i+12|0;f=i+8|0;g=i+4|0;h=i;c[j>>2]=b;c[7390]=c[(c[7350]|0)+(c[j>>2]<<2)>>2];c[7391]=c[(c[7350]|0)+((c[j>>2]|0)+1<<2)>>2];while(1){if(((c[7381]|0)+((c[7391]|0)-(c[7390]|0))|0)<=(c[7340]|0))break;Fa()}c[7382]=c[7381];while(1){if((c[7390]|0)>=(c[7391]|0))break;a[(c[7344]|0)+(c[7382]|0)>>0]=a[(c[7351]|0)+(c[7390]|0)>>0]|0;c[7390]=(c[7390]|0)+1;c[7382]=(c[7382]|0)+1}c[7381]=c[7382];c[h>>2]=0;while(1){if((c[7381]|0)<=79){b=31;break}if(!((c[h>>2]|0)!=0^1)){b=31;break}c[f>>2]=c[7381];c[7382]=79;c[g>>2]=0;while(1){b=c[7382]|0;if(!((d[18400+(d[(c[7344]|0)+(c[7382]|0)>>0]|0)>>0]|0|0)!=1?(c[7382]|0)>=3:0))break;c[7382]=b-1}a:do if((b|0)==2){c[7382]=80;while(1){if((c[7382]|0)>=(c[f>>2]|0))break;if((d[18400+(d[(c[7344]|0)+(c[7382]|0)>>0]|0)>>0]|0|0)==1)break;c[7382]=(c[7382]|0)+1}if((c[7382]|0)==(c[f>>2]|0)){c[h>>2]=1;break}c[g>>2]=1;while(1){if(((c[7382]|0)+1|0)>=(c[f>>2]|0))break a;if((d[18400+(d[(c[7344]|0)+((c[7382]|0)+1)>>0]|0)>>0]|0|0)!=1)break a;c[7382]=(c[7382]|0)+1}}else c[g>>2]=1;while(0);if(c[g>>2]|0){c[7381]=c[7382];c[e>>2]=(c[7381]|0)+1;Mb();a[c[7344]>>0]=32;a[(c[7344]|0)+1>>0]=32;c[7382]=2;c[7404]=c[e>>2];while(1){if((c[7404]|0)>=(c[f>>2]|0))break;a[(c[7344]|0)+(c[7382]|0)>>0]=a[(c[7344]|0)+(c[7404]|0)>>0]|0;c[7382]=(c[7382]|0)+1;c[7404]=(c[7404]|0)+1}c[7381]=(c[f>>2]|0)-(c[e>>2]|0)+2}}if((b|0)==31){ma=i;return}}function Vc(){var b=0,e=0;Mc(29980,35052);Mc(30060,35053);b=d[35052]|0;if((d[35052]|0|0)!=(d[35053]|0|0)){if((b|0)!=4?(d[35053]|0|0)!=4:0){Kb(c[7495]|0,a[35052]|0);Pi(7600,c[7337]|0)|0;Pi(7600,c[7338]|0)|0;Kb(c[7515]|0,a[35053]|0);za();Pi(7603,c[7337]|0)|0;Pi(7603,c[7338]|0)|0;Fb()}Lc(0,0);return}if(b|0?(d[35052]|0|0)!=1:0){if((d[35052]|0|0)!=4){Kb(c[7495]|0,a[35052]|0);Pi(7641,c[7337]|0)|0;Pi(7641,c[7338]|0)|0;Fb()}Lc(0,0);return}b=c[7515]|0;e=c[7495]|0;if(!(d[35052]|0))if((b|0)==(e|0)){Lc(1,0);return}else{Lc(0,0);return}else if(Wb(b,e)|0){Lc(1,0);return}else{Lc(0,0);return}}function Wc(){var b=0;Mc(29980,35052);Mc(30060,35053);if(d[35052]|0|0){Nc(c[7495]|0,a[35052]|0,0);Lc(0,0);return}b=c[7515]|0;if(d[35053]|0|0){Nc(b,a[35053]|0,0);Lc(0,0);return}if((b|0)>(c[7495]|0)){Lc(1,0);return}else{Lc(0,0);return}}function Xc(){var b=0;Mc(29980,35052);Mc(30060,35053);if(d[35052]|0|0){Nc(c[7495]|0,a[35052]|0,0);Lc(0,0);return}b=c[7515]|0;if(d[35053]|0|0){Nc(b,a[35053]|0,0);Lc(0,0);return}if((b|0)<(c[7495]|0)){Lc(1,0);return}else{Lc(0,0);return}}function Yc(){var b=0;Mc(29980,35052);Mc(30060,35053);if(d[35052]|0|0){Nc(c[7495]|0,a[35052]|0,0);Lc(0,0);return}b=c[7515]|0;if(d[35053]|0|0){Nc(b,a[35053]|0,0);Lc(0,0);return}else{Lc(b+(c[7495]|0)|0,0);return}}function Zc(){var b=0;Mc(29980,35052);Mc(30060,35053);if(d[35052]|0|0){Nc(c[7495]|0,a[35052]|0,0);Lc(0,0);return}b=c[7515]|0;if(d[35053]|0|0){Nc(b,a[35053]|0,0);Lc(0,0);return}else{Lc(b-(c[7495]|0)|0,0);return}}function _c(){var b=0,e=0,f=0;Mc(29980,35052);Mc(30060,35053);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(c[7451]|0,1);return}f=c[7515]|0;if((d[35053]|0|0)!=1){Nc(f,a[35053]|0,1);Lc(c[7451]|0,1);return}b=(c[7495]|0)>=(c[7514]|0);e=c[7350]|0;if((f|0)>=(c[7514]|0)){if(b){c[(c[7350]|0)+(c[7495]<<2)>>2]=c[e+((c[7495]|0)+1<<2)>>2];c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2];c[7511]=(c[7511]|0)+1;return}if(!((c[e+((c[7515]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7515]<<2)>>2]|0)|0)){Lc(c[7495]|0,1);return}c[7389]=c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2];while(1){if(((c[7389]|0)+((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0))|0)<=(c[7352]|0))break;Ja()}c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}Lc(Ub()|0,1);return}if(b){if(!((c[e+((c[7515]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7515]<<2)>>2]|0)|0)){c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2];c[(c[7510]|0)+(c[7511]<<2)>>2]=c[7495];c[7511]=(c[7511]|0)+1;return}if(!((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)|0)){c[7511]=(c[7511]|0)+1;return}c[7516]=(c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0);c[7517]=(c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7515]<<2)>>2]|0);while(1){if(((c[7389]|0)+(c[7516]|0)+(c[7517]|0)|0)<=(c[7352]|0))break;Ja()}c[7493]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];c[7494]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7498]=(c[7493]|0)+(c[7517]|0);while(1){if((c[7493]|0)<=(c[7494]|0))break;c[7493]=(c[7493]|0)-1;c[7498]=(c[7498]|0)-1;a[(c[7351]|0)+(c[7498]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0}c[7493]=c[(c[7350]|0)+(c[7515]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}c[7389]=(c[7389]|0)+(c[7516]|0);Lc(Ub()|0,1);return}else{if(!((c[e+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)|0)){c[7511]=(c[7511]|0)+1;return}if(!((c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7515]<<2)>>2]|0)|0)){Lc(c[7495]|0,1);return}while(1){if(((c[7389]|0)+((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0))+((c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7515]<<2)>>2]|0))|0)<=(c[7352]|0))break;Ja()}c[7493]=c[(c[7350]|0)+(c[7515]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}Lc(Ub()|0,1);return}}function $c(){var b=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+32|0;e=h+24|0;g=h+16|0;f=h+8|0;b=h;Mc(29980,35052);Mc(30060,35053);if((d[35052]|0|0)!=2){Nc(c[7495]|0,a[35052]|0,2);ma=h;return}do if(!(c[7380]|0)){if((d[(c[7372]|0)+(c[7495]|0)>>0]|0|0)!=6?(d[(c[7372]|0)+(c[7495]|0)>>0]|0|0)!=5:0)break;Hb();ma=h;return}while(0);switch(d[(c[7372]|0)+(c[7495]|0)>>0]|0|0){case 5:{b=c[7515]|0;if(d[35053]|0|0){Nc(b,a[35053]|0,0);ma=h;return}else{g=r(c[7378]|0,c[7519]|0)|0;c[(c[7518]|0)+(g+(c[(c[7401]|0)+(c[7495]<<2)>>2]|0)<<2)>>2]=b;ma=h;return}}case 6:{if((d[35053]|0|0)!=1){Nc(c[7515]|0,a[35053]|0,1);ma=h;return}c[7520]=(r(c[7378]|0,c[7407]|0)|0)+(c[(c[7401]|0)+(c[7495]<<2)>>2]|0);c[7521]=0;c[7493]=c[(c[7350]|0)+(c[7515]<<2)>>2];c[7498]=c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2];if(((c[7498]|0)-(c[7493]|0)|0)>(c[7410]|0)){Nb();g=c[7337]|0;c[b>>2]=c[7410];c[b+4>>2]=7671;Ki(g,5335,b)|0;g=c[7338]|0;c[f>>2]=c[7410];c[f+4>>2]=7671;Ki(g,5335,f)|0;Ob();c[7498]=(c[7493]|0)+(c[7410]|0)}while(1){if((c[7493]|0)>=(c[7498]|0))break;g=r(c[7520]|0,(c[7410]|0)+1|0)|0;a[(c[7409]|0)+(g+(c[7521]|0))>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7521]=(c[7521]|0)+1;c[7493]=(c[7493]|0)+1}g=r(c[7520]|0,(c[7410]|0)+1|0)|0;a[(c[7409]|0)+(g+(c[7521]|0))>>0]=127;ma=h;return}case 7:{b=c[7515]|0;if(d[35053]|0|0){Nc(b,a[35053]|0,0);ma=h;return}else{c[(c[7401]|0)+(c[7495]<<2)>>2]=b;ma=h;return}}case 8:{if((d[35053]|0|0)!=1){Nc(c[7515]|0,a[35053]|0,1);ma=h;return}c[7522]=c[(c[7401]|0)+(c[7495]<<2)>>2];if((c[7515]|0)<(c[7514]|0)){c[(c[7523]|0)+(c[7522]<<2)>>2]=c[7515];ma=h;return}c[(c[7523]|0)+(c[7522]<<2)>>2]=0;c[7524]=0;c[7493]=c[(c[7350]|0)+(c[7515]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2];if(((c[7494]|0)-(c[7493]|0)|0)>(c[7457]|0)){Nb();f=c[7337]|0;c[g>>2]=c[7457];c[g+4>>2]=7683;Ki(f,5335,g)|0;g=c[7338]|0;c[e>>2]=c[7457];c[e+4>>2]=7683;Ki(g,5335,e)|0;Ob();c[7494]=(c[7493]|0)+(c[7457]|0)}while(1){if((c[7493]|0)>=(c[7494]|0))break;g=r(c[7522]|0,(c[7457]|0)+1|0)|0;a[(c[7525]|0)+(g+(c[7524]|0))>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7524]=(c[7524]|0)+1;c[7493]=(c[7493]|0)+1}c[(c[7526]|0)+(c[7522]<<2)>>2]=c[7524];ma=h;return}default:{Pi(7696,c[7337]|0)|0;Pi(7696,c[7338]|0)|0;jb(c[7495]|0);Pi(7722,c[7337]|0)|0;Pi(7722,c[7338]|0)|0;Fb();ma=h;return}}}function ad(){Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(c[7451]|0,1);return}if(!((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)|0)){Lc(c[7451]|0,1);return}c[7493]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];c[7494]=c[(c[7350]|0)+(c[7495]<<2)>>2];do{if((c[7493]|0)<=(c[7494]|0))break;c[7493]=(c[7493]|0)-1}while((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==125);switch(d[(c[7351]|0)+(c[7493]|0)>>0]|0|0){case 33:case 63:case 46:{if((c[(c[7510]|0)+(c[7511]<<2)>>2]|0)>=(c[7514]|0)){c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2]}c[7511]=(c[7511]|0)+1;return}default:{}}a:do if((c[7495]|0)<(c[7514]|0)){while(1){if(((c[7389]|0)+((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0))+1|0)<=(c[7352]|0))break;Ja()}c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break a;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}}else{c[7389]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if(((c[7389]|0)+1|0)<=(c[7352]|0))break a;Ja()}}while(0);a[(c[7351]|0)+(c[7389]|0)>>0]=46;c[7389]=(c[7389]|0)+1;Lc(Ub()|0,1);return}function bd(){var b=0,e=0;Mc(29980,35052);Mc(30060,35053);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(c[7451]|0,1);return}if((d[35053]|0|0)!=1){Nc(c[7515]|0,a[35053]|0,1);Lc(c[7451]|0,1);return}switch(d[(c[7351]|0)+(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)>>0]|0|0){case 84:case 116:{a[35054]=0;break}case 76:case 108:{a[35054]=1;break}case 85:case 117:{a[35054]=2;break}default:a[35054]=3}if(!(((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)|0)==1?(d[35054]|0|0)!=3:0)){a[35054]=3;Ia(c[7495]|0);Pi(7753,c[7337]|0)|0;Pi(7753,c[7338]|0)|0;Fb()}c[7483]=0;Tc(c[7515]|0);c[7480]=0;c[7403]=0;while(1){if((c[7403]|0)>=(c[7483]|0))break;a:do if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=123){if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==125){Cc(c[7515]|0);c[7527]=0;break}if(!(c[7480]|0))switch(d[35054]|0|0){case 3:break a;case 0:{do if(c[7403]|0){if(c[7527]|0?(d[18400+(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0)>>0]|0|0)==1:0)break;Xb(c[7343]|0,c[7403]|0,1)}while(0);if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==58){c[7527]=1;break a}if((d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)==1)break a;c[7527]=0;break a}case 1:{Xb(c[7343]|0,c[7403]|0,1);break a}case 2:{Yb(c[7343]|0,c[7403]|0,1);break a}default:{Qb();break a}}}else{c[7480]=(c[7480]|0)+1;do if(((c[7480]|0)==1?((c[7403]|0)+4|0)<=(c[7483]|0):0)?(d[(c[7343]|0)+((c[7403]|0)+1)>>0]|0|0)==92:0){if(!(d[35054]|0)){if(!(c[7403]|0))break;if(c[7527]|0?(d[18400+(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0)>>0]|0|0)==1:0)break}c[7403]=(c[7403]|0)+1;while(1){b=c[7403]|0;if(!((c[7403]|0)<(c[7483]|0)?(c[7480]|0)>0:0))break;c[7403]=b+1;c[7473]=c[7403];while(1){if((c[7403]|0)>=(c[7483]|0))break;if((d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)!=2)break;c[7403]=(c[7403]|0)+1}c[7488]=Zb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0,14,0)|0;b:do if(c[7393]|0)switch(d[35054]|0|0){case 3:break b;case 1:case 0:{switch(c[(c[7401]|0)+(c[7488]<<2)>>2]|0){case 7:case 5:case 3:case 9:case 11:break;default:break b}Xb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0);break b}case 2:{switch(c[(c[7401]|0)+(c[7488]<<2)>>2]|0){case 6:case 4:case 2:case 8:case 10:{Yb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0);break b}case 12:case 1:case 0:break;default:break b}Yb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0);while(1){if((c[7473]|0)>=(c[7403]|0))break;a[(c[7343]|0)+((c[7473]|0)-1)>>0]=a[(c[7343]|0)+(c[7473]|0)>>0]|0;c[7473]=(c[7473]|0)+1}c[7473]=(c[7473]|0)-1;while(1){if((c[7403]|0)<(c[7483]|0))e=(d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)==1;else e=0;b=c[7403]|0;if(!e)break;c[7403]=b+1}c[7404]=b;while(1){if((c[7404]|0)>=(c[7483]|0))break;a[(c[7343]|0)+((c[7404]|0)-((c[7403]|0)-(c[7473]|0)))>>0]=a[(c[7343]|0)+(c[7404]|0)>>0]|0;c[7404]=(c[7404]|0)+1}c[7483]=(c[7404]|0)-((c[7403]|0)-(c[7473]|0));c[7403]=c[7473];break b}default:{Qb();break b}}while(0);c[7473]=c[7403];while(1){if(!((c[7480]|0)>0?(c[7403]|0)<(c[7483]|0):0))break;if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==92)break;do if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==125)c[7480]=(c[7480]|0)-1;else{if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=123)break;c[7480]=(c[7480]|0)+1}while(0);c[7403]=(c[7403]|0)+1}switch(d[35054]|0|0){case 1:case 0:{Xb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0);break}case 2:{Yb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0);break}case 3:break;default:Qb()}}c[7403]=b-1}while(0);c[7527]=0}while(0);c[7403]=(c[7403]|0)+1}Dc(c[7515]|0);Sc();return}function cd(){Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(0,0);return}if(((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)|0)!=1){Ri(34,c[7337]|0)|0;Ri(34,c[7338]|0)|0;Ia(c[7495]|0);Pi(7791,c[7337]|0)|0;Pi(7791,c[7338]|0)|0;Fb();Lc(0,0);return}else{Lc(d[(c[7351]|0)+(c[(c[7350]|0)+(c[7495]<<2)>>2]|0)>>0]|0,0);return}}function dd(){if(c[7380]|0){Lc(c[(c[7366]|0)+(c[7378]<<2)>>2]|0,1);return}else{Hb();return}}function ed(){Mc(29980,35052);if((d[35052]|0|0)!=1){Lc(c[7495]|0,a[35052]|0);Lc(c[7495]|0,a[35052]|0);return}if((c[(c[7510]|0)+(c[7511]<<2)>>2]|0)>=(c[7514]|0)){c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2]}c[7511]=(c[7511]|0)+1;if((c[7495]|0)<(c[7514]|0)){Lc(c[7495]|0,a[35052]|0);return}while(1){if(((c[7389]|0)+((c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7495]<<2)>>2]|0))|0)<=(c[7352]|0))break;Ja()}c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}Lc(Ub()|0,1);return}function fd(){var b=0;Mc(29980,35052);switch(d[35052]|0|0){case 1:{c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0)){b=7;break}if((d[18400+(d[(c[7351]|0)+(c[7493]|0)>>0]|0)>>0]|0|0)!=1){b=5;break}c[7493]=(c[7493]|0)+1}if((b|0)==5){Lc(0,0);return}else if((b|0)==7){Lc(1,0);return}break}case 3:{Lc(1,0);return}case 4:{Lc(0,0);return}default:{Kb(c[7495]|0,a[35052]|0);Pi(7818,c[7337]|0)|0;Pi(7818,c[7338]|0)|0;Fb();Lc(0,0);return}}}function gd(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;m=ma;ma=ma+128|0;l=m+112|0;k=m+96|0;j=m+80|0;i=m+64|0;f=m+48|0;h=m+32|0;g=m+16|0;e=m;Mc(29980,35052);Mc(30060,35053);Mc(30112,35055);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(c[7451]|0,1);ma=m;return}if(d[35053]|0|0){Nc(c[7515]|0,a[35053]|0,0);Lc(c[7451]|0,1);ma=m;return}if((d[35055]|0|0)!=1){Nc(c[7528]|0,a[35055]|0,1);Lc(c[7451]|0,1);ma=m;return}c[7483]=0;Tc(c[7528]|0);c[7403]=0;c[7529]=0;while(1){if((c[7529]|0)>=(c[7515]|0))break;if((c[7403]|0)>=(c[7483]|0))break;c[7529]=(c[7529]|0)+1;c[7473]=c[7403];Ec(c[7528]|0)}if((c[7403]|0)<(c[7483]|0))c[7403]=(c[7403]|0)-4;if((c[7529]|0)<(c[7515]|0)){b=c[7337]|0;if((c[7515]|0)==1){Pi(7851,b)|0;Pi(7851,c[7338]|0)|0}else{n=c[7515]|0;c[e>>2]=7873;c[e+4>>2]=n;c[e+8>>2]=7887;Ki(b,4166,e)|0;e=c[7338]|0;b=c[7515]|0;c[g>>2]=7873;c[g+4>>2]=b;c[g+8>>2]=7887;Ki(e,4166,g)|0}Ia(c[7528]|0);Ri(34,c[7337]|0)|0;Ri(34,c[7338]|0)|0;Fb()}a:while(1){if((c[7403]|0)<=(c[7473]|0))break;switch(d[18400+(d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0)>>0]|0|0){case 4:case 1:{c[7403]=(c[7403]|0)-1;break}default:{if((d[(c[7343]|0)+((c[7403]|0)-1)>>0]|0|0)!=44)break a;n=c[7337]|0;g=c[7515]|0;c[h>>2]=7899;c[h+4>>2]=g;c[h+8>>2]=7905;Ki(n,4166,h)|0;n=c[7338]|0;g=c[7515]|0;c[f>>2]=7899;c[f+4>>2]=g;c[f+8>>2]=7905;Ki(n,4166,f)|0;Ia(c[7528]|0);Pi(7911,c[7337]|0)|0;Pi(7911,c[7338]|0)|0;Fb();c[7403]=(c[7403]|0)-1}}}c[7485]=0;c[7530]=0;c[7531]=0;c[7532]=1;while(1){if((c[7473]|0)>=(c[7403]|0))break;b:do switch(d[(c[7343]|0)+(c[7473]|0)>>0]|0|0){case 44:{if((c[7530]|0)==2){n=c[7337]|0;h=c[7515]|0;c[i>>2]=7936;c[i+4>>2]=h;c[i+8>>2]=7961;Ki(n,4166,i)|0;n=c[7338]|0;h=c[7515]|0;c[j>>2]=7936;c[j+4>>2]=h;c[j+8>>2]=7961;Ki(n,4166,j)|0;Ia(c[7528]|0);Ri(34,c[7337]|0)|0;Ri(34,c[7338]|0)|0;Fb()}else{c[7530]=(c[7530]|0)+1;b=c[7531]|0;if((c[7530]|0)==1)c[7533]=b;else c[7534]=b;a[(c[7346]|0)+(c[7531]|0)>>0]=44}c[7473]=(c[7473]|0)+1;c[7532]=1;break}case 123:{c[7480]=(c[7480]|0)+1;if(c[7532]|0){c[(c[7345]|0)+(c[7531]<<2)>>2]=c[7485];c[7531]=(c[7531]|0)+1}a[(c[7342]|0)+(c[7485]|0)>>0]=a[(c[7343]|0)+(c[7473]|0)>>0]|0;c[7485]=(c[7485]|0)+1;c[7473]=(c[7473]|0)+1;while(1){if((c[7480]|0)<=0)break;if((c[7473]|0)>=(c[7403]|0))break;if((d[(c[7343]|0)+(c[7473]|0)>>0]|0|0)!=125){if((d[(c[7343]|0)+(c[7473]|0)>>0]|0|0)==123)c[7480]=(c[7480]|0)+1}else c[7480]=(c[7480]|0)-1;a[(c[7342]|0)+(c[7485]|0)>>0]=a[(c[7343]|0)+(c[7473]|0)>>0]|0;c[7485]=(c[7485]|0)+1;c[7473]=(c[7473]|0)+1}c[7532]=0;break}case 125:{if(c[7532]|0){c[(c[7345]|0)+(c[7531]<<2)>>2]=c[7485];c[7531]=(c[7531]|0)+1}n=c[7337]|0;h=c[7515]|0;c[k>>2]=7899;c[k+4>>2]=h;c[k+8>>2]=7961;Ki(n,4166,k)|0;n=c[7338]|0;h=c[7515]|0;c[l>>2]=7899;c[l+4>>2]=h;c[l+8>>2]=7961;Ki(n,4166,l)|0;Ia(c[7528]|0);Pi(7967,c[7337]|0)|0;Pi(7967,c[7338]|0)|0;Fb();c[7473]=(c[7473]|0)+1;c[7532]=0;break}default:switch(d[18400+(d[(c[7343]|0)+(c[7473]|0)>>0]|0)>>0]|0|0){case 1:{if(!(c[7532]|0))a[(c[7346]|0)+(c[7531]|0)>>0]=32;c[7473]=(c[7473]|0)+1;c[7532]=1;break b}case 4:{if(!(c[7532]|0))a[(c[7346]|0)+(c[7531]|0)>>0]=a[(c[7343]|0)+(c[7473]|0)>>0]|0;c[7473]=(c[7473]|0)+1;c[7532]=1;break b}default:{if(c[7532]|0){c[(c[7345]|0)+(c[7531]<<2)>>2]=c[7485];c[7531]=(c[7531]|0)+1}a[(c[7342]|0)+(c[7485]|0)>>0]=a[(c[7343]|0)+(c[7473]|0)>>0]|0;c[7485]=(c[7485]|0)+1;c[7473]=(c[7473]|0)+1;c[7532]=0;break b}}}while(0)}c[(c[7345]|0)+(c[7531]<<2)>>2]=c[7485];do if(c[7530]|0){if((c[7530]|0)==1){c[7491]=0;c[7489]=c[7533];c[7507]=c[7489];c[7503]=c[7507];c[7505]=c[7531];Gc();break}if((c[7530]|0)==2){c[7491]=0;c[7489]=c[7533];c[7507]=c[7534];c[7503]=c[7507];c[7505]=c[7531];Gc();break}else{Pi(7990,c[7337]|0)|0;Pi(7990,c[7338]|0)|0;Ea();ha(18656,1)}}else{c[7503]=0;c[7489]=c[7531];c[7507]=c[7489];c[7491]=0;while(1){if((c[7491]|0)>=((c[7489]|0)-1|0)){b=66;break}c[7485]=c[(c[7345]|0)+(c[7491]<<2)>>2];c[7486]=c[(c[7345]|0)+((c[7491]|0)+1<<2)>>2];if(Fc()|0){b=64;break}c[7491]=(c[7491]|0)+1}if((b|0)==64)Gc();else if((b|0)==66){while(1){if((c[7491]|0)<=0)break;if((d[18400+(d[(c[7346]|0)+(c[7491]|0)>>0]|0)>>0]|0|0)!=4)break;if((d[(c[7346]|0)+(c[7491]|0)>>0]|0|0)==126)break;c[7491]=(c[7491]|0)-1}c[7490]=c[7491]}c[7505]=c[7491]}while(0);c[7483]=0;Tc(c[7495]|0);Kc();Sc();ma=m;return}function hd(){var b=0,e=0,f=0,g=0;g=ma;ma=ma+16|0;f=g+8|0;e=g;Mc(29980,35052);b=c[7495]|0;if(d[35052]|0|0){Nc(b,a[35052]|0,0);Lc(c[7451]|0,1);ma=g;return}if((b|0)<0|(c[7495]|0)>127){b=c[7337]|0;c[e>>2]=c[7495];c[e+4>>2]=8016;Ki(b,5335,e)|0;e=c[7338]|0;c[f>>2]=c[7495];c[f+4>>2]=8016;Ki(e,5335,f)|0;Fb();Lc(c[7451]|0,1);ma=g;return}while(1){if(((c[7389]|0)+1|0)<=(c[7352]|0))break;Ja()}a[(c[7351]|0)+(c[7389]|0)>>0]=c[7495];c[7389]=(c[7389]|0)+1;Lc(Ub()|0,1);ma=g;return}function id(){var b=0;Mc(29980,35052);b=c[7495]|0;if(d[35052]|0|0){Nc(b,a[35052]|0,0);Lc(c[7451]|0,1);return}else{$b(b,c[7343]|0,0,29932);Sc();return}}function jd(){Mc(29980,35052);if(!(c[7380]|0)){Hb();return}if((d[35052]|0|0)!=1?(d[35052]|0|0)!=3:0){if((d[35052]|0|0)!=4){Kb(c[7495]|0,a[35052]|0);Pi(7818,c[7337]|0)|0;Pi(7818,c[7338]|0)|0;Fb()}Lc(0,0);return}if((d[35052]|0|0)==3){Lc(1,0);return}else{Lc(0,0);return}}function kd(){Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(0,0);return}c[7483]=0;Tc(c[7495]|0);c[7403]=0;c[7529]=0;while(1){if((c[7403]|0)>=(c[7483]|0))break;Ec(c[7495]|0);c[7529]=(c[7529]|0)+1}Lc(c[7529]|0,0);return}function ld(){c[7483]=0;c[7454]=0;while(1){if((c[7454]|0)>=(c[7535]|0))break;Tc(c[(c[7475]|0)+(c[7454]<<2)>>2]|0);c[7454]=(c[7454]|0)+1}Sc();return}function md(){var b=0;Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(c[7451]|0,1);return}c[7483]=0;Tc(c[7495]|0);c[7480]=0;c[7473]=0;c[7403]=0;while(1){if((c[7403]|0)>=(c[7483]|0))break;a:do switch(d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0){case 4:case 1:{a[(c[7343]|0)+(c[7473]|0)>>0]=32;c[7473]=(c[7473]|0)+1;break}case 3:case 2:{a[(c[7343]|0)+(c[7473]|0)>>0]=a[(c[7343]|0)+(c[7403]|0)>>0]|0;c[7473]=(c[7473]|0)+1;break}default:{if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=123){if(!((c[7480]|0)>0?(d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==125:0))break a;c[7480]=(c[7480]|0)-1;break a}c[7480]=(c[7480]|0)+1;if(((c[7480]|0)==1?((c[7403]|0)+1|0)<(c[7483]|0):0)?(d[(c[7343]|0)+((c[7403]|0)+1)>>0]|0|0)==92:0){c[7403]=(c[7403]|0)+1;while(1){b=c[7403]|0;if(!((c[7403]|0)<(c[7483]|0)?(c[7480]|0)>0:0))break;c[7403]=b+1;c[7497]=c[7403];while(1){if((c[7403]|0)>=(c[7483]|0))break;if((d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)!=2)break;c[7403]=(c[7403]|0)+1}c[7488]=Zb(c[7343]|0,c[7497]|0,(c[7403]|0)-(c[7497]|0)|0,14,0)|0;b:do if(c[7393]|0){a[(c[7343]|0)+(c[7473]|0)>>0]=a[(c[7343]|0)+(c[7497]|0)>>0]|0;c[7473]=(c[7473]|0)+1;switch(c[(c[7401]|0)+(c[7488]<<2)>>2]|0){case 12:case 5:case 4:case 3:case 2:break;default:break b}a[(c[7343]|0)+(c[7473]|0)>>0]=a[(c[7343]|0)+((c[7497]|0)+1)>>0]|0;c[7473]=(c[7473]|0)+1}while(0);while(1){if(!((c[7480]|0)>0?(c[7403]|0)<(c[7483]|0):0))break;if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==92)break;b=a[(c[7343]|0)+(c[7403]|0)>>0]|0;do if(((d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0)+-2|0)>>>0>=2){if((b&255|0)==125){c[7480]=(c[7480]|0)-1;break}if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==123)c[7480]=(c[7480]|0)+1}else{a[(c[7343]|0)+(c[7473]|0)>>0]=b;c[7473]=(c[7473]|0)+1}while(0);c[7403]=(c[7403]|0)+1}}c[7403]=b-1}}}while(0);c[7403]=(c[7403]|0)+1}c[7483]=c[7473];Sc();return}function nd(){while(1){if(((c[7389]|0)+1|0)<=(c[7352]|0))break;Ja()}a[(c[7351]|0)+(c[7389]|0)>>0]=34;c[7389]=(c[7389]|0)+1;Lc(Ub()|0,1);return}function od(){Mc(29980,35052);Mc(30060,35053);Mc(30112,35055);if(d[35052]|0|0){Nc(c[7495]|0,a[35052]|0,0);Lc(c[7451]|0,1);return}if(d[35053]|0|0){Nc(c[7515]|0,a[35053]|0,0);Lc(c[7451]|0,1);return}if((d[35055]|0|0)!=1){Nc(c[7528]|0,a[35055]|0,1);Lc(c[7451]|0,1);return}c[7516]=(c[(c[7350]|0)+((c[7528]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7528]<<2)>>2]|0);if((c[7495]|0)>=(c[7516]|0)?(c[7515]|0)==1|(c[7515]|0)==-1:0){if((c[(c[7510]|0)+(c[7511]<<2)>>2]|0)>=(c[7514]|0)){c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2]}c[7511]=(c[7511]|0)+1;return}if((!((c[7495]|0)<=0|(c[7515]|0)==0)?(c[7515]|0)<=(c[7516]|0):0)?(c[7515]|0)>=(0-(c[7516]|0)|0):0){if((c[7515]|0)>0){if((c[7495]|0)>((c[7516]|0)-((c[7515]|0)-1)|0))c[7495]=(c[7516]|0)-((c[7515]|0)-1);c[7493]=(c[(c[7350]|0)+(c[7528]<<2)>>2]|0)+((c[7515]|0)-1);c[7494]=(c[7493]|0)+(c[7495]|0);if((c[7515]|0)==1?(c[7528]|0)>=(c[7514]|0):0){c[(c[7350]|0)+((c[7528]|0)+1<<2)>>2]=c[7494];c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2];c[7511]=(c[7511]|0)+1;return}}else{c[7515]=0-(c[7515]|0);if((c[7495]|0)>((c[7516]|0)-((c[7515]|0)-1)|0))c[7495]=(c[7516]|0)-((c[7515]|0)-1);c[7494]=(c[(c[7350]|0)+((c[7528]|0)+1<<2)>>2]|0)-((c[7515]|0)-1);c[7493]=(c[7494]|0)-(c[7495]|0)}while(1){if(((c[7389]|0)+(c[7494]|0)-(c[7493]|0)|0)<=(c[7352]|0))break;Ja()}while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}Lc(Ub()|0,1);return}Lc(c[7451]|0,1);return}function pd(){Mc(29980,35052);Mc(30060,35053);if((d[35052]|0|0)==1?(c[7495]|0)>=(c[7514]|0):0){if((d[35053]|0|0)==1?(c[7515]|0)>=(c[7514]|0):0){c[7483]=0;Tc(c[7515]|0);c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];while(1){if((c[7493]|0)>=(c[7494]|0))break;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}Lc(Ub()|0,1);Sc();return}c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2];Lc(c[7495]|0,1);Lc(c[7515]|0,a[35053]|0);return}Lc(c[7495]|0,a[35052]|0);if((d[35053]|0|0)==1?(c[7515]|0)>=(c[7514]|0):0){c[7348]=(c[7348]|0)+1;c[7389]=c[(c[7350]|0)+(c[7348]<<2)>>2]}Lc(c[7515]|0,a[35053]|0);return}function qd(){Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(c[7451]|0,1);return}c[7496]=0;c[7493]=c[(c[7350]|0)+(c[7495]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7495]|0)+1<<2)>>2];c[7492]=0;while(1){if((c[7493]|0)>=(c[7494]|0))break;c[7493]=(c[7493]|0)+1;do if((d[(c[7351]|0)+((c[7493]|0)-1)>>0]|0|0)==123){c[7492]=(c[7492]|0)+1;if(((c[7492]|0)==1?(c[7493]|0)<(c[7494]|0):0)?(d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==92:0){c[7493]=(c[7493]|0)+1;while(1){if(!((c[7493]|0)<(c[7494]|0)?(c[7492]|0)>0:0))break;if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)!=125){if((d[(c[7351]|0)+(c[7493]|0)>>0]|0|0)==123)c[7492]=(c[7492]|0)+1}else c[7492]=(c[7492]|0)-1;c[7493]=(c[7493]|0)+1}c[7496]=(c[7496]|0)+1}}else{if((d[(c[7351]|0)+((c[7493]|0)-1)>>0]|0|0)!=125){c[7496]=(c[7496]|0)+1;break}if((c[7492]|0)>0)c[7492]=(c[7492]|0)-1}while(0)}Lc(c[7496]|0,0);return}function rd(){var b=0,e=0;Mc(29980,35052);Mc(30060,35053);if(d[35052]|0|0){Nc(c[7495]|0,a[35052]|0,0);Lc(c[7451]|0,1);return}if((d[35053]|0|0)!=1){Nc(c[7515]|0,a[35053]|0,1);Lc(c[7451]|0,1);return}if((c[7495]|0)<=0){Lc(c[7451]|0,1);return}c[7493]=c[(c[7350]|0)+(c[7515]<<2)>>2];c[7494]=c[(c[7350]|0)+((c[7515]|0)+1<<2)>>2];c[7496]=0;c[7492]=0;c[7498]=c[7493];while(1){if((c[7498]|0)<(c[7494]|0))b=(c[7496]|0)<(c[7495]|0);else b=0;e=c[7498]|0;if(!b)break;c[7498]=e+1;do if((d[(c[7351]|0)+((c[7498]|0)-1)>>0]|0|0)==123){c[7492]=(c[7492]|0)+1;if(((c[7492]|0)==1?(c[7498]|0)<(c[7494]|0):0)?(d[(c[7351]|0)+(c[7498]|0)>>0]|0|0)==92:0){c[7498]=(c[7498]|0)+1;while(1){if(!((c[7498]|0)<(c[7494]|0)?(c[7492]|0)>0:0))break;if((d[(c[7351]|0)+(c[7498]|0)>>0]|0|0)!=125){if((d[(c[7351]|0)+(c[7498]|0)>>0]|0|0)==123)c[7492]=(c[7492]|0)+1}else c[7492]=(c[7492]|0)-1;c[7498]=(c[7498]|0)+1}c[7496]=(c[7496]|0)+1}}else{if((d[(c[7351]|0)+((c[7498]|0)-1)>>0]|0|0)!=125){c[7496]=(c[7496]|0)+1;break}if((c[7492]|0)>0)c[7492]=(c[7492]|0)-1}while(0)}c[7494]=e;while(1){if(((c[7389]|0)+(c[7492]|0)+(c[7494]|0)-(c[7493]|0)|0)<=(c[7352]|0))break;Ja()}a:do if((c[7515]|0)>=(c[7514]|0))c[7389]=c[7494];else while(1){if((c[7493]|0)>=(c[7494]|0))break a;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7351]|0)+(c[7493]|0)>>0]|0;c[7389]=(c[7389]|0)+1;c[7493]=(c[7493]|0)+1}while(0);while(1){if((c[7492]|0)<=0)break;a[(c[7351]|0)+(c[7389]|0)>>0]=125;c[7389]=(c[7389]|0)+1;c[7492]=(c[7492]|0)-1}Lc(Ub()|0,1);return}function sd(){if(!(c[7380]|0)){Hb();return}if((c[(c[7367]|0)+(c[7378]<<2)>>2]|0)!=(c[7536]|0)?c[(c[7367]|0)+(c[7378]<<2)>>2]|0:0){Lc(c[(c[7373]|0)+(c[(c[7367]|0)+(c[7378]<<2)>>2]<<2)>>2]|0,1);return}Lc(c[7451]|0,1);return}function td(){Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);return}else{Pi(8035,c[7337]|0)|0;Pi(8035,c[7338]|0)|0;Lb(c[7495]|0,a[35052]|0);Aa();return}}function ud(){var b=0,e=0,f=0;Mc(29980,35052);if((d[35052]|0|0)!=1){Nc(c[7495]|0,a[35052]|0,1);Lc(0,0);return}c[7483]=0;Tc(c[7495]|0);c[7537]=0;c[7480]=0;c[7403]=0;while(1){if((c[7403]|0)>=(c[7483]|0))break;do if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=123)if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==125){Cc(c[7495]|0);c[7537]=(c[7537]|0)+(c[5125]|0);break}else{c[7537]=(c[7537]|0)+(c[2e4+((d[(c[7343]|0)+(c[7403]|0)>>0]|0)<<2)>>2]|0);break}else{c[7480]=(c[7480]|0)+1;if((c[7480]|0)==1?((c[7403]|0)+1|0)<(c[7483]|0):0){if((d[(c[7343]|0)+((c[7403]|0)+1)>>0]|0|0)!=92){c[7537]=(c[7537]|0)+(c[5123]|0);break}c[7403]=(c[7403]|0)+1;while(1){b=c[7403]|0;if(!((c[7403]|0)<(c[7483]|0)?(c[7480]|0)>0:0))break;c[7403]=b+1;c[7473]=c[7403];while(1){if((c[7403]|0)<(c[7483]|0))b=(d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)==2;else b=0;e=c[7403]|0;if(!b)break;c[7403]=e+1}if((e|0)<(c[7483]|0)?(c[7403]|0)==(c[7473]|0):0)c[7403]=(c[7403]|0)+1;else f=19;a:do if((f|0)==19?(f=0,c[7488]=Zb(c[7343]|0,c[7473]|0,(c[7403]|0)-(c[7473]|0)|0,14,0)|0,c[7393]|0):0)switch(c[(c[7401]|0)+(c[7488]<<2)>>2]|0){case 12:{c[7537]=(c[7537]|0)+500;break a}case 4:{c[7537]=(c[7537]|0)+722;break a}case 2:{c[7537]=(c[7537]|0)+778;break a}case 5:{c[7537]=(c[7537]|0)+903;break a}case 3:{c[7537]=(c[7537]|0)+1014;break a}default:{c[7537]=(c[7537]|0)+(c[2e4+((d[(c[7343]|0)+(c[7473]|0)>>0]|0)<<2)>>2]|0);break a}}while(0);while(1){if((c[7403]|0)>=(c[7483]|0))break;if((d[18400+(d[(c[7343]|0)+(c[7403]|0)>>0]|0)>>0]|0|0)!=1)break;c[7403]=(c[7403]|0)+1}while(1){if(!((c[7480]|0)>0?(c[7403]|0)<(c[7483]|0):0))break;if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==92)break;do if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)!=125)if((d[(c[7343]|0)+(c[7403]|0)>>0]|0|0)==123){c[7480]=(c[7480]|0)+1;break}else{c[7537]=(c[7537]|0)+(c[2e4+((d[(c[7343]|0)+(c[7403]|0)>>0]|0)<<2)>>2]|0);break}else c[7480]=(c[7480]|0)-1;while(0);c[7403]=(c[7403]|0)+1}}c[7403]=b-1;break}c[7537]=(c[7537]|0)+(c[5123]|0)}while(0);c[7403]=(c[7403]|0)+1}Dc(c[7495]|0);Lc(c[7537]|0,0);return}function vd(){var b=0;Mc(29980,35052);b=c[7495]|0;if((d[35052]|0|0)!=1){Nc(b,a[35052]|0,1);return}else{Uc(b);return}}function wd(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+32|0;e=l+12|0;i=l+8|0;j=l+4|0;f=l+17|0;g=l+16|0;h=l;c[e>>2]=b;do switch(d[(c[7372]|0)+(c[e>>2]|0)>>0]|0|0){case 0:{c[19424+(c[(c[7401]|0)+(c[e>>2]<<2)>>2]<<2)>>2]=(c[19424+(c[(c[7401]|0)+(c[e>>2]<<2)>>2]<<2)>>2]|0)+1;do switch(c[(c[7401]|0)+(c[e>>2]<<2)>>2]|0){case 0:{Vc();ma=l;return}case 1:{Wc();ma=l;return}case 2:{Xc();ma=l;return}case 3:{Yc();ma=l;return}case 4:{Zc();ma=l;return}case 5:{_c();ma=l;return}case 6:{$c();ma=l;return}case 7:{ad();ma=l;return}case 8:{if(!(c[7380]|0)){Hb();ma=l;return}if((c[(c[7367]|0)+(c[7378]<<2)>>2]|0)==(c[7536]|0)){wd(c[7453]|0);ma=l;return}if(!(c[(c[7367]|0)+(c[7378]<<2)>>2]|0)){ma=l;return}wd(c[(c[7367]|0)+(c[7378]<<2)>>2]|0);ma=l;return}case 9:{bd();ma=l;return}case 10:{cd();ma=l;return}case 11:{dd();ma=l;return}case 12:{ed();ma=l;return}case 13:{fd();ma=l;return}case 14:{gd();ma=l;return}case 15:{Mc(29980,35052);Mc(30060,35053);Mc(30112,35055);if((d[35052]|0|0)!=2){Nc(c[7495]|0,a[35052]|0,2);ma=l;return}if((d[35053]|0|0)!=2){Nc(c[7515]|0,a[35053]|0,2);ma=l;return}b=c[7528]|0;if(d[35055]|0|0){Nc(b,a[35055]|0,0);ma=l;return}if((b|0)>0){wd(c[7515]|0);ma=l;return}else{wd(c[7495]|0);ma=l;return}}case 16:{hd();ma=l;return}case 17:{id();ma=l;return}case 18:{jd();ma=l;return}case 19:{Mb();ma=l;return}case 20:{kd();ma=l;return}case 21:{Mc(29980,35052);ma=l;return}case 22:{ld();ma=l;return}case 23:{md();ma=l;return}case 24:{nd();ma=l;return}case 26:{Pc();ma=l;return}case 27:{od();ma=l;return}case 28:{pd();ma=l;return}case 29:{qd();ma=l;return}case 30:{rd();ma=l;return}case 31:{Oc();ma=l;return}case 32:{sd();ma=l;return}case 33:{td();ma=l;return}case 34:{Mc(i,f);Mc(j,g);if((d[f>>0]|0|0)!=2){Nc(c[i>>2]|0,a[f>>0]|0,2);ma=l;return}if((d[g>>0]|0|0)!=2){Nc(c[j>>2]|0,a[g>>0]|0,2);ma=l;return}while(1){wd(c[j>>2]|0);Mc(29980,35052);b=c[7495]|0;if(d[35052]|0|0)break;if((b|0)<=0){k=96;break}wd(c[i>>2]|0)}if((k|0)==96){ma=l;return}Nc(b,a[35052]|0,0);ma=l;return}case 35:{ud();ma=l;return}case 36:{vd();ma=l;return}case 25:{ma=l;return}default:{Pi(8045,c[7337]|0)|0;Pi(8045,c[7338]|0)|0;Ea();ha(18656,1)}}while(0);break}case 1:{c[h>>2]=c[(c[7401]|0)+(c[e>>2]<<2)>>2];while(1){if((c[(c[7465]|0)+(c[h>>2]<<2)>>2]|0)==(c[7463]|0))break;if(c[(c[7465]|0)+(c[h>>2]<<2)>>2]|0)wd(c[(c[7465]|0)+(c[h>>2]<<2)>>2]|0);else{c[h>>2]=(c[h>>2]|0)+1;Lc(c[(c[7465]|0)+(c[h>>2]<<2)>>2]|0,2)}c[h>>2]=(c[h>>2]|0)+1}ma=l;return}case 2:{Lc(c[(c[7401]|0)+(c[e>>2]<<2)>>2]|0,0);ma=l;return}case 3:{Lc(c[(c[7373]|0)+(c[e>>2]<<2)>>2]|0,1);ma=l;return}case 4:{if(!(c[7380]|0)){Hb();ma=l;return}k=r(c[7378]|0,c[7399]|0)|0;c[7379]=k+(c[(c[7401]|0)+(c[e>>2]<<2)>>2]|0);if((c[7379]|0)>=(c[7376]|0)){Pi(7211,c[7337]|0)|0;Pi(7211,c[7338]|0)|0;Ea();ha(18656,1)}if(!(c[(c[7377]|0)+(c[7379]<<2)>>2]|0)){Lc(c[(c[7373]|0)+(c[e>>2]<<2)>>2]|0,3);ma=l;return}else{Lc(c[(c[7377]|0)+(c[7379]<<2)>>2]|0,1);ma=l;return}}case 5:if(c[7380]|0){k=r(c[7378]|0,c[7519]|0)|0;Lc(c[(c[7518]|0)+(k+(c[(c[7401]|0)+(c[e>>2]<<2)>>2]|0)<<2)>>2]|0,0);ma=l;return}else{Hb();ma=l;return}case 6:{if(!(c[7380]|0)){Hb();ma=l;return}k=r(c[7378]|0,c[7407]|0)|0;c[7520]=k+(c[(c[7401]|0)+(c[e>>2]<<2)>>2]|0);c[7403]=0;while(1){k=r(c[7520]|0,(c[7410]|0)+1|0)|0;if((d[(c[7409]|0)+(k+(c[7403]|0))>>0]|0|0)==127)break;k=r(c[7520]|0,(c[7410]|0)+1|0)|0;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7409]|0)+(k+(c[7403]|0))>>0]|0;c[7403]=(c[7403]|0)+1}c[7483]=c[7403];Sc();ma=l;return}case 7:{Lc(c[(c[7401]|0)+(c[e>>2]<<2)>>2]|0,0);ma=l;return}case 8:{c[7522]=c[(c[7401]|0)+(c[e>>2]<<2)>>2];if((c[(c[7523]|0)+(c[7522]<<2)>>2]|0)>0){Lc(c[(c[7523]|0)+(c[7522]<<2)>>2]|0,1);ma=l;return}while(1){if(((c[7389]|0)+(c[(c[7526]|0)+(c[7522]<<2)>>2]|0)|0)<=(c[7352]|0))break;Ja()}c[7524]=0;while(1){if((c[7524]|0)>=(c[(c[7526]|0)+(c[7522]<<2)>>2]|0))break;k=r(c[7522]|0,(c[7457]|0)+1|0)|0;a[(c[7351]|0)+(c[7389]|0)>>0]=a[(c[7525]|0)+(k+(c[7524]|0))>>0]|0;c[7389]=(c[7389]|0)+1;c[7524]=(c[7524]|0)+1}Lc(Ub()|0,1);ma=l;return}default:{ib();ma=l;return}}while(0)}function xd(){var b=0;yd();c[7357]=yg(($h(_d(c[762]|0)|0)|0)+5+1|0)|0;b=(c[7357]|0)+1|0;fi(b,_d(c[762]|0)|0)|0;c[7356]=$h((c[7357]|0)+1|0)|0;if((((c[7356]|0)+((c[(c[7350]|0)+((c[7411]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7411]<<2)>>2]|0))|0)<=2147483647?((c[7356]|0)+((c[(c[7350]|0)+((c[7413]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7413]<<2)>>2]|0))|0)<=2147483647:0)?((c[7356]|0)+((c[(c[7350]|0)+((c[7412]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7412]<<2)>>2]|0))|0)<=2147483647:0){c[7358]=c[7356];if((c[7358]|0)>=4?!(Ph((c[7357]|0)+1+(c[7358]|0)+-4|0,12072)|0):0)c[7356]=(c[7356]|0)-4;else Tb(c[7411]|0);c[7359]=0;if(Ee((c[7357]|0)+1|0)|0?de(21024+(c[7359]<<2)|0,-1,8071)|0:0){c[7358]=c[7356];Tb(c[7413]|0);if(Fe((c[7357]|0)+1|0)|0?ee(29348,10076)|0:0){c[7358]=c[7356];Tb(c[7412]|0);if(Fe((c[7357]|0)+1|0)|0?ee(29532,10076)|0:0){c[7358]=c[7356];Tb(c[7411]|0);c[7355]=1;while(1){if((c[7355]|0)>(c[7358]|0))break;a[(c[7341]|0)+(c[7355]|0)>>0]=a[18144+(d[(c[7357]|0)+(c[7355]|0)>>0]|0)>>0]|0;c[7355]=(c[7355]|0)+1}Zb(c[7341]|0,1,c[7356]|0,0,1)|0;b=c[7373]|0;b=c[b+((Zb(c[7341]|0,1,c[7358]|0,3,1)|0)<<2)>>2]|0;c[19072+(c[7359]<<2)>>2]=b;if(c[7393]|0){Pi(8074,c[7337]|0)|0;Pi(8074,c[7338]|0)|0;Ea();ha(18656,1)}else{c[19168+(c[7359]<<2)>>2]=0;return}}Pa();ie(1)}Pa();ie(1)}Pa();ie(1)}Oa();ie(1)}function yd(){var a=0,b=0,d=0,e=0,f=0,g=0;f=ma;ma=ma+112|0;e=f+80|0;a=f;b=f+96|0;d=f+92|0;g=f+88|0;c[7541]=1;c[7560]=2;c[g>>2]=0;c[a>>2]=8109;c[a+4>>2]=0;c[a+8>>2]=30164;c[a+12>>2]=0;c[g>>2]=(c[g>>2]|0)+1;c[a+(c[g>>2]<<4)>>2]=8115;c[a+(c[g>>2]<<4)+4>>2]=1;c[a+(c[g>>2]<<4)+8>>2]=0;c[a+(c[g>>2]<<4)+12>>2]=0;c[g>>2]=(c[g>>2]|0)+1;c[a+(c[g>>2]<<4)>>2]=8129;c[a+(c[g>>2]<<4)+4>>2]=0;c[a+(c[g>>2]<<4)+8>>2]=0;c[a+(c[g>>2]<<4)+12>>2]=0;c[g>>2]=(c[g>>2]|0)+1;c[a+(c[g>>2]<<4)>>2]=8134;c[a+(c[g>>2]<<4)+4>>2]=0;c[a+(c[g>>2]<<4)+8>>2]=0;c[a+(c[g>>2]<<4)+12>>2]=0;c[g>>2]=(c[g>>2]|0)+1;c[a+(c[g>>2]<<4)>>2]=0;c[a+(c[g>>2]<<4)+4>>2]=0;c[a+(c[g>>2]<<4)+8>>2]=0;c[a+(c[g>>2]<<4)+12>>2]=0;do{c[b>>2]=rj(c[7568]|0,c[7569]|0,35056,a,d)|0;do if((c[b>>2]|0)!=-1){if((c[b>>2]|0)==63){je(8142);break}if(!(Ph(c[a+(c[d>>2]<<4)>>2]|0,8115)|0)){c[7560]=lj(c[8757]|0)|0;break}if(!(Ph(c[a+(c[d>>2]<<4)>>2]|0,8129)|0)){ke(16,0);break}if(!(Ph(c[a+(c[d>>2]<<4)>>2]|0,8134)|0))ge(8149,8179,0,0)}while(0)}while((c[b>>2]|0)==-1^1);if(((c[762]|0)+1|0)==(c[7568]|0)){ma=f;return}g=c[665]|0;c[e>>2]=8142;c[e+4>>2]=8200;Ki(g,8194,e)|0;je(8142);ma=f;return}function zd(){var a=0,b=0,e=0,f=0,g=0,h=0,i=0;f=ma;ma=ma+48|0;b=f+32|0;e=f+16|0;a=f;if(c[7538]|0){Ta(0);Sa();ma=f;return}c[7538]=1;while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){a=20;break}c[7354]=(c[7354]|0)+1;if(!(kc(125,44)|0)){a=6;break}if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)==1){a=8;break}if((c[7347]|0)>((c[7354]|0)+1|0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125:0){a=11;break}if((c[7361]|0)==(c[7539]|0)){g=c[7337]|0;i=(c[7539]|0)+20|0;h=c[7539]|0;c[a>>2]=8234;c[a+4>>2]=4;c[a+8>>2]=i;c[a+12>>2]=h;Ki(g,3883,a)|0;c[7360]=Bg(c[7360]|0,(c[7539]|0)+20+1<<2)|0;g=c[7337]|0;h=(c[7539]|0)+20|0;i=c[7539]|0;c[e>>2]=8243;c[e+4>>2]=4;c[e+8>>2]=h;c[e+12>>2]=i;Ki(g,3883,e)|0;c[7466]=Bg(c[7466]|0,(c[7539]|0)+20+1<<2)|0;g=c[7337]|0;i=(c[7539]|0)+20|0;h=c[7539]|0;c[b>>2]=8252;c[b+4>>2]=4;c[b+8>>2]=i;c[b+12>>2]=h;Ki(g,3883,b)|0;c[7475]=Bg(c[7475]|0,(c[7539]|0)+20+1<<2)|0;c[7539]=(c[7539]|0)+20}i=c[7373]|0;i=c[i+((Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,6,1)|0)<<2)>>2]|0;c[(c[7360]|0)+(c[7361]<<2)>>2]=i;if(c[7393]|0){a=15;break}Sb(c[(c[7360]|0)+(c[7361]<<2)>>2]|0);if(!(Ee((c[7357]|0)+1|0)|0)){a=18;break}if(!(de((c[7466]|0)+(c[7361]<<2)|0,6,8071)|0)){a=18;break}c[7361]=(c[7361]|0)+1}if((a|0)==6){Ua();Sa();ma=f;return}else if((a|0)==8){Wa();Sa();ma=f;return}else if((a|0)==11){Va();Sa();ma=f;return}else if((a|0)==15){Pi(8263,c[7337]|0)|0;Pi(8263,c[7338]|0)|0;Ya();Sa();ma=f;return}else if((a|0)==18){Pi(8307,c[7337]|0)|0;Pi(8307,c[7338]|0)|0;Ya();Sa();ma=f;return}else if((a|0)==20){ma=f;return}}function Ad(){var a=0;if(c[7540]|0){Ta(1);Sa();return}c[7540]=1;c[7354]=(c[7354]|0)+1;if(!(ic(125)|0)){Ua();Sa();return}if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)==1){Wa();Sa();return}if((c[7347]|0)>((c[7354]|0)+1|0)){Va();Sa();return}a=c[7373]|0;c[7363]=c[a+((Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,5,1)|0)<<2)>>2];if(c[7393]|0){Pi(8338,c[7337]|0)|0;Pi(8338,c[7338]|0)|0;Ea();ha(18656,1)}Sb(c[7363]|0);if(Ee((c[7357]|0)+1|0)|0?de(29484,7,8071)|0:0){a=(c[7541]|0)!=0;Pi(8397,c[7337]|0)|0;if(a){Pi(8397,c[7338]|0)|0;_a();return}else{$a();return}}Pi(8369,c[7337]|0)|0;Pi(8369,c[7338]|0)|0;_a();c[7363]=0;Sa();return}function Bd(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;h=j+8|0;g=j;c[7542]=1;a:while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){i=25;break}c[7354]=(c[7354]|0)+1;if(!(kc(125,44)|0)){i=4;break}if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)==1){i=6;break}if((c[7347]|0)>((c[7354]|0)+1|0)?(d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125:0){i=9;break}if(((c[7354]|0)-(c[7353]|0)|0)==1?(d[(c[7341]|0)+(c[7353]|0)>>0]|0|0)==42:0){if(c[7478]|0){i=13;break}c[7478]=1;c[7543]=c[7378]}else i=15;do if((i|0)==15){i=0;c[7404]=c[7353];while(1){if((c[7404]|0)>=(c[7354]|0))break;a[(c[7343]|0)+(c[7404]|0)>>0]=a[(c[7341]|0)+(c[7404]|0)>>0]|0;c[7404]=(c[7404]|0)+1}Xb(c[7343]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7402]=Zb(c[7343]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,10,1)|0;b=c[7341]|0;e=c[7353]|0;f=(c[7354]|0)-(c[7353]|0)|0;if(c[7393]|0){Zb(b,e,f,9,0)|0;if(c[7393]|0)break;else{i=20;break a}}c[7400]=Zb(b,e,f,9,1)|0;if(c[7393]|0)ab();bb(c[7378]|0);c[(c[7366]|0)+(c[7378]<<2)>>2]=c[(c[7373]|0)+(c[7400]<<2)>>2];c[(c[7401]|0)+(c[7400]<<2)>>2]=c[7378];c[(c[7401]|0)+(c[7402]<<2)>>2]=c[7400];c[7378]=(c[7378]|0)+1}while(0)}if((i|0)==4){Ua();Sa();ma=j;return}else if((i|0)==6){Wa();Sa();ma=j;return}else if((i|0)==9){Va();Sa();ma=j;return}else if((i|0)==13){i=c[7337]|0;c[g>>2]=8414;Ki(i,10634,g)|0;i=c[7338]|0;c[h>>2]=8414;Ki(i,10634,h)|0;Sa();ma=j;return}else if((i|0)==20){Pi(8453,c[7337]|0)|0;Pi(8453,c[7338]|0)|0;La();Pi(8492,c[7337]|0)|0;Pi(8492,c[7338]|0)|0;Ia(c[(c[7366]|0)+(c[(c[7401]|0)+(c[(c[7401]|0)+(c[7402]<<2)>>2]<<2)>>2]<<2)>>2]|0);za();Sa();ma=j;return}else if((i|0)==25){ma=j;return}}function Cd(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0;i=ma;ma=ma+48|0;f=i+32|0;h=i+16|0;g=i+8|0;e=i;b=i+44|0;c[7354]=(c[7354]|0)+1;if(!(ic(125)|0)){Ua();Sa();ma=i;return}if((d[18400+(d[(c[7341]|0)+(c[7354]|0)>>0]|0)>>0]|0|0)==1){Wa();Sa();ma=i;return}if((c[7347]|0)>((c[7354]|0)+1|0)){Va();Sa();ma=i;return}c[7359]=(c[7359]|0)+1;if((c[7359]|0)==20){La();Pi(8498,c[7337]|0)|0;Pi(8498,c[7338]|0)|0;Da();j=c[7337]|0;c[e>>2]=8501;c[e+4>>2]=20;Ki(j,5771,e)|0;e=c[7338]|0;c[g>>2]=8501;c[g+4>>2]=20;Ki(e,5771,g)|0;ha(18656,1)}c[b>>2]=1;if(!(((c[7354]|0)-(c[7353]|0)|0)>=((c[(c[7350]|0)+((c[7411]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7411]<<2)>>2]|0)|0)?(Vb(c[7411]|0,c[7341]|0,(c[7354]|0)-((c[(c[7350]|0)+((c[7411]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7411]<<2)>>2]|0))|0,(c[(c[7350]|0)+((c[7411]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[7411]<<2)>>2]|0)|0)|0)!=0:0))c[b>>2]=0;if(!(c[b>>2]|0)){La();Pi(8523,c[7337]|0)|0;Pi(8523,c[7338]|0)|0;c[7359]=(c[7359]|0)-1;Sa();ma=i;return}j=c[7373]|0;j=c[j+((Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,3,1)|0)<<2)>>2]|0;c[19072+(c[7359]<<2)>>2]=j;if(c[7393]|0){Pi(8546,c[7337]|0)|0;Pi(8546,c[7338]|0)|0;Qa();c[7359]=(c[7359]|0)-1;Sa();ma=i;return}Sb(c[19072+(c[7359]<<2)>>2]|0);c[7355]=(c[7358]|0)+1;a[(c[7357]|0)+(c[7355]|0)>>0]=0;if(Ee((c[7357]|0)+1|0)|0?de(21024+(c[7359]<<2)|0,-1,8071)|0:0){j=c[7337]|0;g=c[7359]|0;c[h>>2]=8604;c[h+4>>2]=g;c[h+8>>2]=8613;Ki(j,4166,h)|0;j=c[7338]|0;h=c[7359]|0;c[f>>2]=8604;c[f+4>>2]=h;c[f+8>>2]=8613;Ki(j,4166,f)|0;Qa();c[19168+(c[7359]<<2)>>2]=0;ma=i;return}Pi(8572,c[7337]|0)|0;Pi(8572,c[7338]|0)|0;Qa();c[7359]=(c[7359]|0)-1;Sa();ma=i;return}function Dd(){fe(c[21024+(c[7359]<<2)>>2]|0);if(!(c[7359]|0)){c[7336]=1;return}else{c[7359]=(c[7359]|0)-1;return}}function Ed(){var a=0;c[7354]=0;if(!(hc(123)|0))return;a=c[7401]|0;c[7471]=c[a+((Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,2,0)|0)<<2)>>2];if(!(c[7393]|0))return;switch(c[7471]|0){case 0:{zd();return}case 1:{Ad();return}case 2:{Bd();return}case 3:{Cd();return}default:{Pi(8631,c[7337]|0)|0;Pi(8631,c[7338]|0)|0;Ea();ha(18656,1)}}}function Fd(){c[7385]=c[7378];c[7544]=c[7361];if(c[7542]|0){if(!((c[7385]|0)!=0|(c[7478]|0)!=0)){cb();Pi(8681,c[7337]|0)|0;Pi(8681,c[7338]|0)|0;db()}}else{cb();Pi(8662,c[7337]|0)|0;Pi(8662,c[7338]|0)|0;db()}if(c[7538]|0){if(!(c[7544]|0)){cb();Pi(8708,c[7337]|0)|0;Pi(8708,c[7338]|0)|0;db()}}else{cb();Pi(8691,c[7337]|0)|0;Pi(8691,c[7338]|0)|0;db()}if(!(c[7540]|0)){cb();Pi(8723,c[7337]|0)|0;Pi(8723,c[7338]|0)|0;db();return}if(c[7363]|0)return;cb();Pi(8741,c[7337]|0)|0;Pi(8741,c[7338]|0)|0;db();return}function Gd(){var b=0;if(c[7545]|0){Pi(8752,c[7337]|0)|0;Pi(8752,c[7338]|0)|0;fb();return}c[7545]=1;if(!(rc()|0)){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){b=19;break}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){b=13;break}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,1)|0;if(c[7393]|0){b=15;break}a[(c[7372]|0)+(c[7460]|0)>>0]=4;c[(c[7401]|0)+(c[7460]<<2)>>2]=c[7399];c[7399]=(c[7399]|0)+1;if(!(rc()|0)){b=17;break}}if((b|0)==13){lb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}else if((b|0)==15){ob(c[7460]|0);return}else if((b|0)==17){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}else if((b|0)==19){c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}if((c[7399]|0)==(c[7456]|0)){Pi(8783,c[7337]|0)|0;Pi(8783,c[7338]|0)|0;gb()}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){b=37;break}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){b=31;break}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,1)|0;if(c[7393]|0){b=33;break}a[(c[7372]|0)+(c[7460]|0)>>0]=5;c[(c[7401]|0)+(c[7460]<<2)>>2]=c[7519];c[7519]=(c[7519]|0)+1;if(!(rc()|0)){b=35;break}}if((b|0)==31){lb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}else if((b|0)==33){ob(c[7460]|0);return}else if((b|0)==35){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}else if((b|0)==37){c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){b=53;break}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){b=47;break}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,1)|0;if(c[7393]|0){b=49;break}a[(c[7372]|0)+(c[7460]|0)>>0]=6;c[(c[7401]|0)+(c[7460]<<2)>>2]=c[7407];c[7407]=(c[7407]|0)+1;if(!(rc()|0)){b=51;break}}if((b|0)==47){lb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}else if((b|0)==49){ob(c[7460]|0);return}else if((b|0)==51){hb();Pi(4812,c[7337]|0)|0;Pi(4812,c[7338]|0)|0;fb();return}else if((b|0)==53){c[7354]=(c[7354]|0)+1;return}}}}function Hd(){var a=0,b=0;b=ma;ma=ma+16|0;a=b;c[a>>2]=1;Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,0)|0;if(!(c[7393]|0)){La();Pi(6945,c[7337]|0)|0;Pi(6945,c[7338]|0)|0;fb();a=c[a>>2]|0;ma=b;return a|0}if(d[(c[7372]|0)+(c[7460]|0)>>0]|0|0?(d[(c[7372]|0)+(c[7460]|0)>>0]|0|0)!=1:0){La();Pi(8817,c[7337]|0)|0;Pi(8817,c[7338]|0)|0;jb(c[7460]|0);fb();a=c[a>>2]|0;ma=b;return a|0}c[a>>2]=0;a=c[a>>2]|0;ma=b;return a|0}function Id(){if(!(c[7546]|0)){Pi(8841,c[7337]|0)|0;Pi(8841,c[7338]|0)|0;fb();return}if(!(rc()|0)){hb();Pi(8886,c[7337]|0)|0;Pi(8886,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(8886,c[7337]|0)|0;Pi(8886,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8886,c[7337]|0)|0;Pi(8886,c[7338]|0)|0;fb();return}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){lb();Pi(8886,c[7337]|0)|0;Pi(8886,c[7338]|0)|0;fb();return}if(Hd()|0)return;if(!(rc()|0)){hb();Pi(8886,c[7337]|0)|0;Pi(8886,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125){nb();Pi(8886,c[7337]|0)|0;Pi(8886,c[7338]|0)|0;fb();return}else{c[7354]=(c[7354]|0)+1;Qc();c[7380]=0;wd(c[7460]|0);Rc();return}}function Jd(){if(!(rc()|0)){hb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){lb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7461]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,1)|0;if(c[7393]|0){ob(c[7461]|0);return}a[(c[7372]|0)+(c[7461]|0)>>0]=1;if((c[(c[7373]|0)+(c[7461]<<2)>>2]|0)==(c[7452]|0))c[7453]=c[7461];if(!(rc()|0)){hb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125){nb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(6994,c[7337]|0)|0;Pi(6994,c[7338]|0)|0;fb();return}else{c[7354]=(c[7354]|0)+1;wc(c[7461]|0);return}}function Kd(){var b=0;if(!(rc()|0)){hb();Pi(8894,c[7337]|0)|0;Pi(8894,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(8894,c[7337]|0)|0;Pi(8894,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8894,c[7337]|0)|0;Pi(8894,c[7338]|0)|0;fb();return}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==125){b=17;break}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){b=11;break}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7460]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,1)|0;if(c[7393]|0){b=13;break}a[(c[7372]|0)+(c[7460]|0)>>0]=7;c[(c[7401]|0)+(c[7460]<<2)>>2]=0;if(!(rc()|0)){b=15;break}}if((b|0)==11){lb();Pi(8894,c[7337]|0)|0;Pi(8894,c[7338]|0)|0;fb();return}else if((b|0)==13){ob(c[7460]|0);return}else if((b|0)==15){hb();Pi(8894,c[7337]|0)|0;Pi(8894,c[7338]|0)|0;fb();return}else if((b|0)==17){c[7354]=(c[7354]|0)+1;return}}function Ld(){if(!(c[7546]|0)){Pi(8903,c[7337]|0)|0;Pi(8903,c[7338]|0)|0;fb();return}if(!(rc()|0)){hb();Pi(8948,c[7337]|0)|0;Pi(8948,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(8948,c[7337]|0)|0;Pi(8948,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8948,c[7337]|0)|0;Pi(8948,c[7338]|0)|0;fb();return}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){lb();Pi(8948,c[7337]|0)|0;Pi(8948,c[7338]|0)|0;fb();return}if(Hd()|0)return;if(!(rc()|0)){hb();Pi(8948,c[7337]|0)|0;Pi(8948,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125){nb();Pi(8948,c[7337]|0)|0;Pi(8948,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;Qc();c[7380]=1;c[7547]=0;while(1){if((c[7547]|0)>=(c[7385]|0))break;c[7378]=c[(c[7369]|0)+(c[7547]<<2)>>2];wd(c[7460]|0);Rc();c[7547]=(c[7547]|0)+1}return}function Md(){var b=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+64|0;e=h+48|0;g=h+32|0;f=h+16|0;b=h;if(c[7546]|0){Pi(8956,c[7337]|0)|0;Pi(8956,c[7338]|0)|0;fb();ma=h;return}if(!(rc()|0)){hb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){lb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7469]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,13,1)|0;if(c[7393]|0){La();Pi(9004,c[7337]|0)|0;Pi(9004,c[7338]|0)|0;fb();ma=h;return}c[(c[7401]|0)+(c[7469]<<2)>>2]=c[(c[7373]|0)+(c[7469]<<2)>>2];if(!(rc()|0)){hb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125){nb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=34){g=c[7337]|0;e=d[18850]|0;c[b>>2]=9035;c[b+4>>2]=e;c[b+8>>2]=9063;Ki(g,7053,b)|0;g=c[7338]|0;e=d[18850]|0;c[f>>2]=9035;c[f+4>>2]=e;c[f+8>>2]=9063;Ki(g,7053,f)|0;fb();ma=h;return}c[7354]=(c[7354]|0)+1;if(!(hc(34)|0)){f=c[7337]|0;b=d[18850]|0;c[g>>2]=9074;c[g+4>>2]=b;c[g+8>>2]=9087;Ki(f,7053,g)|0;g=c[7338]|0;f=d[18850]|0;c[e>>2]=9074;c[e+4>>2]=f;c[e+8>>2]=9087;Ki(g,7053,e)|0;fb();ma=h;return}c[7548]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,0,1)|0;a[(c[7372]|0)+(c[7548]|0)>>0]=3;c[(c[7401]|0)+(c[7469]<<2)>>2]=c[(c[7373]|0)+(c[7548]<<2)>>2];c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125){nb();Pi(8998,c[7337]|0)|0;Pi(8998,c[7338]|0)|0;fb();ma=h;return}else{c[7354]=(c[7354]|0)+1;ma=h;return}}function Nd(){var b=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;p=ma;ma=ma+160|0;o=p+152|0;n=p+144|0;k=p+128|0;j=p+112|0;i=p+96|0;g=p+80|0;f=p+64|0;e=p+48|0;l=p+32|0;h=p+16|0;b=p;c[7375]=0;while(1){if(!((hc(64)|0)!=0^1))break;if(!(Ga(c[(c[7466]|0)+(c[7361]<<2)>>2]|0)|0)){m=131;break}c[7374]=(c[7374]|0)+1;c[7354]=0}if((m|0)==131){ma=p;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=64){q=c[7337]|0;r=d[18880]|0;c[b>>2]=9113;c[b+4>>2]=r;c[b+8>>2]=9118;Ki(q,7053,b)|0;b=c[7338]|0;q=d[18880]|0;c[h>>2]=9113;c[h+4>>2]=q;c[h+8>>2]=9118;Ki(b,7053,h)|0;Ea();ha(18656,1)}c[7354]=(c[7354]|0)+1;if(!(xc()|0)){tb();ma=p;return}nc(123,40,40);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){zb();Pi(9132,c[7337]|0)|0;Pi(9132,c[7338]|0)|0;qb();ma=p;return}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);r=c[7401]|0;c[7471]=c[r+((Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,12,0)|0)<<2)>>2];a:do if(c[7393]|0){c[7375]=1;switch(c[7471]|0){case 1:{if((c[7454]|0)==(c[7539]|0)){r=c[7337]|0;o=(c[7539]|0)+20|0;q=c[7539]|0;c[l>>2]=8234;c[l+4>>2]=4;c[l+8>>2]=o;c[l+12>>2]=q;Ki(r,3883,l)|0;c[7360]=Bg(c[7360]|0,(c[7539]|0)+20+1<<2)|0;r=c[7337]|0;q=(c[7539]|0)+20|0;o=c[7539]|0;c[e>>2]=8243;c[e+4>>2]=4;c[e+8>>2]=q;c[e+12>>2]=o;Ki(r,3883,e)|0;c[7466]=Bg(c[7466]|0,(c[7539]|0)+20+1<<2)|0;r=c[7337]|0;o=(c[7539]|0)+20|0;q=c[7539]|0;c[f>>2]=8252;c[f+4>>2]=4;c[f+8>>2]=o;c[f+12>>2]=q;Ki(r,3883,f)|0;c[7475]=Bg(c[7475]|0,(c[7539]|0)+20+1<<2)|0;c[7539]=(c[7539]|0)+20}if(!(xc()|0)){tb();ma=p;return}do if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==123)a[35051]=125;else{if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==40){a[35051]=41;break}ub(123,40);ma=p;return}while(0);c[7354]=(c[7354]|0)+1;if(!(xc()|0)){tb();ma=p;return}c[7468]=1;if(!(Bc()|0)){ma=p;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[35051]|0|0)){r=c[7337]|0;q=d[18816+(d[35051]|0)>>0]|0;c[g>>2]=9146;c[g+4>>2]=q;c[g+8>>2]=9156;Ki(r,7053,g)|0;r=c[7338]|0;q=d[18816+(d[35051]|0)>>0]|0;c[i>>2]=9146;c[i+4>>2]=q;c[i+8>>2]=9156;Ki(r,7053,i)|0;qb();ma=p;return}else{c[7354]=(c[7354]|0)+1;ma=p;return}}case 2:{if(!(xc()|0)){tb();ma=p;return}do if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==123)a[35051]=125;else{if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==40){a[35051]=41;break}ub(123,40);ma=p;return}while(0);c[7354]=(c[7354]|0)+1;if(!(xc()|0)){tb();ma=p;return}nc(61,61,61);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){zb();Pi(9178,c[7337]|0)|0;Pi(9178,c[7338]|0)|0;qb();ma=p;return}Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7472]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,13,1)|0;c[(c[7401]|0)+(c[7472]<<2)>>2]=c[(c[7373]|0)+(c[7472]<<2)>>2];if(!(xc()|0)){tb();ma=p;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=61){vb();ma=p;return}c[7354]=(c[7354]|0)+1;if(!(xc()|0)){tb();ma=p;return}c[7468]=1;if(!(Bc()|0)){ma=p;return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=(d[35051]|0|0)){r=c[7337]|0;q=d[18816+(d[35051]|0)>>0]|0;c[j>>2]=9146;c[j+4>>2]=q;c[j+8>>2]=9192;Ki(r,7053,j)|0;r=c[7338]|0;q=d[18816+(d[35051]|0)>>0]|0;c[k>>2]=9146;c[k+4>>2]=q;c[k+8>>2]=9192;Ki(r,7053,k)|0;qb();ma=p;return}else{c[7354]=(c[7354]|0)+1;ma=p;return}}case 0:{ma=p;return}default:{Ab();break a}}}else{c[7549]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,0)|0;if(c[7393]|0?(d[(c[7372]|0)+(c[7549]|0)>>0]|0|0)==1:0){c[7550]=1;break}c[7550]=0}while(0);if(!(xc()|0)){tb();ma=p;return}do if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==123)a[35051]=125;else{if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==40){a[35051]=41;break}ub(123,40);ma=p;return}while(0);c[7354]=(c[7354]|0)+1;if(!(xc()|0)){tb();ma=p;return}if((d[35051]|0|0)==41)ic(44)|0;else kc(44,125)|0;c[7404]=c[7353];while(1){if((c[7404]|0)>=(c[7354]|0))break;a[(c[7343]|0)+(c[7404]|0)>>0]=a[(c[7341]|0)+(c[7404]|0)>>0]|0;c[7404]=(c[7404]|0)+1}Xb(c[7343]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);b=c[7343]|0;e=c[7353]|0;f=(c[7354]|0)-(c[7353]|0)|0;if(c[7478]|0)c[7402]=Zb(b,e,f,10,1)|0;else c[7402]=Zb(b,e,f,10,0)|0;do if(c[7393]|0){c[7476]=c[(c[7401]|0)+(c[(c[7401]|0)+(c[7402]<<2)>>2]<<2)>>2];if((c[7478]|0?(c[7476]|0)>=(c[7543]|0):0)?(c[7476]|0)<(c[7479]|0):0){if(!(c[(c[7368]|0)+(c[7476]<<2)>>2]|0)){c[7403]=0;c[7404]=c[(c[7350]|0)+(c[(c[7369]|0)+(c[7476]<<2)>>2]<<2)>>2];c[7405]=c[(c[7350]|0)+((c[(c[7369]|0)+(c[7476]<<2)>>2]|0)+1<<2)>>2];while(1){if((c[7404]|0)>=(c[7405]|0))break;a[(c[7343]|0)+(c[7403]|0)>>0]=a[(c[7351]|0)+(c[7404]|0)>>0]|0;c[7403]=(c[7403]|0)+1;c[7404]=(c[7404]|0)+1}Xb(c[7343]|0,0,(c[(c[7350]|0)+((c[(c[7369]|0)+(c[7476]<<2)>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[(c[7369]|0)+(c[7476]<<2)>>2]<<2)>>2]|0)|0);c[7551]=Zb(c[7343]|0,0,(c[(c[7350]|0)+((c[(c[7369]|0)+(c[7476]<<2)>>2]|0)+1<<2)>>2]|0)-(c[(c[7350]|0)+(c[(c[7369]|0)+(c[7476]<<2)>>2]<<2)>>2]|0)|0,10,0)|0;if(!(c[7393]|0))Bb();if((c[7551]|0)==(c[7402]|0))break}}else m=78;if((m|0)==78?(c[(c[7367]|0)+(c[7476]<<2)>>2]|0)==0:0){if(c[7478]|0)break;if((c[7476]|0)<(c[7479]|0))break;c[7400]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,9,1)|0;if(c[7393]|0)break;c[(c[7401]|0)+(c[7402]<<2)>>2]=c[7400];c[(c[7401]|0)+(c[7400]<<2)>>2]=c[7476];c[(c[7366]|0)+(c[7476]<<2)>>2]=c[(c[7373]|0)+(c[7400]<<2)>>2];c[7393]=1;break}b=c[7337]|0;if(!(c[(c[7367]|0)+(c[7476]<<2)>>2]|0)){Pi(9212,b)|0;Pi(9212,c[7338]|0)|0;Ea();ha(18656,1)}Pi(9239,b)|0;Pi(9239,c[7338]|0)|0;qb();ma=p;return}while(0);c[7552]=1;b=(c[7393]|0)!=0;do if(!(c[7478]|0)){if(!b)c[7552]=0}else{if(!b){c[7400]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,9,1)|0;if(c[7393]|0)ab()}else{if((c[7476]|0)<(c[7543]|0))break;c[(c[7368]|0)+(c[7476]<<2)>>2]=1;c[7400]=c[(c[7401]|0)+(c[7402]<<2)>>2]}c[7476]=c[7378];ac(29512)}while(0);do if(c[7552]|0)if(c[7550]|0){c[(c[7367]|0)+(c[7476]<<2)>>2]=c[7549];break}else{c[(c[7367]|0)+(c[7476]<<2)>>2]=c[7536];Pi(9254,c[7337]|0)|0;Pi(9254,c[7338]|0)|0;La();r=c[7337]|0;c[n>>2]=9280;Ki(r,10634,n)|0;r=c[7338]|0;c[o>>2]=9280;Ki(r,10634,o)|0;rb();break}while(0);if(!(xc()|0)){tb();ma=p;return}while(1){if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==(d[35051]|0|0)){m=130;break}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=44){m=111;break}c[7354]=(c[7354]|0)+1;if(!(xc()|0)){m=113;break}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)==(d[35051]|0|0)){m=130;break}nc(61,61,61);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){m=117;break}c[7468]=0;do if(c[7552]|0){Xb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0);c[7477]=Zb(c[7341]|0,c[7353]|0,(c[7354]|0)-(c[7353]|0)|0,11,0)|0;if(!(c[7393]|0))break;if((d[(c[7372]|0)+(c[7477]|0)>>0]|0|0)!=4)break;c[7468]=1}while(0);if(!(xc()|0)){m=123;break}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=61){m=125;break}c[7354]=(c[7354]|0)+1;if(!(xc()|0)){m=127;break}if(!(Bc()|0)){m=131;break}}if((m|0)==111){ub(44,a[35051]|0);ma=p;return}else if((m|0)==113){tb();ma=p;return}else if((m|0)==117){zb();Pi(9307,c[7337]|0)|0;Pi(9307,c[7338]|0)|0;qb();ma=p;return}else if((m|0)==123){tb();ma=p;return}else if((m|0)==125){vb();ma=p;return}else if((m|0)==127){tb();ma=p;return}else if((m|0)==130){c[7354]=(c[7354]|0)+1;ma=p;return}else if((m|0)==131){ma=p;return}}function Od(){var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;h=ma;ma=ma+48|0;d=h+40|0;f=h+32|0;e=h+16|0;b=h;if(c[7546]|0){Pi(9320,c[7337]|0)|0;Pi(9320,c[7338]|0)|0;fb();ma=h;return}c[7546]=1;if(!(c[7545]|0)){Pi(9350,c[7337]|0)|0;Pi(9350,c[7338]|0)|0;fb();ma=h;return}c[7553]=c[7354];c[7554]=c[7347];c[7404]=c[7553];while(1){if((c[7404]|0)>=(c[7554]|0))break;a[(c[7342]|0)+(c[7404]|0)>>0]=a[(c[7341]|0)+(c[7404]|0)>>0]|0;c[7404]=(c[7404]|0)+1}sb(r(c[7399]|0,c[7385]|0)|0);c[7379]=0;while(1){if((c[7379]|0)>=(c[7376]|0))break;c[(c[7377]|0)+(c[7379]<<2)>>2]=0;c[7379]=(c[7379]|0)+1}c[7378]=0;while(1){if((c[7378]|0)>=(c[7365]|0))break;c[(c[7367]|0)+(c[7378]<<2)>>2]=0;c[(c[7369]|0)+(c[7378]<<2)>>2]=0;c[7378]=(c[7378]|0)+1}c[7479]=c[7385];if(c[7478]|0){c[7378]=c[7543];while(1){if((c[7378]|0)>=(c[7479]|0))break;c[(c[7369]|0)+(c[7378]<<2)>>2]=c[(c[7366]|0)+(c[7378]<<2)>>2];c[(c[7368]|0)+(c[7378]<<2)>>2]=0;c[7378]=(c[7378]|0)+1}c[7378]=c[7543]}else{c[7378]=c[7385];c[7543]=0}c[7555]=1;c[7361]=0;while(1){if((c[7361]|0)>=(c[7544]|0))break;i=(c[7541]|0)!=0;j=c[7337]|0;k=(c[7361]|0)+1|0;c[b>>2]=9393;c[b+4>>2]=k;c[b+8>>2]=8498;Ki(j,4166,b)|0;if(i){k=c[7338]|0;j=(c[7361]|0)+1|0;c[e>>2]=9393;c[e+4>>2]=j;c[e+8>>2]=8498;Ki(k,4166,e)|0;Ya()}else Za();c[7374]=0;c[7354]=c[7347];while(1){if(!((Xd(c[(c[7466]|0)+(c[7361]<<2)>>2]|0)|0)!=0^1))break;Nd()}fe(c[(c[7466]|0)+(c[7361]<<2)>>2]|0);c[7361]=(c[7361]|0)+1}c[7556]=1;c[7385]=c[7378];c[7535]=c[7454];k=r((c[7385]|0)-1|0,c[7399]|0)|0;if((k+(c[7455]|0)|0)>=(c[7376]|0)){Pi(7211,c[7337]|0)|0;Pi(7211,c[7338]|0)|0;Ea();ha(18656,1)}c[7378]=0;while(1){if((c[7378]|0)>=(c[7385]|0))break;k=r(c[7378]|0,c[7399]|0)|0;c[7379]=k+(c[7455]|0);a:do if(c[(c[7377]|0)+(c[7379]<<2)>>2]|0?bc(c[(c[7377]|0)+(c[7379]<<2)>>2]|0)|0:0){c[7400]=c[(c[7401]|0)+(c[7402]<<2)>>2];c[(c[7377]|0)+(c[7379]<<2)>>2]=c[(c[7373]|0)+(c[7400]<<2)>>2];c[7557]=c[(c[7401]|0)+(c[7400]<<2)>>2];k=r(c[7378]|0,c[7399]|0)|0;c[7379]=k+(c[7456]|0);c[7558]=(c[7379]|0)-(c[7456]|0)+(c[7399]|0);k=r(c[7557]|0,c[7399]|0)|0;c[7559]=k+(c[7456]|0);while(1){if((c[7379]|0)>=(c[7558]|0))break a;if(!(c[(c[7377]|0)+(c[7379]<<2)>>2]|0))c[(c[7377]|0)+(c[7379]<<2)>>2]=c[(c[7377]|0)+(c[7559]<<2)>>2];c[7379]=(c[7379]|0)+1;c[7559]=(c[7559]|0)+1}}while(0);c[7378]=(c[7378]|0)+1}k=r((c[7385]|0)-1|0,c[7399]|0)|0;if((k+(c[7455]|0)|0)>=(c[7376]|0)){Pi(7211,c[7337]|0)|0;Pi(7211,c[7338]|0)|0;Ea();ha(18656,1)}c[7378]=0;while(1){if((c[7378]|0)>=(c[7385]|0))break;k=r(c[7378]|0,c[7399]|0)|0;c[7379]=k+(c[7455]|0);do if(c[(c[7377]|0)+(c[7379]<<2)>>2]|0){if(!(bc(c[(c[7377]|0)+(c[7379]<<2)>>2]|0)|0)){if(c[7406]|0)ab();Db();c[(c[7377]|0)+(c[7379]<<2)>>2]=0;break}if((c[7400]|0)!=(c[(c[7401]|0)+(c[7402]<<2)>>2]|0))ab();c[7557]=c[(c[7401]|0)+(c[7400]<<2)>>2];if(!(c[(c[7367]|0)+(c[7557]<<2)>>2]|0)){Db();c[(c[7377]|0)+(c[7379]<<2)>>2]=0;break}k=r(c[7557]|0,c[7399]|0)|0;c[7559]=k+(c[7455]|0);if(c[(c[7377]|0)+(c[7559]<<2)>>2]|0){Pi(9409,c[7337]|0)|0;Pi(9409,c[7338]|0)|0;Cb(c[(c[7366]|0)+(c[7557]<<2)>>2]|0);k=c[7337]|0;c[f>>2]=9449;Ki(k,10634,f)|0;k=c[7338]|0;c[d>>2]=9449;Ki(k,10634,d)|0;Aa()}if(((c[7478]|0)==0?(c[7557]|0)>=(c[7479]|0):0)?(c[(c[7369]|0)+(c[7557]<<2)>>2]|0)<(c[7560]|0):0)c[(c[7377]|0)+(c[7379]<<2)>>2]=0}while(0);c[7378]=(c[7378]|0)+1}c[7378]=0;b:while(1){if((c[7378]|0)>=(c[7385]|0))break;do if(!(c[(c[7367]|0)+(c[7378]<<2)>>2]|0))Eb(c[(c[7366]|0)+(c[7378]<<2)>>2]|0);else{if(((c[7478]|0)==0?(c[7378]|0)>=(c[7479]|0):0)?(c[(c[7369]|0)+(c[7378]<<2)>>2]|0)<(c[7560]|0):0)break;c:do if((c[7378]|0)>(c[7561]|0)){k=r((c[7561]|0)+1|0,c[7399]|0)|0;if((k|0)>(c[7376]|0)){g=70;break b}c[(c[7366]|0)+(c[7561]<<2)>>2]=c[(c[7366]|0)+(c[7378]<<2)>>2];c[(c[7367]|0)+(c[7561]<<2)>>2]=c[(c[7367]|0)+(c[7378]<<2)>>2];if(!(bc(c[(c[7366]|0)+(c[7378]<<2)>>2]|0)|0))Bb();if(!(c[7406]|0?(c[7400]|0)==(c[(c[7401]|0)+(c[7402]<<2)>>2]|0):0))ab();c[(c[7401]|0)+(c[7400]<<2)>>2]=c[7561];c[7379]=r(c[7561]|0,c[7399]|0)|0;c[7558]=(c[7379]|0)+(c[7399]|0);c[7404]=r(c[7378]|0,c[7399]|0)|0;while(1){if((c[7379]|0)>=(c[7558]|0))break c;c[(c[7377]|0)+(c[7379]<<2)>>2]=c[(c[7377]|0)+(c[7404]<<2)>>2];c[7379]=(c[7379]|0)+1;c[7404]=(c[7404]|0)+1}}while(0);c[7561]=(c[7561]|0)+1}while(0);c[7378]=(c[7378]|0)+1}if((g|0)==70){Pi(7211,c[7337]|0)|0;Pi(7211,c[7338]|0)|0;Ea();ha(18656,1)}c[7385]=c[7561];d:do if(c[7478]|0){c[7378]=c[7543];while(1){if((c[7378]|0)>=(c[7479]|0))break d;if(!(c[(c[7368]|0)+(c[7378]<<2)>>2]|0))Eb(c[(c[7369]|0)+(c[7378]<<2)>>2]|0);c[7378]=(c[7378]|0)+1}}while(0);c[7518]=yg((r((c[7519]|0)+1|0,(c[7385]|0)+1|0)|0)<<2)|0;c[7562]=0;while(1){if((c[7562]|0)>=(r(c[7519]|0,c[7385]|0)|0))break;c[(c[7518]|0)+(c[7562]<<2)>>2]=0;c[7562]=(c[7562]|0)+1}k=r((c[7407]|0)+1|0,(c[7385]|0)+1|0)|0;c[7409]=yg(r(k,(c[7410]|0)+1|0)|0)|0;c[7520]=0;while(1){if((c[7520]|0)>=(r(c[7407]|0,c[7385]|0)|0))break;a[(c[7409]|0)+((r(c[7520]|0,(c[7410]|0)+1|0)|0)+0)>>0]=127;c[7520]=(c[7520]|0)+1}c[7378]=0;while(1){if((c[7378]|0)>=(c[7385]|0))break;c[(c[7369]|0)+(c[7378]<<2)>>2]=c[7378];c[7378]=(c[7378]|0)+1}c[7354]=c[7553];c[7347]=c[7554];c[7404]=c[7354];while(1){if((c[7404]|0)>=(c[7347]|0))break;a[(c[7341]|0)+(c[7404]|0)>>0]=a[(c[7342]|0)+(c[7404]|0)>>0]|0;c[7404]=(c[7404]|0)+1}ma=h;return}function Pd(){if(!(c[7546]|0)){Pi(9483,c[7337]|0)|0;Pi(9483,c[7338]|0)|0;fb();return}if(!(rc()|0)){hb();Pi(9528,c[7337]|0)|0;Pi(9528,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=123){mb();Pi(9528,c[7337]|0)|0;Pi(9528,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;if(!(rc()|0)){hb();Pi(9528,c[7337]|0)|0;Pi(9528,c[7338]|0)|0;fb();return}nc(125,37,37);if((d[35049]|0|0)!=3?(d[35049]|0|0)!=1:0){lb();Pi(9528,c[7337]|0)|0;Pi(9528,c[7338]|0)|0;fb();return}if(Hd()|0)return;if(!(rc()|0)){hb();Pi(9528,c[7337]|0)|0;Pi(9528,c[7338]|0)|0;fb();return}if((d[(c[7341]|0)+(c[7354]|0)>>0]|0|0)!=125){nb();Pi(9528,c[7337]|0)|0;Pi(9528,c[7338]|0)|0;fb();return}c[7354]=(c[7354]|0)+1;Qc();c[7380]=1;if((c[7385]|0)<=0)return;c[7547]=c[7385];do{c[7547]=(c[7547]|0)-1;c[7378]=c[(c[7369]|0)+(c[7547]<<2)>>2];wd(c[7460]|0);Rc()}while((c[7547]|0)==0^1);return}function Qd(){if(!(c[7546]|0)){Pi(9536,c[7337]|0)|0;Pi(9536,c[7338]|0)|0;fb();return}if((c[7385]|0)<=1)return;ec(0,(c[7385]|0)-1|0);return}
function gg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;i=ma;ma=ma+32|0;d=i+16|0;e=i+12|0;f=i+8|0;g=i+4|0;h=i;c[e>>2]=a;c[f>>2]=b;c[h>>2]=ng(c[e>>2]|0,16342)|0;a:do if(c[h>>2]|0){if(c[h>>2]|0?(Ph(c[h>>2]|0,16351)|0)==0:0){c[d>>2]=1;h=c[d>>2]|0;ma=i;return h|0}if(c[h>>2]|0?(Ph(c[h>>2]|0,16355)|0)==0:0){c[d>>2]=0;h=c[d>>2]|0;ma=i;return h|0}c[g>>2]=yf(c[e>>2]|0,c[h>>2]|0)|0;while(1){if(!(c[g>>2]|0))break a;if((c[g>>2]|0)!=0&(c[f>>2]|0)!=0?(Ph(c[g>>2]|0,c[f>>2]|0)|0)==0:0)break;c[g>>2]=yf(c[e>>2]|0,0)|0}c[d>>2]=1;h=c[d>>2]|0;ma=i;return h|0}while(0);c[d>>2]=0;h=c[d>>2]|0;ma=i;return h|0}function hg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=ma;ma=ma+128|0;m=s+8|0;l=s;p=s+112|0;h=s+108|0;i=s+104|0;j=s+100|0;k=s+32|0;q=s+28|0;r=s+24|0;o=s+20|0;g=s+16|0;c[h>>2]=b;c[i>>2]=e;c[j>>2]=f;c[q>>2]=0;b=k;e=(c[h>>2]|0)+132+((c[i>>2]|0)*68|0)|0;f=b+68|0;do{c[b>>2]=c[e>>2];b=b+4|0;e=e+4|0}while((b|0)<(f|0));if(!(c[k>>2]|0)){oe(c[h>>2]|0,c[i>>2]|0)|0;b=k;e=(c[h>>2]|0)+132+((c[i>>2]|0)*68|0)|0;f=b+68|0;do{c[b>>2]=c[e>>2];b=b+4|0;e=e+4|0}while((b|0)<(f|0))}if(c[k+44>>2]|0?c[k+56>>2]|0:0){c[r>>2]=yg((c[k+48>>2]|0)+2<<2)|0;if((a[c[j>>2]>>0]|0)==45){r=c[665]|0;q=a[c[j>>2]>>0]|0;c[l>>2]=c[j>>2];c[l+4>>2]=q;Ki(r,16360,l)|0;c[p>>2]=0;r=c[p>>2]|0;ma=s;return r|0}c[g>>2]=0;while(1){if(!(a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0))break;if(!((a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)>>>0<128?(Yh(d[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)|0)!=0:0))n=11;if((((((n|0)==11?(n=0,(a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)!=45):0)?(a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)!=43:0)?(a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)!=95:0)?(a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)!=46:0)?(a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0)!=47:0){n=16;break}c[g>>2]=(c[g>>2]|0)+1}if((n|0)==16){r=c[665]|0;q=a[(c[j>>2]|0)+(c[g>>2]|0)>>0]|0;c[m>>2]=c[j>>2];c[m+4>>2]=q;Ki(r,16420,m)|0;c[p>>2]=0;r=c[p>>2]|0;ma=s;return r|0}if((c[i>>2]|0)==0|(c[i>>2]|0)==1|(c[i>>2]|0)==2)ig(c[h>>2]|0);c[o>>2]=0;while(1){if((c[o>>2]|0)>=(c[k+48>>2]|0))break;n=pg(c[h>>2]|0,c[(c[k+52>>2]|0)+(c[o>>2]<<2)>>2]|0)|0;c[(c[r>>2]|0)+(c[o>>2]<<2)>>2]=n;c[o>>2]=(c[o>>2]|0)+1}l=Cg(c[j>>2]|0)|0;m=c[r>>2]|0;n=c[o>>2]|0;c[o>>2]=n+1;c[m+(n<<2)>>2]=l;c[(c[r>>2]|0)+(c[o>>2]<<2)>>2]=0;c[q>>2]=jg(c[h>>2]|0,c[i>>2]|0,c[r>>2]|0)|0;c[o>>2]=0;while(1){b=c[r>>2]|0;if(!(c[(c[r>>2]|0)+(c[o>>2]<<2)>>2]|0))break;Yg(c[b+(c[o>>2]<<2)>>2]|0);c[o>>2]=(c[o>>2]|0)+1}Yg(b)}c[p>>2]=c[q>>2];r=c[p>>2]|0;ma=s;return r|0}function ig(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0;s=ma;ma=ma+192|0;i=s+144|0;h=s+128|0;p=s+112|0;q=s+88|0;g=s+72|0;l=s+188|0;m=s;f=s+184|0;b=s+180|0;d=s+176|0;j=s+172|0;k=s+168|0;n=s+164|0;o=s+160|0;e=s+156|0;c[l>>2]=a;c[b>>2]=fa(16772)|0;c[d>>2]=fa(16785)|0;if(c[b>>2]|0)a=lj(c[b>>2]|0)|0;else a=0;c[j>>2]=a;if(c[d>>2]|0)a=lj(c[d>>2]|0)|0;else a=0;c[k>>2]=a;if(!((c[j>>2]|0)!=0&(c[k>>2]|0)!=0))C(16802,16824,49,16882);Vg(c[l>>2]|0,c[j>>2]|0,c[k>>2]|0,f)|0;if(c[f>>2]|0){c[e>>2]=35056;if((c[f>>2]|0)<0){c[f>>2]=r(c[f>>2]|0,-1)|0;c[e>>2]=16954}p=(c[f>>2]|0)/2|0;q=(c[f>>2]&1)*5|0;c[i>>2]=c[e>>2];c[i+4>>2]=p;c[i+8>>2]=q;wi(m,16956,i)|0;q=c[l>>2]|0;Ag(q,16975,m);ma=s;return}if((c[k>>2]|0)>>>0<=4e3){p=((c[j>>2]|0)>>>0)%((c[k>>2]|0)>>>0)|0;q=c[k>>2]|0;c[g>>2]=((c[j>>2]|0)>>>0)/((c[k>>2]|0)>>>0)|0;c[g+4>>2]=p;c[g+8>>2]=q;wi(m,16898,g)|0;q=c[l>>2]|0;Ag(q,16975,m);ma=s;return}c[n>>2]=((c[k>>2]|0)>>>0)/4e3|0;c[o>>2]=((c[k>>2]|0)>>>0)%4e3|0;if((c[n>>2]|0)>>>0<=1){p=((c[j>>2]|0)>>>0)%((c[k>>2]|0)>>>0)|0;q=c[o>>2]|0;c[h>>2]=((c[j>>2]|0)>>>0)/((c[k>>2]|0)>>>0)|0;c[h+4>>2]=p;c[h+8>>2]=q;wi(m,16938,h)|0;q=c[l>>2]|0;Ag(q,16975,m);ma=s;return}e=((c[j>>2]|0)>>>0)/((c[k>>2]|0)>>>0)|0;b=((c[j>>2]|0)>>>0)%((c[k>>2]|0)>>>0)|0;d=c[n>>2]|0;a=c[k>>2]|0;if((c[o>>2]|0)>>>0>0){n=((a-(c[o>>2]|0)|0)>>>0)/((c[n>>2]|0)>>>0)|0;p=c[o>>2]|0;c[q>>2]=e;c[q+4>>2]=b;c[q+8>>2]=d;c[q+12>>2]=n;c[q+16>>2]=p;wi(m,16907,q)|0;q=c[l>>2]|0;Ag(q,16975,m);ma=s;return}else{q=(a>>>0)/((c[n>>2]|0)>>>0)|0;c[p>>2]=e;c[p+4>>2]=b;c[p+8>>2]=d;c[p+12>>2]=q;wi(m,16924,p)|0;q=c[l>>2]|0;Ag(q,16975,m);ma=s;return}}function jg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;y=ma;ma=ma+1136|0;u=y+1064|0;p=y+1056|0;o=y+1048|0;n=y+1040|0;r=y+1124|0;v=y+1120|0;w=y+1116|0;s=y+1112|0;m=y+1108|0;x=y+1104|0;t=y+1100|0;f=y+1096|0;g=y+1088|0;h=y+1084|0;i=y+1080|0;j=y;k=y+1076|0;l=y+1072|0;c[r>>2]=b;c[v>>2]=d;c[w>>2]=e;c[x>>2]=0;if(!(c[(c[r>>2]|0)+4144>>2]|0)){Ki(c[665]|0,16477,y+1032|0)|0;c[m>>2]=c[w>>2];while(1){b=c[665]|0;if(!(c[c[m>>2]>>2]|0))break;c[n>>2]=c[c[m>>2]>>2];Ki(b,17678,n)|0;c[m>>2]=(c[m>>2]|0)+4}Ti(10,b)|0}o=ji(16496,0,o)|0;c[f>>2]=o;a:do if((o|0)<0){Si(16506);q=16}else{if((gj(g)|0)<0)Si(16544);else{p=ji(16496,1,p)|0;c[h>>2]=p;do if((p|0)<0)Si(16561);else{p=ea()|0;c[i>>2]=p;if((p|0)<0){Si(16599);dj(c[h>>2]|0)|0;break}if(c[i>>2]|0){dj(c[f>>2]|0)|0;dj(c[g+4>>2]|0)|0;dj(c[h>>2]|0)|0;c[t>>2]=Cg(35056)|0;while(1){p=ij(c[g>>2]|0,j,1024)|0;c[k>>2]=p;if(!p)break;if((c[k>>2]|0)==-1){if((c[(fh()|0)>>2]|0)!=4){q=33;break}}else{a[j+(c[k>>2]|0)>>0]=0;c[l>>2]=Le(c[t>>2]|0,j)|0;Yg(c[t>>2]|0);c[t>>2]=c[l>>2]}}if((q|0)==33)Si(16616);dj(c[g>>2]|0)|0;ka(0)|0;break a}dj(c[g>>2]|0)|0;if(c[f>>2]|0){dj(0)|0;fj(c[f>>2]|0)|0;dj(c[f>>2]|0)|0}if((c[g+4>>2]|0)!=1){dj(1)|0;fj(c[g+4>>2]|0)|0;dj(c[g+4>>2]|0)|0}if((c[h>>2]|0)!=2){if(c[(c[r>>2]|0)+4144>>2]|0){dj(2)|0;fj(c[h>>2]|0)|0}dj(c[h>>2]|0)|0}if(!(ca(c[c[w>>2]>>2]|0,c[w>>2]|0)|0))Z(1);Si(c[c[w>>2]>>2]|0);Z(1)}while(0);dj(c[g>>2]|0)|0;dj(c[g+4>>2]|0)|0}dj(c[f>>2]|0)|0;q=16}while(0);if((q|0)==16)c[t>>2]=0;if(c[t>>2]|0){c[s>>2]=$h(c[t>>2]|0)|0;while(1){if(!(c[s>>2]|0))break;if((a[(c[t>>2]|0)+((c[s>>2]|0)-1)>>0]|0)!=10?(a[(c[t>>2]|0)+((c[s>>2]|0)-1)>>0]|0)!=13:0)break;a[(c[t>>2]|0)+((c[s>>2]|0)-1)>>0]=0;c[s>>2]=(c[s>>2]|0)+-1}if(!(c[s>>2]|0))b=0;else b=Xf(c[r>>2]|0,c[t>>2]|0)|0;c[x>>2]=b;if((c[x>>2]|0)==0&(c[s>>2]|0)>>>0>1){Pi(17200,c[665]|0)|0;s=c[665]|0;q=c[t>>2]|0;c[u>>2]=c[c[w>>2]>>2];c[u+4>>2]=q;Ki(s,16633,u)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0}if((c[t>>2]|0)!=(c[x>>2]|0))Yg(c[t>>2]|0)}b=c[r>>2]|0;if(!(c[x>>2]|0)){kg(b,c[v>>2]|0,c[w>>2]|0);x=c[x>>2]|0;ma=y;return x|0}else{Oe(b,c[x>>2]|0);x=c[x>>2]|0;ma=y;return x|0}return 0}function kg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;l=ma;ma=ma+32|0;i=l;j=l+20|0;m=l+16|0;g=l+12|0;k=l+8|0;h=l+4|0;c[j>>2]=b;c[m>>2]=d;c[g>>2]=e;if((c[m>>2]|0)!=0&(c[m>>2]|0)!=1&(c[m>>2]|0)!=2&(c[m>>2]|0)!=3&(c[m>>2]|0)!=33){ma=l;return}if((c[(c[j>>2]|0)+4148>>2]|0)==0?(c[(c[j>>2]|0)+4144>>2]|0)==0:0){c[h>>2]=ng(c[j>>2]|0,16680)|0;do if(c[h>>2]|0?(a[c[h>>2]>>0]|0)!=49:0){if(c[h>>2]|0){if(a[c[h>>2]>>0]|0?(a[c[h>>2]>>0]|0)!=48:0)break;c[h>>2]=0}}else f=6;while(0);if((f|0)==6)c[h>>2]=16693;if(c[h>>2]|0)b=Ye(c[h>>2]|0,16706)|0;else b=0;c[(c[j>>2]|0)+4148>>2]=b;if((c[(c[j>>2]|0)+4148>>2]|0)==0?ng(c[j>>2]|0,16709)|0:0){m=ng(c[j>>2]|0,16709)|0;c[h>>2]=Me(m,17682,c[h>>2]|0)|0;m=Ye(c[h>>2]|0,16706)|0;c[(c[j>>2]|0)+4148>>2]=m}if(c[(c[j>>2]|0)+4148>>2]|0){m=c[665]|0;c[i>>2]=c[h>>2];Ki(m,16721,i)|0}}if(!(c[(c[j>>2]|0)+4148>>2]|0)){ma=l;return}Pi(c[c[g>>2]>>2]|0,c[(c[j>>2]|0)+4148>>2]|0)|0;c[k>>2]=(c[g>>2]|0)+4;while(1){b=c[(c[j>>2]|0)+4148>>2]|0;if(!(c[c[k>>2]>>2]|0))break;Ri(32,b)|0;Pi(c[c[k>>2]>>2]|0,c[(c[j>>2]|0)+4148>>2]|0)|0;c[k>>2]=(c[k>>2]|0)+4}Ri(10,b)|0;ma=l;return}function lg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+32|0;g=l+24|0;h=l+20|0;i=l+16|0;j=l+12|0;k=l+8|0;e=l+4|0;f=l;c[l+28>>2]=b;c[g>>2]=d;if(!(c[g>>2]|0))C(16987,16992,53,17047);if((a[c[g>>2]>>0]|0)==33?(a[(c[g>>2]|0)+1>>0]|0)==33:0){c[g>>2]=(c[g>>2]|0)+2;c[j>>2]=17069}else c[j>>2]=35056;if((a[c[g>>2]>>0]|0)!=126){if(a[c[j>>2]>>0]|0)c[g>>2]=(c[g>>2]|0)+-2;c[h>>2]=c[g>>2];k=c[h>>2]|0;ma=l;return k|0}if(a[(c[g>>2]|0)+1>>0]|0?(a[(c[g>>2]|0)+1>>0]|0)!=47:0){c[k>>2]=2;while(1){if((a[(c[g>>2]|0)+(c[k>>2]|0)>>0]|0)==47)b=0;else b=(a[(c[g>>2]|0)+(c[k>>2]|0)>>0]|0)!=0;d=c[k>>2]|0;if(!b)break;c[k>>2]=d+1}c[f>>2]=yg(d)|0;vi(c[f>>2]|0,(c[g>>2]|0)+1|0,(c[k>>2]|0)-1|0)|0;a[(c[f>>2]|0)+((c[k>>2]|0)-1)>>0]=0;c[e>>2]=ga(c[f>>2]|0)|0;Yg(c[f>>2]|0);if(c[e>>2]|0)b=c[(c[e>>2]|0)+20>>2]|0;else b=18016;c[i>>2]=b}else{c[k>>2]=1;f=fa(17072)|0;c[i>>2]=f;c[i>>2]=c[i>>2]|0?f:18016}if((a[c[i>>2]>>0]|0)==47?(a[(c[i>>2]|0)+1>>0]|0)==47:0)c[i>>2]=(c[i>>2]|0)+1;if(a[(c[g>>2]|0)+(c[k>>2]|0)>>0]|0?(f=c[i>>2]|0,(a[f+(($h(c[i>>2]|0)|0)-1)>>0]|0)==47):0)c[k>>2]=(c[k>>2]|0)+1;c[h>>2]=Me(c[j>>2]|0,c[i>>2]|0,(c[g>>2]|0)+(c[k>>2]|0)|0)|0;k=c[h>>2]|0;ma=l;return k|0}function mg(b){b=b|0;var e=0,f=0,g=0,h=0;g=ma;ma=ma+16|0;h=g+8|0;e=g+4|0;f=g;c[h>>2]=b;c[f>>2]=Cg(c[h>>2]|0)|0;c[e>>2]=c[f>>2];while(1){if(!(a[c[e>>2]>>0]|0))break;if((a[c[e>>2]>>0]|0)>>>0<128?Uh(d[c[e>>2]>>0]|0)|0:0)b=Th(d[c[e>>2]>>0]|0)|0;else b=a[c[e>>2]>>0]|0;a[c[e>>2]>>0]=b;c[e>>2]=(c[e>>2]|0)+1}ma=g;return c[f>>2]|0}function ng(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+32|0;j=k;g=k+24|0;h=k+20|0;e=k+16|0;i=k+12|0;f=k+8|0;c[g>>2]=b;c[h>>2]=d;if(!(c[(c[g>>2]|0)+112>>2]|0))C(17077,17096,36,17154);c[e>>2]=Me(c[h>>2]|0,18016,c[(c[g>>2]|0)+112>>2]|0)|0;c[f>>2]=fa(c[e>>2]|0)|0;Yg(c[e>>2]|0);if(!(c[f>>2]|0?(a[c[f>>2]>>0]|0)!=0:0)){c[e>>2]=Me(c[h>>2]|0,17173,c[(c[g>>2]|0)+112>>2]|0)|0;c[f>>2]=fa(c[e>>2]|0)|0;Yg(c[e>>2]|0)}if(!(c[f>>2]|0?(a[c[f>>2]>>0]|0)!=0:0))c[f>>2]=fa(c[h>>2]|0)|0;if(!(c[f>>2]|0?(a[c[f>>2]>>0]|0)!=0:0))c[f>>2]=Ie(c[g>>2]|0,c[h>>2]|0)|0;if(c[f>>2]|0)b=bf(c[g>>2]|0,c[f>>2]|0)|0;else b=0;c[i>>2]=b;if(!(c[(c[g>>2]|0)+44>>2]&64)){j=c[i>>2]|0;ma=k;return j|0}Pi(17619,c[665]|0)|0;g=c[665]|0;f=c[i>>2]|0?c[i>>2]|0:17175;c[j>>2]=c[h>>2];c[j+4>>2]=f;Ki(g,17181,j)|0;Ai(c[665]|0)|0;j=c[i>>2]|0;ma=k;return j|0}function og(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;a=ng(30292,c[d>>2]|0)|0;ma=b;return a|0}function pg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;p=ma;ma=ma+64|0;n=p+8|0;m=p;f=p+60|0;g=p+56|0;h=p+52|0;i=p+48|0;j=p+36|0;q=p+24|0;k=p+20|0;l=p+16|0;c[f>>2]=b;c[g>>2]=e;Ng(q);c[j>>2]=c[q>>2];c[j+4>>2]=c[q+4>>2];c[j+8>>2]=c[q+8>>2];c[h>>2]=c[g>>2];while(1){if(!(a[c[h>>2]>>0]|0))break;b=c[h>>2]|0;do if((a[c[h>>2]>>0]|0)==36){c[h>>2]=b+1;if(!((a[c[h>>2]>>0]|0)>>>0<128?(Yh(d[c[h>>2]>>0]|0)|0)!=0:0))o=6;if((o|0)==6?(o=0,(a[c[h>>2]>>0]|0)!=95):0){if((a[c[h>>2]>>0]|0)!=123){Pi(17200,c[665]|0)|0;q=c[665]|0;e=a[c[h>>2]>>0]|0;c[n>>2]=c[g>>2];c[n+4>>2]=e;Ki(q,17245,n)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;Sg(j,(c[h>>2]|0)+-1|0,2);break}q=(c[h>>2]|0)+1|0;c[h>>2]=q;c[l>>2]=q;while(1){if(a[c[l>>2]>>0]|0)b=(a[c[l>>2]>>0]|0)==125^1;else b=0;e=c[l>>2]|0;if(!b)break;c[l>>2]=e+1}if(a[e>>0]|0){qg(c[f>>2]|0,j,c[h>>2]|0,(c[l>>2]|0)+-1|0)|0;c[h>>2]=c[l>>2];break}else{Pi(17200,c[665]|0)|0;q=c[665]|0;c[m>>2]=c[g>>2];Ki(q,17210,m)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;c[h>>2]=(c[l>>2]|0)+-1;break}}c[k>>2]=c[h>>2];while(1){c[k>>2]=(c[k>>2]|0)+1;if((a[c[k>>2]>>0]|0)>>>0<128?Yh(d[c[k>>2]>>0]|0)|0:0)continue;if((a[c[k>>2]>>0]|0)!=95)break}c[k>>2]=(c[k>>2]|0)+-1;if(!(qg(c[f>>2]|0,j,c[h>>2]|0,c[k>>2]|0)|0))Sg(j,(c[h>>2]|0)+-1|0,(c[k>>2]|0)-(c[h>>2]|0)+1+1|0);c[h>>2]=c[k>>2]}else Qg(j,a[b>>0]|0);while(0);c[h>>2]=(c[h>>2]|0)+1}Qg(j,0);c[i>>2]=c[j>>2];ma=p;return c[i>>2]|0}function qg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;o=ma;ma=ma+48|0;n=o;j=o+40|0;k=o+36|0;q=o+32|0;r=o+28|0;l=o+24|0;m=o+20|0;p=o+16|0;g=o+12|0;h=o+8|0;i=o+4|0;c[j>>2]=b;c[k>>2]=d;c[q>>2]=e;c[r>>2]=f;c[l>>2]=0;c[p>>2]=(c[r>>2]|0)-(c[q>>2]|0)+1;c[g>>2]=yg((c[p>>2]|0)+1|0)|0;vi(c[g>>2]|0,c[q>>2]|0,c[p>>2]|0)|0;a[(c[g>>2]|0)+(c[p>>2]|0)>>0]=0;if(rg(c[j>>2]|0,c[g>>2]|0)|0){Pi(17200,c[665]|0)|0;r=c[665]|0;c[n>>2]=c[g>>2];Ki(r,17297,n)|0;Pi(17567,c[665]|0)|0;Ai(c[665]|0)|0;r=c[g>>2]|0;Yg(r);r=c[l>>2]|0;ma=o;return r|0}c[h>>2]=Me(c[g>>2]|0,17173,c[(c[j>>2]|0)+112>>2]|0)|0;c[m>>2]=fa(c[h>>2]|0)|0;Yg(c[h>>2]|0);if(!(c[m>>2]|0?(a[c[m>>2]>>0]|0)!=0:0))c[m>>2]=fa(c[g>>2]|0)|0;if(!(c[m>>2]|0?(a[c[m>>2]>>0]|0)!=0:0))c[m>>2]=Ie(c[j>>2]|0,c[g>>2]|0)|0;if(!(c[m>>2]|0)){r=c[g>>2]|0;Yg(r);r=c[l>>2]|0;ma=o;return r|0}c[l>>2]=1;sg(c[j>>2]|0,c[g>>2]|0,1);c[i>>2]=bf(c[j>>2]|0,c[m>>2]|0)|0;sg(c[j>>2]|0,c[g>>2]|0,0);q=c[k>>2]|0;r=c[i>>2]|0;Sg(q,r,$h(c[i>>2]|0)|0);Yg(c[i>>2]|0);r=c[g>>2]|0;Yg(r);r=c[l>>2]|0;ma=o;return r|0}function rg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;e=h+12|0;f=h+8|0;d=h+4|0;g=h;c[f>>2]=a;c[d>>2]=b;c[g>>2]=0;while(1){if((c[g>>2]|0)>>>0>=(c[(c[f>>2]|0)+4156>>2]|0)>>>0){a=7;break}if((c[d>>2]|0?(c[(c[(c[f>>2]|0)+4152>>2]|0)+(c[g>>2]<<3)>>2]|0)!=0:0)?(Ph(c[(c[(c[f>>2]|0)+4152>>2]|0)+(c[g>>2]<<3)>>2]|0,c[d>>2]|0)|0)==0:0){a=5;break}c[g>>2]=(c[g>>2]|0)+1}if((a|0)==5){c[e>>2]=c[(c[(c[f>>2]|0)+4152>>2]|0)+(c[g>>2]<<3)+4>>2];g=c[e>>2]|0;ma=h;return g|0}else if((a|0)==7){c[e>>2]=0;g=c[e>>2]|0;ma=h;return g|0}return 0}function sg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i=ma;ma=ma+16|0;e=i+12|0;f=i+8|0;g=i+4|0;h=i;c[e>>2]=a;c[f>>2]=b;c[g>>2]=d;c[h>>2]=0;while(1){a=c[e>>2]|0;if((c[h>>2]|0)>>>0>=(c[(c[e>>2]|0)+4156>>2]|0)>>>0){b=7;break}if((c[f>>2]|0?(c[(c[a+4152>>2]|0)+(c[h>>2]<<3)>>2]|0)!=0:0)?(Ph(c[(c[(c[e>>2]|0)+4152>>2]|0)+(c[h>>2]<<3)>>2]|0,c[f>>2]|0)|0)==0:0){b=5;break}c[h>>2]=(c[h>>2]|0)+1}if((b|0)==5){c[(c[(c[e>>2]|0)+4152>>2]|0)+(c[h>>2]<<3)+4>>2]=c[g>>2];ma=i;return}else if((b|0)==7){h=a+4156|0;c[h>>2]=(c[h>>2]|0)+1;h=Bg(c[(c[e>>2]|0)+4152>>2]|0,c[(c[e>>2]|0)+4156>>2]<<3)|0;c[(c[e>>2]|0)+4152>>2]=h;h=Cg(c[f>>2]|0)|0;c[(c[(c[e>>2]|0)+4152>>2]|0)+((c[(c[e>>2]|0)+4156>>2]|0)-1<<3)>>2]=h;c[(c[(c[e>>2]|0)+4152>>2]|0)+((c[(c[e>>2]|0)+4156>>2]|0)-1<<3)+4>>2]=c[g>>2];ma=i;return}}function tg(b){b=b|0;var d=0,e=0,f=0,g=0;f=ma;ma=ma+16|0;g=f+8|0;d=f+4|0;e=f;c[g>>2]=b;c[d>>2]=c[g>>2];c[e>>2]=c[d>>2];while(1){if(!(a[c[e>>2]>>0]|0))break;if((a[c[e>>2]>>0]|0)==47)c[d>>2]=(c[e>>2]|0)+1;c[e>>2]=(c[e>>2]|0)+1}ma=f;return c[d>>2]|0}function ug(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+32|0;e=j+16|0;f=j+12|0;g=j+8|0;h=j+4|0;i=j;c[f>>2]=b;c[h>>2]=0;if(!(c[f>>2]|0)){c[e>>2]=0;i=c[e>>2]|0;ma=j;return i|0}c[i>>2]=$h(c[f>>2]|0)|0;while(1){if((c[i>>2]|0)>>>0<=(c[h>>2]|0)>>>0)break;if(!((a[(c[f>>2]|0)+((c[i>>2]|0)-1)>>0]|0)==47^1))break;c[i>>2]=(c[i>>2]|0)+-1}do if((c[i>>2]|0)==(c[h>>2]|0)){if(!(c[h>>2]|0)){c[g>>2]=Cg(18016)|0;break}if((c[h>>2]|0)==2){c[g>>2]=yg(4)|0;a[c[g>>2]>>0]=a[c[f>>2]>>0]|0;a[(c[g>>2]|0)+1>>0]=a[(c[f>>2]|0)+1>>0]|0;a[(c[g>>2]|0)+2>>0]=46;a[(c[g>>2]|0)+3>>0]=0;break}else{c[g>>2]=Cg(c[f>>2]|0)|0;break}}else{while(1){if((c[i>>2]|0)>>>0>((c[h>>2]|0)+1|0)>>>0)d=(a[(c[f>>2]|0)+((c[i>>2]|0)-1)>>0]|0)==47;else d=0;b=c[i>>2]|0;if(!d)break;c[i>>2]=b+-1}c[g>>2]=yg(b+1|0)|0;vi(c[g>>2]|0,c[f>>2]|0,c[i>>2]|0)|0;a[(c[g>>2]|0)+(c[i>>2]|0)>>0]=0}while(0);c[e>>2]=c[g>>2];i=c[e>>2]|0;ma=j;return i|0}function vg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;g=h;d=h+12|0;e=h+8|0;f=h+4|0;c[d>>2]=a;c[e>>2]=b;if(!((c[d>>2]|0)!=0&(c[e>>2]|0)!=0))C(17375,17392,30,17448);c[f>>2]=Ye(c[d>>2]|0,c[e>>2]|0)|0;if(!(c[f>>2]|0)){h=c[665]|0;c[g>>2]=c[7599];Ki(h,17465,g)|0;Si(c[d>>2]|0);da(1)}else{ma=h;return c[f>>2]|0}return 0}function wg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=ma;ma=ma+16|0;f=g;d=g+8|0;e=g+4|0;c[d>>2]=a;c[e>>2]=b;if(!(c[d>>2]|0))C(17455,17392,43,17457);if((Ze(c[d>>2]|0)|0)==-1){g=c[665]|0;c[f>>2]=c[7599];Ki(g,17465,f)|0;Si(c[e>>2]|0);da(1)}else{ma=g;return}}function xg(){var a=0,b=0,d=0;d=ma;ma=ma+4112|0;b=d+4104|0;a=d;if(!(kj(a,4097)|0)){d=c[665]|0;c[b>>2]=c[7599];Ki(d,17465,b)|0;Si(17470);da(1)}else{b=Cg(a)|0;ma=d;return b|0}return 0}function yg(a){a=a|0;var b=0,d=0,e=0,f=0;f=ma;ma=ma+16|0;e=f;b=f+8|0;d=f+4|0;c[b>>2]=a;c[d>>2]=Xg(c[b>>2]|0?c[b>>2]|0:1)|0;if(!(c[d>>2]|0)){f=c[665]|0;c[e>>2]=c[b>>2];Ki(f,17477,e)|0;da(1)}else{ma=f;return c[d>>2]|0}return 0}function zg(a){a=a|0;var b=0,d=0,e=0,f=0;d=ma;ma=ma+16|0;b=d;f=d+8|0;e=d+4|0;c[f>>2]=a;c[e>>2]=cj(c[f>>2]|0)|0;if(c[e>>2]|0){f=c[665]|0;c[b>>2]=c[7599];Ki(f,17544,b)|0;Pi(17526,c[665]|0)|0;Pi(17567,c[665]|0)|0;da(1)}else{ma=d;return}}function Ag(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;o=ma;ma=ma+48|0;j=o+8|0;i=o;m=o+40|0;e=o+36|0;p=o+32|0;n=o+28|0;f=o+24|0;g=o+20|0;h=o+16|0;l=o+12|0;c[m>>2]=a;c[e>>2]=b;c[p>>2]=d;c[f>>2]=0;c[n>>2]=Me(c[e>>2]|0,17542,c[p>>2]|0)|0;c[h>>2]=($h(c[e>>2]|0)|0)+1;c[l>>2]=0;while(1){if((c[l>>2]|0)==(c[(c[m>>2]|0)+4164>>2]|0))break;if(!(ai(c[(c[(c[m>>2]|0)+4160>>2]|0)+(c[l>>2]<<2)>>2]|0,c[n>>2]|0,c[h>>2]|0)|0)){k=4;break}c[l>>2]=(c[l>>2]|0)+1}if((k|0)==4)c[f>>2]=fa(c[e>>2]|0)|0;if(c[f>>2]|0?(Ph(c[f>>2]|0,(c[n>>2]|0)+(c[h>>2]|0)|0)|0)==0:0){Yg(c[n>>2]|0);ma=o;return}if((ia(c[n>>2]|0)|0)<0){p=c[665]|0;c[i>>2]=c[(c[m>>2]|0)+104>>2];Ki(p,17544,i)|0;p=c[665]|0;c[j>>2]=c[n>>2];Ki(p,17556,j)|0;Pi(17567,c[665]|0)|0;da(1)}c[g>>2]=fa(c[e>>2]|0)|0;if((c[g>>2]|0)!=((c[n>>2]|0)+(c[h>>2]|0)|0)){Yg(c[n>>2]|0);ma=o;return}a=c[m>>2]|0;if((c[l>>2]|0)==(c[(c[m>>2]|0)+4164>>2]|0)){p=a+4164|0;c[p>>2]=(c[p>>2]|0)+1;p=Bg(c[(c[m>>2]|0)+4160>>2]|0,c[(c[m>>2]|0)+4164>>2]<<2)|0;c[(c[m>>2]|0)+4160>>2]=p}else Yg(c[(c[a+4160>>2]|0)+(c[l>>2]<<2)>>2]|0);c[(c[(c[m>>2]|0)+4160>>2]|0)+(c[l>>2]<<2)>>2]=c[n>>2];ma=o;return}function Bg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;g=h;d=h+12|0;e=h+8|0;f=h+4|0;c[d>>2]=a;c[e>>2]=b;if(!(c[d>>2]|0)){c[f>>2]=yg(c[e>>2]|0)|0;g=c[f>>2]|0;ma=h;return g|0}c[f>>2]=_g(c[d>>2]|0,c[e>>2]|0?c[e>>2]|0:1)|0;if(!(c[f>>2]|0)){h=c[665]|0;c[g>>2]=c[e>>2];Ki(h,17570,g)|0;da(1)}else{g=c[f>>2]|0;ma=h;return g|0}return 0}function Cg(a){a=a|0;var b=0,d=0,e=0;b=ma;ma=ma+16|0;d=b+4|0;e=b;c[d>>2]=a;c[e>>2]=yg(($h(c[d>>2]|0)|0)+1|0)|0;a=fi(c[e>>2]|0,c[d>>2]|0)|0;ma=b;return a|0}function Dg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+32|0;i=j;e=j+20|0;f=j+16|0;g=j+12|0;h=j+8|0;c[e>>2]=b;c[f>>2]=d;c[g>>2]=0;c[h>>2]=c[g>>2];while(1){b=c[h>>2]|0;if((a[(c[f>>2]|0)+(c[h>>2]|0)>>0]|0)!=47)break;c[h>>2]=b+1}if(b>>>0<=((c[g>>2]|0)+1|0)>>>0){i=c[g>>2]|0;ma=j;return i|0}if(c[(c[e>>2]|0)+44>>2]&1|0){Pi(17619,c[665]|0)|0;e=c[665]|0;d=c[g>>2]|0;c[i>>2]=c[f>>2];c[i+4>>2]=d;Ki(e,17627,i)|0;Ai(c[665]|0)|0}e=(c[f>>2]|0)+(c[g>>2]|0)+1|0;i=(c[f>>2]|0)+(c[h>>2]|0)|0;Ij(e|0,i|0,($h((c[f>>2]|0)+(c[h>>2]|0)|0)|0)+1|0)|0;i=c[g>>2]|0;ma=j;return i|0}function Eg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=ma;ma=ma+48|0;l=m+8|0;k=m;e=m+32|0;f=m+28|0;g=m+24|0;h=m+20|0;i=m+16|0;j=m+12|0;c[f>>2]=b;c[g>>2]=d;if(c[g>>2]|0?a[c[g>>2]>>0]|0:0){c[i>>2]=Dg(c[f>>2]|0,c[g>>2]|0)|0;c[h>>2]=Fg(c[f>>2]|0,c[g>>2]|0)|0;if(c[h>>2]|0){c[e>>2]=c[h>>2];l=c[e>>2]|0;ma=m;return l|0}c[h>>2]=yg(4)|0;c[c[h>>2]>>2]=0;Gg(c[f>>2]|0,c[h>>2]|0,c[g>>2]|0,c[i>>2]|0);Hg(c[f>>2]|0,c[g>>2]|0,c[h>>2]|0);if(c[(c[f>>2]|0)+44>>2]&16|0){Pi(17619,c[665]|0)|0;i=c[665]|0;c[k>>2]=c[g>>2];Ki(i,17659,k)|0;Ai(c[665]|0)|0;a:do if(c[h>>2]|0){c[j>>2]=c[c[h>>2]>>2];while(1){if(!(c[j>>2]|0))break a;k=c[665]|0;c[l>>2]=c[c[j>>2]>>2];Ki(k,17678,l)|0;c[j>>2]=c[(c[j>>2]|0)+8>>2]}}while(0);Ri(10,c[665]|0)|0;Ai(c[665]|0)|0}c[e>>2]=c[h>>2];l=c[e>>2]|0;ma=m;return l|0}c[e>>2]=0;l=c[e>>2]|0;ma=m;return l|0}function Fg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=ma;ma=ma+16|0;e=h+12|0;f=h+8|0;d=h+4|0;g=h;c[f>>2]=a;c[d>>2]=b;c[g>>2]=0;while(1){if((c[g>>2]|0)>>>0>=(c[(c[f>>2]|0)+60>>2]|0)>>>0){a=7;break}if((c[d>>2]|0?(c[(c[(c[f>>2]|0)+56>>2]|0)+(c[g>>2]<<3)>>2]|0)!=0:0)?(Ph(c[(c[(c[f>>2]|0)+56>>2]|0)+(c[g>>2]<<3)>>2]|0,c[d>>2]|0)|0)==0:0){a=5;break}c[g>>2]=(c[g>>2]|0)+1}if((a|0)==5){c[e>>2]=c[(c[(c[f>>2]|0)+56>>2]|0)+(c[g>>2]<<3)+4>>2];g=c[e>>2]|0;ma=h;return g|0}else if((a|0)==7){c[e>>2]=0;g=c[e>>2]|0;ma=h;return g|0}return 0}function Gg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;m=ma;ma=ma+32|0;g=m+20|0;h=m+16|0;i=m+12|0;n=m+8|0;j=m+4|0;k=m;c[g>>2]=b;c[h>>2]=d;c[i>>2]=e;c[n>>2]=f;c[j>>2]=(c[i>>2]|0)+(c[n>>2]|0);while(1){if(!(a[c[j>>2]>>0]|0)){l=10;break}if((a[c[j>>2]>>0]|0)==47?(a[(c[j>>2]|0)+1>>0]|0)==47:0)break;c[j>>2]=(c[j>>2]|0)+1}if((l|0)==10){Jg(c[g>>2]|0,c[h>>2]|0,c[i>>2]|0);ma=m;return}c[k>>2]=(c[j>>2]|0)+1;while(1){if((a[c[k>>2]>>0]|0)!=47)break;c[k>>2]=(c[k>>2]|0)+1}Ig(c[g>>2]|0,c[h>>2]|0,c[i>>2]|0,(c[j>>2]|0)-(c[i>>2]|0)+1|0,c[k>>2]|0);ma=m;return}function Hg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=ma;ma=ma+16|0;f=e+8|0;h=e+4|0;g=e;c[f>>2]=a;c[h>>2]=b;c[g>>2]=d;d=(c[f>>2]|0)+60|0;c[d>>2]=(c[d>>2]|0)+1;d=Bg(c[(c[f>>2]|0)+56>>2]|0,c[(c[f>>2]|0)+60>>2]<<3)|0;c[(c[f>>2]|0)+56>>2]=d;d=Cg(c[h>>2]|0)|0;c[(c[(c[f>>2]|0)+56>>2]|0)+((c[(c[f>>2]|0)+60>>2]|0)-1<<3)>>2]=d;c[(c[(c[f>>2]|0)+56>>2]|0)+((c[(c[f>>2]|0)+60>>2]|0)-1<<3)+4>>2]=c[g>>2];ma=e;return}function Ig(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;r=ma;ma=ma+64|0;m=r+56|0;n=r+52|0;o=r+48|0;p=r+44|0;q=r+40|0;h=r+36|0;i=r+32|0;j=r+20|0;s=r+8|0;k=r+4|0;l=r;c[m>>2]=b;c[n>>2]=d;c[o>>2]=e;c[p>>2]=f;c[q>>2]=g;Og(s,c[o>>2]|0,c[p>>2]|0);c[j>>2]=c[s>>2];c[j+4>>2]=c[s+4>>2];c[j+8>>2]=c[s+8>>2];if((c[p>>2]|0)>>>0<=0)C(17684,17779,133,17837);if((a[(c[o>>2]|0)+((c[p>>2]|0)-1)>>0]|0)!=47)C(17684,17779,133,17837);c[h>>2]=bj(c[j>>2]|0)|0;if(!(c[h>>2]|0)){Pg(j);ma=r;return}if(!(a[c[q>>2]>>0]|0))Kg(c[n>>2]|0,c[j>>2]|0);else{Tg(j,c[q>>2]|0);Gg(c[m>>2]|0,c[n>>2]|0,c[j>>2]|0,c[p>>2]|0);Ug(j,c[p>>2]|0)}while(1){s=aj(c[h>>2]|0)|0;c[i>>2]=s;if(!s)break;if((a[(c[i>>2]|0)+11>>0]|0)!=46){Tg(j,(c[i>>2]|0)+11|0);c[k>>2]=af(c[m>>2]|0,c[j>>2]|0,0)|0;do if((c[k>>2]|0)>=0){c[l>>2]=c[j+8>>2];Tg(j,17682);if(a[c[q>>2]>>0]|0){Tg(j,c[q>>2]|0);Gg(c[m>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0);Ug(j,c[l>>2]|0)}if((c[k>>2]|0)!=2){Ig(c[m>>2]|0,c[n>>2]|0,c[j>>2]|0,c[l>>2]|0,c[q>>2]|0);break}if(!(a[c[q>>2]>>0]|0))Kg(c[n>>2]|0,c[j>>2]|0)}while(0);Ug(j,c[p>>2]|0)}}Pg(j);zg(c[h>>2]|0);ma=r;return}function Jg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;g=ma;ma=ma+16|0;h=g+8|0;e=g+4|0;f=g;c[h>>2]=a;c[e>>2]=b;c[f>>2]=d;if(!(_e(c[h>>2]|0,c[f>>2]|0)|0)){ma=g;return}Kg(c[e>>2]|0,c[f>>2]|0);ma=g;return}function Kg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;g=ma;ma=ma+16|0;e=g+8|0;i=g+4|0;h=g+12|0;f=g;c[e>>2]=b;c[i>>2]=d;b=c[i>>2]|0;a[h>>0]=a[b+(($h(c[i>>2]|0)|0)-1)>>0]|0;b=c[i>>2]|0;if((a[h>>0]|0)==47)b=Cg(b)|0;else b=Le(b,17682)|0;c[f>>2]=b;eg(c[e>>2]|0,c[f>>2]|0);ma=g;return}function Lg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;f=ma;ma=ma+16|0;h=f+12|0;d=f+8|0;e=f+4|0;g=f;c[h>>2]=a;c[d>>2]=b;c[g>>2]=Mg(c[h>>2]|0)|0;a=c[h>>2]|0;if(!(c[g>>2]|0))a=Me(a,18016,c[d>>2]|0)|0;c[e>>2]=a;ma=f;return c[e>>2]|0}function Mg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;g=ma;ma=ma+16|0;e=g+12|0;h=g+8|0;f=g+4|0;d=g;c[h>>2]=b;c[f>>2]=ni(c[h>>2]|0,46)|0;if(!(c[f>>2]|0)){c[e>>2]=0;h=c[e>>2]|0;ma=g;return h|0}c[d>>2]=(c[f>>2]|0)+1;while(1){if(!(a[c[d>>2]>>0]|0)){b=8;break}if((a[c[d>>2]>>0]|0)==47){b=6;break}c[d>>2]=(c[d>>2]|0)+1}if((b|0)==6){c[e>>2]=0;h=c[e>>2]|0;ma=g;return h|0}else if((b|0)==8){c[e>>2]=(c[f>>2]|0)+1;h=c[e>>2]|0;ma=g;return h|0}return 0}function Ng(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d+8>>2]=0;c[d+4>>2]=0;c[d>>2]=0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];c[a+8>>2]=c[d+8>>2];ma=b;return}function Og(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=ma;ma=ma+32|0;i=f+16|0;h=f+12|0;g=f;c[i>>2]=d;c[h>>2]=e;c[g+4>>2]=75>(c[h>>2]|0)>>>0?75:(c[h>>2]|0)+1|0;c[g>>2]=yg(c[g+4>>2]|0)|0;vi(c[g>>2]|0,c[i>>2]|0,c[h>>2]|0)|0;a[(c[g>>2]|0)+(c[h>>2]|0)>>0]=0;c[g+8>>2]=(c[h>>2]|0)+1;c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];ma=f;return}function Pg(a){a=a|0;var b=0,d=0;d=ma;ma=ma+16|0;b=d;c[b>>2]=a;if(c[c[b>>2]>>2]|0){Yg(c[c[b>>2]>>2]|0);c[c[b>>2]>>2]=0;c[(c[b>>2]|0)+4>>2]=0;c[(c[b>>2]|0)+8>>2]=0;ma=d;return}else C(17847,17870,62,17922)}function Qg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=ma;ma=ma+16|0;f=e;g=e+4|0;c[f>>2]=b;a[g>>0]=d;Rg(c[f>>2]|0,1);a[(c[c[f>>2]>>2]|0)+(c[(c[f>>2]|0)+8>>2]|0)>>0]=a[g>>0]|0;d=(c[f>>2]|0)+8|0;c[d>>2]=(c[d>>2]|0)+1;ma=e;return}function Rg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=ma;ma=ma+16|0;d=f+4|0;e=f;c[d>>2]=a;c[e>>2]=b;while(1){if(((c[(c[d>>2]|0)+8>>2]|0)+(c[e>>2]|0)|0)>>>0<=(c[(c[d>>2]|0)+4>>2]|0)>>>0)break;b=(c[d>>2]|0)+4|0;c[b>>2]=(c[b>>2]|0)+75;b=Bg(c[c[d>>2]>>2]|0,c[(c[d>>2]|0)+4>>2]|0)|0;c[c[d>>2]>>2]=b}ma=f;return}function Sg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=ma;ma=ma+16|0;g=e+8|0;h=e+4|0;f=e;c[g>>2]=a;c[h>>2]=b;c[f>>2]=d;Rg(c[g>>2]|0,c[f>>2]|0);vi((c[c[g>>2]>>2]|0)+(c[(c[g>>2]|0)+8>>2]|0)|0,c[h>>2]|0,c[f>>2]|0)|0;d=(c[g>>2]|0)+8|0;c[d>>2]=(c[d>>2]|0)+(c[f>>2]|0);ma=e;return}function Tg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=ma;ma=ma+16|0;f=d+8|0;g=d+4|0;e=d;c[f>>2]=a;c[g>>2]=b;c[e>>2]=$h(c[g>>2]|0)|0;Rg(c[f>>2]|0,c[e>>2]|0);ki(c[c[f>>2]>>2]|0,c[g>>2]|0)|0;b=(c[f>>2]|0)+8|0;c[b>>2]=(c[b>>2]|0)+(c[e>>2]|0);ma=d;return}function Ug(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;g=ma;ma=ma+16|0;e=g+4|0;f=g;c[e>>2]=b;c[f>>2]=d;if((c[(c[e>>2]|0)+8>>2]|0)>>>0>(c[f>>2]|0)>>>0){a[(c[c[e>>2]>>2]|0)+(c[f>>2]|0)>>0]=0;c[(c[e>>2]|0)+8>>2]=(c[f>>2]|0)+1;ma=g;return}else C(17930,17870,116,17951)}function Vg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=ma;ma=ma+32|0;k=m+24|0;g=m+20|0;l=m+16|0;h=m+12|0;i=m+8|0;j=m+4|0;f=m;c[m+28>>2]=a;c[k>>2]=b;c[g>>2]=d;c[l>>2]=e;c[i>>2]=-1;c[j>>2]=0;c[f>>2]=(c[k>>2]|0)>>>0<(c[g>>2]|0)>>>0?-1:1;c[h>>2]=0;while(1){if(!(c[j>>2]|0?0:(c[h>>2]|0)<40))break;e=r(c[h>>2]|0,c[f>>2]|0)|0;c[i>>2]=Wg(e,c[g>>2]|0)|0;e=(c[i>>2]|0)-(c[k>>2]|0)|0;a=c[i>>2]|0;if(((((c[i>>2]|0)-(c[k>>2]|0)|0)<0?0-e|0:e)|0)>1){if((r(a-(c[k>>2]|0)|0,c[f>>2]|0)|0)>0)c[j>>2]=c[k>>2]}else c[j>>2]=a;c[h>>2]=(c[h>>2]|0)+1}if(!(c[l>>2]|0)){i=c[j>>2]|0;i=(i|0)!=0;j=c[j>>2]|0;l=c[k>>2]|0;l=i?j:l;ma=m;return l|0}if(c[i>>2]|0)a=r((c[h>>2]|0)-1|0,c[f>>2]|0)|0;else a=0;c[c[l>>2]>>2]=(c[j>>2]|0)==(a|0)&1;i=c[j>>2]|0;i=(i|0)!=0;j=c[j>>2]|0;l=c[k>>2]|0;l=i?j:l;ma=m;return l|0}function Wg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,i=0,j=0,k=0.0,l=0.0;j=ma;ma=ma+32|0;d=j+20|0;e=j+16|0;f=j;h=j+12|0;i=j+8|0;c[d>>2]=a;c[e>>2]=b;c[i>>2]=0;if((c[d>>2]|0)<0){c[i>>2]=1;c[d>>2]=0-(c[d>>2]|0)}if(c[d>>2]&1|0){c[d>>2]=c[d>>2]&-2;g[f>>3]=1.095445115}else g[f>>3]=1.0;while(1){if((c[d>>2]|0)<=8)break;c[d>>2]=(c[d>>2]|0)-8;g[f>>3]=+g[f>>3]*2.0736}while(1){if((c[d>>2]|0)<=0)break;c[d>>2]=(c[d>>2]|0)-2;g[f>>3]=+g[f>>3]*1.2}l=+(c[e>>2]|0);k=+g[f>>3];c[h>>2]=~~((c[i>>2]|0?l/k:l*k)+.5);ma=j;return c[h>>2]|0}function Xg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=ma;ma=ma+16|0;n=w;do if(a>>>0<245){k=a>>>0<11?16:a+11&-8;a=k>>>3;m=c[8615]|0;d=m>>>a;if(d&3|0){b=(d&1^1)+a|0;a=34500+(b<<1<<2)|0;d=a+8|0;e=c[d>>2]|0;f=e+8|0;g=c[f>>2]|0;if((g|0)==(a|0))c[8615]=m&~(1<<b);else{c[g+12>>2]=a;c[d>>2]=g}v=b<<3;c[e+4>>2]=v|3;v=e+v+4|0;c[v>>2]=c[v>>2]|1;v=f;ma=w;return v|0}l=c[8617]|0;if(k>>>0>l>>>0){if(d|0){b=2<<a;b=d<<a&(b|0-b);b=(b&0-b)+-1|0;i=b>>>12&16;b=b>>>i;d=b>>>5&8;b=b>>>d;g=b>>>2&4;b=b>>>g;a=b>>>1&2;b=b>>>a;e=b>>>1&1;e=(d|i|g|a|e)+(b>>>e)|0;b=34500+(e<<1<<2)|0;a=b+8|0;g=c[a>>2]|0;i=g+8|0;d=c[i>>2]|0;if((d|0)==(b|0)){a=m&~(1<<e);c[8615]=a}else{c[d+12>>2]=b;c[a>>2]=d;a=m}v=e<<3;h=v-k|0;c[g+4>>2]=k|3;f=g+k|0;c[f+4>>2]=h|1;c[g+v>>2]=h;if(l|0){e=c[8620]|0;b=l>>>3;d=34500+(b<<1<<2)|0;b=1<<b;if(!(a&b)){c[8615]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=e;c[b+12>>2]=e;c[e+8>>2]=b;c[e+12>>2]=d}c[8617]=h;c[8620]=f;v=i;ma=w;return v|0}g=c[8616]|0;if(g){d=(g&0-g)+-1|0;f=d>>>12&16;d=d>>>f;e=d>>>5&8;d=d>>>e;h=d>>>2&4;d=d>>>h;i=d>>>1&2;d=d>>>i;j=d>>>1&1;j=c[34764+((e|f|h|i|j)+(d>>>j)<<2)>>2]|0;d=j;i=j;j=(c[j+4>>2]&-8)-k|0;while(1){a=c[d+16>>2]|0;if(!a){a=c[d+20>>2]|0;if(!a)break}h=(c[a+4>>2]&-8)-k|0;f=h>>>0<j>>>0;d=a;i=f?a:i;j=f?h:j}h=i+k|0;if(h>>>0>i>>>0){f=c[i+24>>2]|0;b=c[i+12>>2]|0;do if((b|0)==(i|0)){a=i+20|0;b=c[a>>2]|0;if(!b){a=i+16|0;b=c[a>>2]|0;if(!b){d=0;break}}while(1){e=b+20|0;d=c[e>>2]|0;if(!d){e=b+16|0;d=c[e>>2]|0;if(!d)break;else{b=d;a=e}}else{b=d;a=e}}c[a>>2]=0;d=b}else{d=c[i+8>>2]|0;c[d+12>>2]=b;c[b+8>>2]=d;d=b}while(0);do if(f|0){b=c[i+28>>2]|0;a=34764+(b<<2)|0;if((i|0)==(c[a>>2]|0)){c[a>>2]=d;if(!d){c[8616]=g&~(1<<b);break}}else{v=f+16|0;c[((c[v>>2]|0)==(i|0)?v:f+20|0)>>2]=d;if(!d)break}c[d+24>>2]=f;b=c[i+16>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d}b=c[i+20>>2]|0;if(b|0){c[d+20>>2]=b;c[b+24>>2]=d}}while(0);if(j>>>0<16){v=j+k|0;c[i+4>>2]=v|3;v=i+v+4|0;c[v>>2]=c[v>>2]|1}else{c[i+4>>2]=k|3;c[h+4>>2]=j|1;c[h+j>>2]=j;if(l|0){e=c[8620]|0;b=l>>>3;d=34500+(b<<1<<2)|0;b=1<<b;if(!(b&m)){c[8615]=b|m;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=e;c[b+12>>2]=e;c[e+8>>2]=b;c[e+12>>2]=d}c[8617]=j;c[8620]=h}v=i+8|0;ma=w;return v|0}else m=k}else m=k}else m=k}else if(a>>>0<=4294967231){a=a+11|0;k=a&-8;e=c[8616]|0;if(e){f=0-k|0;a=a>>>8;if(a)if(k>>>0>16777215)j=31;else{m=(a+1048320|0)>>>16&8;q=a<<m;i=(q+520192|0)>>>16&4;q=q<<i;j=(q+245760|0)>>>16&2;j=14-(i|m|j)+(q<<j>>>15)|0;j=k>>>(j+7|0)&1|j<<1}else j=0;d=c[34764+(j<<2)>>2]|0;a:do if(!d){d=0;a=0;q=61}else{a=0;i=k<<((j|0)==31?0:25-(j>>>1)|0);g=0;while(1){h=(c[d+4>>2]&-8)-k|0;if(h>>>0<f>>>0)if(!h){a=d;f=0;q=65;break a}else{a=d;f=h}q=c[d+20>>2]|0;d=c[d+16+(i>>>31<<2)>>2]|0;g=(q|0)==0|(q|0)==(d|0)?g:q;if(!d){d=g;q=61;break}else i=i<<1}}while(0);if((q|0)==61){if((d|0)==0&(a|0)==0){a=2<<j;a=(a|0-a)&e;if(!a){m=k;break}m=(a&0-a)+-1|0;h=m>>>12&16;m=m>>>h;g=m>>>5&8;m=m>>>g;i=m>>>2&4;m=m>>>i;j=m>>>1&2;m=m>>>j;d=m>>>1&1;a=0;d=c[34764+((g|h|i|j|d)+(m>>>d)<<2)>>2]|0}if(!d){i=a;h=f}else q=65}if((q|0)==65){g=d;while(1){m=(c[g+4>>2]&-8)-k|0;d=m>>>0<f>>>0;f=d?m:f;a=d?g:a;d=c[g+16>>2]|0;if(!d)d=c[g+20>>2]|0;if(!d){i=a;h=f;break}else g=d}}if(((i|0)!=0?h>>>0<((c[8617]|0)-k|0)>>>0:0)?(l=i+k|0,l>>>0>i>>>0):0){g=c[i+24>>2]|0;b=c[i+12>>2]|0;do if((b|0)==(i|0)){a=i+20|0;b=c[a>>2]|0;if(!b){a=i+16|0;b=c[a>>2]|0;if(!b){b=0;break}}while(1){f=b+20|0;d=c[f>>2]|0;if(!d){f=b+16|0;d=c[f>>2]|0;if(!d)break;else{b=d;a=f}}else{b=d;a=f}}c[a>>2]=0}else{v=c[i+8>>2]|0;c[v+12>>2]=b;c[b+8>>2]=v}while(0);do if(g){a=c[i+28>>2]|0;d=34764+(a<<2)|0;if((i|0)==(c[d>>2]|0)){c[d>>2]=b;if(!b){e=e&~(1<<a);c[8616]=e;break}}else{v=g+16|0;c[((c[v>>2]|0)==(i|0)?v:g+20|0)>>2]=b;if(!b)break}c[b+24>>2]=g;a=c[i+16>>2]|0;if(a|0){c[b+16>>2]=a;c[a+24>>2]=b}a=c[i+20>>2]|0;if(a){c[b+20>>2]=a;c[a+24>>2]=b}}while(0);b:do if(h>>>0<16){v=h+k|0;c[i+4>>2]=v|3;v=i+v+4|0;c[v>>2]=c[v>>2]|1}else{c[i+4>>2]=k|3;c[l+4>>2]=h|1;c[l+h>>2]=h;b=h>>>3;if(h>>>0<256){d=34500+(b<<1<<2)|0;a=c[8615]|0;b=1<<b;if(!(a&b)){c[8615]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=l;c[b+12>>2]=l;c[l+8>>2]=b;c[l+12>>2]=d;break}b=h>>>8;if(b)if(h>>>0>16777215)d=31;else{u=(b+1048320|0)>>>16&8;v=b<<u;t=(v+520192|0)>>>16&4;v=v<<t;d=(v+245760|0)>>>16&2;d=14-(t|u|d)+(v<<d>>>15)|0;d=h>>>(d+7|0)&1|d<<1}else d=0;b=34764+(d<<2)|0;c[l+28>>2]=d;a=l+16|0;c[a+4>>2]=0;c[a>>2]=0;a=1<<d;if(!(e&a)){c[8616]=e|a;c[b>>2]=l;c[l+24>>2]=b;c[l+12>>2]=l;c[l+8>>2]=l;break}b=c[b>>2]|0;c:do if((c[b+4>>2]&-8|0)!=(h|0)){e=h<<((d|0)==31?0:25-(d>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(h|0)){b=a;break c}else{e=e<<1;b=a}}c[d>>2]=l;c[l+24>>2]=b;c[l+12>>2]=l;c[l+8>>2]=l;break b}while(0);u=b+8|0;v=c[u>>2]|0;c[v+12>>2]=l;c[u>>2]=l;c[l+8>>2]=v;c[l+12>>2]=b;c[l+24>>2]=0}while(0);v=i+8|0;ma=w;return v|0}else m=k}else m=k}else m=-1;while(0);d=c[8617]|0;if(d>>>0>=m>>>0){b=d-m|0;a=c[8620]|0;if(b>>>0>15){v=a+m|0;c[8620]=v;c[8617]=b;c[v+4>>2]=b|1;c[a+d>>2]=b;c[a+4>>2]=m|3}else{c[8617]=0;c[8620]=0;c[a+4>>2]=d|3;v=a+d+4|0;c[v>>2]=c[v>>2]|1}v=a+8|0;ma=w;return v|0}h=c[8618]|0;if(h>>>0>m>>>0){t=h-m|0;c[8618]=t;v=c[8621]|0;u=v+m|0;c[8621]=u;c[u+4>>2]=t|1;c[v+4>>2]=m|3;v=v+8|0;ma=w;return v|0}if(!(c[8733]|0)){c[8735]=4096;c[8734]=4096;c[8736]=-1;c[8737]=-1;c[8738]=0;c[8726]=0;c[8733]=n&-16^1431655768;a=4096}else a=c[8735]|0;i=m+48|0;j=m+47|0;g=a+j|0;f=0-a|0;k=g&f;if(k>>>0<=m>>>0){v=0;ma=w;return v|0}a=c[8725]|0;if(a|0?(l=c[8723]|0,n=l+k|0,n>>>0<=l>>>0|n>>>0>a>>>0):0){v=0;ma=w;return v|0}d:do if(!(c[8726]&4)){d=c[8621]|0;e:do if(d){e=34908;while(1){n=c[e>>2]|0;if(n>>>0<=d>>>0?(n+(c[e+4>>2]|0)|0)>>>0>d>>>0:0)break;a=c[e+8>>2]|0;if(!a){q=128;break e}else e=a}b=g-h&f;if(b>>>0<2147483647){a=Kj(b|0)|0;if((a|0)==((c[e>>2]|0)+(c[e+4>>2]|0)|0)){if((a|0)!=(-1|0)){h=b;g=a;q=145;break d}}else{e=a;q=136}}else b=0}else q=128;while(0);do if((q|0)==128){d=Kj(0)|0;if((d|0)!=(-1|0)?(b=d,o=c[8734]|0,p=o+-1|0,b=((p&b|0)==0?0:(p+b&0-o)-b|0)+k|0,o=c[8723]|0,p=b+o|0,b>>>0>m>>>0&b>>>0<2147483647):0){n=c[8725]|0;if(n|0?p>>>0<=o>>>0|p>>>0>n>>>0:0){b=0;break}a=Kj(b|0)|0;if((a|0)==(d|0)){h=b;g=d;q=145;break d}else{e=a;q=136}}else b=0}while(0);do if((q|0)==136){d=0-b|0;if(!(i>>>0>b>>>0&(b>>>0<2147483647&(e|0)!=(-1|0))))if((e|0)==(-1|0)){b=0;break}else{h=b;g=e;q=145;break d}a=c[8735]|0;a=j-b+a&0-a;if(a>>>0>=2147483647){h=b;g=e;q=145;break d}if((Kj(a|0)|0)==(-1|0)){Kj(d|0)|0;b=0;break}else{h=a+b|0;g=e;q=145;break d}}while(0);c[8726]=c[8726]|4;q=143}else{b=0;q=143}while(0);if(((q|0)==143?k>>>0<2147483647:0)?(t=Kj(k|0)|0,p=Kj(0)|0,r=p-t|0,s=r>>>0>(m+40|0)>>>0,!((t|0)==(-1|0)|s^1|t>>>0<p>>>0&((t|0)!=(-1|0)&(p|0)!=(-1|0))^1)):0){h=s?r:b;g=t;q=145}if((q|0)==145){b=(c[8723]|0)+h|0;c[8723]=b;if(b>>>0>(c[8724]|0)>>>0)c[8724]=b;j=c[8621]|0;f:do if(j){b=34908;while(1){a=c[b>>2]|0;d=c[b+4>>2]|0;if((g|0)==(a+d|0)){q=154;break}e=c[b+8>>2]|0;if(!e)break;else b=e}if(((q|0)==154?(u=b+4|0,(c[b+12>>2]&8|0)==0):0)?g>>>0>j>>>0&a>>>0<=j>>>0:0){c[u>>2]=d+h;v=(c[8618]|0)+h|0;t=j+8|0;t=(t&7|0)==0?0:0-t&7;u=j+t|0;t=v-t|0;c[8621]=u;c[8618]=t;c[u+4>>2]=t|1;c[j+v+4>>2]=40;c[8622]=c[8737];break}if(g>>>0<(c[8619]|0)>>>0)c[8619]=g;d=g+h|0;b=34908;while(1){if((c[b>>2]|0)==(d|0)){q=162;break}a=c[b+8>>2]|0;if(!a)break;else b=a}if((q|0)==162?(c[b+12>>2]&8|0)==0:0){c[b>>2]=g;l=b+4|0;c[l>>2]=(c[l>>2]|0)+h;l=g+8|0;l=g+((l&7|0)==0?0:0-l&7)|0;b=d+8|0;b=d+((b&7|0)==0?0:0-b&7)|0;k=l+m|0;i=b-l-m|0;c[l+4>>2]=m|3;g:do if((j|0)==(b|0)){v=(c[8618]|0)+i|0;c[8618]=v;c[8621]=k;c[k+4>>2]=v|1}else{if((c[8620]|0)==(b|0)){v=(c[8617]|0)+i|0;c[8617]=v;c[8620]=k;c[k+4>>2]=v|1;c[k+v>>2]=v;break}a=c[b+4>>2]|0;if((a&3|0)==1){h=a&-8;e=a>>>3;h:do if(a>>>0<256){a=c[b+8>>2]|0;d=c[b+12>>2]|0;if((d|0)==(a|0)){c[8615]=c[8615]&~(1<<e);break}else{c[a+12>>2]=d;c[d+8>>2]=a;break}}else{g=c[b+24>>2]|0;a=c[b+12>>2]|0;do if((a|0)==(b|0)){d=b+16|0;e=d+4|0;a=c[e>>2]|0;if(!a){a=c[d>>2]|0;if(!a){a=0;break}}else d=e;while(1){f=a+20|0;e=c[f>>2]|0;if(!e){f=a+16|0;e=c[f>>2]|0;if(!e)break;else{a=e;d=f}}else{a=e;d=f}}c[d>>2]=0}else{v=c[b+8>>2]|0;c[v+12>>2]=a;c[a+8>>2]=v}while(0);if(!g)break;d=c[b+28>>2]|0;e=34764+(d<<2)|0;do if((c[e>>2]|0)!=(b|0)){v=g+16|0;c[((c[v>>2]|0)==(b|0)?v:g+20|0)>>2]=a;if(!a)break h}else{c[e>>2]=a;if(a|0)break;c[8616]=c[8616]&~(1<<d);break h}while(0);c[a+24>>2]=g;d=b+16|0;e=c[d>>2]|0;if(e|0){c[a+16>>2]=e;c[e+24>>2]=a}d=c[d+4>>2]|0;if(!d)break;c[a+20>>2]=d;c[d+24>>2]=a}while(0);b=b+h|0;f=h+i|0}else f=i;b=b+4|0;c[b>>2]=c[b>>2]&-2;c[k+4>>2]=f|1;c[k+f>>2]=f;b=f>>>3;if(f>>>0<256){d=34500+(b<<1<<2)|0;a=c[8615]|0;b=1<<b;if(!(a&b)){c[8615]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=k;c[b+12>>2]=k;c[k+8>>2]=b;c[k+12>>2]=d;break}b=f>>>8;do if(!b)e=0;else{if(f>>>0>16777215){e=31;break}u=(b+1048320|0)>>>16&8;v=b<<u;t=(v+520192|0)>>>16&4;v=v<<t;e=(v+245760|0)>>>16&2;e=14-(t|u|e)+(v<<e>>>15)|0;e=f>>>(e+7|0)&1|e<<1}while(0);b=34764+(e<<2)|0;c[k+28>>2]=e;a=k+16|0;c[a+4>>2]=0;c[a>>2]=0;a=c[8616]|0;d=1<<e;if(!(a&d)){c[8616]=a|d;c[b>>2]=k;c[k+24>>2]=b;c[k+12>>2]=k;c[k+8>>2]=k;break}b=c[b>>2]|0;i:do if((c[b+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(f|0)){b=a;break i}else{e=e<<1;b=a}}c[d>>2]=k;c[k+24>>2]=b;c[k+12>>2]=k;c[k+8>>2]=k;break g}while(0);u=b+8|0;v=c[u>>2]|0;c[v+12>>2]=k;c[u>>2]=k;c[k+8>>2]=v;c[k+12>>2]=b;c[k+24>>2]=0}while(0);v=l+8|0;ma=w;return v|0}b=34908;while(1){a=c[b>>2]|0;if(a>>>0<=j>>>0?(v=a+(c[b+4>>2]|0)|0,v>>>0>j>>>0):0)break;b=c[b+8>>2]|0}f=v+-47|0;a=f+8|0;a=f+((a&7|0)==0?0:0-a&7)|0;f=j+16|0;a=a>>>0<f>>>0?j:a;b=a+8|0;d=h+-40|0;t=g+8|0;t=(t&7|0)==0?0:0-t&7;u=g+t|0;t=d-t|0;c[8621]=u;c[8618]=t;c[u+4>>2]=t|1;c[g+d+4>>2]=40;c[8622]=c[8737];d=a+4|0;c[d>>2]=27;c[b>>2]=c[8727];c[b+4>>2]=c[8728];c[b+8>>2]=c[8729];c[b+12>>2]=c[8730];c[8727]=g;c[8728]=h;c[8730]=0;c[8729]=b;b=a+24|0;do{u=b;b=b+4|0;c[b>>2]=7}while((u+8|0)>>>0<v>>>0);if((a|0)!=(j|0)){g=a-j|0;c[d>>2]=c[d>>2]&-2;c[j+4>>2]=g|1;c[a>>2]=g;b=g>>>3;if(g>>>0<256){d=34500+(b<<1<<2)|0;a=c[8615]|0;b=1<<b;if(!(a&b)){c[8615]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=j;c[b+12>>2]=j;c[j+8>>2]=b;c[j+12>>2]=d;break}b=g>>>8;if(b)if(g>>>0>16777215)e=31;else{u=(b+1048320|0)>>>16&8;v=b<<u;t=(v+520192|0)>>>16&4;v=v<<t;e=(v+245760|0)>>>16&2;e=14-(t|u|e)+(v<<e>>>15)|0;e=g>>>(e+7|0)&1|e<<1}else e=0;d=34764+(e<<2)|0;c[j+28>>2]=e;c[j+20>>2]=0;c[f>>2]=0;b=c[8616]|0;a=1<<e;if(!(b&a)){c[8616]=b|a;c[d>>2]=j;c[j+24>>2]=d;c[j+12>>2]=j;c[j+8>>2]=j;break}b=c[d>>2]|0;j:do if((c[b+4>>2]&-8|0)!=(g|0)){e=g<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(g|0)){b=a;break j}else{e=e<<1;b=a}}c[d>>2]=j;c[j+24>>2]=b;c[j+12>>2]=j;c[j+8>>2]=j;break f}while(0);u=b+8|0;v=c[u>>2]|0;c[v+12>>2]=j;c[u>>2]=j;c[j+8>>2]=v;c[j+12>>2]=b;c[j+24>>2]=0}}else{v=c[8619]|0;if((v|0)==0|g>>>0<v>>>0)c[8619]=g;c[8727]=g;c[8728]=h;c[8730]=0;c[8624]=c[8733];c[8623]=-1;c[8628]=34500;c[8627]=34500;c[8630]=34508;c[8629]=34508;c[8632]=34516;c[8631]=34516;c[8634]=34524;c[8633]=34524;c[8636]=34532;c[8635]=34532;c[8638]=34540;c[8637]=34540;c[8640]=34548;c[8639]=34548;c[8642]=34556;c[8641]=34556;c[8644]=34564;c[8643]=34564;c[8646]=34572;c[8645]=34572;c[8648]=34580;c[8647]=34580;c[8650]=34588;c[8649]=34588;c[8652]=34596;c[8651]=34596;c[8654]=34604;c[8653]=34604;c[8656]=34612;c[8655]=34612;c[8658]=34620;c[8657]=34620;c[8660]=34628;c[8659]=34628;c[8662]=34636;c[8661]=34636;c[8664]=34644;c[8663]=34644;c[8666]=34652;c[8665]=34652;c[8668]=34660;c[8667]=34660;c[8670]=34668;c[8669]=34668;c[8672]=34676;c[8671]=34676;c[8674]=34684;c[8673]=34684;c[8676]=34692;c[8675]=34692;c[8678]=34700;c[8677]=34700;c[8680]=34708;c[8679]=34708;c[8682]=34716;c[8681]=34716;c[8684]=34724;c[8683]=34724;c[8686]=34732;c[8685]=34732;c[8688]=34740;c[8687]=34740;c[8690]=34748;c[8689]=34748;v=h+-40|0;t=g+8|0;t=(t&7|0)==0?0:0-t&7;u=g+t|0;t=v-t|0;c[8621]=u;c[8618]=t;c[u+4>>2]=t|1;c[g+v+4>>2]=40;c[8622]=c[8737]}while(0);b=c[8618]|0;if(b>>>0>m>>>0){t=b-m|0;c[8618]=t;v=c[8621]|0;u=v+m|0;c[8621]=u;c[u+4>>2]=t|1;c[v+4>>2]=m|3;v=v+8|0;ma=w;return v|0}}c[(fh()|0)>>2]=12;v=0;ma=w;return v|0}function Yg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;if(!a)return;d=a+-8|0;f=c[8619]|0;a=c[a+-4>>2]|0;b=a&-8;j=d+b|0;do if(!(a&1)){e=c[d>>2]|0;if(!(a&3))return;h=d+(0-e)|0;g=e+b|0;if(h>>>0<f>>>0)return;if((c[8620]|0)==(h|0)){a=j+4|0;b=c[a>>2]|0;if((b&3|0)!=3){i=h;b=g;break}c[8617]=g;c[a>>2]=b&-2;c[h+4>>2]=g|1;c[h+g>>2]=g;return}d=e>>>3;if(e>>>0<256){a=c[h+8>>2]|0;b=c[h+12>>2]|0;if((b|0)==(a|0)){c[8615]=c[8615]&~(1<<d);i=h;b=g;break}else{c[a+12>>2]=b;c[b+8>>2]=a;i=h;b=g;break}}f=c[h+24>>2]|0;a=c[h+12>>2]|0;do if((a|0)==(h|0)){b=h+16|0;d=b+4|0;a=c[d>>2]|0;if(!a){a=c[b>>2]|0;if(!a){a=0;break}}else b=d;while(1){e=a+20|0;d=c[e>>2]|0;if(!d){e=a+16|0;d=c[e>>2]|0;if(!d)break;else{a=d;b=e}}else{a=d;b=e}}c[b>>2]=0}else{i=c[h+8>>2]|0;c[i+12>>2]=a;c[a+8>>2]=i}while(0);if(f){b=c[h+28>>2]|0;d=34764+(b<<2)|0;if((c[d>>2]|0)==(h|0)){c[d>>2]=a;if(!a){c[8616]=c[8616]&~(1<<b);i=h;b=g;break}}else{i=f+16|0;c[((c[i>>2]|0)==(h|0)?i:f+20|0)>>2]=a;if(!a){i=h;b=g;break}}c[a+24>>2]=f;b=h+16|0;d=c[b>>2]|0;if(d|0){c[a+16>>2]=d;c[d+24>>2]=a}b=c[b+4>>2]|0;if(b){c[a+20>>2]=b;c[b+24>>2]=a;i=h;b=g}else{i=h;b=g}}else{i=h;b=g}}else{i=d;h=d}while(0);if(h>>>0>=j>>>0)return;a=j+4|0;e=c[a>>2]|0;if(!(e&1))return;if(!(e&2)){if((c[8621]|0)==(j|0)){j=(c[8618]|0)+b|0;c[8618]=j;c[8621]=i;c[i+4>>2]=j|1;if((i|0)!=(c[8620]|0))return;c[8620]=0;c[8617]=0;return}if((c[8620]|0)==(j|0)){j=(c[8617]|0)+b|0;c[8617]=j;c[8620]=h;c[i+4>>2]=j|1;c[h+j>>2]=j;return}f=(e&-8)+b|0;d=e>>>3;do if(e>>>0<256){b=c[j+8>>2]|0;a=c[j+12>>2]|0;if((a|0)==(b|0)){c[8615]=c[8615]&~(1<<d);break}else{c[b+12>>2]=a;c[a+8>>2]=b;break}}else{g=c[j+24>>2]|0;a=c[j+12>>2]|0;do if((a|0)==(j|0)){b=j+16|0;d=b+4|0;a=c[d>>2]|0;if(!a){a=c[b>>2]|0;if(!a){d=0;break}}else b=d;while(1){e=a+20|0;d=c[e>>2]|0;if(!d){e=a+16|0;d=c[e>>2]|0;if(!d)break;else{a=d;b=e}}else{a=d;b=e}}c[b>>2]=0;d=a}else{d=c[j+8>>2]|0;c[d+12>>2]=a;c[a+8>>2]=d;d=a}while(0);if(g|0){a=c[j+28>>2]|0;b=34764+(a<<2)|0;if((c[b>>2]|0)==(j|0)){c[b>>2]=d;if(!d){c[8616]=c[8616]&~(1<<a);break}}else{e=g+16|0;c[((c[e>>2]|0)==(j|0)?e:g+20|0)>>2]=d;if(!d)break}c[d+24>>2]=g;a=j+16|0;b=c[a>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d}a=c[a+4>>2]|0;if(a|0){c[d+20>>2]=a;c[a+24>>2]=d}}}while(0);c[i+4>>2]=f|1;c[h+f>>2]=f;if((i|0)==(c[8620]|0)){c[8617]=f;return}}else{c[a>>2]=e&-2;c[i+4>>2]=b|1;c[h+b>>2]=b;f=b}a=f>>>3;if(f>>>0<256){d=34500+(a<<1<<2)|0;b=c[8615]|0;a=1<<a;if(!(b&a)){c[8615]=b|a;a=d;b=d+8|0}else{b=d+8|0;a=c[b>>2]|0}c[b>>2]=i;c[a+12>>2]=i;c[i+8>>2]=a;c[i+12>>2]=d;return}a=f>>>8;if(a)if(f>>>0>16777215)e=31;else{h=(a+1048320|0)>>>16&8;j=a<<h;g=(j+520192|0)>>>16&4;j=j<<g;e=(j+245760|0)>>>16&2;e=14-(g|h|e)+(j<<e>>>15)|0;e=f>>>(e+7|0)&1|e<<1}else e=0;a=34764+(e<<2)|0;c[i+28>>2]=e;c[i+20>>2]=0;c[i+16>>2]=0;b=c[8616]|0;d=1<<e;a:do if(!(b&d)){c[8616]=b|d;c[a>>2]=i;c[i+24>>2]=a;c[i+12>>2]=i;c[i+8>>2]=i}else{a=c[a>>2]|0;b:do if((c[a+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=a+16+(e>>>31<<2)|0;b=c[d>>2]|0;if(!b)break;if((c[b+4>>2]&-8|0)==(f|0)){a=b;break b}else{e=e<<1;a=b}}c[d>>2]=i;c[i+24>>2]=a;c[i+12>>2]=i;c[i+8>>2]=i;break a}while(0);h=a+8|0;j=c[h>>2]|0;c[j+12>>2]=i;c[h>>2]=i;c[i+8>>2]=j;c[i+12>>2]=a;c[i+24>>2]=0}while(0);j=(c[8623]|0)+-1|0;c[8623]=j;if(j|0)return;a=34916;while(1){a=c[a>>2]|0;if(!a)break;else a=a+8|0}c[8623]=-1;return}function Zg(a,b){a=a|0;b=b|0;var d=0;if(a){d=r(b,a)|0;if((b|a)>>>0>65535)d=((d>>>0)/(a>>>0)|0|0)==(b|0)?d:-1}else d=0;a=Xg(d)|0;if(!a)return a|0;if(!(c[a+-4>>2]&3))return a|0;Jj(a|0,0,d|0)|0;return a|0}function _g(a,b){a=a|0;b=b|0;var d=0,e=0;if(!a){b=Xg(b)|0;return b|0}if(b>>>0>4294967231){c[(fh()|0)>>2]=12;b=0;return b|0}d=$g(a+-8|0,b>>>0<11?16:b+11&-8)|0;if(d|0){b=d+8|0;return b|0}d=Xg(b)|0;if(!d){b=0;return b|0}e=c[a+-4>>2]|0;e=(e&-8)-((e&3|0)==0?8:4)|0;Hj(d|0,a|0,(e>>>0<b>>>0?e:b)|0)|0;Yg(a);b=d;return b|0}function $g(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;l=a+4|0;m=c[l>>2]|0;d=m&-8;i=a+d|0;if(!(m&3)){if(b>>>0<256){a=0;return a|0}if(d>>>0>=(b+4|0)>>>0?(d-b|0)>>>0<=c[8735]<<1>>>0:0)return a|0;a=0;return a|0}if(d>>>0>=b>>>0){d=d-b|0;if(d>>>0<=15)return a|0;k=a+b|0;c[l>>2]=m&1|b|2;c[k+4>>2]=d|3;m=i+4|0;c[m>>2]=c[m>>2]|1;ah(k,d);return a|0}if((c[8621]|0)==(i|0)){k=(c[8618]|0)+d|0;d=k-b|0;e=a+b|0;if(k>>>0<=b>>>0){a=0;return a|0}c[l>>2]=m&1|b|2;c[e+4>>2]=d|1;c[8621]=e;c[8618]=d;return a|0}if((c[8620]|0)==(i|0)){e=(c[8617]|0)+d|0;if(e>>>0<b>>>0){a=0;return a|0}d=e-b|0;if(d>>>0>15){k=a+b|0;e=a+e|0;c[l>>2]=m&1|b|2;c[k+4>>2]=d|1;c[e>>2]=d;e=e+4|0;c[e>>2]=c[e>>2]&-2;e=k}else{c[l>>2]=m&1|e|2;e=a+e+4|0;c[e>>2]=c[e>>2]|1;e=0;d=0}c[8617]=d;c[8620]=e;return a|0}e=c[i+4>>2]|0;if(e&2|0){a=0;return a|0}j=(e&-8)+d|0;if(j>>>0<b>>>0){a=0;return a|0}k=j-b|0;f=e>>>3;do if(e>>>0<256){e=c[i+8>>2]|0;d=c[i+12>>2]|0;if((d|0)==(e|0)){c[8615]=c[8615]&~(1<<f);break}else{c[e+12>>2]=d;c[d+8>>2]=e;break}}else{h=c[i+24>>2]|0;d=c[i+12>>2]|0;do if((d|0)==(i|0)){e=i+16|0;f=e+4|0;d=c[f>>2]|0;if(!d){d=c[e>>2]|0;if(!d){f=0;break}}else e=f;while(1){g=d+20|0;f=c[g>>2]|0;if(!f){g=d+16|0;f=c[g>>2]|0;if(!f)break;else{d=f;e=g}}else{d=f;e=g}}c[e>>2]=0;f=d}else{f=c[i+8>>2]|0;c[f+12>>2]=d;c[d+8>>2]=f;f=d}while(0);if(h|0){d=c[i+28>>2]|0;e=34764+(d<<2)|0;if((c[e>>2]|0)==(i|0)){c[e>>2]=f;if(!f){c[8616]=c[8616]&~(1<<d);break}}else{g=h+16|0;c[((c[g>>2]|0)==(i|0)?g:h+20|0)>>2]=f;if(!f)break}c[f+24>>2]=h;d=i+16|0;e=c[d>>2]|0;if(e|0){c[f+16>>2]=e;c[e+24>>2]=f}d=c[d+4>>2]|0;if(d|0){c[f+20>>2]=d;c[d+24>>2]=f}}}while(0);if(k>>>0<16){c[l>>2]=m&1|j|2;m=a+j+4|0;c[m>>2]=c[m>>2]|1;return a|0}else{i=a+b|0;c[l>>2]=m&1|b|2;c[i+4>>2]=k|3;m=a+j+4|0;c[m>>2]=c[m>>2]|1;ah(i,k);return a|0}return 0}function ah(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;i=a+b|0;d=c[a+4>>2]|0;do if(!(d&1)){f=c[a>>2]|0;if(!(d&3))return;h=a+(0-f)|0;b=f+b|0;if((c[8620]|0)==(h|0)){a=i+4|0;d=c[a>>2]|0;if((d&3|0)!=3)break;c[8617]=b;c[a>>2]=d&-2;c[h+4>>2]=b|1;c[i>>2]=b;return}e=f>>>3;if(f>>>0<256){a=c[h+8>>2]|0;d=c[h+12>>2]|0;if((d|0)==(a|0)){c[8615]=c[8615]&~(1<<e);break}else{c[a+12>>2]=d;c[d+8>>2]=a;break}}g=c[h+24>>2]|0;a=c[h+12>>2]|0;do if((a|0)==(h|0)){d=h+16|0;e=d+4|0;a=c[e>>2]|0;if(!a){a=c[d>>2]|0;if(!a){a=0;break}}else d=e;while(1){f=a+20|0;e=c[f>>2]|0;if(!e){f=a+16|0;e=c[f>>2]|0;if(!e)break;else{a=e;d=f}}else{a=e;d=f}}c[d>>2]=0}else{f=c[h+8>>2]|0;c[f+12>>2]=a;c[a+8>>2]=f}while(0);if(g){d=c[h+28>>2]|0;e=34764+(d<<2)|0;if((c[e>>2]|0)==(h|0)){c[e>>2]=a;if(!a){c[8616]=c[8616]&~(1<<d);break}}else{f=g+16|0;c[((c[f>>2]|0)==(h|0)?f:g+20|0)>>2]=a;if(!a)break}c[a+24>>2]=g;d=h+16|0;e=c[d>>2]|0;if(e|0){c[a+16>>2]=e;c[e+24>>2]=a}d=c[d+4>>2]|0;if(d){c[a+20>>2]=d;c[d+24>>2]=a}}}else h=a;while(0);a=i+4|0;e=c[a>>2]|0;if(!(e&2)){if((c[8621]|0)==(i|0)){i=(c[8618]|0)+b|0;c[8618]=i;c[8621]=h;c[h+4>>2]=i|1;if((h|0)!=(c[8620]|0))return;c[8620]=0;c[8617]=0;return}if((c[8620]|0)==(i|0)){i=(c[8617]|0)+b|0;c[8617]=i;c[8620]=h;c[h+4>>2]=i|1;c[h+i>>2]=i;return}f=(e&-8)+b|0;d=e>>>3;do if(e>>>0<256){a=c[i+8>>2]|0;b=c[i+12>>2]|0;if((b|0)==(a|0)){c[8615]=c[8615]&~(1<<d);break}else{c[a+12>>2]=b;c[b+8>>2]=a;break}}else{g=c[i+24>>2]|0;b=c[i+12>>2]|0;do if((b|0)==(i|0)){a=i+16|0;d=a+4|0;b=c[d>>2]|0;if(!b){b=c[a>>2]|0;if(!b){d=0;break}}else a=d;while(1){e=b+20|0;d=c[e>>2]|0;if(!d){e=b+16|0;d=c[e>>2]|0;if(!d)break;else{b=d;a=e}}else{b=d;a=e}}c[a>>2]=0;d=b}else{d=c[i+8>>2]|0;c[d+12>>2]=b;c[b+8>>2]=d;d=b}while(0);if(g|0){b=c[i+28>>2]|0;a=34764+(b<<2)|0;if((c[a>>2]|0)==(i|0)){c[a>>2]=d;if(!d){c[8616]=c[8616]&~(1<<b);break}}else{e=g+16|0;c[((c[e>>2]|0)==(i|0)?e:g+20|0)>>2]=d;if(!d)break}c[d+24>>2]=g;b=i+16|0;a=c[b>>2]|0;if(a|0){c[d+16>>2]=a;c[a+24>>2]=d}b=c[b+4>>2]|0;if(b|0){c[d+20>>2]=b;c[b+24>>2]=d}}}while(0);c[h+4>>2]=f|1;c[h+f>>2]=f;if((h|0)==(c[8620]|0)){c[8617]=f;return}}else{c[a>>2]=e&-2;c[h+4>>2]=b|1;c[h+b>>2]=b;f=b}b=f>>>3;if(f>>>0<256){d=34500+(b<<1<<2)|0;a=c[8615]|0;b=1<<b;if(!(a&b)){c[8615]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=h;c[b+12>>2]=h;c[h+8>>2]=b;c[h+12>>2]=d;return}b=f>>>8;if(b)if(f>>>0>16777215)e=31;else{g=(b+1048320|0)>>>16&8;i=b<<g;d=(i+520192|0)>>>16&4;i=i<<d;e=(i+245760|0)>>>16&2;e=14-(d|g|e)+(i<<e>>>15)|0;e=f>>>(e+7|0)&1|e<<1}else e=0;b=34764+(e<<2)|0;c[h+28>>2]=e;c[h+20>>2]=0;c[h+16>>2]=0;a=c[8616]|0;d=1<<e;if(!(a&d)){c[8616]=a|d;c[b>>2]=h;c[h+24>>2]=b;c[h+12>>2]=h;c[h+8>>2]=h;return}b=c[b>>2]|0;a:do if((c[b+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=b+16+(e>>>31<<2)|0;a=c[d>>2]|0;if(!a)break;if((c[a+4>>2]&-8|0)==(f|0)){b=a;break a}else{e=e<<1;b=a}}c[d>>2]=h;c[h+24>>2]=b;c[h+12>>2]=h;c[h+8>>2]=h;return}while(0);g=b+8|0;i=c[g>>2]|0;c[i+12>>2]=h;c[g>>2]=h;c[h+8>>2]=i;c[h+12>>2]=b;c[h+24>>2]=0;return}function bh(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=gh(c[a+60>>2]|0)|0;a=eh(V(6,d|0)|0)|0;ma=b;return a|0}function ch(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;m=ma;ma=ma+48|0;k=m+32|0;g=m+16|0;f=m;i=a+28|0;e=c[i>>2]|0;c[f>>2]=e;j=a+20|0;e=(c[j>>2]|0)-e|0;c[f+4>>2]=e;c[f+8>>2]=b;c[f+12>>2]=d;e=e+d|0;h=a+60|0;c[g>>2]=c[h>>2];c[g+4>>2]=f;c[g+8>>2]=2;g=eh(I(146,g|0)|0)|0;a:do if((e|0)!=(g|0)){b=2;while(1){if((g|0)<0)break;e=e-g|0;o=c[f+4>>2]|0;n=g>>>0>o>>>0;f=n?f+8|0:f;b=b+(n<<31>>31)|0;o=g-(n?o:0)|0;c[f>>2]=(c[f>>2]|0)+o;n=f+4|0;c[n>>2]=(c[n>>2]|0)-o;c[k>>2]=c[h>>2];c[k+4>>2]=f;c[k+8>>2]=b;g=eh(I(146,k|0)|0)|0;if((e|0)==(g|0)){l=3;break a}}c[a+16>>2]=0;c[i>>2]=0;c[j>>2]=0;c[a>>2]=c[a>>2]|32;if((b|0)==2)d=0;else d=d-(c[f+4>>2]|0)|0}else l=3;while(0);if((l|0)==3){o=c[a+44>>2]|0;c[a+16>>2]=o+(c[a+48>>2]|0);c[i>>2]=o;c[j>>2]=o}ma=m;return d|0}function dh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;f=ma;ma=ma+32|0;g=f;e=f+20|0;c[g>>2]=c[a+60>>2];c[g+4>>2]=0;c[g+8>>2]=b;c[g+12>>2]=e;c[g+16>>2]=d;if((eh(G(140,g|0)|0)|0)<0){c[e>>2]=-1;a=-1}else a=c[e>>2]|0;ma=f;return a|0}function eh(a){a=a|0;if(a>>>0>4294963200){c[(fh()|0)>>2]=0-a;a=-1}return a|0}function fh(){return 35020}function gh(a){a=a|0;return a|0}function hh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;k=ma;ma=ma+32|0;f=k+16|0;i=k;c[i>>2]=d;g=i+4|0;j=b+48|0;l=c[j>>2]|0;c[g>>2]=e-((l|0)!=0&1);h=b+44|0;c[i+8>>2]=c[h>>2];c[i+12>>2]=l;c[f>>2]=c[b+60>>2];c[f+4>>2]=i;c[f+8>>2]=2;f=eh(H(145,f|0)|0)|0;if((f|0)>=1){i=c[g>>2]|0;if(f>>>0>i>>>0){g=c[h>>2]|0;h=b+4|0;c[h>>2]=g;c[b+8>>2]=g+(f-i);if(!(c[j>>2]|0))f=e;else{c[h>>2]=g+1;a[d+(e+-1)>>0]=a[g>>0]|0;f=e}}}else c[b>>2]=c[b>>2]|f&48^16;ma=k;return f|0}function ih(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;g=ma;ma=ma+32|0;f=g;c[b+36>>2]=1;if((c[b>>2]&64|0)==0?(c[f>>2]=c[b+60>>2],c[f+4>>2]=21523,c[f+8>>2]=g+16,U(54,f|0)|0):0)a[b+75>>0]=-1;f=ch(b,d,e)|0;ma=g;return f|0}function jh(a,b){a=a|0;b=b|0;var d=0,e=0;d=ma;ma=ma+16|0;e=d;c[e>>2]=a;c[e+4>>2]=b;b=eh(L(196,e|0)|0)|0;ma=d;return b|0}function kh(a,b){a=a|0;b=b|0;var d=0,e=0;d=ma;ma=ma+16|0;e=d;c[e>>2]=a;c[e+4>>2]=b;b=eh(K(195,e|0)|0)|0;ma=d;return b|0}function lh(a){a=a|0;return (a+-48|0)>>>0<10|0}function mh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=ma;ma=ma+16|0;g=f;c[g>>2]=e;e=nh(a,b,d,g)|0;ma=f;return e|0}function nh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;m=ma;ma=ma+128|0;g=m+124|0;l=m;h=l;i=3052;j=h+124|0;do{c[h>>2]=c[i>>2];h=h+4|0;i=i+4|0}while((h|0)<(j|0));if((d+-1|0)>>>0>2147483646)if(!d){b=g;d=1;k=4}else{c[(fh()|0)>>2]=75;d=-1}else k=4;if((k|0)==4){k=-2-b|0;k=d>>>0>k>>>0?k:d;c[l+48>>2]=k;g=l+20|0;c[g>>2]=b;c[l+44>>2]=b;d=b+k|0;b=l+16|0;c[b>>2]=d;c[l+28>>2]=d;d=oh(l,e,f)|0;if(k){l=c[g>>2]|0;a[l+(((l|0)==(c[b>>2]|0))<<31>>31)>>0]=0}}ma=m;return d|0}function oh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;r=ma;ma=ma+224|0;m=r+208|0;o=r+160|0;p=r+80|0;q=r;f=o;g=f+40|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(g|0));c[m>>2]=c[e>>2];if((ph(0,d,m,p,o)|0)<0)e=-1;else{if((c[b+76>>2]|0)>-1)n=qh(b)|0;else n=0;e=c[b>>2]|0;l=e&32;if((a[b+74>>0]|0)<1)c[b>>2]=e&-33;f=b+48|0;if(!(c[f>>2]|0)){g=b+44|0;h=c[g>>2]|0;c[g>>2]=q;i=b+28|0;c[i>>2]=q;j=b+20|0;c[j>>2]=q;c[f>>2]=80;k=b+16|0;c[k>>2]=q+80;e=ph(b,d,m,p,o)|0;if(h){sa[c[b+36>>2]&7](b,0,0)|0;e=(c[j>>2]|0)==0?-1:e;c[g>>2]=h;c[f>>2]=0;c[k>>2]=0;c[i>>2]=0;c[j>>2]=0}}else e=ph(b,d,m,p,o)|0;f=c[b>>2]|0;c[b>>2]=f|l;if(n|0)rh(b);e=(f&32|0)==0?e:-1}ma=r;return e|0}function ph(d,e,f,h,i){d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;H=ma;ma=ma+64|0;C=H+56|0;D=H+40|0;z=H;F=H+48|0;G=H+60|0;c[C>>2]=e;w=(d|0)!=0;x=z+40|0;y=x;z=z+39|0;A=F+4|0;j=0;e=0;l=0;a:while(1){do{do if((e|0)>-1)if((j|0)>(2147483647-e|0)){c[(fh()|0)>>2]=75;e=-1;break}else{e=j+e|0;break}while(0);r=c[C>>2]|0;j=a[r>>0]|0;if(!(j<<24>>24)){u=94;break a}k=r;b:while(1){switch(j<<24>>24){case 37:{u=10;break b}case 0:{j=k;break b}default:{}}t=k+1|0;c[C>>2]=t;j=a[t>>0]|0;k=t}c:do if((u|0)==10){u=0;j=k;do{if((a[k+1>>0]|0)!=37)break c;j=j+1|0;k=k+2|0;c[C>>2]=k}while((a[k>>0]|0)==37)}while(0);j=j-r|0;if(w)sh(d,r,j)}while((j|0)!=0);t=(lh(a[(c[C>>2]|0)+1>>0]|0)|0)==0;k=c[C>>2]|0;if(!t?(a[k+2>>0]|0)==36:0){p=(a[k+1>>0]|0)+-48|0;n=1;j=3}else{p=-1;n=l;j=1}j=k+j|0;c[C>>2]=j;k=a[j>>0]|0;l=(k<<24>>24)+-32|0;if(l>>>0>31|(1<<l&75913|0)==0)m=0;else{m=0;do{m=1<<l|m;j=j+1|0;c[C>>2]=j;k=a[j>>0]|0;l=(k<<24>>24)+-32|0}while(!(l>>>0>31|(1<<l&75913|0)==0))}if(k<<24>>24==42){if((lh(a[j+1>>0]|0)|0)!=0?(E=c[C>>2]|0,(a[E+2>>0]|0)==36):0){j=E+1|0;c[i+((a[j>>0]|0)+-48<<2)>>2]=10;j=c[h+((a[j>>0]|0)+-48<<3)>>2]|0;l=1;k=E+3|0}else{if(n|0){e=-1;break}if(w){t=(c[f>>2]|0)+(4-1)&~(4-1);j=c[t>>2]|0;c[f>>2]=t+4}else j=0;l=0;k=(c[C>>2]|0)+1|0}c[C>>2]=k;t=(j|0)<0;s=t?0-j|0:j;m=t?m|8192:m;t=l}else{j=th(C)|0;if((j|0)<0){e=-1;break}s=j;t=n;k=c[C>>2]|0}do if((a[k>>0]|0)==46){j=k+1|0;if((a[j>>0]|0)!=42){c[C>>2]=j;j=th(C)|0;k=c[C>>2]|0;break}if(lh(a[k+2>>0]|0)|0?(B=c[C>>2]|0,(a[B+3>>0]|0)==36):0){j=B+2|0;c[i+((a[j>>0]|0)+-48<<2)>>2]=10;j=c[h+((a[j>>0]|0)+-48<<3)>>2]|0;k=B+4|0;c[C>>2]=k;break}if(t|0){e=-1;break a}if(w){q=(c[f>>2]|0)+(4-1)&~(4-1);j=c[q>>2]|0;c[f>>2]=q+4}else j=0;k=(c[C>>2]|0)+2|0;c[C>>2]=k}else j=-1;while(0);q=0;while(1){if(((a[k>>0]|0)+-65|0)>>>0>57){e=-1;break a}l=k;k=k+1|0;c[C>>2]=k;l=a[(a[l>>0]|0)+-65+(256+(q*58|0))>>0]|0;n=l&255;if((n+-1|0)>>>0>=8)break;else q=n}if(!(l<<24>>24)){e=-1;break}o=(p|0)>-1;do if(l<<24>>24==19)if(o){e=-1;break a}else u=54;else{if(o){c[i+(p<<2)>>2]=n;o=h+(p<<3)|0;p=c[o+4>>2]|0;u=D;c[u>>2]=c[o>>2];c[u+4>>2]=p;u=54;break}if(!w){e=0;break a}uh(D,n,f);k=c[C>>2]|0;u=55}while(0);if((u|0)==54){u=0;if(w)u=55;else j=0}d:do if((u|0)==55){u=0;k=a[k+-1>>0]|0;k=(q|0)!=0&(k&15|0)==3?k&-33:k;l=m&-65537;p=(m&8192|0)==0?m:l;e:do switch(k|0){case 110:switch((q&255)<<24>>24){case 0:{c[c[D>>2]>>2]=e;j=0;break d}case 1:{c[c[D>>2]>>2]=e;j=0;break d}case 2:{j=c[D>>2]|0;c[j>>2]=e;c[j+4>>2]=((e|0)<0)<<31>>31;j=0;break d}case 3:{b[c[D>>2]>>1]=e;j=0;break d}case 4:{a[c[D>>2]>>0]=e;j=0;break d}case 6:{c[c[D>>2]>>2]=e;j=0;break d}case 7:{j=c[D>>2]|0;c[j>>2]=e;c[j+4>>2]=((e|0)<0)<<31>>31;j=0;break d}default:{j=0;break d}}case 112:{k=120;j=j>>>0>8?j:8;l=p|8;u=67;break}case 88:case 120:{l=p;u=67;break}case 111:{l=D;k=c[l>>2]|0;l=c[l+4>>2]|0;o=wh(k,l,x)|0;u=y-o|0;m=0;n=17964;j=(p&8|0)==0|(j|0)>(u|0)?j:u+1|0;u=73;break}case 105:case 100:{l=D;k=c[l>>2]|0;l=c[l+4>>2]|0;if((l|0)<0){k=xj(0,0,k|0,l|0)|0;l=v()|0;m=D;c[m>>2]=k;c[m+4>>2]=l;m=1;n=17964;u=72;break e}else{m=(p&2049|0)!=0&1;n=(p&2048|0)==0?((p&1|0)==0?17964:17966):17965;u=72;break e}}case 117:{l=D;m=0;n=17964;k=c[l>>2]|0;l=c[l+4>>2]|0;u=72;break}case 99:{a[z>>0]=c[D>>2];q=z;m=0;n=17964;o=1;j=y;break}case 109:{k=yh(c[(fh()|0)>>2]|0)|0;u=77;break}case 115:{k=c[D>>2]|0;k=(k|0)==0?17974:k;u=77;break}case 67:{c[F>>2]=c[D>>2];c[A>>2]=0;c[D>>2]=F;n=-1;u=81;break}case 83:{if(!j){Ah(d,32,s,0,p);j=0;u=91}else{n=j;u=81}break}case 65:case 71:case 70:case 69:case 97:case 103:case 102:case 101:{j=Ch(d,+g[D>>3],s,j,p,k)|0;break d}default:{q=r;m=0;n=17964;o=j;l=p;j=y}}while(0);f:do if((u|0)==67){r=D;q=c[r>>2]|0;r=c[r+4>>2]|0;o=vh(q,r,x,k&32)|0;n=(l&8|0)==0|(q|0)==0&(r|0)==0;m=n?0:2;n=n?17964:17964+(k>>>4)|0;p=l;k=q;l=r;u=73}else if((u|0)==72){o=xh(k,l,x)|0;u=73}else if((u|0)==77){u=0;r=zh(k,0,j)|0;p=(r|0)==0;q=k;m=0;n=17964;o=p?j:r-k|0;j=p?k+j|0:r}else if((u|0)==81){u=0;m=c[D>>2]|0;j=0;while(1){k=c[m>>2]|0;if(!k)break;k=Bh(G,k)|0;l=(k|0)<0;if(l|k>>>0>(n-j|0)>>>0){u=85;break}j=k+j|0;if(n>>>0>j>>>0)m=m+4|0;else break}if((u|0)==85){u=0;if(l){e=-1;break a}}Ah(d,32,s,j,p);if(!j){j=0;u=91}else{l=c[D>>2]|0;m=0;while(1){k=c[l>>2]|0;if(!k){u=91;break f}k=Bh(G,k)|0;m=k+m|0;if((m|0)>(j|0)){u=91;break f}sh(d,G,k);if(m>>>0>=j>>>0){u=91;break}else l=l+4|0}}}while(0);if((u|0)==73){u=0;l=(k|0)!=0|(l|0)!=0;r=(j|0)!=0|l;l=y-o+((l^1)&1)|0;q=r?o:x;o=r?((j|0)>(l|0)?j:l):0;l=(j|0)>-1?p&-65537:p;j=y}else if((u|0)==91){u=0;Ah(d,32,s,j,p^8192);j=(s|0)>(j|0)?s:j;break}p=j-q|0;o=(o|0)<(p|0)?p:o;r=o+m|0;j=(s|0)<(r|0)?r:s;Ah(d,32,j,r,l);sh(d,n,m);Ah(d,48,j,r,l^65536);Ah(d,48,o,p,0);sh(d,q,p);Ah(d,32,j,r,l^8192)}while(0);l=t}g:do if((u|0)==94)if(!d)if(!l)e=0;else{e=1;while(1){j=c[i+(e<<2)>>2]|0;if(!j)break;uh(h+(e<<3)|0,j,f);e=e+1|0;if(e>>>0>=10){e=1;break g}}while(1){if(c[i+(e<<2)>>2]|0){e=-1;break g}e=e+1|0;if(e>>>0>=10){e=1;break}}}while(0);ma=H;return e|0}function qh(a){a=a|0;return 1}function rh(a){a=a|0;return}function sh(a,b,d){a=a|0;b=b|0;d=d|0;if(!(c[a>>2]&32))Qh(b,d,a)|0;return}function th(b){b=b|0;var d=0,e=0;if(!(lh(a[c[b>>2]>>0]|0)|0))d=0;else{d=0;do{e=c[b>>2]|0;d=(d*10|0)+-48+(a[e>>0]|0)|0;e=e+1|0;c[b>>2]=e}while((lh(a[e>>0]|0)|0)!=0)}return d|0}function uh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0.0;a:do if(b>>>0<=20)do switch(b|0){case 9:{e=(c[d>>2]|0)+(4-1)&~(4-1);b=c[e>>2]|0;c[d>>2]=e+4;c[a>>2]=b;break a}case 10:{e=(c[d>>2]|0)+(4-1)&~(4-1);b=c[e>>2]|0;c[d>>2]=e+4;e=a;c[e>>2]=b;c[e+4>>2]=((b|0)<0)<<31>>31;break a}case 11:{e=(c[d>>2]|0)+(4-1)&~(4-1);b=c[e>>2]|0;c[d>>2]=e+4;e=a;c[e>>2]=b;c[e+4>>2]=0;break a}case 12:{e=(c[d>>2]|0)+(8-1)&~(8-1);b=e;f=c[b>>2]|0;b=c[b+4>>2]|0;c[d>>2]=e+8;e=a;c[e>>2]=f;c[e+4>>2]=b;break a}case 13:{f=(c[d>>2]|0)+(4-1)&~(4-1);e=c[f>>2]|0;c[d>>2]=f+4;e=(e&65535)<<16>>16;f=a;c[f>>2]=e;c[f+4>>2]=((e|0)<0)<<31>>31;break a}case 14:{f=(c[d>>2]|0)+(4-1)&~(4-1);e=c[f>>2]|0;c[d>>2]=f+4;f=a;c[f>>2]=e&65535;c[f+4>>2]=0;break a}case 15:{f=(c[d>>2]|0)+(4-1)&~(4-1);e=c[f>>2]|0;c[d>>2]=f+4;e=(e&255)<<24>>24;f=a;c[f>>2]=e;c[f+4>>2]=((e|0)<0)<<31>>31;break a}case 16:{f=(c[d>>2]|0)+(4-1)&~(4-1);e=c[f>>2]|0;c[d>>2]=f+4;f=a;c[f>>2]=e&255;c[f+4>>2]=0;break a}case 17:{f=(c[d>>2]|0)+(8-1)&~(8-1);h=+g[f>>3];c[d>>2]=f+8;g[a>>3]=h;break a}case 18:{f=(c[d>>2]|0)+(8-1)&~(8-1);h=+g[f>>3];c[d>>2]=f+8;g[a>>3]=h;break a}default:break a}while(0);while(0);return}function vh(b,c,e,f){b=b|0;c=c|0;e=e|0;f=f|0;if(!((b|0)==0&(c|0)==0))do{e=e+-1|0;a[e>>0]=d[720+(b&15)>>0]|0|f;b=Bj(b|0,c|0,4)|0;c=v()|0}while(!((b|0)==0&(c|0)==0));return e|0}function wh(b,c,d){b=b|0;c=c|0;d=d|0;if(!((b|0)==0&(c|0)==0))do{d=d+-1|0;a[d>>0]=b&7|48;b=Bj(b|0,c|0,3)|0;c=v()|0}while(!((b|0)==0&(c|0)==0));return d|0}function xh(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;if(c>>>0>0|(c|0)==0&b>>>0>4294967295){do{e=b;b=Aj(b|0,c|0,10,0)|0;f=c;c=v()|0;g=vj(b|0,c|0,10,0)|0;g=xj(e|0,f|0,g|0,v()|0)|0;v()|0;d=d+-1|0;a[d>>0]=g&255|48}while(f>>>0>9|(f|0)==9&e>>>0>4294967295);c=b}else c=b;if(c)do{g=c;c=(c>>>0)/10|0;d=d+-1|0;a[d>>0]=g-(c*10|0)|48}while(g>>>0>=10);return d|0}function yh(a){a=a|0;return Kh(a,c[(Jh()|0)+188>>2]|0)|0}function zh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=d&255;f=(e|0)!=0;a:do if(f&(b&3|0)!=0){g=d&255;while(1){if((a[b>>0]|0)==g<<24>>24){i=6;break a}b=b+1|0;e=e+-1|0;f=(e|0)!=0;if(!(f&(b&3|0)!=0)){i=5;break}}}else i=5;while(0);if((i|0)==5)if(f)i=6;else i=16;b:do if((i|0)==6){g=d&255;if((a[b>>0]|0)==g<<24>>24)if(!e){i=16;break}else break;f=r(h,16843009)|0;c:do if(e>>>0>3)while(1){h=c[b>>2]^f;if((h&-2139062144^-2139062144)&h+-16843009|0)break c;b=b+4|0;e=e+-4|0;if(e>>>0<=3){i=11;break}}else i=11;while(0);if((i|0)==11)if(!e){i=16;break}while(1){if((a[b>>0]|0)==g<<24>>24)break b;e=e+-1|0;if(!e){i=16;break}else b=b+1|0}}while(0);if((i|0)==16)b=0;return b|0}function Ah(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;g=ma;ma=ma+256|0;f=g;if((c|0)>(d|0)&(e&73728|0)==0){e=c-d|0;Jj(f|0,b<<24>>24|0,(e>>>0<256?e:256)|0)|0;if(e>>>0>255){b=c-d|0;do{sh(a,f,256);e=e+-256|0}while(e>>>0>255);e=b&255}sh(a,f,e)}ma=g;return}function Bh(a,b){a=a|0;b=b|0;if(!a)a=0;else a=Gh(a,b,0)|0;return a|0}function Ch(b,e,f,g,h,i){b=b|0;e=+e;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;H=ma;ma=ma+560|0;l=H+32|0;w=H+536|0;G=H;F=G;m=H+540|0;c[w>>2]=0;E=m+12|0;Dh(e)|0;j=v()|0;if((j|0)<0){e=-e;Dh(e)|0;D=1;C=17981;j=v()|0}else{D=(h&2049|0)!=0&1;C=(h&2048|0)==0?((h&1|0)==0?17982:17987):17984}do if(0==0&(j&2146435072|0)==2146435072){G=(i&32|0)!=0;j=D+3|0;Ah(b,32,f,j,h&-65537);sh(b,C,D);sh(b,e!=e|0.0!=0.0?(G?18008:18012):G?18e3:18004,3);Ah(b,32,f,j,h^8192)}else{q=+Eh(e,w)*2.0;j=q!=0.0;if(j)c[w>>2]=(c[w>>2]|0)+-1;u=i|32;if((u|0)==97){o=i&32;s=(o|0)==0?C:C+9|0;p=D|2;j=12-g|0;do if(!(g>>>0>11|(j|0)==0)){e=8.0;do{j=j+-1|0;e=e*16.0}while((j|0)!=0);if((a[s>>0]|0)==45){e=-(e+(-q-e));break}else{e=q+e-e;break}}else e=q;while(0);k=c[w>>2]|0;j=(k|0)<0?0-k|0:k;j=xh(j,((j|0)<0)<<31>>31,E)|0;if((j|0)==(E|0)){j=m+11|0;a[j>>0]=48}a[j+-1>>0]=(k>>31&2)+43;n=j+-2|0;a[n>>0]=i+15;k=(g|0)<1;l=(h&8|0)==0;m=G;do{D=~~e;j=m+1|0;a[m>>0]=o|d[720+D>>0];e=(e-+(D|0))*16.0;if((j-F|0)==1?!(l&(k&e==0.0)):0){a[j>>0]=46;m=m+2|0}else m=j}while(e!=0.0);if((g|0)!=0?(-2-F+m|0)<(g|0):0){k=E;l=n;j=g+2+k-l|0}else{k=E;l=n;j=k-F-l+m|0}E=j+p|0;Ah(b,32,f,E,h);sh(b,s,p);Ah(b,48,f,E,h^65536);F=m-F|0;sh(b,G,F);G=k-l|0;Ah(b,48,j-(F+G)|0,0,0);sh(b,n,G);Ah(b,32,f,E,h^8192);j=E;break}k=(g|0)<0?6:g;if(j){j=(c[w>>2]|0)+-28|0;c[w>>2]=j;e=q*268435456.0}else{e=q;j=c[w>>2]|0}B=(j|0)<0?l:l+288|0;l=B;do{z=~~e>>>0;c[l>>2]=z;l=l+4|0;e=(e-+(z>>>0))*1.0e9}while(e!=0.0);z=B;if((j|0)>0){o=B;while(1){n=(j|0)<29?j:29;j=l+-4|0;if(j>>>0>=o>>>0){m=0;do{t=Cj(c[j>>2]|0,0,n|0)|0;t=wj(t|0,v()|0,m|0,0)|0;x=v()|0;m=Aj(t|0,x|0,1e9,0)|0;y=vj(m|0,v()|0,1e9,0)|0;y=xj(t|0,x|0,y|0,v()|0)|0;v()|0;c[j>>2]=y;j=j+-4|0}while(j>>>0>=o>>>0);if(m){y=o+-4|0;c[y>>2]=m;m=y}else m=o}else m=o;a:do if(l>>>0>m>>>0){j=l;while(1){l=j+-4|0;if(c[l>>2]|0){l=j;break a}if(l>>>0>m>>>0)j=l;else break}}while(0);j=(c[w>>2]|0)-n|0;c[w>>2]=j;if((j|0)>0)o=m;else break}}else m=B;if((j|0)<0){g=((k+25|0)/9|0)+1|0;t=(u|0)==102;do{s=0-j|0;s=(s|0)<9?s:9;if(m>>>0<l>>>0){n=(1<<s)+-1|0;o=1e9>>>s;p=0;j=m;do{y=c[j>>2]|0;c[j>>2]=(y>>>s)+p;p=r(y&n,o)|0;j=j+4|0}while(j>>>0<l>>>0);m=(c[m>>2]|0)==0?m+4|0:m;if(p){c[l>>2]=p;l=l+4|0}}else m=(c[m>>2]|0)==0?m+4|0:m;j=t?B:m;l=(l-j>>2|0)>(g|0)?j+(g<<2)|0:l;j=(c[w>>2]|0)+s|0;c[w>>2]=j}while((j|0)<0);t=m}else t=m;if(t>>>0<l>>>0){j=(z-t>>2)*9|0;n=c[t>>2]|0;if(n>>>0>=10){m=10;do{m=m*10|0;j=j+1|0}while(n>>>0>=m>>>0)}}else j=0;x=(u|0)==103;y=(k|0)!=0;m=k-((u|0)==102?0:j)+((y&x)<<31>>31)|0;if((m|0)<(((l-z>>2)*9|0)+-9|0)){w=m+9216|0;m=(w|0)/9|0;g=B+4+(m+-1024<<2)|0;m=w-(m*9|0)|0;if((m|0)<8){n=10;while(1){n=n*10|0;if((m|0)<7)m=m+1|0;else break}}else n=10;p=c[g>>2]|0;m=(p>>>0)/(n>>>0)|0;s=p-(r(m,n)|0)|0;o=(g+4|0)==(l|0);if(!(o&(s|0)==0)){q=(m&1|0)==0?9007199254740992.0:9007199254740994.0;w=n>>>1;e=s>>>0<w>>>0?.5:o&(s|0)==(w|0)?1.0:1.5;if(D){w=(a[C>>0]|0)==45;e=w?-e:e;q=w?-q:q}m=p-s|0;c[g>>2]=m;if(q+e!=q){w=m+n|0;c[g>>2]=w;if(w>>>0>999999999){n=g;j=t;while(1){m=n+-4|0;c[n>>2]=0;if(m>>>0<j>>>0){j=j+-4|0;c[j>>2]=0}w=(c[m>>2]|0)+1|0;c[m>>2]=w;if(w>>>0>999999999)n=m;else{n=j;break}}}else{m=g;n=t}j=(z-n>>2)*9|0;p=c[n>>2]|0;if(p>>>0>=10){o=10;do{o=o*10|0;j=j+1|0}while(p>>>0>=o>>>0)}}else{m=g;n=t}}else{m=g;n=t}w=m+4|0;l=l>>>0>w>>>0?w:l}else n=t;g=0-j|0;b:do if(l>>>0>n>>>0)while(1){m=l+-4|0;if(c[m>>2]|0){w=l;u=1;break b}if(m>>>0>n>>>0)l=m;else{w=m;u=0;break}}else{w=l;u=0}while(0);do if(x){k=k+((y^1)&1)|0;if((k|0)>(j|0)&(j|0)>-5){o=i+-1|0;k=k+-1-j|0}else{o=i+-2|0;k=k+-1|0}if(!(h&8)){if(u?(A=c[w+-4>>2]|0,(A|0)!=0):0)if(!((A>>>0)%10|0)){m=0;l=10;do{l=l*10|0;m=m+1|0}while(!((A>>>0)%(l>>>0)|0|0))}else m=0;else m=9;l=((w-z>>2)*9|0)+-9|0;if((o|32|0)==102){i=l-m|0;i=(i|0)>0?i:0;k=(k|0)<(i|0)?k:i;break}else{i=l+j-m|0;i=(i|0)>0?i:0;k=(k|0)<(i|0)?k:i;break}}}else o=i;while(0);t=(k|0)!=0;p=t?1:h>>>3&1;s=(o|32|0)==102;if(s){x=0;j=(j|0)>0?j:0}else{l=(j|0)<0?g:j;l=xh(l,((l|0)<0)<<31>>31,E)|0;m=E;if((m-l|0)<2)do{l=l+-1|0;a[l>>0]=48}while((m-l|0)<2);a[l+-1>>0]=(j>>31&2)+43;j=l+-2|0;a[j>>0]=o;x=j;j=m-j|0}j=D+1+k+p+j|0;Ah(b,32,f,j,h);sh(b,C,D);Ah(b,48,f,j,h^65536);if(s){p=n>>>0>B>>>0?B:n;s=G+9|0;n=s;o=G+8|0;m=p;do{l=xh(c[m>>2]|0,0,s)|0;if((m|0)==(p|0)){if((l|0)==(s|0)){a[o>>0]=48;l=o}}else if(l>>>0>G>>>0){Jj(G|0,48,l-F|0)|0;do l=l+-1|0;while(l>>>0>G>>>0)}sh(b,l,n-l|0);m=m+4|0}while(m>>>0<=B>>>0);if(!((h&8|0)==0&(t^1)))sh(b,18016,1);if(m>>>0<w>>>0&(k|0)>0)while(1){l=xh(c[m>>2]|0,0,s)|0;if(l>>>0>G>>>0){Jj(G|0,48,l-F|0)|0;do l=l+-1|0;while(l>>>0>G>>>0)}sh(b,l,(k|0)<9?k:9);m=m+4|0;l=k+-9|0;if(!(m>>>0<w>>>0&(k|0)>9)){k=l;break}else k=l}Ah(b,48,k+9|0,9,0)}else{w=u?w:n+4|0;if(n>>>0<w>>>0&(k|0)>-1){g=G+9|0;t=(h&8|0)==0;u=g;p=0-F|0;s=G+8|0;o=n;do{l=xh(c[o>>2]|0,0,g)|0;if((l|0)==(g|0)){a[s>>0]=48;l=s}do if((o|0)==(n|0)){m=l+1|0;sh(b,l,1);if(t&(k|0)<1){l=m;break}sh(b,18016,1);l=m}else{if(l>>>0<=G>>>0)break;Jj(G|0,48,l+p|0)|0;do l=l+-1|0;while(l>>>0>G>>>0)}while(0);F=u-l|0;sh(b,l,(k|0)>(F|0)?F:k);k=k-F|0;o=o+4|0}while(o>>>0<w>>>0&(k|0)>-1)}Ah(b,48,k+18|0,18,0);sh(b,x,E-x|0)}Ah(b,32,f,j,h^8192)}while(0);ma=H;return ((j|0)<(f|0)?f:j)|0}function Dh(a){a=+a;var b=0;g[h>>3]=a;b=c[h>>2]|0;u(c[h+4>>2]|0);return b|0}function Eh(a,b){a=+a;b=b|0;return +(+Fh(a,b))}function Fh(a,b){a=+a;b=b|0;var d=0,e=0,f=0;g[h>>3]=a;d=c[h>>2]|0;e=c[h+4>>2]|0;f=Bj(d|0,e|0,52)|0;v()|0;switch(f&2047){case 0:{if(a!=0.0){a=+Fh(a*18446744073709551616.0,b);d=(c[b>>2]|0)+-64|0}else d=0;c[b>>2]=d;break}case 2047:break;default:{c[b>>2]=(f&2047)+-1022;c[h>>2]=d;c[h+4>>2]=e&-2146435073|1071644672;a=+g[h>>3]}}return +a}function Gh(b,d,e){b=b|0;d=d|0;e=e|0;do if(b){if(d>>>0<128){a[b>>0]=d;b=1;break}if(!(c[c[(Hh()|0)+188>>2]>>2]|0))if((d&-128|0)==57216){a[b>>0]=d;b=1;break}else{c[(fh()|0)>>2]=84;b=-1;break}if(d>>>0<2048){a[b>>0]=d>>>6|192;a[b+1>>0]=d&63|128;b=2;break}if(d>>>0<55296|(d&-8192|0)==57344){a[b>>0]=d>>>12|224;a[b+1>>0]=d>>>6&63|128;a[b+2>>0]=d&63|128;b=3;break}if((d+-65536|0)>>>0<1048576){a[b>>0]=d>>>18|240;a[b+1>>0]=d>>>12&63|128;a[b+2>>0]=d>>>6&63|128;a[b+3>>0]=d&63|128;b=4;break}else{c[(fh()|0)>>2]=84;b=-1;break}}else b=1;while(0);return b|0}function Hh(){return Ih()|0}function Ih(){return 3176}function Jh(){return Ih()|0}function Kh(b,e){b=b|0;e=e|0;var f=0,g=0;f=0;while(1){if((d[736+f>>0]|0)==(b|0)){g=4;break}f=f+1|0;if((f|0)==87){b=87;g=5;break}}if((g|0)==4)if(!f)f=832;else{b=f;g=5}if((g|0)==5){f=832;do{do{g=f;f=f+1|0}while((a[g>>0]|0)!=0);b=b+-1|0}while((b|0)!=0)}return Lh(f,c[e+20>>2]|0)|0}function Lh(a,b){a=a|0;b=b|0;return Mh(a,b)|0}function Mh(a,b){a=a|0;b=b|0;if(!b)b=0;else b=Nh(c[b>>2]|0,c[b+4>>2]|0,a)|0;return ((b|0)==0?a:b)|0}function Nh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;o=(c[b>>2]|0)+1794895138|0;h=Oh(c[b+8>>2]|0,o)|0;f=Oh(c[b+12>>2]|0,o)|0;g=Oh(c[b+16>>2]|0,o)|0;a:do if((h>>>0<d>>>2>>>0?(n=d-(h<<2)|0,f>>>0<n>>>0&g>>>0<n>>>0):0)?((g|f)&3|0)==0:0){n=f>>>2;m=g>>>2;l=0;while(1){j=h>>>1;k=l+j|0;i=k<<1;g=i+n|0;f=Oh(c[b+(g<<2)>>2]|0,o)|0;g=Oh(c[b+(g+1<<2)>>2]|0,o)|0;if(!(g>>>0<d>>>0&f>>>0<(d-g|0)>>>0)){f=0;break a}if(a[b+(g+f)>>0]|0){f=0;break a}f=Ph(e,b+g|0)|0;if(!f)break;f=(f|0)<0;if((h|0)==1){f=0;break a}l=f?l:k;h=f?j:h-j|0}f=i+m|0;g=Oh(c[b+(f<<2)>>2]|0,o)|0;f=Oh(c[b+(f+1<<2)>>2]|0,o)|0;if(f>>>0<d>>>0&g>>>0<(d-f|0)>>>0)f=(a[b+(f+g)>>0]|0)==0?b+f|0:0;else f=0}else f=0;while(0);return f|0}function Oh(a,b){a=a|0;b=b|0;var c=0;c=Dj(a|0)|0;return ((b|0)==0?a:c)|0}function Ph(b,c){b=b|0;c=c|0;var d=0,e=0;d=a[b>>0]|0;e=a[c>>0]|0;if(d<<24>>24==0?1:d<<24>>24!=e<<24>>24)b=e;else{do{b=b+1|0;c=c+1|0;d=a[b>>0]|0;e=a[c>>0]|0}while(!(d<<24>>24==0?1:d<<24>>24!=e<<24>>24));b=e}return (d&255)-(b&255)|0}function Qh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=e+16|0;g=c[f>>2]|0;if(!g)if(!(Rh(e)|0)){g=c[f>>2]|0;h=5}else f=0;else h=5;a:do if((h|0)==5){j=e+20|0;i=c[j>>2]|0;f=i;if((g-i|0)>>>0<d>>>0){f=sa[c[e+36>>2]&7](e,b,d)|0;break}b:do if((a[e+75>>0]|0)<0|(d|0)==0){h=0;g=b}else{i=d;while(1){g=i+-1|0;if((a[b+g>>0]|0)==10)break;if(!g){h=0;g=b;break b}else i=g}f=sa[c[e+36>>2]&7](e,b,i)|0;if(f>>>0<i>>>0)break a;h=i;g=b+i|0;d=d-i|0;f=c[j>>2]|0}while(0);Hj(f|0,g|0,d|0)|0;c[j>>2]=(c[j>>2]|0)+d;f=h+d|0}while(0);return f|0}function Rh(b){b=b|0;var d=0,e=0;d=b+74|0;e=a[d>>0]|0;a[d>>0]=e+255|e;d=c[b>>2]|0;if(!(d&8)){c[b+8>>2]=0;c[b+4>>2]=0;e=c[b+44>>2]|0;c[b+28>>2]=e;c[b+20>>2]=e;c[b+16>>2]=e+(c[b+48>>2]|0);b=0}else{c[b>>2]=d|32;b=-1}return b|0}function Sh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a+20|0;f=c[e>>2]|0;a=(c[a+16>>2]|0)-f|0;a=a>>>0>d>>>0?d:a;Hj(f|0,b|0,a|0)|0;c[e>>2]=(c[e>>2]|0)+a;return d|0}function Th(a){a=a|0;var b=0;b=(Uh(a)|0)==0;return (b?a:a&95)|0}function Uh(a){a=a|0;return (a+-97|0)>>>0<26|0}function Vh(b,c){b=b|0;c=c|0;var e=0,f=0,g=0;e=a[b>>0]|0;a:do if(!(e<<24>>24))b=0;else{g=b;b=e;f=e&255;while(1){e=a[c>>0]|0;if(!(e<<24>>24))break a;if(b<<24>>24!=e<<24>>24?(f=Wh(f)|0,(f|0)!=(Wh(d[c>>0]|0)|0)):0)break;b=g+1|0;c=c+1|0;e=a[b>>0]|0;if(!(e<<24>>24)){b=0;break a}else{g=b;b=e;f=e&255}}b=a[g>>0]|0}while(0);g=Wh(b&255)|0;return g-(Wh(d[c>>0]|0)|0)|0}function Wh(a){a=a|0;var b=0;b=(Xh(a)|0)==0;return (b?a:a|32)|0}function Xh(a){a=a|0;return (a+-65|0)>>>0<26|0}function Yh(a){a=a|0;if(!(Zh(a)|0))a=(lh(a)|0)!=0&1;else a=1;return a|0}function Zh(a){a=a|0;return ((a|32)+-97|0)>>>0<26|0}function _h(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;f=d&255;a:do if(!f)b=b+($h(b)|0)|0;else{if(b&3){e=d&255;do{g=a[b>>0]|0;if(g<<24>>24==0?1:g<<24>>24==e<<24>>24)break a;b=b+1|0}while((b&3|0)!=0)}f=r(f,16843009)|0;e=c[b>>2]|0;b:do if(!((e&-2139062144^-2139062144)&e+-16843009))do{g=e^f;if((g&-2139062144^-2139062144)&g+-16843009|0)break b;b=b+4|0;e=c[b>>2]|0}while(!((e&-2139062144^-2139062144)&e+-16843009|0));while(0);e=d&255;while(1){g=a[b>>0]|0;if(g<<24>>24==0?1:g<<24>>24==e<<24>>24)break;else b=b+1|0}}while(0);return b|0}function $h(b){b=b|0;var d=0,e=0,f=0;f=b;a:do if(!(f&3))e=5;else{d=f;while(1){if(!(a[b>>0]|0)){b=d;break a}b=b+1|0;d=b;if(!(d&3)){e=5;break}}}while(0);if((e|0)==5){while(1){d=c[b>>2]|0;if(!((d&-2139062144^-2139062144)&d+-16843009))b=b+4|0;else break}if((d&255)<<24>>24)do b=b+1|0;while((a[b>>0]|0)!=0)}return b-f|0}function ai(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0;if(!e)f=0;else{f=a[b>>0]|0;a:do if(!(f<<24>>24))f=0;else while(1){e=e+-1|0;g=a[c>>0]|0;if(!(f<<24>>24==g<<24>>24&((e|0)!=0&g<<24>>24!=0)))break a;b=b+1|0;c=c+1|0;f=a[b>>0]|0;if(!(f<<24>>24)){f=0;break}}while(0);f=(f&255)-(d[c>>0]|0)|0}return f|0}function bi(b,c){b=b|0;c=c|0;b=_h(b,c)|0;return ((a[b>>0]|0)==(c&255)<<24>>24?b:0)|0}function ci(a){a=a|0;return ((a|0)==32|(a+-9|0)>>>0<5)&1|0}function di(a){a=a|0;var b=0,e=0;e=ma;ma=ma+16|0;b=e;if((ei(a)|0)==0?(sa[c[a+32>>2]&7](a,b,1)|0)==1:0)a=d[b>>0]|0;else a=-1;ma=e;return a|0}function ei(b){b=b|0;var d=0,e=0;d=b+74|0;e=a[d>>0]|0;a[d>>0]=e+255|e;d=b+20|0;e=b+28|0;if((c[d>>2]|0)>>>0>(c[e>>2]|0)>>>0)sa[c[b+36>>2]&7](b,0,0)|0;c[b+16>>2]=0;c[e>>2]=0;c[d>>2]=0;d=c[b>>2]|0;if(!(d&4)){e=(c[b+44>>2]|0)+(c[b+48>>2]|0)|0;c[b+8>>2]=e;c[b+4>>2]=e;d=d<<27>>31}else{c[b>>2]=d|32;d=-1}return d|0}function fi(a,b){a=a|0;b=b|0;gi(a,b)|0;return a|0}function gi(b,d){b=b|0;d=d|0;var e=0,f=0;e=d;a:do if(!((e^b)&3)){if(e&3)do{e=a[d>>0]|0;a[b>>0]=e;if(!(e<<24>>24))break a;d=d+1|0;b=b+1|0}while((d&3|0)!=0);e=c[d>>2]|0;if(!((e&-2139062144^-2139062144)&e+-16843009)){f=b;while(1){d=d+4|0;b=f+4|0;c[f>>2]=e;e=c[d>>2]|0;if((e&-2139062144^-2139062144)&e+-16843009|0)break;else f=b}}f=10}else f=10;while(0);if((f|0)==10){f=a[d>>0]|0;a[b>>0]=f;if(f<<24>>24)do{d=d+1|0;b=b+1|0;f=a[d>>0]|0;a[b>>0]=f}while(f<<24>>24!=0)}return b|0}function hi(a){a=a|0;return Mh(a,c[(c[(ii()|0)+188>>2]|0)+20>>2]|0)|0}function ii(){return Ih()|0}function ji(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;h=ma;ma=ma+48|0;g=h+32|0;f=h+16|0;e=h;if(!(b&4194368))e=0;else{c[e>>2]=d;i=(c[e>>2]|0)+(4-1)&~(4-1);d=c[i>>2]|0;c[e>>2]=i+4;e=d}c[f>>2]=a;c[f+4>>2]=b|32768;c[f+8>>2]=e;e=T(5,f|0)|0;if(!((b&524288|0)==0|(e|0)<0)){c[g>>2]=e;c[g+4>>2]=2;c[g+8>>2]=1;O(221,g|0)|0}i=eh(e)|0;ma=h;return i|0}function ki(a,b){a=a|0;b=b|0;fi(a+($h(a)|0)|0,b)|0;return a|0}function li(a){a=a|0;var b=0,c=0;b=($h(a)|0)+1|0;c=Xg(b)|0;if(!c)a=0;else a=Hj(c|0,a|0,b|0)|0;return a|0}function mi(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;a:do if(!d)b=0;else{while(1){e=a[b>>0]|0;f=a[c>>0]|0;if(e<<24>>24!=f<<24>>24)break;d=d+-1|0;if(!d){b=0;break a}else{b=b+1|0;c=c+1|0}}b=(e&255)-(f&255)|0}while(0);return b|0}function ni(a,b){a=a|0;b=b|0;return oi(a,b,($h(a)|0)+1|0)|0}function oi(b,c,d){b=b|0;c=c|0;d=d|0;a:do if(!d)d=0;else{c=c&255;while(1){d=d+-1|0;if((a[b+d>>0]|0)==c<<24>>24)break;if(!d){d=0;break a}}d=b+d|0}while(0);return d|0}function pi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;g=d;a:do if(!((g^b)&3)){f=(e|0)!=0;if(f&(g&3|0)!=0)do{g=a[d>>0]|0;a[b>>0]=g;if(!(g<<24>>24))break a;e=e+-1|0;d=d+1|0;b=b+1|0;f=(e|0)!=0}while(f&(d&3|0)!=0);if(f){if(a[d>>0]|0){b:do if(e>>>0>3){f=d;while(1){d=c[f>>2]|0;if((d&-2139062144^-2139062144)&d+-16843009|0){d=f;break b}c[b>>2]=d;e=e+-4|0;d=f+4|0;b=b+4|0;if(e>>>0>3)f=d;else break}}while(0);h=13}}else e=0}else h=13;while(0);c:do if((h|0)==13)if(!e)e=0;else while(1){h=a[d>>0]|0;a[b>>0]=h;if(!(h<<24>>24))break c;e=e+-1|0;b=b+1|0;if(!e){e=0;break}else d=d+1|0}while(0);Jj(b|0,0,e|0)|0;return b|0}function qi(b,c){b=b|0;c=c|0;var d=0;d=a[c>>0]|0;do if(d<<24>>24){b=bi(b,d<<24>>24)|0;if(b){if(a[c+1>>0]|0)if(a[b+1>>0]|0){if(!(a[c+2>>0]|0)){b=ri(b,c)|0;break}if(a[b+2>>0]|0){if(!(a[c+3>>0]|0)){b=si(b,c)|0;break}if(a[b+3>>0]|0)if(!(a[c+4>>0]|0)){b=ti(b,c)|0;break}else{b=ui(b,c)|0;break}else b=0}else b=0}else b=0}else b=0}while(0);return b|0}function ri(b,c){b=b|0;c=c|0;var e=0,f=0;f=(d[c>>0]|0)<<8|(d[c+1>>0]|0);c=b+1|0;e=a[c>>0]|0;a:do if(!(e<<24>>24))c=0;else{e=(d[b>>0]|0)<<8|e&255;while(1){b=e&65535;if((b|0)==(f|0))break;c=c+1|0;e=a[c>>0]|0;if(!(e<<24>>24)){c=0;break a}else e=b<<8|e&255}c=c+-1|0}while(0);return c|0}function si(b,c){b=b|0;c=c|0;var e=0,f=0;f=(d[c+1>>0]|0)<<16|(d[c>>0]|0)<<24|(d[c+2>>0]|0)<<8;e=b+2|0;c=a[e>>0]|0;b=(d[b+1>>0]|0)<<16|(d[b>>0]|0)<<24|(c&255)<<8;c=c<<24>>24==0;if(!((b|0)==(f|0)|c))do{e=e+1|0;c=a[e>>0]|0;b=(b|c&255)<<8;c=c<<24>>24==0}while(!((b|0)==(f|0)|c));return (c?0:e+-2|0)|0}function ti(b,c){b=b|0;c=c|0;var e=0,f=0;f=(d[c+1>>0]|0)<<16|(d[c>>0]|0)<<24|(d[c+2>>0]|0)<<8|(d[c+3>>0]|0);e=b+3|0;c=a[e>>0]|0;b=(d[b+1>>0]|0)<<16|(d[b>>0]|0)<<24|(d[b+2>>0]|0)<<8|c&255;c=c<<24>>24==0;if(!((b|0)==(f|0)|c))do{e=e+1|0;c=a[e>>0]|0;b=b<<8|c&255;c=c<<24>>24==0}while(!((b|0)==(f|0)|c));return (c?0:e+-3|0)|0}function ui(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=ma;ma=ma+1056|0;u=w+1024|0;v=w;c[u>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;c[u+12>>2]=0;c[u+16>>2]=0;c[u+20>>2]=0;c[u+24>>2]=0;c[u+28>>2]=0;f=a[e>>0]|0;a:do if(f<<24>>24){p=0;do{if(!(a[b+p>>0]|0)){f=0;break a}t=f&255;s=u+(t>>>5<<2)|0;c[s>>2]=c[s>>2]|1<<(t&31);p=p+1|0;c[v+(t<<2)>>2]=p;f=a[e+p>>0]|0}while(f<<24>>24!=0);m=p>>>0>1;if(m){k=1;j=1;l=0;i=-1;n=1;while(1){f=a[e+(j+i)>>0]|0;g=a[e+n>>0]|0;do if(f<<24>>24==g<<24>>24)if((j|0)==(k|0)){h=k;f=1;g=k+l|0;break}else{h=k;f=j+1|0;g=l;break}else if((f&255)>(g&255)){h=n-i|0;f=1;g=n;break}else{h=1;f=1;g=l+1|0;i=l;break}while(0);n=f+g|0;if(n>>>0>=p>>>0)break;else{k=h;j=f;l=g}}if(m){m=1;l=1;n=0;g=-1;o=1;while(1){f=a[e+(l+g)>>0]|0;j=a[e+o>>0]|0;do if(f<<24>>24==j<<24>>24)if((l|0)==(m|0)){f=m;j=1;k=m+n|0;break}else{f=m;j=l+1|0;k=n;break}else if((f&255)<(j&255)){f=o-g|0;j=1;k=o;break}else{f=1;j=1;k=n+1|0;g=n;break}while(0);o=j+k|0;if(o>>>0>=p>>>0){t=p;j=25;break}else{m=f;l=j;n=k}}}else{t=p;f=1;g=-1;j=25}}else{h=1;i=-1;t=p;f=1;g=-1;j=25}}else{h=1;i=-1;t=0;f=1;g=-1;j=25}while(0);b:do if((j|0)==25){r=(g+1|0)>>>0>(i+1|0)>>>0;f=r?f:h;r=r?g:i;s=r+1|0;if(!(mi(e,e+f|0,s)|0)){m=t-f|0;q=m;l=f}else{m=t-r+-1|0;m=(r>>>0>m>>>0?r:m)+1|0;q=0;l=m;m=t-m|0}n=t|63;o=t+-1|0;p=(q|0)!=0;f=b;k=0;g=b;while(1){h=f;do if((g-h|0)>>>0<t>>>0){i=zh(g,0,n)|0;if(i)if((i-h|0)>>>0<t>>>0){f=0;break b}else break;else{i=g+n|0;break}}else i=g;while(0);g=d[f+o>>0]|0;c:do if(!(1<<(g&31)&c[u+(g>>>5<<2)>>2])){h=0;g=t}else{g=t-(c[v+(g<<2)>>2]|0)|0;if(g|0){h=0;g=p&(k|0)!=0&g>>>0<l>>>0?m:g;break}j=s>>>0>k>>>0;g=j?s:k;h=a[e+g>>0]|0;d:do if(h<<24>>24){while(1){if(h<<24>>24!=(a[f+g>>0]|0))break;g=g+1|0;h=a[e+g>>0]|0;if(!(h<<24>>24))break d}h=0;g=g-r|0;break c}while(0);if(!j)break b;g=s;while(1){g=g+-1|0;if((a[e+g>>0]|0)!=(a[f+g>>0]|0)){h=q;g=l;break c}if(g>>>0<=k>>>0)break b}}while(0);f=f+g|0;k=h;g=i}}while(0);ma=w;return f|0}function vi(a,b,c){a=a|0;b=b|0;c=c|0;pi(a,b,c)|0;return a|0}function wi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=ma;ma=ma+16|0;f=e;c[f>>2]=d;d=xi(a,b,f)|0;ma=e;return d|0}function xi(a,b,c){a=a|0;b=b|0;c=c|0;return nh(a,2147483647,b,c)|0}function yi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;do if((b|0)!=-1){if((c[d+76>>2]|0)>-1)g=qh(d)|0;else g=0;h=d+4|0;e=c[h>>2]|0;if(!e){ei(d)|0;e=c[h>>2]|0;if(e|0){f=e;i=6}}else{f=e;i=6}if((i|0)==6?f>>>0>((c[d+44>>2]|0)+-8|0)>>>0:0){i=f+-1|0;c[h>>2]=i;a[i>>0]=b;c[d>>2]=c[d>>2]&-17;if(!g)break;rh(d);break}if(g){rh(d);b=-1}else b=-1}else b=-1;while(0);return b|0}function zi(b){b=b|0;var c=0,d=0,e=0;d=(bi(b,43)|0)==0;c=a[b>>0]|0;d=d?c<<24>>24!=114&1:2;e=(bi(b,120)|0)==0;d=e?d:d|128;b=(bi(b,101)|0)==0;b=b?d:d|524288;b=c<<24>>24==114?b:b|64;b=c<<24>>24==119?b|512:b;return (c<<24>>24==97?b|1024:b)|0}function Ai(a){a=a|0;var b=0,d=0;do if(a){if((c[a+76>>2]|0)<=-1){b=Ji(a)|0;break}d=(qh(a)|0)==0;b=Ji(a)|0;if(!d)rh(a)}else{if(!(c[761]|0))b=0;else b=Ai(c[761]|0)|0;a=c[(Ei()|0)>>2]|0;if(a)do{if((c[a+76>>2]|0)>-1)d=qh(a)|0;else d=0;if((c[a+20>>2]|0)>>>0>(c[a+28>>2]|0)>>>0)b=Ji(a)|0|b;if(d|0)rh(a);a=c[a+56>>2]|0}while((a|0)!=0);Fi()}while(0);return b|0}function Bi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i=ma;ma=ma+48|0;h=i+32|0;g=i+16|0;e=i;if(bi(18018,a[d>>0]|0)|0){f=zi(d)|0;c[e>>2]=b;c[e+4>>2]=f|32768;c[e+8>>2]=438;e=eh(T(5,e|0)|0)|0;if((e|0)>=0){if(f&524288|0){c[g>>2]=e;c[g+4>>2]=2;c[g+8>>2]=1;O(221,g|0)|0}b=Hi(e,d)|0;if(!b){c[h>>2]=e;V(6,h|0)|0;b=0}}else b=0}else{c[(fh()|0)>>2]=22;b=0}ma=i;return b|0}function Ci(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;if((c[a+76>>2]|0)>-1)f=qh(a)|0;else f=0;Di(a);g=(c[a>>2]&1|0)!=0;if(!g){e=Ei()|0;d=c[a+52>>2]|0;b=a+56|0;if(d|0)c[d+56>>2]=c[b>>2];b=c[b>>2]|0;if(b|0)c[b+52>>2]=d;if((c[e>>2]|0)==(a|0))c[e>>2]=b;Fi()}b=Ai(a)|0;b=qa[c[a+12>>2]&3](a)|0|b;d=c[a+92>>2]|0;if(d|0)Yg(d);if(g){if(f|0)rh(a)}else Yg(a);return b|0}function Di(a){a=a|0;var b=0;if(c[a+68>>2]|0){b=c[a+116>>2]|0;a=a+112|0;if(b|0)c[b+112>>2]=c[a>>2];a=c[a>>2]|0;if(!a)a=(Gi()|0)+232|0;else a=a+116|0;c[a>>2]=b}return}function Ei(){E(35032);return 35040}function Fi(){X(35032);return}function Gi(){return Ih()|0}function Hi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;k=ma;ma=ma+64|0;j=k+40|0;h=k+24|0;g=k+16|0;f=k;i=k+56|0;if(bi(18018,a[d>>0]|0)|0){e=Xg(1156)|0;if(!e)e=0;else{Jj(e|0,0,124)|0;if(!(bi(d,43)|0))c[e>>2]=(a[d>>0]|0)==114?8:4;if(bi(d,101)|0){c[f>>2]=b;c[f+4>>2]=2;c[f+8>>2]=1;O(221,f|0)|0}if((a[d>>0]|0)==97){c[g>>2]=b;c[g+4>>2]=3;d=O(221,g|0)|0;if(!(d&1024)){c[h>>2]=b;c[h+4>>2]=4;c[h+8>>2]=d|1024;O(221,h|0)|0}f=c[e>>2]|128;c[e>>2]=f}else f=c[e>>2]|0;c[e+60>>2]=b;c[e+44>>2]=e+132;c[e+48>>2]=1024;d=e+75|0;a[d>>0]=-1;if((f&8|0)==0?(c[j>>2]=b,c[j+4>>2]=21523,c[j+8>>2]=i,(U(54,j|0)|0)==0):0)a[d>>0]=10;c[e+32>>2]=3;c[e+36>>2]=1;c[e+40>>2]=2;c[e+12>>2]=1;if(!(c[8740]|0))c[e+76>>2]=-1;Ii(e)|0}}else{c[(fh()|0)>>2]=22;e=0}ma=k;return e|0}function Ii(a){a=a|0;var b=0,d=0;b=Ei()|0;c[a+56>>2]=c[b>>2];d=c[b>>2]|0;if(d|0)c[d+52>>2]=a;c[b>>2]=a;Fi();return a|0}function Ji(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=a+20|0;h=a+28|0;if((c[b>>2]|0)>>>0>(c[h>>2]|0)>>>0?(sa[c[a+36>>2]&7](a,0,0)|0,(c[b>>2]|0)==0):0)a=-1;else{d=a+4|0;e=c[d>>2]|0;f=a+8|0;g=c[f>>2]|0;if(e>>>0<g>>>0)sa[c[a+40>>2]&7](a,e-g|0,1)|0;c[a+16>>2]=0;c[h>>2]=0;c[b>>2]=0;c[f>>2]=0;c[d>>2]=0;a=0}return a|0}function Ki(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=ma;ma=ma+16|0;f=e;c[f>>2]=d;d=oh(a,b,f)|0;ma=e;return d|0}function Li(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;g=j;a:do if(!e)b=0;else{do if(f|0){i=(b|0)==0?g:b;b=a[e>>0]|0;if(b<<24>>24>-1){c[i>>2]=b&255;b=b<<24>>24!=0&1;break a}h=(c[c[(Mi()|0)+188>>2]>>2]|0)==0;b=a[e>>0]|0;if(h){c[i>>2]=b<<24>>24&57343;b=1;break a}b=(b&255)+-194|0;if(b>>>0<=50){g=e+1|0;h=c[48+(b<<2)>>2]|0;if(f>>>0<4?h&-2147483648>>>((f*6|0)+-6|0)|0:0)break;b=d[g>>0]|0;f=b>>>3;if((f+-16|f+(h>>26))>>>0<=7){b=b+-128|h<<6;if((b|0)>=0){c[i>>2]=b;b=2;break a}g=(d[e+2>>0]|0)+-128|0;if(g>>>0<=63){g=g|b<<6;if((g|0)>=0){c[i>>2]=g;b=3;break a}b=(d[e+3>>0]|0)+-128|0;if(b>>>0<=63){c[i>>2]=b|g<<6;b=4;break a}}}}}while(0);c[(fh()|0)>>2]=84;b=-1}while(0);ma=j;return b|0}function Mi(){return Ih()|0}function Ni(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;l=ma;ma=ma+16|0;j=l;k=e&255;a[j>>0]=k;g=b+16|0;h=c[g>>2]|0;if(!h)if(!(Rh(b)|0)){h=c[g>>2]|0;i=4}else f=-1;else i=4;do if((i|0)==4){i=b+20|0;g=c[i>>2]|0;if(g>>>0<h>>>0?(f=e&255,(f|0)!=(a[b+75>>0]|0)):0){c[i>>2]=g+1;a[g>>0]=k;break}if((sa[c[b+36>>2]&7](b,j,1)|0)==1)f=d[j>>0]|0;else f=-1}while(0);ma=l;return f|0}function Oi(a,b){a=a|0;b=b|0;var d=0,e=0;d=ma;ma=ma+16|0;e=d;c[e>>2]=b;b=oh(c[729]|0,a,e)|0;ma=d;return b|0}function Pi(a,b){a=a|0;b=b|0;var c=0;c=$h(a)|0;return ((Qi(a,1,c,b)|0)!=(c|0))<<31>>31|0}function Qi(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=r(d,b)|0;d=(b|0)==0?0:d;if((c[e+76>>2]|0)>-1){g=(qh(e)|0)==0;a=Qh(a,f,e)|0;if(!g)rh(e)}else a=Qh(a,f,e)|0;if((a|0)!=(f|0))d=(a>>>0)/(b>>>0)|0;return d|0}function Ri(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((c[d+76>>2]|0)>=0?(qh(d)|0)!=0:0){f=b&255;e=b&255;if((e|0)!=(a[d+75>>0]|0)?(i=d+20|0,j=c[i>>2]|0,j>>>0<(c[d+16>>2]|0)>>>0):0){c[i>>2]=j+1;a[j>>0]=f}else e=Ni(d,b)|0;rh(d)}else k=3;do if((k|0)==3){f=b&255;e=b&255;if((e|0)!=(a[d+75>>0]|0)?(g=d+20|0,h=c[g>>2]|0,h>>>0<(c[d+16>>2]|0)>>>0):0){c[g>>2]=h+1;a[h>>0]=f;break}e=Ni(d,b)|0}while(0);return e|0}function Si(b){b=b|0;var d=0,e=0,f=0;d=c[665]|0;f=yh(c[(fh()|0)>>2]|0)|0;if((c[d+76>>2]|0)>-1)e=qh(d)|0;else e=0;if(b|0?a[b>>0]|0:0){Qi(b,$h(b)|0,1,d)|0;Ti(58,d)|0;Ti(32,d)|0}Qi(f,$h(f)|0,1,d)|0;Ti(10,d)|0;if(e|0)rh(d);return}function Ti(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((c[d+76>>2]|0)>=0?(qh(d)|0)!=0:0){f=b&255;e=b&255;if((e|0)!=(a[d+75>>0]|0)?(i=d+20|0,j=c[i>>2]|0,j>>>0<(c[d+16>>2]|0)>>>0):0){c[i>>2]=j+1;a[j>>0]=f}else e=Ni(d,b)|0;rh(d)}else k=3;do if((k|0)==3){f=b&255;e=b&255;if((e|0)!=(a[d+75>>0]|0)?(g=d+20|0,h=c[g>>2]|0,h>>>0<(c[d+16>>2]|0)>>>0):0){c[g>>2]=h+1;a[h>>0]=f;break}e=Ni(d,b)|0}while(0);return e|0}function Ui(a){a=a|0;var b=0,e=0,f=0;if((c[a+76>>2]|0)>=0?(qh(a)|0)!=0:0){b=a+4|0;e=c[b>>2]|0;if(e>>>0<(c[a+8>>2]|0)>>>0){c[b>>2]=e+1;b=d[e>>0]|0}else b=di(a)|0;rh(a)}else f=3;do if((f|0)==3){b=a+4|0;e=c[b>>2]|0;if(e>>>0<(c[a+8>>2]|0)>>>0){c[b>>2]=e+1;b=d[e>>0]|0;break}else{b=di(a)|0;break}}while(0);return b|0}function Vi(b){b=b|0;var d=0,e=0,f=0,g=0;f=c[729]|0;if((c[f+76>>2]|0)>-1)g=qh(f)|0;else g=0;do if((Pi(b,f)|0)<0)b=-1;else{if((a[f+75>>0]|0)!=10?(d=f+20|0,e=c[d>>2]|0,e>>>0<(c[f+16>>2]|0)>>>0):0){c[d>>2]=e+1;a[e>>0]=10;b=0;break}b=(Ni(f,10)|0)>>31}while(0);if(g|0)rh(f);return b|0}function Wi(a){a=a|0;var b=0,e=0;b=a+4|0;e=c[b>>2]|0;if(e>>>0<(c[a+8>>2]|0)>>>0){c[b>>2]=e+1;a=d[e>>0]|0}else a=di(a)|0;return a|0}function Xi(a){a=a|0;var b=0;if((c[a+76>>2]|0)>-1){b=(qh(a)|0)==0;a=(c[a>>2]|0)>>>4&1}else a=(c[a>>2]|0)>>>4&1;return a|0}function Yi(a){a=a|0;var b=0,d=0,e=0;if(Zi(a)|0){b=a+76|0;d=a+80|0;do{e=c[b>>2]|0;if(e|0)Y(b|0,d|0,e|0,1)}while((Zi(a)|0)!=0)}return}function Zi(a){a=a|0;var b=0,d=0,e=0;b=Gi()|0;d=c[b+52>>2]|0;e=a+76|0;if((c[e>>2]|0)==(d|0)){b=a+68|0;d=c[b>>2]|0;if((d|0)==2147483647)b=-1;else{c[b>>2]=d+1;b=0}}else{if((c[e>>2]|0)<0)c[e>>2]=0;if(!(c[e>>2]|0)){_i(e,d);c[a+68>>2]=1;c[a+112>>2]=0;b=b+232|0;d=c[b>>2]|0;c[a+116>>2]=d;if(d|0)c[d+112>>2]=a;c[b>>2]=a;b=0}else b=-1}return b|0}function _i(a,b){a=a|0;b=b|0;if(!(c[a>>2]|0))c[a>>2]=b;return}function $i(a){a=a|0;var b=0,d=0;b=a+68|0;d=c[b>>2]|0;if((d|0)==1){Di(a);c[b>>2]=0;rh(a)}else c[b>>2]=d+-1;return}function aj(a){a=a|0;var b=0,d=0,f=0,g=0,h=0,i=0,j=0;j=ma;ma=ma+16|0;f=j;h=a+8|0;d=c[h>>2]|0;g=a+12|0;a:do if((d|0)<(c[g>>2]|0)){b=a+24+d|0;i=7}else{b=a+24|0;c[f>>2]=c[a>>2];c[f+4>>2]=b;c[f+8>>2]=2048;d=N(220,f|0)|0;if((d|0)>=1){c[g>>2]=d;c[h>>2]=0;d=0;i=7;break}switch(d|0){case 0:case -2:{b=0;break a}default:{}}c[(fh()|0)>>2]=0-d;b=0}while(0);if((i|0)==7){c[h>>2]=d+(e[b+8>>1]|0);c[a+4>>2]=c[b+4>>2]}ma=j;return b|0}function bj(a){a=a|0;var b=0,d=0,e=0;e=ma;ma=ma+16|0;d=e+8|0;b=ji(a,589824,e)|0;do if((b|0)>=0){a=Zg(1,2072)|0;if(!a){c[d>>2]=b;V(6,d|0)|0;a=0;break}else{c[a>>2]=b;break}}else a=0;while(0);ma=e;return a|0}function cj(a){a=a|0;var b=0;b=dj(c[a>>2]|0)|0;Yg(a);return b|0}function dj(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=gh(a)|0;a=V(6,d|0)|0;a=eh((a|0)==-4?0:a)|0;ma=b;return a|0}function ej(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=ma;ma=ma+16|0;f=e;c[f>>2]=a;c[f+4>>2]=b;c[f+8>>2]=d;d=eh(W(85,f|0)|0)|0;ma=e;return d|0}function fj(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;a=eh(R(41,d|0)|0)|0;ma=b;return a|0}function gj(a){a=a|0;var b=0,d=0;b=ma;ma=ma+16|0;d=b;c[d>>2]=a;a=eh(S(42,d|0)|0)|0;ma=b;return a|0}function hj(){var a=0,b=0;b=ma;ma=ma+16|0;a=M(20,b|0)|0;ma=b;return a|0}function ij(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=ma;ma=ma+16|0;f=e;c[f>>2]=a;c[f+4>>2]=b;c[f+8>>2]=d;d=eh(P(3,f|0)|0)|0;ma=e;return d|0}function jj(a,b){a=a|0;b=b|0;var d=0,e=0;d=ma;ma=ma+16|0;e=d;c[e>>2]=a;c[e+4>>2]=b;b=eh(Q(33,e|0)|0)|0;ma=d;return b|0}function kj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=ma;ma=ma+4112|0;e=g+4096|0;d=g;if(a)if(!b){c[(fh()|0)>>2]=22;a=0}else f=4;else{b=4096;a=d;f=4}if((f|0)==4){c[e>>2]=a;c[e+4>>2]=b;if((eh(J(183,e|0)|0)|0)>=0){if((a|0)==(d|0))a=li(d)|0}else a=0}ma=g;return a|0}function lj(b){b=b|0;var c=0,d=0,e=0,f=0,g=0;while(1){e=b+1|0;if(!(ci(a[b>>0]|0)|0))break;else b=e}d=a[b>>0]|0;switch(d|0){case 45:{b=1;f=5;break}case 43:{b=0;f=5;break}default:{g=0;c=b;b=d}}if((f|0)==5){g=b;c=e;b=a[e>>0]|0}if(!(lh(b)|0))b=0;else{b=0;do{b=(b*10|0)+48-(a[c>>0]|0)|0;c=c+1|0}while((lh(a[c>>0]|0)|0)!=0)}return ((g|0)==0?0-b|0:b)|0}function mj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=c[665]|0;b=hi(b)|0;Yi(f);if(((Pi(a,f)|0)>-1?Qi(b,$h(b)|0,1,f)|0:0)?(Qi(d,1,e,f)|0)==(e|0):0)Ri(10,f)|0;$i(f);return}function nj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;o=ma;ma=ma+16|0;l=o+4|0;m=o;f=c[762]|0;if((f|0)==0|0!=0){c[8756]=0;c[762]=1;h=1}else h=f;a:do if((h|0)<(b|0)?(i=c[d+(h<<2)>>2]|0,g=i,(i|0)!=0):0){if((a[i>>0]|0)!=45){if((a[e>>0]|0)!=45){f=-1;break}c[762]=h+1;c[8757]=g;f=1;break}f=i+1|0;switch(a[f>>0]|0){case 0:{f=-1;break a}case 45:{if(!(a[i+2>>0]|0)){c[762]=h+1;f=-1;break a}break}default:{}}g=c[8756]|0;if(!g)c[8756]=1;else f=i+g|0;f=Li(l,f,4)|0;if((f|0)<0){c[l>>2]=65533;j=1}else j=f;f=c[762]|0;h=c[d+(f<<2)>>2]|0;i=c[8756]|0;k=h+i|0;i=i+j|0;c[8756]=i;if(!(a[h+i>>0]|0)){c[762]=f+1;c[8756]=0}switch(a[e>>0]|0){case 43:case 45:{e=e+1|0;break}default:{}}c[m>>2]=0;i=0;do{p=Li(m,e+i|0,4)|0;i=((p|0)>1?p:1)+i|0;f=c[m>>2]|0;g=c[l>>2]|0;h=(f|0)==(g|0);if(!p){n=24;break}}while(!h);if((n|0)==24)if(h)f=g;else{if(!((a[e>>0]|0)!=58&1!=0)){f=63;break}mj(c[d>>2]|0,18091,k,j);f=63;break}if((a[e+i>>0]|0)==58){h=e+(i+1)|0;do if((a[h>>0]|0)==58){c[8757]=0;g=c[8756]|0;if(!((a[h>>0]|0)!=58|(g|0)!=0))break a}else{if((c[762]|0)<(b|0)){g=c[8756]|0;break}if((a[e>>0]|0)==58){f=58;break a}if(!1){f=63;break a}mj(c[d>>2]|0,18059,k,j);f=63;break a}while(0);p=c[762]|0;c[762]=p+1;c[8757]=(c[d+(p<<2)>>2]|0)+g;c[8756]=0}}else f=-1;while(0);ma=o;return f|0}function oj(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0;i=c[762]|0;if((i|0)==0|0!=0){c[8756]=0;c[762]=1;l=1}else l=i;a:do if((l|0)<(b|0)?(j=c[d+(l<<2)>>2]|0,(j|0)!=0):0){switch(a[e>>0]|0){case 45:case 43:{i=pj(b,d,e,f,g,h)|0;break a}default:{}}k=l;while(1){if((a[j>>0]|0)==45?a[j+1>>0]|0:0)break;i=k+1|0;if((i|0)>=(b|0)){i=-1;break a}j=c[d+(i<<2)>>2]|0;if(!j){i=-1;break a}else k=i}c[762]=k;i=pj(b,d,e,f,g,h)|0;if((k|0)>(l|0)){j=c[762]|0;k=j-k|0;if((k|0)>0?(qj(d,l,j+-1|0),(k|0)!=1):0){j=1;do{qj(d,l,(c[762]|0)+-1|0);j=j+1|0}while((j|0)!=(k|0))}c[762]=k+l}}else i=-1;while(0);return i|0}function pj(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;c[8757]=0;a:do if((f|0)!=0?(u=c[762]|0,s=c[d+(u<<2)>>2]|0,(a[s>>0]|0)==45):0){i=a[s+1>>0]|0;if(!h){if(i<<24>>24!=45){v=35;break}if(!(a[s+2>>0]|0)){v=35;break}else i=45}else if(!(i<<24>>24)){v=35;break}t=a[e>>0]|0;t=(a[e+((t<<24>>24==43|t<<24>>24==45)&1)>>0]|0)==58;j=c[f>>2]|0;if(j){q=i<<24>>24==45?s+2|0:s+1|0;p=a[q>>0]|0;o=0;h=0;m=0;b:while(1){r=a[j>>0]|0;k=r<<24>>24==0;if(r<<24>>24==p<<24>>24&(k^1)){k=q;do{j=j+1|0;k=k+1|0;r=a[j>>0]|0;l=r<<24>>24==0;n=a[k>>0]|0}while(r<<24>>24==n<<24>>24&(l^1));r=k;k=l;j=n}else{r=q;j=p}switch(j<<24>>24){case 61:case 0:{if(k){h=1;break b}else{k=m;h=h+1|0}break}default:k=o}m=m+1|0;j=c[f+(m<<4)>>2]|0;if(!j){m=k;break}else o=k}if((h|0)==1){h=u+1|0;c[762]=h;j=f+(m<<4)|0;k=f+(m<<4)+12|0;i=c[k>>2]|0;l=c[f+(m<<4)+4>>2]|0;do if((a[r>>0]|0)!=61){if((l|0)==1){s=c[d+(h<<2)>>2]|0;c[8757]=s;if(s|0){c[762]=u+2;break}if(t){i=58;break a}if(!1){i=63;break a}u=c[d>>2]|0;i=c[j>>2]|0;mj(u,18059,i,$h(i)|0);i=63;break a}}else{if(l|0){c[8757]=r+1;break}if(!(1!=0&(t^1))){i=63;break a}u=c[d>>2]|0;i=c[j>>2]|0;mj(u,18022,i,$h(i)|0);i=63;break a}while(0);if(g){c[g>>2]=m;i=c[k>>2]|0}h=c[f+(m<<4)+8>>2]|0;if(!h)break;c[h>>2]=i;i=0;break}}else h=0;if(i<<24>>24==45){i=s+2|0;if(1!=0&(t^1)){u=c[d>>2]|0;mj(u,(h|0)==0?18091:18115,i,$h(i)|0);i=c[762]|0}else i=u;c[762]=i+1;i=63}else v=35}else v=35;while(0);if((v|0)==35)i=nj(b,d,e)|0;return i|0}function qj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+(d<<2)>>2]|0;if((d|0)>(b|0))do{f=d;d=d+-1|0;c[a+(f<<2)>>2]=c[a+(d<<2)>>2]}while((d|0)>(b|0));c[a+(b<<2)>>2]=e;return}function rj(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return oj(a,b,c,d,e,1)|0}function sj(){D(35044);return}function tj(){return 35044}function uj(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;e=b&65535;c=r(e,f)|0;d=a>>>16;a=(c>>>16)+(r(e,d)|0)|0;e=b>>>16;b=r(e,f)|0;return (u((a>>>16)+(r(e,d)|0)+(((a&65535)+b|0)>>>16)|0),a+b<<16|c&65535|0)|0}function vj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;c=uj(e,f)|0;a=v()|0;return (u((r(b,f)|0)+(r(d,e)|0)+a|a&0|0),c|0|0)|0}function wj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return (u(b+d+(c>>>0<a>>>0|0)>>>0|0),c|0)|0}function xj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;d=b-d-(c>>>0>a>>>0|0)>>>0;return (u(d|0),a-c>>>0|0)|0}function yj(a){a=a|0;return (a?31-(s(a^a-1)|0)|0:32)|0}function zj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;l=a;j=b;k=j;h=d;n=e;i=n;if(!k){g=(f|0)!=0;if(!i){if(g){c[f>>2]=(l>>>0)%(h>>>0);c[f+4>>2]=0}n=0;f=(l>>>0)/(h>>>0)>>>0;return (u(n|0),f)|0}else{if(!g){n=0;f=0;return (u(n|0),f)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;f=0;return (u(n|0),f)|0}}g=(i|0)==0;do if(h){if(!g){g=(s(i|0)|0)-(s(k|0)|0)|0;if(g>>>0<=31){m=g+1|0;i=31-g|0;b=g-31>>31;h=m;a=l>>>(m>>>0)&b|k<<i;b=k>>>(m>>>0)&b;g=0;i=l<<i;break}if(!f){n=0;f=0;return (u(n|0),f)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;n=0;f=0;return (u(n|0),f)|0}g=h-1|0;if(g&h|0){i=(s(h|0)|0)+33-(s(k|0)|0)|0;p=64-i|0;m=32-i|0;j=m>>31;o=i-32|0;b=o>>31;h=i;a=m-1>>31&k>>>(o>>>0)|(k<<m|l>>>(i>>>0))&b;b=b&k>>>(i>>>0);g=l<<p&j;i=(k<<p|l>>>(o>>>0))&j|l<<m&i-33>>31;break}if(f|0){c[f>>2]=g&l;c[f+4>>2]=0}if((h|0)==1){o=j|b&0;p=a|0|0;return (u(o|0),p)|0}else{p=yj(h|0)|0;o=k>>>(p>>>0)|0;p=k<<32-p|l>>>(p>>>0)|0;return (u(o|0),p)|0}}else{if(g){if(f|0){c[f>>2]=(k>>>0)%(h>>>0);c[f+4>>2]=0}o=0;p=(k>>>0)/(h>>>0)>>>0;return (u(o|0),p)|0}if(!l){if(f|0){c[f>>2]=0;c[f+4>>2]=(k>>>0)%(i>>>0)}o=0;p=(k>>>0)/(i>>>0)>>>0;return (u(o|0),p)|0}g=i-1|0;if(!(g&i)){if(f|0){c[f>>2]=a|0;c[f+4>>2]=g&k|b&0}o=0;p=k>>>((yj(i|0)|0)>>>0);return (u(o|0),p)|0}g=(s(i|0)|0)-(s(k|0)|0)|0;if(g>>>0<=30){b=g+1|0;i=31-g|0;h=b;a=k<<i|l>>>(b>>>0);b=k>>>(b>>>0);g=0;i=l<<i;break}if(!f){o=0;p=0;return (u(o|0),p)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;o=0;p=0;return (u(o|0),p)|0}while(0);if(!h){k=i;j=0;i=0}else{m=d|0|0;l=n|e&0;k=wj(m|0,l|0,-1,-1)|0;d=v()|0;j=i;i=0;do{e=j;j=g>>>31|j<<1;g=i|g<<1;e=a<<1|e>>>31|0;n=a>>>31|b<<1|0;xj(k|0,d|0,e|0,n|0)|0;p=v()|0;o=p>>31|((p|0)<0?-1:0)<<1;i=o&1;a=xj(e|0,n|0,o&m|0,(((p|0)<0?-1:0)>>31|((p|0)<0?-1:0)<<1)&l|0)|0;b=v()|0;h=h-1|0}while((h|0)!=0);k=j;j=0}h=0;if(f|0){c[f>>2]=a;c[f+4>>2]=b}o=(g|0)>>>31|(k|h)<<1|(h<<1|g>>>31)&0|j;p=(g<<1|0>>>31)&-2|i;return (u(o|0),p)|0}function Aj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return zj(a,b,c,d,0)|0}function Bj(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){u(b>>>c|0);return a>>>c|(b&(1<<c)-1)<<32-c}u(0);return b>>>c-32|0}function Cj(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){u(b<<c|(a&(1<<c)-1<<32-c)>>>32-c|0);return a<<c}u(a<<c-32|0);return 0}function Dj(a){a=a|0;return (a&255)<<24|(a>>8&255)<<16|(a>>16&255)<<8|a>>>24|0}function Ej(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;l=l+1|0;c[a>>2]=l;while((f|0)<(e|0)){if(!(c[d+(f<<3)>>2]|0)){c[d+(f<<3)>>2]=l;c[d+((f<<3)+4)>>2]=b;c[d+((f<<3)+8)>>2]=0;u(e|0);return d|0}f=f+1|0}e=e*2|0;d=_g(d|0,8*(e+1|0)|0)|0;d=Ej(a|0,b|0,d|0,e|0)|0;u(e|0);return d|0}function Fj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;while((f|0)<(d|0)){e=c[b+(f<<3)>>2]|0;if(!e)break;if((e|0)==(a|0))return c[b+((f<<3)+4)>>2]|0;f=f+1|0}return 0}function Gj(a,b){a=a|0;b=b|0;if(!j){j=a;k=b}}function Hj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((e|0)>=8192){$(b|0,d|0,e|0)|0;return b|0}h=b|0;g=b+e|0;if((b&3)==(d&3)){while(b&3){if(!e)return h|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}e=g&-4|0;f=e-64|0;while((b|0)<=(f|0)){c[b>>2]=c[d>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];c[b+12>>2]=c[d+12>>2];c[b+16>>2]=c[d+16>>2];c[b+20>>2]=c[d+20>>2];c[b+24>>2]=c[d+24>>2];c[b+28>>2]=c[d+28>>2];c[b+32>>2]=c[d+32>>2];c[b+36>>2]=c[d+36>>2];c[b+40>>2]=c[d+40>>2];c[b+44>>2]=c[d+44>>2];c[b+48>>2]=c[d+48>>2];c[b+52>>2]=c[d+52>>2];c[b+56>>2]=c[d+56>>2];c[b+60>>2]=c[d+60>>2];b=b+64|0;d=d+64|0}while((b|0)<(e|0)){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0}}else{e=g-4|0;while((b|0)<(e|0)){a[b>>0]=a[d>>0]|0;a[b+1>>0]=a[d+1>>0]|0;a[b+2>>0]=a[d+2>>0]|0;a[b+3>>0]=a[d+3>>0]|0;b=b+4|0;d=d+4|0}}while((b|0)<(g|0)){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0}return h|0}function Ij(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b>>0]=a[c>>0]|0}b=e}else Hj(b,c,d)|0;return b|0}function Jj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=b+e|0;d=d&255;if((e|0)>=67){while(b&3){a[b>>0]=d;b=b+1|0}f=h&-4|0;i=d|d<<8|d<<16|d<<24;g=f-64|0;while((b|0)<=(g|0)){c[b>>2]=i;c[b+4>>2]=i;c[b+8>>2]=i;c[b+12>>2]=i;c[b+16>>2]=i;c[b+20>>2]=i;c[b+24>>2]=i;c[b+28>>2]=i;c[b+32>>2]=i;c[b+36>>2]=i;c[b+40>>2]=i;c[b+44>>2]=i;c[b+48>>2]=i;c[b+52>>2]=i;c[b+56>>2]=i;c[b+60>>2]=i;b=b+64|0}while((b|0)<(f|0)){c[b>>2]=i;b=b+4|0}}while((b|0)<(h|0)){a[b>>0]=d;b=b+1|0}return h-e|0}function Kj(a){a=a|0;var b=0,d=0;d=c[i>>2]|0;b=d+a|0;if((a|0)>0&(b|0)<(d|0)|(b|0)<0){la(b|0)|0;F(12);return -1}if((b|0)>(_()|0)){if(!(aa(b|0)|0)){F(12);return -1}}else c[i>>2]=b;return d|0}function Lj(a){a=a|0;return pa[a&1]()|0}function Mj(a,b){a=a|0;b=b|0;return qa[a&3](b|0)|0}function Nj(a,b,c){a=a|0;b=b|0;c=c|0;return ra[a&3](b|0,c|0)|0}function Oj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return sa[a&7](b|0,c|0,d|0)|0}function Pj(a){a=a|0;ta[a&15]()}function Qj(a,b){a=a|0;b=b|0;ua[a&3](b|0)}function Rj(){t(0);return 0}function Sj(a){a=a|0;t(1);return 0}function Tj(a,b){a=a|0;b=b|0;t(2);return 0}function Uj(a,b,c){a=a|0;b=b|0;c=c|0;t(3);return 0}function Vj(){t(4)}function Wj(a){a=a|0;t(5)}

// EMSCRIPTEN_END_FUNCS
var pa=[Rj,rc];var qa=[Sj,bh,yg,Ga];var ra=[Tj,Pi,Xf,Gf];var sa=[Uj,ch,dh,hh,ih,Sh,Ki,Uj];var ta=[Vj,Td,Ud,Vd,Qa,Ra,Dd,Ed,Fd,Sd,Ya,Rb,Ea,Vj,Vj,Vj];var ua=[Wj,fe,ie,Wj];return{___emscripten_environ_constructor:sj,___errno_location:fh,___muldi3:vj,___udivdi3:Aj,__get_environ:tj,_bitshift64Lshr:Bj,_bitshift64Shl:Cj,_free:Yg,_i64Add:wj,_i64Subtract:xj,_llvm_bswap_i32:Dj,_main:Zd,_malloc:Xg,_memcpy:Hj,_memmove:Ij,_memset:Jj,_realloc:_g,_saveSetjmp:Ej,_sbrk:Kj,_setThrew:Gj,_testSetjmp:Fj,dynCall_i:Lj,dynCall_ii:Mj,dynCall_iii:Nj,dynCall_iiii:Oj,dynCall_v:Pj,dynCall_vi:Qj,establishStackSpace:ya,stackAlloc:va,stackRestore:xa,stackSave:wa}})


// EMSCRIPTEN_END_ASM
(asmGlobalArg, asmLibraryArg, buffer);

var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = asm["___emscripten_environ_constructor"];

var ___errno_location = Module["___errno_location"] = asm["___errno_location"];

var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];

var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];

var __get_environ = Module["__get_environ"] = asm["__get_environ"];

var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];

var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];

var _free = Module["_free"] = asm["_free"];

var _i64Add = Module["_i64Add"] = asm["_i64Add"];

var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];

var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];

var _main = Module["_main"] = asm["_main"];

var _malloc = Module["_malloc"] = asm["_malloc"];

var _memcpy = Module["_memcpy"] = asm["_memcpy"];

var _memmove = Module["_memmove"] = asm["_memmove"];

var _memset = Module["_memset"] = asm["_memset"];

var _realloc = Module["_realloc"] = asm["_realloc"];

var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];

var _sbrk = Module["_sbrk"] = asm["_sbrk"];

var _setThrew = Module["_setThrew"] = asm["_setThrew"];

var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];

var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];

var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];

var stackRestore = Module["stackRestore"] = asm["stackRestore"];

var stackSave = Module["stackSave"] = asm["stackSave"];

var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];

var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];

var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];

var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];

var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];

var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];

Module["asm"] = asm;

Module["getMemory"] = getMemory;

Module["addRunDependency"] = addRunDependency;

Module["removeRunDependency"] = removeRunDependency;

Module["FS_createFolder"] = FS.createFolder;

Module["FS_createPath"] = FS.createPath;

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

Module["FS_createLazyFile"] = FS.createLazyFile;

Module["FS_createLink"] = FS.createLink;

Module["FS_createDevice"] = FS.createDevice;

Module["FS_unlink"] = FS.unlink;

if (memoryInitializer) {
 if (!isDataURI(memoryInitializer)) {
  memoryInitializer = locateFile(memoryInitializer);
 }
 if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
  var data = Module["readBinary"](memoryInitializer);
  HEAPU8.set(data, GLOBAL_BASE);
 } else {
  addRunDependency("memory initializer");
  var applyMemoryInitializer = function(data) {
   if (data.byteLength) data = new Uint8Array(data);
   HEAPU8.set(data, GLOBAL_BASE);
   if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
   removeRunDependency("memory initializer");
  };
  var doBrowserLoad = function() {
   Module["readAsync"](memoryInitializer, applyMemoryInitializer, function() {
    throw "could not load memory initializer " + memoryInitializer;
   });
  };
  var memoryInitializerBytes = tryParseAsDataURI(memoryInitializer);
  if (memoryInitializerBytes) {
   applyMemoryInitializer(memoryInitializerBytes.buffer);
  } else if (Module["memoryInitializerRequest"]) {
   var useRequest = function() {
    var request = Module["memoryInitializerRequest"];
    var response = request.response;
    if (request.status !== 200 && request.status !== 0) {
     var data = tryParseAsDataURI(Module["memoryInitializerRequestURL"]);
     if (data) {
      response = data.buffer;
     } else {
      console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
      doBrowserLoad();
      return;
     }
    }
    applyMemoryInitializer(response);
   };
   if (Module["memoryInitializerRequest"].response) {
    setTimeout(useRequest, 0);
   } else {
    Module["memoryInitializerRequest"].addEventListener("load", useRequest);
   }
  } else {
   doBrowserLoad();
  }
 }
}

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

ExitStatus.prototype = new Error();

ExitStatus.prototype.constructor = ExitStatus;

var calledMain = false;

dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};

Module["callMain"] = function callMain(args) {
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 var argv = stackAlloc((argc + 1) * 4);
 HEAP32[argv >> 2] = allocateUTF8OnStack(Module["thisProgram"]);
 for (var i = 1; i < argc; i++) {
  HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
 }
 HEAP32[(argv >> 2) + argc] = 0;
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   var toLog = e;
   if (e && typeof e === "object" && e.stack) {
    toLog = [ e, e.stack ];
   }
   err("exception thrown: " + toLog);
   Module["quit"](1, e);
  }
 } finally {
  calledMain = true;
 }
};

function run(args) {
 args = args || Module["arguments"];
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (Module["_main"] && shouldRunNow) Module["callMain"](args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

Module["run"] = run;

function exit(status, implicit) {
 if (implicit && Module["noExitRuntime"] && status === 0) {
  return;
 }
 if (Module["noExitRuntime"]) {} else {
  ABORT = true;
  EXITSTATUS = status;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 Module["quit"](status, new ExitStatus(status));
}

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 if (what !== undefined) {
  out(what);
  err(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
}

Module["abort"] = abort;

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

var shouldRunNow = false;

if (Module["noInitialRun"]) {
 shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

self["postMessage"](JSON.stringify({
 "command": "ready"
}));

Module["calledRun"] = false;

Module["thisProgram"] = "/bibtex";

FS.createDataFile("/", Module["thisProgram"], "dummy for kpathsea", true, true);

