// Never trust data you didn't prepare yourself :P
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

var siteLookupTable = {
    'www.just-eat.co.uk': 'justeat'
};

var currentSite = siteLookupTable[location.hostname];
var ratingsLookup = window.localStorage.getItem('ratingsLookup');
if (ratingsLookup == '""' || ratingsLookup == null) {
    ratingsLookup = {};
} else {
    ratingsLookup = JSON.parse(ratingsLookup);
}

var updateElementWithScore = function (element,urlStub) {
    console.dir(ratingsLookup[urlStub]);

    var fsaImgLink = ratingsLookup[urlStub]['imageUrl'];
    var fsaDateStr = ratingsLookup[urlStub]['date'];
    var ratingContent = `
        <div class='fsapanel' alt="Rating Date ${escapeHtml(fsaDateStr)}" style="float: right;margin: 0;padding: 0 10px;">
            <p class='fsarating' style="height: 61px;">
              <img src='` + escapeHtml(fsaImgLink) + `'>
            </p>
        </div>
    `;
    //console.log(ratingContent);
    //console.log('updating element ', urlStub, fsaKey);
    var container = element.querySelector('div.o-tile__details');
    var elDiv = element.querySelector('div.fsapanel');
    if (elDiv) {
        container.removeChild(elDiv);
    }
    container.insertAdjacentHTML('afterbegin',ratingContent);
};

switch (currentSite) {
    case 'justeat': {
        [].forEach.call(document.querySelectorAll('div.c-restaurant a'), function(v,i,a) {
            var urlStub      = v.href.split('/')[3].trim();
            var address      = v.querySelector('p.c-restaurant__address').innerText;
            var addressParts = address.split(',');
            var postcode     = addressParts[addressParts.length - 1].trim();
            var city         = addressParts[addressParts.length - 2].trim();
            var street       = addressParts[addressParts.length - 3].trim();
            var businessName = v.querySelector('div.o-tile__details h2').innerText.trim();

            var container = v.querySelector('div.o-tile__details');
            container.insertAdjacentHTML('afterbegin', '<div class="fsapanel" alt="Loading FSA Hygiene Rating" ' +
              'style="float: right;margin: 0;margin-top:5px;margin-right:30px;padding: 0 10px;">' +
              '<p class="fsarating" style="height: 61px;">' +
              '<img src="https://previews.dropbox.com/p/orig/AANBEYhHB7n30rFgI8XNtuWj2KTPdiewvIaxjC18BP1g9dX9WmQM8qenHEn57IggeV3WEdZ-WX8otUs8SuALVtHt_3FslvqvSVZDg_r7uaf-wvtd4036las24ryc5a3XZnORTz-lrRhU9pq9R9ycjQgstvA5FCp_ZQCY7uXZSQ_E_UkZccBHt0L5a9sP2oH7j08zMVESO6ehxz19TUvo8Rrc/p.gif?size=2048x1536&size_mode=3">' +
              '</p></div>');

            if (ratingsLookup[urlStub]) {
              //console.log('found previous match for ',urlStub,' updating');
              updateElementWithScore(v,urlStub);
            } else {
                //console.log('found no match for ',urlStub,' searching');
                chrome.runtime.sendMessage({
                    'name': businessName,
                    'street': street,
                    'city': city,
                    'postcode': postcode
                }, function (response) {
                    if (response.success === true) {
                        //console.log('found a match for ',urlStub,' storing');
                        var fsaRating = response.rating;
                        var fsaKey = response.key;
                        var fsaDate = new Date(response.date);
                        var fsaImgLink = chrome.extension.getURL('/images/ratings/' + fsaKey + '.jpg');
                        var fsaDateStr = fsaDate.getDate() + '/' + (fsaDate.getMonth() + 1) + '/' + fsaDate.getFullYear();

                        ratingsLookup[urlStub] = {
                            key: fsaKey,
                            imageUrl: fsaImgLink,
                            date: fsaDateStr,
                            rating: fsaRating
                        };
                        window.localStorage.setItem('ratingsLookup', JSON.stringify(ratingsLookup));
                        //console.log('found a match for ',urlStub,' updating');
                        updateElementWithScore(v,urlStub);

                    } else {
                        //console.log('failed to find match for ',urlStub,' wiping');
                        // error - just wipe spinner and give up
                        v.removeChild(v.querySelector('div.fsapanel'));
                    }
                });
            }
        });
    }
};
