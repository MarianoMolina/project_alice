# WebScrapeBeautifulSoupTask

A sophisticated three-node task combining traditional web scraping with AI assistance for intelligent content extraction.

## Key Features
- Three-node intelligent scraping pattern
- LLM-assisted selector generation
- Content summarization
- Robust fallback strategies

## Node Structure
1. `fetch_url`: Retrieves raw HTML content
2. `generate_selectors_and_parse`: Uses LLM to generate optimal selectors
3. `url_summarization`: Creates content summary

## Usage
```python
scraper = WebScrapeBeautifulSoupTask(
    agent=agent_with_llm,
    task_name="smart_scraper",
    task_description="Extract and summarize web content"
)

content = await scraper.run(
    url="https://example.com/article"
)
```