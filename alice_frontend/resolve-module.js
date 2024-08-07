const ts = require('typescript');
const path = require('path');

const fileName = path.resolve(__dirname, 'src/plugins/animatedTextPlugin.ts'); // Adjust if necessary
const options = {
  baseUrl: '.',
  paths: {},
  moduleResolution: ts.ModuleResolutionKind.NodeJs
};

const host = ts.createCompilerHost(options);
const result = ts.resolveModuleName('tailwindcss/lib/util/flattenColorPalette', fileName, options, host);

console.log('Module resolution result:', result);

// Additional check
const moduleSpecifier = 'tailwindcss/lib/util/flattenColorPalette';
const compilerOptions = ts.readConfigFile('tsconfig.json', ts.sys.readFile).config.compilerOptions;
const resolvedModule = ts.resolveModuleName(moduleSpecifier, fileName, compilerOptions, ts.sys);

console.log('Resolved module:', resolvedModule);
console.log('Compiler options:', compilerOptions);