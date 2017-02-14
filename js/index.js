var app = angular.module('weatherApplication', ['ngResource', 'ngRoute']);

app.service('ipAddressService', ['$resource', '$http', function($resource, $http) {
	this.getIpAddress = function () {
		return $http.get("http://ip-api.com/json");
	}	
}]);

app.service('weatherService', ['$http', '$sce', function($http, $sce) {
	var APIKey = '7e88df9f21552c081d901bb32a6bad3b';
	this.getWeather = function (city, unit) {
		var request = {
			method: 'GET',
			url: 'http://api.openweathermap.org/data/2.5/weather',
			params: {
				appid: APIKey,
				q: city,
				units: unit
			}
		};
		return $http(request); 
	}
}]);

app.service('timeService', ['$http', '$interval', function($http, $interval) {
	this.getTimeZone = function(lat, lng) {
		var APIKey = 'AP8DQ360YJ6U';
		var request = {
			method: 'GET',
			url: 'http://api.timezonedb.com/v2/get-time-zone',
			params: {
				key: APIKey,
				by: 'position',
				format: 'json',
				lat: lat,
				lng: lng
			}
		};
		return $http(request);
	}
	
	this.getLocalTime = function(timestamp, offset, timezone) {

		var full = new Date(timestamp * 1000 + offset * 1000);
		var hour = full.getUTCHours();
		var minute = full.getUTCMinutes();
		var period = 'AM';
		if(hour >= 12) {
			period = 'PM';
			if(hour > 12) {
				hour -= 12;
			}
		}
		if(minute < 10) {
			minute = '0' + minute;
		}
		return hour + ":" + minute + " " + period + " " + timezone;
	}
	
	this.displayCurrentTime = function(scope, offset) {
		if(scope.clock !== undefined) {
			$interval.cancel(scope.clock);
		}
		scope.clock = $interval(function() {
			var time = new Date(new Date().getTime() + (offset * 1000));
			showTime();
			function showTime() {
				scope.currentHour = time.getUTCHours();
				if(scope.currentHour >= 12) {
					scope.currentPeriod = 'PM';
					if(scope.currentHour > 12) {
						scope.currentHour -= 12;
					}
				} else {
					scope.currentPeriod = 'AM';
				}
				scope.currentMinute = ('0' + time.getUTCMinutes()).slice(-2);
				scope.currentSecond = ('0' + time.getUTCSeconds()).slice(-2);
			}
		}, 1000);
	}
}]);

app.controller('weatherController', ['$scope', 'ipAddressService', 'weatherService', 'timeService', 'dateFilter', function($scope, ipAddressService, weatherService, timeService, dateFilter) {
	
	$scope.address = "";
	$scope.city = "";
	$scope.units = [{imperial: 'F'}, {metric: 'C'}];
	$scope.unit = $scope.units[1];
	$scope.metric = Object.keys($scope.unit)[0];
	$scope.format = 'h:mm:ss a';
	
	ipAddressService.getIpAddress().then(function(data) {
		
		$scope.address = data.data.query;
		$scope.timezone = data.data.timezone;
		$scope.city = data.data.city;
		
	}).then(function() {
		
		weatherService.getWeather($scope.city, $scope.metric).then(function(data) {
			
			$scope.weather = data.data;
			$scope.country = data.data.sys.country;
			
		}).then(function() {
			
			timeService.getTimeZone($scope.weather.coord.lat, $scope.weather.coord.lon).then(function(timeZoneData) {
				$scope.timezone = timeZoneData.data.zoneName;
				$scope.sunrise = timeService.getLocalTime($scope.weather.sys.sunrise, timeZoneData.data.gmtOffset, timeZoneData.data.abbreviation);
				$scope.sunset = timeService.getLocalTime($scope.weather.sys.sunset, timeZoneData.data.gmtOffset, timeZoneData.data.abbreviation);
				timeService.displayCurrentTime($scope, timeZoneData.data.gmtOffset);
			});
		});
	});
	
	$scope.chooseUnit = function(index) {

		$scope.unit = $scope.units[index];
		$scope.metric = Object.keys($scope.unit)[0];
		weatherService.getWeather($scope.city, $scope.metric).then(function(data) {
			
			$scope.weather = data.data;
			
		});
	}
	
	$scope.changeCity = function() {
		weatherService.getWeather($scope.searchCity, $scope.metric).then(function(weatherData) {
			
			$scope.weather = weatherData.data;
			$scope.city = weatherData.data.name;
			$scope.country = weatherData.data.sys.country;
			
			timeService.getTimeZone($scope.weather.coord.lat, $scope.weather.coord.lon).then(function(timeZoneData) {
				
				$scope.timezone = timeZoneData.data.zoneName;
				$scope.sunrise = timeService.getLocalTime(weatherData.data.sys.sunrise, timeZoneData.data.gmtOffset, timeZoneData.data.abbreviation);
				$scope.sunset = timeService.getLocalTime(weatherData.data.sys.sunset, timeZoneData.data.gmtOffset, timeZoneData.data.abbreviation);
				timeService.displayCurrentTime($scope, timeZoneData.data.gmtOffset);
				
			});
		});
	};
	
	$scope.sunny = function() {
		if($scope.weather !== undefined)
			return $scope.weather.weather[0].main === 'Clear';
	};
	
	$scope.rainy = function() {
		if($scope.weather !== undefined)
			return $scope.weather.weather[0].main === 'Rain';
	};
	
	$scope.cloudy = function() {
		if($scope.weather !== undefined)
			return $scope.weather.weather[0].main === 'Clouds';
	};
	
	$scope.snow = function() {
		if($scope.weather !== undefined)
			return $scope.weather.weather[0].main === 'Snow';
	};
	
	$scope.thunderstorm = function() {
		if($scope.weather !== undefined)
			return $scope.weather.weather[0].main === 'Thunderstorm';
	}

}]);