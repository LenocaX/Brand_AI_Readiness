const assert = require('assert');

function validateUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return 'Please enter a website URL.';
  }

  let parsed;
  try {
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      if (!/^https?:\/\//i.test(trimmed)) {
        return 'URL must start with http:// or https://.';
      }
      parsed = new URL(trimmed);
    } else {
      parsed = new URL(`https://${trimmed}`);
    }
  } catch {
    return 'Please enter a valid website URL (e.g., https://example.com).';
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.endsWith('.local')
  ) {
    return 'Local and private network addresses cannot be audited by the public engine.';
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return 'Please include a valid domain name with an extension (e.g. .com, .org, .app).';
  }

  return null;
}

// 1. Valid URLs
console.log('Testing valid URLs...');
assert.strictEqual(validateUrl('https://example.com'), null);
assert.strictEqual(validateUrl('http://mysite.org/about'), null);
assert.strictEqual(validateUrl('jiitshelf.vercel.app'), null);
assert.strictEqual(validateUrl('https://sub.domain.co.uk/path?q=1'), null);

// 2. Invalid URLs
console.log('Testing invalid and empty URLs...');
assert.strictEqual(validateUrl(''), 'Please enter a website URL.');
assert.strictEqual(validateUrl('   '), 'Please enter a website URL.');
assert.strictEqual(validateUrl('plainstring'), 'Please include a valid domain name with an extension (e.g. .com, .org, .app).');
assert.strictEqual(validateUrl('ftp://invalid.com'), 'URL must start with http:// or https://.');
assert.strictEqual(validateUrl('javascript://alert(1)'), 'URL must start with http:// or https://.');

// 3. Local/SSRF addresses
console.log('Testing local/SSRF private IP protection...');
assert.strictEqual(
  validateUrl('http://localhost:3000'),
  'Local and private network addresses cannot be audited by the public engine.'
);
assert.strictEqual(
  validateUrl('http://127.0.0.1:8000'),
  'Local and private network addresses cannot be audited by the public engine.'
);
assert.strictEqual(
  validateUrl('http://192.168.1.1'),
  'Local and private network addresses cannot be audited by the public engine.'
);
assert.strictEqual(
  validateUrl('http://10.0.0.1'),
  'Local and private network addresses cannot be audited by the public engine.'
);

console.log('All URL validation tests passed successfully!');
