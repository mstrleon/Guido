angular.module('Guido.filters', []).filter('htmlToPlaintext', function () {
        return function (text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    }
)
    .filter("onlyLetters",
        function () {
            return function (input) {
                var lower = input.toLowerCase();
                var upper = input.toUpperCase();

                var res = "";
                for (var i = 0; i < lower.length; ++i) {
                    if (lower[i] != upper[i] || lower[i].trim() === '')
                        res += input[i];
                }
                return res;
            }
        }
    )

    .filter('HHMMSS', ['$filter', function ($filter) {
        return function (input, decimals) {
            var sec_num = parseInt(input, 10),
                decimal = parseFloat(input) - sec_num,
                hours   = Math.floor(sec_num / 3600),
                minutes = Math.floor((sec_num - (hours * 3600)) / 60),
                seconds = sec_num - (hours * 3600) - (minutes * 60);

            if (hours   < 10) {hours   = "0"+hours;}
            if (minutes < 10) {minutes = "0"+minutes;}
            if (seconds < 10) {seconds = "0"+seconds;}
            var time    = hours+':'+minutes+':'+seconds;
            if (decimals > 0) {
                time += '.' + $filter('number')(decimal, decimals).substr(2);
            }
            return time;
        };
    }])
;
