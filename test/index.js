var Nuclei = require('../lib/nuclei.js');

var Animal = Nuclei.extend(function Animal() {

	this.init = function init() {
		console.log('Animal has been inited');
	};

});

var Dog = Animal.extend(function Dog() {

	this.init = function init() {
		console.log('Dog has been inited');
		this.parent();
	};

});

new Animal;
new Dog;