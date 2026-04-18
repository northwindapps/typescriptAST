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
        let left = this.parsePower();
        if (this.peek() === '^') {
            this.consume();
            const right = this.parseFactor();
            return { type: 'BinaryOp', left, right, operator: '^' };
        }
        return left;
    }
    parsePower() {
        if (this.peek() === '(') {
            this.consume(); // '('
            const expr = this.parseExpression();
            this.expect(')');
            return expr;
        }
        else if (this.isDigit(this.peek())) {
            return this.parseNumber();
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
                return { type: 'FunctionCall', name, args };
            }
            else {
                return { type: 'Variable', name };
            }
        }
        throw new Error(`Unexpected character: ${this.peek()}`);
    }
    parseNumber() {
        let num = '';
        while (this.pos < this.input.length && this.isDigit(this.peek())) {
            num += this.consume();
        }
        return { type: 'NumberLiteral', value: parseFloat(num) };
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
// Parse the math expression
const mathExpression = 'log10(x^2-y^2)';
const parser = new MathParser(mathExpression);
const ast = parser.parse();
console.log('Custom Math AST:');
printCustomAST(ast);
export {};
