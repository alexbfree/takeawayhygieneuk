// Never trust data you didn't prepare yourself :P
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

var siteLookupTable = {
    'www.just-eat.co.uk': 'justeat',
    'hungryhouse.co.uk': 'hungryhouse',
    'deliveroo.co.uk': 'deliveroo',
    'www.kukd.com': 'kukd'
};

var currentSite = siteLookupTable[location.hostname];

var businessName;
var businessStreet;
var businessCity;
var businessPostcode;

// Let's get our search parameters out of the page!
switch (currentSite) {
    case 'justeat':
        businessName = $('div.details > h1.name').text().trim();
        businessStreet = $('div.details > p.address > span#street').text().replace(/\s+/g, ' ').trim();
        businessCity = $('div.details > p.address > span#city').text().replace(/\s+/g, ' ').trim();
        businessPostcode = $('div.details > p.address > span#postcode').text().replace(/\s+/g, ' ').trim();
        break;
    case 'hungryhouse':
        // Because of course they change the header element for the reviews page.
        if (window.location.pathname.match(/\/reviews$/)) {
            businessName = $('.restMainInfoHeader > div.headerLeft > div.reviewPageRestTitle > span:nth-of-type(1)').text().replace(/\s+/g, ' ').trim();
        } else {
            businessName = $('.restMainInfoHeader > div.headerLeft > h1 > span:nth-of-type(1)').text().replace(/\s+/g, ' ').trim();
        }
        businessStreet = $('.menuAddress > .address > span:nth-of-type(1)').text().replace(/\s+/g, ' ').trim();
        businessCity = $('.menuAddress > .address > span:nth-of-type(2)').text().replace(/\s+/g, ' ').trim();
        businessPostcode = $('.menuAddress > .address > span:nth-of-type(3)').text().replace(/\s+/g, ' ').trim();
        
        if ( businessPostcode === '' ) {
            businessPostcode = businessCity;
            businessCity = '';
        }
        break;
    case 'deliveroo':
        businessName = $('div.restaurant--main > div.restaurant__details > h1.restaurant__name').text().replace(/^(.+)-.+/, "$1").trim();
        businessAddress = $('div.restaurant--main > div.restaurant__details > div.restaurant__metadata > div.metadata__details > small.address').text().split(',');
        businessStreet = businessAddress[0].trim();
        businessCity = businessAddress[businessAddress.length-2].trim();
        businessPostcode = businessAddress[businessAddress.length-1].trim();
        businessPostcode = businessPostcode.replace(/^(.{2,4})(.{3})$/, "$1 $2");
        break;
    case 'kukd':
        businessName = $('section.headermaink > div.container:nth-of-type(1) > h1 > b').text().trim();
        businessAddress = $('section.headermaink > div.container:nth-of-type(1) > h2').text().split(',');
        businessStreet = businessAddress[0].trim();
        businessCity = businessAddress[businessAddress.length-2].trim();
        businessPostcode = businessAddress[businessAddress.length-1].trim();
        break;
}

chrome.runtime.sendMessage({
            'name': businessName,
            'street': businessStreet,
            'city': businessCity,
            'postcode': businessPostcode
        }, function(response) {
            var ratingContent;
            if ( response.success === true ) {
                var fsaRating = response.rating;
                var fsaKey = response.key;
                var fsaDate = new Date(response.date);
                var fsaImgLink = chrome.extension.getURL('/images/ratings/' + fsaKey + '.jpg');

                var fsaDateStr = fsaDate.getDate() + '/' + (fsaDate.getMonth() + 1) + '/' + fsaDate.getFullYear();

        var ratingsLookup = window.localStorage.getItem('ratingsLookup');
        if (ratingsLookup == '""' || ratingsLookup==null) {
            ratingsLookup = {};
        } else {
           ratingsLookup = JSON.parse(ratingsLookup);
        }
        ratingsLookup[businessName] = {
           key: fsaKey,
           imageUrl: fsaImgLink,
           date: fsaDate,
           rating: fsaRating
        };
        console.log('updated:');
        console.dir(ratingsLookup);
        window.localStorage.setItem('ratingsLookup',JSON.stringify(ratingsLookup));

        ratingContent =
`
<div class='fsapanel'>
    <p class='fsarating'>
      <img src='` + escapeHtml(fsaImgLink) + `'>
    </p>
    <p class='fsadate'>
      <label class='fsadatelabel'>Rating Date:</label> <span>` + escapeHtml(fsaDateStr) + `</span>
    </p>
</div>
`;
    } else {
        // Vary our response based on the number of results.
        if ( response.results === 0 ) {
            ratingContent =
`
<div class='fsapanel fsanorating'>
    <p class="fsaheader">No FSA Hygiene rating found!</p>
    <p>Try searching on <a href="http://ratings.food.gov.uk/" target="_blank">the FSA website!</a></p>
</div>
`;
        } else if (response.results > 1) {
            ratingContent =
`
<div class='fsapanel fsanorating'>
    <p class="fsaheader">FSA returned more than one takeaway!</p>
    <p>Try searching on <a href="http://ratings.food.gov.uk/" target="_blank">the FSA website!</a></p>
</div>
`;
        }
    }
    
    // Finally, add it to the page.
    var targetElement;
    var targetOp;
    
    switch (currentSite) {
        case 'justeat':
            targetElement = 'div.restaurantOverview > div.details';
            targetOp = 'append';
            break;
        case 'hungryhouse':
            targetElement = 'div#restMainInfoWrapper';
            targetOp = 'append';
            break;
        case 'deliveroo':
            targetElement = 'div.restaurant__details > div.restaurant__metadata';
            targetOp = 'append';
            break;
        case 'kukd':
            if (window.location.pathname.match(/\/menu$/)) {
                targetElement = 'div#checkoutHide > div.ordermodes:nth-of-type(3)';
            } else if (window.location.pathname.match(/\/(info|reviews)$/)) {
                targetElement = 'div.mb40 > div.mt20 > div:first-of-type';
            }
            targetOp = 'after';
            break;
    }
    
    switch (targetOp) {
        case 'append':
            $(targetElement).append(ratingContent);
            break;
        case 'after':
            $(targetElement).after(ratingContent);
            break;
    }
});
