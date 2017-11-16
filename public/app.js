'use strict';
var learnjs = {
  poolId: 'us-east-1:e05afefb-d130-4ccc-adcc-b5e73b743a90'
};

learnjs.identity = new $.Deferred();

learnjs.landingView = function () {
  return learnjs.template('landing-view');
}

learnjs.problemView = function (data) {
  var problemNumber = parseInt(data, 10);
  var view = learnjs.template('problem-view');
  var problemData = learnjs.problems[problemNumber - 1];
  var resultFlash = view.find('.result');
  var answer = view.find('.answer');

  function checkAnswer() {
    var test = problemData.code.replace('__', answer.val()) + '; problem();';
    return eval(test);
  }

  function checkAnswerClick() {
    if (checkAnswer()) {
      learnjs.flashElement(resultFlash, learnjs.buildCorrectFlash(problemNumber));
      learnjs.saveAnswer(problemNumber, answer.val())
    } else {
      learnjs.flashElement(resultFlash, 'Incorrect!');
    }
    return false;
  }

  if (problemNumber < learnjs.problems.length) {
    var buttonItem = learnjs.template('skip-button');
    buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
    $('.nav-list').append(buttonItem);
    view.bind('removingView', function () {
      buttonItem.remove();
    });
  };

  learnjs.fetchAnswer(problemNumber).then(function (data) {
    if (data.Item) {
      answer.val(data.Item.answer);
    }
  });


  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
}

learnjs.profileView = function () {
  var view = learnjs.template('profile-view');
  learnjs.identity.done(function (identity) {
    view.find('.email').text(identity.email);
  });
  return view;
}

learnjs.template = function (name) {
  return $('.templates .' + name).clone();
}

learnjs.flashElement = function (elm, content) {
  elm.fadeOut('fast', function () {
    elm.html(content);
    elm.fadeIn();
  });
}

learnjs.buildCorrectFlash = function (problemNumber) {
  var correctFlash = learnjs.template('correct-flash');
  var link = correctFlash.find('a')

  if (problemNumber < learnjs.problems.length) {
    link.attr('href', '#problem-' + (problemNumber + 1));
  } else {
    link.attr('href', '');
    link.text("You're finished!");
  }

  return correctFlash;
}

learnjs.showView = function (hash) {
  var routes = {
    '': learnjs.landingView,
    '#': learnjs.landingView,
    '#problem': learnjs.problemView,
    '#profile': learnjs.profileView
  };
  var hashParts = hash.split('-');
  var viewFn = routes[hashParts[0]];
  if (viewFn) {
    learnjs.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn(hashParts[1]));
  }
}

learnjs.addProfileLink = function (profile) {
  var link = learnjs.template('profile-link');
  link.find('a').text(profile.email);
  $('.signin-bar').prepend(link);
}

learnjs.appOnReady = function () {
  window.onhashchange = function () {
    learnjs.showView(window.location.hash);
  }
  learnjs.showView(window.location.hash);
  learnjs.identity.done(learnjs.addProfileLink);
}

learnjs.triggerEvent = function (name, args) {
  $('.view-container>*').trigger(name, args);
}

learnjs.problems = [
  {
    description: 'What is the truth?',
    code: 'function problem() { return __; }'
  },
  {
    description: 'Simple math',
    code: 'function problem() { return 42 == 6 * __; }'
  }
]

learnjs.applyObject = function (obj, elm) {
  for (var key in obj) {
    elm.find('[data-name="' + key + '"]').text(obj[key]);
  }
}

learnjs.saveAnswer = function (problemId, answer) {
  return learnjs.identity.then(function (identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'learnjs',
      Item: {
        userId: identity.id,
        problemId: problemId,
        answer: answer
      }
    };
    return learnjs.sendDbRequest(db.put(item), function () {
      return learnjs.saveAnswer(problemId, answer);
    })
  });
}
learnjs.fetchAnswer = function (problemId) {
  return learnjs.identity.then(function (identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'learnjs',
      Key: {
        userId: identity.id,
        problemId: problemId
      }
    };
    return learnjs.sendDbRequest(db.get(item), function () {
      return learnjs.fetchAnswer(problemId);
    })
  });
}

learnjs.sendDbRequest = function (req, retry) {
  var promise = new $.Deferred();
  req.on('error', function (error) {
    if (error.code == 'CredentialsError') {
      learnjs.identity.then(function (identity) {
        return identity.refresh().then(function () {
          return retry();
        }, function () {
          promise.reject(resp);
        });
      });
    } else {
      promise.reject(error);
    }
  });
  req.on('success', function (resp) {
    promise.resolve(resp.data);
  });
  req.send();
  return promise;
}

learnjs.awsRefresh = function () {
  var deferred = new $.Deferred();

  AWS.config.credentials.refresh(function (err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });
  return deferred.promise();
}

function googleSignIn(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;
  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: learnjs.poolId,
      Logins: {
        'accounts.google.com': id_token
      }
    })
  })

  $.when(learnjs.awsRefresh()).then(function (id) {
    learnjs.identity.resolve({
      id: id,
      email: googleUser.getBasicProfile().getEmail(),
      refresh: refresh
    })
  })

  function refresh() {
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function (userUpdate) {
      var creds = AWS.config.credentials;
      var newToken = userUpdate.getAuthResponse().id_token;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh()
    });
  }
}