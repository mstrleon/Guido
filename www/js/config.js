'use strict';

angular.module('Guido.config',[])

.constant('config', {
    baseURL: "http://api.guido.si",
    token: "5760640d78c6ef0f1a6bde5e57d002c0",
    pin:'9132',
    lang_id: 20,
    lat: 46.066960786916475,
    lon: 14.50621247291565,
    unit: 'km',
    enableDebug: true,
    mapboxToken: 'pk.eyJ1IjoibXN0cmxlb24iLCJhIjoiY2oyeTdsa3JoMDAzODJxbnY3MjhoNGg5cCJ9.dqcDjr8sOXz3Grg2r15vgg',

    NEARME_RADIUS: 1, // in km, radius for nearme pois
    SEEN_TIME: 300000, // in ms time after which POI is considered to be seen
    SEEN_DISTANCE: 20, // in m
    ROUTING_DISTANCE: 200000, // in m
    NOTIFY_DISTANCE: 200, // in m
    REMOVE_NOTIFIED_DISTANCE: 300,  // in m,  distance from which a poi is removed from 'Notified' pool
                                    // and when user reaches NOTIFY_DISTANCE, push notification can be sent again
    ENTER_PIN_DISTANCE :100 // distance in km after which enter PIN and place an order is possible (DISABLED FOR NOW) (TODO:make metres)

})


;
