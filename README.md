# Tera Toolbox CI Manifest
Automatically updates manifest.json with updated hashes.

## Usage
```yaml
- uses: tera-toolbox-ci/manifest@v1
  with:
    # Optional commit message
    commit_message: '[CI] Update manifest.json'

    # Optional commit user and author settings
    user_name: 'tera-toolbox-ci'
    user_email: '65821121+tera-toolbox-ci@users.noreply.github.com'
    commit_author: 'Actor <Actor@users.noreply.github.com>'
```

## Example
```yaml
name: CI

on: [push]

jobs:
  manifest:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Generate manifest
      uses: tera-toolbox-ci/manifest@v1
```
