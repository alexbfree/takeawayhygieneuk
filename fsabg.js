chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var apiBase = 'http://api.ratings.food.gov.uk/';
        var apiUrl;
        var apiCall;
        var jsonMsg;
        
        var businessName = request.name;
        var businessAddress = request.address;
        
        if (( businessName === "" && businessAddress === "" ) === false) {
            apiCall = 'Establishments?name=' + businessName + '&address=' + businessAddress;
            apiUrl = apiBase + apiCall;
            $.ajax({
                beforeSend: function(request) {
                    request.setRequestHeader('x-api-version', 2);
                    console.log(request);
                },
                dataType: 'json',
                url: apiUrl
            })
            .done(function(data, status) {
                if ( Object.keys(data.establishments).length > 0 ) {
                    jsonMsg = {
                        'success': true,
                        'rating': data.establishments[0].RatingValue,
                        'key': data.establishments[0].RatingKey,
                        'date': data.establishments[0].RatingDate
                    };
                } else {
                    jsonMsg = {
                        'success': false
                    };
                }
                sendResponse(jsonMsg);
            })
            .fail(function(data, status, error) {
                sendResponse({ 'success': false });
            })
            .always(function(data, status) {
                console.log(data);
                console.log(apiUrl);
            });
        } else {
            sendResponse({ 'success': false });
        }
        return true;
});