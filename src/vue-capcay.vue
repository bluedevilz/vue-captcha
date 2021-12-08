<template>
  <div>
    <div id="BDC_CaptchaComponent"></div>
    <input type="text" :id="inputId" @input="emitBlur" v-model="userInput" />
  </div>
</template>

<script>
// export component
export default {
  name: "vue-capcay",
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
  data() {
    return { userInput: "" };
  },
  computed: {
    getCaptchaId() {
      return this.getInstance().captchaId;
    },
    getUserEnteredCaptchaCode() {
      return this.getCaptchaCode();
    },
  },

  methods: {
    emitBlur() {
      this.$emit("input", {
        userEnteredCaptchaCode: this.getUserEnteredCaptchaCode.toUpperCase(),
        captchaId: this.getCaptchaId,
      });
    },

    getCaptchaCode() {
      return this.userInput;
    },

    spread(initArr, addArr) {
      var addArrKeys = Object.keys(addArr);
      for (var i = 0; i < addArrKeys.length; i++) {
        initArr[addArrKeys[i]] = addArr[addArrKeys[i]];
      }
    },

    getScript(url, callback) {
      this.ajax(url, function (responseText) {
        var f = new Function(responseText);
        f();
        if (typeof callback === "function") {
          callback();
        }
      });
    },

    addValidateEvent(captchaInstance) {
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

    valUnsafe(captchaInstance, callback) {
      var captchaCode = captchaInstance.userInput.value;
      this.ajax(captchaInstance.validationUrl + "&i=" + captchaCode, function (isHuman) {
        isHuman = isHuman == "true";
        callback(isHuman);
      });
    },

    useUserInputBlurValidation(userInput) {
      return userInput.getAttribute("data-correct-captcha") !== null;
    },
    // change relative to absolute urls in captcha html markup
    changeRelativeToAbsoluteUrls(originCaptchaHtml, captchaEndpoint) {
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

    getHtml(captchaStyleName, captchaEndpoint, callback) {
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
    getCaptchaEndpointHandler(captchaEndpoint) {
      var splited = captchaEndpoint.split("/");
      return splited[splited.length - 1];
    },

    // get backend base url from configued captchaEndpoint value
    getBackendBaseUrl(captchaEndpoint, captchaEndpointHandler) {
      var lastIndex = captchaEndpoint.lastIndexOf(captchaEndpointHandler);
      return captchaEndpoint.substring(0, lastIndex);
    },

    ajax(url, callback) {
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

    addCustomEventPolyfill() {
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

    getCaptchaStyleName() {
      let styleName;

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
    getInstance() {
      let instance = null;

      if (typeof window.botdetect !== "undefined") {
        const captchaStyleName = this.getCaptchaStyleName();
        instance = window.botdetect.getInstanceByStyleName(captchaStyleName);
      }

      return instance;
    },

    displayHtml(captchaStyleName) {
      let self = this;
      this.getHtml(captchaStyleName, this.url, function (captchaHtml) {
        document.getElementById("BDC_CaptchaComponent").innerHTML = captchaHtml;
        self.loadScriptIncludes(captchaStyleName);
      });
    },
    reloadImage() {
      this.getInstance().reloadImage();
      this.$emit("input", []);
    },
    validateUnsafe(callback) {
      let instance = this.getInstance();
      this.valUnsafe(instance, function (isHuman) {
        callback(isHuman);

        if (!this.useUserInputBlurValidation(instance.userInput) && !isHuman) {
          instance.reloadImage();
        }
      });
    },
    generateCaptchaMarkup(captchaStyleName) {
      this.captchaStyleName = captchaStyleName;
      this.displayHtml(captchaStyleName);
    },
    loadScriptIncludes(captchaStyleName) {
      var self = this;
      let captchaIdElement = document.getElementById("BDC_VCID_" + captchaStyleName);

      if (captchaIdElement) {
        let captchaId = captchaIdElement.value;
        let scriptIncludeUrl =
          this.url + "?get=script-include&c=" + captchaStyleName + "&t=" + captchaId + "&cs=203";
        this.getScript(scriptIncludeUrl, function () {
          // register user input blur validation
          let instance = self.getInstance();

          if (instance) {
            self.addValidateEvent(instance);
          } else {
            console.error("window.botdetect undefined.");
          }
        });
      }
    },
  },
  beforeMount() {
    this.addCustomEventPolyfill();
  },
  mounted() {
    if (this.url) {
      let captchaStyleName = this.getCaptchaStyleName();
      this.displayHtml(captchaStyleName);
    }
  },
};
</script>
