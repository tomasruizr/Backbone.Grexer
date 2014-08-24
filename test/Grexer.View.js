var Person = Backbone.Grexer.Model.extend({
    defaults: {
        'name': 'nombre',
        'place': 'Lugar predefinido',
        'time': 'Hoy',
        'first_name': 'nombre',
        'last_name': 'apellido'
    }
});

var PersonView = Backbone.Grexer.View.extend({


    template: _.template($('#backboneView').html()),

    computeds: {
        'full_name': {
            get: function () {
                $('#full_name').text(this.model.get('first_name') + ' ' + this.model.get('last_name'));
                return this.model.get('first_name') + ' ' + this.model.get('last_name');
            },
            observe: ['first_name', 'last_name']
        }
    },

    initialize: function () {
        this.bind('#first_name', 'first_name', 'keyup', 'change');
        this.bind('#last_name', 'last_name', 'keyup', 'change');
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