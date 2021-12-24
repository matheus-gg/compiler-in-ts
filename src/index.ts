import { processFileExtraction } from "./motors/fs_motor";
import { processAsciiCategorization } from './motors/ascii_categorizer_motor';
import { processLexicalCategorization } from './motors/lexical_categorizer_motor';
import { processSyntacticRecognition } from './motors/syntactic_recognizer_motor';
import { processCodeGeneration } from './motors/code_generation_motor';

processFileExtraction();
processAsciiCategorization();
processLexicalCategorization();
processSyntacticRecognition();
processCodeGeneration();
