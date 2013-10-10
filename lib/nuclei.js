var events       = require('events'),
    eventEmitter = new events.EventEmitter(),
    Classes      = {},
    Nuclei;

/**
 * The base class, from which all other classes inherit
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Nuclei = function Nuclei() {
	
	// Simple property to indicate this is an extended class
	this._fromNuclei = true;
	
	// Object to store parent functions & properties in
	this._parent = {__end__: true};
	
	// A link to the extend function
	this.extend = Nuclei.extend;
	
	// A link to the overload function
	this.overload = Nuclei.overload;
	
	/**
	 * Function that runs when this class is being extended
	 * 
	 * @type   {Function}
	 */
	this.__extended__ = function __extended__(parentClassName) {};
	
	/**
	 * Function that runs when this class is instanced (new)
	 *
	 * @type   {Function}
	 */
	this.init = function init() {};

	/**
	 * Function that runs when an instance of this class has been augmented
	 *
	 * @param  {Object}   addition
	 *
	 * @type   {Function}
	 */
	this.augmented = function augmented(addition) {};

	/**
	 * Execute a method function from the parent.
	 * If we find a property that isn't a function,
	 * we simply return that value
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   functionname         The name of the wanted property
	 * @param    {Boolean}  useCallingArguments  If true, the arguments from the
	 *                                           calling function will be applied
	 *                                           If an array, these will be applied
	 * @param    {Array}    extraArguments       All other arguments will be applied
	 */
	this.parent = function __parent__(functionName, useCallingArguments) {
		
		var caller = arguments.callee.caller,
		    possibleTarget,
		    parent,
		    args;

		if (typeof useCallingArguments === 'undefined') useCallingArguments = true;
		if (typeof functionName !== 'string') functionName = caller.name;
		
		// If there is no valid functionName, do nothing
		if (!functionName) return;
		
		// Nuclei doesn't have an __ic__ function
		if (functionName === '__ic__' && caller.__parentClass__ === 'Nuclei') return;
		
		// Where to find the parent function or property
		parent = Classes[caller.__parentClass__];
		
		possibleTarget = parent[functionName];
		
		if (typeof possibleTarget === 'undefined') {
			possibleTarget = parent.prototype[functionName];
		}
		
		if (typeof possibleTarget === 'function') {
			
			// Use the arguments from the function that called us
			if (useCallingArguments === true) {
				args = arguments.callee.caller.arguments;
			} else if (useCallingArguments && (useCallingArguments instanceof Array || typeof useCallingArguments.length != 'undefined')) {
				// If it's an array, use those as arguments
				args = useCallingArguments;
			} else {
				// Turn the array-like arguments object into a real array
				args = Array.prototype.slice.call(arguments);
				
				// Remove the function name
				args.shift();
				
				// Remove the useCallingArguments
				args.shift();
			}
			
			// Execute the parent function with the appropriate arguments
			return possibleTarget.apply(this, args);
		} else if (typeof possibleTarget !== 'undefined') {
			return possibleTarget;
		} else {
			console.warn('Could not find parent property ' + functionName.bold + ' from ' + caller.__ownerClass__.bold + ' looking in ' + caller.__parentClass__.bold + ' (Request context: ' + this.name + ')', {level: 1});
		}
	};
};

/**
 * The function that does the extending
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Function}   _extension   The extending class
 * @param    {Object}     _options     Extra options
 * @param    {Object}     _three       Depends on overloading...
 *
 * @returns  {Function}   A new class
 */
Nuclei.extend = function extend(_extension, _options, _three, _callback) {
	
	var origin    = this,        // The originating class
	    options   = _options,
	    callback  = _callback,
	    extension = _extension,  // The new, extending class
	    new_constructor,
	    key;
	
	// Function overloading handler
	if (typeof _options !== 'object') {
		if (typeof _three === 'object') {
			options = _three;
			_three = undefined;
		}
		else options = {};
	}
	
	if (typeof _options === 'function') {
		extension = _options;
		_options = undefined;
	}
	
	if (typeof _extension === 'string') {
		origin = Classes[_extension];
	}
	
	if (typeof extension !== 'function') {
		if (typeof _three === 'function') {
			extension = _three;
		}
	}

	// Register new classes by default
	if (typeof options.register === 'undefined') options.register = true;
	
	if (!options.name) {
		options.name = '';
		if (extension.name) {
			options.name = extension.name;
		} else {
			// If the extending function does not have a name, disable registering
			options.register = false;
		}
	}
	
	// Create a new instance of the class that is being extended
	// Passing the __extending__ option will make sure
	// the init() method is not called
	var _super = new origin({__extending__: true, __overloading__: options.overloading});

	// Create a temporary instance of the extension class
	// Since no extension has happened yet, no Nuclei magic is inside this
	// class. It won't do anything funky.
	var _child = new extension();

	// Save the old parent
	_super._parent = {_parent: _super._parent};
	
	// Create the first part of the new constructor
	// We apply it later on inside new_constructor, this way we don't have to
	// put everything inside a big string
	var internal_constructor = function internal_constructor() {

		var arg      = arguments[0],
		    passArgs = arguments;
	
		// If this constructor is called because we're creating a temporary
		// class used for extending another class, don't call the parent __ic__
		if (typeof arg === 'object' && arg.__extending__ === true) {
			
		} else {
			// Do call the parent internal constructor, and tell it we're instancing
			this.parent('__ic__', null, {__instancing__: true});
		}
		
		// Apply the constructor for the extension
		extension.apply(this);
		
		// It's ugly, but we need to call the __extended__ function, too
		if (typeof this.__extended__ === 'function') {
			this.__extended__(this.name, this);
		}
		
		if (typeof arg === 'object' && arg.__instancing__ === true) {
			
		} else {
			// Tell every function inside this class what its parent is
			for (var i in this) if (typeof this[i] === 'function') {
				this[i].__parentClass__ = this.parentClassName;
				this[i].__ownerClass__ = this.name;
			}
		}
		
		// Do not execute the init function when creating a temporary object
		if (typeof arg === 'object' && (arg.__extending__ === true || arg.__instancing__ === true)) {
			// The __extending__ option was found, so init() is not called
			// __instancing__ was also found, so don't call any parent init() functions
		} else {
	
			if (typeof this.init !== 'undefined') {

				if (typeof arg === 'object' && arg.__passArgs__) {
					passArgs = arg.__passArgs__;
				}

				this.init.apply(this, passArgs);
			}
		}
		
	}
	
	// Use eval to create the constructor for our new class,
	// that way we can set the class (function) name (options.name)
	eval('new_constructor = function ' + options.name + '(){internal_constructor.apply(this, arguments)}');
	
	new_constructor.prototype = _super;
	new_constructor.__ic__ = internal_constructor;
	new_constructor.prototype.__ic__ = internal_constructor;
	
	for (i in _child) {
		
		// Add the property to the class
		// This will be discarded when 'new' is called
		new_constructor[i] = _child[i];
		
		// Add the property to the prototype
		// Normally: This will be the default value of this property, shared accross all instances
		// BUT since these sames declarations are also INSIDE the function, they get overwritten
		new_constructor.prototype[i] = _child[i];
		
	}
	
	// Go over every property in the parent class
	for (key in _super) {
		
		// If the child does not contain the same property, add the parent's property to the child
		if (typeof _child[key] === 'undefined') {
			new_constructor[key] = _super[key];
		} else {
			// If it does have the same property, store it in the _parent object
			_super._parent[key] = _super[key];
		}
		
	}
	
	// Now loop over new_constructor and tell it who its parent is
	for (key in new_constructor) {
		
		if (typeof new_constructor[key] === 'function') {
			new_constructor[key].__parentClass__ = origin.name;
			new_constructor.prototype[key].__parentClass__ = origin.name;
			
			new_constructor[key].__ownerClass__ = options.name;
			new_constructor.prototype[key].__ownerClass__ = options.name;
		}
	}

	new_constructor.constructor = extension;
	
	// Set the name in the prototype, so objects will have this set correctly
	// Don't forget: once a function's .name has been set, it can't be changed
	new_constructor.prototype.name = options.name;
	
	// Also set the parent class name
	new_constructor.prototype.parentClassName = origin.name;
	new_constructor.parentClassName = origin.name;
	
	// Register the class if needed
	if (options.register) {
		
		var _doRegister = true;
		
		if (!options.overloading && typeof Classes[options.name] != 'undefined') {
			console.error('You are overloading an object by using the extending function. Use overload instead', {level: 1});
		}
		
		if (_doRegister) Classes[options.name] = new_constructor;
	}
	
	if (typeof new_constructor.__extended__ == 'function') {
		new_constructor.__extended__(origin.name, origin);
	}
	
	eventEmitter.emit('ClassExtended-' + options.name);
	
	if (options.overloading) {
		
		if (typeof new_constructor.__overloaded__ == 'function') {
			new_constructor.__overloaded__(origin.name, origin);
		}
		
		eventEmitter.emit('ClassOverloaded-' + options.name);
	}

	return new_constructor;
};

/**
 * Overloading is basically the same as extending a class,
 * but it overwrites the existing class.
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Function}   _overload    The extending class
 * @param    {Object}     _options     Extra options
 * @param    {Object}     _three       Depends on overloading...
 *
 * @returns  {Function}   A new class
 */
Nuclei.overload = function overload(_overload, _extra) {

	var className = this.name,
	    overloader;

	if (typeof _overload === 'string') {
		className = _overload;
		_overload = _extra;
	}

	// The actual function that does the overloading
	overloader = function overloader() {
		var base = Classes[className];
		base.extend(_overload, {overloading: true});
	}
	
	if (typeof Classes[className] !== 'undefined') {
		overloader();
	} else {
		
		// If the class does not exist yet, wait 'till it does
		eventEmitter.once('ClassExtended-' + className, function() {
			overloader();
		});
	}
};

// Register the base class itself
Classes.Nuclei = Nuclei;

module.exports = Nuclei;