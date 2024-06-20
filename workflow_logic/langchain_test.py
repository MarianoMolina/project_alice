import os
from typing import Literal
from pydantic import Field, BaseModel, field_validator
from langchain_google_community import GoogleSearchAPIWrapper, GoogleSearchRun, GoogleSearchResults
from langchain_core.tools import Tool
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.agent_toolkits.load_tools import load_tools
from langchain.agents import initialize_agent
from langchain_openai import ChatOpenAI
from langchain_community.tools.pubmed.tool import PubmedQueryRun

os.environ["GOOGLE_CSE_ID"] = "942b85119dffa48dd"
os.environ["GOOGLE_API_KEY"] = "AIzaSyCAm1ylnN4oH2TyUwq0nxgmskPpVnL5CO0"
# <script async src="https://cse.google.com/cse.js?cx=942b85119dffa48dd">
# </script>
# <div class="gcse-search"></div>

# Wikipedia API call
import wikipedia
result = wikipedia.search("Diego Maradona", results=5)
# Langchain wikipedia
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_community.retrievers import WikipediaRetriever
api_wrapper = WikipediaAPIWrapper(top_k_results=5, doc_content_chars_max=1000) # API Wrapper -> has run()
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper) # Tool -> Has invoke() and run()
retriever = WikipediaRetriever(api_wrapper=api_wrapper) # Retriever -> has get_relevant_documents()
response = wiki_tool.run({"query": "Diego Maradona"})
print(f'Wikipedia response: {response}')

## ArXiv with ReActAgent
llm: ChatOpenAI = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    temperature=0,
    api_key="lm-studio"
)
from langchain_community.agent_toolkits.load_tools import load_tools
arxiv_tools = load_tools(
    ["arxiv"],
)
arxiv_tools[0].invoke("What papers discuss the Mamba architecture?")

prompt = hub.pull("hwchase17/react")
agent = create_react_agent(llm, arxiv_tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=arxiv_tools, verbose=True)

## Google search
from googleapiclient.discovery import build
def google_search(search_term, api_key, cse_id, **kwargs):
    service = build("customsearch", "v1", developerKey=api_key)
    res = service.cse().list(q=search_term, cx=cse_id, **kwargs).execute()
    return res['items']
# list(sort=None, hl=None, orTerms=None, highRange=None, cx=None, cr=None, imgType=None, relatedSite=None, filter=None, gl=None, searchType=None, 
# fileType=None, linkSite=None, start=None, imgDominantColor=None, lr=None, siteSearch=None, dateRestrict=None, safe=None, c2coff=None, googlehost=None, 
# hq=None, exactTerms=None, lowRange=None, imgSize=None, imgColorType=None, rights=None, x__xgafv=None, excludeTerms=None, q=None, num=None, siteSearchFilter=None)



# Langchain Google search tool
search = GoogleSearchAPIWrapper() # API Wrapper -> has run()
search_tool = GoogleSearchRun(api_wrapper=search) # Tool -> Has invoke()
search_tool = GoogleSearchResults(api_wrapper=search) # Tool -> Has invoke(), returns results as a list of dict of snippet, title, link because it uses the api wrapper's result() instead of run()
search_tool = Tool(
    name="google_search",
    description="Search Google for recent results.",
    func=search.run,
)

## PubMed
med_tool = PubmedQueryRun()

## Reddit
# Direct api call
import praw
reddit_client_id = "3KvU7lqCMjT1ULAGyAiWpQ"
reddit_client_secret = "rm78SqvheVEsb5opYTACdTXJnlwPjQ"
user_agent = "Alice_Assistant"
reddit = praw.Reddit(
    client_id=reddit_client_id,
    client_secret=reddit_client_secret,
    user_agent=user_agent,
)
subredditObject = reddit.subreddit("all")
search_results = subredditObject.search(
    query="scandal", sort="hot", time_filter="week", limit=10
)

# Langchain reddit tool
from langchain_community.tools.reddit_search.tool import RedditSearchRun
from langchain_community.utilities.reddit_search import RedditSearchAPIWrapper

class RedditSearchSchema(BaseModel):
    """Input for Reddit search."""

    query: str = Field(
        description="should be query string that post title should \
        contain, or '*' if anything is allowed."
    )
    sort: Literal["relevance" , "hot", "top", "new", "comments"] = Field(
        description='should be sort method, which is one of: "relevance" \
        , "hot", "top", "new", or "comments".'
    )
    time_filter: Literal["all", "day", "hour", "month", "week", "year"] = Field(
        description='should be time period to filter by, which is \
        one of "all", "day", "hour", "month", "week", or "year"'
    )
    subreddit: str = Field(
        description='should be name of subreddit, like "all" for \
        r/all'
    )
    limit: int = Field(
        description="a positive integer indicating the maximum number \
        of results to return"
    )
    @field_validator("limit")
    def limit_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("limit must be positive")
        return v
    
search = RedditSearchRun(
    api_wrapper=RedditSearchAPIWrapper(
        reddit_client_id=reddit_client_id,
        reddit_client_secret=reddit_client_secret,
        reddit_user_agent=user_agent,
    )
)
search_params = RedditSearchSchema(
    query="Furiosa", sort="hot", time_filter="week", limit="10", subreddit="all"
)
reddit_response = search.run(tool_input=search_params.model_dump())
print(f'Reddit response: {reddit_response}')

## Requests
from langchain_community.utilities import TextRequestsWrapper

requests = TextRequestsWrapper()

## Exa
os.environ["EXA_API_KEY"] = "07237826-b41e-413e-91c8-a4feb307cad0"
# Direct Exa API call
from exa_py import Exa
exa_api = Exa(api_key=os.environ["EXA_API_KEY"])
exa_search = exa_api.search(query="What is the capital of France?", num_results=5)

# Langchain EXA
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_exa import ExaSearchRetriever, TextContentsOptions
from langchain_openai import ChatOpenAI
# retrieve 5 documents, with content truncated at 1000 characters
exa_retriever = ExaSearchRetriever(
    k=5, text_contents_options=TextContentsOptions(max_length=200)
)
exa_search_2 = exa_retriever.invoke("What is the capital of France?")

prompt = PromptTemplate.from_template(
    """Answer the following query based on the following context:
query: {query}
<context>
{context}
</context"""
)

exa_chain = (
    RunnableParallel({"context": exa_retriever, "query": RunnablePassthrough()})
    | prompt
    | llm
)

# StackExchange
from langchain_community.utilities import StackExchangeAPIWrapper

stackexchange = StackExchangeAPIWrapper()

# Gradio Tools
from gradio_tools.tools import (
    ImageCaptioningTool,
    StableDiffusionPromptGeneratorTool,
    StableDiffusionTool,
    TextToVideoTool,
    ClipInterrogatorTool,
    WhisperAudioTranscriptionTool,
    BarkTextToSpeechTool,
    SAMImageSegmentationTool
)
from langchain.agents import initialize_agent
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(memory_key="chat_history")
# tools = [
#     StableDiffusionTool().langchain,
#     ImageCaptioningTool().langchain,
#     StableDiffusionPromptGeneratorTool().langchain,
#     TextToVideoTool().langchain,
#     ClipInterrogatorTool().langchain,
#     WhisperAudioTranscriptionTool().langchain,
#     BarkTextToSpeechTool().langchain,
#     SAMImageSegmentationTool().langchain,
# ]

# visual_agent = initialize_agent(
#     tools, llm, memory=memory, agent="conversational-react-description", verbose=True
# )


if __name__ == "__main__":
    
    # response = wiki_tool.run({"query": "Diego Maradona"})
    # print(f'Wikipedia response: {response}')

    # arxiv_response = agent_executor.invoke({"input": "What papers discuss the Mamba architecture?"})
    # print(f'ArXiv response: {arxiv_response}')

    # search_result = search_tool.run("Obama's first name?")
    # print(f'Google search result: {search_result}')
    # results = google_search(
    #     'stackoverflow site:en.wikipedia.org', os.environ["GOOGLE_API_KEY"], os.environ["GOOGLE_CSE_ID"], num=10)
    # for result in results:
    #     print(result)

    # med_response = med_tool.run({"query": "What causes cancer?"})
    # print(f'PubMed response: {med_response}')

    # search_params = RedditSearchSchema(
    #     query="Furiosa", sort="hot", time_filter="week", limit="10", subreddit="all"
    # )
    # reddit_response = search.run(tool_input=search_params.dict())
    # print(f'Reddit response: {reddit_response}')

    # request_response = requests.get("https://claude.ai")
    # print(f'Request response: {request_response}')

    exa_response = exa_retriever.invoke("What is the capital of France?")
    print(f'Exa response: {exa_response}')

    # stackexchange_response = stackexchange.run({"zsh: command not found: python"})
    # print(f'StackExchange response: {stackexchange_response}')
    
    # output = visual_agent.invoke(
    #     input=(
    #         "Please create a photo of a dog riding a skateboard "
    #         "but improve my prompt prior to using an image generator."
    #         "Please caption the generated image and create a video for it using the improved prompt."
    #     )
    # )
    # print(f'Visual agent response: {output}')
    
    
