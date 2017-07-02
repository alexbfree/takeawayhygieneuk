var businessName = $("div.details > h1.name").text().trim();
var businessAddress = $("div.details > p.address").text().replace(/\s+/g, ' ').trim();

chrome.runtime.sendMessage({"name": businessName, "address": businessAddress}, function(response) {
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
      <img src='` + fsaImgLink + `'>
    </p>
    <p class='fsadate'>
      <label class='fsadatelabel'>Rating Date:</label> <span>` + fsaDateStr + `</span>
    </p>
</span>
`;
    } else {
        ratingContent =
`
<span class='fsapanel fsanorating'>
    No FSA Hygiene rating found!
</span>
`;
    }
    
    $('div.restaurantOverview > div.details').append(ratingContent);
});