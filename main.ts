import * as ts from 'typescript';

// Define AST node types for math expressions
interface ASTNode {
  type: string;
}

interface BinaryOp extends ASTNode {
  type: 'BinaryOp';
  left: ASTNode;
  right: ASTNode;
  operator: string;
}

interface FunctionCall extends ASTNode {
  type: 'FunctionCall';
  name: string;
  args: ASTNode[];
}

interface Variable extends ASTNode {
  type: 'Variable';
  name: string;
}

interface NumberLiteral extends ASTNode {
  type: 'NumberLiteral';
  value: number;
}

interface UnaryOp extends ASTNode {
  type: 'UnaryOp';
  operator: string;
  operand: ASTNode;
}

// Simple recursive descent parser for math expressions
class MathParser {
  private input: string;
  private pos: number;

  constructor(input: string) {
    this.input = input.replace(/\s+/g, ''); // remove spaces
    this.pos = 0;
  }

  parse(): ASTNode {
    return this.parseExpression();
  }

  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.consume();
      const right = this.parseTerm();
      left = { type: 'BinaryOp', left, right, operator: op } as BinaryOp;
    }
    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    while (this.peek() === '*' || this.peek() === '/') {
      const op = this.consume();
      const right = this.parseFactor();
      left = { type: 'BinaryOp', left, right, operator: op } as BinaryOp;
    }
    return left;
  }

  private parseFactor(): ASTNode {
    return this.parsePower();
  }

  private parseAtom(): ASTNode {
    let sign = 1;
    if (this.peek() === '-') {
      this.consume();
      sign = -1;
    } else if (this.peek() === '+') {
      this.consume();
    }
    let atom: ASTNode;
    if (this.peek() === '(') {
      this.consume(); // '('
      atom = this.parseExpression();
      this.expect(')');
    } else if (this.isDigit(this.peek()) || this.peek() === '.') {
      atom = this.parseNumber();
    } else if (this.isLetter(this.peek())) {
      const name = this.parseIdentifier();
      if (this.peek() === '(') {
        this.consume(); // '('
        const args: ASTNode[] = [];
        if (this.peek() !== ')') {
          args.push(this.parseExpression());
          while (this.peek() === ',') {
            this.consume();
            args.push(this.parseExpression());
          }
        }
        this.expect(')');
        atom = { type: 'FunctionCall', name, args } as FunctionCall;
      } else {
        atom = { type: 'Variable', name } as Variable;
      }
    } else {
      throw new Error(`Unexpected character: ${this.peek()}`);
    }
    if (sign === -1) {
      return { type: 'UnaryOp', operator: '-', operand: atom } as UnaryOp;
    }
    return atom;
  }

  private parsePower(): ASTNode {
    let left = this.parseAtom();
    if (this.peek() === '^') {
      this.consume();
      const right = this.parsePower();
      return { type: 'BinaryOp', left, right, operator: '^' } as BinaryOp;
    }
    return left;
  }

  private parseNumber(): NumberLiteral {
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

  private parseIdentifier(): string {
    let id = '';
    if (this.isLetter(this.peek()) || this.peek() === '_') {
      id += this.consume();
      while (this.pos < this.input.length && (this.isLetter(this.peek()) || this.isDigit(this.peek()) || this.peek() === '_')) {
        id += this.consume();
      }
    }
    return id;
  }

  private peek(): string {
    return this.pos < this.input.length ? this.input[this.pos] : '';
  }

  private consume(): string {
    return this.input[this.pos++];
  }

  private expect(char: string): void {
    if (this.peek() !== char) {
      throw new Error(`Expected ${char}, got ${this.peek()}`);
    }
    this.consume();
  }

  private isDigit(char: string): boolean {
    return /\d/.test(char);
  }

  private isLetter(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }
}

// Function to print the custom AST
function printCustomAST(node: ASTNode, indent: string = ''): void {
  console.log(`${indent}${node.type}`);
  if (node.type === 'BinaryOp') {
    const bin = node as BinaryOp;
    console.log(`${indent}  Operator: ${bin.operator}`);
    printCustomAST(bin.left, indent + '  ');
    printCustomAST(bin.right, indent + '  ');
  } else if (node.type === 'UnaryOp') {
    const un = node as UnaryOp;
    console.log(`${indent}  Operator: ${un.operator}`);
    printCustomAST(un.operand, indent + '  ');
  } else if (node.type === 'FunctionCall') {
    const func = node as FunctionCall;
    console.log(`${indent}  Name: ${func.name}`);
    func.args.forEach((arg, i) => {
      console.log(`${indent}  Arg ${i}:`);
      printCustomAST(arg, indent + '    ');
    });
  } else if (node.type === 'Variable') {
    console.log(`${indent}  Name: ${(node as Variable).name}`);
  } else if (node.type === 'NumberLiteral') {
    console.log(`${indent}  Value: ${(node as NumberLiteral).value}`);
  }
}

// Function to evaluate the AST to a numerical value
function evaluate(node: ASTNode): number {
  if (node.type === 'BinaryOp') {
    const bin = node as BinaryOp;
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
  } else if (node.type === 'UnaryOp') {
    const un = node as UnaryOp;
    const operand = evaluate(un.operand);
    switch (un.operator) {
      case '-': return -operand;
      default: throw new Error(`Unknown unary operator: ${un.operator}`);
    }
  } else if (node.type === 'FunctionCall') {
    const func = node as FunctionCall;
    const args = func.args.map(arg => evaluate(arg));
    switch (func.name) {
      case 'log10': return Math.log10(args[0]);
      // Add more functions as needed
      default: throw new Error(`Unknown function: ${func.name}`);
    }
  } else if (node.type === 'Variable') {
    const name = (node as Variable).name.toLowerCase();
    const constants: Record<string, number> = {
      pi: Math.PI,
      e: Math.E,
    };
    if (name in constants) {
      return constants[name];
    }
    throw new Error(`Variable ${name} not defined`);
  } else if (node.type === 'NumberLiteral') {
    return (node as NumberLiteral).value;
  }
  throw new Error(`Unknown node type: ${node.type}`);
}

// Function to generate Reverse Polish Notation (RPN) from AST
function toRPN(node: ASTNode): string {
  if (node.type === 'BinaryOp') {
    const bin = node as BinaryOp;
    return `${toRPN(bin.left)} ${toRPN(bin.right)} ${bin.operator}`;
  } else if (node.type === 'UnaryOp') {
    const un = node as UnaryOp;
    return `${toRPN(un.operand)} ${un.operator}`;
  } else if (node.type === 'FunctionCall') {
    const func = node as FunctionCall;
    const args = func.args.map(arg => toRPN(arg)).join(' ');
    return `${args} ${func.name}`;
  } else if (node.type === 'Variable') {
    return (node as Variable).name;
  } else if (node.type === 'NumberLiteral') {
    return (node as NumberLiteral).value.toString();
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