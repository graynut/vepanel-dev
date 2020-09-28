<template>
    <curd v-bind="configure" ref="curd" class="account">
        <!--自定义 字段列表头 模板-->
        <template #column-money-header="scope">
            <span style="color:red">{{scope | test}}</span>
        </template>

        <!--自定义 字段(列) 模板-->
        <template #column-phone="scope">
            <el-link type="primary" @click.prevent="edit(scope)">{{scope.row[scope.column]}}</el-link>
        </template>

        <!--自定义操作列 表头模板-->
        <div slot="operate-header" style="display:flex;padding-right:20px;justify-content:space-between;align-items:center;">
            <span>操作</span>
            <el-link href="https://github.com/malacca/vstep/tree/master/src/account.vue" target="_blank" style="height:20px"><i class="iconfont icon-github"></i>源码</el-link>
        </div>
    </curd>
</template>

<script>
import curd from 'curd';
import Form from './cmts/account_form';

export default {
    components:{
        curd:curd.curd
    },
    created(){
        this.configure = {
            dataSource:'account/list',
            pagesize:20,
            multiSort:true,
            advanceSearch:{
                enable:false,
            },

            // 参考 https://element.eleme.cn/#/zh-CN/component/table#table-attributes
            // 不能使用  data/height/max-height
            tableProps:{
                size:"small",
                stripe:false,
                border:false,
                fit:true,
                "show-header":true,
                "highlight-current-row": false,
                
                // 懒加载树形数据
                "row-key": "id",
                "tree-props":{hasChildren: 'top', children: 'children'},
                lazy:true,
                load:this.expand,
            },

            // 参考 https://element.eleme.cn/#/zh-CN/component/table#table-events
            // 可监听所有支持的事件
            tableEvent:{
                "row-dblclick":(x, r) => {
                    console.log(x, r)
                }
            },

            // Table 列定义
            columns:[
                {
                    field:'phone',
                    name:'手机号',
                    width:180,
                },
                {
                    field:'security',
                    name:'登录验证',
                    align:"center",
                    width:80,
                    filters:{
                        //field:'security',
                        options:[{text: '开启', value:1}, {text: '未开启', value:0}],
                        multiple:false,
                    }
                },
                {
                    field:'money',
                    name:'余额',
                    width:90,
                },
                {
                    field:'name',
                    name:'实名',
                    width:150,
                    flex:1
                },
                {
                    field:'join_time',
                    name:'注册时间',
                    width:130,
                    sort:1,
                },
                {
                    field:'login_time',
                    name:'最后登陆',
                    width:130,
                    sort:1,
                },
            ],

            // 顶部右侧按钮
            revise:[
                {
                    name:'新增',
                    type:0, // 页面模式
                    link:'add',
                    path:Form,
                    after:1,
                },
            ],

            // Table 行最后一列操作按钮
            rowRevise:[
                {
                    name:'修改',
                    type:1, // 弹窗模式
                    headerStyle:1,
                    link:'edit',
                    path:Form
                },
                {
                    name:'新增子账户',
                    type:1,
                    link:'addson',
                    path:Form,
                },
                {
                    name:'禁用',
                    disable:['disable', true],
                    type:2,
                    link:'account/disable',
                    status:0,
                    after:this.toggleStatus,
                },
                {
                    name:'启用',
                    disable:['disable', false],
                    type:2,
                    link:'account/enable',
                    status:1,
                    after:this.toggleStatus,
                },
                {
                    name:'删除',
                    type:3,
                    callback:this.delete
                }
            ],

            // 底部左侧按钮
            operate:[
                {
                    name:'启用',
                    type:2,
                    link:'account/enable',
                    status:1,
                    after:this.toggleStatus,
                },
                {
                    name:'禁用',
                    type:2,
                    link:'account/disable',
                    status:0,
                    after:this.toggleStatus,
                }
            ],
        }
    },
    filters:{
        test(scope) {
            // 可使用这种方式查看自定义 solt 可用的 scope 数据
            // console.log(scope);
            return scope.column.label
        },
    },
    methods:{
        expand(tree, treeNode, resolve){
            this.$admin.postJson('account', {topid: tree.id}).then(res => {
                let data = this.$refs.curd.resolveData(res.lists); //自动处理按钮是否可用
                data = data.map(item => {
                    item.$topid = tree.id;
                    item.$s[1] = 'hide'; //隐藏[新增子账户]操作
                    return item;
                })
                resolve(data)
            })
        },
        toggleStatus(param){
            const {curd, id, primary, row} = param;
            const disable = !param.operate.status;
            const rows = Array.isArray(row) ? row : [row];
            rows.forEach(row => {
                row.disable = disable;
                // 处理 [禁用][启用] 的可用状态
                row.$s[2] = disable;
                row.$s[3] = !disable;
                curd.updateRow(row);
            });
        },
        delete(param){
            const {index, curd, table, data, row, primary, id} = param;
            const msg = (row.top ? '当前账户为主账户，将一并删除其所有子账户，' : '') + '确定要删除吗？';
            this.$admin.confirm(msg).then(() => {
                const payload = {};
                payload[primary] = id;
                return curd.runAjax('account/delete', payload);
            }).then((res) => {
                if (!res) {
                    return;
                }
                const store = table.store;
                const {treeData, lazyTreeNodeMap} = store.states;
                if (row.top) {
                    // 主账户
                    if(treeData[id].loaded) {
                        delete lazyTreeNodeMap[id];
                        delete store.normalizedLazyNode[id];
                        delete treeData[id];
                    }
                    data.splice(index, 1);
                } else {
                    // 子账户
                    let subIndex = null;
                    const topid = row.$topid;
                    lazyTreeNodeMap[topid].some((item, idx) => {
                        if (item.id === id) {
                            subIndex = idx;
                            return true;
                        }
                    })
                    if (subIndex !== null) {
                        lazyTreeNodeMap[topid].splice(subIndex, 1);
                    }
                }
            })
        },
        edit(scope){
            // 可直接利用暴露的 view 函数弹窗
            // 比如点击某项查看详细信息, 这里仅做演示, 直接使用 edit
            this.$refs.curd.view({
                name:"编辑信息",
                type:1,
                link:'edit',
                path:Form,
                id: scope.row[scope.column],
                row: scope.row,
                index: scope.$index
            })
        }
    }
}
</script>


<script mock>
function formatAccount(row) {
    var d = new Date(row.join_time);
    row.join_time = (d.getMonth() + 1) + '-' + d.getDate() + ' ' +  d.getHours() + ':' + d.getMinutes();
    row.money = row.money ? row.money : 0;
    row.security = row.security ? '是' : '否';
    row.name = row.name ? row.name : '无';
    row.disable = !!row.disable;
    row.top = !row.top;
    return row;
}

function sortAccount(lists, sorts){
    sorts = sorts||{};
    const fields = Object.keys(sorts), 
        len = fields.length;
    if (!len){
        return lists;
    }
    const multiSort = (a, b) => {
        const fieldSort = (index) => {
            if (index >= len) {
                return 0;
            }
            const name = fields[index],
                x = a[name],
                y = b[name];
            if (x === y) {
                return fieldSort(index+1)
            }
            const desc = sorts[name] ? 1 : -1;
            return x > y ? -1 * desc : desc;
        }
        return fieldSort(0);
    }
    return lists.sort(multiSort);
}

function ajaxMessage(rs){
    return rs ? {
        code:0,
        message:'操作成功'
    } : {
        code:500,
        message:'操作失败'
    }
}

const mockFailedJson = {
    code:500,
    message:'演示版本无法操作'
}

export default {
    '#': ({db}) => {
        return db.scheme({
            account: "++id,top,phone,pwd,name,security,money,join_time,login_time,disable",
        })
    },
    '#account/list': {"code":0,"data":{"total":2,"lists":[{"top":true,"phone":"18888888888","pwd":"111","name":"无","security":"否","money":0,"disable":false,"join_time":"9-28 4:21","login_time":0,"id":15},{"top":true,"phone":"13999999999","pwd":"cff","name":"无","security":"否","money":0,"disable":false,"join_time":"9-28 17:29","login_time":0,"id":22}]}},
    '#account/edit':{phone: '18888888888'},
    '#account/save':mockFailedJson,
    '#account/disable':mockFailedJson,
    '#account/enable':mockFailedJson,
    '#account/delete':mockFailedJson,
    'account/list': (res, req, {db}) => {
        return req.json().then(json => {
            // WhereClause
            let sql = db.table('account').where('top').equals(json.topid ? json.topid : 0);
            if (json.keyword) {
                sql = sql.filter(item => {
                    return item.phone.indexOf(json.keyword) > -1
                })
            }
            return sql.count().then(total => {
                return {
                    json,
                    sql,
                    total
                }
            })
        }).then(({json, sql, total}) => {
            if (!total) {
                return res.send({
                    code:0,
                    data:{total:0, lists:[]}
                })
            }
            // offset limit
            if (json.page && json.offset) {
                sql = sql.offset(
                    (json.page-1) * json.offset
                ).limit(
                    json.offset
                );
            }
            return sql.toArray().then(lists => {
                return res.send({
                    code:0,
                    data:{
                        total, 
                        lists:sortAccount(lists, json.sorts).map(formatAccount)
                    }
                })
            })
        })   
    },
    'account/edit': (res, req, {db}) => {
        return req.json().then(json => {
            return db.table('account').get(json.id)
        }).then(item => {
            // 仅返回 phone 字段即可
            return res.send(item ? {
                phone: item.phone
            } : null)
        })
    },
    'account/save': (res, req, {db}) => {
        return req.json().then(json => {
            if (json.link === 'add' || json.link === 'addson') {
                const row = {
                    top: 0,
                    phone: json.phone,
                    pwd: json.pwd,
                    name: '',
                    security:0,
                    money:0,
                    disable:0,
                    join_time: Date.now(),
                    login_time:0
                };
                if (json.link === 'addson'){
                    row.top = json.id;
                }
                return db.table('account').put(row).then(id => {
                    if (json.link !== 'addson') {
                        return null;
                    }
                    row.id = id;
                    return formatAccount(row);
                })
            }
            // 修改
            const row = {
                phone: json.phone
            };
            if (json.pwd) {
                row.pwd = json.pwd
            }
            return db.table('account').update(json.id, row)
        }).then(data => {
            return res.send({
                code:0,
                message:'成功保存数据',
                data
            })
        }).catch(err => {
            return res.send({
                code:500,
                message:'保存数据失败'
            })
        });
    },
    'account/disable': (res, req, {db}) => {
        return req.json().then(json => {
            return db.table('account').where('id').anyOf(json.id).modify({
                disable: 1
            })
        }).then(rs => {
            return res.send(ajaxMessage(rs))
        })
    },
    'account/enable': (res, req, {db}) => {
        return req.json().then(json => {
            return db.table('account').where('id').anyOf(json.id).modify({
                disable: 0
            })
        }).then(rs => {
            return res.send(ajaxMessage(rs))
        })
    },
    'account/delete': (res, req, {db}) => {
        return req.json().then(json => {
            return db.table('account').where('id').equals(json.id).or('top').equals(json.id).delete();
        }).then(rs => {
            return res.send(ajaxMessage(rs))
        })
    },
}
</script>