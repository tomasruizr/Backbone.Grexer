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
    Grexer.Model = Backbone.Model.extend({
        computeds:{},
        get: function(attribute) {
            // Return a computed property value, if available:
            if (this.computeds[attribute]) {
                return this.computeds[attribute].get(this);
            }
            return Backbone.Model.prototype.get.call(this, attribute);
        },
        save : function(key, value, options) {
            var attributes, opts;
            
            if (_.isObject(key) || key == null) {
                attributes = key || this.attributes;
                opts = value || {};
            } else {
                attributes = {};
                attributes[key] = value;
                opts = options || {};
            }
            //exclude computeds and every thing in the ignore array from being synced.
            opts.data = JSON.stringify(_.omit(attributes,this.ignore));
            opts.contentType = "application/json";

            //Finally, make a call to the default save
            return Backbone.Model.prototype.save.call(this, attributes, opts);
        }
    });
    //**************************************************************************************************
    // Grexer.View
    //**************************************************************************************************
    //
    Grexer.View = Backbone.View.extend({
        events:{},
        computeds:{},
        constructor: function(attributes) {
            Backbone.View.call(this, attributes);
            this.initComputeds(attributes);
            this.delegateEvents();
        },
        initComputeds:function (attributes) {
            for (var name in this.computeds) {
                this.AddComputed(name, this.computeds[name].get, this.computeds[name].observe);
                //this._observeComputed(this.computeds[name].get, this.computeds[name].observe);
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
            if (!this.computeds[computedName]){
                this.computeds[computedName] = {
                    get: computeFunc,
                    observe: observeArr
                };
            }
            //Add the computed to the model if present
            if (this.model && this.model != {}){
                //*******************************************
                // WARNING: string replacing the 'this.model' to 'this' when attaching the get function to the model.
                // whenever difining a computed field in a view, use this.model to access the model data.
                //*******************************************
                var fnBody = computeFunc.toString().substring(computeFunc.toString().indexOf("{") + 1, computeFunc.toString().lastIndexOf("}"));
                var f = new Function('self', fnBody.replace(/this.model/g,'self'));
                this.model.computeds[computedName] = {
                    get: function(self){
                        return f(self);
                    }
                };
                //add the computed name to the ignore list of attributes to sync.
                this.model.ignore = this.model.ignore||[];
                this.model.ignore.push(computedName);
            }
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