def deduplicate_findings(
    findings
):

    """
    Remove duplicate findings using
    category + title + source URL.
    """

    seen = set()

    unique = []

    for finding in findings:

        key = (

            finding.category,

            finding.title,

            finding.source_url

        )

        if key in seen:
            continue

        seen.add(key)

        unique.append(
            finding
        )

    return unique