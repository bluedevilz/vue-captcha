(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue2-captcha.vue')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue2-captcha.vue'], factory) :
  (global = global || self, factory(global.VueCapcay = {}, global.vue2Captcha_vue));
}(this, (function (exports, vue2Captcha_vue) { 'use strict';

  // Declare install function executed by Vue.use()
  function install(Vue) {
    if (install.installed) { return; }
    install.installed = true;
    Vue.component('vue2-captcha', vue2Captcha_vue.vue2Captcha);
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

  exports.default = vue2Captcha_vue.vue2Captcha;
  exports.install = install;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
