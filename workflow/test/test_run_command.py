import unittest
from typing import List
from workflow.util import Language
from workflow.core.data_structures import CodeBlock
from workflow.core.data_structures.code import get_run_commands, ImportParseError

class TestGetRunCommands(unittest.TestCase):
    def test_python_with_setup(self):
        """Test Python code block with bash setup commands"""
        code_blocks = [
            CodeBlock(
                code="""
import pandas as pd
import numpy as np

data = pd.DataFrame({
    'A': np.random.rand(10),
    'B': np.random.rand(10)
})
print(data.describe())
                """,
                language=Language.PYTHON
            ),
            CodeBlock(
                code="pip install pandas numpy",
                language=Language.SHELL
            )
        ]
        
        result = get_run_commands(code_blocks)
        self.assertEqual(len(result), 1)
        code, lang, setup = result[0]
        self.assertEqual(lang, Language.PYTHON)
        self.assertIsNotNone(setup)
        self.assertIn("pip install", setup)

    def test_javascript_merge_imports(self):
        """Test merging multiple JavaScript code blocks with imports"""
        code_blocks = [
            CodeBlock(
                code="""
import { mean, sum } from 'lodash';
const numbers = [1, 2, 3, 4, 5];
console.log('Sum:', sum(numbers));
                """,
                language=Language.JAVASCRIPT
            ),
            CodeBlock(
                code="""
import { sum } from 'lodash';
const moreNumbers = [6, 7, 8, 9, 10];
console.log('Average:', mean(moreNumbers));
                """,
                language=Language.JAVASCRIPT
            )
        ]
        
        result = get_run_commands(code_blocks)
        self.assertEqual(len(result), 1)
        code, lang, setup = result[0]
        self.assertEqual(lang, Language.JAVASCRIPT)
        self.assertIsNone(setup)
        # Check that imports are consolidated
        import_lines = [line for line in code.split('\n') if line.strip().startswith('import')]
        print(f"import_lines for {lang.value}: {import_lines}")
        self.assertEqual(len(import_lines), 1)
        self.assertIn("import { mean, sum }", code)

    def test_typescript_merge_imports(self):
        """Test merging multiple TypeScript code blocks with imports"""
        code_blocks = [
            CodeBlock(
                code="""
import { DateTime } from 'luxon';
interface TimeRange {
    start: DateTime;
    end: DateTime;
}
const range: TimeRange = {
    start: DateTime.now(),
    end: DateTime.now().plus({ days: 1 })
};
console.log('Time Range:', range);
                """,
                language=Language.TYPESCRIPT
            ),
            CodeBlock(
                code="""
import { Duration } from 'luxon';
const duration: Duration = Duration.fromObject({ hours: 24 });
console.log('Duration:', duration.toHuman());
                """,
                language=Language.TYPESCRIPT
            )
        ]
        
        result = get_run_commands(code_blocks)
        self.assertEqual(len(result), 1)
        code, lang, setup = result[0]
        self.assertEqual(lang, Language.TYPESCRIPT)
        self.assertIsNone(setup)
        # Check that imports are consolidated
        import_lines = [line for line in code.split('\n') if line.strip().startswith('import')]
        print(f"import_lines: {import_lines}")
        self.assertEqual(len(import_lines), 1)
        self.assertIn("import { DateTime, Duration }", code)

    def test_mixed_languages(self):
        """Test handling multiple languages without setup"""
        code_blocks = [
            CodeBlock(
                code="console.log('Hello from JS');",
                language=Language.JAVASCRIPT
            ),
            CodeBlock(
                code="print('Hello from Python')",
                language=Language.PYTHON
            )
        ]
        
        result = get_run_commands(code_blocks)
        self.assertEqual(len(result), 2)
        for code, lang, setup in result:
            self.assertIsNone(setup)
            if lang == Language.JAVASCRIPT:
                self.assertIn("Hello from JS", code)
            elif lang == Language.PYTHON:
                self.assertIn("Hello from Python", code)

    def test_javascript_merge_mixed_imports(self):
        """Test merging multiple JavaScript code blocks with different import styles"""
        code_blocks = [
            CodeBlock(
                code="""
    import defaultExport from 'module';
    import { namedExport1 } from 'module';
    const numbers = [1, 2, 3, 4, 5];
    console.log(defaultExport(numbers));
                """,
                language=Language.JAVASCRIPT
            ),
            CodeBlock(
                code="""
    import { namedExport2 } from 'module';
    import * as namespace from 'other-module';
    const result = namedExport2(numbers);
    console.log(namespace.helper(result));
                """,
                language=Language.JAVASCRIPT
            )
        ]
        result = get_run_commands(code_blocks)
        self.assertEqual(len(result), 1)
        code, lang, setup = result[0]
        self.assertEqual(lang, Language.JAVASCRIPT)
        self.assertIsNone(setup)
        # Check that imports are consolidated
        import_lines = [line for line in code.split('\n') if line.strip().startswith('import')]
        print(f"import_lines for {lang.value}: {import_lines}")
        self.assertEqual(len(import_lines), 2)
        
    def test_javascript_merge_require_imports(self):
        """Test merging multiple JavaScript code blocks with require imports"""
        code_blocks = [
            CodeBlock(
                code="""
    const { sum, mean } = require('lodash');
    const numbers = [1, 2, 3, 4, 5];
    console.log('Sum:', sum(numbers));
                """,
                language=Language.JAVASCRIPT
            ),
            CodeBlock(
                code="""
    const { mean, min } = require('lodash');
    const moreNumbers = [6, 7, 8, 9, 10];
    console.log('Average:', mean(moreNumbers));
    console.log('Min:', min(moreNumbers));
                """,
                language=Language.JAVASCRIPT
            )
        ]
        
        result = get_run_commands(code_blocks)
        self.assertEqual(len(result), 1)
        code, lang, setup = result[0]
        self.assertEqual(lang, Language.JAVASCRIPT)
        self.assertIsNone(setup)
        print(f"code test_javascript_merge_require_imports: {code}")
        # Should consolidate to single require with all unique functions
        self.assertIn("const { mean, min, sum } = require('lodash')", code)

    def test_javascript_merge_mixed_import_styles(self):
        """Test merging JavaScript code blocks with mixed import styles (should error)"""
        code_blocks = [
            CodeBlock(
                code="""
    import { map, filter } from 'lodash';
    const numbers = [1, 2, 3, 4, 5];
    console.log('Mapped:', map(numbers, n => n * 2));
                """,
                language=Language.JAVASCRIPT
            ),
            CodeBlock(
                code="""
    const { reduce } = require('lodash');
    const result = reduce(numbers, (sum, n) => sum + n, 0);
    console.log('Sum:', result);
                """,
                language=Language.JAVASCRIPT
            )
        ]
        
        # This should raise an ImportParseError due to mixed import styles
        with self.assertRaises(ImportParseError) as context:
            get_run_commands(code_blocks)
        
        self.assertIn("Mixed import types", str(context.exception))
if __name__ == '__main__':
    unittest.main()