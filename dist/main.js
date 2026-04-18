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
        while (this.peek() === '*' || this.peek() === '/') {
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
            case '/': return left / right;
            case '^': return Math.pow(left, right);
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
            case 'log10': return Math.log10(args[0]);
            // Add more functions as needed
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
const mathExpression = '(-5)^2 + 7^-2.5 - 3*4/2 + pi';
const parser = new MathParser(mathExpression);
const ast = parser.parse();
console.log('Custom Math AST:');
printCustomAST(ast);
console.log('\nReverse Polish Notation (RPN):');
console.log(toRPN(ast));
console.log('\nEvaluated Result:');
console.log(evaluate(ast));
export {};
