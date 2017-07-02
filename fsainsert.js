// Never trust data you didn't prepare yourself :P
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Let's get our search parameters out of the page!
var businessName = $('div.details > h1.name').text().trim();
var businessStreet = $('div.details > p.address > span#street').text().replace(/\s+/g, ' ').trim();
var businessCity = $('div.details > p.address > span#city').text().replace(/\s+/g, ' ').trim();
var businessPostcode = $('div.details > p.address > span#postcode').text().replace(/\s+/g, ' ').trim();

chrome.runtime.sendMessage({'name': businessName, 'street': businessStreet, 'city': businessCity, 'postcode': businessPostcode}, function(response) {
    var ratingContent;
    if ( response.success === true ) {
        var fsaRating = response.rating;
        var fsaKey = response.key;
        var fsaDate = new Date(response.date);
        var fsaImgLink = chrome.extension.getURL('/images/ratings/' + fsaKey + '.jpg');
        
        var fsaDateStr = fsaDate.getDate() + '/' + (fsaDate.getMonth() + 1) + '/' + fsaDate.getFullYear();
        
        ratingContent =
`
<span class='fsapanel'>
    <p class='fsarating'>
      <img src='` + escapeHtml(fsaImgLink) + `'>
    </p>
    <p class='fsadate'>
      <label class='fsadatelabel'>Rating Date:</label> <span>` + escapeHtml(fsaDateStr) + `</span>
    </p>
</span>
`;
    } else {
        // Vary our response based on the number of results.
        if ( response.results === 0 ) {
            ratingContent =
`
<span class='fsapanel fsanorating'>
    No FSA Hygiene rating found!
</span>
`;
        } else if (response.results > 1) {
            ratingContent =
`
<span class='fsapanel fsanorating'>
    More than one takeaway returned!
</span>
`;
        }
    }
    
    // Finally, append it to the page.
    $('div.restaurantOverview > div.details').append(ratingContent);
});