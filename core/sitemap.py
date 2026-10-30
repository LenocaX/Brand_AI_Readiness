import requests
import xml.etree.ElementTree as ET

from urllib.parse import urljoin


HEADERS = {
    "User-Agent": "BrandAIReadinessAudit/1.0"
}


def get_sitemap_urls(base_url: str):
    """
    Attempt to read /sitemap.xml and return
    all URLs found in it.
    """

    sitemap_url = urljoin(
        base_url,
        "/sitemap.xml"
    )

    try:

        response = requests.get(
            sitemap_url,
            headers=HEADERS,
            timeout=10
        )

        if response.status_code != 200:
            return []

        root = ET.fromstring(
            response.content
        )

        namespace = {
            "sm":
            "http://www.sitemaps.org/schemas/sitemap/0.9"
        }

        urls = []

        for loc in root.findall(
            ".//sm:loc",
            namespace
        ):

            if loc.text:

                urls.append(
                    loc.text.strip()
                )

        return urls

    except Exception:

        return []