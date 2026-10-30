from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class PageData:
    """
    Stores all information collected from one webpage.
    """

    url: str
    status_code: int

    title: str = ""
    description: str = ""

    headings: List[Dict] = field(
    default_factory=list
)

    text: str = ""

    links: List[str] = field(default_factory=list)

    images: List[Dict] = field(default_factory=list)

    scripts: List[str] = field(default_factory=list)

    json_ld: List[Dict] = field(default_factory=list)

    canonical: Optional[str] = None

    raw_html: str = ""

    rendered_html: str = ""

    raw_text: str = ""

    rendered_text: str = ""


@dataclass
class SiteData:
    """
    Stores information collected from the entire website.
    """

    url: str

    pages: List[PageData] = field(default_factory=list)

    robots_allowed: bool = True

    robots_url: str = ""

    sitemap_urls: List[str] = field(default_factory=list)

    crawl_errors: List[str] = field(default_factory=list)