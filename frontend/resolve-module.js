const ts = require('typescript');
const path = require('path');
import Logger from './src/plugins/logger';

const fileName = path.resolve(__dirname, 'src/plugins/animatedTextPlugin.ts');
const options = {
  baseUrl: '.',
  paths: {},
  moduleResolution: ts.ModuleResolutionKind.NodeJs
};

const host = ts.createCompilerHost(options);
const result = ts.resolveModuleName('tailwindcss/lib/util/flattenColorPalette', fileName, options, host);

Logger.debug('Module resolution result:', result);

// Additional check
const moduleSpecifier = 'tailwindcss/lib/util/flattenColorPalette';
const compilerOptions = ts.readConfigFile('tsconfig.json', ts.sys.readFile).config.compilerOptions;
const resolvedModule = ts.resolveModuleName(moduleSpecifier, fileName, compilerOptions, ts.sys);

Logger.debug('Resolved module:', resolvedModule);
Logger.debug('Compiler options:', compilerOptions);