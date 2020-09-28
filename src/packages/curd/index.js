import draggableIf from "./draggableIf.vue";
import curdChoose from "./curdChoose.vue";
import curdEditor from "./curdEditor.vue";
import curdTreeSet from "./curdTreeSet.vue";
import curdForm from "./curdForm.vue";
import curd from "./curd.vue";

function install(Vue) {
    const components = [
        draggableIf,
        curdChoose,
        curdEditor,
        curdTreeSet,
        curdForm,
        curd
    ];
    components.forEach(c => {
        Vue.component(c.name, c);
    });
}

export default {
    draggableIf,
    curdChoose,
    curdEditor,
    curdTreeSet,
    curdForm,
    curd,
    install
}