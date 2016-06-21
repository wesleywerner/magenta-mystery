(function() {
    
    var magentaMysteryApp = angular.module('magentaMysteryApp', []);

    magentaMysteryApp.factory('magentaService', ['$rootScope', function($rootScope) {
        var self = { };
        
        self.detective = {
            name: 'Molly',
            rank: 'Sleuth',
            cases: 0,
            city: undefined,
            citiesVisited: 0
        };
        
        self.thief = {
            name: 'Ping',
            sex: 'F',
            artifact: 'cat biscuits',
            previousCity: undefined,
            city: undefined,
        };
        
        self.reset = function() {
            self.clock = new Date('1 Jun 2015 5:00:00 GMT');
            self.status = NO_CASE;
            self.detective.citiesVisited = 0;
            self.thief.city = undefined;
        };

        self.reset();
        return self;
    }]);

    magentaMysteryApp.controller('viewController', ['$scope', '$http', 'magentaService', function($scope, $http, magentaService) {

        $scope.magenta = magentaService;
        $scope.detective = magentaService.detective;
        $scope.thief = magentaService.thief;

        /**
         * User interface & navigation
         */
        $scope.currentView = 0;

        $scope.viewLocation = function() {
            $scope.currentView = 0;
        };
        $scope.viewInvestigate = function() {
            $scope.currentView = 1;
        };
        $scope.viewDepart = function() {
            $scope.currentView = 2;
        };
        $scope.viewInterpol = function() {
            $scope.currentView = 3;
        };
        $scope.viewBriefing = function() {
            $scope.currentView = 4;
        };
        $scope.viewArrest = function() {
            $scope.currentView = 5;
        };
        $scope.viewIsLocation = function() {
            return $scope.currentView === 0;
        };
        $scope.viewIsInvestigate = function() {
            return $scope.currentView === 1;
        };
        $scope.viewIsDepart = function() {
            return $scope.currentView === 2;
        };
        $scope.viewIsInterpol = function() {
            return $scope.currentView === 3;
        };
        $scope.viewIsBriefing = function() {
            return $scope.currentView === 4;
        };
        $scope.viewIsArrest = function() {
            return $scope.currentView === 5;
        };

        /**
         * Case status
         */
        $scope.caseActive = function() {
            return magentaService.status == CASE_ACTIVE;
        };
        $scope.caseFailed = function() {
            return magentaService.status == CASE_FAILED;
        };
        $scope.noCase = function() {
            return magentaService.status == NO_CASE;
        };
        $scope.beginCase = function() {
            if (magentaService.status != CASE_ACTIVE) {
                magentaService.status = CASE_ACTIVE;
                $scope.viewLocation();
            };
        };

        /**
         * Game clock
         * ==========
         */
        $scope.addTravelTime = function(hours) {
            
            var hh = magentaService.clock.getHours();
            
            // sleep after hours
            if (hh > 18) {
                magentaService.clock.setHours(24 - hh);
                magentaService.clock.setDate(magentaService.clock.getDate() + 1);
                hh = 0;
            }
            
            // sleep early morning, but not later than 10 a.m.
            if (hh < 7) {
                magentaService.clock.setHours(Math.min(hh + 7, 10));
            }
            else {
                magentaService.clock.setHours(hh + hours);
            }
            
            // check if we have run out of time
            if (magentaService.clock.getDay() == 0 && magentaService.clock.getHours() >= 17) {
                magentaService.status = CASE_FAILED;
            }
            
        };

        $scope.clock = function() {
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days[magentaService.clock.getDay()] + ', ' + magentaService.clock.getHours() + 'h00';
        };
        
        /**
         * Cities and Places within cities
         * ===============================
         */

        // places to investigate within the city
        $scope.currentPlace = undefined;
        
        // Every visit to a place adds more time to the offset. Travelling to a new city resets this offset.
        $scope.placeTimeOffset = 0;

        // Jet to another city.
        // This sets new places, intestigative replies and destinations.
        $scope.gotoCity = function(city, callback) {
            
            var firstMove = ($scope.detective.city == undefined);
            $scope.placeTimeOffset = 0;
            $scope.destinations = [];

            // The agent can come back to this city
            var previousCity = $scope.detective.city;
            if (previousCity != undefined) {
                $scope.destinations.push(previousCity);
            };
            
            // Generate a list of cities to jet to. The number of cities can
            // vary for the agent's skill (TODO).
            var destinationCitiesCount = 3;
            destinationCitiesCount -= $scope.destinations.length;
            $scope.detective.city = city;
            $scope.destinations = $scope.destinations.concat(
                getRandomItems(
                    $scope.cities, 
                    destinationCitiesCount, 
                    [city, previousCity]));
            
            // If going to the same city the thief is in: 
            //      move the thief to the next city.
            // If going to a different city as the thief,
            // or we have investigated the required number of cities: 
            //      the thief stays where they are.
            if (firstMove || $scope.thiefInCurrentCity()) {
                $scope.detective.citiesVisited += 1;
                
                // we catch up with the thief on this turn!
                if ($scope.detective.citiesVisited >= CITIES_REQUIRED_TO_CATCH_THIEF) {
                    // TODO 
                }
                else {
                    $scope.thief.previousCity = city;
                    $scope.thief.city = chooseOne($scope.destinations);
                }
            }
            else if ($scope.thiefWasHere()) {
            
                // Ensure the thief's city is a possible destination.
                // It may not be if the detective jetted to the wrong city and
                // came back to the thief's last known location.
                // (The destination list regenerated but the thief did not move to
                // one of the new destinations.)
                var filterCity = function(n) {
                    return n == $scope.thief.city;
                };
                if ($scope.destinations.filter(filterCity).length == 0) {
                    // replace the last entry with the thief's city
                    $scope.destinations.splice(-1, 1, $scope.thief.city);
                }

            };
            
            // Generate new places to investigate
            $scope.resetPlaces();
            
            // TODO add travel time
            $scope.addTravelTime(3);
            
            if (callback) {
                callback();
            };
        };

        $scope.gotoPlace = function(place) {
            
            // the thief is in this city! chase them down!
            if ($scope.thiefInCity($scope.detective.city)) {
                $scope.viewArrest();
                return;
            }
            
            $scope.currentPlace = place;
            if (place != undefined) {
                // add travel time if the place has not been visited.
                // TODO this rule can be ignored for skilled agents.
                if (!$scope.hasVisitedPlace(place)) {
                    $scope.addTravelTime(3 + $scope.placeTimeOffset);
                    $scope.placeTimeOffset += 1;
                }
                place.visited = true;
            }
        };
        
        // if busy visiting any place
        $scope.isVisitingSomePlace = function() {
            return $scope.currentPlace !== undefined;
        };
        
        $scope.hasVisitedPlace = function(place) {
            return place.hasOwnProperty('visited') && place.visited;
        };
        
        // Reset the places we can investigate in the current city.
        // Called when travelling to a new city.
        // Note: we convert to json and back to create a clone of the places
        //       object. This ensured the default stays pristine.
        $scope.resetPlaces = function() {
            
            $scope.currentPlace = undefined;
            $scope.places = JSON.parse(JSON.stringify($scope.defaultPlaces));
            
            // Generate respondents for each place
            $scope.places.forEach(function(item, array, index) {
                item.respondent = chooseOne(item.respondents);
                if ($scope.thiefWasHere()) {
                    item.clue = $scope.genderizeText(chooseOne($scope.thief.city.clues), $scope.thief.sex);
                }
                else {
                    item.clue = "I have not seen that person.";
                }
            });
            
            // TODO choose a clue from the thief.city for each respondent.
            // replace @1 and @2 with 'she' and 'her'

        };
        
        // Replace gender tokens with the specified sex:
        // 'F': @she becomes 'she', @her becomes 'her'
        // 'M': @she becomes 'he', @her becomes 'his'
        $scope.genderizeText = function(text, sex) {
            var transformed = text.replace(/@she/gi, sex == 'F' ? 'she' : 'he');
            transformed = transformed.replace(/@her/gi, sex == 'F' ? 'her' : 'him');
            return transformed;
        };

        
        /**
         * Thief
         * =====
         */
         
        $scope.thiefInCity = function(city) {
            return $scope.thief.city == city;
        };
        
        $scope.thiefInCurrentCity = function() {
            return $scope.thiefInCity($scope.detective.city);  
        };
        
        $scope.thiefWasHere = function() {
            return $scope.thief.previousCity == $scope.detective.city;
        };

        /** 
         * Data
         */
         
        $http.get('data/magenta.json').success(function(data) {
            $scope.cities = data.cities;
            $scope.defaultPlaces = data.places;
            $scope.gotoCity(chooseOne($scope.cities));
        });

    }]);

})(); // app closure