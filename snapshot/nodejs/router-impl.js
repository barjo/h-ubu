var url = require("url");
var contracts = require("./contracts");

var component = {
    errorHandler : null,
    pages : [],
    configure:function (hub) {
        hub
            .provideService({
                contract:contracts.router,
                component:this
            })
            .requireService({
                contract:contracts.error,
                component:this,
                optional:true,
                field:"errorHandler"
            })
            .requireService({
                contract : contracts.page,
                component: this,
                optional : false,
                aggregate: true,
                field : "pages"
            });
    },
    start : function() { console.log("Router started"); },
    stop : function() { console.log("Router stopped"); },
    getComponentName : function() { return "router"; },

    // Contract implementation
    onRequest : function(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");

        // Check if we have a page
        for ( var i = 0; i < this.pages.length; i++) {
            if (this.pages[i].path() === pathname) {
                console.log("Matching page service found");
                // Render the page and return
                response.writeHead(200, {"Content-Type":"text/plain"});
                response.write(this.pages[i].render());
                response.end();
                return;
            }
        }

        // Not Found
        console.log("Page not found...");
        var message = "Page not found";
        if (this.errorHandler != null) {
            message = this.errorHandler.render();
        }
        response.writeHead(404, {"Content-Type":"text/plain"});
        response.write(message);
        response.end();
    }
};

exports.component = component;