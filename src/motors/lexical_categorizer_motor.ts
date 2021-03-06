import { addEventToQueue, getEventFromQueue, readEventFromQueue } from '../utils/queue_helper';
import { lexicalCategorizerQueue, tokensQueue } from '../utils/queues';
import { LexicalCategorizerEvent, TokenEvent } from '../types/events';

const letterRegex = /^[a-zA-Z]$/;
const digitRegex = /^[0-9]$/;
const arithmeticOpRegex = /^[+\-*/]$/;
const booleanOpRegex = /^[=><!]$/;

let eventBuffer: LexicalCategorizerEvent | undefined;

type IsBoolReturn = {
  bool: boolean;
  value?: 'true' | 'false';
};

type IsReservedKeyReturn = {
  reserved: boolean;
  value?:
    'goto'|
    'if' |
    'else' |
    'while' |
    'int' |
    'bool' |
    'void' |
    'return' |
    'print' |
    'true' |
    'false';
};

type LexicalFSMReturn = {
  token: string;
  type: string;
  subType?: string;
  add?: string;
};

const removeUndefinedKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  const copy = { ...obj };
  Object.keys(copy).forEach((key) => copy[key] === undefined && delete copy[key]);
  return copy;
};

const lookAheadForBoolExp = (char: 't' | 'f'): IsBoolReturn => {
  if (char === 't') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'r' &&
      (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 'u' &&
      (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'e' &&
      ((readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ' ' ||
      (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ';' ||
      (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ',' ||
      (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ']')) {
        getEventFromQueue(lexicalCategorizerQueue);
        getEventFromQueue(lexicalCategorizerQueue);
        getEventFromQueue(lexicalCategorizerQueue);
        return {
          bool: true,
          value: 'true',
        };
    }
    return {
      bool: false,
    };
  } if (char === 'f') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'a' &&
      (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 'l' &&
      (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 's' &&
      (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === 'e' &&
      ((readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ' ' ||
      (readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ';' ||
      (readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ',' ||
      (readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ']')) {
        getEventFromQueue(lexicalCategorizerQueue);
        getEventFromQueue(lexicalCategorizerQueue);
        getEventFromQueue(lexicalCategorizerQueue);
        getEventFromQueue(lexicalCategorizerQueue);
        return {
          bool: true,
          value: 'false',
        };
    }
    return {
      bool: false,
    };
  }
  return {
    bool: false,
  };
};

const lookAheadForReservedKey = (char: 'g' | 'i' | 'e' | 'w' | 'b' | 'v' | 'r' | 'p'): IsReservedKeyReturn => {
  if (char === 'g') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'o' &&
      (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 't' &&
      (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'o' &&
      ((readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ' ' ||
      (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'goto',
      };
    }
  }
  if (char === 'i') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'n' &&
      (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 't' &&
      ((readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === ' ' ||
      (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'int',
      };
    }
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'f' &&
      ((readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === ' ' ||
      (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'if',
      };
    }
  }
  if (char === 'e') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'l' &&
    (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 's' &&
    (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'e' &&
    ((readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ' ' ||
    (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'else',
      };
    }
  }
  if (char === 'w') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'h' &&
    (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 'i' &&
    (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'l' &&
    (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === 'e' &&
    ((readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ' ' ||
    (readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'while',
      };
    }
  }
  if (char === 'b') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'o' &&
    (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 'o' &&
    (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'l' &&
    ((readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ' ' ||
    (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'bool',
      };
    }
  }
  if (char === 'v') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'o' &&
    (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 'i' &&
    (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'd' &&
    ((readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ' ' ||
    (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'void',
      };
    }
  }
  if (char === 'r') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'e' &&
      (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 't' &&
      (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'u' &&
      (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === 'r' &&
      (readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === 'n' &&
      ((readEventFromQueue(lexicalCategorizerQueue, 5) as LexicalCategorizerEvent)?.value === ' ' ||
      (readEventFromQueue(lexicalCategorizerQueue, 5) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'return',
      };
    }
  }
  if (char === 'p') {
    if ((readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent)?.value === 'r' &&
    (readEventFromQueue(lexicalCategorizerQueue, 1) as LexicalCategorizerEvent)?.value === 'i' &&
    (readEventFromQueue(lexicalCategorizerQueue, 2) as LexicalCategorizerEvent)?.value === 'n' &&
    (readEventFromQueue(lexicalCategorizerQueue, 3) as LexicalCategorizerEvent)?.value === 't' &&
    ((readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ' ' ||
    (readEventFromQueue(lexicalCategorizerQueue, 4) as LexicalCategorizerEvent)?.value === ';')) {
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      getEventFromQueue(lexicalCategorizerQueue);
      return {
        reserved: true,
        value: 'print',
      };
    }
  }
  return {
    reserved: false,
  };
};

const lexicalAnalizerFSM = (): LexicalFSMReturn | 1 | 0 => {
  let currentState = 1;
  let token = '';
  while (lexicalCategorizerQueue.length > 0) {
    let currentEvent: LexicalCategorizerEvent | undefined;
    if (currentState === 5 || currentState === 9) currentEvent = eventBuffer;
    else currentEvent = getEventFromQueue(lexicalCategorizerQueue) as LexicalCategorizerEvent;
    if (currentEvent) {
      if (currentEvent.type === 'EOF') return 1;
      switch (currentState) {
        case 1:
          switch (currentEvent.type) {
            case 'LETTER':
              if (currentEvent.value === 'g' ||
                currentEvent.value === 'i' ||
                currentEvent.value === 'e' ||
                currentEvent.value === 'w' ||
                currentEvent.value === 'b' ||
                currentEvent.value === 'v' ||
                currentEvent.value === 'r' ||
                currentEvent.value === 'p') {
                const isReserved = lookAheadForReservedKey(currentEvent.value);
                if (isReserved.reserved) {
                  token += isReserved.value;
                  return {
                    token,
                    type: 'RESERVED_KEYWORD',
                  };
                }
                token += currentEvent.value;
                currentState = 2;
              } else if (currentEvent.value === 't' || currentEvent.value === 'f') {
                const isBoolean = lookAheadForBoolExp(currentEvent.value);
                if (isBoolean.bool) {
                  token += isBoolean.value;
                  eventBuffer = currentEvent;
                  currentState = 5;
                } else {
                  token += currentEvent.value;
                  currentState = 2;
                }
              } else {
                token += currentEvent.value;
                currentState = 2;
              }
              break;
            case 'DIGIT': {
              token += currentEvent.value;
              const nextChar = readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent;
              if (nextChar?.value === ';' || nextChar?.value === ' ' || nextChar?.value === ')') {
                return {
                  token,
                  type: 'GENERIC_VALUE',
                  subType: 'NUMBER',
                };
              }
              currentState = 4;
              break;
            }
            case 'SPECIAL':
              if (currentEvent.value === '[') {
                token += currentEvent.value;
                currentState = 3;
              } else if (currentEvent.value === '#') {
                token += currentEvent.value;
                currentState = 8;
              } else {
                token += currentEvent.value;
                eventBuffer = currentEvent;
                currentState = 9;
              }
              break;
            case 'DELIMITER':
              if (currentEvent.value === ';') {
                token += currentEvent.value;
                eventBuffer = currentEvent;
                currentState = 9;
              }
              break;
            case 'EOL':
              break;
            default:
              throw new Error(`Invalid ascii event on state 1 of lexical analizer FSM: ${JSON.stringify(currentEvent)}`);
          }
          break;
        case 2: {
          if (currentEvent.value === ';' || currentEvent.value === '(' || currentEvent.value === ')' || currentEvent.value === ':' ||
              arithmeticOpRegex.test(currentEvent.value) || booleanOpRegex.test(currentEvent.value)) {
            return {
              token,
              type: 'IDENTIFIER',
              add: currentEvent.value,
            };
          }
          if (currentEvent.value === ' ') {
            return {
              token,
              type: 'IDENTIFIER',
            };
          }
          if (letterRegex.test(currentEvent.value) || digitRegex.test(currentEvent.value) || currentEvent.value === '_') {
            token += currentEvent.value;
            const nextChar = readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent;
            if (nextChar?.value === ';' || nextChar?.value === ' ' || nextChar?.value === '(' || nextChar?.value === ')' || nextChar?.value === ':' || nextChar?.value === ',') {
              return {
                token,
                type: 'IDENTIFIER',
              };
            }
            if (letterRegex.test(nextChar?.value ?? '') || digitRegex.test(nextChar?.value ?? '') || nextChar?.value === '_') break;
            else throw new Error(`Invalid ascii event on state 2 of lexical analizer FSM: ${JSON.stringify(currentEvent)}`);
          }
          throw new Error(`Invalid ascii event on state 2 of lexical analizer FSM: ${JSON.stringify(currentEvent)}`);
        }
        case 3:
          if (currentEvent.type === 'DELIMITER') break;
          if (digitRegex.test(currentEvent.value)) {
            token += currentEvent.value;
            currentState = 6;
          } else if (currentEvent.value === 't' || currentEvent.value === 'f') {
            const isBoolean = lookAheadForBoolExp(currentEvent.value);
            if (isBoolean.bool) {
              token += isBoolean.value;
              currentState = 7;
            } else throw new Error(`The token provided is not boolean: ${currentEvent.value}`);
          } else throw new Error(`The token provided is not boolean or number: ${currentEvent.value}`);
          break;
        case 4:
          if (digitRegex.test(currentEvent.value)) {
            token += currentEvent.value;
            const nextChar = readEventFromQueue(lexicalCategorizerQueue, 0) as LexicalCategorizerEvent;
            if (nextChar?.value === ';' || nextChar?.value === ' ' || nextChar?.value === ')') {
              return {
                token,
                type: 'GENERIC_VALUE',
                subType: 'NUMBER',
              };
            }
            if (digitRegex.test(nextChar?.value ?? '')) break;
            throw new Error(`Invalid char for state 4: ${currentEvent.value}`);
          }
          throw new Error(`Invalid char for state 4: ${currentEvent.value}`);
        case 5:
          return {
            token,
            type: 'GENERIC_VALUE',
            subType: 'BOOLEAN',
          };
        case 6:
          if (digitRegex.test(currentEvent.value)) token += currentEvent.value;
          else if (currentEvent.value === ',') {
            token += currentEvent.value;
            currentState = 3;
          } else if (currentEvent.value === ']') {
            token += currentEvent.value;
            return {
              token,
              type: 'GENERIC_VALUE',
              subType: 'ARRAY_NUMBER',
            };
          } else throw new Error(`Invalid char for state 6: ${currentEvent.value}`);
          break;
        case 7:
          if (currentEvent.value === ',') {
            token += currentEvent.value;
            currentState = 3;
          } else if (currentEvent.value === ']') {
            token += currentEvent.value;
            return {
              token,
              type: 'GENERIC_VALUE',
              subType: 'ARRAY_BOOLEAN',
            };
          } else throw new Error(`Invalid char for state 6: ${currentEvent.value}`);
          break;
        case 8:
          if (currentEvent.type === 'EOL') {
            return {
              token,
              type: 'COMMENT',
            };
          }
          token += currentEvent.value;
          break;
        case 9:
          return {
            token,
            type: 'OTHERS',
          };
        default:
          throw new Error(`Invalid state for lexical analizer FSM: ${currentState}`);
      }
    }
  }
  return 0;
};

const processLexicalCategorization = (): 0 | 1 => {
  while (lexicalCategorizerQueue.length > 0) {
    const FSMReturn = lexicalAnalizerFSM();
    // console.info('currentToken', JSON.stringify(FSMReturn));
    if (FSMReturn === 1) {
      addEventToQueue(removeUndefinedKeys({ type: 'SPECIAL', value: 'EOF' }) as TokenEvent, tokensQueue);
      console.info('tokensQueue', tokensQueue);
      return 1;
    }
    if (FSMReturn === 0)
      throw new Error('Lexical analyzer FSM returned on state 0');
    if (FSMReturn.type !== 'COMMENT') addEventToQueue(removeUndefinedKeys({ type: FSMReturn.type, value: FSMReturn.token, subType: FSMReturn.subType }) as TokenEvent, tokensQueue);
    if (FSMReturn.add) addEventToQueue(removeUndefinedKeys({ type: 'SPECIAL', value: FSMReturn.add }) as TokenEvent, tokensQueue);
  }
  addEventToQueue(removeUndefinedKeys({ type: 'SPECIAL', value: 'EOF' }) as TokenEvent, tokensQueue);
  console.info('tokensQueue', tokensQueue);
  return 1;
};

export { processLexicalCategorization };
