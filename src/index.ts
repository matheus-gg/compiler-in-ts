import { processFSEvent } from "./motors/fs_motor";
import { processAsciiCatEvent } from './motors/ascii_categorizer_motor';
import { processLexicalCatEvent } from './motors/lexical_categorizer_motor';
// import { processSyntacticRecognition } from './motors/syntactic_recognizer_motor';

processFSEvent();
processAsciiCatEvent();
processLexicalCatEvent();
// processSyntacticRecognition();
