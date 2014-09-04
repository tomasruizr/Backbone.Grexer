/**
 * descriprion
 *
 * @module Grexer.Validate
 * @main Grexer.Validate
 */
//*******************************************
// Lib Initialize 
//*******************************************
(function(root, factory) {

	if (typeof exports !== 'undefined') {
		// Define as CommonJS export:
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		// Define as AMD:
		define([], function(){
			root.Validate = factory();
		});
	} else {
		// Just run it:
		root.Validate = factory();
	}

}(this, function() {
	/**
	 * [Grexer.Validate description]
	 *
	 * @class Grexer.Validate
	 * 
	 * @constructor
	 */ 
	var Validate = function(validations) {
	 	this.validations = validations;
	 	this.alpha = /^[a-zA-Z]+$/;
	  	this.alphanumeric = /^[a-zA-Z0-9]+$/;
	  	this.numeric = /^-?[0-9]+$/;
	  	this.int = /^(?:-?(?:0|[1-9][0-9]*))$/;
	  	this.float = /^(?:-?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/;
	  	this.email = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
	}
	//*******************************************
	//Methods
	//*******************************************
	Validate.prototype.validate = function(valids, attrs){
		if(!valids) valids = this.validations;
		var errors = {};
		for(att in attrs){
			if (valids[att]){
				var res = this.doValidate(valids[att], attrs[att]);
				if (res.length != 0) errors[att] = res;
			}
		}
		return errors;
	};

	Validate.prototype.doValidate = function(att, value){
		var res = [];
		if (att.required){
			if (!value || value.length == 0)
				res.push('required');
		}
		if (!value) return res;
		if (att.nested){
			if (value instanceof Array){
				for (var cont = value.length - 1; cont >= 0; cont--) {
					this.doValidate(att, value[cont]);
				};
			}
			else{
				res.push('array');
			}

		}
		if (att.minLength){
			if (value.length < att.minLength)
				res.push('minLength');
		}
		if (att.maxLength){
			if (value.length > att.maxLength)
				res.push('maxLength');
		}
		if (att.type){
			switch (att.type){
				case 'int':{
					if (!this.int.test(value))
						res.push('type:int');
				}
				case 'number':{
					if (!this.numeric.test(value))
						res.push('type:number');
				}
				case 'decimal':{
					if (!this.float.test(value))
						res.push('type:decimal');
				}
				case 'datetime':{
					if (!this.toDate(value))
						res.push('type:int');
				}
				case 'email':{
					if (!this.email.test(value))
						res.push('type:email');
				}
			}
		}
		// default return
		return res;
	};
	Validate.prototype.toDate = function (date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date;
        }
        date = Date.parse(date);
        return !isNaN(date) ? new Date(date) : null;
    };
    //*******************************************
    // Return Variable.
    //*******************************************
	return Validate;
}));