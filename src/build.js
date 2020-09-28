const http = require("https");
const path = require("path");
const fs = require("fs-extra");
const terser = require("terser");
const Vepanel = require("vepanel");
const decompress = require('decompress');
const rollup = require("rollup");
const vue = require("rollup-plugin-vue");
const buble = require("@rollup/plugin-buble");
const replace = require("@rollup/plugin-replace");
const commonjs = require("@rollup/plugin-commonjs");
const packJson = require("./../package.json");
const {
  minimist,
  turbocolor, 
  batchWarnings, 
  handleError
} = Vepanel.utils;

// 执行配置
const commondConf = {
  compress: true,
  silent: false
};

// npm package 生成目录
const distPath = 'packages';

// npm 包下载源: https://registry.npmjs.org/,  这里换成 taobao 的镜像加速
const npmregistry = 'https://registry.npm.taobao.org/';

function stdOutput(txt){
  if (!commondConf.silent) {
    process.stdout.write(txt);
  }
}
class CliOutput {
  constructor(){
    this.text = null;
    this.timer = null;
    this.interval = 80;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.frameIndex = 0;
  }
  clear(){
    if (this.timer) {
      stdOutput("\r\x1b[K");
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  start(){
    this.clear();
    const write = () => {
      stdOutput(`\r${this.frames[this.frameIndex++]} ${this.text}`);
      this.frameIndex %= this.frames.length;
    }
    write();
    this.timer = setInterval(write, this.interval);
  }
  load(text){
    this.text = text;
    this.start();
  }
  yellow(text){
    this.clear();
    stdOutput(turbocolor.yellow.bold(text) + "\n");
  }
  green(text){
    this.clear();
    stdOutput(turbocolor.green.bold(text) + "\n");
  }
  red(text){
    this.clear();
    stdOutput(turbocolor.red.bold(text) + "\n");
  }
}

const output = new CliOutput();
const projectPath = path.resolve(__dirname, './../');
const packageRoot = path.resolve(projectPath, 'src/packages');


/** commonds.update 相关: 获取最新版 npm 包
***********************************************************************************/
// 获取远程 url 返回的 json 数据
function getHttpJson(url){
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && 'location' in res.headers) {
        res.resume();
        resolve(getHttpJson(url))
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(`请求失败, 状态码: ${statusCode}`);
        return;
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  })
}

// 下载保存指定 url 的文件
function downloadFile(url, dest, file){
  if (!file) {
    fs.ensureFileSync(dest);
    file = fs.createWriteStream(dest);
  }
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && 'location' in res.headers) {
        res.resume();
        resolve(downloadFile(res.headers.location, dest, file))
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        file.close(() => {
          reject(`download file[${url}] failed`);
        });
        return;
      }
      res.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', error => {
      file.close();
      reject(error);
    });
  })
}

// 获取指定 Package 的最新版本
function getPackageLatest(conf){
  if (conf.type === 'github') {
    return new Promise((resolve, reject) => {
      http.get(`https://github.com/${conf.package}/releases/latest`, (res) => {
        if (res.statusCode === 302 && 'location' in res.headers) {
          const version = path.basename(res.headers.location);
          resolve({
            version,
            tarball: `https://github.com/${conf.package}/archive/${version}.tar.gz`
          })
        } else {
          reject("can't get latest version");
        }
      }).on('error', reject);
    });
  }
  return getHttpJson(npmregistry + conf.package).then(json => {
    const version = 'dist-tags' in json && 'latest' in json['dist-tags'] ? json['dist-tags']['latest'] : null;
    const dist = version && 'versions' in json && version in json.versions ? json.versions[version].dist : null;
    if (dist && dist.tarball) {
      return {
        version,
        tarball:dist.tarball
      }
    }
    throw "can't get latest version";
  })
}

// 下载 Package 文件
function downloadPackage(tarball, package, version, conf) {
  const dest = path.resolve(packageRoot, package, '_update', version);
  const file = path.join(dest, path.basename(tarball));
  const temp = path.join(dest, "$TEMP$");
  fs.emptyDirSync(dest);
  return downloadFile(tarball, file).then(() => {
    return decompress(file, temp)
  }).then(() => {
    // 剪切所需文件
    const files = conf.files;
    const unzipdir = path.join(temp, conf.type === 'github' ? `${package}-${version}` : 'package');
    Object.keys(files).forEach(name => {
      fs.moveSync(path.join(unzipdir, files[name]), path.join(dest, name));
    });
    // LICENSE 文件
    fs.readdirSync(unzipdir).some(name => {
      const lower = name.toLowerCase();
      if (lower === 'license' || lower.startsWith('license.')) {
        fs.moveSync(path.join(unzipdir, name), path.join(dest, name));
        return true;
      }
    })
    fs.removeSync(file);
    fs.removeSync(temp);
  })
}

// 判断是否需要升级, 并下载最新版文件
function updatePackage(package){
  let conf, packpath = path.resolve(packageRoot, package);
  try {
    conf = require(path.resolve(packpath, 'vepanel.json'));
  } catch(e) {
    return Promise.reject('vepanel.json not exist');
  }
  if (conf.type !== 'github' && conf.type !== 'npm') {
    return Promise.resolve(true);
  }
  output.load('check package: get ' + package + ' latest version');
  return getPackageLatest(conf).then(({version, tarball}) => {
    if (conf.version === version) {
      return;
    }
    output.load('check package: download ' + package + ' latest files');
    return downloadPackage(tarball, package, version, conf).then(() => version)
  })
}

// 更新指定 package
function update(package) {
  output.load('check package: ' + package);
  return updatePackage(package).then(latest => {
    if (latest === true) {
      output.yellow(package + ': not npm/github package');
    } else if (latest) {
      output.green(package + ': update to ' + latest);
    } else {
      output.yellow(package + ': already the latest version');
    }
  }).catch(err => {
    output.red(package + ': ' + String(err));
  })
}


/** commonds.app 相关: 生成不同版本的 vepanel app js
***********************************************************************************/
// 生成发布到 npm 所需的 package.json
function makePackageJson(package, conf){
  const version = conf.version + (conf.minor ? '-' + conf.minor : '');
  const packageJson = JSON.stringify({
    name: `@vepanel/${package}`,
    version,
    description: `${package} for vepanel`,
    main: "index.js",
    license: "MIT"
  }, null, "  ");
  fs.outputFileSync(path.join(projectPath, distPath, package, 'package.json'), packageJson);
}


// 生成指定版本的 app js
function buildAppSpecial(buildType){
  const runtime = buildType === 'app';
  const scriptPath = path.join(projectPath, 'src/scripts');

  //注入编译变量
  const envConfig = {};
  envConfig["process.env.NODE_ENV"] = runtime ? 'production' : 'development';
  envConfig["process.env.BUILD_TYPE"] = JSON.stringify(buildType);

  // rollup 插件: 处理 1: 三个版本;  2: vue helper;  3: 合并 requireJs
  const inputName = 'app' + (runtime ? '' : buildType.charAt(0).toUpperCase() + buildType.slice(1));
  const mainDataResolve = {
    name: 'vue-appResolve',
    resolveId (source) {
      let resolveFile = null;
      if (source === '@buildType') {
        resolveFile = path.join(scriptPath, inputName+'.js');
      } else if (source.startsWith('@app')) {
        resolveFile = path.join(projectPath, '/src/app', source.substr(4));
      }
      return resolveFile;
    },
    generateBundle(OutputOptions, bundle) {
      let fileName, chunkInfo;
      const requireJs = fs.readFileSync(path.join(scriptPath, 'require.js'), 'utf8');
      for (fileName in bundle) {
        chunkInfo = bundle[fileName];
        if (chunkInfo.type !== 'chunk') {
          continue;
        }
        let code = chunkInfo.code;
        if (!runtime) {
          code = code.replace(/windowImport/g, 'import');
        }
        code = code.replace(/module.exports=(.*)\;$/i, function(m, f) {
            return f + '()';
        }).replace(
          /__VEPANEL_normalizeComponent__/g,
          'normalizeComponent'
        ).replace(
          /__VEPANEL_createInjector__/g, 
          'createInjector'
        );
        code = requireJs + "\n\n\n(function(global){\n" + code + "\n})(this)";
        if (commondConf.compress) {
          code = terser.minify(code).code;
        }
        chunkInfo.code = code;
      }
    }
  };

  // 输入
  const rollupWarn = batchWarnings();
  const inputOptions = {
    input: path.join(scriptPath, 'index.js'),
    onwarn: rollupWarn.add,
    plugins:[
      replace(envConfig),
      commonjs(),
      // vue scf 解析
      vue({
        css: true,
        compileTemplate: true,
        normalizer: '__VEPANEL_normalizeComponent__',
        styleInjector: '__VEPANEL_createInjector__',
        template: {
          isProduction: true,
          compilerOptions:{
            whitespace: 'condense'
          }
        }
      }),
      // es6->es5
      buble({
        objectAssign:true,
        transforms: { asyncAwait: false }
      }),
      mainDataResolve,
    ]
  };

  // 输出
  const outputOptions = {
    strict: false,
    compact: true,
    file: path.join(projectPath, distPath, 'vepanel', buildType + '.js'),
    format: 'cjs'
  };
  
  // 编译
  if(!commondConf.silent) {
    output.green(`build → ${buildType}.js`);
  }
  return rollup.rollup(inputOptions).then(bundle => {
    return bundle.write(outputOptions)
  }).then(() => {
    rollupWarn.flush(commondConf.silent);
  }).catch(handleError);
}

// 生成所有版本的 app js
function buildApp(){
  const types = ['des', 'dev', 'app'];
  const run = () => {
    const buildType = types.shift();
    return buildType ? buildAppSpecial(buildType).then(run) : Promise.resolve();
  }
  return run().then(() => {
    makePackageJson('vepanel', {
      version: packJson.version
    })
  })
}


/** commonds.package 相关: 打包 src/vepanel 包
***********************************************************************************/

// npm|github: 复制 package 到 lib 生成目录中, 以便下一步发布到 npm
function copyPackage(package, conf){
  const sourceDir = path.join(packageRoot, package);
  const destDir = path.join(projectPath, distPath, package);
  let hasReadme = false;
  fs.emptyDirSync(destDir);
  fs.readdirSync(sourceDir).forEach(name => {
    if (name === '_update' || name === 'vepanel.json') {
      return;
    }
    if (name.toLowerCase() === 'readme.md') {
      hasReadme = true;
    }
    fs.copySync(path.join(sourceDir, name), path.join(destDir, name))
  });
  if (!hasReadme) {
    const srouceFrom = conf.type === 'github' 
      ? `https://github.com/${conf.package}`
      : `https://www.npmjs.com/package/${conf.package}`
    let content = `# @vepanel/${package}` + "\n" + `source from [${conf.package}](${srouceFrom})` + "\n";
    if (conf.desc) {
      content += "\n改动\n";
      conf.desc.forEach(md => {
        content += `- ${md}`
      })
    }
    fs.outputFileSync(path.join(destDir, 'README.md'), content);
  }
  output.green(`${package}: copy success!`);
  return Promise.resolve();
}

// vue: 编译 package 到 lib 生成目录中, 以便下一步发布到 npm
let vepanelTask;
function buildPackage(package, conf){
  output.green(`\n${package}: build vue SFC`);
  const destDir = path.join(projectPath, distPath, package);
  fs.emptyDirSync(destDir);
  if (!vepanelTask) {
    vepanelTask = new Vepanel({
      compress: commondConf.compress,
      moduleDir: './node_modules'
    });
  }
  return vepanelTask.buildFile(
    path.join(packageRoot, package, 'index.js'),
    path.join(projectPath, distPath, package, 'index.js')
  ).then(() => {
    fs.copySync(path.join(projectPath, 'LICENSE'), path.join(destDir, 'LICENSE'));
    stdOutput("\n")
  })
}

// js: 压缩 package 到 lib 生成目录中, 以便下一步发布到 npm
function compressPackage(package, conf){
  const sourceDir = path.join(packageRoot, package);
  const destDir = path.join(projectPath, distPath, package);
  let hasReadme = false;
  fs.emptyDirSync(destDir);
  fs.readdirSync(sourceDir).forEach(name => {
    if (name === 'vepanel.json') {
      return;
    }
    const lower = name.toLowerCase();
    if (lower === 'readme.md') {
      hasReadme = true;
    }
    if (!commondConf.compress || !lower.endsWith('.js')) {
      // 不需要压缩 或 不是 js 文件 
      fs.copySync(path.join(sourceDir, name), path.join(destDir, name))
    } else {
      // 压缩 js
      let code = fs.readFileSync(path.join(sourceDir, name)).toString();
      code = terser.minify(code).code;
      fs.writeFileSync(path.join(destDir, name), code);
    }
  });
  if (!hasReadme && conf.desc) {
    let content = `# @vepanel/${package}` + "\n\n";
    conf.desc.forEach(md => {
      content += `- ${md}`
    })
    fs.outputFileSync(path.join(destDir, 'README.md'), content);
  }
  output.green(`${package}: compress success!`);
  return Promise.resolve();
}

// 根据 vepanel 设置自动选择处理方式
function resolvePackage(package){
  let conf;
  try {
    conf = require(path.join(packageRoot, package, 'vepanel.json'));
  } catch(e) {
    output.red(`${package}: can't find vepanel.json`)
    return;
  }
  let proms;
  if (conf.type === 'vue') {
    proms = buildPackage(package, conf);
  } else if (conf.type === 'js') {
    proms = compressPackage(package, conf);
  } else {
    proms = copyPackage(package, conf);
  }
  return proms.then(() => {
    makePackageJson(package, conf)
  })
}


/** 工具函数
***********************************************************************************/
// 读取文件夹列表, 并逐个执行
function loopPackage(root, cb){
  const lists = fs.readdirSync(root);
  const run = () => {
    const name = lists.shift();
    if (!name) {
      return Promise.resolve();
    }
    return cb(
      name, 
      fs.lstatSync(path.join(root, name)).isDirectory() 
    ).then(run)
  }
  return run();
}

/**
 * 支持命令
 * update:   更新 vepanel 三方组件库, 后续仍要手动检测
 * package:  将 vepanel 生成为可以发布到 npm 的包
 */
const support = {
  app(){
    return buildApp();
  },
  update(){
    return loopPackage(packageRoot, (package, dir) => {
      return dir ? update(package) : Promise.resolve();
    })
  },
  package(){
    return loopPackage(packageRoot, (package, dir) => {
      return dir ? resolvePackage(package) : Promise.resolve();
    })
  },
};

const command = minimist(process.argv.slice(2));
const next = command._[0];
support[next]();