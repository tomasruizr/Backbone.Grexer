Backbone.Grexer
===============
Backbone with some other Love from Grexer in a super lightweight fasion.
___________________

Basically adds:
- Single or two way binding possibilities to the models with the views in the DOM.
- Use of Computed properties in the models and views.

##Bindings:
Consider the following Model definition:
```javascript
var Person = Backbone.Grexer.Model.extend({
  defaults: {
    'name': 'nombre',
    'place': 'Lugar predefinido',
    'time': 'Hoy',
    'first_name': 'nombre',
    'last_name': 'apellido'
  }
});
```
It's defined in the example with a Grexer.Model extention, but it will work also with Backbone.Model.

The binding will now be defined in the View declaration as follows:

```javascript
var PersonView = Backbone.Grexer.View.extend({
    initialize: function () {
        this.bind('#first_name', 'first_name', 'keyup', 'change');
        this.bind('#last_name', 'last_name', 'keyup', 'change');
    }
});
```
The _bind_ method will receive 4 parameters:
```javascript
bind: function (element, modelAtt, event, modelEvent)
```
- _element_: Is the DOM element to bind to.
- _modelAtt_: Is the model attribute to bind to.
- _event_: Is the event in the DOM to listen to or __false__. example __keyup__. In case is __false__ the bind will only be in the Model->View Direction, if the DOM element is modified the model won't be updated.
- _modelEvent_: is the event in the Model to listen to or __false__. example __change__. The result of the event binding in the previous example will be __first_name:change__ since it associates the attribute in the model with the model event. In case is __false__ the binding will be only in the View->Model direction and any modification made in the model won't be reflected in the DOM.


##Computed Fields:

The computed fields are seted and configured and added in the views, though are also present in the models, so you could access them in the model.properties, very useful when rendering a template and passing the model.attributes as a parameter.

A computed field will consist of basically 3 things.
- _name:_ Is the name of the computed field, it is going to be accessed in _model.attributes_.
- _get:_ Is a function that specifies how to calculate the field and in case is necessary, how it affects the DOM once recalculated.
- _observe_: Specifies what fields in the model to observe in order to trigger the recalculation, in other words the _get_ method previously specified. 

the correct way yo add a computed field is by one of the following two options.

1. By adding them explicitly in the view declaration in the *"computed"* property. Notice that the _**get**_ function first modifies the DOM and then returns the value. that is the suggestion in how to delcare the method.

```javascript
var PersonView = Backbone.Grexer.View.extend({
  computeds: {
    'full_name': {
      get: function () {
        $('#full_name').text(this.model.get('first_name') + ' ' + this.model.get('last_name'));
        return this.model.get('first_name') + ' ' + this.model.get('last_name');
      },
      observe: ['first_name', 'last_name']
    }
  },    
});
```

2. By using the _AddComputed_ method in the view which have the following method signature:
```javascript
AddComputed: function (computedName, computeFunc, observeArr)
```
The function parameters correspond to the 3 things specified previously.


