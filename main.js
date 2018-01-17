/**
 * Listen for the document to load and initializes the application
 */
$(document).ready(init);

/***************************************************************************************************
 * init - adds click handler on search button
 * @param none
 * @return undefined
 * @calls on click of search button calls googleGeoLoc(location);
 */
function init(){
    $('.locationInput').attr('autocomplete','off');
    $(".searchButton").on("click", ()=>{
        let location = $(".locationInput").val();
        $(".locationInput").val("");
        googleGeoLoc(location);         //for ajax call

    });
}

/***************************************************************************************************
 * googleGeoLoc - Ajax call with Google Geo Location when user clicks the search button
 * @param name user input value which is a string the from search box
 * @return undefined
 * @calls flickrClickHandler(beachFlickr), weatherApi(beachObject.lat, beachObject.long);
 */
function googleGeoLoc(name){
    $.ajax({
        dataType: 'json',
        url: 'http://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDbDr73Tuj2WLSNXkSc2P8mH2JdF0xjAeo&address=' + name,
        method: 'get',
        success: function(response){

            $(".beachName").text("");         //to remove before reassigning
            $(".beachLocation").text("");

            let beachObject = {};
            beachObject.name = response['results'][0]['address_components'][0]['long_name'];
            beachObject.city = response['results'][0]['address_components'][1]['long_name'];
            beachObject.state = response['results'][0]['address_components'][2]['short_name'];
            beachObject.lat  = (response['results'][0]['geometry']['location']['lat']);
            beachObject.long = (response['results'][0]['geometry']['location']['lng']);

            $(".beachName").text(beachObject.name);
            $(".beachLocation").text(beachObject.city + ", " + beachObject.state);
            var beachFlickr = beachObject.name;
            // console.log(beachObject);
            weatherApi(beachObject.lat, beachObject.long);
            // flickrClickHandler(beachFlickr);
        },
        error: function(response){
            console.log(response);
            console.log('ERRRROR');
        }
    })
};


/***************************************************************************************************
 * weatherApi - ajax call that appends all of the relevant surf and weather conditions onto the DOM
 * @param (number, number) two - Latitude and Longitude coordinates of the beach location
 * @return undefined none
 */

function localTemp(lat, long){
    $.ajax({
        dataType: "json",
        url: `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=ee5b80f43e9149f79be22719181601&format=json&q=${lat}, ${long}&num_of_days=1`,
        method: 'get',
        success: function(result){
            var hourlyWeather = [];
            for(var tempIndex = 2; tempIndex < 7; tempIndex++){
                var tempObj = {};
                var tempHour = result.data.weather[0].hourly[tempIndex];
                var tempAtHour = tempHour.tempF;
                
                tempObj.tempAtHour = tempAtHour;
                hourlyWeather.push(tempObj);
            }
            // console.log(hourlyWeather);
        }
    })
}


function weatherApi(lat, long){
    $.ajax({
        dataType: "json",
        url: `https://api.worldweatheronline.com/premium/v1/marine.ashx?key=ee5b80f43e9149f79be22719181601&num_of_days=1&tp=3&format=json&q=${lat}, ${long}&tide=yes`,
        method: "get",
        success: function(result){
            console.log("success");

            //putting dom elements here that need to be cleared later
            $(".sunriseTime").text("");
            $(".sunsetTime").text("");
            $(".tideData").text("");
            $(`.temp .tempPic`).css("background-image", "");
            $(`.temp .tempTemp`).text("");


            //find all weather data
            var weatherArray = result.data.weather[0];
            var sunrise = weatherArray.astronomy[0].sunrise;
            $(".sunriseTime").text(sunrise);
            var sunset = weatherArray.astronomy[0].sunset;
            $(".sunsetTime").text(sunset);
            var tideArray = result.data.weather[0].tides[0].tide_data[1];
            var tideHeight = tideArray.tideHeight_mt;
            var tideType = tideArray.tide_type;
            $(".tideData").text(tideHeight + " meters, " + tideType);

            var timeOfDayStats = [];            //array to hold objects

            for (var hourlyIndex = 2; hourlyIndex < 7; hourlyIndex++){
                var statsObj = {};
                var hourObj = result.data.weather[0].hourly[hourlyIndex];
                var imageDirect = result.data.weather[0].hourly[hourlyIndex].weatherIconUrl[0].value;
                $(`.temp${hourlyIndex-1} .tempPic`).css("background-image", 'url('+imageDirect+')');
                // var tempAtHour = hourObj.tempF;
                // $(`.temp${hourlyIndex-1} .tempTemp`).html(tempAtHour+ "&#x2109");

                statsObj.windSpeed = hourObj.windspeedMiles;
                statsObj.windDir = hourObj.winddir16Point;
                statsObj.swellHeight = hourObj.swellHeight_ft;
                statsObj.swellDir = hourObj.swellDir16Point;
                statsObj.waterTemp = hourObj.tempF;
                timeOfDayStats.push(statsObj);
            }
            $(".tempBox").on("click", function(){
                var weatherAtTime = timeOfDayStats[this.id];
                $(".dataTitle").text('');  //clear text
                $(".swellData").text(weatherAtTime.swellHeight + "ft, " + weatherAtTime.swellDir);
                $(".waterTempData").html(weatherAtTime.waterTemp+"&#x2109");
                $(".windData").text(weatherAtTime.windSpeed+"mph, "+ weatherAtTime.windDir);
            });
        console.log(timeOfDayStats);

        },
        error: function(result){
            console.log("ajax call failed");
        }
    })
}

/***************************************************************************************************
 * makePhotoURL - creates an array of photo URLS based on data array being pushed in from the flickr Ajax Call
 * @param {array} one
 * @return undefined
 * @calls makePhotoDivs
 */
function makePhotoURL(array){
    var beachPhotoArray = [];
    for(let photoIndex = 0; photoIndex<array.length; photoIndex++) {
        let farm = array[photoIndex].farm;
        let id = array[photoIndex].id;
        let server = array[photoIndex].server;
        let secret = array[photoIndex].secret;
        let url = `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}.jpg`;
        beachPhotoArray.push(url);
        // https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
    }
    makePhotoDivs(beachPhotoArray);
}

/***************************************************************************************************
 * makePhotoDivs - dynamically creates and appends divs onto the pictureInforDataContainer div
 * @param {array} one
 * @return undefined
 * @calls undefined
 */
 function makePhotoDivs(array) {
    for (let photoDivIndex = 0; photoDivIndex < array.length; photoDivIndex++) {
        var definePhotoDiv = $('<div>').addClass('photoDiv');
        var beachPhoto = array[photoDivIndex];
        var makePhotoDiv = definePhotoDiv.css('background-image', 'url(' + beachPhoto + ')').attr('onclick','showModal()');
        $('.pictureInfoDataContainer').append(makePhotoDiv);
    }
};
/***************************************************************************************************
 * flickrClickHandler - ajax call to flickr API which creates a data object which holds encrypted URL information
 * @param {string} the string of the beach name to be inputted into the flickr ajax search call
 * @return undefined
 * @calls makePhotoURL
 */
 function flickrClickHandler(beachName) {
    var beachPhotoArrayData = [];
    var flickrSearch = beachName;
    var photoObj;
    var dataFromServer;
    var ajaxConfig = {
        method: "GET",
        url: `https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=629e34714d717373e24940da3b0ad6cb&format=json&nojsoncallback=1&text=${flickrSearch} sunset&per_page=10`,
        success: function(data) {
            dataFromServer = data;
            for(let dataIndex = 0; dataIndex < 4; dataIndex++) {
                var dataObj = {
                    id: dataFromServer.photos.photo[dataIndex].id,
                    server: dataFromServer.photos.photo[dataIndex].server,
                    farm: dataFromServer.photos.photo[dataIndex].farm,
                    secret: dataFromServer.photos.photo[dataIndex].secret,
                };
                beachPhotoArrayData.push(dataObj);
            }
            makePhotoURL(beachPhotoArrayData);
        },
        error: function() {
            console.log(false);
        }
    }
    $.ajax(ajaxConfig);
}
/***************************************************************************************************
 * showModal - a click handler that targets the current picture div and opens up a modal which enlarges the image clicked.
 * @param undefined none
 * @return undefined none
 */
function showModal(){
    var backgroundImage = $(event.currentTarget).css('background-image');
    $('.pictureContent').css('background-image', backgroundImage);
    $('.pictureModal').show();
}
/***************************************************************************************************
 * closeModal - a click handler which closes the modal on click.
 * @param undefined none
 * @return undefined none
 */
 function closeModal(){
    $('.pictureModal').hide();
}

function resetPage(){
    $('.pictureInfoDataContainer div').remove();


}
