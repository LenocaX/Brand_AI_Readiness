from urllib.parse import urlparse
import ipaddress

BLOCKED_HOSTS = {
    "localhost", "127.0.0.1", "::1", "metadata.google.internal",
    "169.254.169.254", "instance-data", "metadata"
}

def validate_url(url):
    """
    Validate and normalize a website URL.
    """
    if not isinstance(url, str):
        return None

    url = url.strip()
    if not url:
        return None

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
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

def is_safe_public_url(url: str) -> bool:
    """
    Verify that a URL points to a public HTTP/HTTPS host,
    mitigating SSRF against loopback, private RFC1918 subnets, and cloud metadata.
    """
    try:
        if not isinstance(url, str):
            return False
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower()
        if not hostname or hostname in BLOCKED_HOSTS:
            return False
        if hostname.endswith(".local") or hostname.endswith(".internal"):
            return False
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            pass
        return True
    except Exception:
        return False
