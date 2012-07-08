/*
 * Copyright 2010 akquinet
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe("H-UBU Service Extension Tests - Service Dependencies", function () {

    afterEach(function () {
        hub.reset();
    });

    it("should support adding a service dependency from outside and track the dynamism", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : null,
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"}
        };

        hub.registerComponent(component).start();

        hub.requireService({
            component: component,
            contract: contract,
            field : "svc"
        });

        expect(component.svc).toBeNull();

        var prov = {
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract)
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "hello" }
        }

        hub.registerComponent(prov);
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.doSomething()).toBe("hello");

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc).toBeNull();

    });

    it("should support adding a service dependency from the component and track the dynamism", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : null,
            configure : function(hub) {
                this.hub = hub;
                hub.requireService({
                    component: this,
                    contract: contract,
                    field : "svc"
                });
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"}
        };

        hub.registerComponent(component).start();
        expect(component.svc).toBeNull();

        var prov = {
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract)
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "hello" }
        }

        hub.registerComponent(prov);
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.doSomething()).toBe("hello");

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc).toBeNull();

        //Remove the component
        hub.unregisterComponent(component);
        // Check that no notification are sent
        hub.registerComponent(prov);
        expect(component.svc).toBeNull();
    });

    it("should support adding a service dependency from outside and inject the service using bind/unbind", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : null,
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"},
            bind : function(svc) {
                this.svc = svc
            },
            unbind : function(svc) {
                if (svc === this.svc) {
                    this.svc = null
                }
            }

        };

        hub.registerComponent(component).start();

        hub.requireService({
            component: component,
            contract: contract,
            bind : component.bind,
            unbind : "unbind"
        });

        expect(component.svc).toBeNull();

        var prov = {
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract)
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "hello" }
        }

        hub.registerComponent(prov);
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.doSomething()).toBe("hello");

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc).toBeNull();

    });

    it("should support aggregate service dependencies using bind/unbind", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : [],
            configure : function(hub) {
                this.hub = hub
                hub.requireService({
                    component: component,
                    contract: contract,
                    bind : this.bind,
                    unbind : "unbind",
                    aggregate : true
                });
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"},
            bind : function(svc) {
                this.svc.push(svc)
            },
            unbind : function(svc) {
                HUBU.UTILS.removeElementFromArray(this.svc, svc)
            }

        };

        hub.registerComponent(component).start();

        expect(component.svc.length).toBe(0);

        var prov = {
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract)
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "hello" }
        }

        hub.registerComponent(prov);
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);
        expect(component.svc[0].doSomething()).toBe("hello");

        // Register the service another time
        var reg = hub.registerService(prov, contract)
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(2);
        expect(component.svc[0].doSomething()).toBe("hello");
        expect(component.svc[1].doSomething()).toBe("hello");

        // Unregister a service
        hub.unregisterService(reg)
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);
        expect(component.svc[0].doSomething()).toBe("hello");

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc.length).toBe(0);
    });

    it("should support aggregate service dependencies using field", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : [],
            configure : function(hub) {
                this.hub = hub
                hub.requireService({
                    component: component,
                    contract: contract,
                    field : "svc",
                    aggregate : true
                });
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"}
        };

        hub.registerComponent(component).start();

        expect(component.svc.length).toBe(0);

        var prov = {
            configure : function(hub) {
                this.hub = hub
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract)
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "hello" }
        }

        hub.registerComponent(prov);
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);
        expect(component.svc[0].doSomething()).toBe("hello");

        // Register the service another time
        var reg = hub.registerService(prov, contract)
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(2);
        expect(component.svc[0].doSomething()).toBe("hello");
        expect(component.svc[1].doSomething()).toBe("hello");

        // Unregister a service
        hub.unregisterService(reg)
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);
        expect(component.svc[0].doSomething()).toBe("hello");

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc.length).toBe(0);
    });

    it("should support filtered aggregate service dependencies using field", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : [],
            configure : function(hub) {
                this.hub = hub
                hub.requireService({
                    component: component,
                    contract: contract,
                    field : "svc",
                    aggregate : true,
                    filter: function(ref) {
                        return "fr" === ref.getProperty("lg");
                    }
                });
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"}
        };

        hub.registerComponent(component).start();

        expect(component.svc.length).toBe(0);

        var prov = {
            configure : function(hub, conf) {
                this.hub = hub;
                this.lg = conf["lg"];
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract, {"lg" : this.lg})
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "bonjour" }
        }

        hub.registerComponent(prov, {"lg" : "fr"});
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);
        expect(component.svc[0].doSomething()).toBe("bonjour");

        // Register the service another time
        var reg = hub.registerService(prov, contract, {"lg" : "en"})
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(1); // Does not match the filter

        reg.setProperties({"lg" : "fr"});
        // Now it matches the filter
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(2);

        reg.setProperties({"lg" : "en"});
        // Does not match anymore
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(1);

        // Unregister a service
        hub.unregisterService(reg)
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc.length).toBe(0);
    });

    /**
     * Also checks whether bind and unbind receives the service reference as second argument.
    */
    it("should support filtered aggregate service dependencies using bind/unbind", function() {
        var contract = {
            doSomething : function() {}
        };
        var self = this;
        var component = {
            hub : null,
            svc : [],
            configure : function(hub) {
                this.hub = hub
                hub.requireService({
                    component: component,
                    contract: contract,
                    bind : component.bind,
                    unbind : component.unbind,
                    aggregate : true,
                    filter: function(ref) {
                        return "fr" === ref.getProperty("lg");
                    }
                });
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"},
            bind : function(svc, ref) {
                if (ref === undefined || ref === null) {
                    self.fail("Invalid reference in the bind method");
                }
                this.svc.push(svc)
            },
            unbind : function(svc, ref) {
                if (ref === undefined || ref === null) {
                    self.fail("Invalid reference in the unbind method");
                }
                HUBU.UTILS.removeElementFromArray(this.svc, svc)
            }
        };

        hub.registerComponent(component).start();

        expect(component.svc.length).toBe(0);

        var prov = {
            configure : function(hub, conf) {
                this.hub = hub;
                this.lg = conf["lg"];
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract, {"lg" : this.lg})
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "bonjour" }
        }

        hub.registerComponent(prov, {"lg" : "fr"});
        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);
        expect(component.svc[0].doSomething()).toBe("bonjour");

        // Register the service another time
        var reg = hub.registerService(prov, contract, {"lg" : "en"})
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(1); // Does not match the filter

        reg.setProperties({"lg" : "fr"});
        // Now it matches the filter
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(2);

        reg.setProperties({"lg" : "en"});
        // Does not match anymore
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.length).toBe(1);

        // Unregister a service
        hub.unregisterService(reg)
        expect(hub.getServiceReferences(contract).length).toBe(1);
        expect(component.svc.length).toBe(1);

        hub.unregisterComponent(prov);
        expect(hub.getServiceReferences(contract).length).toBe(0);
        expect(component.svc.length).toBe(0);
    });

    it("should support filtered scalar service dependencies using field", function() {
        var contract = {
            doSomething : function() {}
        };

        var component = {
            hub : null,
            svc : null,
            configure : function(hub) {
                this.hub = hub
                hub.requireService({
                    component: component,
                    contract: contract,
                    field : "svc",
                    aggregate : false,
                    filter: function(ref) {
                        return "fr" === ref.getProperty("lg");
                    }
                });
            },
            start : function() {},
            stop : function() {},
            getComponentName : function() { return "my-component"}
        };

        hub.registerComponent(component).start();

        expect(component.svc).toBeNull();

        var prov = {
            configure : function(hub, configuration) {
                this.lg = "fr";
                this.hub = hub;
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract, {"lg" : this.lg})
            },
            stop : function() {},
            getComponentName : function() { return "my-provider"},
            doSomething : function() { return "bonjour" }
        };

        var prov2 = {
            configure : function(hub, conf) {
                this.hub = hub;
                this.lg = conf["lg"];
            },
            start : function() {
                this.reg = this.hub.registerService(this, contract, {"lg" : this.lg})
            },
            stop : function() {},
            getComponentName : function() { return "my-provider-2"},
            doSomething : function() { return "bonjour2" },
            change : function() {
                if (this.lg === "fr") {
                    this.lg = "en"
                } else {
                    this.lg = "fr"
                }
                this.reg.setProperties({"lg" : this.lg});
            }
        };

        hub
            .registerComponent(prov, {"lg" : "fr"})
            .registerComponent(prov2, {"lg" : "fr"});

        // Check injection.
        expect(hub.getServiceReferences(contract).length).toBe(2);
        expect(component.svc.doSomething()).toBe("bonjour");

        // Remove the first component
        hub.unregisterComponent(prov);
        // Substitution.
        expect(component.svc.doSomething()).toBe("bonjour2");

        // The second component (used) change its property.
        prov2.change();
        expect(component.svc).toBe(null);

        // Another change
        prov2.change();
        expect(component.svc.doSomething()).toBe("bonjour2");

        // prov comes back
        hub.registerComponent(prov);
        // prov2 leaves
        hub.unregisterComponent(prov2);
        expect(component.svc.doSomething()).toBe("bonjour");

        hub.unregisterComponent(prov);
        expect(component.svc).toBe(null);
    });



});