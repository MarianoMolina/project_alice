import unittest
from jinja2 import Template
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from workflow_logic.core.prompt import Prompt

class TestPrompt(unittest.TestCase):

    def setUp(self):
        self.prompt_data = {
            "_id": "60b8d29562c1f0c025ae4c89",
            "name": "TestPrompt",
            "content": "Hello, {{name}}!",
            "is_templated": True,
            "parameters": FunctionParameters(
                type="object",
                properties={
                    "name": ParameterDefinition(type="string", description="Dummy parameter")
                },
                required=["name"]
            ),
            "partial_variables": {}
        }
    
    def test_initialization(self):
        prompt = Prompt(**self.prompt_data)
        self.assertEqual(prompt.id, "60b8d29562c1f0c025ae4c89")
        self.assertEqual(prompt.name, "TestPrompt")
        self.assertEqual(prompt.content, "Hello, {{name}}!")
        self.assertTrue(prompt.is_templated)
        self.assertEqual(prompt.parameters.required, ["name"])

    def test_validate_templated_prompt(self):
        self.prompt_data["is_templated"] = True
        self.prompt_data["parameters"] = None
        with self.assertRaises(ValueError):
            Prompt(**self.prompt_data)
        
        self.prompt_data["is_templated"] = False
        self.prompt_data["parameters"] = FunctionParameters(type='object', properties={}, required=[])
        with self.assertRaises(ValueError):
            Prompt(**self.prompt_data)

    def test_input_variables(self):
        prompt = Prompt(**self.prompt_data)
        self.assertEqual(prompt.input_variables, ["name"])

    def test_format(self):
        prompt = Prompt(**self.prompt_data)
        formatted_content = prompt.format(name="Alice")
        self.assertEqual(formatted_content, "Hello, Alice!")

    def test_format_prompt(self):
        prompt = Prompt(**self.prompt_data)
        formatted_content = prompt.format_prompt(name="Alice")
        self.assertEqual(formatted_content, "Hello, Alice!")

    def test_validate_input(self):
        prompt = Prompt(**self.prompt_data)
        with self.assertRaises(ValueError):
            prompt.validate_input()
        
        with self.assertRaises(ValueError):
            prompt.validate_input(age=25)
        
        with self.assertRaises(TypeError):
            prompt.validate_input(name=25)
        
        # This should pass without exception
        prompt.validate_input(name="Alice")

    def test_get_template(self):
        prompt = Prompt(**self.prompt_data)
        template = prompt.get_template()
        self.assertIsInstance(template, Template)

    def test_partial(self):
        prompt = Prompt(**self.prompt_data)
        partial_prompt = prompt.partial(name="Alice")
        self.assertEqual(partial_prompt.partial_variables["name"], "Alice")
        self.assertNotIn("name", partial_prompt.parameters.properties)
        self.assertNotIn("name", partial_prompt.parameters.required)
        self.assertIn("Alice", partial_prompt.content)

    def test_validate_content(self):
        self.prompt_data["content"] = "Hello, {{name}}!"
        self.prompt_data["is_templated"] = True
        self.prompt_data["parameters"] = FunctionParameters(
            type="object",
            properties={"name": ParameterDefinition(type="string", description="Dummy parameter")},
            required=["name"]
        )
        prompt = Prompt(**self.prompt_data)
        self.assertEqual(prompt.content, "Hello, {{name}}!")

if __name__ == '__main__':
    unittest.main()
