//
//
//
//
//
//
//

// export component
var script = {
  name: "vue2-captcha",
  props: {
    url: {
      type: String,
      default: "",
      required: true,
    },
    captchaStyleName: {
      type: String,
      default: "",
      required: true,
    },
    inputId: {
      type: String,
      default: "",
      required: true,
    },
  },
  data: function data() {
    return { userInput: "" };
  },
  computed: {
    getCaptchaId: function getCaptchaId() {
      return this.getInstance().captchaId;
    },
    getUserEnteredCaptchaCode: function getUserEnteredCaptchaCode() {
      return this.getCaptchaCode();
    },
  },

  methods: {
    emitBlur: function emitBlur() {
      this.$emit("input", {
        userEnteredCaptchaCode: this.getUserEnteredCaptchaCode.toUpperCase(),
        captchaId: this.getCaptchaId,
      });
    },

    getCaptchaCode: function getCaptchaCode() {
      return this.userInput;
    },

    spread: function spread(initArr, addArr) {
      var addArrKeys = Object.keys(addArr);
      for (var i = 0; i < addArrKeys.length; i++) {
        initArr[addArrKeys[i]] = addArr[addArrKeys[i]];
      }
    },

    getScript: function getScript(url, callback) {
      this.ajax(url, function (responseText) {
        var f = new Function(responseText);
        f();
        if (typeof callback === "function") {
          callback();
        }
      });
    },

    addValidateEvent: function addValidateEvent(captchaInstance) {
      var self = this;
      var userInput = captchaInstance.userInput;
      if (userInput && this.useUserInputBlurValidation(userInput)) {
        userInput.onblur = function () {
          var captchaCode = userInput.value;
          if (captchaCode.length !== 0) {
            self.valUnsafe(captchaInstance, function (isHuman) {
              var event = new CustomEvent("validatecaptcha", { detail: isHuman });
              userInput.dispatchEvent(event);
              if (!isHuman) {
                captchaInstance.reloadImage();
              }
            });
          }
        };
      }
    },

    valUnsafe: function valUnsafe(captchaInstance, callback) {
      var captchaCode = captchaInstance.userInput.value;
      this.ajax(captchaInstance.validationUrl + "&i=" + captchaCode, function (isHuman) {
        isHuman = isHuman == "true";
        callback(isHuman);
      });
    },

    useUserInputBlurValidation: function useUserInputBlurValidation(userInput) {
      return userInput.getAttribute("data-correct-captcha") !== null;
    },
    // change relative to absolute urls in captcha html markup
    changeRelativeToAbsoluteUrls: function changeRelativeToAbsoluteUrls(originCaptchaHtml, captchaEndpoint) {
      var captchaEndpointHandler = this.getCaptchaEndpointHandler(captchaEndpoint);
      var backendUrl = this.getBackendBaseUrl(captchaEndpoint, captchaEndpointHandler);
      originCaptchaHtml = originCaptchaHtml.replace(/<script.*<\/script>/g, "");
      var relativeUrls = originCaptchaHtml.match(/(src|href)="([^"]+)"/g);

      var relativeUrl,
        relativeUrlPrefixPattern,
        absoluteUrl,
        changedCaptchaHtml = originCaptchaHtml;

      for (var i = 0; i < relativeUrls.length; i++) {
        relativeUrl = relativeUrls[i].slice(0, -1).replace(/src=|href=/, "");
        relativeUrlPrefixPattern = new RegExp(".*" + captchaEndpointHandler);

        absoluteUrl = relativeUrl.replace(
          relativeUrlPrefixPattern,
          '"' + backendUrl + captchaEndpointHandler
        );

        changedCaptchaHtml = changedCaptchaHtml.replace(relativeUrl, absoluteUrl);
      }

      return changedCaptchaHtml;
    },

    getHtml: function getHtml(captchaStyleName, captchaEndpoint, callback) {
      var self = this;
      var url = captchaEndpoint + "?get=html&c=" + captchaStyleName;
      this.ajax(url, function (captchaHtml) {
        captchaHtml = self.changeRelativeToAbsoluteUrls(captchaHtml, captchaEndpoint);
        callback(captchaHtml);
      });
    },

    // get captcha endpoint handler from configued captchaEndpoint value,
    // the result can be "simple-captcha-endpoint.ashx", "botdetectcaptcha",
    // or "simple-botdetect.php"
    getCaptchaEndpointHandler: function getCaptchaEndpointHandler(captchaEndpoint) {
      var splited = captchaEndpoint.split("/");
      return splited[splited.length - 1];
    },

    // get backend base url from configued captchaEndpoint value
    getBackendBaseUrl: function getBackendBaseUrl(captchaEndpoint, captchaEndpointHandler) {
      var lastIndex = captchaEndpoint.lastIndexOf(captchaEndpointHandler);
      return captchaEndpoint.substring(0, lastIndex);
    },

    ajax: function ajax(url, callback) {
      function xhr() {
        var x = null;
        try {
          x = new XMLHttpRequest();
        } catch (e) {
          console.error(e);
        }
        return x;
      }

      var x = xhr();
      if (x) {
        if (x && 0 === x.readyState) {
          x.onreadystatechange = function () {
            if (4 === x.readyState && x.status === 200) {
              if (typeof callback === "function") {
                callback(x.response);
              }
            }
          };
          x.open("GET", url, true);
          x.send();
        }
      }
    },

    addCustomEventPolyfill: function addCustomEventPolyfill() {
      if (typeof window.CustomEvent !== "function") {
        window.CustomEvent = function (event, params) {
          params = params || { bubbles: false, cancelable: false, detail: undefined };
          var evt = document.createEvent("CustomEvent");
          evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
          return evt;
        };
        window.CustomEvent.prototype = window.Event.prototype;
      }
    },

    getCaptchaStyleName: function getCaptchaStyleName() {
      var styleName;

      // the value can be set in generateCaptchaMarkup method
      if (this.state && typeof this.state.captchaStyleName !== "undefined") {
        styleName = this.state.captchaStyleName;
        return styleName;
      }

      styleName = this.captchaStyleName;
      if (styleName) {
        return styleName;
      }

      // backward compatible
      styleName = this.styleName;
      if (styleName) {
        return styleName;
      }

      throw new Error("The captchaStyleName attribute is not found or its value is not set.");
    },
    getInstance: function getInstance() {
      var instance = null;

      if (typeof window.botdetect !== "undefined") {
        var captchaStyleName = this.getCaptchaStyleName();
        instance = window.botdetect.getInstanceByStyleName(captchaStyleName);
      }

      return instance;
    },

    displayHtml: function displayHtml(captchaStyleName) {
      var self = this;
      this.getHtml(captchaStyleName, this.url, function (captchaHtml) {
        document.getElementById("BDC_CaptchaComponent").innerHTML = captchaHtml;
        self.loadScriptIncludes(captchaStyleName);
      });
    },
    reloadImage: function reloadImage() {
      this.getInstance().reloadImage();
      this.$emit("input", []);
    },
    validateUnsafe: function validateUnsafe(callback) {
      var instance = this.getInstance();
      this.valUnsafe(instance, function (isHuman) {
        callback(isHuman);

        if (!this.useUserInputBlurValidation(instance.userInput) && !isHuman) {
          instance.reloadImage();
        }
      });
    },
    generateCaptchaMarkup: function generateCaptchaMarkup(captchaStyleName) {
      this.captchaStyleName = captchaStyleName;
      this.displayHtml(captchaStyleName);
    },
    loadScriptIncludes: function loadScriptIncludes(captchaStyleName) {
      var self = this;
      var captchaIdElement = document.getElementById("BDC_VCID_" + captchaStyleName);

      if (captchaIdElement) {
        var captchaId = captchaIdElement.value;
        var scriptIncludeUrl =
          this.url + "?get=script-include&c=" + captchaStyleName + "&t=" + captchaId + "&cs=203";
        this.getScript(scriptIncludeUrl, function () {
          // register user input blur validation
          var instance = self.getInstance();

          if (instance) {
            self.addValidateEvent(instance);
          } else {
            console.error("window.botdetect undefined.");
          }
        });
      }
    },
  },
  beforeMount: function beforeMount() {
    this.addCustomEventPolyfill();
  },
  mounted: function mounted() {
    if (this.url) {
      var captchaStyleName = this.getCaptchaStyleName();
      this.displayHtml(captchaStyleName);
    }
  },
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    var options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    var hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            var originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            var existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [
    _c("div", { attrs: { id: "BDC_CaptchaComponent" } }),
    _vm._v(" "),
    _c("input", {
      directives: [
        {
          name: "model",
          rawName: "v-model",
          value: _vm.userInput,
          expression: "userInput"
        }
      ],
      attrs: { type: "text", id: _vm.inputId },
      domProps: { value: _vm.userInput },
      on: {
        input: [
          function($event) {
            if ($event.target.composing) {
              return
            }
            _vm.userInput = $event.target.value;
          },
          _vm.emitBlur
        ]
      }
    })
  ])
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  var __vue_inject_styles__ = undefined;
  /* scoped */
  var __vue_scope_id__ = undefined;
  /* module identifier */
  var __vue_module_identifier__ = undefined;
  /* functional template */
  var __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined,
    undefined,
    undefined
  );

// Declare install function executed by Vue.use()
function install(Vue) {
  if (install.installed) { return; }
  install.installed = true;
  Vue.component('vue2-captcha', __vue_component__);
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

export default __vue_component__;
export { install };
