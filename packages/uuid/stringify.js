!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t=t||self).uuidStringify=e()}(this,(function(){"use strict";var t=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function e(e){return"string"==typeof e&&t.test(e)}for(var i=[],n=0;n<256;++n)i.push((n+256).toString(16).substr(1));return function(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,f=(i[t[n+0]]+i[t[n+1]]+i[t[n+2]]+i[t[n+3]]+"-"+i[t[n+4]]+i[t[n+5]]+"-"+i[t[n+6]]+i[t[n+7]]+"-"+i[t[n+8]]+i[t[n+9]]+"-"+i[t[n+10]]+i[t[n+11]]+i[t[n+12]]+i[t[n+13]]+i[t[n+14]]+i[t[n+15]]).toLowerCase();if(!e(f))throw TypeError("Stringified UUID is invalid");return f}}));