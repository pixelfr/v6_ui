goog.provide('app.ForumFeedController');

goog.require('app');
goog.require('app.Api');


/**
 * @param {app.Api} appApi Api service.
 * @constructor
 * @ngInject
 */
app.ForumFeedController = function(appApi) {

  /**
   * @type {Array.<Object>}
   * @export
   */
  this.topics = [];

  /**
   * @type {boolean}
   * @export
   */
  this.busyForum = true;

  /**
   * @type {boolean}
   * @export
   */
  this.errorForum = false;

  appApi.readLatestForumTopics().then(function(response) {
    this.busyForum = false;
    this.handleTopics_(response);
  }.bind(this), function() { // Error msg is shown in the api service
    this.busyForum = false;
    this.errorForum = true;
  }.bind(this));
};


/**
 * @param response
 * @private
 */
app.ForumFeedController.prototype.handleTopics_ = function(response) {
  var data = response['data'];
  this.errorForum = !('users' in data);
  if (!this.errorForum) {
    var postersAvatar = {};
    for (var j = 0, n = data['users'].length, user; j < n; j++) {
      user = data['users'][j];
      postersAvatar[user['username']] = user['avatar_template'].replace('{size}', '24');
    }

    for (var i = 0, l = data['topic_list']['topics'].length, topic; i < l; i++) {
      topic = data['topic_list']['topics'][i];
      topic['avatar_template'] = postersAvatar[topic['last_poster_username']];
      this.topics.push(topic);
    }
  }
};

app.module.controller('appForumFeedController', app.ForumFeedController);
