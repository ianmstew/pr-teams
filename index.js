var express = require('express');
var bodyParser = require('body-parser');
var prTeams = require('./lib/pr-teams');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

var USAGE =
  'Usage: <PR team size>:<developer team>[;<developer team>]*\n' +
  '  where <developer team> = <developer>[,<developer>]*;\b' +
  'Example: 4:brett,stef,steve;ian,max;zach,josh';


app.post('/generate-teams', function (req, res) {
  if (req.body.text === undefined || typeof req.body.text !== 'string') {
    return res.status(400).send('Expecting request body to contain property `text`.');
  }

  var text = req.body.text.trim();

  var textSplit = text.split(':');
  if (textSplit.length !== 2) {
    return res.send(USAGE);
  }

  var prTeamSize = parseInt(textSplit[0], 10);
  if (Number.isNaN(prTeamSize)) {
    return res.send(USAGE);
  }

  var devTeams = textSplit[1].split(';').map(function (devTeamStr) {
    return devTeamStr.split(',');
  });

  res.send(prTeams.generatePrTeams(devTeams, prTeamSize));
});

app.listen(app.get('port'), function () {
  console.log('Express is running on port ' + app.get('port'));
});
