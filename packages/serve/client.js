(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],4:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":5}],5:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],6:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],7:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

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
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":8}],8:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],9:[function(require,module,exports){
(function (process){
"use strict";require("core-js/modules/es7.symbol.async-iterator"),require("core-js/modules/es6.symbol"),require("core-js/modules/web.dom.iterable"),require("core-js/modules/es6.regexp.split"),require("core-js/modules/es6.regexp.replace"),require("core-js/modules/es6.regexp.match");function _slicedToArray(a,b){return _arrayWithHoles(a)||_iterableToArrayLimit(a,b)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}return c}function _arrayWithHoles(a){if(Array.isArray(a))return a}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}var BacktickProcessor=function(){function a(b){_classCallCheck(this,a);var c=this;c.sp=b,c.state={inBacktick:!1,inBacktickExpr:!1,btString:"",exprBody:"",exprBraceDepth:0}}return _createClass(a,[{key:"lex",value:function r(a){var b=this,c=b.state;if("`"===a.yytext&&(c.inBacktick=!c.inBacktick),c.inBacktick){var s;c.btString="";for(var d=/^(?:([\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*)\$\{((?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*))/g,e=/^((?:[\0-z\|~-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)(\{|\})((?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)/g,f=/^((?:\\`|(?:[\0-_a-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])(?!\{))*)((?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)/g;;){if(1>a._input.length&&(console.log("input exhausted."),process.exit()),c.inBacktickExpr){if(s=a._input.match(e),s){var g=e.exec(a._input),h=_slicedToArray(g,4),i=h[0],j=h[1],k=h[2],l=h[3];if(c.exprBody+=j,"{"===k)c.exprBraceDepth+=1,c.exprBody+="{";else if("}"===k)if(0<c.exprBraceDepth)c.exprBraceDepth-=1,c.exprBody+="}";else{c.inBacktickExpr=!1;var t=b.sp.traverse(b.sp.parse(c.exprBody+";")).translation.replace(/;$/,"");c.exprBody="",c.btString+=t+"}",c.inBacktick=!0}a._input=l,a.match=j+k,a.yytext+=a.match,a.matched+=a.match;continue}console.log("brace misalignment."),process.exit()}if(s=a._input.match(d),s){var m=d.exec(a._input),n=_slicedToArray(m,3),o=n[0],p=n[1],q=n[2];c.inBacktick=!1,c.inBacktickExpr=!0,c.exprBraceDepth=0,a._input=q,a.match=p+"${",a.yytext+=a.match,a.matched+=a.match,c.btString+=a.match;continue}if(s=a._input.match(f),s){if("`"===a._input[0]){a._input=a._input.substr(1),a.yytext+="`",a.match="`",a.matched+="`",c.inBacktick=!1;break}a._input=a._input.replace(f,function(b,c,d){var e=c.split("\n"),f=e.pop().length,g=e.length,h=a.yylloc.last_column;return 0<g?h=f:h+=f,a.yylloc={first_line:a.yylloc.last_line,first_column:a.yylloc.last_column,last_line:a.yylloc.last_line+g,last_column:h},a.match=c,a.matched+=a.match,d}),c.btString+=a.match,a.yytext+=a.match;continue}console.log("Backtick Processor in bad state."),process.exit()}return a.yy.scopeState.btString="`"+c.btString+"`",c.btString="","`"}return!1}}]),a}();module.exports=BacktickProcessor;

}).call(this,require('_process'))

},{"_process":8,"core-js/modules/es6.regexp.match":128,"core-js/modules/es6.regexp.replace":129,"core-js/modules/es6.regexp.split":130,"core-js/modules/es6.symbol":132,"core-js/modules/es7.symbol.async-iterator":136,"core-js/modules/web.dom.iterable":137}],10:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}function indentString(a){var b,c="";for(b=0;b<a;b+=1)c+=b+" ";return c}var ScopeAst=function(){function a(b,c,d){_classCallCheck(this,a),this.type=c,this.body=d,this.loc={start:{line:b.lexer.yylloc.first_line,column:b.lexer.yylloc.first_column},end:{line:b.lexer.yylloc.last_line,column:b.lexer.yylloc.last_column}},this.raw=b.lexer.matched,this.line=b.lexer.yylloc.first_line}return _createClass(a,[{key:"get",value:function d(a){var b=indentString(a)+"("+this.type,c=this.body;if(1==c.length&&!(c[0]instanceof ast))b+=" '"+c[0]+"'";else for(i in c)c[i]instanceof ast?b+="\n"+c[i].get(a+1):(b+="\n"+indentString(a+1),b+="'"+c[i]+"'");return b+")"}}]),a}(),_default=ScopeAst;exports.default=_default;

},{}],11:[function(require,module,exports){
(function (__dirname){
"use strict";require("core-js/modules/es6.array.from"),require("core-js/modules/es7.symbol.async-iterator"),require("core-js/modules/es6.symbol"),require("core-js/modules/es6.regexp.to-string"),require("core-js/modules/es6.regexp.replace"),require("core-js/modules/web.dom.iterable");var fs=_interopRequireWildcard(require("fs")),path=_interopRequireWildcard(require("path")),Module=_interopRequireWildcard(require("module")),parser=_interopRequireWildcard(require("./parser.js")),_ScopeAst=_interopRequireDefault(require("./ScopeAst.js")),_ScopeRules=_interopRequireDefault(require("./ScopeRules.js")),_BacktickProcessor=_interopRequireDefault(require("./BacktickProcessor.js")),sourceMap=_interopRequireWildcard(require("source-map")),combine=_interopRequireWildcard(require("combine-source-map")),convert=_interopRequireWildcard(require("convert-source-map"));function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}function _interopRequireWildcard(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)if(Object.prototype.hasOwnProperty.call(a,c)){var d=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(a,c):{};d.get||d.set?Object.defineProperty(b,c,d):b[c]=a[c]}return b.default=a,b}function _toConsumableArray(a){return _arrayWithoutHoles(a)||_iterableToArray(a)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _arrayWithoutHoles(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}require("source-map-support").install();var ScopeParser=function(){function a(){_classCallCheck(this,a);var b=this;b.parser=new parser.Parser,b.rules=new _ScopeRules.default,b.parser.yy.scopeAst=_ScopeAst.default}return _createClass(a,[{key:"libraryUtils",value:function a(){return{runtime:require("./scopeRuntime.js"),api:require("./scopeRuntimeApi.js")}}},{key:"parse",value:function e(a){var b=this,c=b.parser.lexer.lex;b.parser.yy.scopeState={};var d=new _BacktickProcessor.default(b);return b.parser.lexer.lex=function(){var a;return a=d.lex(this),!1===a?c.call(this):a},this.parser.parse(a)}},{key:"traverse",value:function d(a){var b=this;if(null===a)return null;if("object"!=typeof a)return a;if(void 0===a.type)return a;if(void 0!==a.loc){var e=b.rules.state.loc.name;b.rules.state.loc=a.loc,b.rules.state.loc.name=e}if(a.body instanceof Array){var f=b.rules.parentNode;a.traversedBody=[],a.body.forEach(function(c){b.rules.parentNode=a.type,a.traversedBody.push(b.traverse(c))}),b.rules.parentNode=f}if(b.rules[a.type]){if(b.rules.state.setName(a.type),a.body instanceof Array){var c;return(c=b.rules)[a.type].apply(c,_toConsumableArray(a.traversedBody))}return b.rules.state.loc.sourceCode=a.body,b.rules[a.type](a.body)}return console.log("".concat(a.type," not implemented")),"Not implemented"}},{key:"import",value:function q(b,c,d,e){var f=this;d=JSON.parse(d);var g=path.resolve(path.dirname(b),d);if(!fs.existsSync(g)){var h=path.resolve(__dirname,"../packages"),i=fs.readdirSync(h);if(-1!==i.indexOf(d)){var j=path.join(h,d),k=require(path.join(j,"spn.json")),l=path.join(j,k.main);g=path.resolve(path.dirname(b),l)}else throw new Error("File \"".concat(d,"\" doesn't exist ").concat(f.rules.state.errorTail()))}if(/\.sc$/.test(g)){var m=path.resolve(path.dirname(c),d.replace(/\.sc$/,".js")),n=fs.readFileSync(g,"utf8"),o=new a().translate(n,g,m),p=path.dirname(m);fs.existsSync(p)||fs.mkdirSync(p),fs.writeFileSync(m,o.code);var r={source:o.code,sourceFile:m};return f.imported.push({file:r,offset:{line:e}}),"scope.import(".concat(JSON.stringify(m),")")}return"scope.import(".concat(JSON.stringify(g),")")}},{key:"translate",value:function s(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"NO SOURCE FILE",c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:"NO LIB FILE",d=!!(3<arguments.length&&void 0!==arguments[3])&&arguments[3],e=this,f="";f="undefined"==typeof window?require("./predefs.js")(__dirname):"\"use strict\";";var g,h;e.mapAndParse=function(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{source:"",translation:"",sn:""};return"string"!=typeof a.sn&&a.sn.setSourceContent(b,a.source),a},e.sn=function(a){var c=1<arguments.length&&void 0!==arguments[1]?arguments[1]:e.rules.state.getName(),d=e.rules.state.loc.start;return new sourceMap.SourceNode(d.line,d.column,b,a,c)};var i,j=e.sn("");e.imported=[],e.rules=new _ScopeRules.default,e.rules.parser=e,e.rules.srcFilename=b,e.rules.libFilename=c,e.rules.node=j,e.rules.sn=e.sn,e.rules.mapAndParse=e.mapAndParse;var k=this.parse(a),l=JSON.stringify(k,null,"  "),m=e.traverse(k);if(d)return e.rules.invokeExpression(e.rules.scopeExpression(m),e.rules.invokeArguments()).sn;h=e.rules.invokeExpression(e.rules.scopeExpression(e.rules.scopeStart(),m),e.rules.invokeArguments()).sn,h.prepend(f),h.add(";"),i=h.toStringWithSourceMap(),i.map=JSON.parse(i.map.toString()),i.map.sourcesContent=[a],i.comment=convert.fromObject(i.map).toComment();var n={source:i.code+"\n".concat(i.comment),sourceFile:c},p=combine.create(c.replace(/\.js$/,".min.js")).addFile(n,{line:1});e.imported.forEach(function(a){p.addFile(a.file,a.offset)});var q=p.base64(),r=convert.fromBase64(q).toObject();return g={ast:l,map:r,code:i.code+"\n".concat(i.comment)},g}}]),a}();module.exports=ScopeParser;

}).call(this,"/lib")

},{"./BacktickProcessor.js":9,"./ScopeAst.js":10,"./ScopeRules.js":12,"./parser.js":13,"./predefs.js":14,"./scopeRuntime.js":15,"./scopeRuntimeApi.js":16,"combine-source-map":20,"convert-source-map":35,"core-js/modules/es6.array.from":122,"core-js/modules/es6.regexp.replace":129,"core-js/modules/es6.regexp.to-string":131,"core-js/modules/es6.symbol":132,"core-js/modules/es7.symbol.async-iterator":136,"core-js/modules/web.dom.iterable":137,"fs":1,"module":1,"path":7,"source-map":176,"source-map-support":164}],12:[function(require,module,exports){
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0,require("core-js/modules/es6.regexp.replace"),require("core-js/modules/web.dom.iterable"),require("core-js/modules/es6.map");var fs=_interopRequireWildcard(require("fs")),path=_interopRequireWildcard(require("path"));function _interopRequireWildcard(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)if(Object.prototype.hasOwnProperty.call(a,c)){var d=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(a,c):{};d.get||d.set?Object.defineProperty(b,c,d):b[c]=a[c]}return b.default=a,b}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}var api={print:"ScopeApi.print",debug:"ScopeApi.debug",if:"ScopeApi['if']",each:"ScopeApi['each']",compile:"ScopeApi.compile",promise:"ScopeApi.promise",dereference:"ScopeApi.dereference",BSONtoMap:"ScopeApi.BSONtoMap",toJS:"ScopeApi.toJS",toJSON:"ScopeApi.toJSON",createTag:"ScopeApi.createTag",getTag:"ScopeApi.getTag",getAllTags:"ScopeApi.getAllTags"},allowedUndefinedIdExpressions=["xmlExpression","invokeId"],buildArgPartFromAssocPart=function(a){var b=!!(1<arguments.length&&void 0!==arguments[1])&&arguments[1],c="";return b&&(c=","),"id"===a.type?c+="[\"".concat(a.name,"\",").concat(a.expression,"]"):"string"===a.type&&(c+="[".concat(a.name,",").concat(a.expression,"]")),c},randStr=function(){for(var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:16,b="",c="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",d=0;d<a;d+=1)b+=c[Math.floor(Math.random()*c.length)];return b},ScopeRules=function(){function a(){var b=this,c=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{context:{}};_classCallCheck(this,a);var d=this;d.parentNode="program",d.state=c,c.loc={start:{line:0,column:0},end:{line:0,column:0},name:"root"},c.errorTail=function(){return"[".concat(d.state.loc.start.line,":").concat(d.state.loc.start.column,"-").concat(d.state.loc.end.line,":").concat(d.state.loc.end.column,"]")},c.importExpressions=new Map,c.root=c.context,c.context=c.context,c.context.args=[],c.context.name="root",c.newChildContext=function(){var a=c.context,b={scoping:{let:new Map,private:new Map,protected:new Map,public:new Map,parent:a},definedLocally:c.context.definedLocally,idAvailable:c.context.idAvailable};b.args=[],b.inArrayDefinition=!1,b.name=c.loc.name,c.context=b},c.setName=function(a){c.loc.name=a},c.getName=function(){for(var a=c.loc.name,b=c.context;b&&b.scoping;)a="".concat(b.name,"->").concat(a),b=b.scoping.parent;return a},c.setParentContext=function(){c.context=c.context.scoping.parent},c.newImportExpression=function(a){var c=b,d=c.parser.import(c.srcFilename,c.libFilename,a,c.state.loc.start.line);return d},c.context.definedLocally=function(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:c.context;return b.scoping.let.has(a)?b.scoping.let.get(a):b.scoping.private.has(a)?b.scoping.private.get(a):b.scoping.protected.has(a)?b.scoping.protected.get(a):!!b.scoping.public.has(a)&&b.scoping.public.get(a)},c.context.idAvailable=function(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:c.context;return!!b&&(!!(void 0!==b.definedLocally&&b.definedLocally(a,b))||!!(b.scoping&&b.scoping.parent&&b.scoping.parent.scoping)&&b.idAvailable(a,b.scoping.parent))},c.newChildContext()}return _createClass(a,[{key:"arrayExpression",value:function d(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"",c=this;return c.state.setParentContext(),c.mapAndParse({source:a.source+b.source+"]",translation:a.translation+b.translation+")",sn:c.sn([a.sn,b.sn,")"])})}},{key:"arrayStart",value:function b(){var a=this;return a.state.newChildContext(),a.state.context.inArrayDefinition=!0,a.mapAndParse({source:"[",translation:"scope.arrayExpression(",sn:a.sn(["scope.arrayExpression("])})}},{key:"assignmentExpression",value:function d(a,b){var c=this;return c.mapAndParse({source:a.source+"="+b.source,translation:"scope.assignmentExpression([".concat(a.translation,"],").concat(b.translation,")"),sn:c.sn(["scope.assignmentExpression([",a.sn,"],",b.sn,")"])})}},{key:"assignmentValue",value:function d(a,b){var c=this;return c.mapAndParse({source:a+b.source,translation:"[\"".concat(a,"\",").concat(b.translation,"]"),sn:c.sn(["[\"",a,"\",",b.sn,"]"])})}},{key:"associativeDeclaration",value:function f(a,b,c){var d=this,e=a;return"id"===b&&(e="\"".concat(a,"\"")),d.mapAndParse({source:"".concat(a,":").concat(c.source),translation:"[".concat(e,",").concat(c.translation,"]"),sn:d.sn(["[",e,",",c.sn,"]"])})}},{key:"associativeList",value:function e(a,b){var c=this,d=null;return void 0===b?(b=a,d={source:b.source,translation:b.translation,sn:c.sn([b.sn])}):d={source:a.source+","+b.source,translation:a.translation+","+b.translation,sn:c.sn([a.sn,",",b.sn])},c.mapAndParse(d)}},{key:"binaryExpression",value:function f(c,a,d){var b=this,e="";return e="&&"===a?" and ":"||"===a?" or ":"==="===a?" is ":"!=="===a?" isnt ":">"===a?" gt ":"<"===a?" lt ":">="===a?" gteq ":"<="===a?" lteq ":a,b.mapAndParse({source:"".concat(c.source).concat(e).concat(d.source),translation:"scope.binaryExpression(\"".concat(a,"\",").concat(c.translation,",").concat(d.translation,")"),sn:b.sn(["scope.binaryExpression(\"",a,"\",",c.sn,",",d.sn,")"])})}},{key:"booleanLiteral",value:function c(a){var b=this;return b.mapAndParse({source:"".concat(a),translation:"".concat(a),sn:b.sn(["".concat(a)])})}},{key:"btString",value:function c(a){var b=this;return b.mapAndParse({source:a,translation:a,sn:b.sn([a]),isBString:!0})}},{key:"bracketExpression",value:function c(a){var b=this;return b.mapAndParse({source:"[".concat(a.source,"]"),translation:"[".concat(a.translation,"]"),sn:b.sn(["[",a.sn,"]"]),value:a.translation})}},{key:"bracketSelectorExpression",value:function f(c,d){var e=this;return"object"!=typeof c&&(c=e.mapAndParse({source:"",translation:"0",sn:"0"})),"object"!=typeof d&&(d=e.mapAndParse({source:"",translation:"undefined",sn:"undefined"})),e.mapAndParse({source:"[".concat(c.source,":").concat(d.source,"]"),translation:".slice(".concat(c.translation,",").concat(d.translation,")"),sn:e.sn([".slice(",c.sn,",",d.sn,")"]),values:[c.translation,d.translation]})}},{key:"controlCode",value:function d(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",b=1<arguments.length?arguments[1]:void 0,c=this;return c.state.loc.name=c.state.context.name,void 0===b?c.mapAndParse():c.mapAndParse({source:"".concat(a.source).concat(b.source,";"),translation:"".concat(a.translation).concat(b.translation,";"),sn:c.sn([a.sn,b.sn,";"])})}},{key:"declarationId",value:function c(a){var b=this;return b.state.loc.name=a,b.mapAndParse({source:"".concat(a),translation:"\"".concat(a,"\""),sn:b.sn(["\"",a,"\""])})}},{key:"declarationIdList",value:function d(a){var b=this,c="";return a.values.forEach(function(a,b){0!==b&&(c+=","),c+="\"".concat(a,"\"")}),b.mapAndParse({source:"[".concat(a.source,"]"),translation:"[".concat(c,"]"),sn:b.sn(["[",c,"]"])})}},{key:"declarationExpression",value:function f(a,b,c){var d=this,e=d.state;if(b in api)throw"Syntax Error: '".concat(b,"' is a reserved word ").concat(e.errorTail());if(e.context.definedLocally(b))throw"Syntax Error: '".concat(b,"' has already been defined in this context. ").concat(e.errorTail());return"let"===a&&e.context.scoping.let.set(b,!0),"private"===a&&e.context.scoping.private.set(b,!0),"protected"===a&&e.context.scoping.protected.set(b,!0),"public"===a&&e.context.scoping.public.set(b,!0),d.mapAndParse({source:"".concat(a," ").concat(b.source," = ").concat(c.source),translation:"scope.declarationExpression({type:\"".concat(a,"\",name:").concat(b.translation,",value:").concat(c.translation,"})"),sn:d.sn(["scope.declarationExpression({type:\"",a,"\",name:",b.sn,",value:",c.sn,"})"])})}},{key:"emptyMapExpression",value:function c(a){var b=this;return b.state.setParentContext(),b.mapAndParse({source:"".concat(a.source,"]"),translation:"".concat(a.translation,")"),sn:b.sn([a.sn,")"])})}},{key:"expressionList",value:function d(a,b){var c=this;return void 0===b?c.mapAndParse({source:a.source,translation:a.translation,sn:c.sn([a.sn])}):c.mapAndParse({source:"".concat(a.source,",").concat(b.source),translation:"".concat(a.translation,",").concat(b.translation),sn:c.sn([a.sn,",",b.sn])})}},{key:"identifier",value:function f(a,b,c){var d=this,e=d.state;return"assignmentExpression"===d.parentNode?"dot"===b?d.mapAndParse({source:"".concat(a.source,".").concat(c),translation:"".concat(a.translation,",\"").concat(c,"\""),sn:d.sn([a.sn,",\"",c,"\""])}):"bracket"===b?c.values?d.mapAndParse({source:"".concat(a.source).concat(c.source),translation:"".concat(a.translation,",").concat(c.values[0],",").concat(c.values[1]),sn:d.sn([a.sn,",",c.values[0],",",c.values[1]])}):d.mapAndParse({source:"".concat(a.source,"[").concat(c.source,"]"),translation:"".concat(a.translation,",").concat(c.value),sn:d.sn([a.sn,",",c.value])}):d.mapAndParse({source:"".concat(a),translation:"\"".concat(a,"\""),sn:d.sn(["\"",a,"\""])}):void 0===c?a in api?d.mapAndParse({source:"".concat(a),translation:"".concat(api[a]),sn:d.sn([api[a]])}):-1===allowedUndefinedIdExpressions.indexOf(this.parentNode)?d.mapAndParse({source:"".concat(a),translation:"scope.identifier(\"".concat(a,"\")"),sn:d.sn(["scope.identifier(\"",a,"\")"])}):d.mapAndParse({source:"".concat(a),translation:"".concat(a),sn:d.sn([a])}):"dot"===b?d.mapAndParse({source:"".concat(a.source,".").concat(c),translation:"".concat(a.translation,"[\"").concat(c,"\"]"),sn:d.sn([a.sn,"[\"",c,"\"]"])}):d.mapAndParse({source:"".concat(a.source).concat(c.source),translation:"".concat(a.translation).concat(c.translation),sn:d.sn([a.sn,c.sn])})}},{key:"idList",value:function e(a,b){var c=this;if(void 0===b)return c.mapAndParse({source:"".concat(a),translation:"".concat(a),sn:c.sn([a]),values:[a]});var d=b.values.slice();return d.unshift(a),c.mapAndParse({source:"".concat(a,",").concat(b.source),translation:"".concat(a,",").concat(b.translation),sn:c.sn([a,",",b.sn]),values:d})}},{key:"importExpression",value:function c(a){var b=this;return b.mapAndParse({source:"import ".concat(a),translation:b.state.newImportExpression(a),sn:b.sn([b.state.newImportExpression(a)])})}},{key:"invokeArguments",value:function c(a){var b=this;return void 0===a?b.mapAndParse():b.mapAndParse({source:"".concat(a.source),translation:"".concat(a.translation),sn:b.sn([a.sn])})}},{key:"invokeExpression",value:function d(a,b){var c=this;return c.mapAndParse({source:"".concat(a.source,"(").concat(b.source,")"),translation:"".concat(a.translation,"(").concat(b.translation,")"),sn:c.sn([a.sn,"(",b.sn,")"])})}},{key:"invokeId",value:function e(a,b,c){var d=this;return"dot"===b?d.mapAndParse({source:"".concat(a.source,".").concat(c.source),translation:"".concat(a.translation,"[\"").concat(c.translation,"\"]"),sn:d.sn([a.sn,"[\"",c.sn,"\"]"])}):d.mapAndParse({source:"".concat(a.source).concat(c.source),translation:"".concat(a.translation).concat(c.translation),sn:d.sn([a.sn,c.sn])})}},{key:"invokeTracker",value:function b(a){return a}},{key:"mapExpression",value:function d(a,b){var c=this;return c.state.setParentContext(),c.mapAndParse({source:"".concat(a.source).concat(b.source,"]"),translation:"scope.mapExpression(".concat(b.translation,")"),sn:c.sn(["scope.mapExpression(",b.sn,")"])})}},{key:"numericLiteral",value:function c(a){var b=this;return b.mapAndParse({source:"".concat(a),translation:"".concat(a),sn:b.sn(["".concat(a)])})}},{key:"regexLiteral",value:function h(a){var b=this,c=/^\/([\0-\uFFFF]*)\/([A-Za-z]*)$/.exec(a),d=c[1],e=c[2],f="`"+d.replace(/\\\//g,"/").replace(/\\/g,"\\\\")+"`",g="XRegExp(".concat(f,",\"").concat(e,"\")");return b.mapAndParse({source:"".concat(a),translation:g,sn:b.sn([g])})}},{key:"returnExpression",value:function c(a){var b=this;return b.mapAndParse({source:"return ".concat(a.source),translation:"return ".concat(a.translation),sn:b.sn(["return ",a.sn])})}},{key:"scopeStart",value:function b(){var a=this;return a.state.newChildContext(),a.mapAndParse({source:"{",translation:"scope.createScope(function(args){",sn:a.sn(["scope.createScope(function(args){"])})}},{key:"scopeExpression",value:function g(a,b,c){var d=this,e=d.state,f="";return"{"!==a.source&&(c=b,b=a),void 0===c&&(c=b,b={source:"",translation:"[]",sn:d.sn(["[]"]),values:[]}),void 0===b&&(b={source:"",translation:"[]",sn:d.sn(["[]"]),values:[]}),b.values.forEach(function(a,b){f+="scope.declarationExpression({type:\"let\","+"name:\"".concat(a[0],"\",")+"value:args[".concat(b,"]===undefined?").concat(a[1],":args[").concat(b,"]")+"});"}),e.setParentContext(),d.mapAndParse({source:"".concat(b.source).concat(a.source).concat(c.source,"}"),translation:"".concat(a.translation).concat(f).concat(c.translation,"})"),sn:d.sn([a.sn,f,c.sn,"})"])})}},{key:"scopeArguments",value:function d(a,b){var c=this;return console.log("scopeArguments:"),console.log(a,b),c.mapAndParse({source:"(".concat(a.source,")"),translation:"".concat(a.translation),sn:c.sn([a.sn]),values:a.values})}},{key:"scopeArgumentsList",value:function e(a,b){var c=this;if(void 0===b)return c.mapAndParse({source:"".concat(a.source),translation:"".concat(a.translation),sn:c.sn([a.sn]),values:[a.value]});var d=b.values.slice();return d.unshift(a.value),c.mapAndParse({source:"".concat(a.source,",").concat(b.source),translation:"",sn:"",values:d})}},{key:"scopeArgumentsListDeclaration",value:function d(a,b){var c=this;return c.mapAndParse({source:"".concat(a,":").concat(b.source),translation:"",sn:"",value:[a,b.translation]})}},{key:"scopeArgumentSpread",value:function c(a){var b=this;return b.mapAndParse({source:"...".concat(a),translation:"",sn:"",value:[a]})}},{key:"stringLiteral",value:function d(a){var b=this;if(a.isBString)return b.mapAndParse(a);var c=a.replace(/\\\r\n|\\\n/mg,"").replace(/\n/mg,"\\n").replace(/\r/mg,"\\r");return console.log("\n\tstr: ".concat(a,"\n\tparsedStr: ").concat(c)),b.mapAndParse({source:"".concat(a),translation:c,sn:b.sn([c])})}},{key:"unaryExpression",value:function d(a,b){var c=this;return c.mapAndParse({source:"".concat(a," ").concat(b.source),translation:"".concat(a).concat(b.translation),sn:c.sn([a,b.sn])})}},{key:"useExpression",value:function d(a,b){var c=this;return void 0===b?c.mapAndParse({source:"use ".concat(a.source),translation:"scope.use([".concat(a.translation,"])"),sn:c.sn(["scope.use([",a.sn,"])"])}):c.mapAndParse({source:"use ".concat(a.source," only ").concat(b.source),translation:"scope.use([".concat(a.translation,"],[").concat(b.translation,"])"),sn:c.sn(["scope.use([",a.sn,"],[",b.sn,"])"])})}},{key:"usable",value:function d(a,b){var c=this;return void 0===b?c.mapAndParse({source:"".concat(a.source),translation:"".concat(a.translation),sn:c.sn([a.sn])}):c.mapAndParse({source:"".concat(a.source,",").concat(b.source),translation:"".concat(a.translation,",").concat(b.translation),sn:c.sn([a.sn,",",b.sn])})}},{key:"useOnly",value:function c(a){var b=this;return b.mapAndParse({source:"".concat(a.source),translation:"".concat(a.translation),sn:b.sn([a.sn])})}},{key:"xmlControlCode",value:function d(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",b=1<arguments.length?arguments[1]:void 0,c=this;return void 0===b?c.mapAndParse({source:"",translation:"",sn:"",first:!0}):(a.first||(a.translation+=",",a.sn.add([","])),c.mapAndParse({source:"".concat(a.source).concat(b.source,";"),translation:"".concat(a.translation).concat(b.translation),sn:c.sn([a.sn,b.sn]),first:!1}))}},{key:"xmlAttributes",value:function e(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",b=1<arguments.length?arguments[1]:void 0,c=2<arguments.length?arguments[2]:void 0,d=this;return void 0===b?d.mapAndParse({source:"",translation:"",sn:"",first:!0}):(a.first||(a.translation+=",",a.sn.add([","])),d.mapAndParse({source:"".concat(a.source," ").concat(b,"=").concat(c.source),translation:"".concat(a.translation,"\"").concat(b,"\":").concat(c.translation),sn:d.sn([a.sn,"\"",b,"\":",c.sn]),first:!1}))}},{key:"xmlExpression",value:function f(a,b,c,d){var e=this;if(void 0===c)return e.mapAndParse({source:"<".concat(a.source," ").concat(b.source,"/>"),translation:"scope.xmlExpression(\"".concat(a.translation,"\",{").concat(b.translation,"})"),sn:e.sn(["scope.xmlExpression(\"",a.sn,"\",{",b.sn,"})"])});if(a.source!==d.source)throw"Syntax Error: Unmatching XML Tags: <".concat(a.source,">...</").concat(d.source,"> ").concat(state.errorTail());return e.mapAndParse({source:"<".concat(a.source," ").concat(b.source,">").concat(c.source,"</").concat(d.source,">"),translation:"scope.xmlExpression(\"".concat(a.translation,"\",{").concat(b.translation,"},").concat(c.translation,")"),sn:e.sn(["scope.xmlExpression(\"",a.sn,"\",{",b.sn,"},",c.sn,")"])})}}]),a}(),_default=ScopeRules;exports.default=_default;

},{"core-js/modules/es6.map":124,"core-js/modules/es6.regexp.replace":129,"core-js/modules/web.dom.iterable":137,"fs":1,"path":7}],13:[function(require,module,exports){
(function (process){
"use strict";require("core-js/modules/es6.regexp.replace"),require("core-js/modules/es6.regexp.split"),require("core-js/modules/es6.regexp.match");var parser=function(){function a(){this.yy={}}var b=function(a,b,c,d){for(c=c||{},d=a.length;d--;c[a[d]]=b);return c},c=[2,41],d=[1,42],e=[1,31],f=[1,43],g=[1,9],h=[1,19],i=[1,20],j=[1,21],k=[1,22],l=[1,11],m=[1,15],n=[1,16],o=[1,17],p=[1,23],q=[1,24],r=[1,25],s=[1,27],t=[1,41],u=[1,33],v=[1,34],w=[1,18],x=[1,36],y=[1,45],z=[1,46],A=[1,47],B=[1,48],C=[1,49],D=[1,50],E=[1,51],F=[1,52],G=[1,53],H=[1,54],I=[1,55],J=[1,56],K=[1,57],L=[1,58],M=[1,59],N=[1,60],O=[5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,59,81,91,94],P=[1,66],Q=[1,68],R=[1,71],S=[1,80],T=[1,88],U=[1,91],V=[1,90],W=[2,81],X=[5,8,12,14,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,58,59,64,81,88,91,94],Y=[2,63],Z=[2,76],$=[5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,58,59,81,88,91,94],_=[8,16,21,27,41,52,53,54,55,58,62,63,65,69,70,71,72,78,83,84,85,89],aa=[21,26,28],ba=[59,81],ca=[1,133],da=[1,139],ea=[5,8,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,58,59,64,81,91,94],fa=[5,16,17,19,27,48,59,81,91,94],ga=[5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,59,81,88,91,94],ha=[1,145],ia=[1,148],ja=[5,59],ka=[16,91,94],la=[5,19],ma=[1,161],na=[1,162],oa=[5,16,17,19,27,30,31,34,35,36,37,38,39,48,59,81,91,94],pa=[5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,48,59,81,91,94],qa=[5,16,17,19,27,34,35,36,37,38,39,48,59,81,91,94],ra=[5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,48,59,81,91,94],sa=[5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,48,59,81,91,94],ta=[8,16,21,41,52,53,54,55,58,62,63,65,69,70,71,72,78,83,84,85,89,93],ua={trace:function(){},yy:{},symbols_:{error:2,array:3,arrayStart:4,"]":5,associativeList:6,expressionList:7,"[":8,assignmentExpression:9,id:10,assignmentValue:11,"=":12,expression:13,"+=":14,associativeDeclaration:15,IDENTIFIER:16,":":17,string:18,",":19,btOpStart:20,"`":21,btOpEnd:22,btBody:23,btString:24,btPart:25,"${":26,"}":27,BTCHAR:28,binaryExpression:29,AND:30,OR:31,"<&":32,"&>":33,IS:34,ISNT:35,GT:36,LT:37,GTEQ:38,LTEQ:39,"+":40,"-":41,"*":42,"/":43,"^":44,"%":45,bracketExpression:46,controlCode:47,";":48,declarationId:49,idList:50,declarationExpression:51,LET:52,PRIVATE:53,PROTECTED:54,PUBLIC:55,import:56,use:57,"(":58,")":59,literal:60,invoke:61,RETURN:62,"!":63,".":64,IMPORT:65,invokeTracker:66,invokeArguments:67,scope:68,TRUE:69,FALSE:70,NUMBER:71,REGEXPBODY:72,xml:73,program:74,EOF:75,scopeArguments:76,scopeStart:77,"{":78,scopeArgumentsList:79,scopeArgumentSpread:80,"...":81,scopeArgumentsListDeclaration:82,QSTRING:83,ASTRING:84,USE:85,usable:86,useOnly:87,ONLY:88,"<":89,xmlAttributes:90,">":91,xmlControlCode:92,"</":93,"/>":94,$accept:0,$end:1},terminals_:{2:"error",5:"]",8:"[",12:"=",14:"+=",16:"IDENTIFIER",17:":",19:",",21:"`",26:"${",27:"}",28:"BTCHAR",30:"AND",31:"OR",32:"<&",33:"&>",34:"IS",35:"ISNT",36:"GT",37:"LT",38:"GTEQ",39:"LTEQ",40:"+",41:"-",42:"*",43:"/",44:"^",45:"%",48:";",52:"LET",53:"PRIVATE",54:"PROTECTED",55:"PUBLIC",58:"(",59:")",62:"RETURN",63:"!",64:".",65:"IMPORT",69:"TRUE",70:"FALSE",71:"NUMBER",72:"REGEXPBODY",75:"EOF",78:"{",81:"...",83:"QSTRING",84:"ASTRING",85:"USE",88:"ONLY",89:"<",91:">",93:"</",94:"/>"},productions_:[0,[3,2],[3,3],[3,3],[4,1],[9,2],[11,2],[11,2],[11,4],[15,3],[15,3],[6,1],[6,3],[20,1],[22,2],[24,2],[23,0],[23,2],[25,3],[25,1],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[29,3],[46,5],[46,4],[46,4],[46,3],[46,3],[47,0],[47,3],[49,1],[49,3],[51,4],[51,4],[51,4],[51,4],[13,1],[13,1],[13,1],[13,1],[13,2],[13,1],[13,3],[13,1],[13,1],[13,1],[13,2],[13,2],[7,1],[7,3],[10,1],[10,3],[10,2],[50,1],[50,3],[56,2],[66,2],[61,3],[61,4],[61,4],[61,3],[61,2],[61,4],[67,0],[67,1],[60,1],[60,1],[60,1],[60,1],[60,1],[60,1],[60,1],[60,1],[74,2],[68,4],[68,3],[77,1],[76,4],[76,3],[76,3],[76,2],[80,2],[79,1],[79,3],[82,3],[18,1],[18,1],[18,1],[57,2],[57,3],[86,1],[86,1],[86,1],[86,3],[86,3],[86,3],[87,4],[73,8],[73,4],[90,0],[90,4],[92,0],[92,3]],performAction:function(a,b,c,d,e,f){var g=f.length-1;switch(e){case 1:this.$=new d.scopeAst(d,"emptyMapExpression",[f[g-1]]);break;case 2:this.$=new d.scopeAst(d,"mapExpression",[f[g-2],f[g-1]]);break;case 3:this.$=new d.scopeAst(d,"arrayExpression",[f[g-2],f[g-1]]);break;case 4:this.$=new d.scopeAst(d,"arrayStart",[]);break;case 5:this.$=new d.scopeAst(d,"assignmentExpression",[f[g-1],f[g]]);break;case 6:case 7:this.$=new d.scopeAst(d,"assignmentValue",[f[g-1],f[g]]);break;case 8:this.$=new d.scopeAst(d,"assignmentValue",["[]=",f[g]]);break;case 9:this.$=new d.scopeAst(d,"associativeDeclaration",[f[g-2],"id",f[g]]);break;case 10:this.$=new d.scopeAst(d,"associativeDeclaration",[f[g-2],"string",f[g]]);break;case 11:this.$=new d.scopeAst(d,"associativeList",[f[g]]);break;case 12:this.$=new d.scopeAst(d,"associativeList",[f[g-2],f[g]]);break;case 14:this.$=d.scopeState.btString;break;case 15:case 19:this.$=f[g];break;case 16:this.$="";break;case 17:this.$=f[g-1]+f[g];break;case 18:this.$="${"+f[g-1].translation+"}";break;case 20:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"&&",f[g]]);break;case 21:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"||",f[g]]);break;case 22:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"<&",f[g]]);break;case 23:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"&>",f[g]]);break;case 24:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"===",f[g]]);break;case 25:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"!==",f[g]]);break;case 26:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],">",f[g]]);break;case 27:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"<",f[g]]);break;case 28:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],">=",f[g]]);break;case 29:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],"<=",f[g]]);break;case 30:case 31:case 32:case 33:case 34:case 35:this.$=new d.scopeAst(d,"binaryExpression",[f[g-2],f[g-1],f[g]]);break;case 36:this.$=new d.scopeAst(d,"bracketSelectorExpression",[f[g-3],f[g-1]]);break;case 37:this.$=new d.scopeAst(d,"bracketSelectorExpression",[0,f[g-1]]);break;case 38:this.$=new d.scopeAst(d,"bracketSelectorExpression",[f[g-2],void 0]);break;case 39:this.$=new d.scopeAst(d,"bracketSelectorExpression",[0,void 0]);break;case 40:this.$=new d.scopeAst(d,"bracketExpression",[f[g-1]]);break;case 41:this.$=new d.scopeAst(d,"controlCode",[]);break;case 42:this.$=new d.scopeAst(d,"controlCode",[f[g-2],f[g-1]]);break;case 43:this.$=new d.scopeAst(d,"declarationId",[f[g]]);break;case 44:this.$=new d.scopeAst(d,"declarationIdList",[f[g-1]]);break;case 45:this.$=new d.scopeAst(d,"declarationExpression",["let",f[g-2],f[g]]);break;case 46:this.$=new d.scopeAst(d,"declarationExpression",["private",f[g-2],f[g]]);break;case 47:this.$=new d.scopeAst(d,"declarationExpression",["protected",f[g-2],f[g]]);break;case 48:this.$=new d.scopeAst(d,"declarationExpression",["public",f[g-2],f[g]]);break;case 49:case 50:case 51:case 52:case 54:case 56:case 57:case 58:case 83:case 84:case 85:case 98:case 99:this.$=f[g];break;case 53:this.$=new d.scopeAst(d,"unaryExpression",["-",f[g]]);break;case 55:this.$=f[g-1];break;case 59:this.$=new d.scopeAst(d,"returnExpression",[f[g]]);break;case 60:this.$=new d.scopeAst(d,"unaryExpression",["!",f[g]]);break;case 61:this.$=new d.scopeAst(d,"expressionList",[f[g]]);break;case 62:this.$=new d.scopeAst(d,"expressionList",[f[g-2],f[g]]);break;case 63:this.$=new d.scopeAst(d,"identifier",[f[g]]);break;case 64:this.$=new d.scopeAst(d,"identifier",[f[g-2],"dot",f[g]]);break;case 65:this.$=new d.scopeAst(d,"identifier",[f[g-1],"bracket",f[g]]);break;case 66:this.$=new d.scopeAst(d,"idList",[f[g]]);break;case 67:this.$=new d.scopeAst(d,"idList",[f[g-2],f[g]]);break;case 68:this.$=new d.scopeAst(d,"importExpression",[f[g]]);break;case 69:this.$=new d.scopeAst(d,"invokeTracker",[f[g-1]]);break;case 70:this.$=new d.scopeAst(d,"invokeExpression",[f[g-2],f[g-1]]);break;case 71:case 72:case 75:this.$=new d.scopeAst(d,"invokeExpression",[f[g-3],f[g-1]]);break;case 73:this.$=new d.scopeAst(d,"invokeId",[f[g-2],"dot",f[g]]);break;case 74:this.$=new d.scopeAst(d,"invokeId",[f[g-1],"bracket",f[g]]);break;case 76:this.$=new d.scopeAst(d,"invokeArguments",[]);break;case 77:this.$=new d.scopeAst(d,"invokeArguments",[f[g]]);break;case 78:this.$=new d.scopeAst(d,"booleanLiteral",!0);break;case 79:this.$=new d.scopeAst(d,"booleanLiteral",!1);break;case 80:this.$=new d.scopeAst(d,"numericLiteral",+f[g]);break;case 81:this.$=new d.scopeAst(d,"stringLiteral",[f[g]]);break;case 82:this.$=new d.scopeAst(d,"regexLiteral",[f[g]]);break;case 86:return f[g-1];break;case 87:this.$=new d.scopeAst(d,"scopeExpression",[f[g-2],f[g-3],f[g-1]]);break;case 88:this.$=new d.scopeAst(d,"scopeExpression",[f[g-2],f[g-1]]);break;case 89:this.$=new d.scopeAst(d,"scopeStart",[]);break;case 90:this.$=new d.scopeAst(d,"scopeArguments",[f[g-2],f[g-1]]);break;case 91:this.$=new d.scopeAst(d,"scopeArguments",[f[g-1],"remainingArguments"]);break;case 92:this.$=new d.scopeAst(d,"scopeArguments",[void 0,f[g-1]]);break;case 93:this.$=new d.scopeAst(d,"scopeArguments",[void 0,void 0]);break;case 94:this.$=new d.scopeAst(d,"scopeArgumentSpread",[f[g]]);break;case 95:this.$=new d.scopeAst(d,"scopeArgumentsList",[f[g]]);break;case 96:this.$=new d.scopeAst(d,"scopeArgumentsList",[f[g-2],f[g]]);break;case 97:this.$=new d.scopeAst(d,"scopeArgumentsListDeclaration",[f[g-2],f[g]]);break;case 100:this.$=new d.scopeAst(d,"btString",[f[g]]);break;case 101:this.$=new d.scopeAst(d,"useExpression",[f[g]]);break;case 102:this.$=new d.scopeAst(d,"useExpression",[f[g-1],f[g]]);break;case 103:case 104:case 105:this.$=new d.scopeAst(d,"usable",[f[g]]);break;case 106:case 107:case 108:this.$=new d.scopeAst(d,"usable",[f[g-2],f[g]]);break;case 109:this.$=new d.scopeAst(d,"useOnly",[f[g-1]]);break;case 110:this.$=new d.scopeAst(d,"xmlExpression",[f[g-6],f[g-5],f[g-3],f[g-1]]);break;case 111:this.$=new d.scopeAst(d,"xmlExpression",[f[g-2],f[g-1]]);break;case 112:this.$=new d.scopeAst(d,"xmlAttributes",[]);break;case 113:this.$=new d.scopeAst(d,"xmlAttributes",[f[g-3],f[g-2],f[g]]);break;case 114:this.$=new d.scopeAst(d,"xmlControlCode",[]);break;case 115:this.$=new d.scopeAst(d,"xmlControlCode",[f[g-2],f[g-1]]);}},table:[b([8,16,21,41,52,53,54,55,58,62,63,65,69,70,71,72,75,78,83,84,85,89],c,{74:1,47:2}),{1:[3]},{3:30,4:39,8:d,9:5,10:13,13:4,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,75:[1,3],76:37,77:38,78:t,83:u,84:v,85:w,89:x},{1:[2,86]},{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N,48:[1,44]},b(O,[2,49]),b(O,[2,50],{58:[1,61]}),b(O,[2,51]),b(O,[2,52]),{3:30,4:39,8:d,9:5,10:13,13:62,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(O,[2,54]),{3:30,4:39,8:d,9:5,10:13,13:63,16:[1,69],18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,59:P,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,79:64,80:65,81:Q,82:67,83:u,84:v,85:w,89:x},b(O,[2,56]),b(O,[2,57],{11:70,46:72,8:[1,76],12:[1,74],14:[1,75],58:[1,73],64:R}),b(O,[2,58],{46:78,8:S,58:[1,79],64:[1,77]}),{3:30,4:39,8:d,9:5,10:13,13:81,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:82,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{18:83,20:40,21:f,24:35,83:u,84:v},{10:86,16:e,56:87,58:T,65:o,68:85,76:37,77:38,78:t,86:84},{8:U,16:V,49:89},{8:U,16:V,49:92},{8:U,16:V,49:93},{8:U,16:V,49:94},b(O,[2,78]),b(O,[2,79]),b(O,[2,80]),b(O,W),b(O,[2,82]),b(O,[2,83]),b(O,[2,84],{58:[1,95]}),b(O,[2,85]),b(X,Y),{3:30,4:39,7:97,8:d,9:5,10:13,13:98,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,59:Z,60:12,61:14,62:m,63:n,65:o,66:32,67:96,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b($,[2,98]),b($,[2,99]),b($,[2,100]),{10:99,16:e},{77:100,78:t},b(_,c,{47:101}),{3:30,4:39,5:[1,102],6:103,7:104,8:d,9:5,10:13,13:98,15:105,16:[1,106],18:107,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(aa,[2,16],{22:108,23:109}),b(_,[2,89]),b([5,8,16,21,41,52,53,54,55,58,62,63,65,69,70,71,72,78,83,84,85,89],[2,4]),b(aa,[2,13]),b([8,16,21,27,41,52,53,54,55,58,62,63,65,69,70,71,72,75,78,83,84,85,89],[2,42]),{3:30,4:39,8:d,9:5,10:13,13:110,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:111,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:112,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:113,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:114,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:115,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:116,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:117,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:118,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:119,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:120,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:121,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:122,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:123,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:124,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:125,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,7:97,8:d,9:5,10:13,13:98,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,59:Z,60:12,61:14,62:m,63:n,65:o,66:32,67:126,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(O,[2,53]),{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N,59:[1,127]},{59:[1,129],80:128,81:Q},{59:[1,130]},{78:[2,93]},b(ba,[2,95],{19:[1,131]}),{16:[1,132]},b([8,12,14,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,58,59,64],Y,{17:ca}),b(O,[2,5]),{16:[1,134]},b(X,[2,65]),b([8,16,21,41,52,53,54,55,58,59,62,63,65,69,70,71,72,78,83,84,85,89],[2,69]),{3:30,4:39,8:d,9:5,10:13,13:135,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:136,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,5:[1,137],8:d,9:5,10:13,13:138,16:e,17:da,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{10:140,16:e},b(ea,[2,74]),{3:30,4:39,7:97,8:d,9:5,10:13,13:98,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,59:Z,60:12,61:14,62:m,63:n,65:o,66:32,67:141,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:138,16:e,17:da,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(fa,[2,59],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(O,[2,60]),b($,[2,68]),b([5,16,17,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,59,81,91,94],[2,101],{87:142,19:[1,143],88:[1,144]}),b(ga,[2,103]),b(ga,[2,104],{46:72,8:S,64:R}),b(ga,[2,105]),{16:ha,59:P,79:64,80:65,81:Q,82:67},{12:[1,146]},{12:[2,43]},{16:ia,50:147},{12:[1,149]},{12:[1,150]},{12:[1,151]},{3:30,4:39,7:97,8:d,9:5,10:13,13:98,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,59:Z,60:12,61:14,62:m,63:n,65:o,66:32,67:152,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{59:[1,153]},{59:[2,77]},b(ja,[2,61],{19:[1,154],30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(ka,[2,112],{46:72,90:155,8:S,64:R}),b(_,c,{47:156}),{3:30,4:39,8:d,9:5,10:13,13:4,16:e,18:26,20:40,21:f,24:35,27:[1,157],29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(O,[2,1]),{5:[1,158],19:[1,159]},{5:[1,160]},b(la,[2,11]),b([5,8,12,14,19,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,58,64],Y,{17:ma}),b([5,19,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45],W,{17:na}),b($,[2,15]),{21:[1,163],25:164,26:[1,165],28:[1,166]},b(oa,[2,20],{32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(oa,[2,21],{32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(pa,[2,22],{40:I,41:J,42:K,43:L,44:M,45:N}),b(pa,[2,23],{40:I,41:J,42:K,43:L,44:M,45:N}),b(qa,[2,24],{30:y,31:z,32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(qa,[2,25],{30:y,31:z,32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(qa,[2,26],{30:y,31:z,32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(qa,[2,27],{30:y,31:z,32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(qa,[2,28],{30:y,31:z,32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(qa,[2,29],{30:y,31:z,32:A,33:B,40:I,41:J,42:K,43:L,44:M,45:N}),b(ra,[2,30],{42:K,43:L,44:M,45:N}),b(ra,[2,31],{42:K,43:L,44:M,45:N}),b(sa,[2,32],{44:M,45:N}),b(sa,[2,33],{44:M,45:N}),b(O,[2,34]),b(O,[2,35]),{59:[1,167]},b(O,[2,55]),{59:[1,168]},{78:[2,91]},{78:[2,92]},{16:ha,79:169,82:67},{59:[2,94]},{3:30,4:39,8:d,9:5,10:13,13:170,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(X,[2,64]),b(fa,[2,6],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(fa,[2,7],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),{12:[1,171]},{5:[1,173],17:[1,172],30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N},{3:30,4:39,5:[1,175],8:d,9:5,10:13,13:174,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b([5,16,17,19,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,48,58,59,64,81,91,94],[2,73],{46:72,8:S}),{59:[1,176]},b(O,[2,102]),{10:178,16:e,56:179,58:T,65:o,68:177,76:37,77:38,78:t},{58:[1,180]},{17:ca},{3:30,4:39,8:d,9:5,10:13,13:181,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{5:[1,182]},{5:[2,66],19:[1,183]},{3:30,4:39,8:d,9:5,10:13,13:184,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:185,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:186,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{59:[1,187]},b(ea,[2,70]),{3:30,4:39,7:188,8:d,9:5,10:13,13:98,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{16:[1,191],91:[1,189],94:[1,190]},{3:30,4:39,8:d,9:5,10:13,13:4,16:e,18:26,20:40,21:f,24:35,27:[1,192],29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b($,[2,88]),b(O,[2,2]),{15:193,16:[1,194],18:195,20:40,21:f,24:35,83:u,84:v},b(O,[2,3]),{3:30,4:39,8:d,9:5,10:13,13:196,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,8:d,9:5,10:13,13:197,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b($,[2,14]),b(aa,[2,17]),{3:30,4:39,8:d,9:5,10:13,13:198,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(aa,[2,19]),b(ea,[2,72]),{78:[2,90]},b(ba,[2,96]),b([19,59,81],[2,97],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),{3:30,4:39,8:d,9:5,10:13,13:199,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},{3:30,4:39,5:[1,201],8:d,9:5,10:13,13:200,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(X,[2,40]),{5:[1,202],30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N},b(X,[2,39]),b(ea,[2,75]),b(ga,[2,106]),b(ga,[2,107],{46:72,8:S,64:R}),b(ga,[2,108]),{3:30,4:39,7:203,8:d,9:5,10:13,13:98,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(fa,[2,45],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),{12:[2,44]},{16:ia,50:204},b(fa,[2,46],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(fa,[2,47],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(fa,[2,48],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(ea,[2,71]),b(ja,[2,62]),b(ta,[2,114],{92:205}),b(O,[2,111]),{12:[1,206]},b($,[2,87]),b(la,[2,12]),{17:ma},{17:na},b(la,[2,9],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),b(la,[2,10],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),{27:[1,207],30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N},b(O,[2,8]),{5:[1,208],30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N},b(X,[2,38]),b(X,[2,37]),{59:[1,209]},{5:[2,67]},{3:30,4:39,8:d,9:5,10:13,13:211,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x,93:[1,210]},{3:30,4:39,8:d,9:5,10:13,13:212,16:e,18:26,20:40,21:f,24:35,29:10,41:g,51:8,52:h,53:i,54:j,55:k,56:6,57:7,58:l,60:12,61:14,62:m,63:n,65:o,66:32,68:29,69:p,70:q,71:r,72:s,73:28,76:37,77:38,78:t,83:u,84:v,85:w,89:x},b(aa,[2,18]),b(X,[2,36]),b(O,[2,109]),{10:213,16:e},{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N,48:[1,214]},b(ka,[2,113],{30:y,31:z,32:A,33:B,34:C,35:D,36:E,37:F,38:G,39:H,40:I,41:J,42:K,43:L,44:M,45:N}),{8:S,46:72,64:R,91:[1,215]},b(ta,[2,115]),b(O,[2,110])],defaultActions:{3:[2,86],66:[2,93],90:[2,43],97:[2,77],129:[2,91],130:[2,92],132:[2,94],168:[2,90],182:[2,44],204:[2,67]},parseError:function(a,b){if(b.recoverable)this.trace(a);else{var c=new Error(a);throw c.hash=b,c}},parse:function(a){var b=this,c=[0],d=[null],e=[],f=this.table,g="",h=0,i=0,j=0,l=e.slice.call(arguments,1),m=Object.create(this.lexer),n={yy:{}};for(var o in this.yy)Object.prototype.hasOwnProperty.call(this.yy,o)&&(n.yy[o]=this.yy[o]);m.setInput(a,n.yy),n.yy.lexer=m,n.yy.parser=this,"undefined"==typeof m.yylloc&&(m.yylloc={});var k=m.yylloc;e.push(k);var q=m.options&&m.options.ranges;this.parseError="function"==typeof n.yy.parseError?n.yy.parseError:Object.getPrototypeOf(this).parseError;_token_stack:var s=function(){var a;return a=m.lex()||1,"number"!=typeof a&&(a=b.symbols_[a]||a),a};for(var t,u,v,w,x,y,z,A,B,C={};;){if(v=c[c.length-1],this.defaultActions[v]?w=this.defaultActions[v]:((null===t||"undefined"==typeof t)&&(t=s()),w=f[v]&&f[v][t]),"undefined"==typeof w||!w.length||!w[0]){var D="";for(y in B=[],f[v])this.terminals_[y]&&2<y&&B.push("'"+this.terminals_[y]+"'");D=m.showPosition?"Parse error on line "+(h+1)+":\n"+m.showPosition()+"\nExpecting "+B.join(", ")+", got '"+(this.terminals_[t]||t)+"'":"Parse error on line "+(h+1)+": Unexpected "+(1==t?"end of input":"'"+(this.terminals_[t]||t)+"'"),this.parseError(D,{text:m.match,token:this.terminals_[t]||t,line:m.yylineno,loc:k,expected:B})}if(w[0]instanceof Array&&1<w.length)throw new Error("Parse Error: multiple actions possible at state: "+v+", token: "+t);switch(w[0]){case 1:c.push(t),d.push(m.yytext),e.push(m.yylloc),c.push(w[1]),t=null,u?(t=u,u=null):(i=m.yyleng,g=m.yytext,h=m.yylineno,k=m.yylloc,0<j&&j--);break;case 2:if(z=this.productions_[w[1]][1],C.$=d[d.length-z],C._$={first_line:e[e.length-(z||1)].first_line,last_line:e[e.length-1].last_line,first_column:e[e.length-(z||1)].first_column,last_column:e[e.length-1].last_column},q&&(C._$.range=[e[e.length-(z||1)].range[0],e[e.length-1].range[1]]),x=this.performAction.apply(C,[g,i,h,n.yy,w[1],d,e].concat(l)),"undefined"!=typeof x)return x;z&&(c=c.slice(0,2*(-1*z)),d=d.slice(0,-1*z),e=e.slice(0,-1*z)),c.push(this.productions_[w[1]][0]),d.push(C.$),e.push(C._$),A=f[c[c.length-2]][c[c.length-1]],c.push(A);break;case 3:return!0;}}return!0}},va=function(){var a={EOF:1,parseError:function(a,b){if(this.yy.parser)this.yy.parser.parseError(a,b);else throw new Error(a)},setInput:function c(a,b){return this.yy=b||this.yy||{},this._input=a,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function c(){var a=this._input[0];this.yytext+=a,this.yyleng++,this.offset++,this.match+=a,this.matched+=a;var b=a.match(/(?:\r\n?|\n).*/g);return b?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),a},unput:function f(a){var b=a.length,c=a.split(/(?:\r\n?|\n)/g);this._input=a+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-b),this.offset-=b;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),c.length-1&&(this.yylineno-=c.length-1);var e=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:c?(c.length===d.length?this.yylloc.first_column:0)+d[d.length-c.length].length-c[0].length:this.yylloc.first_column-b},this.options.ranges&&(this.yylloc.range=[e[0],e[0]+this.yyleng-b]),this.yyleng=this.yytext.length,this},more:function a(){return this._more=!0,this},reject:function a(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},less:function b(a){this.unput(this.match.slice(a))},pastInput:function b(){var a=this.matched.substr(0,this.matched.length-this.match.length);return(20<a.length?"...":"")+a.substr(-20).replace(/\n/g,"")},upcomingInput:function b(){var a=this.match;return 20>a.length&&(a+=this._input.substr(0,20-a.length)),(a.substr(0,20)+(20<a.length?"...":"")).replace(/\n/g,"")},showPosition:function c(){var a=this.pastInput(),b=Array(a.length+1).join("-");return a+this.upcomingInput()+"\n"+b+"^"},test_match:function g(a,b){var c,d,e;if(this.options.backtrack_lexer&&(e={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(e.yylloc.range=this.yylloc.range.slice(0))),d=a[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+a[0].length},this.yytext+=a[0],this.match+=a[0],this.matches=a,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(a[0].length),this.matched+=a[0],c=this.performAction.call(this,this.yy,this,b,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),c)return c;if(this._backtrack){for(var f in e)this[f]=e[f];return!1}return!1},next:function g(){if(this.done)return this.EOF;this._input||(this.done=!0);var a,b,c,d;this._more||(this.yytext="",this.match="");for(var e=this._currentRules(),f=0;f<e.length;f++)if(c=this._input.match(this.rules[e[f]]),c&&(!b||c[0].length>b[0].length))if(b=c,d=f,this.options.backtrack_lexer){if(a=this.test_match(c,e[f]),!1!==a)return a;if(this._backtrack){b=!1;continue}else return!1}else if(!this.options.flex)break;return b?(a=this.test_match(b,e[d]),!1!==a&&a):""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var a=this.next();return a?a:this.lex()},begin:function(a){this.conditionStack.push(a)},popState:function(){var a=this.conditionStack.length-1;return 0<a?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(a){return a=this.conditionStack.length-1-Math.abs(a||0),0<=a?this.conditionStack[a]:"INITIAL"},pushState:function(a){this.begin(a)},stateStackSize:function(){return this.conditionStack.length},options:{flex:!0,"case-insensitive":!0},performAction:function(a,b,c,d){switch(c){case 0:break;case 1:break;case 2:break;case 3:return 81;break;case 4:return 14;break;case 5:return 12;break;case 6:return 93;break;case 7:return 94;break;case 8:return"<=";break;case 9:return">=";break;case 10:return 32;break;case 11:return 33;break;case 12:return 89;break;case 13:return 91;break;case 14:return 78;break;case 15:return 27;break;case 16:return 8;break;case 17:return 5;break;case 18:return 58;break;case 19:return 59;break;case 20:return 17;break;case 21:return 64;break;case 22:return 19;break;case 23:return 48;break;case 24:return 40;break;case 25:return 41;break;case 26:return 42;break;case 27:return 45;break;case 28:return 44;break;case 29:return 84;break;case 30:return 83;break;case 31:return 65;break;case 32:return 85;break;case 33:return 88;break;case 34:return"INTO";break;case 35:return"AS";break;case 36:return 52;break;case 37:return 55;break;case 38:return 54;break;case 39:return 53;break;case 40:return 69;break;case 41:return 70;break;case 42:return 62;break;case 43:return 34;break;case 44:return 35;break;case 45:return 37;break;case 46:return 36;break;case 47:return 38;break;case 48:return 39;break;case 49:return 30;break;case 50:return 30;break;case 51:return 31;break;case 52:return 31;break;case 53:return 63;break;case 54:return 71;break;case 55:return 16;break;case 56:return 72;break;case 57:return 43;break;case 58:return 21;break;case 59:return 26;break;case 60:return 28;break;case 61:return 75;break;case 62:console.log(b.yytext);}},rules:[/^(?:\s+)/i,/^(?:\/\/.*)/i,/^(?:\/\*(.|\n|\r)*?\*\/)/i,/^(?:\.\.\.)/i,/^(?:\+=)/i,/^(?:=)/i,/^(?:<\/)/i,/^(?:\/>)/i,/^(?:<=)/i,/^(?:>=)/i,/^(?:<&)/i,/^(?:&>)/i,/^(?:<)/i,/^(?:>)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:\[)/i,/^(?:\])/i,/^(?:\()/i,/^(?:\))/i,/^(?::)/i,/^(?:\.)/i,/^(?:,)/i,/^(?:;)/i,/^(?:\+)/i,/^(?:-)/i,/^(?:\*)/i,/^(?:%)/i,/^(?:\^)/i,/^(?:'(\\'|[^\'])*')/i,/^(?:"(\\"|[^\"])*")/i,/^(?:import)/i,/^(?:use)/i,/^(?:only)/i,/^(?:into)/i,/^(?:as)/i,/^(?:let)/i,/^(?:public)/i,/^(?:protected)/i,/^(?:private)/i,/^(?:true)/i,/^(?:false)/i,/^(?:return)/i,/^(?:is)/i,/^(?:isnt)/i,/^(?:lt)/i,/^(?:gt)/i,/^(?:gteq)/i,/^(?:lteq)/i,/^(?:&&)/i,/^(?:and)/i,/^(?:\|\|)/i,/^(?:or)/i,/^(?:!)/i,/^(?:[0-9]+(?:\.[0-9]+)?)/i,/^(?:[a-zA-Z_$][a-zA-Z0-9_\-$]*)/i,/^(?:\/(?:\\\/|[^\/])+\/[a-zA-Z]*)/i,/^(?:\/)/i,/^(?:`)/i,/^(?:\$\{)/i,/^(?:(\\`|[^\`]))/i,/^(?:$)/i,/^(?:.)/i],conditions:{INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62],inclusive:!0}}};return a}();return ua.lexer=va,a.prototype=ua,ua.Parser=a,new a}();"undefined"!=typeof require&&"undefined"!=typeof exports&&(exports.parser=parser,exports.Parser=parser.Parser,exports.parse=function(){return parser.parse.apply(parser,arguments)},exports.main=function(a){a[1]||(console.log("Usage: "+a[0]+" FILE"),process.exit(1));var b=require("fs").readFileSync(require("path").normalize(a[1]),"utf8");return exports.parser.parse(b)},"undefined"!=typeof module&&require.main===module&&exports.main(process.argv.slice(1)));

}).call(this,require('_process'))

},{"_process":8,"core-js/modules/es6.regexp.match":128,"core-js/modules/es6.regexp.replace":129,"core-js/modules/es6.regexp.split":130,"fs":1,"path":7}],14:[function(require,module,exports){
"use strict";require("core-js/modules/es6.regexp.replace"),module.exports=function(a){return"#!/usr/bin/env node\n\"use strict\";"+"\n\tglobal.__scopedir = __dirname;\n\trequire(\"source-map-support\").install();\n\tif (typeof global.scope === \"undefined\") {\n\t\tObject.defineProperty(global, \"scope\", {\n\t\t\tvalue: require(\"".concat(a,"/scopeRuntime.js\")\n\t\t});\n\t\tObject.defineProperty(global, \"ScopeApi\", {\n\t\t\tvalue: require(\"").concat(a,"/scopeRuntimeApi.js\")(scope)\n\t\t});\n\t\tObject.defineProperty(global, \"XRegExp\", {\n\t\t\tvalue: require(\"xregexp\")\n\t\t});\n\t}\n\tmodule.exports=").replace(/((?<!new|let|var|const|typeof)\s)+/g,"")};

},{"core-js/modules/es6.regexp.replace":129}],15:[function(require,module,exports){
(function (process,global){
"use strict";require("core-js/modules/es6.array.from"),require("core-js/modules/es6.regexp.replace"),require("core-js/modules/es6.regexp.constructor"),require("core-js/modules/es7.object.define-getter"),require("core-js/modules/es6.regexp.to-string"),require("core-js/modules/es7.symbol.async-iterator"),require("core-js/modules/es6.symbol"),require("core-js/modules/es6.weak-map"),require("core-js/modules/web.dom.iterable"),require("core-js/modules/es6.map");function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}function _toConsumableArray(a){return _arrayWithoutHoles(a)||_iterableToArray(a)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _arrayWithoutHoles(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}}function _slicedToArray(a,b){return _arrayWithHoles(a)||_iterableToArrayLimit(a,b)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}return c}function _arrayWithHoles(a){if(Array.isArray(a))return a}"undefined"!=typeof window&&"undefined"==typeof global&&(window.global=window);function hasType(a){function b(a){var b="",c="hasType(.., \"",d=0,f=e.length,g=a+12;10<a&&(d=a-10,c+="..",g+=2-d),a+5<e.length?(f=a+5,c+=e.substr(d,f)+"..\")"):c+=e.substr(d,f)+"\")";for(var h=0;h<g;h+=1)b+="-";return b+="^","\n      ".concat(c,"\n      ").concat(b)}function c(){var b=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"";return null==a?"null"===b:b instanceof Array?d(b):"object"===b||("map"===b?a instanceof Map||a instanceof NumericMap:"associative"===b||"numeric"===b?a.type===b:"regex"===b?a instanceof XRegExp||a instanceof RegEXP:"xregex"===b?a instanceof XRegExp:"scope"===b?!0===a._isScope:"js"===b?void 0===a.type&&void 0===a._isScope&&!(a instanceof XRegExp):typeof a===b)}function d(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:[];if(1===a.length)return c(e);for(var b,d=!1,f="|",g=0;g<a.length;g+=1){if(b=a[g],"&"===b||"|"===b){f=b;continue}if("&"===f){if(d){d=d&&c(b);continue}return!1}"|"===f&&(d=d||c(b))}return d}var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"";if("undefined"==typeof a)return!1;var f=[];f.parent=null;for(var g,h="",j=/\s/,k=0;k<e.length;k+=1)if(g=e[k],!j.test(g))switch(g){case"&":f.push(h),f.push("and"),h="";break;case"|":f.push(h),f.push("or"),h="";break;case"(":var l=[];0<h.length&&(console.log("Word before starting Paren at char:",k,"\nSolution: Use | or & before this group."),console.log(b(k)),process.exit()),l.parent=f,f.push(l),f=l;break;case")":null===f.parent&&(console.log("Extra Closing Paren at char:",k),console.log(b(k)),process.exit()),0<h.length&&(f.push(h),h=""),f=f.parent;break;default:h+=g;}return 0<h.length&&f.push(h),d(f)}var randStr=function(){for(var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:16,b="",c="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",d=0;d<a;d+=1)b+=c[Math.floor(Math.random()*c.length)];return b},indexRange=function(a,b,c){return"number"==typeof c?("number"!=typeof a&&(a=0),"number"!=typeof b&&(b=c),0>a&&(a=c+a,0>a&&(a=0)),0>b&&(b=c+b,0>b&&(b=0)),b>c&&(b=c),a>=b?[0,0]:[a,b]):[0,0]};Object.defineProperty(Map.prototype,"slice",{value:function(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:0,b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:this.size,c=this.entries(),d=[];if(0>a&&(a=this.size+a,0>a&&(a=0)),0>b&&(b=this.size+b,0>b&&(b=0)),b>this.size&&(b=this.size),a>=b)return scope.mapExpression();for(var e=0;e<a;e+=1)c.next();for(var f=a;f<b;f+=1)d.push(c.next().value);return scope.mapExpression.apply(scope,d)}});var createProxy=function(){var a=new WeakMap,b=/^\-?\d+$/,c={get:function q(c,d,e){var f=this;if("string"==typeof d&&b.test(d))return d=parseInt(d),c.get(d);if("toString"===d)return"associative"===a.get(f).type?function(){var b="map:".concat(a.get(f).type," {"),d=!0,e=!0,g=!1,h=void 0;try{for(var i,j=c[Symbol.iterator]();!(e=(i=j.next()).done);e=!0){var k=_slicedToArray(i.value,2),l=k[0],m=k[1];d?d=!1:b+=",",b+=" ".concat(l," => ").concat(m)}}catch(a){g=!0,h=a}finally{try{e||null==j.return||j.return()}finally{if(g)throw h}}return b+" }"}:c.toString;if("type"===d)return a.get(f).type;if(c.has(d))return c.get(d);if(d in c)return"function"==typeof c[d]?c[d].bind(c):c[d];if(hasType(e,"numeric")&&d in c.array)return console.log("found array operation:",d),c.array[d];var g=c.entries(),h=[],i=!0,j=!1,k=void 0;try{for(var l,m=g[Symbol.iterator]();!(i=(l=m.next()).done);i=!0){var n=_slicedToArray(l.value,2),o=n[0],p=n[1];"function"==typeof p[d]&&h.push([o,p])}}catch(a){j=!0,k=a}finally{try{i||null==m.return||m.return()}finally{if(j)throw k}}return 0===h.length?void 0:function(){for(var b=arguments.length,c=Array(b),e=0;e<b;e++)c[e]=arguments[e];return"numeric"===a.get(f).type?scope.arrayExpression.apply(scope,_toConsumableArray(h.map(function(a){var b;return(b=a[1])[d].apply(b,c)}))):scope.mapExpression.apply(scope,_toConsumableArray(h.map(function(a){var b;return[a[0],(b=a[1])[d].apply(b,c)]})))}},has:function c(a,b){return a.has(b)},set:function f(b,c,d){var e=this;return"type"===c?a.get(this).type:("associative"===a.get(e).type&&(b[c]=d),b.set(c,d))}};return function(b,d){var e=Object.create(c);return a.set(e,Object.create(null)),a.get(e).type=d,new Proxy(b,e)}}(),NumericMap=function(){function a(a,b){return function(){if(a.index<b.size)a.result.value=[a.index,b.get(a.index++)];else return a.index=0,{done:!0};return a.result}}function b(a,b){return function(){if(a.index<b.size)a.result.value=a.index++;else return a.index=0,{done:!0};return a.result}}function c(a,b){return function(){if(a.index<b.size)a.result.value=b.get(a.index++);else return a.index=0,{done:!0};return a.result}}var d=new WeakMap,e=function(){function e(f){_classCallCheck(this,e);var g=this,h={array:_toConsumableArray(f)};d.set(this,h),h.createKeyIterator=function(){return h.createIterator(b)},h.createValueIterator=function(){return h.createIterator(c)},h.createEntryIterator=function(){return h.createIterator(a)},h.createIterator=function(a){return{next:a({index:0,result:{value:void 0,done:!1}},g),[Symbol.iterator]:function(){return this}}}}return _createClass(e,[{key:"toString",value:function c(){for(var a="[",b=0;b<this.size;b+=1)0!=b&&(a+=", "),a+="".concat(this.get(b));return a+"]"}},{key:"get",value:function b(a){if(0!==this.size)return 0>a&&(a=a%this.size+this.size,a===this.size&&(a=0)),this.array[a]}},{key:"set",value:function c(a,b){return this.array[a]=b}},{key:"push",value:function b(){var a;return(a=this.array).push.apply(a,arguments)}},{key:"slice",value:function c(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:0,b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:this.size;return scope.arrayExpression.apply(scope,_toConsumableArray(this.array.slice(a,b)))}},{key:"delete",value:function b(a){return!!this.has(a)&&(this.array.splice(a,1),!0)}},{key:"clear",value:function a(){this.size=0}},{key:"entries",value:function a(){return d.get(this).createEntryIterator()}},{key:"keys",value:function a(){return d.get(this).createKeyIterator()}},{key:"values",value:function a(){return d.get(this).createValueIterator()}},{key:"has",value:function b(a){return"number"==typeof a&&0<=a&&a<this.size}},{key:"forEach",value:function k(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:this,c=!0,d=!1,e=void 0;try{for(var f,g=this[Symbol.iterator]();!(c=(f=g.next()).done);c=!0){var h=_slicedToArray(f.value,2),i=h[0],j=h[1];a.call(b,j,i,this)}}catch(a){d=!0,e=a}finally{try{c||null==g.return||g.return()}finally{if(d)throw e}}}},{key:Symbol.iterator,value:function a(){return d.get(this).createEntryIterator()}},{key:"type",get:function a(){return"numeric"}},{key:"array",get:function a(){return d.get(this).array},set:function b(a){return a instanceof Array?d.get(this).array=a:d.get(this).array}},{key:"size",get:function a(){return this.array.length},set:function b(a){return this.array.length=a}}]),e}();return e}(),Scope=function(){function a(){var b=this;_classCallCheck(this,a);this;this._scoping={let:this.mapExpression(),private:this.mapExpression(),protected:this.mapExpression(),public:this.mapExpression(),parent:null},this.userTags=this.mapExpression();var c=require("hyperscript");this.xmlExpression=function(d,e){function f(a){var b="",c=!0,d=!1,e=void 0;try{for(var g,h=a[Symbol.iterator]();!(c=(g=h.next()).done);c=!0){var i=_slicedToArray(g.value,2),j=i[0],k=i[1];b+="".concat(j,"{");var l=0,m=!1,n=!0,o=!1,p=void 0;try{for(var q,r=k[Symbol.iterator]();!(n=(q=r.next()).done);n=!0){var s=_slicedToArray(q.value,2),t=s[0],u=s[1];u instanceof Map?(b+="}".concat(f(new Map([[j+t,u]]))),l+1<k.size?b+="".concat(j,"{"):m=!0):b+="".concat(t,":").concat(u,";"),l+=1}}catch(a){o=!0,p=a}finally{try{n||null==r.return||r.return()}finally{if(o)throw p}}m||(b+="}")}}catch(a){d=!0,e=a}finally{try{c||null==h.return||h.return()}finally{if(d)throw e}}return b}for(var g=arguments.length,h=Array(2<g?g-2:0),j=2;j<g;j++)h[j-2]=arguments[j];var k;if("style"!==d&&"script"!==d){for(var l,m=[],n=0;n<h.length;n+=1)l=h[n],l instanceof NumericMap||l instanceof Map?m.push.apply(m,_toConsumableArray(l.values())):m.push(l);h=m}if(b.userTags.has(d.toLowerCase())&&"undefined"!=typeof window){var w=b.mapExpression();for(var x in e)w[x]=e[x];var y=c.apply(void 0,[d,e].concat(_toConsumableArray(h)));return $(y).data("rawAttributes",w),y}for(var z in k="style"===d&&h[0]instanceof Map?c(d,[f(h[0])]):"script"===d?c.apply(void 0,[d].concat(_toConsumableArray(h))):c.apply(void 0,[d].concat(_toConsumableArray(h))),("style"===d||"script"===d)&&(k.__defineGetter__("textContent",function(){return this.childNodes[0].value}),k.__defineGetter__("innerHTML",function(){return this.textContent}),k.__defineGetter__("outerHTML",function(){return"<".concat(d,">").concat(this.innerHTML,"</").concat(d,">")})),e){var a="";if("style"==z&&e[z]instanceof Map){var o=!0,p=!1,q=void 0;try{for(var r,s=e[z][Symbol.iterator]();!(o=(r=s.next()).done);o=!0){var t=_slicedToArray(r.value,2),u=t[0],v=t[1];a+="".concat(u,":").concat(v,";")}}catch(a){p=!0,q=a}finally{try{o||null==s.return||s.return()}finally{if(p)throw q}}}else if("pattern"==z&&e[z]instanceof RegExp){var A=e[z].toString();a=A.substr(1,A.lastIndexOf("/")-1)}else a=e[z];if("function"==typeof a){var B="scope.createScope(".concat(a._originalFunction.toString(),")");a="".concat(B,"(event)")}k.setAttribute(z,a)}return k.toString=function(){return"style"===k.tagName?k.outerHTML.replace(/gt\;/,">"):k.outerHTML},k.get=function(a){return"function"==typeof k[a]?k[a].bind(k):k[a]},k.childNodes.get=function(a){return"function"==typeof k.childNodes[a]?k.childNodes[a].bind(k):k.childNodes[a]},k}}return _createClass(a,[{key:"arrayExpression",value:function d(){for(var a=arguments.length,b=Array(a),c=0;c<a;c++)b[c]=arguments[c];return createProxy(new NumericMap(b),"numeric")}},{key:"mapExpression",value:function i(){for(var a=arguments.length,b=Array(a),c=0;c<a;c++)b[c]=arguments[c];for(var d=new Map(b),e=0;e<b.length;e++){var f=_slicedToArray(b[e],2),g=f[0],h=f[1];d[g]=h}return createProxy(d,"associative")}},{key:"assignmentExpression",value:function u(a,b){var c,d,e=2<arguments.length&&void 0!==arguments[2]?arguments[2]:this._scoping,f=this,g=_slicedToArray(b,2),h=g[0],j=g[1];if(!(1<a.length))c=a[a.length-1],e.let.has(c)&&(d=e.let),e.private.has(c)&&(d=e.private),e.protected.has(c)&&(d=e.protected),e.public.has(c)&&(d=e.public);else if(2===a.length){var k=_slicedToArray(a,2);d=k[0],c=k[1]}else if(3===a.length){d=a[0];var l=indexRange(a[1],a[2],d.size),m=_slicedToArray(l,2),n=m[0],o=m[1];if(d instanceof NumericMap){for(var p=f.arrayExpression(),q=n;q<o;q+=1)p.array.push(f.assignmentExpression([d,q],b,e));return p}if(d instanceof Map){for(var r=f.mapExpression(),s=d.keys(),t=0;t<n;t+=1)s.next();for(var v,w=n;w<o;w+=1)v=s.next().value,r.set(v,f.assignmentExpression([d,v],b,e));return r}throw new Error("Unexpected Range Assignment `[:]` on non-map.")}if(void 0!==d)switch(h){case"=":return d.set?(d.set(c,j),d.get(c)):d[c]=j;case"+=":return d.set(c,f.binaryExpression("+",d.get(c),j)),d.get(c);case"[]=":return f.binaryExpression("<&",d.get(c),j);case"*=":return d.set(c,f.binaryExpression("*",d.get(c),j)),d.get(c);default:throw new Error("Assignment Operator '".concat(h,"' is not implemented"));}if(e.parent)return f.assignmentExpression([c],b,e.parent);throw new Error("Identifier '".concat(c,"' is not defined"))}},{key:"binaryExpression",value:function k(c,d,a){this;switch(c){case"&&":return d&&a;case"||":return d||a;case"===":return d===a;case"!==":return d!==a;case">":return d>a;case"<":return d<a;case">=":return d>=a;case"<=":return d<=a;case"&>":if(console.log("&>:",d,a),hasType(a,"numeric"))return a.push(d),a;if(hasType(a,"string"));throw new Error("Attempt to push on incompatible type: '".concat(d,"' &> '").concat(a,"'"));break;case"<&":if(hasType(d,"numeric"))return d.push(a),d;throw new Error("Attempt to push on incompatible type: '".concat(d,"' <& '").concat(a,"'"));break;case"+":if(hasType(d,"string|number")&&hasType(a,"string|number"))return d+a;if(hasType(d,"numeric")){var l=this.arrayExpression.apply(this,_toConsumableArray(d.array));return l.push(a),l}throw new Error("Attempt to add incompatible types: '".concat(d,"' + '").concat(a,"'"));case"-":return d-a;case"*":if("number"!=typeof a&&(a=1),"number"==typeof d)return d*a;if("string"==typeof d){for(var e="",f=0;f<a;f+=1)e+=d;return e}if(d instanceof NumericMap){for(var g=scope.arrayExpression(),h=0;h<a;h+=1)for(var m=0;m<d.size;m+=1)g.push(d[m]);return g}throw new Error("Attempt to multiply incompatible types: '".concat(d,"' + '").concat(a,"'"));case"/":return d/a;case"^":return d^a;case"%":return d%a;}}},{key:"declarationExpression",value:function k(a){var b,c=a.type,d=a.name,e=a.value,f=this;if(d instanceof Array){if(null!==e&&"function"==typeof e[Symbol.iterator]){for(var g,h=[],j=0;j<d.length;j+=1)g=void 0,g=e.length<=j?void 0:e[j],h.push(f.declarationExpression({type:c,name:d[j],value:g}));return f.arrayExpression.apply(f,h)}throw new Error("Attempt to iterate over non-iterable during declaration")}if("let"===c){if(f._scoping.let.has(d))throw new Error("Identifier '".concat(d,"' has already been declared"));b=f._scoping.let}if("private"===c){if(f._scoping.private.has(d))throw new Error("Identifier '".concat(d,"' has already been declared"));b=f._scoping.private}if("protected"===c){if(f._scoping.protected.has(d))throw new Error("Identifier '".concat(d,"' has already been declared"));b=f._scoping.protected}if("public"===c){if(f._scoping.public.has(d))throw new Error("Identifier '".concat(d,"' has already been declared"));b=f._scoping.public}return b.set(d,e),e}},{key:"dereferenceIdentifier",value:function d(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:this._scoping,c=this;return b.let.has(a)?b.let.delete(a):b.private.has(a)?b.private.delete(a):b.protected.has(a)?b.protected.delete(a):b.public.has(a)?b.public.delete(a):!!b.parent&&c.dereferenceIdentifier(a,b.parent)}},{key:"identifier",value:function d(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:this._scoping,c=this;return b.let.has(a)?b.let.get(a):b.private.has(a)?b.private.get(a):b.protected.has(a)?b.protected.get(a):b.public.has(a)?b.public.get(a):b.parent?c.identifier(a,b.parent):global[a]}},{key:"createScope",value:function e(a){var b=this,c=function(){for(var c=arguments.length,d=Array(c),e=0;e<c;e++)d[e]=arguments[e];var f=this;return b.invokeExpression({function:a,arguments:d,context:f,isExtension:a._beingUsed})},d=function(b,d){return Object.defineProperty(c,b,{get:function c(){return a[b]},set:function d(c){return a[b]=c}}),c[b]=d};return d("_isScope",!0),d("_parent",b._scoping),d("_beingUsed",!1),d("_originalFunction",a),c}},{key:"invokeExpression",value:function d(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{function:function a(){},arguments:[],context:this,isExtension:!1};if(!a.function._isScope)return a.function.apply(a.context,a.arguments);var b=this._scoping;if(void 0===a.function)throw new Error("Call to undefined scope");this._scoping={parent:a.function._parent,let:this.mapExpression(),private:this.mapExpression(),protected:this.mapExpression(),public:this.mapExpression()};var c=a.function(a.arguments);return void 0===c&&(!0===a.isExtension?c=this.mapExpression(["public",this._scoping.public],["protected",this._scoping.protected]):c=this._scoping.public),this._scoping=b,c}},{key:"import",value:function c(a){var b=require.resolve(a);return delete require.cache[b],require(b)}},{key:"use",value:function d(a,b){var c=this;a.forEach(function(a){if("function"!=typeof a)throw new Error("Attempt to use non-scope");a._beingUsed=!0;var d=a();if(a._beingUsed=!1,!(d instanceof Map))throw new Error("Attempt to use scope returning non-map");if(d.get("protected")instanceof Map){var e=!0,f=!1,g=void 0;try{for(var h,i=d.get("protected")[Symbol.iterator]();!(e=(h=i.next()).done);e=!0){var j=_slicedToArray(h.value,2),k=j[0],l=j[1];(void 0===b||-1!==b.indexOf(k))&&c._scoping.protected.set(k,l)}}catch(a){f=!0,g=a}finally{try{e||null==i.return||i.return()}finally{if(f)throw g}}}if(d.get("public")instanceof Map){var m=!0,n=!1,o=void 0;try{for(var p,q=d.get("public")[Symbol.iterator]();!(m=(p=q.next()).done);m=!0){var r=_slicedToArray(p.value,2),k=r[0],l=r[1];(void 0===b||-1!==b.indexOf(k))&&c._scoping.public.set(k,l)}}catch(a){n=!0,o=a}finally{try{m||null==q.return||q.return()}finally{if(n)throw o}}}})}}]),a}(),scope=new Scope({});module.exports=scope;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":8,"core-js/modules/es6.array.from":122,"core-js/modules/es6.map":124,"core-js/modules/es6.regexp.constructor":126,"core-js/modules/es6.regexp.replace":129,"core-js/modules/es6.regexp.to-string":131,"core-js/modules/es6.symbol":132,"core-js/modules/es6.weak-map":133,"core-js/modules/es7.object.define-getter":134,"core-js/modules/es7.symbol.async-iterator":136,"core-js/modules/web.dom.iterable":137,"hyperscript":138}],16:[function(require,module,exports){
(function (Buffer){
"use strict";require("core-js/modules/es7.promise.finally"),require("core-js/modules/es6.promise"),require("core-js/modules/es6.regexp.replace"),require("core-js/modules/es6.regexp.match"),require("core-js/modules/es7.symbol.async-iterator"),require("core-js/modules/es6.symbol"),require("core-js/modules/es6.regexp.to-string"),require("core-js/modules/web.dom.iterable"),require("core-js/modules/es6.map");function _slicedToArray(a,b){return _arrayWithHoles(a)||_iterableToArrayLimit(a,b)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}return c}function _arrayWithHoles(a){if(Array.isArray(a))return a}var fs=require("fs"),path=require("path"),ScopeParser=require("./ScopeParser.js");module.exports=function(scope){var userTags=scope.userTags,ScopeApi={print:function e(a){for(var b,c=[],d=0;d<a.length;d+=1)a[d]instanceof Map||a[d]instanceof scope.arrayExpression().__proto__.constructor?c.push(a[d].toString()):c.push(a[d]);(b=console).log.apply(b,c)},createTag:function c(a,b){userTags[a.toLowerCase()]=b},getTag:function b(a){return userTags[a.toLowerCase()]},getAllTags:function a(){return userTags},debug:function b(a){a.forEach(function(a){ScopeApi.print([ScopeApi.__debugReturn(a)])})},__debugReturn:function __debugReturn(value){var spaces=1<arguments.length&&void 0!==arguments[1]?arguments[1]:2,result="",spacef=function(){for(var a="",b=0;b<spaces;b+=1)a+=" ";return a};if("object"==typeof value&&value instanceof Map){result+="Map(";var _iteratorNormalCompletion=!0,_didIteratorError=!1,_iteratorError=void 0;try{for(var _step,_iterator=value[Symbol.iterator]();!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=!0){var _step$value=_slicedToArray(_step.value,2),key=_step$value[0],val=_step$value[1];result+="\n".concat(spacef()).concat(key," => ").concat(ScopeApi.__debugReturn(val,spaces+2))}}catch(a){_didIteratorError=!0,_iteratorError=a}finally{try{_iteratorNormalCompletion||null==_iterator.return||_iterator.return()}finally{if(_didIteratorError)throw _iteratorError}}return"".concat(result,")")}if("function"==typeof value){var source=value.toString(),args=source.match(/^\(args\=(\[.*\])\)/);return args=args[1]?eval(args[1]):[],result+="Scope([",args.forEach(function(a){result+="\n".concat(spacef(),"(").concat(typeof a.value,") ").concat(a.key,": ").concat(ScopeApi.__debugReturn(a.value,spaces+2))}),"".concat(result,"])")}return"string"==typeof value?"\"".concat(value,"\""):value},dereference:function d(a,b){var c;return void 0===b?b=a:c=a,c instanceof Map||c instanceof scope.arrayExpression().__proto__.constructor?c.delete(b):scope.dereferenceIdentifier(b)},if:function j(a){var b=_slicedToArray(a,4),c=b[0],d=b[1],e=void 0===d?function(){}:d,f=b[2],g=void 0===f?function(){}:f,h=b[3],i=void 0===h||h;return c?i&&"function"==typeof e?e():e:i&&"function"==typeof g?g():g},each:function t(a){var b=_slicedToArray(a,2),c=b[0],d=b[1],e=void 0===d?function(){}:d,f=!1,g=function(){f=!0};if("numeric"===c.type){for(var h=[],j=0;j<c.size&&(h.push(e(c.get(j),j,g)),!f);j+=1);return scope.arrayExpression.apply(scope,h)}var k=scope.mapExpression(),l=!0,m=!1,n=void 0;try{for(var o,p=c[Symbol.iterator]();!(l=(o=p.next()).done);l=!0){var q=_slicedToArray(o.value,2),r=q[0],s=q[1];if(k.set(r,e(s,r,g)),f)break}}catch(a){m=!0,n=a}finally{try{l||null==p.return||p.return()}finally{if(m)throw n}}return k},toJS:function n(a){var b;if("object"!=typeof a||null===a)return a;if(a instanceof Map){b={};var c=!0,d=!1,e=void 0;try{for(var f,g=a[Symbol.iterator]();!(c=(f=g.next()).done);c=!0){var h=_slicedToArray(f.value,2),j=h[0],k=h[1];b[j]=ScopeApi.toJS(k)}}catch(a){d=!0,e=a}finally{try{c||null==g.return||g.return()}finally{if(d)throw e}}return b}if(a instanceof scope.arrayExpression().__proto__.constructor){for(var l=[],m=0;m<a.size;m+=1)l.push(ScopeApi.toJS(a[m]));return l}return null},toJSON:function b(a){return JSON.stringify(ScopeApi.toJS(a))},BSONtoMap:function c(a){var b;if("object"!=typeof a||Buffer.isBuffer(a)||"_bsontype"in a)return a;if(null===a)return!1;if(a instanceof Array){b=scope.arrayExpression();for(var d=0;d<a.length;d+=1)b[d]=ScopeApi.BSONtoMap(a[d]);return b}for(var e in b=scope.mapExpression(),a)Object.hasOwnProperty.call(a,e)&&(b[e]=ScopeApi.BSONtoMap(a[e]));return b},eval:function _eval(code){var parser=new ScopeParser,translation=parser.translate(code);return eval(translation.code)},compile:function e(a){var b=new ScopeParser,c=path.join(__scopedir,a),d=c.replace(/\.sc$/,".js");return new ScopeApi.promise(function(a,e){fs.readFile(c,"utf8",function(f,g){f&&e("Could not read file ".concat(c,".\n").concat(f));var h=b.translate(g,c,d);fs.writeFile(d,h.code,function(b){b&&e("Could not write to file ".concat(d,".\n").concat(b));var c=scope.import(d);a(c)})})})},promise:function d(a){var b=new Promise(function(b,c){a(b,c)}),c=scope.mapExpression();return c.set("then",function(a){b.then(function(b){a(b)})}),c.set("catch",function(a){b.catch(function(b){a(b)})}),c.set("finally",function(a){b.finally(function(){a()})}),c.originalPromise=b,c}};return ScopeApi.promise.get=function(a){return ScopeApi.promise[a]},ScopeApi.promise.all=function(a){var b=[],c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done);d=!0){var i=_slicedToArray(g.value,2),j=i[0],k=i[1],l=void 0;l=void 0===k.originalPromise?k:k.originalPromise,b.push(l),c.push(j)}}catch(a){e=!0,f=a}finally{try{d||null==h.return||h.return()}finally{if(e)throw f}}var m=Promise.all(b),n=scope.mapExpression();return n.set("then",function(a){m.then(function(b){for(var d=scope.mapExpression(),e=0;e<b.length;e+=1)d.set(c[e],b[e]);a(d)})}),n.set("catch",function(a){m.catch(function(b){a(b)})}),n.set("finally",function(a){m.finally(function(){a()})}),n},ScopeApi.print=scope.createScope(ScopeApi.print),ScopeApi.debug=scope.createScope(ScopeApi.debug),ScopeApi.if=scope.createScope(ScopeApi.if),ScopeApi.each=scope.createScope(ScopeApi.each),ScopeApi};

}).call(this,{"isBuffer":require("../../../.nvm/versions/node/v10.5.0/lib/node_modules/browserify/node_modules/is-buffer/index.js")})

},{"../../../.nvm/versions/node/v10.5.0/lib/node_modules/browserify/node_modules/is-buffer/index.js":6,"./ScopeParser.js":11,"core-js/modules/es6.map":124,"core-js/modules/es6.promise":125,"core-js/modules/es6.regexp.match":128,"core-js/modules/es6.regexp.replace":129,"core-js/modules/es6.regexp.to-string":131,"core-js/modules/es6.symbol":132,"core-js/modules/es7.promise.finally":135,"core-js/modules/es7.symbol.async-iterator":136,"core-js/modules/web.dom.iterable":137,"fs":1,"path":7}],17:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],18:[function(require,module,exports){
(function (Buffer){
var toString = Object.prototype.toString

var isModern = (
  typeof Buffer.alloc === 'function' &&
  typeof Buffer.allocUnsafe === 'function' &&
  typeof Buffer.from === 'function'
)

function isArrayBuffer (input) {
  return toString.call(input).slice(8, -1) === 'ArrayBuffer'
}

function fromArrayBuffer (obj, byteOffset, length) {
  byteOffset >>>= 0

  var maxLength = obj.byteLength - byteOffset

  if (maxLength < 0) {
    throw new RangeError("'offset' is out of bounds")
  }

  if (length === undefined) {
    length = maxLength
  } else {
    length >>>= 0

    if (length > maxLength) {
      throw new RangeError("'length' is out of bounds")
    }
  }

  return isModern
    ? Buffer.from(obj.slice(byteOffset, byteOffset + length))
    : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)))
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  return isModern
    ? Buffer.from(string, encoding)
    : new Buffer(string, encoding)
}

function bufferFrom (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return isModern
    ? Buffer.from(value)
    : new Buffer(value)
}

module.exports = bufferFrom

}).call(this,require("buffer").Buffer)

},{"buffer":4}],19:[function(require,module,exports){
// contains, add, remove, toggle
var indexof = require('indexof')

module.exports = ClassList

function ClassList(elem) {
    var cl = elem.classList

    if (cl) {
        return cl
    }

    var classList = {
        add: add
        , remove: remove
        , contains: contains
        , toggle: toggle
        , toString: $toString
        , length: 0
        , item: item
    }

    return classList

    function add(token) {
        var list = getTokens()
        if (indexof(list, token) > -1) {
            return
        }
        list.push(token)
        setTokens(list)
    }

    function remove(token) {
        var list = getTokens()
            , index = indexof(list, token)

        if (index === -1) {
            return
        }

        list.splice(index, 1)
        setTokens(list)
    }

    function contains(token) {
        return indexof(getTokens(), token) > -1
    }

    function toggle(token) {
        if (contains(token)) {
            remove(token)
            return false
        } else {
            add(token)
            return true
        }
    }

    function $toString() {
        return elem.className
    }

    function item(index) {
        var tokens = getTokens()
        return tokens[index] || null
    }

    function getTokens() {
        var className = elem.className

        return filter(className.split(" "), isTruthy)
    }

    function setTokens(list) {
        var length = list.length

        elem.className = list.join(" ")
        classList.length = length

        for (var i = 0; i < list.length; i++) {
            classList[i] = list[i]
        }

        delete list[length]
    }
}

function filter (arr, fn) {
    var ret = []
    for (var i = 0; i < arr.length; i++) {
        if (fn(arr[i])) ret.push(arr[i])
    }
    return ret
}

function isTruthy(value) {
    return !!value
}

},{"indexof":139}],20:[function(require,module,exports){
'use strict';

var path            =  require('path');
var convert         =  require('convert-source-map');
var memoize         =  require('lodash.memoize');
var createGenerator =  require('inline-source-map');
var pathIsAbsolute  =  require('./lib/path-is-absolute');
var mappingsFromMap =  require('./lib/mappings-from-map');

var protocolRx = /^[a-z]+:\/\//;

/**
 * Rebases a relative path in 'sourceFile' to be relative
 * to the path where 'sourceFile' is located.
 *
 * This is necessary before adding relative paths to the
 * new combined map to ensure all paths are relative to their
 * original source.
 *
 * The 'sourceRoot' from the original source map is joined
 * as well to ensure the complete path.
 *
 * Resulting paths that are absolute are passed along directly.
 *
 * @param sourceFile {String} path to the original source file that references a map
 * @param relativeRoot {String} sourceRoot in sourceFile's map to combine with relativePath
 * @param relativePath {String} source path from sourceFile's map
 */
var rebaseRelativePath = memoize(function(sourceFile, relativeRoot, relativePath) {
  if (!relativePath) {
    return relativePath;
  }

  // join relative path to root (e.g. 'src/' + 'file.js')
  var relativeRootedPath = relativeRoot ? path.join(relativeRoot, relativePath) : relativePath;
  relativeRootedPath = relativeRootedPath.replace(/\\/g, '/');
  sourceFile = sourceFile.replace(/\\/g, '/');

  if (sourceFile === relativeRootedPath ||    // same path,
      pathIsAbsolute(relativeRootedPath) ||   // absolute path, nor
      protocolRx.test(relativeRootedPath)) {  // absolute protocol need rebasing
    return relativeRootedPath;
  }

  // make relative to source file
  return path.join(path.dirname(sourceFile), relativeRootedPath).replace(/\\/g, '/');
}, function(a, b, c) {
  return a + '::' + b + '::' + c;
});

function resolveMap(source) {
  var gen = convert.fromSource(source);
  return gen ? gen.toObject() : null;
}

function hasInlinedSource(existingMap) {
  return existingMap.sourcesContent && !!existingMap.sourcesContent[0];
}

function Combiner(file, sourceRoot) {
  // since we include the original code in the map sourceRoot actually not needed
  this.generator = createGenerator({ file: file || 'generated.js', sourceRoot: sourceRoot });
}

Combiner.prototype._addGeneratedMap = function (sourceFile, source, offset) {
  this.generator.addGeneratedMappings(sourceFile, source, offset);
  this.generator.addSourceContent(sourceFile, source);
  return this;
};

Combiner.prototype._addExistingMap = function (sourceFile, source, existingMap, offset) {
  var mappings = mappingsFromMap(existingMap);

  // add all of the sources from the map
  for (var i = 0, len = existingMap.sources.length; i < len; i++) {
    if (!existingMap.sourcesContent) continue;

    this.generator.addSourceContent(
      rebaseRelativePath(sourceFile, existingMap.sourceRoot, existingMap.sources[i]),
      existingMap.sourcesContent[i]);
  }

  // add the mappings, preserving the original mapping 'source'
  mappings.forEach(function(mapping) {
    // Add the mappings one at a time because 'inline-source-map' doesn't handle
    // mapping source filenames. The mapping.source already takes sourceRoot into account
    // per the SMConsumer.eachMapping function, so pass null for the root here.
    this.generator.addMappings(
      rebaseRelativePath(sourceFile, null, mapping.source), [mapping], offset);
  }, this);

  return this;
};

/**
 * Adds map to underlying source map.
 * If source contains a source map comment that has the source of the original file inlined it will offset these
 * mappings and include them.
 * If no source map comment is found or it has no source inlined, mappings for the file will be generated and included
 *
 * @name addMap
 * @function
 * @param opts {Object} { sourceFile: {String}, source: {String} }
 * @param offset {Object} { line: {Number}, column: {Number} }
 */
Combiner.prototype.addFile = function (opts, offset) {

  offset = offset || {};
  if (!offset.hasOwnProperty('line'))  offset.line    =  0;
  if (!offset.hasOwnProperty('column')) offset.column =  0;

  var existingMap = resolveMap(opts.source);

  return existingMap && hasInlinedSource(existingMap)
    ? this._addExistingMap(opts.sourceFile, opts.source, existingMap, offset)
    : this._addGeneratedMap(opts.sourceFile, opts.source, offset);
};

/**
* @name base64
* @function
* @return {String} base64 encoded combined source map
*/
Combiner.prototype.base64 = function () {
  return this.generator.base64Encode();
};

/**
 * @name comment
 * @function
 * @return {String} base64 encoded sourceMappingUrl comment of the combined source map
 */
Combiner.prototype.comment = function () {
  return this.generator.inlineMappingUrl();
};

/**
 * @name create
 * @function
 * @param file {String} optional name of the generated file
 * @param sourceRoot {String} optional sourceRoot of the map to be generated
 * @return {Object} Combiner instance to which source maps can be added and later combined
 */
exports.create = function (file, sourceRoot) { return new Combiner(file, sourceRoot); };

/**
 * @name removeComments
 * @function
 * @param src
 * @return {String} src with all sourceMappingUrl comments removed
 */
exports.removeComments = function (src) {
  if (!src.replace) return src;
  return src.replace(convert.commentRegex, '').replace(convert.mapFileCommentRegex, '');
};

},{"./lib/mappings-from-map":21,"./lib/path-is-absolute":22,"convert-source-map":23,"inline-source-map":140,"lodash.memoize":152,"path":7}],21:[function(require,module,exports){
var SMConsumer  =  require('source-map').SourceMapConsumer;

/**
 * @name mappingsFromMap
 * @function
 * @param map {Object} the JSON.parse()'ed map
 * @return {Array} array of mappings
 */
module.exports = function (map) {
  var consumer = new SMConsumer(map);
  var mappings = [];

  consumer.eachMapping(function (mapping) {
    // only set source if we have original position to handle edgecase (see inline-source-map tests)
    mappings.push({
      original: mapping.originalColumn != null ? {
        column: mapping.originalColumn
      , line: mapping.originalLine
      } : undefined
    , generated: {
        column: mapping.generatedColumn
      , line: mapping.generatedLine
      }
    , source: mapping.originalColumn != null ? mapping.source : undefined
    , name: mapping.name
    });
  });

  return mappings;
}

},{"source-map":34}],22:[function(require,module,exports){
(function (process){
'use strict';

function posix(path) {
	return path.charAt(0) === '/';
};

function win32(path) {
	// https://github.com/joyent/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = !!device && device.charAt(1) !== ':';

	// UNC paths are always absolute
	return !!result[2] || isUnc;
};

module.exports = process.platform === 'win32' ? win32 : posix;
module.exports.posix = posix;
module.exports.win32 = win32;
}).call(this,require('_process'))

},{"_process":8}],23:[function(require,module,exports){
(function (Buffer){
'use strict';
var fs = require('fs');
var path = require('path');

var commentRx = /^\s*\/(?:\/|\*)[@#]\s+sourceMappingURL=data:(?:application|text)\/json;(?:charset[:=]\S+;)?base64,(.*)$/mg;
var mapFileCommentRx =
  //Example (Extra space between slashes added to solve Safari bug. Exclude space in production):
  //     / /# sourceMappingURL=foo.js.map           
  /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^\*]+?)[ \t]*(?:\*\/){1}[ \t]*$)/mg

function decodeBase64(base64) {
  return new Buffer(base64, 'base64').toString();
}

function stripComment(sm) {
  return sm.split(',').pop();
}

function readFromFileMap(sm, dir) {
  // NOTE: this will only work on the server since it attempts to read the map file

  var r = mapFileCommentRx.exec(sm);
  mapFileCommentRx.lastIndex = 0;

  // for some odd reason //# .. captures in 1 and /* .. */ in 2
  var filename = r[1] || r[2];
  var filepath = path.join(dir, filename);

  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    throw new Error('An error occurred while trying to read the map file at ' + filepath + '\n' + e);
  }
}

function Converter (sm, opts) {
  opts = opts || {};

  if (opts.isFileComment) sm = readFromFileMap(sm, opts.commentFileDir);
  if (opts.hasComment) sm = stripComment(sm);
  if (opts.isEncoded) sm = decodeBase64(sm);
  if (opts.isJSON || opts.isEncoded) sm = JSON.parse(sm);

  this.sourcemap = sm;
}

function convertFromLargeSource(content){
  var lines = content.split('\n');
  var line;
  // find first line which contains a source map starting at end of content
  for (var i = lines.length - 1; i > 0; i--) {
    line = lines[i]
    if (~line.indexOf('sourceMappingURL=data:')) return exports.fromComment(line);
  }
}

Converter.prototype.toJSON = function (space) {
  return JSON.stringify(this.sourcemap, null, space);
};

Converter.prototype.toBase64 = function () {
  var json = this.toJSON();
  return new Buffer(json).toString('base64');
};

Converter.prototype.toComment = function (options) {
  var base64 = this.toBase64();
  var data = 'sourceMappingURL=data:application/json;base64,' + base64;
  return options && options.multiline ? '/*# ' + data + ' */' : '//# ' + data;
};

// returns copy instead of original
Converter.prototype.toObject = function () {
  return JSON.parse(this.toJSON());
};

Converter.prototype.addProperty = function (key, value) {
  if (this.sourcemap.hasOwnProperty(key)) throw new Error('property %s already exists on the sourcemap, use set property instead');
  return this.setProperty(key, value);
};

Converter.prototype.setProperty = function (key, value) {
  this.sourcemap[key] = value;
  return this;
};

Converter.prototype.getProperty = function (key) {
  return this.sourcemap[key];
};

exports.fromObject = function (obj) {
  return new Converter(obj);
};

exports.fromJSON = function (json) {
  return new Converter(json, { isJSON: true });
};

exports.fromBase64 = function (base64) {
  return new Converter(base64, { isEncoded: true });
};

exports.fromComment = function (comment) {
  comment = comment
    .replace(/^\/\*/g, '//')
    .replace(/\*\/$/g, '');

  return new Converter(comment, { isEncoded: true, hasComment: true });
};

exports.fromMapFileComment = function (comment, dir) {
  return new Converter(comment, { commentFileDir: dir, isFileComment: true, isJSON: true });
};

// Finds last sourcemap comment in file or returns null if none was found
exports.fromSource = function (content, largeSource) {
  if (largeSource) {
    var res = convertFromLargeSource(content);
    return res ? res : null;
  }

  var m = content.match(commentRx);
  commentRx.lastIndex = 0;
  return m ? exports.fromComment(m.pop()) : null;
};

// Finds last sourcemap comment in file or returns null if none was found
exports.fromMapFileSource = function (content, dir) {
  var m = content.match(mapFileCommentRx);
  mapFileCommentRx.lastIndex = 0;
  return m ? exports.fromMapFileComment(m.pop(), dir) : null;
};

exports.removeComments = function (src) {
  commentRx.lastIndex = 0;
  return src.replace(commentRx, '');
};

exports.removeMapFileComments = function (src) {
  mapFileCommentRx.lastIndex = 0;
  return src.replace(mapFileCommentRx, '');
};

Object.defineProperty(exports, 'commentRegex', {
  get: function getCommentRegex () {
    commentRx.lastIndex = 0;
    return commentRx;
  }
});

Object.defineProperty(exports, 'mapFileCommentRegex', {
  get: function getMapFileCommentRegex () {
    mapFileCommentRx.lastIndex = 0;
    return mapFileCommentRx;
  }
});

}).call(this,require("buffer").Buffer)

},{"buffer":4,"fs":1,"path":7}],24:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;

},{"./util":33}],25:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = require('./base64');

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

},{"./base64":26}],26:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
exports.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

},{}],27:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};

},{}],28:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

exports.MappingList = MappingList;

},{"./util":33}],29:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
exports.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

},{}],30:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap)
    : new BasicSourceMapConsumer(sourceMap);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      if (source != null && sourceRoot != null) {
        source = util.join(sourceRoot, source);
      }
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: Optional. the column number in the original source.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    if (this.sourceRoot != null) {
      needle.source = util.relative(this.sourceRoot, needle.source);
    }
    if (!this._sources.has(needle.source)) {
      return [];
    }
    needle.source = this._sources.indexOf(needle.source);

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The only parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._sources.toArray().map(function (s) {
      return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
    }, this);
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          if (this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    if (this.sourceRoot != null) {
      aSource = util.relative(this.sourceRoot, aSource);
    }

    if (this._sources.has(aSource)) {
      return this.sourcesContent[this._sources.indexOf(aSource)];
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + aSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + aSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    if (this.sourceRoot != null) {
      source = util.relative(this.sourceRoot, source);
    }
    if (!this._sources.has(source)) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }
    source = this._sources.indexOf(source);

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The only parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'))
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        if (section.consumer.sourceRoot !== null) {
          source = util.join(section.consumer.sourceRoot, source);
        }
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = section.consumer._names.at(mapping.name);
        this._names.add(name);
        name = this._names.indexOf(name);

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":24,"./base64-vlq":25,"./binary-search":27,"./quick-sort":29,"./util":33}],31:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":24,"./base64-vlq":25,"./mapping-list":28,"./util":33}],32:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex];
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex];
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":31,"./util":33}],33:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

},{}],34:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./lib/source-node').SourceNode;

},{"./lib/source-map-consumer":30,"./lib/source-map-generator":31,"./lib/source-node":32}],35:[function(require,module,exports){
(function (Buffer){
'use strict';
var fs = require('fs');
var path = require('path');

Object.defineProperty(exports, 'commentRegex', {
  get: function getCommentRegex () {
    return /^\s*\/(?:\/|\*)[@#]\s+sourceMappingURL=data:(?:application|text)\/json;(?:charset[:=]\S+?;)?base64,(?:.*)$/mg;
  }
});

Object.defineProperty(exports, 'mapFileCommentRegex', {
  get: function getMapFileCommentRegex () {
    // Matches sourceMappingURL in either // or /* comment styles.
    return /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"`]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^\*]+?)[ \t]*(?:\*\/){1}[ \t]*$)/mg;
  }
});


function decodeBase64(base64) {
  return new Buffer(base64, 'base64').toString();
}

function stripComment(sm) {
  return sm.split(',').pop();
}

function readFromFileMap(sm, dir) {
  // NOTE: this will only work on the server since it attempts to read the map file

  var r = exports.mapFileCommentRegex.exec(sm);

  // for some odd reason //# .. captures in 1 and /* .. */ in 2
  var filename = r[1] || r[2];
  var filepath = path.resolve(dir, filename);

  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    throw new Error('An error occurred while trying to read the map file at ' + filepath + '\n' + e);
  }
}

function Converter (sm, opts) {
  opts = opts || {};

  if (opts.isFileComment) sm = readFromFileMap(sm, opts.commentFileDir);
  if (opts.hasComment) sm = stripComment(sm);
  if (opts.isEncoded) sm = decodeBase64(sm);
  if (opts.isJSON || opts.isEncoded) sm = JSON.parse(sm);

  this.sourcemap = sm;
}

Converter.prototype.toJSON = function (space) {
  return JSON.stringify(this.sourcemap, null, space);
};

Converter.prototype.toBase64 = function () {
  var json = this.toJSON();
  return new Buffer(json).toString('base64');
};

Converter.prototype.toComment = function (options) {
  var base64 = this.toBase64();
  var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;
  return options && options.multiline ? '/*# ' + data + ' */' : '//# ' + data;
};

// returns copy instead of original
Converter.prototype.toObject = function () {
  return JSON.parse(this.toJSON());
};

Converter.prototype.addProperty = function (key, value) {
  if (this.sourcemap.hasOwnProperty(key)) throw new Error('property "' + key + '" already exists on the sourcemap, use set property instead');
  return this.setProperty(key, value);
};

Converter.prototype.setProperty = function (key, value) {
  this.sourcemap[key] = value;
  return this;
};

Converter.prototype.getProperty = function (key) {
  return this.sourcemap[key];
};

exports.fromObject = function (obj) {
  return new Converter(obj);
};

exports.fromJSON = function (json) {
  return new Converter(json, { isJSON: true });
};

exports.fromBase64 = function (base64) {
  return new Converter(base64, { isEncoded: true });
};

exports.fromComment = function (comment) {
  comment = comment
    .replace(/^\/\*/g, '//')
    .replace(/\*\/$/g, '');

  return new Converter(comment, { isEncoded: true, hasComment: true });
};

exports.fromMapFileComment = function (comment, dir) {
  return new Converter(comment, { commentFileDir: dir, isFileComment: true, isJSON: true });
};

// Finds last sourcemap comment in file or returns null if none was found
exports.fromSource = function (content) {
  var m = content.match(exports.commentRegex);
  return m ? exports.fromComment(m.pop()) : null;
};

// Finds last sourcemap comment in file or returns null if none was found
exports.fromMapFileSource = function (content, dir) {
  var m = content.match(exports.mapFileCommentRegex);
  return m ? exports.fromMapFileComment(m.pop(), dir) : null;
};

exports.removeComments = function (src) {
  return src.replace(exports.commentRegex, '');
};

exports.removeMapFileComments = function (src) {
  return src.replace(exports.mapFileCommentRegex, '');
};

exports.generateMapFileComment = function (file, options) {
  var data = 'sourceMappingURL=' + file;
  return options && options.multiline ? '/*# ' + data + ' */' : '//# ' + data;
};

}).call(this,require("buffer").Buffer)

},{"buffer":4,"fs":1,"path":7}],36:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],37:[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./_wks')('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) require('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

},{"./_hide":64,"./_wks":120}],38:[function(require,module,exports){
module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};

},{}],39:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":72}],40:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":109,"./_to-iobject":111,"./_to-length":112}],41:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = require('./_ctx');
var IObject = require('./_iobject');
var toObject = require('./_to-object');
var toLength = require('./_to-length');
var asc = require('./_array-species-create');
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  var create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this);
    var self = IObject(O);
    var f = ctx(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var val, res;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      val = self[index];
      res = f(val, index, O);
      if (TYPE) {
        if (IS_MAP) result[index] = res;   // map
        else if (res) switch (TYPE) {
          case 3: return true;             // some
          case 5: return val;              // find
          case 6: return index;            // findIndex
          case 2: result.push(val);        // filter
        } else if (IS_EVERY) return false; // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};

},{"./_array-species-create":43,"./_ctx":51,"./_iobject":69,"./_to-length":112,"./_to-object":113}],42:[function(require,module,exports){
var isObject = require('./_is-object');
var isArray = require('./_is-array');
var SPECIES = require('./_wks')('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};

},{"./_is-array":71,"./_is-object":72,"./_wks":120}],43:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};

},{"./_array-species-constructor":42}],44:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof');
var TAG = require('./_wks')('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":45,"./_wks":120}],45:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],46:[function(require,module,exports){
'use strict';
var dP = require('./_object-dp').f;
var create = require('./_object-create');
var redefineAll = require('./_redefine-all');
var ctx = require('./_ctx');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var $iterDefine = require('./_iter-define');
var step = require('./_iter-step');
var setSpecies = require('./_set-species');
var DESCRIPTORS = require('./_descriptors');
var fastKey = require('./_meta').fastKey;
var validate = require('./_validate-collection');
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};

},{"./_an-instance":38,"./_ctx":51,"./_descriptors":53,"./_for-of":61,"./_iter-define":76,"./_iter-step":78,"./_meta":81,"./_object-create":85,"./_object-dp":86,"./_redefine-all":100,"./_set-species":103,"./_validate-collection":117}],47:[function(require,module,exports){
'use strict';
var redefineAll = require('./_redefine-all');
var getWeak = require('./_meta').getWeak;
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var createArrayMethod = require('./_array-methods');
var $has = require('./_has');
var validate = require('./_validate-collection');
var arrayFind = createArrayMethod(5);
var arrayFindIndex = createArrayMethod(6);
var id = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function (that) {
  return that._l || (that._l = new UncaughtFrozenStore());
};
var UncaughtFrozenStore = function () {
  this.a = [];
};
var findUncaughtFrozen = function (store, key) {
  return arrayFind(store.a, function (it) {
    return it[0] === key;
  });
};
UncaughtFrozenStore.prototype = {
  get: function (key) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) return entry[1];
  },
  has: function (key) {
    return !!findUncaughtFrozen(this, key);
  },
  set: function (key, value) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function (key) {
    var index = arrayFindIndex(this.a, function (it) {
      return it[0] === key;
    });
    if (~index) this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;      // collection type
      that._i = id++;      // collection id
      that._l = undefined; // leak store for uncaught frozen objects
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function (key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME))['delete'](key);
        return data && $has(data, this._i) && delete data[this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME)).has(key);
        return data && $has(data, this._i);
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var data = getWeak(anObject(key), true);
    if (data === true) uncaughtFrozenStore(that).set(key, value);
    else data[that._i] = value;
    return that;
  },
  ufstore: uncaughtFrozenStore
};

},{"./_an-instance":38,"./_an-object":39,"./_array-methods":41,"./_for-of":61,"./_has":63,"./_is-object":72,"./_meta":81,"./_redefine-all":100,"./_validate-collection":117}],48:[function(require,module,exports){
'use strict';
var global = require('./_global');
var $export = require('./_export');
var redefine = require('./_redefine');
var redefineAll = require('./_redefine-all');
var meta = require('./_meta');
var forOf = require('./_for-of');
var anInstance = require('./_an-instance');
var isObject = require('./_is-object');
var fails = require('./_fails');
var $iterDetect = require('./_iter-detect');
var setToStringTag = require('./_set-to-string-tag');
var inheritIfRequired = require('./_inherit-if-required');

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  var fixMethod = function (KEY) {
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function (a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a) {
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a) { fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b) { fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance = new C();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    var ACCEPT_ITERABLES = $iterDetect(function (iter) { new C(iter); }); // eslint-disable-line no-new
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new C();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });
    if (!ACCEPT_ITERABLES) {
      C = wrapper(function (target, iterable) {
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base(), target, C);
        if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
    // weak collections should not contains .clear method
    if (IS_WEAK && proto.clear) delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};

},{"./_an-instance":38,"./_export":57,"./_fails":58,"./_for-of":61,"./_global":62,"./_inherit-if-required":67,"./_is-object":72,"./_iter-detect":77,"./_meta":81,"./_redefine":101,"./_redefine-all":100,"./_set-to-string-tag":104}],49:[function(require,module,exports){
var core = module.exports = { version: '2.5.7' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],50:[function(require,module,exports){
'use strict';
var $defineProperty = require('./_object-dp');
var createDesc = require('./_property-desc');

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};

},{"./_object-dp":86,"./_property-desc":99}],51:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":36}],52:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],53:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":58}],54:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":62,"./_is-object":72}],55:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],56:[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};

},{"./_object-gops":92,"./_object-keys":95,"./_object-pie":96}],57:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var hide = require('./_hide');
var redefine = require('./_redefine');
var ctx = require('./_ctx');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":49,"./_ctx":51,"./_global":62,"./_hide":64,"./_redefine":101}],58:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],59:[function(require,module,exports){
'use strict';
var hide = require('./_hide');
var redefine = require('./_redefine');
var fails = require('./_fails');
var defined = require('./_defined');
var wks = require('./_wks');

module.exports = function (KEY, length, exec) {
  var SYMBOL = wks(KEY);
  var fns = exec(defined, SYMBOL, ''[KEY]);
  var strfn = fns[0];
  var rxfn = fns[1];
  if (fails(function () {
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  })) {
    redefine(String.prototype, KEY, strfn);
    hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return rxfn.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return rxfn.call(string, this); }
    );
  }
};

},{"./_defined":52,"./_fails":58,"./_hide":64,"./_redefine":101,"./_wks":120}],60:[function(require,module,exports){
'use strict';
// 21.2.5.3 get RegExp.prototype.flags
var anObject = require('./_an-object');
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

},{"./_an-object":39}],61:[function(require,module,exports){
var ctx = require('./_ctx');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var anObject = require('./_an-object');
var toLength = require('./_to-length');
var getIterFn = require('./core.get-iterator-method');
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;

},{"./_an-object":39,"./_ctx":51,"./_is-array-iter":70,"./_iter-call":74,"./_to-length":112,"./core.get-iterator-method":121}],62:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],63:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],64:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":53,"./_object-dp":86,"./_property-desc":99}],65:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":62}],66:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":53,"./_dom-create":54,"./_fails":58}],67:[function(require,module,exports){
var isObject = require('./_is-object');
var setPrototypeOf = require('./_set-proto').set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};

},{"./_is-object":72,"./_set-proto":102}],68:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function (fn, args, that) {
  var un = that === undefined;
  switch (args.length) {
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return fn.apply(that, args);
};

},{}],69:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":45}],70:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./_iterators');
var ITERATOR = require('./_wks')('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"./_iterators":79,"./_wks":120}],71:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":45}],72:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],73:[function(require,module,exports){
// 7.2.8 IsRegExp(argument)
var isObject = require('./_is-object');
var cof = require('./_cof');
var MATCH = require('./_wks')('match');
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};

},{"./_cof":45,"./_is-object":72,"./_wks":120}],74:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"./_an-object":39}],75:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":64,"./_object-create":85,"./_property-desc":99,"./_set-to-string-tag":104,"./_wks":120}],76:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":57,"./_hide":64,"./_iter-create":75,"./_iterators":79,"./_library":80,"./_object-gpo":93,"./_redefine":101,"./_set-to-string-tag":104,"./_wks":120}],77:[function(require,module,exports){
var ITERATOR = require('./_wks')('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};

},{"./_wks":120}],78:[function(require,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],79:[function(require,module,exports){
module.exports = {};

},{}],80:[function(require,module,exports){
module.exports = false;

},{}],81:[function(require,module,exports){
var META = require('./_uid')('meta');
var isObject = require('./_is-object');
var has = require('./_has');
var setDesc = require('./_object-dp').f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !require('./_fails')(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};

},{"./_fails":58,"./_has":63,"./_is-object":72,"./_object-dp":86,"./_uid":115}],82:[function(require,module,exports){
var global = require('./_global');
var macrotask = require('./_task').set;
var Observer = global.MutationObserver || global.WebKitMutationObserver;
var process = global.process;
var Promise = global.Promise;
var isNode = require('./_cof')(process) == 'process';

module.exports = function () {
  var head, last, notify;

  var flush = function () {
    var parent, fn;
    if (isNode && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (e) {
        if (head) notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (isNode) {
    notify = function () {
      process.nextTick(flush);
    };
  // browsers with MutationObserver, except iOS Safari - https://github.com/zloirock/core-js/issues/339
  } else if (Observer && !(global.navigator && global.navigator.standalone)) {
    var toggle = true;
    var node = document.createTextNode('');
    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    var promise = Promise.resolve(undefined);
    notify = function () {
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };
};

},{"./_cof":45,"./_global":62,"./_task":108}],83:[function(require,module,exports){
'use strict';
// 25.4.1.5 NewPromiseCapability(C)
var aFunction = require('./_a-function');

function PromiseCapability(C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
}

module.exports.f = function (C) {
  return new PromiseCapability(C);
};

},{"./_a-function":36}],84:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
var toObject = require('./_to-object');
var IObject = require('./_iobject');
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
  } return T;
} : $assign;

},{"./_fails":58,"./_iobject":69,"./_object-gops":92,"./_object-keys":95,"./_object-pie":96,"./_to-object":113}],85:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":39,"./_dom-create":54,"./_enum-bug-keys":55,"./_html":65,"./_object-dps":87,"./_shared-key":105}],86:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":39,"./_descriptors":53,"./_ie8-dom-define":66,"./_to-primitive":114}],87:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":39,"./_descriptors":53,"./_object-dp":86,"./_object-keys":95}],88:[function(require,module,exports){
'use strict';
// Forced replacement prototype accessors methods
module.exports = require('./_library') || !require('./_fails')(function () {
  var K = Math.random();
  // In FF throws only define methods
  // eslint-disable-next-line no-undef, no-useless-call
  __defineSetter__.call(null, K, function () { /* empty */ });
  delete require('./_global')[K];
});

},{"./_fails":58,"./_global":62,"./_library":80}],89:[function(require,module,exports){
var pIE = require('./_object-pie');
var createDesc = require('./_property-desc');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var has = require('./_has');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};

},{"./_descriptors":53,"./_has":63,"./_ie8-dom-define":66,"./_object-pie":96,"./_property-desc":99,"./_to-iobject":111,"./_to-primitive":114}],90:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject');
var gOPN = require('./_object-gopn').f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":91,"./_to-iobject":111}],91:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = require('./_object-keys-internal');
var hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};

},{"./_enum-bug-keys":55,"./_object-keys-internal":94}],92:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],93:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":63,"./_shared-key":105,"./_to-object":113}],94:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":40,"./_has":63,"./_shared-key":105,"./_to-iobject":111}],95:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":55,"./_object-keys-internal":94}],96:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],97:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return { e: false, v: exec() };
  } catch (e) {
    return { e: true, v: e };
  }
};

},{}],98:[function(require,module,exports){
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var newPromiseCapability = require('./_new-promise-capability');

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

},{"./_an-object":39,"./_is-object":72,"./_new-promise-capability":83}],99:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],100:[function(require,module,exports){
var redefine = require('./_redefine');
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};

},{"./_redefine":101}],101:[function(require,module,exports){
var global = require('./_global');
var hide = require('./_hide');
var has = require('./_has');
var SRC = require('./_uid')('src');
var TO_STRING = 'toString';
var $toString = Function[TO_STRING];
var TPL = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});

},{"./_core":49,"./_global":62,"./_has":63,"./_hide":64,"./_uid":115}],102:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = require('./_is-object');
var anObject = require('./_an-object');
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = require('./_ctx')(Function.call, require('./_object-gopd').f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

},{"./_an-object":39,"./_ctx":51,"./_is-object":72,"./_object-gopd":89}],103:[function(require,module,exports){
'use strict';
var global = require('./_global');
var dP = require('./_object-dp');
var DESCRIPTORS = require('./_descriptors');
var SPECIES = require('./_wks')('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};

},{"./_descriptors":53,"./_global":62,"./_object-dp":86,"./_wks":120}],104:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":63,"./_object-dp":86,"./_wks":120}],105:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":106,"./_uid":115}],106:[function(require,module,exports){
var core = require('./_core');
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: require('./_library') ? 'pure' : 'global',
  copyright: '© 2018 Denis Pushkarev (zloirock.ru)'
});

},{"./_core":49,"./_global":62,"./_library":80}],107:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = require('./_an-object');
var aFunction = require('./_a-function');
var SPECIES = require('./_wks')('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};

},{"./_a-function":36,"./_an-object":39,"./_wks":120}],108:[function(require,module,exports){
var ctx = require('./_ctx');
var invoke = require('./_invoke');
var html = require('./_html');
var cel = require('./_dom-create');
var global = require('./_global');
var process = global.process;
var setTask = global.setImmediate;
var clearTask = global.clearImmediate;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;
var run = function () {
  var id = +this;
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function (event) {
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!setTask || !clearTask) {
  setTask = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (require('./_cof')(process) == 'process') {
    defer = function (id) {
      process.nextTick(ctx(run, id, 1));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
    defer = function (id) {
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in cel('script')) {
    defer = function (id) {
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set: setTask,
  clear: clearTask
};

},{"./_cof":45,"./_ctx":51,"./_dom-create":54,"./_global":62,"./_html":65,"./_invoke":68}],109:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":110}],110:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],111:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":52,"./_iobject":69}],112:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":110}],113:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":52}],114:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":72}],115:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],116:[function(require,module,exports){
var global = require('./_global');
var navigator = global.navigator;

module.exports = navigator && navigator.userAgent || '';

},{"./_global":62}],117:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};

},{"./_is-object":72}],118:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var LIBRARY = require('./_library');
var wksExt = require('./_wks-ext');
var defineProperty = require('./_object-dp').f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};

},{"./_core":49,"./_global":62,"./_library":80,"./_object-dp":86,"./_wks-ext":119}],119:[function(require,module,exports){
exports.f = require('./_wks');

},{"./_wks":120}],120:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":62,"./_shared":106,"./_uid":115}],121:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"./_classof":44,"./_core":49,"./_iterators":79,"./_wks":120}],122:[function(require,module,exports){
'use strict';
var ctx = require('./_ctx');
var $export = require('./_export');
var toObject = require('./_to-object');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var toLength = require('./_to-length');
var createProperty = require('./_create-property');
var getIterFn = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":50,"./_ctx":51,"./_export":57,"./_is-array-iter":70,"./_iter-call":74,"./_iter-detect":77,"./_to-length":112,"./_to-object":113,"./core.get-iterator-method":121}],123:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables');
var step = require('./_iter-step');
var Iterators = require('./_iterators');
var toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":37,"./_iter-define":76,"./_iter-step":78,"./_iterators":79,"./_to-iobject":111}],124:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');
var validate = require('./_validate-collection');
var MAP = 'Map';

// 23.1 Map Objects
module.exports = require('./_collection')(MAP, function (get) {
  return function Map() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key) {
    var entry = strong.getEntry(validate(this, MAP), key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value) {
    return strong.def(validate(this, MAP), key === 0 ? 0 : key, value);
  }
}, strong, true);

},{"./_collection":48,"./_collection-strong":46,"./_validate-collection":117}],125:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var global = require('./_global');
var ctx = require('./_ctx');
var classof = require('./_classof');
var $export = require('./_export');
var isObject = require('./_is-object');
var aFunction = require('./_a-function');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var speciesConstructor = require('./_species-constructor');
var task = require('./_task').set;
var microtask = require('./_microtask')();
var newPromiseCapabilityModule = require('./_new-promise-capability');
var perform = require('./_perform');
var userAgent = require('./_user-agent');
var promiseResolve = require('./_promise-resolve');
var PROMISE = 'Promise';
var TypeError = global.TypeError;
var process = global.process;
var versions = process && process.versions;
var v8 = versions && versions.v8 || '';
var $Promise = global[PROMISE];
var isNode = classof(process) == 'process';
var empty = function () { /* empty */ };
var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

var USE_NATIVE = !!function () {
  try {
    // correct subclassing with @@species support
    var promise = $Promise.resolve(1);
    var FakePromise = (promise.constructor = {})[require('./_wks')('species')] = function (exec) {
      exec(empty, empty);
    };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function')
      && promise.then(empty) instanceof FakePromise
      // v8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
      // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
      // we can't detect it synchronously, so just check versions
      && v8.indexOf('6.6') !== 0
      && userAgent.indexOf('Chrome/66') === -1;
  } catch (e) { /* empty */ }
}();

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function (promise, isReject) {
  if (promise._n) return;
  promise._n = true;
  var chain = promise._c;
  microtask(function () {
    var value = promise._v;
    var ok = promise._s == 1;
    var i = 0;
    var run = function (reaction) {
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (promise._h == 2) onHandleUnhandled(promise);
            promise._h = 1;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // may throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (e) {
        if (domain && !exited) domain.exit();
        reject(e);
      }
    };
    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if (isReject && !promise._h) onUnhandled(promise);
  });
};
var onUnhandled = function (promise) {
  task.call(global, function () {
    var value = promise._v;
    var unhandled = isUnhandled(promise);
    var result, handler, console;
    if (unhandled) {
      result = perform(function () {
        if (isNode) {
          process.emit('unhandledRejection', value, promise);
        } else if (handler = global.onunhandledrejection) {
          handler({ promise: promise, reason: value });
        } else if ((console = global.console) && console.error) {
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if (unhandled && result.e) throw result.v;
  });
};
var isUnhandled = function (promise) {
  return promise._h !== 1 && (promise._a || promise._c).length === 0;
};
var onHandleUnhandled = function (promise) {
  task.call(global, function () {
    var handler;
    if (isNode) {
      process.emit('rejectionHandled', promise);
    } else if (handler = global.onrejectionhandled) {
      handler({ promise: promise, reason: promise._v });
    }
  });
};
var $reject = function (value) {
  var promise = this;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if (!promise._a) promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function (value) {
  var promise = this;
  var then;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if (promise === value) throw TypeError("Promise can't be resolved itself");
    if (then = isThenable(value)) {
      microtask(function () {
        var wrapper = { _w: promise, _d: false }; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch (e) {
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch (e) {
    $reject.call({ _w: promise, _d: false }, e); // wrap
  }
};

// constructor polyfill
if (!USE_NATIVE) {
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor) {
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch (err) {
      $reject.call(this, err);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = require('./_redefine-all')($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected) {
      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if (this._a) this._a.push(reaction);
      if (this._s) notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject = ctx($reject, promise, 1);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === $Promise || C === Wrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
require('./_set-to-string-tag')($Promise, PROMISE);
require('./_set-species')(PROMISE);
Wrapper = require('./_core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    var $$reject = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x) {
    return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./_iter-detect')(function (iter) {
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var values = [];
      var index = 0;
      var remaining = 1;
      forOf(iterable, false, function (promise) {
        var $index = index++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.e) reject(result.v);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      forOf(iterable, false, function (promise) {
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if (result.e) reject(result.v);
    return capability.promise;
  }
});

},{"./_a-function":36,"./_an-instance":38,"./_classof":44,"./_core":49,"./_ctx":51,"./_export":57,"./_for-of":61,"./_global":62,"./_is-object":72,"./_iter-detect":77,"./_library":80,"./_microtask":82,"./_new-promise-capability":83,"./_perform":97,"./_promise-resolve":98,"./_redefine-all":100,"./_set-species":103,"./_set-to-string-tag":104,"./_species-constructor":107,"./_task":108,"./_user-agent":116,"./_wks":120}],126:[function(require,module,exports){
var global = require('./_global');
var inheritIfRequired = require('./_inherit-if-required');
var dP = require('./_object-dp').f;
var gOPN = require('./_object-gopn').f;
var isRegExp = require('./_is-regexp');
var $flags = require('./_flags');
var $RegExp = global.RegExp;
var Base = $RegExp;
var proto = $RegExp.prototype;
var re1 = /a/g;
var re2 = /a/g;
// "new" creates a new object, old webkit buggy here
var CORRECT_NEW = new $RegExp(re1) !== re1;

if (require('./_descriptors') && (!CORRECT_NEW || require('./_fails')(function () {
  re2[require('./_wks')('match')] = false;
  // RegExp constructor can alter flags and IsRegExp works correct with @@match
  return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1, 'i') != '/a/i';
}))) {
  $RegExp = function RegExp(p, f) {
    var tiRE = this instanceof $RegExp;
    var piRE = isRegExp(p);
    var fiU = f === undefined;
    return !tiRE && piRE && p.constructor === $RegExp && fiU ? p
      : inheritIfRequired(CORRECT_NEW
        ? new Base(piRE && !fiU ? p.source : p, f)
        : Base((piRE = p instanceof $RegExp) ? p.source : p, piRE && fiU ? $flags.call(p) : f)
      , tiRE ? this : proto, $RegExp);
  };
  var proxy = function (key) {
    key in $RegExp || dP($RegExp, key, {
      configurable: true,
      get: function () { return Base[key]; },
      set: function (it) { Base[key] = it; }
    });
  };
  for (var keys = gOPN(Base), i = 0; keys.length > i;) proxy(keys[i++]);
  proto.constructor = $RegExp;
  $RegExp.prototype = proto;
  require('./_redefine')(global, 'RegExp', $RegExp);
}

require('./_set-species')('RegExp');

},{"./_descriptors":53,"./_fails":58,"./_flags":60,"./_global":62,"./_inherit-if-required":67,"./_is-regexp":73,"./_object-dp":86,"./_object-gopn":91,"./_redefine":101,"./_set-species":103,"./_wks":120}],127:[function(require,module,exports){
// 21.2.5.3 get RegExp.prototype.flags()
if (require('./_descriptors') && /./g.flags != 'g') require('./_object-dp').f(RegExp.prototype, 'flags', {
  configurable: true,
  get: require('./_flags')
});

},{"./_descriptors":53,"./_flags":60,"./_object-dp":86}],128:[function(require,module,exports){
// @@match logic
require('./_fix-re-wks')('match', 1, function (defined, MATCH, $match) {
  // 21.1.3.11 String.prototype.match(regexp)
  return [function match(regexp) {
    'use strict';
    var O = defined(this);
    var fn = regexp == undefined ? undefined : regexp[MATCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
  }, $match];
});

},{"./_fix-re-wks":59}],129:[function(require,module,exports){
// @@replace logic
require('./_fix-re-wks')('replace', 2, function (defined, REPLACE, $replace) {
  // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
  return [function replace(searchValue, replaceValue) {
    'use strict';
    var O = defined(this);
    var fn = searchValue == undefined ? undefined : searchValue[REPLACE];
    return fn !== undefined
      ? fn.call(searchValue, O, replaceValue)
      : $replace.call(String(O), searchValue, replaceValue);
  }, $replace];
});

},{"./_fix-re-wks":59}],130:[function(require,module,exports){
// @@split logic
require('./_fix-re-wks')('split', 2, function (defined, SPLIT, $split) {
  'use strict';
  var isRegExp = require('./_is-regexp');
  var _split = $split;
  var $push = [].push;
  var $SPLIT = 'split';
  var LENGTH = 'length';
  var LAST_INDEX = 'lastIndex';
  if (
    'abbc'[$SPLIT](/(b)*/)[1] == 'c' ||
    'test'[$SPLIT](/(?:)/, -1)[LENGTH] != 4 ||
    'ab'[$SPLIT](/(?:ab)*/)[LENGTH] != 2 ||
    '.'[$SPLIT](/(.?)(.?)/)[LENGTH] != 4 ||
    '.'[$SPLIT](/()()/)[LENGTH] > 1 ||
    ''[$SPLIT](/.?/)[LENGTH]
  ) {
    var NPCG = /()??/.exec('')[1] === undefined; // nonparticipating capturing group
    // based on es5-shim implementation, need to rework it
    $split = function (separator, limit) {
      var string = String(this);
      if (separator === undefined && limit === 0) return [];
      // If `separator` is not a regex, use native split
      if (!isRegExp(separator)) return _split.call(string, separator, limit);
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      var splitLimit = limit === undefined ? 4294967295 : limit >>> 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var separator2, match, lastIndex, lastLength, i;
      // Doesn't need flags gy, but they don't hurt
      if (!NPCG) separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
      while (match = separatorCopy.exec(string)) {
        // `separatorCopy.lastIndex` is not reliable cross-browser
        lastIndex = match.index + match[0][LENGTH];
        if (lastIndex > lastLastIndex) {
          output.push(string.slice(lastLastIndex, match.index));
          // Fix browsers whose `exec` methods don't consistently return `undefined` for NPCG
          // eslint-disable-next-line no-loop-func
          if (!NPCG && match[LENGTH] > 1) match[0].replace(separator2, function () {
            for (i = 1; i < arguments[LENGTH] - 2; i++) if (arguments[i] === undefined) match[i] = undefined;
          });
          if (match[LENGTH] > 1 && match.index < string[LENGTH]) $push.apply(output, match.slice(1));
          lastLength = match[0][LENGTH];
          lastLastIndex = lastIndex;
          if (output[LENGTH] >= splitLimit) break;
        }
        if (separatorCopy[LAST_INDEX] === match.index) separatorCopy[LAST_INDEX]++; // Avoid an infinite loop
      }
      if (lastLastIndex === string[LENGTH]) {
        if (lastLength || !separatorCopy.test('')) output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output[LENGTH] > splitLimit ? output.slice(0, splitLimit) : output;
    };
  // Chakra, V8
  } else if ('0'[$SPLIT](undefined, 0)[LENGTH]) {
    $split = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : _split.call(this, separator, limit);
    };
  }
  // 21.1.3.17 String.prototype.split(separator, limit)
  return [function split(separator, limit) {
    var O = defined(this);
    var fn = separator == undefined ? undefined : separator[SPLIT];
    return fn !== undefined ? fn.call(separator, O, limit) : $split.call(String(O), separator, limit);
  }, $split];
});

},{"./_fix-re-wks":59,"./_is-regexp":73}],131:[function(require,module,exports){
'use strict';
require('./es6.regexp.flags');
var anObject = require('./_an-object');
var $flags = require('./_flags');
var DESCRIPTORS = require('./_descriptors');
var TO_STRING = 'toString';
var $toString = /./[TO_STRING];

var define = function (fn) {
  require('./_redefine')(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if (require('./_fails')(function () { return $toString.call({ source: 'a', flags: 'b' }) != '/a/b'; })) {
  define(function toString() {
    var R = anObject(this);
    return '/'.concat(R.source, '/',
      'flags' in R ? R.flags : !DESCRIPTORS && R instanceof RegExp ? $flags.call(R) : undefined);
  });
// FF44- RegExp#toString has a wrong name
} else if ($toString.name != TO_STRING) {
  define(function toString() {
    return $toString.call(this);
  });
}

},{"./_an-object":39,"./_descriptors":53,"./_fails":58,"./_flags":60,"./_redefine":101,"./es6.regexp.flags":127}],132:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global = require('./_global');
var has = require('./_has');
var DESCRIPTORS = require('./_descriptors');
var $export = require('./_export');
var redefine = require('./_redefine');
var META = require('./_meta').KEY;
var $fails = require('./_fails');
var shared = require('./_shared');
var setToStringTag = require('./_set-to-string-tag');
var uid = require('./_uid');
var wks = require('./_wks');
var wksExt = require('./_wks-ext');
var wksDefine = require('./_wks-define');
var enumKeys = require('./_enum-keys');
var isArray = require('./_is-array');
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var createDesc = require('./_property-desc');
var _create = require('./_object-create');
var gOPNExt = require('./_object-gopn-ext');
var $GOPD = require('./_object-gopd');
var $DP = require('./_object-dp');
var $keys = require('./_object-keys');
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function';
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f = $propertyIsEnumerable;
  require('./_object-gops').f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !require('./_library')) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    $replacer = replacer = args[1];
    if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    if (!isArray(replacer)) replacer = function (key, value) {
      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);

},{"./_an-object":39,"./_descriptors":53,"./_enum-keys":56,"./_export":57,"./_fails":58,"./_global":62,"./_has":63,"./_hide":64,"./_is-array":71,"./_is-object":72,"./_library":80,"./_meta":81,"./_object-create":85,"./_object-dp":86,"./_object-gopd":89,"./_object-gopn":91,"./_object-gopn-ext":90,"./_object-gops":92,"./_object-keys":95,"./_object-pie":96,"./_property-desc":99,"./_redefine":101,"./_set-to-string-tag":104,"./_shared":106,"./_to-iobject":111,"./_to-primitive":114,"./_uid":115,"./_wks":120,"./_wks-define":118,"./_wks-ext":119}],133:[function(require,module,exports){
'use strict';
var each = require('./_array-methods')(0);
var redefine = require('./_redefine');
var meta = require('./_meta');
var assign = require('./_object-assign');
var weak = require('./_collection-weak');
var isObject = require('./_is-object');
var fails = require('./_fails');
var validate = require('./_validate-collection');
var WEAK_MAP = 'WeakMap';
var getWeak = meta.getWeak;
var isExtensible = Object.isExtensible;
var uncaughtFrozenStore = weak.ufstore;
var tmp = {};
var InternalMap;

var wrapper = function (get) {
  return function WeakMap() {
    return get(this, arguments.length > 0 ? arguments[0] : undefined);
  };
};

var methods = {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key) {
    if (isObject(key)) {
      var data = getWeak(key);
      if (data === true) return uncaughtFrozenStore(validate(this, WEAK_MAP)).get(key);
      return data ? data[this._i] : undefined;
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value) {
    return weak.def(validate(this, WEAK_MAP), key, value);
  }
};

// 23.3 WeakMap Objects
var $WeakMap = module.exports = require('./_collection')(WEAK_MAP, wrapper, methods, weak, true, true);

// IE11 WeakMap frozen keys fix
if (fails(function () { return new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7; })) {
  InternalMap = weak.getConstructor(wrapper, WEAK_MAP);
  assign(InternalMap.prototype, methods);
  meta.NEED = true;
  each(['delete', 'has', 'get', 'set'], function (key) {
    var proto = $WeakMap.prototype;
    var method = proto[key];
    redefine(proto, key, function (a, b) {
      // store frozen objects on internal weakmap shim
      if (isObject(a) && !isExtensible(a)) {
        if (!this._f) this._f = new InternalMap();
        var result = this._f[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}

},{"./_array-methods":41,"./_collection":48,"./_collection-weak":47,"./_fails":58,"./_is-object":72,"./_meta":81,"./_object-assign":84,"./_redefine":101,"./_validate-collection":117}],134:[function(require,module,exports){
'use strict';
var $export = require('./_export');
var toObject = require('./_to-object');
var aFunction = require('./_a-function');
var $defineProperty = require('./_object-dp');

// B.2.2.2 Object.prototype.__defineGetter__(P, getter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineGetter__: function __defineGetter__(P, getter) {
    $defineProperty.f(toObject(this), P, { get: aFunction(getter), enumerable: true, configurable: true });
  }
});

},{"./_a-function":36,"./_descriptors":53,"./_export":57,"./_object-dp":86,"./_object-forced-pam":88,"./_to-object":113}],135:[function(require,module,exports){
// https://github.com/tc39/proposal-promise-finally
'use strict';
var $export = require('./_export');
var core = require('./_core');
var global = require('./_global');
var speciesConstructor = require('./_species-constructor');
var promiseResolve = require('./_promise-resolve');

$export($export.P + $export.R, 'Promise', { 'finally': function (onFinally) {
  var C = speciesConstructor(this, core.Promise || global.Promise);
  var isFunction = typeof onFinally == 'function';
  return this.then(
    isFunction ? function (x) {
      return promiseResolve(C, onFinally()).then(function () { return x; });
    } : onFinally,
    isFunction ? function (e) {
      return promiseResolve(C, onFinally()).then(function () { throw e; });
    } : onFinally
  );
} });

},{"./_core":49,"./_export":57,"./_global":62,"./_promise-resolve":98,"./_species-constructor":107}],136:[function(require,module,exports){
require('./_wks-define')('asyncIterator');

},{"./_wks-define":118}],137:[function(require,module,exports){
var $iterators = require('./es6.array.iterator');
var getKeys = require('./_object-keys');
var redefine = require('./_redefine');
var global = require('./_global');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var wks = require('./_wks');
var ITERATOR = wks('iterator');
var TO_STRING_TAG = wks('toStringTag');
var ArrayValues = Iterators.Array;

var DOMIterables = {
  CSSRuleList: true, // TODO: Not spec compliant, should be false.
  CSSStyleDeclaration: false,
  CSSValueList: false,
  ClientRectList: false,
  DOMRectList: false,
  DOMStringList: false,
  DOMTokenList: true,
  DataTransferItemList: false,
  FileList: false,
  HTMLAllCollection: false,
  HTMLCollection: false,
  HTMLFormElement: false,
  HTMLSelectElement: false,
  MediaList: true, // TODO: Not spec compliant, should be false.
  MimeTypeArray: false,
  NamedNodeMap: false,
  NodeList: true,
  PaintRequestList: false,
  Plugin: false,
  PluginArray: false,
  SVGLengthList: false,
  SVGNumberList: false,
  SVGPathSegList: false,
  SVGPointList: false,
  SVGStringList: false,
  SVGTransformList: false,
  SourceBufferList: false,
  StyleSheetList: true, // TODO: Not spec compliant, should be false.
  TextTrackCueList: false,
  TextTrackList: false,
  TouchList: false
};

for (var collections = getKeys(DOMIterables), i = 0; i < collections.length; i++) {
  var NAME = collections[i];
  var explicit = DOMIterables[NAME];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  var key;
  if (proto) {
    if (!proto[ITERATOR]) hide(proto, ITERATOR, ArrayValues);
    if (!proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    if (explicit) for (key in $iterators) if (!proto[key]) redefine(proto, key, $iterators[key], true);
  }
}

},{"./_global":62,"./_hide":64,"./_iterators":79,"./_object-keys":95,"./_redefine":101,"./_wks":120,"./es6.array.iterator":123}],138:[function(require,module,exports){
var split = require('browser-split')
var ClassList = require('class-list')

var w = typeof window === 'undefined' ? require('html-element') : window
var document = w.document
var Text = w.Text

function context () {

  var cleanupFuncs = []

  function h() {
    var args = [].slice.call(arguments), e = null
    function item (l) {
      var r
      function parseClass (string) {
        // Our minimal parser doesn’t understand escaping CSS special
        // characters like `#`. Don’t use them. More reading:
        // https://mathiasbynens.be/notes/css-escapes .

        var m = split(string, /([\.#]?[^\s#.]+)/)
        if(/^\.|#/.test(m[1]))
          e = document.createElement('div')
        forEach(m, function (v) {
          var s = v.substring(1,v.length)
          if(!v) return
          if(!e)
            e = document.createElement(v)
          else if (v[0] === '.')
            ClassList(e).add(s)
          else if (v[0] === '#')
            e.setAttribute('id', s)
        })
      }

      if(l == null)
        ;
      else if('string' === typeof l) {
        if(!e)
          parseClass(l)
        else
          e.appendChild(r = document.createTextNode(l))
      }
      else if('number' === typeof l
        || 'boolean' === typeof l
        || l instanceof Date
        || l instanceof RegExp ) {
          e.appendChild(r = document.createTextNode(l.toString()))
      }
      //there might be a better way to handle this...
      else if (isArray(l))
        forEach(l, item)
      else if(isNode(l))
        e.appendChild(r = l)
      else if(l instanceof Text)
        e.appendChild(r = l)
      else if ('object' === typeof l) {
        for (var k in l) {
          if('function' === typeof l[k]) {
            if(/^on\w+/.test(k)) {
              (function (k, l) { // capture k, l in the closure
                if (e.addEventListener){
                  e.addEventListener(k.substring(2), l[k], false)
                  cleanupFuncs.push(function(){
                    e.removeEventListener(k.substring(2), l[k], false)
                  })
                }else{
                  e.attachEvent(k, l[k])
                  cleanupFuncs.push(function(){
                    e.detachEvent(k, l[k])
                  })
                }
              })(k, l)
            } else {
              // observable
              e[k] = l[k]()
              cleanupFuncs.push(l[k](function (v) {
                e[k] = v
              }))
            }
          }
          else if(k === 'style') {
            if('string' === typeof l[k]) {
              e.style.cssText = l[k]
            }else{
              for (var s in l[k]) (function(s, v) {
                if('function' === typeof v) {
                  // observable
                  e.style.setProperty(s, v())
                  cleanupFuncs.push(v(function (val) {
                    e.style.setProperty(s, val)
                  }))
                } else
                  var match = l[k][s].match(/(.*)\W+!important\W*$/);
                  if (match) {
                    e.style.setProperty(s, match[1], 'important')
                  } else {
                    e.style.setProperty(s, l[k][s])
                  }
              })(s, l[k][s])
            }
          } else if(k === 'attrs') {
            for (var v in l[k]) {
              e.setAttribute(v, l[k][v])
            }
          }
          else if (k.substr(0, 5) === "data-") {
            e.setAttribute(k, l[k])
          } else {
            e[k] = l[k]
          }
        }
      } else if ('function' === typeof l) {
        //assume it's an observable!
        var v = l()
        e.appendChild(r = isNode(v) ? v : document.createTextNode(v))

        cleanupFuncs.push(l(function (v) {
          if(isNode(v) && r.parentElement)
            r.parentElement.replaceChild(v, r), r = v
          else
            r.textContent = v
        }))
      }

      return r
    }
    while(args.length)
      item(args.shift())

    return e
  }

  h.cleanup = function () {
    for (var i = 0; i < cleanupFuncs.length; i++){
      cleanupFuncs[i]()
    }
    cleanupFuncs.length = 0
  }

  return h
}

var h = module.exports = context()
h.context = context

function isNode (el) {
  return el && el.nodeName && el.nodeType
}

function forEach (arr, fn) {
  if (arr.forEach) return arr.forEach(fn)
  for (var i = 0; i < arr.length; i++) fn(arr[i], i)
}

function isArray (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]'
}



},{"browser-split":17,"class-list":19,"html-element":3}],139:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],140:[function(require,module,exports){
(function (Buffer){
'use strict';
var SourceMapGenerator = require('source-map').SourceMapGenerator;

function offsetMapping(mapping, offset) {
  return { line: offset.line + mapping.line, column: offset.column + mapping.column };
}

function newlinesIn(src) {
  if (!src) return 0;
  var newlines = src.match(/\n/g);

  return newlines ? newlines.length : 0;
}
 
function Generator(opts) {
  opts = opts || {};
  this.generator = new SourceMapGenerator({ file: opts.file || '', sourceRoot: opts.sourceRoot || '' });
  this.sourcesContent = undefined;
  this.opts = opts;
}

/**
 * Adds the given mappings to the generator and offsets them if offset is given 
 *
 * @name addMappings
 * @function
 * @param sourceFile {String} name of the source file
 * @param mappings {Array{{Object}} each object has the form { original: { line: _, column: _ }, generated: { line: _, column: _ } }
 * @param offset {Object} offset to apply to each mapping. Has the form { line: _, column: _ }
 * @return {Object} the generator to allow chaining
 */
Generator.prototype.addMappings = function (sourceFile, mappings, offset) { 
  var generator = this.generator; 

  offset = offset || {};
  offset.line = offset.hasOwnProperty('line') ? offset.line : 0;
  offset.column = offset.hasOwnProperty('column') ? offset.column : 0;

  mappings.forEach(function (m) {
    // only set source if we have original position to handle edgecase (see inline-source-map tests)
    generator.addMapping({
        source    :  m.original ? sourceFile : undefined
      , original  :  m.original
      , generated :  offsetMapping(m.generated, offset)
    });
  });
  return this;
};

/**
 * Generates mappings for the given source, assuming that no translation from original to generated is necessary.
 *
 * @name addGeneratedMappings
 * @function
 * @param sourceFile {String} name of the source file
 * @param source {String} source of the file
 * @param offset {Object} offset to apply to each mapping. Has the form { line: _, column: _ }
 * @return {Object} the generator to allow chaining
 */
Generator.prototype.addGeneratedMappings = function (sourceFile, source, offset) {
  var mappings = []
    , linesToGenerate = newlinesIn(source) + 1;

  for (var line = 1; line <= linesToGenerate; line++) {
    var location = { line: line, column: 0 };
    mappings.push({ original: location, generated: location });
  }

  return this.addMappings(sourceFile, mappings, offset);
};

/**
 * Adds source content for the given source file.
 * 
 * @name addSourceContent
 * @function
 * @param sourceFile {String} The source file for which a mapping is included
 * @param sourcesContent {String} The content of the source file
 * @return {Object} The generator to allow chaining
 */
Generator.prototype.addSourceContent = function (sourceFile, sourcesContent) {
  this.sourcesContent = this.sourcesContent || {};
  this.sourcesContent[sourceFile] = sourcesContent;
  return this;
};

/**
 * @name base64Encode
 * @function
 * @return {String} bas64 encoded representation of the added mappings
 */
Generator.prototype.base64Encode = function () {
  var map = this.toString();
  return new Buffer(map).toString('base64');
};

/**
 * @name inlineMappingUrl
 * @function
 * @return {String} comment with base64 encoded representation of the added mappings. Can be inlined at the end of the generated file. 
 */
Generator.prototype.inlineMappingUrl = function () {
  var charset = this.opts.charset || 'utf-8';
  return '//# sourceMappingURL=data:application/json;charset=' + charset + ';base64,' + this.base64Encode();
};

Generator.prototype.toJSON = function () {
  var map = this.generator.toJSON();
  if (!this.sourcesContent) return map;

  var toSourcesContent = (function (s) {
    if (typeof this.sourcesContent[s] === 'string') {
      return this.sourcesContent[s];
    } else {
      return null;
    }
  }).bind(this);
  map.sourcesContent = map.sources.map(toSourcesContent);
  return map;
};

Generator.prototype.toString = function () {
  return JSON.stringify(this);
};

Generator.prototype._mappings = function () {
  return this.generator._mappings._array;
};

Generator.prototype.gen = function () {
  return this.generator;
};

module.exports = function (opts) { return new Generator(opts); };
module.exports.Generator = Generator;

}).call(this,require("buffer").Buffer)

},{"buffer":4,"source-map":151}],141:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"./util":150,"dup":24}],142:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"./base64":143,"dup":25}],143:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],144:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],145:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./util":150,"dup":28}],146:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29}],147:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"./array-set":141,"./base64-vlq":142,"./binary-search":144,"./quick-sort":146,"./util":150,"dup":30}],148:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"./array-set":141,"./base64-vlq":142,"./mapping-list":145,"./util":150,"dup":31}],149:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"./source-map-generator":148,"./util":150,"dup":32}],150:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"dup":33}],151:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"./lib/source-map-consumer":147,"./lib/source-map-generator":148,"./lib/source-node":149,"dup":34}],152:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates a cache object to store key/value pairs.
 *
 * @private
 * @static
 * @name Cache
 * @memberOf _.memoize
 */
function MapCache() {
  this.__data__ = {};
}

/**
 * Removes `key` and its value from the cache.
 *
 * @private
 * @name delete
 * @memberOf _.memoize.Cache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.
 */
function mapDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the cached value for `key`.
 *
 * @private
 * @name get
 * @memberOf _.memoize.Cache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the cached value.
 */
function mapGet(key) {
  return key == '__proto__' ? undefined : this.__data__[key];
}

/**
 * Checks if a cached value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf _.memoize.Cache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapHas(key) {
  return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
}

/**
 * Sets `value` to `key` of the cache.
 *
 * @private
 * @name set
 * @memberOf _.memoize.Cache
 * @param {string} key The key of the value to cache.
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache object.
 */
function mapSet(key, value) {
  if (key != '__proto__') {
    this.__data__[key] = value;
  }
  return this;
}

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is coerced to a string and used as the
 * cache key. The `func` is invoked with the `this` binding of the memoized
 * function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the [`Map`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-properties-of-the-map-prototype-object)
 * method interface of `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoizing function.
 * @example
 *
 * var upperCase = _.memoize(function(string) {
 *   return string.toUpperCase();
 * });
 *
 * upperCase('fred');
 * // => 'FRED'
 *
 * // modifying the result cache
 * upperCase.cache.set('fred', 'BARNEY');
 * upperCase('fred');
 * // => 'BARNEY'
 *
 * // replacing `_.memoize.Cache`
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'barney' };
 * var identity = _.memoize(_.identity);
 *
 * identity(object);
 * // => { 'user': 'fred' }
 * identity(other);
 * // => { 'user': 'fred' }
 *
 * _.memoize.Cache = WeakMap;
 * var identity = _.memoize(_.identity);
 *
 * identity(object);
 * // => { 'user': 'fred' }
 * identity(other);
 * // => { 'user': 'barney' }
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new memoize.Cache;
  return memoized;
}

// Add functions to the `Map` cache.
MapCache.prototype['delete'] = mapDelete;
MapCache.prototype.get = mapGet;
MapCache.prototype.has = mapHas;
MapCache.prototype.set = mapSet;

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

module.exports = memoize;

},{}],153:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"./util":162,"dup":24}],154:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"./base64":155,"dup":25}],155:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],156:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],157:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./util":162,"dup":28}],158:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29}],159:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":153,"./base64-vlq":154,"./binary-search":156,"./quick-sort":158,"./util":162}],160:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":153,"./base64-vlq":154,"./mapping-list":157,"./util":162}],161:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":160,"./util":162}],162:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;

},{}],163:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"./lib/source-map-consumer":159,"./lib/source-map-generator":160,"./lib/source-node":161,"dup":34}],164:[function(require,module,exports){
(function (process){
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var path = require('path');

var fs;
try {
  fs = require('fs');
  if (!fs.existsSync || !fs.readFileSync) {
    // fs doesn't have all methods we need
    fs = null;
  }
} catch (err) {
  /* nop */
}

var bufferFrom = require('buffer-from');

// Only install once if called multiple times
var errorFormatterInstalled = false;
var uncaughtShimInstalled = false;

// If true, the caches are reset before a stack trace formatting operation
var emptyCacheBetweenOperations = false;

// Supports {browser, node, auto}
var environment = "auto";

// Maps a file path to a string containing the file contents
var fileContentsCache = {};

// Maps a file path to a source map for that file
var sourceMapCache = {};

// Regex for detecting source maps
var reSourceMap = /^data:application\/json[^,]+base64,/;

// Priority list of retrieve handlers
var retrieveFileHandlers = [];
var retrieveMapHandlers = [];

function isInBrowser() {
  if (environment === "browser")
    return true;
  if (environment === "node")
    return false;
  return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window.require && window.module && window.process && window.process.type === "renderer"));
}

function hasGlobalProcessEventEmitter() {
  return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
}

function handlerExec(list) {
  return function(arg) {
    for (var i = 0; i < list.length; i++) {
      var ret = list[i](arg);
      if (ret) {
        return ret;
      }
    }
    return null;
  };
}

var retrieveFile = handlerExec(retrieveFileHandlers);

retrieveFileHandlers.push(function(path) {
  // Trim the path to make sure there is no extra whitespace.
  path = path.trim();
  if (/^file:/.test(path)) {
    // existsSync/readFileSync can't handle file protocol, but once stripped, it works
    path = path.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
      return drive ?
        '' : // file:///C:/dir/file -> C:/dir/file
        '/'; // file:///root-dir/file -> /root-dir/file
    });
  }
  if (path in fileContentsCache) {
    return fileContentsCache[path];
  }

  var contents = null;
  if (!fs) {
    // Use SJAX if we are in the browser
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, false);
    xhr.send(null);
    var contents = null
    if (xhr.readyState === 4 && xhr.status === 200) {
      contents = xhr.responseText
    }
  } else if (fs.existsSync(path)) {
    // Otherwise, use the filesystem
    try {
      contents = fs.readFileSync(path, 'utf8');
    } catch (er) {
      contents = '';
    }
  }

  return fileContentsCache[path] = contents;
});

// Support URLs relative to a directory, but be careful about a protocol prefix
// in case we are in the browser (i.e. directories may start with "http://" or "file:///")
function supportRelativeURL(file, url) {
  if (!file) return url;
  var dir = path.dirname(file);
  var match = /^\w+:\/\/[^\/]*/.exec(dir);
  var protocol = match ? match[0] : '';
  var startPath = dir.slice(protocol.length);
  if (protocol && /^\/\w\:/.test(startPath)) {
    // handle file:///C:/ paths
    protocol += '/';
    return protocol + path.resolve(dir.slice(protocol.length), url).replace(/\\/g, '/');
  }
  return protocol + path.resolve(dir.slice(protocol.length), url);
}

function retrieveSourceMapURL(source) {
  var fileData;

  if (isInBrowser()) {
     try {
       var xhr = new XMLHttpRequest();
       xhr.open('GET', source, false);
       xhr.send(null);
       fileData = xhr.readyState === 4 ? xhr.responseText : null;

       // Support providing a sourceMappingURL via the SourceMap header
       var sourceMapHeader = xhr.getResponseHeader("SourceMap") ||
                             xhr.getResponseHeader("X-SourceMap");
       if (sourceMapHeader) {
         return sourceMapHeader;
       }
     } catch (e) {
     }
  }

  // Get the URL of the source map
  fileData = retrieveFile(source);
  var re = /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^\*]+?)[ \t]*(?:\*\/)[ \t]*$)/mg;
  // Keep executing the search to find the *last* sourceMappingURL to avoid
  // picking up sourceMappingURLs from comments, strings, etc.
  var lastMatch, match;
  while (match = re.exec(fileData)) lastMatch = match;
  if (!lastMatch) return null;
  return lastMatch[1];
};

// Can be overridden by the retrieveSourceMap option to install. Takes a
// generated source filename; returns a {map, optional url} object, or null if
// there is no source map.  The map field may be either a string or the parsed
// JSON object (ie, it must be a valid argument to the SourceMapConsumer
// constructor).
var retrieveSourceMap = handlerExec(retrieveMapHandlers);
retrieveMapHandlers.push(function(source) {
  var sourceMappingURL = retrieveSourceMapURL(source);
  if (!sourceMappingURL) return null;

  // Read the contents of the source map
  var sourceMapData;
  if (reSourceMap.test(sourceMappingURL)) {
    // Support source map URL as a data url
    var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
    sourceMapData = bufferFrom(rawData, "base64").toString();
    sourceMappingURL = source;
  } else {
    // Support source map URLs relative to the source URL
    sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
    sourceMapData = retrieveFile(sourceMappingURL);
  }

  if (!sourceMapData) {
    return null;
  }

  return {
    url: sourceMappingURL,
    map: sourceMapData
  };
});

function mapSourcePosition(position) {
  var sourceMap = sourceMapCache[position.source];
  if (!sourceMap) {
    // Call the (overrideable) retrieveSourceMap function to get the source map.
    var urlAndMap = retrieveSourceMap(position.source);
    if (urlAndMap) {
      sourceMap = sourceMapCache[position.source] = {
        url: urlAndMap.url,
        map: new SourceMapConsumer(urlAndMap.map)
      };

      // Load all sources stored inline with the source map into the file cache
      // to pretend like they are already loaded. They may not exist on disk.
      if (sourceMap.map.sourcesContent) {
        sourceMap.map.sources.forEach(function(source, i) {
          var contents = sourceMap.map.sourcesContent[i];
          if (contents) {
            var url = supportRelativeURL(sourceMap.url, source);
            fileContentsCache[url] = contents;
          }
        });
      }
    } else {
      sourceMap = sourceMapCache[position.source] = {
        url: null,
        map: null
      };
    }
  }

  // Resolve the source URL relative to the URL of the source map
  if (sourceMap && sourceMap.map) {
    var originalPosition = sourceMap.map.originalPositionFor(position);

    // Only return the original position if a matching line was found. If no
    // matching line is found then we return position instead, which will cause
    // the stack trace to print the path and line for the compiled file. It is
    // better to give a precise location in the compiled file than a vague
    // location in the original file.
    if (originalPosition.source !== null) {
      originalPosition.source = supportRelativeURL(
        sourceMap.url, originalPosition.source);
      return originalPosition;
    }
  }

  return position;
}

// Parses code generated by FormatEvalOrigin(), a function inside V8:
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
function mapEvalOrigin(origin) {
  // Most eval() calls are in this format
  var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
  if (match) {
    var position = mapSourcePosition({
      source: match[2],
      line: +match[3],
      column: match[4] - 1
    });
    return 'eval at ' + match[1] + ' (' + position.source + ':' +
      position.line + ':' + (position.column + 1) + ')';
  }

  // Parse nested eval() calls using recursion
  match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
  if (match) {
    return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
  }

  // Make sure we still return useful information if we didn't find anything
  return origin;
}

// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
// implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
function CallSiteToString() {
  var fileName;
  var fileLocation = "";
  if (this.isNative()) {
    fileLocation = "native";
  } else {
    fileName = this.getScriptNameOrSourceURL();
    if (!fileName && this.isEval()) {
      fileLocation = this.getEvalOrigin();
      fileLocation += ", ";  // Expecting source position to follow.
    }

    if (fileName) {
      fileLocation += fileName;
    } else {
      // Source code does not originate from a file and is not native, but we
      // can still get the source position inside the source string, e.g. in
      // an eval string.
      fileLocation += "<anonymous>";
    }
    var lineNumber = this.getLineNumber();
    if (lineNumber != null) {
      fileLocation += ":" + lineNumber;
      var columnNumber = this.getColumnNumber();
      if (columnNumber) {
        fileLocation += ":" + columnNumber;
      }
    }
  }

  var line = "";
  var functionName = this.getFunctionName();
  var addSuffix = true;
  var isConstructor = this.isConstructor();
  var isMethodCall = !(this.isToplevel() || isConstructor);
  if (isMethodCall) {
    var typeName = this.getTypeName();
    // Fixes shim to be backward compatable with Node v0 to v4
    if (typeName === "[object Object]") {
      typeName = "null";
    }
    var methodName = this.getMethodName();
    if (functionName) {
      if (typeName && functionName.indexOf(typeName) != 0) {
        line += typeName + ".";
      }
      line += functionName;
      if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
        line += " [as " + methodName + "]";
      }
    } else {
      line += typeName + "." + (methodName || "<anonymous>");
    }
  } else if (isConstructor) {
    line += "new " + (functionName || "<anonymous>");
  } else if (functionName) {
    line += functionName;
  } else {
    line += fileLocation;
    addSuffix = false;
  }
  if (addSuffix) {
    line += " (" + fileLocation + ")";
  }
  return line;
}

function cloneCallSite(frame) {
  var object = {};
  Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
    object[name] = /^(?:is|get)/.test(name) ? function() { return frame[name].call(frame); } : frame[name];
  });
  object.toString = CallSiteToString;
  return object;
}

function wrapCallSite(frame) {
  if(frame.isNative()) {
    return frame;
  }

  // Most call sites will return the source file from getFileName(), but code
  // passed to eval() ending in "//# sourceURL=..." will return the source file
  // from getScriptNameOrSourceURL() instead
  var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
  if (source) {
    var line = frame.getLineNumber();
    var column = frame.getColumnNumber() - 1;

    // Fix position in Node where some (internal) code is prepended.
    // See https://github.com/evanw/node-source-map-support/issues/36
    var headerLength = 62;
    if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
      column -= headerLength;
    }

    var position = mapSourcePosition({
      source: source,
      line: line,
      column: column
    });
    frame = cloneCallSite(frame);
    frame.getFileName = function() { return position.source; };
    frame.getLineNumber = function() { return position.line; };
    frame.getColumnNumber = function() { return position.column + 1; };
    frame.getScriptNameOrSourceURL = function() { return position.source; };
    return frame;
  }

  // Code called using eval() needs special handling
  var origin = frame.isEval() && frame.getEvalOrigin();
  if (origin) {
    origin = mapEvalOrigin(origin);
    frame = cloneCallSite(frame);
    frame.getEvalOrigin = function() { return origin; };
    return frame;
  }

  // If we get here then we were unable to change the source position
  return frame;
}

// This function is part of the V8 stack trace API, for more info see:
// http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
function prepareStackTrace(error, stack) {
  if (emptyCacheBetweenOperations) {
    fileContentsCache = {};
    sourceMapCache = {};
  }

  return error + stack.map(function(frame) {
    return '\n    at ' + wrapCallSite(frame);
  }).join('');
}

// Generate position and snippet of original source with pointer
function getErrorSource(error) {
  var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
  if (match) {
    var source = match[1];
    var line = +match[2];
    var column = +match[3];

    // Support the inline sourceContents inside the source map
    var contents = fileContentsCache[source];

    // Support files on disk
    if (!contents && fs && fs.existsSync(source)) {
      try {
        contents = fs.readFileSync(source, 'utf8');
      } catch (er) {
        contents = '';
      }
    }

    // Format the line from the original source code like node does
    if (contents) {
      var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
      if (code) {
        return source + ':' + line + '\n' + code + '\n' +
          new Array(column).join(' ') + '^';
      }
    }
  }
  return null;
}

function printErrorAndExit (error) {
  var source = getErrorSource(error);

  if (source) {
    fs.writeSync(2, "\n" + source + "\n");
  }

  fs.writeSync(2, error.stack + "\n");
  process.exit(1);
}

function shimEmitUncaughtException () {
  var origEmit = process.emit;

  process.emit = function (type) {
    if (type === 'uncaughtException') {
      var hasStack = (arguments[1] && arguments[1].stack);
      var hasListeners = (this.listeners(type).length > 0);

      if (hasStack && !hasListeners) {
        return printErrorAndExit(arguments[1]);
      }
    }

    return origEmit.apply(this, arguments);
  };
}

var originalRetrieveFileHandlers = retrieveFileHandlers.slice(0);
var originalRetrieveMapHandlers = retrieveMapHandlers.slice(0);

exports.wrapCallSite = wrapCallSite;
exports.getErrorSource = getErrorSource;
exports.mapSourcePosition = mapSourcePosition;
exports.retrieveSourceMap = retrieveSourceMap;

exports.install = function(options) {
  options = options || {};

  if (options.environment) {
    environment = options.environment;
    if (["node", "browser", "auto"].indexOf(environment) === -1) {
      throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}")
    }
  }

  // Allow sources to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveFile) {
    if (options.overrideRetrieveFile) {
      retrieveFileHandlers.length = 0;
    }

    retrieveFileHandlers.unshift(options.retrieveFile);
  }

  // Allow source maps to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveSourceMap) {
    if (options.overrideRetrieveSourceMap) {
      retrieveMapHandlers.length = 0;
    }

    retrieveMapHandlers.unshift(options.retrieveSourceMap);
  }

  // Support runtime transpilers that include inline source maps
  if (options.hookRequire && !isInBrowser()) {
    var Module;
    try {
      Module = require('module');
    } catch (err) {
      // NOP: Loading in catch block to convert webpack error to warning.
    }
    var $compile = Module.prototype._compile;

    if (!$compile.__sourceMapSupport) {
      Module.prototype._compile = function(content, filename) {
        fileContentsCache[filename] = content;
        sourceMapCache[filename] = undefined;
        return $compile.call(this, content, filename);
      };

      Module.prototype._compile.__sourceMapSupport = true;
    }
  }

  // Configure options
  if (!emptyCacheBetweenOperations) {
    emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ?
      options.emptyCacheBetweenOperations : false;
  }

  // Install the error reformatter
  if (!errorFormatterInstalled) {
    errorFormatterInstalled = true;
    Error.prepareStackTrace = prepareStackTrace;
  }

  if (!uncaughtShimInstalled) {
    var installHandler = 'handleUncaughtExceptions' in options ?
      options.handleUncaughtExceptions : true;

    // Provide the option to not install the uncaught exception handler. This is
    // to support other uncaught exception handlers (in test frameworks, for
    // example). If this handler is not installed and there are no other uncaught
    // exception handlers, uncaught exceptions will be caught by node's built-in
    // exception handler and the process will still be terminated. However, the
    // generated JavaScript code will be shown above the stack trace instead of
    // the original source code.
    if (installHandler && hasGlobalProcessEventEmitter()) {
      uncaughtShimInstalled = true;
      shimEmitUncaughtException();
    }
  }
};

exports.resetRetrieveHandlers = function() {
  retrieveFileHandlers.length = 0;
  retrieveMapHandlers.length = 0;

  retrieveFileHandlers = originalRetrieveFileHandlers.slice(0);
  retrieveMapHandlers = originalRetrieveMapHandlers.slice(0);
}

}).call(this,require('_process'))

},{"_process":8,"buffer-from":18,"fs":1,"module":1,"path":7,"source-map":163}],165:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
class ArraySet {
  constructor() {
    this._array = [];
    this._set = new Map();
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  static fromArray(aArray, aAllowDuplicates) {
    const set = new ArraySet();
    for (let i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  }

  /**
   * Return how many unique items are in this ArraySet. If duplicates have been
   * added, than those do not count towards the size.
   *
   * @returns Number
   */
  size() {
    return this._set.size;
  }

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  add(aStr, aAllowDuplicates) {
    const isDuplicate = this.has(aStr);
    const idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set.set(aStr, idx);
    }
  }

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  has(aStr) {
      return this._set.has(aStr);
  }

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  indexOf(aStr) {
    const idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
    throw new Error('"' + aStr + '" is not in the set.');
  }

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error("No element indexed by " + aIdx);
  }

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  toArray() {
    return this._array.slice();
  }
}
exports.ArraySet = ArraySet;

},{}],166:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const base64 = require("./base64");

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

const VLQ_BASE_SHIFT = 5;

// binary: 100000
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
const VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
const VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
// eslint-disable-next-line no-unused-vars
function fromVLQSigned(aValue) {
  const isNegative = (aValue & 1) === 1;
  const shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  let encoded = "";
  let digit;

  let vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

},{"./base64":167}],167:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function(number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

},{}],168:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  const mid = Math.floor((aHigh - aLow) / 2) + aLow;
  const cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  } else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    }
    return mid;
  }

  // Our needle is less than aHaystack[mid].
  if (mid - aLow > 1) {
    // The element is in the lower half.
    return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
  }

  // we are in termination case (3) or (2) and return the appropriate thing.
  if (aBias == exports.LEAST_UPPER_BOUND) {
    return mid;
  }
  return aLow < 0 ? -1 : aLow;
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  let index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};

},{}],169:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const util = require("./util");

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  const lineA = mappingA.generatedLine;
  const lineB = mappingB.generatedLine;
  const columnA = mappingA.generatedColumn;
  const columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a negligible overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
class MappingList {
  constructor() {
    this._array = [];
    this._sorted = true;
    // Serves as infimum
    this._last = {generatedLine: -1, generatedColumn: 0};
  }

  /**
   * Iterate through internal items. This method takes the same arguments that
   * `Array.prototype.forEach` takes.
   *
   * NOTE: The order of the mappings is NOT guaranteed.
   */
  unsortedForEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  }

  /**
   * Add the given source mapping.
   *
   * @param Object aMapping
   */
  add(aMapping) {
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  }

  /**
   * Returns the flat, sorted array of mappings. The mappings are sorted by
   * generated position.
   *
   * WARNING: This method returns internal data without copying, for
   * performance. The return value must NOT be mutated, and should be treated as
   * an immutable borrow. If you want to take ownership, you must make your own
   * copy.
   */
  toArray() {
    if (!this._sorted) {
      this._array.sort(util.compareByGeneratedPositionsInflated);
      this._sorted = true;
    }
    return this._array;
  }
}

exports.MappingList = MappingList;

},{"./util":174}],170:[function(require,module,exports){
(function (__dirname){
if (typeof fetch === "function") {
  // Web version of reading a wasm file into an array buffer.

  let mappingsWasmUrl = null;

  module.exports = function readWasm() {
    if (typeof mappingsWasmUrl !== "string") {
      throw new Error("You must provide the URL of lib/mappings.wasm by calling " +
                      "SourceMapConsumer.initialize({ 'lib/mappings.wasm': ... }) " +
                      "before using SourceMapConsumer");
    }

    return fetch(mappingsWasmUrl)
      .then(response => response.arrayBuffer());
  };

  module.exports.initialize = url => mappingsWasmUrl = url;
} else {
  // Node version of reading a wasm file into an array buffer.
  const fs = require("fs");
  const path = require("path");

  module.exports = function readWasm() {
    return new Promise((resolve, reject) => {
      const wasmPath = path.join(__dirname, "mappings.wasm");
      fs.readFile(wasmPath, null, (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data.buffer);
      });
    });
  };

  module.exports.initialize = _ => {
    console.debug("SourceMapConsumer.initialize is a no-op when running in node.js");
  };
}

}).call(this,"/node_modules/source-map/lib")

},{"fs":1,"path":7}],171:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const util = require("./util");
const binarySearch = require("./binary-search");
const ArraySet = require("./array-set").ArraySet;
const base64VLQ = require("./base64-vlq"); // eslint-disable-line no-unused-vars
const readWasm = require("../lib/read-wasm");
const wasm = require("./wasm");

const INTERNAL = Symbol("smcInternal");

class SourceMapConsumer {
  constructor(aSourceMap, aSourceMapURL) {
    // If the constructor was called by super(), just return Promise<this>.
    // Yes, this is a hack to retain the pre-existing API of the base-class
    // constructor also being an async factory function.
    if (aSourceMap == INTERNAL) {
      return Promise.resolve(this);
    }

    return _factory(aSourceMap, aSourceMapURL);
  }

  static initialize(opts) {
    readWasm.initialize(opts["lib/mappings.wasm"]);
  }

  static fromSourceMap(aSourceMap, aSourceMapURL) {
    return _factoryBSM(aSourceMap, aSourceMapURL);
  }

  /**
   * Construct a new `SourceMapConsumer` from `rawSourceMap` and `sourceMapUrl`
   * (see the `SourceMapConsumer` constructor for details. Then, invoke the `async
   * function f(SourceMapConsumer) -> T` with the newly constructed consumer, wait
   * for `f` to complete, call `destroy` on the consumer, and return `f`'s return
   * value.
   *
   * You must not use the consumer after `f` completes!
   *
   * By using `with`, you do not have to remember to manually call `destroy` on
   * the consumer, since it will be called automatically once `f` completes.
   *
   * ```js
   * const xSquared = await SourceMapConsumer.with(
   *   myRawSourceMap,
   *   null,
   *   async function (consumer) {
   *     // Use `consumer` inside here and don't worry about remembering
   *     // to call `destroy`.
   *
   *     const x = await whatever(consumer);
   *     return x * x;
   *   }
   * );
   *
   * // You may not use that `consumer` anymore out here; it has
   * // been destroyed. But you can use `xSquared`.
   * console.log(xSquared);
   * ```
   */
  static with(rawSourceMap, sourceMapUrl, f) {
    // Note: The `acorn` version that `webpack` currently depends on doesn't
    // support `async` functions, and the nodes that we support don't all have
    // `.finally`. Therefore, this is written a bit more convolutedly than it
    // should really be.

    let consumer = null;
    const promise = new SourceMapConsumer(rawSourceMap, sourceMapUrl);
    return promise
      .then(c => {
        consumer = c;
        return f(c);
      })
      .then(x => {
        if (consumer) {
          consumer.destroy();
        }
        return x;
      }, e => {
        if (consumer) {
          consumer.destroy();
        }
        throw e;
      });
  }

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  _parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  }

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  eachMapping(aCallback, aContext, aOrder) {
    throw new Error("Subclasses must implement eachMapping");
  }

  /**
   * Returns all generated line and column information for the original source,
   * line, and column provided. If no column is provided, returns all mappings
   * corresponding to a either the line we are searching for or the next
   * closest line that has any mappings. Otherwise, returns all mappings
   * corresponding to the given line and either the column we are searching for
   * or the next closest column that has any offsets.
   *
   * The only argument is an object with the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.  The line number is 1-based.
   *   - column: Optional. the column number in the original source.
   *    The column number is 0-based.
   *
   * and an array of objects is returned, each with the following properties:
   *
   *   - line: The line number in the generated source, or null.  The
   *    line number is 1-based.
   *   - column: The column number in the generated source, or null.
   *    The column number is 0-based.
   */
  allGeneratedPositionsFor(aArgs) {
    throw new Error("Subclasses must implement allGeneratedPositionsFor");
  }

  destroy() {
    throw new Error("Subclasses must implement destroy");
  }
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;
SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
class BasicSourceMapConsumer extends SourceMapConsumer {
  constructor(aSourceMap, aSourceMapURL) {
    return super(INTERNAL).then(that => {
      let sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      const version = util.getArg(sourceMap, "version");
      let sources = util.getArg(sourceMap, "sources");
      // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
      // requires the array) to play nice here.
      const names = util.getArg(sourceMap, "names", []);
      let sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      const sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      const mappings = util.getArg(sourceMap, "mappings");
      const file = util.getArg(sourceMap, "file", null);

      // Once again, Sass deviates from the spec and supplies the version as a
      // string rather than a number, so we use loose equality checking here.
      if (version != that._version) {
        throw new Error("Unsupported version: " + version);
      }

      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }

      sources = sources
        .map(String)
        // Some source maps produce relative source paths like "./foo.js" instead of
        // "foo.js".  Normalize these first so that future comparisons will succeed.
        // See bugzil.la/1090768.
        .map(util.normalize)
        // Always ensure that absolute sources are internally stored relative to
        // the source root, if the source root is absolute. Not doing this would
        // be particularly problematic when the source root is a prefix of the
        // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
        .map(function(source) {
          return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
            ? util.relative(sourceRoot, source)
            : source;
        });

      // Pass `true` below to allow duplicate names and sources. While source maps
      // are intended to be compressed and deduplicated, the TypeScript compiler
      // sometimes generates source maps with duplicates in them. See Github issue
      // #72 and bugzil.la/889492.
      that._names = ArraySet.fromArray(names.map(String), true);
      that._sources = ArraySet.fromArray(sources, true);

      that._absoluteSources = that._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });

      that.sourceRoot = sourceRoot;
      that.sourcesContent = sourcesContent;
      that._mappings = mappings;
      that._sourceMapURL = aSourceMapURL;
      that.file = file;

      that._computedColumnSpans = false;
      that._mappingsPtr = 0;
      that._wasm = null;

      return wasm().then(w => {
        that._wasm = w;
        return that;
      });
    });
  }

  /**
   * Utility function to find the index of a source.  Returns -1 if not
   * found.
   */
  _findSourceIndex(aSource) {
    let relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    if (this._sources.has(relativeSource)) {
      return this._sources.indexOf(relativeSource);
    }

    // Maybe aSource is an absolute URL as returned by |sources|.  In
    // this case we can't simply undo the transform.
    for (let i = 0; i < this._absoluteSources.length; ++i) {
      if (this._absoluteSources[i] == aSource) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Create a BasicSourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @param String aSourceMapURL
   *        The URL at which the source map can be found (optional)
   * @returns BasicSourceMapConsumer
   */
  static fromSourceMap(aSourceMap, aSourceMapURL) {
    return new BasicSourceMapConsumer(aSourceMap.toString());
  }

  get sources() {
    return this._absoluteSources.slice();
  }

  _getMappingsPtr() {
    if (this._mappingsPtr === 0) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this._mappingsPtr;
  }

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  _parseMappings(aStr, aSourceRoot) {
    const size = aStr.length;

    const mappingsBufPtr = this._wasm.exports.allocate_mappings(size);
    const mappingsBuf = new Uint8Array(this._wasm.exports.memory.buffer, mappingsBufPtr, size);
    for (let i = 0; i < size; i++) {
      mappingsBuf[i] = aStr.charCodeAt(i);
    }

    const mappingsPtr = this._wasm.exports.parse_mappings(mappingsBufPtr);

    if (!mappingsPtr) {
      const error = this._wasm.exports.get_last_error();
      let msg = `Error parsing mappings (code ${error}): `;

      // XXX: keep these error codes in sync with `fitzgen/source-map-mappings`.
      switch (error) {
        case 1:
          msg += "the mappings contained a negative line, column, source index, or name index";
          break;
        case 2:
          msg += "the mappings contained a number larger than 2**32";
          break;
        case 3:
          msg += "reached EOF while in the middle of parsing a VLQ";
          break;
        case 4:
          msg += "invalid base 64 character while parsing a VLQ";
          break;
        default:
          msg += "unknown error code";
          break;
      }

      throw new Error(msg);
    }

    this._mappingsPtr = mappingsPtr;
  }

  eachMapping(aCallback, aContext, aOrder) {
    const context = aContext || null;
    const order = aOrder || SourceMapConsumer.GENERATED_ORDER;
    const sourceRoot = this.sourceRoot;

    this._wasm.withMappingCallback(
      mapping => {
        if (mapping.source !== null) {
          mapping.source = this._sources.at(mapping.source);
          mapping.source = util.computeSourceURL(sourceRoot, mapping.source, this._sourceMapURL);

          if (mapping.name !== null) {
            mapping.name = this._names.at(mapping.name);
          }
        }

        aCallback.call(context, mapping);
      },
      () => {
        switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          this._wasm.exports.by_generated_location(this._getMappingsPtr());
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          this._wasm.exports.by_original_location(this._getMappingsPtr());
          break;
        default:
          throw new Error("Unknown order of iteration.");
        }
      }
    );
  }

  allGeneratedPositionsFor(aArgs) {
    let source = util.getArg(aArgs, "source");
    const originalLine = util.getArg(aArgs, "line");
    const originalColumn = aArgs.column || 0;

    source = this._findSourceIndex(source);
    if (source < 0) {
      return [];
    }

    if (originalLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (originalColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    const mappings = [];

    this._wasm.withMappingCallback(
      m => {
        let lastColumn = m.lastGeneratedColumn;
        if (this._computedColumnSpans && lastColumn === null) {
          lastColumn = Infinity;
        }
        mappings.push({
          line: m.generatedLine,
          column: m.generatedColumn,
          lastColumn,
        });
      }, () => {
        this._wasm.exports.all_generated_locations_for(
          this._getMappingsPtr(),
          source,
          originalLine - 1,
          "column" in aArgs,
          originalColumn
        );
      }
    );

    return mappings;
  }

  destroy() {
    if (this._mappingsPtr !== 0) {
      this._wasm.exports.free_mappings(this._mappingsPtr);
      this._mappingsPtr = 0;
    }
  }

  /**
   * Compute the last column for each generated mapping. The last column is
   * inclusive.
   */
  computeColumnSpans() {
    if (this._computedColumnSpans) {
      return;
    }

    this._wasm.exports.compute_column_spans(this._getMappingsPtr());
    this._computedColumnSpans = true;
  }

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.  The line number
   *     is 1-based.
   *   - column: The column number in the generated source.  The column
   *     number is 0-based.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the original source, or null.  The
   *     column number is 0-based.
   *   - name: The original identifier, or null.
   */
  originalPositionFor(aArgs) {
    const needle = {
      generatedLine: util.getArg(aArgs, "line"),
      generatedColumn: util.getArg(aArgs, "column")
    };

    if (needle.generatedLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (needle.generatedColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    let bias = util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND);
    if (bias == null) {
      bias = SourceMapConsumer.GREATEST_LOWER_BOUND;
    }

    let mapping;
    this._wasm.withMappingCallback(m => mapping = m, () => {
      this._wasm.exports.original_location_for(
        this._getMappingsPtr(),
        needle.generatedLine - 1,
        needle.generatedColumn,
        bias
      );
    });

    if (mapping) {
      if (mapping.generatedLine === needle.generatedLine) {
        let source = util.getArg(mapping, "source", null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }

        let name = util.getArg(mapping, "name", null);
        if (name !== null) {
          name = this._names.at(name);
        }

        return {
          source,
          line: util.getArg(mapping, "originalLine", null),
          column: util.getArg(mapping, "originalColumn", null),
          name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  }

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function(sc) { return sc == null; });
  }

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    const index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    let relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    let url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      const fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }

    throw new Error('"' + relativeSource + '" is not in the SourceMap.');
  }

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.  The line number
   *     is 1-based.
   *   - column: The column number in the original source.  The column
   *     number is 0-based.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the generated source, or null.
   *     The column number is 0-based.
   */
  generatedPositionFor(aArgs) {
    let source = util.getArg(aArgs, "source");
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    const needle = {
      source,
      originalLine: util.getArg(aArgs, "line"),
      originalColumn: util.getArg(aArgs, "column")
    };

    if (needle.originalLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (needle.originalColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    let bias = util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND);
    if (bias == null) {
      bias = SourceMapConsumer.GREATEST_LOWER_BOUND;
    }

    let mapping;
    this._wasm.withMappingCallback(m => mapping = m, () => {
      this._wasm.exports.generated_location_for(
        this._getMappingsPtr(),
        needle.source,
        needle.originalLine - 1,
        needle.originalColumn,
        bias
      );
    });

    if (mapping) {
      if (mapping.source === needle.source) {
        let lastColumn = mapping.lastGeneratedColumn;
        if (this._computedColumnSpans && lastColumn === null) {
          lastColumn = Infinity;
        }
        return {
          line: util.getArg(mapping, "generatedLine", null),
          column: util.getArg(mapping, "generatedColumn", null),
          lastColumn,
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  }
}

BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
class IndexedSourceMapConsumer extends SourceMapConsumer {
  constructor(aSourceMap, aSourceMapURL) {
    return super(INTERNAL).then(that => {
      let sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      const version = util.getArg(sourceMap, "version");
      const sections = util.getArg(sourceMap, "sections");

      if (version != that._version) {
        throw new Error("Unsupported version: " + version);
      }

      that._sources = new ArraySet();
      that._names = new ArraySet();
      that.__generatedMappings = null;
      that.__originalMappings = null;
      that.__generatedMappingsUnsorted = null;
      that.__originalMappingsUnsorted = null;

      let lastOffset = {
        line: -1,
        column: 0
      };
      return Promise.all(sections.map(s => {
        if (s.url) {
          // The url field will require support for asynchronicity.
          // See https://github.com/mozilla/source-map/issues/16
          throw new Error("Support for url field in sections not implemented.");
        }
        const offset = util.getArg(s, "offset");
        const offsetLine = util.getArg(offset, "line");
        const offsetColumn = util.getArg(offset, "column");

        if (offsetLine < lastOffset.line ||
            (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;

        const cons = new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL);
        return cons.then(consumer => {
          return {
            generatedOffset: {
              // The offset fields are 0-based, but we use 1-based indices when
              // encoding/decoding from VLQ.
              generatedLine: offsetLine + 1,
              generatedColumn: offsetColumn + 1
            },
            consumer
          };
        });
      })).then(s => {
        that._sections = s;
        return that;
      });
    });
  }

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.
  get _generatedMappings() {
    if (!this.__generatedMappings) {
      this._sortGeneratedMappings();
    }

    return this.__generatedMappings;
  }

  get _originalMappings() {
    if (!this.__originalMappings) {
      this._sortOriginalMappings();
    }

    return this.__originalMappings;
  }

  get _generatedMappingsUnsorted() {
    if (!this.__generatedMappingsUnsorted) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappingsUnsorted;
  }

  get _originalMappingsUnsorted() {
    if (!this.__originalMappingsUnsorted) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappingsUnsorted;
  }

  _sortGeneratedMappings() {
    const mappings = this._generatedMappingsUnsorted;
    mappings.sort(util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = mappings;
  }

  _sortOriginalMappings() {
    const mappings = this._originalMappingsUnsorted;
    mappings.sort(util.compareByOriginalPositions);
    this.__originalMappings = mappings;
  }

  /**
   * The list of original sources.
   */
  get sources() {
    const sources = [];
    for (let i = 0; i < this._sections.length; i++) {
      for (let j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.  The line number
   *     is 1-based.
   *   - column: The column number in the generated source.  The column
   *     number is 0-based.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the original source, or null.  The
   *     column number is 0-based.
   *   - name: The original identifier, or null.
   */
  originalPositionFor(aArgs) {
    const needle = {
      generatedLine: util.getArg(aArgs, "line"),
      generatedColumn: util.getArg(aArgs, "column")
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    const sectionIndex = binarySearch.search(needle, this._sections,
      function(aNeedle, section) {
        const cmp = aNeedle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (aNeedle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    const section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  }

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  hasContentsOfAllSources() {
    return this._sections.every(function(s) {
      return s.consumer.hasContentsOfAllSources();
    });
  }

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  sourceContentFor(aSource, nullOnMissing) {
    for (let i = 0; i < this._sections.length; i++) {
      const section = this._sections[i];

      const content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    throw new Error('"' + aSource + '" is not in the SourceMap.');
  }

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.  The line number
   *     is 1-based.
   *   - column: The column number in the original source.  The column
   *     number is 0-based.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the generated source, or null.
   *     The column number is 0-based.
   */
  generatedPositionFor(aArgs) {
    for (let i = 0; i < this._sections.length; i++) {
      const section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
        continue;
      }
      const generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        const ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  }

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  _parseMappings(aStr, aSourceRoot) {
    const generatedMappings = this.__generatedMappingsUnsorted = [];
    const originalMappings = this.__originalMappingsUnsorted = [];
    for (let i = 0; i < this._sections.length; i++) {
      const section = this._sections[i];

      const sectionMappings = [];
      section.consumer.eachMapping(m => sectionMappings.push(m));

      for (let j = 0; j < sectionMappings.length; j++) {
        const mapping = sectionMappings[j];

        // TODO: test if null is correct here.  The original code used
        // `source`, which would actually have gotten used as null because
        // var's get hoisted.
        // See: https://github.com/mozilla/source-map/issues/333
        let source = util.computeSourceURL(section.consumer.sourceRoot, null, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        let name = null;
        if (mapping.name) {
          this._names.add(mapping.name);
          name = this._names.indexOf(mapping.name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        const adjustedMapping = {
          source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name
        };

        generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === "number") {
          originalMappings.push(adjustedMapping);
        }
      }
    }
  }

  eachMapping(aCallback, aContext, aOrder) {
    const context = aContext || null;
    const order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    let mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    const sourceRoot = this.sourceRoot;
    mappings.map(function(mapping) {
      let source = null;
      if (mapping.source !== null) {
        source = this._sources.at(mapping.source);
        source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      }
      return {
        source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  }

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  _findMapping(aNeedle, aMappings, aLineName,
              aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError("Line must be greater than or equal to 1, got "
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError("Column must be greater than or equal to 0, got "
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  }

  allGeneratedPositionsFor(aArgs) {
    const line = util.getArg(aArgs, "line");

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    const needle = {
      source: util.getArg(aArgs, "source"),
      originalLine: line,
      originalColumn: util.getArg(aArgs, "column", 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    if (needle.originalLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (needle.originalColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    const mappings = [];

    let index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      let mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        const originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          let lastColumn = mapping.lastGeneratedColumn;
          if (this._computedColumnSpans && lastColumn === null) {
            lastColumn = Infinity;
          }
          mappings.push({
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn,
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        const originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          let lastColumn = mapping.lastGeneratedColumn;
          if (this._computedColumnSpans && lastColumn === null) {
            lastColumn = Infinity;
          }
          mappings.push({
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn,
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  }

  destroy() {
    for (let i = 0; i < this._sections.length; i++) {
      this._sections[i].consumer.destroy();
    }
  }
}
exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

/*
 * Cheat to get around inter-twingled classes.  `factory()` can be at the end
 * where it has access to non-hoisted classes, but it gets hoisted itself.
 */
function _factory(aSourceMap, aSourceMapURL) {
  let sourceMap = aSourceMap;
  if (typeof aSourceMap === "string") {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  const consumer = sourceMap.sections != null
      ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
      : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
  return Promise.resolve(consumer);
}

function _factoryBSM(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
}

},{"../lib/read-wasm":170,"./array-set":165,"./base64-vlq":166,"./binary-search":168,"./util":174,"./wasm":175}],172:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const base64VLQ = require("./base64-vlq");
const util = require("./util");
const ArraySet = require("./array-set").ArraySet;
const MappingList = require("./mapping-list").MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
class SourceMapGenerator {
  constructor(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, "file", null);
    this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
    this._skipValidation = util.getArg(aArgs, "skipValidation", false);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = new MappingList();
    this._sourcesContents = null;
  }

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  static fromSourceMap(aSourceMapConsumer) {
    const sourceRoot = aSourceMapConsumer.sourceRoot;
    const generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot
    });
    aSourceMapConsumer.eachMapping(function(mapping) {
      const newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      let sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      const content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  }

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  addMapping(aArgs) {
    const generated = util.getArg(aArgs, "generated");
    const original = util.getArg(aArgs, "original", null);
    let source = util.getArg(aArgs, "source", null);
    let name = util.getArg(aArgs, "name", null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source,
      name
    });
  }

  /**
   * Set the source content for a source file.
   */
  setSourceContent(aSourceFile, aSourceContent) {
    let source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  }

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    let sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          "SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, " +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    const sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    const newSources = this._mappings.toArray().length > 0
      ? new ArraySet()
      : this._sources;
    const newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function(mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        const original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      const source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      const name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function(srcFile) {
      const content = aSourceMapConsumer.sourceContentFor(srcFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          srcFile = util.join(aSourceMapPath, srcFile);
        }
        if (sourceRoot != null) {
          srcFile = util.relative(sourceRoot, srcFile);
        }
        this.setSourceContent(srcFile, content);
      }
    }, this);
  }

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  _validateMapping(aGenerated, aOriginal, aSource, aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        throw new Error(
            "original.line and original.column are not numbers -- you probably meant to omit " +
            "the original mapping entirely and only map the generated position. If so, pass " +
            "null for the original mapping instead of an object with empty or null values."
        );
    }

    if (aGenerated && "line" in aGenerated && "column" in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.

    } else if (aGenerated && "line" in aGenerated && "column" in aGenerated
             && aOriginal && "line" in aOriginal && "column" in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.

    } else {
      throw new Error("Invalid mapping: " + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  }

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  _serializeMappings() {
    let previousGeneratedColumn = 0;
    let previousGeneratedLine = 1;
    let previousOriginalColumn = 0;
    let previousOriginalLine = 0;
    let previousName = 0;
    let previousSource = 0;
    let result = "";
    let next;
    let mapping;
    let nameIdx;
    let sourceIdx;

    const mappings = this._mappings.toArray();
    for (let i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = "";

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ";";
          previousGeneratedLine++;
        }
      } else if (i > 0) {
        if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
          continue;
        }
        next += ",";
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  }

  _generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function(source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      const key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  }

  /**
   * Externalize the source map.
   */
  toJSON() {
    const map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  }

  /**
   * Render the source map being generated to a string.
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

SourceMapGenerator.prototype._version = 3;
exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":165,"./base64-vlq":166,"./mapping-list":169,"./util":174}],173:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const SourceMapGenerator = require("./source-map-generator").SourceMapGenerator;
const util = require("./util");

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
const REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
const NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
const isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
class SourceNode {
  constructor(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   * @param aRelativePath Optional. The path that relative sources in the
   *        SourceMapConsumer should be relative to.
   */
  static fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    const node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    const remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    let remainingLinesIndex = 0;
    const shiftNextLine = function() {
      const lineContents = getNextLine();
      // The last line of a file might not have a newline.
      const newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    let lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    let lastMapping = null;
    let nextLine;

    aSourceMapConsumer.eachMapping(function(mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          nextLine = remainingLines[remainingLinesIndex] || "";
          const code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        nextLine = remainingLines[remainingLinesIndex] || "";
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      const content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        const source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  }

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function(chunk) {
        this.add(chunk);
      }, this);
    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    } else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  }

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (let i = aChunk.length - 1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    } else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  }

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  walk(aFn) {
    let chunk;
    for (let i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      } else if (chunk !== "") {
        aFn(chunk, { source: this.source,
                      line: this.line,
                      column: this.column,
                      name: this.name });
      }
    }
  }

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  join(aSep) {
    let newChildren;
    let i;
    const len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len - 1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  }

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  replaceRight(aPattern, aReplacement) {
    const lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    } else if (typeof lastChild === "string") {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    } else {
      this.children.push("".replace(aPattern, aReplacement));
    }
    return this;
  }

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  }

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  walkSourceContents(aFn) {
    for (let i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    const sources = Object.keys(this.sourceContents);
    for (let i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  }

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  toString() {
    let str = "";
    this.walk(function(chunk) {
      str += chunk;
    });
    return str;
  }

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  toStringWithSourceMap(aArgs) {
    const generated = {
      code: "",
      line: 1,
      column: 0
    };
    const map = new SourceMapGenerator(aArgs);
    let sourceMappingActive = false;
    let lastOriginalSource = null;
    let lastOriginalLine = null;
    let lastOriginalColumn = null;
    let lastOriginalName = null;
    this.walk(function(chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if (lastOriginalSource !== original.source
          || lastOriginalLine !== original.line
          || lastOriginalColumn !== original.column
          || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (let idx = 0, length = chunk.length; idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function(sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map };
  }
}

exports.SourceNode = SourceNode;

},{"./source-map-generator":172,"./util":174}],174:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  }
    throw new Error('"' + aName + '" is a required argument.');

}
exports.getArg = getArg;

const urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
const dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  const match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  let url = "";
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ":";
  }
  url += "//";
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + "@";
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port;
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

const MAX_CACHED_INPUTS = 32;

/**
 * Takes some function `f(input) -> result` and returns a memoized version of
 * `f`.
 *
 * We keep at most `MAX_CACHED_INPUTS` memoized results of `f` alive. The
 * memoization is a dumb-simple, linear least-recently-used cache.
 */
function lruMemoize(f) {
  const cache = [];

  return function(input) {
    for (let i = 0; i < cache.length; i++) {
      if (cache[i].input === input) {
        const temp = cache[0];
        cache[0] = cache[i];
        cache[i] = temp;
        return cache[0].result;
      }
    }

    const result = f(input);

    cache.unshift({
      input,
      result,
    });

    if (cache.length > MAX_CACHED_INPUTS) {
      cache.pop();
    }

    return result;
  };
}

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
const normalize = lruMemoize(function normalize(aPath) {
  let path = aPath;
  const url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  const isAbsolute = exports.isAbsolute(path);

  // Split the path into parts between `/` characters. This is much faster than
  // using `.split(/\/+/g)`.
  const parts = [];
  let start = 0;
  let i = 0;
  while (true) {
    start = i;
    i = path.indexOf("/", start);
    if (i === -1) {
      parts.push(path.slice(start));
      break;
    } else {
      parts.push(path.slice(start, i));
      while (i < path.length && path[i] === "/") {
        i++;
      }
    }
  }

  let up = 0;
  for (i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part === ".") {
      parts.splice(i, 1);
    } else if (part === "..") {
      up++;
    } else if (up > 0) {
      if (part === "") {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join("/");

  if (path === "") {
    path = isAbsolute ? "/" : ".";
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
});
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  const aPathUrl = urlParse(aPath);
  const aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || "/";
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  const joined = aPath.charAt(0) === "/"
    ? aPath
    : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function(aPath) {
  return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, "");

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  let level = 0;
  while (aPath.indexOf(aRoot + "/") !== 0) {
    const index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

const supportsNullProto = (function() {
  const obj = Object.create(null);
  return !("__proto__" in obj);
}());

function identity(s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return "$" + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  const length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  /* eslint-disable no-multi-spaces */
  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }
  /* eslint-enable no-multi-spaces */

  for (let i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  let cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  let cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  let cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || "";

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
      sourceRoot += "/";
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    const parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      const index = parsed.path.lastIndexOf("/");
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;

},{}],175:[function(require,module,exports){
const readWasm = require("../lib/read-wasm");

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.lastGeneratedColumn = null;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

let cachedWasm = null;

module.exports = function wasm() {
  if (cachedWasm) {
    return cachedWasm;
  }

  const callbackStack = [];

  cachedWasm = readWasm().then(buffer => {
      return WebAssembly.instantiate(buffer, {
        env: {
          mapping_callback(
            generatedLine,
            generatedColumn,

            hasLastGeneratedColumn,
            lastGeneratedColumn,

            hasOriginal,
            source,
            originalLine,
            originalColumn,

            hasName,
            name
          ) {
            const mapping = new Mapping();
            // JS uses 1-based line numbers, wasm uses 0-based.
            mapping.generatedLine = generatedLine + 1;
            mapping.generatedColumn = generatedColumn;

            if (hasLastGeneratedColumn) {
              // JS uses inclusive last generated column, wasm uses exclusive.
              mapping.lastGeneratedColumn = lastGeneratedColumn - 1;
            }

            if (hasOriginal) {
              mapping.source = source;
              // JS uses 1-based line numbers, wasm uses 0-based.
              mapping.originalLine = originalLine + 1;
              mapping.originalColumn = originalColumn;

              if (hasName) {
                mapping.name = name;
              }
            }

            callbackStack[callbackStack.length - 1](mapping);
          },

          start_all_generated_locations_for() { console.time("all_generated_locations_for"); },
          end_all_generated_locations_for() { console.timeEnd("all_generated_locations_for"); },

          start_compute_column_spans() { console.time("compute_column_spans"); },
          end_compute_column_spans() { console.timeEnd("compute_column_spans"); },

          start_generated_location_for() { console.time("generated_location_for"); },
          end_generated_location_for() { console.timeEnd("generated_location_for"); },

          start_original_location_for() { console.time("original_location_for"); },
          end_original_location_for() { console.timeEnd("original_location_for"); },

          start_parse_mappings() { console.time("parse_mappings"); },
          end_parse_mappings() { console.timeEnd("parse_mappings"); },

          start_sort_by_generated_location() { console.time("sort_by_generated_location"); },
          end_sort_by_generated_location() { console.timeEnd("sort_by_generated_location"); },

          start_sort_by_original_location() { console.time("sort_by_original_location"); },
          end_sort_by_original_location() { console.timeEnd("sort_by_original_location"); },
        }
      });
  }).then(Wasm => {
    return {
      exports: Wasm.instance.exports,
      withMappingCallback: (mappingCallback, f) => {
        callbackStack.push(mappingCallback);
        try {
          f();
        } finally {
          callbackStack.pop();
        }
      }
    };
  }).then(null, e => {
    cachedWasm = null;
    throw e;
  });

  return cachedWasm;
};

},{"../lib/read-wasm":170}],176:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require("./lib/source-map-generator").SourceMapGenerator;
exports.SourceMapConsumer = require("./lib/source-map-consumer").SourceMapConsumer;
exports.SourceNode = require("./lib/source-node").SourceNode;

},{"./lib/source-map-consumer":171,"./lib/source-map-generator":172,"./lib/source-node":173}],177:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*!
 * XRegExp.build 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2012-present MIT License
 */
var _default = function _default(XRegExp) {
  var REGEX_DATA = 'xregexp';
  var subParts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
  var parts = XRegExp.union([/\({{([\w$]+)}}\)|{{([\w$]+)}}/, subParts], 'g', {
    conjunction: 'or'
  });
  /**
   * Strips a leading `^` and trailing unescaped `$`, if both are present.
   *
   * @private
   * @param {String} pattern Pattern to process.
   * @returns {String} Pattern with edge anchors removed.
   */

  function deanchor(pattern) {
    // Allow any number of empty noncapturing groups before/after anchors, because regexes
    // built/generated by XRegExp sometimes include them
    var leadingAnchor = /^(?:\(\?:\))*\^/;
    var trailingAnchor = /\$(?:\(\?:\))*$/;

    if (leadingAnchor.test(pattern) && trailingAnchor.test(pattern) && // Ensure that the trailing `$` isn't escaped
    trailingAnchor.test(pattern.replace(/\\[\s\S]/g, ''))) {
      return pattern.replace(leadingAnchor, '').replace(trailingAnchor, '');
    }

    return pattern;
  }
  /**
   * Converts the provided value to an XRegExp. Native RegExp flags are not preserved.
   *
   * @private
   * @param {String|RegExp} value Value to convert.
   * @param {Boolean} [addFlagX] Whether to apply the `x` flag in cases when `value` is not
   *   already a regex generated by XRegExp
   * @returns {RegExp} XRegExp object with XRegExp syntax applied.
   */


  function asXRegExp(value, addFlagX) {
    var flags = addFlagX ? 'x' : '';
    return XRegExp.isRegExp(value) ? value[REGEX_DATA] && value[REGEX_DATA].captureNames ? // Don't recompile, to preserve capture names
    value : // Recompile as XRegExp
    XRegExp(value.source, flags) : // Compile string as XRegExp
    XRegExp(value, flags);
  }

  function interpolate(substitution) {
    return substitution instanceof RegExp ? substitution : XRegExp.escape(substitution);
  }

  function reduceToSubpatternsObject(subpatterns, interpolated, subpatternIndex) {
    subpatterns["subpattern".concat(subpatternIndex)] = interpolated;
    return subpatterns;
  }

  function embedSubpatternAfter(raw, subpatternIndex, rawLiterals) {
    var hasSubpattern = subpatternIndex < rawLiterals.length - 1;
    return raw + (hasSubpattern ? "{{subpattern".concat(subpatternIndex, "}}") : '');
  }
  /**
   * Provides tagged template literals that create regexes with XRegExp syntax and flags. The
   * provided pattern is handled as a raw string, so backslashes don't need to be escaped.
   *
   * Interpolation of strings and regexes shares the features of `XRegExp.build`. Interpolated
   * patterns are treated as atomic units when quantified, interpolated strings have their special
   * characters escaped, a leading `^` and trailing unescaped `$` are stripped from interpolated
   * regexes if both are present, and any backreferences within an interpolated regex are
   * rewritten to work within the overall pattern.
   *
   * @memberOf XRegExp
   * @param {String} [flags] Any combination of XRegExp flags.
   * @returns {Function} Handler for template literals that construct regexes with XRegExp syntax.
   * @example
   *
   * const h12 = /1[0-2]|0?[1-9]/;
   * const h24 = /2[0-3]|[01][0-9]/;
   * const hours = XRegExp.tag('x')`${h12} : | ${h24}`;
   * const minutes = /^[0-5][0-9]$/;
   * // Note that explicitly naming the 'minutes' group is required for named backreferences
   * const time = XRegExp.tag('x')`^ ${hours} (?<minutes>${minutes}) $`;
   * time.test('10:59'); // -> true
   * XRegExp.exec('10:59', time).minutes; // -> '59'
   */


  XRegExp.tag = function (flags) {
    return function (literals) {
      for (var _len = arguments.length, substitutions = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        substitutions[_key - 1] = arguments[_key];
      }

      var subpatterns = substitutions.map(interpolate).reduce(reduceToSubpatternsObject, {});
      var pattern = literals.raw.map(embedSubpatternAfter).join('');
      return XRegExp.build(pattern, subpatterns, flags);
    };
  };
  /**
   * Builds regexes using named subpatterns, for readability and pattern reuse. Backreferences in
   * the outer pattern and provided subpatterns are automatically renumbered to work correctly.
   * Native flags used by provided subpatterns are ignored in favor of the `flags` argument.
   *
   * @memberOf XRegExp
   * @param {String} pattern XRegExp pattern using `{{name}}` for embedded subpatterns. Allows
   *   `({{name}})` as shorthand for `(?<name>{{name}})`. Patterns cannot be embedded within
   *   character classes.
   * @param {Object} subs Lookup object for named subpatterns. Values can be strings or regexes. A
   *   leading `^` and trailing unescaped `$` are stripped from subpatterns, if both are present.
   * @param {String} [flags] Any combination of XRegExp flags.
   * @returns {RegExp} Regex with interpolated subpatterns.
   * @example
   *
   * const time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $', {
   *   hours: XRegExp.build('{{h12}} : | {{h24}}', {
   *     h12: /1[0-2]|0?[1-9]/,
   *     h24: /2[0-3]|[01][0-9]/
   *   }, 'x'),
   *   minutes: /^[0-5][0-9]$/
   * });
   * time.test('10:59'); // -> true
   * XRegExp.exec('10:59', time).minutes; // -> '59'
   */


  XRegExp.build = function (pattern, subs, flags) {
    flags = flags || ''; // Used with `asXRegExp` calls for `pattern` and subpatterns in `subs`, to work around how
    // some browsers convert `RegExp('\n')` to a regex that contains the literal characters `\`
    // and `n`. See more details at <https://github.com/slevithan/xregexp/pull/163>.

    var addFlagX = flags.indexOf('x') !== -1;
    var inlineFlags = /^\(\?([\w$]+)\)/.exec(pattern); // Add flags within a leading mode modifier to the overall pattern's flags

    if (inlineFlags) {
      flags = XRegExp._clipDuplicates(flags + inlineFlags[1]);
    }

    var data = {};

    for (var p in subs) {
      if (subs.hasOwnProperty(p)) {
        // Passing to XRegExp enables extended syntax and ensures independent validity,
        // lest an unescaped `(`, `)`, `[`, or trailing `\` breaks the `(?:)` wrapper. For
        // subpatterns provided as native regexes, it dies on octals and adds the property
        // used to hold extended regex instance data, for simplicity.
        var sub = asXRegExp(subs[p], addFlagX);
        data[p] = {
          // Deanchoring allows embedding independently useful anchored regexes. If you
          // really need to keep your anchors, double them (i.e., `^^...$$`).
          pattern: deanchor(sub.source),
          names: sub[REGEX_DATA].captureNames || []
        };
      }
    } // Passing to XRegExp dies on octals and ensures the outer pattern is independently valid;
    // helps keep this simple. Named captures will be put back.


    var patternAsRegex = asXRegExp(pattern, addFlagX); // 'Caps' is short for 'captures'

    var numCaps = 0;
    var numPriorCaps;
    var numOuterCaps = 0;
    var outerCapsMap = [0];
    var outerCapNames = patternAsRegex[REGEX_DATA].captureNames || [];
    var output = patternAsRegex.source.replace(parts, function ($0, $1, $2, $3, $4) {
      var subName = $1 || $2;
      var capName;
      var intro;
      var localCapIndex; // Named subpattern

      if (subName) {
        if (!data.hasOwnProperty(subName)) {
          throw new ReferenceError("Undefined property ".concat($0));
        } // Named subpattern was wrapped in a capturing group


        if ($1) {
          capName = outerCapNames[numOuterCaps];
          outerCapsMap[++numOuterCaps] = ++numCaps; // If it's a named group, preserve the name. Otherwise, use the subpattern name
          // as the capture name

          intro = "(?<".concat(capName || subName, ">");
        } else {
          intro = '(?:';
        }

        numPriorCaps = numCaps;
        var rewrittenSubpattern = data[subName].pattern.replace(subParts, function (match, paren, backref) {
          // Capturing group
          if (paren) {
            capName = data[subName].names[numCaps - numPriorCaps];
            ++numCaps; // If the current capture has a name, preserve the name

            if (capName) {
              return "(?<".concat(capName, ">");
            } // Backreference

          } else if (backref) {
            localCapIndex = +backref - 1; // Rewrite the backreference

            return data[subName].names[localCapIndex] ? // Need to preserve the backreference name in case using flag `n`
            "\\k<".concat(data[subName].names[localCapIndex], ">") : "\\".concat(+backref + numPriorCaps);
          }

          return match;
        });
        return "".concat(intro).concat(rewrittenSubpattern, ")");
      } // Capturing group


      if ($3) {
        capName = outerCapNames[numOuterCaps];
        outerCapsMap[++numOuterCaps] = ++numCaps; // If the current capture has a name, preserve the name

        if (capName) {
          return "(?<".concat(capName, ">");
        } // Backreference

      } else if ($4) {
        localCapIndex = +$4 - 1; // Rewrite the backreference

        return outerCapNames[localCapIndex] ? // Need to preserve the backreference name in case using flag `n`
        "\\k<".concat(outerCapNames[localCapIndex], ">") : "\\".concat(outerCapsMap[+$4]);
      }

      return $0;
    });
    return XRegExp(output, flags);
  };
};

exports.default = _default;
module.exports = exports["default"];
},{}],178:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*!
 * XRegExp.matchRecursive 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2009-present MIT License
 */
var _default = function _default(XRegExp) {
  /**
   * Returns a match detail object composed of the provided values.
   *
   * @private
   */
  function row(name, value, start, end) {
    return {
      name: name,
      value: value,
      start: start,
      end: end
    };
  }
  /**
   * Returns an array of match strings between outermost left and right delimiters, or an array of
   * objects with detailed match parts and position data. An error is thrown if delimiters are
   * unbalanced within the data.
   *
   * @memberOf XRegExp
   * @param {String} str String to search.
   * @param {String} left Left delimiter as an XRegExp pattern.
   * @param {String} right Right delimiter as an XRegExp pattern.
   * @param {String} [flags] Any native or XRegExp flags, used for the left and right delimiters.
   * @param {Object} [options] Lets you specify `valueNames` and `escapeChar` options.
   * @returns {Array} Array of matches, or an empty array.
   * @example
   *
   * // Basic usage
   * let str = '(t((e))s)t()(ing)';
   * XRegExp.matchRecursive(str, '\\(', '\\)', 'g');
   * // -> ['t((e))s', '', 'ing']
   *
   * // Extended information mode with valueNames
   * str = 'Here is <div> <div>an</div></div> example';
   * XRegExp.matchRecursive(str, '<div\\s*>', '</div>', 'gi', {
   *   valueNames: ['between', 'left', 'match', 'right']
   * });
   * // -> [
   * // {name: 'between', value: 'Here is ',       start: 0,  end: 8},
   * // {name: 'left',    value: '<div>',          start: 8,  end: 13},
   * // {name: 'match',   value: ' <div>an</div>', start: 13, end: 27},
   * // {name: 'right',   value: '</div>',         start: 27, end: 33},
   * // {name: 'between', value: ' example',       start: 33, end: 41}
   * // ]
   *
   * // Omitting unneeded parts with null valueNames, and using escapeChar
   * str = '...{1}.\\{{function(x,y){return {y:x}}}';
   * XRegExp.matchRecursive(str, '{', '}', 'g', {
   *   valueNames: ['literal', null, 'value', null],
   *   escapeChar: '\\'
   * });
   * // -> [
   * // {name: 'literal', value: '...',  start: 0, end: 3},
   * // {name: 'value',   value: '1',    start: 4, end: 5},
   * // {name: 'literal', value: '.\\{', start: 6, end: 9},
   * // {name: 'value',   value: 'function(x,y){return {y:x}}', start: 10, end: 37}
   * // ]
   *
   * // Sticky mode via flag y
   * str = '<1><<<2>>><3>4<5>';
   * XRegExp.matchRecursive(str, '<', '>', 'gy');
   * // -> ['1', '<<2>>', '3']
   */


  XRegExp.matchRecursive = function (str, left, right, flags, options) {
    flags = flags || '';
    options = options || {};
    var global = flags.indexOf('g') !== -1;
    var sticky = flags.indexOf('y') !== -1; // Flag `y` is controlled internally

    var basicFlags = flags.replace(/y/g, '');
    var _options = options,
        escapeChar = _options.escapeChar;
    var vN = options.valueNames;
    var output = [];
    var openTokens = 0;
    var delimStart = 0;
    var delimEnd = 0;
    var lastOuterEnd = 0;
    var outerStart;
    var innerStart;
    var leftMatch;
    var rightMatch;
    var esc;
    left = XRegExp(left, basicFlags);
    right = XRegExp(right, basicFlags);

    if (escapeChar) {
      if (escapeChar.length > 1) {
        throw new Error('Cannot use more than one escape character');
      }

      escapeChar = XRegExp.escape(escapeChar); // Example of concatenated `esc` regex:
      // `escapeChar`: '%'
      // `left`: '<'
      // `right`: '>'
      // Regex is: /(?:%[\S\s]|(?:(?!<|>)[^%])+)+/

      esc = new RegExp("(?:".concat(escapeChar, "[\\S\\s]|(?:(?!").concat( // Using `XRegExp.union` safely rewrites backreferences in `left` and `right`.
      // Intentionally not passing `basicFlags` to `XRegExp.union` since any syntax
      // transformation resulting from those flags was already applied to `left` and
      // `right` when they were passed through the XRegExp constructor above.
      XRegExp.union([left, right], '', {
        conjunction: 'or'
      }).source, ")[^").concat(escapeChar, "])+)+"), // Flags `gy` not needed here
      flags.replace(/[^imu]+/g, ''));
    }

    while (true) {
      // If using an escape character, advance to the delimiter's next starting position,
      // skipping any escaped characters in between
      if (escapeChar) {
        delimEnd += (XRegExp.exec(str, esc, delimEnd, 'sticky') || [''])[0].length;
      }

      leftMatch = XRegExp.exec(str, left, delimEnd);
      rightMatch = XRegExp.exec(str, right, delimEnd); // Keep the leftmost match only

      if (leftMatch && rightMatch) {
        if (leftMatch.index <= rightMatch.index) {
          rightMatch = null;
        } else {
          leftMatch = null;
        }
      } // Paths (LM: leftMatch, RM: rightMatch, OT: openTokens):
      // LM | RM | OT | Result
      // 1  | 0  | 1  | loop
      // 1  | 0  | 0  | loop
      // 0  | 1  | 1  | loop
      // 0  | 1  | 0  | throw
      // 0  | 0  | 1  | throw
      // 0  | 0  | 0  | break
      // The paths above don't include the sticky mode special case. The loop ends after the
      // first completed match if not `global`.


      if (leftMatch || rightMatch) {
        delimStart = (leftMatch || rightMatch).index;
        delimEnd = delimStart + (leftMatch || rightMatch)[0].length;
      } else if (!openTokens) {
        break;
      }

      if (sticky && !openTokens && delimStart > lastOuterEnd) {
        break;
      }

      if (leftMatch) {
        if (!openTokens) {
          outerStart = delimStart;
          innerStart = delimEnd;
        }

        ++openTokens;
      } else if (rightMatch && openTokens) {
        if (! --openTokens) {
          if (vN) {
            if (vN[0] && outerStart > lastOuterEnd) {
              output.push(row(vN[0], str.slice(lastOuterEnd, outerStart), lastOuterEnd, outerStart));
            }

            if (vN[1]) {
              output.push(row(vN[1], str.slice(outerStart, innerStart), outerStart, innerStart));
            }

            if (vN[2]) {
              output.push(row(vN[2], str.slice(innerStart, delimStart), innerStart, delimStart));
            }

            if (vN[3]) {
              output.push(row(vN[3], str.slice(delimStart, delimEnd), delimStart, delimEnd));
            }
          } else {
            output.push(str.slice(innerStart, delimStart));
          }

          lastOuterEnd = delimEnd;

          if (!global) {
            break;
          }
        }
      } else {
        throw new Error('Unbalanced delimiter found in string');
      } // If the delimiter matched an empty string, avoid an infinite loop


      if (delimStart === delimEnd) {
        ++delimEnd;
      }
    }

    if (global && !sticky && vN && vN[0] && str.length > lastOuterEnd) {
      output.push(row(vN[0], str.slice(lastOuterEnd), lastOuterEnd, str.length));
    }

    return output;
  };
};

exports.default = _default;
module.exports = exports["default"];
},{}],179:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*!
 * XRegExp Unicode Base 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2008-present MIT License
 */
var _default = function _default(XRegExp) {
  /**
   * Adds base support for Unicode matching:
   * - Adds syntax `\p{..}` for matching Unicode tokens. Tokens can be inverted using `\P{..}` or
   *   `\p{^..}`. Token names ignore case, spaces, hyphens, and underscores. You can omit the
   *   braces for token names that are a single letter (e.g. `\pL` or `PL`).
   * - Adds flag A (astral), which enables 21-bit Unicode support.
   * - Adds the `XRegExp.addUnicodeData` method used by other addons to provide character data.
   *
   * Unicode Base relies on externally provided Unicode character data. Official addons are
   * available to provide data for Unicode categories, scripts, blocks, and properties.
   *
   * @requires XRegExp
   */
  // ==--------------------------==
  // Private stuff
  // ==--------------------------==
  // Storage for Unicode data
  var unicode = {}; // Reuse utils

  var dec = XRegExp._dec;
  var hex = XRegExp._hex;
  var pad4 = XRegExp._pad4; // Generates a token lookup name: lowercase, with hyphens, spaces, and underscores removed

  function normalize(name) {
    return name.replace(/[- _]+/g, '').toLowerCase();
  } // Gets the decimal code of a literal code unit, \xHH, \uHHHH, or a backslash-escaped literal


  function charCode(chr) {
    var esc = /^\\[xu](.+)/.exec(chr);
    return esc ? dec(esc[1]) : chr.charCodeAt(chr[0] === '\\' ? 1 : 0);
  } // Inverts a list of ordered BMP characters and ranges


  function invertBmp(range) {
    var output = '';
    var lastEnd = -1;
    XRegExp.forEach(range, /(\\x..|\\u....|\\?[\s\S])(?:-(\\x..|\\u....|\\?[\s\S]))?/, function (m) {
      var start = charCode(m[1]);

      if (start > lastEnd + 1) {
        output += "\\u".concat(pad4(hex(lastEnd + 1)));

        if (start > lastEnd + 2) {
          output += "-\\u".concat(pad4(hex(start - 1)));
        }
      }

      lastEnd = charCode(m[2] || m[1]);
    });

    if (lastEnd < 0xFFFF) {
      output += "\\u".concat(pad4(hex(lastEnd + 1)));

      if (lastEnd < 0xFFFE) {
        output += '-\\uFFFF';
      }
    }

    return output;
  } // Generates an inverted BMP range on first use


  function cacheInvertedBmp(slug) {
    var prop = 'b!';
    return unicode[slug][prop] || (unicode[slug][prop] = invertBmp(unicode[slug].bmp));
  } // Combines and optionally negates BMP and astral data


  function buildAstral(slug, isNegated) {
    var item = unicode[slug];
    var combined = '';

    if (item.bmp && !item.isBmpLast) {
      combined = "[".concat(item.bmp, "]").concat(item.astral ? '|' : '');
    }

    if (item.astral) {
      combined += item.astral;
    }

    if (item.isBmpLast && item.bmp) {
      combined += "".concat(item.astral ? '|' : '', "[").concat(item.bmp, "]");
    } // Astral Unicode tokens always match a code point, never a code unit


    return isNegated ? "(?:(?!".concat(combined, ")(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\0-\uFFFF]))") : "(?:".concat(combined, ")");
  } // Builds a complete astral pattern on first use


  function cacheAstral(slug, isNegated) {
    var prop = isNegated ? 'a!' : 'a=';
    return unicode[slug][prop] || (unicode[slug][prop] = buildAstral(slug, isNegated));
  } // ==--------------------------==
  // Core functionality
  // ==--------------------------==

  /*
   * Add astral mode (flag A) and Unicode token syntax: `\p{..}`, `\P{..}`, `\p{^..}`, `\pC`.
   */


  XRegExp.addToken( // Use `*` instead of `+` to avoid capturing `^` as the token name in `\p{^}`
  /\\([pP])(?:{(\^?)([^}]*)}|([A-Za-z]))/, function (match, scope, flags) {
    var ERR_DOUBLE_NEG = 'Invalid double negation ';
    var ERR_UNKNOWN_NAME = 'Unknown Unicode token ';
    var ERR_UNKNOWN_REF = 'Unicode token missing data ';
    var ERR_ASTRAL_ONLY = 'Astral mode required for Unicode token ';
    var ERR_ASTRAL_IN_CLASS = 'Astral mode does not support Unicode tokens within character classes'; // Negated via \P{..} or \p{^..}

    var isNegated = match[1] === 'P' || !!match[2]; // Switch from BMP (0-FFFF) to astral (0-10FFFF) mode via flag A

    var isAstralMode = flags.indexOf('A') !== -1; // Token lookup name. Check `[4]` first to avoid passing `undefined` via `\p{}`

    var slug = normalize(match[4] || match[3]); // Token data object

    var item = unicode[slug];

    if (match[1] === 'P' && match[2]) {
      throw new SyntaxError(ERR_DOUBLE_NEG + match[0]);
    }

    if (!unicode.hasOwnProperty(slug)) {
      throw new SyntaxError(ERR_UNKNOWN_NAME + match[0]);
    } // Switch to the negated form of the referenced Unicode token


    if (item.inverseOf) {
      slug = normalize(item.inverseOf);

      if (!unicode.hasOwnProperty(slug)) {
        throw new ReferenceError("".concat(ERR_UNKNOWN_REF + match[0], " -> ").concat(item.inverseOf));
      }

      item = unicode[slug];
      isNegated = !isNegated;
    }

    if (!(item.bmp || isAstralMode)) {
      throw new SyntaxError(ERR_ASTRAL_ONLY + match[0]);
    }

    if (isAstralMode) {
      if (scope === 'class') {
        throw new SyntaxError(ERR_ASTRAL_IN_CLASS);
      }

      return cacheAstral(slug, isNegated);
    }

    return scope === 'class' ? isNegated ? cacheInvertedBmp(slug) : item.bmp : "".concat((isNegated ? '[^' : '[') + item.bmp, "]");
  }, {
    scope: 'all',
    optionalFlags: 'A',
    leadChar: '\\'
  });
  /**
   * Adds to the list of Unicode tokens that XRegExp regexes can match via `\p` or `\P`.
   *
   * @memberOf XRegExp
   * @param {Array} data Objects with named character ranges. Each object may have properties
   *   `name`, `alias`, `isBmpLast`, `inverseOf`, `bmp`, and `astral`. All but `name` are
   *   optional, although one of `bmp` or `astral` is required (unless `inverseOf` is set). If
   *   `astral` is absent, the `bmp` data is used for BMP and astral modes. If `bmp` is absent,
   *   the name errors in BMP mode but works in astral mode. If both `bmp` and `astral` are
   *   provided, the `bmp` data only is used in BMP mode, and the combination of `bmp` and
   *   `astral` data is used in astral mode. `isBmpLast` is needed when a token matches orphan
   *   high surrogates *and* uses surrogate pairs to match astral code points. The `bmp` and
   *   `astral` data should be a combination of literal characters and `\xHH` or `\uHHHH` escape
   *   sequences, with hyphens to create ranges. Any regex metacharacters in the data should be
   *   escaped, apart from range-creating hyphens. The `astral` data can additionally use
   *   character classes and alternation, and should use surrogate pairs to represent astral code
   *   points. `inverseOf` can be used to avoid duplicating character data if a Unicode token is
   *   defined as the exact inverse of another token.
   * @example
   *
   * // Basic use
   * XRegExp.addUnicodeData([{
   *   name: 'XDigit',
   *   alias: 'Hexadecimal',
   *   bmp: '0-9A-Fa-f'
   * }]);
   * XRegExp('\\p{XDigit}:\\p{Hexadecimal}+').test('0:3D'); // -> true
   */

  XRegExp.addUnicodeData = function (data) {
    var ERR_NO_NAME = 'Unicode token requires name';
    var ERR_NO_DATA = 'Unicode token has no character data ';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var item = _step.value;

        if (!item.name) {
          throw new Error(ERR_NO_NAME);
        }

        if (!(item.inverseOf || item.bmp || item.astral)) {
          throw new Error(ERR_NO_DATA + item.name);
        }

        unicode[normalize(item.name)] = item;

        if (item.alias) {
          unicode[normalize(item.alias)] = item;
        }
      } // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and
      // flags might now produce different results

    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    XRegExp.cache.flush('patterns');
  };
  /**
   * @ignore
   *
   * Return a reference to the internal Unicode definition structure for the given Unicode
   * Property if the given name is a legal Unicode Property for use in XRegExp `\p` or `\P` regex
   * constructs.
   *
   * @memberOf XRegExp
   * @param {String} name Name by which the Unicode Property may be recognized (case-insensitive),
   *   e.g. `'N'` or `'Number'`. The given name is matched against all registered Unicode
   *   Properties and Property Aliases.
   * @returns {Object} Reference to definition structure when the name matches a Unicode Property.
   *
   * @note
   * For more info on Unicode Properties, see also http://unicode.org/reports/tr18/#Categories.
   *
   * @note
   * This method is *not* part of the officially documented API and may change or be removed in
   * the future. It is meant for userland code that wishes to reuse the (large) internal Unicode
   * structures set up by XRegExp.
   */


  XRegExp._getUnicodeProperty = function (name) {
    var slug = normalize(name);
    return unicode[slug];
  };
};

exports.default = _default;
module.exports = exports["default"];
},{}],180:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _blocks = _interopRequireDefault(require("../../tools/output/blocks"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * XRegExp Unicode Blocks 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds support for all Unicode blocks. Block names use the prefix 'In'. E.g.,
   * `\p{InBasicLatin}`. Token names are case insensitive, and any spaces, hyphens, and
   * underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Blocks');
  }

  XRegExp.addUnicodeData(_blocks.default);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/blocks":186}],181:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _categories = _interopRequireDefault(require("../../tools/output/categories"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * XRegExp Unicode Categories 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds support for Unicode's general categories. E.g., `\p{Lu}` or `\p{Uppercase Letter}`. See
   * category descriptions in UAX #44 <http://unicode.org/reports/tr44/#GC_Values_Table>. Token
   * names are case insensitive, and any spaces, hyphens, and underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Categories');
  }

  XRegExp.addUnicodeData(_categories.default);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/categories":187}],182:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _properties = _interopRequireDefault(require("../../tools/output/properties"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * XRegExp Unicode Properties 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2012-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds properties to meet the UTS #18 Level 1 RL1.2 requirements for Unicode regex support. See
   * <http://unicode.org/reports/tr18/#RL1.2>. Following are definitions of these properties from
   * UAX #44 <http://unicode.org/reports/tr44/>:
   *
   * - Alphabetic
   *   Characters with the Alphabetic property. Generated from: Lowercase + Uppercase + Lt + Lm +
   *   Lo + Nl + Other_Alphabetic.
   *
   * - Default_Ignorable_Code_Point
   *   For programmatic determination of default ignorable code points. New characters that should
   *   be ignored in rendering (unless explicitly supported) will be assigned in these ranges,
   *   permitting programs to correctly handle the default rendering of such characters when not
   *   otherwise supported.
   *
   * - Lowercase
   *   Characters with the Lowercase property. Generated from: Ll + Other_Lowercase.
   *
   * - Noncharacter_Code_Point
   *   Code points permanently reserved for internal use.
   *
   * - Uppercase
   *   Characters with the Uppercase property. Generated from: Lu + Other_Uppercase.
   *
   * - White_Space
   *   Spaces, separator characters and other control characters which should be treated by
   *   programming languages as "white space" for the purpose of parsing elements.
   *
   * The properties ASCII, Any, and Assigned are also included but are not defined in UAX #44. UTS
   * #18 RL1.2 additionally requires support for Unicode scripts and general categories. These are
   * included in XRegExp's Unicode Categories and Unicode Scripts addons.
   *
   * Token names are case insensitive, and any spaces, hyphens, and underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Properties');
  }

  var unicodeData = _properties.default; // Add non-generated data

  unicodeData.push({
    name: 'Assigned',
    // Since this is defined as the inverse of Unicode category Cn (Unassigned), the Unicode
    // Categories addon is required to use this property
    inverseOf: 'Cn'
  });
  XRegExp.addUnicodeData(unicodeData);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/properties":188}],183:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _scripts = _interopRequireDefault(require("../../tools/output/scripts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * XRegExp Unicode Scripts 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds support for all Unicode scripts. E.g., `\p{Latin}`. Token names are case insensitive,
   * and any spaces, hyphens, and underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Scripts');
  }

  XRegExp.addUnicodeData(_scripts.default);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/scripts":189}],184:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _xregexp = _interopRequireDefault(require("./xregexp"));

var _build = _interopRequireDefault(require("./addons/build"));

var _matchrecursive = _interopRequireDefault(require("./addons/matchrecursive"));

var _unicodeBase = _interopRequireDefault(require("./addons/unicode-base"));

var _unicodeBlocks = _interopRequireDefault(require("./addons/unicode-blocks"));

var _unicodeCategories = _interopRequireDefault(require("./addons/unicode-categories"));

var _unicodeProperties = _interopRequireDefault(require("./addons/unicode-properties"));

var _unicodeScripts = _interopRequireDefault(require("./addons/unicode-scripts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _build.default)(_xregexp.default);
(0, _matchrecursive.default)(_xregexp.default);
(0, _unicodeBase.default)(_xregexp.default);
(0, _unicodeBlocks.default)(_xregexp.default);
(0, _unicodeCategories.default)(_xregexp.default);
(0, _unicodeProperties.default)(_xregexp.default);
(0, _unicodeScripts.default)(_xregexp.default);
var _default = _xregexp.default;
exports.default = _default;
module.exports = exports["default"];
},{"./addons/build":177,"./addons/matchrecursive":178,"./addons/unicode-base":179,"./addons/unicode-blocks":180,"./addons/unicode-categories":181,"./addons/unicode-properties":182,"./addons/unicode-scripts":183,"./xregexp":185}],185:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/*!
 * XRegExp 4.2.0
 * <xregexp.com>
 * Steven Levithan (c) 2007-present MIT License
 */

/**
 * XRegExp provides augmented, extensible regular expressions. You get additional regex syntax and
 * flags, beyond what browsers support natively. XRegExp is also a regex utility belt with tools to
 * make your client-side grepping simpler and more powerful, while freeing you from related
 * cross-browser inconsistencies.
 */
// ==--------------------------==
// Private stuff
// ==--------------------------==
// Property name used for extended regex instance data
var REGEX_DATA = 'xregexp'; // Optional features that can be installed and uninstalled

var features = {
  astral: false,
  namespacing: false
}; // Native methods to use and restore ('native' is an ES3 reserved keyword)

var nativ = {
  exec: RegExp.prototype.exec,
  test: RegExp.prototype.test,
  match: String.prototype.match,
  replace: String.prototype.replace,
  split: String.prototype.split
}; // Storage for fixed/extended native methods

var fixed = {}; // Storage for regexes cached by `XRegExp.cache`

var regexCache = {}; // Storage for pattern details cached by the `XRegExp` constructor

var patternCache = {}; // Storage for regex syntax tokens added internally or by `XRegExp.addToken`

var tokens = []; // Token scopes

var defaultScope = 'default';
var classScope = 'class'; // Regexes that match native regex syntax, including octals

var nativeTokens = {
  // Any native multicharacter token in default scope, or any single character
  'default': /\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|\(\?(?:[:=!]|<[=!])|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,
  // Any native multicharacter token in character class scope, or any single character
  'class': /\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|[\s\S]/
}; // Any backreference or dollar-prefixed character in replacement strings

var replacementToken = /\$(?:{([\w$]+)}|<([\w$]+)>|(\d\d?|[\s\S]))/g; // Check for correct `exec` handling of nonparticipating capturing groups

var correctExecNpcg = nativ.exec.call(/()??/, '')[1] === undefined; // Check for ES6 `flags` prop support

var hasFlagsProp = /x/.flags !== undefined; // Shortcut to `Object.prototype.toString`

var _ref = {},
    toString = _ref.toString;

function hasNativeFlag(flag) {
  // Can't check based on the presence of properties/getters since browsers might support such
  // properties even when they don't support the corresponding flag in regex construction (tested
  // in Chrome 48, where `'unicode' in /x/` is true but trying to construct a regex with flag `u`
  // throws an error)
  var isSupported = true;

  try {
    // Can't use regex literals for testing even in a `try` because regex literals with
    // unsupported flags cause a compilation error in IE
    new RegExp('', flag);
  } catch (exception) {
    isSupported = false;
  }

  return isSupported;
} // Check for ES6 `u` flag support


var hasNativeU = hasNativeFlag('u'); // Check for ES6 `y` flag support

var hasNativeY = hasNativeFlag('y'); // Tracker for known flags, including addon flags

var registeredFlags = {
  g: true,
  i: true,
  m: true,
  u: hasNativeU,
  y: hasNativeY
};
/**
 * Attaches extended data and `XRegExp.prototype` properties to a regex object.
 *
 * @private
 * @param {RegExp} regex Regex to augment.
 * @param {Array} captureNames Array with capture names, or `null`.
 * @param {String} xSource XRegExp pattern used to generate `regex`, or `null` if N/A.
 * @param {String} xFlags XRegExp flags used to generate `regex`, or `null` if N/A.
 * @param {Boolean} [isInternalOnly=false] Whether the regex will be used only for internal
 *   operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *   skipping some operations like attaching `XRegExp.prototype` properties.
 * @returns {RegExp} Augmented regex.
 */

function augment(regex, captureNames, xSource, xFlags, isInternalOnly) {
  regex[REGEX_DATA] = {
    captureNames: captureNames
  };

  if (isInternalOnly) {
    return regex;
  } // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value


  if (regex.__proto__) {
    regex.__proto__ = XRegExp.prototype;
  } else {
    for (var p in XRegExp.prototype) {
      // An `XRegExp.prototype.hasOwnProperty(p)` check wouldn't be worth it here, since this
      // is performance sensitive, and enumerable `Object.prototype` or `RegExp.prototype`
      // extensions exist on `regex.prototype` anyway
      regex[p] = XRegExp.prototype[p];
    }
  }

  regex[REGEX_DATA].source = xSource; // Emulate the ES6 `flags` prop by ensuring flags are in alphabetical order

  regex[REGEX_DATA].flags = xFlags ? xFlags.split('').sort().join('') : xFlags;
  return regex;
}
/**
 * Removes any duplicate characters from the provided string.
 *
 * @private
 * @param {String} str String to remove duplicate characters from.
 * @returns {String} String with any duplicate characters removed.
 */


function clipDuplicates(str) {
  return nativ.replace.call(str, /([\s\S])(?=[\s\S]*\1)/g, '');
}
/**
 * Copies a regex object while preserving extended data and augmenting with `XRegExp.prototype`
 * properties. The copy has a fresh `lastIndex` property (set to zero). Allows adding and removing
 * flags g and y while copying the regex.
 *
 * @private
 * @param {RegExp} regex Regex to copy.
 * @param {Object} [options] Options object with optional properties:
 *   - `addG` {Boolean} Add flag g while copying the regex.
 *   - `addY` {Boolean} Add flag y while copying the regex.
 *   - `removeG` {Boolean} Remove flag g while copying the regex.
 *   - `removeY` {Boolean} Remove flag y while copying the regex.
 *   - `isInternalOnly` {Boolean} Whether the copied regex will be used only for internal
 *     operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *     skipping some operations like attaching `XRegExp.prototype` properties.
 *   - `source` {String} Overrides `<regex>.source`, for special cases.
 * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
 */


function copyRegex(regex, options) {
  if (!XRegExp.isRegExp(regex)) {
    throw new TypeError('Type RegExp expected');
  }

  var xData = regex[REGEX_DATA] || {};
  var flags = getNativeFlags(regex);
  var flagsToAdd = '';
  var flagsToRemove = '';
  var xregexpSource = null;
  var xregexpFlags = null;
  options = options || {};

  if (options.removeG) {
    flagsToRemove += 'g';
  }

  if (options.removeY) {
    flagsToRemove += 'y';
  }

  if (flagsToRemove) {
    flags = nativ.replace.call(flags, new RegExp("[".concat(flagsToRemove, "]+"), 'g'), '');
  }

  if (options.addG) {
    flagsToAdd += 'g';
  }

  if (options.addY) {
    flagsToAdd += 'y';
  }

  if (flagsToAdd) {
    flags = clipDuplicates(flags + flagsToAdd);
  }

  if (!options.isInternalOnly) {
    if (xData.source !== undefined) {
      xregexpSource = xData.source;
    } // null or undefined; don't want to add to `flags` if the previous value was null, since
    // that indicates we're not tracking original precompilation flags


    if (xData.flags != null) {
      // Flags are only added for non-internal regexes by `XRegExp.globalize`. Flags are never
      // removed for non-internal regexes, so don't need to handle it
      xregexpFlags = flagsToAdd ? clipDuplicates(xData.flags + flagsToAdd) : xData.flags;
    }
  } // Augment with `XRegExp.prototype` properties, but use the native `RegExp` constructor to avoid
  // searching for special tokens. That would be wrong for regexes constructed by `RegExp`, and
  // unnecessary for regexes constructed by `XRegExp` because the regex has already undergone the
  // translation to native regex syntax


  regex = augment(new RegExp(options.source || regex.source, flags), hasNamedCapture(regex) ? xData.captureNames.slice(0) : null, xregexpSource, xregexpFlags, options.isInternalOnly);
  return regex;
}
/**
 * Converts hexadecimal to decimal.
 *
 * @private
 * @param {String} hex
 * @returns {Number}
 */


function dec(hex) {
  return parseInt(hex, 16);
}
/**
 * Returns a pattern that can be used in a native RegExp in place of an ignorable token such as an
 * inline comment or whitespace with flag x. This is used directly as a token handler function
 * passed to `XRegExp.addToken`.
 *
 * @private
 * @param {String} match Match arg of `XRegExp.addToken` handler
 * @param {String} scope Scope arg of `XRegExp.addToken` handler
 * @param {String} flags Flags arg of `XRegExp.addToken` handler
 * @returns {String} Either '' or '(?:)', depending on which is needed in the context of the match.
 */


function getContextualTokenSeparator(match, scope, flags) {
  if ( // No need to separate tokens if at the beginning or end of a group
  match.input[match.index - 1] === '(' || match.input[match.index + match[0].length] === ')' || // No need to separate tokens if before or after a `|`
  match.input[match.index - 1] === '|' || match.input[match.index + match[0].length] === '|' || // No need to separate tokens if at the beginning or end of the pattern
  match.index < 1 || match.index + match[0].length >= match.input.length || // No need to separate tokens if at the beginning of a noncapturing group or lookahead.
  // The way this is written relies on:
  // - The search regex matching only 3-char strings.
  // - Although `substr` gives chars from the end of the string if given a negative index,
  //   the resulting substring will be too short to match. Ex: `'abcd'.substr(-1, 3) === 'd'`
  nativ.test.call(/^\(\?[:=!]/, match.input.substr(match.index - 3, 3)) || // Avoid separating tokens when the following token is a quantifier
  isQuantifierNext(match.input, match.index + match[0].length, flags)) {
    return '';
  } // Keep tokens separated. This avoids e.g. inadvertedly changing `\1 1` or `\1(?#)1` to `\11`.
  // This also ensures all tokens remain as discrete atoms, e.g. it avoids converting the syntax
  // error `(? :` into `(?:`.


  return '(?:)';
}
/**
 * Returns native `RegExp` flags used by a regex object.
 *
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {String} Native flags in use.
 */


function getNativeFlags(regex) {
  return hasFlagsProp ? regex.flags : // Explicitly using `RegExp.prototype.toString` (rather than e.g. `String` or concatenation
  // with an empty string) allows this to continue working predictably when
  // `XRegExp.proptotype.toString` is overridden
  nativ.exec.call(/\/([a-z]*)$/i, RegExp.prototype.toString.call(regex))[1];
}
/**
 * Determines whether a regex has extended instance data used to track capture names.
 *
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {Boolean} Whether the regex uses named capture.
 */


function hasNamedCapture(regex) {
  return !!(regex[REGEX_DATA] && regex[REGEX_DATA].captureNames);
}
/**
 * Converts decimal to hexadecimal.
 *
 * @private
 * @param {Number|String} dec
 * @returns {String}
 */


function hex(dec) {
  return parseInt(dec, 10).toString(16);
}
/**
 * Checks whether the next nonignorable token after the specified position is a quantifier.
 *
 * @private
 * @param {String} pattern Pattern to search within.
 * @param {Number} pos Index in `pattern` to search at.
 * @param {String} flags Flags used by the pattern.
 * @returns {Boolean} Whether the next nonignorable token is a quantifier.
 */


function isQuantifierNext(pattern, pos, flags) {
  var inlineCommentPattern = '\\(\\?#[^)]*\\)';
  var lineCommentPattern = '#[^#\\n]*';
  var quantifierPattern = '[?*+]|{\\d+(?:,\\d*)?}';
  return nativ.test.call(flags.indexOf('x') !== -1 ? // Ignore any leading whitespace, line comments, and inline comments
  /^(?:\s|#[^#\n]*|\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/ : // Ignore any leading inline comments
  /^(?:\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/, pattern.slice(pos));
}
/**
 * Determines whether a value is of the specified type, by resolving its internal [[Class]].
 *
 * @private
 * @param {*} value Object to check.
 * @param {String} type Type to check for, in TitleCase.
 * @returns {Boolean} Whether the object matches the type.
 */


function isType(value, type) {
  return toString.call(value) === "[object ".concat(type, "]");
}
/**
 * Adds leading zeros if shorter than four characters. Used for fixed-length hexadecimal values.
 *
 * @private
 * @param {String} str
 * @returns {String}
 */


function pad4(str) {
  while (str.length < 4) {
    str = "0".concat(str);
  }

  return str;
}
/**
 * Checks for flag-related errors, and strips/applies flags in a leading mode modifier. Offloads
 * the flag preparation logic from the `XRegExp` constructor.
 *
 * @private
 * @param {String} pattern Regex pattern, possibly with a leading mode modifier.
 * @param {String} flags Any combination of flags.
 * @returns {Object} Object with properties `pattern` and `flags`.
 */


function prepareFlags(pattern, flags) {
  // Recent browsers throw on duplicate flags, so copy this behavior for nonnative flags
  if (clipDuplicates(flags) !== flags) {
    throw new SyntaxError("Invalid duplicate regex flag ".concat(flags));
  } // Strip and apply a leading mode modifier with any combination of flags except g or y


  pattern = nativ.replace.call(pattern, /^\(\?([\w$]+)\)/, function ($0, $1) {
    if (nativ.test.call(/[gy]/, $1)) {
      throw new SyntaxError("Cannot use flag g or y in mode modifier ".concat($0));
    } // Allow duplicate flags within the mode modifier


    flags = clipDuplicates(flags + $1);
    return '';
  }); // Throw on unknown native or nonnative flags

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = flags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var flag = _step.value;

      if (!registeredFlags[flag]) {
        throw new SyntaxError("Unknown regex flag ".concat(flag));
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    pattern: pattern,
    flags: flags
  };
}
/**
 * Prepares an options object from the given value.
 *
 * @private
 * @param {String|Object} value Value to convert to an options object.
 * @returns {Object} Options object.
 */


function prepareOptions(value) {
  var options = {};

  if (isType(value, 'String')) {
    XRegExp.forEach(value, /[^\s,]+/, function (match) {
      options[match] = true;
    });
    return options;
  }

  return value;
}
/**
 * Registers a flag so it doesn't throw an 'unknown flag' error.
 *
 * @private
 * @param {String} flag Single-character flag to register.
 */


function registerFlag(flag) {
  if (!/^[\w$]$/.test(flag)) {
    throw new Error('Flag must be a single character A-Za-z0-9_$');
  }

  registeredFlags[flag] = true;
}
/**
 * Runs built-in and custom regex syntax tokens in reverse insertion order at the specified
 * position, until a match is found.
 *
 * @private
 * @param {String} pattern Original pattern from which an XRegExp object is being built.
 * @param {String} flags Flags being used to construct the regex.
 * @param {Number} pos Position to search for tokens within `pattern`.
 * @param {Number} scope Regex scope to apply: 'default' or 'class'.
 * @param {Object} context Context object to use for token handler functions.
 * @returns {Object} Object with properties `matchLength`, `output`, and `reparse`; or `null`.
 */


function runTokens(pattern, flags, pos, scope, context) {
  var i = tokens.length;
  var leadChar = pattern[pos];
  var result = null;
  var match;
  var t; // Run in reverse insertion order

  while (i--) {
    t = tokens[i];

    if (t.leadChar && t.leadChar !== leadChar || t.scope !== scope && t.scope !== 'all' || t.flag && !(flags.indexOf(t.flag) !== -1)) {
      continue;
    }

    match = XRegExp.exec(pattern, t.regex, pos, 'sticky');

    if (match) {
      result = {
        matchLength: match[0].length,
        output: t.handler.call(context, match, scope, flags),
        reparse: t.reparse
      }; // Finished with token tests

      break;
    }
  }

  return result;
}
/**
 * Enables or disables implicit astral mode opt-in. When enabled, flag A is automatically added to
 * all new regexes created by XRegExp. This causes an error to be thrown when creating regexes if
 * the Unicode Base addon is not available, since flag A is registered by that addon.
 *
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */


function setAstral(on) {
  features.astral = on;
}
/**
 * Adds named capture groups to the `groups` property of match arrays. See here for details:
 * https://github.com/tc39/proposal-regexp-named-groups
 *
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */


function setNamespacing(on) {
  features.namespacing = on;
}
/**
 * Returns the object, or throws an error if it is `null` or `undefined`. This is used to follow
 * the ES5 abstract operation `ToObject`.
 *
 * @private
 * @param {*} value Object to check and return.
 * @returns {*} The provided object.
 */


function toObject(value) {
  // null or undefined
  if (value == null) {
    throw new TypeError('Cannot convert null or undefined to object');
  }

  return value;
} // ==--------------------------==
// Constructor
// ==--------------------------==

/**
 * Creates an extended regular expression object for matching text with a pattern. Differs from a
 * native regular expression in that additional syntax and flags are supported. The returned object
 * is in fact a native `RegExp` and works with all native methods.
 *
 * @class XRegExp
 * @constructor
 * @param {String|RegExp} pattern Regex pattern string, or an existing regex object to copy.
 * @param {String} [flags] Any combination of flags.
 *   Native flags:
 *     - `g` - global
 *     - `i` - ignore case
 *     - `m` - multiline anchors
 *     - `u` - unicode (ES6)
 *     - `y` - sticky (Firefox 3+, ES6)
 *   Additional XRegExp flags:
 *     - `n` - explicit capture
 *     - `s` - dot matches all (aka singleline)
 *     - `x` - free-spacing and line comments (aka extended)
 *     - `A` - astral (requires the Unicode Base addon)
 *   Flags cannot be provided when constructing one `RegExp` from another.
 * @returns {RegExp} Extended regular expression object.
 * @example
 *
 * // With named capture and flag x
 * XRegExp(`(?<year>  [0-9]{4} ) -?  # year
 *          (?<month> [0-9]{2} ) -?  # month
 *          (?<day>   [0-9]{2} )     # day`, 'x');
 *
 * // Providing a regex object copies it. Native regexes are recompiled using native (not XRegExp)
 * // syntax. Copies maintain extended data, are augmented with `XRegExp.prototype` properties, and
 * // have fresh `lastIndex` properties (set to zero).
 * XRegExp(/regex/);
 */


function XRegExp(pattern, flags) {
  if (XRegExp.isRegExp(pattern)) {
    if (flags !== undefined) {
      throw new TypeError('Cannot supply flags when copying a RegExp');
    }

    return copyRegex(pattern);
  } // Copy the argument behavior of `RegExp`


  pattern = pattern === undefined ? '' : String(pattern);
  flags = flags === undefined ? '' : String(flags);

  if (XRegExp.isInstalled('astral') && !(flags.indexOf('A') !== -1)) {
    // This causes an error to be thrown if the Unicode Base addon is not available
    flags += 'A';
  }

  if (!patternCache[pattern]) {
    patternCache[pattern] = {};
  }

  if (!patternCache[pattern][flags]) {
    var context = {
      hasNamedCapture: false,
      captureNames: []
    };
    var scope = defaultScope;
    var output = '';
    var pos = 0;
    var result; // Check for flag-related errors, and strip/apply flags in a leading mode modifier

    var applied = prepareFlags(pattern, flags);
    var appliedPattern = applied.pattern;
    var appliedFlags = applied.flags; // Use XRegExp's tokens to translate the pattern to a native regex pattern.
    // `appliedPattern.length` may change on each iteration if tokens use `reparse`

    while (pos < appliedPattern.length) {
      do {
        // Check for custom tokens at the current position
        result = runTokens(appliedPattern, appliedFlags, pos, scope, context); // If the matched token used the `reparse` option, splice its output into the
        // pattern before running tokens again at the same position

        if (result && result.reparse) {
          appliedPattern = appliedPattern.slice(0, pos) + result.output + appliedPattern.slice(pos + result.matchLength);
        }
      } while (result && result.reparse);

      if (result) {
        output += result.output;
        pos += result.matchLength || 1;
      } else {
        // Get the native token at the current position
        var _XRegExp$exec = XRegExp.exec(appliedPattern, nativeTokens[scope], pos, 'sticky'),
            _XRegExp$exec2 = _slicedToArray(_XRegExp$exec, 1),
            token = _XRegExp$exec2[0];

        output += token;
        pos += token.length;

        if (token === '[' && scope === defaultScope) {
          scope = classScope;
        } else if (token === ']' && scope === classScope) {
          scope = defaultScope;
        }
      }
    }

    patternCache[pattern][flags] = {
      // Use basic cleanup to collapse repeated empty groups like `(?:)(?:)` to `(?:)`. Empty
      // groups are sometimes inserted during regex transpilation in order to keep tokens
      // separated. However, more than one empty group in a row is never needed.
      pattern: nativ.replace.call(output, /(?:\(\?:\))+/g, '(?:)'),
      // Strip all but native flags
      flags: nativ.replace.call(appliedFlags, /[^gimuy]+/g, ''),
      // `context.captureNames` has an item for each capturing group, even if unnamed
      captures: context.hasNamedCapture ? context.captureNames : null
    };
  }

  var generated = patternCache[pattern][flags];
  return augment(new RegExp(generated.pattern, generated.flags), generated.captures, pattern, flags);
} // Add `RegExp.prototype` to the prototype chain


XRegExp.prototype = /(?:)/; // ==--------------------------==
// Public properties
// ==--------------------------==

/**
 * The XRegExp version number as a string containing three dot-separated parts. For example,
 * '2.0.0-beta-3'.
 *
 * @static
 * @memberOf XRegExp
 * @type String
 */

XRegExp.version = '4.2.0'; // ==--------------------------==
// Public methods
// ==--------------------------==
// Intentionally undocumented; used in tests and addons

XRegExp._clipDuplicates = clipDuplicates;
XRegExp._hasNativeFlag = hasNativeFlag;
XRegExp._dec = dec;
XRegExp._hex = hex;
XRegExp._pad4 = pad4;
/**
 * Extends XRegExp syntax and allows custom flags. This is used internally and can be used to
 * create XRegExp addons. If more than one token can match the same string, the last added wins.
 *
 * @memberOf XRegExp
 * @param {RegExp} regex Regex object that matches the new token.
 * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
 *   to replace the matched token within all future XRegExp regexes. Has access to persistent
 *   properties of the regex being built, through `this`. Invoked with three arguments:
 *   - The match array, with named backreference properties.
 *   - The regex scope where the match was found: 'default' or 'class'.
 *   - The flags used by the regex, including any flags in a leading mode modifier.
 *   The handler function becomes part of the XRegExp construction process, so be careful not to
 *   construct XRegExps within the function or you will trigger infinite recursion.
 * @param {Object} [options] Options object with optional properties:
 *   - `scope` {String} Scope where the token applies: 'default', 'class', or 'all'.
 *   - `flag` {String} Single-character flag that triggers the token. This also registers the
 *     flag, which prevents XRegExp from throwing an 'unknown flag' error when the flag is used.
 *   - `optionalFlags` {String} Any custom flags checked for within the token `handler` that are
 *     not required to trigger the token. This registers the flags, to prevent XRegExp from
 *     throwing an 'unknown flag' error when any of the flags are used.
 *   - `reparse` {Boolean} Whether the `handler` function's output should not be treated as
 *     final, and instead be reparseable by other tokens (including the current token). Allows
 *     token chaining or deferring.
 *   - `leadChar` {String} Single character that occurs at the beginning of any successful match
 *     of the token (not always applicable). This doesn't change the behavior of the token unless
 *     you provide an erroneous value. However, providing it can increase the token's performance
 *     since the token can be skipped at any positions where this character doesn't appear.
 * @example
 *
 * // Basic usage: Add \a for the ALERT control code
 * XRegExp.addToken(
 *   /\\a/,
 *   () => '\\x07',
 *   {scope: 'all'}
 * );
 * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
 *
 * // Add the U (ungreedy) flag from PCRE and RE2, which reverses greedy and lazy quantifiers.
 * // Since `scope` is not specified, it uses 'default' (i.e., transformations apply outside of
 * // character classes only)
 * XRegExp.addToken(
 *   /([?*+]|{\d+(?:,\d*)?})(\??)/,
 *   (match) => `${match[1]}${match[2] ? '' : '?'}`,
 *   {flag: 'U'}
 * );
 * XRegExp('a+', 'U').exec('aaa')[0]; // -> 'a'
 * XRegExp('a+?', 'U').exec('aaa')[0]; // -> 'aaa'
 */

XRegExp.addToken = function (regex, handler, options) {
  options = options || {};
  var _options = options,
      optionalFlags = _options.optionalFlags;

  if (options.flag) {
    registerFlag(options.flag);
  }

  if (optionalFlags) {
    optionalFlags = nativ.split.call(optionalFlags, '');
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = optionalFlags[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var flag = _step2.value;
        registerFlag(flag);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  } // Add to the private list of syntax tokens


  tokens.push({
    regex: copyRegex(regex, {
      addG: true,
      addY: hasNativeY,
      isInternalOnly: true
    }),
    handler: handler,
    scope: options.scope || defaultScope,
    flag: options.flag,
    reparse: options.reparse,
    leadChar: options.leadChar
  }); // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and flags
  // might now produce different results

  XRegExp.cache.flush('patterns');
};
/**
 * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
 * the same pattern and flag combination, the cached copy of the regex is returned.
 *
 * @memberOf XRegExp
 * @param {String} pattern Regex pattern string.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Cached XRegExp object.
 * @example
 *
 * while (match = XRegExp.cache('.', 'gs').exec(str)) {
 *   // The regex is compiled once only
 * }
 */


XRegExp.cache = function (pattern, flags) {
  if (!regexCache[pattern]) {
    regexCache[pattern] = {};
  }

  return regexCache[pattern][flags] || (regexCache[pattern][flags] = XRegExp(pattern, flags));
}; // Intentionally undocumented; used in tests


XRegExp.cache.flush = function (cacheName) {
  if (cacheName === 'patterns') {
    // Flush the pattern cache used by the `XRegExp` constructor
    patternCache = {};
  } else {
    // Flush the regex cache populated by `XRegExp.cache`
    regexCache = {};
  }
};
/**
 * Escapes any regular expression metacharacters, for use when matching literal strings. The result
 * can safely be used at any point within a regex that uses any flags.
 *
 * @memberOf XRegExp
 * @param {String} str String to escape.
 * @returns {String} String with regex metacharacters escaped.
 * @example
 *
 * XRegExp.escape('Escaped? <.>');
 * // -> 'Escaped\?\ <\.>'
 */


XRegExp.escape = function (str) {
  return nativ.replace.call(toObject(str), /[-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
/**
 * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
 * regex uses named capture, named backreference properties are included on the match array.
 * Optional `pos` and `sticky` arguments specify the search start position, and whether the match
 * must start at the specified position only. The `lastIndex` property of the provided regex is not
 * used, but is updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.exec` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Array} Match array with named backreference properties, or `null`.
 * @example
 *
 * // Basic use, with named backreference
 * let match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
 * match.hex; // -> '2620'
 *
 * // With pos and sticky, in a loop
 * let pos = 2, result = [], match;
 * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
 *   result.push(match[1]);
 *   pos = match.index + match[0].length;
 * }
 * // result -> ['2', '3', '4']
 */


XRegExp.exec = function (str, regex, pos, sticky) {
  var cacheKey = 'g';
  var addY = false;
  var fakeY = false;
  var match;
  addY = hasNativeY && !!(sticky || regex.sticky && sticky !== false);

  if (addY) {
    cacheKey += 'y';
  } else if (sticky) {
    // Simulate sticky matching by appending an empty capture to the original regex. The
    // resulting regex will succeed no matter what at the current index (set with `lastIndex`),
    // and will not search the rest of the subject string. We'll know that the original regex
    // has failed if that last capture is `''` rather than `undefined` (i.e., if that last
    // capture participated in the match).
    fakeY = true;
    cacheKey += 'FakeY';
  }

  regex[REGEX_DATA] = regex[REGEX_DATA] || {}; // Shares cached copies with `XRegExp.match`/`replace`

  var r2 = regex[REGEX_DATA][cacheKey] || (regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
    addG: true,
    addY: addY,
    source: fakeY ? "".concat(regex.source, "|()") : undefined,
    removeY: sticky === false,
    isInternalOnly: true
  }));
  pos = pos || 0;
  r2.lastIndex = pos; // Fixed `exec` required for `lastIndex` fix, named backreferences, etc.

  match = fixed.exec.call(r2, str); // Get rid of the capture added by the pseudo-sticky matcher if needed. An empty string means
  // the original regexp failed (see above).

  if (fakeY && match && match.pop() === '') {
    match = null;
  }

  if (regex.global) {
    regex.lastIndex = match ? r2.lastIndex : 0;
  }

  return match;
};
/**
 * Executes a provided function once per regex match. Searches always start at the beginning of the
 * string and continue until the end, regardless of the state of the regex's `global` property and
 * initial `lastIndex`.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Function} callback Function to execute for each match. Invoked with four arguments:
 *   - The match array, with named backreference properties.
 *   - The zero-based match index.
 *   - The string being traversed.
 *   - The regex object being used to traverse the string.
 * @example
 *
 * // Extracts every other digit from a string
 * const evens = [];
 * XRegExp.forEach('1a2345', /\d/, (match, i) => {
 *   if (i % 2) evens.push(+match[0]);
 * });
 * // evens -> [2, 4]
 */


XRegExp.forEach = function (str, regex, callback) {
  var pos = 0;
  var i = -1;
  var match;

  while (match = XRegExp.exec(str, regex, pos)) {
    // Because `regex` is provided to `callback`, the function could use the deprecated/
    // nonstandard `RegExp.prototype.compile` to mutate the regex. However, since `XRegExp.exec`
    // doesn't use `lastIndex` to set the search position, this can't lead to an infinite loop,
    // at least. Actually, because of the way `XRegExp.exec` caches globalized versions of
    // regexes, mutating the regex will not have any effect on the iteration or matched strings,
    // which is a nice side effect that brings extra safety.
    callback(match, ++i, str, regex);
    pos = match.index + (match[0].length || 1);
  }
};
/**
 * Copies a regex object and adds flag `g`. The copy maintains extended data, is augmented with
 * `XRegExp.prototype` properties, and has a fresh `lastIndex` property (set to zero). Native
 * regexes are not recompiled using XRegExp syntax.
 *
 * @memberOf XRegExp
 * @param {RegExp} regex Regex to globalize.
 * @returns {RegExp} Copy of the provided regex with flag `g` added.
 * @example
 *
 * const globalCopy = XRegExp.globalize(/regex/);
 * globalCopy.global; // -> true
 */


XRegExp.globalize = function (regex) {
  return copyRegex(regex, {
    addG: true
  });
};
/**
 * Installs optional features according to the specified options. Can be undone using
 * `XRegExp.uninstall`.
 *
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.install({
 *   // Enables support for astral code points in Unicode addons (implicitly sets flag A)
 *   astral: true,
 *
 *   // Adds named capture groups to the `groups` property of matches
 *   namespacing: true
 * });
 *
 * // With an options string
 * XRegExp.install('astral namespacing');
 */


XRegExp.install = function (options) {
  options = prepareOptions(options);

  if (!features.astral && options.astral) {
    setAstral(true);
  }

  if (!features.namespacing && options.namespacing) {
    setNamespacing(true);
  }
};
/**
 * Checks whether an individual optional feature is installed.
 *
 * @memberOf XRegExp
 * @param {String} feature Name of the feature to check. One of:
 *   - `astral`
 *   - `namespacing`
 * @returns {Boolean} Whether the feature is installed.
 * @example
 *
 * XRegExp.isInstalled('astral');
 */


XRegExp.isInstalled = function (feature) {
  return !!features[feature];
};
/**
 * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
 * created in another frame, when `instanceof` and `constructor` checks would fail.
 *
 * @memberOf XRegExp
 * @param {*} value Object to check.
 * @returns {Boolean} Whether the object is a `RegExp` object.
 * @example
 *
 * XRegExp.isRegExp('string'); // -> false
 * XRegExp.isRegExp(/regex/i); // -> true
 * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
 * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
 */


XRegExp.isRegExp = function (value) {
  return toString.call(value) === '[object RegExp]';
}; // isType(value, 'RegExp');

/**
 * Returns the first matched string, or in global mode, an array containing all matched strings.
 * This is essentially a more convenient re-implementation of `String.prototype.match` that gives
 * the result types you actually want (string instead of `exec`-style array in match-first mode,
 * and an empty array instead of `null` when no matches are found in match-all mode). It also lets
 * you override flag g and ignore `lastIndex`, and fixes browser bugs.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {String} [scope='one'] Use 'one' to return the first match as a string. Use 'all' to
 *   return an array of all matched strings. If not explicitly specified and `regex` uses flag g,
 *   `scope` is 'all'.
 * @returns {String|Array} In match-first mode: First match as a string, or `null`. In match-all
 *   mode: Array of all matched strings, or an empty array.
 * @example
 *
 * // Match first
 * XRegExp.match('abc', /\w/); // -> 'a'
 * XRegExp.match('abc', /\w/g, 'one'); // -> 'a'
 * XRegExp.match('abc', /x/g, 'one'); // -> null
 *
 * // Match all
 * XRegExp.match('abc', /\w/g); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /\w/, 'all'); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /x/, 'all'); // -> []
 */


XRegExp.match = function (str, regex, scope) {
  var global = regex.global && scope !== 'one' || scope === 'all';
  var cacheKey = (global ? 'g' : '') + (regex.sticky ? 'y' : '') || 'noGY';
  regex[REGEX_DATA] = regex[REGEX_DATA] || {}; // Shares cached copies with `XRegExp.exec`/`replace`

  var r2 = regex[REGEX_DATA][cacheKey] || (regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
    addG: !!global,
    removeG: scope === 'one',
    isInternalOnly: true
  }));
  var result = nativ.match.call(toObject(str), r2);

  if (regex.global) {
    regex.lastIndex = scope === 'one' && result ? // Can't use `r2.lastIndex` since `r2` is nonglobal in this case
    result.index + result[0].length : 0;
  }

  return global ? result || [] : result && result[0];
};
/**
 * Retrieves the matches from searching a string using a chain of regexes that successively search
 * within previous matches. The provided `chain` array can contain regexes and or objects with
 * `regex` and `backref` properties. When a backreference is specified, the named or numbered
 * backreference is passed forward to the next regex or returned.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} chain Regexes that each search for matches within preceding results.
 * @returns {Array} Matches by the last regex in the chain, or an empty array.
 * @example
 *
 * // Basic usage; matches numbers within <b> tags
 * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
 *   XRegExp('(?is)<b>.*?</b>'),
 *   /\d+/
 * ]);
 * // -> ['2', '4', '56']
 *
 * // Passing forward and returning specific backreferences
 * html = '<a href="http://xregexp.com/api/">XRegExp</a>\
 *         <a href="http://www.google.com/">Google</a>';
 * XRegExp.matchChain(html, [
 *   {regex: /<a href="([^"]+)">/i, backref: 1},
 *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
 * ]);
 * // -> ['xregexp.com', 'www.google.com']
 */


XRegExp.matchChain = function (str, chain) {
  return function recurseChain(values, level) {
    var item = chain[level].regex ? chain[level] : {
      regex: chain[level]
    };
    var matches = [];

    function addMatch(match) {
      if (item.backref) {
        var ERR_UNDEFINED_GROUP = "Backreference to undefined group: ".concat(item.backref);
        var isNamedBackref = isNaN(item.backref);

        if (isNamedBackref && XRegExp.isInstalled('namespacing')) {
          // `groups` has `null` as prototype, so using `in` instead of `hasOwnProperty`
          if (!(item.backref in match.groups)) {
            throw new ReferenceError(ERR_UNDEFINED_GROUP);
          }
        } else if (!match.hasOwnProperty(item.backref)) {
          throw new ReferenceError(ERR_UNDEFINED_GROUP);
        }

        var backrefValue = isNamedBackref && XRegExp.isInstalled('namespacing') ? match.groups[item.backref] : match[item.backref];
        matches.push(backrefValue || '');
      } else {
        matches.push(match[0]);
      }
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = values[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var value = _step3.value;
        XRegExp.forEach(value, item.regex, addMatch);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return level === chain.length - 1 || !matches.length ? matches : recurseChain(matches, level + 1);
  }([str], 0);
};
/**
 * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
 * or regex, and the replacement can be a string or a function to be called for each match. To
 * perform a global search and replace, use the optional `scope` argument or include flag g if using
 * a regex. Replacement strings can use `${n}` or `$<n>` for named and numbered backreferences.
 * Replacement functions can use named backreferences via `arguments[0].name`. Also fixes browser
 * bugs compared to the native `String.prototype.replace` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 *   Replacement strings can include special replacement syntax:
 *     - $$ - Inserts a literal $ character.
 *     - $&, $0 - Inserts the matched substring.
 *     - $` - Inserts the string that precedes the matched substring (left context).
 *     - $' - Inserts the string that follows the matched substring (right context).
 *     - $n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
 *       backreference n/nn.
 *     - ${n}, $<n> - Where n is a name or any number of digits that reference an existent capturing
 *       group, inserts backreference n.
 *   Replacement functions are invoked with three or more arguments:
 *     - The matched substring (corresponds to $& above). Named backreferences are accessible as
 *       properties of this first argument.
 *     - 0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
 *     - The zero-based index of the match within the total search string.
 *     - The total string being searched.
 * @param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
 *   explicitly specified and using a regex with flag g, `scope` is 'all'.
 * @returns {String} New string with one or all matches replaced.
 * @example
 *
 * // Regex search, using named backreferences in replacement string
 * const name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
 * XRegExp.replace('John Smith', name, '$<last>, $<first>');
 * // -> 'Smith, John'
 *
 * // Regex search, using named backreferences in replacement function
 * XRegExp.replace('John Smith', name, (match) => `${match.last}, ${match.first}`);
 * // -> 'Smith, John'
 *
 * // String search, with replace-all
 * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
 * // -> 'XRegExp builds XRegExps'
 */


XRegExp.replace = function (str, search, replacement, scope) {
  var isRegex = XRegExp.isRegExp(search);
  var global = search.global && scope !== 'one' || scope === 'all';
  var cacheKey = (global ? 'g' : '') + (search.sticky ? 'y' : '') || 'noGY';
  var s2 = search;

  if (isRegex) {
    search[REGEX_DATA] = search[REGEX_DATA] || {}; // Shares cached copies with `XRegExp.exec`/`match`. Since a copy is used, `search`'s
    // `lastIndex` isn't updated *during* replacement iterations

    s2 = search[REGEX_DATA][cacheKey] || (search[REGEX_DATA][cacheKey] = copyRegex(search, {
      addG: !!global,
      removeG: scope === 'one',
      isInternalOnly: true
    }));
  } else if (global) {
    s2 = new RegExp(XRegExp.escape(String(search)), 'g');
  } // Fixed `replace` required for named backreferences, etc.


  var result = fixed.replace.call(toObject(str), s2, replacement);

  if (isRegex && search.global) {
    // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
    search.lastIndex = 0;
  }

  return result;
};
/**
 * Performs batch processing of string replacements. Used like `XRegExp.replace`, but accepts an
 * array of replacement details. Later replacements operate on the output of earlier replacements.
 * Replacement details are accepted as an array with a regex or string to search for, the
 * replacement string or function, and an optional scope of 'one' or 'all'. Uses the XRegExp
 * replacement text syntax, which supports named backreference properties via `${name}` or
 * `$<name>`.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} replacements Array of replacement detail arrays.
 * @returns {String} New string with all replacements.
 * @example
 *
 * str = XRegExp.replaceEach(str, [
 *   [XRegExp('(?<name>a)'), 'z${name}'],
 *   [/b/gi, 'y'],
 *   [/c/g, 'x', 'one'], // scope 'one' overrides /g
 *   [/d/, 'w', 'all'],  // scope 'all' overrides lack of /g
 *   ['e', 'v', 'all'],  // scope 'all' allows replace-all for strings
 *   [/f/g, ($0) => $0.toUpperCase()]
 * ]);
 */


XRegExp.replaceEach = function (str, replacements) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = replacements[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var r = _step4.value;
      str = XRegExp.replace(str, r[0], r[1], r[2]);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return str;
};
/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * XRegExp.split('a b c', ' ');
 * // -> ['a', 'b', 'c']
 *
 * // With limit
 * XRegExp.split('a b c', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', '..']
 */


XRegExp.split = function (str, separator, limit) {
  return fixed.split.call(toObject(str), separator, limit);
};
/**
 * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
 * `sticky` arguments specify the search start position, and whether the match must start at the
 * specified position only. The `lastIndex` property of the provided regex is not used, but is
 * updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.test` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Boolean} Whether the regex matched the provided value.
 * @example
 *
 * // Basic use
 * XRegExp.test('abc', /c/); // -> true
 *
 * // With pos and sticky
 * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
 * XRegExp.test('abc', /c/, 2, 'sticky'); // -> true
 */
// Do this the easy way :-)


XRegExp.test = function (str, regex, pos, sticky) {
  return !!XRegExp.exec(str, regex, pos, sticky);
};
/**
 * Uninstalls optional features according to the specified options. All optional features start out
 * uninstalled, so this is used to undo the actions of `XRegExp.install`.
 *
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.uninstall({
 *   // Disables support for astral code points in Unicode addons
 *   astral: true,
 *
 *   // Don't add named capture groups to the `groups` property of matches
 *   namespacing: true
 * });
 *
 * // With an options string
 * XRegExp.uninstall('astral namespacing');
 */


XRegExp.uninstall = function (options) {
  options = prepareOptions(options);

  if (features.astral && options.astral) {
    setAstral(false);
  }

  if (features.namespacing && options.namespacing) {
    setNamespacing(false);
  }
};
/**
 * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
 * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
 * Backreferences in provided regex objects are automatically renumbered to work correctly within
 * the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
 * `flags` argument.
 *
 * @memberOf XRegExp
 * @param {Array} patterns Regexes and strings to combine.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @param {Object} [options] Options object with optional properties:
 *   - `conjunction` {String} Type of conjunction to use: 'or' (default) or 'none'.
 * @returns {RegExp} Union of the provided regexes and strings.
 * @example
 *
 * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
 * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
 *
 * XRegExp.union([/man/, /bear/, /pig/], 'i', {conjunction: 'none'});
 * // -> /manbearpig/i
 */


XRegExp.union = function (patterns, flags, options) {
  options = options || {};
  var conjunction = options.conjunction || 'or';
  var numCaptures = 0;
  var numPriorCaptures;
  var captureNames;

  function rewrite(match, paren, backref) {
    var name = captureNames[numCaptures - numPriorCaptures]; // Capturing group

    if (paren) {
      ++numCaptures; // If the current capture has a name, preserve the name

      if (name) {
        return "(?<".concat(name, ">");
      } // Backreference

    } else if (backref) {
      // Rewrite the backreference
      return "\\".concat(+backref + numPriorCaptures);
    }

    return match;
  }

  if (!(isType(patterns, 'Array') && patterns.length)) {
    throw new TypeError('Must provide a nonempty array of patterns to merge');
  }

  var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
  var output = [];
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = patterns[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var pattern = _step5.value;

      if (XRegExp.isRegExp(pattern)) {
        numPriorCaptures = numCaptures;
        captureNames = pattern[REGEX_DATA] && pattern[REGEX_DATA].captureNames || []; // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns are
        // independently valid; helps keep this simple. Named captures are put back

        output.push(nativ.replace.call(XRegExp(pattern.source).source, parts, rewrite));
      } else {
        output.push(XRegExp.escape(pattern));
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  var separator = conjunction === 'none' ? '' : '|';
  return XRegExp(output.join(separator), flags);
}; // ==--------------------------==
// Fixed/extended native methods
// ==--------------------------==

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `RegExp.prototype.exec`. Use via `XRegExp.exec`.
 *
 * @memberOf RegExp
 * @param {String} str String to search.
 * @returns {Array} Match array with named backreference properties, or `null`.
 */


fixed.exec = function (str) {
  var origLastIndex = this.lastIndex;
  var match = nativ.exec.apply(this, arguments);

  if (match) {
    // Fix browsers whose `exec` methods don't return `undefined` for nonparticipating capturing
    // groups. This fixes IE 5.5-8, but not IE 9's quirks mode or emulation of older IEs. IE 9
    // in standards mode follows the spec.
    if (!correctExecNpcg && match.length > 1 && match.indexOf('') !== -1) {
      var r2 = copyRegex(this, {
        removeG: true,
        isInternalOnly: true
      }); // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
      // matching due to characters outside the match

      nativ.replace.call(String(str).slice(match.index), r2, function () {
        var len = arguments.length; // Skip index 0 and the last 2

        for (var i = 1; i < len - 2; ++i) {
          if ((i < 0 || arguments.length <= i ? undefined : arguments[i]) === undefined) {
            match[i] = undefined;
          }
        }
      });
    } // Attach named capture properties


    var groupsObject = match;

    if (XRegExp.isInstalled('namespacing')) {
      // https://tc39.github.io/proposal-regexp-named-groups/#sec-regexpbuiltinexec
      match.groups = Object.create(null);
      groupsObject = match.groups;
    }

    if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
      // Skip index 0
      for (var i = 1; i < match.length; ++i) {
        var name = this[REGEX_DATA].captureNames[i - 1];

        if (name) {
          groupsObject[name] = match[i];
        }
      }
    } // Fix browsers that increment `lastIndex` after zero-length matches


    if (this.global && !match[0].length && this.lastIndex > match.index) {
      this.lastIndex = match.index;
    }
  }

  if (!this.global) {
    // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
    this.lastIndex = origLastIndex;
  }

  return match;
};
/**
 * Fixes browser bugs in the native `RegExp.prototype.test`.
 *
 * @memberOf RegExp
 * @param {String} str String to search.
 * @returns {Boolean} Whether the regex matched the provided value.
 */


fixed.test = function (str) {
  // Do this the easy way :-)
  return !!fixed.exec.call(this, str);
};
/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `String.prototype.match`.
 *
 * @memberOf String
 * @param {RegExp|*} regex Regex to search with. If not a regex object, it is passed to `RegExp`.
 * @returns {Array} If `regex` uses flag g, an array of match strings or `null`. Without flag g,
 *   the result of calling `regex.exec(this)`.
 */


fixed.match = function (regex) {
  if (!XRegExp.isRegExp(regex)) {
    // Use the native `RegExp` rather than `XRegExp`
    regex = new RegExp(regex);
  } else if (regex.global) {
    var result = nativ.match.apply(this, arguments); // Fixes IE bug

    regex.lastIndex = 0;
    return result;
  }

  return fixed.exec.call(regex, toObject(this));
};
/**
 * Adds support for `${n}` (or `$<n>`) tokens for named and numbered backreferences in replacement
 * text, and provides named backreferences to replacement functions as `arguments[0].name`. Also
 * fixes browser bugs in replacement text syntax when performing a replacement using a nonregex
 * search value, and the value of a replacement regex's `lastIndex` property during replacement
 * iterations and upon completion. Note that this doesn't support SpiderMonkey's proprietary third
 * (`flags`) argument. Use via `XRegExp.replace`.
 *
 * @memberOf String
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 * @returns {String} New string with one or all matches replaced.
 */


fixed.replace = function (search, replacement) {
  var isRegex = XRegExp.isRegExp(search);
  var origLastIndex;
  var captureNames;
  var result;

  if (isRegex) {
    if (search[REGEX_DATA]) {
      captureNames = search[REGEX_DATA].captureNames;
    } // Only needed if `search` is nonglobal


    origLastIndex = search.lastIndex;
  } else {
    search += ''; // Type-convert
  } // Don't use `typeof`; some older browsers return 'function' for regex objects


  if (isType(replacement, 'Function')) {
    // Stringifying `this` fixes a bug in IE < 9 where the last argument in replacement
    // functions isn't type-converted to a string
    result = nativ.replace.call(String(this), search, function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (captureNames) {
        var groupsObject;

        if (XRegExp.isInstalled('namespacing')) {
          // https://tc39.github.io/proposal-regexp-named-groups/#sec-regexpbuiltinexec
          groupsObject = Object.create(null);
          args.push(groupsObject);
        } else {
          // Change the `args[0]` string primitive to a `String` object that can store
          // properties. This really does need to use `String` as a constructor
          args[0] = new String(args[0]);
          groupsObject = args[0];
        } // Store named backreferences


        for (var i = 0; i < captureNames.length; ++i) {
          if (captureNames[i]) {
            groupsObject[captureNames[i]] = args[i + 1];
          }
        }
      } // Update `lastIndex` before calling `replacement`. Fixes IE, Chrome, Firefox, Safari
      // bug (last tested IE 9, Chrome 17, Firefox 11, Safari 5.1)


      if (isRegex && search.global) {
        search.lastIndex = args[args.length - 2] + args[0].length;
      } // ES6 specs the context for replacement functions as `undefined`


      return replacement.apply(void 0, args);
    });
  } else {
    // Ensure that the last value of `args` will be a string when given nonstring `this`,
    // while still throwing on null or undefined context
    result = nativ.replace.call(this == null ? this : String(this), search, function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return nativ.replace.call(String(replacement), replacementToken, replacer);

      function replacer($0, bracketed, angled, dollarToken) {
        bracketed = bracketed || angled; // Named or numbered backreference with curly or angled braces

        if (bracketed) {
          // XRegExp behavior for `${n}` or `$<n>`:
          // 1. Backreference to numbered capture, if `n` is an integer. Use `0` for the
          //    entire match. Any number of leading zeros may be used.
          // 2. Backreference to named capture `n`, if it exists and is not an integer
          //    overridden by numbered capture. In practice, this does not overlap with
          //    numbered capture since XRegExp does not allow named capture to use a bare
          //    integer as the name.
          // 3. If the name or number does not refer to an existing capturing group, it's
          //    an error.
          var n = +bracketed; // Type-convert; drop leading zeros

          if (n <= args.length - 3) {
            return args[n] || '';
          } // Groups with the same name is an error, else would need `lastIndexOf`


          n = captureNames ? captureNames.indexOf(bracketed) : -1;

          if (n < 0) {
            throw new SyntaxError("Backreference to undefined group ".concat($0));
          }

          return args[n + 1] || '';
        } // Else, special variable or numbered backreference without curly braces


        if (dollarToken === '$') {
          // $$
          return '$';
        }

        if (dollarToken === '&' || +dollarToken === 0) {
          // $&, $0 (not followed by 1-9), $00
          return args[0];
        }

        if (dollarToken === '`') {
          // $` (left context)
          return args[args.length - 1].slice(0, args[args.length - 2]);
        }

        if (dollarToken === "'") {
          // $' (right context)
          return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
        } // Else, numbered backreference without braces


        dollarToken = +dollarToken; // Type-convert; drop leading zero
        // XRegExp behavior for `$n` and `$nn`:
        // - Backrefs end after 1 or 2 digits. Use `${..}` or `$<..>` for more digits.
        // - `$1` is an error if no capturing groups.
        // - `$10` is an error if less than 10 capturing groups. Use `${1}0` or `$<1>0`
        //   instead.
        // - `$01` is `$1` if at least one capturing group, else it's an error.
        // - `$0` (not followed by 1-9) and `$00` are the entire match.
        // Native behavior, for comparison:
        // - Backrefs end after 1 or 2 digits. Cannot reference capturing group 100+.
        // - `$1` is a literal `$1` if no capturing groups.
        // - `$10` is `$1` followed by a literal `0` if less than 10 capturing groups.
        // - `$01` is `$1` if at least one capturing group, else it's a literal `$01`.
        // - `$0` is a literal `$0`.

        if (!isNaN(dollarToken)) {
          if (dollarToken > args.length - 3) {
            throw new SyntaxError("Backreference to undefined group ".concat($0));
          }

          return args[dollarToken] || '';
        } // `$` followed by an unsupported char is an error, unlike native JS


        throw new SyntaxError("Invalid token ".concat($0));
      }
    });
  }

  if (isRegex) {
    if (search.global) {
      // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
      search.lastIndex = 0;
    } else {
      // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
      search.lastIndex = origLastIndex;
    }
  }

  return result;
};
/**
 * Fixes browser bugs in the native `String.prototype.split`. Use via `XRegExp.split`.
 *
 * @memberOf String
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 */


fixed.split = function (separator, limit) {
  if (!XRegExp.isRegExp(separator)) {
    // Browsers handle nonregex split correctly, so use the faster native method
    return nativ.split.apply(this, arguments);
  }

  var str = String(this);
  var output = [];
  var origLastIndex = separator.lastIndex;
  var lastLastIndex = 0;
  var lastLength; // Values for `limit`, per the spec:
  // If undefined: pow(2,32) - 1
  // If 0, Infinity, or NaN: 0
  // If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
  // If negative number: pow(2,32) - floor(abs(limit))
  // If other: Type-convert, then use the above rules
  // This line fails in very strange ways for some values of `limit` in Opera 10.5-10.63, unless
  // Opera Dragonfly is open (go figure). It works in at least Opera 9.5-10.1 and 11+

  limit = (limit === undefined ? -1 : limit) >>> 0;
  XRegExp.forEach(str, separator, function (match) {
    // This condition is not the same as `if (match[0].length)`
    if (match.index + match[0].length > lastLastIndex) {
      output.push(str.slice(lastLastIndex, match.index));

      if (match.length > 1 && match.index < str.length) {
        Array.prototype.push.apply(output, match.slice(1));
      }

      lastLength = match[0].length;
      lastLastIndex = match.index + lastLength;
    }
  });

  if (lastLastIndex === str.length) {
    if (!nativ.test.call(separator, '') || lastLength) {
      output.push('');
    }
  } else {
    output.push(str.slice(lastLastIndex));
  }

  separator.lastIndex = origLastIndex;
  return output.length > limit ? output.slice(0, limit) : output;
}; // ==--------------------------==
// Built-in syntax/flag tokens
// ==--------------------------==

/*
 * Letter escapes that natively match literal characters: `\a`, `\A`, etc. These should be
 * SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-browser
 * consistency and to reserve their syntax, but lets them be superseded by addons.
 */


XRegExp.addToken(/\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/, function (match, scope) {
  // \B is allowed in default scope only
  if (match[1] === 'B' && scope === defaultScope) {
    return match[0];
  }

  throw new SyntaxError("Invalid escape ".concat(match[0]));
}, {
  scope: 'all',
  leadChar: '\\'
});
/*
 * Unicode code point escape with curly braces: `\u{N..}`. `N..` is any one or more digit
 * hexadecimal number from 0-10FFFF, and can include leading zeros. Requires the native ES6 `u` flag
 * to support code points greater than U+FFFF. Avoids converting code points above U+FFFF to
 * surrogate pairs (which could be done without flag `u`), since that could lead to broken behavior
 * if you follow a `\u{N..}` token that references a code point above U+FFFF with a quantifier, or
 * if you use the same in a character class.
 */

XRegExp.addToken(/\\u{([\dA-Fa-f]+)}/, function (match, scope, flags) {
  var code = dec(match[1]);

  if (code > 0x10FFFF) {
    throw new SyntaxError("Invalid Unicode code point ".concat(match[0]));
  }

  if (code <= 0xFFFF) {
    // Converting to \uNNNN avoids needing to escape the literal character and keep it
    // separate from preceding tokens
    return "\\u".concat(pad4(hex(code)));
  } // If `code` is between 0xFFFF and 0x10FFFF, require and defer to native handling


  if (hasNativeU && flags.indexOf('u') !== -1) {
    return match[0];
  }

  throw new SyntaxError('Cannot use Unicode code point above \\u{FFFF} without flag u');
}, {
  scope: 'all',
  leadChar: '\\'
});
/*
 * Empty character class: `[]` or `[^]`. This fixes a critical cross-browser syntax inconsistency.
 * Unless this is standardized (per the ES spec), regex syntax can't be accurately parsed because
 * character class endings can't be determined.
 */

XRegExp.addToken(/\[(\^?)\]/, // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
// (?!) should work like \b\B, but is unreliable in some versions of Firefox

/* eslint-disable no-confusing-arrow */
function (match) {
  return match[1] ? '[\\s\\S]' : '\\b\\B';
},
/* eslint-enable no-confusing-arrow */
{
  leadChar: '['
});
/*
 * Comment pattern: `(?# )`. Inline comments are an alternative to the line comments allowed in
 * free-spacing mode (flag x).
 */

XRegExp.addToken(/\(\?#[^)]*\)/, getContextualTokenSeparator, {
  leadChar: '('
});
/*
 * Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
 */

XRegExp.addToken(/\s+|#[^\n]*\n?/, getContextualTokenSeparator, {
  flag: 'x'
});
/*
 * Dot, in dotall mode (aka singleline mode, flag s) only.
 */

XRegExp.addToken(/\./, function () {
  return '[\\s\\S]';
}, {
  flag: 's',
  leadChar: '.'
});
/*
 * Named backreference: `\k<name>`. Backreference names can use the characters A-Z, a-z, 0-9, _,
 * and $ only. Also allows numbered backreferences as `\k<n>`.
 */

XRegExp.addToken(/\\k<([\w$]+)>/, function (match) {
  // Groups with the same name is an error, else would need `lastIndexOf`
  var index = isNaN(match[1]) ? this.captureNames.indexOf(match[1]) + 1 : +match[1];
  var endIndex = match.index + match[0].length;

  if (!index || index > this.captureNames.length) {
    throw new SyntaxError("Backreference to undefined group ".concat(match[0]));
  } // Keep backreferences separate from subsequent literal numbers. This avoids e.g.
  // inadvertedly changing `(?<n>)\k<n>1` to `()\11`.


  return "\\".concat(index).concat(endIndex === match.input.length || isNaN(match.input[endIndex]) ? '' : '(?:)');
}, {
  leadChar: '\\'
});
/*
 * Numbered backreference or octal, plus any following digits: `\0`, `\11`, etc. Octals except `\0`
 * not followed by 0-9 and backreferences to unopened capture groups throw an error. Other matches
 * are returned unaltered. IE < 9 doesn't support backreferences above `\99` in regex syntax.
 */

XRegExp.addToken(/\\(\d+)/, function (match, scope) {
  if (!(scope === defaultScope && /^[1-9]/.test(match[1]) && +match[1] <= this.captureNames.length) && match[1] !== '0') {
    throw new SyntaxError("Cannot use octal escape or backreference to undefined group ".concat(match[0]));
  }

  return match[0];
}, {
  scope: 'all',
  leadChar: '\\'
});
/*
 * Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
 * characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers. Supports Python-style
 * `(?P<name>` as an alternate syntax to avoid issues in some older versions of Opera which natively
 * supported the Python-style syntax. Otherwise, XRegExp might treat numbered backreferences to
 * Python-style named capture as octals.
 */

XRegExp.addToken(/\(\?P?<([\w$]+)>/, function (match) {
  // Disallow bare integers as names because named backreferences are added to match arrays
  // and therefore numeric properties may lead to incorrect lookups
  if (!isNaN(match[1])) {
    throw new SyntaxError("Cannot use integer as capture name ".concat(match[0]));
  }

  if (!XRegExp.isInstalled('namespacing') && (match[1] === 'length' || match[1] === '__proto__')) {
    throw new SyntaxError("Cannot use reserved word as capture name ".concat(match[0]));
  }

  if (this.captureNames.indexOf(match[1]) !== -1) {
    throw new SyntaxError("Cannot use same name for multiple groups ".concat(match[0]));
  }

  this.captureNames.push(match[1]);
  this.hasNamedCapture = true;
  return '(';
}, {
  leadChar: '('
});
/*
 * Capturing group; match the opening parenthesis only. Required for support of named capturing
 * groups. Also adds explicit capture mode (flag n).
 */

XRegExp.addToken(/\((?!\?)/, function (match, scope, flags) {
  if (flags.indexOf('n') !== -1) {
    return '(?:';
  }

  this.captureNames.push(null);
  return '(';
}, {
  optionalFlags: 'n',
  leadChar: '('
});
var _default = XRegExp;
exports.default = _default;
module.exports = exports["default"];
},{}],186:[function(require,module,exports){
module.exports = [
    {
        'name': 'InAdlam',
        'astral': '\uD83A[\uDD00-\uDD5F]'
    },
    {
        'name': 'InAegean_Numbers',
        'astral': '\uD800[\uDD00-\uDD3F]'
    },
    {
        'name': 'InAhom',
        'astral': '\uD805[\uDF00-\uDF3F]'
    },
    {
        'name': 'InAlchemical_Symbols',
        'astral': '\uD83D[\uDF00-\uDF7F]'
    },
    {
        'name': 'InAlphabetic_Presentation_Forms',
        'bmp': '\uFB00-\uFB4F'
    },
    {
        'name': 'InAnatolian_Hieroglyphs',
        'astral': '\uD811[\uDC00-\uDE7F]'
    },
    {
        'name': 'InAncient_Greek_Musical_Notation',
        'astral': '\uD834[\uDE00-\uDE4F]'
    },
    {
        'name': 'InAncient_Greek_Numbers',
        'astral': '\uD800[\uDD40-\uDD8F]'
    },
    {
        'name': 'InAncient_Symbols',
        'astral': '\uD800[\uDD90-\uDDCF]'
    },
    {
        'name': 'InArabic',
        'bmp': '\u0600-\u06FF'
    },
    {
        'name': 'InArabic_Extended_A',
        'bmp': '\u08A0-\u08FF'
    },
    {
        'name': 'InArabic_Mathematical_Alphabetic_Symbols',
        'astral': '\uD83B[\uDE00-\uDEFF]'
    },
    {
        'name': 'InArabic_Presentation_Forms_A',
        'bmp': '\uFB50-\uFDFF'
    },
    {
        'name': 'InArabic_Presentation_Forms_B',
        'bmp': '\uFE70-\uFEFF'
    },
    {
        'name': 'InArabic_Supplement',
        'bmp': '\u0750-\u077F'
    },
    {
        'name': 'InArmenian',
        'bmp': '\u0530-\u058F'
    },
    {
        'name': 'InArrows',
        'bmp': '\u2190-\u21FF'
    },
    {
        'name': 'InAvestan',
        'astral': '\uD802[\uDF00-\uDF3F]'
    },
    {
        'name': 'InBalinese',
        'bmp': '\u1B00-\u1B7F'
    },
    {
        'name': 'InBamum',
        'bmp': '\uA6A0-\uA6FF'
    },
    {
        'name': 'InBamum_Supplement',
        'astral': '\uD81A[\uDC00-\uDE3F]'
    },
    {
        'name': 'InBasic_Latin',
        'bmp': '\0-\x7F'
    },
    {
        'name': 'InBassa_Vah',
        'astral': '\uD81A[\uDED0-\uDEFF]'
    },
    {
        'name': 'InBatak',
        'bmp': '\u1BC0-\u1BFF'
    },
    {
        'name': 'InBengali',
        'bmp': '\u0980-\u09FF'
    },
    {
        'name': 'InBhaiksuki',
        'astral': '\uD807[\uDC00-\uDC6F]'
    },
    {
        'name': 'InBlock_Elements',
        'bmp': '\u2580-\u259F'
    },
    {
        'name': 'InBopomofo',
        'bmp': '\u3100-\u312F'
    },
    {
        'name': 'InBopomofo_Extended',
        'bmp': '\u31A0-\u31BF'
    },
    {
        'name': 'InBox_Drawing',
        'bmp': '\u2500-\u257F'
    },
    {
        'name': 'InBrahmi',
        'astral': '\uD804[\uDC00-\uDC7F]'
    },
    {
        'name': 'InBraille_Patterns',
        'bmp': '\u2800-\u28FF'
    },
    {
        'name': 'InBuginese',
        'bmp': '\u1A00-\u1A1F'
    },
    {
        'name': 'InBuhid',
        'bmp': '\u1740-\u175F'
    },
    {
        'name': 'InByzantine_Musical_Symbols',
        'astral': '\uD834[\uDC00-\uDCFF]'
    },
    {
        'name': 'InCJK_Compatibility',
        'bmp': '\u3300-\u33FF'
    },
    {
        'name': 'InCJK_Compatibility_Forms',
        'bmp': '\uFE30-\uFE4F'
    },
    {
        'name': 'InCJK_Compatibility_Ideographs',
        'bmp': '\uF900-\uFAFF'
    },
    {
        'name': 'InCJK_Compatibility_Ideographs_Supplement',
        'astral': '\uD87E[\uDC00-\uDE1F]'
    },
    {
        'name': 'InCJK_Radicals_Supplement',
        'bmp': '\u2E80-\u2EFF'
    },
    {
        'name': 'InCJK_Strokes',
        'bmp': '\u31C0-\u31EF'
    },
    {
        'name': 'InCJK_Symbols_And_Punctuation',
        'bmp': '\u3000-\u303F'
    },
    {
        'name': 'InCJK_Unified_Ideographs',
        'bmp': '\u4E00-\u9FFF'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_A',
        'bmp': '\u3400-\u4DBF'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_B',
        'astral': '[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_C',
        'astral': '\uD869[\uDF00-\uDFFF]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD86D[\uDC00-\uDF3F]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_D',
        'astral': '\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_E',
        'astral': '\uD86E[\uDC20-\uDFFF]|[\uD86F-\uD872][\uDC00-\uDFFF]|\uD873[\uDC00-\uDEAF]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_F',
        'astral': '\uD873[\uDEB0-\uDFFF]|[\uD874-\uD879][\uDC00-\uDFFF]|\uD87A[\uDC00-\uDFEF]'
    },
    {
        'name': 'InCarian',
        'astral': '\uD800[\uDEA0-\uDEDF]'
    },
    {
        'name': 'InCaucasian_Albanian',
        'astral': '\uD801[\uDD30-\uDD6F]'
    },
    {
        'name': 'InChakma',
        'astral': '\uD804[\uDD00-\uDD4F]'
    },
    {
        'name': 'InCham',
        'bmp': '\uAA00-\uAA5F'
    },
    {
        'name': 'InCherokee',
        'bmp': '\u13A0-\u13FF'
    },
    {
        'name': 'InCherokee_Supplement',
        'bmp': '\uAB70-\uABBF'
    },
    {
        'name': 'InChess_Symbols',
        'astral': '\uD83E[\uDE00-\uDE6F]'
    },
    {
        'name': 'InCombining_Diacritical_Marks',
        'bmp': '\u0300-\u036F'
    },
    {
        'name': 'InCombining_Diacritical_Marks_Extended',
        'bmp': '\u1AB0-\u1AFF'
    },
    {
        'name': 'InCombining_Diacritical_Marks_For_Symbols',
        'bmp': '\u20D0-\u20FF'
    },
    {
        'name': 'InCombining_Diacritical_Marks_Supplement',
        'bmp': '\u1DC0-\u1DFF'
    },
    {
        'name': 'InCombining_Half_Marks',
        'bmp': '\uFE20-\uFE2F'
    },
    {
        'name': 'InCommon_Indic_Number_Forms',
        'bmp': '\uA830-\uA83F'
    },
    {
        'name': 'InControl_Pictures',
        'bmp': '\u2400-\u243F'
    },
    {
        'name': 'InCoptic',
        'bmp': '\u2C80-\u2CFF'
    },
    {
        'name': 'InCoptic_Epact_Numbers',
        'astral': '\uD800[\uDEE0-\uDEFF]'
    },
    {
        'name': 'InCounting_Rod_Numerals',
        'astral': '\uD834[\uDF60-\uDF7F]'
    },
    {
        'name': 'InCuneiform',
        'astral': '\uD808[\uDC00-\uDFFF]'
    },
    {
        'name': 'InCuneiform_Numbers_And_Punctuation',
        'astral': '\uD809[\uDC00-\uDC7F]'
    },
    {
        'name': 'InCurrency_Symbols',
        'bmp': '\u20A0-\u20CF'
    },
    {
        'name': 'InCypriot_Syllabary',
        'astral': '\uD802[\uDC00-\uDC3F]'
    },
    {
        'name': 'InCyrillic',
        'bmp': '\u0400-\u04FF'
    },
    {
        'name': 'InCyrillic_Extended_A',
        'bmp': '\u2DE0-\u2DFF'
    },
    {
        'name': 'InCyrillic_Extended_B',
        'bmp': '\uA640-\uA69F'
    },
    {
        'name': 'InCyrillic_Extended_C',
        'bmp': '\u1C80-\u1C8F'
    },
    {
        'name': 'InCyrillic_Supplement',
        'bmp': '\u0500-\u052F'
    },
    {
        'name': 'InDeseret',
        'astral': '\uD801[\uDC00-\uDC4F]'
    },
    {
        'name': 'InDevanagari',
        'bmp': '\u0900-\u097F'
    },
    {
        'name': 'InDevanagari_Extended',
        'bmp': '\uA8E0-\uA8FF'
    },
    {
        'name': 'InDingbats',
        'bmp': '\u2700-\u27BF'
    },
    {
        'name': 'InDogra',
        'astral': '\uD806[\uDC00-\uDC4F]'
    },
    {
        'name': 'InDomino_Tiles',
        'astral': '\uD83C[\uDC30-\uDC9F]'
    },
    {
        'name': 'InDuployan',
        'astral': '\uD82F[\uDC00-\uDC9F]'
    },
    {
        'name': 'InEarly_Dynastic_Cuneiform',
        'astral': '\uD809[\uDC80-\uDD4F]'
    },
    {
        'name': 'InEgyptian_Hieroglyphs',
        'astral': '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2F]'
    },
    {
        'name': 'InElbasan',
        'astral': '\uD801[\uDD00-\uDD2F]'
    },
    {
        'name': 'InEmoticons',
        'astral': '\uD83D[\uDE00-\uDE4F]'
    },
    {
        'name': 'InEnclosed_Alphanumeric_Supplement',
        'astral': '\uD83C[\uDD00-\uDDFF]'
    },
    {
        'name': 'InEnclosed_Alphanumerics',
        'bmp': '\u2460-\u24FF'
    },
    {
        'name': 'InEnclosed_CJK_Letters_And_Months',
        'bmp': '\u3200-\u32FF'
    },
    {
        'name': 'InEnclosed_Ideographic_Supplement',
        'astral': '\uD83C[\uDE00-\uDEFF]'
    },
    {
        'name': 'InEthiopic',
        'bmp': '\u1200-\u137F'
    },
    {
        'name': 'InEthiopic_Extended',
        'bmp': '\u2D80-\u2DDF'
    },
    {
        'name': 'InEthiopic_Extended_A',
        'bmp': '\uAB00-\uAB2F'
    },
    {
        'name': 'InEthiopic_Supplement',
        'bmp': '\u1380-\u139F'
    },
    {
        'name': 'InGeneral_Punctuation',
        'bmp': '\u2000-\u206F'
    },
    {
        'name': 'InGeometric_Shapes',
        'bmp': '\u25A0-\u25FF'
    },
    {
        'name': 'InGeometric_Shapes_Extended',
        'astral': '\uD83D[\uDF80-\uDFFF]'
    },
    {
        'name': 'InGeorgian',
        'bmp': '\u10A0-\u10FF'
    },
    {
        'name': 'InGeorgian_Extended',
        'bmp': '\u1C90-\u1CBF'
    },
    {
        'name': 'InGeorgian_Supplement',
        'bmp': '\u2D00-\u2D2F'
    },
    {
        'name': 'InGlagolitic',
        'bmp': '\u2C00-\u2C5F'
    },
    {
        'name': 'InGlagolitic_Supplement',
        'astral': '\uD838[\uDC00-\uDC2F]'
    },
    {
        'name': 'InGothic',
        'astral': '\uD800[\uDF30-\uDF4F]'
    },
    {
        'name': 'InGrantha',
        'astral': '\uD804[\uDF00-\uDF7F]'
    },
    {
        'name': 'InGreek_And_Coptic',
        'bmp': '\u0370-\u03FF'
    },
    {
        'name': 'InGreek_Extended',
        'bmp': '\u1F00-\u1FFF'
    },
    {
        'name': 'InGujarati',
        'bmp': '\u0A80-\u0AFF'
    },
    {
        'name': 'InGunjala_Gondi',
        'astral': '\uD807[\uDD60-\uDDAF]'
    },
    {
        'name': 'InGurmukhi',
        'bmp': '\u0A00-\u0A7F'
    },
    {
        'name': 'InHalfwidth_And_Fullwidth_Forms',
        'bmp': '\uFF00-\uFFEF'
    },
    {
        'name': 'InHangul_Compatibility_Jamo',
        'bmp': '\u3130-\u318F'
    },
    {
        'name': 'InHangul_Jamo',
        'bmp': '\u1100-\u11FF'
    },
    {
        'name': 'InHangul_Jamo_Extended_A',
        'bmp': '\uA960-\uA97F'
    },
    {
        'name': 'InHangul_Jamo_Extended_B',
        'bmp': '\uD7B0-\uD7FF'
    },
    {
        'name': 'InHangul_Syllables',
        'bmp': '\uAC00-\uD7AF'
    },
    {
        'name': 'InHanifi_Rohingya',
        'astral': '\uD803[\uDD00-\uDD3F]'
    },
    {
        'name': 'InHanunoo',
        'bmp': '\u1720-\u173F'
    },
    {
        'name': 'InHatran',
        'astral': '\uD802[\uDCE0-\uDCFF]'
    },
    {
        'name': 'InHebrew',
        'bmp': '\u0590-\u05FF'
    },
    {
        'name': 'InHigh_Private_Use_Surrogates',
        'bmp': '\uDB80-\uDBFF'
    },
    {
        'name': 'InHigh_Surrogates',
        'bmp': '\uD800-\uDB7F'
    },
    {
        'name': 'InHiragana',
        'bmp': '\u3040-\u309F'
    },
    {
        'name': 'InIPA_Extensions',
        'bmp': '\u0250-\u02AF'
    },
    {
        'name': 'InIdeographic_Description_Characters',
        'bmp': '\u2FF0-\u2FFF'
    },
    {
        'name': 'InIdeographic_Symbols_And_Punctuation',
        'astral': '\uD81B[\uDFE0-\uDFFF]'
    },
    {
        'name': 'InImperial_Aramaic',
        'astral': '\uD802[\uDC40-\uDC5F]'
    },
    {
        'name': 'InIndic_Siyaq_Numbers',
        'astral': '\uD83B[\uDC70-\uDCBF]'
    },
    {
        'name': 'InInscriptional_Pahlavi',
        'astral': '\uD802[\uDF60-\uDF7F]'
    },
    {
        'name': 'InInscriptional_Parthian',
        'astral': '\uD802[\uDF40-\uDF5F]'
    },
    {
        'name': 'InJavanese',
        'bmp': '\uA980-\uA9DF'
    },
    {
        'name': 'InKaithi',
        'astral': '\uD804[\uDC80-\uDCCF]'
    },
    {
        'name': 'InKana_Extended_A',
        'astral': '\uD82C[\uDD00-\uDD2F]'
    },
    {
        'name': 'InKana_Supplement',
        'astral': '\uD82C[\uDC00-\uDCFF]'
    },
    {
        'name': 'InKanbun',
        'bmp': '\u3190-\u319F'
    },
    {
        'name': 'InKangxi_Radicals',
        'bmp': '\u2F00-\u2FDF'
    },
    {
        'name': 'InKannada',
        'bmp': '\u0C80-\u0CFF'
    },
    {
        'name': 'InKatakana',
        'bmp': '\u30A0-\u30FF'
    },
    {
        'name': 'InKatakana_Phonetic_Extensions',
        'bmp': '\u31F0-\u31FF'
    },
    {
        'name': 'InKayah_Li',
        'bmp': '\uA900-\uA92F'
    },
    {
        'name': 'InKharoshthi',
        'astral': '\uD802[\uDE00-\uDE5F]'
    },
    {
        'name': 'InKhmer',
        'bmp': '\u1780-\u17FF'
    },
    {
        'name': 'InKhmer_Symbols',
        'bmp': '\u19E0-\u19FF'
    },
    {
        'name': 'InKhojki',
        'astral': '\uD804[\uDE00-\uDE4F]'
    },
    {
        'name': 'InKhudawadi',
        'astral': '\uD804[\uDEB0-\uDEFF]'
    },
    {
        'name': 'InLao',
        'bmp': '\u0E80-\u0EFF'
    },
    {
        'name': 'InLatin_1_Supplement',
        'bmp': '\x80-\xFF'
    },
    {
        'name': 'InLatin_Extended_A',
        'bmp': '\u0100-\u017F'
    },
    {
        'name': 'InLatin_Extended_Additional',
        'bmp': '\u1E00-\u1EFF'
    },
    {
        'name': 'InLatin_Extended_B',
        'bmp': '\u0180-\u024F'
    },
    {
        'name': 'InLatin_Extended_C',
        'bmp': '\u2C60-\u2C7F'
    },
    {
        'name': 'InLatin_Extended_D',
        'bmp': '\uA720-\uA7FF'
    },
    {
        'name': 'InLatin_Extended_E',
        'bmp': '\uAB30-\uAB6F'
    },
    {
        'name': 'InLepcha',
        'bmp': '\u1C00-\u1C4F'
    },
    {
        'name': 'InLetterlike_Symbols',
        'bmp': '\u2100-\u214F'
    },
    {
        'name': 'InLimbu',
        'bmp': '\u1900-\u194F'
    },
    {
        'name': 'InLinear_A',
        'astral': '\uD801[\uDE00-\uDF7F]'
    },
    {
        'name': 'InLinear_B_Ideograms',
        'astral': '\uD800[\uDC80-\uDCFF]'
    },
    {
        'name': 'InLinear_B_Syllabary',
        'astral': '\uD800[\uDC00-\uDC7F]'
    },
    {
        'name': 'InLisu',
        'bmp': '\uA4D0-\uA4FF'
    },
    {
        'name': 'InLow_Surrogates',
        'bmp': '\uDC00-\uDFFF'
    },
    {
        'name': 'InLycian',
        'astral': '\uD800[\uDE80-\uDE9F]'
    },
    {
        'name': 'InLydian',
        'astral': '\uD802[\uDD20-\uDD3F]'
    },
    {
        'name': 'InMahajani',
        'astral': '\uD804[\uDD50-\uDD7F]'
    },
    {
        'name': 'InMahjong_Tiles',
        'astral': '\uD83C[\uDC00-\uDC2F]'
    },
    {
        'name': 'InMakasar',
        'astral': '\uD807[\uDEE0-\uDEFF]'
    },
    {
        'name': 'InMalayalam',
        'bmp': '\u0D00-\u0D7F'
    },
    {
        'name': 'InMandaic',
        'bmp': '\u0840-\u085F'
    },
    {
        'name': 'InManichaean',
        'astral': '\uD802[\uDEC0-\uDEFF]'
    },
    {
        'name': 'InMarchen',
        'astral': '\uD807[\uDC70-\uDCBF]'
    },
    {
        'name': 'InMasaram_Gondi',
        'astral': '\uD807[\uDD00-\uDD5F]'
    },
    {
        'name': 'InMathematical_Alphanumeric_Symbols',
        'astral': '\uD835[\uDC00-\uDFFF]'
    },
    {
        'name': 'InMathematical_Operators',
        'bmp': '\u2200-\u22FF'
    },
    {
        'name': 'InMayan_Numerals',
        'astral': '\uD834[\uDEE0-\uDEFF]'
    },
    {
        'name': 'InMedefaidrin',
        'astral': '\uD81B[\uDE40-\uDE9F]'
    },
    {
        'name': 'InMeetei_Mayek',
        'bmp': '\uABC0-\uABFF'
    },
    {
        'name': 'InMeetei_Mayek_Extensions',
        'bmp': '\uAAE0-\uAAFF'
    },
    {
        'name': 'InMende_Kikakui',
        'astral': '\uD83A[\uDC00-\uDCDF]'
    },
    {
        'name': 'InMeroitic_Cursive',
        'astral': '\uD802[\uDDA0-\uDDFF]'
    },
    {
        'name': 'InMeroitic_Hieroglyphs',
        'astral': '\uD802[\uDD80-\uDD9F]'
    },
    {
        'name': 'InMiao',
        'astral': '\uD81B[\uDF00-\uDF9F]'
    },
    {
        'name': 'InMiscellaneous_Mathematical_Symbols_A',
        'bmp': '\u27C0-\u27EF'
    },
    {
        'name': 'InMiscellaneous_Mathematical_Symbols_B',
        'bmp': '\u2980-\u29FF'
    },
    {
        'name': 'InMiscellaneous_Symbols',
        'bmp': '\u2600-\u26FF'
    },
    {
        'name': 'InMiscellaneous_Symbols_And_Arrows',
        'bmp': '\u2B00-\u2BFF'
    },
    {
        'name': 'InMiscellaneous_Symbols_And_Pictographs',
        'astral': '\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]'
    },
    {
        'name': 'InMiscellaneous_Technical',
        'bmp': '\u2300-\u23FF'
    },
    {
        'name': 'InModi',
        'astral': '\uD805[\uDE00-\uDE5F]'
    },
    {
        'name': 'InModifier_Tone_Letters',
        'bmp': '\uA700-\uA71F'
    },
    {
        'name': 'InMongolian',
        'bmp': '\u1800-\u18AF'
    },
    {
        'name': 'InMongolian_Supplement',
        'astral': '\uD805[\uDE60-\uDE7F]'
    },
    {
        'name': 'InMro',
        'astral': '\uD81A[\uDE40-\uDE6F]'
    },
    {
        'name': 'InMultani',
        'astral': '\uD804[\uDE80-\uDEAF]'
    },
    {
        'name': 'InMusical_Symbols',
        'astral': '\uD834[\uDD00-\uDDFF]'
    },
    {
        'name': 'InMyanmar',
        'bmp': '\u1000-\u109F'
    },
    {
        'name': 'InMyanmar_Extended_A',
        'bmp': '\uAA60-\uAA7F'
    },
    {
        'name': 'InMyanmar_Extended_B',
        'bmp': '\uA9E0-\uA9FF'
    },
    {
        'name': 'InNKo',
        'bmp': '\u07C0-\u07FF'
    },
    {
        'name': 'InNabataean',
        'astral': '\uD802[\uDC80-\uDCAF]'
    },
    {
        'name': 'InNew_Tai_Lue',
        'bmp': '\u1980-\u19DF'
    },
    {
        'name': 'InNewa',
        'astral': '\uD805[\uDC00-\uDC7F]'
    },
    {
        'name': 'InNumber_Forms',
        'bmp': '\u2150-\u218F'
    },
    {
        'name': 'InNushu',
        'astral': '\uD82C[\uDD70-\uDEFF]'
    },
    {
        'name': 'InOgham',
        'bmp': '\u1680-\u169F'
    },
    {
        'name': 'InOl_Chiki',
        'bmp': '\u1C50-\u1C7F'
    },
    {
        'name': 'InOld_Hungarian',
        'astral': '\uD803[\uDC80-\uDCFF]'
    },
    {
        'name': 'InOld_Italic',
        'astral': '\uD800[\uDF00-\uDF2F]'
    },
    {
        'name': 'InOld_North_Arabian',
        'astral': '\uD802[\uDE80-\uDE9F]'
    },
    {
        'name': 'InOld_Permic',
        'astral': '\uD800[\uDF50-\uDF7F]'
    },
    {
        'name': 'InOld_Persian',
        'astral': '\uD800[\uDFA0-\uDFDF]'
    },
    {
        'name': 'InOld_Sogdian',
        'astral': '\uD803[\uDF00-\uDF2F]'
    },
    {
        'name': 'InOld_South_Arabian',
        'astral': '\uD802[\uDE60-\uDE7F]'
    },
    {
        'name': 'InOld_Turkic',
        'astral': '\uD803[\uDC00-\uDC4F]'
    },
    {
        'name': 'InOptical_Character_Recognition',
        'bmp': '\u2440-\u245F'
    },
    {
        'name': 'InOriya',
        'bmp': '\u0B00-\u0B7F'
    },
    {
        'name': 'InOrnamental_Dingbats',
        'astral': '\uD83D[\uDE50-\uDE7F]'
    },
    {
        'name': 'InOsage',
        'astral': '\uD801[\uDCB0-\uDCFF]'
    },
    {
        'name': 'InOsmanya',
        'astral': '\uD801[\uDC80-\uDCAF]'
    },
    {
        'name': 'InPahawh_Hmong',
        'astral': '\uD81A[\uDF00-\uDF8F]'
    },
    {
        'name': 'InPalmyrene',
        'astral': '\uD802[\uDC60-\uDC7F]'
    },
    {
        'name': 'InPau_Cin_Hau',
        'astral': '\uD806[\uDEC0-\uDEFF]'
    },
    {
        'name': 'InPhags_Pa',
        'bmp': '\uA840-\uA87F'
    },
    {
        'name': 'InPhaistos_Disc',
        'astral': '\uD800[\uDDD0-\uDDFF]'
    },
    {
        'name': 'InPhoenician',
        'astral': '\uD802[\uDD00-\uDD1F]'
    },
    {
        'name': 'InPhonetic_Extensions',
        'bmp': '\u1D00-\u1D7F'
    },
    {
        'name': 'InPhonetic_Extensions_Supplement',
        'bmp': '\u1D80-\u1DBF'
    },
    {
        'name': 'InPlaying_Cards',
        'astral': '\uD83C[\uDCA0-\uDCFF]'
    },
    {
        'name': 'InPrivate_Use_Area',
        'bmp': '\uE000-\uF8FF'
    },
    {
        'name': 'InPsalter_Pahlavi',
        'astral': '\uD802[\uDF80-\uDFAF]'
    },
    {
        'name': 'InRejang',
        'bmp': '\uA930-\uA95F'
    },
    {
        'name': 'InRumi_Numeral_Symbols',
        'astral': '\uD803[\uDE60-\uDE7F]'
    },
    {
        'name': 'InRunic',
        'bmp': '\u16A0-\u16FF'
    },
    {
        'name': 'InSamaritan',
        'bmp': '\u0800-\u083F'
    },
    {
        'name': 'InSaurashtra',
        'bmp': '\uA880-\uA8DF'
    },
    {
        'name': 'InSharada',
        'astral': '\uD804[\uDD80-\uDDDF]'
    },
    {
        'name': 'InShavian',
        'astral': '\uD801[\uDC50-\uDC7F]'
    },
    {
        'name': 'InShorthand_Format_Controls',
        'astral': '\uD82F[\uDCA0-\uDCAF]'
    },
    {
        'name': 'InSiddham',
        'astral': '\uD805[\uDD80-\uDDFF]'
    },
    {
        'name': 'InSinhala',
        'bmp': '\u0D80-\u0DFF'
    },
    {
        'name': 'InSinhala_Archaic_Numbers',
        'astral': '\uD804[\uDDE0-\uDDFF]'
    },
    {
        'name': 'InSmall_Form_Variants',
        'bmp': '\uFE50-\uFE6F'
    },
    {
        'name': 'InSogdian',
        'astral': '\uD803[\uDF30-\uDF6F]'
    },
    {
        'name': 'InSora_Sompeng',
        'astral': '\uD804[\uDCD0-\uDCFF]'
    },
    {
        'name': 'InSoyombo',
        'astral': '\uD806[\uDE50-\uDEAF]'
    },
    {
        'name': 'InSpacing_Modifier_Letters',
        'bmp': '\u02B0-\u02FF'
    },
    {
        'name': 'InSpecials',
        'bmp': '\uFFF0-\uFFFF'
    },
    {
        'name': 'InSundanese',
        'bmp': '\u1B80-\u1BBF'
    },
    {
        'name': 'InSundanese_Supplement',
        'bmp': '\u1CC0-\u1CCF'
    },
    {
        'name': 'InSuperscripts_And_Subscripts',
        'bmp': '\u2070-\u209F'
    },
    {
        'name': 'InSupplemental_Arrows_A',
        'bmp': '\u27F0-\u27FF'
    },
    {
        'name': 'InSupplemental_Arrows_B',
        'bmp': '\u2900-\u297F'
    },
    {
        'name': 'InSupplemental_Arrows_C',
        'astral': '\uD83E[\uDC00-\uDCFF]'
    },
    {
        'name': 'InSupplemental_Mathematical_Operators',
        'bmp': '\u2A00-\u2AFF'
    },
    {
        'name': 'InSupplemental_Punctuation',
        'bmp': '\u2E00-\u2E7F'
    },
    {
        'name': 'InSupplemental_Symbols_And_Pictographs',
        'astral': '\uD83E[\uDD00-\uDDFF]'
    },
    {
        'name': 'InSupplementary_Private_Use_Area_A',
        'astral': '[\uDB80-\uDBBF][\uDC00-\uDFFF]'
    },
    {
        'name': 'InSupplementary_Private_Use_Area_B',
        'astral': '[\uDBC0-\uDBFF][\uDC00-\uDFFF]'
    },
    {
        'name': 'InSutton_SignWriting',
        'astral': '\uD836[\uDC00-\uDEAF]'
    },
    {
        'name': 'InSyloti_Nagri',
        'bmp': '\uA800-\uA82F'
    },
    {
        'name': 'InSyriac',
        'bmp': '\u0700-\u074F'
    },
    {
        'name': 'InSyriac_Supplement',
        'bmp': '\u0860-\u086F'
    },
    {
        'name': 'InTagalog',
        'bmp': '\u1700-\u171F'
    },
    {
        'name': 'InTagbanwa',
        'bmp': '\u1760-\u177F'
    },
    {
        'name': 'InTags',
        'astral': '\uDB40[\uDC00-\uDC7F]'
    },
    {
        'name': 'InTai_Le',
        'bmp': '\u1950-\u197F'
    },
    {
        'name': 'InTai_Tham',
        'bmp': '\u1A20-\u1AAF'
    },
    {
        'name': 'InTai_Viet',
        'bmp': '\uAA80-\uAADF'
    },
    {
        'name': 'InTai_Xuan_Jing_Symbols',
        'astral': '\uD834[\uDF00-\uDF5F]'
    },
    {
        'name': 'InTakri',
        'astral': '\uD805[\uDE80-\uDECF]'
    },
    {
        'name': 'InTamil',
        'bmp': '\u0B80-\u0BFF'
    },
    {
        'name': 'InTangut',
        'astral': '[\uD81C-\uD821][\uDC00-\uDFFF]'
    },
    {
        'name': 'InTangut_Components',
        'astral': '\uD822[\uDC00-\uDEFF]'
    },
    {
        'name': 'InTelugu',
        'bmp': '\u0C00-\u0C7F'
    },
    {
        'name': 'InThaana',
        'bmp': '\u0780-\u07BF'
    },
    {
        'name': 'InThai',
        'bmp': '\u0E00-\u0E7F'
    },
    {
        'name': 'InTibetan',
        'bmp': '\u0F00-\u0FFF'
    },
    {
        'name': 'InTifinagh',
        'bmp': '\u2D30-\u2D7F'
    },
    {
        'name': 'InTirhuta',
        'astral': '\uD805[\uDC80-\uDCDF]'
    },
    {
        'name': 'InTransport_And_Map_Symbols',
        'astral': '\uD83D[\uDE80-\uDEFF]'
    },
    {
        'name': 'InUgaritic',
        'astral': '\uD800[\uDF80-\uDF9F]'
    },
    {
        'name': 'InUnified_Canadian_Aboriginal_Syllabics',
        'bmp': '\u1400-\u167F'
    },
    {
        'name': 'InUnified_Canadian_Aboriginal_Syllabics_Extended',
        'bmp': '\u18B0-\u18FF'
    },
    {
        'name': 'InVai',
        'bmp': '\uA500-\uA63F'
    },
    {
        'name': 'InVariation_Selectors',
        'bmp': '\uFE00-\uFE0F'
    },
    {
        'name': 'InVariation_Selectors_Supplement',
        'astral': '\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'InVedic_Extensions',
        'bmp': '\u1CD0-\u1CFF'
    },
    {
        'name': 'InVertical_Forms',
        'bmp': '\uFE10-\uFE1F'
    },
    {
        'name': 'InWarang_Citi',
        'astral': '\uD806[\uDCA0-\uDCFF]'
    },
    {
        'name': 'InYi_Radicals',
        'bmp': '\uA490-\uA4CF'
    },
    {
        'name': 'InYi_Syllables',
        'bmp': '\uA000-\uA48F'
    },
    {
        'name': 'InYijing_Hexagram_Symbols',
        'bmp': '\u4DC0-\u4DFF'
    },
    {
        'name': 'InZanabazar_Square',
        'astral': '\uD806[\uDE00-\uDE4F]'
    }
];

},{}],187:[function(require,module,exports){
module.exports = [
    {
        'name': 'C',
        'alias': 'Other',
        'isBmpLast': true,
        'bmp': '\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u089F\u08B5\u08BE-\u08D2\u08E2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D04\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFA-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20C0-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2BC9\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E4F-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FF0-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7BA-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB66-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF',
        'astral': '\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8F\uDD9C-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD70-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE49-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD28-\uDD2F\uDD3A-\uDE5F\uDE7F-\uDEFF\uDF28-\uDF2F\uDF5A-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC70-\uDC7E\uDCBD\uDCC2-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD47-\uDD4F\uDD77-\uDD7F\uDDCE\uDDCF\uDDE0\uDDF5-\uDDFF\uDE12\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC5A\uDC5C\uDC5F-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE5F\uDE6D-\uDE7F\uDEB8-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF40-\uDFFF]|\uD806[\uDC3C-\uDC9F\uDCF3-\uDCFE\uDD00-\uDDFF\uDE48-\uDE4F\uDE84\uDE85\uDEA3-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC46-\uDC4F\uDC6D-\uDC6F\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF9-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD823-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83F\uD87B-\uD87D\uD87F-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDE70-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE9B-\uDEFF\uDF45-\uDF4F\uDF7F-\uDF8E\uDFA0-\uDFDF\uDFE2-\uDFFF]|\uD821[\uDFF2-\uDFFF]|\uD822[\uDEF3-\uDFFF]|\uD82C[\uDD1F-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA0-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDD73-\uDD7A\uDDE9-\uDDFF\uDE46-\uDEDF\uDEF4-\uDEFF\uDF57-\uDF5F\uDF79-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDCFF\uDD4B-\uDD4F\uDD5A-\uDD5D\uDD60-\uDFFF]|\uD83B[\uDC00-\uDC70\uDCB5-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDD0D-\uDD0F\uDD6C-\uDD6F\uDDAD-\uDDE5\uDE03-\uDE0F\uDE3C-\uDE3F\uDE49-\uDE4F\uDE52-\uDE5F\uDE66-\uDEFF]|\uD83D[\uDED5-\uDEDF\uDEED-\uDEEF\uDEFA-\uDEFF\uDF74-\uDF7F\uDFD9-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE-\uDCFF\uDD0C-\uDD0F\uDD3F\uDD71\uDD72\uDD77-\uDD79\uDD7B\uDDA3-\uDDAF\uDDBA-\uDDBF\uDDC3-\uDDCF\uDE00-\uDE5F\uDE6E-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]'
    },
    {
        'name': 'Cc',
        'alias': 'Control',
        'bmp': '\0-\x1F\x7F-\x9F'
    },
    {
        'name': 'Cf',
        'alias': 'Format',
        'bmp': '\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB',
        'astral': '\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]'
    },
    {
        'name': 'Cn',
        'alias': 'Unassigned',
        'bmp': '\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u05FF\u061D\u070E\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u089F\u08B5\u08BE-\u08D2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D04\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFA-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u2065\u2072\u2073\u208F\u209D-\u209F\u20C0-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2BC9\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E4F-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FF0-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7BA-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB66-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD\uFEFE\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFF8\uFFFE\uFFFF',
        'astral': '\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8F\uDD9C-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD70-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE49-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD28-\uDD2F\uDD3A-\uDE5F\uDE7F-\uDEFF\uDF28-\uDF2F\uDF5A-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC70-\uDC7E\uDCC2-\uDCCC\uDCCE\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD47-\uDD4F\uDD77-\uDD7F\uDDCE\uDDCF\uDDE0\uDDF5-\uDDFF\uDE12\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC5A\uDC5C\uDC5F-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE5F\uDE6D-\uDE7F\uDEB8-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF40-\uDFFF]|\uD806[\uDC3C-\uDC9F\uDCF3-\uDCFE\uDD00-\uDDFF\uDE48-\uDE4F\uDE84\uDE85\uDEA3-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC46-\uDC4F\uDC6D-\uDC6F\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF9-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD823-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83F\uD87B-\uD87D\uD87F-\uDB3F\uDB41-\uDB7F][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDE70-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE9B-\uDEFF\uDF45-\uDF4F\uDF7F-\uDF8E\uDFA0-\uDFDF\uDFE2-\uDFFF]|\uD821[\uDFF2-\uDFFF]|\uD822[\uDEF3-\uDFFF]|\uD82C[\uDD1F-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA4-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDDE9-\uDDFF\uDE46-\uDEDF\uDEF4-\uDEFF\uDF57-\uDF5F\uDF79-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDCFF\uDD4B-\uDD4F\uDD5A-\uDD5D\uDD60-\uDFFF]|\uD83B[\uDC00-\uDC70\uDCB5-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDD0D-\uDD0F\uDD6C-\uDD6F\uDDAD-\uDDE5\uDE03-\uDE0F\uDE3C-\uDE3F\uDE49-\uDE4F\uDE52-\uDE5F\uDE66-\uDEFF]|\uD83D[\uDED5-\uDEDF\uDEED-\uDEEF\uDEFA-\uDEFF\uDF74-\uDF7F\uDFD9-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE-\uDCFF\uDD0C-\uDD0F\uDD3F\uDD71\uDD72\uDD77-\uDD79\uDD7B\uDDA3-\uDDAF\uDDBA-\uDDBF\uDDC3-\uDDCF\uDE00-\uDE5F\uDE6E-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uDB40[\uDC00\uDC02-\uDC1F\uDC80-\uDCFF\uDDF0-\uDFFF]|[\uDBBF\uDBFF][\uDFFE\uDFFF]'
    },
    {
        'name': 'Co',
        'alias': 'Private_Use',
        'bmp': '\uE000-\uF8FF',
        'astral': '[\uDB80-\uDBBE\uDBC0-\uDBFE][\uDC00-\uDFFF]|[\uDBBF\uDBFF][\uDC00-\uDFFD]'
    },
    {
        'name': 'Cs',
        'alias': 'Surrogate',
        'bmp': '\uD800-\uDFFF'
    },
    {
        'name': 'L',
        'alias': 'Letter',
        'bmp': 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'LC',
        'alias': 'Cased_Letter',
        'bmp': 'A-Za-z\xB5\xC0-\xD6\xD8-\xF6\xF8-\u01BA\u01BC-\u01BF\u01C4-\u0293\u0295-\u02AF\u0370-\u0373\u0376\u0377\u037B-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0560-\u0588\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FD-\u10FF\u13A0-\u13F5\u13F8-\u13FD\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2134\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2C7B\u2C7E-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA640-\uA66D\uA680-\uA69B\uA722-\uA76F\uA771-\uA787\uA78B-\uA78E\uA790-\uA7B9\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A',
        'astral': '\uD801[\uDC00-\uDC4F\uDCB0-\uDCD3\uDCD8-\uDCFB]|\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD806[\uDCA0-\uDCDF]|\uD81B[\uDE40-\uDE7F]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDD00-\uDD43]'
    },
    {
        'name': 'Ll',
        'alias': 'Lowercase_Letter',
        'bmp': 'a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
        'astral': '\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD81B[\uDE60-\uDE7F]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD83A[\uDD22-\uDD43]'
    },
    {
        'name': 'Lm',
        'alias': 'Modifier_Letter',
        'bmp': '\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E\uFF9F',
        'astral': '\uD81A[\uDF40-\uDF43]|\uD81B[\uDF93-\uDF9F\uDFE0\uDFE1]'
    },
    {
        'name': 'Lo',
        'alias': 'Other_Letter',
        'bmp': '\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05EF-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1100-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC50-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDD00-\uDD23\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'Lt',
        'alias': 'Titlecase_Letter',
        'bmp': '\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC'
    },
    {
        'name': 'Lu',
        'alias': 'Uppercase_Letter',
        'bmp': 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uFF21-\uFF3A',
        'astral': '\uD801[\uDC00-\uDC27\uDCB0-\uDCD3]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD81B[\uDE40-\uDE5F]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]'
    },
    {
        'name': 'M',
        'alias': 'Mark',
        'bmp': '\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
        'astral': '\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDF46-\uDF50]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD45\uDD46\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDC9-\uDDCC\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDF00-\uDF03\uDF3B\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDC5E\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7\uDF1D-\uDF2B]|\uD806[\uDC2C-\uDC3A\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE3E\uDE47\uDE51-\uDE5B\uDE8A-\uDE99]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD8A-\uDD8E\uDD90\uDD91\uDD93-\uDD97\uDEF3-\uDEF6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'Mc',
        'alias': 'Spacing_Mark',
        'bmp': '\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E\u094F\u0982\u0983\u09BE-\u09C0\u09C7\u09C8\u09CB\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB\u0ACC\u0B02\u0B03\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0D02\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2\u0DF3\u0F3E\u0F3F\u0F7F\u102B\u102C\u1031\u1038\u103B\u103C\u1056\u1057\u1062-\u1064\u1067-\u106D\u1083\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7\u17C8\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1A19\u1A1A\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43\u1B44\u1B82\u1BA1\u1BA6\u1BA7\u1BAA\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1C24-\u1C2B\u1C34\u1C35\u1CE1\u1CF2\u1CF3\u1CF7\u302E\u302F\uA823\uA824\uA827\uA880\uA881\uA8B4-\uA8C3\uA952\uA953\uA983\uA9B4\uA9B5\uA9BA\uA9BB\uA9BD-\uA9C0\uAA2F\uAA30\uAA33\uAA34\uAA4D\uAA7B\uAA7D\uAAEB\uAAEE\uAAEF\uAAF5\uABE3\uABE4\uABE6\uABE7\uABE9\uABEA\uABEC',
        'astral': '\uD804[\uDC00\uDC02\uDC82\uDCB0-\uDCB2\uDCB7\uDCB8\uDD2C\uDD45\uDD46\uDD82\uDDB3-\uDDB5\uDDBF\uDDC0\uDE2C-\uDE2E\uDE32\uDE33\uDE35\uDEE0-\uDEE2\uDF02\uDF03\uDF3E\uDF3F\uDF41-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63]|\uD805[\uDC35-\uDC37\uDC40\uDC41\uDC45\uDCB0-\uDCB2\uDCB9\uDCBB-\uDCBE\uDCC1\uDDAF-\uDDB1\uDDB8-\uDDBB\uDDBE\uDE30-\uDE32\uDE3B\uDE3C\uDE3E\uDEAC\uDEAE\uDEAF\uDEB6\uDF20\uDF21\uDF26]|\uD806[\uDC2C-\uDC2E\uDC38\uDE39\uDE57\uDE58\uDE97]|\uD807[\uDC2F\uDC3E\uDCA9\uDCB1\uDCB4\uDD8A-\uDD8E\uDD93\uDD94\uDD96\uDEF5\uDEF6]|\uD81B[\uDF51-\uDF7E]|\uD834[\uDD65\uDD66\uDD6D-\uDD72]'
    },
    {
        'name': 'Me',
        'alias': 'Enclosing_Mark',
        'bmp': '\u0488\u0489\u1ABE\u20DD-\u20E0\u20E2-\u20E4\uA670-\uA672'
    },
    {
        'name': 'Mn',
        'alias': 'Nonspacing_Mark',
        'bmp': '\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
        'astral': '\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDF46-\uDF50]|\uD804[\uDC01\uDC38-\uDC46\uDC7F-\uDC81\uDCB3-\uDCB6\uDCB9\uDCBA\uDD00-\uDD02\uDD27-\uDD2B\uDD2D-\uDD34\uDD73\uDD80\uDD81\uDDB6-\uDDBE\uDDC9-\uDDCC\uDE2F-\uDE31\uDE34\uDE36\uDE37\uDE3E\uDEDF\uDEE3-\uDEEA\uDF00\uDF01\uDF3B\uDF3C\uDF40\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC38-\uDC3F\uDC42-\uDC44\uDC46\uDC5E\uDCB3-\uDCB8\uDCBA\uDCBF\uDCC0\uDCC2\uDCC3\uDDB2-\uDDB5\uDDBC\uDDBD\uDDBF\uDDC0\uDDDC\uDDDD\uDE33-\uDE3A\uDE3D\uDE3F\uDE40\uDEAB\uDEAD\uDEB0-\uDEB5\uDEB7\uDF1D-\uDF1F\uDF22-\uDF25\uDF27-\uDF2B]|\uD806[\uDC2F-\uDC37\uDC39\uDC3A\uDE01-\uDE0A\uDE33-\uDE38\uDE3B-\uDE3E\uDE47\uDE51-\uDE56\uDE59-\uDE5B\uDE8A-\uDE96\uDE98\uDE99]|\uD807[\uDC30-\uDC36\uDC38-\uDC3D\uDC3F\uDC92-\uDCA7\uDCAA-\uDCB0\uDCB2\uDCB3\uDCB5\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD90\uDD91\uDD95\uDD97\uDEF3\uDEF4]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'N',
        'alias': 'Number',
        'bmp': '0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D58-\u0D5E\u0D66-\u0D78\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
        'astral': '\uD800[\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23\uDF41\uDF4A\uDFD1-\uDFD5]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE48\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDCFA-\uDCFF\uDD30-\uDD39\uDE60-\uDE7E\uDF1D-\uDF26\uDF51-\uDF54]|\uD804[\uDC52-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDDE1-\uDDF4\uDEF0-\uDEF9]|\uD805[\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF3B]|\uD806[\uDCE0-\uDCF2]|\uD807[\uDC50-\uDC6C\uDD50-\uDD59\uDDA0-\uDDA9]|\uD809[\uDC00-\uDC6E]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59\uDF5B-\uDF61]|\uD81B[\uDE80-\uDE96]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDCC7-\uDCCF\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4]|\uD83C[\uDD00-\uDD0C]'
    },
    {
        'name': 'Nd',
        'alias': 'Decimal_Number',
        'bmp': '0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
        'astral': '\uD801[\uDCA0-\uDCA9]|\uD803[\uDD30-\uDD39]|\uD804[\uDC66-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDEF0-\uDEF9]|\uD805[\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF39]|\uD806[\uDCE0-\uDCE9]|\uD807[\uDC50-\uDC59\uDD50-\uDD59\uDDA0-\uDDA9]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDD50-\uDD59]'
    },
    {
        'name': 'Nl',
        'alias': 'Letter_Number',
        'bmp': '\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF',
        'astral': '\uD800[\uDD40-\uDD74\uDF41\uDF4A\uDFD1-\uDFD5]|\uD809[\uDC00-\uDC6E]'
    },
    {
        'name': 'No',
        'alias': 'Other_Number',
        'bmp': '\xB2\xB3\xB9\xBC-\xBE\u09F4-\u09F9\u0B72-\u0B77\u0BF0-\u0BF2\u0C78-\u0C7E\u0D58-\u0D5E\u0D70-\u0D78\u0F2A-\u0F33\u1369-\u137C\u17F0-\u17F9\u19DA\u2070\u2074-\u2079\u2080-\u2089\u2150-\u215F\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA830-\uA835',
        'astral': '\uD800[\uDD07-\uDD33\uDD75-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE48\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDCFA-\uDCFF\uDE60-\uDE7E\uDF1D-\uDF26\uDF51-\uDF54]|\uD804[\uDC52-\uDC65\uDDE1-\uDDF4]|\uD805[\uDF3A\uDF3B]|\uD806[\uDCEA-\uDCF2]|\uD807[\uDC5A-\uDC6C]|\uD81A[\uDF5B-\uDF61]|\uD81B[\uDE80-\uDE96]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD83A[\uDCC7-\uDCCF]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4]|\uD83C[\uDD00-\uDD0C]'
    },
    {
        'name': 'P',
        'alias': 'Punctuation',
        'bmp': '!-#%-\\*,-\\/:;\\?@\\[-\\]_\\{\\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65',
        'astral': '\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]'
    },
    {
        'name': 'Pc',
        'alias': 'Connector_Punctuation',
        'bmp': '_\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F'
    },
    {
        'name': 'Pd',
        'alias': 'Dash_Punctuation',
        'bmp': '\\-\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D'
    },
    {
        'name': 'Pe',
        'alias': 'Close_Punctuation',
        'bmp': '\\)\\]\\}\u0F3B\u0F3D\u169C\u2046\u207E\u208E\u2309\u230B\u232A\u2769\u276B\u276D\u276F\u2771\u2773\u2775\u27C6\u27E7\u27E9\u27EB\u27ED\u27EF\u2984\u2986\u2988\u298A\u298C\u298E\u2990\u2992\u2994\u2996\u2998\u29D9\u29DB\u29FD\u2E23\u2E25\u2E27\u2E29\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u301E\u301F\uFD3E\uFE18\uFE36\uFE38\uFE3A\uFE3C\uFE3E\uFE40\uFE42\uFE44\uFE48\uFE5A\uFE5C\uFE5E\uFF09\uFF3D\uFF5D\uFF60\uFF63'
    },
    {
        'name': 'Pf',
        'alias': 'Final_Punctuation',
        'bmp': '\xBB\u2019\u201D\u203A\u2E03\u2E05\u2E0A\u2E0D\u2E1D\u2E21'
    },
    {
        'name': 'Pi',
        'alias': 'Initial_Punctuation',
        'bmp': '\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20'
    },
    {
        'name': 'Po',
        'alias': 'Other_Punctuation',
        'bmp': '!-#%-\'\\*,\\.\\/:;\\?@\\\xA1\xA7\xB6\xB7\xBF\u037E\u0387\u055A-\u055F\u0589\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u166D\u166E\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u1805\u1807-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203B-\u203E\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205E\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00\u2E01\u2E06-\u2E08\u2E0B\u2E0E-\u2E16\u2E18\u2E19\u2E1B\u2E1E\u2E1F\u2E2A-\u2E2E\u2E30-\u2E39\u2E3C-\u2E3F\u2E41\u2E43-\u2E4E\u3001-\u3003\u303D\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFE10-\uFE16\uFE19\uFE30\uFE45\uFE46\uFE49-\uFE4C\uFE50-\uFE52\uFE54-\uFE57\uFE5F-\uFE61\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF07\uFF0A\uFF0C\uFF0E\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3C\uFF61\uFF64\uFF65',
        'astral': '\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]'
    },
    {
        'name': 'Ps',
        'alias': 'Open_Punctuation',
        'bmp': '\\(\\[\\{\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62'
    },
    {
        'name': 'S',
        'alias': 'Symbol',
        'bmp': '\\$\\+<->\\^`\\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BF\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B98-\u2BC8\u2BCA-\u2BFE\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u32FE\u3300-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD',
        'astral': '\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD83B[\uDCAC\uDCB0\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD6B\uDD70-\uDDAC\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED4\uDEE0-\uDEEC\uDEF0-\uDEF9\uDF00-\uDF73\uDF80-\uDFD8]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD10-\uDD3E\uDD40-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF\uDE60-\uDE6D]'
    },
    {
        'name': 'Sc',
        'alias': 'Currency_Symbol',
        'bmp': '\\$\xA2-\xA5\u058F\u060B\u07FE\u07FF\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BF\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6',
        'astral': '\uD83B\uDCB0'
    },
    {
        'name': 'Sk',
        'alias': 'Modifier_Symbol',
        'bmp': '\\^`\xA8\xAF\xB4\xB8\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u309B\u309C\uA700-\uA716\uA720\uA721\uA789\uA78A\uAB5B\uFBB2-\uFBC1\uFF3E\uFF40\uFFE3',
        'astral': '\uD83C[\uDFFB-\uDFFF]'
    },
    {
        'name': 'Sm',
        'alias': 'Math_Symbol',
        'bmp': '\\+<->\\|~\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC',
        'astral': '\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD83B[\uDEF0\uDEF1]'
    },
    {
        'name': 'So',
        'alias': 'Other_Symbol',
        'bmp': '\xA6\xA9\xAE\xB0\u0482\u058D\u058E\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09FA\u0B70\u0BF3-\u0BF8\u0BFA\u0C7F\u0D4F\u0D79\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116\u2117\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u214A\u214C\u214D\u214F\u218A\u218B\u2195-\u2199\u219C-\u219F\u21A1\u21A2\u21A4\u21A5\u21A7-\u21AD\u21AF-\u21CD\u21D0\u21D1\u21D3\u21D5-\u21F3\u2300-\u2307\u230C-\u231F\u2322-\u2328\u232B-\u237B\u237D-\u239A\u23B4-\u23DB\u23E2-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u25B6\u25B8-\u25C0\u25C2-\u25F7\u2600-\u266E\u2670-\u2767\u2794-\u27BF\u2800-\u28FF\u2B00-\u2B2F\u2B45\u2B46\u2B4D-\u2B73\u2B76-\u2B95\u2B98-\u2BC8\u2BCA-\u2BFE\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u32FE\u3300-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA828-\uA82B\uA836\uA837\uA839\uAA77-\uAA79\uFDFD\uFFE4\uFFE8\uFFED\uFFEE\uFFFC\uFFFD',
        'astral': '\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD83B\uDCAC|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD6B\uDD70-\uDDAC\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFA]|\uD83D[\uDC00-\uDED4\uDEE0-\uDEEC\uDEF0-\uDEF9\uDF00-\uDF73\uDF80-\uDFD8]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD10-\uDD3E\uDD40-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF\uDE60-\uDE6D]'
    },
    {
        'name': 'Z',
        'alias': 'Separator',
        'bmp': ' \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
    },
    {
        'name': 'Zl',
        'alias': 'Line_Separator',
        'bmp': '\u2028'
    },
    {
        'name': 'Zp',
        'alias': 'Paragraph_Separator',
        'bmp': '\u2029'
    },
    {
        'name': 'Zs',
        'alias': 'Space_Separator',
        'bmp': ' \xA0\u1680\u2000-\u200A\u202F\u205F\u3000'
    }
];

},{}],188:[function(require,module,exports){
module.exports = [
    {
        'name': 'ASCII',
        'bmp': '\0-\x7F'
    },
    {
        'name': 'Alphabetic',
        'bmp': 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0345\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05EF-\u05F2\u0610-\u061A\u0620-\u0657\u0659-\u065F\u066E-\u06D3\u06D5-\u06DC\u06E1-\u06E8\u06ED-\u06EF\u06FA-\u06FC\u06FF\u0710-\u073F\u074D-\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0817\u081A-\u082C\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08DF\u08E3-\u08E9\u08F0-\u093B\u093D-\u094C\u094E-\u0950\u0955-\u0963\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD-\u09C4\u09C7\u09C8\u09CB\u09CC\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09F0\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A42\u0A47\u0A48\u0A4B\u0A4C\u0A51\u0A59-\u0A5C\u0A5E\u0A70-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD-\u0AC5\u0AC7-\u0AC9\u0ACB\u0ACC\u0AD0\u0AE0-\u0AE3\u0AF9-\u0AFC\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D-\u0B44\u0B47\u0B48\u0B4B\u0B4C\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD0\u0BD7\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4C\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCC\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4C\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E46\u0E4D\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0ECD\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F71-\u0F81\u0F88-\u0F97\u0F99-\u0FBC\u1000-\u1036\u1038\u103B-\u103F\u1050-\u1062\u1065-\u1068\u106E-\u1086\u108E\u109C\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1713\u1720-\u1733\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17B3\u17B6-\u17C8\u17D7\u17DC\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u1938\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A1B\u1A20-\u1A5E\u1A61-\u1A74\u1AA7\u1B00-\u1B33\u1B35-\u1B43\u1B45-\u1B4B\u1B80-\u1BA9\u1BAC-\u1BAF\u1BBA-\u1BE5\u1BE7-\u1BF1\u1C00-\u1C35\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1D00-\u1DBF\u1DE7-\u1DF4\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u24B6-\u24E9\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA674-\uA67B\uA67F-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA827\uA840-\uA873\uA880-\uA8C3\uA8C5\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA92A\uA930-\uA952\uA960-\uA97C\uA980-\uA9B2\uA9B4-\uA9BF\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA60-\uAA76\uAA7A\uAA7E-\uAABE\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF5\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD27\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC00-\uDC45\uDC82-\uDCB8\uDCD0-\uDCE8\uDD00-\uDD32\uDD44-\uDD46\uDD50-\uDD72\uDD76\uDD80-\uDDBF\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE34\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEE8\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D-\uDF44\uDF47\uDF48\uDF4B\uDF4C\uDF50\uDF57\uDF5D-\uDF63]|\uD805[\uDC00-\uDC41\uDC43-\uDC45\uDC47-\uDC4A\uDC80-\uDCC1\uDCC4\uDCC5\uDCC7\uDD80-\uDDB5\uDDB8-\uDDBE\uDDD8-\uDDDD\uDE00-\uDE3E\uDE40\uDE44\uDE80-\uDEB5\uDF00-\uDF1A\uDF1D-\uDF2A]|\uD806[\uDC00-\uDC38\uDCA0-\uDCDF\uDCFF\uDE00-\uDE32\uDE35-\uDE3E\uDE50-\uDE83\uDE86-\uDE97\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC3E\uDC40\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD41\uDD43\uDD46\uDD47\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD96\uDD98\uDEE0-\uDEF6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF36\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF44\uDF50-\uDF7E\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9E]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD47]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'Any',
        'isBmpLast': true,
        'bmp': '\0-\uFFFF',
        'astral': '[\uD800-\uDBFF][\uDC00-\uDFFF]'
    },
    {
        'name': 'Default_Ignorable_Code_Point',
        'bmp': '\xAD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8',
        'astral': '\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|[\uDB40-\uDB43][\uDC00-\uDFFF]'
    },
    {
        'name': 'Lowercase',
        'bmp': 'a-z\xAA\xB5\xBA\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02B8\u02C0\u02C1\u02E0-\u02E4\u0345\u0371\u0373\u0377\u037A-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1DBF\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u2071\u207F\u2090-\u209C\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2170-\u217F\u2184\u24D0-\u24E9\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7D\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B-\uA69D\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7F8-\uA7FA\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
        'astral': '\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD81B[\uDE60-\uDE7F]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD83A[\uDD22-\uDD43]'
    },
    {
        'name': 'Noncharacter_Code_Point',
        'bmp': '\uFDD0-\uFDEF\uFFFE\uFFFF',
        'astral': '[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]'
    },
    {
        'name': 'Uppercase',
        'bmp': 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uFF21-\uFF3A',
        'astral': '\uD801[\uDC00-\uDC27\uDCB0-\uDCD3]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD81B[\uDE40-\uDE5F]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]'
    },
    {
        'name': 'White_Space',
        'bmp': '\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
    }
];

},{}],189:[function(require,module,exports){
module.exports = [
    {
        'name': 'Adlam',
        'astral': '\uD83A[\uDD00-\uDD4A\uDD50-\uDD59\uDD5E\uDD5F]'
    },
    {
        'name': 'Ahom',
        'astral': '\uD805[\uDF00-\uDF1A\uDF1D-\uDF2B\uDF30-\uDF3F]'
    },
    {
        'name': 'Anatolian_Hieroglyphs',
        'astral': '\uD811[\uDC00-\uDE46]'
    },
    {
        'name': 'Arabic',
        'bmp': '\u0600-\u0604\u0606-\u060B\u060D-\u061A\u061C\u061E\u0620-\u063F\u0641-\u064A\u0656-\u066F\u0671-\u06DC\u06DE-\u06FF\u0750-\u077F\u08A0-\u08B4\u08B6-\u08BD\u08D3-\u08E1\u08E3-\u08FF\uFB50-\uFBC1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFD\uFE70-\uFE74\uFE76-\uFEFC',
        'astral': '\uD803[\uDE60-\uDE7E]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB\uDEF0\uDEF1]'
    },
    {
        'name': 'Armenian',
        'bmp': '\u0531-\u0556\u0559-\u0588\u058A\u058D-\u058F\uFB13-\uFB17'
    },
    {
        'name': 'Avestan',
        'astral': '\uD802[\uDF00-\uDF35\uDF39-\uDF3F]'
    },
    {
        'name': 'Balinese',
        'bmp': '\u1B00-\u1B4B\u1B50-\u1B7C'
    },
    {
        'name': 'Bamum',
        'bmp': '\uA6A0-\uA6F7',
        'astral': '\uD81A[\uDC00-\uDE38]'
    },
    {
        'name': 'Bassa_Vah',
        'astral': '\uD81A[\uDED0-\uDEED\uDEF0-\uDEF5]'
    },
    {
        'name': 'Batak',
        'bmp': '\u1BC0-\u1BF3\u1BFC-\u1BFF'
    },
    {
        'name': 'Bengali',
        'bmp': '\u0980-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09FE'
    },
    {
        'name': 'Bhaiksuki',
        'astral': '\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC45\uDC50-\uDC6C]'
    },
    {
        'name': 'Bopomofo',
        'bmp': '\u02EA\u02EB\u3105-\u312F\u31A0-\u31BA'
    },
    {
        'name': 'Brahmi',
        'astral': '\uD804[\uDC00-\uDC4D\uDC52-\uDC6F\uDC7F]'
    },
    {
        'name': 'Braille',
        'bmp': '\u2800-\u28FF'
    },
    {
        'name': 'Buginese',
        'bmp': '\u1A00-\u1A1B\u1A1E\u1A1F'
    },
    {
        'name': 'Buhid',
        'bmp': '\u1740-\u1753'
    },
    {
        'name': 'Canadian_Aboriginal',
        'bmp': '\u1400-\u167F\u18B0-\u18F5'
    },
    {
        'name': 'Carian',
        'astral': '\uD800[\uDEA0-\uDED0]'
    },
    {
        'name': 'Caucasian_Albanian',
        'astral': '\uD801[\uDD30-\uDD63\uDD6F]'
    },
    {
        'name': 'Chakma',
        'astral': '\uD804[\uDD00-\uDD34\uDD36-\uDD46]'
    },
    {
        'name': 'Cham',
        'bmp': '\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA5C-\uAA5F'
    },
    {
        'name': 'Cherokee',
        'bmp': '\u13A0-\u13F5\u13F8-\u13FD\uAB70-\uABBF'
    },
    {
        'name': 'Common',
        'bmp': '\0-@\\[-`\\{-\xA9\xAB-\xB9\xBB-\xBF\xD7\xF7\u02B9-\u02DF\u02E5-\u02E9\u02EC-\u02FF\u0374\u037E\u0385\u0387\u0589\u0605\u060C\u061B\u061F\u0640\u06DD\u08E2\u0964\u0965\u0E3F\u0FD5-\u0FD8\u10FB\u16EB-\u16ED\u1735\u1736\u1802\u1803\u1805\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u2000-\u200B\u200E-\u2064\u2066-\u2070\u2074-\u207E\u2080-\u208E\u20A0-\u20BF\u2100-\u2125\u2127-\u2129\u212C-\u2131\u2133-\u214D\u214F-\u215F\u2189-\u218B\u2190-\u2426\u2440-\u244A\u2460-\u27FF\u2900-\u2B73\u2B76-\u2B95\u2B98-\u2BC8\u2BCA-\u2BFE\u2E00-\u2E4E\u2FF0-\u2FFB\u3000-\u3004\u3006\u3008-\u3020\u3030-\u3037\u303C-\u303F\u309B\u309C\u30A0\u30FB\u30FC\u3190-\u319F\u31C0-\u31E3\u3220-\u325F\u327F-\u32CF\u3358-\u33FF\u4DC0-\u4DFF\uA700-\uA721\uA788-\uA78A\uA830-\uA839\uA92E\uA9CF\uAB5B\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFF70\uFF9E\uFF9F\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFF9-\uFFFD',
        'astral': '\uD800[\uDD00-\uDD02\uDD07-\uDD33\uDD37-\uDD3F\uDD90-\uDD9B\uDDD0-\uDDFC\uDEE1-\uDEFB]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD66\uDD6A-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDEE0-\uDEF3\uDF00-\uDF56\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDFCB\uDFCE-\uDFFF]|\uD83B[\uDC71-\uDCB4]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD00-\uDD0C\uDD10-\uDD6B\uDD70-\uDDAC\uDDE6-\uDDFF\uDE01\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED4\uDEE0-\uDEEC\uDEF0-\uDEF9\uDF00-\uDF73\uDF80-\uDFD8]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD10-\uDD3E\uDD40-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF\uDE60-\uDE6D]|\uDB40[\uDC01\uDC20-\uDC7F]'
    },
    {
        'name': 'Coptic',
        'bmp': '\u03E2-\u03EF\u2C80-\u2CF3\u2CF9-\u2CFF'
    },
    {
        'name': 'Cuneiform',
        'astral': '\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC70-\uDC74\uDC80-\uDD43]'
    },
    {
        'name': 'Cypriot',
        'astral': '\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F]'
    },
    {
        'name': 'Cyrillic',
        'bmp': '\u0400-\u0484\u0487-\u052F\u1C80-\u1C88\u1D2B\u1D78\u2DE0-\u2DFF\uA640-\uA69F\uFE2E\uFE2F'
    },
    {
        'name': 'Deseret',
        'astral': '\uD801[\uDC00-\uDC4F]'
    },
    {
        'name': 'Devanagari',
        'bmp': '\u0900-\u0950\u0953-\u0963\u0966-\u097F\uA8E0-\uA8FF'
    },
    {
        'name': 'Dogra',
        'astral': '\uD806[\uDC00-\uDC3B]'
    },
    {
        'name': 'Duployan',
        'astral': '\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9C-\uDC9F]'
    },
    {
        'name': 'Egyptian_Hieroglyphs',
        'astral': '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]'
    },
    {
        'name': 'Elbasan',
        'astral': '\uD801[\uDD00-\uDD27]'
    },
    {
        'name': 'Ethiopic',
        'bmp': '\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u137C\u1380-\u1399\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E'
    },
    {
        'name': 'Georgian',
        'bmp': '\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u10FF\u1C90-\u1CBA\u1CBD-\u1CBF\u2D00-\u2D25\u2D27\u2D2D'
    },
    {
        'name': 'Glagolitic',
        'bmp': '\u2C00-\u2C2E\u2C30-\u2C5E',
        'astral': '\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]'
    },
    {
        'name': 'Gothic',
        'astral': '\uD800[\uDF30-\uDF4A]'
    },
    {
        'name': 'Grantha',
        'astral': '\uD804[\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]'
    },
    {
        'name': 'Greek',
        'bmp': '\u0370-\u0373\u0375-\u0377\u037A-\u037D\u037F\u0384\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03E1\u03F0-\u03FF\u1D26-\u1D2A\u1D5D-\u1D61\u1D66-\u1D6A\u1DBF\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEF\u1FF2-\u1FF4\u1FF6-\u1FFE\u2126\uAB65',
        'astral': '\uD800[\uDD40-\uDD8E\uDDA0]|\uD834[\uDE00-\uDE45]'
    },
    {
        'name': 'Gujarati',
        'bmp': '\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AF1\u0AF9-\u0AFF'
    },
    {
        'name': 'Gunjala_Gondi',
        'astral': '\uD807[\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD98\uDDA0-\uDDA9]'
    },
    {
        'name': 'Gurmukhi',
        'bmp': '\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A76'
    },
    {
        'name': 'Han',
        'bmp': '\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FEF\uF900-\uFA6D\uFA70-\uFAD9',
        'astral': '[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'Hangul',
        'bmp': '\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC'
    },
    {
        'name': 'Hanifi_Rohingya',
        'astral': '\uD803[\uDD00-\uDD27\uDD30-\uDD39]'
    },
    {
        'name': 'Hanunoo',
        'bmp': '\u1720-\u1734'
    },
    {
        'name': 'Hatran',
        'astral': '\uD802[\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDCFF]'
    },
    {
        'name': 'Hebrew',
        'bmp': '\u0591-\u05C7\u05D0-\u05EA\u05EF-\u05F4\uFB1D-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFB4F'
    },
    {
        'name': 'Hiragana',
        'bmp': '\u3041-\u3096\u309D-\u309F',
        'astral': '\uD82C[\uDC01-\uDD1E]|\uD83C\uDE00'
    },
    {
        'name': 'Imperial_Aramaic',
        'astral': '\uD802[\uDC40-\uDC55\uDC57-\uDC5F]'
    },
    {
        'name': 'Inherited',
        'bmp': '\u0300-\u036F\u0485\u0486\u064B-\u0655\u0670\u0951\u0952\u1AB0-\u1ABE\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u200C\u200D\u20D0-\u20F0\u302A-\u302D\u3099\u309A\uFE00-\uFE0F\uFE20-\uFE2D',
        'astral': '\uD800[\uDDFD\uDEE0]|\uD804\uDF3B|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'Inscriptional_Pahlavi',
        'astral': '\uD802[\uDF60-\uDF72\uDF78-\uDF7F]'
    },
    {
        'name': 'Inscriptional_Parthian',
        'astral': '\uD802[\uDF40-\uDF55\uDF58-\uDF5F]'
    },
    {
        'name': 'Javanese',
        'bmp': '\uA980-\uA9CD\uA9D0-\uA9D9\uA9DE\uA9DF'
    },
    {
        'name': 'Kaithi',
        'astral': '\uD804[\uDC80-\uDCC1\uDCCD]'
    },
    {
        'name': 'Kannada',
        'bmp': '\u0C80-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2'
    },
    {
        'name': 'Katakana',
        'bmp': '\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D',
        'astral': '\uD82C\uDC00'
    },
    {
        'name': 'Kayah_Li',
        'bmp': '\uA900-\uA92D\uA92F'
    },
    {
        'name': 'Kharoshthi',
        'astral': '\uD802[\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE38-\uDE3A\uDE3F-\uDE48\uDE50-\uDE58]'
    },
    {
        'name': 'Khmer',
        'bmp': '\u1780-\u17DD\u17E0-\u17E9\u17F0-\u17F9\u19E0-\u19FF'
    },
    {
        'name': 'Khojki',
        'astral': '\uD804[\uDE00-\uDE11\uDE13-\uDE3E]'
    },
    {
        'name': 'Khudawadi',
        'astral': '\uD804[\uDEB0-\uDEEA\uDEF0-\uDEF9]'
    },
    {
        'name': 'Lao',
        'bmp': '\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF'
    },
    {
        'name': 'Latin',
        'bmp': 'A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7B9\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A'
    },
    {
        'name': 'Lepcha',
        'bmp': '\u1C00-\u1C37\u1C3B-\u1C49\u1C4D-\u1C4F'
    },
    {
        'name': 'Limbu',
        'bmp': '\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1940\u1944-\u194F'
    },
    {
        'name': 'Linear_A',
        'astral': '\uD801[\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]'
    },
    {
        'name': 'Linear_B',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA]'
    },
    {
        'name': 'Lisu',
        'bmp': '\uA4D0-\uA4FF'
    },
    {
        'name': 'Lycian',
        'astral': '\uD800[\uDE80-\uDE9C]'
    },
    {
        'name': 'Lydian',
        'astral': '\uD802[\uDD20-\uDD39\uDD3F]'
    },
    {
        'name': 'Mahajani',
        'astral': '\uD804[\uDD50-\uDD76]'
    },
    {
        'name': 'Makasar',
        'astral': '\uD807[\uDEE0-\uDEF8]'
    },
    {
        'name': 'Malayalam',
        'bmp': '\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4F\u0D54-\u0D63\u0D66-\u0D7F'
    },
    {
        'name': 'Mandaic',
        'bmp': '\u0840-\u085B\u085E'
    },
    {
        'name': 'Manichaean',
        'astral': '\uD802[\uDEC0-\uDEE6\uDEEB-\uDEF6]'
    },
    {
        'name': 'Marchen',
        'astral': '\uD807[\uDC70-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]'
    },
    {
        'name': 'Masaram_Gondi',
        'astral': '\uD807[\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]'
    },
    {
        'name': 'Medefaidrin',
        'astral': '\uD81B[\uDE40-\uDE9A]'
    },
    {
        'name': 'Meetei_Mayek',
        'bmp': '\uAAE0-\uAAF6\uABC0-\uABED\uABF0-\uABF9'
    },
    {
        'name': 'Mende_Kikakui',
        'astral': '\uD83A[\uDC00-\uDCC4\uDCC7-\uDCD6]'
    },
    {
        'name': 'Meroitic_Cursive',
        'astral': '\uD802[\uDDA0-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDDFF]'
    },
    {
        'name': 'Meroitic_Hieroglyphs',
        'astral': '\uD802[\uDD80-\uDD9F]'
    },
    {
        'name': 'Miao',
        'astral': '\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]'
    },
    {
        'name': 'Modi',
        'astral': '\uD805[\uDE00-\uDE44\uDE50-\uDE59]'
    },
    {
        'name': 'Mongolian',
        'bmp': '\u1800\u1801\u1804\u1806-\u180E\u1810-\u1819\u1820-\u1878\u1880-\u18AA',
        'astral': '\uD805[\uDE60-\uDE6C]'
    },
    {
        'name': 'Mro',
        'astral': '\uD81A[\uDE40-\uDE5E\uDE60-\uDE69\uDE6E\uDE6F]'
    },
    {
        'name': 'Multani',
        'astral': '\uD804[\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA9]'
    },
    {
        'name': 'Myanmar',
        'bmp': '\u1000-\u109F\uA9E0-\uA9FE\uAA60-\uAA7F'
    },
    {
        'name': 'Nabataean',
        'astral': '\uD802[\uDC80-\uDC9E\uDCA7-\uDCAF]'
    },
    {
        'name': 'New_Tai_Lue',
        'bmp': '\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u19DE\u19DF'
    },
    {
        'name': 'Newa',
        'astral': '\uD805[\uDC00-\uDC59\uDC5B\uDC5D\uDC5E]'
    },
    {
        'name': 'Nko',
        'bmp': '\u07C0-\u07FA\u07FD-\u07FF'
    },
    {
        'name': 'Nushu',
        'astral': '\uD81B\uDFE1|\uD82C[\uDD70-\uDEFB]'
    },
    {
        'name': 'Ogham',
        'bmp': '\u1680-\u169C'
    },
    {
        'name': 'Ol_Chiki',
        'bmp': '\u1C50-\u1C7F'
    },
    {
        'name': 'Old_Hungarian',
        'astral': '\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDCFF]'
    },
    {
        'name': 'Old_Italic',
        'astral': '\uD800[\uDF00-\uDF23\uDF2D-\uDF2F]'
    },
    {
        'name': 'Old_North_Arabian',
        'astral': '\uD802[\uDE80-\uDE9F]'
    },
    {
        'name': 'Old_Permic',
        'astral': '\uD800[\uDF50-\uDF7A]'
    },
    {
        'name': 'Old_Persian',
        'astral': '\uD800[\uDFA0-\uDFC3\uDFC8-\uDFD5]'
    },
    {
        'name': 'Old_Sogdian',
        'astral': '\uD803[\uDF00-\uDF27]'
    },
    {
        'name': 'Old_South_Arabian',
        'astral': '\uD802[\uDE60-\uDE7F]'
    },
    {
        'name': 'Old_Turkic',
        'astral': '\uD803[\uDC00-\uDC48]'
    },
    {
        'name': 'Oriya',
        'bmp': '\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B77'
    },
    {
        'name': 'Osage',
        'astral': '\uD801[\uDCB0-\uDCD3\uDCD8-\uDCFB]'
    },
    {
        'name': 'Osmanya',
        'astral': '\uD801[\uDC80-\uDC9D\uDCA0-\uDCA9]'
    },
    {
        'name': 'Pahawh_Hmong',
        'astral': '\uD81A[\uDF00-\uDF45\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]'
    },
    {
        'name': 'Palmyrene',
        'astral': '\uD802[\uDC60-\uDC7F]'
    },
    {
        'name': 'Pau_Cin_Hau',
        'astral': '\uD806[\uDEC0-\uDEF8]'
    },
    {
        'name': 'Phags_Pa',
        'bmp': '\uA840-\uA877'
    },
    {
        'name': 'Phoenician',
        'astral': '\uD802[\uDD00-\uDD1B\uDD1F]'
    },
    {
        'name': 'Psalter_Pahlavi',
        'astral': '\uD802[\uDF80-\uDF91\uDF99-\uDF9C\uDFA9-\uDFAF]'
    },
    {
        'name': 'Rejang',
        'bmp': '\uA930-\uA953\uA95F'
    },
    {
        'name': 'Runic',
        'bmp': '\u16A0-\u16EA\u16EE-\u16F8'
    },
    {
        'name': 'Samaritan',
        'bmp': '\u0800-\u082D\u0830-\u083E'
    },
    {
        'name': 'Saurashtra',
        'bmp': '\uA880-\uA8C5\uA8CE-\uA8D9'
    },
    {
        'name': 'Sharada',
        'astral': '\uD804[\uDD80-\uDDCD\uDDD0-\uDDDF]'
    },
    {
        'name': 'Shavian',
        'astral': '\uD801[\uDC50-\uDC7F]'
    },
    {
        'name': 'Siddham',
        'astral': '\uD805[\uDD80-\uDDB5\uDDB8-\uDDDD]'
    },
    {
        'name': 'SignWriting',
        'astral': '\uD836[\uDC00-\uDE8B\uDE9B-\uDE9F\uDEA1-\uDEAF]'
    },
    {
        'name': 'Sinhala',
        'bmp': '\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4',
        'astral': '\uD804[\uDDE1-\uDDF4]'
    },
    {
        'name': 'Sogdian',
        'astral': '\uD803[\uDF30-\uDF59]'
    },
    {
        'name': 'Sora_Sompeng',
        'astral': '\uD804[\uDCD0-\uDCE8\uDCF0-\uDCF9]'
    },
    {
        'name': 'Soyombo',
        'astral': '\uD806[\uDE50-\uDE83\uDE86-\uDEA2]'
    },
    {
        'name': 'Sundanese',
        'bmp': '\u1B80-\u1BBF\u1CC0-\u1CC7'
    },
    {
        'name': 'Syloti_Nagri',
        'bmp': '\uA800-\uA82B'
    },
    {
        'name': 'Syriac',
        'bmp': '\u0700-\u070D\u070F-\u074A\u074D-\u074F\u0860-\u086A'
    },
    {
        'name': 'Tagalog',
        'bmp': '\u1700-\u170C\u170E-\u1714'
    },
    {
        'name': 'Tagbanwa',
        'bmp': '\u1760-\u176C\u176E-\u1770\u1772\u1773'
    },
    {
        'name': 'Tai_Le',
        'bmp': '\u1950-\u196D\u1970-\u1974'
    },
    {
        'name': 'Tai_Tham',
        'bmp': '\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD'
    },
    {
        'name': 'Tai_Viet',
        'bmp': '\uAA80-\uAAC2\uAADB-\uAADF'
    },
    {
        'name': 'Takri',
        'astral': '\uD805[\uDE80-\uDEB7\uDEC0-\uDEC9]'
    },
    {
        'name': 'Tamil',
        'bmp': '\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BFA'
    },
    {
        'name': 'Tangut',
        'astral': '\uD81B\uDFE0|[\uD81C-\uD820][\uDC00-\uDFFF]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]'
    },
    {
        'name': 'Telugu',
        'bmp': '\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C78-\u0C7F'
    },
    {
        'name': 'Thaana',
        'bmp': '\u0780-\u07B1'
    },
    {
        'name': 'Thai',
        'bmp': '\u0E01-\u0E3A\u0E40-\u0E5B'
    },
    {
        'name': 'Tibetan',
        'bmp': '\u0F00-\u0F47\u0F49-\u0F6C\u0F71-\u0F97\u0F99-\u0FBC\u0FBE-\u0FCC\u0FCE-\u0FD4\u0FD9\u0FDA'
    },
    {
        'name': 'Tifinagh',
        'bmp': '\u2D30-\u2D67\u2D6F\u2D70\u2D7F'
    },
    {
        'name': 'Tirhuta',
        'astral': '\uD805[\uDC80-\uDCC7\uDCD0-\uDCD9]'
    },
    {
        'name': 'Ugaritic',
        'astral': '\uD800[\uDF80-\uDF9D\uDF9F]'
    },
    {
        'name': 'Vai',
        'bmp': '\uA500-\uA62B'
    },
    {
        'name': 'Warang_Citi',
        'astral': '\uD806[\uDCA0-\uDCF2\uDCFF]'
    },
    {
        'name': 'Yi',
        'bmp': '\uA000-\uA48C\uA490-\uA4C6'
    },
    {
        'name': 'Zanabazar_Square',
        'astral': '\uD806[\uDE00-\uDE47]'
    }
];

},{}],190:[function(require,module,exports){
if (!window.ServedOnce) {
	(function () {
		window.ServedOnce = true;
		window.XRegExp = require("xregexp");
		window.scope = require('../../lib/scopeRuntime.js');
		window.ScopeApi = require('../../lib/scopeRuntimeApi.js')(scope);
		window.socket = io.connect();
		scope.declarationExpression({
			type: "let", 
			name: "socket", 
			value: {
				emit (channel, data) {
					return socket.emit(channel, ScopeApi.toJSON(data));
				},
				on (channel, handle) {
					return socket.on(channel, handle);
				}
			}
		});

		function attrToMap(attributes) {
			let result = scope.mapExpression();
			for (let i = 0; i < attributes.length; i += 1) {
				let name = attributes[i].name;
				let value = attributes[i].value;
				result[name] = value;
			}
			return result;
		}
		function randStr (len=16) {
			let result = "";
			let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
			for (let i = 0; i < len; i += 1) {
				result += chars[Math.floor(Math.random() * chars.length)];
			}
			return result;
		}

		function stateProxy (instance, element) {
			let state = instance.state;
			let stateProxyTraps = {
				get (target, prop, receiver) {
					//console.log("get state-proxy:", prop, target[prop]);
					if (typeof target[prop] !== "undefined") {
						if (prop === "set") {
							return function (name, val) {
								//console.log("set state-proxy(2):", name, val);
								let result = target[prop](name, val);
								let newElement = scope.identifier("renderEngine").renderChildren(instance.render());
								$(element).replaceWith(newElement);
								element = newElement;
								return result;
							};
						}
						if (typeof target[prop] === "object") {
							return new Proxy(target[prop], stateProxyTraps);
						}
						return target[prop];
					}
					return undefined;
				},
				set (target, prop, val) {
					//console.log("set state-proxy:", prop, target[prop], val);
					target[prop] = val;
					let newElement = scope.identifier("renderEngine").renderChildren(instance.render());
					$(element).replaceWith(newElement);
					element = newElement;
					return val;
				}
			}
			instance.state = new Proxy(state, stateProxyTraps);
			instance.setState = (newState) => {
				for (let [key, val] of state) {
					if (!newState.has(key)) {
						newState.set(key, val);
					}
				}
				state = newState;
				instance.state = new Proxy(newState, stateProxyTraps);
				let newElement = scope.identifier("renderEngine").renderChildren(instance.render());
				$(element).replaceWith(newElement);
				element = newElement;
				return instance.state;
			}
		}

		scope.declarationExpression({
			type: "let",
			name: "userTagStates",
			value: scope.mapExpression()
		});
		let lastPaint = 0;
		let minPaintInterval = 150;
		scope.declarationExpression({
			type: "let",
			name: "renderEngine",
			value: {
				triggerPaint () {
					return window.requestAnimationFrame(scope.identifier("renderEngine").paint);
				},
				renderUserTag (tagName, sc, element) {
					let attr = $(element).data("rawAttributes") || scope.mapExpression();
					let id = randStr();
					let tClass = sc(attr, element.childNodes);
					if (typeof tClass.render === "function") {
						let node = tClass.render();
						scope.identifier("userTagStates").set(id, tClass);
						if (tClass.state && tClass.state instanceof Map) {
							stateProxy(tClass, node);
						}
						if (tClass.listeners && tClass.listeners instanceof Map) {
							for (let [event, func] of tClass.listeners) {
								$(node).on(event, func);
							}
						}
						return node;
					}
					// No render function found, so return original element.
					return element;
				},
				renderChildren (n) {
					let self = this;
					let userTags = ScopeApi.getAllTags();
					/*if(document.contains(n)) {
						console.log("render after paint");
					} else {
						console.log("render before paint");
					}*/
					for (let [tagName, sc] of userTags) {
						$(n).find(tagName).each(function (i, element) {
							let node = self.renderUserTag(tagName, sc, element);
							element.replaceWith(self.renderChildren(node));
						});
					}
					return n;
				},
				paint() {
					let self = scope.identifier("renderEngine");
					self.renderChildren(document);
				}
			}
		});
		whenReady(scope.identifier("renderEngine").triggerPaint);
		$('[bind-in]').each(function () {
			var binder = $(this).attr('bind-in').split(':');
			var event = binder[0];
			var id = binder[1];
			$(this).on(event, function (e) {
				scope.identifier("socket").emit(id, $(this).val());
			});
		});

		$('[bind-out]').each(function () {
			var channel = $(this).attr('bind-out');
			var el = $(this);
			socket.on(channel, function (data) {
				el.html(data);
			});
		});
	}());
}
},{"../../lib/scopeRuntime.js":15,"../../lib/scopeRuntimeApi.js":16,"xregexp":184}]},{},[190])