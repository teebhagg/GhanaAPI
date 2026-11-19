# Contributing to GhanaAPI

Thanks for helping. The full guide is on the documentation site:

**[Contributing overview](https://docs.ghana-api.dev/docs/contributing/overview)**

The short version:

1. Fork the repository and create a branch named `feature/…`, `bugfix/…` or `docs/…`.
2. Set up a local database and run the tests. The setup steps are in the guide.
3. Write tests for what you change, and keep `npm test` and `npx tsc --noEmit` passing in `backend/`.
4. Add an entry under `[Unreleased]` in `docs/docs/CHANGELOG.md`.
5. Open a pull request against `main`. The title must follow conventional commits, for example `fix(addresses): reject blank coordinates`. The allowed scopes are listed in the [quick reference](https://docs.ghana-api.dev/docs/contributing/quick-reference).

Automated checks run on every pull request: branch name, commit messages, PR title and description.

Please report security problems privately (see [SECURITY.md](SECURITY.md)), not in a public issue.
