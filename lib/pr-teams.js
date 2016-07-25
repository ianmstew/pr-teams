function toDevs(devTeams) {
  return devTeams.reduce(function (_devs, devTeam) {
    return _devs.concat(devTeam);
  }, []);
}

function toPartnersByDev(devTeams) {
  return devTeams.reduce((partnersByDev, devTeam) => {
    for (var i = 0; i < devTeam.length; i++) {
      var dev = devTeam[i];

      for (var j = 0; j < devTeam.length; j++) {
        var devTeammate = devTeam[j];

        if (devTeammate !== dev) {
          var partners = partnersByDev[dev] || []

          partners.push(devTeammate);
          partnersByDev[dev] = partners;
        }
      }
    }

    return partnersByDev;
  }, {});
}

function initializeAlreadySwappedReviewersByAuthor(prTeams) {
  return prTeams.reduce(function (alreadySwappedReviewersByAuthor, prTeam) {
    alreadySwappedReviewersByAuthor[prTeam.author] = [];
    return alreadySwappedReviewersByAuthor;
  }, {});
}

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

function buildPrTeams(devs, prTeamSize) {
  var reviewersSize = prTeamSize - 1;
  shuffle(devs);

  return devs.map(function (dev, devIndex, devs) {
    var prTeam = { author: dev, reviewers: [] };

    for (var i = 1; i <= reviewersSize; i++) {
      var nextDevIndex = (devIndex + i) % devs.length;
      var nextDev = devs[nextDevIndex];

      prTeam.reviewers.push(nextDev);
    }

    return prTeam;
  });
}

function ensurePartners(prTeams, partnersByDev, prTeamSize) {
  function isPartner(dev, testDev) {
    return partnersByDev[dev].indexOf(testDev) > -1;
  }
  var alreadySwappedReviewersByAuthor = initializeAlreadySwappedReviewersByAuthor(prTeams);
  var totalTries = 0;
  var doSwapsRemain;

  do {
    doSwapsRemain = false;

    prTeams.forEach(function (prTeam, prTeamIndex) {
      var prTeamPartners = prTeam.reviewers.filter(function (reviewer) {
        return isPartner(prTeam.author, reviewer);
      });
      var partnersSize = partnersByDev[prTeam.author].length;
      var numPartersInPrTeam = Math.min(partnersSize, prTeamSize - 2);

      if (prTeamPartners.length < numPartersInPrTeam) {
        swapForPartner(prTeams, prTeam, alreadySwappedReviewersByAuthor, isPartner);
      }
      if (numPartersInPrTeam - prTeamPartners.length === 2) {
        doSwapsRemain = true;
      }
    });

    totalTries++;
  } while (doSwapsRemain && totalTries < 100);

  if (totalTries === 100) {
    throw new Error('Input was not solvable.');
  }
  return prTeams;
}

function swapForPartner(prTeams, prTeam, alreadySwappedReviewersByAuthor, isPartner) {
  partnerSearch:
  for (var searchPrTeamIndex = 0; searchPrTeamIndex < prTeams.length; searchPrTeamIndex++) {
    var searchPrTeam = prTeams[searchPrTeamIndex];
    if (searchPrTeam === prTeam) {
      return;
    }

    for (var searchReviewerIndex = 0; searchReviewerIndex < searchPrTeam.reviewers.length; searchReviewerIndex++) {
      // Find partner in another prTeam
      var searchPrTeamReviewer = searchPrTeam.reviewers[searchReviewerIndex];
      if (!isPartner(prTeam.author, searchPrTeamReviewer)) {
        continue;
      }

      // Make sure prTeam has a trade that will be compatible
      var prTeamReviewerIndex = prTeam.reviewers.findIndex(function (prTeamReviewer) {
        var isAlreadySwapped = alreadySwappedReviewersByAuthor[prTeam.author].indexOf(prTeamReviewer) > -1;
        var isPrTeamReviewer = prTeam.reviewers.indexOf(prTeamReviewer) > -1;
        var isSearchTeamAuthor = searchPrTeam.author === prTeamReviewer;
        var isSearchTeamReviewer = searchPrTeam.reviewers.indexOf(prTeamReviewer) > -1;
        return !isAlreadySwapped && !isPrTeamReviewer && !isSearchTeamAuthor && !isSearchTeamReviewer;
      });
      if (prTeamReviewerIndex === -1) {
        continue partnerSearch;
      }

      // Make trade
      var prTeamReviewer = prTeam.reviewers[prTeamReviewerIndex];
      console.log('Trading:');
      console.log('prTeam, prTeamReviewer', prTeam, prTeamReviewer);
      console.log('searchPrTeam, searchPrTeamReviewer', searchPrTeam, searchPrTeamReviewer);
      console.log();
      prTeam.reviewers[prTeamReviewerIndex] = searchPrTeamReviewer;
      searchPrTeam.reviewers[searchReviewerIndex] = prTeamReviewer;

      // Don't allow new prTeam partner to be traded later
      alreadySwappedReviewersByAuthor[prTeam.author].push(searchPrTeamReviewer)
      
      return true;
    };
  };

  return false;
}

function prTeamToString(prTeam) {
  var author = prTeam.author;
  var reviewers = prTeam.reviewers;
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

// This algorithm generates PR teams with the following constraints:
// - At least 1 partner from the author's local dev team will be on his/her PR's
// - PR teams will always be exactly the same size
// - If there is at least 1 local dev team partner for each author, then all
//   devs are guaranteed to be a _reviewer_ for exactly PR team size - 1 authors.
function generatePrTeams(devTeams, prTeamSize) {
  var devs = toDevs(devTeams);
  var _prTeamSize = Math.min(prTeamSize, devs.length);
  var partnersByDev = toPartnersByDev(devTeams);
  var prTeams = buildPrTeams(devs, _prTeamSize);

  ensurePartners(prTeams, partnersByDev, _prTeamSize);

  return prTeams.map(prTeamToString).join('\n');
}

module.exports = {
  generatePrTeams: generatePrTeams,
};
