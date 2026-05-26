---
title: 'Building Agent Skills with Just Markdown'
description: 'How to extend Wolffish with custom skills using nothing but a SKILL.md file — no code, no config, no deployment.'
date: '2025-05-10'
---

## The simplest plugin system ever built

What if teaching an AI agent a new skill was as simple as writing a document? Not a Python file. Not a YAML config. Not a Docker container. Just a markdown file that describes what the skill does and how to do it.

That's how Wolffish skills work. Drop a folder with a `SKILL.md` file, and the agent learns something new instantly.

## How it works

A skill is a directory containing a single `SKILL.md` file. The file describes the skill in plain language — what it does, when to use it, and how to execute it. The agent reads this file and integrates it into its reasoning loop.

Here's the structure:

```
my-skill/
  SKILL.md
```

And the `SKILL.md` might look like this:

```markdown
# Deploy to Production

## When to use
When the user asks to deploy, push to prod, or ship the latest changes.

## Steps
1. Run the test suite and confirm all tests pass
2. Build the production bundle
3. Push to the main branch
4. Trigger the deployment pipeline
5. Verify the deployment is healthy

## Constraints
- Never deploy if tests are failing
- Always confirm with the user before pushing to main
```

That's it. No SDK. No API registration. No build step. The agent reads the markdown and knows how to deploy.

## Why markdown works

Markdown skills work because of how Wolffish's brain architecture processes information. The reasoning layer doesn't need structured code to understand intent — it needs clear descriptions of goals, steps, and constraints.

This is the same way you'd teach a human colleague: you'd write them a document explaining the process, not hand them a script to execute blindly.

The advantages are significant:

- **Zero learning curve**: If you can write a README, you can build a skill
- **Version controllable**: Skills are files — put them in git, review them in PRs
- **Shareable**: Send someone a folder and they have a new skill
- **Editable**: Update a skill by editing a text file — no rebuild required
- **Inspectable**: Read exactly what the agent will do before it does it

## Real-world examples

Users have built skills for everything from database migrations to email drafting to infrastructure provisioning. A few examples from the community:

- **Git workflow**: Standardizes commit messages, branch naming, and PR descriptions
- **Code review**: Analyzes diffs against team-specific style guidelines
- **Data pipeline**: Orchestrates ETL jobs across multiple data sources
- **Documentation**: Auto-generates API docs from code changes

## The skill ecosystem

Because skills are just folders of markdown, sharing them is trivial. Copy a folder from one machine to another. Clone a git repo. Download a zip file. The skill works immediately — no installation, no dependencies, no configuration.

This simplicity is intentional. The best plugin system is one that disappears. You shouldn't need to think about the system — you should think about what you want the agent to do, write it down, and let it happen.
