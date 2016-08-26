function PrTeamsError(message) {
  this.name = 'PrTeamsError';
  this.message = message || 'PR Teams Error';
  this.stack = (new Error()).stack;
}
PrTeamsError.prototype = Object.create(Error.prototype);
PrTeamsError.prototype.constructor = PrTeamsError;

// http://stackoverflow.com/a/2450976/957813
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
}

function shuffleDevTeams(devTeams) {
  devTeams.forEach(function (devTeam) {
    shuffle(devTeam);
  });
  shuffle(devTeams);
  return devTeams;
}

function toDevByName(devTeams, prTeamSize) {
  return devTeams.reduce(function (devNames, devTeam) {
    return devNames.concat(devTeam.map(function (devName) {
      return { name: devName, remainingAssignmentsCount: prTeamSize - 1, reviewers: [] }; 
    }));
  }, []).reduce(function (devByName, dev) {
    devByName[dev.name] = dev;
    return devByName;
  }, {});
}

function _makeTeamAssignments(devTeams, devByName, prTeamSize, minOutsiders) {
  for (var devTeamIndex = 0; devTeamIndex < devTeams.length; devTeamIndex++) {
    var devNames = devTeams[devTeamIndex];

    for (var devNameIndex = 0; devNameIndex < devNames.length; devNameIndex++) {
      var devName = devNames[devNameIndex];
      var dev = devByName[devName];

      for (var teammateNameCount = 1; teammateNameCount < devNames.length; teammateNameCount++) {
        var teammateNameIndex = (teammateNameCount + devNameIndex) % devNames.length;
        var teammateName = devNames[teammateNameIndex];
        var teammate = devByName[teammateName];

        if (dev.reviewers.length < prTeamSize - 1 - minOutsiders) {
          dev.reviewers.push(teammateName);
          teammate.remainingAssignmentsCount--;
        }
      }
    }
  }
}

function _makeOutsiderAssignments(devTeams, devByName, prTeamSize) {
  var devCount = 0;

  for (var devTeamIndex = 0; devTeamIndex < devTeams.length; devTeamIndex++) {
    var devNames = devTeams[devTeamIndex];

    for (var devNameIndex = 0; devNameIndex < devNames.length; devNameIndex++) {
      var devName = devNames[devNameIndex];
      var dev = devByName[devName];

      assignReviewers:
      for (var nextDevTeamCount = 0; true; nextDevTeamCount++) {
        var nextDevTeamIndex = (nextDevTeamCount + devTeamIndex + 1) % devTeams.length;
        var nextDevTeam = devTeams[nextDevTeamIndex];

        for (var nextDevNameCount = 0; nextDevNameCount < nextDevTeam.length; nextDevNameCount++) {
          var nextDevNameIndex = (nextDevNameCount + devCount) % nextDevTeam.length;
          var nextDevName = nextDevTeam[nextDevNameIndex];
          var nextDev = devByName[nextDevName];

          if (nextDev.remainingAssignmentsCount > 0) {
            if (
              dev.name !== nextDevName &&
              dev.reviewers.indexOf(nextDevName) === -1 &&
              dev.reviewers.length < prTeamSize - 1
            ) {
              dev.reviewers.push(nextDevName);
              nextDev.remainingAssignmentsCount--;
            } else {
              return false;
            }
          }

          if (dev.reviewers.length === prTeamSize - 1) {
            break assignReviewers;
          }
        }
      }

      devCount++;
    }
  }

  return true;
}

function makeAssignments(devTeams, devByName, prTeamSize, minNumExtraTeam) {
  _makeTeamAssignments(devTeams, devByName, prTeamSize, minNumExtraTeam);
  return _makeOutsiderAssignments(devTeams, devByName, prTeamSize);
}

function devToString(dev) {
  var author = dev.name;
  var reviewers = dev.reviewers;
  var lastReviewerIndex = reviewers.length - 1;
  var lastReviewer = reviewers[lastReviewerIndex];
  if (!author) {
    return 'PR team is empty.';
  }

  if (reviewers.length === 0) {
    return author + ' has no reviewers :(';
  } else if (reviewers.length === 1) {
    return author + ' adds ' + lastReviewer;
  } else if (reviewers.length === 2) {
    return author + ' adds ' + reviewers.slice(0, lastReviewerIndex).join(', ') + ' and ' + lastReviewer;
  } else {
    return author + ' adds ' + reviewers.slice(0, lastReviewerIndex).join(', ') + ', and ' + lastReviewer;
  }
}

function devTeamsToString(devTeams, devByName) {
  return devTeams.reduce(function (devNames, devTeam) {
    return devNames.concat(devTeam.map(function (devName) {
      return devToString(devByName[devName]);
    }));
  }, []).join('\n');
}

function generatePrTeamsString(devTeams, prTeamSize, minOutsiders) {
  var devByName;
  var assignmentsSucceeded;
  var assignmentsAttempts = 0;

  do {
    shuffleDevTeams(devTeams);
    devByName = toDevByName(devTeams, prTeamSize);
    assignmentsSucceeded = makeAssignments(devTeams, devByName, prTeamSize, minOutsiders);
    assignmentsAttempts++;
  } while (!assignmentsSucceeded && assignmentsAttempts < 10);

  if (assignmentsAttempts === 10) {
    throw new PrTeamsError('Input was not solvable.  Try changing parameters, including distribution of developers ' +
        'across dev teams; see documentation at https://github.com/ianmstew/pr-teams/blob/master/README.md. If a ' +
        'satisfactory input is not possible, please file an issue at https://github.com/ianmstew/pr-teams/issues.');
  }

  return devTeamsToString(devTeams, devByName);
}

module.exports = {
  PrTeamsError: PrTeamsError,
  generatePrTeamsString: generatePrTeamsString,
};
