'use strict';

angular.module('Guido.init', [])
    .run(['$rootScope',
        '$cordovaGeolocation',
        '$compile',
        'leafletData',
        'loginService',
        'tripFactory',
        'savedTripsFactory',
        'poiDataService',
        'config',
        'newTripService',
        'nearMeService',
        '$q',
        'mapService',
        '$state',
        'UserPINService',
        'historyService',
        'favoritesService',
        '$interval',
        '$timeout',
        '$ionicPopup',
        '$cordovaNetwork',

        function ($rootScope,
                  $cordovaGeolocation,
                  $compile,
                  leafletData,
                  loginService,
                  tripFactory,
                  savedTripsFactory,
                  poiDataService,
                  config,
                  newTripService,
                  nearMeService,
                  $q,
                  mapService,
                  $state,
                  UserPINService,
                  historyService,
                  favoritesService,
                  $interval,
                  $timeout,
                  $ionicPopup,
                  $cordovaNetwork
        ) {
            $rootScope.baseURL = config.baseURL;

            $rootScope.page = $state;
            $rootScope.page.title = $state.current.showname;

            $rootScope.VisitSum = 0;
            $rootScope.inside_dist = config.ENTER_PIN_DISTANCE;

            $rootScope.poiDataLoaded = false;  // flag that PoiDataList is not empty
            $rootScope.StoredPoiDataLoaded = false; // flag that we got poidata from local storage
            $rootScope.AllDataLoaded = false; // flag that we got both poidata and city_tree loaded

            /**
             *  Checking connection and setting up connection watchers
             */
            document.addEventListener("deviceready", function() {
    if (window.cordova) {

        document.addEventListener("offline",
            function () {
                $ionicPopup.alert({
                    title: "Internet Disconnected",
                    content: "The internet is disconnected on your device. The app will not function properly."+
                    "Please recheck your connection and restart the app."
                })
                    .then(function() {

                    });
            }

            , false);

    }

})


            /**
             *  END Checking connection and setting up connection watchers
             */


            loginService.checkbefore().then(
                function () {
                    console.log ('success auth check before');
                    $state.go('app.newtrip');
                    $state.go('app.nearme');   // fixing freakin top header issue.
                    $timeout(function (){$state.go('app.newtrip');}, 2000);
                },
                function () {
                    console.log ('unsuccess auth check before');
                    $state.transitionTo('login');
                }
            );



            $rootScope.$on('$stateChangeStart',
                function(event, toState, toParams, fromState, fromParams){
                    console.log('Changed state to: ', event, toState);
                });


            // we got some data in cache
            if ($rootScope.poiDataList.length > 1) {
                $rootScope.poiDataLoaded = true;
                $rootScope.StoredPoiDataLoaded = true;
                $rootScope.$broadcast('StoredPoiDataLoaded');

            }



            // TODO: and here we can play with splashscreen ;)
            /**
             *  And here the main action starts :)
             *  Getting tha data
             *
             */
            $rootScope.$on ('ApiKeyReceived', function () {

                $rootScope.toggleAddPoiToTrip = function (pid) {
                    tripFactory.toggleAddRemoveInTrip(pid);
                };

                $rootScope.inTripList = function (pid) {
                    return tripFactory.inTrip(pid);
                };

                mapService.initMap();  // calling everything for a map initiation in mapservice.js

                asyncGetAllPoi().then(    // first loading poidata, and only then:
                    function () {
                        newTripService.getTopPoiTree().query(  // getting tree of cities
                            function (response) {
                                $rootScope.city_tree = response['children'];
                                var obj = $rootScope.addDepthToTree($rootScope.city_tree, 1, true);
                                $rootScope.city_tree = obj;  // and now all is done
                                console.log('$rootScope.city_tree', $rootScope.city_tree);

                                poiDataService.storeCityTree();


                                UserPINService.getPartners($rootScope.customerID).query(
                                    function (response) {
                                        $rootScope.partners = response.data;
                                        $rootScope.partners_received = true;
                                        $rootScope.$broadcast('PartnersReceived');
                                        poiDataService.updatePoiDataWithPartners();

                                        for (var i = 0 ; i<  $rootScope.poiDataList.length; i++) {
                                            //console.log ('i, $rootScope.poiDataList[i]', i, $rootScope.poiDataList[i] )
                                            if ( typeof $rootScope.poiDataList[i] == 'object'
                                                && typeof $rootScope.poiDataList[i].id != undefined
                                                && typeof $rootScope.poiUniqList[i] != undefined ) {
                                                // console.log ('copy copy copy', $rootScope.poiDataList[i] );
                                                $rootScope.poiUniqList.push (angular.copy ($rootScope.poiDataList[i]));
                                            }

                                        }

                                        $rootScope.AllDataLoaded = true;
                                        $rootScope.$broadcast('AllDataLoaded');
                                        $rootScope.TripList = tripFactory.getTrip(); // connecting with array of trip_pois
                                        historyService.updateSeen();
                                        favoritesService.updateFavorites();
                                        tripFactory.loadTrip();
                                        savedTripsFactory.FetchSavedTrips();
                                        $interval($rootScope.locate, 3000);


                                    },
                                    function (response) {
                                        console.log("Error: " + response.status + " " + response.statusText);
                                        //$scope.message = "Error: " + response.status + " " + response.statusText;
                                    }
                                );

                                $rootScope.nearMeCheck();


                            },
                            function (error) {
                                console.log("Error on getting tree: " + error.status + " " + error.statusText);
                                //$rootScope.message = "Error on getting tree: " + error.status + " " + error.statusText;
                            }
                        );

                    });
            })




            function asyncGetAllPoi() {
                var deferred = $q.defer();
                var poidata = poiDataService.getLoadedPoiData();

                //////console.log('poidata before', poidata);

                poiDataService.loadAllPoisAtOnce().query(
                    function (response) {


                        var res = response['data'];

                        for (var i = 0; i < res.length; i++) {
                            poidata[res[i].id] = res[i];
                        }
                        $rootScope.poiDataList = poidata;      // loading into the main array
                        poiDataService.storePoiData();
                        $rootScope.$broadcast('poiDataLoaded');
                        $rootScope.poiDataLoaded = true;
                        deferred.resolve('finalising');
                    },
                    function (error) {
                    }
                );

                return deferred.promise;

            }


            /**
             *
             *  Add show/hide functionality to the tree of POIs and cities
             *
             */

            $rootScope.cities = [];
            $rootScope.selcity = -1;

            $rootScope.addDepthToTree = function (obj, depth, collapsed) {

                for (var key in obj) {
                    if (obj[key] && typeof(obj[key]) == 'object') {
                        obj[key].depth = depth;
                        obj[key].collapsed = collapsed;

                        if (obj[key].pois && obj[key].pois.length > 0) {
                            if (!(obj[key].children)) {  //excluding cities with pois that are with children
                                var city = {
                                    id: obj[key].id,
                                    lat: obj[key].latitude,
                                    lon: obj[key].longitude,
                                    headline: obj[key].headline,
                                    name: obj[key].name,
                                    image: obj[key].image,
                                    image_medium: obj[key].image_medium,
                                    image_thumb: obj[key],
                                    pois: [],
                                    priority_index: obj[key].priority_index
                                };


                                for (var i in obj[key].pois) {
                                    console.log('obj[key].pois[i].poi_id', obj[key].pois[i].poi_id);
                                    var pid = obj[key].pois[i].poi_id;
                                    if (poiDataService.inPoiCache(pid)) {
                                        city.pois[pid] = ($rootScope.poiDataList[pid]);
                                    } else {
                                        console.log(' before loadPOI $rootScope.poiDataList[pid]', pid, $rootScope.poiDataList[pid]);
                                        poiDataService.loadPoi(pid).then(
                                            function () {
                                                city.pois[pid] = ($rootScope.poiDataList[pid]);
                                              }
                                        );
                                    }

                                }
                                obj[key].pois = (city.pois);
                                $rootScope.cities.push(city);

                            }

                        }

                        //
                        $rootScope.addDepthToTree(obj[key], key === 'children' ? ++depth : depth, collapsed);
                    }
                }
                return obj;
            };


            $rootScope.updatePoisInTree = function (obj) {

                for (var key in obj) {
                    if (obj[key] && typeof(obj[key]) == 'object') {

                        for (var i in obj[key].pois) {

                            //all_pois.push (obj[key].pois[i].poi_id);
                            if ($rootScope.poiDataList[obj[key].pois[i].poi_id]) {
                                $rootScope.poiDataList[obj[key].pois[i].poi_id].distance = $rootScope.getDistanceFromLatLonInKm
                                (
                                    $rootScope.poiDataList[obj[key].pois[i].poi_id].lat,
                                    $rootScope.poiDataList[obj[key].pois[i].poi_id].lon,
                                    $rootScope.user_lat,
                                    $rootScope.user_lon
                                );

                                obj[key].pois[i] = $rootScope.poiDataList[obj[key].pois[i].poi_id]
                                obj[key].pois[i].poi_id = obj[key].pois[i].id;
                            } else {

                                if (!isNaN(obj[key].pois[i].poi_id) && obj[key].pois[i].poi_id) {
                                    //////console.log('updatePoisInTree problem 111 obj[key].pois[i]', obj[key].pois[i])
                                    var res = poiDataService.loadPoi(obj[key].pois[i].poi_id);
                                    res.then(
                                        function (result) {
                                        }
                                    )
                                }
                            }
                        }

                        $rootScope.updatePoisInTree(obj[key]);
                    }
                }
                return obj;
            }


            /**
             *   END Initialising the tree of POIs
             *
             */


            /**
             *  nearMeCheck function
             */
            $rootScope.nearMeCheck = function () {
                $rootScope.pois_nearme_show = false;
                $rootScope.locate().then (function () {

                    var lat = $rootScope.user_lat;
                    var lon = $rootScope.user_lon;

                    console.log('Nearme check', lat, lon);

                    nearMeService.getNearMePois(lat, lon).query(
                        function (response) {
                            $rootScope.pois_nearme = response['data'];
                            if ($rootScope.pois_nearme) {
                                $rootScope.pois_nearme.forEach(function (item) {
                                    poiDataService.loadPoi(item.id);
                                    $rootScope.pois_nearme_show = true;
                                });
                            } else {
                                $rootScope.pois_nearme_show = false;
                                $rootScope.pois_nearme = [];
                            }
                        },
                        function (response) {
                            console.log ("Error: " + response.status + " " + response.statusText);
                            $rootScope.message = "Error: " + response.status + " " + response.statusText;
                        }
                    );
                });
            }
            /**
             *  END NearMeCheck
             */

        }]);