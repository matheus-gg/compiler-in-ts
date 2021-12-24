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

export type SemanticRoutineEvent = {
  recognized: boolean;
  routine?: string;
  expression?: string;
  type?: string;
};

export type GenericEvent = FSEvent | AsciiCategorizerEvent | LexicalCategorizerEvent | TokenEvent | SemanticRoutineEvent;
export type GenericEventQueue = FSEvent[] | AsciiCategorizerEvent[] | LexicalCategorizerEvent[] | TokenEvent[] | SemanticRoutineEvent[];
