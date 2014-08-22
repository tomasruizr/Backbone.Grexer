// Backbone.Grexer
// (c) 2014 Tomás Ruiz

(function(root, factory) {

	if (typeof exports !== 'undefined') {
		// Define as CommonJS export:
		module.exports = factory(require("lodash"), require("backbone"));
	} else if (typeof define === 'function' && define.amd) {
		// Define as AMD:
		define(["lodash", "backbone"], factory);
	} else {
		// Just run it:
		factory(root._, root.Backbone);
	}

}(this, function(_, Backbone) {
	//Expose Namespace
    var Grexer = Backbone.Grexer = {};

    //**************************************************************************************************
    // Grexer.View
    //**************************************************************************************************
    Grexer.View = Backbone.View.extend({
        events:{},
        constructor: function(attributes, options) {
            Backbone.View.apply(this, arguments);
            this.initComputeds(arguments);
        },
    	initComputeds:function (attributes) {
            for (var name in this.computeds) {
                this._observeComputed(this.computeds[name].get, this.computeds[name].observe);
            };
        },
        
        bind: function (element, modelAtt, event, modelEvent) {
            if (event) {
                //view Bind
                this.events[event + ' ' + element] = function () {
                    this.model.set(modelAtt, $(element).attr('value') ? $(element).val() : $(element).text() );
                }
            }
            if (modelEvent) {
                //Att Bind
                this.listenTo(this.model, modelEvent + ':' + modelAtt, function () {
                    $(element).attr('value') ? $(element).val(this.model.get(modelAtt)) : $(element).text(this.model.get(modelAtt))
                 }, this);
            }
        },
        AddComputed: function (computedName, computeFunc, observeArr) {
            this.computeds[computedName] = {
                get: computeFunc,
                observe: observeArr
            };
            this._observeComputed(computeFunc, observeArr);
        },
        _observeComputed: function (computeFunc, observeArr) {
            if (observeArr && observeArr.length > 0) {
                for (var cont = 0; cont < observeArr.length; cont++) {
                    this.listenTo(this.model, 'change:' + observeArr[cont], computeFunc);
                };
            } else {
                this.listenTo(this.model, 'change', computeFunc);
            }
        },
        render: function () {
            if(this.template) {
                this.$el.html(this.template(this.model.attributes));
            }
            return this;
        }
    });
}));