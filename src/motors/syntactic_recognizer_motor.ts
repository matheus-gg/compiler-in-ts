import { addEventToQueue, getEventFromQueue, readEventFromQueue } from '../utils/queue_helper';
import { tokensQueue, syntacticRoutinesQueue } from '../utils/queues';
import { GenericEvent, TokenEvent } from '../types/events';

let currentEvent: TokenEvent;
let commandExpression = '';
let arithmeticExpression = '';
let blockExpression = '';
let hasElse = false;
const arithmeticOpRegex = /^[+\-*/]$/;
const booleanOpRegex = /^[=><!]$/;

type MachineReturn = {
  recognized: boolean;
  routine?: string;
  expression?: string;
  type?: string;
  nextToken?: string;
};

const removeUndefinedKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  const copy = { ...obj };
  Object.keys(copy).forEach((key) => copy[key] === undefined && delete copy[key]);
  return copy;
};

const arithmeticMachine = (event: TokenEvent): MachineReturn => {
  let currentState = 1;
  while (tokensQueue.length > 0) {
    switch (currentState) {
      case 1:
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(event)}`);
        arithmeticExpression = '';
        if (event.type === 'IDENTIFIER' || (event.type === 'GENERIC_VALUE' && event.subType === 'NUMBER')) currentState = 2;
        else if (event.value === '(') currentState = 3;
        else throw new Error('Arithmetic state 1');
        arithmeticExpression += `${event.value} `;
        break;
      case 2: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(nextEvent)}`);
        if (arithmeticOpRegex.test(nextEvent.value)) {
          currentState = 6;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          arithmeticExpression += `${currentEvent.value} `;
        } else if (nextEvent.value === '=' || nextEvent.value === ';' || nextEvent.value === ')' || booleanOpRegex.test(nextEvent.value)) {
          return {
            recognized: true,
            routine: 'ARITHMETIC',
            expression: arithmeticExpression,
          };
        } else throw new Error('Arithmetic state 2');
        break;
      }
      case 3: {
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        const recursion = arithmeticMachine(currentEvent);
        if (recursion.recognized) {
          currentState = 4;
          arithmeticExpression += `${recursion.expression} `;
        } else throw new Error('Arithmetic state 3');
        break;
      }
      case 4:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ')') currentState = 5;
        else throw new Error('Arithmetic state 4');
        arithmeticExpression += `${currentEvent.value} `;
        break;
      case 5:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (arithmeticOpRegex.test(currentEvent.value)) currentState = 6;
        else throw new Error('Arithmetic state 5');
        arithmeticExpression += `${currentEvent.value} `;
        break;
      case 6:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) currentState = 9;
        else if (currentEvent.value === '(') currentState = 7;
        else throw new Error('Arithmetic state 6');
        arithmeticExpression += `${currentEvent.value} `;
        break;
      case 7: {
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        const recursion = arithmeticMachine(currentEvent);
        if (recursion.recognized) {
          currentState = 8;
          arithmeticExpression += `${recursion.expression} `;
        } else throw new Error('Arithmetic state 7');
        break;
      }
      case 8:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Arithmetic state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ')') currentState = 9;
        else throw new Error('Arithmetic state 8');
        arithmeticExpression += `${currentEvent.value} `;
        break;
      case 9:
        console.info(`Arithmetic state ${currentState}`);
        return {
          recognized: true,
          routine: 'ARITHMETIC',
          expression: arithmeticExpression,
        };
      case 10:
        console.info(`Arithmetic state ${currentState}`);
        return {
          recognized: true,
          routine: 'ARITHMETIC',
          expression: arithmeticExpression,
        };
      default:
        throw new Error(`Arithmetic invalid state state ${currentState}`);
    }
  }
  return {
    recognized: false,
  };
};

const blockMachine = (event: TokenEvent): MachineReturn => {
  let currentState = 1;
  while (tokensQueue.length > 0) {
    switch (currentState) {
      case 1:
        blockExpression = '';
        if (event.value === '{') currentState = 2;
        else throw new Error('Block state 1');
        blockExpression += `${event.value} `;
        break;
      case 2: {
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        // eslint-disable-next-line no-use-before-define
        const commandCall = commandMachine(currentEvent);
        if (commandCall.recognized) {
          currentState = 3;
          blockExpression += `${commandCall.expression} `;
        } else throw new Error('Block state 2');
        break;
      }
      case 3:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        if (currentEvent.value === '}') currentState = 4;
        else throw new Error('Block state 3');
        blockExpression += `${currentEvent.value} `;
        break;
      case 4:
        return {
          recognized: true,
          routine: 'BLOCK',
          expression: blockExpression,
        };
      default:
        throw new Error(`Block invalid state state ${currentState}`);
    }
  }
  return {
    recognized: false,
  };
};

const commandMachine = (event: TokenEvent): MachineReturn => {
  let currentState = 1;
  const firstNextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
  let targetEvent;
  if (event.type === firstNextEvent.type && event.value === firstNextEvent.value) targetEvent = getEventFromQueue(tokensQueue) as TokenEvent;
  else targetEvent = event;
  let tokensNumber = tokensQueue.length;
  while (tokensNumber >= 0) {
    switch (currentState) {
      case 1: {
        console.info(`Command state ${currentState}, event: ${JSON.stringify(event)}, nextEvent: ${JSON.stringify(firstNextEvent)}`);
        commandExpression = '';
        hasElse = false;
        if (targetEvent.type === 'RESERVED_KEYWORD') {
          if (targetEvent.value === 'int' || targetEvent.value === 'bool') currentState = 13;
          else if (targetEvent.value === 'void') currentState = 22;
          else if (targetEvent.value === 'if') currentState = 30;
          else if (targetEvent.value === 'while') currentState = 39;
          else if (targetEvent.value === 'goto') currentState = 47;
          else if (targetEvent.value === 'print') currentState = 51;
          else throw new Error('Command state 1 reserved keyword');
          commandExpression += `${targetEvent.value} `;
        } else if (targetEvent.type === 'IDENTIFIER') {
          currentState = 2;
          commandExpression += `${targetEvent.value} `;
        } else if (targetEvent.value === '{') {
          const blockReturn = blockMachine(targetEvent);
          if (blockReturn.recognized) {
            currentState = 49;
            commandExpression += `${blockReturn.expression} `;
          } else throw new Error('Command state 1 block error');
        } else if (targetEvent.value === '(' || (targetEvent.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (event.type === 'GENERIC_VALUE' && event.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(targetEvent);
          if (arithmeticReturn.recognized) {
            currentState = 50;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 1 arithmetic error');
        } else throw new Error('Command state 1');
        break;
      }
      case 2:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '=') currentState = 3;
        else if (currentEvent.value === '(') currentState = 7;
        else if (currentEvent.value === ':') currentState = 10;
        else throw new Error('Command state 2');
        commandExpression += `${currentEvent.value} `;
        break;
      case 3: {
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'GENERIC_VALUE') {
          currentState = 4;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.value === '(' || (currentEvent.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 4;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 3 arithmetic error');
        } else if (currentEvent.type === 'IDENTIFIER') {
          currentState = 5;
          commandExpression += `${currentEvent.value} `;
        } else throw new Error('Command state 3');
        break;
      }
      case 4: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          commandExpression += `${nextEvent.value}`;
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'ASSIGNMENT',
            expression: commandExpression,
            type: 'VALUE',
          }) as GenericEvent, syntacticRoutinesQueue);
          return {
            recognized: true,
            routine: 'ASSIGNMENT',
            expression: commandExpression,
            type: 'VALUE',
          };
        }
        throw new Error('Command state 4');
      }
      case 5:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ';') currentState = 6;
        else if (currentEvent.value === '(') currentState = 20;
        else throw new Error('Command state 5');
        commandExpression += `${currentEvent.value} `;
        break;
      case 6:
        console.info(`Command state ${currentState}`);
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'ASSIGNMENT',
          expression: commandExpression,
          type: 'IDENTIFIER',
        }) as GenericEvent, syntacticRoutinesQueue);
        return {
          recognized: true,
          routine: 'ASSIGNMENT',
          expression: commandExpression,
          type: 'IDENTIFIER',
        };
      case 7:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'GENERIC_VALUE') {
          currentState = 8;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.value === ')') {
          currentState = 9;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.value === '(' || (currentEvent.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 8;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 7 arithmetic error');
        } else throw new Error('Command state 7');
        break;
      case 8:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ',') currentState = 7;
        else if (currentEvent.value === ')') currentState = 9;
        else throw new Error('Command state 8');
        commandExpression += `${currentEvent.value} `;
        break;
      case 9: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          commandExpression += `${nextEvent.value}`;
          return {
            recognized: true,
            routine: 'FUNCTION_CALL',
            expression: commandExpression,
          };
        }
        throw new Error('Command state 9');
      }
      case 10:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '{') currentState = 11;
        else throw new Error('Command state 10');
        commandExpression += `${currentEvent.value} `;
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'LABEL_INIT',
          expression: commandExpression,
        }) as GenericEvent, syntacticRoutinesQueue);
        break;
      case 11: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === '}') {
          currentState = 12;
          commandExpression = '';
          commandExpression += `${nextEvent.value} `;
        } else currentState = 56;
        break;
      }
      case 12:
        console.info(`Command state ${currentState}`);
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'LABEL_EXIT',
          expression: commandExpression,
        }) as GenericEvent, syntacticRoutinesQueue);
        getEventFromQueue(tokensQueue);
        return {
          recognized: true,
          routine: 'LABEL',
          expression: commandExpression,
        };
      case 13:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'IDENTIFIER') currentState = 14;
        else throw new Error('Command state 13');
        commandExpression += `${currentEvent.value} `;
        break;
      case 14:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        if (currentEvent.value === ' ') currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '=') currentState = 16;
        else if (currentEvent.value === ';') currentState = 15;
        else if (currentEvent.value === '(') currentState = 24;
        else throw new Error('Command state 14');
        commandExpression += `${currentEvent.value} `;
        break;
      case 15:
        console.info(`Command state ${currentState}`);
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'DECLARATION',
          expression: commandExpression,
        }) as GenericEvent, syntacticRoutinesQueue);
        return {
          recognized: true,
          routine: 'DECLARATION',
          expression: commandExpression,
        };
      case 16:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'IDENTIFIER') {
          currentState = 18;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.type === 'GENERIC_VALUE') {
          currentState = 17;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.value === '(' || (currentEvent.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 17;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 16 arithmetic error');
        } else throw new Error('Command state 16');
        break;
      case 17: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          commandExpression += `${nextEvent.value}`;
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'ASSIGNMENT',
            expression: commandExpression,
            type: 'VALUE_DECLARATION',
          }) as GenericEvent, syntacticRoutinesQueue);
          return {
            recognized: true,
            routine: 'ASSIGNMENT',
            expression: commandExpression,
            type: 'VALUE_DECLARATION',
          };
        }
        throw new Error('Command state 17');
      }
      case 18:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ';') currentState = 19;
        else if (currentEvent.value === '(') currentState = 20;
        else throw new Error('Command state 18');
        commandExpression += `${currentEvent.value} `;
        break;
      case 19:
        console.info(`Command state ${currentState}`);
        return {
          recognized: true,
          routine: 'ASSIGNMENT',
          expression: commandExpression,
          type: 'IDENTIFIER_DECLARATION',
        };
      case 20:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'GENERIC_VALUE' || currentEvent.type === 'IDENTIFIER') {
          currentState = 21;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.value === '(' || (currentEvent.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 21;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 20 arithmetic error');
        } else if (currentEvent.value === ')') {
          currentState = 61;
          commandExpression += `${currentEvent.value} `;
        } else throw new Error('Command state 20');
        break;
      case 21:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ',') currentState = 20;
        else if (currentEvent.value === ')') currentState = 61;
        else throw new Error('Command state 21');
        commandExpression += `${currentEvent.value} `;
        break;
      case 22:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'IDENTIFIER') currentState = 23;
        else throw new Error('Command state 22');
        commandExpression += `${currentEvent.value} `;
        break;
      case 23:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === '(') currentState = 24;
        else throw new Error('Command state 23');
        commandExpression += `${currentEvent.value} `;
        break;
      case 24:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'RESERVED_KEYWORD' && (currentEvent.value === 'int' || currentEvent.value === 'bool')) currentState = 25;
        else if (currentEvent.value === ')') currentState = 27;
        else throw new Error('Command state 24');
        commandExpression += `${currentEvent.value} `;
        break;
      case 25:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'IDENTIFIER') currentState = 26;
        else throw new Error('Command state 25');
        commandExpression += `${currentEvent.value} `;
        break;
      case 26:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ',') currentState = 24;
        else if (currentEvent.value === ')') currentState = 27;
        else throw new Error('Command state 26');
        commandExpression += `${currentEvent.value} `;
        break;
      case 27:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '{') {
          currentState = 28;
          commandExpression += `${currentEvent.value} `;
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'FUNCTION_DECLARATION_INIT',
            expression: commandExpression,
          }) as GenericEvent, syntacticRoutinesQueue);
        } else throw new Error('Command state 27');
        commandExpression = '';
        break;
      case 28: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === '}') {
          currentState = 29;
          commandExpression += `${nextEvent.value} `;
          getEventFromQueue(tokensQueue);
          break;
        } else if (nextEvent.type === 'RESERVED_KEYWORD' && nextEvent.value === 'return') {
          commandExpression = '';
          currentState = 59;
          commandExpression += `${nextEvent.value} `;
          getEventFromQueue(tokensQueue);
          break;
        } else {
          currentState = 55;
          break;
        }
      }
      case 29:
        console.info(`Command state ${currentState}`);
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'FUNCTION_DECLARATION_EXIT',
          expression: commandExpression,
        }) as GenericEvent, syntacticRoutinesQueue);
        return {
          recognized: true,
          routine: 'FUNCTION_DECLARATION',
          expression: commandExpression,
        };
      case 30:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(') currentState = 31;
        else throw new Error('Command state 30');
        commandExpression += `${currentEvent.value} `;
        break;
      case 31:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(' || currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 32;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 31 arithmetic error');
        } else throw new Error('Command state 31');
        break;
      case 32:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (booleanOpRegex.test(currentEvent.value)) {
          currentState = 33;
          commandExpression += `${currentEvent.value} `;
        } else throw new Error('Command state 32');
        break;
      case 33:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(' || currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 34;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 33 arithmetic error');
        } else throw new Error('Command state 33');
        break;
      case 34:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ')') currentState = 35;
        else throw new Error('Command state 34');
        commandExpression += `${currentEvent.value} `;
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'IF_INIT',
          expression: commandExpression,
        }) as GenericEvent, syntacticRoutinesQueue);
        commandExpression = '';
        break;
      case 35:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '{') currentState = 36;
        else throw new Error('Command state 35');
        commandExpression += `${currentEvent.value} `;
        break;
      case 36: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === '}') {
          currentState = 37;
          commandExpression += `${nextEvent.value} `;
          getEventFromQueue(tokensQueue);
        } else {
          currentState = 57;
          break;
        }
        break;
      }
      case 37: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.type === 'RESERVED_KEYWORD' && nextEvent.value === 'else') {
          if (!hasElse) {
            currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
            currentState = 38;
            hasElse = true;
            addEventToQueue(removeUndefinedKeys({
              recognized: true,
              routine: 'IF_EXIT',
              expression: '}',
            }) as GenericEvent, syntacticRoutinesQueue);
            commandExpression = '';
            commandExpression += `${currentEvent.value} `;
            break;
          } else throw new Error('Command state 37');
        } else {
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'IF_ELSE_EXIT',
            expression: '}',
          }) as GenericEvent, syntacticRoutinesQueue);
          return {
            recognized: true,
            routine: 'IF_ELSE',
            expression: commandExpression,
          };
        }
      }
      case 38:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '{') currentState = 36;
        else throw new Error('Command state 38');
        commandExpression += `${currentEvent.value} `;
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'ELSE_INIT',
          expression: commandExpression,
        }) as GenericEvent, syntacticRoutinesQueue);
        commandExpression = '';
        break;
      case 39:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(') currentState = 40;
        else throw new Error('Command state 39');
        commandExpression += `${currentEvent.value} `;
        break;
      case 40:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(' || currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 41;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 40 arithmetic error');
        } else throw new Error('Command state 40');
        break;
      case 41:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (booleanOpRegex.test(currentEvent.value)) {
          currentState = 42;
          commandExpression += `${currentEvent.value} `;
        } else throw new Error('Command state 41');
        break;
      case 42:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(' || currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 43;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 42 arithmetic error');
        } else throw new Error('Command state 42');
        break;
      case 43:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ')') {
          currentState = 44;
          commandExpression += `${currentEvent.value} `;
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'WHILE_INIT',
            expression: commandExpression,
          }) as GenericEvent, syntacticRoutinesQueue);
        } else throw new Error('Command state 43');
        commandExpression = '';
        break;
      case 44:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '{') currentState = 45;
        else throw new Error('Command state 44');
        commandExpression += `${currentEvent.value} `;
        break;
      case 45: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === '}') {
          currentState = 46;
          commandExpression += `${nextEvent.value} `;
          getEventFromQueue(tokensQueue);
        } else {
          currentState = 58;
          break;
        }
        break;
      }
      case 46:
        console.info(`Command state ${currentState}`);
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'WHILE_EXIT',
          expression: '};',
        }) as GenericEvent, syntacticRoutinesQueue);
        return {
          recognized: true,
          routine: 'WHILE',
          expression: commandExpression,
        };
      case 47:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'IDENTIFIER') currentState = 48;
        else throw new Error('Command state 47');
        commandExpression += `${currentEvent.value} `;
        break;
      case 48: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          commandExpression += `${nextEvent.value}`;
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'GOTO',
            expression: commandExpression,
          }) as GenericEvent, syntacticRoutinesQueue);
          return {
            recognized: true,
            routine: 'GOTO',
            expression: commandExpression,
          };
        }
        throw new Error('Command state 48');
      }
      case 49:
        console.info(`Command state ${currentState}`);
        return {
          recognized: true,
          routine: 'BLOCK',
          expression: commandExpression,
        };
      case 50:
        console.info(`Command state ${currentState}`);
        return {
          recognized: true,
          routine: 'ARITHMETIC',
          expression: commandExpression,
        };
      case 51:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === '(') currentState = 52;
        else throw new Error('Command state 51');
        commandExpression += `${currentEvent.value} `;
        break;
      case 52:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.type === 'GENERIC_VALUE' || currentEvent.type === 'IDENTIFIER') {
          currentState = 53;
          commandExpression += `${currentEvent.value} `;
        } else if (currentEvent.value === '(' || currentEvent.type === 'IDENTIFIER' || (currentEvent.type === 'GENERIC_VALUE' && currentEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(currentEvent);
          if (arithmeticReturn.recognized) {
            currentState = 53;
            commandExpression += `${arithmeticReturn.expression} `;
          } else throw new Error('Command state 52 arithmetic error');
        } else throw new Error('Command state 52');
        break;
      case 53:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ')') currentState = 54;
        else throw new Error('Command state 53');
        commandExpression += `${currentEvent.value} `;
        break;
      case 54: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          commandExpression += `${nextEvent.value}`;
          addEventToQueue(removeUndefinedKeys({
            recognized: true,
            routine: 'PRINT',
            expression: commandExpression,
          }) as GenericEvent, syntacticRoutinesQueue);
          return {
            recognized: true,
            routine: 'PRINT',
            expression: commandExpression,
          };
        }
        throw new Error('Command state 54');
      }
      case 55: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          currentState = 28;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else if (nextEvent.value === '}') {
          currentState = 29;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else {
          const commandResponse = commandMachine(nextEvent);
          if (commandResponse.recognized) commandExpression += `${commandResponse.expression} `;
          else throw new Error('Command state 55 command error');
          break;
        }
      }
      case 56: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          currentState = 11;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else if (nextEvent.value === '}') {
          currentState = 12;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else {
          const commandResponse = commandMachine(nextEvent);
          if (commandResponse.recognized) commandExpression += `${commandResponse.expression} `;
          else throw new Error('Command state 56 command error');
          break;
        }
      }
      case 57: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          currentState = 36;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else if (nextEvent.value === '}') {
          currentState = 37;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else {
          const commandResponse = commandMachine(nextEvent);
          if (commandResponse.recognized) commandExpression += `${commandResponse.expression} `;
          else throw new Error('Command state 57 command error');
          break;
        }
      }
      case 58: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          currentState = 45;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else if (nextEvent.value === '}') {
          currentState = 46;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else {
          const commandResponse = commandMachine(nextEvent);
          if (commandResponse.recognized) commandExpression += `${commandResponse.expression} `;
          else throw new Error('Command state 58 command error');
          break;
        }
      }
      case 59: {
        const nextEvent = readEventFromQueue(tokensQueue, 0) as TokenEvent;
        console.info(`Command state ${currentState}, nextEvent: ${JSON.stringify(nextEvent)}`);
        if (nextEvent.value === ';') {
          currentState = 28;
          currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
          commandExpression += `${currentEvent.value} `;
          break;
        } else if (nextEvent.type === 'IDENTIFIER' && readEventFromQueue(tokensQueue, 1)?.value === ';') {
          currentState = 60;
          commandExpression += `${nextEvent.value} `;
          getEventFromQueue(tokensQueue);
          break;
        } else if (nextEvent.value === '(' || (nextEvent.type === 'IDENTIFIER' && arithmeticOpRegex.test(readEventFromQueue(tokensQueue, 0)?.value ?? '')) || (nextEvent.type === 'GENERIC_VALUE' && nextEvent.subType === 'NUMBER')) {
          const arithmeticReturn = arithmeticMachine(getEventFromQueue(tokensQueue) as TokenEvent);
          if (arithmeticReturn.recognized) {
            currentState = 60;
            commandExpression += `${arithmeticReturn.expression} `;
            break;
          } else throw new Error('Command state 59 arithmetic error');
        } else throw new Error('Command state 59');
      }
      case 60:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ';') {
          currentState = 55;
          commandExpression += `${currentEvent.value} `;
          break;
        } else throw new Error('Command state 60');
      case 61:
        currentEvent = getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Command state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ';') {
          currentState = 62;
          commandExpression += `${currentEvent.value} `;
          break;
        } else throw new Error('Command state 61');
      case 62:
        console.info(`Command state ${currentState}`);
        addEventToQueue(removeUndefinedKeys({
          recognized: true,
          routine: 'ASSIGNMENT',
          expression: commandExpression,
          type: 'FUNCTION_CALL',
        }) as GenericEvent, syntacticRoutinesQueue);
        return {
          recognized: true,
          routine: 'ASSIGNMENT',
          expression: commandExpression,
          type: 'FUNCTION_CALL',
          nextToken: ';',
        };
      default:
        throw new Error(`Command invalid state state ${currentState}`);
    }
    tokensNumber -= 1;
  }
  return {
    recognized: false,
  };
};

const programMachine = (event: TokenEvent): 0 | 1 => {
  let currentState = 1;
  let i = 2;
  let usedEvent = false;
  let useReturnedToken = false;
  let returnedToken;
  while (tokensQueue.length > 0 || i > 0) {
    switch (currentState) {
      case 1: {
        useReturnedToken = false;
        let commandResult;
        if (!usedEvent) {
          commandResult = commandMachine(event);
          usedEvent = true;
        } else commandResult = commandMachine(readEventFromQueue(tokensQueue, 0) as TokenEvent);
        console.info(`Program state ${currentState}, event: ${JSON.stringify(commandResult)}`);
        if (commandResult.recognized) currentState = 2;
        else throw new Error('Program state 1');
        if (commandResult.nextToken) {
          useReturnedToken = true;
          returnedToken = { value: commandResult.nextToken };
        }
        break;
      }
      case 2:
        currentEvent = useReturnedToken ? returnedToken as TokenEvent : getEventFromQueue(tokensQueue) as TokenEvent;
        console.info(`Program state ${currentState}, event: ${JSON.stringify(currentEvent)}`);
        if (currentEvent.value === ';') currentState = 1;
        else if (currentEvent.value === 'EOF') currentState = 3;
        else throw new Error('Program state 2');
        break;
      case 3:
        return 1;
      default:
        throw new Error(`Program invalid state state ${currentState}`);
    }
    if (tokensQueue.length === 0) i -= 1;
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
    if (programReturn === 0) {
      console.info('syntacticRoutinesQueue', syntacticRoutinesQueue);
      throw new Error('Lexical analyzer FSM returned on state 0');
    }
    console.info('syntacticRoutinesQueue', syntacticRoutinesQueue);
    console.info(`Uncanny return of programMachine function: ${programReturn}`);
  }
  return 0;
};

export { processSyntacticRecognition };
