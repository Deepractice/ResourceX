# Development Workflow

ResourceX follows a **Code Review + BDD** unified development mode that combines code review collaboration with Behavior-Driven Development.

## Core Philosophy

- Tests are not an afterthought; they are a natural output of the development process
- Feature files = Requirements + Acceptance Criteria + Automated Tests
- Fully discuss problems before implementation to avoid rework

## Roles

| Role          | Actor            | Responsibility                                      |
| ------------- | ---------------- | --------------------------------------------------- |
| **Reviewer**  | Claude/Developer | Review code/design, find issues, ask questions      |
| **Architect** | User/Lead        | Answer questions, make decisions, approve solutions |
| **Developer** | Claude/Developer | Implement code, write tests                         |

## Development Phases

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Requirements Clarification (Code Review Mode)     │
│                                                             │
│  1. Reviewer reads relevant code/documentation              │
│  2. Identifies issues, asks questions                       │
│  3. Architect answers, makes decisions                      │
│  4. Reviewer confirms understanding                         │
│  5. Solution agreed, proceed to Phase 2                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Behavior Definition (BDD)                         │
│                                                             │
│  1. Write .feature files describing expected behavior       │
│  2. Architect confirms features are correct                 │
│  3. Implement step definitions (if needed)                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Implementation (TDD)                              │
│                                                             │
│  1. Run tests (expected to fail)                            │
│  2. Implement code                                          │
│  3. Run tests (pass = done)                                 │
│  4. Refactor (keep tests passing)                           │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Requirements Clarification

**Purpose**: Understand the problem fully before implementing.

**Question Categories**:

| Type              | Description                                 | Example                                            |
| ----------------- | ------------------------------------------- | -------------------------------------------------- |
| **Blind Spots**   | Missing logic, unconsidered scenarios       | "How is cursor recovered on reconnect?"            |
| **Architecture**  | Unclear responsibilities, dependency issues | "Who handles routing - Queue or Network?"          |
| **Functionality** | Defined but not implemented                 | "handleConnection method not implemented"          |
| **Pitfalls**      | Potential bugs, edge cases                  | "Multiple tabs sharing localStorage will conflict" |

**Question Format**:

```markdown
**Question N: [Brief Title]**

**Code Location**: `path/to/file.ts:line`

**Description**:
[Specific description of the issue]

**Key Points**:

1. Point 1
2. Point 2
3. Point 3

**Status**: Awaiting answer
```

**Principles**:

1. **Problem-Driven**: Read code with critical thinking, not aimlessly
2. **Don't Act Prematurely**: No implementation before solution is agreed
3. **Keep Asking**: Multiple rounds of questions until fully understood
4. **Convergence**: Use API boundaries to narrow problem scope

### Phase 2: BDD Mode

**BDD vs Unit Test Boundaries**:

| Test Type | Test Layer        | Perspective           |
| --------- | ----------------- | --------------------- |
| **BDD**   | Outermost API/App | User perspective      |
| **Unit**  | Internal modules  | Developer perspective |

**BDD Testing Principles**:

- Test only through the outermost public API
- Test user-visible behavior, not implementation details
- This helps review API design from user perspective

**Feature File Structure**:

```gherkin
@tag
Feature: Feature Name
  Brief description of the feature

  Background:
    Given preconditions (shared by all scenarios)

  @scenario-tag
  Scenario: Scenario Name
    Given precondition
    When action is performed
    Then expected result
    And additional expectation
```

**File Organization**:

```
bdd/
├── features/
│   ├── registry/
│   │   ├── link.feature
│   │   ├── resolve.feature
│   │   └── search.feature
│   └── arp/
│       ├── resolve.feature
│       └── deposit.feature
├── steps/
│   ├── registry/
│   │   └── registry.steps.ts
│   └── arp/
│       └── arp.steps.ts
└── cucumber.js
```

**Writing Principles**:

1. **Business Language**: Use domain terms, not technical details
2. **Independent Scenarios**: Each scenario is independent, no execution order dependency
3. **Declarative**: Describe "what", not "how"
4. **Readable**: Non-technical people should understand

**Example**:

```gherkin
@registry
Feature: Registry Link
  Link resources to local registry for development

  Background:
    Given a local registry with default configuration

  Scenario: Link a text resource
    Given a text resource with name "hello" and version "1.0.0"
    When the resource is linked to the registry
    Then the resource should exist in the registry
    And the resource can be resolved by its locator
```

### Phase 3: Implementation

**TDD Flow**:

```bash
# 1. Run tests (expected to fail)
cd bdd && bun run test:tags "@feature-tag"

# 2. Implement code
# ... write implementation ...

# 3. Run tests (should pass)
cd bdd && bun run test:tags "@feature-tag"

# 4. Run all tests to ensure no regressions
bun run test
bun run test:bdd
```

**Principles**:

1. **Minimal Implementation**: Only implement what makes tests pass
2. **No Over-Engineering**: Don't code for imaginary future requirements
3. **Continuous Refactoring**: Refactor after tests pass, keep them green

## Complete Development Flow

### Step 0: Issue Creation

Create an issue document in `issues/`:

```
issues/xxx-feature-name.md
```

**Content**:

- Background and pain points
- Expected usage
- Design solution
- Implementation steps

### Step 1: Create Branch

```bash
git checkout main
git pull
git checkout -b feat/feature-name
```

### Step 2: Phase 1 - Requirements Clarification

1. Reviewer reads relevant code/docs/issue
2. Identifies issues, asks questions
3. Architect answers, makes decisions
4. Solution agreed, proceed to Phase 2

### Step 3: Phase 2 - Behavior Definition (BDD)

```bash
# 1. Write feature file
# bdd/features/feature-name.feature

# 2. Run tests (expected to fail - steps undefined)
cd bdd && bun run test:tags "@feature-tag"

# 3. Implement step definitions (if needed)
# bdd/steps/feature-name.steps.ts
```

### Step 4: Phase 3 - Implementation (TDD)

```bash
# 1. Run tests (expected to fail)
cd bdd && bun run test:tags "@feature-tag"

# 2. Implement code
# packages/core/src/...

# 3. Run tests until passing
cd bdd && bun run test:tags "@feature-tag"

# 4. Run all tests
bun run test
bun run test:bdd
```

### Step 5: Code Quality Check

```bash
bun run typecheck
bun run lint
bun run format
```

### Step 6: Update Documentation

Update as needed:

- `README.md` - If new features/API
- `CLAUDE.md` - If architecture changes
- `packages/*/README.md` - Related package docs

### Step 7: Create Changeset

```bash
bunx changeset
```

Or manually create `.changeset/feature-name.md`:

```markdown
---
"@resourcexjs/core": minor
---

Brief description of changes
```

**Version Rules**:

- `patch` - Bug fixes and internal improvements
- `minor` - New features and enhancements (including breaking changes)

**Important**: Never use `major` version in this project.

### Step 8: Commit Code

```bash
git add .
git status  # Review files to commit
git commit -m "feat: feature description

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Follow Conventional Commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Step 9: Push and Create PR

```bash
git push -u origin feat/feature-name

gh pr create --title "feat: feature description" --body "..."
```

### Step 10: Merge

After PR approval:

```bash
gh pr merge --squash

git checkout main
git pull

# Delete local branch
git branch -d feat/feature-name
```

## Quick Reference

### New Feature (Full Process)

```
1. Create Issue -> Create branch
2. Code Review: Discuss requirements, agree on solution
3. BDD: Write .feature files
4. Implement: Make tests pass
5. Quality check: typecheck, lint, format
6. Update docs
7. Write changeset
8. Commit -> PR -> Merge
```

### Bug Fix

```
1. Write failing test (reproduces bug)
2. Fix code
3. Tests pass = bug fixed
4. Commit
```

### Refactoring

```
1. Ensure existing tests pass
2. Refactor code
3. Run tests, keep green
4. Commit
```

## When to Use This Process

| Scenario                | Use This Process?                 |
| ----------------------- | --------------------------------- |
| New feature development | Full process                      |
| Bug fix                 | Simplified (test -> fix -> pass)  |
| Refactoring             | Ensure tests pass                 |
| Exploratory research    | Not needed, explore freely        |
| Emergency fix           | May skip BDD, but add tests after |
