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
    // Grexer.Model
    //**************************************************************************************************
    Grexer.View = Backbone.View.extend({
        computeds:{},
        get: function(attribute) {

            // Return a computed property value, if available:
            if (this.computeds(attribute)) {
                return this.computeds(attribute).get();
            }

            // Default to native Backbone.Model get operation:
            return Backbone.Model.apply(this, 'get', arguments);
        }
        save : function(key, value, options) {
            var attributes, opts;
            //Need to use the same conditional that Backbone is using
            //in its default save so that attributes and options
            //are properly passed on to the prototype
            if (_.isObject(key) || key == null) {
                attributes = key || this.attributes;
                opts = value || {};
            } else {
                attributes = {};
                attributes[key] = value;
                opts = options || {};
            }

            opts.data = JSON.stringify(_.omit(attributes,this.ignore));
            opts.contentType = "application/json";

            //Finally, make a call to the default save now that we've
            //got all the details worked out.
            return Backbone.Model.prototype.save.call(this, attributes, opts);
        }
    });
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
                this.AddComputed(name, this.computeds[name].get, this.computeds[name].observe);
                //this._observeComputed(this.computeds[name].get, this.computeds[name].observe);
            };
        },
        
        bind: function (element, modelAtt, event, modelEvent) {
            if (event) {
                var selector = $(element);
                //view Bind
                this.events[event + ' ' + element] = function () {
                    this.model.set(modelAtt, $(element).attr('value') ? selector.val() : selector.text() );
                }
            }
            if (modelEvent) {
                //Att Bind
                this.listenTo(this.model, modelEvent + ':' + modelAtt, function () {
                    selector.attr('value') ? $(element).val(this.model.get(modelAtt)) : $(element).text(this.model.get(modelAtt))
                 }, this);
            }
        },
        AddComputed: function (computedName, computeFunc, observeArr) {
            this.computeds[computedName] = {
                get: computeFunc,
                observe: observeArr
            };
            //add the computed name to the ignore list of attributes to sync.
            this.model.ignore.push(computedName);
            //bind the corresponding observables to update the computed field.
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