coding_tasks = [
    {
        "prompt": "Write a Python function add_two_numbers that takes two integers as input and returns their sum.",
    },
    {
        "prompt": "Write a shell script list_files.sh that lists all files in the current directory and its subdirectories.",
    },
    {
        "prompt": "Write a Python class Person with attributes name (string) and age (integer). The class should have a method greet that returns a greeting message in the format ´Hello, my name is {name} and I am {age} years old.´",
    },
    {
        "prompt": "Write a Python function process_data that takes a list of integers and returns a dictionary with the minimum, maximum, and average values of the list.",
    },
    {
        "prompt": "Write a shell script check_disk_usage.sh that checks the disk usage of the / directory and prints a warning message if the usage is above 80%.",
    },
    {
        "prompt": "Implement a Python script that takes a directory path as input, recursively scans all files in the directory, and generates a report of the top 10 most frequent words across all text files, along with their count.",
    },
    {
        "prompt": "Create a shell script that automatically backs up a specified directory to a remote server using rsync, and then sends an email notification with the backup status.",
    },
    {
        "prompt": "Write a Python program that monitors a specific URL and sends an SMS alert using the Twilio API if the website goes down or becomes unresponsive.",
    },
    {
        "prompt": "Develop a Python script that reads a CSV file containing user data, performs data validation, and inserts the valid data into a PostgreSQL database using the psycopg2 library.",
    },
    {
        "prompt": "Create a shell script that automatically generates a daily system health report, including CPU usage, memory usage, disk space, and network statistics, and saves the report in a timestamped file.",
    },
    {
        "prompt": "Implement a Python program that scrapes a news website, extracts article titles and summaries, and stores them in a MongoDB database using the pymongo library.",
    },
    {
        "prompt": "Write a shell script that monitors a log file in real-time, filters error messages based on a specified pattern, and triggers an alert if the number of error messages exceeds a certain threshold within a given time window.",
    },
    {
        "prompt": "Create a Python script that integrates with the OpenWeatherMap API to fetch weather data for a given city, parse the JSON response, and display a formatted weather report in the console.",
    },
    {
        "prompt": "Develop a shell script that automatically detects and removes duplicate files within a directory and its subdirectories based on their content hash.",
    },
    {
        "prompt": "Implement a Python program that reads an Apache web server log file, analyzes the log entries to identify the top 5 most requested URLs, and generates a bar chart visualization using the matplotlib library.",
    },
    {
        "prompt": "Write a Python script that interacts with the GitHub API to retrieve the list of repositories for a given user, sorts them by the number of stars, and prints the repository names and their star counts.",
    },
    {
        "prompt": "Create a shell script that automatically sets up a new user account on a Linux system, including creating the home directory, setting permissions, and configuring SSH key-based authentication.",
    },
    {
        "prompt": "Develop a Python program that implements a simple file encryption and decryption utility using the cryptography library, allowing users to securely encrypt and decrypt files with a password.",
    },
    {
        "prompt": "Write a shell script that monitors the system's network traffic using the 'iftop' command, captures the traffic data in real-time, and saves it to a log file for later analysis.",
    },
    {
        "prompt": "Implement a Python script that reads a directory containing text files, performs sentiment analysis on each file using the NLTK library, and generates a summary report with the overall sentiment scores.",
    },
    {
        "prompt": "Create a shell script that automatically configures a new Apache web server instance, including installing necessary packages, setting up virtual hosts, and enabling SSL/TLS encryption.",
    },
    {
        "prompt": "Develop a Python program that implements a simple task management system, allowing users to add, remove, and mark tasks as complete, and persist the task data in a SQLite database.",
    },
    {
        "prompt": "Write a shell script that automatically scans a given IP range for open ports using the 'nmap' command, and saves the scan results in a formatted report.",
    },
    {
        "prompt": "Implement a Python script that integrates with the Slack API to send automated notifications or updates to a specific channel based on predefined triggers or events.",
    },
    {
        "prompt": "Create a shell script that automatically sets up a secure SFTP server, configures user accounts with restricted permissions, and generates an audit log of all SFTP activities.",
    }
]

if __name__ == "__main__":
    from workflow_logic.api.libraries import Libraries
    from workflow_logic.util.utils import sanitize_and_limit_prompt, save_results_to_file
    libraries = Libraries()
    code_task = libraries.task_library.get_task("coding_workflow")
    for i, task in enumerate(coding_tasks):
        print(f"Task {i+1}: {task['prompt']}")
        prompt = task['prompt']
        result = code_task.execute(prompt=prompt, step_through=False)

        if result:
            sanitized_prompt = sanitize_and_limit_prompt(task["prompt"])
            file_name = f"coding_task_results[{sanitized_prompt}].json"
            print(f'Saving results to file: {file_name}: Task: {task}]')
            save_results_to_file(result.model_dump(), file_name)