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
})(this, 'Mixins', function() {
    var Mixins = {};
    // These just output the arguments as a string
    
    var simpleMixins = [
        "appearance",
        "background-size",
        "border-bottom-left-radius",
        "border-top-left-radius",
        "border-bottom-right-radius",
        "border-top-right-radius",
        "border-radius",
        "box-shadow",
        "box-sizing",
        "columns",
        "column-gap",
        "column-count",
        "column-width",
        "filter",
        "hide-text",
        "hyphens",
        "hyphenation",
        "inline-block",
        "opacity",
        "rotate",
        "text-shadow",
        "transition",
        "transition-property",
        "transition-duration",
        "transition-timing-function",
        "word-break",
        "user-select"
    ];

    var mixins = {
      "border-top-radius": function(args) {
        return "border-top-left-radius: " + args;
               + "\nborder-top-right-radius: " + args;
      },
      "border-bottom-radius": function(args) {
        return "border-bottom-left-radius: " + args;
               + "\nborder-bottom-right-radius: " + args;
      },
      "border-left-radius": function(args) {
        return "border-top-left-radius: " + args;
               + "\nborder-bottom-left-radius: " + args;
      },
      "border-right-radius": function(args) {
        return "border-top-right-radius: " + args;
               + "\nborder-bottom-right-radius: " + args;
      },
      "rotate": function(args) {
        args = args.split(",");
        if(args.length === 1) {
          return "transform: rotate(" + args[0].trim() + ")";
        } else {
          // Not handling perspective or 3d Mixins options
          return false;
        }
      }
    };

    

    var xMixins = {
        'linear-gradient' : { fn: linearGradient, firstArgPrefix : true},
        'repeating-linear-gradient' : repeatingLinearGradient,
        'radial-gradient' : radialGradient,
        'repeating-radial-gradient' : repeatingRadialGradient,
        'background-image': backgroundImage,
        'background': background
    };


    simpleMixins.forEach(function(m) {
      mixins[m] = function(args, indent) {
        return (indent||"") + m + ": " + args;
      };
    });
    
    for (var name in xMixins) {
        mixins[name] = xMixins[name];
    }

    var fields = {
        mixin: 2,
        rule: 1,
        args : 3
    };

    var mixinsRe = new RegExp(
      "(" //                                     # Whole rule group \n\
        + "\\+"                                          //# sass mixin start character \n\
        + "("+Object.keys(mixins).join("|")+")" // # Mixin name  \n\
          + "\\(" //                                         # Mixin function brace start \n\
            +"([^\)]*)" // # Mixin arguments \n\
          + "\\)"//                                         # Mixin function brace end \n\
      +")" //                                             # End whole rule \n\
      + "\\s*$" //                                         # Optional whitespace to line end \n\
      , "gm"); 

    other_mixin_re = /(\+[\w-]+\([^\)]*\))\s*$/gm;
    

    
    var dirs = "to top, to top right, to right top, to right, to bottom right, to right bottom, to bottom, to bottom left, to left bottom, to left, to left top, to top left".split(/,[ ]/);
    
    var dirAngles = {
      'to top': '0deg', 
      'to bottom': '180deg',
      'to left': '270deg',
      'to right' : '90deg'  
    };

    function isAngle(v) {
        return /(?:\d+(?:\.\d+|\.\d+)?)(?:deg|grad|turn|rad|%)/.test(v);
    };

    function angle(v) {
        if (/(?:\d+(?:\.\d+|\.\d+)?)(?:deg|grad|turn|rad|%)/.test(v)) return v;
        throw new Error("Incorrect angle");
    };
    function isDirection(v) {
        return dirs.indexOf(v) >= 0 || isAngle(v);
    }
    
    var legacyDirs = ['top',  'left',  'right',  'bottom',  'bottom left',  'left-bottom',  'top left',  'left-top',  'top right',  'right-top',  'bottom-right',  'right-bottom' ];
    
    var legacyDirsMap = {
        'top': 'to bottom',  
        'left': 'to right',  
        'right': 'to left',  
        'bottom': 'to top',
        'bottom left': 'to top right',  
        'left-bottom': 'to right top',
        'top left': 'to bottom right',
        'left top': 'to right bottom',  
        'top right': 'to bottom left',  
        'right top': 'to left bottom',  
        'bottom right':  'to top left',
        'right bottom' : 'to left top'
    };
    
    function isLegacyDir(v) {
        return legacyDirs.indexOf(v) >= 0;
    }
    
    
    /**
     * Converts a direction to legacy syntax
     * @param {String} dir 
     * @returns {String} 
     */
    function legacyDir(dir) {
        var map = { 
            'to top': 'bottom',
            'to top right': 'bottom left',
            'to right top': 'left bottom',
            'to right': 'left',
            'to bottom right' : 'top left',
            'to right bottom' : 'left top',
            'to bottom': 'top',
            'to bottom left': 'top right',
            'to left bottom': 'right top',
            'to left': 'right',
            'to left top': 'right bottom',
            'to top left': 'bottom right',
            'top': 'top',
            'left': 'left',
            'right': 'right',
            'bottom': 'bottom'
        }, v;
        if (!isDirection(dir) && !isLegacyDir(dir)) {
            throw new Error("Incorrect direction");
        }
        //SereniX.Angle.diff requires serenix_angle.js loaded
        //SereniX.Angle.diff returns the difference between to angle in degree: 
        //    the result is a string
        //Returns the legacy direction or the legacy angle of the given direction
        return (v = map[dir]) ? v : SereniX.Angle.diff('90deg' - dir);

    }
    /**
     * @param {type} pos
     * @returns {undefined}
     */
    function oppositePosition(from) {
        return {
            "left": "right",
            "top": "bottom",
            "bottom" : "top",
            "right": "left",
            "center": "center"
        }[from];
    }
    /**
    // Return the corrected angle or position for a css gradient
    @function angle($deg) {
      @if type-of($deg) == 'number' {
        @return mod(abs($deg - 450), 360deg);
      } @else {
        $position: to + " ";
        @each $pos in $deg {
          $position: $position + opposite-position($pos) + " ";
        }
        @return $position;
      }
    }
     * @param {type} deg
     * @returns {undefined}
     */
    function degAngle(deg) {
        var pos;
        if (typeof deg === 'number') {
            return Math.abs(deg - 450) % 360;
        } else {
            pos = "to ";
            deg.forEach(function(d) {
                pos += oppositePosition(d) + " ";
            });
            return pos;
        }
    }


    /*

    // Background Opacity mixin
    // Add opacity to a background color
    @mixin backgroundOpacity($color, $opacity) {
        background-color: rgba($color, $opacity);
    }

    // Background Size mixin
    // Set background size for a background image
    @mixin backgroundSize($width: auto, $height: auto) {
            @if $width == cover or $width == contain {
                    -webkit-background-size: $width;
                    -moz-background-size: $width;
                    -o-background-size: $width;
                    background-size: $width;
            }
            @else if ($width != cover and $height != cover) and ($width != contain and $height != contain) {
                    -webkit-background-size: $width $height;
                    -moz-background-size: $width $height;
                    -o-background-size: $width $height;
                    background-size: $width $height;
            }
    }

    // Background linear gradient mixin
    // Add a linear gradient to any element's background
    @mixin linearGradient($gradientValues...) {
            background: -webkit-linear-gradient($gradientValues);
            background: -moz-linear-gradient($gradientValues);
            background: -o-linear-gradient($gradientValues);
            background: linear-gradient($gradientValues);
    }

    // Background repeating linear gradient mixin
    // Add a repeating linear gradient to any element's background
    @mixin repeatingLinearGradient($gradientValues...) {
            background: -webkit-repeating-linear-gradient($gradientValues);
            background: -moz-repeating-linear-gradient($gradientValues);
            background: -o-repeating-linear-gradient($gradientValues);
            background: repeating-linear-gradient($gradientValues);
    }

    // Background radial gradient mixin
    // Add a radial gradient to any element's background
    @mixin radialGradient($gradientValues...) {
            background: -webkit-radial-gradient($gradientValues);
            background: -o-radial-gradient($gradientValues);
            background: -moz-radial-gradient($gradientValues);
            background: radial-gradient($gradientValues);
    }

    // Background repeating radial gradient mixin
    // Add a repeating radial gradient to any element's background
    @mixin repeatingRadialGradient($gradientValues...) {
            background: -webkit-repeating-radial-gradient($gradientValues);
            background: -o-repeating-radial-gradient($gradientValues);
            background: -moz-repeating-radial-gradient($gradientValues);
            background: repeating-radial-gradient($gradientValues);
    }



     */

    /*


     background-image: radial-gradient(shape size at position, start-color, ..., last-color);
     */

    /*
     * 
    @mixin radial-gradient($from, $to) {
            background: -moz-radial-gradient(center, circle cover, $from 0%, $to 100%);
            background: -webkit-gradient(radial, center center, 0px, center center, 100%, color-stop(0%, $from), color-stop(100%, $to));
            background: -webkit-radial-gradient(center, circle cover, $from 0%, $to 100%);
            background: -o-radial-gradient(center, circle cover, $from 0%, $to 100%);
            background: -ms-radial-gradient(center, circle cover, $from 0%, $to 100%);
            background: radial-gradient(center, circle cover, $from 0%, $to 100%);
            background-color: $from;
    }
     */

    function radialGradient() {
        var a = arguments, len = a.length;
        var $ =  len > 1 ? Array.prototype.slice.call(a) : len ? isArray($) ? $ : [$] : [],
            start = 0;
        var shape = "(circle|ellipse)";
        var size = "(closest-side|farthest-side|closest-corner|farthest-corner|cover|contain|radius";
        var pt = "(?:top|left|bottom|right|\\d+(?:\\.\\d+)%)";
        var position = "(" + pt + " " + pt + ")";

        //background-image: radial-gradient(shape size at position, start-color, ..., last-color);

        var re = new RegExp("radial-gradient\\((?:" + shape + "\s+)?(?:" + size + "\s+)?(?:at\s+" + position + ",\s+)?([^\\)]+)\\)$", "g");
        var bg;
        if (/background/.test(bg = $[0])) {
            start = 1;
        } else {
            bg = "background";
        }
        bg += ": ";

        if (start > 0) {
            $ = $.slice(start);
        }

        var outer, inner, type;//circle


        /*background: $outer;
        background: -moz-radial-gradient( center, $type cover,  $inner 0%, $outer 100% );
        background: -webkit-gradient( radial, center center, 0px, center center, 100%, color-stop(0%,$inner), color-stop(100%,$outer) );
        background: -webkit-radial-gradient( center, $type cover,  $inner 0%, $outer 100% );
        background: -o-radial-gradient( center, $type cover,  $inner 0%, $outer 100% );
        background: -ms-radial-gradient( center, $type cover,  $inner 0%, $outer 100% );
        background: radial-gradient( center, $type cover,  $inner 0%, $outer 100% );*/

        res = "";

        if (!type) {
            type = "circle";
        }
        res += bg + outer + ";";
            res += bg + "-moz-radial-gradient( center, " + type + " cover,  " + inner + " 0%, " + outer + " 100% );";
            res += bg + "-webkit-gradient( radial, center center, 0px, center center, 100%, color-stop(0%," + inner + "), color-stop(100%," + outer + ") );";
            res += bg + "-webkit-radial-gradient( center, " + type + " cover,  " + inner + " 0%, " + outer + " 100% );";
            res += bg + "-o-radial-gradient( center, " + type + " cover,  " + inner + " 0%, " + outer + " 100% );";
            res += bg + "-ms-radial-gradient( center, " + type + " cover,  " + inner + " 0%, " + outer + " 100% );";
            res += bg + "radial-gradient( center, " + type + " cover,  " + inner + " 0%, " + outer + " 100% );";

        return res;
    }

    Mixins.radialGradient = radialGradient;

    function transformRadialGradient(css) {
        css = css.replace(/radial-gradient\(([a-z-\s]+\s+)?at ([^,]+)(?=,)/g, function($0, shape, center){
            return 'radial-gradient(' + center + (shape? ', ' + shape : '');
        });
    }

    function repeatingRadialGradient() {

    }

    function repeatingLinearGradient() {

    }
    
    function simpleFuncString(fn) {
        var s = "";
        s = fn[0] + "(";
        if (fn[1]) {
            fn[1].forEach(function(a) {
                if (isArray(a)) {
                    s += simpleFuncString(a);
                } else {
                    s += a;
                }
            });   
        }
        s += ")";
        return s;
    }
    
    function processMixin(name, args, indent, onlyValue) {
        var s = (indent||"") + (onlyValue ? "" : name + ": "), 
            n = s.length, _indent = indent||"", fn;
        while (n-- >= 0) {
            _indent += " ";
        }
        
        args.forEach(function(a, i) {
            var f;
            if (isArray(a)) {
                fn = xMixins[a[0]];
                if (typeof fn === 'function') {
                    s += fn(a[1], i ? _indent : "");
                } else if (fn) {
                    if (Object.keys(fn).indexOf('firstArgPrefix')) {
                        s += (i ? "\n" : "") + (fn.firstArgPrefix? (f=fn.fn||fn.func||fn['function']||fn.process)(name, a[1], indent) : f(a[1], indent));
                    } else {
                        throw new Error("Incorrect mixin processor: must be a function");
                    }
                } else {
                    s += (i ? indent : "") + simpleFuncString(a, indent);
                }
            } else {
                s += (i ? indent : "") + a;
            }
        });
        return s;
    }

    function background($, indent) {        
        return processMixin('background', $, indent||"", true);
    }
    function backgroundImage($, indent) {
        return processMixin('background-image', $, indent||"", true);
    }
    /*
    background: nth(nth($color-stops, 1), 1);
      background: -webkit-linear-gradient(legacy-direction($direction), $color-stops);
      background: linear-gradient($direction, $color-stops);
     */
    function linearGradient() {
        var res = "", c, a= arguments, len = a.length, arr, indent;
        var $ = isArray(a[0]) ? ((arr = true), a[0]) : len > 1 ? Array.prototype.slice.call(a) : len ? [a[0]] : [];
        var dir, t, re = /^([^ ]+)(?:[ \t]+([^]))?$/, match, stops = [], start = 0;
        var bg, endDelim, lDir, bg;
        if (arr) indent = typeof a[1] === 'string' ? a[1] : "";
        if (/background(?:-image)?/.test(bg = $[0])) {            
            bg += ": ";
            endDelim = ";";
            if ($.length ===2 && isArray($[1])) {
                $ = $[1];
                start = 0;
            } else if ($.length === 3 && isArray($[1])) {
                indent = $[2];
                $ = $[1];
                start = 0;
            } else {
                start = 1;
            }
            bg = (indent||"") + bg;
        } else {
            bg = (indent||"");
            endDelim = ",";
        }
        
        if (isDirection($[start])) {
            dir = $[start];
            $ = $.slice(start + 1);            
        } else if (isLegacyDir($[start])) {
            dir = legacyDirsMap[$[start]];
            $ = $.slice(start + 1);            
        } else {
            if (start > 0) {
                $ = $.slice(start);
            }
            dir = "180deg";
        }
        if ((t = typeof (c=$[0])) === 'string') {
            $.forEach(function(cs) {        
                if (match = re.exec(cs)) {
                    stops.push(match[2] ? match[1] + ' ' + angle(match[2]) : match[1])
                } else {
                    throw new Error("Incorrect arguments");
                }
            });
        } else if (isArray(c)) {
            $.forEach(function(cs) {        
                stops.push(cs[1] ? cs[0] + ' ' + angle(cs[1]) : cs[1]);
            });
        } else if (t === 'object' && c) {
            $.forEach(function(cs) {        
                stops.push(cs.angle ? (cs.color) + ' ' + angle(cs.angle) : cs.color);
            });
        } else {
            throw new Error("Incorrect arguments");
        }
        c = (stops[0].split(/[ ]/)[0]);
        stops = stops.join(", ");
        res = bg + c + endDelim;
        res += "\n" + bg + "-webkit-linear-gradient("+(lDir=legacyDir(dir)) + ', ' + stops + ')' + endDelim;
        res += "\n" + bg + "-moz-linear-gradient(" + lDir + ", " + stops + ')' + endDelim;
        res += "\n" + bg + "-o-linear-gradient(" + lDir + ", " + stops + ')' + endDelim;
        res += "\n" + bg + "linear-gradient("+dir + ', ' + stops + ');';
        return res;
    }

    Mixins.linearGradient = linearGradient;
    
    Mixins.getMixin = function(name) {
        return mixins[name];
    };
    
    Mixins.mixins = mixins;
    
    Mixins.regex = mixinsRe;
    
    Mixins.replace = function (text) {
        return text.replace(mixinsRe, function(match) {
            var replacement = mixins[match.mixin](match[fields.args]);

            if(replacement) {
                return replacement;
            } else {
                console.error(chalk.bgRed("Cannot replace %s"), match.rule);
                return match.rule;
            }
        });
    };
    
    return Mixins;
});

if (typeof SereniX === 'undefined') {
    ;(function(root, name, factory) {
        typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        root[name] = factory();
    })(this, 'SereniX', function() {
        return  { Mixins: Mixins };
    });
} else if (typeof SereniX.Namespace === 'function') {
    SereniX.addChild(Mixins);
} else {
    SereniX.Mixins = Mixins;
}
