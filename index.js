var express = require('express');
var prTeams = require('./lib/pr-teams');
var app = express();

var TEXT = 'text/plain';
var DOCUMENTATION_LINK = (
  '<!DOCTYPE html>' +
  '<title>pr-teams</title>' +
  '<a href="https://github.com/ianmstew/pr-teams/blob/master/README.md">Documentation</a>'
);

var DEFAULT_PR_TEAM_SIZE = 4;
var DEAFAULT_MIN_OUTSIDERS = 1;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

var USAGE =
  'Arguments: <PR team size>:<Min outsiders>:<dev>[,<dev>]*[;<dev>[,<dev>]]\n' +
  '  where each semicolon-separate group of comma-separated devs is a dev team.\n\n'
  'Example: brett,stef,steve;ian,max;zach,josh:4:1';

app.get('/', function (req, res) {
  res.send(DOCUMENTATION_LINK);
});

app.get('/slack-pr-teams', function (req, res) {
  if (!req.query.text) {
    return res.status(400).send('Expecting request parameter `text`.');
  }

  var args = req.query.text.trim().split(':');

  var devTeams = args[0].split(';').map(function (devTeamStr) {
    return devTeamStr.split(',');
  });

  var prTeamSize = DEFAULT_PR_TEAM_SIZE;
  if (args.length > 1) {
    prTeamSize = parseInt(args[1], 10);
    if (Number.isNaN(prTeamSize)) {
      return res.type(TEXT).send(USAGE);
    }
    if (prTeamSize < 1) {
      return res.type(TEXT).send('PR team size must be at least 1.');
    }
  }

  var minOutsiders = DEAFAULT_MIN_OUTSIDERS;
  if (args.length > 2) {
    minOutsiders = parseInt(args[2], 10);
    if (Number.isNaN(minOutsiders)) {
      return res.type(TEXT).send(USAGE);
    }
    if (minOutsiders < 0) {
      return res.type(TEXT).send('Min outsiders must be at least 0.');
    }
    if (minOutsiders > prTeamSize) {
      return res.type(TEXT).send('Min outsiders must be no more than PR team size.');
    }
  }

  var prTeamsString;
  try {
    prTeamsString = prTeams.generatePrTeamsString(devTeams, prTeamSize, minOutsiders);
  } catch (error) {
    if (error instanceof prTeams.PrTeamsError) {
      return res.json({
        "response_type": "ephemeral",
        text: error.message,
      });
    }
    throw error;
  }

  res.json({
    "response_type": "in_channel",
    text: prTeamsString,
  });
});

app.listen(app.get('port'), function () {
  console.log('Express is running on port ' + app.get('port'));
});
