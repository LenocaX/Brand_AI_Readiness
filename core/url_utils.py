from urllib.parse import urlparse


def validate_url(url):
    """
    Validate and normalize a website URL.
    """

    if not isinstance(url, str):
        return None

    url = url.strip()

    if not url:
        return None

    if not url.startswith(
        ("http://", "https://")
    ):
        url = "https://" + url

    parsed = urlparse(url)

    if parsed.scheme not in (
        "http",
        "https",
    ):
        return None

    if not parsed.netloc:
        return None

    return url


def get_domain(url):
    """
    Return the hostname from a valid URL.
    """

    parsed = urlparse(url)

    return parsed.netloc.lower()