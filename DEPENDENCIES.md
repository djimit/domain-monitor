# Dependency Management

Last Updated: October 21, 2025

## Security Vulnerabilities Status

### Known Issues

#### ⚠️ validator.js (Moderate Severity - Not Exploitable)

**Package:** `validator@13.12.0` (via `express-validator@7.2.1`)
**Vulnerability:** URL validation bypass in isURL() function
**CVE:** GHSA-9965-vmph-33xx
**CVSS Score:** 6.1 (Moderate)
**Status:** ✅ **Not Exploitable in Our Application**

**Why Not Exploitable:**
- We do NOT use the vulnerable `isURL()` function
- All validation uses safe methods: `.matches()`, `.isLength()`, `.isArray()`
- No URL validation performed with validator.js

**Action:** Monitoring for security patch. Will update when available.

---

## Pending Major Version Updates

The following packages have major version updates available that require testing for breaking changes:

### 1. Express (4.21.2 → 5.1.0)
**Status:** 🔄 Pending Review
**Breaking Changes:** Yes (Express 5 has breaking changes)
**Action Required:**
- Review Express 5 migration guide
- Test all API endpoints
- Update middleware if needed
- Estimated effort: 2-4 hours

### 2. node-fetch (2.7.0 → 3.3.2)
**Status:** 🔄 Pending Review
**Breaking Changes:** Yes (ESM-only in v3)
**Action Required:**
- Switch to ESM or use dynamic import
- Update all fetch calls
- Alternative: Use native fetch in Node.js 18+
- Estimated effort: 1-2 hours

### 3. express-rate-limit (7.5.1 → 8.1.0)
**Status:** 🔄 Pending Review
**Breaking Changes:** Possibly
**Action Required:**
- Review changelog
- Test rate limiting functionality
- Update configuration if needed
- Estimated effort: 30 minutes

### 4. @types/node (20.19.23 → 24.9.1)
**Status:** 🔄 Pending Review
**Breaking Changes:** Type definitions may change
**Action Required:**
- Update Node.js version first
- Fix TypeScript errors if any
- Estimated effort: 1 hour

---

## Recently Updated

✅ **typescript** (5.8.3 → 5.9.3) - Updated October 21, 2025
✅ **dotenv** - Latest version confirmed

---

## Update Policy

### Immediate Updates (Critical)
- Security vulnerabilities with exploits
- Critical bug fixes
- Data loss or corruption issues

### Scheduled Updates (High Priority)
- Security vulnerabilities (non-exploitable)
- Major bug fixes
- Performance improvements

### Regular Updates (Medium Priority)
- Minor version updates
- Patch updates
- Type definition updates

### Deferred Updates (Low Priority)
- Major version updates (require testing)
- Breaking changes
- Features we don't use

---

## Update Schedule

| Package | Current | Latest | Priority | Scheduled |
|---------|---------|--------|----------|-----------|
| validator | 13.12.0 | 13.15.15 | High | When patched |
| express | 4.21.2 | 5.1.0 | Medium | Q1 2026 |
| node-fetch | 2.7.0 | 3.3.2 | Medium | Q1 2026 |
| express-rate-limit | 7.5.1 | 8.1.0 | Low | Q2 2026 |
| @types/node | 20.19.23 | 24.9.1 | Low | With Node.js upgrade |

---

## Testing Checklist for Major Updates

Before updating to a major version:

- [ ] Read CHANGELOG and migration guide
- [ ] Run all unit tests
- [ ] Run integration tests (when available)
- [ ] Test all API endpoints manually
- [ ] Test error scenarios
- [ ] Check performance metrics
- [ ] Review TypeScript errors
- [ ] Update documentation
- [ ] Deploy to staging first
- [ ] Monitor for 24 hours
- [ ] Deploy to production

---

## Automated Dependency Updates

### GitHub Dependabot Configuration

We use Dependabot for automated dependency updates:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
```

### npm audit Integration

Run security audits:
```bash
# Check for vulnerabilities
npm audit

# Attempt automated fix
npm audit fix

# Force update (use with caution)
npm audit fix --force
```

---

## Dependency Addition Guidelines

Before adding a new dependency:

1. **Evaluate necessity:** Can we implement it ourselves?
2. **Check maintenance:** Last commit < 6 months ago?
3. **Check popularity:** Downloads per week > 10,000?
4. **Check security:** Any known vulnerabilities?
5. **Check license:** Compatible with our license?
6. **Check size:** Bundle size impact?
7. **Check dependencies:** How many subdependencies?
8. **Check TypeScript support:** Has type definitions?

---

## Locked Versions

Some packages are locked to specific versions:

None currently - all packages use semver ranges.

---

## Automated Monitoring Tools ✅

### Active Monitoring
- ✅ **npm audit:** Security vulnerability scanning (manual + CI/CD)
- ✅ **npm outdated:** Check for available updates (manual)
- ✅ **Dependabot:** Automated pull requests (weekly, Monday 09:00 UTC)
- ✅ **GitHub Actions:** Monthly security audits (1st of month)
- ✅ **CI/CD Integration:** Security checks on every PR

### Optional Future Tools
- 🔄 **Snyk:** Advanced security scanning (planned for Phase 3)
- 🔄 **Renovate:** Alternative to Dependabot (if needed)
- 🔄 **Socket Security:** Supply chain attack detection

### Monitoring Configuration

See [.github/dependabot.yml](.github/dependabot.yml) for Dependabot configuration.
See [.github/workflows/security-audit.yml](.github/workflows/security-audit.yml) for automated audits.

### Notification Channels
- **GitHub Issues:** Automated issues for high/critical vulnerabilities
- **Pull Requests:** Dependabot creates PRs for updates
- **Email:** GitHub notifications for security alerts
- **Workflow Summary:** Monthly audit results in GitHub Actions

---

## Contact

For dependency-related questions:
- Security issues: security@domain-monitor.example.com
- General questions: dev-team@domain-monitor.example.com

---

**Last Audit:** October 21, 2025
**Next Automated Audit:** November 1, 2025
**Monitoring Status:** ✅ Fully Automated
