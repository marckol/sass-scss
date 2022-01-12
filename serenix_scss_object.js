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

if (typeof SereniX === 'undefined') {
    ;(function(root, name, factory) {
        typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        root[name] = factory();
    })(this, 'SereniX', function() {
        return  { };
    });
}


;(function() {
    /**
     * 
     * @param {Array|Object} [o]
     * @returns {XCssObject}
     */
    function XCssObject(o) {
        if (this === XCssObject.__$$super_obj$$___ || XCssObject.__$$$_Ext__) {
            if (typeof o === 'object' && o) {
                this.setEntries(o.data||o.entries||o.items||o.data||o);
            }
        } else {
            throw new Error("Abstract class instantiation");
        }
    }
    
    XCssObject.__$$$_Ext__ = true;
    var p = XCssObject.prototype;
    
    p.__CLASS__ = XCssObject.__CLASS__ = XCssObject;
    
    p.__CLASS_NAME__ = XCssObject.__CLASS_NAME__ = "XCssObject";
    /**
     * 
     * @param {type} entries
     * @returns {nm$_serenix_scss_object.serenix_scss_object_L36.p}
     */
    p.setEntries = function(entries) {
        if (!isArray(entries)) {
            throw new TypeError("Incorrect argument");
        }
        this.entries = entries||[];
        return this;
    };
    
    p.toString = function() {
        throw new Error("Abstract method call"); 
    };
    /**
     * 
     * @returns {String}
     */
    p.toCssString = function() {
        //requires serenix_css_color_names.js, serenix_basic_mixins.js, serenix_css_utils.js, 
        return SeereniX.CssUtils.toCss(this.entries||[]);
    };
    /**
     * 
     * @param {type} o
     * @returns {SassObject}
     * @class SassObject
     */
    function SassObject(o) {
        var a = arguments;
        XCssObject.__$$super_obj$$___ = this;
        if (a.length > 1) o = Array.prototype.slice.call(a);
        if (!(this instanceof SassObject)) {
            return new SassObject(a);
        } else {
            SassObject.apply(this, a);
        }
        delete XCssObject.__$$super_obj$$___;
    }
    
    
    
    
    var p = SaasObject.prototype = new XCssObject();
    
    p.__CLASS__ = SassObject.__CLASS__ = SassObject;
    
    p.__CLASS_NAME__ = SassObject.__CLASS_NAME__ = "SassObject";
    
    p.toString = function() {
        //TODO
    };
    
    /**
     * 
     * @returns {ScssObject}
     * @class ScssObject
     */
    function ScssObject() {
        var a = arguments;
        XCssObject.__$$super_obj$$___ = this;
        if (a.length > 1) o = Array.prototype.slice.call(a);
        if (!(this instanceof ScssObject)) {
            return new ScssObject(a);
        } else {
            ScssObject.apply(this, a);
        }
        delete XCssObject.__$$super_obj$$___;
    }
    var p = ScssObject.prototype = new XCssObject();
    p.__CLASS__ = ScssObject.__CLASS__ = ScssObject;
    p.__CLASS_NAME__ = ScssObject.__CLASS_NAME__ = "ScssObject";
    
    
    
    p.toString = function() {
        //TODO
    };
    
    
    delete XCssObject.__$$$_Ext__;
    if (typeof SereniX.Namespace === 'function') {
        SereniX.addElements(XCssObject, SassObject, ScssObject);
    } else {
        SereniX.XCssObject = XCssObject;
        SereniX.ScssObject = ScssObject;
        SereniX.SassObject = SassObject;
    }
})();