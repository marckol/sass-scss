/* 
 * The MIT License
 *
 * Copyright 2022 Marc KAMGA Olivier <kamga_marco@yahoo.com;mkamga.olivier@gmail.com>.
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

if (typeof globalNS === 'undefined') {
    globalNS = typeof window !== 'undefined' ? window : 
            typeof global !== 'undefined' ? global : 
            typeof self !== 'undefined'? self : this;
}

;(function(root, name, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    root[name] = factory();
})(this, 'CssUtils', function() {
    
    var mediaQueryMediaTypes = [ 'all', 'screen', 'print'];
    
    var deprecatedMediaTypes = ['tty', 'tv', 'projection', 'handheld', 'braille', 'embossed', 'aural', 'speech'];
    
    allMediaTypes = [];
    
    mediaQueryMediaTypes.forEach(function(m) {
        allMediaTypes.push(m);
    });
    
    deprecatedMediaTypes.forEach(function(m) {
        allMediaTypes.push(m);
    });

    /**
     * 
     * @param {String} text
     * @param {type} options
     * @param {type} ctx
     * @returns {String}
     */
    function scssToCss(text, options, ctx) {
        if (['boolean', 'string'].indexOf(typeof options) >= 0) {
            options = {sass : options};
        } else if (typeof options === 'object' && !ctx) {
            if (typeof (options.context||options.ctx) === 'object' ) {
                ctx = options.context||options.ctx;
            }
        }
        ctx = ctx||{ };
        return toCss(parse(text, options, ctx), ctx);
    }
    
    function checkList(v) {
        //TODO
        return v;
    }
    var parm = "(\\$[a-zA-Z_-][a-zA-Z0-9_-]*(?:\s*[:]\s*[^\\),]+)?";
    var optParms = "\\$[a-zA-Z_-][a-zA-Z0-9_-]*\.\.\.";
    var parms = "(?:\\(\s*" + parm + "\s*(?:,\s*\\$[a-zA-Z_-][a-zA-Z0-9_-]*(?:\s*[:]\s*[^\\),]+)?)*)\s*" + "\\))?"
    
    var mixinRe = new RegExp("^\\s*@mixin[ \\t]+([a-zA-Z_-][a-zA-Z0-9_-]*)\\s*" + parms + "$");
    function checkControlFlow(sel, type, match, expressionParser) {
        function checkCondition() {
            var result; 
            if (result = expressionParser.readCondition(sel, i)) {
                if (result.lastIndex < sel.length) {
                    throw new Error();
                }
                i = result.lastIndex;
            }
            return result.value||result.condition||result.expression;
        }
        var i = match.length, c, x;
        var fromRe = /^\s*from\b\s*/g, toRe = /^\s*\bto\b\s*/g, s = sel, m;
        var c = {
            type: type,
            selector: sel,
            body : []
        };
        c.entriesList = c.body;
        switch(type) {
            case 'if':
            case 'else if':
            case 'while':
                if (!(c.condition = checkCondition())) {
                    throw new Error("Incorrect else");
                }
                break;
            case 'else':
                if (i < sel.length) {
                    throw new Error("Incorrect else");
                }
                break;
            case 'for':
                //@for $i from 0 to length($selectors)
                x = expressionParser.readVar(sel, i);
                i =  x.lastIndex;
                c.variable = x.variable||x.value;                
                if (m = fromRe.exec(s.substring(i))) {
                    x = expressionParser.readValue(sel, i + m[0].length);
                    i =  x.lastIndex;
                    c.from = x.value||x.variable;
                    if (m = toRe.exec(s.substring(i))) {
                        x = expressionParser.readValue(sel, i + m[0].length);
                        i =  x.lastIndex;
                        c.to = x.value||x.variable;
                    }
                }
                break;
            case 'each':
                //@each $size in $font-sizes
                c.variable = expressionParser.readVar(sel, i);
                if (m = inRe.exec(s.substring(i))) {
                    c.list = checkList(readValue(sel, i));
                }
                break;
        }
        
        return c;
    }
    
    function checkEnd(s, x) {
        if (s[x.lastIndex] !== ';') {
            throw new Error('');
        }
    }
    
    function checkSelectors(sel, expressionParser) {
        var m, re = /\s*:\s*/, v, c, typ, x;
        if (sel[0] === '&') {
            
        } else if (m = mixinRe.exec(sel)) { //check mixin case
            m = {
                type: 'mixin',
                fn:{ 
                    name: m[1], 
                    params: m[2] ? m[2].split(/\s*,\s*/).map(function($) {
                        return $.split(re);
                    }) : []
                },
                selector: sel,
                entriesList : []
            };
            m.body = m.entriesList;
            return m;
        } else if (v = /^@(if|else\s*if|else|for|while|each)\s+/.exec(sel)) {
            c = checkControlFlow(sel, typ = v[1].replace(/\s+/, " "), v[0], expressionParser);            
            return c;
        } else if (m = /^(?:@debug|@warn|@error)\b\s*/.exec(sel)) {
            m = m[1];
            x = expressionParser.readValue(sel, m[0].length);
            checkEnd(sel, x);
            return { type: m.substring(1), value: x.value||x.variable, tag: m, statement: true};
        } else if (m = /^@forward\b\s*/.exec(sel)) {
            x = expressionParser.readValue(sel, m[0].length);
            if (!x.value.type !== 'string') {
                throw new Error("Incorrect url");
            }
            checkEnd(sel, x);
            return { type: 'forward', url: x.value, tag: '@forward', statement: true};
        } else if (m = /^@return\b\s*/.exec(sel)) {
            if (sel[x = m[0].length] !== ';') {
                x = expressionParser.readValue(sel, x);
                checkEnd(sel, x);
                v = x.value||v.variable;
            } else {
                v = undefined;
            }
            return { type: 'return', value: v, tag: '@return', statement: true};
        } else if (m = /^@content\s*(\(?)?/.exec(sel)) {
            if (m[1]) {//the content has argument(s)
                //read arguments
                x = expressionParser.readArgs(sel, m[0].length);
                checkEnd(sel, x);
            } else if (sel[m[0].length] !== ';') {
                throw new Error("Character ';' expected at index " + m[0].length);
            }            
            return { type: 'content', arguments: x ? x.args : x, tag: '@content', statement: true};
        } else if (sel[0] === '@') {
            throw new Error("Not supported");
        } else if (sel[0] === '%') { //placeholders
            return (m=/^\s*%([a-z$-][a-z0-9-]*)\s*$/i.exec(sel)) ? m[1] : undefined;
        }
        return sel;
    }
    
    /**
     * Imports or uses
     * @param {String} path The path/url to load from
     * @param {Object} ctx The context
     * @param {Object} _with The use with settings/options
     * @private
     */
    function load(path, ctx, _with) {
        var tokens = path.split(/\//), i = 0, n = tokens.length;
        var module = ctx.imports[path];
        
        //TODO: apply _with settings/options to the load
        //see https://sass-lang.com/documentation/at-rules/use for the specification: 
        //Syntax:  @use <url> with (<variable>: <value>, <variable>: <value>, ...)
        if (module) return module;
        module = globalNS;
        while (i < n) {
            if (!(module = module[tokens[i++]])) {
                break;
            }
        }
        if (module) return module;                
        function onSucess(response) { 
            var v, vars, mixins;
            function setVar(n, v) {
                if (n[0] !== '$') {
                    n = '$' + n;
                }
                vars[n] = v;
            }
            if (typeof response === 'object') {
                if (v = response.responseText||response.response) {
                    response = v;
                }
            }
            if ((v=typeof response) === 'string') {
                module = eval("(function() { return " + response + ";})()");
            } else if (v === 'object' || (v === 'function' && v.name)) {
                module = v;
            } else {
                throw new Error("Mixin module error");
            }
            vars = ctx.globals.variables;
            mixins = ctx.mixins;
            if (isArray(v = module.variables)) {
                v.forEach(function(va) {
                    setVar(va.name, v.value === undefined ? va.val: va.value);
                });
            } else if (v) {                
                for (var n in v) {
                    setVar(n, v[n]);
                }
            }
            if (isArray(v=module.functions||module.fns||module.mixins)) {
                v.forEach(function(va) {
                    mixins[va.name] = va;
                });
            } else if (v) {
                for (var n in v) {
                    mixins[n] = v[n];
                }
            }
            onSucess.ctx.imports[onSucess.path] = module;
        }
        onSucess.path = path;
        onSucess.ctx = ctx;
        function onFail() {
            throw new Error("Error when loading mixins: " + path);
        }
        onFail.path = path;
        onFail.ctx = ctx;
        new SereniX.Ajax({
            async: false,
            url : path,
            requestMethod: 'GET',
            responseType: 'text',
            onSucess : onSucess,
            onFail: onFail
        }).send();
        return module;
    }
    
    /**
     * Parses the given SCSS or SASS string and returns an that contains all the 
     * statements (variables declarations, selectors, mixins, imports. ...).
     * @private
     * @param {String} scss  The SCSS or SASS string to parse
     * @param {Boolean|Object|String} [sass=false]
     *  <p>When the argument is a boolean, specify that the given text to parse is a scss text 
     *  if the value is true or specify that the gicen text to parse is a sass 
     *  text.</p> 
     *  <p>When the argument is a string, one of  'scss' or 'sass' values is expected.</p>
     *  <ul> 
     *  <li>If the value is 'scss'  specify that the given text to parse is a 
     *  scss text.</li>
     *  <li>If the value is 'scss'  specify that the given text to parse is a  
     *  sass text.</li>
     *  </ul>
     *  <p>When the argument is an object, the value <b>sass</b> field will  
     *  specify the type of text.
     *  </p>
     * @param {Object} [ctx]
     * @returns {Array}
     */
    function parse(scss, sass, ctx) {
        var processBlock, openParens, closeParens, processVar, getValue, getEntry, ignoreLoadError = false;
        function blockParent(amp) {
            if ((step && [ENTRY, INCLUDE, EXPORT, MIXIN_STATEMENT, OPEN_BLOCK, CLOSE_BLOCK, IMPORT, EXPORT].indexOf(step) < 0) || (step === 0 && amp)) {
                throw new Error("Unexpected selector");
            }
            if (stack.length) {
                parent = stack[stack.length - 1];
                if (!parent.children) {
                    parent.children = [];
                }
            } else if (amp) {
                throw new Error("Unexpected amp selector");   
            } else {
                parent = undefined;
            }
            
        }
        
        function initIncludeContent(entries) {
            var iblock = { },
                inc = {include: true, type: 'include', call : fn, content : iblock, parent: block} ;

            (entries||block.entriesList).push(iblock.include = inc);
            stack.push(block = iblock);
            step = OPEN_BLOCK;
        }
        
        function isMixin(b) {
            while (b) {
                if (b.type == 'mixin') {
                    return b;
                }
                b = b.parent;
            }
        }
        /**
         * 
         * @param {String} mixin
         * @param {Array} fn;
         */
        function processTokens(mixin, fn, scope) {
           var re = /[^,\(\): ]+|\(|\)|\s*,\s*|\s*:\s*|\s+/g, match, s;
           var stack = [], step = 0, args, v, endSteps = [4], ARG_SPACES = 6, ARG = 7, ASSIGN = 8;
           var rightVal;
           if (fn) {
               fn.push(args = []);
               stack.push(fn);
               step = 2;
               endSteps.push(1);
               if (mixin === "") {
                   return fn;
               }
           }

            while (match=re.exec(mixin)) {
                s = match[0];
                if (s === '(') {
                    if (step !== 1) {
                        throw new Error("");
                    }
                    stack.push(fn = [v, args = []]);
                    step = 2;
                    v = undefined;
                } else if (s=== ')') {
                    if(step === 2) {
                        if (v) {
                            args.push(getValue(v));
                        }
                    } else if (step === 4 || step === ARG || step === 1) {
                        args.push(getValue(v));
                    } else if (step === 3) {
                        throw new Error("Argument expected but found ','");
                    } else if (step === ASSIGN) {
                        throw new Error("After assign step");
                    } else {
                        throw new Error("");
                    }
                    step = 4;
                    v = stack[stack.length - 1];
                    stack.splice(stack.length - 1, 1);
                    args = stack.length ? stack[stack.length - 1][1] : undefined;
                } else if (/,/.test(s)) { //',' case
                    if (step !== 4 && step !== 1) {
                        throw new Error("");
                    }                    
                    args.push(getValue(v));
                    step = 3;
                } else if (/:/.test(s)) { //':' case
                    if (step === ASSIGN) {
                        throw new Error("");
                    }
                    step = ASSIGN;
                } else if (s = s.trim()) {    
                    if (step === ASSIGN) {
                        v = { variable: v, value: getValue(s)};
                        step = 1;
                    } else if (step === 1) {
                        if (v) {

                        } else {

                        }
                        //stay at the same step
                    } else if (step === 3 || step === 2 || step === 0) {
                        v = s;
                        step = 1;
                    } else if (step === ARG_SPACES) {
                        v += s;
                        step  = ARG;
                    } else {
                        throw new Error("");
                    }

                } else {//spaces case
                    if(step !== ARG && !(step === 1 && fn)) {
                        throw new Error("");
                    }
                    v += " ";
                    step = ARG_SPACES;
                }
            }
            if (step === 0) return undefined;
            if (endSteps.indexOf(step) < 0 ) {
                throw new Error("");
            }
            return v;
        }
        function processInclude(name) {
            var entries;
            if (block) {
                if (block.selector === '.avatar') {
                    console.log(".avatar");
                }
                if (step !== OPEN_BLOCK && step !== ENTRY && step !== INCLUDE) {
                    throw new Error("unexpected character @include");
                }
                entries = block.entriesList;
                step = INCLUDE;
            } else {
                step = 0;
            }
            fn = [name];
            if ((key = match[groups.includeArgs]) && key.trim()) {
                processTokens(key, fn);
            } else {
                fn.push(/*noargument*/[]);
            }
            key = match[0].trim();
            if (key[key.length - 1] === '{') {
                initIncludeContent(entries);
            } else {
                entries.push(fn);
            }
            
        }
        function processEntry() {
            if (/@extend/.test(key)) {
                entries.push({ type: 'extend', extend : key.substring(7).trim() });
                step = ENTRY;
            } else if (key[0] === '$') {
                processVar(
                    key,
                    globals, 
                    block ? block.scope||
                            (block.scope = { 
                                variables : {}, 
                                declarations: []
                            }) : 
                            undefined
                );
            } else {
                if (key[0] === '#' && !isMixin(block)) {
                    throw new Error("Unexpected character '#'");
                }
                entries.push(getEntry(key));
                step = ENTRY;
            }
        }
        /**
         * Parses the match string, creates/opens new block and set step to 
         * SELECTOR
         */
        function initSelector() {
            var s = checkSelectors(key, expressionParser);
            if (key[0] === '&') {
                blockParent(true);
                entries.push(selectorsMap[key] = block = {
                    amp: true,
                    selector: key,
                    parent : parent,
                    entriesList : [],
                    selectorMatch: match[0]
                });                                       
            } else  if (s && s.statement) {
                if (!/mixin|if|else if|else|for|while|each|function/.test(block.type||"")) {
                    throw new Error("Unexpected " + (s.tag||"") + " statement");
                }
                block.entriesList.push(s);
                step = ENTRY;
                return s;
            } else {
                blockParent();
                res.push(selectorsMap[key] = block = isPlainObj(s)? (function() {
                    s.parent = parent;
                    s.selectorMatch =  match[0];
                    return s;
                })() : {
                    selector: key,
                    parent : parent,
                    entriesList : [],
                    selectorMatch: match[0]
                });
            }
            entries = block.entriesList;
            if (parent && parent.children) parent.children.push(block);
            stack.push(block);
            step = _sass ? OPEN_BLOCK : SELECTOR;
        }
        
        function initContext() {
            globals = { declarations : [], variables : {}};
            ctx = ctx||{};
            ctx.mixins = ctx.mixins||{};
            ctx.globals = globals;
            ctx.imports = {};
        }
        
        
        var groups = { 
            comment: 1,
            include : 2,
            includeArgs : 3,
            includeUsing: 4,
            importPath : 5,
            usePath: 6,
            useWith: 7,
            entryOrSelector: 8,
            entry: 9
        };
        var _var = "(?:\\$[a-zA-Z_-][a-zA-Z0-9_-]*)";
        var openParens = "\\(";
        var closeParens = "\\)"; 
        var _using = "(?:\\s*\\busing\s*\\(\\s*(" + _var + "(?:\\s*,\\s*" + _var + ")*" + ")\\s*\\))";        
        var _includeRe = "\\s*@include\\s+" 
                + "([^" + openParens + "\\{;]+)" //name
                + "\\s*" 
                + "(?:" 
                + openParens + "\\s*"                 
                + "([^;\\{\\}" + closeParens + "]+" + closeParens + "\\s*)" //args
                + _using + "?"
                + ")?"                 
                + "(?:;|\\{)" //end/stop to ';' or '{' characters
                + "\\s*";
        var globals;
        var path = "'(?:[^']|\\\\')*'|\"(?:[^\"]|\\\\\")*\"";
        //The regular expression used to parse the sass text
        //var re = /\s*(?:(\/\*(?:[^*]|\*(?!\/))*\*\/)|\/\/[^\n\r]+(?:\n|\r\n?))\s*|\s*@include\s+([^\(]+)\s*(?:\(\s*([^;{}]+))?(?:;|{)\s*|\{|\}|@(import|use)\s+([^;]+);|([^;\{\}]+(;)?)/g,
        //var re = /\s*(?:(\/\*(?:[^*]|\*(?!\/))*\*\/)|\/\/[^\n\r]+(?:\n|\r\n?))\s*|\s*@include\s+([^\(]+)\s*(?:\(\s*([^;{}]+))?(?:;|{)\s*|\{|\}|@(import|use)\s+([^;]+);|((?:(\s*([#]\{\$[a-zA-Z_-][a-zA-Z0-9_-]*\}\s*:\s*[^;{}:]+))|[^;\{\}]+)(;)?)/g,
        /*var re = new RegExp("\\s*(?:(\\/\\*(?:[^*]|\\*(?!\\/))*\\*\\/)|" 
		+ "\\/\\/[^\\n\\r]+(?:\\n|\\r\\n?))\\s*|"
		+ "\\s*@include\\s+([^\\(]+)\\s*(?:\\(\\s*([^;{}]+))?(?:;|{)\\s*|"
		+ "\\{|\\}|"
		+ "@(import|use)\\s+([^;]+);|"
		+ "((?:(\\s*([#]\\{\\$[a-zA-Z_-][a-zA-Z0-9_-]*\\}\\s*:\\s*[^;{}:]+))|"
		+ "[^;\\{\\}]+)(;)?)", "g"),*/
        var re = new RegExp(
                "\\s*(?:(\\/\\*(?:[^*]|\\*(?!\\/))*\\*\\/)|" 
		+ "\\/\\/[^\\n\\r]+(?:\\n|\\r\\n?))\\s*|"
		+ _includeRe + "|"
		+ "\\{|\\}|"
		+ "@(?:import\\s+(" + path + ")\\s*|use\\s+(" + path + ")\\s*(?:\\s*with\\s*(\\([^\\)]\\)\\s*))?);|"
		+ "((?:(?:\\s*(?:[#]\\{\\$[a-zA-Z_-][a-zA-Z0-9_-]*\\}\\s*:\\s*[^;{}:]+))|"
		+ "[^;\\{\\}]+)(;)?)",
		"g"),
                key, i, body;
        var res = [];
        var stack = [];
        var block,entry,entries, match;
        var SELECTOR = 1, step = 0, SELECTOR = 1, OPEN_BLOCK = 2, 
            CLOSE_BLOCK = 3, ENTRY = 4, INCLUDE = 5,
            IMPORT = 6,
            EXPORT = 7,
            MIXIN_STATEMENT = 8,
            parent, 
            fn, i = 0, 
            selectorsMap = {};
        var comments, path,
            level = 1;
        var _sass, execMode, expressionParser;
        if (isPlainObj(sass)) {
            ignoreLoadError = !!sass.ignoreLoadError;
            expressionParser = sass.expressionParser||sass.parser||SASSExprParser.DEFAULT_PARSER;
            execMode = sass.exec;
            if (execMode === undefined) execMode = sass.execMode;
            execMode = typeof toBool === 'function' ? toBool(execMode) : !!execMode;            
            _sass = sass["sass"]? true: false;  
            
        }
        
        initContext();
        //the regex pattern => $<variable name>:<value>!(global|default)
        var varRe = /^\s*\$([a-zA-Z_-][a-zA-Z0-9_-]*)\s*:\s*(?:("(?:[^"]|\\")*)"|([^;]+))\s*(?:!(global|default)\s*)?;\s*$/;
        processVar = execMode ? 
            function (sdecl, globals, scope) {
                var match = varRe.exec(sdecl), vars, decl, v, s;
                if (match) {
                    decl = { type: "variable", name : match[1], string: !!match[2]}; 
                    if (match[4] === 'global') {
                        decl.modifier = 'global';
                    }
                    if (!scope) {
                        decls = res;
                        step = 0;
                        vars = globals.variables;
                    } else {
                        decls = entries; 
                        if (match[4] === 'global') {
                            vars = globals.variables;
                        } else {
                            vars = scope.variables||(scope.variables={});                                           
                        }
                        step = ENTRY;
                    }
                    decls.push(decl);
                    if (match[2]) {
                        v = strVal(match[2].trim());
                    } else {
                        v = expressionParser.readValue(s = match[3].trim());
                        if (v.lastIndex !== s.length) {
                            throw new Error("Incorrect value");
                        }
                        v = v.value;
                    }
                    vars['$' + match[1]] = decl.value = v;

                } else {
                    throw new Error("Incorrect variable declaration");
                }
            } :
            function(sdecl, globals, scope) {            
                var match = varRe.exec(sdecl), vars, decl;
                if (match) {
                    decl = { 
                        type: "variable", 
                        name : '$' + match[1], 
                        value: match[3] ? match[3]: strVal(match[2]),
                        string : !!match[3],
                        ref : match[1]
                    }; 
                    if (match[4] === 'global') {
                        decl.modifier = 'global';
                    }
                    if (!scope) {
                        decls = res;
                        step = 0;
                    } else {
                        decls = entries;
                        step = ENTRY;
                    }
                    decls.push(decl);                
                } else {
                    throw new Error("Incorrect variable declaration");
                }
            };
        //(?<!Y)X
        getEntry = execMode ? function(str) {
            var parms, i, n, b;
            if (b = isMixin(block)) {
                return str.replace(/(?<!#\{)\$[a-zA-Z_-][a-zA-Z0-9_-]*/, function(match) {
                    var name = match, vars;
                    if (b.scope) {
                        vars = b.scope.variables;
                        if ((Object.keys(vars)).indexOf(name) >= 0) {
                            return vars[name];
                        }
                    }
                    vars = globals.variables;
                    if ((Object.keys(vars)).indexOf(name) >= 0) {
                        return vars[name];
                    } else {
                        parms = b.fn.params;
                        for(i=0, n = parms.length;i<n;i++) {
                            //if the variable is a parameter of the mixin 
                            //function, return identical value
                            //the first index (0) of the array representing a 
                            //parameter it's the parameter name
                            if (parms[i][0] === name) {
                                //no replace
                                return match;
                            }
                        }
                        throw new Error("The variable " +name + " is not defined");
                    }
                });
            }
            return str.replace(/\$[a-zA-Z_-][a-zA-Z0-9_-]*/, function(match) {
                var name = match, vars;
                if (block.scope) {
                    vars = block.scope.variables;
                    if ((Object.keys(vars)).indexOf(name) >= 0) {
                        return vars[name];
                    }
                }
                vars = globals.variables;
                if ((Object.keys(vars)).indexOf(name) >= 0) {
                    return vars[name];
                } else {
                    throw new Error("The variable " +name + " is not defined");
                }
            });
        }: function(str) {
            return str;
        };
        getValue = execMode ? function(v) {
            var mixin, parms, i, n;
            if (isPlainObj(v)) return v;
            if (execMode && v[0] === '$') {
                if (block.variables && Object.keys(block.variables).indexOf(v) >= 0) {
                    v = block.variables[v];
                } else if (Object.keys(globals.variables).indexOf(v) >= 0) {
                    v = globals.variables[v];
                } else {
                    if (mixin = isMixin(block)) {
                        parms = mixin.fn.params;
                        for(i=0, n = parms.length;i<n;i++) {
                            //if the variable is a parameter of the mixin 
                            //function, return identical value
                            //the first index (0) of the array representing a 
                            //parameter it's the parameter name
                            if (parms[i][0] === name) {
                                //no replace
                                return v;
                            }
                        }
                    }
                    throw new Error("Variable not defined");
                }
            }
            return v;
        } : function(v) { return v; };
        
        processBlock = _sass ? function() {
            if (step === INCLUDE) {
                initIncludeContent();
            } else {
                initSelector();
            }
        } : initSelector;
        
        function closeBlock() {
            if ((step === CLOSE_BLOCK && !block.children) || 
                        (step !== OPEN_BLOCK && step !== ENTRY 
                        && step !== INCLUDE && step !== CLOSE_BLOCK)) {
                    throw new Error("unexpected character '{'");
                }
                if (block.include) {
                    block = block.include.parent;
                } else {
                    block = block.parent;
                    entries = block ? block.entriesList : undefined;
                }
                step = CLOSE_BLOCK;
                stack.pop();
        }
        
        closeParens = _sass ? function () {
            throw new Error("Unexpected character '}");
        }: function() {
            closeBlock();
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
               
        
        
        openParens = _sass ? function() {
            throw new Error("unexpected character '{'");
        } : function() {
            if (step !== SELECTOR) {
                throw new Error("unexpected character '{'");
            }            
            step = OPEN_BLOCK; 
        };
    
        if (_sass) {            
            ctx.indent = 0;
            ctx.index = 0;
            ctx.lines = scss.split(/\n|\r\n?/);
            ctx.count = ctx.lines.length;
            this.paths = [];
            ctx.next = function() {
                var line, i,  n, path, match, p, 
                    paths = this.paths,
                    path, backward, 
                    lines = this.lines;
                this.line = (function(){
                    for (;;) {
                        if (this.index >= this.count) return (line=false);
                        if (line =  lines[++this.index].trim()) return line;
                    }
                })();
                if (!line) return undefined;
                i=0;
                n = line.length;
                while (i<n) {
                    if (line[i++] !== ' ') {
                        break;
                    }                    
                }
                p = paths.length - 1;                       
                while (p >= 0) {
                    path = paths[p];
                    if (path.indent > i) {
                        closeBlock();
                        paths.pop();
                        backward = true;
                    } else {
                        break;
                    }
                    p--;
                } 
                if (backward) { //if blocks has been closed ?

                } else if (i > this.indent) { //possible new block or entry
                    this.indents.push(path = { indent : this.indent = i});                        
                } else {
                    if ([ENTRY, INCLUDE, IMPORT, EXPORT].indexOf(step) < 0) {

                    }
                }
                return re.exec(line);
            };
        } else {
            ctx.next = function() {
                return re.exec(scss);
            };
        }
        while (match = ctx.next()) {            
            if (key = match[groups.include]) { //@include
                processInclude(key);
            } else if (key=match[groups.entryOrSelector] ? match[groups.entryOrSelector].trim(): "") {//property/simple entry case or selector case
                if (match[groups.entry]) { //property/simple entry case
                    processEntry();                    
                } else {//selector case
                    //parse the match string, create/open new block and set  
                    //step to SELECTOR
                    processBlock(); //open block
                }
            }else if (match[0] === '{') {
                openParens(); 
            } else if (match[0] === '}') {
                closeParens();
            } else if (match[groups.importPath] || match[groups.usePath]) {
                if (step !== 0 && step !== IMPORT) {
                    throw new Error("Unexpected @import");
                }
                try {
                    load(path = unquote(match[groups.importPath]||match[groups.usePath]), ctx, match[groups.useWith]); 
                } catch (err) {
                    if (!ignoreLoadError) throw err;
                }
                res.push({ type: match[groups.import], rule: match[0], path:path});
                step = IMPORT;
            } else if (match[1]) { //multiline comment case
                if (comments) {
                    //comments.push(match[0]);
                } else {
                    //comments = [match[0]];
                }
            }else if (key) {
                if (step !== OPEN_BLOCK && step !== ENTRY && step !== INCLUDE) {
                    throw new Error("unexpected character '{'");
                }
                entries.push(key);
                step = ENTRY;
            }
            i = re.lastIndex;
        }
        if (i < scss.length) {
            throw new Error("");
        }
        if (step !== 0 //at step 0, the result can be empty or contains only 
                        // global declaration
                && step !== CLOSE_BLOCK //ith step equals to close block, the result contains at least one block (selector or mixin)
                ) {
            throw new Error("");
        }
        return res;
    }
    
    
    var selDelim ="\n", entryTab = "\n  ", inline, _indent = " ", indent, nl = "\n";
    
    function getIndent() {    
        return _indent ? function (level) {
            var i = 0, s = "";
            while (i++ < level) {
                s += _indent;
            }
            return s;
        } : function(level) {
            return "";
        };
    }
    
    function getSelectors(block) {
        if (block.selector === '&:checked') {
            console.log('checked');
        }
        var sels, bs, sel, _sels;
        if (block.selectors) return block.selectors;
        sel = block.selector;
        bs = sel.split(/\s*,\s*/);
        block.selectors = _sels = [];
        bs.forEach(function(s) {
            if (s[0] === '&') {
                sels = getSelectors(block.parent);
                sels.forEach(function(p) {
                    _sels.push(p + s.substring(1));
                });
            } else {
               _sels.push(s);
            }
        }) ;
        return _sels;
    }
    
    function toSelectorCss(sel, level, buf) {
        var parent,
            selectors, s, result, entries, delim, sels;
        var res, selectorsText;
        s = sel.selector;
        
        if (parent = sel.parent) {
            sels = s.split(/\s*,\s*/);
            selectors = [];
            sels.forEach(function(s) {
                if (s[0] === '&') {
                    //remove '&' at the begining of the selector
                    s = s.substring(1);
                    delim = "";
                } else {
                    delim = " ";
                }
                getSelectors(parent).forEach(function(e) {                    
                    selectors.push(e.split(/\s*,\s*/).join(delim + s + ",") + delim + s);
                });
            });            
        } else {
            selectors = [s];
        }
        selectorsText = selectors.join(",");
        result  = indent(level) + selectors.join("," + (selDelim === "\n"? indent(level):selDelim||""));
        
        if (sel.extend && sel.extend.length) {
            result += ", " + sel.extend.join(", ");
        }
        
        buf.selectors.push(res = { selectors: selectors, selectorsText : selectorsText});
        if (level === 1) {
            buf.selectors[selectorsText] = res;
        }
        var cssText = "{", _super;
        entries = sel.entriesList||sel.block;
        if (isPlainObj(entries)) {
            entries = entries.entriesList||entries.items||entries.elements;
        }
        if (!isArray(entries)) {
            throw new Error("Incorrect entries");
        }
        entries.forEach(function(e) {
            if (typeof e === 'string') {
                cssText += nl + indent(level + 1) + e;
            } else if (isArray(e) || isPlainObj(e)) {
                if (isArray(e)) {
                    cssText += nl + toFuncCss(e, level + 1, buf);
                } else if (e.type === 'selector' || e.selector || e.entriesList ) {//selector case
                    toSelectorCss(e, 1, buf);
                } else if (e.extend ) {
                    if (_super = buf.selectors[e.extend]) {
                        if (!_super.extend) _super.extend = [];
                        _super.extend.push(e.extend);
                    } else {
                        throw new Error("Incorrect entry");
                    }
                } else {
                    cssText += nl + _toCss(e, level + 1, buf);
                }
            } else {
                throw new Error("Incorrect entry");
            }
        });
        cssText += nl + indent(level) + "}";
        
        res.cssText = cssText;
        return (res.outerText = result + nl + indent(level) + cssText);
    }
    
    function toFuncCss(call, level, buf) {
        var x, args = call[1]||[], mix, result, indent;
        if (typeof level === 'object') {
            x = level;
            level = buf;
            buf = x;
        }
        mix = buf.mixins[call[0]];
        if (mix) {
            indent = "";
            while (level-- > 1) {
                indent += "  ";
            }
            result = mix(call[1], indent);
            if (result[result.length - 1] !== ';') result += ';';
            return result;
        }
        result = call[0] + "(";
        args.forEach(function(a, i) {
            if (i > 0) result += ",";
            if (typeof a === 'string') {
                result += a;
            } else if (isArray(a)) {
                result += toFuncCss(a, level, buf);
            } else if (isplainObj(a)) {
                throw new Error("Incorrect function call");
            }
        });
        result += ")";        
        return result;
    }
    
    function toEntryCss(entry){
        function toStr(k, v) {
            if (v == undefined) {
                throw new Error("Incorrect entry value");
            } else if (typeof v !== 'string') {
                v = "" + v;
            }
            if (!v || !k) {
                throw new Error("Incorrect entry");
            }
            return k + ": " + v + ";";
        }
        var k, v;
        if (typeof entry === 'string') return entry;
        if (isArray(entry)) {
            if (!entry[1]) {
                throw new Error("Incorrect entry");
            }
            return toStr(entry[0], entry[1]);
        }
        return toStr(entry.property||entry.name||entry.key, entry.value);
    }
    
    function toCss(obj, options, ctx) {
        options = options||{};
        ctx = ctx||options.context||options.ctx||options;
        var buf = { selectors : [], map : {}, mixins : ctx.mixins, ctx: ctx};
        selDelim = options.selectorDelim||options.selDelim||options.selectorDelimiter||"\n";
        var v = options.nl;
        if (v == undefined) {
            v = options.newLine;
            if (v == undefined) {
                v = options.breakLine;
                if (v == undefined) {
                    v = options.newline;
                }
            }
        }
        nl = v == undefined ? "\n" : v||"";
        if (options.indent || options.indent === 0) {
            _indent = options.indent;
            if (typeof _indent === 'number') {
                var n = _indent, i = 0;
                _indent = "";
                while (i++ < n) {
                    _indent += " ";
                }
            }
        }
        indent = getIndent();
        
        var str = _toCss(obj, 1, buf);
        var css = "";
        buf.selectors.forEach(function(s, i) {
            css += "\n" + s.selectorsText + " " + s.cssText;
        });
        return css;
    }
    
    function _toCss(obj, level, buf) {
        var result = [], engines = [], libs = [];
        var rules;
        
        if (isPlainObj(rules = obj)) {
            rules = obj.rules||obj.Rules||obj.selectors||obj.entriesList||obj.items;
        }
        
        if (!isArray(rules)) {
            throw new Error("Incorrect argument");
        }
        
        
        rules.forEach(function(rule) {
            if (isPlainObj(rule)) {
                switch(rule.type||"") {
                    case 'entry':
                        result.push(toEntryCss(rule));
                        break;
                    case 'include': ////@include case
                        result.push(toFuncCss(rule.function||rule.func||rule.call||rule, buf));
                        break;
                    case 'extend': //@extend case
                        throw new Error("@extend not yet supported");
                        //break;
                    case 'selector':
                        toSelectorCss(rule, 1, buf);
                        break;
                    case 'function':                    
                    case 'call':
                        result.push(toFuncCss(rule.name ? [rule.name, rule.arguments||rule.args||rule.parameters||rule.params] : rule.call||rule.apply||rule.parts||rule.invocation, buf));
                        break;
                    case 'mixin' :  //@mixin case
                        throw new Error("@mixin not yet supported");
                        //break;
                    case 'import':
                        engines.splice(0, 0, rule.path);
                        libs.push(rule.path);
                        break;
                    default:
                        if (isArray(rule)) {
                            result.push(toFuncCss(rule, buf)) //@include case also: function call
                        } else if (rule.selector && rule.entriesList) {
                            toSelectorCss(rule, 1, buf);
                        } else if (rule.type !== 'variable') {
                            throw new Error("Unsupported rule");
                        }
                        break;
                }
            } else if (isArray(rule)) {
                result.push(toFuncCss(rule, buf));
            } else if (typeof rule === 'string') {
                result.push(rule);
            } else {
                throw new Error("Incorrect rule");
            }            
        });
        return result.join("\n");
    }
    
    
    
    /**
     * 
     * @static
     * @class {CssUtils}
     */
    function CssUtils() {
        
    }
    
    CssUtils.__CLASS__ = CssUtils;
    
    CssUtils.__CLASS_NAME__ = "CssUtils";
    
    CssUtils.toCss = toCss;
    
    CssUtils.MEDIA_QUERY_MEDIA_TYPES = mediaQueryMediaTypes;
    
    CssUtils.DEPRECATED_MEDIA_TYPES = deprecatedMediaTypes;
    
    CssUtils.ALL_MEDIA_TYPES = allMediaTypes;
    
    var sassBuiltinObjects = ['meta', 'selector', 'map', 'color', 'list', 'math', 'string']
    
    /**
     * Parses the given SCSS or SASS string and returns an that contains all the 
     * statements (variables declarations, selectors, mixins, imports. ...).
     * @memberOf CssUtils
     * @param {String} scss  The SCSS or SASS string to parse
     * @param {Boolean|Object|String} [sass=false]
     *  <p>When the argument is a boolean, specify that the given text to parse is a scss text 
     *  if the value is true or specify that the gicen text to parse is a sass 
     *  text.</p> 
     *  <p>When the argument is a string, one of  'scss' or 'sass' values is expected.</p>
     *  <ul> 
     *  <li>If the value is 'scss'  specify that the given text to parse is a 
     *  scss text.</li>
     *  <li>If the value is 'scss'  specify that the given text to parse is a  
     *  sass text.</li>
     *  </ul>
     *  <p>When the argument is an object, the value <b>sass</b> field will  
     *  specify the type of text.
     *  </p>
     * @param {Object} [ctx]
     * @returns {Array}
     */
    CssUtils.parse = parse;
    /**
     * 
     * @param {String} scss
     * @param {Object} [ctx]
     * @returns {Object}
     */
    CssUtils.parseScss = function(scss, ctx) {
        return parse(scss, false, ctx);
    };
    /**
     * 
     * @param {String} sass
     * @param {Object} [ctx]
     * @returns {Object}
     */
    CssUtils.parseSass = function(sass, ctx) {
        return parse(sass, true, ctx);
    };
    CssUtils.scssToCss = scssToCss;

    return  CssUtils;

});


if (typeof SereniX === 'undefined') {
    ;(function(root, name, factory) {
        typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        root[name] = factory();
    })(this, 'SereniX', function() {
        return  { CssUtils: CssUtils };
    });
} else if (typeof SereniX.Namespace === 'function') {
    SereniX.addChild(CssUtils);
} else {
    SereniX.CssUtils = CssUtils;
}
