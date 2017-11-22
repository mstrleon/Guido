// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('Guido', [
        'ionic',
        'elif',
        'leaflet-directive',
        'ngCordova',
        'angular-google-analytics',
        'igTruncate',
        'ngProgress',
        'Guido.init',
        'Guido.controllers',
        'Guido.services',
        'Guido.mapservice',
        'Guido.filters',
        'Guido.directives',
        'Guido.config',
        'angularSpinner'
    ]
)

    .run(function ($ionicPlatform, Analytics) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, AnalyticsProvider) {
        AnalyticsProvider.setAccount('UA-104338316-1');
        AnalyticsProvider.setHybridMobileSupport(true);
        AnalyticsProvider.enterDebugMode(false);
        $ionicConfigProvider.navBar.alignTitle('center');
        $stateProvider

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/mainmenu.html',
                controller: 'AppCtrl'
            })

            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'EnterUserPinCtrl'
            })

            .state('app.currenttrip', {
                reloadOnSearch: false,
                url: '/currenttrip',
                showname: 'Your Current Trip',


                views: {
                    'mainContent': {
                        templateUrl: 'templates/currenttrip.html',
                        controller: 'CurrentTripController'

                    }
                }
            })

            .state('app.mapview', {
                url: '/mapview',
                showname: 'Map View',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/mapview.html',
                        controller: 'MapController'
                    }
                }
            })


            .state('app.newtrip', {
                url: '/newtrip',
                showname: 'Create your trip',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/newtrip.html',
                        controller: 'NewTripController'
                    }
                }
            })


            .state('app.savedtrips', {
                reloadOnSearch: false,
                showname: 'Saved Trips',
                url: '/savedtrips',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/savedtrips.html',
                        controller: 'SavedTripsController',
                    }
                }
            })
            .state('app.nearme', {
                url: '/nearme',
                showname: 'Near Me',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/nearme.html',
                        controller: 'NearMeController',
                        reload: true
                    }
                }
            })

            .state('app.history', {
                url: '/history',
                showname: 'History',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/history.html',
                        controller: 'HistoryController'
                    }
                }
            })

            .state('app.favorites', {
                url: '/favorites',
                showname: 'Favorites',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/favorites.html',
                        controller: 'FavoritesController'
                    }
                }
            })


            .state('app.mostvisited', {
                url: '/mostvisited',
                showname: 'Most Visited',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/mostvisited.html',
                        controller: 'MostVisitedController'
                    }
                }
            })


            .state('app.poidetails', {
                url: '/poi/:id',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/poi-detail.html',
                        controller: 'PoiDetailController',
                        resolve: {
                            poi: ['$stateParams', 'poiDataService', function ($stateParams, poiDataService) {
                                return poiDataService.loadPoi(parseInt($stateParams.id));
                            }]
                        }
                    }
                }
            })

            .state('app.tripdetails', {
                url: '/trip/:id',
                views: {
                    'mainContent': {
                        templateUrl: 'templates/trip-detail.html',
                        controller: 'TripDetailController',
                        resolve: {
                            trip:['$stateParams', 'savedTripsFactory', function ($stateParams, savedTripsFactory) {
                                return savedTripsFactory.getTripById(parseInt($stateParams.id));
                            }]
                        }
                    }
                }
            });


        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/newtrip');

    })
;