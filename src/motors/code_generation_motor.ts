import * as fs from 'fs';
import { fstat } from 'fs';
import { addEventToQueue, getEventFromQueue, readEventFromQueue } from '../utils/queue_helper';
import { syntacticRoutinesQueue } from '../utils/queues';
import { GenericEvent, SemanticRoutineEvent } from '../types/events';
import { symbolTable } from '../utils/tables';

let machineCode = '';
const currentCommand = '';
let ifCount = 0;
let withElse = false;
let whileCount = 0;
let whileControlVar = '';

const numberRegex = /^[0-9]*$/;
const identifierRegex = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

const insertMachineCommand = (command: string) => {
  machineCode += command;
};

const convertType = (sourceType: string) => {
  if (sourceType === 'int') return 'i32';
  if (sourceType === 'bool') return 'i1';
  if (sourceType === 'void') return 'void';
  return '';
};

const convertArithmeticOp = (operator: string) => {
  if (operator === '+') return 'add';
  if (operator === '-') return 'sub';
  if (operator === '*') return 'mul';
  if (operator === '/') return 'sdiv';
  throw new Error(`Invalid arithmetic operator: ${operator}`);
};

const convertBooleanOp = (operator: string) => {
  if (operator === '=') return 'eq';
  if (operator === '>') return 'sgt';
  if (operator === '<') return 'slt';
  if (operator === '!') return 'ne';
  throw new Error(`Invalid boolean operator: ${operator}`);
};

const checkType = (token: string) => {
  if (numberRegex.test(token)) return 'i32';
  if (identifierRegex.test(token)) return `%${token}`;
  throw new Error(`Token doesnt belong to any valid type: ${token}`);
};

const generateLLVMIRCode = () => {
  while (syntacticRoutinesQueue.length > 0) {
    const currentEvent = getEventFromQueue(syntacticRoutinesQueue) as SemanticRoutineEvent;
    switch (currentEvent.routine) {
      case 'FUNCTION_DECLARATION_INIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const types = {} as Record<string, unknown>;
          const names = {} as Record<string, unknown>;
          const funcType = convertType(splittedTokens[0]);
          types.functionType = funcType;
          if (splittedTokens[3] && splittedTokens[3] !== ')') {
            let i = 3;
            let varNumber = 1;
            while (i <= splittedTokens.length) {
              if (splittedTokens[i] !== '{') {
                types[`v${varNumber}Type`] = splittedTokens[i];
                names[`v${varNumber}Name`] = splittedTokens[i + 1];
              }
              i += 3;
              varNumber += 1;
            }
          }
          let command = `declare ${types.functionType} @${splittedTokens[1]}${splittedTokens[2]}`;
          for (const key in types) {
            if (key !== 'functionType')
              command += `${convertType(types[key] as string)} %${names[key.replace('Type', 'Name')]}, `;
          }
          if (command.substring(command.length - 2) === ', ') command = command.slice(0, -2);
          command += ') {\n';
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'FUNCTION_DECLARATION_EXIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          let retValue;
          if (numberRegex.test(splittedTokens[1])) retValue = splittedTokens[1];
          else retValue = `%${splittedTokens[1]}`;
          insertMachineCommand(`ret ${retValue}\n`);
        }
        insertMachineCommand('}\n');
        break;
      }
      case 'DECLARATION': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const command = ` %${splittedTokens[1]} external ${convertType(splittedTokens[0])}\n`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'ASSIGNMENT':
        switch (currentEvent.type) {
          case 'IDENTIFIER': {
            const splittedTokens = currentEvent.expression?.split(' ');
            if (splittedTokens) {
              const command = ` %${splittedTokens[0]} = %${splittedTokens[2]}\n`;
              console.info('Command: ', command);
              insertMachineCommand(command);
            }
            break;
          }
          case 'VALUE': {
            const splittedTokens = currentEvent.expression?.split(' ');
            if (splittedTokens) {
              let operatorPosition;
              if (splittedTokens[0] === 'int' || splittedTokens[0] === 'bool') operatorPosition = 4;
              else operatorPosition = 3;
              let command = '';
              if (splittedTokens.length === 4) {
                let rightOperand;
                if (numberRegex.test(splittedTokens[2])) rightOperand = splittedTokens[2];
                else rightOperand = `%${splittedTokens[2]}`;
                command = `%${splittedTokens[0]} = ${rightOperand}\n`;
                if (splittedTokens[0] === whileControlVar) {
                  const commandBody = `br label %while${whileCount}.latch\n`;
                  let commandLatch = `%while${whileCount}.latch:\n`;
                  commandLatch += `%i.next = %${whileControlVar}\n`;
                  commandLatch += `br label %while${whileCount}.header\n`;
                  command += `${commandBody}\n${commandLatch}`;
                }
              } else {
                const llvmOperator = convertArithmeticOp(splittedTokens[operatorPosition]);
                if (operatorPosition === 4) {
                  let firstOperand;
                  if (numberRegex.test(splittedTokens[3])) firstOperand = splittedTokens[3];
                  else firstOperand = `%${splittedTokens[3]}`;
                  let secondOperand;
                  if (numberRegex.test(splittedTokens[5])) secondOperand = splittedTokens[5];
                  else secondOperand = `%${splittedTokens[5]}`;
                  command += `%${splittedTokens[1]} = ${llvmOperator} i32 ${firstOperand}, ${secondOperand}\n`;
                } else if (operatorPosition === 3) {
                  let firstOperand;
                  if (numberRegex.test(splittedTokens[2])) firstOperand = splittedTokens[2];
                  else firstOperand = `%${splittedTokens[2]}`;
                  let secondOperand;
                  if (numberRegex.test(splittedTokens[4])) secondOperand = splittedTokens[4];
                  else secondOperand = `%${splittedTokens[4]}`;
                  command += `%${splittedTokens[0]} = ${llvmOperator} i32 ${firstOperand}, ${secondOperand}\n`;
                  if (splittedTokens[0] === whileControlVar) {
                    const commandBody = `br label %while${whileCount}.latch\n`;
                    let commandLatch = `%while${whileCount}.latch:\n`;
                    commandLatch += `%i.next = %${whileControlVar}\n`;
                    commandLatch += `br label %while${whileCount}.header\n`;
                    command += `${commandBody}\n${commandLatch}`;
                  }
                } else throw new Error(`Invalid operatorPosition: ${operatorPosition}`);
              }
              console.info('Command: ', command);
              insertMachineCommand(command);
            }
          }
            break;
          case 'VALUE_DECLARATION': {
            const splittedTokens = currentEvent.expression?.split(' ');
            if (splittedTokens) {
              const command = ` %${splittedTokens[1]} = ${convertType(splittedTokens[0])} ${splittedTokens[3]}\n`;
              console.info('Command: ', command);
              insertMachineCommand(command);
            }
            break;
          }
          case 'FUNCTION_CALL': {
            const splittedTokens = currentEvent.expression?.split(' ');
            if (splittedTokens) {
              let leftOperand;
              if (numberRegex.test(splittedTokens[1])) leftOperand = splittedTokens[1];
              else if (!(splittedTokens[1] === '=')) leftOperand = `%${splittedTokens[1]}`;
              const types = {} as Record<string, unknown>;
              const values = {} as Record<string, unknown>;
              const funcType = convertType(splittedTokens[0]);
              types.functionType = funcType || 'i32';
              let i = 5;
              if (funcType === '') i -= 1;
              if (splittedTokens[i] && splittedTokens[i] !== ')') {
                let varNumber = 1;
                while (i <= splittedTokens.length) {
                  if (splittedTokens[i] !== ')') {
                    if (splittedTokens[i] !== ',' && splittedTokens[i] !== ';' && splittedTokens[i] !== '' && splittedTokens[i] !== '(' && splittedTokens[i] !== undefined) {
                      types[`v${varNumber}Type`] = checkType(splittedTokens[i]);
                      values[`v${varNumber}Value`] = splittedTokens[i];
                    }
                  }
                  i += 1;
                  varNumber += 1;
                }
              }
              let assignment = 3;
              if (funcType === '') assignment -= 1;
              let command = `${leftOperand ?? ''}${leftOperand ? ' = ' : ''}call ${types.functionType} @${splittedTokens[assignment]}${splittedTokens[assignment + 1]}`;
              for (const key in types) {
                if (key !== 'functionType') {
                  let targetValue;
                  if (numberRegex.test(values[key.replace('Type', 'Value')] as string)) targetValue = values[key.replace('Type', 'Value')] as string;
                  else targetValue = `%${values[key.replace('Type', 'Value')] as string}`;
                  command += `i32 ${targetValue}, `;
                }
              }
              if (command.substring(command.length - 2) === ', ') command = command.slice(0, -2);
              command += ')\n';
              console.info('Command: ', command);
              if (splittedTokens[0] === whileControlVar) {
                const commandBody = `br label %while${whileCount}.latch\n`;
                let commandLatch = `%while${whileCount}.latch:\n`;
                commandLatch += `%i.next = %${whileControlVar}\n`;
                commandLatch += `br label %while${whileCount}.header\n`;
                command += `${commandBody}\n${commandLatch}`;
              }
              insertMachineCommand(command);
            }
            break;
          }
          default:
            throw new Error(`Invalid assignment type ${currentEvent.type}`);
        }
        break;
      case 'IF_INIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const booleanOperation = convertBooleanOp(splittedTokens[4]);
          let firstOperand;
          if (numberRegex.test(splittedTokens[2])) firstOperand = splittedTokens[2];
          else firstOperand = `%${splittedTokens[2]}`;
          let secondOperand;
          if (numberRegex.test(splittedTokens[5])) secondOperand = splittedTokens[5];
          else secondOperand = `%${splittedTokens[5]}`;
          let commandEntry = `if${ifCount}.entry:\n`;
          commandEntry += `%0 = icmp ${booleanOperation} i32 ${firstOperand}, ${secondOperand}\n`;
          commandEntry += `br i1 0, label %if${ifCount}.btrue, label %if${ifCount}.bfalse\n`;
          const commandBTrue = `if${ifCount}.btrue:\n`;
          const command = `${commandEntry}\n${commandBTrue}`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'IF_EXIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const command = `br label %if${ifCount}.end\n\n`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'ELSE_INIT': {
        withElse = true;
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const command = `if${ifCount}.bfalse:\n`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'IF_ELSE_EXIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const commandBranch = `br label %if${ifCount}.end\n`;
          const commandEnd = `if${ifCount}.end:\n`;
          let command = '';
          if (!withElse) {
            let commandBFalse = `if${ifCount}.bfalse:\n`;
            commandBFalse += `br label %if${ifCount}.end\n`;
            command = `${commandBranch}\n${commandBFalse}\n${commandEnd}`;
          } else command = `${commandBranch}\n${commandEnd}`;
          console.info('Command: ', command);
          insertMachineCommand(command);
          ifCount += 1;
          withElse = false;
        }
        break;
      }
      case 'WHILE_INIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          whileControlVar = splittedTokens[2];
          let commandEntry = `while${whileCount}.entry:\n`;
          commandEntry += `br label %while${whileCount}.header\n`;
          let commandHeader = `while${whileCount}.header:\n`;
          commandHeader += `%_i = phi i32 [%${whileControlVar}, %while${whileCount}.entry], [%i.next, %while${whileCount}.latch]\n`;
          commandHeader += `%cond = icmp slt i32 %_i, %${splittedTokens[5]}\n`;
          commandHeader += `br i1 %cond, label %while${whileCount}.body, label %while${whileCount}.exit\n`;
          const commandBody = `while${whileCount}.body:\n`;
          const command = `${commandEntry}\n${commandHeader}\n${commandBody}`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'WHILE_EXIT': {
        const command = `while${whileCount}.exit:\n`;
        console.info('Command: ', command);
        insertMachineCommand(command);
        whileCount += 1;
        break;
      }
      case 'GOTO': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const command = `br label %${splittedTokens[1]}\n`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'LABEL_INIT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          const command = `${splittedTokens[0]}:\n`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      case 'LABEL_EXIT':
        break;
      case 'PRINT': {
        const splittedTokens = currentEvent.expression?.split(' ');
        if (splittedTokens) {
          let printResult;
          if (numberRegex.test(splittedTokens[2])) printResult = splittedTokens[2];
          else printResult = `%${splittedTokens[2]}`;
          const command = `@print(i32 ${printResult})\n`;
          console.info('Command: ', command);
          insertMachineCommand(command);
        }
        break;
      }
      default:
        return 0;
    }
  }
  return 1;
};

const processCodeGeneration = (): 0 | 1 => {
  generateLLVMIRCode();
  console.info('machineCode: ===========================\n', machineCode);
  console.info('========================================\n');
  fs.writeFile('files/output.ll', machineCode, (err) => {
    if (err) return console.error(err);
    return console.info('Machine code saved on file output.ll');
  });
  return 1;
};

export { processCodeGeneration };
