const path = require("path");
const fs = require("fs-extra");
const terser = require("terser");
const rollup = require("rollup");
const postcss = require("postcss");
const vue = require("rollup-plugin-vue");
const buble = require("@rollup/plugin-buble");
const replace = require("@rollup/plugin-replace");
const commonjs = require("@rollup/plugin-commonjs");
const utils = require('./utils');
const {
  turbocolor, 
  handleError, 
  batchWarnings, 
  stdout,
  stderr,
  file_exist,
  file_md5
} = utils;

// 默认编译配置
const buildConf = {
  compress: true,  //是否压缩
  quiet: false,   //静默编译
  assetsDir: 'assets',  //静态资源保存目录
  moduleDir: './../node_modules',  //node_modules 相对于源文件所在 根目录 的路径
};

// 静态资源类型正则
const filterAsset = /^\.(svg|png|jpg|jpeg|gif|mp3|mp4)$/;

// 提取异步组件正则
const asyncRequireRegex = /requireComponent\(\s*['"]([^"')]+)['"](.*)\)/g;

// style 中提取静态资源的正则
const ASSET_URL_PATTERNS = [
  /(url\(\s*['"]?)([^"')]+)(["']?\s*\))/g,
  /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g
];

// 通用 JS 路径及变量名 (与 app.js 中的变量名对应的, 不要修改)
const globalVar = {
  vepanel: 'vepanel',
  normalizer: 'n',
  styleInjector: 'c',
};

// require 全局模块
const external = [
  'module', 
  '_VeUtils_'
];

// 导出格式
const output = {
  compact: true,
  format: 'amd',
  paths: {
    _VeUtils_: globalVar.vepanel,
  }
};

/**
 * 处理 .vue 文件, 移除 <script mock> 区块
 * 因为也是使用 script 标签, 在 rollup-vue 插件处理前移除该区块, 防止 vue 插件当做 sfc 的 js
 */
const filterMock = {
  transform(code, id) {
    if (!id.endsWith('.vue')) {
      return null;
    }
    return code.replace(/<script\s+mock([^>]+)?>([\s\S]*?)<\/script>/gi, '');
  },
};

/**
 * 
 * 编译 SFC 文件 或 整个文件夹下的 SFC
 * 
 */
class Vepanel {
  constructor(conf){
    this.conf = {
      ...buildConf,
      ...conf
    }
  }

  // 格式化 template / scirpt / style 中的静态资源 path, 并缓存结果
  _getAssetFinalPath(source, importer, inStyle) {
    if (!importer) {
      return null;
    }
    // importer 含有 "?rollup-plugin-vue=" 是处理 script 区块中的 import
    // blockType:
    // 0: .VUE 文件 template 中的
    // 1: .VUE 文件 script 中的 或 .js 文件
    // 2: style 中的
    const blockType = inStyle ? 2 : (
        path.extname(importer) === '.vue' && importer.indexOf('?rollup-plugin-vue=') < 0 ? 0 : 1
    );
  
    // script 区块检测后缀, template/style 不检测
    const fileExt = path.extname(source);
    if (blockType === 1 && (fileExt === "" || !filterAsset.test(fileExt)) ) {
      return null;
    }
  
    // 获取所引用的静态资源 绝对路径
    const filePath = this._getAssetFilePath(source, importer, blockType);
    if (!filePath) {
      return null;
    }
  
    // 静态资源的 相对路径
    const fileName = path.basename(source, fileExt) + '.' + file_md5(filePath) + fileExt;
    const url = (this.buildAssetUrl === '' ? '' :  this.buildAssetUrl + '/') + this.conf.assetsDir + '/' + fileName;
    this.assetsFileCache[fileName] = filePath;
    if (inStyle) {
      return url;
    }
    const urlId = '#_ASSET_' + (++this.assetId);
    this.assetsIdCache[urlId] = url;
    return urlId;
  }

  // 计算 source 的绝对路径
  _getAssetFilePath(source, importer, blockType) {
    const firstChar = source[0];
    if (firstChar === '@') {
      return path.join(this.buildInputPath, source.substr(1));
    }
    if (firstChar === '.') {
      return path.resolve(path.dirname(importer), source);
    }
    if (firstChar === '~') {
      return this._getModuleAsset(source.substr(1));
    }
    /**
      script 区块出现 dir/foo.png 格式导入, 这有可能是 require 远程文件的, 不予处理
      但对于 style 或 template 中出现这种格式, 则理解为引用 node_moudules 中的文件    
    */
    if (blockType !== 1) {
      return this._getModuleAsset(source);
    }
    return null;
  }

  // 获取 node_modules 文件夹下的静态资源
  _getModuleAsset(source){
    if (this.conf.moduleDir.startsWith('.')) {
      return path.join(this.buildInputPath, this.conf.moduleDir, source);
    }
    return path.join(this.conf.moduleDir, source);
  }

  /** 
   * 处理 .vue 文件中 style 标签内静态资源的 postcss 插件(复制静态资源并添加前缀)
   * @see https://github.com/postcss/postcss-url
   */
  _assetResolve(){
    const self = this;
    return postcss.plugin('asset', () => {
      return function(styles, result) {
        const {from, to} = result.opts;
        const importer = to ? to : (from ? from : null);
        styles.walkDecls((node) => {
          const pattern = ASSET_URL_PATTERNS.find((pattern) => pattern.test(node.value));
          if (!pattern) {
            return;
          }
          node.value = node.value.replace(pattern, (matched, before, url, after) => {
            const fileName = self._getAssetFinalPath(url, importer, true);
            const finalUrl = fileName ?  '__VEPANEL_assetPrefix__' + fileName : url;
            return before + finalUrl + after;
          });
        });
      }
    });
  }

  /**
   * 处理 .vue 文件
   * 1. 通过 _VeUtils_ 引入 vue unit helper
   * 2. 处理 script 模块中的 静态资源引入
   * 3. 处理 template 中静态资源(复制资源)
   * 最终搞定
   *   require(['vepanel', 'module'])  ->  导入了 vue 的 normalizer/styleInjector
   *                                   ->  获取当前 js 的网络 url，以便获取静态资源的绝对路径 
   * script/template 中静态资源转为相对路径
   */
  _createVueResolve(){
    const self = this;
    return {
      name: 'vue-resolve',

     /**
      * 所有 import 首先经过该 hook, 可对引入内容进行修改, 也可返回 null, 即不做任何处理
      * @see https://rollupjs.org/guide/en/#resolveid
      * 
      * .vue SFC 文件, template 中 src="" 的 TAG, vue 编译插件会自动提取并以 import 方式处理, 
      * 所以也会触发 rollup 的该 hook, 但对 src 有要求, 必须是  "./"  "~/"  "@/" 开头, 否则不做处理
      * script 区块也可能 import 静态资源, 但本身就会当做 js 处理, 任何 import 都会触发该 hook, 当然也包括静态资源
      * @see https://rollup-plugin-vue.vuejs.org/options.html#template-transformasseturls
      */
      resolveId (source, importer) {
        if (source === '_currentUrlPrefix_') {
          return source;
        }
        return self._getAssetFinalPath(source, importer, false);
      },

     /**
      * 由 resolveId 处理完毕后, 这里收到结果
      * id 为 import from './img.png' 中的导入路径, 可能被 resolveId 修改, 也可能为原样
      * 可在这里返回 代码块, 也可返回 null, rollup 就会自动获取 id 路径的文件内容
      * @see https://rollupjs.org/guide/en/#load
      */
      load(id) {
        // 静态资源前缀由 requireJs module.uri 自动计算
        if (id === '_currentUrlPrefix_') {
          return `import {uri} from 'module';
            let currentUrl = uri.split('?')[0].split('/');
            let currentName = currentUrl.pop();
            currentUrl = currentUrl.join('/') + (currentName.endsWith('.js') ? '' : '/'+currentName) + '/';
            export default currentUrl;`
        }
        if (id in self.assetsIdCache) {
          return `export default __VEPANEL_staticPrefix__ + "${self.assetsIdCache[id]}";`;
        }
        return null;
      },

      /**
       * 由 load 处理完毕, 已经由 load hook 返回代码, 或从文件读取到代码后
       * 对 .vue 结尾的文件, 引入 vue helper 函数
       * 并使用 _currentUrlPrefix_ 强制引入 requireJs module 模块, 用于获取静态资源 url 前缀
       * @see https://rollupjs.org/guide/en/#transform
       */
      transform(code, id) {
        if (id.endsWith('.vue')) {
          code = `import {${globalVar.normalizer}, ${globalVar.styleInjector}} from '_VeUtils_';
          import __VEPANEL_currentPath__ from '_currentUrlPrefix_';
          __VEPANEL_none_exist_method__(__VEPANEL_currentPath__);
          ` + code;
        }
        return code;
      },

     /**
      * 编译后, 拷贝静态资源，并替换 css 和 template 中的资源 url 前缀
      * @see https://rollupjs.org/guide/en/#generatebundle
      */
      generateBundle(OutputOptions, bundle) {
        try {
          Object.keys(self.assetsFileCache).map((fileName) => {
            fs.copySync(
              self.assetsFileCache[fileName], 
              path.join(self.buildOutputPath, self.conf.assetsDir, fileName) 
            )
          })
        } catch (error) {
          throw new Error(`Error while copying files: ${error}`)
        }
    
        let fileName, chunkInfo;
        for (fileName in bundle) {
          chunkInfo = bundle[fileName];
          if (chunkInfo.type !== 'chunk') {
            continue;
          }
          chunkInfo.code = chunkInfo.code
            .replace(/__VEPANEL_none_exist_method__\(__VEPANEL_currentPath__\);/g, '')
            .replace(/__VEPANEL_staticPrefix__/g, '__VEPANEL_currentPath__')
            .replace(/__VEPANEL_assetPrefix__/g, '"+ __VEPANEL_currentPath__ +"');
          chunkInfo.code = self._collectAsnycFiles(chunkInfo);
          if (self.conf.compress) {
            chunkInfo.code = terser.minify(chunkInfo.code).code;
          }
        }
      },
    }
  }

  // 提取异步组件
  _collectAsnycFiles(chunkInfo) {
    const self = this;
    const dirPath = path.dirname(chunkInfo.facadeModuleId);
    return chunkInfo.code.replace(asyncRequireRegex, function(matched, name, end) {
      let prefix = '';
      if (name.startsWith('.')) {
        name = self._addAsnycFiles(dirPath, name);
        prefix = '__VEPANEL_currentPath__ + ';
      }
      return 'requireComponent('+prefix+'"'+name+'"'+end+')';
    });
  }

  // 确认异步组件
  _addAsnycFiles(dirPath, name){
    const file = path.join(dirPath, name);
    if (file_exist(file)) {
      this.buildRequired.push(file);
      return name.endsWith('.vue') ? name.substr(0, name.length - 3) + 'js' : name;
    }
    if (file_exist(file + '.vue')) {
      this.buildRequired.push(file + '.vue')
    } else if (file_exist(file + '.js')) {
      this.buildRequired.push(file + '.js')
    }
    return name + '.js';
  }

  // rollup 编译插件
  _createPlugins(){
    const self = this;
    if (self.plugins) {
      return self.plugins;
    }
    const cssAssetResolve = this._assetResolve();
    return self.plugins = [
      filterMock,
    
      // 设置为生产环境
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    
      // vue scf 解析
      vue({
        css: true,
        compileTemplate: true,
        normalizer: globalVar.normalizer,
        styleInjector: globalVar.styleInjector,
        template: {
          isProduction: true,
          compilerOptions:{
            whitespace: 'condense'
          }
        },
        style: {
          postcssPlugins:[
            cssAssetResolve()
          ]
        }
      }),
    
      // vue help 函数, 静态资源 处理
      this._createVueResolve(),
      
      // import * from './index' 这样子形式自动查找后缀
      commonjs({
        extensions: [ '.js', '.vue']
      }),
    
      // es6->es5
      buble({
        objectAssign:true
      }),
    ];
  }

  // 逐个编译 异步依赖
  _buildAsync(files){
    const file = files.shift();
    if (!file) {
      return;
    }
    const relative = path.parse(path.relative(this.buildInputPath, file));
    const output = path.join(this.buildOutputPath, relative.dir, relative.name + '.js');
    return this._buildSFC(file, output).then(() => {
      return this._buildAsync(files);
    })
  }

  // 编译一个 sfc (入口 SFC 或 异步依赖)
  _buildSFC(inputFile, outputFile, boot){
    this.assetId = 0;
    this.assetsIdCache = {};
    this.assetsFileCache = {};
    this.buildRequired = [];
    this.buildAssetUrl = path.relative(
      path.dirname(inputFile), 
      this.buildInputPath
    ).split(path.sep).join('/');

    const inputOptions = {
      external,
      input:inputFile,
      onwarn: this.rollupWarn.add,
      plugins: this._createPlugins(),
    };
    const outputOptions = {
      ...output,
      file:outputFile,
    };
    if(!this.conf.quiet) {
      stdout(turbocolor.cyan.bold(`${boot ? 'build' : 'async'} → ${path.relative(this.buildOutputPath, outputFile)}`));
    }
    return rollup.rollup(inputOptions).then(bundle => {
      return bundle.write(outputOptions)
    }).then(() => {
      this.rollupWarn.flush(this.conf.quiet);
      const asyncFiles = this.buildRequired.slice();
      if (!asyncFiles.length) {
        return;
      }
      return this._buildAsync(asyncFiles);
    }).catch(handleError);
  }

  // 编译指定文件, 会自动编译其异步依赖
  buildFile(inputFile, outputFile){
    this.rollupWarn = batchWarnings();
    this.buildInputPath = path.dirname(inputFile);
    this.buildOutputPath = path.dirname(outputFile);
    return this._buildSFC(inputFile, outputFile, true);
  }

  // 编译整个文件夹下的 SFC
  buildDir(inputDir, outputDir){
    fs.emptyDirSync(outputDir);
    const self = this;
    const lists = fs.readdirSync(inputDir);
    const build = () => {
      const name = lists.shift();
      if (!name) {
        return Promise.resolve();
      }
      let continues = false;
      // 非SFC/文件夹/首字母大写  跳过
      if (!name.endsWith('.vue') || fs.lstatSync(path.join(inputDir, name)).isDirectory() ) {
        continues = true;
      } else {
        const firstChar = name[0];
        continues = firstChar.toLowerCase() !== firstChar;
      }
      if (continues) {
        return build();
      }
      stdout("\n");
      return self.buildFile(
        path.join(inputDir, name),
        path.join(outputDir, name.substr(0, name.length - 3) + 'js')
      ).then(build);
    };
    return build();
  }

  // 自动选择 编译文件 或 编译文件夹
  build(inputFile, outputFile) {
    const isFile = fs.lstatSync(inputFile).isFile();
    return isFile 
      ? this.buildFile(inputFile, outputFile)
      : this.buildDir(inputFile, outputFile)
  }
}

/**
 * 
 * 提取 SFC 或 JS 中的静态 mock 数据
 * 
 */
const mockRegex = /<script\s+mock([^>]+)?>([\s\S]*?)<\/script>/gmi;

function saveMockApi(code, file, outputPath, quiet) {
  if (!quiet) {
    stdout(turbocolor.green.bold(file))
  }
  code = code.replace(/export\s+default\s+\{/, 'module.exports = {');
  try {
    const Module = module.constructor;
    const m = new Module();
    m._compile(code, file);
    const apis = m.exports;
    let count = 0;
    Object.keys(apis).forEach(key => {
      if (key === '#' || !key.startsWith('#')) {
        return;
      }
      const name = key.substr(1);
      if (!quiet) {
        stdout(turbocolor.yellow.bold(name))
      }
      fs.outputJsonSync(path.join(outputPath, name), apis[key]);
      count++;
    })
    if (!quiet) {
      if (!count) {
        stdout('no mock block')
      }
      stdout("\n")
    }
  } catch(e) {
    if (!quiet) {
      stderr(turbocolor.red.bold(e))
    }
  }
}

function buildMockFromFile(file, outputPath, quiet){
  try {
    let code = fs.readFileSync(file, "utf-8");
    if (code.endsWith('.vue')) {
      let match;
      while ((match = mockRegex.exec(code)) !== null) {
        saveMockApi(match[2], file, outputPath, quiet);
      }
    } else {
      saveMockApi(code, file, outputPath, quiet);
    }
  } catch(e) {
    if (!quiet) {
      stderr(turbocolor.red.bold(e))
    }
  }
}

function buildMockFromDir(inputPath, outputPath, quiet){
  fs.readdirSync(inputPath).forEach(name => {
    const file = path.join(inputPath, name);
    if ( fs.lstatSync(file).isDirectory() ) {
      buildMock(file, outputPath);
    } else if (name.endsWith('.vue')) {
      let code = fs.readFileSync(file, "utf-8"), match;
      while ((match = mockRegex.exec(code)) !== null) {
        saveMockApi(match[2], file, outputPath, quiet);
      }
    }
  });
}

function buildMock(inputPath, outputPath, quiet){
  const isFile = fs.lstatSync(inputPath).isFile();
    return isFile 
      ? buildMockFromFile(inputPath, outputPath, quiet)
      : buildMockFromDir(inputPath, outputPath, quiet)
}

Vepanel.utils = utils;
Vepanel.buildMock = buildMock;
Vepanel.build = (inputFile, outputFile, conf) => {
  const task = new Vepanel(conf);
  return task.build(inputFile, outputFile);
}

module.exports = Vepanel;