# vepanel

[GitHub Pages](https://graynut.github.io/vepanel-dev/)

# TODO

换肤:
将 elm ui 颜色相关提取为 var / 提取 index/login 公用 css 为独立文件

兼容:
修改 elm ui 组件，特别是 form 相关组件，使其兼容手机版

# TODO 细节

使用调试过程中碰到的问题，随时记录

- `el-input-number` 应支持 `clearable`，并支持清空后显示 `placeholder`（如：不限制）

- `el-cascader` 动态修改 options 会 js 报错 `Cannot read property 'level' of null`

- 为兼容各种可能的主题皮肤，页面组件内的绝对定位 `absolute` `relative` 等应符合以下规则（目前 elm ui 不符合要求，需改动）
  1. 页面内定位，此类元素不应出现在 header/aside 上方， z-index 需小于 1000，分为以下两种情况
     - 页面内为布局而创建的元素，如 `el-select` 下拉框，z-index 小于 500
     - 需覆盖页面内所有可能的元素，如 [loading](https://element.eleme.io/#/zh-CN/component/loading)，其 z-index 需大于 500 且小于 1000
  3. 对于弹出层，如 `el-dialog`，`el-drawer` 等自带全屏蒙版，需要在整个中台最上方，则 z-index 需大于 1001

- 可考虑所有组件的 `font-size` 使用 `em` 为单位，目前支持 `size` 属性的组件也以 `em` 为单位；这样的好处是，整个中台可统一设置缩放，但要修改的东西太多，优先级最低。