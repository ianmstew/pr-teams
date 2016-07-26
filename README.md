# pr-teams

## API

### POST /generate-teams

This service is intended for custom Slack "slash integration" and generates PR review teams with the following constraints:

- PR teams will consist of exactly the same number of developers.
- Each dev will be be a reviewer for exactly the same number of authors (PR team size minus one).
- PR teams will attempt to include of all dev teammates, limited by a configurable "outsider" constraint.
- A minium number of devs from outside a dev team will be on each PR team for "cross-pollination", unless there are insufficient outsiders.
- Outsider devs are weighted to cross-pollinate on a team-by-team basis; e.g., it's more
  likely that dev team 2 will audit dev team 1 than a combination of dev teams 2 - 3 will audit
  dev team 1.
- The result should be effectively random in order to facilitate an even distribution over time of developer exposure to each other's code.

#### Request body

```json
{
  "text": "<Arguments>"
}
```

##### Arguments

```
<dev>[,<dev>]*[;<dev>[,<dev>]*]:<PR team size>:<Min outsiders>
```

* `PR team size` Optional: Defaults to 4. Total size of the PR review team, including the author.
* `Min outsiders` Optional: Defaults to 1. The minimum number of reviewers from outsdie the author's dev team that should be reviewers, if available.
* `dev` A developer's name. Each semicolon-separated group of comma-separated devs is a dev team.

#### Example

The following request:

```
{
  "text": "4:1:brett,stef,steve;ian,max;zach,josh"
}
```

could conceivably produce:

```
ian adds max, brett, and stef
max adds ian, steve, and josh
brett adds stef, steve, and zach
stef adds steve, brett, and josh
steve adds brett, stef, and zach
zach adds josh, max, and ian
josh adds zach, ian, and max
```
