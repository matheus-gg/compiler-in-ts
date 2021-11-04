import { FSEvent, AsciiCategorizerEvent, LexicalCategorizerEvent, TokenEvent, SyntacticRoutineEvent } from "../types/events";

export const fsEventQueue: FSEvent[] = [];
export const asciiCategorizerQueue: AsciiCategorizerEvent[] = [];
export const lexicalCategorizerQueue: LexicalCategorizerEvent[] = [];
export const tokensQueue: TokenEvent[] = [];
export const syntacticRoutinesQueue: SyntacticRoutineEvent[] = [];
