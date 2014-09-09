
/**
 * Backbone with some other Love from Grexer in a super lightweight fasion.
 * (c) 2014 Tomás Ruiz
 *
 * Basically adds:
 * * Single or two way binding possibilities to the models with the views in the DOM.
 * * Use of Computed properties in the models and views.
 * * Validation of the model
 *
 * @module Backbone.Grexer.js
 * @main
 */

(function(root, factory) {

    if (typeof exports !== 'undefined') {
        // Define as CommonJS export:
        module.exports = factory(require("lodash"), require("backbone"), require("./Validate.js"));
    } else if (typeof define === 'function' && define.amd) {
        // Define as AMD:
        define(["lodash", "backbone", "validate"], factory);
    } else {
        // Just run it:
        factory(root._, root.Backbone, root.Validate);
    }

}(this, function(_, Backbone, Validate) {
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
         * Override constructor in order to create the defaults
         *
         * @method constructor
         */
        constructor: function(attributes, options){
            var opts = options || {};
            opts['validate'] = false;
            Backbone.Model.call(this, attributes, opts);
            //initialize all the computed values
            this.initComputeds();
            //initialize all the formated values
            this.initFormateds();
        },
        /**
         * Defines the attributes that are computed in a view. For each
         *         Attribute will be a get method exposed to return the value of
         *         the computed value.
         *
         * @type {Object}
         */
        computed:{},
        /**
         * Array of Error message descriptions
         *
         * @type {Array}
         */
        errors: {},
        /**
         * Override of The validate function that triggers the validations in the model.
         *
         * @method validate
         *
         * @param  {[type]} attrs   [description]
         * @param  {[type]} options [description]
         *
         * @return {[type]}         [description]
         */
        validate: function(attrs, options){
            if (this.validations && Object.keys(this.validations).length >= 1){
                var v = new Validate(); 
                var res = v.validate(this.validations, attrs);
                // errors will be set to an empty object in case there are no erros
                // for further validation
                this.errors = res;
                if (Object.keys(res).length != 0){
                    return false;
                }
            }
            return true;
        },
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
        // get: function(attribute) {
        //     // Return a formated property value
        //     // if (this.formated[attribute]) {
        //     //     return this.formated[attribute].get(this);
        //     // }
        //     //return the Backbone.Model 'get' function.
        //     return Backbone.Model.prototype.get.call(this, attribute);
        // },
        /**
         * Set override to check if the attributes being set are present in the
         *         _validations_ property of the model
         *
         * @method set
         *
         * @param  {Object|String} key     The Attribute name (string), or an
         *         object with a key value store of all the fields to be changed
         *         and synced.
         * @param  {Object} value   Object with the the value if the first
         *         parameter is a string or a key value store of the options.
         * @param  {Object} options Key value store of the options.
         */
        set: function(key, val, options) {
            var attrs;
            if (key == null) return this;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }
            options || (options = {}); 
            var self = this;

            //////////////////////////////////////
            //check for computed and formateds //
            //////////////////////////////////////
            var comps = [];
            _.forIn(attrs, function(value, key){
                if (_.has(self.computed, key)){
                    self.computed[key].set(self, value);
                } else {
                    return;
                }
                self.trigger('change:'+ key, self);
                comps.push(key);
            });
            //remove computed or formated fields from the set.
            attrs = _.omit(attrs, comps);
            if (Object.keys(attrs).length == 0) return;

            /////////////
            //validate //
            /////////////
            // when is false, not validate since it is most likelly called from the construction
            // initializing the defaults. it is not a good practice to call the set with the
            // validate = false attribute, is much better to just not include it if the validation
            // is not required.
            // 
            // si es false no va a validat
            // si es undefined va a validar y setear
            // si es true va a validar y setear solo si es true.
            if (options.validate !== false) {
                //Validates if the attribute that is being set is present in the validation property of the model
                if (!this.validate(attrs, options)) {
                    this.trigger('invalid', attrs);
                    if (options.validate === true) return false;
                } else {
                    this.trigger('valid', attrs);
                }
                options.validate = false;
            }

            /////////////////
            //Backbone Set //
            /////////////////
            return Backbone.Model.prototype.set.call(this, attrs, options);
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
            //exclude computed and every thing in the ignore array from being synced.
            var self = this;
            _.forIn(attributes, function(value, key){
                if (_.has(this.formated, key)){
                    self.attibutes[key] = self.formated[key].get(self);
                }
            });
            var attrs = _.omit(attributes,this.ignore);
            opts.data = JSON.stringify();
            opts.contentType = "application/json";

            //Finally, make a call to the default save
            return Backbone.Model.prototype.save.call(this, attributes, opts);
        },
        /**
         * Overrides the parse funtion to support fotmated values.
         *
         * @method parse
         *
         * @return {object} The attributes hash representation for the model.
         */
        parse: function(resp, options){ 
            var self = this;
            _.forIn(resp, function(value, key){
                if (_.has(this.formated, key)){
                    resp[key] = self.formated[key].set(self, value);
                }
            });
            return resp;
        },
        /**
         * Method that initialize and bind all the computed fields not only in
         *         the view but also in the model.
         *
         * @method initComputeds
         */
        initComputeds:function () {
            for (var name in this.computed) {
                this.AddComputed(name, this.computed[name], true);
            };
        },
        initFormateds: function (){
            for (var name in this.formated) {
                this.AddComputed(name, this.formated[name]);
            };
        }
        /**
         * Adds a Computed property to the View, and the Model.
         *
         * @method AddComputed
         *
         * @param  {String}    name The name of the computed attribute, is the
         *         same name that will be used latter to acces the value in the
         *         model.
         * @param  {object}    computed  Object that contains the definition of
         *         the computed Field. It's structor is: Get: The get function
         *         for getting it's value, receive no parameters and returs the
         *         calculation result. Set: function that stores the attributes
         *         values from the calculated input, performing a reverse
         *         calculation. observe: The name of the model attributes that
         *         will be observed and trigger the recalculation of the field
         *         when change.
         * @param  {bool} init specifies if the attribute should be initialized
         *         in the attributes hash in the model
         */
        AddComputed: function (name, computed, init) {
            
            this.computed[name] = {
                get: computed.get,
                set: computed.set,
                observe: computed.observe
            };
        
            //Add the computed to the model if present
            if (this && this != {}){
                //*******************************************
                // WARNING: string replacing the 'this' to 'this' when attaching the get function to the model.
                // whenever difining a computed field in a view, use this to access the model data.
                //*******************************************
                this.computed[name] = {};
                if (computed.get){
                    var GetFnBody = computed.get.toString().substring(computed.get.toString().indexOf("{") + 1, computed.get.toString().lastIndexOf("}"));
                    var GetF = new Function('self', GetFnBody.replace(/this/g,'self'));
                    this.computed[name]['get'] = function(self){
                        return GetF(self);
                    };
                    if (init) this.attributes[name] = this.computed[name].get(this);
                }
                if (computed.set){
                    var SetFnBody = computed.set.toString().substring(computed.set.toString().indexOf("{") + 1, computed.set.toString().lastIndexOf("}"));
                    var SetF = new Function('self', 'value', SetFnBody.replace(/this/g,'self'));
                    this.computed[name]['set'] = function(self, value){
                        return SetF(self, value);
                    };
                }
                //add the computed name to the ignore list of attributes to sync.
                if (computed.ignore !== false){
                    this.ignore = this.ignore||[];
                    this.ignore.push(name);
                }
                //bind the corresponding observables to update the computed field.
                if (computed.observe){
                    this._observeComputed(name, computed.observe);
                }
            }
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
        _observeComputed: function (name, observeArr) {
            if (observeArr && observeArr.length > 0) {
                for (var cont = 0; cont < observeArr.length; cont++) {
                    this.listenTo(this, 'change:' + observeArr[cont], function(){
                        this.attributes[name] = this.computed[name].get(this);
                        this.trigger('change:' + name, this);
                    });
                };
            }
        },
    });

    //**************************************************************************************************
    // Grexer.Collection
    //**************************************************************************************************
    Grexer.Collection = Backbone.Collection.extend();
    //**************************************************************************************************
    // Grexer.View
    //**************************************************************************************************
    /**
     * Class that extends Backbone.View to add use of Binds with the model.
     *
     * @class Backbone.Grexer.View
     */
    Grexer.View = Backbone.View.extend({
        /**
         * Object that stores the messages with the errors for the model validation.
         *
         * @type {Object}
         */
        em: {},
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
        computed:{},
        /**
         * Stores a map of the DOM elements associated with the errors of Validation in the model.
         *
         * @type {Object}
         */
        validationElements:{},
        /**
         * Override of the constructor.
         *
         * @method constructor
         *
         * @param  {Object}    attributes All posible configuration for the View.
         */
        constructor: function(attributes) {
            //call the Backbone constructor fot the view.
            Backbone.View.call(this, attributes);
            if (this.model){
                //Bind errors to the view.
                this.bindErrors();
            }
        },
        

        /**
         * Bind the DOM element with the Model Attribute in whichever way.
         *
         * @method bind
         *
         * @param  {String|Object} element    Element descriptor. Example
         *         '#element_id' or '.class_name'. In case is an Object, it
         *         spects and object with the same attributes as the parameters
         *         of this function for its configuration. example:
         *         ```javascript
         *         {
         *             element: '#first_name',
         *             modelAtt: 'first_name',
         *             event: 'click',
         *             modelEvent: 'change',
         *             errorElement: '#first_name_valid'
         *         }
         *         ```
         * @param  {String} modelAtt   Model Attribute. Example 'firt_name'
         * @param  {String|bool} event      Name of the jquery DOM event to
         *         listen in the element. if false the binding will be done only
         *         in the Model->DOM direction.
         * @param  {String|bool} modelEvent Name of the Backbone.Event event to
         *         listen in the Model. if false the binding will be done only
         *         in the DOM->Model direction.
         */
        bind: function (element, modelAtt, event, modelEvent, errorElement) {
            if (typeof element == 'object'){
                this.bind(element.element, element.modelAtt, element.event, element.modelEvent, element.errorElement);
                return;
            }
            else{
                if (element && !(modelAtt && event && modelEvent && errorElement)){
                    this.bind(element, element.substring(1), 'focusout', 'change', element + '_valid');
                    return;
                }
            }
            // view Bind
            if (event) {
                if (this.$(element).length <= 0){
                    console.error('The element ' + element + ' is not found in the view.');
                    return;
                }
                this.events[event + ' ' + element] = function () {
                    var newVal = this.$(element).attr('value') ? this.$(element).val() : this.$(element).text();
                    if (this.model.get(modelAtt) !== newVal)
                        this.model.set(modelAtt, newVal );
                }
            }
            //Att Bind
            if (modelEvent) {
                if (!this.model.has(modelAtt)){
                    console.error('The model doesn\'t have an attribute with the name ' + modelAtt);
                    return;
                }
                this.listenTo(this.model, modelEvent + ':' + modelAtt, function () {
                    var actualVal = this.$(element).attr('value') ? this.$(element).val() : this.$(element).text(); 
                    if (actualVal !== this.model.get(modelAtt))
                        this.$(element).attr('value') ? this.$(element).val(this.model.get(modelAtt)) : this.$(element).text(this.model.get(modelAtt))
                 }, this);
            }
            if (errorElement){
                this.validationElements[element.substring(1)] = errorElement;
            }
        },
        /**
         * Bind the error of model validation to the respective DOM elements.
         *
         * @method bindErrors
         */
        bindErrors: function(){
            if (!this.model) return;
            if (!this.model.validations || Object.keys(this.model.validations).length < 1) return;
            this.listenTo(this.model, 'invalid', function(attrs){
                for (element in this.model.errors){
                    if (this.$(this.validationElements[element]).attr('value'))
                        this.$(this.validationElements[element]).value(
                            this.prepareErrorMssg(
                                this.model.errors[element]
                                , element
                                , this.model.validations[element]
                                )
                            );
                        // this.$(this.validationElements[element]).value(this.model.errors[element].join(', '));
                    else
                        this.$(this.validationElements[element]).text(
                            this.prepareErrorMssg(
                                this.model.errors[element]
                                , element
                                , this.model.validations[element]
                                )
                            );
                        // this.$(this.validationElements[element]).text(this.model.errors[element].join(', '));
                }
            })
            this.listenTo(this.model, 'valid', function(attrs){
                for (element in attrs){
                    if (this.$(this.validationElements[element]).attr('value'))
                        this.$(this.validationElements[element]).value('');
                    else
                        this.$(this.validationElements[element]).text('');
                }
            })
        },
        prepareErrorMssg:function(errors, element, validations){
            if (Object.keys(this.em).length != 0){
                var arr = [];
                var m;
                for (var cont = errors.length - 1; cont >= 0; cont--) {
                    if (validations.errMssg && validations.errMssg[errors[cont]])
                        m = validations.errMssg[errors[cont]];
                    else
                        m = this.em[errors[cont]]
                    arr.push(this.stringFormat(m, element, validations[errors]));
                };
                return arr.join(', ');
            }

        },
        stringFormat: function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) { 
                return typeof args[number] != 'undefined'
                    ? args[number] 
                    : match
                ;
            });
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
                var obj = {};
                if (this.model) obj = this.model.attributes;
                if (this.collection) obj = {'collection':this.collection.models};
                this.$el.html(this.template(obj));
                if (this.bindings)
                    this.bindings();
                this.bindErrors();
                this.delegateEvents();

            }
            return this;
        }
    });
}));
