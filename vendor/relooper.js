// Relooper, (C) 2012 Alon Zakai, MIT license, https://github.com/kripken/Relooper
var Relooper = (function() {
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 52428800;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
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
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 1892;
assert(STATICTOP < TOTAL_MEMORY);
__ATINIT__ = __ATINIT__.concat([
  { func: function() { __GLOBAL__I_a() } }
]);
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
var __ZTISt9exception;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,232,6,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,244,6,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33,68,101,102,97,117,108,116,84,97,114,103,101,116,0,0,108,97,98,101,108,32,61,32,48,59,10,0,66,114,97,110,99,104,101,115,79,117,116,46,102,105,110,100,40,84,97,114,103,101,116,41,32,61,61,32,66,114,97,110,99,104,101,115,79,117,116,46,101,110,100,40,41,0,0,0,114,101,108,111,111,112,101,114,47,82,101,108,111,111,112,101,114,46,99,112,112,0,0,0,37,115,59,10,0,0,0,0,99,111,110,116,105,110,117,101,0,0,0,0,119,114,105,116,116,101,110,32,60,32,108,101,102,116,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,110,101,101,100,101,100,32,60,32,108,101,102,116,0,0,0,79,117,116,112,117,116,66,117,102,102,101,114,32,43,32,73,110,100,101,110,116,101,114,58,58,67,117,114,114,73,110,100,101,110,116,42,50,32,45,32,79,117,116,112,117,116,66,117,102,102,101,114,82,111,111,116,32,60,32,79,117,116,112,117,116,66,117,102,102,101,114,83,105,122,101,0,79,117,116,112,117,116,66,117,102,102,101,114,0,0,0,0,73,110,110,101,114,66,108,111,99,107,115,46,115,105,122,101,40,41,32,62,32,48,0,0,76,111,111,112,83,116,97,99,107,46,115,105,122,101,40,41,32,62,32,48,0,0,0,0,98,114,101,97,107,0,0,0,119,104,105,108,101,40,49,41,32,123,10,0,76,37,100,58,32,119,104,105,108,101,40,49,41,32,123,10,0,0,0,0,37,115,105,102,32,40,108,97,98,101,108,32,61,61,32,37,100,41,32,123,10,0,0,0,101,108,115,101,32,0,0,0,37,115,105,102,32,40,40,108,97,98,101,108,124,48,41,32,61,61,32,37,100,41,32,123,10,0,0,0,125,32,119,104,105,108,101,40,48,41,59,10,0,0,0,0,100,111,32,123,10,0,0,0,37,115,10,0,76,37,100,58,32,100,111,32,123,10,0,0,125,10,0,0,125,32,101,108,115,101,32,123,10,0,0,0,37,115,32,76,37,100,59,10,0,0,0,0,125,32,101,108,115,101,32,105,102,32,40,37,115,41,32,123,10,0,0,0,105,102,32,40,37,115,41,32,123,10,0,0,0,0,0,0,33,40,0,0,32,38,38,32,0,0,0,0,125,32,101,108,115,101,32,0,37,115,105,102,32,40,37,115,41,32,123,10,0,0,0,0,68,101,116,97,105,108,115,45,62,67,111,110,100,105,116,105,111,110,0,0,68,101,102,97,117,108,116,84,97,114,103,101,116,0,0,0,108,97,98,101,108,32,61,32,37,100,59,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,104,97,112,101,32,42,82,101,108,111,111,112,101,114,58,58,67,97,108,99,117,108,97,116,101,40,66,108,111,99,107,32,42,41,58,58,65,110,97,108,121,122,101,114,58,58,77,97,107,101,76,111,111,112,40,66,108,111,99,107,83,101,116,32,38,44,32,66,108,111,99,107,83,101,116,32,38,44,32,66,108,111,99,107,83,101,116,32,38,41,0,118,111,105,100,32,82,101,108,111,111,112,101,114,58,58,67,97,108,99,117,108,97,116,101,40,66,108,111,99,107,32,42,41,58,58,80,111,115,116,79,112,116,105,109,105,122,101,114,58,58,70,105,110,100,76,97,98,101,108,101,100,76,111,111,112,115,40,83,104,97,112,101,32,42,41,0,118,111,105,100,32,66,108,111,99,107,58,58,82,101,110,100,101,114,40,98,111,111,108,41,0,0,0,0,118,111,105,100,32,66,108,111,99,107,58,58,65,100,100,66,114,97,110,99,104,84,111,40,66,108,111,99,107,32,42,44,32,99,111,110,115,116,32,99,104,97,114,32,42,44,32,99,111,110,115,116,32,99,104,97,114,32,42,41,0,0,0,0,118,111,105,100,32,80,114,105,110,116,73,110,100,101,110,116,101,100,40,99,111,110,115,116,32,99,104,97,114,32,42,44,32,46,46,46,41,0,0,0,118,111,105,100,32,80,117,116,73,110,100,101,110,116,101,100,40,99,111,110,115,116,32,99,104,97,114,32,42,41,0,0,0,0,0,0,220,6,80,0,38,0,0,0,6,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,7,80,0,2,0,0,0,22,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,32,7,80,0,36,0,0,0,50,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,56,7,80,0,30,0,0,0,32,0,0,0,20,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,57,76,111,111,112,83,104,97,112,101,0,0,53,83,104,97,112,101,0,0,49,51,77,117,108,116,105,112,108,101,83,104,97,112,101,0,49,50,76,97,98,101,108,101,100,83,104,97,112,101,0,0,49,49,83,105,109,112,108,101,83,104,97,112,101,0,0,0,0,0,0,0,0,6,80,0,0,0,0,0,16,6,80,0,0,0,0,0,0,0,0,0,32,6,80,0,244,6,80,0,0,0,0,0,72,6,80,0,0,7,80,0,0,0,0,0,108,6,80,0,212,6,80,0,0,0,0,0,144,6,80,0,44,7,80,0,0,0,0,0,156,6,80,0,0,0,0,0,164,6,80,0,44,7,80,0,0,0,0,0,180,6,80,0,24,7,80,0,0,0,0,0,196,6,80,0,24,7,80,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(8))>>2)]=(40);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(12))>>2)]=(44);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(16))>>2)]=(34);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(20))>>2)]=(46);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(24))>>2)]=(24);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(28))>>2)]=(26);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(32))>>2)]=(14);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(36))>>2)]=(52);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(8))>>2)]=(8);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(12))>>2)]=(10);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(16))>>2)]=(34);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(20))>>2)]=(46);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(24))>>2)]=(24);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(28))>>2)]=(4);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(32))>>2)]=(28);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(36))>>2)]=(42);
HEAP32[((5244628)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5244636)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244644)>>2)]=__ZTISt9exception;
HEAP32[((5244648)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244660)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244672)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244684)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244696)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5244704)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244716)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5244728)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
}
if (!awaitingMemoryInitializer) runPostSets();
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      _memcpy(newStr, ptr, len);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function ___gxx_personality_v0() {
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function ___cxa_free_exception(ptr) {
      return _free(ptr);
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      __THREW__ = 0;
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num);
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while ((HEAP8[(((psrc)+(i-1))|0)])|0 != 0);
      return pdest|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],HEAPF64[(tempDoublePtr)>>3]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*') || nullString;
              var argLength = _strlen(arg);
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              for (var i = 0; i < argLength; i++) {
                ret.push(HEAPU8[((arg++)|0)]);
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }var _vsnprintf=_snprintf;
  function _llvm_va_end() {}
  function __ZNSt9exceptionD2Ev(){}
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i64=_memset;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
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
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
___setErrNo(0);
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
var FUNCTION_TABLE = [0,0,__ZN9LoopShapeD1Ev,0,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNSt9bad_allocD0Ev,0,__ZN10__cxxabiv117__class_type_infoD1Ev,0,__ZN10__cxxabiv117__class_type_infoD0Ev
,0,__ZNKSt9bad_alloc4whatEv,0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZN13MultipleShape6RenderEb,0,__ZN9LoopShape6RenderEb,0,__ZN11SimpleShape6RenderEb
,0,__ZN9LoopShapeD0Ev,0,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZN11SimpleShapeD1Ev
,0,__ZN11SimpleShapeD0Ev,0,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,0,__ZN13MultipleShapeD1Ev,0,__ZNSt9bad_allocD1Ev,0,__ZN10__cxxabiv120__si_class_type_infoD1Ev
,0,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZN10__cxxabiv120__si_class_type_infoD0Ev,0,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,0,__ZNSt3__13mapIPviNS_4lessIS1_EENS_9allocatorINS_4pairIKS1_iEEEEED1Ev,0,__ZN13MultipleShapeD0Ev,0,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0];
// EMSCRIPTEN_START_FUNCS
function __ZN5BlockD2Ev(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=r1>>2;r3=HEAP32[r2+14];if((r3|0)!=0){_free(r3)}r3=r1+36|0;r4=HEAP32[r3>>2];r5=r1+40|0;L4:do{if((r4|0)!=(r5|0)){r6=r4;while(1){r7=HEAP32[r6+20>>2];if((r7|0)!=0){r8=HEAP32[r7+12>>2];if((r8|0)!=0){_free(r8)}r8=HEAP32[r7+16>>2];if((r8|0)!=0){_free(r8)}__ZdlPv(r7)}r7=HEAP32[r6+4>>2];L16:do{if((r7|0)==0){r8=r6|0;while(1){r9=HEAP32[r8+8>>2];if((r8|0)==(HEAP32[r9>>2]|0)){r10=r9;break L16}else{r8=r9}}}else{r8=r7;while(1){r9=HEAP32[r8>>2];if((r9|0)==0){r10=r8;break L16}else{r8=r9}}}}while(0);if((r10|0)==(r5|0)){break L4}else{r6=r10}}}}while(0);r10=r1+24|0;r5=HEAP32[r10>>2];r4=r1+28|0;L24:do{if((r5|0)!=(r4|0)){r6=r5;while(1){r7=HEAP32[r6+20>>2];if((r7|0)!=0){r8=HEAP32[r7+12>>2];if((r8|0)!=0){_free(r8)}r8=HEAP32[r7+16>>2];if((r8|0)!=0){_free(r8)}__ZdlPv(r7)}r7=HEAP32[r6+4>>2];L36:do{if((r7|0)==0){r8=r6|0;while(1){r9=HEAP32[r8+8>>2];if((r8|0)==(HEAP32[r9>>2]|0)){r11=r9;break L36}else{r8=r9}}}else{r8=r7;while(1){r9=HEAP32[r8>>2];if((r9|0)==0){r11=r8;break L36}else{r8=r9}}}}while(0);if((r11|0)==(r4|0)){break L24}else{r6=r11}}}}while(0);__ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r3|0,HEAP32[r2+10]);__ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r10|0,HEAP32[r2+7]);__ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1+12|0,HEAP32[r2+4]);__ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1|0,HEAP32[r2+1]);return}function __ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4,r6=r5>>2;r7=r1+4|0;r8=r7|0;r9=HEAP32[r8>>2];do{if((r9|0)==0){r10=r7;HEAP32[r6]=r10;r11=r8,r12=r11>>2;r13=r10}else{r10=HEAP32[r2>>2];r14=r9;while(1){r15=HEAP32[r14+16>>2];if(r10>>>0<r15>>>0){r16=r14|0;r17=HEAP32[r16>>2];if((r17|0)==0){r3=32;break}else{r14=r17;continue}}if(r15>>>0>=r10>>>0){r3=36;break}r18=r14+4|0;r15=HEAP32[r18>>2];if((r15|0)==0){r3=35;break}else{r14=r15}}if(r3==32){HEAP32[r6]=r14;r11=r16,r12=r11>>2;r13=r14;break}else if(r3==35){HEAP32[r6]=r14;r11=r18,r12=r11>>2;r13=r14;break}else if(r3==36){HEAP32[r6]=r14;r11=r5,r12=r11>>2;r13=r14;break}}}while(0);r5=HEAP32[r12];if((r5|0)!=0){r19=r5;r20=r19+20|0;STACKTOP=r4;return r20}r5=__Znwj(24),r6=r5>>2;r3=r5+16|0;if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r2>>2]}r2=r5+20|0;if((r2|0)!=0){HEAP32[r2>>2]=0}r2=r5;HEAP32[r6]=0;HEAP32[r6+1]=0;HEAP32[r6+2]=r13;HEAP32[r12]=r2;r13=r1|0;r6=HEAP32[HEAP32[r13>>2]>>2];if((r6|0)==0){r21=r2}else{HEAP32[r13>>2]=r6;r21=HEAP32[r12]}__ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r1+4>>2],r21);r21=r1+8|0;HEAP32[r21>>2]=HEAP32[r21>>2]+1|0;r19=r5;r20=r19+20|0;STACKTOP=r4;return r20}function __ZL13PrintIndentedPKcz(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;r5=HEAP32[1311192];if((r5|0)==0){___assert_func(5242980,36,5244248,5243148)}r6=HEAP32[1311185]<<1;if((r5+r6-HEAP32[1311190]|0)>=(HEAP32[1311189]|0)){___assert_func(5242980,37,5244248,5243072)}L79:do{if((r6|0)>0){r7=0;r8=r5;while(1){HEAP8[r8]=32;r9=r7+1|0;r10=HEAP32[1311192]+1|0;HEAP32[1311192]=r10;if((r9|0)<(HEAP32[1311185]<<1|0)){r7=r9;r8=r10}else{break L79}}}}while(0);HEAP32[r4>>2]=r2;r2=HEAP32[1311192];r5=HEAP32[1311190]-r2+HEAP32[1311189]|0;r6=_snprintf(r2,r5,r1,HEAP32[r4>>2]);if((r6|0)<(r5|0)){HEAP32[1311192]=HEAP32[1311192]+r6|0;STACKTOP=r3;return}else{___assert_func(5242980,43,5244248,5243024)}}function __ZN5Block11AddBranchToEPS_PKcS2_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r5=STACKTOP;STACKTOP=STACKTOP+4|0;r6=r5;HEAP32[r6>>2]=r2;r7=r1|0;r8=r1+4|0;r1=r8;r9=HEAP32[r8>>2];do{if((r9|0)!=0){r8=r9;r10=r1;L88:while(1){r11=r8,r12=r11>>2;while(1){r13=r11;if(HEAP32[r12+4]>>>0>=r2>>>0){break}r14=HEAP32[r12+1];if((r14|0)==0){r15=r10;break L88}else{r11=r14,r12=r11>>2}}r11=HEAP32[r12];if((r11|0)==0){r15=r13;break}else{r8=r11;r10=r13}}if((r15|0)==(r1|0)){break}if(HEAP32[r15+16>>2]>>>0>r2>>>0){break}___assert_func(5242980,117,5244184,5242932)}}while(0);r2=__Znwj(20);r15=r2;HEAP32[r2>>2]=0;HEAP8[r2+8|0]=0;if((r3|0)==0){r16=0}else{r16=_strdup(r3)}HEAP32[r2+12>>2]=r16;if((r4|0)==0){r17=0;r18=r2+16|0;r19=r18;HEAP32[r19>>2]=r17;r20=__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r7,r6);HEAP32[r20>>2]=r15;STACKTOP=r5;return}r17=_strdup(r4);r18=r2+16|0;r19=r18;HEAP32[r19>>2]=r17;r20=__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r7,r6);HEAP32[r20>>2]=r15;STACKTOP=r5;return}function __ZN13MultipleShape6RenderEb(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=STACKTOP;r4=r1+32|0;if((HEAP32[r4>>2]|0)!=0){if((HEAP8[r1+16|0]&1)<<24>>24==0){__ZL13PrintIndentedPKcz(5243328,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{__ZL13PrintIndentedPKcz(5243340,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r1+4>>2],tempInt))}HEAP32[1311185]=HEAP32[1311185]+1|0}r5=HEAP32[r1+20>>2];r6=r1+24|0;L113:do{if((r5|0)!=(r6|0)){r7=r5,r8=r7>>2;r9=5243412;while(1){r10=HEAP32[HEAP32[r8+4]+52>>2];if((HEAP32[1311188]|0)==0){__ZL13PrintIndentedPKcz(5243252,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9,HEAP32[tempInt+4>>2]=r10,tempInt))}else{__ZL13PrintIndentedPKcz(5243284,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9,HEAP32[tempInt+4>>2]=r10,tempInt))}HEAP32[1311185]=HEAP32[1311185]+1|0;r10=HEAP32[r8+5];FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+8>>2]](r10,r2);HEAP32[1311185]=HEAP32[1311185]-1|0;__ZL13PrintIndentedPKcz(5243352,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=HEAP32[r8+1];L120:do{if((r10|0)==0){r11=r7|0;while(1){r12=HEAP32[r11+8>>2];if((r11|0)==(HEAP32[r12>>2]|0)){r13=r12;break L120}else{r11=r12}}}else{r11=r10;while(1){r12=HEAP32[r11>>2];if((r12|0)==0){r13=r11;break L120}else{r11=r12}}}}while(0);if((r13|0)==(r6|0)){break L113}else{r7=r13,r8=r7>>2;r9=5243276}}}}while(0);if((HEAP32[r4>>2]|0)!=0){HEAP32[1311185]=HEAP32[1311185]-1|0;__ZL13PrintIndentedPKcz(5243312,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=HEAP32[r1+8>>2];if((r4|0)==0){STACKTOP=r3;return}FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+8>>2]](r4,r2);STACKTOP=r3;return}function __ZN5Block6RenderEb(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67;r3=0;r4=STACKTOP;if(!((HEAP8[r1+64|0]&1)<<24>>24==0|r2^1)){__ZL13PrintIndentedPKcz(5242920,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=HEAP32[r1+56>>2];L139:do{if((r5|0)!=0){if(HEAP8[r5]<<24>>24==0){break}else{r6=r5}while(1){r7=_strchr(r6,10);if((r7|0)==0){break}HEAP8[r7]=0;__ZL11PutIndentedPKc(r6);HEAP8[r7]=10;r8=r7+1|0;if(HEAP8[r8]<<24>>24==0){break L139}else{r6=r8}}__ZL11PutIndentedPKc(r6)}}while(0);r6=r1+24|0;r5=r1+32|0;r8=HEAP32[r5>>2];if((r8|0)==1){r9=(HEAP32[HEAP32[HEAP32[r6>>2]+20>>2]+4>>2]|0)!=0&1}else if((r8|0)==0){STACKTOP=r4;return}else{r9=1}r8=HEAP32[r1+48>>2]+8|0;r7=HEAP32[r8>>2],r10=r7>>2;do{if((r7|0)==0){r11=r9;r12=0;r13=0}else{if((HEAP32[r10+3]|0)!=1){r11=r9;r12=0;r13=0;break}r14=r7;HEAP32[r8>>2]=HEAP32[r10+2];if((HEAP32[r10+8]|0)!=0){if((HEAP8[r7+16|0]&1)<<24>>24==0){__ZL13PrintIndentedPKcz(5243328,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{__ZL13PrintIndentedPKcz(5243340,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r10+1],tempInt))}HEAP32[1311185]=HEAP32[1311185]+1|0}if(r9<<24>>24==0){r11=0;r12=r14;r13=1;break}r11=(HEAP32[r10+7]|0)==(HEAP32[r5>>2]|0)?0:r9;r12=r14;r13=1}}while(0);r9=HEAP32[r6>>2];r5=r1+28|0;r10=r5;r7=r1+60|0,r1=r7>>2;L162:do{if((r9|0)!=(r10|0)){r8=r9,r14=r8>>2;while(1){if((HEAP32[HEAP32[r14+5]+12>>2]|0)==0){if((HEAP32[r1]|0)!=0){break}HEAP32[r1]=HEAP32[r14+4]}r15=HEAP32[r14+1];L169:do{if((r15|0)==0){r16=r8|0;while(1){r17=HEAP32[r16+8>>2];if((r16|0)==(HEAP32[r17>>2]|0)){r18=r17;break L169}else{r16=r17}}}else{r16=r15;while(1){r17=HEAP32[r16>>2];if((r17|0)==0){r18=r16;break L169}else{r16=r17}}}}while(0);if((r18|0)==(r5|0)){break L162}else{r8=r18,r14=r8>>2}}___assert_func(5242980,185,5244156,5242904)}}while(0);if((HEAP32[r1]|0)==0){___assert_func(5242980,189,5244156,5243472)}r18=(r11&1)<<24>>24==0;r11=r12+24|0;r5=r11;r8=r11|0;r11=1;r14=r9,r9=r14>>2;r15=0;r16=0;r17=0;L181:while(1){r19=(r14|0)==(r10|0);do{if(r19){r20=HEAP32[r1];r21=HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r6,r7)>>2],r22=r21>>2;r23=r20;r3=136;break}else{r20=HEAP32[r9+4];if((r20|0)==(HEAP32[r1]|0)){r24=r11;r25=r15;r26=r16;r27=r17;break}r28=HEAP32[r9+5];if((HEAP32[r28+12>>2]|0)==0){r3=132;break L181}else{r21=r28,r22=r21>>2;r23=r20;r3=136;break}}}while(0);if(r3==136){r3=0;if(r18){r29=0}else{r29=(HEAP8[r23+64|0]&1)<<24>>24!=0}if(r13){r20=HEAP32[r8>>2];do{if((r20|0)==0){r3=146}else{r28=r20;r30=r5;L196:while(1){r31=r28,r32=r31>>2;while(1){r33=r31;if(HEAP32[r32+4]>>>0>=r23>>>0){break}r34=HEAP32[r32+1];if((r34|0)==0){r35=r30;break L196}else{r31=r34,r32=r31>>2}}r31=HEAP32[r32];if((r31|0)==0){r35=r33;break}else{r28=r31;r30=r33}}if((r35|0)==(r5|0)){r3=146;break}if(r23>>>0<HEAP32[r35+16>>2]>>>0){r3=146;break}else{r36=r35;break}}}while(0);if(r3==146){r3=0;r36=r5}r37=(r36|0)!=(r5|0)}else{r37=0}do{if(r29){r38=1}else{if((HEAP32[r22+1]|0)!=0|r37){r38=1;break}r38=(HEAP32[r22+4]|0)!=0}}while(0);do{if(r19){if(!r38){r39=r15;r40=r16;r41=r17;r3=180;break}r20=(r11&1)<<24>>24!=0;if((r15|0)<=0){if(r20){r39=r15;r40=r16;r41=r17;r3=180;break}__ZL13PrintIndentedPKcz(5243356,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r39=r15;r40=r16;r41=r17;r3=180;break}if(r20){__ZL13PrintIndentedPKcz(5243400,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r16,tempInt));r42=r17;r43=r16;r44=r15;r45=0;r3=181;break}else{__ZL13PrintIndentedPKcz(5243380,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r16,tempInt));r39=r15;r40=r16;r41=r17;r3=180;break}}else{if(r38){r20=HEAP32[r22+3];__ZL13PrintIndentedPKcz(5243436,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=(r11&1)<<24>>24!=0?5243412:5243428,HEAP32[tempInt+4>>2]=r20,tempInt));r42=r17;r43=r16;r44=r15;r45=0;r3=181;break}if((r15|0)>0){do{if((r15+6|0)>(r17|0)){r20=(r17<<1)+8|0;r30=1024-(r20|0)%1024+r20|0;if((r16|0)==0){r46=_malloc(r30);r47=r30;break}else{r46=_realloc(r16,r30);r47=r30;break}}else{r46=r16;r47=r17}}while(0);r30=r46+r15|0;HEAP8[r30]=HEAP8[5243420];HEAP8[r30+1|0]=HEAP8[5243421|0];HEAP8[r30+2|0]=HEAP8[5243422|0];HEAP8[r30+3|0]=HEAP8[5243423|0];HEAP8[r30+4|0]=HEAP8[5243424|0];r48=r15+4|0;r49=r46;r50=r47}else{r48=r15;r49=r16;r50=r17}r30=r48+4|0;do{if((r30|0)>(r50|0)){r20=(r50<<1)+4|0;r28=1024-(r20|0)%1024+r20|0;if((r49|0)==0){r51=_malloc(r28);r52=r28;break}else{r51=_realloc(r49,r28);r52=r28;break}}else{r51=r49;r52=r50}}while(0);r28=r51+r48|0;HEAP8[r28]=HEAP8[5243416];HEAP8[r28+1|0]=HEAP8[5243417|0];HEAP8[r28+2|0]=HEAP8[5243418|0];r28=r48+2|0;r20=HEAP32[r22+3];r31=_strlen(r20);do{if((r30+r31|0)>(r52|0)){r34=r31+r52<<1;r53=1024-(r34|0)%1024+r34|0;if((r51|0)==0){r54=_malloc(r53);r55=r53;break}else{r54=_realloc(r51,r53);r55=r53;break}}else{r54=r51;r55=r52}}while(0);_strcpy(r54+r28|0,r20);r30=r31+r28|0;do{if((r30+3|0)>(r55|0)){r53=(r55<<1)+2|0;r34=1024-(r53|0)%1024+r53|0;if((r54|0)==0){r56=_malloc(r34);r57=r34;break}else{r56=_realloc(r54,r34);r57=r34;break}}else{r56=r54;r57=r55}}while(0);r28=r56+r30|0;tempBigInt=41;HEAP8[r28]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r28+1|0]=tempBigInt&255;r39=r30+1|0;r40=r56;r41=r57;r3=180;break}}while(0);do{if(r3==180){r3=0;if((r11&1)<<24>>24==0){r42=r41;r43=r40;r44=r39;r45=r11;r3=181;break}else{r58=r41;r59=r40;r60=r39;r61=r11;r62=1;break}}}while(0);if(r3==181){r3=0;HEAP32[1311185]=HEAP32[1311185]+1|0;r58=r42;r59=r43;r60=r44;r61=r45;r62=0}r28=HEAP32[r22+4];if((r28|0)!=0){__ZL13PrintIndentedPKcz(5243336,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r28,tempInt))}if(r29){__ZL13PrintIndentedPKcz(5243488,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r23+52>>2],tempInt))}r28=HEAP32[r22];do{if((r28|0)!=0){r31=HEAP32[r22+1];if((r31|0)==0){break}r20=(r31|0)==1?5243212:5243012;if((HEAP8[r21+8|0]&1)<<24>>24==0){__ZL13PrintIndentedPKcz(5243004,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r20,tempInt));break}else{r31=HEAP32[r28+4>>2];__ZL13PrintIndentedPKcz(5243368,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r20,HEAP32[tempInt+4>>2]=r31,tempInt));break}}}while(0);if(r37){r28=HEAP32[r8>>2];do{if((r28|0)==0){r3=199}else{r31=r28;r20=r5;L274:while(1){r34=r31,r53=r34>>2;while(1){r63=r34;if(HEAP32[r53+4]>>>0>=r23>>>0){break}r64=HEAP32[r53+1];if((r64|0)==0){r65=r20;break L274}else{r34=r64,r53=r34>>2}}r34=HEAP32[r53];if((r34|0)==0){r65=r63;break}else{r31=r34;r20=r63}}if((r65|0)==(r5|0)){r3=199;break}if(r23>>>0<HEAP32[r65+16>>2]>>>0){r3=199;break}else{r66=r65;break}}}while(0);if(r3==199){r3=0;r66=r5}r28=HEAP32[r66+20>>2];FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+8>>2]](r28,r2)}if(!r62){HEAP32[1311185]=HEAP32[1311185]-1|0}if(r19){break}else{r24=r61;r25=r60;r26=r59;r27=r58}}r28=HEAP32[r9+1];L290:do{if((r28|0)==0){r20=r14|0;while(1){r31=HEAP32[r20+8>>2];if((r20|0)==(HEAP32[r31>>2]|0)){r67=r31;break L290}else{r20=r31}}}else{r20=r28;while(1){r31=HEAP32[r20>>2];if((r31|0)==0){r67=r20;break L290}else{r20=r31}}}}while(0);r11=r24;r14=r67,r9=r14>>2;r15=r25;r16=r26;r17=r27}if(r3==132){___assert_func(5242980,200,5244156,5243452)}if(!r62){__ZL13PrintIndentedPKcz(5243352,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}do{if(r13){if((HEAP32[r12+32>>2]|0)==0){break}HEAP32[1311185]=HEAP32[1311185]-1|0;__ZL13PrintIndentedPKcz(5243312,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);if((r59|0)==0){STACKTOP=r4;return}_free(r59);STACKTOP=r4;return}function __ZL11PutIndentedPKc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=HEAP32[1311192];if((r2|0)==0){___assert_func(5242980,49,5244288,5243148)}r3=HEAP32[1311185]<<1;r4=HEAP32[1311190];r5=HEAP32[1311189];if((r2+r3-r4|0)>=(r5|0)){___assert_func(5242980,50,5244288,5243072)}if((r3|0)>0){r3=0;r6=r2;while(1){HEAP8[r6]=32;r7=r3+1|0;r8=HEAP32[1311192]+1|0;HEAP32[1311192]=r8;if((r7|0)<(HEAP32[1311185]<<1|0)){r3=r7;r6=r8}else{break}}r9=HEAP32[1311189];r10=r8;r11=HEAP32[1311190]}else{r9=r5;r10=r2;r11=r4}if((_strlen(r1)+1|0)<(r9-r10+r11|0)){_strcpy(r10,r1);r10=_strlen(r1);r1=HEAP32[1311192];HEAP32[1311192]=r10+(r1+1)|0;HEAP8[r1+r10|0]=10;HEAP8[HEAP32[1311192]]=0;return}else{___assert_func(5242980,54,5244288,5243056)}}function __ZN9LoopShape6RenderEb(r1,r2){var r3,r4;r3=STACKTOP;if((HEAP8[r1+16|0]&1)<<24>>24==0){__ZL13PrintIndentedPKcz(5243220,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{__ZL13PrintIndentedPKcz(5243232,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r1+4>>2],tempInt))}HEAP32[1311185]=HEAP32[1311185]+1|0;r4=HEAP32[r1+20>>2];FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+8>>2]](r4,1);HEAP32[1311185]=HEAP32[1311185]-1|0;__ZL13PrintIndentedPKcz(5243352,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r4=HEAP32[r1+8>>2];if((r4|0)==0){STACKTOP=r3;return}FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]+8>>2]](r4,r2);STACKTOP=r3;return}function __ZN8RelooperD2Ev(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=r1+20|0;r3=HEAP32[r2>>2];L337:do{if((r3|0)!=0){r4=r1+16|0;r5=r1+4|0;r6=0;r7=r3;while(1){r8=HEAP32[r4>>2]+r6|0;r9=HEAP32[HEAP32[HEAP32[r5>>2]+(r8>>>10<<2)>>2]+((r8&1023)<<2)>>2];if((r9|0)==0){r10=r7}else{__ZN5BlockD2Ev(r9);__ZdlPv(r9);r10=HEAP32[r2>>2]}r9=r6+1|0;if(r9>>>0<r10>>>0){r6=r9;r7=r10}else{break L337}}}}while(0);r10=r1+44|0;r2=HEAP32[r10>>2];L346:do{if((r2|0)==0){r11=r1+28|0}else{r3=r1+40|0;r7=r1+28|0;r6=0;r5=r2;while(1){r4=HEAP32[r3>>2]+r6|0;r9=HEAP32[HEAP32[HEAP32[r7>>2]+(r4>>>10<<2)>>2]+((r4&1023)<<2)>>2];if((r9|0)==0){r12=r5}else{FUNCTION_TABLE[HEAP32[HEAP32[r9>>2]+4>>2]](r9);r12=HEAP32[r10>>2]}r9=r6+1|0;if(r9>>>0<r12>>>0){r6=r9;r5=r12}else{r11=r7;break L346}}}}while(0);r12=r1+24|0;__ZNSt3__112__deque_baseIP5ShapeNS_9allocatorIS2_EEE5clearEv(r12|0);r10=HEAP32[r11>>2];r2=(r1+32|0)>>2;r7=HEAP32[r2];do{if((r10|0)!=(r7|0)){r5=r10;while(1){__ZdlPv(HEAP32[r5>>2]);r6=r5+4|0;if((r6|0)==(r7|0)){break}else{r5=r6}}r5=HEAP32[r11>>2];r6=HEAP32[r2];if((r5|0)==(r6|0)){break}HEAP32[r2]=(((r6-4+ -r5|0)>>>2^-1)<<2)+r6|0}}while(0);r2=HEAP32[r12>>2];if((r2|0)!=0){__ZdlPv(r2)}__ZNSt3__112__deque_baseIP5BlockNS_9allocatorIS2_EEE5clearEv(r1|0);r2=r1+4|0;r12=HEAP32[r2>>2];r11=(r1+8|0)>>2;r7=HEAP32[r11];do{if((r12|0)!=(r7|0)){r10=r12;while(1){__ZdlPv(HEAP32[r10>>2]);r6=r10+4|0;if((r6|0)==(r7|0)){break}else{r10=r6}}r10=HEAP32[r2>>2];r6=HEAP32[r11];if((r10|0)==(r6|0)){break}HEAP32[r11]=(((r6-4+ -r10|0)>>>2^-1)<<2)+r6|0}}while(0);r11=HEAP32[r1>>2];if((r11|0)==0){return}__ZdlPv(r11);return}function __ZN8Relooper9CalculateEP5Block(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+120|0;r5=r4;r6=r4+8,r7=r6>>2;r8=r4+12;r9=r4+16;r10=r4+20;r11=r4+28;r12=r4+40;r13=r4+44;r14=r4+52;r15=r4+60;r16=r4+64,r17=r16>>2;r18=r4+80;r19=r4+84,r20=r19>>2;r21=r4+96,r22=r21>>2;r23=r4+108;r24=r4+112;HEAP32[r15>>2]=r2;r25=r16|0;HEAP32[r25>>2]=r1;r26=r16+8|0;r27=(r26|0)>>2;HEAP32[r27]=0;HEAP32[r17+3]=0;r28=r26;HEAP32[r17+1]=r28;r29=(r11|0)>>2;r30=r11;HEAP32[r29]=r30;r31=r11+4|0;HEAP32[r31>>2]=r30;r32=(r11+8|0)>>2;HEAP32[r32]=0;r11=__Znwj(12);r33=r11;r34=r11+8|0;if((r34|0)!=0){HEAP32[r34>>2]=r2}HEAP32[HEAP32[r29]+4>>2]=r33;HEAP32[r11>>2]=HEAP32[r29];HEAP32[r29]=r33;HEAP32[r11+4>>2]=r30;r11=HEAP32[r32]+1|0;HEAP32[r32]=r11;L380:do{if((r11|0)!=0){r33=r16+4|0;while(1){r2=HEAP32[r31>>2];r34=HEAP32[r2+8>>2];HEAP32[r12>>2]=r34;r35=r2+4|0;r36=r2|0;HEAP32[HEAP32[r36>>2]+4>>2]=HEAP32[r35>>2];HEAP32[HEAP32[r35>>2]>>2]=HEAP32[r36>>2];HEAP32[r32]=HEAP32[r32]-1|0;__ZdlPv(r2);r2=HEAP32[r27];do{if((r2|0)==0){r3=303}else{r36=r2;r35=r28;L385:while(1){r37=r36,r38=r37>>2;while(1){r39=r37;if(HEAP32[r38+4]>>>0>=r34>>>0){break}r40=HEAP32[r38+1];if((r40|0)==0){r41=r35;break L385}else{r37=r40,r38=r37>>2}}r37=HEAP32[r38];if((r37|0)==0){r41=r39;break}else{r36=r37;r35=r39}}if((r41|0)==(r28|0)){r3=303;break}if(r34>>>0<HEAP32[r41+16>>2]>>>0){r3=303;break}else{break}}}while(0);L393:do{if(r3==303){r3=0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r10,r33,r12);r34=HEAP32[r12>>2];r2=HEAP32[r34>>2];r35=r34+4|0;if((r2|0)==(r35|0)){break}r34=r35;r35=r2;while(1){r2=__Znwj(12);r36=r2;r37=r2+8|0;if((r37|0)!=0){HEAP32[r37>>2]=HEAP32[r35+16>>2]}HEAP32[HEAP32[r29]+4>>2]=r36;HEAP32[r2>>2]=HEAP32[r29];HEAP32[r29]=r36;HEAP32[r2+4>>2]=r30;HEAP32[r32]=HEAP32[r32]+1|0;r2=HEAP32[r35+4>>2];L403:do{if((r2|0)==0){r36=r35|0;while(1){r37=HEAP32[r36+8>>2];if((r36|0)==(HEAP32[r37>>2]|0)){r42=r37;break L403}else{r36=r37}}}else{r36=r2;while(1){r37=HEAP32[r36>>2];if((r37|0)==0){r42=r36;break L403}else{r36=r37}}}}while(0);if((r42|0)==(r34|0)){break L393}else{r35=r42}}}}while(0);if((HEAP32[r32]|0)==0){break L380}}}}while(0);r32=(r1+20|0)>>2;r42=HEAP32[r32];L412:do{if((r42|0)==0){r43=0}else{r30=r1+16|0;r29=r1+4|0;r12=0;r10=r42;while(1){r3=HEAP32[r30>>2]+r12|0;r41=HEAP32[HEAP32[HEAP32[r29>>2]+(r3>>>10<<2)>>2]+((r3&1023)<<2)>>2];HEAP32[r18>>2]=r41;r3=HEAP32[r27];do{if((r3|0)==0){r44=r10}else{r39=r3;r31=r28;L417:while(1){r11=r39,r33=r11>>2;while(1){r45=r11;if(HEAP32[r33+4]>>>0>=r41>>>0){break}r35=HEAP32[r33+1];if((r35|0)==0){r46=r31;break L417}else{r11=r35,r33=r11>>2}}r11=HEAP32[r33];if((r11|0)==0){r46=r45;break}else{r39=r11;r31=r45}}if((r46|0)==(r28|0)){r44=r10;break}if(r41>>>0<HEAP32[r46+16>>2]>>>0){r44=r10;break}r31=HEAP32[r41>>2];if((r31|0)==(r41+4|0)){r44=r10;break}else{r47=r31}while(1){r31=__Znwj(20),r39=r31>>2;HEAP32[r39]=0;HEAP8[r31+8|0]=0;HEAP32[r39+3]=0;HEAP32[r39+4]=0;HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(HEAP32[r47+16>>2]+12|0,r18)>>2]=r31;r31=HEAP32[r47+4>>2];L430:do{if((r31|0)==0){r39=r47|0;while(1){r11=HEAP32[r39+8>>2];if((r39|0)==(HEAP32[r11>>2]|0)){r48=r11;break L430}else{r39=r11}}}else{r39=r31;while(1){r11=HEAP32[r39>>2];if((r11|0)==0){r48=r39;break L430}else{r39=r11}}}}while(0);if((r48|0)==(HEAP32[r18>>2]+4|0)){break}else{r47=r48}}r44=HEAP32[r32]}}while(0);r41=r12+1|0;if(r41>>>0<r44>>>0){r12=r41;r10=r44}else{r43=r44;break L412}}}}while(0);r44=r16+4|0;r16=HEAP32[r44>>2];if((r16|0)==(r28|0)){r49=r43}else{r43=r26;r26=r16;r28=0;while(1){r50=_strlen(HEAP32[HEAP32[r26+16>>2]+56>>2])+r28|0;r48=HEAP32[r26+4>>2];L444:do{if((r48|0)==0){r47=r26|0;while(1){r18=HEAP32[r47+8>>2];if((r47|0)==(HEAP32[r18>>2]|0)){r51=r18;break L444}else{r47=r18}}}else{r47=r48;while(1){r18=HEAP32[r47>>2];if((r18|0)==0){r51=r47;break L444}else{r47=r18}}}}while(0);if((r51|0)==(r43|0)){break}else{r26=r51;r28=r50}}r28=(r50|0)/5&-1;r50=r16;while(1){r16=HEAP32[r50+16>>2],r51=r16>>2;HEAP32[r7]=r16;r26=HEAP32[r51+5];L454:do{if(r26>>>0>=2){if((HEAP32[r51+2]|0)!=0){break}if(Math.imul(_strlen(HEAP32[r51+14]),r26-1|0)>>>0>r28>>>0){break}r48=HEAP32[r51+3];if((r48|0)==(r16+16|0)){break}else{r52=r48;r53=r16}while(1){HEAP32[r8>>2]=HEAP32[r52+16>>2];r48=__Znwj(68),r47=r48>>2;r18=HEAP32[r53+56>>2];r46=r48+4|0;HEAP32[r46>>2]=0;HEAP32[r47+2]=0;HEAP32[r47]=r46;r46=r48+16|0;HEAP32[r46>>2]=0;HEAP32[r47+5]=0;r45=r48+12|0;HEAP32[r45>>2]=r46;r46=r48+28|0;HEAP32[r46>>2]=0;HEAP32[r47+8]=0;HEAP32[r47+6]=r46;r46=r48+40|0;HEAP32[r46>>2]=0;HEAP32[r47+11]=0;HEAP32[r47+9]=r46;HEAP32[r47+12]=0;r46=HEAP32[1311187];HEAP32[1311187]=r46+1|0;HEAP32[r47+13]=r46;HEAP32[r47+15]=0;HEAP8[r48+64|0]=0;HEAP32[r47+14]=_strdup(r18);HEAP32[r9>>2]=r48;r48=__Znwj(20),r18=r48>>2;HEAP32[r18]=0;HEAP8[r48+8|0]=0;HEAP32[r18+3]=0;HEAP32[r18+4]=0;HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r45,r8)>>2]=r48;r48=__Znwj(20),r45=r48>>2;r18=HEAP32[r8>>2];r47=r18|0;r46=HEAP32[HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r47,r6)>>2]+12>>2];r27=HEAP32[HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r47,r6)>>2]+16>>2];HEAP32[r45]=0;HEAP8[r48+8|0]=0;if((r46|0)==0){r54=0}else{r54=_strdup(r46)}HEAP32[r45+3]=r54;if((r27|0)==0){r55=0}else{r55=_strdup(r27)}HEAP32[r45+4]=r55;HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r47,r9)>>2]=r48;r48=r18+4|0;r47=r48;r45=HEAP32[r48>>2];do{if((r45|0)!=0){r48=HEAP32[r7];r27=r45;r46=r47;L475:while(1){r42=r27,r10=r42>>2;while(1){r56=r42;if(HEAP32[r10+4]>>>0>=r48>>>0){break}r12=HEAP32[r10+1];if((r12|0)==0){r57=r46;break L475}else{r42=r12,r10=r42>>2}}r42=HEAP32[r10];if((r42|0)==0){r57=r56;break}else{r27=r42;r46=r56}}if((r57|0)==(r47|0)){break}if(r48>>>0<HEAP32[r57+16>>2]>>>0){break}r46=r57|0;r27=HEAP32[r57+4>>2];L484:do{if((r27|0)==0){r42=r46;while(1){r12=HEAP32[r42+8>>2];if((r42|0)==(HEAP32[r12>>2]|0)){r58=r12;break L484}else{r42=r12}}}else{r42=r27;while(1){r10=HEAP32[r42>>2];if((r10|0)==0){r58=r42;break L484}else{r42=r10}}}}while(0);r27=r18|0;if((HEAP32[r27>>2]|0)==(r57|0)){HEAP32[r27>>2]=r58}r27=r18+8|0;HEAP32[r27>>2]=HEAP32[r27>>2]-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r45,r46);__ZdlPv(r57)}}while(0);r45=HEAP32[r25>>2];r18=HEAP32[r9>>2];r47=r45+8|0;r27=HEAP32[r47>>2];r48=r45+4|0;r42=HEAP32[r48>>2];if((r27|0)==(r42|0)){r59=0}else{r59=(r27-r42<<8)-1|0}r10=r45+16|0;r12=HEAP32[r10>>2];r29=(r45+20|0)>>2;r30=HEAP32[r29];if((r59|0)==(r30+r12|0)){__ZNSt3__15dequeIP5BlockNS_9allocatorIS2_EEE19__add_back_capacityEv(r45|0);r60=HEAP32[r29];r61=HEAP32[r10>>2];r62=HEAP32[r48>>2];r63=HEAP32[r47>>2]}else{r60=r30;r61=r12;r62=r42;r63=r27}r27=r60+r61|0;do{if((r63|0)==(r62|0)){r64=r60}else{r42=((r27&1023)<<2)+HEAP32[r62+(r27>>>10<<2)>>2]|0;if((r42|0)==0){r64=r60;break}HEAP32[r42>>2]=r18;r64=HEAP32[r29]}}while(0);HEAP32[r29]=r64+1|0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r5,r44,r9);r18=HEAP32[r52+4>>2];L506:do{if((r18|0)==0){r27=r52|0;while(1){r42=HEAP32[r27+8>>2];if((r27|0)==(HEAP32[r42>>2]|0)){r65=r42;break L506}else{r27=r42}}}else{r27=r18;while(1){r46=HEAP32[r27>>2];if((r46|0)==0){r65=r27;break L506}else{r27=r46}}}}while(0);r18=HEAP32[r7];if((r65|0)==(r18+16|0)){break L454}else{r52=r65;r53=r18}}}}while(0);r16=HEAP32[r50+4>>2];L514:do{if((r16|0)==0){r51=r50|0;while(1){r26=HEAP32[r51+8>>2];if((r51|0)==(HEAP32[r26>>2]|0)){r66=r26;break L514}else{r51=r26}}}else{r51=r16;while(1){r26=HEAP32[r51>>2];if((r26|0)==0){r66=r51;break L514}else{r51=r26}}}}while(0);if((r66|0)==(r43|0)){break}else{r50=r66}}r49=HEAP32[r32]}r66=r19|0;r50=r19+4|0;HEAP32[r50>>2]=0;HEAP32[r20+2]=0;HEAP32[r20]=r50;L523:do{if((r49|0)!=0){r50=r1+16|0;r43=r1+4|0;r53=0;while(1){r65=HEAP32[r50>>2]+r53|0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r14,r66,((r65&1023)<<2)+HEAP32[HEAP32[r43>>2]+(r65>>>10<<2)>>2]|0);r65=r53+1|0;if(r65>>>0<HEAP32[r32]>>>0){r53=r65}else{break L523}}}}while(0);r32=r21|0;r14=r21+4|0;HEAP32[r14>>2]=0;HEAP32[r22+2]=0;HEAP32[r22]=r14;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r13,r32,r15);HEAP32[r23>>2]=r1;r15=__ZZN8Relooper9CalculateEP5BlockEN8Analyzer7ProcessE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_P5Shape(r23,r19,r21);HEAP32[r1+48>>2]=r15;HEAP32[r24>>2]=r1;HEAP32[r24+4>>2]=0;__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer19RemoveUnneededFlowsE_1P5ShapeS4_(r15,0);__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer16FindLabeledLoopsE_1P5Shape(r24,r15);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r32,HEAP32[r22+1]);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r66,HEAP32[r20+1]);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r44,HEAP32[r17+2]);STACKTOP=r4;return}function __ZZN8Relooper9CalculateEP5BlockEN8Analyzer7ProcessE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_P5Shape(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+204|0;r6=r5;r7=r5+8;r8=r5+16;r9=r5+24;r10=r5+36;r11=r5+40;r12=r5+44;r13=r5+48;r14=r5+56;r15=r5+64;r16=r5+80;r17=r5+92;r18=r5+96;r19=r5+100,r20=r19>>2;r21=r5+104;r22=r5+108;r23=r5+120,r24=r23>>2;r25=r5+124;r26=r5+128;r27=r5+136;r28=r5+144;r29=r5+148;r30=r5+160,r31=r30>>2;r32=r5+184;r33=r5+196;r34=r5+200;r35=r30+4|0;HEAP32[r35>>2]=0;HEAP32[r31+2]=0;HEAP32[r31]=r35;r35=r30+16|0;HEAP32[r35>>2]=0;HEAP32[r31+5]=0;HEAP32[r31+3]=r35;r35=r1|0;r31=(r2+8|0)>>2;r36=r2+4|0;r37=r36;r38=(r36|0)>>2;r36=r29|0;r39=r29+4|0;r40=r39|0;r41=r29+8|0;r42=r39;r39=r29|0;r43=r29+4|0;r44=(r2|0)==0;r45=(r2|0)>>2;r46=r32|0;r47=r32+4|0;r48=r47|0;r49=(r32+8|0)>>2;r50=r47;r51=(r32|0)>>2;r52=r15|0;r53=r15+8|0;r54=r53|0;r55=r15+12|0;r56=r53;r53=r15+4|0;r57=(r16|0)>>2;r58=r16;r59=(r16+4|0)>>2;r60=(r16+8|0)>>2;r16=r15+4|0;r61=r15+8|0;r62=r32+4|0;r63=r9|0;r64=r9+4|0;r65=(r64|0)>>2;r66=r9+8|0;r67=r64;r64=r9|0;r68=r9+4|0;r69=(r22|0)>>2;r70=r22;r71=r22+4|0;r72=(r22+8|0)>>2;r22=r15+4|0;r73=0;r74=0;r75=r3;r3=0;r76=0;L533:while(1){r77=r74,r78=r77>>2;r79=r75;r80=r3;r81=r76;while(1){r82=1-r80|0;r83=r30+(r82*12&-1)|0;r84=r83|0;r85=r30+(r82*12&-1)+4|0;r86=r85;r87=r85|0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r84,HEAP32[r87>>2]);r88=(r30+(r82*12&-1)+8|0)>>2;HEAP32[r88]=0;r89=r83|0;HEAP32[r89>>2]=r86;HEAP32[r87>>2]=0;r87=HEAP32[r79+8>>2];if((r87|0)==0){r90=r81;r4=728;break L533}else if((r87|0)!=1){break}r87=HEAP32[HEAP32[r79>>2]+16>>2],r91=r87>>2;if((HEAP32[r91+5]|0)!=0){r92=__ZZN8Relooper9CalculateEP5BlockEN8Analyzer8MakeLoopE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_SA_(r1,r2,r79,r83);if((r77|0)!=0){HEAP32[r78+2]=r92}r93=(r81|0)==0?r92:r81;if((HEAP32[r88]|0)==0){r90=r93;r4=730;break L533}else{r77=r92,r78=r77>>2;r79=r83;r80=r82;r81=r93;continue}}HEAP32[r28>>2]=r87;r93=__Znwj(20),r92=r93>>2;r94=HEAP32[1311186];HEAP32[1311186]=r94+1|0;HEAP32[r92+1]=r94;HEAP32[r92+2]=0;HEAP32[r92+3]=0;HEAP32[r92]=5244400;r92=r93+16|0;HEAP32[r92>>2]=0;r94=r93;r93=HEAP32[r35>>2];r95=r93+32|0;r96=HEAP32[r95>>2];r97=r93+28|0;r98=HEAP32[r97>>2];if((r96|0)==(r98|0)){r99=0}else{r99=(r96-r98<<8)-1|0}r100=r93+40|0;r101=HEAP32[r100>>2];r102=(r93+44|0)>>2;r103=HEAP32[r102];if((r99|0)==(r103+r101|0)){__ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r93+24|0);r104=HEAP32[r102];r105=HEAP32[r100>>2];r106=HEAP32[r97>>2];r107=HEAP32[r95>>2]}else{r104=r103;r105=r101;r106=r98;r107=r96}r96=r104+r105|0;do{if((r107|0)==(r106|0)){r108=r104}else{r98=((r96&1023)<<2)+HEAP32[r106+(r96>>>10<<2)>>2]|0;if((r98|0)==0){r108=r104;break}HEAP32[r98>>2]=r94;r108=HEAP32[r102]}}while(0);HEAP32[r102]=r108+1|0;HEAP32[r92>>2]=r87;HEAP32[r91+12]=r94;r96=HEAP32[r31];if(r96>>>0>1){r98=HEAP32[r38];do{if((r98|0)!=0){r101=r98;r103=r37;L560:while(1){r95=r101,r97=r95>>2;while(1){r109=r95;if(HEAP32[r97+4]>>>0>=r87>>>0){break}r100=HEAP32[r97+1];if((r100|0)==0){r110=r103;break L560}else{r95=r100,r97=r95>>2}}r95=HEAP32[r97];if((r95|0)==0){r110=r109;break}else{r101=r95;r103=r109}}if((r110|0)==(r37|0)){break}if(HEAP32[r110+16>>2]>>>0>r87>>>0){break}r103=r110|0;r101=HEAP32[r110+4>>2];L569:do{if((r101|0)==0){r95=r103;while(1){r100=HEAP32[r95+8>>2];if((r95|0)==(HEAP32[r100>>2]|0)){r111=r100;break L569}else{r95=r100}}}else{r95=r101;while(1){r97=HEAP32[r95>>2];if((r97|0)==0){r111=r95;break L569}else{r95=r97}}}}while(0);if((HEAP32[r45]|0)==(r110|0)){HEAP32[r45]=r111}HEAP32[r31]=r96-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r98,r103);__ZdlPv(r110)}}while(0);r98=HEAP32[r91];r96=r87+4|0;L579:do{if((r98|0)!=(r96|0)){r92=r96;if(r44){r102=r98;while(1){__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r26,r84,r102+16|0);r101=HEAP32[r102+4>>2];L585:do{if((r101|0)==0){r95=r102|0;while(1){r97=HEAP32[r95+8>>2];if((r95|0)==(HEAP32[r97>>2]|0)){r112=r97;break L585}else{r95=r97}}}else{r95=r101;while(1){r97=HEAP32[r95>>2];if((r97|0)==0){r112=r95;break L585}else{r95=r97}}}}while(0);if((r112|0)==(r92|0)){break L579}else{r102=r112}}}else{r113=r98}while(1){r102=HEAP32[r38];do{if((r102|0)!=0){r103=r113+16|0;r101=HEAP32[r103>>2];r95=r102;r97=r37;L596:while(1){r100=r95,r93=r100>>2;while(1){r114=r100;if(HEAP32[r93+4]>>>0>=r101>>>0){break}r115=HEAP32[r93+1];if((r115|0)==0){r116=r97;break L596}else{r100=r115,r93=r100>>2}}r100=HEAP32[r93];if((r100|0)==0){r116=r114;break}else{r95=r100;r97=r114}}if((r116|0)==(r37|0)){break}if(r101>>>0<HEAP32[r116+16>>2]>>>0){break}__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r26,r84,r103)}}while(0);r102=HEAP32[r113+4>>2];L606:do{if((r102|0)==0){r97=r113|0;while(1){r95=HEAP32[r97+8>>2];if((r97|0)==(HEAP32[r95>>2]|0)){r117=r95;break L606}else{r97=r95}}}else{r97=r102;while(1){r103=HEAP32[r97>>2];if((r103|0)==0){r117=r97;break L606}else{r97=r103}}}}while(0);if((r117|0)==(r92|0)){break L579}r113=r117}}}while(0);HEAP32[r40>>2]=0;HEAP32[r41>>2]=0;HEAP32[r39>>2]=r42;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r27,r36,r28);r98=HEAP32[r89>>2];L616:do{if((r98|0)!=(r86|0)){r96=r85;r87=r98;while(1){__ZZN8Relooper9CalculateEP5BlockEN8Analyzer9SolipsizeE_0S1_N6Branch8FlowTypeEP5ShapeRNSt3__13setIS1_NS7_4lessIS1_EENS7_9allocatorIS1_EEEE(HEAP32[r87+16>>2],0,r94,r29);r91=HEAP32[r87+4>>2];L621:do{if((r91|0)==0){r92=r87|0;while(1){r102=HEAP32[r92+8>>2];if((r92|0)==(HEAP32[r102>>2]|0)){r118=r102;break L621}else{r92=r102}}}else{r92=r91;while(1){r102=HEAP32[r92>>2];if((r102|0)==0){r118=r92;break L621}else{r92=r102}}}}while(0);if((r118|0)==(r96|0)){break L616}else{r87=r118}}}}while(0);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r36,HEAP32[r43>>2])}if((r77|0)!=0){HEAP32[r78+2]=r94}r98=(r81|0)==0?r94:r81;if((HEAP32[r88]|0)==0){r90=r98;r4=729;break L533}else{r77=r94,r78=r77>>2;r79=r83;r80=r82;r81=r98}}HEAP32[r48>>2]=0;HEAP32[r49]=0;HEAP32[r51]=r50;HEAP32[r52>>2]=r32;HEAP32[r54>>2]=0;HEAP32[r55>>2]=0;HEAP32[r53>>2]=r56;HEAP32[r57]=r58;HEAP32[r59]=r58;HEAP32[r60]=0;r80=(r79|0)>>2;r98=HEAP32[r80];r85=r79+4|0;r86=r85;L634:do{if((r98|0)!=(r86|0)){r89=r85;r87=r98;while(1){r96=HEAP32[r87+16>>2];HEAP32[r17>>2]=r96;HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r22,r17)>>2]=r96;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r14,__ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r32,r17)|0,r17);r96=__Znwj(12);r91=r96;r92=r96+8|0;if((r92|0)!=0){HEAP32[r92>>2]=HEAP32[r17>>2]}HEAP32[HEAP32[r57]+4>>2]=r91;HEAP32[r96>>2]=HEAP32[r57];HEAP32[r57]=r91;HEAP32[r96+4>>2]=r58;r119=HEAP32[r60]+1|0;HEAP32[r60]=r119;r96=HEAP32[r87+4>>2];L645:do{if((r96|0)==0){r91=r87|0;while(1){r92=HEAP32[r91+8>>2];if((r91|0)==(HEAP32[r92>>2]|0)){r120=r92;break L645}else{r91=r92}}}else{r91=r96;while(1){r92=HEAP32[r91>>2];if((r92|0)==0){r120=r91;break L645}else{r91=r92}}}}while(0);if((r120|0)==(r89|0)){break}else{r87=r120}}if((r119|0)==0){break}while(1){r87=HEAP32[r59];HEAP32[r18>>2]=HEAP32[r87+8>>2];r89=r87+4|0;r94=r87|0;HEAP32[HEAP32[r94>>2]+4>>2]=HEAP32[r89>>2];HEAP32[HEAP32[r89>>2]>>2]=HEAP32[r94>>2];HEAP32[r60]=HEAP32[r60]-1|0;__ZdlPv(r87);r87=HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r22,r18)>>2];HEAP32[r20]=r87;L656:do{if((r87|0)!=0){r94=HEAP32[r18>>2];r89=HEAP32[r94>>2];r96=r94+4|0;if((r89|0)==(r96|0)){break}r94=r96;r96=r89;while(1){r89=HEAP32[r96+16>>2];HEAP32[r21>>2]=r89;r91=HEAP32[r54>>2];do{if((r91|0)==0){r4=510}else{r92=r91;r102=r56;L662:while(1){r97=r92,r103=r97>>2;while(1){r121=r97;if(HEAP32[r103+4]>>>0>=r89>>>0){break}r101=HEAP32[r103+1];if((r101|0)==0){r122=r102;break L662}else{r97=r101,r103=r97>>2}}r97=HEAP32[r103];if((r97|0)==0){r122=r121;break}else{r92=r97;r102=r121}}if((r122|0)==(r56|0)){r4=510;break}if(r89>>>0<HEAP32[r122+16>>2]>>>0){r4=510;break}r102=HEAP32[r122+20>>2];if((r102|0)==0){break}if((r102|0)==(HEAP32[r20]|0)){break}__ZZZN8Relooper9CalculateEP5BlockEN8Analyzer21FindIndependentGroupsE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_RNS3_3mapIS1_S9_S6_NS7_INS3_4pairIKS1_S9_EEEEEEEN11HelperClass22InvalidateWithChildrenES1_(r15,r89);break}}while(0);if(r4==510){r4=0;r89=HEAP32[r20];HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r22,r21)>>2]=r89;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r13,__ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r32,r19)|0,r21);r89=__Znwj(12);r91=r89;r102=r89+8|0;if((r102|0)!=0){HEAP32[r102>>2]=HEAP32[r21>>2]}HEAP32[HEAP32[r57]+4>>2]=r91;HEAP32[r89>>2]=HEAP32[r57];HEAP32[r57]=r91;HEAP32[r89+4>>2]=r58;HEAP32[r60]=HEAP32[r60]+1|0}r89=HEAP32[r96+4>>2];L683:do{if((r89|0)==0){r91=r96|0;while(1){r102=HEAP32[r91+8>>2];if((r91|0)==(HEAP32[r102>>2]|0)){r123=r102;break L683}else{r91=r102}}}else{r91=r89;while(1){r102=HEAP32[r91>>2];if((r102|0)==0){r123=r91;break L683}else{r91=r102}}}}while(0);if((r123|0)==(r94|0)){break L656}r96=r123}}}while(0);if((HEAP32[r60]|0)==0){break L634}}}}while(0);r98=HEAP32[r80];L693:do{if((r98|0)!=(r86|0)){r87=r85;r96=r98;while(1){r94=__ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r32,r96+16|0);HEAP32[r69]=r70;HEAP32[r71>>2]=r70;HEAP32[r72]=0;r89=HEAP32[r94>>2];r91=r94+4|0;L698:do{if((r89|0)!=(r91|0)){r94=r91;r102=r89;while(1){r92=HEAP32[r102+16>>2];HEAP32[r24]=r92;r93=HEAP32[r92+12>>2];L702:do{if((r93|0)!=(r92+16|0)){r97=r93;while(1){HEAP32[r25>>2]=HEAP32[r97+16>>2];if((HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r22,r25)>>2]|0)!=(HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r22,r23)>>2]|0)){r101=__Znwj(12);r95=r101;r100=r101+8|0;if((r100|0)!=0){HEAP32[r100>>2]=HEAP32[r24]}HEAP32[HEAP32[r69]+4>>2]=r95;HEAP32[r101>>2]=HEAP32[r69];HEAP32[r69]=r95;HEAP32[r101+4>>2]=r70;HEAP32[r72]=HEAP32[r72]+1|0}r101=HEAP32[r97+4>>2];L714:do{if((r101|0)==0){r95=r97|0;while(1){r100=HEAP32[r95+8>>2];if((r95|0)==(HEAP32[r100>>2]|0)){r124=r100;break L714}else{r95=r100}}}else{r95=r101;while(1){r100=HEAP32[r95>>2];if((r100|0)==0){r124=r95;break L714}else{r95=r100}}}}while(0);if((r124|0)==(HEAP32[r24]+16|0)){break L702}else{r97=r124}}}}while(0);r93=HEAP32[r102+4>>2];L722:do{if((r93|0)==0){r92=r102|0;while(1){r97=HEAP32[r92+8>>2];if((r92|0)==(HEAP32[r97>>2]|0)){r125=r97;break L722}else{r92=r97}}}else{r92=r93;while(1){r97=HEAP32[r92>>2];if((r97|0)==0){r125=r92;break L722}else{r92=r97}}}}while(0);if((r125|0)==(r94|0)){break L698}else{r102=r125}}}}while(0);while(1){if((HEAP32[r72]|0)==0){break}r89=HEAP32[r71>>2];r91=HEAP32[r89+8>>2];r102=r89+4|0;r94=r89|0;HEAP32[HEAP32[r94>>2]+4>>2]=HEAP32[r102>>2];HEAP32[HEAP32[r102>>2]>>2]=HEAP32[r94>>2];HEAP32[r72]=HEAP32[r72]-1|0;__ZdlPv(r89);__ZZZN8Relooper9CalculateEP5BlockEN8Analyzer21FindIndependentGroupsE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_RNS3_3mapIS1_S9_S6_NS7_INS3_4pairIKS1_S9_EEEEEEEN11HelperClass22InvalidateWithChildrenES1_(r15,r91)}r91=HEAP32[r96+4>>2];L733:do{if((r91|0)==0){r89=r96|0;while(1){r94=HEAP32[r89+8>>2];if((r89|0)==(HEAP32[r94>>2]|0)){r126=r94;break L733}else{r89=r94}}}else{r89=r91;while(1){r94=HEAP32[r89>>2];if((r94|0)==0){r126=r89;break L733}else{r89=r94}}}}while(0);if((r126|0)==(r87|0)){break}else{r96=r126}}r96=HEAP32[r80];if((r96|0)==(r86|0)){break}else{r127=r96}while(1){r96=r127+16|0;if((HEAP32[__ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r32,r96)+8>>2]|0)==0){__ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE14__erase_uniqueIS3_EEjRKT_(r46,r96)}r96=HEAP32[r127+4>>2];L747:do{if((r96|0)==0){r91=r127|0;while(1){r89=HEAP32[r91+8>>2];if((r91|0)==(HEAP32[r89>>2]|0)){r128=r89;break L747}else{r91=r89}}}else{r91=r96;while(1){r89=HEAP32[r91>>2];if((r89|0)==0){r128=r91;break L747}else{r91=r89}}}}while(0);if((r128|0)==(r87|0)){break L693}else{r127=r128}}}}while(0);L755:do{if((HEAP32[r60]|0)!=0){r98=HEAP32[r59];r87=HEAP32[r57]+4|0;r96=r98|0;HEAP32[HEAP32[r96>>2]+4>>2]=HEAP32[r87>>2];HEAP32[HEAP32[r87>>2]>>2]=HEAP32[r96>>2];HEAP32[r60]=0;if((r98|0)==(r58|0)){break}else{r129=r98}while(1){r98=HEAP32[r129+4>>2];__ZdlPv(r129);if((r98|0)==(r58|0)){break L755}else{r129=r98}}}}while(0);__ZNSt3__16__treeINS_4pairIP5BlockS3_EENS_19__map_value_compareIS3_S3_NS_4lessIS3_EELb1EEENS_9allocatorIS4_EEE7destroyEPNS_11__tree_nodeIS4_PvEE(r16,HEAP32[r61>>2]);r98=HEAP32[r49];do{if((r98|0)==0){r4=721}else{r96=HEAP32[r51];if((r96|0)==(r50|0)){r130=r98}else{r87=r96,r96=r87>>2;while(1){r91=HEAP32[r96+4];r89=r87|0;r94=HEAP32[r96+1];r102=(r94|0)==0;L765:do{if(r102){r93=r89;while(1){r92=HEAP32[r93+8>>2];if((r93|0)==(HEAP32[r92>>2]|0)){r131=r92;break L765}else{r93=r92}}}else{r93=r94;while(1){r92=HEAP32[r93>>2];if((r92|0)==0){r131=r93;break L765}else{r93=r92}}}}while(0);r93=r131;r92=HEAP32[r91+12>>2];r97=r91+16|0;L771:do{if((r92|0)!=(r97|0)){r101=r87+20|0;r103=r87+24|0;r95=r103;r100=HEAP32[r103>>2];L773:do{if((r100|0)!=0){r103=r92;while(1){r115=HEAP32[r103+16>>2];r132=r100;r133=r95;L776:while(1){r134=r132,r135=r134>>2;while(1){r136=r134;if(HEAP32[r135+4]>>>0>=r115>>>0){break}r137=HEAP32[r135+1];if((r137|0)==0){r138=r133;break L776}else{r134=r137,r135=r134>>2}}r134=HEAP32[r135];if((r134|0)==0){r138=r136;break}else{r132=r134;r133=r136}}if((r138|0)==(r95|0)){break L773}if(r115>>>0<HEAP32[r138+16>>2]>>>0){break L773}r133=HEAP32[r103+4>>2];L785:do{if((r133|0)==0){r132=r103|0;while(1){r134=HEAP32[r132+8>>2];if((r132|0)==(HEAP32[r134>>2]|0)){r139=r134;break L785}else{r132=r134}}}else{r132=r133;while(1){r135=HEAP32[r132>>2];if((r135|0)==0){r139=r132;break L785}else{r132=r135}}}}while(0);if((r139|0)==(r97|0)){break L771}else{r103=r139}}}}while(0);L793:do{if(r102){r95=r89;while(1){r100=HEAP32[r95+8>>2];if((r95|0)==(HEAP32[r100>>2]|0)){r140=r100;break L793}else{r95=r100}}}else{r95=r94;while(1){r100=HEAP32[r95>>2];if((r100|0)==0){r140=r95;break L793}else{r95=r100}}}}while(0);if((HEAP32[r51]|0)==(r87|0)){HEAP32[r51]=r140}HEAP32[r49]=HEAP32[r49]-1|0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r101,HEAP32[r96+6]);__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r62>>2],r89);__ZdlPv(r87)}}while(0);if((r131|0)==(r47|0)){break}else{r87=r93,r96=r87>>2}}r130=HEAP32[r49]}if((r130|0)==2){r87=HEAP32[r51],r96=r87>>2;r89=HEAP32[r96+4];HEAP32[r33>>2]=r89;r94=HEAP32[r96+7];r102=HEAP32[r96+1];L807:do{if((r102|0)==0){r96=r87|0;while(1){r97=HEAP32[r96+8>>2];if((r96|0)==(HEAP32[r97>>2]|0)){r141=r97;break L807}else{r96=r97}}}else{r96=r102;while(1){r93=HEAP32[r96>>2];if((r93|0)==0){r141=r96;break L807}else{r96=r93}}}}while(0);r102=HEAP32[r141+16>>2];HEAP32[r34>>2]=r102;r87=HEAP32[r141+28>>2];L814:do{if((r94|0)!=(r87|0)){if((r94|0)>(r87|0)){HEAP32[r33>>2]=r102;HEAP32[r34>>2]=r89}r96=__ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r32,r33);r93=HEAP32[r96>>2];r97=r96+4|0;r96=r97;L820:do{if((r93|0)!=(r96|0)){r92=r97|0;r91=r93;while(1){r95=HEAP32[r91+16>>2];r100=HEAP32[r95>>2];r103=r95+4|0;L824:do{if((r100|0)!=(r103|0)){r95=HEAP32[r92>>2];r133=(r95|0)==0;r115=r100;while(1){r132=HEAP32[r115+16>>2];if(r133){break L814}else{r142=r95;r143=r96}L828:while(1){r135=r142,r134=r135>>2;while(1){r144=r135;if(HEAP32[r134+4]>>>0>=r132>>>0){break}r137=HEAP32[r134+1];if((r137|0)==0){r145=r143;break L828}else{r135=r137,r134=r135>>2}}r135=HEAP32[r134];if((r135|0)==0){r145=r144;break}else{r142=r135;r143=r144}}if((r145|0)==(r96|0)){break L814}if(r132>>>0<HEAP32[r145+16>>2]>>>0){break L814}r135=HEAP32[r115+4>>2];L837:do{if((r135|0)==0){r137=r115|0;while(1){r146=HEAP32[r137+8>>2];if((r137|0)==(HEAP32[r146>>2]|0)){r147=r146;break L837}else{r137=r146}}}else{r137=r135;while(1){r134=HEAP32[r137>>2];if((r134|0)==0){r147=r137;break L837}else{r137=r134}}}}while(0);if((r147|0)==(r103|0)){break L824}else{r115=r147}}}}while(0);r103=HEAP32[r91+4>>2];L845:do{if((r103|0)==0){r100=r91|0;while(1){r115=HEAP32[r100+8>>2];if((r100|0)==(HEAP32[r115>>2]|0)){r148=r115;break L845}else{r100=r115}}}else{r100=r103;while(1){r115=HEAP32[r100>>2];if((r115|0)==0){r148=r100;break L845}else{r100=r115}}}}while(0);if((r148|0)==(r97|0)){break L820}else{r91=r148}}}}while(0);__ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE14__erase_uniqueIS3_EEjRKT_(r46,r34)}}while(0);r149=HEAP32[r49]}else{r149=r130}if((r149|0)==0){r4=721;break}r89=(r77|0)==0;if(r89){r150=1}else{r150=(HEAP32[r78+3]|0)!=0}r102=__Znwj(36),r87=r102>>2;r94=HEAP32[1311186];HEAP32[1311186]=r94+1|0;HEAP32[r87+1]=r94;HEAP32[r87+2]=0;HEAP32[r87+3]=1;HEAP8[r102+16|0]=0;HEAP32[r87]=5244376;r94=r102+24|0;HEAP32[r94>>2]=0;HEAP32[r87+7]=0;r97=r102+20|0;HEAP32[r97>>2]=r94;HEAP32[r87+8]=0;r87=r102;r102=HEAP32[r35>>2];r94=r102+32|0;r96=HEAP32[r94>>2];r93=r102+28|0;r91=HEAP32[r93>>2];if((r96|0)==(r91|0)){r151=0}else{r151=(r96-r91<<8)-1|0}r92=r102+40|0;r101=HEAP32[r92>>2];r103=(r102+44|0)>>2;r100=HEAP32[r103];if((r151|0)==(r100+r101|0)){__ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r102+24|0);r152=HEAP32[r103];r153=HEAP32[r92>>2];r154=HEAP32[r93>>2];r155=HEAP32[r94>>2]}else{r152=r100;r153=r101;r154=r91;r155=r96}r96=r152+r153|0;do{if((r155|0)==(r154|0)){r156=r152}else{r91=((r96&1023)<<2)+HEAP32[r154+(r96>>>10<<2)>>2]|0;if((r91|0)==0){r156=r152;break}HEAP32[r91>>2]=r87;r156=HEAP32[r103]}}while(0);HEAP32[r103]=r156+1|0;HEAP32[r65]=0;HEAP32[r66>>2]=0;HEAP32[r64>>2]=r67;r96=HEAP32[r51];L871:do{if((r96|0)!=(r50|0)){r91=r97;r101=r96;r100=0;while(1){HEAP32[r10>>2]=HEAP32[r101+16>>2];r94=r101+20|0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r63,r100);HEAP32[r66>>2]=0;HEAP32[r64>>2]=r67;HEAP32[r65]=0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r8,r63,r10);r93=HEAP32[r94>>2];r92=r101+24|0;r102=r92;L876:do{if((r93|0)!=(r102|0)){r115=r92|0;r95=r93;while(1){r133=HEAP32[r95+16>>2];r135=HEAP32[r38];do{if((r135|0)!=0){r132=r135;r137=r37;L881:while(1){r134=r132,r146=r134>>2;while(1){r157=r134;if(HEAP32[r146+4]>>>0>=r133>>>0){break}r158=HEAP32[r146+1];if((r158|0)==0){r159=r137;break L881}else{r134=r158,r146=r134>>2}}r134=HEAP32[r146];if((r134|0)==0){r159=r157;break}else{r132=r134;r137=r157}}if((r159|0)==(r37|0)){break}if(r133>>>0<HEAP32[r159+16>>2]>>>0){break}r137=r159|0;r132=HEAP32[r159+4>>2];L890:do{if((r132|0)==0){r134=r137;while(1){r158=HEAP32[r134+8>>2];if((r134|0)==(HEAP32[r158>>2]|0)){r160=r158;break L890}else{r134=r158}}}else{r134=r132;while(1){r146=HEAP32[r134>>2];if((r146|0)==0){r160=r134;break L890}else{r134=r146}}}}while(0);if((HEAP32[r45]|0)==(r159|0)){HEAP32[r45]=r160}HEAP32[r31]=HEAP32[r31]-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r135,r137);__ZdlPv(r159)}}while(0);r135=HEAP32[r133>>2];r132=r133+4|0;L900:do{if((r135|0)!=(r132|0)){r134=r135;while(1){r146=HEAP32[r134+16>>2];HEAP32[r11>>2]=r146;r158=HEAP32[r134+4>>2];L903:do{if((r158|0)==0){r161=r134|0;while(1){r162=HEAP32[r161+8>>2];if((r161|0)==(HEAP32[r162>>2]|0)){r163=r162;break L903}else{r161=r162}}}else{r161=r158;while(1){r162=HEAP32[r161>>2];if((r162|0)==0){r163=r161;break L903}else{r161=r162}}}}while(0);r158=r163;r161=HEAP32[r115>>2];do{if((r161|0)==0){r4=680}else{r162=r161;r164=r102;L911:while(1){r165=r162,r166=r165>>2;while(1){r167=r165;if(HEAP32[r166+4]>>>0>=r146>>>0){break}r168=HEAP32[r166+1];if((r168|0)==0){r169=r164;break L911}else{r165=r168,r166=r165>>2}}r165=HEAP32[r166];if((r165|0)==0){r169=r167;break}else{r162=r165;r164=r167}}if((r169|0)==(r102|0)){r4=680;break}if(r146>>>0<HEAP32[r169+16>>2]>>>0){r4=680;break}else{break}}}while(0);if(r4==680){r4=0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r7,r84,r11);__ZZN8Relooper9CalculateEP5BlockEN8Analyzer9SolipsizeE_0S1_N6Branch8FlowTypeEP5ShapeRNSt3__13setIS1_NS7_4lessIS1_EENS7_9allocatorIS1_EEEE(HEAP32[r11>>2],1,r87,r94)}if((r163|0)==(r132|0)){break L900}else{r134=r158}}}}while(0);r132=HEAP32[r95+4>>2];L924:do{if((r132|0)==0){r135=r95|0;while(1){r133=HEAP32[r135+8>>2];if((r135|0)==(HEAP32[r133>>2]|0)){r170=r133;break L924}else{r135=r133}}}else{r135=r132;while(1){r133=HEAP32[r135>>2];if((r133|0)==0){r170=r135;break L924}else{r135=r133}}}}while(0);if((r170|0)==(r92|0)){break L876}r95=r170}}}while(0);r92=__ZZN8Relooper9CalculateEP5BlockEN8Analyzer7ProcessE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_P5Shape(r1,r94,r9);HEAP32[__ZNSt3__13mapIP5BlockP5ShapeNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r91,r10)>>2]=r92;if(r150){HEAP8[HEAP32[r10>>2]+64|0]=1}r92=HEAP32[r101+4>>2];L938:do{if((r92|0)==0){r102=r101|0;while(1){r93=HEAP32[r102+8>>2];if((r102|0)==(HEAP32[r93>>2]|0)){r171=r93;break L938}else{r102=r93}}}else{r102=r92;while(1){r93=HEAP32[r102>>2];if((r93|0)==0){r171=r102;break L938}else{r102=r93}}}}while(0);if((r171|0)==(r47|0)){break L871}r101=r171;r100=HEAP32[r65]}}}while(0);r96=HEAP32[r80];L947:do{if((r96|0)!=(r86|0)){r97=r96;while(1){r103=HEAP32[r97+16>>2];HEAP32[r12>>2]=r103;r100=HEAP32[r48>>2];do{if((r100|0)==0){r4=711}else{r101=r100;r91=r50;L951:while(1){r92=r101,r94=r92>>2;while(1){r172=r92;if(HEAP32[r94+4]>>>0>=r103>>>0){break}r102=HEAP32[r94+1];if((r102|0)==0){r173=r91;break L951}else{r92=r102,r94=r92>>2}}r92=HEAP32[r94];if((r92|0)==0){r173=r172;break}else{r101=r92;r91=r172}}if((r173|0)==(r50|0)){r4=711;break}if(r103>>>0<HEAP32[r173+16>>2]>>>0){r4=711;break}else{break}}}while(0);if(r4==711){r4=0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r6,r84,r12)}r103=HEAP32[r97+4>>2];L962:do{if((r103|0)==0){r100=r97|0;while(1){r91=HEAP32[r100+8>>2];if((r100|0)==(HEAP32[r91>>2]|0)){r174=r91;break L962}else{r100=r91}}}else{r100=r103;while(1){r91=HEAP32[r100>>2];if((r91|0)==0){r174=r100;break L962}else{r100=r91}}}}while(0);if((r174|0)==(r85|0)){break L947}r97=r174}}}while(0);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r63,HEAP32[r68>>2]);if(!r89){HEAP32[r78+2]=r87}r96=(r81|0)==0?r87:r81;r97=(HEAP32[r88]|0)==0;r175=r97?r96:r73;r176=r97?r77:r87;r177=r97?r79:r83;r178=r96;r179=r97?1:2;break}}while(0);if(r4==721){r4=0;r85=__ZZN8Relooper9CalculateEP5BlockEN8Analyzer8MakeLoopE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_SA_(r1,r2,r79,r83);if((r77|0)!=0){HEAP32[r78+2]=r85}r86=(r81|0)==0?r85:r81;r80=(HEAP32[r88]|0)==0;r175=r80?r86:r73;r176=r80?r77:r85;r177=r80?r79:r83;r178=r86;r179=r80?1:2}__ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE7destroyEPNS_11__tree_nodeISA_PvEE(r46,HEAP32[r62>>2]);if((r179|0)==2){r73=r175;r74=r176;r75=r177;r3=r82;r76=r178}else{r90=r175;r4=731;break}}if(r4==728){r175=r30+12|0;r178=r30+16|0,r76=r178>>2;r82=HEAP32[r76];r3=r82;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r175,r3);r177=r30|0;r75=r30+4|0,r176=r75>>2;r74=HEAP32[r176];r73=r74;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r177,r73);STACKTOP=r5;return r90}else if(r4==729){r175=r30+12|0;r178=r30+16|0,r76=r178>>2;r82=HEAP32[r76];r3=r82;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r175,r3);r177=r30|0;r75=r30+4|0,r176=r75>>2;r74=HEAP32[r176];r73=r74;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r177,r73);STACKTOP=r5;return r90}else if(r4==730){r175=r30+12|0;r178=r30+16|0,r76=r178>>2;r82=HEAP32[r76];r3=r82;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r175,r3);r177=r30|0;r75=r30+4|0,r176=r75>>2;r74=HEAP32[r176];r73=r74;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r177,r73);STACKTOP=r5;return r90}else if(r4==731){r175=r30+12|0;r178=r30+16|0,r76=r178>>2;r82=HEAP32[r76];r3=r82;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r175,r3);r177=r30|0;r75=r30+4|0,r176=r75>>2;r74=HEAP32[r176];r73=r74;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r177,r73);STACKTOP=r5;return r90}}function _rl_set_output_buffer(r1,r2){HEAP32[1311192]=r1;HEAP32[1311190]=r1;HEAP32[1311189]=r2;return}function _rl_set_asm_js_mode(r1){HEAP32[1311188]=r1;return}function __ZN9LoopShapeD1Ev(r1){return}function __ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=0;r4=(r2|0)==(r1|0);HEAP8[r2+12|0]=r4&1;if(r4){return}else{r5=r2}while(1){r6=(r5+8|0)>>2;r7=HEAP32[r6];r2=r7+12|0;if((HEAP8[r2]&1)<<24>>24!=0){r3=772;break}r8=(r7+8|0)>>2;r9=HEAP32[r8];r4=HEAP32[r9>>2];if((r7|0)==(r4|0)){r10=HEAP32[r9+4>>2];if((r10|0)==0){r3=741;break}r11=r10+12|0;if((HEAP8[r11]&1)<<24>>24!=0){r3=741;break}HEAP8[r2]=1;HEAP8[r9+12|0]=(r9|0)==(r1|0)&1;HEAP8[r11]=1}else{if((r4|0)==0){r3=758;break}r11=r4+12|0;if((HEAP8[r11]&1)<<24>>24!=0){r3=758;break}HEAP8[r2]=1;HEAP8[r9+12|0]=(r9|0)==(r1|0)&1;HEAP8[r11]=1}if((r9|0)==(r1|0)){r3=776;break}else{r5=r9}}if(r3==758){r1=r7|0;if((r5|0)==(HEAP32[r1>>2]|0)){r11=r5+4|0;r2=HEAP32[r11>>2];HEAP32[r1>>2]=r2;if((r2|0)==0){r12=r9}else{HEAP32[r2+8>>2]=r7;r12=HEAP32[r8]}HEAP32[r6]=r12;r12=HEAP32[r8];r2=r12|0;if((HEAP32[r2>>2]|0)==(r7|0)){HEAP32[r2>>2]=r5}else{HEAP32[r12+4>>2]=r5}HEAP32[r11>>2]=r7;HEAP32[r8]=r5;r13=r5;r14=HEAP32[r6]}else{r13=r7;r14=r9}HEAP8[r13+12|0]=1;HEAP8[r14+12|0]=0;r13=r14+4|0;r6=HEAP32[r13>>2];r11=r6|0;r12=HEAP32[r11>>2];HEAP32[r13>>2]=r12;if((r12|0)!=0){HEAP32[r12+8>>2]=r14}r12=(r14+8|0)>>2;HEAP32[r6+8>>2]=HEAP32[r12];r13=HEAP32[r12];r2=r13|0;if((HEAP32[r2>>2]|0)==(r14|0)){HEAP32[r2>>2]=r6}else{HEAP32[r13+4>>2]=r6}HEAP32[r11>>2]=r14;HEAP32[r12]=r6;return}else if(r3==772){return}else if(r3==776){return}else if(r3==741){if((r5|0)==(HEAP32[r7>>2]|0)){r15=r7;r16=r9}else{r5=r7+4|0;r3=HEAP32[r5>>2];r6=r3|0;r12=HEAP32[r6>>2];HEAP32[r5>>2]=r12;if((r12|0)==0){r17=r9}else{HEAP32[r12+8>>2]=r7;r17=HEAP32[r8]}r12=r3+8|0;HEAP32[r12>>2]=r17;r17=HEAP32[r8];r9=r17|0;if((HEAP32[r9>>2]|0)==(r7|0)){HEAP32[r9>>2]=r3}else{HEAP32[r17+4>>2]=r3}HEAP32[r6>>2]=r7;HEAP32[r8]=r3;r15=r3;r16=HEAP32[r12>>2]}HEAP8[r15+12|0]=1;HEAP8[r16+12|0]=0;r15=r16|0;r12=HEAP32[r15>>2];r3=r12+4|0;r8=HEAP32[r3>>2];HEAP32[r15>>2]=r8;if((r8|0)!=0){HEAP32[r8+8>>2]=r16}r8=(r16+8|0)>>2;HEAP32[r12+8>>2]=HEAP32[r8];r15=HEAP32[r8];r7=r15|0;if((HEAP32[r7>>2]|0)==(r16|0)){HEAP32[r7>>2]=r12}else{HEAP32[r15+4>>2]=r12}HEAP32[r3>>2]=r16;HEAP32[r8]=r12;return}}function __ZNSt3__13mapIPviNS_4lessIS1_EENS_9allocatorINS_4pairIKS1_iEEEEED1Ev(r1){__ZNSt3__16__treeINS_4pairIPviEENS_19__map_value_compareIS2_iNS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE7destroyEPNS_11__tree_nodeIS3_S2_EE(r1|0,HEAP32[r1+4>>2]);return}function _rl_make_output_buffer(r1){var r2;r2=_malloc(r1);HEAP32[1311192]=r2;HEAP32[1311190]=r2;HEAP32[1311189]=r1;return}function _rl_new_block(r1){var r2,r3,r4;r2=__Znwj(68),r3=r2>>2;r4=r2+4|0;HEAP32[r4>>2]=0;HEAP32[r3+2]=0;HEAP32[r3]=r4;r4=r2+16|0;HEAP32[r4>>2]=0;HEAP32[r3+5]=0;HEAP32[r3+3]=r4;r4=r2+28|0;HEAP32[r4>>2]=0;HEAP32[r3+8]=0;HEAP32[r3+6]=r4;r4=r2+40|0;HEAP32[r4>>2]=0;HEAP32[r3+11]=0;HEAP32[r3+9]=r4;HEAP32[r3+12]=0;r4=HEAP32[1311187];HEAP32[1311187]=r4+1|0;HEAP32[r3+13]=r4;HEAP32[r3+15]=0;HEAP8[r2+64|0]=0;HEAP32[r3+14]=_strdup(r1);return r2}function _rl_delete_block(r1){if((r1|0)==0){return}__ZN5BlockD2Ev(r1);__ZdlPv(r1);return}function _rl_block_add_branch_to(r1,r2,r3,r4){__ZN5Block11AddBranchToEPS_PKcS2_(r1,r2,r3,r4);return}function _rl_new_relooper(){var r1;r1=__Znwj(52);_memset(r1,0,52);return r1}function _rl_delete_relooper(r1){if((r1|0)==0){return}__ZN8RelooperD2Ev(r1);__ZdlPv(r1);return}function _rl_relooper_add_block(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=r1+8|0;r4=HEAP32[r3>>2];r5=r1+4|0;r6=HEAP32[r5>>2];if((r4|0)==(r6|0)){r7=0}else{r7=(r4-r6<<8)-1|0}r8=r1+16|0;r9=HEAP32[r8>>2];r10=(r1+20|0)>>2;r11=HEAP32[r10];if((r7|0)==(r11+r9|0)){__ZNSt3__15dequeIP5BlockNS_9allocatorIS2_EEE19__add_back_capacityEv(r1);r12=HEAP32[r10];r13=HEAP32[r8>>2];r14=HEAP32[r5>>2];r15=HEAP32[r3>>2]}else{r12=r11;r13=r9;r14=r6;r15=r4}r4=r12+r13|0;if((r15|0)==(r14|0)){r16=r12;r17=r16+1|0;HEAP32[r10]=r17;return}r15=((r4&1023)<<2)+HEAP32[r14+(r4>>>10<<2)>>2]|0;if((r15|0)==0){r16=r12;r17=r16+1|0;HEAP32[r10]=r17;return}HEAP32[r15>>2]=r2;r16=HEAP32[r10];r17=r16+1|0;HEAP32[r10]=r17;return}function _rl_relooper_calculate(r1,r2){__ZN8Relooper9CalculateEP5Block(r1,r2);return}function _rl_relooper_render(r1){var r2;HEAP32[1311192]=HEAP32[1311190];r2=HEAP32[r1+48>>2];FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+8>>2]](r2,0);return}function __ZN13MultipleShapeD1Ev(r1){HEAP32[r1>>2]=5244376;__ZNSt3__16__treeINS_4pairIP5BlockP5ShapeEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1+20|0,HEAP32[r1+24>>2]);return}function __ZN13MultipleShapeD0Ev(r1){HEAP32[r1>>2]=5244376;__ZNSt3__16__treeINS_4pairIP5BlockP5ShapeEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1+20|0,HEAP32[r1+24>>2]);__ZdlPv(r1);return}function __ZN9LoopShapeD0Ev(r1){__ZdlPv(r1);return}function __ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+4|0;r6=r5,r7=r6>>2;r8=r2+4|0;r9=r8|0;r10=HEAP32[r9>>2];do{if((r10|0)==0){r11=r8;HEAP32[r7]=r11;r12=r9,r13=r12>>2;r14=r11}else{r11=HEAP32[r3>>2];r15=r10;while(1){r16=HEAP32[r15+16>>2];if(r11>>>0<r16>>>0){r17=r15|0;r18=HEAP32[r17>>2];if((r18|0)==0){r4=816;break}else{r15=r18;continue}}if(r16>>>0>=r11>>>0){r4=820;break}r19=r15+4|0;r16=HEAP32[r19>>2];if((r16|0)==0){r4=819;break}else{r15=r16}}if(r4==816){HEAP32[r7]=r15;r12=r17,r13=r12>>2;r14=r15;break}else if(r4==819){HEAP32[r7]=r15;r12=r19,r13=r12>>2;r14=r15;break}else if(r4==820){HEAP32[r7]=r15;r12=r6,r13=r12>>2;r14=r15;break}}}while(0);r6=HEAP32[r13];if((r6|0)!=0){r20=r6;r21=0;r22=r1|0;HEAP32[r22>>2]=r20;r23=r1+4|0;HEAP8[r23]=r21;STACKTOP=r5;return}r6=__Znwj(20),r7=r6>>2;r4=r6+16|0;if((r4|0)!=0){HEAP32[r4>>2]=HEAP32[r3>>2]}r3=r6;HEAP32[r7]=0;HEAP32[r7+1]=0;HEAP32[r7+2]=r14;HEAP32[r13]=r3;r14=r2|0;r7=HEAP32[HEAP32[r14>>2]>>2];if((r7|0)==0){r24=r3}else{HEAP32[r14>>2]=r7;r24=HEAP32[r13]}__ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r2+4>>2],r24);r24=r2+8|0;HEAP32[r24>>2]=HEAP32[r24>>2]+1|0;r20=r6;r21=1;r22=r1|0;HEAP32[r22>>2]=r20;r23=r1+4|0;HEAP8[r23]=r21;STACKTOP=r5;return}function __ZNSt3__114__split_bufferIPP5BlockNS_9allocatorIS3_EEE10push_frontERKS3_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=(r1|0)>>2;do{if((r4|0)==(HEAP32[r5]|0)){r6=(r1+8|0)>>2;r7=HEAP32[r6];r8=r1+12|0;r9=HEAP32[r8>>2];r10=r9;if(r7>>>0<r9>>>0){r9=r7;r11=(r10-r9+4>>2|0)/2&-1;r12=r9-r4|0;r9=(r11-(r12>>2)<<2)+r7|0;_memmove(r9,r4,r12,4,0);HEAP32[r3]=r9;HEAP32[r6]=(r11<<2)+HEAP32[r6]|0;r13=r9;break}r9=r10-r4>>1;r10=(r9|0)==0?1:r9;r9=__Znwj(r10<<2);r11=((r10+3|0)>>>2<<2)+r9|0;r12=(r10<<2)+r9|0;r10=HEAP32[r3];r7=HEAP32[r6];L1111:do{if((r10|0)==(r7|0)){r14=r11}else{r15=r10;r16=r11;while(1){if((r16|0)==0){r17=0}else{HEAP32[r16>>2]=HEAP32[r15>>2];r17=r16}r18=r17+4|0;r19=r15+4|0;if((r19|0)==(r7|0)){r14=r18;break L1111}else{r15=r19;r16=r18}}}}while(0);r7=HEAP32[r5];HEAP32[r5]=r9;HEAP32[r3]=r11;HEAP32[r6]=r14;HEAP32[r8>>2]=r12;if((r7|0)==0){r13=r11;break}__ZdlPv(r7);r13=HEAP32[r3]}else{r13=r4}}while(0);r4=r13-4|0;if((r4|0)==0){r20=r13;r21=r20-4|0;HEAP32[r3]=r21;return}HEAP32[r4>>2]=HEAP32[r2>>2];r20=HEAP32[r3];r21=r20-4|0;HEAP32[r3]=r21;return}function __ZNSt3__114__split_bufferIPP5BlockRNS_9allocatorIS3_EEE10push_frontERKS3_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=(r1|0)>>2;do{if((r4|0)==(HEAP32[r5]|0)){r6=(r1+8|0)>>2;r7=HEAP32[r6];r8=r1+12|0;r9=HEAP32[r8>>2];r10=r9;if(r7>>>0<r9>>>0){r9=r7;r11=(r10-r9+4>>2|0)/2&-1;r12=r9-r4|0;r9=(r11-(r12>>2)<<2)+r7|0;_memmove(r9,r4,r12,4,0);HEAP32[r3]=r9;HEAP32[r6]=(r11<<2)+HEAP32[r6]|0;r13=r9;break}r9=r10-r4>>1;r10=(r9|0)==0?1:r9;r9=__Znwj(r10<<2);r11=((r10+3|0)>>>2<<2)+r9|0;r12=(r10<<2)+r9|0;r10=HEAP32[r3];r7=HEAP32[r6];L1130:do{if((r10|0)==(r7|0)){r14=r11}else{r15=r10;r16=r11;while(1){if((r16|0)==0){r17=0}else{HEAP32[r16>>2]=HEAP32[r15>>2];r17=r16}r18=r17+4|0;r19=r15+4|0;if((r19|0)==(r7|0)){r14=r18;break L1130}else{r15=r19;r16=r18}}}}while(0);r7=HEAP32[r5];HEAP32[r5]=r9;HEAP32[r3]=r11;HEAP32[r6]=r14;HEAP32[r8>>2]=r12;if((r7|0)==0){r13=r11;break}__ZdlPv(r7);r13=HEAP32[r3]}else{r13=r4}}while(0);r4=r13-4|0;if((r4|0)==0){r20=r13;r21=r20-4|0;HEAP32[r3]=r21;return}HEAP32[r4>>2]=HEAP32[r2>>2];r20=HEAP32[r3];r21=r20-4|0;HEAP32[r3]=r21;return}function __ZNSt3__16__treeINS_4pairIP5BlockP5ShapeEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1,r2){if((r2|0)==0){return}else{__ZNSt3__16__treeINS_4pairIP5BlockP5ShapeEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1,HEAP32[r2>>2]);__ZNSt3__16__treeINS_4pairIP5BlockP5ShapeEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1,HEAP32[r2+4>>2]);__ZdlPv(r2);return}}function __ZNSt3__16__treeINS_4pairIPviEENS_19__map_value_compareIS2_iNS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE7destroyEPNS_11__tree_nodeIS3_S2_EE(r1,r2){if((r2|0)==0){return}else{__ZNSt3__16__treeINS_4pairIPviEENS_19__map_value_compareIS2_iNS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE7destroyEPNS_11__tree_nodeIS3_S2_EE(r1,HEAP32[r2>>2]);__ZNSt3__16__treeINS_4pairIPviEENS_19__map_value_compareIS2_iNS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE7destroyEPNS_11__tree_nodeIS3_S2_EE(r1,HEAP32[r2+4>>2]);__ZdlPv(r2);return}}function __ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r1,r2){if((r2|0)==0){return}else{__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r1,HEAP32[r2>>2]);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r1,HEAP32[r2+4>>2]);__ZdlPv(r2);return}}function __ZNSt3__15dequeIP5BlockNS_9allocatorIS2_EEE19__add_back_capacityEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+4;r5=r1+16|0;r6=HEAP32[r5>>2];if(r6>>>0>1023){HEAP32[r5>>2]=r6-1024|0;r6=(r1+4|0)>>2;r5=HEAP32[r6];r7=HEAP32[r5>>2];r8=r5+4|0;HEAP32[r6]=r8;r9=(r1+8|0)>>2;r10=HEAP32[r9];r11=r1+12|0;do{if((r10|0)==(HEAP32[r11>>2]|0)){r12=(r1|0)>>2;r13=HEAP32[r12];if(r8>>>0>r13>>>0){r14=r8;r15=(r14-r13+4>>2|0)/-2&-1;r16=r15+1|0;r17=r10-r14|0;_memmove((r16<<2)+r5|0,r8,r17,4,0);r14=((r17>>2)+r16<<2)+r5|0;HEAP32[r9]=r14;HEAP32[r6]=(r15<<2)+HEAP32[r6]|0;r18=r14;break}r14=r10-r13>>1;r13=(r14|0)==0?1:r14;r14=__Znwj(r13<<2);r15=(r13>>>2<<2)+r14|0;r16=(r13<<2)+r14|0;r13=HEAP32[r6];r17=HEAP32[r9];L1163:do{if((r13|0)==(r17|0)){r19=r15}else{r20=r13;r21=r15;while(1){if((r21|0)==0){r22=0}else{HEAP32[r21>>2]=HEAP32[r20>>2];r22=r21}r23=r22+4|0;r24=r20+4|0;if((r24|0)==(r17|0)){r19=r23;break L1163}else{r20=r24;r21=r23}}}}while(0);r17=HEAP32[r12];HEAP32[r12]=r14;HEAP32[r6]=r15;HEAP32[r9]=r19;HEAP32[r11>>2]=r16;if((r17|0)==0){r18=r19;break}__ZdlPv(r17);r18=HEAP32[r9]}else{r18=r10}}while(0);if((r18|0)==0){r25=0}else{HEAP32[r18>>2]=r7;r25=HEAP32[r9]}HEAP32[r9]=r25+4|0;STACKTOP=r2;return}r25=r1|0;r9=(r1+8|0)>>2;r7=HEAP32[r9];r18=(r1+4|0)>>2;r10=r7-HEAP32[r18]>>2;r19=r1+12|0;r11=(r19|0)>>2;r6=HEAP32[r11];r22=(r1|0)>>2;r1=r6-HEAP32[r22]|0;if(r10>>>0>=r1>>2>>>0){r5=r1>>1;r1=(r5|0)==0?1:r5;r5=(r4+12|0)>>2;HEAP32[r4+16>>2]=r19;r19=__Znwj(r1<<2);r8=r19;r17=(r4|0)>>2;HEAP32[r17]=r8;r13=(r10<<2)+r8|0;r21=(r4+8|0)>>2;HEAP32[r21]=r13;r20=(r4+4|0)>>2;HEAP32[r20]=r13;HEAP32[r5]=(r1<<2)+r8|0;r23=__Znwj(4096);do{if((r10|0)==(r1|0)){r24=r13-r19|0;if(r13>>>0>r8>>>0){r26=(r10+((r24+4>>2|0)/-2&-1)<<2)+r8|0;HEAP32[r21]=r26;HEAP32[r20]=r26;r27=r26;break}r26=r24>>1;r24=(r26|0)==0?1:r26;r26=__Znwj(r24<<2);r28=(r24>>>2<<2)+r26|0;HEAP32[r17]=r26;HEAP32[r20]=r28;HEAP32[r21]=r28;HEAP32[r5]=(r24<<2)+r26|0;if((r19|0)==0){r27=r28;break}__ZdlPv(r19);r27=r28}else{r27=r13}}while(0);if((r27|0)==0){r29=0}else{HEAP32[r27>>2]=r23;r29=HEAP32[r21]}HEAP32[r21]=r29+4|0;r29=HEAP32[r9];while(1){if((r29|0)==(HEAP32[r18]|0)){break}r23=r29-4|0;__ZNSt3__114__split_bufferIPP5BlockRNS_9allocatorIS3_EEE10push_frontERKS3_(r4,r23);r29=r23}r4=HEAP32[r22];HEAP32[r22]=HEAP32[r17];HEAP32[r17]=r4;HEAP32[r18]=HEAP32[r20];HEAP32[r20]=r29;r20=HEAP32[r9];HEAP32[r9]=HEAP32[r21];HEAP32[r21]=r20;r17=HEAP32[r11];HEAP32[r11]=HEAP32[r5];HEAP32[r5]=r17;if((r29|0)!=(r20|0)){HEAP32[r21]=(((r20-4+ -r29|0)>>>2^-1)<<2)+r20|0}if((r4|0)==0){STACKTOP=r2;return}__ZdlPv(r4);STACKTOP=r2;return}r4=__Znwj(4096);if((r6|0)==(r7|0)){HEAP32[r3>>2]=r4;__ZNSt3__114__split_bufferIPP5BlockNS_9allocatorIS3_EEE10push_frontERKS3_(r25,r3);r3=HEAP32[r18];r25=HEAP32[r3>>2];r7=r3+4|0;HEAP32[r18]=r7;r6=HEAP32[r9];do{if((r6|0)==(HEAP32[r11]|0)){r20=HEAP32[r22];if(r7>>>0>r20>>>0){r29=r7;r21=(r29-r20+4>>2|0)/-2&-1;r17=r21+1|0;r5=r6-r29|0;_memmove((r17<<2)+r3|0,r7,r5,4,0);r29=((r5>>2)+r17<<2)+r3|0;HEAP32[r9]=r29;HEAP32[r18]=(r21<<2)+HEAP32[r18]|0;r30=r29;break}r29=r6-r20>>1;r20=(r29|0)==0?1:r29;r29=__Znwj(r20<<2);r21=(r20>>>2<<2)+r29|0;r17=(r20<<2)+r29|0;r20=HEAP32[r18];r5=HEAP32[r9];L1210:do{if((r20|0)==(r5|0)){r31=r21}else{r23=r20;r27=r21;while(1){if((r27|0)==0){r32=0}else{HEAP32[r27>>2]=HEAP32[r23>>2];r32=r27}r13=r32+4|0;r19=r23+4|0;if((r19|0)==(r5|0)){r31=r13;break L1210}else{r23=r19;r27=r13}}}}while(0);r5=HEAP32[r22];HEAP32[r22]=r29;HEAP32[r18]=r21;HEAP32[r9]=r31;HEAP32[r11]=r17;if((r5|0)==0){r30=r31;break}__ZdlPv(r5);r30=HEAP32[r9]}else{r30=r6}}while(0);if((r30|0)==0){r33=0}else{HEAP32[r30>>2]=r25;r33=HEAP32[r9]}HEAP32[r9]=r33+4|0;STACKTOP=r2;return}else{r33=HEAP32[r9];do{if((r33|0)==(HEAP32[r11]|0)){r25=HEAP32[r18];r30=HEAP32[r22];if(r25>>>0>r30>>>0){r6=r25;r31=(r6-r30+4>>2|0)/-2&-1;r32=r33-r6|0;_memmove((r31<<2)+r25|0,r25,r32,4,0);r6=((r32>>2)+r31<<2)+r25|0;HEAP32[r9]=r6;HEAP32[r18]=(r31<<2)+HEAP32[r18]|0;r34=r6;break}r6=r33-r30>>1;r30=(r6|0)==0?1:r6;r6=__Znwj(r30<<2);r31=(r30>>>2<<2)+r6|0;r25=(r30<<2)+r6|0;r30=HEAP32[r18];r32=HEAP32[r9];L1229:do{if((r30|0)==(r32|0)){r35=r31}else{r3=r30;r7=r31;while(1){if((r7|0)==0){r36=0}else{HEAP32[r7>>2]=HEAP32[r3>>2];r36=r7}r5=r36+4|0;r20=r3+4|0;if((r20|0)==(r32|0)){r35=r5;break L1229}else{r3=r20;r7=r5}}}}while(0);r32=HEAP32[r22];HEAP32[r22]=r6;HEAP32[r18]=r31;HEAP32[r9]=r35;HEAP32[r11]=r25;if((r32|0)==0){r34=r35;break}__ZdlPv(r32);r34=HEAP32[r9]}else{r34=r33}}while(0);if((r34|0)==0){r37=0}else{HEAP32[r34>>2]=r4;r37=HEAP32[r9]}HEAP32[r9]=r37+4|0;STACKTOP=r2;return}}function __ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer19RemoveUnneededFlowsE_1P5ShapeS4_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=0;if((r1|0)==0){return}else{r4=r1,r5=r4>>2}while(1){r1=HEAP32[r5+3];r6=(r4|0)==0;if(!((r1|0)!=0|r6)){r7=HEAP32[r5+2];if((r7|0)==0){r3=941;break}else{r4=r7,r5=r4>>2;continue}}if((r1|0)!=1|r6){if((r1|0)!=2|r6){r3=967;break}r6=HEAP32[r5+5];__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer19RemoveUnneededFlowsE_1P5ShapeS4_(r6,r6);r8=r4+8|0}else{r6=HEAP32[r5+5];r1=r4+24|0;r7=r4+8|0;L1252:do{if((r6|0)!=(r1|0)){r9=r6;while(1){__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer19RemoveUnneededFlowsE_1P5ShapeS4_(HEAP32[r9+20>>2],HEAP32[r7>>2]);r10=HEAP32[r9+4>>2];L1255:do{if((r10|0)==0){r11=r9|0;while(1){r12=HEAP32[r11+8>>2];if((r11|0)==(HEAP32[r12>>2]|0)){r13=r12;break L1255}else{r11=r12}}}else{r11=r10;while(1){r12=HEAP32[r11>>2];if((r12|0)==0){r13=r11;break L1255}else{r11=r12}}}}while(0);if((r13|0)==(r1|0)){break L1252}else{r9=r13}}}}while(0);r8=r7}r1=HEAP32[r8>>2];if((r1|0)==0){r3=966;break}else{r4=r1,r5=r4>>2}}if(r3==941){r5=r4+16|0;r4=HEAP32[r5>>2];r8=HEAP32[r4+24>>2];if((r8|0)==(r4+28|0)){return}else{r14=r8,r15=r14>>2}while(1){r8=HEAP32[r15+5];r4=r8+4|0;do{if((HEAP32[r4>>2]|0)!=0){if((HEAP32[HEAP32[r15+4]+48>>2]|0)!=(r2|0)){break}HEAP32[r4>>2]=0;r13=HEAP32[r8>>2];if((r13|0)==0){break}if((HEAP32[r13+12>>2]|0)!=1){break}r1=r13+32|0;HEAP32[r1>>2]=HEAP32[r1>>2]-1|0}}while(0);r8=HEAP32[r15+1];L1278:do{if((r8|0)==0){r4=r14|0;while(1){r7=HEAP32[r4+8>>2];if((r4|0)==(HEAP32[r7>>2]|0)){r16=r7;break L1278}else{r4=r7}}}else{r4=r8;while(1){r7=HEAP32[r4>>2];if((r7|0)==0){r16=r4;break L1278}else{r4=r7}}}}while(0);if((r16|0)==(HEAP32[r5>>2]+28|0)){break}else{r14=r16,r15=r14>>2}}return}else if(r3==967){return}else if(r3==966){return}}function __ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer16FindLabeledLoopsE_1P5Shape(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=(r4|0)==0;if(r5){r6=__Znwj(24),r7=r6>>2;HEAP32[r7]=0;HEAP32[r7+1]=0;HEAP32[r7+2]=0;HEAP32[r7+3]=0;HEAP32[r7+4]=0;HEAP32[r7+5]=0;HEAP32[r3]=r6;r8=r6}else{r8=r4}L1292:do{if((r2|0)!=0){r4=r8;r6=(r8+8|0)>>2;r7=(r8+4|0)>>2;r9=(r8+16|0)>>2;r10=(r8+20|0)>>2;r11=r2,r12=r11>>2;L1294:while(1){r13=HEAP32[r12+3];r14=(r11|0)==0;L1296:do{if((r13|0)!=0|r14){if((r13|0)!=1|r14){if((r13|0)!=2|r14){break L1292}r15=HEAP32[r6];r16=HEAP32[r7];if((r15|0)==(r16|0)){r17=0}else{r17=(r15-r16<<8)-1|0}r18=HEAP32[r9];r19=HEAP32[r10];if((r17|0)==(r19+r18|0)){__ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r4);r20=HEAP32[r10];r21=HEAP32[r9];r22=HEAP32[r7];r23=HEAP32[r6]}else{r20=r19;r21=r18;r22=r16;r23=r15}r15=r20+r21|0;do{if((r23|0)==(r22|0)){r24=r20}else{r16=((r15&1023)<<2)+HEAP32[r22+(r15>>>10<<2)>>2]|0;if((r16|0)==0){r24=r20;break}HEAP32[r16>>2]=r11;r24=HEAP32[r10]}}while(0);HEAP32[r10]=r24+1|0;__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer16FindLabeledLoopsE_1P5Shape(r1,HEAP32[r12+5]);r15=HEAP32[r10];HEAP32[r10]=r15-1|0;r16=HEAP32[r6];r18=HEAP32[r7];if((r16|0)==(r18|0)){r25=0}else{r25=(r16-r18<<8)-1|0}if((r25+(1-r15)-HEAP32[r9]|0)>>>0>2047){__ZdlPv(HEAP32[r16-4>>2]);HEAP32[r6]=HEAP32[r6]-4|0}r26=r11+8|0;break}r16=r11+32|0;if((HEAP32[r16>>2]|0)!=0){r15=HEAP32[r6];r18=HEAP32[r7];if((r15|0)==(r18|0)){r27=0}else{r27=(r15-r18<<8)-1|0}r19=HEAP32[r9];r28=HEAP32[r10];if((r27|0)==(r28+r19|0)){__ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r4);r29=HEAP32[r10];r30=HEAP32[r9];r31=HEAP32[r7];r32=HEAP32[r6]}else{r29=r28;r30=r19;r31=r18;r32=r15}r15=r29+r30|0;do{if((r32|0)==(r31|0)){r33=r29}else{r18=((r15&1023)<<2)+HEAP32[r31+(r15>>>10<<2)>>2]|0;if((r18|0)==0){r33=r29;break}HEAP32[r18>>2]=r11;r33=HEAP32[r10]}}while(0);HEAP32[r10]=r33+1|0}r15=HEAP32[r12+5];r18=r11+24|0;L1331:do{if((r15|0)!=(r18|0)){r19=r15;while(1){__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer16FindLabeledLoopsE_1P5Shape(r1,HEAP32[r19+20>>2]);r28=HEAP32[r19+4>>2];L1334:do{if((r28|0)==0){r34=r19|0;while(1){r35=HEAP32[r34+8>>2];if((r34|0)==(HEAP32[r35>>2]|0)){r36=r35;break L1334}else{r34=r35}}}else{r34=r28;while(1){r35=HEAP32[r34>>2];if((r35|0)==0){r36=r34;break L1334}else{r34=r35}}}}while(0);if((r36|0)==(r18|0)){break L1331}else{r19=r36}}}}while(0);do{if((HEAP32[r16>>2]|0)!=0){r18=HEAP32[r10];HEAP32[r10]=r18-1|0;r15=HEAP32[r6];r19=HEAP32[r7];if((r15|0)==(r19|0)){r37=0}else{r37=(r15-r19<<8)-1|0}if((r37+(1-r18)-HEAP32[r9]|0)>>>0<=2047){break}__ZdlPv(HEAP32[r15-4>>2]);HEAP32[r6]=HEAP32[r6]-4|0}}while(0);r26=r11+8|0}else{r16=r11+8|0;r15=HEAP32[r16>>2],r18=r15>>2;L1350:do{if((r15|0)==0){r38=0;r39=0}else{if((HEAP32[r18+3]|0)!=1){r38=0;r39=0;break}r19=r15;if((HEAP32[r18+8]|0)==0){r38=r19;r39=1;break}r28=HEAP32[r6];r34=HEAP32[r7];if((r28|0)==(r34|0)){r40=0}else{r40=(r28-r34<<8)-1|0}r35=HEAP32[r9];r41=HEAP32[r10];if((r40|0)==(r41+r35|0)){__ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r4);r42=HEAP32[r10];r43=HEAP32[r9];r44=HEAP32[r7];r45=HEAP32[r6]}else{r42=r41;r43=r35;r44=r34;r45=r28}r28=r42+r43|0;do{if((r45|0)==(r44|0)){r46=r42}else{r34=((r28&1023)<<2)+HEAP32[r44+(r28>>>10<<2)>>2]|0;if((r34|0)==0){r46=r42;break}HEAP32[r34>>2]=r15;r46=HEAP32[r10]}}while(0);HEAP32[r10]=r46+1|0;r28=HEAP32[r18+5];r34=r15+24|0;if((r28|0)==(r34|0)){r38=r19;r39=1;break}else{r47=r28}while(1){__ZZN8Relooper9CalculateEP5BlockEN13PostOptimizer16FindLabeledLoopsE_1P5Shape(r1,HEAP32[r47+20>>2]);r28=HEAP32[r47+4>>2];L1366:do{if((r28|0)==0){r35=r47|0;while(1){r41=HEAP32[r35+8>>2];if((r35|0)==(HEAP32[r41>>2]|0)){r48=r41;break L1366}else{r35=r41}}}else{r35=r28;while(1){r41=HEAP32[r35>>2];if((r41|0)==0){r48=r35;break L1366}else{r35=r41}}}}while(0);if((r48|0)==(r34|0)){r38=r19;r39=1;break L1350}else{r47=r48}}}}while(0);r15=r11+16|0;r18=HEAP32[r15>>2];r19=HEAP32[r18+24>>2];L1374:do{if((r19|0)!=(r18+28|0)){r34=r19;while(1){r28=HEAP32[r34+20>>2];do{if((HEAP32[r28+4>>2]|0)!=0){r35=HEAP32[r10];if((r35|0)==0){break L1294}r41=HEAP32[r28>>2];r49=r35-1+HEAP32[r9]|0;if((r41|0)==(HEAP32[HEAP32[HEAP32[r7]+(r49>>>10<<2)>>2]+((r49&1023)<<2)>>2]|0)){HEAP8[r28+8|0]=0;break}else{HEAP8[r41+16|0]=1;HEAP8[r28+8|0]=1;break}}}while(0);r28=HEAP32[r34+4>>2];L1384:do{if((r28|0)==0){r41=r34|0;while(1){r49=HEAP32[r41+8>>2];if((r41|0)==(HEAP32[r49>>2]|0)){r50=r49;break L1384}else{r41=r49}}}else{r41=r28;while(1){r49=HEAP32[r41>>2];if((r49|0)==0){r50=r41;break L1384}else{r41=r49}}}}while(0);if((r50|0)==(HEAP32[r15>>2]+28|0)){break L1374}else{r34=r50}}}}while(0);do{if(r39){if((HEAP32[r38+32>>2]|0)==0){break}r15=HEAP32[r10];HEAP32[r10]=r15-1|0;r19=HEAP32[r6];r18=HEAP32[r7];if((r19|0)==(r18|0)){r51=0}else{r51=(r19-r18<<8)-1|0}if((r51+(1-r15)-HEAP32[r9]|0)>>>0>2047){__ZdlPv(HEAP32[r19-4>>2]);HEAP32[r6]=HEAP32[r6]-4|0}r26=r38+8|0;break L1296}}while(0);r26=r16}}while(0);r14=HEAP32[r26>>2];if((r14|0)==0){break L1292}else{r11=r14,r12=r11>>2}}___assert_func(5242980,939,5244080,5243188)}}while(0);if(!r5){return}r5=HEAP32[r3];if((r5|0)==0){return}__ZNSt3__112__deque_baseIP5ShapeNS_9allocatorIS2_EEE5clearEv(r5);r3=r5+4|0;r26=HEAP32[r3>>2];r38=(r5+8|0)>>2;r51=HEAP32[r38];do{if((r26|0)!=(r51|0)){r39=r26;while(1){__ZdlPv(HEAP32[r39>>2]);r50=r39+4|0;if((r50|0)==(r51|0)){break}else{r39=r50}}r39=HEAP32[r3>>2];r50=HEAP32[r38];if((r39|0)==(r50|0)){break}HEAP32[r38]=(((r50-4+ -r39|0)>>>2^-1)<<2)+r50|0}}while(0);r38=HEAP32[r5>>2];if((r38|0)!=0){__ZdlPv(r38)}__ZdlPv(r5);return}function __ZNSt3__114__split_bufferIPP5ShapeNS_9allocatorIS3_EEE10push_frontERKS3_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=(r1|0)>>2;do{if((r4|0)==(HEAP32[r5]|0)){r6=(r1+8|0)>>2;r7=HEAP32[r6];r8=r1+12|0;r9=HEAP32[r8>>2];r10=r9;if(r7>>>0<r9>>>0){r9=r7;r11=(r10-r9+4>>2|0)/2&-1;r12=r9-r4|0;r9=(r11-(r12>>2)<<2)+r7|0;_memmove(r9,r4,r12,4,0);HEAP32[r3]=r9;HEAP32[r6]=(r11<<2)+HEAP32[r6]|0;r13=r9;break}r9=r10-r4>>1;r10=(r9|0)==0?1:r9;r9=__Znwj(r10<<2);r11=((r10+3|0)>>>2<<2)+r9|0;r12=(r10<<2)+r9|0;r10=HEAP32[r3];r7=HEAP32[r6];L1427:do{if((r10|0)==(r7|0)){r14=r11}else{r15=r10;r16=r11;while(1){if((r16|0)==0){r17=0}else{HEAP32[r16>>2]=HEAP32[r15>>2];r17=r16}r18=r17+4|0;r19=r15+4|0;if((r19|0)==(r7|0)){r14=r18;break L1427}else{r15=r19;r16=r18}}}}while(0);r7=HEAP32[r5];HEAP32[r5]=r9;HEAP32[r3]=r11;HEAP32[r6]=r14;HEAP32[r8>>2]=r12;if((r7|0)==0){r13=r11;break}__ZdlPv(r7);r13=HEAP32[r3]}else{r13=r4}}while(0);r4=r13-4|0;if((r4|0)==0){r20=r13;r21=r20-4|0;HEAP32[r3]=r21;return}HEAP32[r4>>2]=HEAP32[r2>>2];r20=HEAP32[r3];r21=r20-4|0;HEAP32[r3]=r21;return}function __ZNSt3__114__split_bufferIPP5ShapeRNS_9allocatorIS3_EEE10push_frontERKS3_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=(r1|0)>>2;do{if((r4|0)==(HEAP32[r5]|0)){r6=(r1+8|0)>>2;r7=HEAP32[r6];r8=r1+12|0;r9=HEAP32[r8>>2];r10=r9;if(r7>>>0<r9>>>0){r9=r7;r11=(r10-r9+4>>2|0)/2&-1;r12=r9-r4|0;r9=(r11-(r12>>2)<<2)+r7|0;_memmove(r9,r4,r12,4,0);HEAP32[r3]=r9;HEAP32[r6]=(r11<<2)+HEAP32[r6]|0;r13=r9;break}r9=r10-r4>>1;r10=(r9|0)==0?1:r9;r9=__Znwj(r10<<2);r11=((r10+3|0)>>>2<<2)+r9|0;r12=(r10<<2)+r9|0;r10=HEAP32[r3];r7=HEAP32[r6];L1446:do{if((r10|0)==(r7|0)){r14=r11}else{r15=r10;r16=r11;while(1){if((r16|0)==0){r17=0}else{HEAP32[r16>>2]=HEAP32[r15>>2];r17=r16}r18=r17+4|0;r19=r15+4|0;if((r19|0)==(r7|0)){r14=r18;break L1446}else{r15=r19;r16=r18}}}}while(0);r7=HEAP32[r5];HEAP32[r5]=r9;HEAP32[r3]=r11;HEAP32[r6]=r14;HEAP32[r8>>2]=r12;if((r7|0)==0){r13=r11;break}__ZdlPv(r7);r13=HEAP32[r3]}else{r13=r4}}while(0);r4=r13-4|0;if((r4|0)==0){r20=r13;r21=r20-4|0;HEAP32[r3]=r21;return}HEAP32[r4>>2]=HEAP32[r2>>2];r20=HEAP32[r3];r21=r20-4|0;HEAP32[r3]=r21;return}function __ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+4;r5=r1+16|0;r6=HEAP32[r5>>2];if(r6>>>0>1023){HEAP32[r5>>2]=r6-1024|0;r6=(r1+4|0)>>2;r5=HEAP32[r6];r7=HEAP32[r5>>2];r8=r5+4|0;HEAP32[r6]=r8;r9=(r1+8|0)>>2;r10=HEAP32[r9];r11=r1+12|0;do{if((r10|0)==(HEAP32[r11>>2]|0)){r12=(r1|0)>>2;r13=HEAP32[r12];if(r8>>>0>r13>>>0){r14=r8;r15=(r14-r13+4>>2|0)/-2&-1;r16=r15+1|0;r17=r10-r14|0;_memmove((r16<<2)+r5|0,r8,r17,4,0);r14=((r17>>2)+r16<<2)+r5|0;HEAP32[r9]=r14;HEAP32[r6]=(r15<<2)+HEAP32[r6]|0;r18=r14;break}r14=r10-r13>>1;r13=(r14|0)==0?1:r14;r14=__Znwj(r13<<2);r15=(r13>>>2<<2)+r14|0;r16=(r13<<2)+r14|0;r13=HEAP32[r6];r17=HEAP32[r9];L1467:do{if((r13|0)==(r17|0)){r19=r15}else{r20=r13;r21=r15;while(1){if((r21|0)==0){r22=0}else{HEAP32[r21>>2]=HEAP32[r20>>2];r22=r21}r23=r22+4|0;r24=r20+4|0;if((r24|0)==(r17|0)){r19=r23;break L1467}else{r20=r24;r21=r23}}}}while(0);r17=HEAP32[r12];HEAP32[r12]=r14;HEAP32[r6]=r15;HEAP32[r9]=r19;HEAP32[r11>>2]=r16;if((r17|0)==0){r18=r19;break}__ZdlPv(r17);r18=HEAP32[r9]}else{r18=r10}}while(0);if((r18|0)==0){r25=0}else{HEAP32[r18>>2]=r7;r25=HEAP32[r9]}HEAP32[r9]=r25+4|0;STACKTOP=r2;return}r25=r1|0;r9=(r1+8|0)>>2;r7=HEAP32[r9];r18=(r1+4|0)>>2;r10=r7-HEAP32[r18]>>2;r19=r1+12|0;r11=(r19|0)>>2;r6=HEAP32[r11];r22=(r1|0)>>2;r1=r6-HEAP32[r22]|0;if(r10>>>0>=r1>>2>>>0){r5=r1>>1;r1=(r5|0)==0?1:r5;r5=(r4+12|0)>>2;HEAP32[r4+16>>2]=r19;r19=__Znwj(r1<<2);r8=r19;r17=(r4|0)>>2;HEAP32[r17]=r8;r13=(r10<<2)+r8|0;r21=(r4+8|0)>>2;HEAP32[r21]=r13;r20=(r4+4|0)>>2;HEAP32[r20]=r13;HEAP32[r5]=(r1<<2)+r8|0;r23=__Znwj(4096);do{if((r10|0)==(r1|0)){r24=r13-r19|0;if(r13>>>0>r8>>>0){r26=(r10+((r24+4>>2|0)/-2&-1)<<2)+r8|0;HEAP32[r21]=r26;HEAP32[r20]=r26;r27=r26;break}r26=r24>>1;r24=(r26|0)==0?1:r26;r26=__Znwj(r24<<2);r28=(r24>>>2<<2)+r26|0;HEAP32[r17]=r26;HEAP32[r20]=r28;HEAP32[r21]=r28;HEAP32[r5]=(r24<<2)+r26|0;if((r19|0)==0){r27=r28;break}__ZdlPv(r19);r27=r28}else{r27=r13}}while(0);if((r27|0)==0){r29=0}else{HEAP32[r27>>2]=r23;r29=HEAP32[r21]}HEAP32[r21]=r29+4|0;r29=HEAP32[r9];while(1){if((r29|0)==(HEAP32[r18]|0)){break}r23=r29-4|0;__ZNSt3__114__split_bufferIPP5ShapeRNS_9allocatorIS3_EEE10push_frontERKS3_(r4,r23);r29=r23}r4=HEAP32[r22];HEAP32[r22]=HEAP32[r17];HEAP32[r17]=r4;HEAP32[r18]=HEAP32[r20];HEAP32[r20]=r29;r20=HEAP32[r9];HEAP32[r9]=HEAP32[r21];HEAP32[r21]=r20;r17=HEAP32[r11];HEAP32[r11]=HEAP32[r5];HEAP32[r5]=r17;if((r29|0)!=(r20|0)){HEAP32[r21]=(((r20-4+ -r29|0)>>>2^-1)<<2)+r20|0}if((r4|0)==0){STACKTOP=r2;return}__ZdlPv(r4);STACKTOP=r2;return}r4=__Znwj(4096);if((r6|0)==(r7|0)){HEAP32[r3>>2]=r4;__ZNSt3__114__split_bufferIPP5ShapeNS_9allocatorIS3_EEE10push_frontERKS3_(r25,r3);r3=HEAP32[r18];r25=HEAP32[r3>>2];r7=r3+4|0;HEAP32[r18]=r7;r6=HEAP32[r9];do{if((r6|0)==(HEAP32[r11]|0)){r20=HEAP32[r22];if(r7>>>0>r20>>>0){r29=r7;r21=(r29-r20+4>>2|0)/-2&-1;r17=r21+1|0;r5=r6-r29|0;_memmove((r17<<2)+r3|0,r7,r5,4,0);r29=((r5>>2)+r17<<2)+r3|0;HEAP32[r9]=r29;HEAP32[r18]=(r21<<2)+HEAP32[r18]|0;r30=r29;break}r29=r6-r20>>1;r20=(r29|0)==0?1:r29;r29=__Znwj(r20<<2);r21=(r20>>>2<<2)+r29|0;r17=(r20<<2)+r29|0;r20=HEAP32[r18];r5=HEAP32[r9];L1514:do{if((r20|0)==(r5|0)){r31=r21}else{r23=r20;r27=r21;while(1){if((r27|0)==0){r32=0}else{HEAP32[r27>>2]=HEAP32[r23>>2];r32=r27}r13=r32+4|0;r19=r23+4|0;if((r19|0)==(r5|0)){r31=r13;break L1514}else{r23=r19;r27=r13}}}}while(0);r5=HEAP32[r22];HEAP32[r22]=r29;HEAP32[r18]=r21;HEAP32[r9]=r31;HEAP32[r11]=r17;if((r5|0)==0){r30=r31;break}__ZdlPv(r5);r30=HEAP32[r9]}else{r30=r6}}while(0);if((r30|0)==0){r33=0}else{HEAP32[r30>>2]=r25;r33=HEAP32[r9]}HEAP32[r9]=r33+4|0;STACKTOP=r2;return}else{r33=HEAP32[r9];do{if((r33|0)==(HEAP32[r11]|0)){r25=HEAP32[r18];r30=HEAP32[r22];if(r25>>>0>r30>>>0){r6=r25;r31=(r6-r30+4>>2|0)/-2&-1;r32=r33-r6|0;_memmove((r31<<2)+r25|0,r25,r32,4,0);r6=((r32>>2)+r31<<2)+r25|0;HEAP32[r9]=r6;HEAP32[r18]=(r31<<2)+HEAP32[r18]|0;r34=r6;break}r6=r33-r30>>1;r30=(r6|0)==0?1:r6;r6=__Znwj(r30<<2);r31=(r30>>>2<<2)+r6|0;r25=(r30<<2)+r6|0;r30=HEAP32[r18];r32=HEAP32[r9];L1533:do{if((r30|0)==(r32|0)){r35=r31}else{r3=r30;r7=r31;while(1){if((r7|0)==0){r36=0}else{HEAP32[r7>>2]=HEAP32[r3>>2];r36=r7}r5=r36+4|0;r20=r3+4|0;if((r20|0)==(r32|0)){r35=r5;break L1533}else{r3=r20;r7=r5}}}}while(0);r32=HEAP32[r22];HEAP32[r22]=r6;HEAP32[r18]=r31;HEAP32[r9]=r35;HEAP32[r11]=r25;if((r32|0)==0){r34=r35;break}__ZdlPv(r32);r34=HEAP32[r9]}else{r34=r33}}while(0);if((r34|0)==0){r37=0}else{HEAP32[r34>>2]=r4;r37=HEAP32[r9]}HEAP32[r9]=r37+4|0;STACKTOP=r2;return}}function __ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4,r6=r5>>2;r7=r1+4|0;r8=r7|0;r9=HEAP32[r8>>2];do{if((r9|0)==0){r10=r7;HEAP32[r6]=r10;r11=r8,r12=r11>>2;r13=r10}else{r10=HEAP32[r2>>2];r14=r9;while(1){r15=HEAP32[r14+16>>2];if(r10>>>0<r15>>>0){r16=r14|0;r17=HEAP32[r16>>2];if((r17|0)==0){r3=1161;break}else{r14=r17;continue}}if(r15>>>0>=r10>>>0){r3=1165;break}r18=r14+4|0;r15=HEAP32[r18>>2];if((r15|0)==0){r3=1164;break}else{r14=r15}}if(r3==1161){HEAP32[r6]=r14;r11=r16,r12=r11>>2;r13=r14;break}else if(r3==1164){HEAP32[r6]=r14;r11=r18,r12=r11>>2;r13=r14;break}else if(r3==1165){HEAP32[r6]=r14;r11=r5,r12=r11>>2;r13=r14;break}}}while(0);r5=HEAP32[r12];if((r5|0)!=0){r19=r5;r20=r19+20|0;STACKTOP=r4;return r20}r5=__Znwj(32),r6=r5>>2;r3=r5+16|0;if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r2>>2]}r2=r5+20|0;if((r2|0)!=0){r3=r5+24|0;HEAP32[r3>>2]=0;HEAP32[r6+7]=0;HEAP32[r2>>2]=r3}r3=r5;HEAP32[r6]=0;HEAP32[r6+1]=0;HEAP32[r6+2]=r13;HEAP32[r12]=r3;r13=r1|0;r6=HEAP32[HEAP32[r13>>2]>>2];if((r6|0)==0){r21=r3}else{HEAP32[r13>>2]=r6;r21=HEAP32[r12]}__ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r1+4>>2],r21);r21=r1+8|0;HEAP32[r21>>2]=HEAP32[r21>>2]+1|0;r19=r5;r20=r19+20|0;STACKTOP=r4;return r20}function __ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE7destroyEPNS_11__tree_nodeISA_PvEE(r1,r2){if((r2|0)==0){return}else{__ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE7destroyEPNS_11__tree_nodeISA_PvEE(r1,HEAP32[r2>>2]);__ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE7destroyEPNS_11__tree_nodeISA_PvEE(r1,HEAP32[r2+4>>2]);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r2+20|0,HEAP32[r2+24>>2]);__ZdlPv(r2);return}}function __ZZN8Relooper9CalculateEP5BlockEN8Analyzer8MakeLoopE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_SA_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+64|0;r7=r6;r8=r6+4;r9=r6+8;r10=r6+16;r11=r6+24;r12=r6+32;r13=r6+44;r14=r6+56,r15=r14>>2;r16=r6+60;r17=r12|0;r18=r12+4|0;r19=(r18|0)>>2;HEAP32[r19]=0;r20=r12+8|0;HEAP32[r20>>2]=0;r21=r18;r22=r12|0;HEAP32[r22>>2]=r21;r23=r13|0;r24=(r13|0)>>2;r25=r13+4|0;HEAP32[r25>>2]=0;r26=(r13+8|0)>>2;HEAP32[r26]=0;r27=r25;HEAP32[r24]=r27;r25=r3|0;r28=HEAP32[r25>>2];r29=r3+4|0;r30=r29;L1579:do{if((r28|0)!=(r30|0)){r31=r8|0;r32=r13+4|0;r33=r28;while(1){r34=r33+16|0;HEAP32[r31>>2]=r27;r35=__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE12__find_equalIS2_EERPNS_16__tree_node_baseIPvEENS_21__tree_const_iteratorIS2_PKNS_11__tree_nodeIS2_SA_EEiEESD_RKT_(r23,r8,r7,r34)>>2;if((HEAP32[r35]|0)==0){r36=__Znwj(20),r37=r36>>2;r38=r36+16|0;if((r38|0)!=0){HEAP32[r38>>2]=HEAP32[r34>>2]}r34=HEAP32[r7>>2];r38=r36;HEAP32[r37]=0;HEAP32[r37+1]=0;HEAP32[r37+2]=r34;HEAP32[r35]=r38;r34=HEAP32[HEAP32[r24]>>2];if((r34|0)==0){r39=r38}else{HEAP32[r24]=r34;r39=HEAP32[r35]}__ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r32>>2],r39);HEAP32[r26]=HEAP32[r26]+1|0}r35=HEAP32[r33+4>>2];L1593:do{if((r35|0)==0){r34=r33|0;while(1){r38=HEAP32[r34+8>>2];if((r34|0)==(HEAP32[r38>>2]|0)){r40=r38;break L1593}else{r34=r38}}}else{r34=r35;while(1){r38=HEAP32[r34>>2];if((r38|0)==0){r40=r34;break L1593}else{r34=r38}}}}while(0);if((r40|0)==(r29|0)){break}else{r33=r40}}r33=HEAP32[r26];if((r33|0)==0){break}r32=r13+4|0;r31=r2+4|0;r35=r31;r34=r31|0;r31=r2|0;r38=r2+8|0;r37=r33;while(1){r33=HEAP32[r24];r36=HEAP32[r33+16>>2];HEAP32[r15]=r36;r41=r33|0;r42=HEAP32[r33+4>>2];L1604:do{if((r42|0)==0){r43=r41;while(1){r44=HEAP32[r43+8>>2];if((r43|0)==(HEAP32[r44>>2]|0)){r45=r44;break L1604}else{r43=r44}}}else{r43=r42;while(1){r44=HEAP32[r43>>2];if((r44|0)==0){r45=r43;break L1604}else{r43=r44}}}}while(0);HEAP32[r24]=r45;HEAP32[r26]=r37-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r32>>2],r41);__ZdlPv(r33);r42=HEAP32[r19];do{if((r42|0)==0){r5=1208}else{r43=r42;r44=r21;L1611:while(1){r46=r43,r47=r46>>2;while(1){r48=r46;if(HEAP32[r47+4]>>>0>=r36>>>0){break}r49=HEAP32[r47+1];if((r49|0)==0){r50=r44;break L1611}else{r46=r49,r47=r46>>2}}r46=HEAP32[r47];if((r46|0)==0){r50=r48;break}else{r43=r46;r44=r48}}if((r50|0)==(r21|0)){r5=1208;break}if(r36>>>0<HEAP32[r50+16>>2]>>>0){r5=1208;break}else{break}}}while(0);L1619:do{if(r5==1208){r5=0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r11,r17,r14);r36=HEAP32[r34>>2];r42=HEAP32[r15];do{if((r36|0)!=0){r33=r36;r41=r35;L1623:while(1){r44=r33,r43=r44>>2;while(1){r51=r44;if(HEAP32[r43+4]>>>0>=r42>>>0){break}r46=HEAP32[r43+1];if((r46|0)==0){r52=r41;break L1623}else{r44=r46,r43=r44>>2}}r44=HEAP32[r43];if((r44|0)==0){r52=r51;break}else{r33=r44;r41=r51}}if((r52|0)==(r35|0)){break}if(r42>>>0<HEAP32[r52+16>>2]>>>0){break}r41=r52|0;r33=HEAP32[r52+4>>2];L1632:do{if((r33|0)==0){r47=r41;while(1){r44=HEAP32[r47+8>>2];if((r47|0)==(HEAP32[r44>>2]|0)){r53=r44;break L1632}else{r47=r44}}}else{r47=r33;while(1){r43=HEAP32[r47>>2];if((r43|0)==0){r53=r47;break L1632}else{r47=r43}}}}while(0);if((HEAP32[r31>>2]|0)==(r52|0)){HEAP32[r31>>2]=r53}HEAP32[r38>>2]=HEAP32[r38>>2]-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r36,r41);__ZdlPv(r52)}}while(0);r36=HEAP32[r42+12>>2];if((r36|0)==(r42+16|0)){break}else{r54=r36}while(1){__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r10,r23,r54+16|0);r36=HEAP32[r54+4>>2];L1645:do{if((r36|0)==0){r33=r54|0;while(1){r47=HEAP32[r33+8>>2];if((r33|0)==(HEAP32[r47>>2]|0)){r55=r47;break L1645}else{r33=r47}}}else{r33=r36;while(1){r47=HEAP32[r33>>2];if((r47|0)==0){r55=r33;break L1645}else{r33=r47}}}}while(0);if((r55|0)==(HEAP32[r15]+16|0)){break L1619}else{r54=r55}}}}while(0);r42=HEAP32[r26];if((r42|0)==0){break L1579}else{r37=r42}}}}while(0);if((HEAP32[r20>>2]|0)==0){___assert_func(5242980,496,5243988,5243164)}r20=HEAP32[r22>>2];L1658:do{if((r20|0)!=(r21|0)){r22=r4|0;r26=r20;while(1){r55=HEAP32[r26+16>>2];r54=HEAP32[r55>>2];r15=r55+4|0;L1662:do{if((r54|0)!=(r15|0)){r55=r54;while(1){r10=HEAP32[r55+16>>2];HEAP32[r16>>2]=r10;r52=HEAP32[r19];do{if((r52|0)==0){r5=1243}else{r53=r52;r51=r21;L1666:while(1){r14=r53,r11=r14>>2;while(1){r56=r14;if(HEAP32[r11+4]>>>0>=r10>>>0){break}r50=HEAP32[r11+1];if((r50|0)==0){r57=r51;break L1666}else{r14=r50,r11=r14>>2}}r14=HEAP32[r11];if((r14|0)==0){r57=r56;break}else{r53=r14;r51=r56}}if((r57|0)==(r21|0)){r5=1243;break}if(r10>>>0<HEAP32[r57+16>>2]>>>0){r5=1243;break}else{break}}}while(0);if(r5==1243){r5=0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE15__insert_uniqueERKS2_(r9,r22,r16)}r10=HEAP32[r55+4>>2];L1677:do{if((r10|0)==0){r52=r55|0;while(1){r51=HEAP32[r52+8>>2];if((r52|0)==(HEAP32[r51>>2]|0)){r58=r51;break L1677}else{r52=r51}}}else{r52=r10;while(1){r51=HEAP32[r52>>2];if((r51|0)==0){r58=r52;break L1677}else{r52=r51}}}}while(0);if((r58|0)==(r15|0)){break L1662}r55=r58}}}while(0);r15=HEAP32[r26+4>>2];L1686:do{if((r15|0)==0){r54=r26|0;while(1){r55=HEAP32[r54+8>>2];if((r54|0)==(HEAP32[r55>>2]|0)){r59=r55;break L1686}else{r54=r55}}}else{r54=r15;while(1){r55=HEAP32[r54>>2];if((r55|0)==0){r59=r54;break L1686}else{r54=r55}}}}while(0);if((r59|0)==(r18|0)){break L1658}else{r26=r59}}}}while(0);r59=__Znwj(24),r18=r59>>2;r58=HEAP32[1311186];HEAP32[1311186]=r58+1|0;HEAP32[r18+1]=r58;HEAP32[r18+2]=0;HEAP32[r18+3]=2;HEAP8[r59+16|0]=0;HEAP32[r18]=5244352;r18=r59+20|0;HEAP32[r18>>2]=0;r58=r59;r59=HEAP32[r1>>2];r16=r59+32|0;r9=HEAP32[r16>>2];r5=r59+28|0;r57=HEAP32[r5>>2];if((r9|0)==(r57|0)){r60=0}else{r60=(r9-r57<<8)-1|0}r21=r59+40|0;r56=HEAP32[r21>>2];r19=(r59+44|0)>>2;r20=HEAP32[r19];if((r60|0)==(r20+r56|0)){__ZNSt3__15dequeIP5ShapeNS_9allocatorIS2_EEE19__add_back_capacityEv(r59+24|0);r61=HEAP32[r19];r62=HEAP32[r21>>2];r63=HEAP32[r5>>2];r64=HEAP32[r16>>2]}else{r61=r20;r62=r56;r63=r57;r64=r9}r9=r61+r62|0;do{if((r64|0)==(r63|0)){r65=r61}else{r62=((r9&1023)<<2)+HEAP32[r63+(r9>>>10<<2)>>2]|0;if((r62|0)==0){r65=r61;break}HEAP32[r62>>2]=r58;r65=HEAP32[r19]}}while(0);HEAP32[r19]=r65+1|0;r65=HEAP32[r25>>2];L1706:do{if((r65|0)!=(r30|0)){r25=r65;while(1){__ZZN8Relooper9CalculateEP5BlockEN8Analyzer9SolipsizeE_0S1_N6Branch8FlowTypeEP5ShapeRNSt3__13setIS1_NS7_4lessIS1_EENS7_9allocatorIS1_EEEE(HEAP32[r25+16>>2],2,r58,r12);r19=HEAP32[r25+4>>2];L1710:do{if((r19|0)==0){r61=r25|0;while(1){r9=HEAP32[r61+8>>2];if((r61|0)==(HEAP32[r9>>2]|0)){r66=r9;break L1710}else{r61=r9}}}else{r61=r19;while(1){r9=HEAP32[r61>>2];if((r9|0)==0){r66=r61;break L1710}else{r61=r9}}}}while(0);if((r66|0)==(r29|0)){break L1706}else{r25=r66}}}}while(0);r66=HEAP32[r4>>2];r29=r4+4|0;L1718:do{if((r66|0)!=(r29|0)){r4=r66;while(1){__ZZN8Relooper9CalculateEP5BlockEN8Analyzer9SolipsizeE_0S1_N6Branch8FlowTypeEP5ShapeRNSt3__13setIS1_NS7_4lessIS1_EENS7_9allocatorIS1_EEEE(HEAP32[r4+16>>2],1,r58,r12);r65=HEAP32[r4+4>>2];L1722:do{if((r65|0)==0){r30=r4|0;while(1){r25=HEAP32[r30+8>>2];if((r30|0)==(HEAP32[r25>>2]|0)){r67=r25;break L1722}else{r30=r25}}}else{r30=r65;while(1){r25=HEAP32[r30>>2];if((r25|0)==0){r67=r30;break L1722}else{r30=r25}}}}while(0);if((r67|0)==(r29|0)){break L1718}else{r4=r67}}}}while(0);HEAP32[r18>>2]=__ZZN8Relooper9CalculateEP5BlockEN8Analyzer7ProcessE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_P5Shape(r1,r12,r3);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r23,HEAP32[r13+4>>2]);__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r17,HEAP32[r12+4>>2]);STACKTOP=r6;return r58}function __ZZN8Relooper9CalculateEP5BlockEN8Analyzer9SolipsizeE_0S1_N6Branch8FlowTypeEP5ShapeRNSt3__13setIS1_NS7_4lessIS1_EENS7_9allocatorIS1_EEEE(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6,r8=r7>>2;r9=r6+4;HEAP32[r8]=r1;r10=HEAP32[r1+12>>2];if((r10|0)==(r1+16|0)){STACKTOP=r6;return}r11=r4+4|0;r4=r11;r12=r11|0;r11=(r3|0)==0;r13=r3+12|0;r14=r3+32|0;r15=r14;r16=r14|0;r14=r10,r10=r14>>2;r17=r1;while(1){r1=HEAP32[r10+4];HEAP32[r9>>2]=r1;r18=HEAP32[r12>>2];do{if((r18|0)==0){r5=1297}else{r19=r18;r20=r4;L1738:while(1){r21=r19,r22=r21>>2;while(1){r23=r21;if(HEAP32[r22+4]>>>0>=r1>>>0){break}r24=HEAP32[r22+1];if((r24|0)==0){r25=r20;break L1738}else{r21=r24,r22=r21>>2}}r21=HEAP32[r22];if((r21|0)==0){r25=r23;break}else{r19=r21;r20=r23}}if((r25|0)==(r4|0)){r5=1297;break}if(r1>>>0<HEAP32[r25+16>>2]>>>0){r5=1297;break}r20=HEAP32[r10+5];r19=HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r1|0,r7)>>2];HEAP32[r19>>2]=r3;HEAP32[r19+4>>2]=r2;do{if(!r11){if((HEAP32[r13>>2]|0)!=1){break}HEAP32[r16>>2]=HEAP32[r15>>2]+1|0}}while(0);r21=HEAP32[r10+1];L1751:do{if((r21|0)==0){r24=r14|0;while(1){r26=HEAP32[r24+8>>2];if((r24|0)==(HEAP32[r26>>2]|0)){r27=r26;break L1751}else{r24=r26}}}else{r24=r21;while(1){r22=HEAP32[r24>>2];if((r22|0)==0){r27=r24;break L1751}else{r24=r22}}}}while(0);r21=HEAP32[r8];r24=r21+16|0;r22=r24;r26=HEAP32[r24>>2];do{if((r26|0)!=0){r24=r26;r28=r22;L1759:while(1){r29=r24,r30=r29>>2;while(1){r31=r29;if(HEAP32[r30+4]>>>0>=r1>>>0){break}r32=HEAP32[r30+1];if((r32|0)==0){r33=r28;break L1759}else{r29=r32,r30=r29>>2}}r29=HEAP32[r30];if((r29|0)==0){r33=r31;break}else{r24=r29;r28=r31}}if((r33|0)==(r22|0)){break}if(r1>>>0<HEAP32[r33+16>>2]>>>0){break}r28=r33|0;r24=HEAP32[r33+4>>2];L1768:do{if((r24|0)==0){r29=r28;while(1){r32=HEAP32[r29+8>>2];if((r29|0)==(HEAP32[r32>>2]|0)){r34=r32;break L1768}else{r29=r32}}}else{r29=r24;while(1){r30=HEAP32[r29>>2];if((r30|0)==0){r34=r29;break L1768}else{r29=r30}}}}while(0);r24=r21+12|0;if((HEAP32[r24>>2]|0)==(r33|0)){HEAP32[r24>>2]=r34}r24=r21+20|0;HEAP32[r24>>2]=HEAP32[r24>>2]-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r26,r28);__ZdlPv(r33)}}while(0);HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r21+36|0,r9)>>2]=r20;r26=HEAP32[r9>>2];r22=r26+4|0;r24=r22;r29=HEAP32[r22>>2];do{if((r29|0)!=0){r22=r29;r30=r24;L1779:while(1){r32=r22,r35=r32>>2;while(1){r36=r32;if(HEAP32[r35+4]>>>0>=r21>>>0){break}r37=HEAP32[r35+1];if((r37|0)==0){r38=r30;break L1779}else{r32=r37,r35=r32>>2}}r32=HEAP32[r35];if((r32|0)==0){r38=r36;break}else{r22=r32;r30=r36}}if((r38|0)==(r24|0)){break}if(r21>>>0<HEAP32[r38+16>>2]>>>0){break}r30=r38|0;r22=HEAP32[r38+4>>2];L1788:do{if((r22|0)==0){r28=r30;while(1){r32=HEAP32[r28+8>>2];if((r28|0)==(HEAP32[r32>>2]|0)){r39=r32;break L1788}else{r28=r32}}}else{r28=r22;while(1){r35=HEAP32[r28>>2];if((r35|0)==0){r39=r28;break L1788}else{r28=r35}}}}while(0);r22=r26|0;if((HEAP32[r22>>2]|0)==(r38|0)){HEAP32[r22>>2]=r39}r22=r26+8|0;HEAP32[r22>>2]=HEAP32[r22>>2]-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r29,r30);__ZdlPv(r38)}}while(0);HEAP32[__ZNSt3__13mapIP5BlockP6BranchNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r26+24|0,r7)>>2]=r19;r40=r27;r41=HEAP32[r8];break}}while(0);L1798:do{if(r5==1297){r5=0;r1=HEAP32[r10+1];if((r1|0)!=0){r18=r1;while(1){r1=HEAP32[r18>>2];if((r1|0)==0){r40=r18;r41=r17;break L1798}else{r18=r1}}}r18=r14|0;while(1){r19=HEAP32[r18+8>>2];if((r18|0)==(HEAP32[r19>>2]|0)){r40=r19;r41=r17;break L1798}else{r18=r19}}}}while(0);if((r40|0)==(r41+16|0)){break}r14=r40,r10=r14>>2;r17=r41}STACKTOP=r6;return}function __ZNSt3__13mapIP5BlockP5ShapeNS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S4_EEEEEixERS9_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4,r6=r5>>2;r7=r1+4|0;r8=r7|0;r9=HEAP32[r8>>2];do{if((r9|0)==0){r10=r7;HEAP32[r6]=r10;r11=r8,r12=r11>>2;r13=r10}else{r10=HEAP32[r2>>2];r14=r9;while(1){r15=HEAP32[r14+16>>2];if(r10>>>0<r15>>>0){r16=r14|0;r17=HEAP32[r16>>2];if((r17|0)==0){r3=1344;break}else{r14=r17;continue}}if(r15>>>0>=r10>>>0){r3=1348;break}r18=r14+4|0;r15=HEAP32[r18>>2];if((r15|0)==0){r3=1347;break}else{r14=r15}}if(r3==1344){HEAP32[r6]=r14;r11=r16,r12=r11>>2;r13=r14;break}else if(r3==1347){HEAP32[r6]=r14;r11=r18,r12=r11>>2;r13=r14;break}else if(r3==1348){HEAP32[r6]=r14;r11=r5,r12=r11>>2;r13=r14;break}}}while(0);r5=HEAP32[r12];if((r5|0)!=0){r19=r5;r20=r19+20|0;STACKTOP=r4;return r20}r5=__Znwj(24),r6=r5>>2;r3=r5+16|0;if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r2>>2]}r2=r5+20|0;if((r2|0)!=0){HEAP32[r2>>2]=0}r2=r5;HEAP32[r6]=0;HEAP32[r6+1]=0;HEAP32[r6+2]=r13;HEAP32[r12]=r2;r13=r1|0;r6=HEAP32[HEAP32[r13>>2]>>2];if((r6|0)==0){r21=r2}else{HEAP32[r13>>2]=r6;r21=HEAP32[r12]}__ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r1+4>>2],r21);r21=r1+8|0;HEAP32[r21>>2]=HEAP32[r21>>2]+1|0;r19=r5;r20=r19+20|0;STACKTOP=r4;return r20}function __ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r3=0;r4=r2|0;r5=HEAP32[r4>>2];L1838:do{if((r5|0)==0){r6=r2;r3=1365}else{r7=HEAP32[r2+4>>2];if((r7|0)==0){r8=r5;r9=r2;r10=r2|0;r3=1367;break}else{r11=r7;while(1){r7=HEAP32[r11>>2];if((r7|0)==0){r6=r11;r3=1365;break L1838}else{r11=r7}}}}}while(0);do{if(r3==1365){r5=r6|0;r11=HEAP32[r6+4>>2];if((r11|0)!=0){r8=r11;r9=r6;r10=r5;r3=1367;break}r12=0;r13=0;r14=r6+8|0,r15=r14>>2;r16=r6;r17=r5;break}}while(0);if(r3==1367){r6=r9+8|0;HEAP32[r8+8>>2]=HEAP32[r6>>2];r12=r8;r13=1;r14=r6,r15=r14>>2;r16=r9;r17=r10}r10=HEAP32[r15];r9=r10|0;do{if((r16|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r12;if((r16|0)==(r1|0)){r18=r12;r19=0;break}r18=r1;r19=HEAP32[HEAP32[r15]+4>>2]}else{HEAP32[r10+4>>2]=r12;r18=r1;r19=HEAP32[HEAP32[r15]>>2]}}while(0);r1=r16+12|0;r10=(HEAP8[r1]&1)<<24>>24==0;if((r16|0)==(r2|0)){r20=r18}else{r9=r2+8|0;r14=HEAP32[r9>>2];HEAP32[r15]=r14;if((HEAP32[HEAP32[r9>>2]>>2]|0)==(r2|0)){HEAP32[r14>>2]=r16}else{HEAP32[r14+4>>2]=r16}r14=HEAP32[r4>>2];HEAP32[r17>>2]=r14;HEAP32[r14+8>>2]=r16;r14=HEAP32[r2+4>>2];HEAP32[r16+4>>2]=r14;if((r14|0)!=0){HEAP32[r14+8>>2]=r16}HEAP8[r1]=HEAP8[r2+12|0]&1;r20=(r18|0)==(r2|0)?r16:r18}if(r10|(r20|0)==0){return}if(r13){HEAP8[r12+12|0]=1;return}else{r21=r20;r22=r19}while(1){r19=(r22+8|0)>>2;r20=HEAP32[r19];r12=r22+12|0;r13=(HEAP8[r12]&1)<<24>>24!=0;if((r22|0)==(HEAP32[r20>>2]|0)){if(r13){r23=r21;r24=r22,r25=r24>>2}else{HEAP8[r12]=1;HEAP8[r20+12|0]=0;r10=HEAP32[r19];r18=r10|0;r16=HEAP32[r18>>2];r2=r16+4|0;r1=HEAP32[r2>>2];HEAP32[r18>>2]=r1;if((r1|0)!=0){HEAP32[r1+8>>2]=r10}r1=(r10+8|0)>>2;HEAP32[r16+8>>2]=HEAP32[r1];r18=HEAP32[r1];r14=r18|0;if((HEAP32[r14>>2]|0)==(r10|0)){HEAP32[r14>>2]=r16}else{HEAP32[r18+4>>2]=r16}HEAP32[r2>>2]=r10;HEAP32[r1]=r16;r16=HEAP32[r22+4>>2];r23=(r21|0)==(r16|0)?r22:r21;r24=HEAP32[r16>>2],r25=r24>>2}r26=HEAP32[r25];r27=(r26|0)==0;if(!r27){if((HEAP8[r26+12|0]&1)<<24>>24==0){r3=1429;break}}r16=HEAP32[r25+1];if((r16|0)!=0){if((HEAP8[r16+12|0]&1)<<24>>24==0){r3=1428;break}}HEAP8[r24+12|0]=0;r16=HEAP32[r25+2];r28=r16+12|0;if((HEAP8[r28]&1)<<24>>24==0|(r16|0)==(r23|0)){r3=1425;break}r1=HEAP32[r16+8>>2];r10=HEAP32[r1>>2];if((r16|0)!=(r10|0)){r21=r23;r22=r10;continue}r21=r23;r22=HEAP32[r1+4>>2];continue}if(r13){r29=r21;r30=r22,r31=r30>>2}else{HEAP8[r12]=1;HEAP8[r20+12|0]=0;r20=HEAP32[r19];r19=r20+4|0;r12=HEAP32[r19>>2];r13=r12|0;r1=HEAP32[r13>>2];HEAP32[r19>>2]=r1;if((r1|0)!=0){HEAP32[r1+8>>2]=r20}r1=(r20+8|0)>>2;HEAP32[r12+8>>2]=HEAP32[r1];r19=HEAP32[r1];r10=r19|0;if((HEAP32[r10>>2]|0)==(r20|0)){HEAP32[r10>>2]=r12}else{HEAP32[r19+4>>2]=r12}HEAP32[r13>>2]=r20;HEAP32[r1]=r12;r12=HEAP32[r22>>2];r29=(r21|0)==(r12|0)?r22:r21;r30=HEAP32[r12+4>>2],r31=r30>>2}r32=(r30|0)>>2;r33=HEAP32[r32];if((r33|0)!=0){if((HEAP8[r33+12|0]&1)<<24>>24==0){r3=1399;break}}r12=HEAP32[r31+1];if((r12|0)!=0){if((HEAP8[r12+12|0]&1)<<24>>24==0){r34=r12;r3=1400;break}}HEAP8[r30+12|0]=0;r12=HEAP32[r31+2];if((r12|0)==(r29|0)){r35=r29;r3=1396;break}if((HEAP8[r12+12|0]&1)<<24>>24==0){r35=r12;r3=1396;break}r1=HEAP32[r12+8>>2];r20=HEAP32[r1>>2];if((r12|0)!=(r20|0)){r21=r29;r22=r20;continue}r21=r29;r22=HEAP32[r1+4>>2]}do{if(r3==1428){if(r27){r3=1430;break}else{r3=1429;break}}else if(r3==1396){HEAP8[r35+12|0]=1;return}else if(r3==1399){r22=HEAP32[r31+1];if((r22|0)==0){r3=1401;break}else{r34=r22;r3=1400;break}}else if(r3==1425){HEAP8[r28]=1;return}}while(0);do{if(r3==1429){if((HEAP8[r26+12|0]&1)<<24>>24==0){r36=r24;r3=1436;break}else{r3=1430;break}}else if(r3==1400){if((HEAP8[r34+12|0]&1)<<24>>24==0){r37=r30;r3=1407;break}else{r3=1401;break}}}while(0);do{if(r3==1430){r34=(r24+4|0)>>2;HEAP8[HEAP32[r34]+12|0]=1;HEAP8[r24+12|0]=0;r26=HEAP32[r34];r28=r26|0;r31=HEAP32[r28>>2];HEAP32[r34]=r31;if((r31|0)!=0){HEAP32[r31+8>>2]=r24}r31=(r24+8|0)>>2;HEAP32[r26+8>>2]=HEAP32[r31];r34=HEAP32[r31];r35=r34|0;if((HEAP32[r35>>2]|0)==(r24|0)){HEAP32[r35>>2]=r26}else{HEAP32[r34+4>>2]=r26}HEAP32[r28>>2]=r24;HEAP32[r31]=r26;r36=r26;r3=1436;break}else if(r3==1401){HEAP8[r33+12|0]=1;HEAP8[r30+12|0]=0;r26=HEAP32[r32];r31=r26+4|0;r28=HEAP32[r31>>2];HEAP32[r32]=r28;if((r28|0)!=0){HEAP32[r28+8>>2]=r30}r28=(r30+8|0)>>2;HEAP32[r26+8>>2]=HEAP32[r28];r34=HEAP32[r28];r35=r34|0;if((HEAP32[r35>>2]|0)==(r30|0)){HEAP32[r35>>2]=r26}else{HEAP32[r34+4>>2]=r26}HEAP32[r31>>2]=r30;HEAP32[r28]=r26;r37=r26;r3=1407;break}}while(0);if(r3==1407){r30=r37+8|0;r32=HEAP32[r30>>2]+12|0;HEAP8[r37+12|0]=HEAP8[r32]&1;HEAP8[r32]=1;HEAP8[HEAP32[r37+4>>2]+12|0]=1;r37=HEAP32[r30>>2];r30=r37+4|0;r32=HEAP32[r30>>2];r33=r32|0;r24=HEAP32[r33>>2];HEAP32[r30>>2]=r24;if((r24|0)!=0){HEAP32[r24+8>>2]=r37}r24=(r37+8|0)>>2;HEAP32[r32+8>>2]=HEAP32[r24];r30=HEAP32[r24];r26=r30|0;if((HEAP32[r26>>2]|0)==(r37|0)){HEAP32[r26>>2]=r32}else{HEAP32[r30+4>>2]=r32}HEAP32[r33>>2]=r37;HEAP32[r24]=r32;return}else if(r3==1436){r3=r36+8|0;r32=HEAP32[r3>>2]+12|0;HEAP8[r36+12|0]=HEAP8[r32]&1;HEAP8[r32]=1;HEAP8[HEAP32[r36>>2]+12|0]=1;r36=HEAP32[r3>>2];r3=r36|0;r32=HEAP32[r3>>2];r24=r32+4|0;r37=HEAP32[r24>>2];HEAP32[r3>>2]=r37;if((r37|0)!=0){HEAP32[r37+8>>2]=r36}r37=(r36+8|0)>>2;HEAP32[r32+8>>2]=HEAP32[r37];r3=HEAP32[r37];r33=r3|0;if((HEAP32[r33>>2]|0)==(r36|0)){HEAP32[r33>>2]=r32}else{HEAP32[r3+4>>2]=r32}HEAP32[r24>>2]=r36;HEAP32[r37]=r32;return}}function __ZNSt3__16__treeINS_4pairIP5BlockNS_3setIS3_NS_4lessIS3_EENS_9allocatorIS3_EEEEEENS_19__map_value_compareIS3_S9_S6_Lb1EEENS7_ISA_EEE14__erase_uniqueIS3_EEjRKT_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r1+4|0;r4=r3;r5=HEAP32[r3>>2];if((r5|0)==0){r6=0;return r6}r3=HEAP32[r2>>2];r2=r5;r5=r4;L1963:while(1){r7=r2,r8=r7>>2;while(1){r9=r7;if(HEAP32[r8+4]>>>0>=r3>>>0){break}r10=HEAP32[r8+1];if((r10|0)==0){r11=r5,r12=r11>>2;break L1963}else{r7=r10,r8=r7>>2}}r7=HEAP32[r8];if((r7|0)==0){r11=r9,r12=r11>>2;break}else{r2=r7;r5=r9}}if((r11|0)==(r4|0)){r6=0;return r6}if(r3>>>0<HEAP32[r12+4]>>>0){r6=0;return r6}r3=r11|0;r4=HEAP32[r12+1];L1976:do{if((r4|0)==0){r9=r3;while(1){r5=HEAP32[r9+8>>2];if((r9|0)==(HEAP32[r5>>2]|0)){r13=r5;break L1976}else{r9=r5}}}else{r9=r4;while(1){r8=HEAP32[r9>>2];if((r8|0)==0){r13=r9;break L1976}else{r9=r8}}}}while(0);r4=r1|0;if((HEAP32[r4>>2]|0)==(r11|0)){HEAP32[r4>>2]=r13}r13=r1+8|0;HEAP32[r13>>2]=HEAP32[r13>>2]-1|0;__ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(r11+20|0,HEAP32[r12+6]);__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r1+4>>2],r3);__ZdlPv(r11);r6=1;return r6}function __ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4,r6=r5>>2;r7=r1+4|0;r8=r7|0;r9=HEAP32[r8>>2];do{if((r9|0)==0){r10=r7;HEAP32[r6]=r10;r11=r8,r12=r11>>2;r13=r10}else{r10=HEAP32[r2>>2];r14=r9;while(1){r15=HEAP32[r14+16>>2];if(r10>>>0<r15>>>0){r16=r14|0;r17=HEAP32[r16>>2];if((r17|0)==0){r3=1472;break}else{r14=r17;continue}}if(r15>>>0>=r10>>>0){r3=1476;break}r18=r14+4|0;r15=HEAP32[r18>>2];if((r15|0)==0){r3=1475;break}else{r14=r15}}if(r3==1472){HEAP32[r6]=r14;r11=r16,r12=r11>>2;r13=r14;break}else if(r3==1476){HEAP32[r6]=r14;r11=r5,r12=r11>>2;r13=r14;break}else if(r3==1475){HEAP32[r6]=r14;r11=r18,r12=r11>>2;r13=r14;break}}}while(0);r18=HEAP32[r12];if((r18|0)!=0){r19=r18;r20=r19+20|0;STACKTOP=r4;return r20}r18=__Znwj(24),r6=r18>>2;r3=r18+16|0;if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r2>>2]}r2=r18+20|0;if((r2|0)!=0){HEAP32[r2>>2]=0}r2=r18;HEAP32[r6]=0;HEAP32[r6+1]=0;HEAP32[r6+2]=r13;HEAP32[r12]=r2;r13=r1|0;r6=HEAP32[HEAP32[r13>>2]>>2];if((r6|0)==0){r21=r2}else{HEAP32[r13>>2]=r6;r21=HEAP32[r12]}__ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[r1+4>>2],r21);r21=r1+8|0;HEAP32[r21>>2]=HEAP32[r21>>2]+1|0;r19=r18;r20=r19+20|0;STACKTOP=r4;return r20}function __ZN11SimpleShapeD1Ev(r1){return}function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(r1){return}function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(r1){return}function __ZN10__cxxabiv117__class_type_infoD1Ev(r1){return}function __ZN10__cxxabiv120__si_class_type_infoD1Ev(r1){return}function __ZNSt3__16__treeIP5BlockNS_4lessIS2_EENS_9allocatorIS2_EEE12__find_equalIS2_EERPNS_16__tree_node_baseIPvEENS_21__tree_const_iteratorIS2_PKNS_11__tree_nodeIS2_SA_EEiEESD_RKT_(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r5=r3>>2;r6=0;r7=STACKTOP;r8=r2;r2=STACKTOP;STACKTOP=STACKTOP+4|0;HEAP32[r2>>2]=HEAP32[r8>>2];r8=r1+4|0;r9=HEAP32[r2>>2];do{if((r9|0)!=(r8|0)){r2=HEAP32[r4>>2];r10=HEAP32[r9+16>>2];if(r2>>>0<r10>>>0){break}if(r10>>>0>=r2>>>0){HEAP32[r5]=r9|0;r11=r3;STACKTOP=r7;return r11}r10=r9+4|0;r12=HEAP32[r10>>2];r13=(r12|0)==0;L2027:do{if(r13){r14=r9|0;while(1){r15=HEAP32[r14+8>>2];if((r14|0)==(HEAP32[r15>>2]|0)){r16=r15;break L2027}else{r14=r15}}}else{r14=r12;while(1){r15=HEAP32[r14>>2];if((r15|0)==0){r16=r14;break L2027}else{r14=r15}}}}while(0);r12=r8;do{if((r16|0)!=(r12|0)){if(r2>>>0<HEAP32[r16+16>>2]>>>0){break}r14=r8|0;r15=HEAP32[r14>>2];if((r15|0)==0){HEAP32[r5]=r12;r11=r14;STACKTOP=r7;return r11}else{r17=r15}while(1){r15=HEAP32[r17+16>>2];if(r2>>>0<r15>>>0){r18=r17|0;r14=HEAP32[r18>>2];if((r14|0)==0){r6=1527;break}else{r17=r14;continue}}if(r15>>>0>=r2>>>0){r6=1531;break}r19=r17+4|0;r15=HEAP32[r19>>2];if((r15|0)==0){r6=1530;break}else{r17=r15}}if(r6==1530){HEAP32[r5]=r17;r11=r19;STACKTOP=r7;return r11}else if(r6==1531){HEAP32[r5]=r17;r11=r3;STACKTOP=r7;return r11}else if(r6==1527){HEAP32[r5]=r17;r11=r18;STACKTOP=r7;return r11}}}while(0);if(r13){HEAP32[r5]=r9|0;r11=r10;STACKTOP=r7;return r11}else{HEAP32[r5]=r16;r11=r16|0;STACKTOP=r7;return r11}}}while(0);r16=HEAP32[r9>>2];do{if((r9|0)==(HEAP32[r1>>2]|0)){r20=r9}else{L2062:do{if((r16|0)==0){r18=r9|0;while(1){r17=HEAP32[r18+8>>2];if((r18|0)==(HEAP32[r17>>2]|0)){r18=r17}else{r21=r17;break L2062}}}else{r18=r16;while(1){r17=HEAP32[r18+4>>2];if((r17|0)==0){r21=r18;break L2062}else{r18=r17}}}}while(0);r10=HEAP32[r4>>2];if(HEAP32[r21+16>>2]>>>0<r10>>>0){r20=r21;break}r13=r8|0;r18=HEAP32[r13>>2];if((r18|0)==0){HEAP32[r5]=r8;r11=r13;STACKTOP=r7;return r11}else{r22=r18}while(1){r18=HEAP32[r22+16>>2];if(r10>>>0<r18>>>0){r23=r22|0;r13=HEAP32[r23>>2];if((r13|0)==0){r6=1508;break}else{r22=r13;continue}}if(r18>>>0>=r10>>>0){r6=1512;break}r24=r22+4|0;r18=HEAP32[r24>>2];if((r18|0)==0){r6=1511;break}else{r22=r18}}if(r6==1511){HEAP32[r5]=r22;r11=r24;STACKTOP=r7;return r11}else if(r6==1512){HEAP32[r5]=r22;r11=r3;STACKTOP=r7;return r11}else if(r6==1508){HEAP32[r5]=r22;r11=r23;STACKTOP=r7;return r11}}}while(0);if((r16|0)==0){HEAP32[r5]=r9|0;r11=r9|0;STACKTOP=r7;return r11}else{HEAP32[r5]=r20|0;r11=r20+4|0;STACKTOP=r7;return r11}}function __ZZZN8Relooper9CalculateEP5BlockEN8Analyzer21FindIndependentGroupsE_0RNSt3__13setIS1_NS3_4lessIS1_EENS3_9allocatorIS1_EEEESA_RNS3_3mapIS1_S9_S6_NS7_INS3_4pairIKS1_S9_EEEEEEEN11HelperClass22InvalidateWithChildrenES1_(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r3=STACKTOP;STACKTOP=STACKTOP+20|0;r4=r3;r5=r3+12,r6=r5>>2;r7=r3+16;r8=(r4|0)>>2;r9=r4;HEAP32[r8]=r9;r10=r4+4|0;HEAP32[r10>>2]=r9;r11=(r4+8|0)>>2;HEAP32[r11]=0;r4=__Znwj(12);r12=r4;r13=r4+8|0;if((r13|0)!=0){HEAP32[r13>>2]=r2}HEAP32[HEAP32[r8]+4>>2]=r12;HEAP32[r4>>2]=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r4+4>>2]=r9;r4=HEAP32[r11]+1|0;HEAP32[r11]=r4;if((r4|0)==0){STACKTOP=r3;return}r4=r1+4|0;r12=r1|0;r2=r1+8|0;r1=r2;r13=r2|0;while(1){r2=HEAP32[r10>>2];HEAP32[r6]=HEAP32[r2+8>>2];r14=r2+4|0;r15=r2|0;HEAP32[HEAP32[r15>>2]+4>>2]=HEAP32[r14>>2];HEAP32[HEAP32[r14>>2]>>2]=HEAP32[r15>>2];HEAP32[r11]=HEAP32[r11]-1|0;__ZdlPv(r2);r2=HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r4,r5)>>2];HEAP32[r7>>2]=r2;r15=HEAP32[r12>>2];r14=r15+4|0;r16=r14;r17=HEAP32[r14>>2];do{if((r17|0)!=0){r14=r17;r18=r16;L2104:while(1){r19=r14,r20=r19>>2;while(1){r21=r19;if(HEAP32[r20+4]>>>0>=r2>>>0){break}r22=HEAP32[r20+1];if((r22|0)==0){r23=r18;break L2104}else{r19=r22,r20=r19>>2}}r19=HEAP32[r20];if((r19|0)==0){r23=r21;break}else{r14=r19;r18=r21}}if((r23|0)==(r16|0)){break}if(r2>>>0<HEAP32[r23+16>>2]>>>0|(r23|0)==(r16|0)){break}r18=__ZNSt3__13mapIP5BlockNS_3setIS2_NS_4lessIS2_EENS_9allocatorIS2_EEEES5_NS6_INS_4pairIKS2_S8_EEEEEixERSA_(r15,r7);r14=r18+4|0;r19=r14;r22=HEAP32[r14>>2];if((r22|0)==0){break}r14=HEAP32[r6];r24=r22;r25=r19;L2115:while(1){r26=r24,r27=r26>>2;while(1){r28=r26;if(HEAP32[r27+4]>>>0>=r14>>>0){break}r29=HEAP32[r27+1];if((r29|0)==0){r30=r25;break L2115}else{r26=r29,r27=r26>>2}}r26=HEAP32[r27];if((r26|0)==0){r30=r28;break}else{r24=r26;r25=r28}}if((r30|0)==(r19|0)){break}if(r14>>>0<HEAP32[r30+16>>2]>>>0){break}r25=r30|0;r24=HEAP32[r30+4>>2];L2124:do{if((r24|0)==0){r26=r25;while(1){r20=HEAP32[r26+8>>2];if((r26|0)==(HEAP32[r20>>2]|0)){r31=r20;break L2124}else{r26=r20}}}else{r26=r24;while(1){r27=HEAP32[r26>>2];if((r27|0)==0){r31=r26;break L2124}else{r26=r27}}}}while(0);r24=r18|0;if((HEAP32[r24>>2]|0)==(r30|0)){HEAP32[r24>>2]=r31}r24=r18+8|0;HEAP32[r24>>2]=HEAP32[r24>>2]-1|0;__ZNSt3__113__tree_removeIPNS_16__tree_node_baseIPvEEEEvT_S5_(r22,r25);__ZdlPv(r30)}}while(0);L2135:do{if((HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r4,r5)>>2]|0)!=0){HEAP32[__ZNSt3__13mapIP5BlockS2_NS_4lessIS2_EENS_9allocatorINS_4pairIKS2_S2_EEEEEixERS7_(r4,r5)>>2]=0;r15=HEAP32[r6];r16=HEAP32[r15>>2];r2=r15+4|0;if((r16|0)==(r2|0)){break}else{r32=r16}while(1){r16=HEAP32[r32+16>>2];r15=HEAP32[r13>>2];do{if((r15|0)!=0){r17=r15;r24=r1;L2141:while(1){r14=r17,r19=r14>>2;while(1){r33=r14;if(HEAP32[r19+4]>>>0>=r16>>>0){break}r26=HEAP32[r19+1];if((r26|0)==0){r34=r24;break L2141}else{r14=r26,r19=r14>>2}}r14=HEAP32[r19];if((r14|0)==0){r34=r33;break}else{r17=r14;r24=r33}}if((r34|0)==(r1|0)){break}if(r16>>>0<HEAP32[r34+16>>2]>>>0){break}if((HEAP32[r34+20>>2]|0)==0){break}r24=__Znwj(12);r17=r24;r14=r24+8|0;if((r14|0)!=0){HEAP32[r14>>2]=r16}HEAP32[HEAP32[r8]+4>>2]=r17;HEAP32[r24>>2]=HEAP32[r8];HEAP32[r8]=r17;HEAP32[r24+4>>2]=r9;HEAP32[r11]=HEAP32[r11]+1|0}}while(0);r16=HEAP32[r32+4>>2];L2156:do{if((r16|0)==0){r15=r32|0;while(1){r24=HEAP32[r15+8>>2];if((r15|0)==(HEAP32[r24>>2]|0)){r35=r24;break L2156}else{r15=r24}}}else{r15=r16;while(1){r24=HEAP32[r15>>2];if((r24|0)==0){r35=r15;break L2156}else{r15=r24}}}}while(0);if((r35|0)==(r2|0)){break L2135}r32=r35}}}while(0);if((HEAP32[r11]|0)==0){break}}STACKTOP=r3;return}function __ZNSt3__16__treeINS_4pairIP5BlockS3_EENS_19__map_value_compareIS3_S3_NS_4lessIS3_EELb1EEENS_9allocatorIS4_EEE7destroyEPNS_11__tree_nodeIS4_PvEE(r1,r2){if((r2|0)==0){return}else{__ZNSt3__16__treeINS_4pairIP5BlockS3_EENS_19__map_value_compareIS3_S3_NS_4lessIS3_EELb1EEENS_9allocatorIS4_EEE7destroyEPNS_11__tree_nodeIS4_PvEE(r1,HEAP32[r2>>2]);__ZNSt3__16__treeINS_4pairIP5BlockS3_EENS_19__map_value_compareIS3_S3_NS_4lessIS3_EELb1EEENS_9allocatorIS4_EEE7destroyEPNS_11__tree_nodeIS4_PvEE(r1,HEAP32[r2+4>>2]);__ZdlPv(r2);return}}function __ZN11SimpleShapeD0Ev(r1){__ZdlPv(r1);return}function __ZN11SimpleShape6RenderEb(r1,r2){var r3;__ZN5Block6RenderEb(HEAP32[r1+16>>2],r2);r3=HEAP32[r1+8>>2];if((r3|0)==0){return}FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]+8>>2]](r3,r2);return}function __ZNSt3__112__deque_baseIP5ShapeNS_9allocatorIS2_EEE5clearEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=(r1+4|0)>>2;r3=HEAP32[r2];r4=(r1+16|0)>>2;r5=HEAP32[r4];r6=(r5>>>10<<2)+r3|0;r7=r1+8|0;r8=HEAP32[r7>>2];if((r8|0)==(r3|0)){r9=0;r10=0;r11=r1+20|0}else{r12=r1+20|0;r1=r5+HEAP32[r12>>2]|0;r9=((r1&1023)<<2)+HEAP32[r3+(r1>>>10<<2)>>2]|0;r10=((r5&1023)<<2)+HEAP32[r6>>2]|0;r11=r12}r12=r6;r6=r10;L2181:while(1){r10=r6;while(1){if((r10|0)==(r9|0)){break L2181}r5=r10+4|0;if((r5-HEAP32[r12>>2]|0)==4096){break}else{r10=r5}}r10=r12+4|0;r12=r10;r6=HEAP32[r10>>2]}HEAP32[r11>>2]=0;r11=r8-r3>>2;L2188:do{if(r11>>>0>2){r8=r3;while(1){__ZdlPv(HEAP32[r8>>2]);r6=HEAP32[r2]+4|0;HEAP32[r2]=r6;r12=HEAP32[r7>>2]-r6>>2;if(r12>>>0>2){r8=r6}else{r13=r12;break L2188}}}else{r13=r11}}while(0);if((r13|0)==1){HEAP32[r4]=512;return}else if((r13|0)==2){HEAP32[r4]=1024;return}else{return}}function __ZNSt3__112__deque_baseIP5BlockNS_9allocatorIS2_EEE5clearEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=(r1+4|0)>>2;r3=HEAP32[r2];r4=(r1+16|0)>>2;r5=HEAP32[r4];r6=(r5>>>10<<2)+r3|0;r7=r1+8|0;r8=HEAP32[r7>>2];if((r8|0)==(r3|0)){r9=0;r10=0;r11=r1+20|0}else{r12=r1+20|0;r1=r5+HEAP32[r12>>2]|0;r9=((r1&1023)<<2)+HEAP32[r3+(r1>>>10<<2)>>2]|0;r10=((r5&1023)<<2)+HEAP32[r6>>2]|0;r11=r12}r12=r6;r6=r10;L2203:while(1){r10=r6;while(1){if((r10|0)==(r9|0)){break L2203}r5=r10+4|0;if((r5-HEAP32[r12>>2]|0)==4096){break}else{r10=r5}}r10=r12+4|0;r12=r10;r6=HEAP32[r10>>2]}HEAP32[r11>>2]=0;r11=r8-r3>>2;L2210:do{if(r11>>>0>2){r8=r3;while(1){__ZdlPv(HEAP32[r8>>2]);r6=HEAP32[r2]+4|0;HEAP32[r2]=r6;r12=HEAP32[r7>>2]-r6>>2;if(r12>>>0>2){r8=r6}else{r13=r12;break L2210}}}else{r13=r11}}while(0);if((r13|0)==1){HEAP32[r4]=512;return}else if((r13|0)==2){HEAP32[r4]=1024;return}else{return}}function __ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1,r2){if((r2|0)==0){return}else{__ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1,HEAP32[r2>>2]);__ZNSt3__16__treeINS_4pairIP5BlockP6BranchEENS_19__map_value_compareIS3_S5_NS_4lessIS3_EELb1EEENS_9allocatorIS6_EEE7destroyEPNS_11__tree_nodeIS6_PvEE(r1,HEAP32[r2+4>>2]);__ZdlPv(r2);return}}function __GLOBAL__I_a(){HEAP32[1310995]=0;HEAP32[1310996]=0;HEAP32[1310994]=5243980;_atexit(48,5243976,___dso_handle);return}function __ZN10__cxxabiv117__class_type_infoD0Ev(r1){__ZdlPv(r1);return}function __ZN10__cxxabiv120__si_class_type_infoD0Ev(r1){__ZdlPv(r1);return}function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(r1,r2,r3,r4){var r5;if((HEAP32[r2+8>>2]|0)!=(r1|0)){return}r1=r2+16|0;r5=HEAP32[r1>>2];if((r5|0)==0){HEAP32[r1>>2]=r3;HEAP32[r2+24>>2]=r4;HEAP32[r2+36>>2]=1;return}if((r5|0)!=(r3|0)){r3=r2+36|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1|0;HEAP32[r2+24>>2]=2;HEAP8[r2+54|0]=1;return}r3=r2+24|0;if((HEAP32[r3>>2]|0)!=2){return}HEAP32[r3>>2]=r4;return}function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(r1,r2,r3,r4,r5){var r6;r5=r2>>2;if((HEAP32[r5+2]|0)==(r1|0)){if((HEAP32[r5+1]|0)!=(r3|0)){return}r6=r2+28|0;if((HEAP32[r6>>2]|0)==1){return}HEAP32[r6>>2]=r4;return}if((HEAP32[r5]|0)!=(r1|0)){return}do{if((HEAP32[r5+4]|0)!=(r3|0)){r1=r2+20|0;if((HEAP32[r1>>2]|0)==(r3|0)){break}HEAP32[r5+8]=r4;HEAP32[r1>>2]=r3;r1=r2+40|0;HEAP32[r1>>2]=HEAP32[r1>>2]+1|0;do{if((HEAP32[r5+9]|0)==1){if((HEAP32[r5+6]|0)!=2){break}HEAP8[r2+54|0]=1}}while(0);HEAP32[r5+11]=4;return}}while(0);if((r4|0)!=1){return}HEAP32[r5+8]=1;return}function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(r1,r2,r3,r4,r5,r6){var r7;r6=r2>>2;if((HEAP32[r6+2]|0)!=(r1|0)){return}HEAP8[r2+53|0]=1;if((HEAP32[r6+1]|0)!=(r4|0)){return}HEAP8[r2+52|0]=1;r4=r2+16|0;r1=HEAP32[r4>>2];if((r1|0)==0){HEAP32[r4>>2]=r3;HEAP32[r6+6]=r5;HEAP32[r6+9]=1;if(!((HEAP32[r6+12]|0)==1&(r5|0)==1)){return}HEAP8[r2+54|0]=1;return}if((r1|0)!=(r3|0)){r3=r2+36|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1|0;HEAP8[r2+54|0]=1;return}r3=r2+24|0;r1=HEAP32[r3>>2];if((r1|0)==2){HEAP32[r3>>2]=r5;r7=r5}else{r7=r1}if(!((HEAP32[r6+12]|0)==1&(r7|0)==1)){return}HEAP8[r2+54|0]=1;return}function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=STACKTOP;STACKTOP=STACKTOP+56|0;r5=r4,r6=r5>>2;do{if((r1|0)==(r2|0)){r7=1}else{if((r2|0)==0){r7=0;break}r8=___dynamic_cast(r2,5244672,5244660,-1);r9=r8;if((r8|0)==0){r7=0;break}_memset(r5,0,56);HEAP32[r6]=r9;HEAP32[r6+2]=r1;HEAP32[r6+3]=-1;HEAP32[r6+12]=1;FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+28>>2]](r9,r5,HEAP32[r3>>2],1);if((HEAP32[r6+6]|0)!=1){r7=0;break}HEAP32[r3>>2]=HEAP32[r6+4];r7=1}}while(0);STACKTOP=r4;return r7}function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(r1,r2,r3,r4){var r5;if((r1|0)!=(HEAP32[r2+8>>2]|0)){r5=HEAP32[r1+8>>2];FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+28>>2]](r5,r2,r3,r4);return}r5=r2+16|0;r1=HEAP32[r5>>2];if((r1|0)==0){HEAP32[r5>>2]=r3;HEAP32[r2+24>>2]=r4;HEAP32[r2+36>>2]=1;return}if((r1|0)!=(r3|0)){r3=r2+36|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1|0;HEAP32[r2+24>>2]=2;HEAP8[r2+54|0]=1;return}r3=r2+24|0;if((HEAP32[r3>>2]|0)!=2){return}HEAP32[r3>>2]=r4;return}function ___dynamic_cast(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=STACKTOP;STACKTOP=STACKTOP+56|0;r6=r5,r7=r6>>2;r8=HEAP32[r1>>2];r9=r1+HEAP32[r8-8>>2]|0;r10=HEAP32[r8-4>>2];r8=r10;HEAP32[r7]=r3;HEAP32[r7+1]=r1;HEAP32[r7+2]=r2;HEAP32[r7+3]=r4;r4=r6+16|0;r2=r6+20|0;r1=r6+24|0;r11=r6+28|0;r12=r6+32|0;r13=r6+40|0;_memset(r4,0,39);if((r10|0)==(r3|0)){HEAP32[r7+12]=1;FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+20>>2]](r8,r6,r9,r9,1,0);STACKTOP=r5;return(HEAP32[r1>>2]|0)==1?r9:0}FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+24>>2]](r8,r6,r9,1,0);r9=HEAP32[r7+9];if((r9|0)==0){if((HEAP32[r13>>2]|0)!=1){r14=0;STACKTOP=r5;return r14}if((HEAP32[r11>>2]|0)!=1){r14=0;STACKTOP=r5;return r14}r14=(HEAP32[r12>>2]|0)==1?HEAP32[r2>>2]:0;STACKTOP=r5;return r14}else if((r9|0)==1){do{if((HEAP32[r1>>2]|0)!=1){if((HEAP32[r13>>2]|0)!=0){r14=0;STACKTOP=r5;return r14}if((HEAP32[r11>>2]|0)!=1){r14=0;STACKTOP=r5;return r14}if((HEAP32[r12>>2]|0)==1){break}else{r14=0}STACKTOP=r5;return r14}}while(0);r14=HEAP32[r4>>2];STACKTOP=r5;return r14}else{r14=0;STACKTOP=r5;return r14}}function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13;r6=r2>>2;r7=0;r8=r1|0;if((r8|0)==(HEAP32[r6+2]|0)){if((HEAP32[r6+1]|0)!=(r3|0)){return}r9=r2+28|0;if((HEAP32[r9>>2]|0)==1){return}HEAP32[r9>>2]=r4;return}if((r8|0)!=(HEAP32[r6]|0)){r8=HEAP32[r1+8>>2];FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+24>>2]](r8,r2,r3,r4,r5);return}do{if((HEAP32[r6+4]|0)!=(r3|0)){r8=r2+20|0;if((HEAP32[r8>>2]|0)==(r3|0)){break}HEAP32[r6+8]=r4;r9=(r2+44|0)>>2;if((HEAP32[r9]|0)==4){return}r10=r2+52|0;HEAP8[r10]=0;r11=r2+53|0;HEAP8[r11]=0;r12=HEAP32[r1+8>>2];FUNCTION_TABLE[HEAP32[HEAP32[r12>>2]+20>>2]](r12,r2,r3,r3,1,r5);do{if((HEAP8[r11]&1)<<24>>24==0){r13=0;r7=1763}else{if((HEAP8[r10]&1)<<24>>24==0){r13=1;r7=1763;break}else{break}}}while(0);L2368:do{if(r7==1763){HEAP32[r8>>2]=r3;r10=r2+40|0;HEAP32[r10>>2]=HEAP32[r10>>2]+1|0;do{if((HEAP32[r6+9]|0)==1){if((HEAP32[r6+6]|0)!=2){r7=1766;break}HEAP8[r2+54|0]=1;if(r13){break L2368}else{break}}else{r7=1766}}while(0);if(r7==1766){if(r13){break}}HEAP32[r9]=4;return}}while(0);HEAP32[r9]=3;return}}while(0);if((r4|0)!=1){return}HEAP32[r6+8]=1;return}function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(r1,r2,r3,r4,r5,r6){var r7,r8,r9;r7=r2>>2;if((r1|0)!=(HEAP32[r7+2]|0)){r8=HEAP32[r1+8>>2];FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]+20>>2]](r8,r2,r3,r4,r5,r6);return}HEAP8[r2+53|0]=1;if((HEAP32[r7+1]|0)!=(r4|0)){return}HEAP8[r2+52|0]=1;r4=r2+16|0;r6=HEAP32[r4>>2];if((r6|0)==0){HEAP32[r4>>2]=r3;HEAP32[r7+6]=r5;HEAP32[r7+9]=1;if(!((HEAP32[r7+12]|0)==1&(r5|0)==1)){return}HEAP8[r2+54|0]=1;return}if((r6|0)!=(r3|0)){r3=r2+36|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1|0;HEAP8[r2+54|0]=1;return}r3=r2+24|0;r6=HEAP32[r3>>2];if((r6|0)==2){HEAP32[r3>>2]=r5;r9=r5}else{r9=r6}if(!((HEAP32[r7+12]|0)==1&(r9|0)==1)){return}HEAP8[r2+54|0]=1;return}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[1310876];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=(r8<<2)+5243544|0;r10=(r8+2<<2)+5243544|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[1310876]=r5&(1<<r7^-1)}else{if(r12>>>0<HEAP32[1310880]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[1310878]>>>0){r15=r3,r16=r15>>2;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r17=r13>>>(r9>>>0);r13=r17>>>1&2;r18=r17>>>(r13>>>0);r17=r18>>>1&1;r19=(r10|r12|r9|r13|r17)+(r18>>>(r17>>>0))|0;r17=r19<<1;r18=(r17<<2)+5243544|0;r13=(r17+2<<2)+5243544|0;r17=HEAP32[r13>>2];r9=r17+8|0;r12=HEAP32[r9>>2];do{if((r18|0)==(r12|0)){HEAP32[1310876]=r5&(1<<r19^-1)}else{if(r12>>>0<HEAP32[1310880]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r17|0)){HEAP32[r10>>2]=r18;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r19<<3;r13=r12-r3|0;HEAP32[r17+4>>2]=r3|3;r18=r17;r5=r18+r3|0;HEAP32[r18+(r3|4)>>2]=r13|1;HEAP32[r18+r12>>2]=r13;r12=HEAP32[1310878];if((r12|0)!=0){r18=HEAP32[1310881];r4=r12>>>3;r12=r4<<1;r6=(r12<<2)+5243544|0;r11=HEAP32[1310876];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[1310876]=r11|r8;r20=r6;r21=(r12+2<<2)+5243544|0}else{r4=(r12+2<<2)+5243544|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[1310880]>>>0){r20=r7;r21=r4;break}_abort()}}while(0);HEAP32[r21>>2]=r18;HEAP32[r20+12>>2]=r18;HEAP32[r18+8>>2]=r20;HEAP32[r18+12>>2]=r6}HEAP32[1310878]=r13;HEAP32[1310881]=r5;r14=r9;return r14}r12=HEAP32[1310877];if((r12|0)==0){r15=r3,r16=r15>>2;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r17=r11>>>(r8>>>0);r11=r17>>>2&4;r19=r17>>>(r11>>>0);r17=r19>>>1&2;r4=r19>>>(r17>>>0);r19=r4>>>1&1;r7=HEAP32[((r8|r12|r11|r17|r19)+(r4>>>(r19>>>0))<<2)+5243808>>2];r19=r7;r4=r7,r17=r4>>2;r11=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r19+16>>2];if((r7|0)==0){r12=HEAP32[r19+20>>2];if((r12|0)==0){break}else{r22=r12}}else{r22=r7}r7=(HEAP32[r22+4>>2]&-8)-r3|0;r12=r7>>>0<r11>>>0;r19=r22;r4=r12?r22:r4,r17=r4>>2;r11=r12?r7:r11}r19=r4;r9=HEAP32[1310880];if(r19>>>0<r9>>>0){_abort()}r5=r19+r3|0;r13=r5;if(r19>>>0>=r5>>>0){_abort()}r5=HEAP32[r17+6];r6=HEAP32[r17+3];L2589:do{if((r6|0)==(r4|0)){r18=r4+20|0;r7=HEAP32[r18>>2];do{if((r7|0)==0){r12=r4+16|0;r8=HEAP32[r12>>2];if((r8|0)==0){r23=0,r24=r23>>2;break L2589}else{r25=r8;r26=r12;break}}else{r25=r7;r26=r18}}while(0);while(1){r18=r25+20|0;r7=HEAP32[r18>>2];if((r7|0)!=0){r25=r7;r26=r18;continue}r18=r25+16|0;r7=HEAP32[r18>>2];if((r7|0)==0){break}else{r25=r7;r26=r18}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r23=r25,r24=r23>>2;break}}else{r18=HEAP32[r17+2];if(r18>>>0<r9>>>0){_abort()}r7=r18+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r12=r6+8|0;if((HEAP32[r12>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r12>>2]=r18;r23=r6,r24=r23>>2;break}else{_abort()}}}while(0);L2611:do{if((r5|0)!=0){r6=r4+28|0;r9=(HEAP32[r6>>2]<<2)+5243808|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r23;if((r23|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r6>>2]^-1);break L2611}else{if(r5>>>0<HEAP32[1310880]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r4|0)){HEAP32[r18>>2]=r23}else{HEAP32[r5+20>>2]=r23}if((r23|0)==0){break L2611}}}while(0);if(r23>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r24+6]=r5;r6=HEAP32[r17+4];do{if((r6|0)!=0){if(r6>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r24+4]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);r6=HEAP32[r17+5];if((r6|0)==0){break}if(r6>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r24+5]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);if(r11>>>0<16){r5=r11+r3|0;HEAP32[r17+1]=r5|3;r6=r5+(r19+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r17+1]=r3|3;HEAP32[r19+(r3|4)>>2]=r11|1;HEAP32[r19+r11+r3>>2]=r11;r6=HEAP32[1310878];if((r6|0)!=0){r5=HEAP32[1310881];r9=r6>>>3;r6=r9<<1;r18=(r6<<2)+5243544|0;r12=HEAP32[1310876];r7=1<<r9;do{if((r12&r7|0)==0){HEAP32[1310876]=r12|r7;r27=r18;r28=(r6+2<<2)+5243544|0}else{r9=(r6+2<<2)+5243544|0;r8=HEAP32[r9>>2];if(r8>>>0>=HEAP32[1310880]>>>0){r27=r8;r28=r9;break}_abort()}}while(0);HEAP32[r28>>2]=r5;HEAP32[r27+12>>2]=r5;HEAP32[r5+8>>2]=r27;HEAP32[r5+12>>2]=r18}HEAP32[1310878]=r11;HEAP32[1310881]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3,r16=r15>>2;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1,r16=r15>>2;break}r6=r1+11|0;r7=r6&-8,r12=r7>>2;r19=HEAP32[1310877];if((r19|0)==0){r15=r7,r16=r15>>2;break}r17=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r29=0}else{if(r7>>>0>16777215){r29=31;break}r6=(r9+1048320|0)>>>16&8;r8=r9<<r6;r10=(r8+520192|0)>>>16&4;r30=r8<<r10;r8=(r30+245760|0)>>>16&2;r31=14-(r10|r6|r8)+(r30<<r8>>>15)|0;r29=r7>>>((r31+7|0)>>>0)&1|r31<<1}}while(0);r9=HEAP32[(r29<<2)+5243808>>2];L2419:do{if((r9|0)==0){r32=0;r33=r17;r34=0}else{if((r29|0)==31){r35=0}else{r35=25-(r29>>>1)|0}r4=0;r13=r17;r11=r9,r18=r11>>2;r5=r7<<r35;r31=0;while(1){r8=HEAP32[r18+1]&-8;r30=r8-r7|0;if(r30>>>0<r13>>>0){if((r8|0)==(r7|0)){r32=r11;r33=r30;r34=r11;break L2419}else{r36=r11;r37=r30}}else{r36=r4;r37=r13}r30=HEAP32[r18+5];r8=HEAP32[((r5>>>31<<2)+16>>2)+r18];r6=(r30|0)==0|(r30|0)==(r8|0)?r31:r30;if((r8|0)==0){r32=r36;r33=r37;r34=r6;break L2419}else{r4=r36;r13=r37;r11=r8,r18=r11>>2;r5=r5<<1;r31=r6}}}}while(0);if((r34|0)==0&(r32|0)==0){r9=2<<r29;r17=r19&(r9|-r9);if((r17|0)==0){r15=r7,r16=r15>>2;break}r9=(r17&-r17)-1|0;r17=r9>>>12&16;r31=r9>>>(r17>>>0);r9=r31>>>5&8;r5=r31>>>(r9>>>0);r31=r5>>>2&4;r11=r5>>>(r31>>>0);r5=r11>>>1&2;r18=r11>>>(r5>>>0);r11=r18>>>1&1;r38=HEAP32[((r9|r17|r31|r5|r11)+(r18>>>(r11>>>0))<<2)+5243808>>2]}else{r38=r34}L2434:do{if((r38|0)==0){r39=r33;r40=r32,r41=r40>>2}else{r11=r38,r18=r11>>2;r5=r33;r31=r32;while(1){r17=(HEAP32[r18+1]&-8)-r7|0;r9=r17>>>0<r5>>>0;r13=r9?r17:r5;r17=r9?r11:r31;r9=HEAP32[r18+4];if((r9|0)!=0){r11=r9,r18=r11>>2;r5=r13;r31=r17;continue}r9=HEAP32[r18+5];if((r9|0)==0){r39=r13;r40=r17,r41=r40>>2;break L2434}else{r11=r9,r18=r11>>2;r5=r13;r31=r17}}}}while(0);if((r40|0)==0){r15=r7,r16=r15>>2;break}if(r39>>>0>=(HEAP32[1310878]-r7|0)>>>0){r15=r7,r16=r15>>2;break}r19=r40,r31=r19>>2;r5=HEAP32[1310880];if(r19>>>0<r5>>>0){_abort()}r11=r19+r7|0;r18=r11;if(r19>>>0>=r11>>>0){_abort()}r17=HEAP32[r41+6];r13=HEAP32[r41+3];L2447:do{if((r13|0)==(r40|0)){r9=r40+20|0;r4=HEAP32[r9>>2];do{if((r4|0)==0){r6=r40+16|0;r8=HEAP32[r6>>2];if((r8|0)==0){r42=0,r43=r42>>2;break L2447}else{r44=r8;r45=r6;break}}else{r44=r4;r45=r9}}while(0);while(1){r9=r44+20|0;r4=HEAP32[r9>>2];if((r4|0)!=0){r44=r4;r45=r9;continue}r9=r44+16|0;r4=HEAP32[r9>>2];if((r4|0)==0){break}else{r44=r4;r45=r9}}if(r45>>>0<r5>>>0){_abort()}else{HEAP32[r45>>2]=0;r42=r44,r43=r42>>2;break}}else{r9=HEAP32[r41+2];if(r9>>>0<r5>>>0){_abort()}r4=r9+12|0;if((HEAP32[r4>>2]|0)!=(r40|0)){_abort()}r6=r13+8|0;if((HEAP32[r6>>2]|0)==(r40|0)){HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r9;r42=r13,r43=r42>>2;break}else{_abort()}}}while(0);L2469:do{if((r17|0)!=0){r13=r40+28|0;r5=(HEAP32[r13>>2]<<2)+5243808|0;do{if((r40|0)==(HEAP32[r5>>2]|0)){HEAP32[r5>>2]=r42;if((r42|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r13>>2]^-1);break L2469}else{if(r17>>>0<HEAP32[1310880]>>>0){_abort()}r9=r17+16|0;if((HEAP32[r9>>2]|0)==(r40|0)){HEAP32[r9>>2]=r42}else{HEAP32[r17+20>>2]=r42}if((r42|0)==0){break L2469}}}while(0);if(r42>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r43+6]=r17;r13=HEAP32[r41+4];do{if((r13|0)!=0){if(r13>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r43+4]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);r13=HEAP32[r41+5];if((r13|0)==0){break}if(r13>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r43+5]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);do{if(r39>>>0<16){r17=r39+r7|0;HEAP32[r41+1]=r17|3;r13=r17+(r19+4)|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1}else{HEAP32[r41+1]=r7|3;HEAP32[((r7|4)>>2)+r31]=r39|1;HEAP32[(r39>>2)+r31+r12]=r39;r13=r39>>>3;if(r39>>>0<256){r17=r13<<1;r5=(r17<<2)+5243544|0;r9=HEAP32[1310876];r6=1<<r13;do{if((r9&r6|0)==0){HEAP32[1310876]=r9|r6;r46=r5;r47=(r17+2<<2)+5243544|0}else{r13=(r17+2<<2)+5243544|0;r4=HEAP32[r13>>2];if(r4>>>0>=HEAP32[1310880]>>>0){r46=r4;r47=r13;break}_abort()}}while(0);HEAP32[r47>>2]=r18;HEAP32[r46+12>>2]=r18;HEAP32[r12+(r31+2)]=r46;HEAP32[r12+(r31+3)]=r5;break}r17=r11;r6=r39>>>8;do{if((r6|0)==0){r48=0}else{if(r39>>>0>16777215){r48=31;break}r9=(r6+1048320|0)>>>16&8;r13=r6<<r9;r4=(r13+520192|0)>>>16&4;r8=r13<<r4;r13=(r8+245760|0)>>>16&2;r30=14-(r4|r9|r13)+(r8<<r13>>>15)|0;r48=r39>>>((r30+7|0)>>>0)&1|r30<<1}}while(0);r6=(r48<<2)+5243808|0;HEAP32[r12+(r31+7)]=r48;HEAP32[r12+(r31+5)]=0;HEAP32[r12+(r31+4)]=0;r5=HEAP32[1310877];r30=1<<r48;if((r5&r30|0)==0){HEAP32[1310877]=r5|r30;HEAP32[r6>>2]=r17;HEAP32[r12+(r31+6)]=r6;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}if((r48|0)==31){r49=0}else{r49=25-(r48>>>1)|0}r30=r39<<r49;r5=HEAP32[r6>>2];while(1){if((HEAP32[r5+4>>2]&-8|0)==(r39|0)){break}r50=(r30>>>31<<2)+r5+16|0;r6=HEAP32[r50>>2];if((r6|0)==0){r2=1950;break}else{r30=r30<<1;r5=r6}}if(r2==1950){if(r50>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r50>>2]=r17;HEAP32[r12+(r31+6)]=r5;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}}r30=r5+8|0;r6=HEAP32[r30>>2];r13=HEAP32[1310880];if(r5>>>0<r13>>>0){_abort()}if(r6>>>0<r13>>>0){_abort()}else{HEAP32[r6+12>>2]=r17;HEAP32[r30>>2]=r17;HEAP32[r12+(r31+2)]=r6;HEAP32[r12+(r31+3)]=r5;HEAP32[r12+(r31+6)]=0;break}}}while(0);r31=r40+8|0;if((r31|0)==0){r15=r7,r16=r15>>2;break}else{r14=r31}return r14}}while(0);r40=HEAP32[1310878];if(r15>>>0<=r40>>>0){r50=r40-r15|0;r39=HEAP32[1310881];if(r50>>>0>15){r49=r39;HEAP32[1310881]=r49+r15|0;HEAP32[1310878]=r50;HEAP32[(r49+4>>2)+r16]=r50|1;HEAP32[r49+r40>>2]=r50;HEAP32[r39+4>>2]=r15|3}else{HEAP32[1310878]=0;HEAP32[1310881]=0;HEAP32[r39+4>>2]=r40|3;r50=r40+(r39+4)|0;HEAP32[r50>>2]=HEAP32[r50>>2]|1}r14=r39+8|0;return r14}r39=HEAP32[1310879];if(r15>>>0<r39>>>0){r50=r39-r15|0;HEAP32[1310879]=r50;r39=HEAP32[1310882];r40=r39;HEAP32[1310882]=r40+r15|0;HEAP32[(r40+4>>2)+r16]=r50|1;HEAP32[r39+4>>2]=r15|3;r14=r39+8|0;return r14}do{if((HEAP32[1310720]|0)==0){r39=_sysconf(8);if((r39-1&r39|0)==0){HEAP32[1310722]=r39;HEAP32[1310721]=r39;HEAP32[1310723]=-1;HEAP32[1310724]=2097152;HEAP32[1310725]=0;HEAP32[1310987]=0;HEAP32[1310720]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r39=r15+48|0;r50=HEAP32[1310722];r40=r15+47|0;r49=r50+r40|0;r48=-r50|0;r50=r49&r48;if(r50>>>0<=r15>>>0){r14=0;return r14}r46=HEAP32[1310986];do{if((r46|0)!=0){r47=HEAP32[1310984];r41=r47+r50|0;if(r41>>>0<=r47>>>0|r41>>>0>r46>>>0){r14=0}else{break}return r14}}while(0);L2678:do{if((HEAP32[1310987]&4|0)==0){r46=HEAP32[1310882];L2680:do{if((r46|0)==0){r2=1980}else{r41=r46;r47=5243952;while(1){r51=r47|0;r42=HEAP32[r51>>2];if(r42>>>0<=r41>>>0){r52=r47+4|0;if((r42+HEAP32[r52>>2]|0)>>>0>r41>>>0){break}}r42=HEAP32[r47+8>>2];if((r42|0)==0){r2=1980;break L2680}else{r47=r42}}if((r47|0)==0){r2=1980;break}r41=r49-HEAP32[1310879]&r48;if(r41>>>0>=2147483647){r53=0;break}r5=_sbrk(r41);r17=(r5|0)==(HEAP32[r51>>2]+HEAP32[r52>>2]|0);r54=r17?r5:-1;r55=r17?r41:0;r56=r5;r57=r41;r2=1989;break}}while(0);do{if(r2==1980){r46=_sbrk(0);if((r46|0)==-1){r53=0;break}r7=r46;r41=HEAP32[1310721];r5=r41-1|0;if((r5&r7|0)==0){r58=r50}else{r58=r50-r7+(r5+r7&-r41)|0}r41=HEAP32[1310984];r7=r41+r58|0;if(!(r58>>>0>r15>>>0&r58>>>0<2147483647)){r53=0;break}r5=HEAP32[1310986];if((r5|0)!=0){if(r7>>>0<=r41>>>0|r7>>>0>r5>>>0){r53=0;break}}r5=_sbrk(r58);r7=(r5|0)==(r46|0);r54=r7?r46:-1;r55=r7?r58:0;r56=r5;r57=r58;r2=1989;break}}while(0);L2700:do{if(r2==1989){r5=-r57|0;if((r54|0)!=-1){r59=r55,r60=r59>>2;r61=r54,r62=r61>>2;r2=2e3;break L2678}do{if((r56|0)!=-1&r57>>>0<2147483647&r57>>>0<r39>>>0){r7=HEAP32[1310722];r46=r40-r57+r7&-r7;if(r46>>>0>=2147483647){r63=r57;break}if((_sbrk(r46)|0)==-1){_sbrk(r5);r53=r55;break L2700}else{r63=r46+r57|0;break}}else{r63=r57}}while(0);if((r56|0)==-1){r53=r55}else{r59=r63,r60=r59>>2;r61=r56,r62=r61>>2;r2=2e3;break L2678}}}while(0);HEAP32[1310987]=HEAP32[1310987]|4;r64=r53;r2=1997;break}else{r64=0;r2=1997}}while(0);do{if(r2==1997){if(r50>>>0>=2147483647){break}r53=_sbrk(r50);r56=_sbrk(0);if(!((r56|0)!=-1&(r53|0)!=-1&r53>>>0<r56>>>0)){break}r63=r56-r53|0;r56=r63>>>0>(r15+40|0)>>>0;r55=r56?r53:-1;if((r55|0)==-1){break}else{r59=r56?r63:r64,r60=r59>>2;r61=r55,r62=r61>>2;r2=2e3;break}}}while(0);do{if(r2==2e3){r64=HEAP32[1310984]+r59|0;HEAP32[1310984]=r64;if(r64>>>0>HEAP32[1310985]>>>0){HEAP32[1310985]=r64}r64=HEAP32[1310882],r50=r64>>2;L2720:do{if((r64|0)==0){r55=HEAP32[1310880];if((r55|0)==0|r61>>>0<r55>>>0){HEAP32[1310880]=r61}HEAP32[1310988]=r61;HEAP32[1310989]=r59;HEAP32[1310991]=0;HEAP32[1310885]=HEAP32[1310720];HEAP32[1310884]=-1;r55=0;while(1){r63=r55<<1;r56=(r63<<2)+5243544|0;HEAP32[(r63+3<<2)+5243544>>2]=r56;HEAP32[(r63+2<<2)+5243544>>2]=r56;r56=r55+1|0;if((r56|0)==32){break}else{r55=r56}}r55=r61+8|0;if((r55&7|0)==0){r65=0}else{r65=-r55&7}r55=r59-40-r65|0;HEAP32[1310882]=r61+r65|0;HEAP32[1310879]=r55;HEAP32[(r65+4>>2)+r62]=r55|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1310883]=HEAP32[1310724]}else{r55=5243952,r56=r55>>2;while(1){r66=HEAP32[r56];r67=r55+4|0;r68=HEAP32[r67>>2];if((r61|0)==(r66+r68|0)){r2=2012;break}r63=HEAP32[r56+2];if((r63|0)==0){break}else{r55=r63,r56=r55>>2}}do{if(r2==2012){if((HEAP32[r56+3]&8|0)!=0){break}r55=r64;if(!(r55>>>0>=r66>>>0&r55>>>0<r61>>>0)){break}HEAP32[r67>>2]=r68+r59|0;r55=HEAP32[1310882];r63=HEAP32[1310879]+r59|0;r53=r55;r57=r55+8|0;if((r57&7|0)==0){r69=0}else{r69=-r57&7}r57=r63-r69|0;HEAP32[1310882]=r53+r69|0;HEAP32[1310879]=r57;HEAP32[r69+(r53+4)>>2]=r57|1;HEAP32[r63+(r53+4)>>2]=40;HEAP32[1310883]=HEAP32[1310724];break L2720}}while(0);if(r61>>>0<HEAP32[1310880]>>>0){HEAP32[1310880]=r61}r56=r61+r59|0;r53=5243952;while(1){r70=r53|0;if((HEAP32[r70>>2]|0)==(r56|0)){r2=2022;break}r63=HEAP32[r53+8>>2];if((r63|0)==0){break}else{r53=r63}}do{if(r2==2022){if((HEAP32[r53+12>>2]&8|0)!=0){break}HEAP32[r70>>2]=r61;r56=r53+4|0;HEAP32[r56>>2]=HEAP32[r56>>2]+r59|0;r56=r61+8|0;if((r56&7|0)==0){r71=0}else{r71=-r56&7}r56=r59+(r61+8)|0;if((r56&7|0)==0){r72=0,r73=r72>>2}else{r72=-r56&7,r73=r72>>2}r56=r61+r72+r59|0;r63=r56;r57=r71+r15|0,r55=r57>>2;r40=r61+r57|0;r57=r40;r39=r56-(r61+r71)-r15|0;HEAP32[(r71+4>>2)+r62]=r15|3;do{if((r63|0)==(HEAP32[1310882]|0)){r54=HEAP32[1310879]+r39|0;HEAP32[1310879]=r54;HEAP32[1310882]=r57;HEAP32[r55+(r62+1)]=r54|1}else{if((r63|0)==(HEAP32[1310881]|0)){r54=HEAP32[1310878]+r39|0;HEAP32[1310878]=r54;HEAP32[1310881]=r57;HEAP32[r55+(r62+1)]=r54|1;HEAP32[(r54>>2)+r62+r55]=r54;break}r54=r59+4|0;r58=HEAP32[(r54>>2)+r62+r73];if((r58&3|0)==1){r52=r58&-8;r51=r58>>>3;L2765:do{if(r58>>>0<256){r48=HEAP32[((r72|8)>>2)+r62+r60];r49=HEAP32[r73+(r62+(r60+3))];r5=(r51<<3)+5243544|0;do{if((r48|0)!=(r5|0)){if(r48>>>0<HEAP32[1310880]>>>0){_abort()}if((HEAP32[r48+12>>2]|0)==(r63|0)){break}_abort()}}while(0);if((r49|0)==(r48|0)){HEAP32[1310876]=HEAP32[1310876]&(1<<r51^-1);break}do{if((r49|0)==(r5|0)){r74=r49+8|0}else{if(r49>>>0<HEAP32[1310880]>>>0){_abort()}r47=r49+8|0;if((HEAP32[r47>>2]|0)==(r63|0)){r74=r47;break}_abort()}}while(0);HEAP32[r48+12>>2]=r49;HEAP32[r74>>2]=r48}else{r5=r56;r47=HEAP32[((r72|24)>>2)+r62+r60];r46=HEAP32[r73+(r62+(r60+3))];L2786:do{if((r46|0)==(r5|0)){r7=r72|16;r41=r61+r54+r7|0;r17=HEAP32[r41>>2];do{if((r17|0)==0){r42=r61+r7+r59|0;r43=HEAP32[r42>>2];if((r43|0)==0){r75=0,r76=r75>>2;break L2786}else{r77=r43;r78=r42;break}}else{r77=r17;r78=r41}}while(0);while(1){r41=r77+20|0;r17=HEAP32[r41>>2];if((r17|0)!=0){r77=r17;r78=r41;continue}r41=r77+16|0;r17=HEAP32[r41>>2];if((r17|0)==0){break}else{r77=r17;r78=r41}}if(r78>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r78>>2]=0;r75=r77,r76=r75>>2;break}}else{r41=HEAP32[((r72|8)>>2)+r62+r60];if(r41>>>0<HEAP32[1310880]>>>0){_abort()}r17=r41+12|0;if((HEAP32[r17>>2]|0)!=(r5|0)){_abort()}r7=r46+8|0;if((HEAP32[r7>>2]|0)==(r5|0)){HEAP32[r17>>2]=r46;HEAP32[r7>>2]=r41;r75=r46,r76=r75>>2;break}else{_abort()}}}while(0);if((r47|0)==0){break}r46=r72+(r61+(r59+28))|0;r48=(HEAP32[r46>>2]<<2)+5243808|0;do{if((r5|0)==(HEAP32[r48>>2]|0)){HEAP32[r48>>2]=r75;if((r75|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r46>>2]^-1);break L2765}else{if(r47>>>0<HEAP32[1310880]>>>0){_abort()}r49=r47+16|0;if((HEAP32[r49>>2]|0)==(r5|0)){HEAP32[r49>>2]=r75}else{HEAP32[r47+20>>2]=r75}if((r75|0)==0){break L2765}}}while(0);if(r75>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r76+6]=r47;r5=r72|16;r46=HEAP32[(r5>>2)+r62+r60];do{if((r46|0)!=0){if(r46>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r76+4]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r46=HEAP32[(r54+r5>>2)+r62];if((r46|0)==0){break}if(r46>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r76+5]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r79=r61+(r52|r72)+r59|0;r80=r52+r39|0}else{r79=r63;r80=r39}r54=r79+4|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r55+(r62+1)]=r80|1;HEAP32[(r80>>2)+r62+r55]=r80;r54=r80>>>3;if(r80>>>0<256){r51=r54<<1;r58=(r51<<2)+5243544|0;r46=HEAP32[1310876];r47=1<<r54;do{if((r46&r47|0)==0){HEAP32[1310876]=r46|r47;r81=r58;r82=(r51+2<<2)+5243544|0}else{r54=(r51+2<<2)+5243544|0;r48=HEAP32[r54>>2];if(r48>>>0>=HEAP32[1310880]>>>0){r81=r48;r82=r54;break}_abort()}}while(0);HEAP32[r82>>2]=r57;HEAP32[r81+12>>2]=r57;HEAP32[r55+(r62+2)]=r81;HEAP32[r55+(r62+3)]=r58;break}r51=r40;r47=r80>>>8;do{if((r47|0)==0){r83=0}else{if(r80>>>0>16777215){r83=31;break}r46=(r47+1048320|0)>>>16&8;r52=r47<<r46;r54=(r52+520192|0)>>>16&4;r48=r52<<r54;r52=(r48+245760|0)>>>16&2;r49=14-(r54|r46|r52)+(r48<<r52>>>15)|0;r83=r80>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r83<<2)+5243808|0;HEAP32[r55+(r62+7)]=r83;HEAP32[r55+(r62+5)]=0;HEAP32[r55+(r62+4)]=0;r58=HEAP32[1310877];r49=1<<r83;if((r58&r49|0)==0){HEAP32[1310877]=r58|r49;HEAP32[r47>>2]=r51;HEAP32[r55+(r62+6)]=r47;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}if((r83|0)==31){r84=0}else{r84=25-(r83>>>1)|0}r49=r80<<r84;r58=HEAP32[r47>>2];while(1){if((HEAP32[r58+4>>2]&-8|0)==(r80|0)){break}r85=(r49>>>31<<2)+r58+16|0;r47=HEAP32[r85>>2];if((r47|0)==0){r2=2095;break}else{r49=r49<<1;r58=r47}}if(r2==2095){if(r85>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r85>>2]=r51;HEAP32[r55+(r62+6)]=r58;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}}r49=r58+8|0;r47=HEAP32[r49>>2];r52=HEAP32[1310880];if(r58>>>0<r52>>>0){_abort()}if(r47>>>0<r52>>>0){_abort()}else{HEAP32[r47+12>>2]=r51;HEAP32[r49>>2]=r51;HEAP32[r55+(r62+2)]=r47;HEAP32[r55+(r62+3)]=r58;HEAP32[r55+(r62+6)]=0;break}}}while(0);r14=r61+(r71|8)|0;return r14}}while(0);r53=r64;r55=5243952,r40=r55>>2;while(1){r86=HEAP32[r40];if(r86>>>0<=r53>>>0){r87=HEAP32[r40+1];r88=r86+r87|0;if(r88>>>0>r53>>>0){break}}r55=HEAP32[r40+2],r40=r55>>2}r55=r86+(r87-39)|0;if((r55&7|0)==0){r89=0}else{r89=-r55&7}r55=r86+(r87-47)+r89|0;r40=r55>>>0<(r64+16|0)>>>0?r53:r55;r55=r40+8|0,r57=r55>>2;r39=r61+8|0;if((r39&7|0)==0){r90=0}else{r90=-r39&7}r39=r59-40-r90|0;HEAP32[1310882]=r61+r90|0;HEAP32[1310879]=r39;HEAP32[(r90+4>>2)+r62]=r39|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1310883]=HEAP32[1310724];HEAP32[r40+4>>2]=27;HEAP32[r57]=HEAP32[1310988];HEAP32[r57+1]=HEAP32[1310989];HEAP32[r57+2]=HEAP32[1310990];HEAP32[r57+3]=HEAP32[1310991];HEAP32[1310988]=r61;HEAP32[1310989]=r59;HEAP32[1310991]=0;HEAP32[1310990]=r55;r55=r40+28|0;HEAP32[r55>>2]=7;L2884:do{if((r40+32|0)>>>0<r88>>>0){r57=r55;while(1){r39=r57+4|0;HEAP32[r39>>2]=7;if((r57+8|0)>>>0<r88>>>0){r57=r39}else{break L2884}}}}while(0);if((r40|0)==(r53|0)){break}r55=r40-r64|0;r57=r55+(r53+4)|0;HEAP32[r57>>2]=HEAP32[r57>>2]&-2;HEAP32[r50+1]=r55|1;HEAP32[r53+r55>>2]=r55;r57=r55>>>3;if(r55>>>0<256){r39=r57<<1;r63=(r39<<2)+5243544|0;r56=HEAP32[1310876];r47=1<<r57;do{if((r56&r47|0)==0){HEAP32[1310876]=r56|r47;r91=r63;r92=(r39+2<<2)+5243544|0}else{r57=(r39+2<<2)+5243544|0;r49=HEAP32[r57>>2];if(r49>>>0>=HEAP32[1310880]>>>0){r91=r49;r92=r57;break}_abort()}}while(0);HEAP32[r92>>2]=r64;HEAP32[r91+12>>2]=r64;HEAP32[r50+2]=r91;HEAP32[r50+3]=r63;break}r39=r64;r47=r55>>>8;do{if((r47|0)==0){r93=0}else{if(r55>>>0>16777215){r93=31;break}r56=(r47+1048320|0)>>>16&8;r53=r47<<r56;r40=(r53+520192|0)>>>16&4;r57=r53<<r40;r53=(r57+245760|0)>>>16&2;r49=14-(r40|r56|r53)+(r57<<r53>>>15)|0;r93=r55>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r93<<2)+5243808|0;HEAP32[r50+7]=r93;HEAP32[r50+5]=0;HEAP32[r50+4]=0;r63=HEAP32[1310877];r49=1<<r93;if((r63&r49|0)==0){HEAP32[1310877]=r63|r49;HEAP32[r47>>2]=r39;HEAP32[r50+6]=r47;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}if((r93|0)==31){r94=0}else{r94=25-(r93>>>1)|0}r49=r55<<r94;r63=HEAP32[r47>>2];while(1){if((HEAP32[r63+4>>2]&-8|0)==(r55|0)){break}r95=(r49>>>31<<2)+r63+16|0;r47=HEAP32[r95>>2];if((r47|0)==0){r2=2130;break}else{r49=r49<<1;r63=r47}}if(r2==2130){if(r95>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r95>>2]=r39;HEAP32[r50+6]=r63;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}}r49=r63+8|0;r55=HEAP32[r49>>2];r47=HEAP32[1310880];if(r63>>>0<r47>>>0){_abort()}if(r55>>>0<r47>>>0){_abort()}else{HEAP32[r55+12>>2]=r39;HEAP32[r49>>2]=r39;HEAP32[r50+2]=r55;HEAP32[r50+3]=r63;HEAP32[r50+6]=0;break}}}while(0);r50=HEAP32[1310879];if(r50>>>0<=r15>>>0){break}r64=r50-r15|0;HEAP32[1310879]=r64;r50=HEAP32[1310882];r55=r50;HEAP32[1310882]=r55+r15|0;HEAP32[(r55+4>>2)+r16]=r64|1;HEAP32[r50+4>>2]=r15|3;r14=r50+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r2=r1>>2;r3=0;if((r1|0)==0){return}r4=r1-8|0;r5=r4;r6=HEAP32[1310880];if(r4>>>0<r6>>>0){_abort()}r7=HEAP32[r1-4>>2];r8=r7&3;if((r8|0)==1){_abort()}r9=r7&-8,r10=r9>>2;r11=r1+(r9-8)|0;r12=r11;L10:do{if((r7&1|0)==0){r13=HEAP32[r4>>2];if((r8|0)==0){return}r14=-8-r13|0,r15=r14>>2;r16=r1+r14|0;r17=r16;r18=r13+r9|0;if(r16>>>0<r6>>>0){_abort()}if((r17|0)==(HEAP32[1310881]|0)){r19=(r1+(r9-4)|0)>>2;if((HEAP32[r19]&3|0)!=3){r20=r17,r21=r20>>2;r22=r18;break}HEAP32[1310878]=r18;HEAP32[r19]=HEAP32[r19]&-2;HEAP32[r15+(r2+1)]=r18|1;HEAP32[r11>>2]=r18;return}r19=r13>>>3;if(r13>>>0<256){r13=HEAP32[r15+(r2+2)];r23=HEAP32[r15+(r2+3)];r24=(r19<<3)+5243544|0;do{if((r13|0)!=(r24|0)){if(r13>>>0<r6>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r17|0)){break}_abort()}}while(0);if((r23|0)==(r13|0)){HEAP32[1310876]=HEAP32[1310876]&(1<<r19^-1);r20=r17,r21=r20>>2;r22=r18;break}do{if((r23|0)==(r24|0)){r25=r23+8|0}else{if(r23>>>0<r6>>>0){_abort()}r26=r23+8|0;if((HEAP32[r26>>2]|0)==(r17|0)){r25=r26;break}_abort()}}while(0);HEAP32[r13+12>>2]=r23;HEAP32[r25>>2]=r13;r20=r17,r21=r20>>2;r22=r18;break}r24=r16;r19=HEAP32[r15+(r2+6)];r26=HEAP32[r15+(r2+3)];L44:do{if((r26|0)==(r24|0)){r27=r14+(r1+20)|0;r28=HEAP32[r27>>2];do{if((r28|0)==0){r29=r14+(r1+16)|0;r30=HEAP32[r29>>2];if((r30|0)==0){r31=0,r32=r31>>2;break L44}else{r33=r30;r34=r29;break}}else{r33=r28;r34=r27}}while(0);while(1){r27=r33+20|0;r28=HEAP32[r27>>2];if((r28|0)!=0){r33=r28;r34=r27;continue}r27=r33+16|0;r28=HEAP32[r27>>2];if((r28|0)==0){break}else{r33=r28;r34=r27}}if(r34>>>0<r6>>>0){_abort()}else{HEAP32[r34>>2]=0;r31=r33,r32=r31>>2;break}}else{r27=HEAP32[r15+(r2+2)];if(r27>>>0<r6>>>0){_abort()}r28=r27+12|0;if((HEAP32[r28>>2]|0)!=(r24|0)){_abort()}r29=r26+8|0;if((HEAP32[r29>>2]|0)==(r24|0)){HEAP32[r28>>2]=r26;HEAP32[r29>>2]=r27;r31=r26,r32=r31>>2;break}else{_abort()}}}while(0);if((r19|0)==0){r20=r17,r21=r20>>2;r22=r18;break}r26=r14+(r1+28)|0;r16=(HEAP32[r26>>2]<<2)+5243808|0;do{if((r24|0)==(HEAP32[r16>>2]|0)){HEAP32[r16>>2]=r31;if((r31|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r26>>2]^-1);r20=r17,r21=r20>>2;r22=r18;break L10}else{if(r19>>>0<HEAP32[1310880]>>>0){_abort()}r13=r19+16|0;if((HEAP32[r13>>2]|0)==(r24|0)){HEAP32[r13>>2]=r31}else{HEAP32[r19+20>>2]=r31}if((r31|0)==0){r20=r17,r21=r20>>2;r22=r18;break L10}}}while(0);if(r31>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r32+6]=r19;r24=HEAP32[r15+(r2+4)];do{if((r24|0)!=0){if(r24>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r32+4]=r24;HEAP32[r24+24>>2]=r31;break}}}while(0);r24=HEAP32[r15+(r2+5)];if((r24|0)==0){r20=r17,r21=r20>>2;r22=r18;break}if(r24>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r32+5]=r24;HEAP32[r24+24>>2]=r31;r20=r17,r21=r20>>2;r22=r18;break}}else{r20=r5,r21=r20>>2;r22=r9}}while(0);r5=r20,r31=r5>>2;if(r5>>>0>=r11>>>0){_abort()}r5=r1+(r9-4)|0;r32=HEAP32[r5>>2];if((r32&1|0)==0){_abort()}do{if((r32&2|0)==0){if((r12|0)==(HEAP32[1310882]|0)){r6=HEAP32[1310879]+r22|0;HEAP32[1310879]=r6;HEAP32[1310882]=r20;HEAP32[r21+1]=r6|1;if((r20|0)==(HEAP32[1310881]|0)){HEAP32[1310881]=0;HEAP32[1310878]=0}if(r6>>>0<=HEAP32[1310883]>>>0){return}_sys_trim(0);return}if((r12|0)==(HEAP32[1310881]|0)){r6=HEAP32[1310878]+r22|0;HEAP32[1310878]=r6;HEAP32[1310881]=r20;HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;return}r6=(r32&-8)+r22|0;r33=r32>>>3;L115:do{if(r32>>>0<256){r34=HEAP32[r2+r10];r25=HEAP32[((r9|4)>>2)+r2];r8=(r33<<3)+5243544|0;do{if((r34|0)!=(r8|0)){if(r34>>>0<HEAP32[1310880]>>>0){_abort()}if((HEAP32[r34+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r25|0)==(r34|0)){HEAP32[1310876]=HEAP32[1310876]&(1<<r33^-1);break}do{if((r25|0)==(r8|0)){r35=r25+8|0}else{if(r25>>>0<HEAP32[1310880]>>>0){_abort()}r4=r25+8|0;if((HEAP32[r4>>2]|0)==(r12|0)){r35=r4;break}_abort()}}while(0);HEAP32[r34+12>>2]=r25;HEAP32[r35>>2]=r34}else{r8=r11;r4=HEAP32[r10+(r2+4)];r7=HEAP32[((r9|4)>>2)+r2];L136:do{if((r7|0)==(r8|0)){r24=r9+(r1+12)|0;r19=HEAP32[r24>>2];do{if((r19|0)==0){r26=r9+(r1+8)|0;r16=HEAP32[r26>>2];if((r16|0)==0){r36=0,r37=r36>>2;break L136}else{r38=r16;r39=r26;break}}else{r38=r19;r39=r24}}while(0);while(1){r24=r38+20|0;r19=HEAP32[r24>>2];if((r19|0)!=0){r38=r19;r39=r24;continue}r24=r38+16|0;r19=HEAP32[r24>>2];if((r19|0)==0){break}else{r38=r19;r39=r24}}if(r39>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r39>>2]=0;r36=r38,r37=r36>>2;break}}else{r24=HEAP32[r2+r10];if(r24>>>0<HEAP32[1310880]>>>0){_abort()}r19=r24+12|0;if((HEAP32[r19>>2]|0)!=(r8|0)){_abort()}r26=r7+8|0;if((HEAP32[r26>>2]|0)==(r8|0)){HEAP32[r19>>2]=r7;HEAP32[r26>>2]=r24;r36=r7,r37=r36>>2;break}else{_abort()}}}while(0);if((r4|0)==0){break}r7=r9+(r1+20)|0;r34=(HEAP32[r7>>2]<<2)+5243808|0;do{if((r8|0)==(HEAP32[r34>>2]|0)){HEAP32[r34>>2]=r36;if((r36|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r7>>2]^-1);break L115}else{if(r4>>>0<HEAP32[1310880]>>>0){_abort()}r25=r4+16|0;if((HEAP32[r25>>2]|0)==(r8|0)){HEAP32[r25>>2]=r36}else{HEAP32[r4+20>>2]=r36}if((r36|0)==0){break L115}}}while(0);if(r36>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r37+6]=r4;r8=HEAP32[r10+(r2+2)];do{if((r8|0)!=0){if(r8>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r37+4]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);r8=HEAP32[r10+(r2+3)];if((r8|0)==0){break}if(r8>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r37+5]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;if((r20|0)!=(HEAP32[1310881]|0)){r40=r6;break}HEAP32[1310878]=r6;return}else{HEAP32[r5>>2]=r32&-2;HEAP32[r21+1]=r22|1;HEAP32[(r22>>2)+r31]=r22;r40=r22}}while(0);r22=r40>>>3;if(r40>>>0<256){r31=r22<<1;r32=(r31<<2)+5243544|0;r5=HEAP32[1310876];r36=1<<r22;do{if((r5&r36|0)==0){HEAP32[1310876]=r5|r36;r41=r32;r42=(r31+2<<2)+5243544|0}else{r22=(r31+2<<2)+5243544|0;r37=HEAP32[r22>>2];if(r37>>>0>=HEAP32[1310880]>>>0){r41=r37;r42=r22;break}_abort()}}while(0);HEAP32[r42>>2]=r20;HEAP32[r41+12>>2]=r20;HEAP32[r21+2]=r41;HEAP32[r21+3]=r32;return}r32=r20;r41=r40>>>8;do{if((r41|0)==0){r43=0}else{if(r40>>>0>16777215){r43=31;break}r42=(r41+1048320|0)>>>16&8;r31=r41<<r42;r36=(r31+520192|0)>>>16&4;r5=r31<<r36;r31=(r5+245760|0)>>>16&2;r22=14-(r36|r42|r31)+(r5<<r31>>>15)|0;r43=r40>>>((r22+7|0)>>>0)&1|r22<<1}}while(0);r41=(r43<<2)+5243808|0;HEAP32[r21+7]=r43;HEAP32[r21+5]=0;HEAP32[r21+4]=0;r22=HEAP32[1310877];r31=1<<r43;do{if((r22&r31|0)==0){HEAP32[1310877]=r22|r31;HEAP32[r41>>2]=r32;HEAP32[r21+6]=r41;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20}else{if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r5=r40<<r44;r42=HEAP32[r41>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r40|0)){break}r45=(r5>>>31<<2)+r42+16|0;r36=HEAP32[r45>>2];if((r36|0)==0){r3=131;break}else{r5=r5<<1;r42=r36}}if(r3==131){if(r45>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r45>>2]=r32;HEAP32[r21+6]=r42;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20;break}}r5=r42+8|0;r6=HEAP32[r5>>2];r36=HEAP32[1310880];if(r42>>>0<r36>>>0){_abort()}if(r6>>>0<r36>>>0){_abort()}else{HEAP32[r6+12>>2]=r32;HEAP32[r5>>2]=r32;HEAP32[r21+2]=r6;HEAP32[r21+3]=r42;HEAP32[r21+6]=0;break}}}while(0);r21=HEAP32[1310884]-1|0;HEAP32[1310884]=r21;if((r21|0)==0){r46=5243960}else{return}while(1){r21=HEAP32[r46>>2];if((r21|0)==0){break}else{r46=r21+8|0}}HEAP32[1310884]=-1;return}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){HEAP32[___errno_location()>>2]=12;r3=0;return r3}if(r2>>>0<11){r4=16}else{r4=r2+11&-8}r5=_try_realloc_chunk(r1-8|0,r4);if((r5|0)!=0){r3=r5+8|0;return r3}r5=_malloc(r2);if((r5|0)==0){r3=0;return r3}r4=HEAP32[r1-4>>2];r6=(r4&-8)-((r4&3|0)==0?8:4)|0;_memcpy(r5,r1,r6>>>0<r2>>>0?r6:r2);_free(r1);r3=r5;return r3}function _sys_trim(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;do{if((HEAP32[1310720]|0)==0){r2=_sysconf(8);if((r2-1&r2|0)==0){HEAP32[1310722]=r2;HEAP32[1310721]=r2;HEAP32[1310723]=-1;HEAP32[1310724]=2097152;HEAP32[1310725]=0;HEAP32[1310987]=0;HEAP32[1310720]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);if(r1>>>0>=4294967232){r3=0;r4=r3&1;return r4}r2=HEAP32[1310882];if((r2|0)==0){r3=0;r4=r3&1;return r4}r5=HEAP32[1310879];do{if(r5>>>0>(r1+40|0)>>>0){r6=HEAP32[1310722];r7=Math.imul(Math.floor(((-40-r1-1+r5+r6|0)>>>0)/(r6>>>0))-1|0,r6);r8=r2;r9=5243952,r10=r9>>2;while(1){r11=HEAP32[r10];if(r11>>>0<=r8>>>0){if((r11+HEAP32[r10+1]|0)>>>0>r8>>>0){r12=r9;break}}r11=HEAP32[r10+2];if((r11|0)==0){r12=0;break}else{r9=r11,r10=r9>>2}}if((HEAP32[r12+12>>2]&8|0)!=0){break}r9=_sbrk(0);r10=(r12+4|0)>>2;if((r9|0)!=(HEAP32[r12>>2]+HEAP32[r10]|0)){break}r8=_sbrk(-(r7>>>0>2147483646?-2147483648-r6|0:r7)|0);r11=_sbrk(0);if(!((r8|0)!=-1&r11>>>0<r9>>>0)){break}r8=r9-r11|0;if((r9|0)==(r11|0)){break}HEAP32[r10]=HEAP32[r10]-r8|0;HEAP32[1310984]=HEAP32[1310984]-r8|0;r10=HEAP32[1310882];r13=HEAP32[1310879]-r8|0;r8=r10;r14=r10+8|0;if((r14&7|0)==0){r15=0}else{r15=-r14&7}r14=r13-r15|0;HEAP32[1310882]=r8+r15|0;HEAP32[1310879]=r14;HEAP32[r15+(r8+4)>>2]=r14|1;HEAP32[r13+(r8+4)>>2]=40;HEAP32[1310883]=HEAP32[1310724];r3=(r9|0)!=(r11|0);r4=r3&1;return r4}}while(0);if(HEAP32[1310879]>>>0<=HEAP32[1310883]>>>0){r3=0;r4=r3&1;return r4}HEAP32[1310883]=-1;r3=0;r4=r3&1;return r4}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=r4&-8,r6=r5>>2;r7=r1,r8=r7>>2;r9=r7+r5|0;r10=r9;r11=HEAP32[1310880];if(r7>>>0<r11>>>0){_abort()}r12=r4&3;if(!((r12|0)!=1&r7>>>0<r9>>>0)){_abort()}r13=(r7+(r5|4)|0)>>2;r14=HEAP32[r13];if((r14&1|0)==0){_abort()}if((r12|0)==0){if(r2>>>0<256){r15=0;return r15}do{if(r5>>>0>=(r2+4|0)>>>0){if((r5-r2|0)>>>0>HEAP32[1310722]<<1>>>0){break}else{r15=r1}return r15}}while(0);r15=0;return r15}if(r5>>>0>=r2>>>0){r12=r5-r2|0;if(r12>>>0<=15){r15=r1;return r15}HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|3;HEAP32[r13]=HEAP32[r13]|1;_dispose_chunk(r7+r2|0,r12);r15=r1;return r15}if((r10|0)==(HEAP32[1310882]|0)){r12=HEAP32[1310879]+r5|0;if(r12>>>0<=r2>>>0){r15=0;return r15}r13=r12-r2|0;HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r13|1;HEAP32[1310882]=r7+r2|0;HEAP32[1310879]=r13;r15=r1;return r15}if((r10|0)==(HEAP32[1310881]|0)){r13=HEAP32[1310878]+r5|0;if(r13>>>0<r2>>>0){r15=0;return r15}r12=r13-r2|0;if(r12>>>0>15){HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|1;HEAP32[(r13>>2)+r8]=r12;r16=r13+(r7+4)|0;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;r17=r7+r2|0;r18=r12}else{HEAP32[r3]=r4&1|r13|2;r4=r13+(r7+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r17=0;r18=0}HEAP32[1310878]=r18;HEAP32[1310881]=r17;r15=r1;return r15}if((r14&2|0)!=0){r15=0;return r15}r17=(r14&-8)+r5|0;if(r17>>>0<r2>>>0){r15=0;return r15}r18=r17-r2|0;r4=r14>>>3;L336:do{if(r14>>>0<256){r13=HEAP32[r6+(r8+2)];r12=HEAP32[r6+(r8+3)];r16=(r4<<3)+5243544|0;do{if((r13|0)!=(r16|0)){if(r13>>>0<r11>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r12|0)==(r13|0)){HEAP32[1310876]=HEAP32[1310876]&(1<<r4^-1);break}do{if((r12|0)==(r16|0)){r19=r12+8|0}else{if(r12>>>0<r11>>>0){_abort()}r20=r12+8|0;if((HEAP32[r20>>2]|0)==(r10|0)){r19=r20;break}_abort()}}while(0);HEAP32[r13+12>>2]=r12;HEAP32[r19>>2]=r13}else{r16=r9;r20=HEAP32[r6+(r8+6)];r21=HEAP32[r6+(r8+3)];L338:do{if((r21|0)==(r16|0)){r22=r5+(r7+20)|0;r23=HEAP32[r22>>2];do{if((r23|0)==0){r24=r5+(r7+16)|0;r25=HEAP32[r24>>2];if((r25|0)==0){r26=0,r27=r26>>2;break L338}else{r28=r25;r29=r24;break}}else{r28=r23;r29=r22}}while(0);while(1){r22=r28+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r28=r23;r29=r22;continue}r22=r28+16|0;r23=HEAP32[r22>>2];if((r23|0)==0){break}else{r28=r23;r29=r22}}if(r29>>>0<r11>>>0){_abort()}else{HEAP32[r29>>2]=0;r26=r28,r27=r26>>2;break}}else{r22=HEAP32[r6+(r8+2)];if(r22>>>0<r11>>>0){_abort()}r23=r22+12|0;if((HEAP32[r23>>2]|0)!=(r16|0)){_abort()}r24=r21+8|0;if((HEAP32[r24>>2]|0)==(r16|0)){HEAP32[r23>>2]=r21;HEAP32[r24>>2]=r22;r26=r21,r27=r26>>2;break}else{_abort()}}}while(0);if((r20|0)==0){break}r21=r5+(r7+28)|0;r13=(HEAP32[r21>>2]<<2)+5243808|0;do{if((r16|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r26;if((r26|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r21>>2]^-1);break L336}else{if(r20>>>0<HEAP32[1310880]>>>0){_abort()}r12=r20+16|0;if((HEAP32[r12>>2]|0)==(r16|0)){HEAP32[r12>>2]=r26}else{HEAP32[r20+20>>2]=r26}if((r26|0)==0){break L336}}}while(0);if(r26>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r27+6]=r20;r16=HEAP32[r6+(r8+4)];do{if((r16|0)!=0){if(r16>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r27+4]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);r16=HEAP32[r6+(r8+5)];if((r16|0)==0){break}if(r16>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r27+5]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);if(r18>>>0<16){HEAP32[r3]=r17|HEAP32[r3]&1|2;r26=r7+(r17|4)|0;HEAP32[r26>>2]=HEAP32[r26>>2]|1;r15=r1;return r15}else{HEAP32[r3]=HEAP32[r3]&1|r2|2;HEAP32[(r2+4>>2)+r8]=r18|3;r8=r7+(r17|4)|0;HEAP32[r8>>2]=HEAP32[r8>>2]|1;_dispose_chunk(r7+r2|0,r18);r15=r1;return r15}}function __ZNSt9bad_allocD1Ev(r1){return}function __ZdlPv(r1){if((r1|0)==0){return}_free(r1);return}function __ZNSt9bad_allocD0Ev(r1){__ZdlPv(r1);return}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r3=r2>>2;r4=0;r5=r1,r6=r5>>2;r7=r5+r2|0;r8=r7;r9=HEAP32[r1+4>>2];L419:do{if((r9&1|0)==0){r10=HEAP32[r1>>2];if((r9&3|0)==0){return}r11=r5+ -r10|0;r12=r11;r13=r10+r2|0;r14=HEAP32[1310880];if(r11>>>0<r14>>>0){_abort()}if((r12|0)==(HEAP32[1310881]|0)){r15=(r2+(r5+4)|0)>>2;if((HEAP32[r15]&3|0)!=3){r16=r12,r17=r16>>2;r18=r13;break}HEAP32[1310878]=r13;HEAP32[r15]=HEAP32[r15]&-2;HEAP32[(4-r10>>2)+r6]=r13|1;HEAP32[r7>>2]=r13;return}r15=r10>>>3;if(r10>>>0<256){r19=HEAP32[(8-r10>>2)+r6];r20=HEAP32[(12-r10>>2)+r6];r21=(r15<<3)+5243544|0;do{if((r19|0)!=(r21|0)){if(r19>>>0<r14>>>0){_abort()}if((HEAP32[r19+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r20|0)==(r19|0)){HEAP32[1310876]=HEAP32[1310876]&(1<<r15^-1);r16=r12,r17=r16>>2;r18=r13;break}do{if((r20|0)==(r21|0)){r22=r20+8|0}else{if(r20>>>0<r14>>>0){_abort()}r23=r20+8|0;if((HEAP32[r23>>2]|0)==(r12|0)){r22=r23;break}_abort()}}while(0);HEAP32[r19+12>>2]=r20;HEAP32[r22>>2]=r19;r16=r12,r17=r16>>2;r18=r13;break}r21=r11;r15=HEAP32[(24-r10>>2)+r6];r23=HEAP32[(12-r10>>2)+r6];L453:do{if((r23|0)==(r21|0)){r24=16-r10|0;r25=r24+(r5+4)|0;r26=HEAP32[r25>>2];do{if((r26|0)==0){r27=r5+r24|0;r28=HEAP32[r27>>2];if((r28|0)==0){r29=0,r30=r29>>2;break L453}else{r31=r28;r32=r27;break}}else{r31=r26;r32=r25}}while(0);while(1){r25=r31+20|0;r26=HEAP32[r25>>2];if((r26|0)!=0){r31=r26;r32=r25;continue}r25=r31+16|0;r26=HEAP32[r25>>2];if((r26|0)==0){break}else{r31=r26;r32=r25}}if(r32>>>0<r14>>>0){_abort()}else{HEAP32[r32>>2]=0;r29=r31,r30=r29>>2;break}}else{r25=HEAP32[(8-r10>>2)+r6];if(r25>>>0<r14>>>0){_abort()}r26=r25+12|0;if((HEAP32[r26>>2]|0)!=(r21|0)){_abort()}r24=r23+8|0;if((HEAP32[r24>>2]|0)==(r21|0)){HEAP32[r26>>2]=r23;HEAP32[r24>>2]=r25;r29=r23,r30=r29>>2;break}else{_abort()}}}while(0);if((r15|0)==0){r16=r12,r17=r16>>2;r18=r13;break}r23=r5+(28-r10)|0;r14=(HEAP32[r23>>2]<<2)+5243808|0;do{if((r21|0)==(HEAP32[r14>>2]|0)){HEAP32[r14>>2]=r29;if((r29|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r23>>2]^-1);r16=r12,r17=r16>>2;r18=r13;break L419}else{if(r15>>>0<HEAP32[1310880]>>>0){_abort()}r11=r15+16|0;if((HEAP32[r11>>2]|0)==(r21|0)){HEAP32[r11>>2]=r29}else{HEAP32[r15+20>>2]=r29}if((r29|0)==0){r16=r12,r17=r16>>2;r18=r13;break L419}}}while(0);if(r29>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r30+6]=r15;r21=16-r10|0;r23=HEAP32[(r21>>2)+r6];do{if((r23|0)!=0){if(r23>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r30+4]=r23;HEAP32[r23+24>>2]=r29;break}}}while(0);r23=HEAP32[(r21+4>>2)+r6];if((r23|0)==0){r16=r12,r17=r16>>2;r18=r13;break}if(r23>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r30+5]=r23;HEAP32[r23+24>>2]=r29;r16=r12,r17=r16>>2;r18=r13;break}}else{r16=r1,r17=r16>>2;r18=r2}}while(0);r1=HEAP32[1310880];if(r7>>>0<r1>>>0){_abort()}r29=r2+(r5+4)|0;r30=HEAP32[r29>>2];do{if((r30&2|0)==0){if((r8|0)==(HEAP32[1310882]|0)){r31=HEAP32[1310879]+r18|0;HEAP32[1310879]=r31;HEAP32[1310882]=r16;HEAP32[r17+1]=r31|1;if((r16|0)!=(HEAP32[1310881]|0)){return}HEAP32[1310881]=0;HEAP32[1310878]=0;return}if((r8|0)==(HEAP32[1310881]|0)){r31=HEAP32[1310878]+r18|0;HEAP32[1310878]=r31;HEAP32[1310881]=r16;HEAP32[r17+1]=r31|1;HEAP32[(r31>>2)+r17]=r31;return}r31=(r30&-8)+r18|0;r32=r30>>>3;L518:do{if(r30>>>0<256){r22=HEAP32[r3+(r6+2)];r9=HEAP32[r3+(r6+3)];r23=(r32<<3)+5243544|0;do{if((r22|0)!=(r23|0)){if(r22>>>0<r1>>>0){_abort()}if((HEAP32[r22+12>>2]|0)==(r8|0)){break}_abort()}}while(0);if((r9|0)==(r22|0)){HEAP32[1310876]=HEAP32[1310876]&(1<<r32^-1);break}do{if((r9|0)==(r23|0)){r33=r9+8|0}else{if(r9>>>0<r1>>>0){_abort()}r10=r9+8|0;if((HEAP32[r10>>2]|0)==(r8|0)){r33=r10;break}_abort()}}while(0);HEAP32[r22+12>>2]=r9;HEAP32[r33>>2]=r22}else{r23=r7;r10=HEAP32[r3+(r6+6)];r15=HEAP32[r3+(r6+3)];L539:do{if((r15|0)==(r23|0)){r14=r2+(r5+20)|0;r11=HEAP32[r14>>2];do{if((r11|0)==0){r19=r2+(r5+16)|0;r20=HEAP32[r19>>2];if((r20|0)==0){r34=0,r35=r34>>2;break L539}else{r36=r20;r37=r19;break}}else{r36=r11;r37=r14}}while(0);while(1){r14=r36+20|0;r11=HEAP32[r14>>2];if((r11|0)!=0){r36=r11;r37=r14;continue}r14=r36+16|0;r11=HEAP32[r14>>2];if((r11|0)==0){break}else{r36=r11;r37=r14}}if(r37>>>0<r1>>>0){_abort()}else{HEAP32[r37>>2]=0;r34=r36,r35=r34>>2;break}}else{r14=HEAP32[r3+(r6+2)];if(r14>>>0<r1>>>0){_abort()}r11=r14+12|0;if((HEAP32[r11>>2]|0)!=(r23|0)){_abort()}r19=r15+8|0;if((HEAP32[r19>>2]|0)==(r23|0)){HEAP32[r11>>2]=r15;HEAP32[r19>>2]=r14;r34=r15,r35=r34>>2;break}else{_abort()}}}while(0);if((r10|0)==0){break}r15=r2+(r5+28)|0;r22=(HEAP32[r15>>2]<<2)+5243808|0;do{if((r23|0)==(HEAP32[r22>>2]|0)){HEAP32[r22>>2]=r34;if((r34|0)!=0){break}HEAP32[1310877]=HEAP32[1310877]&(1<<HEAP32[r15>>2]^-1);break L518}else{if(r10>>>0<HEAP32[1310880]>>>0){_abort()}r9=r10+16|0;if((HEAP32[r9>>2]|0)==(r23|0)){HEAP32[r9>>2]=r34}else{HEAP32[r10+20>>2]=r34}if((r34|0)==0){break L518}}}while(0);if(r34>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r35+6]=r10;r23=HEAP32[r3+(r6+4)];do{if((r23|0)!=0){if(r23>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r35+4]=r23;HEAP32[r23+24>>2]=r34;break}}}while(0);r23=HEAP32[r3+(r6+5)];if((r23|0)==0){break}if(r23>>>0<HEAP32[1310880]>>>0){_abort()}else{HEAP32[r35+5]=r23;HEAP32[r23+24>>2]=r34;break}}}while(0);HEAP32[r17+1]=r31|1;HEAP32[(r31>>2)+r17]=r31;if((r16|0)!=(HEAP32[1310881]|0)){r38=r31;break}HEAP32[1310878]=r31;return}else{HEAP32[r29>>2]=r30&-2;HEAP32[r17+1]=r18|1;HEAP32[(r18>>2)+r17]=r18;r38=r18}}while(0);r18=r38>>>3;if(r38>>>0<256){r30=r18<<1;r29=(r30<<2)+5243544|0;r34=HEAP32[1310876];r35=1<<r18;do{if((r34&r35|0)==0){HEAP32[1310876]=r34|r35;r39=r29;r40=(r30+2<<2)+5243544|0}else{r18=(r30+2<<2)+5243544|0;r6=HEAP32[r18>>2];if(r6>>>0>=HEAP32[1310880]>>>0){r39=r6;r40=r18;break}_abort()}}while(0);HEAP32[r40>>2]=r16;HEAP32[r39+12>>2]=r16;HEAP32[r17+2]=r39;HEAP32[r17+3]=r29;return}r29=r16;r39=r38>>>8;do{if((r39|0)==0){r41=0}else{if(r38>>>0>16777215){r41=31;break}r40=(r39+1048320|0)>>>16&8;r30=r39<<r40;r35=(r30+520192|0)>>>16&4;r34=r30<<r35;r30=(r34+245760|0)>>>16&2;r18=14-(r35|r40|r30)+(r34<<r30>>>15)|0;r41=r38>>>((r18+7|0)>>>0)&1|r18<<1}}while(0);r39=(r41<<2)+5243808|0;HEAP32[r17+7]=r41;HEAP32[r17+5]=0;HEAP32[r17+4]=0;r18=HEAP32[1310877];r30=1<<r41;if((r18&r30|0)==0){HEAP32[1310877]=r18|r30;HEAP32[r39>>2]=r29;HEAP32[r17+6]=r39;HEAP32[r17+3]=r16;HEAP32[r17+2]=r16;return}if((r41|0)==31){r42=0}else{r42=25-(r41>>>1)|0}r41=r38<<r42;r42=HEAP32[r39>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r38|0)){break}r43=(r41>>>31<<2)+r42+16|0;r39=HEAP32[r43>>2];if((r39|0)==0){r4=444;break}else{r41=r41<<1;r42=r39}}if(r4==444){if(r43>>>0<HEAP32[1310880]>>>0){_abort()}HEAP32[r43>>2]=r29;HEAP32[r17+6]=r42;HEAP32[r17+3]=r16;HEAP32[r17+2]=r16;return}r16=r42+8|0;r43=HEAP32[r16>>2];r4=HEAP32[1310880];if(r42>>>0<r4>>>0){_abort()}if(r43>>>0<r4>>>0){_abort()}HEAP32[r43+12>>2]=r29;HEAP32[r16>>2]=r29;HEAP32[r17+2]=r43;HEAP32[r17+3]=r42;HEAP32[r17+6]=0;return}function __Znwj(r1){var r2,r3,r4;r2=0;r3=(r1|0)==0?1:r1;while(1){r4=_malloc(r3);if((r4|0)!=0){r2=488;break}r1=(tempValue=HEAP32[1311191],HEAP32[1311191]=tempValue,tempValue);if((r1|0)==0){break}FUNCTION_TABLE[r1]()}if(r2==488){return r4}r4=___cxa_allocate_exception(4);HEAP32[r4>>2]=5244328;___cxa_throw(r4,5244636,38)}function __ZNKSt9bad_alloc4whatEv(r1){return 5243040}
// EMSCRIPTEN_END_FUNCS
Module["_rl_set_output_buffer"] = _rl_set_output_buffer;
Module["_rl_set_asm_js_mode"] = _rl_set_asm_js_mode;
Module["_rl_make_output_buffer"] = _rl_make_output_buffer;
Module["_rl_new_block"] = _rl_new_block;
Module["_rl_delete_block"] = _rl_delete_block;
Module["_rl_block_add_branch_to"] = _rl_block_add_branch_to;
Module["_rl_new_relooper"] = _rl_new_relooper;
Module["_rl_delete_relooper"] = _rl_delete_relooper;
Module["_rl_relooper_add_block"] = _rl_relooper_add_block;
Module["_rl_relooper_calculate"] = _rl_relooper_calculate;
Module["_rl_relooper_render"] = _rl_relooper_render;
Module["_realloc"] = _realloc;
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
  var RBUFFER_SIZE = 20*1024*1024;
  var rbuffer = _malloc(RBUFFER_SIZE);
  _rl_set_output_buffer(rbuffer, RBUFFER_SIZE);
  var TBUFFER_SIZE = 10*1024*1024;
  var tbuffer = _malloc(TBUFFER_SIZE);
  var RelooperGlue = {};
  RelooperGlue['init'] = function() {
    this.r = _rl_new_relooper();
  },
  RelooperGlue['addBlock'] = function(text) {
    assert(this.r);
    assert(text.length+1 < TBUFFER_SIZE);
    writeStringToMemory(text, tbuffer);
    var b = _rl_new_block(tbuffer);
    _rl_relooper_add_block(this.r, b);
    return b;
  };
  RelooperGlue['addBranch'] = function(from, to, condition, code) {
    assert(this.r);
    if (condition) {
      assert(condition.length+1 < TBUFFER_SIZE/2);
      writeStringToMemory(condition, tbuffer);
      condition = tbuffer;
    } else {
      condition = 0; // allow undefined, null, etc. as inputs
    }
    if (code) {
      assert(code.length+1 < TBUFFER_SIZE/2);
      writeStringToMemory(code, tbuffer + TBUFFER_SIZE/2);
      code = tbuffer + TBUFFER_SIZE/2;
    } else {
      code = 0; // allow undefined, null, etc. as inputs
    }
    _rl_block_add_branch_to(from, to, condition, code);
  };
  RelooperGlue['render'] = function(entry) {
    assert(this.r);
    assert(entry);
    _rl_relooper_calculate(this.r, entry);
    _rl_relooper_render(this.r);
    var ret = Pointer_stringify(rbuffer);
    _rl_delete_relooper(this.r);
    this.r = 0;
    return ret;
  };
  RelooperGlue['setDebug'] = function(debug) {
    _rl_set_debugging(+!!debug);
  };
  RelooperGlue['setAsmJSMode'] = function(on) {
    _rl_set_asm_js_mode(on);
  };
  Module['Relooper'] = RelooperGlue;

  return Module.Relooper;
})();
