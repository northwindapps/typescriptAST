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
    let left = this.parsePower();
    if (this.peek() === '^') {
      this.consume();
      const right = this.parseFactor();
      return { type: 'BinaryOp', left, right, operator: '^' } as BinaryOp;
    }
    return left;
  }

  private parsePower(): ASTNode {
    if (this.peek() === '(') {
      this.consume(); // '('
      const expr = this.parseExpression();
      this.expect(')');
      return expr;
    } else if (this.isDigit(this.peek())) {
      return this.parseNumber();
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
        return { type: 'FunctionCall', name, args } as FunctionCall;
      } else {
        return { type: 'Variable', name } as Variable;
      }
    }
    throw new Error(`Unexpected character: ${this.peek()}`);
  }

  private parseNumber(): NumberLiteral {
    let num = '';
    while (this.pos < this.input.length && this.isDigit(this.peek())) {
      num += this.consume();
    }
    return { type: 'NumberLiteral', value: parseFloat(num) };
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

// Parse the math expression
const mathExpression = 'log10(x^2-y^2)';
const parser = new MathParser(mathExpression);
const ast = parser.parse();

console.log('Custom Math AST:');
printCustomAST(ast);