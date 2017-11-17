describe('lambda function', function() {
  var index = require('index');
  var context;

  beforeEach(function() {
    context = jasmine.createSpyObj('context', ['succeed', 'fail']);
    index.dynamodb = jasmine.createSpyObj('dynamo', ['scan']);
  });

  describe('echo', function() {
    it('returns a result', function() {
      index.echo({}, context);
      expected = ["Hello from the cloud! You sent {}"];
      expect(context.succeed).toHaveBeenCalledWith(expected);
    });
  });

  describe('popularAnswers', function(){
    it('requests problems with the given problem number', function() {
      index.popularAnswers({problemNumber: 42}, context)
      expect(index.dynamodb.scan).toHaveBeenCalledWith({
        FilterExpression: "problemId = :problemId",
        ExpressionAttributeValues: { ":problemId": 42 },
        TableName: 'learnjs'
      }, jasmine.any(Function))
    })
  });
});
