## ADDED Requirements

### Requirement: Reviewable article workflow
The authoring skills SHALL deliver versioned article Markdown, source evidence and a generated migration through a feature-branch PR, using the existing merge-triggered deployment workflow.

#### Scenario: New article
- **WHEN** a user requests a new NobodyClimb blog article
- **THEN** the skill selects a climbing-appropriate template, verifies claims and metadata, and prepares PR artifacts attributed to the existing NobodyClimb account
- **AND** it does not directly write a remote database or claim an open PR is published

### Requirement: Independent review layers
The skills SHALL distinguish machine checks, source verification, editorial review and published-page evidence.

#### Scenario: Inaccessible source
- **WHEN** an important claim cannot be verified from its original source
- **THEN** the verification report records the limitation and does not treat search snippets or a passing linter as confirmation

### Requirement: Preserve existing article identity
An update SHALL preserve article ID, slug, author, original publication time and engagement data unless the user explicitly requests an appropriate change supported by the workflow.

#### Scenario: Update baseline conflict
- **WHEN** the target article no longer matches the recorded baseline
- **THEN** applying the generated update migration fails without silently overwriting the newer content

### Requirement: Deterministic publication artifacts
The tooling SHALL validate metadata and supported HTML, generate SQL safely and verify that a migration matches its source article.

#### Scenario: Missing author or duplicate article
- **WHEN** the author is missing or ambiguous, or a create operation duplicates an ID or slug
- **THEN** the migration fails rather than creating an unexpected author or replacing an existing article

#### Scenario: Unsupported content
- **WHEN** a draft includes unsafe URLs or media syntax that the site cannot render
- **THEN** the local article check fails with an actionable error before PR delivery

### Requirement: Current structured approval
The quality gate SHALL bind evidence and structured review to the exact draft bytes, reject unresolved blocking findings and incomplete review, and require recorded external-link checks without equating reachability to factual support.

#### Scenario: Stale approval
- **WHEN** draft or evidence changes after approval
- **THEN** CI rejects the stale hash and requires renewed review

### Requirement: Isolated migration verification
CI SHALL apply newly added managed article migrations to isolated local D1 databases and reject modifications to existing managed article migrations.

#### Scenario: New migration in a PR
- **WHEN** a PR adds a generated article migration
- **THEN** CI validates success and conflict failures locally without production credentials

### Requirement: Correct language alternatives
Article SEO SHALL use a validated generated translation manifest to associate language versions with their actual article IDs.

#### Scenario: Legacy article without translation mapping
- **WHEN** a legacy article has no validated translation group
- **THEN** SEO does not advertise invented language alternatives
