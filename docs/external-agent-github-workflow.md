# External Agent GitHub Workflow

The Just Putz It source is exported to the public repository at `https://github.com/7809tom-sys/just-putzit` on the `main` branch. External AI agents with the repository permissions you choose can inspect, branch, edit, commit, and open pull requests against this codebase.

## Editing workflow

Agents should begin from the latest `main` branch and make each change in a descriptive branch or pull request. They should include a concise explanation of the intended behavior, affected files, and validation performed. This keeps the change history reviewable even when more than one agent is contributing.

Just Putz It’s live Manus workspace can continue to receive its own checkpoints. Before releasing an external-agent change to production, bring the approved commit or pull request into the workspace, run the project checks and relevant tests, and create a Manus checkpoint. A GitHub commit alone does not automatically publish the site.

## Security and data boundary

The GitHub export contains application source code and migration files, but it must not contain production secrets, payment credentials, member profiles, private messages, or production database credentials. External agents can author database schema and migration code; applying a production database migration remains a separate authorized deployment step.

## Recommended validation

For TypeScript and frontend/server changes, run `pnpm check` and the relevant Vitest coverage before proposing the change. For full feature changes, run `pnpm test`. For externally authored database changes, use focused additive migrations and review the SQL before it is applied to production.
