from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
import requests

USER_AGENT = "BrandAIReadinessAudit/1.0"
_ROBOTS_CACHE = {}


def get_robots_url(base_url: str) -> str:
    """
    Generate the robots.txt URL for a website.
    """
    parsed = urlparse(base_url)
    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def load_robots(base_url: str) -> RobotFileParser:
    """
    Load and parse robots.txt with in-memory caching and request timeout.
    """
    robots_url = get_robots_url(base_url)
    if robots_url in _ROBOTS_CACHE:
        return _ROBOTS_CACHE[robots_url]

    parser = RobotFileParser()
    parser.set_url(robots_url)

    try:
        resp = requests.get(
            robots_url,
            headers={"User-Agent": USER_AGENT},
            timeout=4
        )
        if resp.status_code == 200:
            parser.parse(resp.text.splitlines())
        else:
            parser.parse([])
    except Exception:
        parser.parse([])

    _ROBOTS_CACHE[robots_url] = parser
    return parser


def is_allowed(
    base_url: str,
    target_url: str
) -> bool:
    """
    Check whether our crawler is allowed
    to access the target URL.
    """
    parser = load_robots(base_url)

    try:
        return parser.can_fetch(
            USER_AGENT,
            target_url
        )
    except Exception:
        return False
