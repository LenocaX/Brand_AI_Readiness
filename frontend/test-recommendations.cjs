const fs = require('fs');
const path = require('path');

// 1. Read authentic backend reports
const reportPath = fs.existsSync(path.join(__dirname, '..', 'reports', 'sample_report.json'))
  ? path.join(__dirname, '..', 'reports', 'sample_report.json')
  : path.join(__dirname, '..', 'reports', 'audit_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('Testing Recommendations Logic:');
const recs = report.recommendations || [];
const priorityActions = report.priority_actions || [];

console.log(`Total Recommendations: ${recs.length}`);
console.log(`Explicit Priority Actions: ${priorityActions.length}`);

// Test grouping function
function classifyRecommendations(recommendations, priorityActionList) {
  const priorityActionIds = new Set((priorityActionList || []).map((pa) => pa.finding_id));
  const immediate = [];
  const longerTerm = [];

  recommendations.forEach((rec) => {
    const p = String(rec.priority || '').toLowerCase();
    const isExplicit = priorityActionIds.has(rec.finding_id);
    if (isExplicit || p === 'critical' || p === 'high' || p === 'medium') {
      immediate.push(rec);
    } else {
      longerTerm.push(rec);
    }
  });

  return { immediate, longerTerm };
}

const { immediate, longerTerm } = classifyRecommendations(recs, priorityActions);
console.log(`Immediate Fixes (Critical/High/Medium or Priority Actions): ${immediate.length}`);
console.log(`Longer-Term Improvements (Low/Info): ${longerTerm.length}`);

if (immediate.length + longerTerm.length !== recs.length) {
  throw new Error('Classification count mismatch');
}

// 2. Test copy payload format
const sampleRec = recs[0];
const copyPayload = `Recommended Action: ${sampleRec.title}\nPriority: ${sampleRec.priority || 'N/A'}\nFinding ID: ${sampleRec.finding_id}\nRemediation Plan: ${sampleRec.action}${sampleRec.source_url ? `\nTarget URL: ${sampleRec.source_url}` : ''}`;
console.log('\nSample Copy Payload:');
console.log(copyPayload);

if (!copyPayload.includes(sampleRec.title) || !copyPayload.includes(sampleRec.finding_id)) {
  throw new Error('Copy payload format invalid');
}

// 3. Test empty report recommendations
const emptyClassification = classifyRecommendations([], []);
if (emptyClassification.immediate.length !== 0 || emptyClassification.longerTerm.length !== 0) {
  throw new Error('Empty recommendations classification failed');
}

// 4. Test missing optional fields
const partialRecs = [
  {
    finding_id: 'TEST-001',
    title: 'Test Title Without Priority or URL',
    action: 'Perform remediation step.'
  }
];
const partialClassification = classifyRecommendations(partialRecs, null);
console.log('\nPartial Rec Classification:', partialClassification.longerTerm.length);
if (partialClassification.longerTerm.length !== 1) {
  throw new Error('Partial recommendation fallback failed');
}

console.log('\nAll recommendations logic and edge-case tests passed!');
