import json
import requests

from collections import deque

from urllib.parse import (
    urljoin,
    urlparse
)

from bs4 import BeautifulSoup

from core.models import PageData
from core.robots import is_allowed


HEADERS = {
    "User-Agent": "BrandAIReadinessAudit/1.0"
}


def clean_text(text: str) -> str:
    """
    Remove unnecessary whitespace.
    """

    return " ".join(
        text.split()
    )


def normalize_url(url: str) -> str:
    """
    Normalize URLs so that the same page
    is not crawled multiple times.
    """

    parsed = urlparse(url)

    scheme = parsed.scheme.lower()

    netloc = parsed.netloc.lower()

    path = parsed.path or "/"

    return (
        f"{scheme}://"
        f"{netloc}"
        f"{path}"
    )


def same_domain(
    base_url: str,
    target_url: str
) -> bool:

    base_domain = urlparse(
        base_url
    ).netloc

    target_domain = urlparse(
        target_url
    ).netloc

    return (
        base_domain == target_domain
    )


def extract_json_ld(soup):

    results = []

    scripts = soup.find_all(
        "script",
        attrs={
            "type": "application/ld+json"
        }
    )

    for script in scripts:

        if not script.string:

            results.append(
                {
                    "_parse_error":
                        "Empty JSON-LD block"
                }
            )

            continue

        try:

            data = json.loads(
                script.string
            )

            if isinstance(
                data,
                list
            ):

                results.extend(
                    data
                )

            else:

                results.append(
                    data
                )

        except json.JSONDecodeError as e:

            results.append(
                {
                    "_parse_error":
                        str(e)
                }
            )

    return results


def extract_page(
    url: str,
    html: str,
    status_code: int
) -> PageData:

    soup = BeautifulSoup(
        html,
        "lxml"
    )

    # -------------------------
    # TITLE
    # -------------------------

    title = ""

    if soup.title:

        title = clean_text(
            soup.title.get_text()
        )

    # -------------------------
    # META DESCRIPTION
    # -------------------------

    description = ""

    description_tag = soup.find(
        "meta",
        attrs={
            "name": "description"
        }
    )

    if description_tag:

        description = (
            description_tag
            .get("content", "")
            .strip()
        )

    # -------------------------
    # HEADINGS
    # -------------------------

    headings = []

    for heading in soup.find_all(
        [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6"
        ]
    ):

        text = clean_text(
            heading.get_text()
        )

        if text:

            headings.append(
                {
                    "level": heading.name,
                    "text": text
                }
            )

    # -------------------------
    # LINKS
    # -------------------------

    links = []

    for anchor in soup.find_all(
        "a",
        href=True
    ):

        href = anchor[
            "href"
        ].strip()

        absolute_url = urljoin(
            url,
            href
        )

        links.append(
            absolute_url
        )

    # -------------------------
    # IMAGES
    # -------------------------

    images = []

    for image in soup.find_all(
        "img"
    ):

        images.append(
            {
                "src": image.get(
                    "src",
                    ""
                ),

                "alt": image.get(
                    "alt",
                    ""
                )
            }
        )

    # -------------------------
    # JAVASCRIPT FILES
    # -------------------------

    scripts = []

    for script in soup.find_all(
        "script",
        src=True
    ):

        scripts.append(
            script.get("src")
        )

    # -------------------------
    # CANONICAL
    # -------------------------

    canonical = None

    canonical_tag = soup.find(
        "link",
        attrs={
            "rel": "canonical"
        }
    )

    if canonical_tag:

        canonical = (
            canonical_tag
            .get("href")
        )

        if canonical:

            canonical = urljoin(
                url,
                canonical
            )

    # -------------------------
    # JSON-LD
    # -------------------------

    json_ld = extract_json_ld(
        soup
    )

    # -------------------------
    # RAW TEXT
    # -------------------------

    text_soup = BeautifulSoup(
        html,
        "lxml"
    )

    for element in text_soup(
        [
            "script",
            "style",
            "noscript"
        ]
    ):

        element.decompose()

    text = clean_text(
        text_soup.get_text(
            " ",
            strip=True
        )
    )

    # -------------------------
    # CREATE PAGE OBJECT
    # -------------------------

    return PageData(

        url=url,

        status_code=status_code,

        title=title,

        description=description,

        headings=headings,

        text=text,

        links=links,

        images=images,

        scripts=scripts,

        json_ld=json_ld,

        canonical=canonical,

        raw_html=html,

        raw_text=text
    )


def fetch_page(url: str):

    """
    Download a webpage.
    """

    try:

        response = requests.get(

            url,

            headers=HEADERS,

            timeout=15,

            allow_redirects=True
        )

        content_type = (
            response
            .headers
            .get(
                "Content-Type",
                ""
            )
        )

        if (
            "text/html"
            not in content_type.lower()
        ):

            return (
                None,
                response.status_code
            )

        return (
            response.text,
            response.status_code
        )

    except requests.RequestException:

        return (
            None,
            0
        )


def crawl_site(
    start_url: str,
    max_pages: int = 30,
    max_depth: int = 2
):

    """
    Crawl a website using breadth-first search.
    """

    start_url = normalize_url(
        start_url
    )

    queue = deque()

    queue.append(
        (
            start_url,
            0
        )
    )

    visited = set()

    pages = []

    errors = []

    while (
        queue
        and len(pages) < max_pages
    ):

        current_url, depth = (
            queue.popleft()
        )

        current_url = normalize_url(
            current_url
        )

        # Already visited
        if current_url in visited:
            continue

        visited.add(
            current_url
        )

        # Depth restriction
        if depth > max_depth:
            continue

        # Robots.txt
        if not is_allowed(
            start_url,
            current_url
        ):

            errors.append(
                "Blocked by robots.txt: "
                + current_url
            )

            continue

        # Fetch
        html, status_code = (
            fetch_page(
                current_url
            )
        )

        if html is None:

            errors.append(
                "Could not fetch: "
                + current_url
                + f" (status={status_code})"
            )

            continue

        # Parse
        page = extract_page(

            current_url,

            html,

            status_code
        )

        pages.append(
            page
        )

        # Discover internal links
        for link in page.links:

            if not same_domain(
                start_url,
                link
            ):

                continue

            link = normalize_url(
                link
            )

            if link not in visited:

                queue.append(
                    (
                        link,
                        depth + 1
                    )
                )

    return (
        pages,
        errors
    )