from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser


USER_AGENT = "BrandAIReadinessAudit/1.0"


def get_robots_url(base_url: str) -> str:
    """
    Generate the robots.txt URL for a website.
    """

    parsed = urlparse(base_url)

    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def load_robots(base_url: str) -> RobotFileParser:
    """
    Load and parse robots.txt.
    """

    robots_url = get_robots_url(base_url)

    parser = RobotFileParser()

    parser.set_url(robots_url)

    try:
        parser.read()

    except Exception:
        pass

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