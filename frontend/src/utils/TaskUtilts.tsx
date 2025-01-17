import { PopulatedTask, TasksEndCodeRouting, TaskType } from "../types/TaskTypes";
import { Api, Code, Downloading, ForkLeft, Image, LogoDev, RecordVoiceOver, Schema, SimCardDownload, SupportAgent, Tag } from "@mui/icons-material";

export const getDefaultTaskForm = (taskType: TaskType): PopulatedTask => {
    return taskDescriptions[taskType].default_form;
};
interface TaskExample {
    goal: string;
    setup: string;
    output: string;
}

interface TaskTypeDetails {
    description: string;
    icon: React.ReactNode;
    detail_knowledgebase_link: string;
    default_form: any;
    examples: TaskExample[];
}

const defaultRouting: TasksEndCodeRouting = {
    'default': {
        0: [null, false],
        1: ['default', true],
    }
};

const agentNodeRoutes: TasksEndCodeRouting = {
    'llm_generation': {
        0: ['tool_call_execution', false],
        1: ['llm_generation', true],
    },
    'tool_call_execution': {
        0: ['code_execution', false],
        1: ['tool_call_execution', true],
    },
    'code_execution': {
        0: [null, false],
        1: ['code_execution', true],
    },
};

const codeNodeRoutes: TasksEndCodeRouting = {
    'llm_generation': {
        0: ['code_execution', false],
        1: ['llm_generation', true],
    },
    'code_execution': agentNodeRoutes.code_execution,
};

const codeExecutionRoutes: TasksEndCodeRouting = {
    'code_execution': agentNodeRoutes.code_execution,
};

const checkTaskRoutes: TasksEndCodeRouting = {
    'llm_generation': {
        0: [null, false],
        1: ['llm_generation', true],
    },
};
const genImageRoutes: TasksEndCodeRouting = {
    'generate_image': {
        0: [null, false],
        1: ['generate_image', true],
    },
};
const embeddingTaskRoutes: TasksEndCodeRouting = {
    'generate_embedding': {
        0: [null, false],
        1: ['generate_embedding', true],
    },
};
const textToSpeechTaskRoutes: TasksEndCodeRouting = {
    'text_to_speech': {
        0: [null, false],
        1: ['text_to_speech', true],
    },
};

const scrapeNodeRoutes: TasksEndCodeRouting = {
    'fetch_url': {
        0: ['generate_selectors_and_parse', false],
        1: ['fetch_url', true],
    },
    'generate_selectors_and_parse': {
        0: ['url_summarization', false],
        1: ['generate_selectors_and', true],
    },
    'url_summarization': {
        0: [null, false],
        1: ['url_summarization', true],
    }
};

const retrievalTaskNodes: TasksEndCodeRouting = {
    'ensure_embeddings_in_data_cluster': {
        0: ['retrieve_relevant_embeddings', false],
        1: ['ensure_embeddings_in_data_cluster', true],
    },
    'retrieve_relevant_embeddings': {
        0: [null, false],
        1: ['retrieve_relevant_embeddings', true],
    }
}

const baseForm: Partial<PopulatedTask> = {
    task_name: '',
    task_description: '',
    agent: null,
    input_variables: null,
    templates: {},
    tasks: {},
    required_apis: [],
    exit_codes: { 0: "Success", 1: "Failure" },
    recursive: false,
    exit_code_response_map: null,
    start_node: null,
    node_end_code_routing: null,
    max_attempts: 1
};

export const taskDescriptions: Record<TaskType, TaskTypeDetails> = {
    [TaskType.APITask]: {
        description: `A specialized task type designed to interact with external APIs in a standardized way. It handles a single API interaction with built-in validation, error handling, and retry logic. Each APITask:
  - Works with exactly one API type
  - Automatically validates API configurations and requirements
  - Handles API authentication and connection management
  - Provides consistent error handling and retry behavior
  - Can be configured with custom input parameters
  - Reports detailed execution status and results
  
  Best used for: Direct API interactions like sending any single-purpose API operation.`,
        icon: <Api />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/api_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: defaultRouting,
            start_node: Object.keys(defaultRouting)[0],
            task_type: TaskType.APITask,
        },
        examples: [
            {
                goal: "Query Wolfram Alpha's computational knowledge engine with natural language questions and receive structured responses.",
                setup: `Required API: wolfram_alpha
  Parameters:
  - prompt (string): Query to process [required]
  - units (string): Unit system (metric/imperial) [default: metric]
  - format (string): Output format (plaintext/json) [default: plaintext]
  Node routing: Single 'default' node with success (0) and retry (1) paths`,
                output: "Message containing Wolfram Alpha's response in the specified format, including computational results, data, and explanations based on the query"
            },
            {
                goal: "Search Wikipedia articles and retrieve relevant content summaries.",
                setup: `Required API: wikipedia_search
  Parameters:
  - prompt (string): Search query [required]
  - max_results (integer): Number of results [default: 4]
  Node routing: Single 'default' node with success/retry paths`,
                output: "Message containing article summaries, including titles, excerpts, relevance scores, and URLs to full articles"
            }
        ]
    },
    [TaskType.Workflow]: {
        description: `A container task type that orchestrates multiple subtasks in a defined sequence. It manages task dependencies, data flow, and execution order while providing centralized control and monitoring. Each Workflow:
  - Coordinates multiple tasks in a specific order
  - Automatically handles data passing between tasks
  - Manages task dependencies and execution flow
  - Provides unified error handling across all subtasks
  - Supports checkpoints for user interactions
  - Collects and aggregates results from all subtasks
  
  Best used for: Complex operations requiring multiple steps, processes involving different APIs or services, or any sequence of tasks that need to be executed in a coordinated manner.`,
        icon: <Schema />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/workflow.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: {},
            start_node: null,
            recursive: true,
            task_type: TaskType.Workflow,
        },
        examples: [
            {
                goal: "Execute a comprehensive research workflow from query to summary.",
                setup: `Multi-node research pipeline:
      Tasks:
      - Research_Brief: Creates detailed research plan
      - Retrieve_Data: Gathers initial research data
      - Retry_Retrieve_Data: Additional data gathering if needed
      - Check_Research: Validates research completeness
      - Summarize_Research: Creates final summary
      
      Node Routing:
      - Research_Brief → Retrieve_Data → Check_Research → Summarize_Research
      - Failed checks can trigger Retry_Retrieve_Data
      - Each node includes retry paths
      
      Parameters:
      - prompt (string): Research query [required]
      
      Configuration:
      max_attempts: 3
      recursive: true
      templates: research_output_prompt
      
      Node End Code Routing:
      {
        "Research_Brief": {
          0: ("Retrieve_Data", False),  // Success, proceed to data retrieval
          1: ("Research_Brief", True),  // Failed, retry brief
        },
        "Retrieve_Data": {
          0: ("Check_Research", False), // Success, validate research
          1: ("Retrieve_Data", True),   // Failed, retry retrieval
        },
        "Check_Research": {
          0: ("Summarize_Research", False),  // Validated, create summary
          1: ("Check_Research", True),       // Check failed, retry
          2: ("Retry_Retrieve_Data", False), // Need more data
        },
        "Retry_Retrieve_Data": {
          0: ("Summarize_Research", False),  // Success, create summary
          1: ("Retry_Retrieve_Data", True),  // Failed, retry additional retrieval
        },
        "Summarize_Research": {
          0: (null, False),                  // Complete
          1: ("Summarize_Research", True),   // Failed, retry summary
        }
      }`,
                output: "Structured research output including original brief and comprehensive summary, with all gathered data properly organized and validated"
            },
            {
                goal: "Automate code generation process from planning to testing.",
                setup: `Four-node development pipeline:
      Tasks:
      - Plan_Workflow: Develops detailed coding plan
      - Generate_Code: Creates code implementation
      - Generate_Unit_Tests: Develops test suite
      - Check_Unit_Test_Results: Validates code quality
      
      Node Routing:
      - Plan_Workflow → Generate_Code → Generate_Unit_Tests → Check_Unit_Test_Results
      - Failed tests can trigger code regeneration
      - Each stage includes validation and retry logic
      
      Parameters:
      - prompt (string): Code requirements [required]
      
      Configuration:
      max_attempts: 3
      recursive: true
      templates: coding_workflow_output_prompt
      
      Node End Code Routing:
      {
        "Plan_Workflow": {
          0: ("Generate_Code", False),     // Plan ready, generate code
          1: ("Plan_Workflow", True),      // Failed, retry planning
        },
        "Generate_Code": {
          0: ("Generate_Unit_Tests", False), // Code ready, create tests
          1: ("Generate_Code", True),        // Failed, retry generation
          2: ("Generate_Code", True),        // Alternative failure case
          3: ("Generate_Code", True),        // Alternative failure case
        },
        "Generate_Unit_Tests": {
          0: ("Check_Unit_Test_Results", False), // Tests ready, validate
          1: ("Generate_Unit_Tests", True),      // Failed, retry test generation
          2: ("Check_Unit_Test_Results", True),  // Alternative path to validation
          3: ("Generate_Unit_Tests", True)       // Alternative failure case
        },
        "Check_Unit_Test_Results": {
          0: (null, False),                    // All tests passed
          1: ("Check_Unit_Test_Results", True), // Failed check, retry
          2: ("Generate_Code", True),           // Tests failed, new code needed
          3: ("Generate_Unit_Tests", True)      // Tests invalid, new tests needed
        }
      }`,
                output: "Complete code package including implementation, unit tests, and validation results, with any necessary revisions based on test feedback"
            }
        ]
    },
    [TaskType.PromptAgentTask]: {
        description: `A versatile task type that processes prompts using AI agents, with built-in support for tool usage and code execution. Each PromptAgentTask:
  - Processes natural language prompts through AI agents
  - Can execute function calls (tools) based on AI responses
  - Optionally handles code generation and execution
  - Maintains conversation history for context
  - Supports custom prompt templates
  - Automatically manages the flow between AI responses, tool usage, and code execution
  
  Best used for: Complex interactions requiring AI assistance, tasks that combine natural language processing with specific actions, or operations needing flexible tool integration.
  `,
        icon: <SupportAgent />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/prompt_agent_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: agentNodeRoutes,
            start_node: Object.keys(agentNodeRoutes)[0],
            task_type: TaskType.PromptAgentTask,
        },
        examples: [
            {
                goal: "Generate concise summaries of research data and findings.",
                setup: `Agent Configuration:
  - Models: chat: GPT4o
  - Tools: disabled
  - Code execution: disabled
  Parameters:
  - prompt (string): Original research question [required]
  - Retrieve_Data (string): Initial research data [required]
  - Retry_Retrieve_Data (string): Additional research data [optional]
  Node Configuration: Single node with success (0) and retry (1) paths`,
                output: "Structured summary message containing key findings and insights, organized by research aspects, with citations to source data"
            },
            {
                goal: "Intelligently gather information using multiple search and query tools.",
                setup: `Agent Configuration:
  - Models: chat: gpt-4o-mini
  - Tools: enabled (multiple search tools)
  - Code execution: disabled
  Parameters:
  - Research_Brief (string): Research objective [required]
  Available Tools: Exa_Search, Wikipedia_Search, Google_Search, Arxiv_Search, etc.
  Node Configuration: Two-node system with tool execution routing`,
                output: "Message containing aggregated search results, tool call records, task responses from each search tool, and structured data from multiple sources"
            }
        ]
    }, [TaskType.CheckTask]: {
        description: `A specialized evaluation task that analyzes AI responses against specific criteria or keywords. Each CheckTask:
  - Validates AI outputs against predefined success criteria
  - Uses configurable response mapping for pass/fail conditions
  - Provides binary (approved/failed) decisions
  - Supports retry logic for failed checks
  - Can be used as a validation step in workflows
  
  Best used for: Quality control, content validation, safety checks, or any scenario requiring specific criteria verification before proceeding.
  `,
        icon: <ForkLeft />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/check_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: checkTaskRoutes,
            start_node: Object.keys(checkTaskRoutes)[0],
            task_type: TaskType.CheckTask,
        },
        examples: [
            {
                goal: "Evaluate and validate research findings against specified criteria.",
                setup: `Agent Configuration:
  - Models: chat: GPT4o
  - Tools: disabled
  - Code execution: disabled
  Parameters:
  - Research_Brief (string): Original research goals [required]
  - Retrieve_Data (string): Research findings to review [required]
  Exit Code Mapping: "APPROVED": 0, "REJECTED": 2
  Node Configuration: Single node with success/retry paths`,
                output: "Review decision message including detailed feedback, improvement suggestions if rejected, and quality metrics assessment"
            }
        ]
    },
    [TaskType.CodeGenerationLLMTask]: {
        description: `A dedicated task type for AI - powered code generation and execution. Each CodeGenerationLLMTask:
  - Generates code based on natural language descriptions
  - Automatically executes and validates generated code
  - Provides intelligent retry logic for failed attempts
  - Handles code improvement based on execution results
  - Maintains context between generation attempts
  - Supports multiple programming languages
  
  Best used for: Automated code generation, code prototyping, script creation, coding assistance, or any task requiring code generation and execution from natural language descriptions.`,
        icon: <LogoDev />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/code_gen_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: codeNodeRoutes,
            start_node: Object.keys(codeNodeRoutes)[0],
            task_type: TaskType.CodeGenerationLLMTask,
        },
        examples: [
            {
                goal: "Generate and test code solutions from natural language descriptions.",
                setup: `Two-node pattern:
  - llm_generation: Generates code solutions
  - code_execution: Tests generated code
  Parameters:
  - prompt (string): Code requirements [required]
  Node Configuration: Generation to execution flow with feedback loop`,
                output: "Generated code with successful test execution results and any necessary improvements based on test feedback"
            }
        ]
    },
    [TaskType.GenerateImageTask]: {
        description: `A task type that creates images from text descriptions using AI. Each GenerateImageTask:
  - Creates images based on text prompts
  - Supports multiple image generation in one request
  - Offers customizable image sizes
  - Provides quality control options
  - Handles complex descriptive prompts
  - Includes automatic retry for failed generations
  
  Best used for: Creating custom illustrations, generating visual content for presentations, prototyping design ideas, or any scenario requiring AI-generated images from textual descriptions.`,
        icon: <Image />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/generate_image_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: genImageRoutes,
            start_node: Object.keys(genImageRoutes)[0],
            task_type: TaskType.GenerateImageTask,
        },
        examples: [
            {
                goal: "Create high-quality images from detailed text descriptions.",
                setup: `Single-node pattern with comprehensive image parameter control
  Parameters:
  - prompt (string): Image description [required]
  - n (integer): Number of images [optional]
  - size (string): Image dimensions [optional]
  - quality (string): Image quality setting [optional]`,
                output: "One or more generated images matching the description, with specified size and quality parameters"
            }
        ]
    },
    [TaskType.EmbeddingTask]: {
        description: `A task type that converts text into numerical vector representations (embeddings). Each EmbeddingTask:
  - Transforms text into high-dimensional vectors
  - Preserves semantic meaning of text
  - Handles single or multiple text inputs
  - Generates consistent embeddings for similar content
  - Supports different text formats
  - Includes error handling for malformed inputs
  
  Best used for: Semantic search implementations, text similarity analysis, content recommendation systems, or any application requiring text-to-vector conversion for machine learning purposes.
  `,
        icon: <Tag />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/embedding_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: embeddingTaskRoutes,
            start_node: Object.keys(embeddingTaskRoutes)[0],
            task_type: TaskType.EmbeddingTask,
        },
        examples: [
            {
                goal: "Generate vector embeddings for text to enable semantic search.",
                setup: `Single-node design with language awareness
  Parameters:
  - input (string): Text to embed [required]
  Node Configuration: Single node with generation and retry paths`,
                output: "Vector embeddings with metadata including text content, position index, and creation information"
            }
        ]
    },
    [TaskType.WebScrapeBeautifulSoupTask]: {
        description: `A task type designed for intelligent web content extraction and processing. Each WebScrapeBeautifulSoupTask:
  - Fetches and processes web page content
  - Intelligently identifies relevant content sections
  - Automatically generates optimal CSS selectors for content extraction
  - Removes unwanted elements (ads, navigation, etc.)
  - Handles various webpage structures
  - Falls back to reliable parsing strategies when needed
  - Preserves content structure and hierarchy
  - Includes metadata about extraction process
  
  Best used for: Content aggregation, data collection from websites, web research automation, content monitoring systems, or any scenario requiring structured extraction of web content while filtering out non-essential elements.`,
        icon: <Downloading />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/web_scrape_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: scrapeNodeRoutes,
            start_node: Object.keys(scrapeNodeRoutes)[0],
            task_type: TaskType.WebScrapeBeautifulSoupTask,
        },
        examples: [
            {
                goal: "Intelligently extract and process web content with AI assistance.",
                setup: `Three-node pattern:
  - fetch_url: Retrieves raw HTML content
  - generate_selectors_and_parse: Uses LLM for optimal selector generation
  - url_summarization: Creates content summary
  Parameters:
  - url (string): Target webpage URL [required]`,
                output: "Structured content extraction with cleaned text, relevant sections identified, and optional content summary"
            }
        ]
    },
    [TaskType.RetrievalTask]: {
        description: `A specialized task type that handles semantic search and content retrieval using embeddings. Each RetrievalTask:
  - Converts content into searchable vector embeddings
  - Performs semantic similarity searches across multiple content types
  - Automatically manages embedding generation and updates
  - Supports multiple file formats and content types
  - Provides configurable similarity thresholds
  - Returns ranked results based on relevance
  - Handles incremental updates to content collections
  
  Best used for: Building semantic search systems, implementing content recommendation engines, finding similar documents, creating knowledge bases with semantic search capabilities, or any scenario requiring content retrieval based on meaning rather than exact matching.
  `,
        icon: <SimCardDownload />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/retrieval_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: retrievalTaskNodes,
            start_node: Object.keys(retrievalTaskNodes)[0],
            task_type: TaskType.RetrievalTask,
        },
        examples: [
            {
                goal: "Find and retrieve semantically similar content from a data cluster.",
                setup: `Two-node pattern:
  - ensure_embeddings: Updates/verifies embeddings
  - retrieve_relevant_embeddings: Performs similarity search
  Parameters:
  - prompt (string): Search query [required]
  - similarity_threshold (number): Matching threshold [optional]
  - max_results (integer): Result limit [optional]`,
                output: "Ranked list of semantically similar content with similarity scores and original content references"
            }
        ]
    },
    [TaskType.TextToSpeechTask]: {
        description: `A specialized task type that converts text into natural-sounding speech. Each TextToSpeechTask:
  - Transforms written text into spoken audio
  - Supports multiple voice options
  - Allows speed adjustment of speech
  - Handles long-form text conversion
  - Produces audio files as output
  - Includes automatic retry logic for failed conversions
  
  Best used for: Creating voiceovers, generating spoken content for accessibility, audio content creation, or any scenario requiring text-to-speech conversion.
  `,
        icon: <RecordVoiceOver />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/text_to_speech_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: textToSpeechTaskRoutes,
            start_node: Object.keys(textToSpeechTaskRoutes)[0],
            task_type: TaskType.TextToSpeechTask,
        },
        examples: [
            {
                goal: "Convert text to natural-sounding speech with configurable voice options.",
                setup: `Single-node execution pattern
  Parameters:
  - text (string): Content to convert [required]
  - voice (string): Voice selection [optional]
  - speed (number): Speech rate [optional]`,
                output: "Audio file containing synthesized speech with specified voice and speed parameters"
            }
        ]
    },
    [TaskType.CodeExecutionLLMTask]: {
        description: ``,
        icon: <Code />,
        detail_knowledgebase_link: '/shared/knowledgebase/core/task/code_exec_task.md',
        default_form: {
            ...baseForm as PopulatedTask,
            node_end_code_routing: codeExecutionRoutes,
            start_node: Object.keys(codeExecutionRoutes)[0],
            task_type: TaskType.CodeExecutionLLMTask,
        },
        examples: [
            {
                goal: "Execute code blocks safely with comprehensive environment management.",
                setup: `Single 'code_execution' node
  Parameters:
  - prompt (string): Code to execute [required]
  Node Configuration: Execution with safety checks and environment isolation`,
                output: "Execution results including output, errors if any, and execution metadata"
            }
        ]
    },
};