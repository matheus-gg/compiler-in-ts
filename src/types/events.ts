export type FSEvent = {
  type: string;
  value: string;
};

export type AsciiCategorizerEvent = {
  type: 'ASCII' | 'CTRL';
  value: string;
};

export type LexicalCategorizerEvent = {
  type: string;
  value: string;
};

export type TokenEvent = {
  type: string;
  value: string;
  subType?: string;
};

export type SyntacticRoutineEvent = {
  type: string;
  value: string;
}

export type GenericEvent = FSEvent | AsciiCategorizerEvent | LexicalCategorizerEvent | TokenEvent | SyntacticRoutineEvent;
export type GenericEventQueue = FSEvent[] | AsciiCategorizerEvent[] | LexicalCategorizerEvent[] | TokenEvent[] | SyntacticRoutineEvent[];
