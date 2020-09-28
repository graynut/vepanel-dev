<template>
<div class="app-full">
    <div class="curd-maker-design" v-show="!previewShow">
        <div class="curd-maker-left curd-maker-layout">
            <div class="curd-maker-title">
                <h3>表单组件</h3>
            </div>
            <div class="curd-maker-scroll app-thin-scroll">
                <!--可用组件库-->
                <draggable
                    class="curd-maker-blocks"
                    :list="blockList"
                    :sort="false"
                    :animation="0"
                    :group="{name:dragGroup, pull:'clone', put:false}"
                    :clone="_cloneBlock"
                    :setData="_dragSetData"
                    @end="_dragBlockEnd"
                >
                    <div v-for="(block,index) in blockList" :key="'fb'+index" class="curd-maker-item">{{block.label}}</div>
                </draggable>
            </div>
        </div>

        <div class="curd-maker-center curd-maker-layout">
            <div class="curd-maker-title">
                <div class="curd-maker-title-item">
                    <el-switch class="curd-maker-mmodel" v-model="mModel" :width="60" active-text="宽版" inactive-text="窄版"/>
                    <div class="curd-maker-trash">
                        <draggable class="curd-maker-trash-drag" :group="{put:[fieldGroup]}" :setData="_dragSetData">
                            <div class="curd-maker-trash-icon el-icon-delete-solid"></div>
                        </draggable>
                    </div>
                </div>
                <slot name="tools">
                    <span>
                        <el-button type="text" @click="clear">清空</el-button>
                        <el-button type="text" @click="preview">预览</el-button>
                        <el-button type="text" @click="built">导出</el-button>
                    </span>
                </slot>
            </div>
            <div :class="'curd-maker-device' + (mModel ? ' curd-maker-narrow' : '')">
                <div class="curd-maker-screen app-thin-scroll">
                    <!--表单预览-->
                    <curd-form 
                        v-bind="formProps"
                        :validate-on-rule-change="false"
                        :designMode="true"
                        :no-footer="true"
                        :forceSpan="mModel?'xs':'sm'"
                        :dragGroup="dragGroup"
                        :fieldGroup="fieldGroup"
                        :onFieldUpdate="_onFieldUpdate"
                        :onFieldClick="_onFieldClick"
                        :onFieldDragEnd="_onFieldDragEnd"
                        ref="design"
                    />
                    <div class="curd-maker-wait" v-if="!formProps.fields.length">将左侧组件拖拽到这里</div>
                </div>
            </div>
        </div>

        <el-tabs class="curd-maker-right curd-maker-layout" v-model="propsTab">
            <el-tab-pane label="组件属性" name="field" class="curd-maker-scroll app-thin-scroll">
                <template v-if="fieldIndex>=0 && formProps.fields.length>fieldIndex">
                    <!--字段通用属性-->
                    <curd-form
                        class="curd-maker-sform"
                        size="small"
                        m-label-position="left"
                        :no-footer="true"
                        :fields="basicConfig"
                        :data="formProps.fields[fieldIndex]"
                        :label-width="76"
                        :on-field-change="_onFieldVshowChange"
                    >
                        <template #footer>
                            <el-col>
                                <el-form-item label="默认值">
                                    <el-input :value="formProps.data[formProps.fields[fieldIndex].name]|fieldValue" readonly>
                                        <i slot="suffix" class="el-input__icon el-icon-circle-close" style="cursor:pointer" @click="_clearFieldValue(fieldIndex)"></i>
                                    </el-input>
                                </el-form-item>
                            </el-col>
                        </template>
                    </curd-form>
                    <el-divider content-position="center">{{formProps.fields[fieldIndex].componentName}}属性</el-divider>
                    <!--字段属性-->
                    <curd-form 
                        class="curd-maker-sform"
                        size="small"
                        m-label-position="left"
                        :no-footer="true"
                        :fields="fieldConfig"
                        :data="formProps.fields[fieldIndex].props"
                        :label-width="76"
                        :on-field-change="_onFieldPropsChange"
                    />
                </template>
            </el-tab-pane>
            <el-tab-pane label="表单属性" name="form" class="curd-maker-scroll app-thin-scroll">
                <!--自举:使用 curd-form 设置自定义 curd-form 基本属性-->
                <curd-form 
                    class="curd-maker-sform"
                    size="small"
                    m-label-position="left"
                    :no-footer="true"
                    :fields="formConfig"
                    :data="formProps"
                    :label-width="76"
                />
            </el-tab-pane>
        </el-tabs>
    </div>
    
    <div class="curd-maker-preview" v-if="previewShow">
        <i class="el-icon-error curd-maker-preview-close" @click="_closePreview"/>
        <i class="el-icon-document curd-maker-preview-close curd-maker-preview-source" @click="_togglePreview"/>
        <div class="app-form">
            <div class="curd-maker-preview-code" v-if="previewSource">
                <span @click="_toggleMinCode">{{previewMinCode ? 'Format' : 'MinCode'}}</span>
                <pre>{{previewSource}}</pre>
            </div>
            <curd-form v-bind="previewForm" @submit="_onPreviewSubmit" v-else/>
        </div>
    </div>
</div>
</template>

<script>
// vShow 计算
import curdUtils from 'curd-utils';
const {curdComparedSupport, curdVshow} = curdUtils;

// 依赖子组件
import curd from 'curd';
import draggable from 'vuedraggable';
const components = {
    curdForm: curd.curdForm,
    draggable,
};

// 设置 curdForm 属性的表单也是 curdForm 生成的,
// curdForm 自身支持 element 和一些 curd-* 组件
// 若设置 curdForm 的表单中需要用到一些特殊的表单组件, 但又不在 curdForm 自身支持范围内
// 可通过该设置引入
import curdOptionsSet from './curdOptionsSet';
const componentsForMaker = {
    'curd-options-set': curdOptionsSet
};

/* 可用表单字段  以后增加字段只需拓展这部分即可
与 curdForm 的使用配置一致
{
    label: '组件名',
    component: 'vue组件注册名',
    value: "默认值",

    //支持的 props, 专用属性设置表单
    props: {
        prop : {
            // 拖拽新组件, demoValue 优先, 已有组件仅使用 value
            // 最终设定值与 value 相同, 生成 form 时会忽略当前 props 设定
            value: '默认值',  
            demoValue:"演示值"

            label, compoent, props  配置字段表单props 的表单

            // 以下属性不易理解, 可参考 input 和 timeSelect
            hidden:true,  是否显示在属性设置的表单中(不显示则不用设置 label, compoent, props)
                          比如某个配置不易通过一个组件完成设置, 可通过多个组件配合设置, 
                          设置一个隐藏属性利用回调生成实际的 组件属性
            ignore:true,  最终生成表单时是否忽略该属性, 该属性仅为了显示到配置表单, 
                          并不是 component 支持的属性

            // prpos:属性集合Object, v:当前监听属性的值, filed:字段配置集合, maker:curdMaker对象
            onInit(props, v, field, maker){}  载入时的回调
            onChange(props, v, field, maker){}  配置值发生变化时的回调
            onNameChange(props, v, field, maker){} 正在设计的表单某个字段修改了 字段名

            // field: 当前字段配置集合(不全,按顺序处理,仅处理了监听属性之前的属性), 
            // data: 正在设计表单的默认值集合, formField:字段的所有配置集合, maker:curdMaker对象
            onMake(field, data, formField, maker){}  生成表单时的回调
        }
    }  
}
==========================================================================*/
import Field_Input from './fields/input.js';
import Field_Autocomplete from './fields/autocomplete.js';
import Field_InputNumber from './fields/inputNumber.js';
import Field_Radio from './fields/radio.js';
import Field_Checkbox from './fields/checkbox.js';
import Field_Select from './fields/select.js';
import Field_Cascader from './fields/cascader.js';
import Field_Choose from './fields/choose.js';
import Field_Slider from './fields/slider.js';
import Field_Switch from './fields/switch.js';
import Field_Rate from './fields/rate.js';
import Field_ColorPicker from './fields/colorPicker.js';
import Field_DatePicker from './fields/datePicker.js';
import Field_TimePicker from './fields/timePicker.js';
import Field_TimeSelect from './fields/timeSelect.js';
import Field_KindEditor from './fields/kindeditor.js';
import Field_Treeset from './fields/treeset.js';

// 可用字段列表
const defBlocks = [
    Field_Input,
    Field_Autocomplete,
    Field_InputNumber,
    Field_Radio,
    Field_Checkbox,
    Field_Select,
    Field_Cascader.cascader,
    Field_Cascader.panel,
    Field_Choose,
    Field_Slider,
    Field_Switch,
    Field_Rate,
    Field_ColorPicker,
    Field_DatePicker,
    Field_TimePicker,
    Field_TimeSelect,
    Field_KindEditor,
    Field_Treeset,
];

// 配置可用字段的属性, 有些是配置 curdForm 所支持的属性
// 还有些是为了响应 curdMaker 的回调, 不应该出现在最后生成的表单中
// 以下属性就是这样的, 这里提取出来以便于在生成表单时跳过
const propsForMaker = [
    'value', 'demoValue', 'ignore', 'onInit', 'onNameChange', 'onMake'
];

// 字段通用属性设置
const basicConfigName = [
    {
        name:'_name',
        label:'字段名',
        component:'el-input',
        onChange:true,
    }
];
const basicConfigDisName = [
    {
        name:'_name',
        label:'字段名',
        component:'el-input',
        props:{
            disabled:true
        }
    }
];
const basicConfigForm = [
    {
        name:'label',
        label:'标签文本',
        component:'el-input'
    },
    {
        name:'labelWidth',
        label:'标签宽度',
        span:15,
        styleWidth:'90%',
        component:'el-input',
        help:"需要包含单位，如 100px 或 10%\n不设置则继承表单属性",
    },
    {
        name:'labelDisable',
        label:null,
        span:9,
        component:'el-switch',
        props:{
            activeText:"隐藏标签",
        }
    },
    {
        name:'span',
        label:'默认栅格',
        component:'el-slider',
        props:{
            min:1,
            max:24,
            marks:{12:""}
        }
    },
    {
        name:'xspan',
        label:'窄版栅格',
        help:"屏幕宽度小于 768px 时的栅格数",
        component:'el-slider',
        props:{
            min:1,
            max:24,
            marks:{12:""}
        }
    },
    {
        name:'styleWidth',
        label:'组件宽度',
        span:15,
        styleWidth:'90%',
        component:'el-input',
        help:"需要包含单位，如 100px 或 10%\n不设置则使用组件默认宽度",
    },
    {
        name:'required',
        label:null,
        span:9,
        component:'el-switch',
        props:{
            activeText:"必填字段",
        }
    },
    {
        name:'reqmsg',
        label:'必填提示',
        component:'el-input',
        props:{
            placeholder:'可留空'
        },
        vshow:['required', 'true'],
    },
    {
        name:'help',
        label:'帮助信息',
        component:'el-input',
        props:{
            type:"textarea"
        }
    },
    {
        name:'vshow_left',
        label:'显示条件',
        help:"当前字段可按条件显示, 由其他字段的值决定\n字段名(如:type), 判断条件(如:==),  值(如:3)",
        span:12,
        component:'el-input',
        onChange:true,
    },
    {
        name:'vshow_center',
        label:null,
        span:6,
        component:'el-select',
        styleWidth: '100%',
        props:{
            placeholder:'...',
            options:curdComparedSupport()
        },
        onChange:true,
    },
    {
        name:'vshow_right',
        label:null,
        span:6,
        component:'el-input',
        onChange:true,
    },
    {
        value:[],
        name:'regexes',
        label:"正则校验",
        component:curdOptionsSet,
        props:{
            needLable:true,
            ignorNumber:true,
            leftTitle:"正则表达式",
            rightTitle:"错误提示",
            showRegex:true,
        },
    },
];
const basicConfigOld = basicConfigDisName.concat(basicConfigForm);
const basicConfigNew = basicConfigName.concat(basicConfigForm);

// 字段通用属性默认值
const commonFieldProps = {
    labelWidth:'',
    labelDisable:false,
    span:24,
    xspan:24,
    help:'',
    required:false,
    reqmsg:null,
    styleWidth:'',
    vshow_left:'',
    vshow_center:'',
    vshow_right:'',
    name:'',
    label:'',
    component:''
};
const straightCommonField = [
    'labelWidth', 'labelDisable', 'help', 'required', 'reqmsg', 'styleWidth'
];

// 表单整体属性设置
const formConfigForm = [
    {
        name:'size',
        value: 'medium',
        label:'表单尺寸',
        component:'el-radio-group',
        props:{
            button:true,
            options:[
                {
                    label:"中等",
                    value:'medium'
                },
                {
                    label:"较小",
                    value:'small'
                },
                {
                    label:"迷你",
                    value:'mini'
                },
            ]
        },
    },
    {
        name:'labelPosition',
        value: 'left',
        label:'标签位置',
        component:'el-radio-group',
        props:{
            button:true,
            options:[
                {
                    label:"左对齐",
                    value:'left'
                },
                {
                    label:"右对齐",
                    value:'right'
                },
                {
                    label:"顶部对齐",
                    value:'top'
                },
            ]
        },
    },
    {
        name:'mLabelPosition',
        value: 'top',
        label:'窄版标签',
        help:"屏幕宽度小于 768px 时的标签位置",
        component:'el-radio-group',
        props:{
            button:true,
            options:[
                {
                    label:"左对齐",
                    value:'left'
                },
                {
                    label:"右对齐",
                    value:'right'
                },
                {
                    label:"顶部对齐",
                    value:'top'
                },
            ]
        },
    },
    {
        name:'labelWidth',
        value: 90,
        label:'标签宽度',
        component:'el-input-number',
        props:{
            min:0
        }
    },
    {
        name:'gutter',
        value: 0,
        label:'栅格间隔',
        component:'el-input-number',
        props:{
            min:0
        }
    },
    {
        name:'hideRequiredAsterisk',
        value: false,
        label:'必填字段',
        component:'el-switch',
        props:{
            activeText:"隐藏红色星号",
        }
    },
    {
        name:'inlineMessage',
        value: false,
        label:'校验信息',
        component:'el-switch',
        props:{
            activeText:"行内形式展示",
        }
    },
    {
        name:'submitText',
        label:'提交按钮',
        component:'el-input'
    },
    {
        name:'resetText',
        label:'重置按钮',
        component:'el-input'
    },
    {
        name:'disabled',
        value: false,
        label:'禁用表单',
        component:'el-switch',
    },
];

export default {
    name:'CurdMaker',
    components,
    data(){
        return {
            dragGroup:'dragGroup',
            fieldGroup:"fieldGroup",
            mModel:false,

            propsTab:'field',
            fieldIndex:-1,
            formProps:{},

            previewShow:false,
            previewForm:{},
            previewSource:false,
            previewMinCode:false,
        }
    },
    props:{
        // 开启该模式, 将禁止修改已有的字段名
        editModel:Boolean,

        // 自定义可用组件
        blocks:{
            type:Array,
            default(){
                return []
            },
        },

        // 已创建的 form 配置
        form:{
            type:Object,
            default: {},
        },
    },
    computed:{
        // 可用组件: 自带组件 + 自定义组件
        blockList(){
            this._blockObject = null;
            this._blockNameListner = null;
            return defBlocks.concat(this.blocks);
        },
        // 设置表单整体属性的 表单 (其 data 为 formProps)
        formConfig(){
            return formConfigForm;
        },
        // 设置表单当前选中字段基本属性的 表单 (其 data 为 formProps.fields[fieldIndex])
        basicConfig(){
            if (this.editModel) {
                const field = this.formProps.fields[this.fieldIndex];
                if (field && field.oldField) {
                    return basicConfigOld;
                }
            }
            return basicConfigNew;
        },
        // 设置表单当前选中字段专属属性的 表单 (其 data 为 formProps.fields[fieldIndex].props)
        fieldConfig(){
            if (this.fieldIndex < 0) {
                return [];
            }
            const formConfig = [];
            const component = this.formProps.fields[this.fieldIndex]._component;
            const blockObj = this._getBlocksObject();
            if (!(component in blockObj)) {
                return formConfig;
            }
            const blockProps = blockObj[component].props;
            let block, k, m, formItem;
            for (k in blockProps) {
                block = blockProps[k];
                if (block.hidden) {
                    continue;
                }
                formItem = {
                    name:k
                };
                for (m in block) {
                    if (propsForMaker.includes(m)) {
                        continue;
                    }
                    if (m === 'component' && block[m] in componentsForMaker) {
                        formItem[m] = componentsForMaker[block[m]];
                    } else {
                        formItem[m] = block[m];
                    }
                }
                formConfig.push(formItem)
            }
            return formConfig;
        }
    },
    watch:{
        // 监听 curdMaker 的 props.form 变化, 任何变化都会完全重置 正在设计的表单
        form:{
            immediate:true,
            deep:true,
            handler(form){
                // deep clone 给定的 form
                const formNative = JSON.parse(JSON.stringify(form));
                const dataNative = formNative.data||{};
            
                // 表单基本属性
                const formProps = {};
                formConfigForm.forEach(item => {
                    formProps[item.name] = item.name in formNative ? formNative[item.name] : item.value;
                })

                // 字段属性, 根据 blockList 进行格式化, 补全不同字段类型的所需信息
                const names = {};
                const fields = [];
                const data = {};
                const onInitEvents = [];
                const blockObj = this._getBlocksObject();
                (formNative.fields||[]).forEach((field, index) => {
                    if (!field.name || !field.component){
                        return;
                    }
                    // 实际 name 转为 _name 缓存, 而 name 设为 "filed"+index
                    // 这样修改字段名时,  自动同步到 _name, 不会影响 正在设计的表单 与 默认值设置 的交互
                    const name = field.name;
                    const rname = 'field' + index;
                    names[name] = rname;

                    // 字段通用属性
                    const basic = this._copyObject(commonFieldProps, field);
                    basic._name = name;
                    basic.name = rname;
                    basic._component = basic.component;
                    basic.componentName = '组件';
                    basic.oldField = true;
                    
                    // 基本属性中的 vshow/rules 字段
                    if (field.vshow) {
                        ([basic.vshow_left, basic.vshow_center, basic.vshow_right] = field.vshow||[]);
                        basic.vshow = field.vshow;
                    } else {
                        basic.vshow = [];
                    }

                    // 校验规则
                    const regexes = [];
                    (field.rules||[]).forEach(item => {
                        regexes.push({
                            label: item.pattern,
                            value: item.message
                        })
                    });
                    basic.regexes = regexes;

                    // 补全 field 组件可用 props
                    let defaultDataValue = ''; // 组件默认值
                    const props = field.props||{};
                    const fieldInitEvent = [];
                    if (basic.component in blockObj) {
                        const block = blockObj[basic.component];
                        basic.componentName = block.label;
                        let k, blockItem, blockValue;
                        for (k in block.props) {
                            blockItem = block.props[k];
                            // 可用属性不存在于 给定的 form 配置中, 添加一个默认值
                            if (k in props) {
                                blockValue = props[k];
                            } else {
                                blockValue = blockItem.value;
                                props[k] = blockValue;
                            }
                            if (blockItem.onInit) {
                                fieldInitEvent.push([blockItem.onInit, blockValue]);
                            }
                        }
                        // 缺省值 可能是函数, 需传递 props k-v 数据
                        defaultDataValue = this._getFieldDefaultVal(block, props);
                    }
                    basic.props = props;

                    // 已设置的 onInit 回调 这里先不要执行, 因为此时 data.formProps 还未初始化
                    // 在 onInit 回调中可能需要对此进行操作, 这里先缓存为 Array(Function,...)
                    if (fieldInitEvent.length) {
                        fieldInitEvent.forEach(([f, v]) => {
                            onInitEvents.push(() => {
                                f(basic.props, v, basic, this);
                            }) 
                        })
                    }
                    fields.push(basic);

                    // 初始化默认值
                    if (name in dataNative) {
                        data[rname] = dataNative[name];
                    } else {
                        data[rname] = defaultDataValue;
                    }
                });
                
                // 修正 fields 字段中的 vshow 的 left(name)
                fields.forEach(field => {
                    if (field.vshow_left && field.vshow_left in names) {
                        field.vshow[0] = names[field.vshow_left];
                    }
                });

                // 初始化 要设计的表单
                formProps.fields = fields;
                formProps.data = data;
                this.formProps = formProps;
                // 在这里执行所有 onInit 回调
                if (onInitEvents.length) {
                    onInitEvents.forEach(f => {
                        f();
                    })
                }
                this._setStartupField();
            }
        }
    },
    mounted(){
        this._setStartupField();
    },
    filters:{
        // 显示表单字段设置的默认值, 有可能不是标量, 这里转为 json 字符串显示
        fieldValue(value){
            const t = typeof value;
            return t==='string' || t==='number' ? value : JSON.stringify(value);
        }
    },
    methods:{
        // @see https://github.com/SortableJS/sortablejs/issues/985
        _dragSetData(dataTransfer){
            // use dataTransfer.setData to set data, do nothing
        },

        // 重置表单字段为 缺省默认值
        _clearFieldValue(index){
            const field = index < this.formProps.fields.length ? this.formProps.fields[index] : null;
            if (!field) {
                return;
            }
            const name = field.name;
            if (!(name in this.formProps.data)) {
                return;
            }
            const blockObj = this._getBlocksObject();
            if (!(field.component in blockObj)) {
                return;
            }
            this.formProps.data[name] = this._getFieldDefaultVal(blockObj[field.component], field.props);
        },

        // 获取指定类型字段的 缺省值
        _getFieldDefaultVal(block, props){
            if (!('value' in block)) {
                return;
            }
            let value = block.value;
            if (typeof value === 'function') {
                value = value(props);
            }
            return value;
        },

        // 重新生成一个 object, 其字段与 basic 相同
        _copyObject(basic, obj){
            const copy = {};
            for (let k in basic) {
                copy[k] = k in obj ? obj[k] : basic[k]
            }
            return copy;
        },

        // 转 所有可用字段组件 blocks(Array) 为 k-v 结构
        _getBlocksObject(){
            if (this._blockObject) {
                return this._blockObject;
            }
            const blockObject = {};
            this.blockList.forEach(block => {
                blockObject[block.component] = block;
            });
            this._blockObject = blockObject;
            return blockObject;
        },

        // 字段 props 的设置表单中, 某个属性的改变可能有联动效应, 
        // 那么该 props 会绑定 onChange 事件, 当 props 值发生变化就会触发该函数
        _onFieldPropsChange(onChange, name, value){
            if (this.fieldIndex < 0) {
                return;
            }
            const field = this.formProps.fields[this.fieldIndex];
            const props = field.props;
            // 绑定 onChange 的一般是为了修改字段真正支持的 props
            // 1. 所以前两个参数传递 props 和 value, 可使用 props[支持的propName] = value
            // 2. 若与字段基本属性或rule规则联动, 可利用第三个参数, 为当前字段的所有配置
            // 3. 有更复杂需求, 则可通过第三个参数(即当前 curdMaker 对象)来实现
            onChange(props, value, field, this);
        },

        // 字段 Drag clone
        _cloneBlock(block){
            const count = this.formProps.fields.length;
            const name = 'field' + count;
            const field = {
                ...commonFieldProps,
                name: name,
                _name: name,
                label: block.label,
                component: block.component,
                _component: block.component,
                componentName: block.label,
                vshow: [],
                regexes: [],
            };
            // 与已有组件解析相同, 拖拽新组件也要处理 onInitEvents
            const onInitEvents = [];
            let blockItem, blockValue, props = {};
            for (let k in block.props) {
                blockItem = block.props[k];
                blockValue = blockItem.demoValue||blockItem.value;
                if (typeof blockValue === 'object') {
                    blockValue = JSON.parse(JSON.stringify(blockValue));
                }
                props[k] = blockValue;
                if (blockItem.onInit) {
                    onInitEvents.push([blockItem.onInit, blockValue])
                }
            }
            field.props = props;
            if (onInitEvents.length) {
                onInitEvents.forEach(([f, v]) => {
                    // 回调参数参考 _onFieldPropsChange 注释
                    f(props, v, field, this);
                })
            }
            this.__willAddData = {
                name,
                value: this._getFieldDefaultVal(block, props)
            };
            return field;
        },

        // 字段 Drag end
        _dragBlockEnd(drag) {
            if (drag.to.className !== 'curd-maker-blocks') {
                this.$refs.design._clickField(drag.newIndex);
            }
        },

        // 首次载入或上级修改 props.form, 设置 curdForm 的第一个字段为选中状态
        _setStartupField(){
            if (this.$refs.design) {
                this.$refs.design._clickField(this.formProps.fields.length ? 0 : -1);
            }
        },

        // 正在设计的表单 即将更新, 添加新拖拽字段的 data
        _onFieldUpdate(){
            if (this.__willAddData) {
                const {name, value} = this.__willAddData;
                const newValue = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
                this.addFieldData(name, newValue);
                this.__willAddData = null;
                return;
            }
        },

        // 从 curdForm 过来的回调, 下标 index 的字段被点击 或 拖拽排序 导致选中的下标发生变化
        _onFieldClick(index, drag){
            this.fieldIndex = index;
        },

        // 设计模式, 拖拽结束后(可能是排序, 也可能是删除)
        _onFieldDragEnd(drag){
            if (!drag || !this.$refs.design) {
                return;
            }
            let index = null;
            if (drag.from.className !== drag.to.className) {
                index = this.formProps.fields.length ? 0 : -1;
            } else {
                const designFieldIndex = this.$refs.design.designFieldIndex;
                if (drag.oldIndex === designFieldIndex) {
                    index = drag.newIndex;
                } else if (drag.oldIndex < designFieldIndex && drag.newIndex >= designFieldIndex) {
                    index = designFieldIndex-1;
                } else if (drag.oldIndex > designFieldIndex && drag.newIndex <= designFieldIndex) {
                    index = designFieldIndex+1;
                }
            }
            if (index !== null) {
                this.$refs.design._clickField(index, true)
            }
        },

        // 字段基本属性中的 name/vshow 发生变化, 处理关联字段
        _onFieldVshowChange(onChange, name, value) {
            if (this.fieldIndex < 0) {
                return;
            }
            const fields = this.formProps.fields;
            const current = fields[this.fieldIndex];
            // 当前字段修改了 name, 看看其他字段有没有 vshow 与之关联
            if (name === '_name') {
                fields.forEach(field => {
                    if (field.vshow_left && field.vshow_center && field.vshow_left === value) {
                        field.vshow = [current.name, field.vshow_center, field.vshow_right];
                    }
                });
                // 表单组件可能也需要监听该变化
                const blockListeners = this._getBlocksNameListeners();
                this.formProps.fields.forEach(field => {
                    if (!(field.component in blockListeners)) {
                        return;
                    }
                    const listeners = blockListeners[field.component];
                    let k, listener, props;
                    for (k in listeners) {
                        listener = listeners[k];
                        props = field.props;
                        listener(props, props[k], field, this)
                    }
                })
                return;
            }
            // 当前字段修改了 vshow_xx, 看看是是否存在与之匹配的 name
            if (!current.vshow_left || !current.vshow_center) {
                current.vshow = [];
                return;
            }
            let i, tmpName;
            for (i=0; i<fields.length; i++) {
                if (fields[i]._name === current.vshow_left) {
                    tmpName = fields[i].name;
                    break;
                }
            }
            if (tmpName) {
                current.vshow = [tmpName, current.vshow_center, current.vshow_right];
            }
        },

        // 获取 blocks 所有监听 nameChange 的 listener
        _getBlocksNameListeners(){
            if (this._blockNameListner) {
                return this._blockNameListner;
            }
            const nameListeners = {};
            this.blockList.forEach(block => {
                const props = block.props;
                const listeners = {};
                let k, item;
                for (k in props) {
                    item = props[k];
                    if (item.onNameChange) {
                        listeners[k] = item.onNameChange;
                    }
                }
                if (Object.keys(listeners).length) {
                    nameListeners[block.component] = listeners;
                }
            });
            this._blockNameListner = nameListeners;
            return nameListeners;
        },

        /**
         * 
         * 以下方法 提供给表单组件使用
         * 
         */
        // 根据字段名获取其临时字段名 (field+Index 名称)
        getFieldTmpName(name){
            const find = this.formProps.fields.find(f => f._name === name);
            return find ? find.name : null;
        },
        // 获取正在设计表单的 data 值 (key 为 field+Index 临时字段名)
        getFieldData(key){
            return key ? this.formProps.data[key] : this.formProps.data;
        },
        // 获取载入时表单已有字段提供的 data 值
        getNativeData(key){
            const data = this.form.data||{}
            return key ? data[key] : data;
        },
        // 给正在设计的表单 添加一个 data 值
        addFieldData(key, value){
            const newData = {...this.formProps.data};
            newData[key] = value;
            this.formProps.data = newData;
        },
        // 删除正在设计表单的 一个 data 值
        removeFieldData(key){
            if (!(key in this.formProps.data)) {
                return;
            }
            const data = {...this.formProps.data};
            delete data[key];
            this.formProps.data = data;
        },
        // 重建字段, 有些表单字段直接修改其 props 属性不会生效, 重建一下就可以了
        reCreateFiled(){
            if (this.fieldIndex < 0) {
                return;
            }
            const field = this.formProps.fields[this.fieldIndex];
            field.component = null;
            this.$nextTick(() => {
                field.component = field._component;
            })
        },
   
        /**
         * 获取最终可提供给 curdForm 的 json 配置
         * 如有需要, 可根据配置生成 .vue 类型的模板
         * withAllProps=false  针对 fields, 若字段相关设置为默认值, 返回值将不包含
         * 否则将返回所有设置值, 即使保持为默认值
         */
        getForm(withAllProps){
            const data = {};
            const fields = [];
            const formData = this.formProps.data;
            const blockObj = this._getBlocksObject();
            this.formProps.fields.forEach(formField => {
                if (!(formField.component in blockObj)) {
                    return;
                }
                data[formField._name] = formData[formField.name];
                const block = blockObj[formField.component];
                const field = this._getFormFieldConfig(formField, withAllProps);
                this._setFormFieldProps(block, formField, field, data, withAllProps);
                fields.push(field);
            });
            const finallyForm = {};
            formConfigForm.forEach(item => {
                const name = item.name;
                finallyForm[name] = this.formProps[name];
            });
            finallyForm.fields = fields;
            finallyForm.data = data;
            return finallyForm;
        },
        // field 字段布局相关的基本字段
        _getFormFieldConfig(formField, withAllProps){
            const field = {
                name: formField._name
            };
            // span
            if (formField.span !== formField.xspan) {
                field.span = formField.span;
                field.xspan = formField.xspan;
            } else if (formField.span !== 24) {
                field.span = formField.span;
            }
            // 最基础布局属性
            straightCommonField.forEach(key => {
                if (withAllProps || formField[key] !== commonFieldProps[key]) {
                    field[key] = formField[key]
                }
            });
            // vshow 属性
            if (formField.vshow_left && formField.vshow_center) {
                field.vshow = [formField.vshow_left, formField.vshow_center, formField.vshow_right];
            }
            // rules 校验
            const rules = [];
            formField.regexes.forEach(item => {
                rules.push({
                    pattern: item.label,
                    message: item.value,
                    trigger: 'blur'
                })
            })

            // 组件属性
            field.label = formField.label;
            field.component = formField.component;
            field.props = {};
            if (rules.length) {
                field.rules = rules;
            }
            return field;
        },
        // field.props 字段表单属性设置
        _setFormFieldProps(block, formField, field, data, withAllProps) {
            const fieldProps = field.props;
            const propsValue = formField.props;
            let propsBlock = block.props;
            let k, blockItem, blockValue;
            // 若不是 withAllProps, 提前剔除因 vshow 导致的未显示属性
            if (!withAllProps) {
                const propsCondition = {};
                for (k in propsBlock) {
                    blockItem = propsBlock[k];
                    if (blockItem.vshow) {
                        propsCondition[k] = blockItem.vshow;
                    }
                }
                const propsFilter = {};
                for (k in propsBlock) {
                    if (curdVshow(propsValue, propsCondition, k)) {
                        propsFilter[k] = propsBlock[k];
                    }
                }
                propsBlock = propsFilter;
            }
            // 提取可用配置的设置值
            for (k in propsBlock) {
                blockItem = propsBlock[k];
                if (blockItem.ignore) {
                    continue;
                }
                if (withAllProps || propsValue[k] !== blockItem.value) {
                    fieldProps[k] = propsValue[k];
                }
                if (blockItem.onMake) {
                    blockItem.onMake(field, data, formField, this);
                }
            }
        },
        // 清空表单
        clear(){
            this.$admin.confirm('确定要清空？').then(() => {
                this.formProps = {
                    ...this.formProps,
                    fields:[],
                    data:{}
                };
                this._setStartupField();
            })
        },

        // 预览表单
        preview(){
            this.previewShow = true;
            this.previewForm = this.getForm();
        },
        _onPreviewSubmit(data, done){
            console.log('submit', data);
            setTimeout(() => {
                this.$message('提交成功，F12查看提交数据');
                done();
            }, 1200);
        },
        _closePreview(){
            this.previewShow = false;
        },
        _togglePreview(){
            if (this.previewSource) {
                this.previewSource = false;
            } else {
                this.previewSource = this._getFormCode(); 
            }
        },
        _toggleMinCode(){
            if (!this.previewSource) {
                return;
            }
            this.previewMinCode = !this.previewMinCode;
            this.previewSource = this._getFormCode(this.previewMinCode);
        },
        _getFormCode(min){
            let form = this.getForm(), data = form.data;
            delete form.data;
            form = min ? JSON.stringify(form) : JSON.stringify(form, null, "    ");
            if (!min) {
                form = form.split("\n").map((line, index) => {
                    return index ? "            "+line : line;
                }).join("\n");
            }
            data = min ? JSON.stringify(data) : JSON.stringify(data, null, "    ");
            if (!min) {
                data = data.split("\n").map((line, index) => {
                    return index ? "            "+line : line;
                }).join("\n");
            }
            // 这部分搞这么恶心, 主要为了兼容 vueLoader 提取代码块的正则
            let code = `<template>
    <div class="app-form">
        <curd-form v-bind="form" :data="data" ref="curdForm" @submit="onSubmit"/>
    </div>
</template>

<script>`;
        code += "\nimport curd from" + " 'curd';\n";
        code += `export default {
    components:{
        curdForm: curd.curdForm
    },
    data(){
        return {
            form:${form},

            data:${data}
        }
    },
    methods:{
        onSubmit(data, done){
            console.log(data);
            setTimeout(done, 1200);
        }
    }
}`;
            code += "\n<" + '/' + 'script>';
            return code;
        },

        // 导出表单
        built(min){
            const code = _getFormCode(min);
            const file = new Blob([code], {type: "text/vue"}),
                a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = "form.vue";
            a.click();
            setTimeout(function() {
                window.URL.revokeObjectURL(url);  
            }, 0);
        },

    }
}
</script>

<style>
.curd-maker-wrap{
    width: 100%;
}
.curd-maker-design{
    width: 100%;
    height: 100%;
    display: flex;
    position: relative;
}
.curd-maker-layout{
    display: flex;
    flex-direction: column;
}
.curd-maker-layout .el-tabs__content{
    flex:1;
    display: flex;
}
.curd-maker-scroll{
    flex:1;
    overflow: auto;
}
.curd-maker-title{
    width: 100%;
    height: 44px;
    padding: 0 15px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom:2px solid var(--border-color-base);
}
.curd-maker-title h3{
    font-size: 14px;
    font-weight: normal;
    margin: 0;
}
.curd-maker-title-item{
    display: flex;
    align-items: center;
}
.curd-maker-mmodel .el-switch__core{
    height: 24px;
    border-radius: 12px;
}
.curd-maker-mmodel .el-switch__core:after{
    width: 20px;
    height: 20px;
}
.curd-maker-mmodel .el-switch__label *{
    font-size: 12px;
}
.curd-maker-mmodel .el-switch__label--left{
    margin-right: -33px;
    z-index: 2;
    color: #fff;
    width: 24px;
    padding-left: 9px;
    display: none;
}
.curd-maker-mmodel .el-switch__label--right{
    margin-left: -33px;
    z-index: 2;
    color: rgba(0,0,0,.4);
}
.curd-maker-mmodel.is-checked .el-switch__core::after{
    margin-left: -20px;
}
.curd-maker-mmodel.is-checked .el-switch__label--left{
    display: block;
}
.curd-maker-mmodel.is-checked .el-switch__label--right{
    display: none;
}
.curd-maker-trash{
    width: 30px;
    height: 30px;
    margin-left: 22px;
    position: relative;
}
.curd-maker-trash-drag,.curd-maker-trash-icon,.curd-maker-trash-drag .el-col{
    position: absolute;
    width: 100%;
    height: 100%;
    left:0;
    top:0;
}
.curd-maker-trash-icon,.curd-maker-trash-drag .el-col{
    color: var(--color-info);
    border: 1px dotted var(--border-color-base);
    align-items: center;
    justify-content: center;
    display: flex;
    border-radius: 4px;
    font-size: 1.125em;
    box-sizing: border-box;
}
.curd-maker-trash-drag .el-col{
    z-index: 2;
    font-family: element-icons!important;
    speak: none;
    font-style: normal;
    font-weight: 400;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    vertical-align: baseline;
    -webkit-font-smoothing: antialiased;
    transition: transform 0ms !important;
    color: #fff;
    background: red;
    border-color: red;
}
.curd-maker-trash-drag .el-form-item{
    display: none;
}
.curd-maker-trash-drag .el-col::after{
    content: "\e7c9";
}

/*左侧*/
.curd-maker-left{
    width: 240px;
    min-width: 200px;
    border-right:1px solid var(--border-color-base);
}
.curd-maker-blocks{
    width: 100%;
    float: left;
    box-sizing: border-box;
    min-height: 100%;
    padding-bottom: 20px
}
.curd-maker-blocks .curd-maker-item{
    float: left;
    width: 44%;
    margin-left: 4%;
    line-height: 1;
    box-sizing: border-box;
    margin-top: 10px;
    padding: 10px 0 10px 10px;
    border-radius: 4px;
    font-size: 14px;
    cursor: move;
    user-select: none;
    transition: transform 0ms !important;
    background: var(--background-color-base);
    border: 1px dotted var(--border-color-lighter);
    color: var(--color-text-regular);
}
.curd-maker-blocks .curd-maker-item:hover{
    background: var(--color-primary-light-9);
    border: 1px dashed var(--color-primary-light-1);
    color: var(--color-primary);
}

/*中间*/
.curd-maker-center{
    flex:1;
    position: relative;
    align-items: center;
    min-width: 460px;
}
.curd-maker-wait{
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    color:var(--color-text-placeholder);
}
.curd-elform-design{
    display: flex;
    padding:15px;
    box-sizing: border-box;
    flex-direction: column;
    min-height: 100%;
}
.curd-elform-design .el-row{
    flex:1;
    display: flex;
    flex-direction: column;
}
.curd-elform-draggable{
    flex:1;
}
.curd-elform-draggable .el-cascader-panel{
    background: var(--color-white);
}
.curd-elform-draggable .sortable-chosen{
    background: var(--background-color-base);
}
.curd-elform-draggable .curd-maker-active{
    background: var(--color-primary-light-9);
}
.curd-elform-draggable .curd-maker-item{
    float:left;
    width: 100%;
    height: 60px;
    padding:0 0 22px 10px;
    display: flex;
    align-items: center;
    font-size: 14px;
    box-sizing: border-box;
    background: var(--color-info-lighter);
    border: 1px dashed var(--color-info);
    color: var(--color-text-regular);
}
.curd-maker-shadow{
    opacity: .5;
}
/*表单宽窄版 外框*/
.curd-maker-screen{
    width: 100%;
    height: 100%;
    overflow: auto;
}
.curd-maker-device{
    flex: 1;
    width: 100%;
    position: relative;
    overflow: hidden;
}
.curd-maker-narrow{
    margin: 5px 0;
    width: 400px;
    padding: 30px 12px 15px 12px;
    border-radius: 20px 20px 12px 12px;
    background: #636363;
    box-shadow: 0 0 5px rgb(0 0 0 / 40%);
}
.curd-maker-narrow::before{
    content: "";
    display: block;
    position: absolute;
    width: 8px;
    height: 8px;
    top: 11px;
    left: 170px;
    border-radius: 8px;
    background: #515151;
}
.curd-maker-narrow::after{
    content: "";
    display: block;
    position: absolute;
    width: 100px;
    height: 6px;
    top: 12px;
    left: 185px;
    border-radius: 10px;
    background: #525252;
}
.curd-maker-narrow .curd-maker-screen{
    background: var(--color-white);
    border:1px solid var(--border-color-base);
}

/*右侧*/
.curd-maker-right{
    flex-shrink: 0;
    width:350px;
    border-left:1px solid var(--border-color-base);
}
.curd-maker-right .el-tabs__header{
    margin:0;
}
.curd-maker-right .el-tabs__nav{
    width: 100%;
}
.curd-maker-right .el-tabs__item{
    padding:0;
    width: 50%;
    height: 44px;
    line-height: 44px;
    text-align: center;
}
.curd-maker-right .curd-elform{
    padding:15px;
}
.curd-maker-right .el-divider{
    margin-top:0;
}
.curd-maker-right .el-divider__text{
    color: var(--color-text-placeholder)
}
.curd-maker-right .curd-tree-set{
    padding:8px;
}
.curd-maker-sform .el-form-item__label{
    padding-right: 0;
}

/*预览*/
.curd-maker-preview{
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--color-white);
}
.curd-maker-preview-code{
    color: var(--color-text-regular);
    background: var(--background-color-base);
    border-radius: 6px;
    position: relative;
}
.curd-maker-preview-code pre{
    margin: 0;
    padding: 20px;
    overflow: auto;
}
.curd-maker-preview-code span{
    position: absolute;
    top: 0;
    right: 0;
    background: var(--color-primary-light-9);
    color: var(--color-primary);
    padding: 6px;
    border-radius: 0 6px;
    font-size: 12px;
    cursor: pointer;
    user-select: none;
}
.curd-maker-preview-close{
    position: absolute;
    z-index: 2;
    top: 10px;
    right: 10px;
    font-size: 1.5em;
    color: var(--color-text-placeholder);
}
.curd-maker-preview-close:hover{
    color: var(--color-text-regular);
}
.curd-maker-preview-source{
    right: 45px;
}
</style>