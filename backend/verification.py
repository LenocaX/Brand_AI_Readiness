import requests
import socket
from urllib.parse import urlparse
from core.url_utils import is_safe_public_url


def verify_domain_via_http(canonical_url: str, token: str) -> bool:
    """
    Checks for the verification token at /.well-known/canopy-verification.txt.
    Enforces SSRF checks on the resolved target host.
    """
    parsed = urlparse(canonical_url)
    domain = parsed.netloc.split(":")[0].lower()
    
    # Pre-flight SSRF check
    if not is_safe_public_url(canonical_url):
        return False
        
    well_known_url = f"{parsed.scheme}://{parsed.netloc}/.well-known/canopy-verification.txt"
    try:
        resp = requests.get(
            well_known_url,
            headers={"User-Agent": "CanopyVerificationBot/1.0"},
            timeout=5,
            allow_redirects=False,
        )
        if resp.status_code == 200:
            content = resp.text.strip()
            if token in content:
                return True
    except Exception:
        pass
    return False


def verify_domain_via_dns(domain: str, token: str) -> bool:
    """
    Inspects DNS TXT records for canopy-verification=<token>.
    """
    clean_domain = domain.split(":")[0].lower()
    try:
        # Check standard DNS TXT records if dnspython is available, or socket lookup
        import dns.resolver
        answers = dns.resolver.resolve(clean_domain, "TXT")
        for rdata in answers:
            for txt_string in rdata.strings:
                txt_decoded = txt_string.decode("utf-8", errors="ignore")
                if f"canopy-verification={token}" in txt_decoded or token in txt_decoded:
                    return True
    except Exception:
        # If dnspython is not installed or resolution fails, try HTTP fallback or socket
        pass
    return False


def verify_domain_ownership(canonical_url: str, token: str) -> tuple[bool, str]:
    """
    Attempts HTTP file verification first, then DNS TXT verification.
    Returns (success: bool, method: str).
    """
    parsed = urlparse(canonical_url)
    domain = parsed.netloc.lower()

    if verify_domain_via_http(canonical_url, token):
        return True, "HTTP /.well-known/canopy-verification.txt"
        
    if verify_domain_via_dns(domain, token):
        return True, "DNS TXT record"

    return False, "Failed verification"
