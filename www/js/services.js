'use strict';


angular.module('Guido.services', ['ngResource'])


    .factory('$localStorage', ['$window', function ($window) {
        return {
            store: function (key, value) {
                $window.localStorage[key] = value;
            },
            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            storeObject: function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function (key, defaultValue) {

                //console.log( 'getObject') ;//JSON.parse(data) );
                var data = ($window.localStorage[key] ?
                        JSON.parse($window.localStorage[key])
                        : (defaultValue ?
                            defaultValue : {} )
                );
                return data;
            }
        };
    }])

    .service('loginService', [
        '$resource',
        'config',
        '$rootScope',
        '$localStorage',
        '$q',
        '$state',
        '$window',
        function (
            $resource,
            config,
            $rootScope,
            $localStorage,
            $q,
            $state,
            $window
        ) {

        var isAuthenticated = false;

        var checkapikey = function (token) {
            return $resource(config.baseURL + '/api/customers/check_api_key',
                null, {
                    query: {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        //cache : true,  // possible later
                        params: {
                            token: token,

                        }
                    }
                });
        };

        return {
            checkbefore: function () {
               var deferred = $q.defer();
               var token = $localStorage.getObject('apikey');
               console.log ('checking'+token);
                if (token.key) {

                    checkapikey(token.key).query (
                        function (response) {
                            console.log ('resolved checkapikey() token ', response );
                            if (response.type_string == 'Error') {
                                console.log ('Apikey not valid', token.key);
                                deferred.reject ('Apikey not valid');
                            } else {
                                console.log ('ApiKeyReceived valid')
                                deferred.resolve();
                                isAuthenticated = true;
                                $rootScope.apiKey = token.key;
                                $rootScope.customerID = token.customerID;
                                $rootScope.ApiKeyReceived = true;
                                $rootScope.$broadcast ('ApiKeyReceived');
                            }
                        },
                        function (response) {
                            console.log ("Error: " + response.status + " " + response.statusText);
                            deferred.reject ('Apikey not valid');
                        }
                    )
                } else {
                    console.log ('No Apikey');
                    deferred.reject ('No Apikey Stored');
                }
                return deferred.promise;
            },
            logout: function () {
                console.log('logging out');
                $rootScope.apiKey = '';
                $rootScope.ApiKeyReceived = false;
                $localStorage.storeObject('apikey',{});
                isAuthenticated = false;
                $window.location.reload();
            },
            login: function () {
                isAuthenticated = true;
                return isAuthenticated;
            },
            isAuthenticated: function () {
                return isAuthenticated;
            }
        }

    }])

    .service('UserPINService', ['$resource', 'config', '$rootScope',
        function ($resource, config, $rootScope) {

            this.auth = function (pin) {
                //console.log ('CS pin', pin);
                return $resource(config.baseURL + '/api/users/authenticate_user_with_token',
                    null, {
                        query: {
                            method: 'POST',
                            headers: {
                                
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            //cache : true,  // possible later
                            params: {

                                token: pin,

                            }
                        }
                    });
            };

            this.getPartners = function (c_id) {
                console.log ('getPartners customer_id', c_id);
                return $resource(config.baseURL + '/api/customers/get_partners',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            //cache : true,  // possible later
                            params: {
                                customer_id: c_id
                            }
                        }
                    });
            };

            return this;


        }])


    .service('poiFilterService', ['$resource', 'config', '$rootScope',
        function ($resource, config, $rootScope) {

            this.getPoiTypes = function () {


                return $resource(config.baseURL + '/api/pois/get_poi_types',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {

                                lang_id: config.lang_id,
                            }
                        }
                    })
            };
        }])

    .service('nearMeService', ['$resource', 'config', '$rootScope',
        function ($resource, config, $rootScope) {

            this.getNearMePois = function (lat, lon, radius) {


                return $resource(config.baseURL + '/api/pois/get_pois_from_gps/',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {

                                lang_id: config.lang_id,
                                lon: lon,
                                lat: lat,
                                unit: config.unit,
                                radius: radius ? radius : config.NEARME_RADIUS,

                            }
                        }
                    })
            };
        }])

    .service('historyService', ['$resource', 'config', '$rootScope','poiDataService',
        function ($resource, config, $rootScope, poiDataService) {
            $rootScope.pois_histry = [];

            $rootScope.close_to_pool = [];


            this.inSeen = function (pid) {
                for (var i in $rootScope.pois_histry) {
                    if ( $rootScope.pois_histry[i].poi_id == pid ) return true;
                }
                return false;
            }



            this.inClosePool = function (pid) {
                for (var i in $rootScope.close_to_pool) {
                    if ( $rootScope.close_to_pool[i].id == pid ) return i;
                }
                return -1;
            }


            this.removeSeen = function (pid) {

                for (var i in $rootScope.pois_histry) {
                    if ( $rootScope.pois_histry[i].poi_id == pid ) {
                        $rootScope.pois_histry.splice(i,1); break;
                    }
                }

                return $resource(config.baseURL + '/api/users/remove_poi_visit',
                    null, {
                        query: {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                poi_id: pid,
                            }
                        }

                    })
            }

            this.markSeen = function (pid) {
                $rootScope.$broadcast('PoiSeen', pid);
                $rootScope.pois_histry.push ({poi_id:pid});

                return $resource(config.baseURL + '/api/users/set_poi_visit',
                    null, {
                        query: {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                poi_id: pid,
                            }
                        }

                    })
            };


            this.updateSeen = function () {
                this.getUserPois().query(
                    function (response) {
                        $rootScope.pois_histry = response['visited'];
                        $rootScope.pois_hist_show = false;
                        console.log('histry res: ', response);

                        $rootScope.pois_histry.forEach(function (item) {
                            //console.log('item', item.id);
                            poiDataService.loadPoi(item.id);
                            $rootScope.pois_hist_show = true;

                        });
                    },
                    function (response) {
                        console.log ("Error: " + response.status + " " + response.statusText);
                    }
                );
            };


            this.getUserPois = function () {
                return $resource(config.baseURL + '/api/users/get_user_visited:id',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                lang_id: config.lang_id,
                            }
                        }

                    })
            };


            $rootScope.notified_pool = [];

            this.inNotified = function (pid) {
                return ($rootScope.notified_pool.indexOf(pid));
            }



        }])


    .service('favoritesService', ['$resource', 'config', '$rootScope','poiDataService',
        function ($resource, config, $rootScope, poiDataService) {
            $rootScope.favorites = [];

            this.inFavorites = function (pid) {
                //console.log ('in fav?', pid, $rootScope.favorites);
                for (var i in $rootScope.favorites) {
                    if ( $rootScope.favorites[i].poi_id == pid ) return true;
                }
                return false;
            }



            this.removeFavorite = function (pid) {
                console.log ('removing fav', pid);

                for (var i in $rootScope.favorites) {
                    if ( $rootScope.favorites[i].poi_id == pid )  {
                        $rootScope.favorites.splice(i,1); break;
                    }
                }

                 return $resource(config.baseURL + '/api/users/remove_poi_favorite',
                    null, {
                        query: {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                poi_id: pid,
                            }
                        }

                    });
            }

            this.addFavorite = function (pid) {
                console.log ('addinging fav', pid);

                $rootScope.favorites.push ({poi_id: pid});

                return $resource(config.baseURL + '/api/users/set_poi_favorite',
                    null, {
                        query: {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                poi_id: pid,
                            }
                        }

                    });
            };

            this.getFavorites = function () {
                return $resource(config.baseURL + '/api/users/get_user_favorites:id',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                lang_id: config.lang_id,
                            }
                        }

                    })
            };


            this.updateFavorites = function () {
                //$rootScope.favorites = [];
                this.getFavorites().query(
                    function (response) {
                        $rootScope.favorites = response['favorites'];

                        console.log('favorites res: ', response);

                        $rootScope.favorites.forEach(function (item) {
                            //console.log('item', item.id);
                            poiDataService.loadPoi(item.id);
                        });
                    },
                    function (response) {
                        console.log ("Error: " + response.status + " " + response.statusText);
                    }
                );
            };
        }])



    .service('rankService', ['$resource', 'config', '$rootScope','poiDataService',
        function ($resource, config, $rootScope, poiDataService) {
            this.rankSet = function (pid) {
                return $resource(config.baseURL + '/api/users/rank_already_set',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                poi_id: pid,
                            }
                        }

                    })
            }




            this.setRank = function (rank, pid) {
                return $resource(config.baseURL + '/api/users/set_poi_rank',
                    null, {
                        query: {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                               rank: rank,
                                poi_id: pid,
                                comment:''

                            }
                        }

                    });
            };


            this.getRanks = function (pid) {
                return $resource(config.baseURL + '/api/pois/get_poi_ranks',
                    null, {
                        query: {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            params: {
                                poi_id: pid,
                                lang_id: config.lang_id
                            }
                        }

                    });
            }



        }])


    .service('newTripService', ['$resource', 'config', '$rootScope', function ($resource, config, $rootScope) {

        this.getTopPoiTree = function () {
            return $resource(config.baseURL + '/api/pois/get_navigation_types_tree',
                null, {
                    query: {
                        method: 'GET',
                        cache: 'true',
                        headers: {
                            'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        params: {
                            lang_id: config.lang_id
                        }
                    }
                })
        };


    }])



    .service('poiDataService', ['$resource', '$q', 'config', '$localStorage', '$rootScope',
        function ($resource, $q, config, $localStorage, $rootScope) {

            var poidata = [];
            $rootScope.poiDataList = poidata;
            var stored_poidata = [];

            this.inPoiCache = function (pid) {
                var x = 1;
                if (poidata[pid] && typeof(poidata[pid]) == 'object') { // have it in poidata

                    //console.log('inPoiCache poidata $rootScope.poiDataList pid poidata[pid] TRUE', poidata, $rootScope.poiDataList, pid, poidata[pid]);

                    return true;
                } else {

                    console.log('inPoiCache poidata pid poidata[pid] FALSE', poidata, $rootScope.poiDataList, pid, poidata[pid]);
                    return false;
                }
            };

            this.loadPoi = function (pid) {

                pid = parseInt(pid);

                if (this.inPoiCache(pid)) {// have it in poidata
                    //console.log ('getting from cache', poidata[pid], pid, poidata);

                    //console.log ($q.when(poidata[pid]));

                    return $q.when(poidata[pid]);
                } else {  //retrieve it from server

                    var return_data = this.getPoiFromId(pid).query(
                        function (response) {
                            /*
                             distanceService.calcDistance ([config.lat, config.lon], )
                             */

                            if (response.code == 1015) return $q.when(false);

                            /*delete response.$promise;
                            delete response.$resolved;
                            delete response.msg;*/

                            response = angular.fromJson(angular.toJson(response));
                            poidata[response.id] = response;

                            console.log ('getting from server poidata[pid], response, pid', poidata[pid], response, pid)

                        },
                        function (error) {
                            console.log('error in LoadPoi - getPoiFromId', error);
                            //

                        }
                    );
                    return return_data.$promise;

                }

            };


            this.getPoiFromId = function (pid) {

                return $resource(config.baseURL + '/api/pois/get_poi_by_id',
                    null, {
                        query: {
                            method: 'GET',
                            cache: 'true',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            //cache : true,  // possible later
                            params: {
                                lang_id: config.lang_id,
                                poi_id: pid
                            }
                        }
                    });
            };

            this.loadAllPoisAtOnce = function () {
                return $resource(config.baseURL + '/api/pois/get_pois_from_gps',
                    null, {
                        query: {
                            method: 'GET',
                            cache: 'true',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            //cache : true,  // possible later
                            params: {
                                lang_id: config.lang_id,
                                lon: config.lon,
                                lat: config.lat,
                                radius: 200,
                                limit: 1000,
                            }
                        }
                    });
            };

            this.getLoadedPoiData = function () {
                return poidata;
            };


            this.getStoredPoiData = function () {
                stored_poidata = $localStorage.getObject('stored_poidatalist', []);

                return stored_poidata;
            };


            this.storePoiData = function () {
                // for some time
                $localStorage.storeObject('stored_poidatalist', $rootScope.poiDataList);
            };

            this.getStoredCityTree = function () {
                return $localStorage.getObject('city_tree', []);
            }

            this.storeCityTree = function () {
                $localStorage.storeObject('city_tree', $rootScope.city_tree);
            }

            this.updatePoiDataWithPartners = function () {

                console.log ('Updating poiData with partners', $rootScope.partners,  $rootScope.poiDataList);
                for (var i in $rootScope.partners) {
                    $rootScope.poiDataList[
                        $rootScope.partners[i].poi_id
                        ].partner_id = $rootScope.partners[i].partner_id
                }
            }



        }])


    //   Handling of the current trip

    .factory('tripFactory', ['$rootScope', 'poiDataService', '$localStorage',
        function ($rootScope, poiDataService, $localStorage) {
            var tripFac = {};
            var tripPois = []; // array of IDs of POIs


            tripFac.addToTrip = function (pid) {

                //console.log('tripFac.addToTrip called pid = ', pid, 'tripPois  = ', tripPois);

                if (!tripFac.inTrip(pid)) {

                    var res = poiDataService.loadPoi(pid);
                    //console.log('addtotrip loadpoi res', res);

                    res.then(
                        function (result) {
                            tripPois.push(result);
                            tripFac.storeTrip();
                            $rootScope.$broadcast('addingPoi', result);
                            $rootScope.VisitSum = tripFac.getVisitSum();

                        }
                    );


                    return res;
                }

            };

            tripFac.removeFromTrip = function (pid) {
                for (var i = 0; i < tripPois.length; i++) { //implement indexOF
                    if (tripPois[i]['id'] == pid) {
                        tripPois.splice(i, 1);
                        $rootScope.$broadcast('removingPoi', pid);
                        tripFac.storeTrip();
                        $rootScope.VisitSum = tripFac.getVisitSum();
                        //emit event
                    }
                }

            };

            tripFac.inTrip = function (pid) {
                for (var i = 0; i < tripPois.length; i++) {
                    if (tripPois[i].id == pid) {
                        return true;
                    }
                }
                return false;
            };


            tripFac.toggleAddRemoveInTrip = function (pid) {
                if (tripFac.inTrip(pid)) {       //  should DELETE
                    tripFac.removeFromTrip(pid);
                } else {                            // should ADD
                    tripFac.addToTrip(pid);
                }
            };

            tripFac.loadTrip = function () {
                var currenttrip = $localStorage.getObject('current_trip', []);

                $rootScope.VisitSum = tripFac.getVisitSum();
                currenttrip.forEach(function (item) {
                    tripFac.addToTrip(item);
                });

            };

            tripFac.storeTrip = function () {
                var currenttrip = [];
                tripPois.forEach(function (item) {
                    currenttrip.push(item.id);
                });

                $localStorage.storeObject('current_trip', currenttrip);
            };

            tripFac.getTrip = function () {
                return tripPois;
            };

            tripFac.clearTrip = function () {
                var trippois_ids = [];
                tripPois.forEach(function (item) {
                    trippois_ids.push(item.id);
                });

                trippois_ids.forEach(function (item) {
                    tripFac.removeFromTrip(item);
                });
                tripFac.storeTrip();

            };

            tripFac.initTripList = function (pid) {

                for (var i = tripPois.length - 1; i >= 0; i--) {
                    tripFac.removeFromTrip(tripPois[i].id);
                }

                if (!isNaN(pid)) {
                    tripFac.addToTrip(pid);
                }
            };

            tripFac.getVisitSum = function () {
                var sum = 0;
                for (var i = 0; i < tripPois.length; i++) {
                        sum += tripPois[i].visit_duration;

                }
                  return sum * 60;
            }


            return tripFac;
        }])

    .factory('savedTripsFactory', ['$rootScope', '$localStorage',
        function ($rootScope, $localStorage) {

            var STF = {};

            var saved_trips = []; // array  TripObject objects

            var TripObject = {
                name: '',
                id: '',
                date: new Date(),
                poiList: [
                    {id: 1}
                ]
            };

            STF.FetchSavedTrips = function () {
                var fetchedtrips = $localStorage.getObject('saved_trips', []);
                //$localStorage.storeObject('saved_trips', []);
                saved_trips = fetchedtrips;
            };

            var StoreSavedTrips = function () {
                $localStorage.storeObject('saved_trips', saved_trips);
            };


            STF.inSavedList = function (trip) {
                for (var i = 0; i < saved_trips.length; i++) {
                    if (saved_trips[i].id === trip.id || saved_trips[i] == trip) {
                        return true;
                    }
                }
                return false;
            };

            STF.generateUniqueID = function () {
                // generate random id and that it is not in saved trips
                var id = 0;
                do {
                    id = parseInt(Math.random() * 10000);
                } while (STF.inSavedList({id: id}));

                return id;
            };

            STF.addTrip = function (trip) {

                if (!STF.inSavedList(trip)) {

                    if (!(trip.name)) {
                        trip.name = "General Trip";
                    }

                    trip.date = new Date();

                    if (trip.id != 0) {
                        trip.id = STF.generateUniqueID();
                    }

                    saved_trips.push(trip);
                    StoreSavedTrips();

                    return trip;
                }
                else return false;
            };

            STF.getSavedTrips = function () {
                return saved_trips;
            };

            STF.getTripById = function (tid) {
                console.log ('saved trips tid',saved_trips, tid  )
                for (var i = 0; i < saved_trips.length; i++) {
                    if (saved_trips[i].id === tid ) {
                        return saved_trips[i];
                    }
                }
                return false;
            };

            STF.updateSavedTrip = function (trip) {
                saved_trips.forEach(function (item) {
                    if (item.id === trip.id) {
                        item = trip;
                    }
                });
                StoreSavedTrips();
                //console.log ('updating', trip, saved_trips);
            };

            STF.removeSavedTrip = function (tid) {
                for (var i = 0; i < saved_trips.length; i++) {
                    // saved_trips
                    if (saved_trips[i].id === tid) {
                        saved_trips.splice(i, 1);
                        StoreSavedTrips();
                        return true;
                    }
                }
                return false;
            };

            return STF;
        }]
    )


    .service('ManagerPINService', ['$resource', 'config', '$rootScope',
        function ($resource, config, $rootScope) {

            this.partnerTransaction = function (pin, parid, num) {
                console.log ('pin, parid, num', pin, parid, num);
                return $resource(config.baseURL + '/api/partners/send_transaction',
                    null, {
                        query: {
                            method: 'POST',
                            cache: 'true',
                            headers: {
                                'Authorization': 'Token ' + 'token=' + $rootScope.apiKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            //cache : true,  // possible later
                            params: {
                                partner_id: parid,
                                pin: pin,
                                number_of_items: num
                            }
                        }
                    });
            };


        }])
;


