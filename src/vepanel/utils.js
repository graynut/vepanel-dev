/** 
    命令行工具 函数, 来源于 rollup/dist/rollup/bin
    The MIT License (MIT)
    Copyright (c) 2017 [these people](https://github.com/rollup/rollup/graphs/contributors)
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// rollup_js.relativeId
const absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|/])/;
function isAbsolute(path) {
  return absolutePath.test(path);
}
function relativeId(id) {
  if (typeof process === 'undefined' || !isAbsolute(id))
    return id;
  return path.relative(process.cwd(), id);
}
const rollup_js = {
  relativeId
}

// 命令行参数获取
var minimist = function(args, opts) {
  if (!opts)
    opts = {};
  var flags = {
    bools: {},
    strings: {},
    unknownFn: null
  };
  if (typeof opts['unknown'] === 'function') {
    flags.unknownFn = opts['unknown'];
  }
  if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
    flags.allBools = true;
  } else {
    [].concat(opts['boolean']).filter(Boolean).forEach(function(key) {
      flags.bools[key] = true;
    });
  }
  var aliases = {};
  Object.keys(opts.alias || {}).forEach(function(key) {
    aliases[key] = [].concat(opts.alias[key]);
    aliases[key].forEach(function(x) {
      aliases[x] = [key].concat(aliases[key].filter(function(y) {
        return x !== y;
      }));
    });
  });
  [].concat(opts.string).filter(Boolean).forEach(function(key) {
    flags.strings[key] = true;
    if (aliases[key]) {
      flags.strings[aliases[key]] = true;
    }
  });
  var defaults = opts['default'] || {};
  var argv = {
    _: []
  };
  Object.keys(flags.bools).forEach(function(key) {
    setArg(key, defaults[key] === undefined ? false : defaults[key]);
  });
  var notFlags = [];
  if (args.indexOf('--') !== -1) {
    notFlags = args.slice(args.indexOf('--') + 1);
    args = args.slice(0, args.indexOf('--'));
  }

  function argDefined(key, arg) {
    return (flags.allBools && /^--[^=]+$/.test(arg)) ||
      flags.strings[key] || flags.bools[key] || aliases[key];
  }

  function setArg(key, val, arg) {
    if (arg && flags.unknownFn && !argDefined(key, arg)) {
      if (flags.unknownFn(arg) === false)
        return;
    }
    var value = !flags.strings[key] && isNumber(val) ?
      Number(val) : val;
    setKey(argv, key.split('.'), value);
    (aliases[key] || []).forEach(function(x) {
      setKey(argv, x.split('.'), value);
    });
  }

  function setKey(obj, keys, value) {
    var o = obj;
    keys.slice(0, -1).forEach(function(key) {
      if (o[key] === undefined)
        o[key] = {};
      o = o[key];
    });
    var key = keys[keys.length - 1];
    if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
      o[key] = value;
    } else if (Array.isArray(o[key])) {
      o[key].push(value);
    } else {
      o[key] = [o[key], value];
    }
  }

  function aliasIsBoolean(key) {
    return aliases[key].some(function(x) {
      return flags.bools[x];
    });
  }
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if (/^--.+=/.test(arg)) {
      // Using [\s\S] instead of . because js doesn't support the
      // 'dotall' regex modifier. See:
      // http://stackoverflow.com/a/1068308/13216
      var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
      var key = m[1];
      var value = m[2];
      if (flags.bools[key]) {
        value = value !== 'false';
      }
      setArg(key, value, arg);
    } else if (/^--no-.+/.test(arg)) {
      var key = arg.match(/^--no-(.+)/)[1];
      setArg(key, false, arg);
    } else if (/^--.+/.test(arg)) {
      var key = arg.match(/^--(.+)/)[1];
      var next = args[i + 1];
      if (next !== undefined && !/^-/.test(next) &&
        !flags.bools[key] &&
        !flags.allBools &&
        (aliases[key] ? !aliasIsBoolean(key) : true)) {
        setArg(key, next, arg);
        i++;
      } else if (/^(true|false)$/.test(next)) {
        setArg(key, next === 'true', arg);
        i++;
      } else {
        setArg(key, flags.strings[key] ? '' : true, arg);
      }
    } else if (/^-[^-]+/.test(arg)) {
      var letters = arg.slice(1, -1).split('');
      var broken = false;
      for (var j = 0; j < letters.length; j++) {
        var next = arg.slice(j + 2);
        if (next === '-') {
          setArg(letters[j], next, arg);
          continue;
        }
        if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
          setArg(letters[j], next.split('=')[1], arg);
          broken = true;
          break;
        }
        if (/[A-Za-z]/.test(letters[j]) &&
          /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
          setArg(letters[j], next, arg);
          broken = true;
          break;
        }
        if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setArg(letters[j], arg.slice(j + 2), arg);
          broken = true;
          break;
        } else {
          setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
        }
      }
      var key = arg.slice(-1)[0];
      if (!broken && key !== '-') {
        if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) &&
          !flags.bools[key] &&
          (aliases[key] ? !aliasIsBoolean(key) : true)) {
          setArg(key, args[i + 1], arg);
          i++;
        } else if (args[i + 1] && /true|false/.test(args[i + 1])) {
          setArg(key, args[i + 1] === 'true', arg);
          i++;
        } else {
          setArg(key, flags.strings[key] ? '' : true, arg);
        }
      }
    } else {
      if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
        argv._.push(flags.strings['_'] || !isNumber(arg) ? arg : Number(arg));
      }
      if (opts.stopEarly) {
        argv._.push.apply(argv._, args.slice(i + 1));
        break;
      }
    }
  }
  Object.keys(defaults).forEach(function(key) {
    if (!hasKey(argv, key.split('.'))) {
      setKey(argv, key.split('.'), defaults[key]);
      (aliases[key] || []).forEach(function(x) {
        setKey(argv, x.split('.'), defaults[key]);
      });
    }
  });
  if (opts['--']) {
    argv['--'] = new Array();
    notFlags.forEach(function(key) {
      argv['--'].push(key);
    });
  } else {
    notFlags.forEach(function(key) {
      argv._.push(key);
    });
  }
  return argv;
};

function hasKey(obj, keys) {
  var o = obj;
  keys.slice(0, -1).forEach(function(key) {
    o = (o[key] || {});
  });
  var key = keys[keys.length - 1];
  return key in o;
}

function isNumber(x) {
  if (typeof x === 'number')
    return true;
  if (/^0x[0-9a-f]+$/i.test(x))
    return true;
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

// 命令行美化输出
const tc = {
  enabled: process.env.FORCE_COLOR ||
    process.platform === "win32" ||
    (process.stdout.isTTY && process.env.TERM && process.env.TERM !== "dumb")
};
const Styles = (tc.Styles = {});
const defineProp = Object.defineProperty;
const init = (style, open, close, re) => {
  let i, len = 1,
    seq = [(Styles[style] = {
      open,
      close,
      re
    })];
  const fn = s => {
    if (tc.enabled) {
      for (i = 0, s += ""; i < len; i++) {
        style = seq[i];
        s =
          (open = style.open) +
          (~s.indexOf((close = style.close), 4) // skip first \x1b[
            ?
            s.replace(style.re, open) :
            s) +
          close;
      }
      len = 1;
    }
    return s;
  };
  defineProp(tc, style, {
    get: () => {
      for (let k in Styles)
        defineProp(fn, k, {
          get: () => ((seq[len++] = Styles[k]), fn)
        });
      delete tc[style];
      return (tc[style] = fn);
    },
    configurable: true
  });
};
init("reset", "\x1b[0m", "\x1b[0m", /\x1b\[0m/g);
init("bold", "\x1b[1m", "\x1b[22m", /\x1b\[22m/g);
init("dim", "\x1b[2m", "\x1b[22m", /\x1b\[22m/g);
init("italic", "\x1b[3m", "\x1b[23m", /\x1b\[23m/g);
init("underline", "\x1b[4m", "\x1b[24m", /\x1b\[24m/g);
init("inverse", "\x1b[7m", "\x1b[27m", /\x1b\[27m/g);
init("hidden", "\x1b[8m", "\x1b[28m", /\x1b\[28m/g);
init("strikethrough", "\x1b[9m", "\x1b[29m", /\x1b\[29m/g);
init("black", "\x1b[30m", "\x1b[39m", /\x1b\[39m/g);
init("red", "\x1b[31m", "\x1b[39m", /\x1b\[39m/g);
init("green", "\x1b[32m", "\x1b[39m", /\x1b\[39m/g);
init("yellow", "\x1b[33m", "\x1b[39m", /\x1b\[39m/g);
init("blue", "\x1b[34m", "\x1b[39m", /\x1b\[39m/g);
init("magenta", "\x1b[35m", "\x1b[39m", /\x1b\[39m/g);
init("cyan", "\x1b[36m", "\x1b[39m", /\x1b\[39m/g);
init("white", "\x1b[37m", "\x1b[39m", /\x1b\[39m/g);
init("gray", "\x1b[90m", "\x1b[39m", /\x1b\[39m/g);
init("bgBlack", "\x1b[40m", "\x1b[49m", /\x1b\[49m/g);
init("bgRed", "\x1b[41m", "\x1b[49m", /\x1b\[49m/g);
init("bgGreen", "\x1b[42m", "\x1b[49m", /\x1b\[49m/g);
init("bgYellow", "\x1b[43m", "\x1b[49m", /\x1b\[49m/g);
init("bgBlue", "\x1b[44m", "\x1b[49m", /\x1b\[49m/g);
init("bgMagenta", "\x1b[45m", "\x1b[49m", /\x1b\[49m/g);
init("bgCyan", "\x1b[46m", "\x1b[49m", /\x1b\[49m/g);
init("bgWhite", "\x1b[47m", "\x1b[49m", /\x1b\[49m/g);

const turbocolor = tc;
const stdout = console.log.bind(console);
const stderr = console.error.bind(console);

// rollup 异常处理
function handleError(err, recover = false) {
  let description = err.message || err;
  if (err.name)
    description = `${err.name}: ${description}`;
  const message = (err.plugin ?
    `(plugin ${(err).plugin}) ${description}` :
    description) || err;
  stderr(turbocolor.bold.red(`[!] ${turbocolor.bold(message.toString())}`));
  if (err.url) {
    stderr(turbocolor.cyan(err.url));
  }
  if (err.loc) {
    stderr(`${rollup_js.relativeId((err.loc.file || err.id))} (${err.loc.line}:${err.loc.column})`);
  } else if (err.id) {
    stderr(rollup_js.relativeId(err.id));
  }
  if (err.frame) {
    stderr(turbocolor.dim(err.frame));
  }
  if (err.stack) {
    stderr(turbocolor.dim(err.stack));
  }
  stderr('');
  if (!recover)
    process.exit(1);
}

function title(str) {
  stdout(`${turbocolor.bold.yellow('(!)')} ${turbocolor.bold.yellow(str)}`);
}

function info(url) {
  stdout(turbocolor.gray(url));
}

function nest(array, prop) {
  const nested = [];
  const lookup = new Map();
  for (const item of array) {
    const key = item[prop];
    if (!lookup.has(key)) {
      lookup.set(key, {
        items: [],
        key
      });
      nested.push(lookup.get(key));
    }
    lookup.get(key).items.push(item);
  }
  return nested;
}

function showTruncatedWarnings(warnings) {
  const nestedByModule = nest(warnings, 'id');
  const displayedByModule = nestedByModule.length > 5 ? nestedByModule.slice(0, 3) : nestedByModule;
  for (const {
      key: id,
      items
    } of displayedByModule) {
    stdout(turbocolor.bold(rollup_js.relativeId(id)));
    stdout(turbocolor.gray(items[0].frame));
    if (items.length > 1) {
      stdout(`...and ${items.length - 1} other ${items.length > 2 ? 'occurrences' : 'occurrence'}`);
    }
  }
  if (nestedByModule.length > displayedByModule.length) {
    stdout(`\n...and ${nestedByModule.length - displayedByModule.length} other files`);
  }
}

const immediateHandlers = {
  UNKNOWN_OPTION: warning => {
    title(`You have passed an unrecognized option`);
    stdout(warning.message);
  },
  MISSING_NODE_BUILTINS: warning => {
    title(`Missing shims for Node.js built-ins`);
    const detail = warning.modules.length === 1 ?
      `'${warning.modules[0]}'` :
      `${warning
                .modules.slice(0, -1)
                .map((name) => `'${name}'`)
                .join(', ')} and '${warning.modules.slice(-1)}'`;
    stdout(`Creating a browser bundle that depends on ${detail}. You might need to include https://www.npmjs.com/package/rollup-plugin-node-builtins`);
  }
};

const deferredHandlers = {
  CIRCULAR_DEPENDENCY(warnings) {
    title(`Circular dependenc${warnings.length > 1 ? 'ies' : 'y'}`);
    const displayed = warnings.length > 5 ? warnings.slice(0, 3) : warnings;
    for (const warning of displayed) {
      stdout(warning.cycle.join(' -> '));
    }
    if (warnings.length > displayed.length) {
      stdout(`...and ${warnings.length - displayed.length} more`);
    }
  },
  EMPTY_BUNDLE(warnings) {
    title(`Generated${warnings.length === 1 ? ' an' : ''} empty ${warnings.length > 1 ? 'chunks' : 'chunk'}`);
    stdout(warnings.map(warning => warning.chunkName).join(', '));
  },
  EVAL(warnings) {
    title('Use of eval is strongly discouraged');
    info('https://rollupjs.org/guide/en/#avoiding-eval');
    showTruncatedWarnings(warnings);
  },
  MISSING_EXPORT(warnings) {
    title('Missing exports');
    info('https://rollupjs.org/guide/en/#error-name-is-not-exported-by-module');
    for (const warning of warnings) {
      stdout(turbocolor.bold(warning.importer));
      stdout(`${warning.missing} is not exported by ${warning.exporter}`);
      stdout(turbocolor.gray(warning.frame));
    }
  },
  MISSING_GLOBAL_NAME(warnings) {
    title(`Missing global variable ${warnings.length > 1 ? 'names' : 'name'}`);
    stdout(`Use output.globals to specify browser global variable names corresponding to external modules`);
    for (const warning of warnings) {
      stdout(`${turbocolor.bold(warning.source)} (guessing '${warning.guess}')`);
    }
  },
  MIXED_EXPORTS: (warnings) => {
    title('Mixing named and default exports');
    info(`https://rollupjs.org/guide/en/#output-exports`);
    stdout(turbocolor.bold('The following entry modules are using named and default exports together:'));
    const displayedWarnings = warnings.length > 5 ? warnings.slice(0, 3) : warnings;
    for (const warning of displayedWarnings) {
      stdout(rollup_js.relativeId(warning.id));
    }
    if (displayedWarnings.length < warnings.length) {
      stdout(`...and ${warnings.length - displayedWarnings.length} other entry modules`);
    }
    //stdout(`\nConsumers of your bundle will have to use chunk['default'] to access their default export, which may not be what you want. Use \`output.exports: 'named'\` to disable this warning`);
  },
  NAMESPACE_CONFLICT(warnings) {
    title(`Conflicting re-exports`);
    for (const warning of warnings) {
      stdout(`${turbocolor.bold(rollup_js.relativeId(warning.reexporter))} re-exports '${warning.name}' from both ${rollup_js.relativeId(warning.sources[0])} and ${rollup_js.relativeId(warning.sources[1])} (will be ignored)`);
    }
  },
  NON_EXISTENT_EXPORT(warnings) {
    title(`Import of non-existent ${warnings.length > 1 ? 'exports' : 'export'}`);
    showTruncatedWarnings(warnings);
  },
  PLUGIN_WARNING(warnings) {
    const nestedByPlugin = nest(warnings, 'plugin');
    for (const {
        key: plugin,
        items
      } of nestedByPlugin) {
      const nestedByMessage = nest(items, 'message');
      let lastUrl = '';
      for (const {
          key: message,
          items
        } of nestedByMessage) {
        title(`Plugin ${plugin}: ${message}`);
        for (const warning of items) {
          if (warning.url && warning.url !== lastUrl)
            info((lastUrl = warning.url));
          if (warning.id) {
            let loc = rollup_js.relativeId(warning.id);
            if (warning.loc) {
              loc += `: (${warning.loc.line}:${warning.loc.column})`;
            }
            stdout(turbocolor.bold(loc));
          }
          if (warning.frame)
            info(warning.frame);
        }
      }
    }
  },
  SOURCEMAP_BROKEN(warnings) {
    title(`Broken sourcemap`);
    info('https://rollupjs.org/guide/en/#warning-sourcemap-is-likely-to-be-incorrect');
    const plugins = Array.from(new Set(warnings.map(w => w.plugin).filter(Boolean)));
    const detail = plugins.length > 1 ?
      ` (such as ${plugins
                .slice(0, -1)
                .map(p => `'${p}'`)
                .join(', ')} and '${plugins.slice(-1)}')` :
      ` (such as '${plugins[0]}')`;
    stdout(`Plugins that transform code${detail} should generate accompanying sourcemaps`);
  },
  THIS_IS_UNDEFINED(warnings) {
    title('`this` has been rewritten to `undefined`');
    info('https://rollupjs.org/guide/en/#error-this-is-undefined');
    showTruncatedWarnings(warnings);
  },
  UNRESOLVED_IMPORT(warnings) {
    title('Unresolved dependencies');
    info('https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency');
    const dependencies = new Map();
    for (const warning of warnings) {
      if (!dependencies.has(warning.source))
        dependencies.set(warning.source, []);
      dependencies.get(warning.source).push(warning.importer);
    }
    for (const dependency of dependencies.keys()) {
      const importers = dependencies.get(dependency);
      stdout(`${turbocolor.bold(dependency)} (imported by ${importers.join(', ')})`);
    }
  },
  UNUSED_EXTERNAL_IMPORT(warnings) {
    title('Unused external imports');
    for (const warning of warnings) {
      stdout(`${warning.names} imported from external module '${warning.source}' but never used`);
    }
  }
};

function batchWarnings() {
  let deferredWarnings = new Map();
  let count = 0;
  return {
    get count() {
      return count;
    },
    add: (warning) => {
      count += 1;
      if (warning.code in deferredHandlers) {
        if (!deferredWarnings.has(warning.code))
          deferredWarnings.set(warning.code, []);
        deferredWarnings.get(warning.code).push(warning);
      } else if (warning.code in immediateHandlers) {
        immediateHandlers[warning.code](warning);
      } else {
        title(warning.message);
        if (warning.url)
          info(warning.url);
        const id = (warning.loc && warning.loc.file) || warning.id;
        if (id) {
          const loc = warning.loc ?
            `${rollup_js.relativeId(id)}: (${warning.loc.line}:${warning.loc.column})` :
            rollup_js.relativeId(id);
          stdout(turbocolor.bold(rollup_js.relativeId(loc)));
        }
        if (warning.frame)
          info(warning.frame);
      }
    },
    flush: (silent) => {
      if (count === 0)
        return;
      if (!silent) {
        const codes = Array.from(deferredWarnings.keys()).sort((a, b) => deferredWarnings.get(b).length - deferredWarnings.get(a).length);
        for (const code of codes) {
          deferredHandlers[code](deferredWarnings.get(code));
        }
      }
      deferredWarnings = new Map();
      count = 0;
    },
  };
}

// 文件相关函数
function file_exist(path) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}
function file_md5(file) {
  const hash = crypto.createHash('md5');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex').substr(0, 8);
}

module.exports = {
  minimist,
  turbocolor,
  handleError,
  batchWarnings,
  stdout,
  stderr,
  title,
  info,
  file_exist,
  file_md5,
};