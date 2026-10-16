export interface FormulaValidation {
  valid: boolean;
  error?: string;
  referencedKeys: string[];
}

/**
 * Combination formulas may use K1, K2, … plus +, -, *, /, parentheses,
 * and numeric literals. Every configured operand must appear in the formula.
 */
export function validateCombinationFormula(
  formula: string,
  operandKeys: string[],
): FormulaValidation {
  const keys = operandKeys.map((key) => key.toUpperCase());
  const allowed = new Set(keys);
  const tokenized = tokenize(formula);
  if (tokenized.error) {
    return { valid: false, error: tokenized.error, referencedKeys: [] };
  }

  const referenced = new Set<string>();
  try {
    const parser = new Parser(tokenized.tokens);
    parser.parseExpression();
    if (parser.peek()) {
      throw new Error("The formula has an extra symbol.");
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The formula is not valid.";
    return { valid: false, error: message, referencedKeys: [] };
  }

  tokenized.tokens.forEach((token) => {
    if (token.type === "ident") referenced.add(token.value);
  });

  const unknown = [...referenced].filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    return {
      valid: false,
      error: `${unknown.join(", ")} is not one of the configured attributes (${keys.join(", ")}).`,
      referencedKeys: [...referenced],
    };
  }

  const unused = keys.filter((key) => !referenced.has(key));
  if (unused.length > 0) {
    return {
      valid: false,
      error: `Use every configured attribute in the formula. Missing ${unused.join(", ")}.`,
      referencedKeys: [...referenced],
    };
  }

  if (referenced.size === 0) {
    return {
      valid: false,
      error: "The formula must use at least one K attribute.",
      referencedKeys: [],
    };
  }

  return { valid: true, referencedKeys: [...referenced] };
}

type Token =
  | { type: "number"; value: string }
  | { type: "ident"; value: string }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenize(formula: string): { tokens: Token[]; error?: string } {
  const source = formula.trim();
  if (!source) {
    return { tokens: [], error: "Enter a combination formula." };
  }

  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index] || "";
    if (character.trim() === "") {
      index += 1;
      continue;
    }
    if (character === "(") {
      tokens.push({ type: "lparen" });
      index += 1;
      continue;
    }
    if (character === ")") {
      tokens.push({ type: "rparen" });
      index += 1;
      continue;
    }
    if ("+-*/".includes(character)) {
      tokens.push({ type: "op", value: character as "+" | "-" | "*" | "/" });
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(character)) {
      let end = index;
      let dots = 0;
      while (end < source.length && /[0-9.]/.test(source[end] || "")) {
        if (source[end] === ".") dots += 1;
        end += 1;
      }
      const raw = source.slice(index, end);
      if (dots > 1 || raw === "." || Number.isNaN(Number(raw))) {
        return { tokens, error: `"${raw}" is not a valid number.` };
      }
      tokens.push({ type: "number", value: raw });
      index = end;
      continue;
    }
    if (/[kK]/.test(character)) {
      let end = index + 1;
      if (!/[0-9]/.test(source[end] || "")) {
        return {
          tokens,
          error: 'Write attributes as K1, K2, K3, and so on.',
        };
      }
      while (end < source.length && /[0-9]/.test(source[end] || "")) end += 1;
      tokens.push({
        type: "ident",
        value: `K${source.slice(index + 1, end)}`,
      });
      index = end;
      continue;
    }
    return {
      tokens,
      error: `"${character}" is not supported. Use +, -, *, /, and parentheses.`,
    };
  }

  return { tokens };
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  peek(): Token | undefined {
    return this.tokens[this.index];
  }

  parseExpression(): void {
    this.parseTerm();
    while (this.isAdditive(this.peek())) {
      this.advance();
      this.parseTerm();
    }
  }

  private parseTerm(): void {
    this.parseUnary();
    while (this.isMultiplicative(this.peek())) {
      const operator = this.advance();
      const next = this.peek();
      if (
        operator?.type === "op" &&
        operator.value === "/" &&
        next?.type === "number" &&
        Number(next.value) === 0
      ) {
        throw new Error("The formula divides by zero.");
      }
      this.parseUnary();
    }
  }

  private parseUnary(): void {
    if (this.isAdditive(this.peek())) this.advance();
    this.parsePrimary();
  }

  private parsePrimary(): void {
    const token = this.peek();
    if (!token) throw new Error("The formula ended unexpectedly.");
    if (token.type === "number" || token.type === "ident") {
      this.advance();
      return;
    }
    if (token.type === "lparen") {
      this.advance();
      this.parseExpression();
      if (this.peek()?.type !== "rparen") {
        throw new Error("The formula is missing a closing parenthesis.");
      }
      this.advance();
      return;
    }
    throw new Error("The formula has an unexpected symbol.");
  }

  private advance(): Token | undefined {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private isAdditive(token: Token | undefined): boolean {
    return token?.type === "op" && (token.value === "+" || token.value === "-");
  }

  private isMultiplicative(token: Token | undefined): boolean {
    return token?.type === "op" && (token.value === "*" || token.value === "/");
  }
}
