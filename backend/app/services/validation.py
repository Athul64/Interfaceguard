import os
import re
import requests

GITHUB_URL_PATTERN = re.compile(r"^https://github\.com/[\w.-]+/[\w.-]+/?$")


def validate_github_url(url: str, check_remote: bool = True) -> tuple[bool, str]:
    if not url or not GITHUB_URL_PATTERN.match(url.strip()):
        return False, "Enter a valid GitHub repository URL, e.g. https://github.com/owner/repo"

    if not check_remote:
        return True, ""

    api_url = url.rstrip("/").replace("https://github.com/", "https://api.github.com/repos/")
    headers = {"Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        response = requests.get(api_url, headers=headers, timeout=5)
    except requests.RequestException:
        return False, "Could not reach GitHub. Check your connection and try again."

    if response.status_code == 404:
        return False, "Repository not found. It may be private or misspelled."
    if response.status_code == 403 and "rate limit" in response.text.lower():
        return False, "GitHub API rate limit reached. Please try again in a few minutes."
    if response.status_code != 200:
        return False, f"GitHub returned an unexpected error (status {response.status_code})."

    if response.json().get("private"):
        return False, "This repository is private. InterfaceGuard only analyzes public repositories."

    return True, ""


def validate_config(config: dict) -> tuple[bool, str]:
    if not isinstance(config, dict):
        return False, "Configuration must be a JSON object."

    threshold = config.get("erosion_threshold", 70)
    if not isinstance(threshold, (int, float)) or not (0 <= threshold <= 100):
        return False, "erosion_threshold must be a number between 0 and 100."

    return True, ""