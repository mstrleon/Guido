'use strict';

angular.module('Guido.controllers', [])

    .controller('AppCtrl', ['$rootScope',
        '$scope',
        '$ionicModal',
        '$timeout',
        'poiDataService',
        '$cordovaGeolocation',
        'leafletData',
        'tripFactory',
        'savedTripsFactory',
        'config',
        '$ionicSlideBoxDelegate',
        '$ionicSideMenuDelegate',
        '$ionicPopover',
        '$ionicPopup',
        '$state',
        '$filter',
        '$location',
        '$window',
        'nearMeService',
        '$ionicHistory',
        '$stateParams',
        'loginService',
        'mapService',
        'historyService',
        '$ionicPlatform',
        '$cordovaLocalNotification',
        'favoritesService',
        'Analytics',
        '$interval',
        '$cordovaNetwork',


        function ($rootScope,
                  $scope,
                  $ionicModal,
                  $timeout,
                  poiDataService,
                  $cordovaGeolocation,
                  leafletData,
                  tripFactory,
                  savedTripsFactory,
                  config,
                  $ionicSlideBoxDelegate,
                  $ionicSideMenuDelegate,
                  $ionicPopover,
                  $ionicPopup,
                  $state,
                  $filter,
                  $location,
                  $window,
                  nearMeService,
                  $ionicHistory,
                  $stateParams,
                  loginService,
                  mapService,
                  historyService,
                  $ionicPlatform,
                  $cordovaLocalNotification,
                  favoritesService,
                  Analytics,
                  $interval,
                  $cordovaNetwork
            ) {

            /**
             *  Google Analytics tracking events
             *
             */

            $rootScope.$on('addingPoi', function (event, data) {
                Analytics.trackEvent('POI', 'Add to TripList', data.name, data.id.toString());
            });
            $rootScope.$on('removingPoi', function (event, data) {
                Analytics.trackEvent('POI', 'Remove From TripList', $rootScope.poiDataList[data].name, data);
            });

            var first_nearme = false;
            var first_newtrip = false;

            $rootScope.$on('$stateChangeSuccess', function (event, data) {

                //skipping first initial nearme and newtrip pages.
                if ($state.current.name == 'app.nearme') {
                    if (!first_nearme) {
                        first_nearme = true;
                        return;
                    }
                }
                if ($state.current.name == 'app.newtrip') {
                    if (!first_newtrip) {
                        first_newtrip = true;
                        return;
                    }
                }

                Analytics.trackPage($state.current.name, $state.current.showname);
            });
            $rootScope.$on('AddedFavorite', function (event, data) {
                Analytics.trackEvent('POI', 'Added Favorite', $rootScope.poiDataList[data].name, data);
            });
            $rootScope.$on('RemovedFavorite', function (event, data) {
                Analytics.trackEvent('POI', 'Removed Favorite', $rootScope.poiDataList[data].name, data);
            });
            $rootScope.$on('PoiSeen', function (event, data) {
                Analytics.trackEvent('POI', 'Poi has seen by user', $rootScope.poiDataList[data].name, data);
            });
            $rootScope.$on('PushNotify', function (event, data) {
                Analytics.trackEvent('Coupon', 'Alert sent', $rootScope.poiDataList[data.id].name, data.id);
            });
            $rootScope.$on('TransactionSuccessful', function (event, data) {
                Analytics.trackEvent('Coupon', 'Transaction successful', data.poi.name + ' poi id:' + data.poi.id.toString(), data.numguest);
            });


            var startTime = new Date();

            Analytics.trackEvent('Timing', 'App has started', '0 s', 0);

            var sendUseTime = function () {
                var useTime = new Date() - startTime;
                Analytics.trackEvent('Timing', 'App is running', $rootScope.seconds2time(useTime / 1000), useTime);
            };

            var timingInterval = $interval(sendUseTime, 10000);


            /**
             *  END  Google Analytics tracking events
             *
             */




            /**
             *  Transition to  PoiDetail page
             */


            $rootScope.poiDetailShow = function (pid, parent) {

                $scope.poi = $rootScope.poiDataList[pid];

                $ionicHistory.nextViewOptions({
                    historyRoot: false,
                    disableBack: false
                });

                $state.go('app.poidetails', {id: pid});

            };


            /**
             * END transition to Poi detail page
             */


            /**
             *  removeSeen - removing POI from history list
             * @param pid
             */

            $rootScope.removeSeen = function (pid) {
                $rootScope.showConfirm = function () {
                    var confirmPopup = $ionicPopup.confirm({
                        template: 'Are you sure to remove <b>' + $rootScope.poiDataList[pid].name + '</b> from visited history?'
                    });

                    confirmPopup.then(function (res) {
                        if (res) {
                            historyService.removeSeen(pid).query(
                                function (r) {
                                    historyService.updateSeen();
                                },
                                function (e) {
                                    console.log('Error on remove', e);
                                }
                            );
                        } else {

                        }
                    });
                };
                $rootScope.showConfirm();
            };

            /**
             *  END removeSeen ();
             */

            $rootScope.inFavorites = favoritesService.inFavorites;


            $rootScope.toggleFavorites = function (pid) {
                console.log('toggle favs', pid, $rootScope.favorites);
                if ($rootScope.inFavorites(pid)) {
                    $rootScope.removeFavorite(pid);
                } else {
                    $rootScope.addFavorite(pid);
                }
            };


            /**
             *  removeFavorite - removing POI from favs list
             * @param pid
             */

            $rootScope.removeFavorite = function (pid) {
                $rootScope.showConfirm = function () {
                    var confirmPopup = $ionicPopup.confirm({
                        template: 'Are you sure to remove <b>' + $rootScope.poiDataList[pid].name + '</b> from Favorites list?'
                    });

                    confirmPopup.then(function (res) {
                        if (res) {
                            favoritesService.removeFavorite(pid).query(
                                function (r) {
                                    $rootScope.$broadcast('RemovedFavorite', pid);
                                    favoritesService.updateFavorites();
                                },
                                function (e) {
                                    console.log('Error on remove favorite', e);
                                }
                            );
                        } else {

                        }
                    });
                };
                $rootScope.showConfirm();
            };

            /**
             *  END removeFavorite ();
             */

            /**
             *  addFavorite - adding  POI from
             * @param pid
             */

            $rootScope.addFavorite = function (pid) {
                $rootScope.showConfirm = function () {
                    var confirmPopup = $ionicPopup.confirm({
                        template: 'Do you want to add <b>' + $rootScope.poiDataList[pid].name + '</b> to Favorites list?'
                    });

                    confirmPopup.then(function (res) {
                        if (res) {
                            favoritesService.addFavorite(pid).query(
                                function (r) {
                                    $rootScope.$broadcast('AddedFavorite', pid);
                                    favoritesService.updateFavorites();
                                },
                                function (e) {
                                    console.log('Error on add favorite', e);
                                }
                            );
                        } else {

                        }
                    });
                };
                $rootScope.showConfirm();
            };

            /**
             *  END addFavorite ();
             */


            /**
             *  Create enter PIN modal Manager
             */

            $ionicModal.fromTemplateUrl('templates/modal-enterpin.html', {
                scope: $scope,
                animation: 'slide-left-right'
            }).then(function (modal) {
                $rootScope.enterpin = modal;
            });


            $rootScope.closeEnterPIN = function () {
                $rootScope.enterpin.hide();
            };


            $rootScope.enterPINShow = function (pid, parent) {

                $scope.poi = $rootScope.poiDataList[pid];


                if (parent)
                    $scope.poi.parent = parent;
                else
                    $scope.poi.parent = $scope.poi.name;

                //console.log('enterpin', $scope.poi);
                $rootScope.enterpin.show();
            };

            /**
             * END creation of enter PIN modal
             */


            /**
             *
             * Take me to Hotel
             *
             */

            $rootScope.takeToHotel = function () {
                $rootScope.takeMeThere(55);
            };

            /***
             * END take me to hotel
             */

            /**
             * Solving goto map issue
             */

            $rootScope.gotoMap = function () {
                $ionicHistory.nextViewOptions({

                    historyRoot: false,

                    disableBack: true
                });
                $state.go('app.mapview', $stateParams, {location: 'replace'})
            };

            $rootScope.gotoCurrentTrip = function () {
                $rootScope.gotoMap();
            };


            /**
             *  END solving goto map issue
             *
             */


            /***
             *  Dealing with 'Take Me There' situation
             *
             */

            $rootScope.takeMeThere = function (pid, gotomap) {

                $rootScope.newtrip = {
                    name: ''
                }

                var data = $rootScope.poiDataList[pid];


                if (tripFactory.inTrip(pid)) {
                    //just set the priority to this pid
                    leafletData.getMap().then(function (map) {

                        var wps = $rootScope.control.getWaypoints();
                        //console.log('before', wps, pid);
                        var current_index = 0;
                        for (var i = 0; i < wps.length; i++) {
                            if (wps[i].id == pid) {
                                current_index = i;
                                //console.log('found at', current_index);
                            }
                        }

                        if (current_index > 0) {

                            var cur = $rootScope.control.spliceWaypoints(1, 0, wps[current_index]);
                            //console.log($rootScope.control.getWaypoints());
                            $rootScope.control.spliceWaypoints(current_index + 1, 1);
                            //console.log($rootScope.control.getWaypoints());

                            $rootScope.locateAndRoute();

                            //$rootScope.control.route();
                        }

                    });


                } else { // if (tripFactory.inTrip(pid))

                    if ($rootScope.TripList.length > 0) {   // not in triplist, but triplist > 0
                        $rootScope.showConfirmPopup = function () {  // Ask to save current triplist first
                            var confirmPopup = $ionicPopup.show({
                                template: '',
                                title: 'Would you like to save your current trip list first?',
                                scope: $rootScope,
                                buttons: [

                                    {
                                        text: 'No',
                                        type: 'button-light',
                                        onTap: function (e) {
                                            return 1;

                                        }
                                    },

                                    {
                                        text: '<b>Yes</b>',
                                        type: 'button-dark',
                                        onTap: function (e) {

                                            return 2;

                                        }
                                    }
                                ]

                            }); // END var confirmPopup = $ionicPopup.show

                            confirmPopup.then(function (confirmres) {
                                if (confirmres == 2) {  // you said  yess - save!

                                    $rootScope.showSaveTripPopup = function () {
                                        // An elaborate, custom popup
                                        var saveTripPopup = $ionicPopup.show({
                                            template: '<input type="text" ng-model="newtrip.name">',
                                            title: 'Enter trip Name:',
                                            scope: $rootScope,
                                            buttons: [
                                                {text: 'Cancel'},
                                                {
                                                    text: '<b>Save</b>',
                                                    type: 'button-dark',
                                                    onTap: function (e) {
                                                        if (!$rootScope.newtrip.name) {

                                                            e.preventDefault();
                                                        } else {
                                                            return $rootScope.newtrip.name;
                                                        }
                                                    }
                                                }
                                            ]
                                        });

                                        saveTripPopup.then(function (res) {
                                            //console.log('Tapped!', res);

                                            var triptosave = {
                                                name: $filter('onlyLetters')(res),
                                                poiList: angular.copy(tripFactory.getTrip())

                                            };

                                            //console.log('to save', triptosave);
                                            savedTripsFactory.addTrip(triptosave);
                                            //console.log(savedTripsFactory.getSavedTrips());
                                            tripFactory.initTripList(pid);

                                        });
                                    }; //   END rootScope.showSaveTripPopup = function ()
                                    $rootScope.showSaveTripPopup();


                                } else if (confirmres == 1) {
                                    tripFactory.initTripList(pid);
                                } else {
                                    return;
                                }

                            }); //  END confirmPopup.then(function (confirmres)
                        } // END $rootScope.showConfirmPopup = function ()

                        $rootScope.showConfirmPopup();

                    } else //  if ($rootScope.TripList.length > 0)
                    {
                        tripFactory.addToTrip(pid);
                    }
                    // clear triplist and add this


                } //   else { // if (tripFactory.inTrip(pid))


            }; // $rootScope.takeMeThere = function (pid) {


            /**
             * END Take Me there
             */

            /**
             *      Create new trip
             *
             */

            $rootScope.createNewTrip = function () {
                if ($rootScope.TripList.length > 0) {   // not in triplist, but triplist > 0
                    $rootScope.showConfirmPopup = function () {  // Ask to save current triplist first
                        var confirmPopup = $ionicPopup.show({
                            template: '',
                            title: 'Would you like to save your current trip list first?',
                            scope: $rootScope,
                            buttons: [
                                {
                                    text: 'Close',
                                    type: 'button-light',
                                    onTap: function (e) {
                                        return 0;

                                    }

                                },
                                {
                                    text: 'No',
                                    type: 'button-light',
                                    onTap: function (e) {
                                        return 1;

                                    }
                                },

                                {
                                    text: '<b>Yes</b>',
                                    type: 'button-dark',
                                    onTap: function (e) {

                                        return 2;

                                    }
                                }
                            ]

                        }); // END var confirmPopup = $ionicPopup.show

                        confirmPopup.then(function (confirmres) {
                            if (confirmres == 2) {  // you said  yess - save!

                                $rootScope.showSaveTripPopup = function () {
                                    // An elaborate, custom popup
                                    var saveTripPopup = $ionicPopup.show({
                                        template: '<input type="text" ng-model="newtrip.name">',
                                        title: 'Enter trip Name:',
                                        scope: $rootScope,
                                        buttons: [
                                            {text: 'Cancel'},
                                            {
                                                text: '<b>Save</b>',
                                                type: 'button-dark',
                                                onTap: function (e) {
                                                    if (!$rootScope.newtrip.name) {

                                                        e.preventDefault();
                                                    } else {
                                                        return $rootScope.newtrip.name;
                                                    }
                                                }
                                            }
                                        ]
                                    });

                                    saveTripPopup.then(function (res) {
                                        //console.log('Tapped!', res);

                                        var triptosave = {
                                            name: $filter('onlyLetters')(res),
                                            poiList: angular.copy(tripFactory.getTrip())

                                        };

                                        //console.log('to save', triptosave);
                                        savedTripsFactory.addTrip(triptosave);
                                        //console.log(savedTripsFactory.getSavedTrips());
                                        tripFactory.initTripList();
                                        $location.replace('#/app/newtrip');

                                    });
                                }; //   END rootScope.showSaveTripPopup = function ()
                                $rootScope.showSaveTripPopup();


                            } else if (confirmres == 1) {
                                tripFactory.initTripList();
                                $location.replace('#/app/newtrip');
                            } else {
                                return;
                            }

                        }); //  END confirmPopup.then(function (confirmres)
                    } // END $rootScope.showConfirmPopup = function ()

                    $rootScope.showConfirmPopup();

                }


            };
            /**
             *
             * END Create New Trip;
             */


            /**
             * Poi Map popover
             */



            $rootScope.doTheTrack = function () {

            }


            $ionicPlatform.ready(function () {

                $rootScope.$on('$stateChangeSuccess', function (event, data) {
                    console.log(event, data, $state.current.name);
                });
            });



            $rootScope.$on("$stateChangeSuccess", function (event, data) {

                $rootScope.page = $state;
                $rootScope.page.name = $state.current.name;
                $rootScope.page.title = $state.current.showname;


                if (data.name === 'app.mapview' || data.name === 'app.savedtrips') {
                    $ionicSideMenuDelegate.canDragContent(false);

                } else {
                    $ionicSideMenuDelegate.canDragContent(true);
                }

            });

            /**
             *  function that sends Push notification
             *
             */


            $rootScope.sendPushPoi = function (poi) {

                $ionicPlatform.ready(function () {
                    console.log($cordovaLocalNotification);
                    $rootScope.$broadcast('PushNotify', poi);

                    var id = poi.id;
                    //if (!$rootScope.sentalarm) {

                    $timeout (
                        function () {
                            var confirmGo = $ionicPopup.alert({
                                template: 'You are close to <b>' + poi.name + '</b> with a special offer.<br>' +
                                '<a ng-href="#app/poi/'+id+'">Click here to take a look</a>'
                            });
                        },
                        1000
                    );

                    if (typeof cordova !== 'undefined') {

                        cordova.plugins.notification.local.schedule({
                            id: poi.id,
                            title: "You are close to " + poi.name,
                            text: poi.name + ' has a special offer for you.',
                            icon: 'http://sciactive.com/pnotify/includes/github-icon.png',
                            smallIcon: 'http://sciactive.com/pnotify/includes/github-icon.png'
                            //icon: $rootScope.baseURL+$rootScope.poiDataList[poi.id].image_thumb

                        }).then(function () {
                                console.log('You are close to a place with promotion', poi.name);




                            },
                            function () {
                                console.log('Failed to add Notification ', poi.name);
                            });

                        cordova.plugins.notification.local.on("click", function (notification) {
                            //$state.go('app.currenttrip');
                        });


                    }

                });


            };


            if (window.cordova) {
                document.addEventListener("deviceready", function () {
                    window.plugin.notification.local.onclick = onNotificationClick;
                }, false);
            }

            var onNotificationClick = function () {
                $state.go('app.currenttrip');
            }


            $rootScope.logout = function () {


                var confirmLogout = $ionicPopup.confirm({
                    template: 'Are you sure to logout?'
                });

                confirmLogout.then(function (res) {
                    if (res) {
                        loginService.logout();
                        // $scope.closeTripDetail();
                        //$location.replace('app/currenttrip');
                    } else {

                    }
                });

            };


            if (!loginService.isAuthenticated()) {
                console.log('not auth');
                $timeout($state.transitionTo('login'), 1500);
            }


        }
    ])


    .controller('EnterUserPinCtrl', [
        '$scope',
        '$rootScope',
        'UserPINService',
        'loginService',
        'poiDataService',
        '$ionicPopup',
        'config',
        '$state',
        '$localStorage',
        '$timeout',
        function ($scope,
                  $rootScope,
                  UserPINService,
                  loginService,
                  poiDataService,
                  $ionicPopup,
                  config,
                  $state,
                  $localStorage,
                  $timeout) {


            $rootScope.partners_received = false;
            $rootScope.ApiKeyReceived = false;

            $scope.pinarray = [];
            $scope.showpsin = false;


            $scope.dial = function (num) {
                $scope.pinarray.push(num);
                //console.log($scope.pinarray);
                if ($scope.pinarray.length == 4) {
                    $scope.user_pin = parseInt($scope.pinarray.join(""));
                    sendPIN();

                     ///ONLY FOR TEST
                    /*
                     $rootScope.apiKey = config.token;
                     $rootScope.customerID = 1;

                     var token = {key: $rootScope.apiKey, customerID: $rootScope.customerID};

                     $localStorage.storeObject('apikey', token);
                     $rootScope.ApiKeyReceived = true;
                     $rootScope.$broadcast('ApiKeyReceived');
                     loginService.login();
                     $state.go('app.newtrip');
                     */

                }
            };


            var loginFailed = function () {
                $scope.pinarray = [];
            }


            var sendPIN = function () {
                $scope.showspin = true;




                console.log ('try connect');



                UserPINService.auth($scope.user_pin).query(
                    function (response) {
                        console.log('UserPINService.auth response', response);
                        if (response.type_string=='Error') {
                         $scope.showspin = false;
                         loginFailed();
                         return;
                         } else {
                         $rootScope.apiKey = response.api_key;
                         $rootScope.customerID = response.customer_id;
                         console.log('$rootScope.apiKey $rootScope.customerID', $rootScope.apiKey, $rootScope.customerID);
                         }
                        // for testing
                        //$rootScope.apiKey = config.token;
                       // $rootScope.customerID = 1;

                        var token = {key: $rootScope.apiKey, customerID: $rootScope.customerID};

                        $localStorage.storeObject('apikey', token);
                        $rootScope.ApiKeyReceived = true;
                        $rootScope.$broadcast('ApiKeyReceived');
                        loginService.login();
                        $state.go('app.newtrip');
                        $state.go('app.nearme');
                        $timeout(function () {
                            $state.go('app.newtrip');
                        }, 2000);

                        // }

                    },
                    function (response) {
                        console.log("Error: " + response.status + " " + response.statusText);
                        $scope.message = "Error: " + response.status + " " + response.statusText;
                        loginFailed();
                    }
                )

            }

            /*



             */

        }])


    .controller('PoiFilterController', [
        '$scope',
        '$rootScope',
        'poiFilterService',
        '$timeout',
        '$state',
        function ($scope,
                  $rootScope,
                  poiFilterService,
                  $timeout,
                  $state
        ) {

            $rootScope.sel_poi_types = [];
            $rootScope.poitypes = [];

            $rootScope.list_by_distance = false;
            $rootScope.route_off = false;
            $rootScope.time_for_visit = 13;
            $rootScope.shorter_longer_visit = 1;


            /**
             *  Dealing with tags
             *
             */


            var getTags = function () {
                poiFilterService.getPoiTypes().query(
                    function (response) {
                        $rootScope.poitypes = response['children_poi_types'];
                        //console.log('poitypes', $rootScope.poitypes);
                        $rootScope.$emit('Poitypes_received');
                        // here  is defined, what poi types we can see by default
                        selectAll();
                    },
                    function (response) {
                        $scope.message = "Error: " + response.status + " " + response.statusText;
                    }
                );
            }


            if ($rootScope.ApiKeyReceived) {
                getTags();
            } else {
                $rootScope.$on('ApiKeyReceived', function () {
                    getTags();
                });
            }


            $rootScope.filterByType = function (poi) {
                if (!poi.poi_type_id) {
                    return false;
                    // poi[id]
                }

                return ($rootScope.sel_poi_types.indexOf(poi.poi_type_id) !== -1);
            };

            $rootScope.filterByTypeByPID = function (pid) {
                if (!pid) return null;
                pid = pid.id;
                if (!$rootScope.poiDataList[pid]) return false;  // attentive to this! - we may skip loading smth
                return ($rootScope.filterByType($rootScope.poiDataList[pid]));
            };


            $rootScope.filterByTypeByID = function (poi) {
                ////console.log(poi);
                var pid = poi.id;
                if (!$rootScope.poiDataList[pid]) return false;  // attentive to this! - we may skip loading smth
                return ($rootScope.filterByType($rootScope.poiDataList[pid]));
            };


            var selectAll = function () {
                $rootScope.sel_poi_types = [];
                $rootScope.poitypes.forEach(function (type) {
                    $rootScope.sel_poi_types.push(type.id);
                });
            };

            $rootScope.toggleSel = function (val) {
                //console.log(val);
                var ind = $rootScope.sel_poi_types.indexOf(val);

                if (ind < 0) {
                    $rootScope.sel_poi_types.push(val);
                    $rootScope.$broadcast('sel_types_changed', val);
                } else {
                    $rootScope.sel_poi_types.splice(ind, 1);
                    $rootScope.$broadcast('sel_types_changed', val);
                }
            };


            $rootScope.isTypeSelected = function (type) {
                if ($rootScope.sel_poi_types.indexOf(type) < 0) {
                    return false;
                } else {
                    return true;
                }
            };

            /**
             * END dealing with tags
             */


            /**
             *  Dealing with duration limiter
             *
             */


            $rootScope.upper_time_limiter = 10000;
            $rootScope.lower_time_limiter = -1;

            $rootScope.timeVisitMove = function (val) {
                $scope.val = val;
                $timeout (function () {
                    var val = $scope.val;
                    $rootScope.shorter_longer_visit = val;
                    if (val == 0) {   // shorter - less than hour
                        $rootScope.upper_time_limiter = 59;
                        $rootScope.lower_time_limiter = 0;
                    } else if (val == 2) { // longer - more than hour
                        $rootScope.lower_time_limiter = 59;
                        $rootScope.upper_time_limiter = 10000;
                    } else { //both
                        $rootScope.upper_time_limiter = 10000; // no limit
                        $rootScope.lower_time_limiter = -1;
                    }
                    $rootScope.$broadcast('time_visit_change');


                } , 200);
                //console.log ('timeVisitMove', $rootScope.shorter_longer_visit, val);


            }

            $rootScope.filterByDurationByPID = function (poi) {
                var pid = poi.id;
                if (!$rootScope.poiDataList[pid]) return false;  // attentive to this! - we may skip loading smth

                return ($rootScope.filterByDuration($rootScope.poiDataList[pid]));
            }


            $rootScope.filterByDuration = function (poi) {

                // //console.log (poi, $rootScope.lower_time_limiter, $rootScope.upper_time_limiter  );

                if (poi.visit_duration <= $rootScope.upper_time_limiter &&
                    poi.visit_duration >= $rootScope.lower_time_limiter
                ) {
                    return true;
                } else {
                    return false;
                }

            };

            /**
             *  END dealing with duration limiter
             *
             */

            /**
             *  Dealing with Trip Off Trip ON
             *
             */
/*
            $scope.$watch('route_off', function (newValue, oldValue) {
                //console.log(newValue);
                $rootScope.$broadcast('Trip_Off', newValue);

            });
*/
            $scope.toggleRouteOff = function (val) {

                $timeout (function () {

                    if (val === true || val === false) {
                        $rootScope.route_off = val;
                    } else {
                        $rootScope.route_off  = ! $rootScope.route_off;
                    }

                    $rootScope.$broadcast('Trip_Off', $rootScope.route_off);

                }, 300 );



            }


            /**
             *  END Dealing with Trip Off Trip ON
             *
             */


            /**
             * Dealing with order by
             *
             */
            $rootScope.name_distance_order = 'name';
            $scope.$watch('list_by_distance', function (newValue, oldValue) {
                console.log ('listbydistance', newValue);
                $timeout (
                    function () {
                        if (newValue) {

                            var min_dist  = 100000000;
                            var pid_min_dist = 0;
                            if (!$rootScope.show_search_res || $state.current.name !='app.newtrip') {
                                for (var i = 1; i < $rootScope.poiDataList.length; i++) {

                                    if (typeof $rootScope.poiDataList[i] != 'object') continue;
                                    $rootScope.poiDataList[i].distance = $rootScope.getDistanceFromLatLonInKm
                                    (
                                        $rootScope.poiDataList[i].lat,
                                        $rootScope.poiDataList[i].lon,
                                        $rootScope.user_lat,
                                        $rootScope.user_lon
                                    );

                                    console.log ('dist', $rootScope.poiDataList[i].name, i, $rootScope.poiDataList[i].distance);
                                    if ($rootScope.poiDataList[i].distance < min_dist) {
                                        min_dist = $rootScope.poiDataList[i].distance;
                                        pid_min_dist = $rootScope.poiDataList[i].id
                                    }
                                }
                                console.log ('mindist = ', min_dist,  $rootScope.poiDataList[pid_min_dist], pid_min_dist);


                            } else { // if (!$rootScope.show_search_res || $state.current.name !='app.newtrip') {
                                for (var i = 1; i < $rootScope.poiUniqList.length; i++) {

                                    if (typeof $rootScope.poiUniqList[i] != 'object') continue;
                                    $rootScope.poiUniqList[i].distance = $rootScope.getDistanceFromLatLonInKm
                                    (
                                        $rootScope.poiUniqList[i].lat,
                                        $rootScope.poiUniqList[i].lon,
                                        $rootScope.user_lat,
                                        $rootScope.user_lon
                                    );

                                    console.log ('dist', $rootScope.poiUniqList[i].name, i, $rootScope.poiUniqList[i].distance);
                                    if ($rootScope.poiUniqList[i].distance < min_dist) {
                                        min_dist = $rootScope.poiUniqList[i].distance;
                                        pid_min_dist = $rootScope.poiUniqList[i].id
                                    }
                                }

                                console.log ('mindist = ', min_dist,  $rootScope.poiUniqList[pid_min_dist], pid_min_dist);
                            }

                            $rootScope.name_distance_order = 'distance';

                            //$rootScope.updatePoisInTree ($rootScope.city_tree)

                        } else {
                            $rootScope.name_distance_order = 'name';
                        }

                    },
                    300
                );
            });

            /**
             * END Dealing with orderby
             */


            /**
             *   Dealing vith Total time you have
             *
             */
            $scope.timeForVisitChanged = function (val) {
                if (val == 0) val = 0.9;
                $rootScope.time_for_visit = val
            }

        }])


    .controller('HomePageController', [
        '$scope',
        '$rootScope',
        '$ionicModal',
        'newTripService',
        'poiDataService',
        'config',
        function ($scope, $rootScope, $ionicModal, newTripService, poiDataService, config) {

            /**
             *  Create the CitySelect modal
             */

            $ionicModal.fromTemplateUrl('templates/modal-cityselect.html', {
                scope: $scope,
                animation: 'slide-left-right'
            }).then(function (modal) {
                $scope.cityselectmodal = modal;

                if ($rootScope.selcity !== -1) {
                    $scope.citySelectShow();
                }
            });


            $scope.closeCitySelect = function () {
                $scope.cityselectmodal.hide();
            };


            $scope.citySelectShow = function (pid, parent) {
                $scope.cityselectmodal.show();
            };


            $scope.citySelected = function (city) {
                $rootScope.selcity = city;
            };


            /**
             * END creation of CitySelect modal
             */


//+получить все дерево ( при инициализации хорошо бы )
//если город текущий определен - вывести город
//если не определен - вывести модальку с выбором города
//вывести город
//вывести типы заведений
//или вывести список ранжированный по типу заведения
//вывести заведения


        }])

    .controller('NearMeController', [
        '$scope',
        '$rootScope',
        'nearMeService',
        'poiDataService',
        'tripFactory',
        'config',
        '$ionicPopover',
        function ($scope, $rootScope, nearMeService, poiDataService, tripFactory, config, $ionicPopover) {


            $scope.pois_ids = [];

            // Making available trip factory functions

            $scope.toggleAddPoiToTrip = function (pid) {
                tripFactory.toggleAddRemoveInTrip(pid);
            };

            var lat = $rootScope.user_lat;
            var lon = $rootScope.user_lon;

            if ($rootScope.AllDataLoaded) {
                $rootScope.nearMeCheck();
            }


        }])

    .controller('HistoryController', ['$scope', 'historyService', 'poiDataService', 'tripFactory', 'config',
        function ($scope, historyService, poiDataService, tripFactory, config) {

            $scope.baseURL = config.baseURL;
            $scope.pois_ids = [];

            // Making available trip factory functions

            $scope.toggleAddPoiToTrip = function (pid) {
                tripFactory.toggleAddRemoveInTrip(pid);
            };

        }])

    .controller('FavoritesController', ['$scope', 'favoritesService', 'poiDataService', 'tripFactory', 'config',
        function ($scope, favoritesService, poiDataService, tripFactory, config) {

            // Making available trip factory functions
            $scope.toggleAddPoiToTrip = function (pid) {
                tripFactory.toggleAddRemoveInTrip(pid);
            };


        }])


    .controller('NewTripController', [
        '$scope',
        '$rootScope',
        'newTripService',
        'tripFactory',
        'ngProgressFactory',
        '$timeout',
        '$ionicModal',
        'loginService',
        function ($scope,
                  $rootScope,
                  newTripService,
                  tripFactory,
                  ngProgressFactory,
                  $timeout,
                  $ionicModal,
                  loginService) {

            $scope.showmain = false;

            $rootScope.show_search_res = false;

            $scope.search = {};

            $scope.toggleShowSearchRes = function () {
                $rootScope.show_search_res = !$rootScope.show_search_res;
            }

            $scope.mayBeShowSearchRes = function () {
                console.log($scope.search.name);
                if ($scope.search.name != '') {
                    $rootScope.show_search_res = true;
                }
            }


            /**
             *    Progress modal
             *
             */

            if ($rootScope.ApiKeyReceived) {

                $ionicModal.fromTemplateUrl('templates/modal-progress.html', {
                    scope: $scope,
                    animation: 'slide-left-right'
                }).then(function (modal) {
                    $scope.progressmodal = modal;
                    $scope.progressShow();
                    $scope.showmain = true;
                    $scope.preloaderProgress = ngProgressFactory.createInstance();
                    $scope.preloaderProgress.setParent(document.getElementById('preloader-progress'));
                    $scope.preloaderProgress.start();
                    $scope.preloaderProgress.setColor('#00d392');
                    $scope.preloaderProgress.setHeight('3px');

                    console.log('preloader', $scope.preloaderProgress);

                });

            } else {
                $rootScope.$on('ApiKeyReceived', function () {
                    $ionicModal.fromTemplateUrl('templates/modal-progress.html', {
                        scope: $scope,
                        animation: 'slide-left-right'
                    }).then(function (modal) {
                        $scope.progressmodal = modal;
                        $scope.progressShow();
                        $scope.showmain = true;
                        $scope.preloaderProgress = ngProgressFactory.createInstance();
                        $scope.preloaderProgress.setParent(document.getElementById('preloader-progress'));
                        $scope.preloaderProgress.start();
                        $scope.preloaderProgress.setColor('#00d392');
                        $scope.preloaderProgress.setHeight('3px');

                        console.log('preloader', $scope.preloaderProgress);

                    });
                });
            }

            $rootScope.poiUniqList = [];
            // Triggered in the poiprogress modal to close it

            $scope.closeProgress = function () {


                //console.log ($rootScope.poiUniqList);
                $scope.progressmodal.hide().then();
            };

            // Open the poidetail modal
            $scope.progressShow = function (pid, parent) {
                //console.log('poidetail', $scope.poi);
                $scope.progressmodal.show();
            };

            $rootScope.$on('AllDataLoaded',
                function () {
                    $scope.preloaderProgress.complete();
                    $timeout($scope.closeProgress, 2000);
                }
            );


            /**
             *    END  Progress modal
             */

            $scope.toggleAddPoiToTrip = function (pid) {
                tripFactory.toggleAddRemoveInTrip(pid);
            };

            /**
             *  Handling tree list
             *
             */

            $scope.PoisShown = false;
            $scope.shownGroup = null;


            $scope.emitEvent = function (item) {
                $scope.$emit('TreeList:ItemClicked', item);

                //console.log(item);
            };

            $scope.isPoiShown = function (group) {  // Show POIs of this group?
                return $scope.shownGroup === group;
            };

            $scope.openPois = function (item) {
                if ($scope.isPoiShown(item) && !item.children.collapsed) {
                    $scope.PoisShown = true;

                } else {
                    $scope.PoisShown = false;
                }

            };


            $scope.toggleShow = function (item) {
                toggleGroupShow(item); // open related groups
                togglePoiShow(item);   // also open or close related pois
            };

            var toggleGroupShow = function (obj) {
                for (var key in obj) {
                    if (obj[key] && typeof(obj[key]) == 'object') {
                        obj[key].collapsed = !obj[key].collapsed;
                        toggleGroupShow(obj[key])
                    }
                }
                return obj
            };

            var togglePoiShow = function (group) {
                if ($scope.isPoiShown(group)) { // close pois if
                    $scope.shownGroup = null;
                } else {
                    $scope.shownGroup = group;
                }
            };


            $scope.plusOrMinus = function (item) {
                var PLUS = true;
                var MINUS = false
                //      if pois collapsed true - show plus
                //      if chldran collapsed - show plus
                if (typeof item.children !== 'undefined' && item.children.collapsed === true) return PLUS;
                if (typeof item.pois !== 'undefined' && !$scope.isPoiShown(item)) return PLUS;
                //if (typeof item.pois!=='undefined' && item.pois.collapsed === false) return PLUS;
                return MINUS;
            };


            /**
             *  END handling tree
             */



            $scope.orderDistNameCompare = function (v1, v2) {

                //console.log ('orderCompare',v1, v2);

                if ($rootScope.name_distance_order == 'distance') {
                    return ( $rootScope.poiDataList[v1].distance < $rootScope.poiDataList[v2].distance );
                } else {
                    return ( $rootScope.poiDataList[v1].name.localeCompare($rootScope.poiDataList[v2].name) );
                }
            }
        }])


    .controller('CurrentTripController', ['$scope',
        '$rootScope',
        'tripFactory',
        'poiDataService',
        'savedTripsFactory',
        '$ionicPopover',
        'config',
        '$filter',

        function ($scope,
                  $rootScope,
                  tripFactory,
                  poiDataService,
                  savedTripsFactory,
                  $ionicPopover,
                  config,
                  $filter) {

            $scope.toggleAddPoiToTrip = function (pid) {
                tripFactory.toggleAddRemoveInTrip(pid);
            };


            // .fromTemplateUrl() method
            $ionicPopover.fromTemplateUrl('templates/savetrip-popover.html', {
                scope: $scope
            }).then(function (popover) {
                $scope.popover = popover;
            });


            $scope.saveTripPopover = function ($event) {
                $scope.popover.show($event);
            };
            $scope.closeSaveTripPopover = function () {
                $scope.popover.hide();
            };
            //Cleanup the popover when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.popover.remove();
            });
            // Execute action on hidden popover
            $scope.$on('popover.hidden', function () {
                // Execute action
            });
            // Execute action on remove popover
            $scope.$on('popover.removed', function () {
                // Execute action
            });


            $scope.trName = {};
            $scope.trName.text = '';

            $scope.confirmSaveTrip = function () {
                //console.log('saving trip with name ', $scope.trName);
                var triptosave = {
                    name: $filter('onlyLetters')($scope.trName.text),
                    poiList: angular.copy(tripFactory.getTrip())

                };

                savedTripsFactory.addTrip(triptosave);

                $scope.closeSaveTripPopover();
                $scope.trName.text = '';

            }

        }])



    .controller('MapMenuController',
        [
            '$scope',
            '$rootScope',
            'poiDataService',
            'tripFactory',
            'config',
            'leafletData',
            '$state',
            '$timeout',

            function ($scope,
                      $rootScope,
                      poiDataService,
                      tripFactory,
                      config,
                      leafletData,
                      $state,
                      $timeout
                  ) {

                $scope.TripPoiCurrentIndex = 0;


                $scope.movePoiCurrentIndexLeft = function () {
                    console.log ('movePoiCurrentIndexLeft $scope.TripPoiCurrentIndex $rootScope.TripList.length', $scope.TripPoiCurrentIndex, $rootScope.TripList.length)

                    if ($scope.TripPoiCurrentIndex == 0) return;
                    $scope.TripPoiCurrentIndex--;

                    console.log ('$rootScope.showPoiFooter ($rootScope.TripList[$scope.TripPoiCurrentIndex].id)', $rootScope.TripList[$scope.TripPoiCurrentIndex].id);

                   // $rootScope.showPoiFooter ($rootScope.TripList[$scope.TripPoiCurrentIndex].id)

                    $scope.toggleFocus();

                }

                $scope.movePoiCurrentIndexRight = function () {
                    console.log ('movePoiCurrentIndexRight $scope.TripPoiCurrentIndex $rootScope.TripList.length', $scope.TripPoiCurrentIndex, $rootScope.TripList.length)
                    if ($scope.TripPoiCurrentIndex == ($rootScope.TripList.length-1)) return;
                    $scope.TripPoiCurrentIndex++;

                    console.log ('$rootScope.showPoiFooter ($rootScope.TripList[$scope.TripPoiCurrentIndex].id)', $rootScope.TripList[$scope.TripPoiCurrentIndex].id);
                    //$rootScope.showPoiFooter ($rootScope.TripList[$scope.TripPoiCurrentIndex].id)
                    $scope.toggleFocus();
                }

                $scope.toggleFocus = function ()  {

                    $timeout (function () {
                        $rootScope.showPoiFooter ($rootScope.TripList[$scope.TripPoiCurrentIndex].id);
                        $rootScope.centerToPoi ($rootScope.TripList[$scope.TripPoiCurrentIndex]);
                    }, 300);


                }


            }])

    .controller('MapController',
        ['$scope',
            '$rootScope',
            '$cordovaGeolocation',
            '$cordovaDeviceOrientation',
            '$stateParams',
            'poiDataService',
            'tripFactory',
            'config',
            'leafletData',
            '$ionicSideMenuDelegate',
            '$interval',
            '$ionicPopup',

            function ($scope,
                      $rootScope,
                      $cordovaGeolocation,
                      $cordovaDeviceOrientation,
                      $stateParams,
                      poiDataService,
                      tripFactory,
                      config,
                      leafletData,
                      $ionicSideMenuDelegate,
                      $interval,
                      $ionicPopup
                     ) {


                $ionicSideMenuDelegate.canDragContent(false);

                console.log("Map controller reinit");

                $scope.$on('$ionicView.afterEnter', function() {
                    ionic.trigger('resize');
                });

                $scope.footer_tall = false;
                $scope.showmessage = false;
                $scope.footerMessage = '';

                var setFooterMessage = function (val) {
                    $scope.footerMessage = val;
                    $scope.showmessage = true;
                };
                var removeFooterMessage = function () {
                    $scope.showmessage = false;
                };

                var openFooter = function () {
                    $scope.footer_tall = true;
                };

                $rootScope.minimiseFooter = function () {

                    $scope.showmessage = false;
                    $scope.footer_tall = false;
                };

                $rootScope.showPoiFooter = function (pid) {

                    var ll = $rootScope.usermarker.getLatLng();
                    $scope.poi = {
                        id: pid,
                        distance: $rootScope.getDistanceFromLatLonInKm(
                            $rootScope.poiDataList[pid].lat,
                            $rootScope.poiDataList[pid].lon,
                            ll.lat,
                            ll.lng
                        )
                    };
                    //console.log($scope.poi.distance);
                    openFooter();
                    removeFooterMessage();
                };

                $rootScope.showMessage = function (val) {
                    openFooter();
                    setFooterMessage(val);
                };


                if (ionic.Platform.isAndroid()) {
                    $rootScope.NativeMapApp = 'Google Maps';
                } else {
                    $rootScope.NativeMapApp = 'Maps';
                }

                $rootScope.launchNativeMaps = function (id) {

                    var label = $rootScope.poiDataList[id].name;
                    var destination = $rootScope.poiDataList[id].lat + ',' + $rootScope.poiDataList[id].lon;

                    if (ionic.Platform.isAndroid()) {
                        label = encodeURI(label);
                        window.open('geo:0,0?q=' + destination + '(' + label + ')', '_system');
                    } else {
                        window.open('maps://?q=' + destination, '_system');
                    }

                };

                $scope.compaso = function () {
                    if (navigator.compass) {
                        $interval(function () {
                            //console.log('//console.log ($cordovaDeviceOrientation);', $cordovaDeviceOrientation);
                            $cordovaDeviceOrientation.getCurrentHeading().then(function (result) {
                                var angle_rounded = Math.round(result.trueHeading);
                                if (angle_rounded != $scope.trueHeading) {
                                    $scope.trueHeading = angle_rounded;
                                }
                                $rootScope.usermarker.setRotationAngle($scope.trueHeading);

                            }, function (err) {
                                // An error occurred
                            });

                        }, 500);
                    }
                }

                $scope.compaso();


                // if ($rootScope.TripList.length > 0) {   // not in triplist, but triplist > 0
                $rootScope.showPoiRedirectPopup = function () {  // Ask to save current triplist first

                    $rootScope.navigate_to = -1;

                    $rootScope.TripList = tripFactory.getTrip();

                    var showPoiRedirectPopup = $ionicPopup.show({
                        template: '<ion-list>' +
                        '<ion-radio ng-click="launchNativeMaps(poi.id);closeShowPoiRedirect()" ng-model="navigate_to" ng-value="poi.id" ng-repeat="poi in TripList">{{poi.name}}</ion-radio>' +
                        '</ion-list>'
                        ,
                        title: 'To which place you would like ' + $rootScope.NativeMapApp + ' navigate you?',
                        scope: $rootScope,
                        buttons: [
                            {
                                text: '<b>Close</b>',
                                type: 'button-light',
                                onTap: function (e) {
                                    return 2;
                                }
                            }
                        ]

                    }); // END var confirmPopup = $ionicPopup.show

                    showPoiRedirectPopup.then(function (confirmres) {
                        if (confirmres == 1) {  // you said  yess - save!

                        } else {
                            return;
                        }

                    }); //  END confirmPopup.then(function (confirmres)
                } // END $rootScope.showConfirmPopup = function ()


                $rootScope.$on('Trip_Off', function (event, val) {
                    console.log ('Trip Off event', val);

                    var markers = document.querySelectorAll(".destination-marker");
                    var route_pane = document.querySelectorAll(".leaflet-overlay-pane");
                    if (val) {

                        for (var i = 0; i < markers.length; i++) {
                            markers[i].style.display = 'none';
                        }
                        for (var i = 0; i < route_pane.length; i++) {
                            route_pane[i].style.display = 'none';
                        }

                    } else {
                        for (var i = 0; i < markers.length; i++) {
                            markers[i].style.display = 'block';
                        }
                        for (var i = 0; i < route_pane.length; i++) {
                            route_pane[i].style.display = 'block';
                        }

                        $rootScope.locateAndRoute();
                    }


                });

            }])

    .controller('SavedTripsController', [
        '$scope',
        '$rootScope',
        'savedTripsFactory',
        'tripFactory',
        '$ionicModal',
        'poiDataService',
        '$location',
        '$ionicPopup',
        '$ionicHistory',
        '$state',
        function ($scope,
                  $rootScope,
                  savedTripsFactory,
                  tripFactory,
                  $ionicModal,
                  poiDataService,
                  $location,
                  $ionicPopup,
                  $ionicHistory,
                  $state
        ) {

            var trip1 = {
                name: 'New Trip 1',
                poiList: [
                    {id: 1},
                    {id: 45},
                    {id: 34},
                    {id: 58},
                    {id: 72}
                ]
            };

            var trip2 = {
                name: "Trippy aa",
                poiList: [
                    {id: 67},
                    {id: 5},
                    {id: 300}
                ]

            };

///TODO: this should not be allowed to be saved!
            var trip3 = {
                name: "Hhaha id like integer",
                poiList: [
                    3, 4, 14, 423, 56
                ]
            };

            /**
             *  Create TripDetail
             */


            $scope.tripDetailShow = function (trip, parent) {

                 //console.log('tripDetail modal trip parent', trip, parent);
                 $scope.tripPoiList = trip.poiList;
                 $rootScope.trip = trip;

                 //console.log('tripdetail show ', $scope.trip);

                 if (parent)
                 $scope.tripparent = parent;
                 else
                 $scope.tripparent = trip.name;

                 for (var i = 0; i < $scope.tripPoiList.length; i++) {
                 $scope.tripPoiList[i] = $rootScope.poiDataList[$scope.tripPoiList[i].id];
                 }

                $state.go('app.tripdetails', {id: trip.id});

            };


            /**
             * END creation of TripDetail
             */
            savedTripsFactory.FetchSavedTrips();

            $scope.trips = savedTripsFactory.getSavedTrips();

            console.log('saved trips', $scope.trips);


            $scope.allInTrip = function (poiList) {
                var numintrip = 0;
                if (!poiList) return false;

                poiList.forEach(function (item) {
                    if (tripFactory.inTrip(item.id)) {
                        //console.log('checke numintrip', item.id);
                        numintrip++;
                    }
                });

                //console.log('numintrip', numintrip, poiList.length);

                if (numintrip == poiList.length) {
                    return true;
                } else {
                    return false;
                }

            };

            $scope.removeTrip = function (trip) {
                    var confirmDelPopup = $ionicPopup.confirm({
                        template: 'Would you like to remove <b>'+trip.name+'</b> trip?'
                    });
                    confirmDelPopup.then(function (res) {
                        if (res) {
                            savedTripsFactory.removeSavedTrip(trip.id);
                        } else {

                        }
                    });
            };

            $scope.addAllPois = function (poilist) {
                poilist.forEach(function (item) {
                    tripFactory.addToTrip(item.id);
                });
            };

            $scope.goNewTrip = function () {
                $rootScope.createNewTrip();
            }

        }])


    .controller('TripDetailController', [
        '$scope', 'trip', '$rootScope', '$ionicPopup', 'tripFactory',
        function ($scope, trip, $rootScope, $ionicPopup, tripFactory) {

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
                viewData.enableBack = true;
            });

            $scope.tripPoiList = trip.poiList;
            $scope.trip = trip;

            console.log('tripdetail show ', $scope.trip);

            $scope.title = trip.name;

            for (var i = 0; i < $scope.tripPoiList.length; i++) {
                $scope.tripPoiList[i] = $rootScope.poiDataList[$scope.tripPoiList[i].id];
            }


            $scope.startTrip = function (trip) {
               if ($rootScope.TripList.length >0 ) {
                   var confirmPopup = $ionicPopup.confirm({

                       template: 'Would you like to use this trip instead? Current trip list will be deleted.'
                   });
                   confirmPopup.then(function (res) {
                       if (res) {
                           $scope.loadTrip(trip);

                       } else {

                       }
                   });

               } else { //if ($rootScope.TripList.length >0 )
                   $scope.loadTrip(trip);
               }
            };


            $scope.loadTrip = function (trip) {

                var trip_pois = trip.poiList;
                tripFactory.clearTrip();
                for (var i = 0; i < trip_pois.length; i++) {
                    if (trip_pois[i].id && isInt(trip_pois[i].id))
                        tripFactory.addToTrip(trip_pois[i].id);
                }
                var templ = '<div>Trip <b>'+trip.name+'</b> loaded. Go ahead and see it on <b>Map</b> or edit in <b>Current Trip</b> </div>'
                $scope.successPopup = $ionicPopup.alert({
                        template: templ,
                        scope: $scope,
                });
            };

            function isInt(value) {
                return !isNaN(value) && (function (x) {
                        return (x | 0) === x;
                    })(parseFloat(value))
            }


        }])


    .controller('PoiDetailController', [
        '$scope', 'poi', '$rootScope', 'rankService', '$ionicPopup',
        function ($scope, poi, $rootScope, rankService, $ionicPopup) {

            $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
                viewData.enableBack = true;
            });

            $scope.roundDec = function (num) {
                console.log('rating avg', num)
                if (typeof num == undefined) return '';
                if (num == 0) return 0;
                var ret = Math.round(parseFloat(num) * 10) / 10;
                if (isNaN(ret)) return '';
                else return ret;
            }

            /**
             *  Slide gallery
             */

            $scope.next = function () {
                $ionicSlideBoxDelegate.next();
            };
            $scope.previous = function () {
                $ionicSlideBoxDelegate.previous();
            };

            // Called each time the slide changes
            $scope.slideChanged = function (index) {
                $scope.slideIndex = index;
            };

            /**
             *  End Slide gallery
             */


            $scope.poi = poi;
            console.log('poi detail', poi);
            $scope.poi.parent = $scope.poi.name;
            $scope.poi.distance = $rootScope.getDistanceFromLatLonInKm(
                $rootScope.poiDataList[poi.id].lat,
                $rootScope.poiDataList[poi.id].lon,
                $rootScope.user_lat,
                $rootScope.user_lon
            );

            $scope.rank_set = true;
            $scope.ranks = [];
            $scope.stars = [];
            $scope.num_ranks = 0;
            $scope.showhalf = false;

            rankService.getRanks(poi.id).query(
                function (response) {
                    $scope.stars = [];
                    console.log('getranks res: ', response);
                    if (response.code == 1039) { // no  poi ranks found
                        $scope.ranks = [];
                        $scope.num_ranks = 0;
                        $scope.stars = [];
                    } else {
                        $scope.ranks = response;
                        $scope.num_ranks = response.ranks.length;

                        response.avg = $scope.roundDec(response.avg);

                        if (response.avg == '') return;

                        for (var i = 0; i < response.avg; i++) {
                            $scope.stars.push(i);
                        }

                        var rest = response.avg - $scope.stars.length;
                        if (rest > 0.3 && rest <= 0.9) {
                            $scope.showhalf = true;
                            i++
                        }
                        else if (rest > 0.9) {
                            $scope.stars.push(5);
                            $scope.showhalf = false
                        }
                        else $scope.showhalf = false;

                        for (var j = i; j < 5; j++) {
                            $scope.stars.push(-j);
                        }
                    }

                },
                function (response) {
                    console.log("Error: " + response.status + " " + response.statusText);
                }
            );

            rankService.rankSet(poi.id).query(
                function (response) {
                    $scope.rank_set = (response['code'] == 1045);
                    console.log('rank is set?', (response['code'] == 1045));
                },
                function (response) {
                    console.log("Error: " + response.status + " " + response.statusText);
                }
            );


            $scope.showSelectRate = false;

            var templ = '<div class="star-popover-inner">Rate <b>' + poi.name + '</b><div class="popover-star"> <i class="ion-ios-star" ng-click="setRank(1)"></i> <i class="ion-ios-star" ng-click="setRank(2)"></i> <i class="ion-ios-star" ng-click="setRank(3)"></i> <i class="ion-ios-star" ng-click="setRank(4)"></i> <i class="ion-ios-star" ng-click="setRank(5)"></i> </div> </div>'


            $scope.openRankSetup = function () {
                $scope.confirmPopup = $ionicPopup.show({
                    template: templ,
                    scope: $scope,
                });
            };


            $scope.setRank = function (rank) {
                if ($scope.confirmPopup) $scope.confirmPopup.close();
                if (rank < 1 || rank > 5) return;
                rankService.setRank(rank, poi.id).query(
                    function (response) {
                        console.log('setrank res: ', response);
                        $scope.rank_set = true;
                        rankService.getRanks(poi.id).query(
                            function (response) {
                                $scope.stars = [];
                                console.log('getranks res: ', response);
                                if (response.code == '1039') { // no  poi ranks found
                                    $scope.ranks = [];
                                    $scope.num_ranks = 0
                                    $scope.stars = [];
                                } else {
                                    $scope.ranks = response;
                                    $scope.num_ranks = response.ranks.length;

                                    for (var i = 0; i < response.avg; i++) {
                                        $scope.stars.push(i);
                                    }


                                    var rest = response.avg - $scope.stars.length;
                                    if (rest > 0.3 && rest <= 0.9) {
                                        $scope.showhalf = true;
                                        i++
                                    }
                                    else if (rest > 0.9) {
                                        $scope.stars.push(5);
                                        $scope.showhalf = false
                                    }
                                    else $scope.showhalf = false;

                                    for (var j = i; j < 5; j++) {
                                        $scope.stars.push(-j);
                                    }

                                }

                            },
                            function (response) {
                                console.log("Error: " + response.status + " " + response.statusText);
                            }
                        );
                    },
                    function (response) {
                        console.log("Error: " + response.status + " " + response.statusText);
                    }
                );
            }


        }])


    .controller('MostVisitedController', [
        '$scope',
        'distanceService',
        function ($scope,
                  distanceService) {

        }])




    .controller('EnterManagerPinCtrl', [
        '$scope',
        '$rootScope',
        'ManagerPINService',
        '$ionicPopup',
        function ($scope, $rootScope, ManagerPINService, $ionicPopup) {
            $scope.nextstep = false;
            $scope.numguest = 0;
            $scope.pinarray = [];
            $scope.showpsin = false;
            $scope.showthankyou = false;

            $scope.dial = function (num) {
                $scope.pinarray.push(num);
                //console.log($scope.pinarray);
                if ($scope.pinarray.length == 4) {
                    //console.log('$scope.pinarray..join("");', $scope.pinarray.join(""));
                    $scope.manager_pin = parseInt($scope.pinarray.join(""));
                    $scope.nextstep = true;
                }
            };

            $scope.goBackToPin = function () {
                $scope.pinarray = [];
                $scope.numguest = 0;
                $scope.nextstep = false;
                $scope.showthankyou = false;
            }

            $scope.dominus = function () {
                if ($scope.numguest == 0) return;
                $scope.numguest--;
            }
            $scope.doplus = function () {
                $scope.numguest++;
            }


            $scope.showPINSuccessAlert = function () {
                var alertPopup = $ionicPopup.alert({
                    title: 'Confirmation',
                    template: 'Transaction successful'
                });


                alertPopup.then(function (res) {
                    //console.log('Done transaction');
                });
            };

            $scope.showPINFailAlert = function (error) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Error',
                    template: 'Transaction unsuccessful. ' + error
                });

                alertPopup.then(function (res) {
                    //console.log('Done transaction');
                });
            };


            $scope.sendPINsendNum = function () {

                $scope.showspin = true;

                ManagerPINService.partnerTransaction(
                    $scope.manager_pin,
                    $rootScope.poiDataList[$scope.poi.id].partner_id,
                    $scope.numguest
                ).query(
                    function (response) {
                        $scope.showspin = false;
                        //console.log(response);

                        if (response.code == '1054' ||
                            response.code == '1055' ||
                            response.code == '1056' ||
                            response.code == '1057' ||
                            response.code == '1060') {
                            //for testing
                            //$scope.showthankyou = true;


                            // but really - this
                            $scope.goBackToPin();
                            $scope.showPINFailAlert(response.msg);
                        } else {
                            $scope.showthankyou = true;
                            var info = {
                                poi: $scope.poi,
                                numguest: $scope.numguest
                            }
                            $rootScope.$broadcast('TransactionSuccessful', info);
                        }


                    },
                    function (response) {
                        console.log ("Error: " + response.status + " " + response.statusText);
                       // $ionicPopup.alert ("Error: " + response.status + " " + response.statusText);
                    }
                );

            }

        }])


;


// Courtesy of https://github.com/igreulich/angular-truncate/blob/master/src/igTruncate.js
angular.module('igTruncate', []).filter('truncate', function () {
    return function (text, length, end) {
        if (text !== undefined) {
            if (isNaN(length)) {
                length = 10;
            }

            if (end === undefined) {
                end = "...";
            }

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            } else {
                return String(text).substring(0, length - end.length) + end;
            }
        }
    };
});
