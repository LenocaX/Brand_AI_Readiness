const fs = require('fs');
const path = require('path');

// Read sample report
const sampleReportPath = fs.existsSync(path.join(__dirname, '..', 'reports', 'sample_report.json'))
  ? path.join(__dirname, '..', 'reports', 'sample_report.json')
  : path.join(__dirname, '..', 'reports', 'audit_report.json');
const report = JSON.parse(fs.readFileSync(sampleReportPath, 'utf8'));

console.log('Testing Findings Explorer & Details Logic:');
const findings = report.findings;
console.log(`Total Findings Loaded: ${findings.length}`);

// 1. Test search across title, ID, evidence, impact, URL
function testFilter(list, { severity = 'all', skill = 'all', page = 'all', query = '' }) {
  const q = query.trim().toLowerCase();
  return list.filter((f) => {
    const matchSeverity = severity === 'all' || f.severity === severity;
    const matchSkill = skill === 'all' || f.category === skill;
    const matchPage = page === 'all' || f.source_url === page;
    const matchSearch =
      !q ||
      f.title?.toLowerCase().includes(q) ||
      f.id?.toLowerCase().includes(q) ||
      f.impact?.toLowerCase().includes(q) ||
      f.evidence?.toLowerCase().includes(q) ||
      f.source_url?.toLowerCase().includes(q) ||
      f.suggested_action?.summary?.toLowerCase().includes(q) ||
      f.category?.toLowerCase().includes(q);
    return matchSeverity && matchSkill && matchPage && matchSearch;
  });
}

// Test ID search
const byId = testFilter(findings, { query: 'CE-002' });
console.log(`Search by ID "CE-002": found ${byId.length} (expected > 0)`);
if (byId.length === 0) throw new Error('Search by ID failed');

// Test title search
const byTitle = testFilter(findings, { query: 'heading' });
console.log(`Search by Title "heading": found ${byTitle.length}`);
if (byTitle.length === 0) throw new Error('Search by Title failed');

// Test evidence search
const byEvidence = testFilter(findings, { query: 'DOM tree' });
console.log(`Search by Evidence "DOM tree": found ${byEvidence.length}`);
if (byEvidence.length === 0) throw new Error('Search by Evidence failed');

// Test combined filter: severity + query
const combined = testFilter(findings, { severity: 'medium', query: 'heading' });
console.log(`Combined (medium + "heading"): found ${combined.length}`);

// Test empty state
const emptyResult = testFilter(findings, { query: 'nonexistent-query-string-xyz' });
console.log(`Empty state query found: ${emptyResult.length} (expected 0)`);
if (emptyResult.length !== 0) throw new Error('Empty state test failed');

// Test Finding Details integrity
findings.forEach((f, idx) => {
  if (!f.id || !f.title || !f.severity || !f.category) {
    throw new Error(`Finding at index ${idx} is missing core fields`);
  }
});
console.log('All findings have valid core fields (id, title, severity, category).');
console.log('Findings explorer & details tests passed successfully!');
