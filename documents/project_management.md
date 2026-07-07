# Project Management & Development Policy

## Overview

This document outlines the project management methodologies, development workflows, and tools used across the organization.

## Agile Methodology

- **Framework**: The company follows Agile methodology for all software development projects.
- **Principles**: Iterative development, continuous feedback, customer collaboration, and adaptability to change.
- **Sprint Duration**: 2-week sprints for most projects; 1-week sprints for urgent/fast-paced projects.
- **Ceremonies**: Sprint Planning, Daily Standup, Sprint Review, and Sprint Retrospective.
- **Roles**: Product Owner, Scrum Master, Development Team.
- **Definition of Done**: Code complete, tested (unit + integration), code reviewed, documented, and deployed to staging.

## Scrum

- **Sprint Planning**: Conducted on the first day of each sprint. The team commits to sprint backlog items.
- **Daily Standup**: 15-minute meeting at 10:00 AM. Each member answers: What did I do yesterday? What will I do today? Are there any blockers?
- **Sprint Review**: Conducted on the last day of the sprint. Demo of completed work to stakeholders.
- **Sprint Retrospective**: Conducted after Sprint Review. Team discusses what went well, what didn't, and action items for improvement.
- **Backlog Grooming**: 1 hour per sprint to refine and estimate upcoming backlog items.
- **Story Points**: Estimated using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21).
- **Velocity**: Tracked per sprint to aid in future sprint planning.

## Sprint Planning

- **Participants**: Product Owner, Scrum Master, entire Development Team.
- **Duration**: Maximum 4 hours for a 2-week sprint.
- **Inputs**: Product Backlog, team velocity, sprint capacity.
- **Outputs**: Sprint Backlog, sprint goal, task breakdown.
- **Process**:
  1. Product Owner presents prioritized backlog items.
  2. Team clarifies requirements and asks questions.
  3. Team estimates effort for each item.
  4. Team commits to items based on velocity and capacity.
  5. Tasks are broken down for each committed item.
  6. Sprint goal is defined and agreed upon.

## Jira

- **Purpose**: Primary project management and issue tracking tool.
- **Board Type**: Scrum board for sprint-based projects, Kanban board for support/maintenance.
- **Issue Types**: Epic, Story, Task, Bug, Sub-task.
- **Workflow States**: To Do, In Progress, In Review, Done.
- **Required Fields**: Assignee, Story Points, Sprint, Labels, Description, Acceptance Criteria.
- **Updates**: All issue status updates must be done in real-time. Jira is the source of truth.
- **Reporting**: Sprint reports, burndown charts, and velocity charts are reviewed in retrospectives.

## Asana

- **Purpose**: Used for non-development project management (HR, Marketing, Operations).
- **Project Structure**: Projects > Sections > Tasks > Subtasks.
- **Views**: List view, Board view, Timeline view, Calendar view.
- **Assignment**: Every task must have an assignee and due date.
- **Status Updates**: Tasks must be updated at least once per day.
- **Integration**: Asana integrates with Slack for notifications and Google Drive for attachments.

## Documentation

- **Tool**: Confluence for project documentation, Notion for company-wide knowledge base.
- **Required Documents**:
  - Project Charter (at project initiation)
  - Technical Design Document (before development starts)
  - API Documentation (maintained alongside code)
  - User Guide (before release)
  - Post-Mortem Report (after major incidents)
- **Code Documentation**: Inline comments for complex logic, JSDoc/Python docstrings for all public functions.
- **README**: Every repository must have a README with setup instructions, architecture overview, and contribution guidelines.
- **Review**: Documentation is reviewed in Sprint Reviews and must be updated when requirements change.

## Pull Requests

- **Mandatory**: All code changes must go through a Pull Request (PR). No direct commits to main/develop branches.
- **PR Template**: Must include description, related Jira ticket, testing notes, and screenshots (for UI changes).
- **Reviewers**: Minimum 2 reviewers required, at least 1 senior developer.
- **Review Time**: Reviewers must respond within 24 hours of PR submission.
- **Self-Review**: PR author must self-review before requesting reviewers.
- **Approval**: All comments must be resolved before merging. At least 2 approvals required.
- **Size**: PRs should be under 400 lines of diff. Larger changes should be split into multiple PRs.
- **CI/CD**: All automated tests and linting must pass before a PR can be merged.

## Git Workflow

- **Branching Strategy**: Git Flow (main, develop, feature, release, hotfix branches).
- **Branch Naming**:
  - Feature: `feature/PROJ-123-short-description`
  - Bugfix: `bugfix/PROJ-123-short-description`
  - Hotfix: `hotfix/PROJ-123-short-description`
  - Release: `release/v1.2.0`
- **Commits**: Conventional Commits format — `type(scope): description`
  - Types: feat, fix, docs, style, refactor, test, chore
  - Example: `feat(auth): add OAuth2 login support`
- **Commit Size**: Small, logical commits. One feature/fix per commit.
- **Rebase**: Feature branches should be rebased on develop before creating a PR.
- **Merge Strategy**: Squash and merge for feature branches. Merge commit for release branches.

## Code Reviews

- **Purpose**: Ensure code quality, share knowledge, and catch bugs early.
- **Focus Areas**: Logic correctness, performance, security, readability, test coverage, adherence to coding standards.
- **Feedback**: Constructive and specific. Use comments for suggestions, approve when satisfied.
- **Nitpicks**: Mark as "nit" to distinguish from blocking comments.
- **Resolution**: Author must address all comments. Disagreements are resolved through discussion or escalation to tech lead.
- **Timebox**: Reviews should not take more than 1 hour per PR. If longer, split the PR.

## Branch Strategy

- **main**: Production-ready code. Only release branches and hotfixes are merged here. Tagged with version numbers.
- **develop**: Integration branch for features. All feature branches merge here.
- **feature/**: Individual feature development. Branched from develop, merged back to develop.
- **release/**: Preparation for production release. Branched from develop, merged to both main and develop.
- **hotfix/**: Emergency fixes for production. Branched from main, merged to both main and develop.
- **Protection**: main and develop branches are protected. Force pushes are disabled.

## Release Process

1. **Release Planning**: Product Owner and Tech Lead define release scope and timeline.
2. **Release Branch**: Create `release/vX.Y.Z` from develop.
3. **Staging Deployment**: Deploy release branch to staging environment.
4. **QA Testing**: QA team performs regression, integration, and UAT testing.
5. **Bug Fixes**: Critical bugs are fixed on the release branch.
6. **Release Notes**: Prepare release notes with features, fixes, and known issues.
7. **Approval**: Product Owner approves the release.
8. **Production Deployment**: Merge release branch to main, deploy to production.
9. **Tagging**: Tag the main branch with the version number (vX.Y.Z).
10. **Merge Back**: Merge release branch back to develop.
11. **Post-Release Monitoring**: Monitor production for 48 hours. Hotfix branch if critical issues arise.
12. **Retrospective**: Conduct a release retrospective to identify process improvements.

### Version Numbering

- **Format**: MAJOR.MINOR.PATCH (e.g., 2.1.3)
- **MAJOR**: Breaking changes or major new features.
- **MINOR**: New features, backward compatible.
- **PATCH**: Bug fixes, backward compatible.
