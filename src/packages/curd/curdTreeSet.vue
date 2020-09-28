<template>
<div class="curd-tree-set">
    <el-tree 
        :data="treeOptions"
        :expand-on-click-node="true"
        @node-drop="dragChange"
        node-key="value"
        draggable
    >
        <div class="curd-tree-set-node" slot-scope="{node, data}">
            <div class="el-tree-node__label">{{data.label}}<span>({{data.value}})</span></div>
            <span>
                <i class="el-icon-folder-add" @click.stop="treeForm(data)" v-if="!max || node.level<=max"/>
                <i class="el-icon-edit-outline" @click.stop="treeForm(data,1)"/>
                <el-popconfirm :title="'确定移除该项'+(data.children && data.children.length ? '及其子项' : '')+'？'" @onConfirm="treeDelete(node, data)">
                    <i slot="reference" class="el-icon-delete" @click.stop/>
                </el-popconfirm>
            </span>
        </div>
    </el-tree>
    <div class="curd-tree-set-footer">
        <div @click="treeForm(null)"><el-icon name="folder-add"/> 添加顶级项</div>
        <span>可拖拽进行排序</span>
    </div>
    <el-dialog
        custom-class="curd-tree-set-dialog"
        :visible.sync="treeDialogVisible"
        :append-to-body="true"
        :close-on-click-modal="false"
    >
        <el-form 
            ref="treeForm"
            label-width="70px" 
            style="padding-right:20px"
            :validate-on-rule-change="false"
            :model="treeDialogData"
            :rules="treeRules"
        >
            <el-form-item label="选项名" prop="label">
                <el-input v-model="treeDialogData.label" />
            </el-form-item>
            <el-form-item label="选项值" prop="value">
                <el-input :type="(treeDialogData.value_append ? 'number' : 'text')" v-model="treeDialogData.value">
                    <el-checkbox slot="suffix" v-model="treeDialogData.value_append">数字</el-checkbox>
                </el-input>
            </el-form-item>
        </el-form>
        <span slot="footer">
            <el-button @click="treeDialogVisible=false">取 消</el-button>
            <el-button type="primary" @click="treeSave">确 定</el-button>
        </span>
    </el-dialog>
</div>
</template>

<script>
export default {
    name:'CurdTreeSet',
    props:{
        max:Number,
        value: {
            required: true
        },
    },
    data() {
        return {
            treeOptions:[],
            treeDialogVisible:false,
            treeDialogData: {},
            treeRules:{
                label: [
                    {required:true, message:'请设置选项名'}
                ],
                value: [
                    {required:true, message:'请设置选项值'}
                ],
            },
        };
    },
    watch:{
        value:{
            immediate:true,
            handler(){
                // 从内部通过 v-model 同步到外部, 继而反向触发 value 变化, 直接忽略, 否则死循环了
                if (this.__triggerValue) {
                    this.__triggerValue = false;
                } else {
                    this._passiveChange();
                }
            }
        }
    },
    methods:{
        // 外部更新 v-model 值, 重置 data 相关变量, 再反向更新 value
        // 1.格式化一下 value
        // 2.外面 绑定的 @change 才能正常触发
        _passiveChange(){
            const trees = [];
            this._insertNode(trees, this.value);
            this.treeOptions = trees;
            this._triggerChange();
        },
        // 更新 v-model
        _triggerChange(){
            const trees = [];
            this._insertNode(trees, this.treeOptions, true);
            this.__triggerValue = true;
            this.$emit('input', trees);
            this.$emit('change', trees);
        },
        _insertNode(dst, source, withoutEmptyChild){
            (source||[]).forEach(item => {
                item = item||{};
                if (!('label' in item) || !('value' in item)) {
                    return;
                }
                const {label, value, children} = item;
                const node = {label, value};
                if (!withoutEmptyChild || (Array.isArray(children) && children.length)) {
                    node.children = [];
                    this._insertNode(node.children, children, withoutEmptyChild);
                }
                dst.push(node);
            })
        },

        // 打开 新增/修改 的 弹窗
        treeForm(data, edit){
            this.__treeTmpData = [edit||0, data];
            let label = '', value = '', value_append = false;
            if (edit) {
                ({label, value} = data);
                value_append = typeof value === 'number';
            }
            this.treeDialogData = {label, value, value_append};
            if (this.$refs.treeForm) {
                // 这里手动修改 form 值会导致直接显示表单错误信息, 所以先清除
                this.$nextTick(() => {
                    this.$refs.treeForm.clearValidate();
                    this.treeDialogVisible = true;
                });
            } else {
                this.treeDialogVisible = true;
            }  
        },
        // 保持 弹窗中 表单的修改
        treeSave(){
            this.$refs.treeForm.validate().then(() => {
                const [edit, data] = this.__treeTmpData;
                let {label, value, value_append} = this.treeDialogData;
                value = value_append ? value * 1 : value;
                if (edit) {
                    data.label = label;
                    data.value = value;
                } else {
                    const node = {value, label, children: []};
                    if (!data) {
                        this.treeOptions.push(node);
                    } else {
                        if (!data.children) {
                            this.$set(data, 'children', []);
                        }
                        data.children.push(node);
                    }
                }
                this.treeDialogVisible = false;
                this._triggerChange();
            }).catch(() => {})
        },
        // 删除一项
        treeDelete(node, data){
            const parent = node.parent;
            const children = parent.data.children || parent.data;
            const index = children.findIndex(d => d.value === data.value);
            children.splice(index, 1);
            this._triggerChange();
        },
        // 拖拽排序结束后
        dragChange(){
            this._triggerChange();
        }
    },
}
</script>

<style>
.curd-tree-set{
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
    border-radius: 4px;
    background: var(--color-white);
    border: 1px solid var(--border-color-base);
}
.curd-tree-set .el-icon-folder-add{
    color:var(--color-primary);
}
.curd-tree-set-node .el-icon-edit-outline{
    color: var(--color-success);
}
.curd-tree-set .el-icon-delete{
    color: var(--color-danger);
}
.curd-tree-set-node{
    user-select: none;
    flex:1;
    display: flex;
    padding-right:8px;
    justify-content: space-between;
}
.el-tree-node__label span{
    color: var(--color-text-placeholder);
    margin-left: 4px;
}
.curd-tree-set-footer{
    display: flex;
    align-items: center;
    box-sizing: border-box;
    font-size: 12px;
    padding: 10px 0 0 9px;
    color: var(--color-text-placeholder);
}
.curd-tree-set-footer div{
    margin-right:15px;
    color:var(--color-primary);
    font-size:14px;
    cursor: pointer;
}
.curd-tree-set-dialog{
    margin:0 10px;
}
.curd-tree-set-dialog input[type=number] {
  -moz-appearance:textfield;
}
.curd-tree-set-dialog input::-webkit-outer-spin-button,
.curd-tree-set-dialog input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>