import { OneOf } from '../types/utility';

export const reservedKeywordsArray = [
  'goto',
  'if',
  'else',
  'while',
  'int',
  'bool',
  'void',
  'return',
  'true',
  'false',
];
export const reservedKeywordsEnum = {
  GOTO: 'goto',
  IF: 'if',
  ELSE: 'else',
  WHILE: 'while',
  INT: 'int',
  BOOL: 'bool',
  VOID: 'void',
  RETURN: 'return',
  TRUE: 'true',
  FALSE: 'false',
};
export type ReservedKeyword = OneOf<typeof reservedKeywordsEnum>;
