from typing import List, Dict, Any
from pydantic import Field
from workflow.db_app.initialization.modules.init_module import InitializationModule, get_prompt_file

class BaseTasksModule(InitializationModule):
    """This module defines the base tasks, their agents, parameters and prompts."""
    name: str = "base_tasks"
    dependencies: List[str] = ["base", "base_local"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

base_tasks_module = BaseTasksModule(
    data = {
        "parameters": [
            {
                "key": "max_results_parameter",
                "type": "integer",
                "description": "The maximum number of results to return",
                "default": 4
            },
            {
                "key": "sort_parameter",
                "type": "string",
                "description": "The sort method for the search",
                "default": "hot"
            },
            {
                "key": "time_filter_parameter",
                "type": "string",
                "description": "The time period to filter by",
                "default": "week"
            },
            {
                "key": "subreddit_parameter",
                "type": "string",
                "description": "The subreddit to search",
                "default": "all"
            },
            {
                "key": "prompt_parameter",
                "type": "string",
                "description": "The entity to search for in the Knowledge Graph."
            },
            {
                "key": "types_parameter",
                "type": "string",
                "description": "An optional list of entity types to restrict the results. Provide them as comma separated values. Types are: Book, BookSeries, EducationalOrganization, Event, GovernmentOrganization, LocalBusiness, Movie, MovieSeries, MusicAlbum, MusicGroup, MusicRecording, Organization, Periodical, Person, Place, SportsTeam, TVEpisode, TVSeries, VideoGame, VideoGameSeries, WebSite"
            },
            {
                "key": "limit_parameter",
                "type": "integer",
                "description": "Limits the number of entities to be returned. Maximum is 500. Default is 10."
            },
            {
                "key": "wolfram_prompt_parameter",
                "type": "string",
                "description": "The prompt string to be sent to Wolfram Alpha."
            },
            {
                "key": "units_parameter",
                "type": "string",
                "description": "Unit system to use for measurements. 'metric' or 'imperial'. Default is 'metric'."
            },
            {
                "key": "format_parameter",
                "type": "string",
                "description": "Output format. Options are 'plaintext', 'image', 'html', 'json'. Default is 'plaintext'."
            }
        ],
        "tasks": [
            {
                "key": "wolfram_alpha_query_task",
                "task_type": "APITask",
                "task_name": "Wolfram_Alpha_Query",
                "task_description": "Queries Wolfram Alpha for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "wolfram_prompt_parameter",
                        "units": "units_parameter",
                        "format": "format_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["wolfram_alpha"]
            },
            {
                "key": "knowledge_graph_search_task",
                "task_type": "APITask",
                "task_name": "Knowledge_Graph_Search",
                "task_description": "Searches Google Knowledge Graph for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "types": "types_parameter",
                        "max_results": "limit_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["google_knowledge_graph"]
            },
            {
                "key": "reddit_search",
                "task_type": "APITask",
                "task_name": "Reddit_Search",
                "task_description": "Searches Reddit for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "sort": "sort_parameter",
                        "time_filter": "time_filter_parameter",
                        "subreddit": "subreddit_parameter",
                        "max_results": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["reddit_search"]
            },
            {
                "key": "exa_search",
                "task_type": "APITask",
                "task_name": "Exa_Search",
                "task_description": "Searches Exa for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "max_results": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["exa_search"]
            },
            {
                "key": "wikipedia_search",
                "task_type": "APITask",
                "task_name": "Wikipedia_Search",
                "task_description": "Searches Wikipedia for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "max_results": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["wikipedia_search"]
            },
            {
                "key": "google_search",
                "task_type": "APITask",
                "task_name": "Google_Search",
                "task_description": "Searches Google for information",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "max_results": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["google_search"]
            },
            {
                "key": "arxiv_search",
                "task_type": "APITask",
                "task_name": "Arxiv_Search",
                "task_description": "Searches arXiv for papers",
                "input_variables": {
                    "type": "object",
                    "properties": {
                        "prompt": "prompt_parameter",
                        "max_results": "max_results_parameter"
                    },
                    "required": ["prompt"]
                },
                "required_apis": ["arxiv_search"]
            },
        ]
    }
)