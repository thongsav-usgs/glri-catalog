'use strict';

GLRICatalogApp.service('ProjectManager', 
['Status', 'ScienceBase',
function(Status, ScienceBase) {
	
	var ctx = this;
	

	ctx.setProjectDetail = function(projectItem) {
		Status.currentItem = projectItem;
		ScienceBase.loadChildItems(projectItem)
		
		if ( window.location.href.indexOf('locahost')===-1 ) {
			if ( angular.isDefined(projectItem) 
			  && angular.isDefined(projectItem.title) ) {
				ga('send', 'screenview', {
					'screenName': projectItem.id +":"+ projectItem.title
				});
			}
		} else {
			console.log("localhost - bipass ga submit"); 
		}
	}
	
}])