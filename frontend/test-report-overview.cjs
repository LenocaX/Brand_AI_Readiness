// Test report overview data handling and edge cases
const fs = require('fs');
const path = require('path');

// 1. Read real sample report
const sampleReportPath = fs.existsSync(path.join(__dirname, '..', 'reports', 'sample_report.json'))
  ? path.join(__dirname, '..', 'reports', 'sample_report.json')
  : path.join(__dirname, '..', 'reports', 'audit_report.json');
const sampleReport = JSON.parse(fs.readFileSync(sampleReportPath, 'utf8'));

console.log('Testing Sample Report:');
console.log('- Site:', sampleReport.site);
console.log('- Readiness Score:', sampleReport.readiness?.score);
console.log('- Engagement Score:', sampleReport.engagement?.score);
console.log('- Total findings:', sampleReport.findings?.length);
console.log('- Dimensions:', Object.keys(sampleReport.engagement?.dimensions || {}));
console.log('- Recommendations:', sampleReport.recommendations?.length);

// 2. Test empty report edge case
const emptyReport = {
  site: "clean-website.example.com",
  audited_at: new Date().toISOString(),
  readiness: { score: 100, label: "Ready" },
  engagement: { score: 100, label: "Optimal", dimensions: {} },
  summary: { pages_checked: 1, crawl_errors: 0, total_findings: 0 },
  severity_summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  findings: [],
  recommendations: [],
  specialist_status: {
    crawl: "completed",
    structured_data: "completed",
    content_extractability: "completed",
    freshness: "completed",
    engagement: "completed"
  }
};

// 3. Test incomplete / minimal report edge case (missing fields)
const incompleteReport = {
  site: "minimal.example.com",
  audited_at: "invalid-date",
  readiness: null,
  engagement: null,
  summary: null,
  severity_summary: null,
  findings: null,
  recommendations: null,
  specialist_status: null
};

// Function mirroring ReportOverviewView safe extractions
function testExtract(report) {
  const site = report?.site || 'Unknown Target';
  const auditedAt = report?.audited_at ? new Date(report.audited_at) : null;
  const formattedDate = auditedAt && !isNaN(auditedAt.getTime())
    ? auditedAt.toLocaleDateString('en-US')
    : 'Unknown Date';

  const readinessScore = typeof report?.readiness?.score === 'number' ? report.readiness.score : 0;
  const readinessLabel = report?.readiness?.label || 'Unknown';

  const engagementScore = typeof report?.engagement?.score === 'number' ? report.engagement.score : 0;
  const engagementLabel = report?.engagement?.label || 'Unknown';

  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const totalFindings = report?.summary?.total_findings ?? findings.length;
  const pagesChecked = report?.summary?.pages_checked ?? 0;
  const crawlErrors = report?.summary?.crawl_errors ?? 0;

  const severityCounts = {
    critical: report?.severity_summary?.critical ?? findings.filter((f) => f.severity === 'critical').length,
    high: report?.severity_summary?.high ?? findings.filter((f) => f.severity === 'high').length,
    medium: report?.severity_summary?.medium ?? findings.filter((f) => f.severity === 'medium').length,
    low: report?.severity_summary?.low ?? findings.filter((f) => f.severity === 'low').length,
    info: report?.severity_summary?.info ?? findings.filter((f) => f.severity === 'info').length,
  };

  const dimensions = report?.engagement?.dimensions || null;
  const dimensionKeys = dimensions ? Object.keys(dimensions) : [];

  const specialistStatus = report?.specialist_status || {};
  const specialistItems = [
    { key: 'crawl', label: 'Crawl & Render', status: specialistStatus['crawl'] || specialistStatus['crawl_render'] || 'unknown' },
    { key: 'structured_data', label: 'Structured Data', status: specialistStatus['structured_data'] || 'unknown' },
    { key: 'content_extractability', label: 'Content Extractability', status: specialistStatus['content_extractability'] || 'unknown' },
    { key: 'freshness', label: 'Freshness & Proof', status: specialistStatus['freshness'] || 'unknown' },
    { key: 'engagement', label: 'Engagement', status: specialistStatus['engagement'] || 'unknown' },
  ];

  const recommendations = Array.isArray(report?.recommendations) ? report.recommendations : [];

  const distributionTotal = Math.max(1, totalFindings);
  const criticalPct = (severityCounts.critical / distributionTotal) * 100;
  const highPct = (severityCounts.high / distributionTotal) * 100;
  const mediumPct = (severityCounts.medium / distributionTotal) * 100;
  const lowPct = (severityCounts.low / distributionTotal) * 100;

  return {
    site,
    formattedDate,
    readinessScore,
    readinessLabel,
    engagementScore,
    engagementLabel,
    totalFindings,
    pagesChecked,
    crawlErrors,
    severityCounts,
    dimensionKeys,
    specialistCount: specialistItems.length,
    recommendationsCount: recommendations.length,
    percentages: { criticalPct, highPct, mediumPct, lowPct }
  };
}

console.log('\nTesting Complete Report Extraction:');
const sampleRes = testExtract(sampleReport);
console.log('Sample Extraction:', JSON.stringify(sampleRes, null, 2));

console.log('\nTesting Empty Report Extraction:');
const emptyRes = testExtract(emptyReport);
console.log('Empty Extraction:', JSON.stringify(emptyRes, null, 2));

console.log('\nTesting Incomplete Report Extraction:');
const incompleteRes = testExtract(incompleteReport);
console.log('Incomplete Extraction:', JSON.stringify(incompleteRes, null, 2));

// Assertions
if (isNaN(emptyRes.readinessScore) || isNaN(emptyRes.percentages.criticalPct)) {
  console.error('FAIL: NaN detected in empty report');
  process.exit(1);
}
if (isNaN(incompleteRes.readinessScore) || isNaN(incompleteRes.percentages.criticalPct)) {
  console.error('FAIL: NaN detected in incomplete report');
  process.exit(1);
}
if (incompleteRes.formattedDate !== 'Unknown Date') {
  console.error('FAIL: Expected Unknown Date for invalid date');
  process.exit(1);
}
console.log('\nAll report extraction tests passed successfully!');
