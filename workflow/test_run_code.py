import sys, asyncio
from pathlib import Path

current_dir = Path(__file__).parent.absolute()
parent_dir = current_dir.parent
if parent_dir not in sys.path:
    sys.path.insert(0, str(parent_dir))
from typing import Tuple, Dict
from workflow.util.logger import LOGGER
from workflow.test.test_utils import TestOutputHandler, TestOutputConfig
from util.code_utils.run_code_in_docker import DockerCodeRunner
from workflow.test.test_run_command import TestGetRunCommands

# Test cases for different languages
test_module_imports = {
    "python": {
        "code": """
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f'NumPy array: {arr}')
print(f'Mean: {arr.mean()}')
""",
        "language": "python",
        "setup_commands": "pip install numpy",
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
        "setup_commands": "npm install lodash",
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
        "setup_commands": None,
    },
    "javascript": {
        "code": """class TokenBucketRateLimiter {
  constructor(bucketSize, refillRate) {
    if (bucketSize <= 0 || refillRate <= 0) {
      throw new Error("Bucket size and refill rate must be positive values.");
    }

    this.bucketSize = bucketSize;
    this.refillRate = refillRate; // tokens per second
    this.tokens = bucketSize; // current number of tokens in the bucket
    this.queue = []; // queue for pending requests
    this.lastRefillTime = Date.now();

    // Start periodic token refill
    setInterval(() => this.refillTokens(), 1000 / this.refillRate);
  }

  refillTokens() {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000; // elapsed time in seconds
    const refillTokens = Math.floor(elapsed * this.refillRate);

    if (refillTokens > 0) {
      this.tokens = Math.min(this.tokens + refillTokens, this.bucketSize);
      this.lastRefillTime = now;

      // Process queued requests if tokens are available
      this.processQueue();
    }
  }

  processQueue() {
    while (this.queue.length > 0 && this.tokens > 0) {
      const { resolve } = this.queue.shift();
      this.tokens--;
      resolve();
    }
  }

  makeRequest() {
    return new Promise((resolve, reject) => {
      if (this.tokens > 0) {
        this.tokens--;
        resolve(); // Allow the request
      } else {
        // Queue the request
        this.queue.push({ resolve, reject });
      }
    });
  }
}

class SlidingWindowRateLimiter {
  constructor(windowSize, maxRequests) {
    if (windowSize <= 0 || maxRequests <= 0) {
      throw new Error("Window size and max requests must be positive values.");
    }

    this.windowSize = windowSize; // in milliseconds
    this.maxRequests = maxRequests;
    this.timestamps = []; // stores timestamps of API calls
    this.queue = []; // queue for pending requests
  }

  processQueue() {
    while (this.queue.length > 0 && this.canMakeRequest()) {
      const { resolve } = this.queue.shift();
      this.timestamps.push(Date.now());
      resolve();
    }
  }

  canMakeRequest() {
    const now = Date.now();

    // Remove timestamps outside the sliding window
    while (this.timestamps.length > 0 && this.timestamps[0] <= now - this.windowSize) {
      this.timestamps.shift();
    }

    return this.timestamps.length < this.maxRequests;
  }

  makeRequest() {
    return new Promise((resolve, reject) => {
      if (this.canMakeRequest()) {
        this.timestamps.push(Date.now());
        resolve(); // Allow the request
      } else {
        // Queue the request
        this.queue.push({ resolve, reject });

        // Ensure the queue is processed when the window allows
        setTimeout(() => this.processQueue(), this.windowSize);
      }
    });
  }
}

// Example usage:

// Token Bucket
const tokenBucketLimiter = new TokenBucketRateLimiter(5, 2); // 5 tokens max, refill 2 tokens per second

// Simulate API calls
setInterval(() => {
  tokenBucketLimiter.makeRequest()
    .then(() => console.log("Token Bucket: API call allowed"))
    .catch(() => console.log("Token Bucket: API call rejected"));
}, 300);

// Sliding Window
const slidingWindowLimiter = new SlidingWindowRateLimiter(10000, 3); // 10-second window, max 3 requests

// Simulate API calls
setInterval(() => {
  slidingWindowLimiter.makeRequest()
    .then(() => console.log("Sliding Window: API call allowed"))
    .catch(() => console.log("Sliding Window: API call rejected"));
}, 500);
""",
        "language": "javascript",
        "setup_commands": None,
    },
}
timeout_test_cases = {
    "python": {
        "code": """
import time
print("Starting Python sleep test...")
time.sleep(1)
print("Waited for 1 seconds")
""",
        "language": "python",
        "setup_commands": None,
    },
    "javascript": {
        "code": """
async function main() {
    console.log("Starting JavaScript sleep test...");
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Waited for 1 seconds");
}

main().catch(console.error);
""",
        "language": "javascript",
        "setup_commands": None,
    },
    "typescript": {
        "code": """
console.log("Starting TypeScript sleep test...");
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

async function main() {
    await sleep(1000);
    console.log("Waited for 1 seconds");
}

main();
""",
        "language": "typescript",
        "setup_commands": None,
    },
    "shell": {
        "code": """
echo "Starting shell sleep test..."
sleep 1
echo "Waited for 1 seconds"
""",
        "language": "shell",
        "setup_commands": None,
    },
}

error_example = {
    "javascript": {
        "code": """class TokenBucketRateLimiter {
    constructor(maxTokens, refillRate) {
        this.maxTokens = maxTokens; // Maximum tokens in the bucket
        this.refillRate = refillRate; // Tokens per second
        this.tokenCount = maxTokens; // Current available tokens
        this.queue = []; // Queue to hold pending requests

        // Start the token refill process
        setInterval(() => this.refillTokens(), 1000 / this.refillRate);
    }

    // Refill tokens at the specified rate
    refillTokens() {
        if (this.tokenCount < this.maxTokens) {
            this.tokenCount++;
            this.processQueue();
        }
    }

    // Add a new request to the queue or process it immediately
    addRequest(request) {
        if (this.tokenCount > 0) {
            this.tokenCount--;
            request.resolve(); // Process the request
        } else {
            this.queue.push(request); // Enqueue the request if no tokens are available
        }
    }

    // Process pending requests in the queue
    processQueue() {
        while (this.tokenCount > 0 && this.queue.length > 0) {
            const request = this.queue.shift();
            this.tokenCount--;
            request.resolve();
        }
    }
}

class SlidingWindowRateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests; // Maximum allowed requests
        this.timeWindow = timeWindow; // Time window in milliseconds
        this.requestTimestamps = []; // Timestamps of completed requests
        this.queue = []; // Queue to hold pending requests

        // Periodically check the queue
        setInterval(() => this.processQueue(), 100);
    }

    // Add a new request to the queue or process it immediately
    addRequest(request) {
        const now = Date.now();

        // Remove timestamps outside the current time window
        this.requestTimestamps = this.requestTimestamps.filter(
            (timestamp) => now - timestamp <= this.timeWindow
        );

        if (this.requestTimestamps.length < this.maxRequests) {
            this.requestTimestamps.push(now);
            request.resolve(); // Process the request
        } else {
            this.queue.push(request); // Enqueue the request if limit is reached
        }
    }

    // Process pending requests in the queue
    processQueue() {
        const now = Date.now();

        // Remove timestamps outside the current time window
        this.requestTimestamps = this.requestTimestamps.filter(
            (timestamp) => now - timestamp <= this.timeWindow
        );

        while (
            this.queue.length > 0 &&
            this.requestTimestamps.length < this.maxRequests
        ) {
            const request = this.queue.shift();
            this.requestTimestamps.push(now);
            request.resolve();
        }
    }
}

// Example usage
function asyncRequest(id) {
    return new Promise((resolve) => {
        console.log(`Request ${id} started at ${new Date().toISOString()}`);
        setTimeout(() => {
            console.log(`Request ${id} completed at ${new Date().toISOString()}`);
            resolve();
        }, 1000); // Simulate API request processing time
    });
}

// Testing the implementations
(async () => {
    const tokenBucketLimiter = new TokenBucketRateLimiter(5, 2); // 5 tokens, refill 2 tokens/sec
    const slidingWindowLimiter = new SlidingWindowRateLimiter(3, 5000); // 3 requests per 5 seconds

    // Generate test requests for Token Bucket
    for (let i = 1; i <= 10; i++) {
        tokenBucketLimiter.addRequest({
            resolve: () => asyncRequest(`TokenBucket-${i}`),
        });
    }

    // Generate test requests for Sliding Window
    for (let i = 1; i <= 10; i++) {
        slidingWindowLimiter.addRequest({
            resolve: () => asyncRequest(`SlidingWindow-${i}`),
        });
    }
})();""",
        "language": "javascript",
        "setup_commands": None,
    }
}


async def run_code_test(
    code: str, language: str, setup_commands: str = None, timeout: int = 25
) -> Tuple[str, int]:
    """Run a single code test with the specified language and setup"""
    runner = DockerCodeRunner(timeout=timeout, log_level="DEBUG")
    return await runner.run(code, language, setup_commands)


async def run_tests(tests_to_run: dict) -> Dict[str, Tuple[str, int]]:
    """Run all test cases and collect results"""
    results = {}
    test_len = tests_to_run.items().__len__()
    LOGGER.info(f"Running {test_len} test cases...")
    for lang, test_case in tests_to_run.items():
        LOGGER.info(f"Running {lang} test...")
        try:
            output = await run_code_test(**test_case)
            results[lang] = output
            LOGGER.info(f"{lang} test completed successfully")
        except Exception as e:
            LOGGER.error(f"Error running {lang} test: {str(e)}")
            results[lang] = (str(e), -1)
    return results


def docker_code_runner_tests():
    # Configure output handling
    config = TestOutputConfig(
        output_dir=Path("test_outputs"),
        format="json",
        create_timestamp_dir=True,
        pretty_print=True,
    )
    output_handler = TestOutputHandler(config)

    # Run all tests
    results = asyncio.run(run_tests(error_example))

    # Save the output using the handler
    output_path = output_handler.save_output(data=results, filename="run_code_tests")
    LOGGER.info(f"Test outputs saved to: {output_path}")


if __name__ == "__main__":
    docker_code_runner_tests()
