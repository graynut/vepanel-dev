import vepanelTest from "./test.vue";

export {
    vepanelTest
}

export default {
    install:() => {
        Vue.component('vepanelTest', vepanelTest);
    }
}