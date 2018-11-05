// Never trust data you didn't prepare yourself :P
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

var siteLookupTable = {
    'www.just-eat.co.uk': 'justeat'
};

var restaurantsToCheck = null;

var currentSite = siteLookupTable[location.hostname];
var ratingsLookup = window.localStorage.getItem('ratingsLookup');
if (ratingsLookup == '""' || ratingsLookup == null) {
    ratingsLookup = {};
} else {
    ratingsLookup = JSON.parse(ratingsLookup);
}

var updateElementWithScore = function (element,urlStub) {
    //console.dir(ratingsLookup[urlStub]);

    var fsaImgLink = ratingsLookup[urlStub]['imageUrl'];
    var fsaDateStr = ratingsLookup[urlStub]['date'];
    var fsaRating = ratingsLookup[urlStub]['rating'];
    var ratingContent = `
        <div class='fsapanel' alt="Rating Date ${escapeHtml(fsaDateStr)}" style="float: right;margin: 0;padding: 0 10px;">
            <p class='fsarating' style="height: 61px;">
              <img src='` + escapeHtml(fsaImgLink) + `'>
            </p>
        </div>
    `;
    var container = element.querySelector('div.o-tile__details');
    var elDiv = element.querySelector('div.fsapanel');
    if (elDiv) {
        container.removeChild(elDiv);
    }
    element.parentElement.dataset.fsarank=fsaRating;
    container.insertAdjacentHTML('afterbegin',ratingContent);
};

var updateElementNoScore = function (element) {
    var fsaImgLink = chrome.extension.getURL('/images/ratings/fhrs_awaitinginspection_en-gb.jpg');
    var ratingContent = `
        <div class='fsapanel' alt="No inspection information available." style="float: right;margin: 0;padding: 0 10px;">
            <p class='fsarating' style="height: 61px;">
              <img src='` + escapeHtml(fsaImgLink) + `'>
            </p>
        </div>
    `;
    var container = element.querySelector('div.o-tile__details');
    var elDiv = element.querySelector('div.fsapanel');
    if (elDiv) {
        container.removeChild(elDiv);
    }
    element.parentElement.dataset.fsarank=-2;
    container.insertAdjacentHTML('afterbegin',ratingContent);
};

switch (currentSite) {
    case 'justeat': {
        var restaurants = document.querySelectorAll('div.c-restaurant a');
        var count = restaurants.length;
        [].forEach.call(restaurants, function(v,i,a) {
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
              updateElementWithScore(v,urlStub);
            } else {
                chrome.runtime.sendMessage({
                    'name': businessName,
                    'street': street,
                    'city': city,
                    'postcode': postcode
                }, function (response) {
                    if (response.success === true) {
                        //console.dir(response);
                        var fsaRating = parseInt(response.rating);
                        var fsaKey = response.key;
                        var fsaDate = new Date(response.date);
                        var fsaImgLink = chrome.extension.getURL('/images/ratings/' + fsaKey + '.jpg');
                        var fsaDateStr = fsaDate.getDate() + '/' + (fsaDate.getMonth() + 1) + '/' + fsaDate.getFullYear();

                        if (!fsaRating) {
                            fsaRating=-1;
                        }
                        ratingsLookup[urlStub] = {
                            key: fsaKey,
                            imageUrl: fsaImgLink,
                            date: fsaDateStr,
                            rating: fsaRating
                        };
                        window.localStorage.setItem('ratingsLookup', JSON.stringify(ratingsLookup));
                        updateElementWithScore(v,urlStub);

                    } else {
                        // nothing found
                        updateElementNoScore(v);
                    }
                });
            }
        });
        // TODO wait until everything complete
        document.querySelector('div.c-serp-filter__list[data-ft=sortByFilter] ul').insertAdjacentHTML('afterbegin','<li class="fsaranksort"><a href="#"><span class="o-radio"></span>Hygiene Rating</a></li>');
        document.querySelector('li.fsaranksort').onclick=function(e) {
            document.querySelector('li.is-selected').removeAttribute('data-ft');
            document.querySelector('li.is-selected').classList.remove('is-selected');
            // TODO need to manually put back the A link for the now no longer selected sort
            e.target.parentElement.classList.add('is-selected');
        }
    }
};
