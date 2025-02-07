# git-groom

## Overview

`git-groom` is a CLI tool designed to help developers clean up their Git repositories by automatically identifying and deleting merged branches, pruning stale remote branches, and removing unnecessary tags. This helps keep repositories neat and prevents clutter from accumulating over time.

## Features

- **Delete merged local branches**: Removes branches that have already been merged into the main branch.
- **Delete merged remote branches**: Identifies and removes merged branches from the remote repository.
- **Prune stale remote-tracking branches**: Cleans up remote-tracking branches that no longer exist on the remote.
- **Delete merged tags**: Removes tags that have already been merged into the main branch.

## Installation

To install `git-groom` globally, run:

```sh
npm install -g git-groom
```

## Usage

Run `git-groom` to clean up your repository:

```sh
git-groom cleanup
```

By default, `git-groom` operates on the main branch of your repository, automatically detecting whether the main branch is `main`, `master`, or another name.

You can specify a branch to clean up merged branches from:

```sh
git-groom cleanup <branch-name>
```

### Example

```sh
git-groom cleanup develop
```

This will remove all branches merged into `develop`, prune stale remote branches, and clean up merged tags.

## Error Handling

`git-groom` gracefully handles errors such as:

- Repositories without a remote.
- Branches with no commits.
- Attempting to delete unmerged branches.

If an error occurs, it will be displayed with details on how to resolve it.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License.
