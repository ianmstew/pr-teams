# pr-teams

A pull request review team generator.

## API

### GET /slack-pr-teams

This service is compatible with custom Slack slash command integration and generates PR review teams with the following
constraints:

- PR teams will consist of exactly the same number of developers.
- Each developer will be be a reviewer for exactly the same number of authors (PR team size minus one).
- PR teams will attempt to include of all dev teammates, limited by a configurable "outsider" constraint.
- A minium number of developers from outside a dev team, "outsiders", will be on each PR team for cross-pollination,
  unless there are insufficient outsiders.
- Outsiders are determined on a team-weighted basis; e.g., it's more likely that all of dev team 2 will review authors
  from dev team 1 than a distrubtion of reviewers from dev teams 2 and 3.
- The result should be effectively random in order to facilitate an even distribution over time of dev team exposure
  to other dev team's code.

#### Request Parameters

```
text={PR teams}:{PR team size}:{Min outsiders}
```

##### `PR teams`

Formatted `{dev},...,{dev}[;{dev},...,{dev}]*` where `dev` is a developer's name and each semicolon-separated group
of comma-separated developers is a dev team.

##### `PR team size` (Optional; defaults to 4)

Total size of the PR review team, including the author.

##### `Min outsiders` (Optional; defaults to 1)

The minimum number of reviewers from outside the author's dev team that should be reviewers, if available.

#### Response

##### Success

```
{
  "response_type": "in_channel",
  "text": "{PR teams}"
}
```

##### Error

```
{
  "response_type": "ephemeral",
  "text": "{Error message}"
}
```

#### Example

The following custom Slack slash command

```
/pr-teams brett,stef,steve;ian,max;zach,josh:4:1
```

might render to a Slack thread:

```
ian adds max, brett, and stef
max adds ian, steve, and josh
brett adds stef, steve, and zach
stef adds steve, brett, and josh
steve adds brett, stef, and zach
zach adds josh, max, and ian
josh adds zach, ian, and max
```
