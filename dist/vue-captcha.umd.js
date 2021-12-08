(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue-capcay.vue')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue-capcay.vue'], factory) :
  (global = global || self, factory(global.VueCapcay = {}, global.vueCapcay_vue));
}(this, (function (exports, vueCapcay_vue) { 'use strict';

  // Declare install function executed by Vue.use()
  function install(Vue) {
    if (install.installed) { return; }
    install.installed = true;
    Vue.component('vue-capcay', vueCapcay_vue.VueCapcay);
  }

  // Create module definition for Vue.use()
  var plugin = {
    install: install,
  };

  // Auto-install when vue is found (eg. in browser via <script> tag)
  var GlobalVue = null;
  if (typeof window !== 'undefined') {
    GlobalVue = window.Vue;
  } else if (typeof global !== 'undefined') {
    GlobalVue = global.Vue;
  }
  if (GlobalVue) {
    GlobalVue.use(plugin);
  }

  exports.default = vueCapcay_vue.VueCapcay;
  exports.install = install;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
