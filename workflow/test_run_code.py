import sys, asyncio
from pathlib import Path
current_dir = Path(__file__).parent.absolute()
parent_dir = current_dir.parent
if parent_dir not in sys.path:
    sys.path.insert(0, str(parent_dir))
from typing import List, Tuple, Dict
from workflow.util.logger import LOGGER
from workflow.test.test_utils import TestOutputHandler, TestOutputConfig
from workflow.util.run_code import DockerCodeRunner

# Test cases for different languages
test_cases = {
    "python": {
        "code": """
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f'NumPy array: {arr}')
print(f'Mean: {arr.mean()}')
""",
        "language": "python",
        "setup_commands": "pip install numpy"
    },
    "javascript": {
        "code": """
const _ = require('lodash');
const numbers = [1, 2, 3, 4, 5];
console.log('Array:', numbers);
console.log('Sum:', _.sum(numbers));
console.log('Average:', _.mean(numbers));
""",
        "language": "javascript",
        "setup_commands": "npm install lodash"
    },
    "typescript": {
        "code": """
interface NumberStats {
    numbers: number[];
    sum: number;
    average: number;
}

const calculateStats = (nums: number[]): NumberStats => {
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
        numbers: nums,
        sum: sum,
        average: sum / nums.length
    };
};

const stats = calculateStats([1, 2, 3, 4, 5]);
console.log('Stats:', stats);
""",
        "language": "typescript",
        "setup_commands": None
    }
}

async def run_code_test(code: str, language: str, setup_commands: str = None) -> Tuple[str, int]:
    """Run a single code test with the specified language and setup"""
    runner = DockerCodeRunner()
    return await runner.run(code, language, setup_commands)

async def run_all_tests() -> Dict[str, Tuple[str, int]]:
    """Run all test cases and collect results"""
    results = {}
    for lang, test_case in test_cases.items():
        LOGGER.info(f"Running {lang} test...")
        try:
            output = await run_code_test(**test_case)
            results[lang] = output
            LOGGER.info(f"{lang} test completed successfully")
        except Exception as e:
            LOGGER.error(f"Error running {lang} test: {str(e)}")
            results[lang] = (str(e), -1)
    return results

if __name__ == "__main__":
    # Configure output handling
    config = TestOutputConfig(
        output_dir=Path("test_outputs"),
        format="json",
        create_timestamp_dir=True,
        pretty_print=True
    )
    output_handler = TestOutputHandler(config)

    # Run all tests
    results = asyncio.run(run_all_tests())

    # Save the output using the handler
    output_path = output_handler.save_output(
        data=results,
        filename="run_code_tests"
    )
    LOGGER.info(f"Test outputs saved to: {output_path}")

    # Print summary
    print("\nTest Results Summary:")
    print("=" * 50)
    for lang, (output, exit_code) in results.items():
        status = "✓ Passed" if exit_code == 0 else "✗ Failed"
        print(f"{lang}: {status} (exit code: {exit_code})")
        if exit_code != 0:
            print(f"Output:\n{output}\n")