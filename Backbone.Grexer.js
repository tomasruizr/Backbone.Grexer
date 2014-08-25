/**
 * Backbone with some other Love from Grexer in a super lightweight fasion.
 * (c) 2014 Tomás Ruiz
 *
 * Basically adds:
 * * Single or two way binding possibilities to the models with the views in the DOM.
 * * Use of Computed properties in the models and views.
 *
 * @module Backbone.Grexer.js
 * @main
 */

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
    /**
     * Class that extends Backbone.Model to add use of computed values.
     *
     * @class Backbone.Grexer.Model
     */
    Grexer.Model = Backbone.Model.extend({
        /**
         * Defines the attributes that are computeds in a view. For each
         *         Attribute will be a get method exposed to return the value of
         *         the computed value.
         *
         * @type {Object}
         */
        computeds:{},
        /**
         * Override of the Get function to include the computed values like if
         *         they where attributes of the model. In spite they are not
         *         synced.
         *
         * @method get
         *
         * @param  {String} attribute The Attribute to get from the model.
         *
         * @return {Object}           Returns the value of the Attribute.
         */
        get: function(attribute) {
            // Return a computed property value, if available:
            if (this.computeds[attribute]) {
                return this.computeds[attribute].get(this);
            }
            //return the Backbone.Model 'get' function.
            return Backbone.Model.prototype.get.call(this, attribute);
        },
        /**
         * Override of the save method to avoid saving the computed fields in
         *         the server when syncing as well as any other field in the
         *         'ignore' array of the model.
         *
         * @method save
         *
         * @param  {Object|String} key     The Attribute name (string), or an
         *         object with a key value store of all the fields to be changed
         *         and synced.
         * @param  {Object} value   Object with the the value if the first
         *         parameter is a string or a key value store of the options.
         * @param  {Object} options Key value store of the options.
         *
         * @return {Object}         XRS response as in Backbone.save.
         */
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
    /**
     * Class that extends Backbone.View to add use of Binds with the model.
     *
     * @class Backbone.Grexer.View
     */
    Grexer.View = Backbone.View.extend({
        events:{},
        /**
         * Store of all the computed values of the view-model. the structure of
         *         each one is: name_of_the_computed, Function of the get
         *         method, ussually affects the DOM and return the computed
         *         value, Array of attributes to observe that triggers the
         *         recalculation in case of change.
         *
         * @type {Object}
         */
        computeds:{},
        /**
         * Override of the constructor.
         *
         * @method constructor
         *
         * @param  {Object}    attributes All posible configuration for the View.
         */
        constructor: function(attributes) {
            Backbone.View.call(this, attributes);
            //bind all the computed values
            this.initComputeds();
            //Make sure all the DOM events are in place for the view.
            this.delegateEvents();
        },
        /**
         * Method that initialize and bind all the computed fields not only in
         *         the view but also in the model.
         *
         * @method initComputeds
         */
        initComputeds:function () {
            this.computeds = {};
            this.model.computeds = {};
            for (var name in this.computeds) {
                this.AddComputed(name, this.computeds[name].get, this.computeds[name].observe);
                //this._observeComputed(this.computeds[name].get, this.computeds[name].observe);
            };
        },
        /**
         * Adds a Computed property to the View, and the Model.
         *
         * @method AddComputed
         *
         * @param  {String}    computedName The name of the computed attribute,
         *         is the same name that will be used latter to acces the value
         *         in the model.
         * @param  {Function}    computeFunc  The function that performs the
         *         calculation of the computed value. This functions receives no
         *         parameters and return the value of the attribute. In this
         *         function is opt to the user to affect the DOM.
         * @param  {Array}    observeArr   The name of the model attributes that
         *         will be observed and trigger the recalculation of the field
         *         when change.
         */
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
        /**
         * Binds the events to the observe attributes and retriger calculation of
         *         computed attributes on change.
         *
         * @method _observeComputed
         *
         * @param  {Function}    computeFunc  The function that performs the
         *         calculation of the computed value. This functions receives no
         *         parameters and return the value of the attribute. In this
         *         function is opt to the user to affect the DOM.
         * @param  {Array}    observeArr   The name of the model attributes that
         *         will be observed and trigger the recalculation of the field
         *         when change.
         */
        _observeComputed: function (computeFunc, observeArr) {
            if (observeArr && observeArr.length > 0) {
                for (var cont = 0; cont < observeArr.length; cont++) {
                    this.listenTo(this.model, 'change:' + observeArr[cont], computeFunc);
                };
            } else {
                this.listenTo(this.model, 'change', computeFunc);
            }
        },

        /**
         * Bind the DOM element with the Model Attribute in whichever way.
         *
         * @method bind
         *
         * @param  {String} element    Element descriptor. Example '#element_id' or '.class_name'.
         * @param  {String} modelAtt   Model Attribute. Example 'firt_name'
         * @param  {String|bool} event      Name of the jquery DOM event to listen in the element. if false the binding will be done only in the Model->DOM direction.
         * @param  {String|bool} modelEvent Name of the Backbone.Event event to listen in the Model. if false the binding will be done only in the DOM->Model direction.
         */
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
        /**
         * Predefinition of the Render Method where the template specified by
         *         convention in the View Definition will be populated with the
         *         Model Attributes.
         *
         * @method render
         *
         * @return {Backbone.Grexer.View} The view itself for chaining calls.
         */
        render: function () {
            if(this.template) {
                this.$el.html(this.template(this.model.attributes));
            }
            return this;
        }
    });
}));
