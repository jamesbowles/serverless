'use strict';
var learnjs = {};

learnjs.problemView = function (problemNumber) {
    var view = $('.templates .problem-view').clone();
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(learnjs.problems[problemNumber -1], view);
    return view;
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
    window.onhashchange = function() {
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

learnjs.applyObject = function(obj, elm) {
  for(var key in obj) {
    elm.find('[data-name="' + key + '"]').text(obj[key]);
  }
}