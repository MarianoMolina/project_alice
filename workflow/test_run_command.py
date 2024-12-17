import unittest
from typing import List
from workflow.util import Language
from workflow.core.data_structures import CodeBlock
from workflow.core.data_structures.code import get_run_commands

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
import { sum } from 'lodash';
const numbers = [1, 2, 3, 4, 5];
console.log('Sum:', sum(numbers));
                """,
                language=Language.JAVASCRIPT
            ),
            CodeBlock(
                code="""
import { mean } from 'lodash';
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
        self.assertEqual(len(import_lines), 1)
        self.assertIn("import { sum, mean }", code)

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

if __name__ == '__main__':
    unittest.main()