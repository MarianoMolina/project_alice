# hr_reviewer_agent = {
#     "name": "hr_reviewer_agent",
#     "system_message": "hr_reviewer_agent",
#     "autogen_class": "ConversableAgent",
# }
hr_drafter_agent = {
    "name": "hr_drafter_agent",
    "system_message": "hr_drafter_agent",
    "autogen_class": "ConversableAgent",
}
# hr_chat_manager_agent = {
#     "name": "hr_chat_manager_agent",
#     "system_message": "chat_summarizer",
#     "autogen_class": "GroupChatManager",
#     "agents_in_group": ["hr_drafter_agent", "hr_reviewer_agent", "user_proxy_agent"],
#     "speaker_selection": {
#         "speaker_sequence": ["hr_drafter_agent", "hr_reviewer_agent"],
#         "termination_condition": lambda x: "no further improvements" in x.lower() or "TERMINATE" in x
#     }
# }
coding_planner_agent = {
    "name": "coding_planner_agent",
    "system_message": "coding_planner_agent",
    "autogen_class": "ConversableAgent",
    "human_input_mode": "NEVER"
}
coding_agent = {
    "name": "coding_agent",
    "system_message": "coding_agent",
    "autogen_class": "AssistantAgent",
    "human_input_mode": "NEVER",
    # "llm_config": {
    #     "config_list": [{
    #         "model": "second-state/StarCoder2-15B-GGUF/starcoder2-15b-Q6_K.gguf",
    #         "api_key": "lm-studio", 
    #         "base_url": "http://localhost:1234/v1",
    #     }],
    #     "cache_seed": False,
    #     "temperature": 0.3,
    #     "timeout": 120,
    # }
}
unit_tester_agent = {
    "name": "unit_tester_agent",
    "system_message": "unit_tester_agent",
    "autogen_class": "AssistantAgent"
}
unit_test_execution_checker_agent = {
    "name": "unit_test_execution_checker_agent",
    "system_message": "unit_test_execution_checker_agent",
    "autogen_class": "ConversableAgent"
}
user_input_agent = {
    "name": "user_input_agent",
    "human_input_mode": "ALWAYS",
    "code_execution_config": False,
    "autogen_class": "UserProxyAgent",
    "default_auto_reply": "TERMINATE"
}
user_proxy_agent = {
    "name": "user_proxy_agent",
    "human_input_mode": "NEVER",
    "code_execution_config": False,
    "autogen_class": "UserProxyAgent",
    "default_auto_reply": "TERMINATE"
}
executor_agent = {
    "name": "executor_agent",
    "system_message": "executor_agent",
    "autogen_class": "UserProxyAgent",
    "human_input_mode": "NEVER",
    "code_execution_config": True
}
unit_test_execution_checker_agent = {
    "name": "unit_test_execution_checker_agent",
    "system_message": "unit_test_execution_checker_agent",
    "autogen_class": "ConversableAgent",
    "human_input_mode": "NEVER"
}
default_checker_agent = {
    "name": "default_checker_agent",
    "system_message": "default_checker_agent",
    "autogen_class": "ConversableAgent"
}
default_agent = {
    "name": "default_agent",
    "system_message": "default_agent",
    "autogen_class": "ConversableAgent"
}
research_agent = {
    "name": "research_agent",
    "system_message": "research_agent",
    "autogen_class": "ConversableAgent"
}
agents = [
    hr_drafter_agent,
    user_proxy_agent,
    user_input_agent,
    coding_planner_agent,
    coding_agent,
    unit_tester_agent,
    executor_agent,
    unit_test_execution_checker_agent,
    default_agent, 
    default_checker_agent,
    research_agent
]
