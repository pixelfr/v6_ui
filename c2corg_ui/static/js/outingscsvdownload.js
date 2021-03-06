goog.provide('app.OutingsCsvDownloadController');
goog.provide('app.outingsCsvDownloadDirective');

goog.require('app');


/**
 * This directive is used to display a download button for outings in CSV format.
 *
 * @return {angular.Directive} The directive specs.
 * @ngInject
 */
app.outingsCsvDownloadDirective = function() {
  return {
    restrict: 'E',
    controller: 'AppOutingsCsvDownloadController',
    controllerAs: 'csvCtrl',
    templateUrl: '/static/partials/outingscsvdownload.html'
  };
};

app.module.directive('appOutingsCsvDownload', app.outingsCsvDownloadDirective);


/**
 * @param {app.Authentication} appAuthentication
 * @param {app.Api} appApi The API service
 * @param {angular.$q} $q Angular q service.
 * @param {app.Lang} appLang Lang service.
 * @constructor
 * @struct
 * @ngInject
 */
app.OutingsCsvDownloadController = function(appAuthentication, appApi, $q,
    appLang) {

  /**
   * @type {app.Authentication}
   * @export
   */
  this.auth = appAuthentication;

  /**
   * @type {app.Api}
   * @export
   */
  this.appApi = appApi;

  /**
   * @type {angular.$q}
   * @private
   */
  this.q_ = $q;

  /**
   * @type {app.Lang}
   * @private
   */
  this.langService_ = appLang;
};


/**
 * @param {goog.events.Event | jQuery.Event} event
 * @export
 */
app.OutingsCsvDownloadController.prototype.download = function(event) {
  event.stopPropagation();
  var filename = 'outings.csv';
  var langService = this.langService_;
  this.getOutings_().then(function(outings) {
    var csvFile = '';
    outings.forEach(function(outing) {
      var cells = [
        outing.date_start,
        outing.locales[0].title,
        outing.activities.map(function(activity) {
          return langService.translate(activity);
        }).join(';'),
        'https://www.camptocamp.org/outings/' + outing.document_id
      ];
      csvFile += '"' + cells.map(function(cell) {
        if (cell.indexOf('"') > -1) {
          return cell.replace(/"/g,'""');
        }
        return cell;
      }).join('","') + '"\n';
    });
    var blob = new Blob([csvFile], {type: 'text/csv;charset=utf-8;'});
    if (window.navigator.msSaveBlob) { // IE 10+
      window.navigator.msSaveBlob(blob, filename);
    } else {
      var link = document.createElement('a');
      if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  });
};


/**
 * @private
 * @returns {!angular.$q.Promise}
 */
app.OutingsCsvDownloadController.prototype.getOutings_ = function() {
  var promise = this.q_.defer().promise; // a promise that does... nothing
  var userId = this.auth.userData.id;
  var appApi = this.appApi;
  var $q = this.q_;
  return appApi.listDocuments('outings', 'u=' + userId, promise)
    .then(function(resp) {
      var total = resp.data.total;
      var outings = resp.data.documents.slice();
      if (total > resp.data.documents.length) {
        // retrieve all other outings
        var offsets = Array.apply(null, Array(Math.floor(total / 30)))
          .map(function(value, index) {
            return 30 * (index + 1);
          });
        var additionalRequests = [];
        offsets.forEach(function(offset) {
          additionalRequests.push(appApi.listDocuments('outings',
              'u=' + userId + '&offset=' + offset, promise));
        });
        return $q.all(additionalRequests).then(function(results) {
          results.forEach(function(result) {
            outings = outings.concat(result.data.documents)
              .sort(function(o1, o2) {
                return Date.parse(o1.date_start) - Date.parse(o2.date_start);
              });
          });
          return outings;
        });
      } else {
        return outings;
      }
    });
};


app.module.controller(
  'AppOutingsCsvDownloadController', app.OutingsCsvDownloadController);
