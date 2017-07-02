chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {        
        var bizName = request.name;
        var bizAddress = [ request.street, request.city, request.postcode ];
        var bizAddressString = bizAddress[2];
        
        var apiBase = 'http://api.ratings.food.gov.uk/';
        
        // Check we haven't received empty strings...
        if (( bizName === '' && bizAddress === '' ) === false) {
            // Build our full API URL.
            var apiCall = 'Establishments?name=' + bizName + '&address=' + bizAddressString;
            var apiUrl = apiBase + apiCall;
            $.ajax({
                beforeSend: function(request, settings) {
                    // The FSA API requires you to set this header to work.
                    request.setRequestHeader('x-api-version', 2);
                },
                dataType: 'json',
                url: apiUrl
            })
            .done(function(data, status) {
                var jsonMsg;
                
                var resultCount = Object.keys(data.establishments).length;
                // Check we've actually received some results!
                if ( resultCount === 1 ) {
                    jsonMsg = {
                        'success': true,
                        'rating': data.establishments[0].RatingValue,
                        'key': data.establishments[0].RatingKey,
                        'date': data.establishments[0].RatingDate,
                        'results': resultCount
                    };
                } else if (resultCount === 0 ) {
                    jsonMsg = {
                        'success': false,
                        'results': resultCount
                    };
                } else {
                    jsonMsg = {
                        'success': false,
                        'results': resultCount
                    };
                }
                
                sendResponse(jsonMsg);
            })
            .fail(function(data, status, error) {
                console.log('Call to API failed: ' + status);
                sendResponse({ 'success': false });
            });
        } else {
            sendResponse({ 'success': false });
        }
        return true;
});