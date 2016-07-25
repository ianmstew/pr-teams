var express = require('express');
var bodyParser = require('body-parser');
var prTeams = require('./lib/pr-teams');
var app = express();

var TEXT = 'text/plain';

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

var USAGE =
  'Arguments: <PR team size>:<Min outsiders>:<dev>[,<dev>]*[;<dev>[,<dev>]]\n' +
  '  where each semicolon-separate group of comma-separated devs is a dev team.\n\n'
  'Example: 4:1:brett,stef,steve;ian,max;zach,josh';


app.post('/generate-teams', function (req, res) {
  if (req.body.text === undefined || typeof req.body.text !== 'string') {
    return res.status(400).send('Expecting request body to contain property `text`.');
  }

  var text = req.body.text.trim();

  var textSplit = text.split(':');
  if (textSplit.length !== 3) {
    return res.type(TEXT).send(USAGE);
  }

  var prTeamSize = parseInt(textSplit[0], 10);
  if (Number.isNaN(prTeamSize)) {
    return res.type(TEXT).send(USAGE);
  }
  if (prTeamSize < 1) {
    return res.type(TEXT).send('PR team size must be at least 1.');
  }

  var minOutsiders = parseInt(textSplit[1], 10);
  if (Number.isNaN(minOutsiders)) {
    return res.type(TEXT).send(USAGE);
  }
  if (minOutsiders < 0) {
    return res.type(TEXT).send('Min outsiders must be at least 0.');
  }

  if (minOutsiders > prTeamSize) {
    return res.type(TEXT).send('Min outsiders must be no more than PR team size.');
  }

  var devTeams = textSplit[2].split(';').map(function (devTeamStr) {
    return devTeamStr.split(',');
  });

  res.send(prTeams.generatePrTeams(devTeams, prTeamSize, minOutsiders));
});

app.listen(app.get('port'), function () {
  console.log('Express is running on port ' + app.get('port'));
});
