/* 
 * The MIT License
 *
 * Copyright 2022 DELL.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

if (typeof inBrowser === 'undefined') {
    var inBrowser = typeof window !== 'undefined';
}

if (typeof globalNS === 'undefined') {
    var globalNS;
    if (typeof window ==="undefined") {
        window=globalNS=typeof global!=="undefined" ? global : typeof self!=="undefined" ? self: this;
    } else {
        globalNS = window;
    }
} else if (typeof window ==="undefined") {
    window=globalNS;
}

/**
 * Returns true if the argument is an instance of Date and it's a valid date; 
 * otherwise, returns false.
 * @param {type} o
 * @returns {Boolean}
 */
Date.isDate = function (o){
    if (!(o instanceof Date)) {
        return false;
    }
    return o.isDate();
};

/**
   * Check if a value is a plain object.
   *
   * @private
   * @param {*} val
   * @returns {Boolean}
   */
function isPlainObject(val) {
    return typeof val === 'object' && Object.prototype.toString.call(val) === '[object Object]';
}
var isPlainObj = isPlainObject;

function isNoVal(v) {
    return v === undefined || v === null;
}

function isVal(v) {
    return v !== undefined && v !== null;
}

if (!Array.isArray) {
    /**
     * 
     * @param {type} obj
     * @returns {Boolean}
     */
    Array.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
};

var isArray = Array.isArray;
