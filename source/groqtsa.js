
// Experimental

var groqtsa = groqtsa || {};

groqtsa.ModelFactory = class {

    match(context) {
        console.log("Entering groq matcher");
        const identifier = context.identifier;
        console.log(identifier);
        if (identifier.endsWith('.groqtsa.json')) {
            const obj = context.open('json');
            console.log(obj);
            if (obj /* && (obj.confs || obj.vertices) */) {
                console.log("Succeeding from groq matcher");
                return '.groqtsa.json';
            }
        }
        console.log("Failing out of groq matcher");
        return undefined;
    }

    open(context, match) {
        // This is exactly the string we returned above, maybe
        // so we can tell what kind of file this was if we support
        // multiple types of file?
        console.assert(match == '.groqtsa.json');
        const obj = context.open('json');
        return new groqtsa.Model(obj);
    }
};

groqtsa.Model = class {

    constructor(obj) {
        this._name = obj.name || '';
        this._format = 'GroqTsaGraph';
        this._graphs = [ new groqtsa.Graph(obj) ];
    }

    get format() {
        return this._format;
    }

    get name() {
        return this._name;
    }

    get graphs() {
        return this._graphs;
    }
};

groqtsa.Graph = class {

    constructor(obj) {
        this._inputs = [];
        this._outputs = [];
        this._nodes = obj.nodes;
    }

    get inputs() {
        return this._inputs;
    }

    get outputs() {
        return this._outputs;
    }

    get nodes() {
        return this._nodes;
    }
};

groqtsa.Parameter = class {

    constructor(name, args) {
        this._name = name;
        this._arguments = args;
    }

    get name() {
        return this._name;
    }

    get visible() {
        return true;
    }

    get arguments() {
        return this._arguments;
    }
};

groqtsa.Argument = class {

    constructor(name, type, initializer, quantization) {
        if (typeof name !== 'string') {
            throw new groqtsa.Error("Invalid argument identifier '" + JSON.stringify(name) + "'.");
        }
        this._name = name;
        this._type = type || null;
        this._initializer = initializer || null;
        this._quantization = quantization || null;
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get quantization() {
        if (this._quantization) {
            return this._quantization.map((value, index) => index.toString() + ' = ' + value.toString()).join('; ');
        }
        return null;
    }

    get initializer() {
        return this._initializer;
    }
};

// TODO unused
groqtsa.Node = class {

    constructor(metadata, node, arg) {
        const layer = node.layer;
        this._name = layer.name;
        const type = layer.type;
        this.type = metadata.type(type) || { name: type };
        this._attributes = [];
        this._inputs = [];
        this._outputs = [];

        const inputs = node.input.map((input) => arg(input));
        const outputs = node.output.map((output) => arg(output));

        if (inputs && inputs.length > 0) {
            let inputIndex = 0;
            if (this._type && this._type.inputs) {
                for (const inputSchema of this._type.inputs) {
                    if (inputIndex < inputs.length || inputSchema.option != 'optional') {
                        const inputCount = (inputSchema.option == 'variadic') ? (node.input.length - inputIndex) : 1;
                        const inputArguments = inputs.slice(inputIndex, inputIndex + inputCount);
                        this._inputs.push(new groqtsa.Parameter(inputSchema.name, inputArguments));
                        inputIndex += inputCount;
                    }
                }
            }
            this._inputs.push(...inputs.slice(inputIndex).map((input, index) => {
                const inputName = ((inputIndex + index) == 0) ? 'input' : (inputIndex + index).toString();
                return new groqtsa.Parameter(inputName, [ input ]);
            }));
        }
        if (outputs.length > 0) {
            this._outputs = outputs.map((output, index) => {
                const inputName = (index == 0) ? 'output' : index.toString();
                return new groqtsa.Parameter(inputName, [ output ]);
            });
        }

        for (const key of Object.keys(layer)) {
            this._attributes.push(new groqtsa.Attribute(metadata.attribute(type, key), key, layer[key]));
        }
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get inputs() {
        return this._inputs;
    }

    get outputs() {
        return this._outputs;
    }

    get attributes() {
        return this._attributes;
    }
};

groqtsa.Attribute = class {

    constructor(metadata, name, value) {
        this._name = name;
        this._value = value;
    }

    get name() {
        return this._name;
    }

    get value() {
        return this._value;
    }
};

groqtsa.Error = class extends Error {

    constructor(message) {
        super(message);
        this.name = 'Error loading Groq TSA model.';
    }
};

if (typeof module !== 'undefined' && typeof module.exports === 'object') {
    module.exports.ModelFactory = groqtsa.ModelFactory;
}
