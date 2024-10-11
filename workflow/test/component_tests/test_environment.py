import datetime
from typing import Dict, Any
from pydantic import BaseModel
from workflow.db_app import DBStructure

class TestModule(BaseModel):
    name: str

    async def run(self, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement run method")
    
class TestEnvironment(BaseModel):
    modules: Dict[str, TestModule] = {}
    results: Dict[str, Any] = {}

    async def add_module(self, module: TestModule):
        self.modules[module.name] = module

    async def run_module(self, module_name: str, verbose: bool = False, **kwargs) -> Dict[str, Any]:
        if module_name not in self.modules:
            raise ValueError(f"Module {module_name} not found")
        if verbose:
            print(f"\n--- {module_name} Tests ---")
        result = await self.modules[module_name].run(**kwargs)
        result["summary"] = self.parse_results(result["test_results"])
        if verbose:
            self.print_summary(result["summary"], module_name=module_name)
        return result
    
    async def run(self, db_structure: DBStructure, verbose: bool = False, **kwargs) -> Dict[str, Any]:
        self.results["DBTests"] = await self.run_module("DBTests", verbose, db_structure=db_structure)

        if "APITests" in self.modules:
            self.results["APITests"] = await self.run_module("APITests", verbose, db_init_manager=self.results["DBTests"]["outputs"]["db_init_manager"])

        if "ChatTests" in self.modules:
            self.results["ChatTests"] = await self.run_module("ChatTests", verbose, db_init_manager=self.results["DBTests"]["outputs"]["db_init_manager"])

        if "TaskTests" in self.modules:
            self.results["TaskTests"] = await self.run_module("TaskTests", verbose, db_init_manager=self.results["DBTests"]["outputs"]["db_init_manager"])

        return self.results
    
    @staticmethod
    def print_summary(summary: Dict[str, Any], module_name: str):
        print("\n--- Test Summary ---")
        print(f'Module: {module_name}')
        print(f"Status: {summary['status'].upper()}")
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Successful: {summary['success_count']}")
        print(f"Errors: {summary['error_count']}")
        print(f"Failures: {summary['failure_count']}")

        if summary['errors']:
            print("\nErrors:")
            for error in summary['errors']:
                print(f"  - {error}")

        if summary['failures']:
            print("\nFailures:")
            for failure in summary['failures']:
                print(f"  - {failure}")

    @staticmethod
    def parse_results(results: Dict[str, Any]) -> Dict[str, Any]:
        status = 'success'
        error_count = 0
        failure_count = 0
        success_count = 0
        errors = []
        failures = []
        for key, value in results.items():
            if isinstance(value, dict):
                # If value is a dict, it contains results for multiple tests
                for sub_key, sub_value in value.items():
                    if sub_value == 'Success':
                        success_count += 1
                    elif 'error' in sub_value.lower():
                        status = 'with_errors' if status != 'failed' else status
                        error_count += 1
                        errors.append(f"{key} - {sub_key}: {sub_value}")
                    else:
                        status = 'failed'
                        failure_count += 1
                        failures.append(f"{key} - {sub_key}: {sub_value}")
            else:
                # Handle single test results
                if value == 'Success':
                    success_count += 1
                elif 'error' in value.lower():
                    status = 'with_errors' if status != 'failed' else status
                    error_count += 1
                    errors.append(f"{key}: {value}")
                else:
                    status = 'failed'
                    failure_count += 1
                    failures.append(f"{key}: {value}")
        
        total_tests = success_count + error_count + failure_count
        return {
            'status': status,
            'total_tests': total_tests,
            'success_count': success_count,
            'error_count': error_count,
            'failure_count': failure_count,
            'errors': errors,
            'failures': failures,
            'timestamp': datetime.datetime.now().isoformat()
        }