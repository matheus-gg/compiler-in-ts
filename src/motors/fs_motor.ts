import * as fs from 'fs';
import { addEventToQueue } from '../utils/queue_helper';
import { asciiCategorizerQueue } from '../utils/queues';

const readFile = (name: string): string | -1 => {
  try {
    const file = fs.readFileSync(`/home/matheus/3Q2021/compiladores/project/files/${name}`, 'utf-8');
    return file;
  } catch (error) {
    console.error('error reading file', error);
    return -1;
  }
};

const processFSEvent = (): 0 | 1 => {
  const file = readFile('example.txt');
  if (file === -1) return 0;
  let eventValue = '';
  for (let i = 0; i < file.length; i += 1) {
    if (file[i] !== '\n') eventValue += file[i];
    else {
      addEventToQueue({ type: 'ASCII', value: eventValue }, asciiCategorizerQueue);
      addEventToQueue({ type: 'ASCII', value: file[i] }, asciiCategorizerQueue);
      eventValue = '';
    }
  }
  addEventToQueue({ type: 'CTRL', value: 'EOF' }, asciiCategorizerQueue);

  console.info('asciiCategorizerQueue', asciiCategorizerQueue);
  return 1;
};

export { processFSEvent };
