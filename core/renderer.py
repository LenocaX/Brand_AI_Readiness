from playwright.sync_api import (
    sync_playwright
)


def render_page(url: str):

    """
    Render a webpage using Chromium
    and return the rendered HTML and text.
    """

    try:

        with sync_playwright() as p:

            browser = p.chromium.launch(
                headless=True
            )

            page = browser.new_page()

            page.goto(
                url,
                wait_until="networkidle",
                timeout=30000
            )

            html = page.content()

            text = page.locator(
                "body"
            ).inner_text()

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