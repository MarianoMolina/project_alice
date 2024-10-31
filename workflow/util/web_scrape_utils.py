import requests
from bs4 import BeautifulSoup
import re
from typing import List, Optional
from workflow.util import LOGGER

def extract_json(text: str) -> str:

    """Extract JSON from a possible code block."""

    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)

    if json_match:

        return json_match.group(1)
    LOGGER.warning(f"No JSON code block found, returning original string: {text[:100]}...")
    return text

def fetch_webpage_and_title(url: str) -> tuple[str, str]:
    """
    Fetch the HTML content of the webpage and extract its title.

    Args:
        url (str): The URL of the webpage to fetch.

    Returns:
        tuple[str, str]: A tuple containing the HTML content and the title of the webpage.

    Raises:
        requests.HTTPError: If the HTTP request returned an unsuccessful status code.
    """
    LOGGER.info(f"Fetching webpage content from URL: {url}")
    response = requests.get(url)
    response.raise_for_status()
    LOGGER.info("Webpage fetched successfully.")
    
    html_content = response.text
    
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract the title
    title = soup.title.string if soup.title else "No title found"
    
    LOGGER.info(f"Extracted title: {title}")
    
    return html_content, title


def preprocess_html(html: str) -> str:
    """
    Remove scripts, styles, and non-content elements from the HTML.

    Args:
        html (str): The raw HTML content.

    Returns:
        str: The cleaned HTML content.
    """
    LOGGER.info("Preprocessing HTML content.")
    soup = BeautifulSoup(html, 'html.parser')
    for element in soup(["script", "style", "noscript", "iframe", "header", "footer", "nav", "aside"]):
        element.extract()
    cleaned_html = str(soup)
    LOGGER.info("HTML preprocessing completed.")
    return cleaned_html

def sample_html(html: str, max_length: int = 4000, num_samples: int = 4) -> List[str]:
    """
    Sample chunks of the HTML content for the agent.

    Args:
        html (str): The cleaned HTML content.
        max_length (int, optional): Maximum number of characters per sample. Defaults to 4000.
        num_samples (int, optional): Number of samples to generate. Defaults to 4.

    Returns:
        List[str]: A list of HTML samples.
    """
    total_length = len(html)
    LOGGER.info(f"Total HTML length: {total_length} characters.")
    if total_length <= max_length:
        LOGGER.info("HTML length is within the maximum limit. No sampling needed.")
        return [html]
    else:
        # Split the HTML into num_samples chunks
        chunk_size = total_length // num_samples
        samples = [html[i*chunk_size : (i+1)*chunk_size] for i in range(num_samples)]
        LOGGER.info(f"HTML content split into {num_samples} samples.")
        return samples

def apply_parsing_strategy(html: str, selectors: List[str]) -> Optional[str]:
    """
    Apply the CSS selectors to extract content using Beautiful Soup.

    Args:
        html (str): The cleaned HTML content.
        selectors (List[str]): A list of CSS selectors.

    Returns:
        Optional[str]: The extracted text content or None if extraction fails.
    """
    LOGGER.info("Applying parsing strategy with generated selectors.")
    soup = BeautifulSoup(html, 'html.parser')
    content_elements = []
    for selector in selectors:
        elements = soup.select(selector)
        LOGGER.debug(f"Applying selector '{selector}' found {len(elements)} elements.")
        content_elements.extend(elements)
    # Get text content from the selected elements
    text_content = ' '.join([elem.get_text(separator=' ', strip=True) for elem in content_elements])
    if text_content.strip():
        LOGGER.info("Content extracted successfully using selectors.")
        return text_content
    else:
        LOGGER.warning("No content extracted using the agent-generated selectors.")
        return None

def fallback_parsing_strategy(html: str) -> Optional[str]:
    LOGGER.info("Applying fallback parsing strategy by extracting all <p> tags.")
    soup = BeautifulSoup(html, 'html.parser')
    selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    content_elements = []
    for selector in selectors:
        paragraphs = soup.select(selector)
        LOGGER.debug(f"Applying selector '{selector}' found {len(paragraphs)} elements.")
        content_elements.extend(paragraphs)
    content = ' '.join([para.get_text(separator=' ', strip=True) for para in content_elements])
    if content.strip():
        LOGGER.info("Content extracted successfully using fallback method.")
        return content
    else:
        LOGGER.warning("No content found even after fallback parsing.")
        return None

def clean_text(text: str) -> str:
    """
    Clean the extracted text by removing excessive whitespace.

    Args:
        text (str): The raw extracted text.

    Returns:
        str: The cleaned text.
    """
    LOGGER.info("Cleaning extracted text.")
    text = re.sub(r'\s+', ' ', text)
    cleaned_text = text.strip()
    LOGGER.debug(f"Cleaned text: {cleaned_text[:100]}...")  # Log first 100 chars for brevity
    return cleaned_text