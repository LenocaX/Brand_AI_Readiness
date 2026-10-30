from dataclasses import dataclass
from typing import Dict


@dataclass
class Finding:

    id: str

    category: str

    title: str

    severity: str

    confidence: float

    evidence: str

    impact: str

    suggested_action: Dict

    source_url: str = ""

    status: str = "open"
    evidence_type: str = "observed"

    def to_dict(self):

        return {
        
            "status": self.status,
            "evidence_type": self.evidence_type,

            "id": self.id,

            "category":
                self.category,

            "title":
                self.title,

            "severity":
                self.severity,

            "confidence":
                self.confidence,

            "evidence":
                self.evidence,

            "impact":
                self.impact,

            "suggested_action":
                self.suggested_action,

            "source_url":
                self.source_url

        }