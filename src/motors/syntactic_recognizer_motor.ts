import { addEventToQueue, getEventFromQueue, readEventFromQueue } from '../utils/queue_helper';
import { tokensQueue, syntacticRoutinesQueue } from '../utils/queues';
import { GenericEvent, TokenEvent } from '../types/events';

let currentEvent: TokenEvent;
let routineBuffer: string;

const arithmeticOpRegex = /^[+-*/]$/;
const booleanOpRegex = /^[=><!]$/;

type MachineReturn = {
  recognized: boolean;
  routine?: string;
};

const removeUndefinedKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  const copy = { ...obj };
  Object.keys(copy).forEach((key) => copy[key] === undefined && delete copy[key]);
  return copy;
};

const arithmeticMachine = (event: TokenEvent): MachineReturn => {
  let currentState = 1;
  switch (currentState) {
    case 1:
      if (event.type === 'IDENTIFIER' || (event.type === 'GENERIC_VALUE' && event.subType === 'NUMBER')) currentState = 2;
      else if (event.value === '(') currentState = 3;
      else throw new Error();
      break;
    case 2:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (arithmeticOpRegex.test(currentEvent.value)) currentState = 6;
      else throw new Error();
      break;
    case 3: {
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      const recursion = arithmeticMachine(currentEvent);
      if (recursion.recognized) currentState = 4;
      else throw new Error();
      break;
    }
    case 4:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (currentEvent.value === ')') currentState = 5;
      else throw new Error();
      break;
    case 5:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (arithmeticOpRegex.test(currentEvent.value)) currentState = 6;
      else throw new Error();
      break;
    case 6:
      if (currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) currentState = 9;
      else if (currentEvent.value === '(') currentState = 7;
      else throw new Error();
      break;
    case 7: {
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      const recursion = arithmeticMachine(currentEvent);
      if (recursion.recognized) currentState = 8;
      else throw new Error();
      break;
    }
    case 8:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (currentEvent.value === ')') currentState = 9;
      else throw new Error();
      break;
    case 9:
      addEventToQueue(removeUndefinedKeys({ routine: 'ARITHMETIC' }) as GenericEvent, syntacticRoutinesQueue);
      return {
        recognized: true,
        routine: 'ARITHMETIC',
      };
    default:
      throw new Error();
  }
  return {
    recognized: false,
  };
};

const blockMachine = (event: TokenEvent): MachineReturn => {
  let currentState = 1;
  switch (currentState) {
    case 1:
      if (event.value === '{') currentState = 2;
      else throw new Error();
      break;
    case 2: {
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      // eslint-disable-next-line no-use-before-define
      const commandCall = commandMachine(currentEvent);
      if (commandCall.recognized) currentState = 3;
      else throw new Error();
      break;
    }
    case 3:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (currentEvent.value === '}') currentState = 4;
      break;
    case 4:
      addEventToQueue(removeUndefinedKeys({ routine: 'BLOCK' }) as GenericEvent, syntacticRoutinesQueue);
      return {
        recognized: true,
        routine: 'BLOCK',
      };
    default:
      throw new Error();
  }
  return {
    recognized: false,
  };
};

const commandMachine = (event: TokenEvent): MachineReturn => {
  let currentState = 1;
  switch (currentState) {
    case 1:
      if (event.type === 'RESERVED_KEYWORD') {
        if (event.value === 'int' || event.value === 'bool') currentState = 2;
        else if (event.value === 'void') currentState = 11;
        else if (event.value === 'if') {
          currentState = 23;
          routineBuffer = 'if';
        } else if (event.value === 'while') {
          currentState = 31;
          routineBuffer = 'while';
        } else if (event.value === 'goto') currentState = 35;
        else if (event.value === 'print') currentState = 39;
        else throw new Error();
      } else if (event.type === 'IDENTIFIER' && (readEventFromQueue(tokensQueue, 0)?.value === '(' || readEventFromQueue(tokensQueue, 0)?.value === '=')) currentState = 8;
      else if (event.value === '{') {
        const blockReturn = blockMachine(event);
        if (blockReturn.recognized) currentState = 37;
        else throw new Error();
      } else if (event.value === '(' || (event.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (event.type === 'GENERIC_VALUE' && event.subType === 'NUMBER')) {
        const arithmeticReturn = arithmeticMachine(event);
        if (arithmeticReturn.recognized) currentState = 38;
        else throw new Error();
      }
      break;
    case 2:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (currentEvent.type === 'IDENTIFIER') currentState = 3;
      else throw new Error();
      break;
    case 3: {
      const nextToken = readEventFromQueue(tokensQueue, 0)?.value;
      if (nextToken === '=') {
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        currentState = 4;
        break;
      } else if (nextToken === '(') {
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        currentState = 13;
        break;
      }
      addEventToQueue(removeUndefinedKeys({ routine: 'DECLARATION' }) as GenericEvent, syntacticRoutinesQueue);
      return {
        recognized: true,
        routine: 'DECLARATION',
      };
    }
    case 4:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (currentEvent.type === 'IDENTIFIER') currentState = 5;
      else if (currentEvent.type === 'GENERIC_VALUE') {
        const arithmeticReturn = arithmeticMachine(event);
        if (arithmeticReturn.recognized) currentState = 42;
      }
      break;
    case 5:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'ASSIGNMENT',
      };
    case 6:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 7:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 8:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 9:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 10:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'ASSIGNMENT',
      };
    case 11:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 12:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 13:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 14:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 15:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 16:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 17:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 18:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 19:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'FUNCTION_DECLARATION',
      };
    case 20:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 21:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 22:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'FUNCTION_CALL',
      };
    case 23:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 24:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 25:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 26:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 27:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 28:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 29:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'IF' || 'IF...ELSE' || 'WHILE',
      };
    case 30:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 31:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 32:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 33:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 34:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'LABEL_DECLARATION',
      };
    case 35:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 36:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'GOTO_LABEL',
      };
    case 37:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'BLOCK',
      };
    case 38:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'ARITHMETIC',
      };
    case 39:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 40:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      break;
    case 41:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      return {
        recognized: true,
        routine: 'PRINT',
      };
    default:
      throw new Error();
  }
  return {
    recognized: false,
  };
};

const programMachine = (event: TokenEvent): 0 | 1 => {
  let currentState = 1;
  switch (currentState) {
    case 1: {
      const commandResult = commandMachine(event);
      if (commandResult.recognized) currentState = 2;
      else throw new Error();
      break;
    }
    case 2:
      currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
      if (currentEvent.value === ';') currentState = 1;
      else if (currentEvent.value === 'EOF') currentState = 3;
      else throw new Error();
      break;
    case 3:
      return 1;
    default:
      throw new Error();
  }
  return 0;
};

const processSyntacticRecognition = (): 0 | 1 => {
  while (tokensQueue.length > 0) {
    const programReturn = programMachine(getEventFromQueue(tokensQueue) as TokenEvent);
    // console.info('currentToken', JSON.stringify(FSMReturn));
    if (programReturn === 1) {
      console.info('syntacticRoutinesQueue', syntacticRoutinesQueue);
      return 1;
    }
    if (programReturn === 0)
      throw new Error('Lexical analyzer FSM returned on state 0');
    console.info('syntacticRoutinesQueue', syntacticRoutinesQueue);
    console.info(`Uncanny return of programMachine function: ${programReturn}`);
  }
  return 0;
};

export { processSyntacticRecognition };
