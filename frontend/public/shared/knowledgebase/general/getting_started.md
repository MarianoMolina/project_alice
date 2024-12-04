# Getting Started with Alice

Well, if you are here, you've seemingly done the hardest part. But in case you haven't, you have to get the system set up (check the repository **ReadMe** to see installation instructions) and create your account. 

## Exploring Alice

Once you have the frontend running, you can start exploring Alice's features:

1. **SETUP**: If you haven't set up your **.env** yet, take a second to navigate to the `User Settings` -> [APIs](/shared/knowledgebase/core/api/api) and set up the API keys for any API you would like to be able to use. Here you can manage your account settings. 

2. **CHAT**: Navigate to `Chat with Alice` and either use any of the pre-set chats (note that each agent's name tells you which API they depend on) or, if you are feeling adventurous, create your own [Chat](/shared/knowledgebase/core/chat). If you are feeling frisky though, you can even create your own [Agent](/shared/knowledgebase/core/agent) and with its own system [Prompt](/shared/knowledgebase/core/prompt), as well as selecting the your favorite [Model](/shared/knowledgebase/core/model) of preference (or creating it if I haven't added it by default). 

3. **TASK**: Alternatively, you can check out the `Execute Task` section: here you can see all the [Tasks](/shared/knowledgebase/core/task/task) available, which are the Tools the agents can use in your environment. You can view their details or select them for execution: If you do, you'll see the inputs the tasks takes (required and non-required), and you can execute them. This will generate a [Task Response](/shared/knowledgebase/core/task_response) with the task outputs, which can be additional task responses (in the case of Workflows), or [Files](/shared/knowledgebase/core/file), [Messages](/shared/knowledgebase/core/message) or [Entity References](/shared/knowledgebase/core/entity_reference). 

4. **DATABASE**: If you want to create your own Task (or your own agent for your chat for that matter) you'll want to navigate to `View Database` section. Here you can see all the **Core** entities (agents, apis, chats, models, parameters, prompts and tasks) and **Reference** entities (files, messages, task responses and entity references) in your environment. You can create or edit all the core entities here to be whatever you need. 

## Next Steps

1. Try creating your first Agent in the Database section.
2. Set up a simple Task and execute it.
3. Start a chat conversation and see how you can integrate task results.

## Troubleshooting

If you encounter any issues:
1. Check the console for any error messages.
2. Ensure all required services (Backend and Workflow containers) are running.
3. Verify your API configurations in the User Settings. 
4. Look at the docker logs for information. 
5. Check any task response that failed to see their diagnostics information. 

Happy exploring with Alice!