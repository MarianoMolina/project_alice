import docker, time, re, base64
from enum import Enum
from typing import Optional, List, Tuple
from docker.errors import DockerException, ContainerError, APIError
from requests.exceptions import ReadTimeout
from workflow.util.logger import LOGGER

# TODO: Replace language as a str here
def run_code(code: str, language: str, timeout: int = 30, retries: int = 3, log_level='info') -> Tuple[str, int]:
    client = docker.from_env()
    images = {
        'python': ['mypython:latest'],
        'bash': ['mybash:latest']
    }
    if language not in images:
        raise ValueError(f"Unsupported language: {language}")
    
    error = None
    code = code.replace('\r\n', '\n').replace('\r', '\n')
    code_b64 = base64.b64encode(code.encode('utf-8')).decode('utf-8')

    def log(message, level='info'):
        if log_level == 'debug' or (log_level == 'info' and level == 'info'):
            print(message)

    for attempt in range(1, retries + 1):
        for image in images[language]:
            try:
                if language == 'python':
                    command_str = 'python -c "import base64; exec(base64.b64decode(\'$CODE_B64\').decode())"' if log_level == 'info' else (
                        'set -x; '
                        'echo "$CODE_B64" | base64 -d > script.py && '
                        'echo "import base64" | cat - script.py > temp && mv temp script.py && '
                        'python script.py'
                    )
                elif language == 'bash':
                    command_str = 'bash -c "$(echo $CODE_B64 | base64 -d)"' if log_level == 'info' else (
                        'set -x; '
                        'echo "$CODE_B64" | base64 -d > script.sh && '
                        'cat -v script.sh && '
                        'bash script.sh'
                    )
                
                log(f"Executing command: {command_str}", 'debug')
                
                container = client.containers.run(
                    image,
                    ['bash', '-c', command_str],
                    detach=True,
                    stdout=True,
                    stderr=True,
                    network_disabled=False,
                    mem_limit='512m',
                    cpu_quota=50000,
                    environment={'CODE_B64': code_b64}
                )
                
                try:
                    exit_status = container.wait(timeout=timeout)
                except (docker.errors.APIError, ReadTimeout) as e:
                    container.kill()
                    raise TimeoutError(f"Execution exceeded {timeout} seconds") from e
                
                logs = container.logs(stdout=True, stderr=True)
                logs_decoded = logs.decode('utf-8')
                clean_logs = remove_content(logs_decoded)
                
                if exit_status['StatusCode'] != 0:
                    error_message = f"Non-zero exit status: {exit_status['StatusCode']}\nLogs:\n{clean_logs}"
                    raise RuntimeError(error_message)
                
                container.remove()
                return clean_logs, exit_status['StatusCode']
            
            except (ContainerError, DockerException, APIError, RuntimeError, TimeoutError, ReadTimeout) as e:
                error = e
                log(f"Attempt {attempt}, Image '{image}': {str(e)}\n", 'debug')
                continue
        
        time.sleep(1)
    
    raise error

def remove_content(input_string):
    # Regex patterns to match both formats
    patterns = [
        r'echo[\s\S]*?mv temp script\.py',  # Original pattern
        r'echo[\s\S]*?cat -v script\.sh'    # New pattern
    ]
    
    for pattern in patterns:
        # Check if the pattern exists in the input string
        if re.search(pattern, input_string):
            # Remove the matched content
            input_string = re.sub(pattern, '', input_string)
    
    # Remove leading/trailing whitespace and return
    return input_string.strip()

class Language(str, Enum):
    """Enum of the programming languages."""
    TEXT = "text"
    CPP = "cpp"
    GO = "go"
    JAVA = "java"
    KOTLIN = "kotlin"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    PHP = "php"
    PROTO = "proto"
    PYTHON = "python"
    RST = "rst"
    RUBY = "ruby"
    RUST = "rust"
    SCALA = "scala"
    SWIFT = "swift"
    MARKDOWN = "markdown"
    LATEX = "latex"
    HTML = "html"
    SOL = "sol"
    CSHARP = "csharp"
    COBOL = "cobol"
    C = "c"
    LUA = "lua"
    PERL = "perl"
    HASKELL = "haskell"
    ELIXIR = "elixir"
    POWERSHELL = "powershell"
    SHELL = "shell"
    SQL = "sql"    
    CSS = "css"    
    XML = "xml"    
    YAML = "yaml"  
    JSON = "json"  

def get_language_matching(language: str) -> Optional[Language]:
    """
    Maps various language identifiers to Language enum values.
    
    Args:
        language: A string representing a programming language
        
    Returns:
        Language enum value if a match is found, None otherwise
    """
    language_map = {
        # Python
        "python": Language.PYTHON,
        "py": Language.PYTHON,
        
        # JavaScript
        "javascript": Language.JAVASCRIPT,
        "js": Language.JAVASCRIPT,
        
        # TypeScript
        "typescript": Language.TYPESCRIPT,
        "ts": Language.TYPESCRIPT,
        
        # Java
        "java": Language.JAVA,
        
        # C
        "c": Language.C,
        
        # C++
        "c++": Language.CPP,
        "cpp": Language.CPP,
        
        # C#
        "csharp": Language.CSHARP,
        "cs": Language.CSHARP,
        
        # Ruby
        "ruby": Language.RUBY,
        "rb": Language.RUBY,
        
        # Go
        "go": Language.GO,
        "golang": Language.GO,
        
        # Swift
        "swift": Language.SWIFT,
        
        # Kotlin
        "kotlin": Language.KOTLIN,
        "kt": Language.KOTLIN,
        
        # Rust
        "rust": Language.RUST,
        "rs": Language.RUST,
        
        # Scala
        "scala": Language.SCALA,
        "sc": Language.SCALA,
        
        # PHP
        "php": Language.PHP,
        
        # Shell
        "shell": Language.SHELL,
        "sh": Language.SHELL,
        "bash": Language.SHELL,
        
        # SQL
        "sql": Language.SQL,
        
        # HTML
        "html": Language.HTML,
        
        # CSS
        "css": Language.CSS,
        
        # Markdown
        "markdown": Language.MARKDOWN,
        "md": Language.MARKDOWN,
        
        # JSON
        "json": Language.JSON,
        
        # XML
        "xml": Language.XML,
        
        # YAML
        "yaml": Language.YAML,
        "yml": Language.YAML,
    }
    
    normalized_language = language.lower().strip()
    if normalized_language in language_map:
        return language_map[normalized_language]
        
    LOGGER.warning(f"No matching language found for: {language}")
    return None

def get_separators_for_language(language: Language) -> List[str]:
    if language == Language.C or language == Language.CPP:
        return [
            # Split along class definitions
            "\nclass ",
            # Split along function definitions
            "\nvoid ",
            "\nint ",
            "\nfloat ",
            "\ndouble ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nswitch ",
            "\ncase ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.GO:
        return [
            # Split along function definitions
            "\nfunc ",
            "\nvar ",
            "\nconst ",
            "\ntype ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nswitch ",
            "\ncase ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.JAVA:
        return [
            # Split along class definitions
            "\nclass ",
            # Split along method definitions
            "\npublic ",
            "\nprotected ",
            "\nprivate ",
            "\nstatic ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nswitch ",
            "\ncase ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.KOTLIN:
        return [
            # Split along class definitions
            "\nclass ",
            # Split along method definitions
            "\npublic ",
            "\nprotected ",
            "\nprivate ",
            "\ninternal ",
            "\ncompanion ",
            "\nfun ",
            "\nval ",
            "\nvar ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nwhen ",
            "\ncase ",
            "\nelse ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.JAVASCRIPT:  # Updated from JS
        return [
            # Split along function definitions
            "\nfunction ",
            "\nconst ",
            "\nlet ",
            "\nvar ",
            "\nclass ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nswitch ",
            "\ncase ",
            "\ndefault ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.TYPESCRIPT:  # Updated from TS
        return [
            "\nenum ",
            "\ninterface ",
            "\nnamespace ",
            "\ntype ",
            # Split along class definitions
            "\nclass ",
            # Split along function definitions
            "\nfunction ",
            "\nconst ",
            "\nlet ",
            "\nvar ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nswitch ",
            "\ncase ",
            "\ndefault ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.PHP:
        return [
            # Split along function definitions
            "\nfunction ",
            # Split along class definitions
            "\nclass ",
            # Split along control flow statements
            "\nif ",
            "\nforeach ",
            "\nwhile ",
            "\ndo ",
            "\nswitch ",
            "\ncase ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.PROTO:
        return [
            # Split along message definitions
            "\nmessage ",
            # Split along service definitions
            "\nservice ",
            # Split along enum definitions
            "\nenum ",
            # Split along option definitions
            "\noption ",
            # Split along import statements
            "\nimport ",
            # Split along syntax declarations
            "\nsyntax ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.PYTHON:
        return [
            # First, try to split along class definitions
            "\nclass ",
            "\ndef ",
            "\n\tdef ",
            # Now split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.RST:
        return [
            # Split along section titles
            "\n=+\n",
            "\n-+\n",
            "\n\\*+\n",
            # Split along directive markers
            "\n\n.. *\n\n",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.RUBY:
        return [
            # Split along method definitions
            "\ndef ",
            "\nclass ",
            # Split along control flow statements
            "\nif ",
            "\nunless ",
            "\nwhile ",
            "\nfor ",
            "\ndo ",
            "\nbegin ",
            "\nrescue ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.RUST:
        return [
            # Split along function definitions
            "\nfn ",
            "\nconst ",
            "\nlet ",
            # Split along control flow statements
            "\nif ",
            "\nwhile ",
            "\nfor ",
            "\nloop ",
            "\nmatch ",
            "\nconst ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.SCALA:
        return [
            # Split along class definitions
            "\nclass ",
            "\nobject ",
            # Split along method definitions
            "\ndef ",
            "\nval ",
            "\nvar ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nmatch ",
            "\ncase ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.SWIFT:
        return [
            # Split along function definitions
            "\nfunc ",
            # Split along class definitions
            "\nclass ",
            "\nstruct ",
            "\nenum ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\ndo ",
            "\nswitch ",
            "\ncase ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.MARKDOWN:
        return [
            # First, try to split along Markdown headings (starting with level 2)
            "\n#{1,6} ",
            # End of code block
            "```\n",
            # Horizontal lines
            "\n\\*\\*\\*+\n",
            "\n---+\n",
            "\n___+\n",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.LATEX:
        return [
            # First, try to split along Latex sections
            "\n\\\\chapter{",
            "\n\\\\section{",
            "\n\\\\subsection{",
            "\n\\\\subsubsection{",
            # Now split by environments
            "\n\\\\begin{enumerate}",
            "\n\\\\begin{itemize}",
            "\n\\\\begin{description}",
            "\n\\\\begin{list}",
            "\n\\\\begin{quote}",
            "\n\\\\begin{quotation}",
            "\n\\\\begin{verse}",
            "\n\\\\begin{verbatim}",
            # Now split by math environments
            "\n\\\\begin{align}",
            "$$",
            "$",
            # Now split by the normal type of lines
            " ",
            "",
        ]
    elif language == Language.HTML:
        return [
            # First, try to split along HTML tags
            "<body",
            "<div",
            "<p",
            "<br",
            "<li",
            "<h1",
            "<h2",
            "<h3",
            "<h4",
            "<h5",
            "<h6",
            "<span",
            "<table",
            "<tr",
            "<td",
            "<th",
            "<ul",
            "<ol",
            "<header",
            "<footer",
            "<nav",
            # Head
            "<head",
            "<style",
            "<script",
            "<meta",
            "<title",
            "",
        ]
    elif language == Language.SOL:
        return [
            # Split along compiler information definitions
            "\npragma ",
            "\nusing ",
            # Split along contract definitions
            "\ncontract ",
            "\ninterface ",
            "\nlibrary ",
            # Split along method definitions
            "\nconstructor ",
            "\ntype ",
            "\nfunction ",
            "\nevent ",
            "\nmodifier ",
            "\nerror ",
            "\nstruct ",
            "\nenum ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\ndo while ",
            "\nassembly ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.CSHARP:
        return [
            "\ninterface ",
            "\nenum ",
            "\nimplements ",
            "\ndelegate ",
            "\nevent ",
            # Split along class definitions
            "\nclass ",
            "\nabstract ",
            # Split along method definitions
            "\npublic ",
            "\nprotected ",
            "\nprivate ",
            "\nstatic ",
            "\nreturn ",
            # Split along control flow statements
            "\nif ",
            "\ncontinue ",
            "\nfor ",
            "\nforeach ",
            "\nwhile ",
            "\nswitch ",
            "\nbreak ",
            "\ncase ",
            "\nelse ",
            # Split by exceptions
            "\ntry ",
            "\nthrow ",
            "\nfinally ",
            "\ncatch ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.COBOL:
        return [
            # Split along divisions
            "\nIDENTIFICATION DIVISION.",
            "\nENVIRONMENT DIVISION.",
            "\nDATA DIVISION.",
            "\nPROCEDURE DIVISION.",
            # Split along sections
            "\nWORKING-STORAGE SECTION.",
            "\nLINKAGE SECTION.",
            "\nFILE SECTION.",
            "\nINPUT-OUTPUT SECTION.",
            # Split along paragraphs and common statements
            "\nOPEN ",
            "\nCLOSE ",
            "\nREAD ",
            "\nWRITE ",
            "\nIF ",
            "\nELSE ",
            "\nMOVE ",
            "\nPERFORM ",
            "\nUNTIL ",
            "\nVARYING ",
            "\nACCEPT ",
            "\nDISPLAY ",
            "\nSTOP RUN.",
            # Split by the normal type of lines
            "\n",
            " ",
            "",
        ]
    elif language == Language.LUA:
        return [
            # Split along variable and table definitions
            "\nlocal ",
            # Split along function definitions
            "\nfunction ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nrepeat ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.PERL:
        return [
            # Split along subroutine definitions
            "\nsub ",
            # Split along package definitions
            "\npackage ",
            # Split along control flow statements
            "\nif ",
            "\nfor ",
            "\nwhile ",
            "\nforeach ",
            "\nunless ",
            "\nuntil ",
            # Split along block declarations
            "\nBEGIN ",
            "\nEND ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.HASKELL:
        return [
            # Split along function definitions
            "\nmain :: ",
            "\nmain = ",
            "\nlet ",
            "\nin ",
            "\ndo ",
            "\nwhere ",
            "\n:: ",
            "\n= ",
            # Split along type declarations
            "\ndata ",
            "\nnewtype ",
            "\ntype ",
            # Split along module declarations
            "\nmodule ",
            # Split along import statements
            "\nimport ",
            "\nqualified ",
            # Split along typeclass declarations
            "\nclass ",
            "\ninstance ",
            # Split along case expressions
            "\ncase ",
            # Split along guards
            "\n| ",
            # Split along record fields
            "\n= {",
            "\n, ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.ELIXIR:
        return [
            # Split along method function and module definition
            "\ndef ",
            "\ndefp ",
            "\ndefmodule ",
            "\ndefprotocol ",
            "\ndefmacro ",
            "\ndefmacrop ",
            # Split along control flow statements
            "\nif ",
            "\nunless ",
            "\nwhile ",
            "\ncase ",
            "\ncond ",
            "\nwith ",
            "\nfor ",
            "\ndo ",
            # Split by the normal type of lines
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.POWERSHELL:
        return [
            # Split along function definitions
            "\nfunction ",
            # Split along parameter declarations
            "\nparam ",
            # Split along control flow statements
            "\nif ",
            "\nforeach ",
            "\nfor ",
            "\nwhile ",
            "\nswitch ",
            # Split along class definitions
            "\nclass ",
            # Split along try-catch-finally blocks
            "\ntry ",
            "\ncatch ",
            "\nfinally ",
            # Split by normal lines and empty spaces
            "\n\n",
            "\n",
            " ",
            "",
        ]
    elif language == Language.TEXT:
        return [
            # Paragraphs
            "\n\n",
            "\n",
            # Sentences
            ".",
            ";",
            ",",
            # Words
            " ",
            "",
        ]
    elif language in Language._value2member_map_:
        raise ValueError(f"Language {language} is not implemented yet!")
    else:
        raise ValueError(
            f"Language {language} is not supported! "
            f"Please choose from {list(Language)}"
        )