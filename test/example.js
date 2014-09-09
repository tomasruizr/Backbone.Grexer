//Extend from Backbone.Grexer.Model to support the acces to computed keys features.
var Person = Backbone.Grexer.Model.extend({
    urlRoot: '/People',
    defaults: {
        'first_name': 'nombre',
        'last_name': 'apellido',
        'base_salary' : 100,
        'bonus_salary' : 50
    },
    computed: {
        // add the computed field in the view definition
        'full_name': {
            get: function(){
                return this.get('first_name') + ' ' + this.get('last_name');
            },
            set: function (value) {
                var arr = value.split(' ');
                this.set('first_name', arr[0]);
                this.set('last_name', arr[1]);
            },
            observe: ['first_name', 'last_name']
        }
    }

});

//Extend from Backbone.Grexer.View for the views.
var PersonView = Backbone.Grexer.View.extend({
    template: _.template($('#backboneView').html()),

    bindings: function(){
        //Register the binds
        // bind the DOM event to the Model
        this.bind('#first_name', 'first_name', 'keyup', 'change');
        this.bind('#last_name', 'last_name', 'keyup');
        this.bind('#base_salary', 'base_salary', 'keyup');
        this.bind('#bonus_salary', 'bonus_salary', 'keyup');
        this.bind('#full_name');
        //bind the Model event to de DOM.
        //this.bind('#first_name2', 'first_name', false, 'change');
    },

    initialize: function () {
        //Example of Register a computed field in programatically
        // this.AddComputed(
        //     //Computed field name
        //     'total_salary',
        //     //get function
        //     function(){
        //         var value = (+this.model.get('base_salary')) + (+this.model.get('bonus_salary'));
        //         //Update DOM
        //         $('#total_salary').text(value);
        //         //return value
        //         return value;
        //     },
        //     //Module Attributes to observe
        //     ['base_salary', 'bonus_salary']
        // );
    }

});
var p = new Person();
var v = new PersonView({
    el: '#example',
    model: p
});
v.render();
p.set('last_name', 'Ruiz');
p.set('first_name', 'Tomas');
//Access a Computed property defined in the view directly in the model.
// console.log('Total Salary: ' + p.get('total_salary'));
// console.log('Total Salary: ' + p.get('full_name'));
// using localStorage in the example to demostrate the computed values are not stired.
// though the localStorage itself behaves different that the symc methods used in a server enviroment
// the procedure applied is the same.
// p.save();
