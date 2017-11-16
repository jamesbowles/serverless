'use strict';
var learnjs = {};

learnjs.problemView = function (data) {
  var problemNumber = parseInt(data, 10);
  var view = learnjs.template('problem-view');
  var problemData = learnjs.problems[problemNumber - 1];
  var resultFlash = view.find('.result');

  function checkAnswer() {
    var answer = view.find('.answer').val();
    var test = problemData.code.replace('__', answer) + '; problem();';
    return eval(test);
  }

  function checkAnswerClick() {
    if (checkAnswer()) {
      learnjs.flashElement(resultFlash, learnjs.buildCorrectFlash(problemNumber));
    } else {
      learnjs.flashElement(resultFlash, 'Incorrect!');
    }
    return false;
  }

  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
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
    '#problem': learnjs.problemView
  };
  var hashParts = hash.split('-');
  var viewFn = routes[hashParts[0]];
  if (viewFn) {
    $('.view-container').empty().append(viewFn(hashParts[1]));
  }
}

learnjs.appOnReady = function () {
  window.onhashchange = function () {
    learnjs.showView(window.location.hash);
  }
  learnjs.showView(window.location.hash);
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