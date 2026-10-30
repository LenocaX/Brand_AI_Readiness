from playwright.sync_api import sync_playwright

def render_page(url: str):
    """
    Render a webpage using Chromium/Chrome
    and return the rendered HTML and text.
    Uses domcontentloaded and a safe 8s timeout to avoid hanging on media/telemetry streams.
    """
    try:
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch(headless=True, channel="chrome")
            except Exception:
                browser = p.chromium.launch(headless=True)

            page = browser.new_page()
            try:
                page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=8000
                )
                page.wait_for_timeout(1000)
            except Exception:
                # If navigation timed out, proceed with whatever DOM content is loaded
                pass

            html = page.content()
            try:
                text = page.locator("body").inner_text(timeout=3000)
            except Exception:
                text = ""

            browser.close()

            return {
                "success": True,
                "html": html,
                "text": text
            }
    except Exception as e:
        return {
            "success": False,
            "html": "",
            "text": "",
            "error": str(e)
        }
