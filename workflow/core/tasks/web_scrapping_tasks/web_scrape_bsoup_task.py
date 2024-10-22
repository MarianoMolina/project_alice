from typing import List, Tuple, Optional, Dict, Any
from pydantic import Field, BaseModel
import json
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures import (
    ApiType, References, NodeResponse, MessageDict, FunctionParameters, ParameterDefinition, URLReference, TasksEndCodeRouting
)
from workflow.core.api import APIManager
from workflow.core.tasks.web_scrapping_tasks.web_scrape_utils import (
    clean_text, fetch_webpage_and_title, preprocess_html, sample_html,
    extract_json, fallback_parsing_strategy, apply_parsing_strategy
)
from workflow.util import LOGGER

class SelectorModel(BaseModel):
    selectors: List[str]

class WebScrapeBeautifulSoupTask(BasicAgentTask):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "url": ParameterDefinition(
                    type="string",
                    description="The URL of the webpage to scrape."
                ),
                "fetch_url_html_content": ParameterDefinition(
                    type="string",
                    description="The HTML content of the webpage retrieved if you already have it. If you do, URL will be ignored (it is still required).",
                ),
            },
            required=["url"]
        )
    )
    required_apis: List[ApiType] = Field([ApiType.LLM_MODEL], description="A list of required APIs for the task")
    start_node: str = Field(default='fetch_url', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'fetch_url': {
            0: ('generate_selectors_and_parse', False),
            1: ('fetch_url', True),
        }, 
        'generate_selectors_and_parse': {
            0: (None, False),
            1: ('generate_selectors_and_parse', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def execute_fetch_url(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        url: str = kwargs.get('url', "")
        try:
            html_content, title = fetch_webpage_and_title(url)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="fetch_url",
                exit_code=0,
                references=References(url_references=[URLReference(title=title, url=url, content=html_content)]),
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error fetching URL: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="fetch_url",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Failed to fetch URL: {str(e)}",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    async def execute_generate_selectors_and_parse(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        fetch_url_reference = self.get_node_reference(node_responses, "fetch_url")
        
        if not fetch_url_reference or not fetch_url_reference.url_references:
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_selectors_and_parse",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="Failed to generate selectors and parse: No URL reference found",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

        url_reference = fetch_url_reference.url_references[-1]
        html_content = url_reference.content
        title = url_reference.title
        url = url_reference.url

        cleaned_html = preprocess_html(html_content)
        html_samples = sample_html(cleaned_html)
        
        try:
            selectors, creation_metadata = await self._generate_parsing_instructions(html_samples, api_manager)
            if selectors:
                content = apply_parsing_strategy(cleaned_html, selectors)
                if content:
                    return NodeResponse(
                        parent_task_id=self.id,
                        node_name="generate_selectors_and_parse",
                        exit_code=0,
                        references=References(url_references=[URLReference(
                            title=title,
                            url=url,
                            content=clean_text(content),
                            metadata={"selectors": selectors, "creation_metadata": creation_metadata}
                        )]),
                        execution_order=len(execution_history)
                    )
            
            # Fallback to default method
            content = fallback_parsing_strategy(cleaned_html)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_selectors_and_parse",
                exit_code=0,
                references=References(url_references=[URLReference(
                    title=title,
                    url=url,
                    content=clean_text(content),
                    metadata={"selectors": ["p", "h1", "h2", "h3", "h4", "h5", "h6"], "creation_metadata": {"fallback": True}}
                )]),
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error in generate_selectors_and_parse: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_selectors_and_parse",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Failed to generate selectors and parse: {str(e)}",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    async def _generate_parsing_instructions(self, html_samples: List[str], api_manager: APIManager) -> Tuple[Optional[List[str]], Optional[Dict[str, Any]]]:
        """
        Use an LLM agent to generate CSS selectors in JSON format.

        Args:
            html_samples (List[str]): A list of HTML samples.
            api_manager (APIManager): The API manager for LLM interactions.

        Returns:
            Tuple[Optional[List[str]], Optional[Dict[str, Any]]]: A tuple containing:
                - A list of unique CSS selectors or None if generation fails.
                - A dictionary of creation metadata or None if generation fails.
        """
        selectors = []
        creation_metadata = {}
        for idx, sample in enumerate(html_samples, start=1):
            prompt = f"""
HTML Content:
{sample}

Instructions:
Analyze the given HTML content and generate a list of CSS selectors that would extract the main content, including titles, paragraphs, and any other relevant information. Avoid selecting navigation menus, footers, or sidebars. Provide your response as a JSON object with a single key 'selectors' whose value is an array of selector strings.

Example response format:
{{
    "selectors": [
        "article p",
        "h1.title",
        ".main-content div"
    ]
}}
"""
            message: MessageDict = MessageDict(role="user", content=prompt, generated_by="tool", type="text")
            LOGGER.info(f"Generating selectors for sample {idx}/{len(html_samples)}.")
            try:
                new_messages, _ = await self.agent.chat(api_manager=api_manager, messages=[message], max_turns=self.agent.max_consecutive_auto_reply)
                LOGGER.info(f"LLM response: {[msg.model_dump() for msg in new_messages] if new_messages else None}")
                instructions = new_messages[-1].content if new_messages else None
                if new_messages and new_messages[-1].creation_metadata:
                    creation_metadata[f"sample_{idx}"] = new_messages[-1].creation_metadata

                LOGGER.info(f"LLM instructions: {instructions}")
                json_str = extract_json(instructions)
                # Parse the JSON output using Pydantic
                selector_model = SelectorModel.model_validate(json.loads(json_str))
                selectors.extend(selector_model.selectors)
                LOGGER.info(f"Selectors extracted: {selector_model.selectors}")
            except Exception as e:
                LOGGER.warning(f"Error processing sample {idx}: {e}")

        # Remove duplicates and maintain order
        unique_selectors = list(dict.fromkeys(selectors))
        LOGGER.info(f"Unique selectors collected: {unique_selectors}")
        return unique_selectors if unique_selectors else None, creation_metadata if creation_metadata else None