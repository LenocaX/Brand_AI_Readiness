from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
import requests
from typing import Dict, Any, List

USER_AGENT = "BrandAIReadinessAudit/1.0"
_ROBOTS_CACHE = {}
_ROBOTS_TEXT_CACHE = {}

AI_CRAWLER_BOTS = [
    {"name": "GPTBot", "owner": "OpenAI", "purpose": "Model Training & Data Aggregation"},
    {"name": "OAI-SearchBot", "owner": "OpenAI", "purpose": "Real-time Search & Citations"},
    {"name": "ClaudeBot", "owner": "Anthropic", "purpose": "Claude Knowledge Base & Citations"},
    {"name": "PerplexityBot", "owner": "Perplexity AI", "purpose": "Real-time AI Search Engine"},
    {"name": "Google-Extended", "owner": "Google", "purpose": "Gemini & Vertex AI Training"},
    {"name": "Bytespider", "owner": "ByteDance", "purpose": "ByteDance AI & LLM Training"},
]


def get_robots_url(base_url: str) -> str:
    """
    Generate the robots.txt URL for a website.
    """
    parsed = urlparse(base_url)
    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def fetch_robots_text(base_url: str) -> tuple[str, bool]:
    robots_url = get_robots_url(base_url)
    if robots_url in _ROBOTS_TEXT_CACHE:
        return _ROBOTS_TEXT_CACHE[robots_url]

    try:
        resp = requests.get(
            robots_url,
            headers={"User-Agent": USER_AGENT},
            timeout=4
        )
        if resp.status_code == 200:
            text = resp.text
            _ROBOTS_TEXT_CACHE[robots_url] = (text, True)
            return text, True
    except Exception:
        pass

    _ROBOTS_TEXT_CACHE[robots_url] = ("", False)
    return "", False


def load_robots(base_url: str) -> RobotFileParser:
    """
    Load and parse robots.txt with in-memory caching and request timeout.
    """
    robots_url = get_robots_url(base_url)
    if robots_url in _ROBOTS_CACHE:
        return _ROBOTS_CACHE[robots_url]

    parser = RobotFileParser()
    parser.set_url(robots_url)

    text, found = fetch_robots_text(base_url)
    if found and text:
        parser.parse(text.splitlines())
    else:
        parser.parse([])

    _ROBOTS_CACHE[robots_url] = parser
    return parser


def is_allowed(
    base_url: str,
    target_url: str
) -> bool:
    """
    Check whether our crawler is allowed to access the target URL.
    """
    parser = load_robots(base_url)
    try:
        return parser.can_fetch(
            USER_AGENT,
            target_url
        )
    except Exception:
        return False


def inspect_ai_crawlers(base_url: str) -> Dict[str, Any]:
    """
    Evaluates robots.txt access rules specifically for major AI crawlers:
    GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Bytespider.
    Returns status: 'allowed', 'disallowed', or 'unspecified', with exact evidence lines.
    """
    robots_text, has_robots = fetch_robots_text(base_url)
    parser = load_robots(base_url)
    target_root = base_url.rstrip("/") + "/"

    crawlers_status: List[Dict[str, Any]] = []
    lines = [line.strip() for line in robots_text.splitlines() if line.strip() and not line.strip().startswith("#")]

    for bot in AI_CRAWLER_BOTS:
        bot_name = bot["name"]
        
        # Check if bot has specific mentions in robots.txt lines
        bot_mentioned = any(bot_name.lower() in line.lower() for line in lines)
        
        can_fetch = parser.can_fetch(bot_name, target_root)
        
        if bot_mentioned:
            if can_fetch:
                status = "allowed"
                evidence = f"User-agent: {bot_name} explicitly listed with Allow rules"
            else:
                status = "disallowed"
                evidence = f"User-agent: {bot_name} explicitly Disallowed in robots.txt"
        else:
            # Check wildcard '*' policy
            wildcard_allowed = parser.can_fetch("*", target_root)
            if not wildcard_allowed:
                status = "disallowed"
                evidence = "Inherited Disallow from default wildcard ('User-agent: *')"
            elif has_robots:
                status = "unspecified"
                evidence = f"No specific directive for {bot_name}; defaults to allowed via wildcard policy"
            else:
                status = "unspecified"
                evidence = "No robots.txt found; all AI crawlers implicitly permitted"

        crawlers_status.append({
            "name": bot_name,
            "owner": bot["owner"],
            "purpose": bot["purpose"],
            "status": status,  # allowed, disallowed, unspecified
            "evidence": evidence,
        })

    disallowed_count = sum(1 for c in crawlers_status if c["status"] == "disallowed")
    return {
        "has_robots_txt": has_robots,
        "robots_url": get_robots_url(base_url),
        "total_crawlers_evaluated": len(crawlers_status),
        "disallowed_count": disallowed_count,
        "crawlers": crawlers_status,
        "raw_robots_preview": "\n".join(lines[:20]) if lines else "No active rules found",
    }

