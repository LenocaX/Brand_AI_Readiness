\# Testing Guide



\## 1. Overview



This guide explains how to perform basic manual verification of Brand AI Readiness Audit.



\## 2. Prerequisites



\- Python installed

\- pip package manager

\- Git



\## 3. Install Dependencies



Clone the repository:



```bash

git clone https://github.com/LenocaX/Brand\_AI\_Readiness.git

cd Brand\_AI\_Readiness

```



Install dependencies:



```bash

pip install -r requirements.txt

```



For browser automation, install Playwright browsers:



```bash

playwright install

```



\## 4. Running the Audit



Run the audit orchestrator:



```bash

python skills/audit\_orchestrator/scripts/audit.py https://example.com

```



Replace the example URL with your target website.



\## 5. Manual Verification Checklist



| Component | Verification |

|---|---|

| Website crawler | Check whether accessible pages are inspected |

| URL processing | Verify valid website URLs are handled |

| Robots.txt | Check website crawling restrictions |

| Sitemap | Verify sitemap processing |

| Content extraction | Check extracted website content |

| Scoring | Verify audit scoring output |

| Recommendations | Inspect generated recommendations |

| Report generation | Check the final audit report |



\## 6. Troubleshooting



\*\*Missing dependencies\*\*



```bash

pip install -r requirements.txt

```



\*\*Playwright browser errors\*\*



```bash

playwright install

```



\*\*Website access errors\*\*



Verify that the target website is accessible and that its URL is correctly formatted.



\## 7. Notes



This guide describes manual verification procedures. It does not claim the existence of an automated testing framework.

