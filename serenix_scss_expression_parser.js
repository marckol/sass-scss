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


;(function(root, name, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    root[name] = factory();
})(this, 'SASSExprParser', function() {
    

    /*Operator	Description	Example
        +	Adds operands	5 + 3 = 8
        -	Subtract the second operand from the first	5 - 3 = 2
        *	Multiplies the first operand with the second	5 * 3 = 15
        /	Divide the first operand with the second	5 / 3 = 1
        %	Modulus. Returns the remainder of a division	5 % 3 = 2
        :	Assignment. Assign right operand to the left operand	$num: 10
        ==	Evaluates if the values of two operands are equal
        !=	Evaluates if the values of two operands are not equal
        >	Evaluates if the value of the left operand is greater than the value of the right operand
        <	Evaluates if the value of the left operand is less than the value of the right operand
        >=	Evaluates if the value of the left operand is greater than or equal to the value of the right operand
        <=	Evaluates if the value of the left operand is less than or equal to the value of the right operand
        and	Conditional AND operator	If both operands are non-zero, the result is true
        or	Conditional OR operator	If one of the two operands is non-zero, the result is true
        not	Conditional NOT operator	If the condition is not true, the result becomes true
        */

var variable = "(\\$\\{[a-zA-Z_-}[[a-zA-Z0-9_-}*\\})"
var expression = "(#\\{[^{}]+]\\})";
var value = "(\\d+(?:\\.\\d+)?|\"[^\"]+\")";
var operand = "(?:" + variable + "|" + expression + "|" + value + ")|(?:\\(" + variable + "|" + expression + "|" + value + "\\))";
var assign = variable + "\\s*:\\s*" + operand;

var compare = "(?:" + operand + "\\s*(==|!=|>=?|<=?)\^s*" + operand + ")|\((?:" + operand + "\\s*(==|!=|>=?|<=?)\^s*" + operand + ")\)";

var logic = "(?:" + compare + ")(?:\\s*(?:\\b(and|or)\\b)\\s*" + "(?:" + compare + "))*";

var functionCall = "";

//


    
    
    function skipSpaces(str, i, n) {
        while (i < n) {
            if (/\s/.test(str[i])) {
                i++;
            } else {
                break;
            }
        }
        return i;
    }
    
    function readArgs(str, i, self) {
        var args = [], result, state = 0, VALUE = 1, DELIM = 2, n = str.length;
        if (str[i] !== '(') {
            throw new Error("Expected character '(");
        }
        i++;
        for (;i < n;) {
            if (str[i] === ')') {
                if (state === DELIM) {
                    throw new Error("Unexpected character ')");
                }
                return { lastIndex : skipSpaces(str, i + 1, n), arguments : args, args: args };
            }
            result = self.readValue(str, i);
            args.push(result.value);
            state = VALUE;
            i = result.lastIndex;
            if (str[i] === ',') {
                state = DELIM;
            }
        }
        
        throw new Error("Expected character ')");
    }
    /**
     * <h3>SASS/SCSS expression parser class</h3>
     * 
     * @class SASSExprParser
     */
    function SASSExprParser() {

    }
    
    var p = SASSExprParser.prototype;
    
    SASSExprParser.__CLASS__ = p.__CLASS__ = SASSExprParser;
    
    SASSExprParser.__CLASS_NAME__ = p.__CLASS_NAME__ = "SASSExprParser";

    p.readCondition = function(str, i) {
        var v = this.readValue(str, i);
        
        var c = v.value, o;
        if (c.type = "variable" ||c.variable || (typeof c === 'boolean')) return c;
        if (!c || ((o = c.operator) && compOpers.indexOf(o) < 0 && logicOpers.indexOf(o) < 0 && o !== 'not')) {
            throw new Error("No condition at index " + i);
        }
        return v;
    };
    
    p.readArgs = function(str, i) {
        return readArgs(str, i, this);
    };
    
    p.readFuncCall = function(str, i) {

    };
    
    function readName(str, i) {
        var re = /[a-zA-Z_-][a-zA-Z0-9_-]*\s*(?:\.[a-zA-Z_-][a-zA-Z0-9_-]*\s*)*/g;
        var match = re.exec(str.substring(i));
        if (match) {
            return { name: match[0].replace(/\s+/, ""), lastIndex : re.lastIndex};
        }
    }
    
    SASSExprParser.readName = p.readName = readName;

    p.readSimpleValue = function(str, i) {
        function readNumber() {
            var re = /^\s*(\d+(?:\.\d+)?)\b\s*/g, s;
            var match = re.exec(str.substring(i));
            if (!match) {
                throw new Error();
            }
            i += match[0].length;
            return parseFloat(match[1], 10);
        }
        
        function readBool() {
            var re = /^\s*(true|false)\b\s*/g, s;
            var match = re.exec(str.substring(i));
            if (!match) {
                return;
            }
            i += match[0].length;
            return match[1] === 'true'? true: false;
        }
        function readString() {
            var re = /^\s*"((?:[^"]|\\")*)"/g;
            var match = re.exec(str.substring(i));
            if (!match) {
                throw new Error();
            }
            i += match[0].length;
            return unquote(match[1]);
        }
        
        var colorNamesRegexp;
        
        function readColor() {
            var match, s = str.substring(i), sys, val, m;
            if (str[i] === '#') {
                if (match = /^#(\d{3,8})\s*/.exec(s)) {
                    m = match[1];
                    if ([3,4, 6,8].indexOf(m.length)) {
                        i += match[0].length;
                        return { type: 'color', value: '#' + m};
                    }
                    throw new Error("Incorrect value");
                }
            }
            var re = /^((rgba?|hsla?|hwb|hsv|cmyk)\s*\([^{}=+()*\\\[\]?,.:!§£$&<>-]\))\s*/;
            if (match=re.exec(s)) {
                val = match[3].trim();
                if (/,/.test(val)) {
                    val = val.split(/\s*,\s*/);
                } else if (/\//.test(val)) {
                    val = val.split(/\s*\/\s*|\s+/);
                } else {
                    throw new Error("Incorrect color");
                }
                
                val.forEach(function(v) {
                    v = v.trim();
                    m = this.readValue(v);
                    if (!m || m.lastIndex !== v.length) {
                        throw new Error("Incorrect color");
                    }
                });
                
                i += match[0].length;
                return { type: 'color', value: '#' + match[1]};
            }
            //requires serenix_color_names.js
            re = colorNamesRegexp||(colorNamesRegexp=new RegExp("^\\b(" + SERENIX_CSS_COLOR_NAMES.sort(function(a, b) { return b.length - a.length;}).join("|") + ")\\s*\\b"));
            if (match=re.exec(s)) {
                i += match[0].length;
                return { type: 'color', value: '#' + match[1]};
            }
        }
        var n = str.length, val, result, state = 0, ch, v, x;
        var s;
        var match, name;
        while (i<n) {
            ch = str[i];
            if (/\d/.test(ch)) {
                return { value: readNumber(), lastIndex: i };
            } else if ((x = readBool()) != undefined) {
                return { value: x, lastIndex: i };
            } else if ((x = readColor()) != undefined) {
                return { value: x, lastIndex: i };
            } else if (ch === '$') {
                v = this.readVar(str, i);
                i = v.lastIndex;
                v = v.variable;
            } else if (ch === '"') {
                v = { value: readString(), lastIndex: i };
            } else if (match = /\s*\bnot\b\s*/.exec(s = str.substring(i))) {
                i += match[0].length;
                v = this.readValue(str, i);
                v.value = { type: 'logic', operator: 'not', right: v.value||v.variable };
                delete v.variable;
                return v;
            } else if (ch === '(') {
                result = readArgs(str, v.lastIndex, this);
                v = { 
                    value:{ fn : v.variable, arguments: result.args, type : "function" }, 
                    lastIndex: result.lastIndex
                };
            } else if (ch === '[') {
                i++;
                var ndx = this.readValue(str, i);
                if (str[ndx.lastIndex] === ']') {
                    i = ndx.lastIndex + 1;
                    v = {
                        type: 'index',
                        index : ndx.value,
                        array: v
                    };
                } else {
                    throw new Error();
                }
            } else if (ch === '+' ||ch === '-') {
                if (v) {
                    return { value: v, lastIndex: i};
                }
                i++;
                v = this.readValue(str, i);
                v.value = { type: 'unary', right: v.value||v.variable, operator: ch };
                delete v.variable;
                return v;
            } else if (/[,:;\{\}\)]/.test(ch)) {
                return v;
            } else if (name = readName(str, i)) {
                args = readArgs(str, i + name.lastIndex, this);
                return {lastIndex:  args.lastIndex, value: { functionName : name.name, arguments: args.args, type : "invocation" } };
            } else {
                return v ? { value: v, lastIndex: i} : undefined;
            }
        }
    };
    
    var compOpers = ["==", "!=", "<=", "<",">=", ">" ];
    var logicOpers = ["and", "or"];
    var addOpers = ["+", "-"];
    var multOpers = ["+", "-"];
    var arithmeticOpers = ["+", "-", "*", "/", "%"];
    
    p.comparePriority = function(o1, o2) {
        if (o1 === o2) return 0;
        if (addOpers.indexOf(o1) >=0) {
            if (multOpers.indexOf(o2)>=0 ) {
                return -1;
            }
            if (addOpers.indexOf(o2) >=0) {
                return 0;
            }
            if (compOpers.indexOf(o2) >= 0 ||logicOpers.indexOf(o2)>=0) {
                return 1;
            }
        } else if (multOpers.indexOf(o1) >=0) {
            if (addOpers.indexOf(o2) >=0) {
                return 1;
            }
        } else if (compOpers.indexOf(o1) >= 0) {
            if (logicOpers.indexOf(o2)>=0) {
                return  1;
            }
            if (arithmeticOpers.indexOf(o2)>=0) {
                return - 1;
            }
        } else if (logicOpers.indexOf(o1) >= 0) {
            if (arithmeticOpers.indexOf(o2)>=0 || compOpers.indexOf(o2) >= 0) {
                return - 1;
            }
            return 1;
        }
        return 0;
    };
    function unquote(s) {
        if (['"', '"'].indexOf(s[0]) < 0) return s;
        s = s[0] === '"' ? s.replace(/\\"|""/g, function($) {
            return '"';
        }) : s.replace(/\\'|''/g, function($) {
            return "'";
        });
        return s.substring(1, s.length - 1);
    }
    
    function getExpression(v) {
        while (v.operation) {
            v = v.operation;
        }
        return v;
    }
    /**
     * 
     * @private
     * @param {type} k
     * @returns {Object}
     * @throws {Error} 
     */
    function getKey(k) {
        if (typeof k === 'string') return k;
        return typeof k === 'object' ? (k.type === 'string' ? k.value : (function() {throw new Error("Incorrect key");})()) : k; 
    }
    /**
     * Reads the value  at the given index or just after the spaces at the given.
     * value can be integer, float, string, function call, expression (logic 
     * expression, comparison option, arithmetic expression, concatenation)
     * @param {String} str
     * @param {Number} i
     * @returns {Object}
     */
    p.readValue = function(str, i) {
        function close() {
            var _key;
            state = 6;
            e = stack.pop();
            _key = e.key;
            e = e.container;
            v = getExpression(v);
            if (e.type === 'list') {
                e.items.push(v);
            } else if (e.type === 'map') {
                e.map[key] = v;
            } else {
                if (!v) {
                    throw new Error("Unexpected closing parenthesis");
                }
                e.value = v; 
                if (v.left) {
                     v.right = e;
                 } else {
                     v = e;                           
                 }
            }
            key = _key;
            v = e;   
            i = skipSpaces(str, i + 1,n);
        }
        function open() {
            i = skipSpaces(str, i + 1, n);
            stack.push(v = {
                key : key, 
                container: {
                    type: 'grouping'
                }
            });
            state = 3;
            map = list = items = key = undefined;
        }
        var n = str.length, state = 0, v, ch, args, match, o;
        var o, grouping, items, list, map, key, stack = [];
        i = i||0;
        while (i < n) {
            ch = str[i];
            switch(state) {
                case 0 :
                    if (str[i] === '(') {
                        open();
                        state = 3;                        
                    } else {
                        v = this.readSimpleValue(str, i);
                        i = v.lastIndex;
                        v = v.value||v.variable;
                        state = 1;
                    }
                    break;
                case 1 :
                    if (ch === '(') {
                        args = readArgs(str, i, this);
                        v = { fn : v, arguments: args.args, type : "function" };
                        i = args.lastIndex;
                    } else if (match = /\s*(==|!=|<=?|>=?|[+/*%-]|\b(and|or)\b)\s*/.exec(str.substring(i))) {
                        i += match[0].length;
                        if (v.operator && v.type !== 'unary' && this.comparePriority(v.operator, match[1]) < 0) {
                            o = { left : v.right, operator : match[1] };
                            v.right.operation = o;
                            v.right = o;
                            v = o;
                        } else {
                            v = {
                                type: compOpers.indexOf(match[1]) >= 0 ? "relation" : "logic",
                                operator : match[1],
                                left: v
                            };
                            v.left.operation = v;
                        }
                        state = 2;
                    } else if (v) {
                        return { value: getExpression(v), lastIndex: i };
                    } else {
                        throw new Errro("");
                    }
                    break;
                case 2 :
                    if (ch === '(') {
                        i++;
                        open();
                        state = 3;
                    } else {
                        o = this.readSimpleValue(str, i);
                        i = o.lastIndex;
                        o.operation = v;
                        v.right = o;
                        state = 1;
                    }
                    break;
                case 3 :
                    if (ch === '(') {
                        if (v) {
                            throw new Error("");
                        }
                        open();
                    } else {
                        if (match=/^([a-zA-Z_-][a-zA-Z_-]0-9]*)\s*:\s*/.exec(str.substring(i))) {
                            if (!key) {
                                stack.push(e =  { container: { type: 'map', map: {} }});
                            }
                            key = match[1];                            
                            i += match[0].length; 
                        } else {
                            v = this.readSimpleValue(str, i);  
                            i = v.lastIndex;
                            v = v.value;
                            state = 4;
                        }                        
                    }
                    break;
                case 4 : 
                    if (str[i] === '(') {
                        args = readArgs(str, i, this);
                        v = { fn : v, arguments: args.args, type : "function" };
                        i = args.lastIndex;
                    } else if (str[i] === ')') {
                        close();
                    } else if (match = /\s*(==|!=|<=?|>=?|[+*/%-]|\b(and|or)\b)\s*/.exec(str.substring(i))) {
                        i += match[0].length;
                        v = {
                            type: 
                                compOpers.indexOf(match[1]) >= 0 ? "relation" :
                                logicOpers.indexOf(match[1]) >= 0 ? "logic" :
                                "arithmetic",
                            operator : match[1],
                            left: v
                        };
                        v.left.operation = v;
                        state = 5;
                    }else if (match = /^\s*,\s*/.exec(str.substring(i))) {//item separator in case of array
                        i += match[0].length;
                        e = stack[stack.length - 1].container;
                        if (e.type === 'map') {
                            e.map[key] = getExpression(v);
                        } else if (e.type !== 'list') {                            
                            e.type = list = 'list';
                            e.items = items = [getExpression(v)];
                            map = entries = key = undefined;
                        } else {
                            items.push(getExpression(v));
                        }
                        state = 3;
                    } else if (match = /^\s*:\s*/.exec(str.substring(i))) {//item separator in case of array
                        i += match[0].length;
                        e = stack[stack.length - 1].container;
                        if (e.type !== 'map') {                            
                            e.type = "map";
                            e.map = map = entries = {};
                        }  
                        key = getKey(v);
                        v = undefined;
                        state = 3;
                    }
                    break;
                case 5 :
                    if (str[i] === '(') {
                        open();                        
                    } else {
                        o = this.readSimpleValue(str, i);
                        i = o.lastIndex;
                        v.right = o.value;
                        state = 4;
                    }
                    break;
                case 6:
                    if (str[i] === ')') {
                        close();                        
                    }else if (match = /\s*(==|!=|<=?|>=?|\b(and|or)\b)\s*/.exec(str.substring(i))) {
                        i += match[0].length;
                        v = {
                            type: compOpers.indexOf(match[1]) >= 0 ? "relation" : "logic",
                            operator : match[1],
                            left: v
                        };
                        v.left.operation = v;
                        state = stack.length ? 5 : 2;
                    } else if (v && stack.length === 0) {
                        return { value: v, lastIndex: i };
                    } else {
                        throw new Error("");
                    }
                    break;
            }
        }
        if (state !== 1 && state !== 6) {
            throw new Error("Unexpected end");
        }
        return { value: getExpression(v), lastIndex: i };
    };

    p.readVar = function(str, i) {
        if (str[i] !== '$') {
            throw new Error("Expected character '$'");
        }
        var re = /^\s*(\$[a-zA-Z_-][a-zA-Z0-9_-]*)\b\s*/g;
        var match = re.exec(str.substring(i));
        if (!match) {
            throw new Error();
        }
        return { 
            variable: { type: 'variable', name: match[1] },
            lastIndex: i + match[0].length
        };
    };
    
    
    
    p.readVariable = p.readVar;
    
    SASSExprParser.DEFAULT_PARSER = new SASSExprParser();
    
    return SASSExprParser;
    
    SASSExprParser.CSS_COLOR_NAMES = CSS_COLOR_NAMES;

});

if (typeof SereniX === 'undefined') {
    ;(function(root, name, factory) {
        typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        root[name] = factory();
    })(this, 'SereniX', function() {
        return  { SASSExprParser: SASSExprParser };
    });
} else if (typeof SereniX.Namespace === 'function') {
    SereniX.addChild(SASSExprParser);
} else {
    SereniX.SASSExprParser = SASSExprParser;
}