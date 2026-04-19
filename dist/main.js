// Simple recursive descent parser for math expressions
class MathParser {
    input;
    pos;
    constructor(input) {
        this.input = input.replace(/\s+/g, ''); // remove spaces
        this.pos = 0;
    }
    parse() {
        return this.parseExpression();
    }
    parseExpression() {
        let left = this.parseTerm();
        while (this.peek() === '+' || this.peek() === '-') {
            const op = this.consume();
            const right = this.parseTerm();
            left = { type: 'BinaryOp', left, right, operator: op };
        }
        return left;
    }
    parseTerm() {
        let left = this.parseFactor();
        while (this.peek() === '*' || this.peek() === '/' || this.peek() === '%') {
            const op = this.consume();
            const right = this.parseFactor();
            left = { type: 'BinaryOp', left, right, operator: op };
        }
        return left;
    }
    parseFactor() {
        return this.parsePower();
    }
    parseAtom() {
        let sign = 1;
        if (this.peek() === '-') {
            this.consume();
            sign = -1;
        }
        else if (this.peek() === '+') {
            this.consume();
        }
        let atom;
        if (this.peek() === '(') {
            this.consume(); // '('
            atom = this.parseExpression();
            this.expect(')');
        }
        else if (this.isDigit(this.peek()) || this.peek() === '.') {
            atom = this.parseNumber();
        }
        else if (this.isLetter(this.peek())) {
            const name = this.parseIdentifier();
            if (this.peek() === '(') {
                this.consume(); // '('
                const args = [];
                if (this.peek() !== ')') {
                    args.push(this.parseExpression());
                    while (this.peek() === ',') {
                        this.consume();
                        args.push(this.parseExpression());
                    }
                }
                this.expect(')');
                atom = { type: 'FunctionCall', name, args };
            }
            else {
                atom = { type: 'Variable', name };
            }
        }
        else {
            throw new Error(`Unexpected character: ${this.peek()}`);
        }
        if (sign === -1) {
            return { type: 'UnaryOp', operator: '-', operand: atom };
        }
        return atom;
    }
    parsePower() {
        let left = this.parseAtom();
        if (this.peek() === '^') {
            this.consume();
            const right = this.parsePower();
            return { type: 'BinaryOp', left, right, operator: '^' };
        }
        return left;
    }
    parseNumber() {
        let num = '';
        while (this.pos < this.input.length && (this.isDigit(this.peek()) || this.peek() === '.')) {
            num += this.consume();
        }
        const value = parseFloat(num);
        if (isNaN(value)) {
            throw new Error(`Invalid number: ${num}`);
        }
        return { type: 'NumberLiteral', value };
    }
    parseIdentifier() {
        let id = '';
        if (this.isLetter(this.peek()) || this.peek() === '_') {
            id += this.consume();
            while (this.pos < this.input.length && (this.isLetter(this.peek()) || this.isDigit(this.peek()) || this.peek() === '_')) {
                id += this.consume();
            }
        }
        return id;
    }
    peek() {
        return this.pos < this.input.length ? this.input[this.pos] : '';
    }
    consume() {
        return this.input[this.pos++];
    }
    expect(char) {
        if (this.peek() !== char) {
            throw new Error(`Expected ${char}, got ${this.peek()}`);
        }
        this.consume();
    }
    isDigit(char) {
        return /\d/.test(char);
    }
    isLetter(char) {
        return /[a-zA-Z]/.test(char);
    }
}
// Function to print the custom AST
function printCustomAST(node, indent = '') {
    console.log(`${indent}${node.type}`);
    if (node.type === 'BinaryOp') {
        const bin = node;
        console.log(`${indent}  Operator: ${bin.operator}`);
        printCustomAST(bin.left, indent + '  ');
        printCustomAST(bin.right, indent + '  ');
    }
    else if (node.type === 'UnaryOp') {
        const un = node;
        console.log(`${indent}  Operator: ${un.operator}`);
        printCustomAST(un.operand, indent + '  ');
    }
    else if (node.type === 'FunctionCall') {
        const func = node;
        console.log(`${indent}  Name: ${func.name}`);
        func.args.forEach((arg, i) => {
            console.log(`${indent}  Arg ${i}:`);
            printCustomAST(arg, indent + '    ');
        });
    }
    else if (node.type === 'Variable') {
        console.log(`${indent}  Name: ${node.name}`);
    }
    else if (node.type === 'NumberLiteral') {
        console.log(`${indent}  Value: ${node.value}`);
    }
}
// Function to evaluate the AST to a numerical value
function evaluate(node) {
    if (node.type === 'BinaryOp') {
        const bin = node;
        const left = evaluate(bin.left);
        const right = evaluate(bin.right);
        switch (bin.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': {
                if (right === 0) {
                    throw new Error('Division by zero');
                }
                return left / right;
            }
            case '%': {
                if (right === 0) {
                    throw new Error('Modulo by zero');
                }
                return left % right;
            }
            case '^': {
                if (left === 0 && right === 0) {
                    throw new Error('0^0 is undefined');
                }
                return Math.pow(left, right);
            }
            default: throw new Error(`Unknown operator: ${bin.operator}`);
        }
    }
    else if (node.type === 'UnaryOp') {
        const un = node;
        const operand = evaluate(un.operand);
        switch (un.operator) {
            case '-': return -operand;
            default: throw new Error(`Unknown unary operator: ${un.operator}`);
        }
    }
    else if (node.type === 'FunctionCall') {
        const func = node;
        const args = func.args.map(arg => evaluate(arg));
        switch (func.name) {
            // Logarithmic and exponential
            case 'log10': {
                if (args[0] <= 0) {
                    throw new Error(`log10 domain error: argument ${args[0]} must be positive`);
                }
                return Math.log10(args[0]);
            }
            case 'log': {
                if (args[0] <= 0) {
                    throw new Error(`log domain error: argument ${args[0]} must be positive`);
                }
                return Math.log(args[0]);
            }
            case 'log2': {
                if (args[0] <= 0) {
                    throw new Error(`log2 domain error: argument ${args[0]} must be positive`);
                }
                return Math.log2(args[0]);
            }
            case 'ln': {
                if (args[0] <= 0) {
                    throw new Error(`ln domain error: argument ${args[0]} must be positive`);
                }
                return Math.log(args[0]);
            }
            case 'exp': return Math.exp(args[0]);
            // Trigonometric
            case 'sin': return Math.sin(args[0]);
            case 'cos': return Math.cos(args[0]);
            case 'tan': return Math.tan(args[0]);
            case 'asin': {
                if (args[0] < -1 || args[0] > 1) {
                    throw new Error(`asin domain error: argument ${args[0]} must be in [-1, 1]`);
                }
                return Math.asin(args[0]);
            }
            case 'acos': {
                if (args[0] < -1 || args[0] > 1) {
                    throw new Error(`acos domain error: argument ${args[0]} must be in [-1, 1]`);
                }
                return Math.acos(args[0]);
            }
            case 'atan': return Math.atan(args[0]);
            // Rounding
            case 'floor': return Math.floor(args[0]);
            case 'ceil': return Math.ceil(args[0]);
            case 'round': return Math.round(args[0]);
            // Other common functions
            case 'abs': return Math.abs(args[0]);
            case 'sqrt': {
                if (args[0] < 0) {
                    throw new Error(`sqrt domain error: argument ${args[0]} must be non-negative`);
                }
                return Math.sqrt(args[0]);
            }
            case 'min': return Math.min(...args);
            case 'max': return Math.max(...args);
            default: throw new Error(`Unknown function: ${func.name}`);
        }
    }
    else if (node.type === 'Variable') {
        const name = node.name.toLowerCase();
        const constants = {
            pi: Math.PI,
            e: Math.E,
        };
        if (name in constants) {
            return constants[name];
        }
        throw new Error(`Variable ${name} not defined`);
    }
    else if (node.type === 'NumberLiteral') {
        return node.value;
    }
    throw new Error(`Unknown node type: ${node.type}`);
}
// Function to generate Reverse Polish Notation (RPN) from AST
function toRPN(node) {
    if (node.type === 'BinaryOp') {
        const bin = node;
        return `${toRPN(bin.left)} ${toRPN(bin.right)} ${bin.operator}`;
    }
    else if (node.type === 'UnaryOp') {
        const un = node;
        return `${toRPN(un.operand)} ${un.operator}`;
    }
    else if (node.type === 'FunctionCall') {
        const func = node;
        const args = func.args.map(arg => toRPN(arg)).join(' ');
        return `${args} ${func.name}`;
    }
    else if (node.type === 'Variable') {
        return node.name;
    }
    else if (node.type === 'NumberLiteral') {
        return node.value.toString();
    }
    return '';
}
// Parse the math expression
const testExpressions = [
    '(-5)^2 + 7^-2.5 - 3*4/2 + pi',
    'sqrt(16) + abs(-5)',
    'sin(0) + cos(0)',
    'floor(3.7) + ceil(3.2)',
    '(2+3)*(4-1)',
    'log10(100) + log2(8)',
    'max(5,10,3) - min(5,10,3)',
    'sqrt((3^2)+(4^2))',
    '(pi/2)*180',
    'log10(1.0^2-1.0^2)',
    '-5^2+25',
    'asin(1)',
    'acos(-1)',
    'asin(2)', // Domain error
    'acos(1.5)', // Domain error
    '5/0', // Division by zero
    '0^0', // Undefined
    '0^2', // Works
    'log(0)', // Domain error
    'log(-1)', // Domain error
    'sqrt(-1)', // Domain error
    '(-2)^0.5', // Complex result (not handled)
    'exp(1000)', // Overflow to Infinity
    '1e-1000', // Underflow to 0
    'tan(pi/2)', // Large value (precision issue)
    '17%5', // Modulo
    '10%3', // Modulo
    '7%7', // Modulo (should be 0)
    '5%0', // Modulo by zero
];
testExpressions.forEach(mathExpression => {
    console.log(`\n=== Expression: ${mathExpression} ===`);
    try {
        const parser = new MathParser(mathExpression);
        const ast = parser.parse();
        console.log('Custom Math AST:');
        printCustomAST(ast);
        console.log('\nReverse Polish Notation (RPN):');
        console.log(toRPN(ast));
        console.log('\nEvaluated Result:');
        console.log(evaluate(ast));
    }
    catch (e) {
        console.log(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
});
export {};
