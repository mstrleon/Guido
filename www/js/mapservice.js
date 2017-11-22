angular.module('Guido.mapservice', [])

    .service('mapService', [
        '$resource',
        'config',
        '$rootScope',
        '$cordovaGeolocation',
        'leafletData',
        '$interval',
        'tripFactory',
        '$q',
        'historyService',
        '$ionicPopup',
        '$state',


        function ($resource,
                  config,
                  $rootScope,
                  $cordovaGeolocation,
                  leafletData,
                  $interval,
                 tripFactory,
                  $q,
                  historyService,
                  $ionicPopup,
                  $state

        ) {
            //получить все типы объектов
            //$rootScope.$on ('Poitypes_received', function (event) {

                    //console.log ('$rootScope.poitypes', $rootScope.poitypes);


            $rootScope.markers_put = false;

            $rootScope.map = {};
            $rootScope.map.mrkrs =[];
            $rootScope.poimarkers = [];

            $rootScope.marker_types = [
                {
                    name: 'Architecture',
                    id: 1,
                    icon: 'university',
                    color: '#d38d11',
                    url:'img/markers/architecture-marker.png',
                    url_s: 'img/markers/architecture-marker-special.png'
                },
                {
                    name: 'Art',
                    id: 2,
                    icon: 'picture',
                    color: '#93278f',
                    url:'img/markers/art-marker.png',
                    url_s:'img/markers/art-marker-special.png'
                },
                {
                    name: 'Cool and Unique',
                    id: 3,
                    icon: 'star-half-o ',
                    color: '#ff4a41',
                    url:'img/markers/cool-marker.png',
                    url_s:'img/markers/cool-marker-special.png'
                },
                {
                    name: 'Food',
                    id: 4,
                    icon: 'cutlery',
                    color: '#00d392',
                    url:'img/markers/food-marker.png',
                    url_s:'img/markers/food-marker-special.png'
                },
                {
                    name: 'Service',
                    id: 5,
                    icon: 'exchange',
                    color: '#2f3293',
                    url:'img/markers/services-marker.png',
                    url_s:'img/markers/services-marker-special.png',
                },
                {
                    name: 'Public Transport',
                    id: 6,
                    icon: 'bus',
                    color: '#e929a5',
                    url:'img/markers/bus-marker.png',
                    url_s:'img/markers/bus-marker-special.png'
                },
                {
                    name: 'Bicycle',
                    id: 7,
                    icon: 'bicycle',
                    color: '#e929a5',
                    url:'img/markers/bicycle-marker.png',
                    url_s:'img/markers/bicycle-marker-special.png'
                },
                {
                    name: 'Shopping',
                    id: 8,
                    icon: 'shopping-bag',
                    color: '#00aeef',
                    url:'img/markers/shopping-marker.png',
                    url_s:'img/markers/shopping-marker-special.png'
                },
                {
                    name: 'Info',
                    id: 9,
                    icon: 'info-circle',
                    color: '#00aeef',
                    url:'img/markers/info-marker.png',
                    url_s:'img/markers/info-marker-special.png'
                },
                {
                    name: 'Night',
                    id: 10,
                    icon: 'moon',
                    color: '#00aeef',
                    url:'img/markers/night-marker.png',
                    url_s:'img/markers/night-marker-special.png'
                },
                {
                    name: 'Sport',
                    id: 11,
                    icon: 'futbol-o',
                    color: '#00aeef',
                    url:'img/markers/sport-marker.png',
                    url_s:'img/markers/sport-marker-special.png'
                },
                {
                    name: 'Nature',
                    id: 12,
                    icon: 'tree',
                    color: '#00aeef',
                    url:'img/markers/nature-marker.png',
                    url_s:'img/markers/nature-marker-special.png'
                },
                {
                    name: 'Entertainment',
                    id: 13,
                    icon: 'ticket',
                    color: '#00aeef',
                    url:'img/markers/entertainment-marker.png',
                    url_s:'img/markers/entertainment-marker-special.png'

                },
                {
                    name: 'Cafe',
                    id: 14,
                    icon: 'coffee',
                    color: '#01d493',
                    url:'img/markers/coffee-marker.png',
                    url_s:'img/markers/coffee-marke-special.png'

                },
                {
                    name: 'Beach',
                    id: 15,
                    icon: 'sun-o',
                    color: '#00aeef',
                    url:'img/markers/beach-marker.png',
                    url_s:'img/markers/beach-marker-special.png'
                }

            ];

            $rootScope.currentSelectedMarker = null;


            /**
             *
             *  AddMarker function
             *
             * @param poi
             * @param mtype
             * @param selected
             */

            var markercluster = new L.MarkerClusterGroup();

            function addMarker (poi, mtype, selected) {
                /*var markerIcon = L.AwesomeMarkers.icon({
                    icon: mtype.icon,
                    markerColor: 'green',
                    iconColor: mtype.color,
                    prefix: 'fa',
                });*/

                var markerIcon = L.icon({
                    iconUrl:mtype.url,
                    iconRetinaUrl: mtype.url,
                    iconSize: [25, 25],
                    iconAnchor: [10, 10],
                    className:'poi-marker marker-'+mtype.icon
                });




                leafletData.getMap().then(function (map) {

                    var mar = L.marker([poi.lat, poi.lon], {
                        draggable: false,
                        icon: markerIcon,
                        id:poi.id,
                        type_id: mtype.id
                    });
                    if ($rootScope.poiDataList[poi.id].partner_id>0) {
                        mar.setIcon(
                            L.icon({
                                iconUrl:mtype.url_s,
                                iconRetinaUrl: mtype.url_s,
                                iconSize: [25, 25],
                                iconAnchor: [10, 10],
                                className:'poi-marker marker-special marker-'+mtype.icon
                            })
                        );
                    }



                    mar.on('click', function(event) {
                        console.log(event);
                        //map.removeLayer(mar);

                        if (  $rootScope.currentSelectedMarker != null) {
                            console.log($rootScope.currentSelectedMarker);
                            $rootScope.currentSelectedMarker.setIcon($rootScope.currentSelectedIcon);
                        }

                        $rootScope.currentSelectedIcon = mar.options.icon;

                        console.log ('cursel icon, mar', $rootScope.currentSelectedIcon, mar);


                        if ($rootScope.poiDataList[poi.id].partner_id > 0) {
                            mar.setIcon(
                                L.icon({
                                    iconUrl:mtype.url_s,
                                    iconRetinaUrl: mtype.url_s,
                                    iconSize: [38, 38],
                                    iconAnchor: [19, 19],
                                    className:'poi-marker marker-big marker-special marker-'+mtype.icon
                                })
                            );
                        } else {
                            mar.setIcon(
                                L.icon({
                                    iconUrl:mtype.url,
                                    iconRetinaUrl: mtype.url,
                                    iconSize: [38, 38],
                                    iconAnchor: [19, 19],
                                    className:'poi-marker marker-big marker-'+mtype.icon
                                })
                            );

                        }

                        $rootScope.currentSelectedMarker = mar;
                        $rootScope.showPoiFooter (event.target.options.id);
                    });

                    $rootScope.poimarkers.push(mar);

                    markercluster.addLayer(mar);
                    //  before: map.addLayer(mar);

                   // map.removeLayer(mar);
                   // map.addLayer($rootScope.poimarkers[$rootScope.poimarkers.length-1]);


                    //$rootScope.map.mrkrs.push(mar);
                });
            }

            /**
             *  END AddMarker function
             */



            //функция удаления маркера
            //функция ротации текущего маркера
            //фильрация??


            /**
             *   Initialising the map and Router
             *
             */
            this.initMap = function () {

                /**
                 *   Initialising the map
                 */

                $rootScope.user_lon = config.lon;
                $rootScope.user_lat = config.lat;

                $rootScope.map = {
                    defaults: {
                        maxZoom: 21,
                        minZoom:7,
                        zoomControlPosition:'topleft',

                    },
                    markers: {},
                    events: {
                        map: {
                            enable: ['context'],
                            logic: 'emit'
                        }
                    }
                };

                $rootScope.default_marker_icon = {
                    iconUrl: 'lib/marker-icon.png',
                    shadowUrl: 'lib/marker-shadow.png',

                };

                $rootScope.map.center = {
                    lat:  $rootScope.user_lat,
                    lng:  $rootScope.user_lon,
                    zoom: 8

                };
/*
                $rootScope.map.tiles = {
                    url: "https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibXN0cmxlb24iLCJhIjoiY2oyeTdsa3JoMDAzODJxbnY3MjhoNGg5cCJ9.dqcDjr8sOXz3Grg2r15vgg"
                };
*/




                /**
                 *  END  Initialising the map
                 *
                 */


                leafletData.getMap().then(function (map) {


                    $rootScope.map.center = {
                        lat: config.lat,
                        lng: config.lon,
                        zoom: 13

                    };

                    // Adding some controls to map
                   /* L.easyButton('ion-merge leaflet-locate', function () {
                        $rootScope.locateAndRoute();
                    }).addTo(map);*/

                    /*L.easyButton('ion-android-locate leaflet-locate', function () {
                        $rootScope.locate();
                    }).addTo(map);*/



                    L.control.scale().setPosition('bottomleft').addTo(map);

                   /* var poipopup = L.popup()
                        .setContent('')
                        .openOn(map);

*/


                    /**
                     *  Init the Router
                     *
                     */


                    var waypoints = [
                        L.latLng(config.lat, config.lon)
                    ];



                    var destinationIcon = L.AwesomeMarkers.icon({
                        icon: 'circle',
                        markerColor: 'cadetblue',
                        iconColor:'#00d392',
                        prefix: 'fa',
                        className:'destination-marker',
                    });

                    var startIcon = L.AwesomeMarkers.icon({
                        icon: 'circle',
                        markerColor: 'orange',
                        iconColor:'#00d392',
                        prefix: 'fa',
                        className:'start-marker',
                        iconSize: [15, 15],
                        iconAnchor: [10, 10],
                    });


                    var userIcon = L.icon({
                        iconUrl: 'img/arrow-me.png',
                        iconRetinaUrl:'img/arrow-me.png',
                        iconSize: [38, 38],
                        iconAnchor: [19, 19],
                        className:'user-marker',

                    });


                    /**
                     *  implementing mapbox gl leaflet
                     */

                    var gl = L.mapboxGL({
                        accessToken: config.mapboxToken,
                        style: 'mapbox://styles/mapbox/bright-v8'
                        //style: 'mapbox://styles/mapbox/streets-v9'

                    }).addTo(map);


                    /**
                     *  END implementing mapbox gl leaflet
                     */


                    $rootScope.usermarker = L.marker([$rootScope.user_lat, $rootScope.user_lon], {
                        draggable: false,
                        icon: userIcon,
                        rotationAngle:0
                    }).bindPopup('You are here <i class="ion-ios-body"></i> ')
                        .addTo(map);

                    $rootScope.locateAndRoute();
                    //$interval($rootScope.locate, 3000);

                    $rootScope.control = L.Routing.control({
                        router: L.Routing.mapbox(config.mapboxToken, {
                                serviceUrl: 'https://api.mapbox.com/directions/v5',
                                  profile: 'mapbox/walking'
                        }
                        ),

                        autoRoute:false,

                        plan: L.Routing.plan(waypoints, {
                            createMarker: function (i, wp) {
                                $rootScope.wp = wp;
                                //var popup_tpl =
                                   // "<div class='item-thumbnail-left'> <img onclick='poiDetailShow(" + wp.id + ")' src='" + config.baseURL + wp.img + "'></div><b>" + wp.name + "</b>";

                                if (i === 0) {
                                    return L.marker(wp.latLng, {
                                        draggable: false,
                                        icon: startIcon
                                    }).bindPopup('Start of the route');
                                } else {
                                    var destmarker = L.marker(wp.latLng, {
                                        draggable: false,
                                        zIndexOffset:-999,
                                        id:wp.id,
                                        icon: destinationIcon,
                                    });
                                    destmarker.on('click', function (event) {
                                        //console.log('clicevent',event);
                                        if ($rootScope.currentSelectedMarker!=null) {
                                            $rootScope.currentSelectedMarker.setIcon($rootScope.currentSelectedIcon);

                                        }
                                        $rootScope.showPoiFooter (event.target.options.id);

                                    } );

                                    return destmarker;
                                }
                            },
                            addWaypoints: false,
                            draggableWaypoints: false
                        }),
                        addWaypoints: false,
                        routeWhileDragging: false,
                        draggableWaypoints: false,
                        lineOptions: {
                            styles: [
                                {color: 'black', opacity: 0.3, weight: 7},
                                {color: 'white', opacity: 0.9, weight: 7},
                                {color: '#00d392', opacity: 1, weight: 3}
                            ]
                        },

                    })
                        .addTo(map)
                        .on('routingerror', function (e) {
                            try {
                                map.getCenter();
                            } catch (e) {
                                map.fitBounds(L.latLngBounds(waypoints));
                            }
                            // handleError(e);
                        });





                    $rootScope.control.hide();

                    /// Uncomment for GPS view
                    //$rootScope.getAndLocate();


                    var wp = $rootScope.control.getWaypoints();

                    $rootScope.locateAndRoute();
                    //$rootScope.control.route();

                    $rootScope.control.on('routesfound', function (e) {

                        $rootScope.TripDistance = $rootScope.roundDist(e.routes[0].summary.totalDistance);
                        $rootScope.TripTime = $rootScope.seconds2time(Math.round(e.routes[0].summary.totalTime));

                        $rootScope.TripTimeSec = Math.round(e.routes[0].summary.totalTime);
                        $rootScope.VisitSum = tripFactory.getVisitSum();

                        if ($rootScope.TripDistance > 3) {
                            $rootScope.showMessage ('Trip distance is more than 3 km. We suggest to use '+$rootScope.NativeMapApp+' for routing.');
                            $rootScope.invite_maps = true;
                        } else {
                            $rootScope.invite_maps = false;
                        }
                    });



                    //console.log('wp on Init', wp);

/// Uncomment for manual view

                    /*
                     $rootScope.map.center = {
                     lat: config.lat,
                     lng: config.lon,
                     zoom: 8
                     };

                     */
                    /**
                     * END Init the Router
                     */

                });

/*  commented to remove caching
                $rootScope.$on ('StoredDataLoaded', function (event) { //change to StoredPoiDataLoaded'
                    //console.log('event StoredDataLoaded cought');
                    // Adding markers
                    for (var i = 0; i<$rootScope.poiDataList.length; i++) {
                        if ($rootScope.poiDataList[i]==null) continue;
                        var type_id = $rootScope.poiDataList[i].poi_type_id-1;
                        if ( isNaN(type_id) ) continue;
                        var mtype = $rootScope.marker_types[type_id];
                        var poi = $rootScope.poiDataList[i];
                        addMarker (poi, mtype);
                    }

                    $rootScope.markers_put = true;

                });//$rootScope.$on ('StoredDataLoaded', function (event)
*/


                $rootScope.$on ('AllDataLoaded', function (event) {
                    console.log('event DataLoaded cought');
                    if (!$rootScope.markers_put) {
                        ////console.log('putting markers');
                        for (var i = 0; i < $rootScope.poiDataList.length; i++) {
                            if ($rootScope.poiDataList[i] == null) continue;
                            var type_id = $rootScope.poiDataList[i].poi_type_id - 1;
                            if (isNaN(type_id)) continue;
                            var mtype = $rootScope.marker_types[type_id];
                            var poi = $rootScope.poiDataList[i];
                            //console.log(mtype, poi);
                            addMarker(poi, mtype);
                        }

                        leafletData.getMap().then(function (map) {
                            map.addLayer(markercluster);
                        });
                        $rootScope.markers_put = true;
                    }

                });//$rootScope.$on ('DataLoaded', function (event)


                $rootScope.$on ('sel_types_changed', function () {

                    $rootScope.map.mrkrs = [];

                    //markercluster.clearLayers();

                    leafletData.getMap().then(function (map) {

                        for (var i = $rootScope.poimarkers.length - 1; i > -1; i--) {

                            //console.log($rootScope.poimarkers[i]);
                            if ($rootScope.sel_poi_types.indexOf($rootScope.poimarkers[i].options.type_id) > -1) {
                                markercluster.addLayer($rootScope.poimarkers[i]);
                            } else {
                                markercluster.removeLayer($rootScope.poimarkers[i]);
                            }
                        }
                       // map.addLayer(markercluster);

                    });

                });



                /**   Adding POI to map.
                 *
                 *  ловим события адд/ремов (addingPoi) из tripFactory
                 *  и добавляем маркер на карту
                 */

                $rootScope.$on('addingPoi', function (event, data) {
                    //console.log('map in event addingPOi', $rootScope.map);

                    /*  пока что не ставим маркеры
                     $rootScope.map.markers[data.id] = {
                     lat: parseFloat(data.lat),
                     lng: parseFloat(data.lon),
                     message: data.name,
                     focus: false,
                     draggable: false,
                     icon: $scope.default_marker_icon

                     };
                     */


                    // Adding to Map Router
                    leafletData.getMap().then(function (map) {

                        //console.log ('$rootScope.map.markers', $rootScope.map);

                        var wps = $rootScope.control.getWaypoints();
                        var routeplan = $rootScope.control.getPlan();

                        var name_tpl = data.name;//$templateCache.get('maptip');

                        var new_wp = {
                            latLng: L.latLng(parseFloat(data.lat), parseFloat(data.lon)),
                            name: name_tpl,
                            id: data.id,
                            img: data.image_thumb
                        };

                        if (!routeplan.isReady()) {    // check if last wp is is the second in array of waypoints
                            //and if it is null (first init)
                            $rootScope.control.spliceWaypoints(1, 1, new_wp);
                            //console.log('wps.length == 2 && wps[1].latLng == null  --- wps', wps);

                        } else {

                            $rootScope.control.spliceWaypoints(
                                wps.length - 1,
                                0,
                                new_wp
                            );
                        }

                        var wp = $rootScope.control.getWaypoints();
                        /* wp.push( L.latLng(parseFloat(data.lat), parseFloat(data.lon)) );
                         L.Routing.Control.setWaypoints(wp).addTo(map);
                         */

                        //routeplan ({waypoints: wp, draggableWaypoints: false });

                        $rootScope.locateAndRoute();
                        //$rootScope.control.route();
                        //console.log('wp on addingPoi after', wps);

/*
*
*
*
*   $rootScope.TripDistance = '';
 $rootScope.TripTime = '';
*
*
* */
                    });

                });

                /** END adding POi to map
                 *
                 */


                $rootScope.$on('removingPoi', function (event, data) {
                    var j = historyService.inClosePool(data);
                    if (j>=0)  $rootScope.close_to_pool.splice (j,1);

                    leafletData.getMap().then(function (map) {
                        var wps = $rootScope.control.getWaypoints();
                        //console.log('wp on removingPoi', event, data, wps);

                        $rootScope.minimiseFooter();
                        $rootScope.invite_maps=false;
                        if (wps[1].latLng != null) {    // check if last wp is is the second in array of waypoints
                            // and if it is null (first init)

                            if (wps.length == 2) {
                                $rootScope.TripDistance = '';
                                $rootScope.TripTime = '';

                            }



                            for (var i=1; i<wps.length; i++) {
                                if (wps[i].id == data) {
                                    $rootScope.control.spliceWaypoints(i, 1);
                                    break;
                                }
                            }

                            //console.log('wp after removingPoi', wps);
                        }
                        $rootScope.locateAndRoute();
                       // $rootScope.control.route();
                        //console.log('wp on removingpoi after', wps);

                    });

                });


               // $rootScope.locate();


            };

            /**
             * END InitMap();
             */

            /**
             *  centerToPoi - centering map on poi location
             * @param poi
             */

            $rootScope.centerToPoi = function (poi) {
                $rootScope.map.center = {
                    lat: //config.lat+1,//
                        parseFloat(poi.lat),
                    lng: //config.lon+1,
                        parseFloat(poi.lon),
                    zoom: 19
                };

                console.log ('$rootScope.poimarkers', $rootScope.poimarkers);
                var marker = $rootScope.getMarker(poi.id);
                marker.fire('click');
                markercluster.zoomToShowLayer(marker);
                console.log ('marker', marker);
            }
            /**
             *  END centerToPoi
             */

            /**
             * getMarker
             * @param pid
             * @return marker
             */

            $rootScope.getMarker = function (pid) {
                for (var i = 0; i<$rootScope.poimarkers.length; i++) {
                    if ($rootScope.poimarkers[i].options.id == pid) return $rootScope.poimarkers[i];
                }
                return null;
            }

            /**
             *  END getMarker
             */



            /**
             * Center map on user's current position and route
             */

            $rootScope.locateAndRoute = function () {

                console.log('locateAndRoute fired', this);


                $cordovaGeolocation
                    .getCurrentPosition()
                    .then(function (position) {


                        $rootScope.map.center = {
                            lat: //config.lat+1,//
                                parseFloat(position.coords.latitude),
                            lng: //config.lon+1,
                                parseFloat(position.coords.longitude),
                            zoom: 9
                        };
                        var loc = L.latLng(
                            parseFloat(position.coords.latitude),
                            parseFloat(position.coords.longitude)
                        );

                        $rootScope.user_lat = parseFloat(position.coords.latitude);
                        $rootScope.user_lon = parseFloat(position.coords.longitude);


                        $rootScope.routing_was = true;
                        $rootScope.usermarker.setLatLng(loc);

                        //console.log("position", position);


                        if ( $rootScope.TripList.length>0 ) {
                           // if (!$rootScope.isFar()) {
                                //console.log("$rootScope.control.getWaypoints()", $rootScope.control.getWaypoints());
                                $rootScope.control.spliceWaypoints(0, 1, loc);


                                if (checkThatAllNear()) {
                                    $rootScope.control.route();
                                }
                                //
                            //}
                        }





                    }, function (err) {
                        // error
                        //console.log("Location error! init");
                        //console.log(err);
                    });


                //console.log($rootScope.map);
            };


            $rootScope.seconds2time = function  (seconds) {
                var hours   = Math.floor(seconds / 3600);
                var minutes = Math.floor((seconds - (hours * 3600)) / 60);
                var seconds = seconds - (hours * 3600) - (minutes * 60);
                seconds = Math.round(seconds);
                var time = "";

                if (hours != 0) {
                    time = hours+"h ";
                }
                if (minutes != 0 || time !== "") {
                    minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
                    time += minutes+'min';
                }
                if (time === "") {
                    time = seconds+" s";
                }
                else {
                   // time += (seconds < 10) ? "0"+seconds : String(seconds);
                }
                return time;
            };
/*
            $rootScope.isFar = function () {

                console.log ('$rootScope.TripList[0]  $rootScope.user_lat ' , $rootScope.TripList[0], $rootScope.user_lat );

                var slat = $rootScope.poiDataList[$rootScope.TripList[0].id].lat;
                var slon = $rootScope.poiDataList[$rootScope.TripList[0].id].lon;
                var one_dist = $rootScope.getDistanceFromLatLonInKm ($rootScope.user_lat, $rootScope.user_lon, slat, slon);

                //

                if (one_dist > 50) {
                    console.log ('Distance more than 50 km');

                    $rootScope.TripDistance = one_dist;
                    if ($rootScope.TripDistance > 3) {
                        $rootScope.showMessage ('Trip distance is too far. You can use '+$rootScope.NativeMapApp+' for routing.');
                        $rootScope.invite_maps = true;
                    } else {
                        $rootScope.invite_maps = false;
                    }


                    return true;
                } else {
                    return false;
                }

            }
*/
            $rootScope.getDistanceFromLatLonInKm = function (lat1,lon1,lat2,lon2) {
                var d =  $rootScope.getDistanceFromLatLonInM(lat1,lon1,lat2,lon2);
                return $rootScope.roundDist(d);
            }

            $rootScope.getDistanceFromLatLonInM = function (lat1,lon1,lat2,lon2) {

                var R = 6371000; // Radius of the earth in km
                var dLat = deg2rad(lat2-lat1);  // deg2rad below
                var dLon = deg2rad(lon2-lon1);
                var a =
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                        Math.sin(dLon/2) * Math.sin(dLon/2)
                    ;
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                var d = R * c; // Distance in km
               return d;
            };

            var deg2rad = function (deg) {
                return deg * (Math.PI/180)
            };

            $rootScope.roundDist = function (metres) {
                return Math.floor (parseFloat(metres/1000)*10)/10;
            };

            $rootScope.inSeen = historyService.inSeen;


            $rootScope.inNotified = historyService.inNotified;

            //$rootScope.sentalarm = false;


            var checkCloseCoupon = function () {
                for (var i in $rootScope.poiDataList) {
                    var poi = $rootScope.poiDataList[i];

                    //console.log ('poi:', poi.id, poi.name,  poi, poi.partner_id);
                    if (poi.partner_id>0) { // poi has coupon ?
                        var j = historyService.inNotified(poi.id);
                        var dist = $rootScope.getDistanceFromLatLonInM(poi.lat, poi.lon, $rootScope.user_lat, $rootScope.user_lon);
                        //console.log ('cc poi has coupon, dist:', poi.name, poi.id,  dist);
                        if (dist < config.NOTIFY_DISTANCE) { // distance < notify_distance
                            if (j>=0) { // in notified pool already
                              //  console.log ('ccc poi in notified pool, dist:', poi.name, poi.id,  dist, $rootScope.notified_pool );
                                continue;
                            } else { // not in notified pool
                                $rootScope.notified_pool.push (poi.id);
                                $rootScope.sendPushPoi(poi);



                                   // $rootScope.sentalarm = true;
                                //}

/*
                                confirmGo.then(function (res) {
                                    if (res) {
                                       $state.go('app.poidetails', {id: id})

                                    } else {

                                    }
                                   // $rootScope.sentalarm = false;
                                });

*/

                                console.log ('ccc PUSH notification and put to pool - we are close to and not in pool ', poi.name, poi.id, $rootScope.notified_pool);
                                //push notification()
                            }
                        } else { // distance > notify_distance
                            if (j>=0) { // in notified pool
                                if (dist > config.REMOVE_NOTIFIED_DISTANCE) { // distance > REMOVE_NOTIFIED_DISTANCE
                                    console.log ('ccc removing from pool ', poi.name, poi.id,  $rootScope.notified_pool);
                                    $rootScope.notified_pool.splice(j,1);
                                } else { // NOTIFY_DISTANCE< distance < REMOVE_NOTIFIED
                                    continue;
                                }
                            } else {  // not in NOTIFIED_POOL and NOTIFFY_DISTANCE < distance
                                continue;
                            }
                        } // END else { // distance > notify_distance
                    } // END if poi has coupon
                } // END for all poiDataList
            };

            $rootScope.route_not_enabled = false;
            var checkTripClosePoi  = function () {

                //var routing_far = false;

                for (var i in $rootScope.TripList) {
                    var poi = $rootScope.TripList[i];
                    /*
                    // check for routing
                    if (!$rootScope.areWeClose(poi.lat, poi.lon, config.ROUTING_DISTANCE)) {
                        routing_far = true;
                        continue;
                    }
*/
                    // now check for history
                    if (!$rootScope.inSeen(poi.id)) { // this poi is not in history - not marked seen
                        var j = historyService.inClosePool(poi.id);
                        if ($rootScope.areWeClose(poi.lat, poi.lon, config.SEEN_DISTANCE)) { // we are close to POI
                            console.log ('we are close to ', poi.name, $rootScope.close_to_pool);
                            var now = new Date;

                            if ( j >= 0 ) {
                                if (now - $rootScope.close_to_pool[j].time >= config.SEEN_TIME ) {// user stays more than 3 minutes
                                    console.log ('we !mark poi seen', poi.name, poi);
                                    historyService.markSeen(poi.id).query (
                                        function (res) {
                                            historyService.updateSeen();
                                        },
                                        function (res) {
                                            console.log('error', res);
                                        }
                                    );

                                    $rootScope.close_to_pool.splice(j,1);
                                } else {
                                    continue;
                                }
                            } else { // not in pool - add
                                $rootScope.close_to_pool.push({'id':poi.id, 'time': now});

                                console.log ('we add to pool', poi.name, poi, $rootScope.close_to_pool);
                            }


                        }  else  {  // we are far (left close area) {

                            if ( j >= 0 ) {  // it was in pool - we gotta remove it from pool
                                $rootScope.close_to_pool.splice(j,1);
                                console.log ('we remove from pool', poi.name, poi,$rootScope.close_to_pool );
                            }
                        }  // else it is not in pool and we are far

                    }// else - it is seen - no problemo ;)

                } //  for (var i in $rootScope.TripList) {



                /*
                if (routing_far) {
                    disableRouting ();
                    $rootScope.route_not_enabled = true;
                } else {
                    if ($rootScope.route_not_enabled) {
                        enableRouting();
                        $rootScope.route_not_enabled = false;
                    }
                }
                */
            }

            function disableRouting () {
                L.Routing.control({
                    waypoints: []
                    }
                );
            }




            function checkThatAllNear () {
                var routing_far = false;
                console.log ('checkallthatnear triplist', $rootScope.TripList);

                for (var i in $rootScope.TripList) {
                    var poi = $rootScope.TripList[i];
                    if (!$rootScope.areWeClose(poi.lat, poi.lon, config.ROUTING_DISTANCE)) {
                        routing_far = true;

                    }
                }
                console.log ('checkallthatnear result', $rootScope.TripList, routing_far);
                return !routing_far;
            }


            $rootScope.areWeClose = function (lat2,lon2,dist)  {
                var lat1 = $rootScope.user_lat;
                var lon1 = $rootScope.user_lon;

                return ( $rootScope.getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) <= dist );

            };

            console.log ('mapservice init');


            $rootScope.locate = function () {


                var deferred = $q.defer();

                $cordovaGeolocation
                    .getCurrentPosition()
                    .then(function (position) {

                        /* $rootScope.map.center = {
                         lat: //config.lat+1,//
                         parseFloat(position.coords.latitude),
                         lng: //config.lon+1,
                         parseFloat(position.coords.longitude),
                         zoom: 9
                         };*/
                        var loc = L.latLng(
                            parseFloat(position.coords.latitude),
                            parseFloat(position.coords.longitude)
                        );
                        if ($rootScope.usermarker) {
                            $rootScope.usermarker.setLatLng(loc)
                        }


                        $rootScope.user_lat = parseFloat(position.coords.latitude);
                        $rootScope.user_lon = parseFloat(position.coords.longitude);

                        deferred.resolve ('location received');


                        // checking if we are close to poi from a triplist

                        checkTripClosePoi();
                        checkCloseCoupon();

                        if (checkThatAllNear()) { // now triplist is near
                            if ($rootScope.disabledRoute) { //before it was far
                                $rootScope.locateAndRoute();
                                $rootScope.disabledRoute = false;
                                $rootScope.FarMessageShown = false;
                            }

                        } else { // now triplist is far
                            if (!$rootScope.FarMessageShown) {
                                $rootScope.showMessage('You are too far. Please use '+$rootScope.NativeMapApp + ' for directions.');
                                $rootScope.FarMessageShown = true;
                            }

                            $rootScope.disabledRoute = true;
                        }



                        //console.log("position", position);

                    }, function (err) {
                        // error
                        console.log("Location error!");
                        console.log(err);
                        deferred.reject(err);
                    });
                return deferred.promise;
            };

            return this;

        }]);
