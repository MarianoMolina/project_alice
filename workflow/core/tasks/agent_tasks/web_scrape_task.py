from typing import List, Tuple, Optional, Dict, Any
from pydantic import Field, BaseModel
import json
from workflow.core.tasks.task import AliceTask
from workflow.core.agent.agent import AliceAgent
from workflow.core.data_structures import (
    ApiType, References, NodeResponse, MessageDict, FunctionParameters, ParameterDefinition, TasksEndCodeRouting, 
    MessageGenerators, RoleTypes, ContentType, EntityReference, ReferenceCategory, Prompt
)
from workflow.core.api import APIManager
from workflow.util.web_scrape_utils import (
    clean_text, fetch_webpage_and_title, preprocess_html, sample_html,
    extract_json, fallback_parsing_strategy, apply_parsing_strategy
)
from workflow.util import LOGGER, get_traceback

class SelectorModel(BaseModel):
    selectors: List[str]

class WebScrapeBeautifulSoupTask(AliceTask):
    """
    A specialized task for web scraping that implements a three-node pattern for
    content fetching, parsing, and summarization using BeautifulSoup and LLM assistance.

    WebScrapeBeautifulSoupTask provides a robust approach to web scraping by combining
    traditional parsing with AI-assisted content extraction and summarization. Its
    three-node pattern ensures reliable content extraction and meaningful summaries.

    Node Structure:
    --------------
    1. fetch_url:
        - Handles URL fetching and initial HTML retrieval
        - Validates response status and content
        - Manages connection timeouts and retries
        - Exit codes:
            * SUCCESS (0): Content retrieved, proceed to parsing
            * FAILURE (1): Fetch failed, retry

    2. generate_selectors_and_parse:
        - Uses LLM to generate optimal CSS selectors
        - Applies selectors to extract main content
        - Falls back to default selectors if needed
        - Exit codes:
            * SUCCESS (0): Content extracted, proceed to summarization
            * FAILURE (1): Parsing failed, retry

    3. url_summarization:
        - Generates concise content summary using LLM
        - Creates structured metadata
        - Formats final output
        - Exit codes:
            * SUCCESS (0): Summary generated successfully
            * FAILURE (1): Summarization failed, retry

    Key Features:
    -------------
    * Intelligent Parsing:
        - LLM-assisted selector generation
        - Automatic main content detection
        - Noise removal and cleaning
        - Fallback parsing strategies

    * Content Processing:
        - HTML preprocessing
        - Text cleaning and formatting
        - Metadata extraction
        - Content summarization

    Attributes:
    -----------
    agent : AliceAgent
        Agent with LLM capabilities for selector generation and summarization
        
    input_variables : FunctionParameters
        Accepts:
        - url (str): Target URL to scrape
        - fetch_url_html_content (str, optional): Pre-fetched HTML content
        
    required_apis : List[ApiType]
        [ApiType.LLM_MODEL]

    Example:
    --------
    ```python
    scrape_task = WebScrapeBeautifulSoupTask(
        agent=agent_with_llm,
        task_name="web_scraper",
        task_description="Extract and summarize web content",
        templates={
            "task_template": Prompt(
                content="Extract main content from: {{url}}"
            )
        }
    )
    
    response = await scrape_task.run(
        url="https://example.com/article"
    )
    ```
    Notes:
    ------
    1. Content Extraction:
        - Prioritizes main content over navigation/ads
        - Preserves important structural elements
        - Handles different HTML structures

    2. Error Handling:
        - Connection timeout management
        - Invalid HTML recovery
        - Selector generation fallbacks
        - Summary retry logic

    3. Performance:
        - Efficient HTML sampling
        - Cached selector patterns
        - Optimized content cleaning
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
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
            0: ('url_summarization', False),
            1: ('generate_selectors_and_parse', True),
        },
        'url_summarization': {
            0: (None, False),
            1: ('url_summarization', True),
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
                references=References(entity_references=[EntityReference(
                    name=title, 
                    url=url, 
                    content=html_content, 
                    categories=[ReferenceCategory.URL],
                    source=ApiType.REQUESTS
                    )]),
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
                    content=f"Failed to fetch URL: {str(e)}\n\n" + get_traceback(),
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    async def execute_generate_selectors_and_parse(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        fetch_url_reference = self.get_node_reference(node_responses, "fetch_url")
        
        if not fetch_url_reference or not fetch_url_reference.entity_references:
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

        entity_reference = fetch_url_reference.entity_references[-1]
        html_content = entity_reference.content
        LOGGER.debug(f"HTML content length: {len(html_content)} characters.")
        cleaned_html = preprocess_html(html_content)
        LOGGER.debug(f"Cleaned HTML length: {len(cleaned_html)} characters.")
        html_samples = sample_html(cleaned_html)
        
        try:
            selectors, creation_metadata = await self._generate_parsing_instructions(html_samples, api_manager)
            if selectors:
                content = apply_parsing_strategy(cleaned_html, selectors)
                LOGGER.debug(f"Content extracted using selectors: {len(content)} characters.")
                if content:
                    final_content = clean_text(content)
                    LOGGER.debug(f"Final content length: {len(final_content)} characters.")
                    final_reference = entity_reference.model_copy(update={"content": final_content, "metadata": {"selectors": selectors, "creation_metadata": creation_metadata, "original_content": cleaned_html}})
                    return NodeResponse(
                        parent_task_id=self.id,
                        node_name="generate_selectors_and_parse",
                        exit_code=0,
                        references=References(entity_references=[final_reference]),
                        execution_order=len(execution_history)
                    )
            
            # Fallback to default method
            LOGGER.debug('Falling back to default parsing strategy.')
            selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
            content = fallback_parsing_strategy(cleaned_html, selectors)
            LOGGER.debug(f"Content extracted using fallback selectors: {len(content)} characters.")
            final_content = clean_text(content)
            LOGGER.debug(f"Final content length: {len(final_content)} characters.")
            final_reference = entity_reference.model_copy(update={"content": final_content, "metadata": {"selectors": selectors, "original_content": cleaned_html, "creation_metadata": {"origin": "fallback_parsing"}}})

            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_selectors_and_parse",
                exit_code=0,
                references=References(entity_references=[final_reference]),
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
                    content=f"Failed to generate selectors and parse: {str(e)}\n\n" + get_traceback(),
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
            message: MessageDict = MessageDict(role=RoleTypes.USER, content=prompt, generated_by=MessageGenerators.TOOL, type=ContentType.TEXT)
            LOGGER.info(f"Generating selectors for sample {idx}/{len(html_samples)}.")           
            try:
                new_message = await self.agent.generate_llm_response(api_manager, [message])
                instructions = new_message.content if new_message else None
                if new_message and new_message.creation_metadata:
                    creation_metadata[f"sample_{idx}"] = new_message.creation_metadata

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
    
    def create_message_list(self, **kwargs) -> List[MessageDict]:
        template = self.get_prompt_template("task_template")
        if not template:
            raise ValueError(f"Template {self.task_name} not retrieved correctly.")
        if not isinstance(template, Prompt):
            try: 
                template = Prompt(**template)
            except Exception as e:
                raise ValueError(f"Template {self.task_name} is not a valid prompt configuration: {e}")
        sanitized_inputs = self.update_inputs(**kwargs)
        input_string = template.format_prompt(**sanitized_inputs)
        LOGGER.info(f"Input string for task {self.task_name}: {input_string}")
        msg_list = [MessageDict(content=input_string, role=RoleTypes.USER, generated_by=MessageGenerators.USER, step=self.task_name)]
        
        # Add messages from history
        execution_history: List[NodeResponse] = kwargs.get("execution_history", [])
        for node in execution_history:
            if isinstance(node, NodeResponse) and node.parent_task_id == self.id and node.references and node.references.messages:
                msg_list.extend(node.references.messages)
        return msg_list
    
    def get_node_exit_code(self, message: MessageDict, node_name: str) -> int:
        """Determine LLM exit code based on content and available routes."""
        if not message or not message.content:
            return self._get_available_exit_code(1, node_name)
        desired_code = 0
        # Return available exit code closest to desired behavior
        return self._get_available_exit_code(desired_code, node_name)
    
    async def execute_url_summarization(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        messages: List[MessageDict] = []
        try:
            generate_selectors_and_parse = self.get_node_reference(execution_history, "generate_selectors_and_parse")
            if not generate_selectors_and_parse or not generate_selectors_and_parse.entity_references:
                return NodeResponse(
                    parent_task_id=self.id,
                    node_name="url_summarization",
                    exit_code=1,
                    references=References(messages=[MessageDict(
                        role="system",
                        content="Failed to summarize URL: No content reference found",
                        generated_by="system"
                    )]),
                    execution_order=len(execution_history)
                )
            entity_reference = generate_selectors_and_parse.entity_references[-1]
            prompt = f"""
WEB Content:
{str(entity_reference)}

Instructions:
Provide a concise, cleaar and comprehensive summary of the site's contents. Make good use of markdown to improve your summary's visibility.
"""
            
            msg = MessageDict(
                role=RoleTypes.USER,
                content=prompt,
                generated_by=MessageGenerators.SYSTEM,
                type=ContentType.TEXT
            )
            messages.append(msg)
            system_msg = "You are in charge of summarizing the contents of a scrapped website. Provide a concise, clear and comprehensive summary of the site's contents. Make good use of markdown to improve your summary's visibility. "
            self.agent.system_message.content = system_msg
            llm_response = await self.agent.generate_llm_response(api_manager, messages)
            exit_code = self.get_node_exit_code(llm_response, "url_summarization")
            entity_reference.description = llm_response.content
            return NodeResponse(
                parent_task_id=self.id,
                node_name="url_summarization",
                exit_code=exit_code,
                execution_order=len(execution_history),
                references=References(messages=[llm_response], entity_references=[entity_reference])
            )
        except Exception as e:
            LOGGER.error(f"Error in LLM generation: {e}")
            traceback_str = get_traceback()
            LOGGER.error(traceback_str)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="url_summarization",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"LLM generation failed: {str(e)}" + "\n" + traceback_str,
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )
## TODO: Add an optional summarization step that uses the LLM model to summarize the content and create the entity description.