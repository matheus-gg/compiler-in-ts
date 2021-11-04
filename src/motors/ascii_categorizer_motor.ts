import { addEventToQueue, getEventFromQueue } from '../utils/queue_helper';
import { asciiCategorizerQueue, lexicalCategorizerQueue } from '../utils/queues';

const letterRegex = /^[a-zA-Z]$/;
const digitRegex = /^[0-9]$/;
const specialRegex = /^[!@#$%:[\]^&"*)(+=._-{}><]$/;

const categorizeChar = (char: string) => {
  if (char.length !== 1) return 'FORBIDDEN';
  if (char === ' ' || char === '\t' || char === ';') return 'DELIMITER';
  if (char === '\n') return 'EOL';
  if (digitRegex.test(char)) return 'DIGIT';
  if (letterRegex.test(char)) return 'LETTER';
  if (specialRegex.test(char)) return 'SPECIAL';
  return 'UNKNOWN';
};

const processAsciiCatEvent = (): 0 | 1 => {
  while (asciiCategorizerQueue.length > 0) {
    const currentEvent = getEventFromQueue(asciiCategorizerQueue);
    if (currentEvent) {
      for (let i = 0; i < currentEvent.value.length; i += 1) {
        if (currentEvent.type === 'ASCII') {
          addEventToQueue(
            {
              type: categorizeChar(currentEvent.value[i]),
              value: currentEvent.value[i],
            },
            lexicalCategorizerQueue,
          );
        } else if (currentEvent.type === 'CTRL') {
          addEventToQueue(
            {
              type: 'EOF',
              value: currentEvent.value,
            },
            lexicalCategorizerQueue,
          );
        }
      }
    }
  }
  console.info('lexicalCategorizerQueue', lexicalCategorizerQueue);
  return 1;
};

export { processAsciiCatEvent };
