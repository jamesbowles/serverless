var http = require('http');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var config = {
  dynamoTableName: 'learnjs'
};

exports.dynamodb = new AWS.DynamoDB.DocumentClient();

exports.popularAnswers = function (json, context) {
  exports.dynamodb.scan({
    FilterExpression: "problemId = :problemId",
    ExpressionAttributeValues: {
      ":problemId": json.problemNumber
    },
    TableName: config.dynamoTableName
  }, function (err, data) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed(data.Items.map(function (x) {
        return x.answer
      }).reduce(function (map, val) {
        map[val] = (map[val] || 0) + 1;
        return map;
      }, {})
      )
    }
  })
}

exports.echo = function (json, context) {
  context.succeed(["Hello from the cloud! You sent " + JSON.stringify(json)]);
};