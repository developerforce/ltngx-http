({
    listener: null,
    
    setupMessageListener: function(component) {
        var self = this;
        if (self.listener !== null && typeof self.listener !== "undefined") {
            window.removeEventListener("message", self.listener);
        }
        
        self.listener = function(event) {
            self.handleMessage(component, event);
        };
        window.addEventListener("message", self.listener, false);
        
        var vf_proxy = document.getElementById("vf_proxy_frame");
        if (vf_proxy) {
            setTimeout(function() {
	            vf_proxy.src = vf_proxy.src;
            }, 1000);
        } else {
            vf_proxy = document.createElement("iframe");
            vf_proxy.id = "vf_proxy_frame";
            vf_proxy.src = $A.clientService.$_host$ + "/apex/c__proxy?ltng_origin=" + window.location.origin;
            document.body.appendChild(vf_proxy);
        }
    },
    
    fireReady: function(component) {
        var evt = component.get("e.ready");
        if (typeof evt !== "undefined" && evt !== null) {
	        evt.fire();
        }
    },
    
    handleMessage: function(component, event) {
        var data = event.data;
        var self = this;
        if (data.type === "ready") {
            var origin_url = event.origin;
            component.set("v.vf_origin_url", origin_url);
            self.fireReady(component);
        } else if (data.type === "response") {
            self.handleResponse(component, data.response);
        } else if (data.type === "success") {
            console.warn("success");
        } else if (data.type === "error") {
            console.warn("error");
        }
        return;
    },
    
    sendMessage: function(component, xhrConfig) {
        var origin_url = component.get("v.vf_origin_url");
        if (typeof origin_url !== "undefined") {
            /*
            var vf_cmp = component.find("vf_frame");
            var vf_frame = vf_cmp.getElement();
            var vf_win = vf_frame.contentWindow;
            */
            var vf_proxy = document.getElementById("vf_proxy_frame");
            var vf_win = vf_proxy.contentWindow;
            vf_win.postMessage({type: "request", xhrConfig: xhrConfig}, origin_url);
        }
    },
    
    argsToMap: function(obj, sp) {
        var map = {};
        var delim = new RegExp("[=:]", "g");
        var tokens = null;
        if (typeof obj === "string") {
            if (sp === null || typeof sp === "undefined") {
            	sp = obj.indexOf("\u000d\u000a") >= 0 ? "\u000d\u000a" : ",";   
            }
            var o = obj.split(sp);
            for (var i = 0; i < o.length; i++) {
                tokens = o[i].replace(" ", "").split(delim);
                map[tokens[0]] = tokens[1];
            }
        } else if (typeof obj === "object" && obj !== null) {
            if (obj instanceof Array || obj.length > 0) {
                for (var i = 0; i < obj.length; i++) {
                    tokens = obj[i].replace(" ", "").split(delim);
                    map[tokens[0]] = tokens[1];
                }
            } else {
                for (var key in obj) {
                    map[key] = obj[key];
                }
            }
        }
        return map;
    },
    
    createRequest: function() {
        var xhr = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }
        return xhr;
    },
    
    execRequest: function(component, config) {
        var t1 = null;
        var t2 = null;
        t1 = Date.now();
        
        var self = this;
        
        // Set the request params based on the component attributes
        var url = component.get("v.url");
        var method = component.get("v.method");
        var params = component.get("v.params");
        var headers = component.get("v.headers");
        var responseType = component.get("v.responseType");
        var reqbody = component.get("v.reqbody");
        var storable = component.get("v.storable");
        
        // If the config.req object exists, override values
        if (typeof config !== "undefined" && config.req) {
            url = config.req.url ? config.req.url : url;
            method = config.req.method ? config.req.method : method;
            params = config.req.params ? config.req.params : params;
            headers = config.req.headers ? config.req.headers : headers;
            responseType = config.req.responseType ? config.req.responseType : responseType;
            reqbody = config.req.body ? config.req.body : reqbody;
            reqbody = config.req.data ? config.req.data : reqbody;
            storable = config.req.storable ? config.req.storable : storable;
        }
        
        // Has to be uppercase? Is this Apex or something else?
        method = method.toUpperCase();
        
        var headersMap = this.argsToMap(headers);
        var paramsMap = this.argsToMap(params, "&");
        
        var sep = url.indexOf("?") >= 0 ? "&" : "?";
        for (var k in paramsMap) {
            url += sep + k + "=" + paramsMap[k]
            sep = "&";
        }
        
        url = encodeURI(url);
        
        var xhrConfig = {
            url: url,
            method: method,
            headers: headersMap,
            responseType: responseType
        };
        
        if (reqbody && reqbody.length > 0) {
            xhrConfig.body = reqbody;    
        }
        
        /*
        var config = {
            url: url
        };
        */
        
        // Store the xhr config
        component.set("v.config", config);       

       	self.sendMessage(component, xhrConfig);
    },
    
    handleResponse: function(component, response) {
        var self = this;
        var xhrConfig = response.xhrConfig;
        var config = component.get("v.config");
        var statusCode = response.status;
        var responseEvent = null;
        var responseFunc = null;
        if (statusCode.toString().match(new RegExp("^2"))) {
            responseEvent = component.getEvent("success");

            if (config && typeof config.success === "function") {
                responseFunc = config.success;
            }

        } else {
            responseEvent = component.getEvent("error");

            if (config && typeof config.error === "function") {
                responseFunc = config.error;
            }

        }
        
        var headerMap = self.argsToMap(response.headers);
        t2 = Date.now();
        var params = {
            url: xhrConfig.url,
            body: JSON.stringify(response.body),
            headers: headerMap,
            status: response.statusText,
            statusCode: response.status,
            clientTime: response.clientTime
        };
        responseEvent.setParams(params);
        responseEvent.fire();
        if (typeof responseFunc === "function") {
            responseFunc(response.body, response.status, headerMap, xhrConfig.req);
        }        
    },
    
    exec: function(component, event) {
      	this.execRequest(component, this);
    },
    
    execFunc: function(component, req, success, error) {
        var config = {};
        for (var i = 1; i < arguments.length; i++) {
            if (typeof arguments[i] === "string") {
                config.req = {
                    url: arguments[i]
                };
            } else if (typeof arguments[i] === "object") {
                config.req = arguments[i];
            } else if (typeof arguments[i] === "function") {
                if (typeof config.success === "undefined") {
                    config.success = arguments[i];
                } else {
                    config.error = arguments[i];
                }
            }
        }
        var self = this;
        $A.run(function() {
            self.execRequest(component, config);
        });
    },
    
    setup: function(component) {
        // Create the $ltngx object
        if (typeof $ltngx === "undefined") {
            $ltngx = {};
        }
        // Create the $ltngx.http function
        //if (typeof $ltngx.http === "undefined") {
            var self = this;
            $ltngx.http = function(req, success, error) {
                self.execFunc(component, req, success, error);
            }
        //}
    }
})