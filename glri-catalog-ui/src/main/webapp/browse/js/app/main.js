'use strict';

/* Controllers */
var GLRICatalogApp = angular.module('GLRICatalogApp', ['ui.bootstrap']);


GLRICatalogApp.controller('CatalogCtrl', function($scope, $http, $filter, $timeout) {

	$scope.CONST = new Object();
	$scope.CONST.FOCUS_AREA_SCHEME = "https://www.sciencebase.gov/vocab/category/Great%20Lakes%20Restoration%20Initiative/GLRIFocusArea";
	$scope.CONST.TEMPLATE_SCHEME = "https://www.sciencebase.gov/vocab/category/Great%20Lakes%20Restoration%20Initiative/GLRITemplates";

	//storage of state that would not be preserved if the user were to follow a
	//link to the current page state.
	$scope.transient = new Object();
	

	$scope.transient.tabs = [
		{ title:'Home', isHome: false, items: []},
		{ title:'Toxic Substances', isHome: false, items: [
			{title:"INFO-SHEET: Toxic Substances and Areas of Concern Projects for the Great Lakes Restoration Initiative", url:"http://cida.usgs.gov/glri/infosheets/GLRI_1_Toxic_Substances.pdf"}
	
		]},
		{ title:'Invasive Species', isHome: false, items: [
			{title:"INFO-SHEET: Combating Invasive Species Projects for the Great Lakes Restoration Initiative", url:"http://cida.usgs.gov/glri/infosheets/GLRI_2_invasive_species.pdf"}
		]},
		{ title:'Nearshore Health', isHome: false, items: [
			{title:"INFO-SHEET: Nearshore Health and Watershed Protection Projects for the Great Lakes Restoration Initiative", url:"http://cida.usgs.gov/glri/infosheets/GLRI_3_Nearshore.pdf"}
		]},
		{ title:'Habitat & Wildlife', isHome: false, items: [
			{title:"INFO-SHEET: Habitat & Wildlife Protection and Restoration", url:"http://cida.usgs.gov/glri/infosheets/GLRI_4_Habitat_Restore.pdf"}
		]},
		{ title:'Accountability', isHome: false, items: [
			{title:"INFO-SHEET: Tracking Progress and Working with Partners Projects for the Great Lakes Restoration Initiative", url:"http://cida.usgs.gov/glri/infosheets/GLRI_5_Tracking_progress_working_w_partners.pdf"}
		]}
	];
	
	$scope.transient.currentItem = null;

	$scope.rawResult = null;	//array of all the returned items, UNprocessed

	//Called at the bottom of this JS file
	$scope.init = function() {
		$scope.loadProjectLists();
	};
	
	$scope.loadProjectLists = function() {

		$http.get($scope.buildDataUrl()).success(function(data, status, headers, config) {
			$scope.processProjectListResponse(data);
		}).error(function(data, status, headers, config) {
			alert("Unable to connect to ScienceBase.gov to find records.");
		});

	};
	
	$scope.processProjectListResponse = function(unfilteredJsonData) {
		$scope.rawResult = unfilteredJsonData;
		
		if (unfilteredJsonData) {
			
			var items = unfilteredJsonData.items;

			for (var i = 0; i < items.length; i++) {
				
				var item = $scope.processItem(items[i]);
				var tags = item.tags;
				
				if (tags) {
					for (var j = 0; j < tags.length; j++) {
						var tag = tags[j];
						if ($scope.CONST.FOCUS_AREA_SCHEME == tag.scheme) {
							var name = tag.name;
							$scope.addProjectToTabList(item, tag.name);
						}
					}
				}
				
			}
		}
	};
	
	$scope.processItem = function(item) {

		var link = item['link']['url'];
		item['url'] = link;
		item['mainLink'] = $scope.findLink(item["webLinks"], ["home", "html", "index page"], true);
		item['browseImage'] = $scope.findBrowseImage(item);

		//Have we loaded child records yet?  (hint: no)
		item['childRecordState'] = "notloaded";


		//build contactText
		var contacts = item['contacts'];
		var contactText = "";	//combined contact text
		var tags = item.tags;
		
		if (contacts) {
			for (var j = 0; j < contacts.length; j++) {

				if (j < 3) {
					var contact = contacts[j];
					var name = contact['name'];
					var type = contact['type'];

					if (type == null) type = "??";
					if (type == 'Principle Investigator') type = "PI";

					contactText+= name + " (" + type + "), ";
				} else if (j == 3) {
					contactText+= "and others.  "
				} else {
					break;
				}
			}
		}

		if (contactText.length > 0) {
			contactText = contactText.substr(0, contactText.length - 2);	//rm trailing ', '
		} else {
			contactText = "[No contact information listed]";
		}
		
		
		//Add template info
		item.templates = [];
		
		if (tags) {
			for (var j = 0; j < tags.length; j++) {
				var tag = tags[j];
				if ($scope.CONST.TEMPLATE_SCHEME == tag.scheme) {
					item.templates.push(tag.name);
				}
			}
		}

		item['contactText'] = contactText;
		return item;
	};
	
	/**
	 * Finds a link from a list of ScienceBase webLinks based on a list
	 * of search keys, which are searched for in order against the
	 * 'rel' and 'title' fields of each link.
	 * 
	 * The GLRI project will mark the homepage link with 'rel' == 'home'.
	 * The current Pubs are pushed into ScienceBase w/ 'title' == 'html'
	 * for an (approximate) home page.
	 * 
	 * The return value is an associative array where the title can be used for dispaly:
	 * {url, title}
	 * 
	 * If no matching link is found, null is returned.
	 * 
	 * @param {type} linkArray Array taken from ScienceBase search response webLinks.
	 * @param {type} searchArray List of link 'rel' or 'titles' to search for, in order.
	 * @param {type} defaultToFirst If nothing is found, return the first link if true.
	 * @returns {url, title} or null
	 */
	$scope.findLink = function(linkArray, searchArray, defaultToFirst) {

		if (linkArray && linkArray.length > 0) {

			var retVal = {url: linkArray[0].uri, title: "Home Page"};

			for (var searchIdx = 0; searchIdx < searchArray.length; searchIdx++) {
				var searchlKey = searchArray[searchIdx];
				for (var linkIdx = 0; linkIdx < linkArray.length; linkIdx++) {
					if (linkArray[linkIdx].rel == searchlKey) {
						retVal.url = linkArray[linkIdx].uri;
						retVal.title = $scope.cleanTitle(linkArray[linkIdx].title, "Home Page");
						return retVal;
					} else if (linkArray[linkIdx].title == searchlKey) {
						retVal.url = linkArray[linkIdx].uri;
						retVal.title = $scope.cleanTitle(linkArray[linkIdx].title, "Home Page");
						return retVal;
					}
				}
			}

			if (defaultToFirst) {
				retVal.title = linkArray[0].title;
				return retVal;
			} else {
				return null;
			}
		} else {
			return null;
		}
	};
	
	/**
	 * Replaces boilerplate link titles from ScienceBase w/ a default one if the proposed one is generic.
	 * @param {type} proposedTitle
	 * @param {type} defaultTitle
	 * @returns The passed title or the default title.
	 */
	$scope.cleanTitle = function(proposedTitle, defaultTitle) {
		var p = proposedTitle;
		if (! (p) || p == "html" || p == "jpg" || p == "unspecified") {
			return defaultTitle;
		} else {
			return p;
		}
	};
	
	$scope.findBrowseImage = function(item) {
		var webLinks = item.webLinks;
		if (webLinks) {
			for (var i = 0; i < webLinks.length; i++) {
				var link = webLinks[i];
				if (link.type == "browseImage") {
					return link.uri;
				}
			}
		}
		
		return null;
	};
	
	/**
	 * Adds an Item returned from the ScienceBase query to the tab data structure.
	 * 
	 * @param {type} sbItem
	 * @param {type} focusArea
	 * @returns {undefined}
	 */
	$scope.addProjectToTabList = function(sbItem, focusArea) {
		for (var i = 0; i < $scope.transient.tabs.length; i++) {
			var tab = $scope.transient.tabs[i];
			if (focusArea == tab.title) {
				tab.items.push(
					{
						title: sbItem.title,
						id: sbItem.id,
						item: sbItem
					}
				);
			}
		}
	};
	
	$scope.loadProjectDetail = function(item) {
		$scope.transient.currentItem = item;
	}
	
	
	$scope.getBaseQueryUrl = function() {
		return "../ScienceBaseService?";
	};

	$scope.buildDataUrl = function() {
		var url = $scope.getBaseQueryUrl();
		url += "resource=" + encodeURI("Project&");
		url += "fields=" + encodeURI("tags,title,summary,contacts,hasChildren,webLinks");
		
		return url;
	};

	$scope.init();
});
