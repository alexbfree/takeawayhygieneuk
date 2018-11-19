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

var shiftLegendIcons = function () {
    var legendDiv = document.querySelectorAll('div.c-listing-item-premier');
    [].forEach.call(legendDiv, function(v,i,a) {
        v.style.marginRight = '140px';
    });
}

var updateElementWithScore = function (element,stub) {
    //console.dir(ratingsLookup[urlStub]);

    var fsaImgLink = ratingsLookup[stub]['imageUrl'];
    var fsaDateStr = ratingsLookup[stub]['date'];
    var fsaRating = ratingsLookup[stub]['rating'];
    var ratingContent = `
        <div class='fsapanel' alt="Rating Date ${escapeHtml(fsaDateStr)}" style="float: right;margin-right: 20px;vertical-align: top;">
            <p class='fsarating' style="height: 31px;margin-top:0px;">
              <img src='` + escapeHtml(fsaImgLink) + `'>
            </p>
        </div>
    `;
    var container = element.querySelector('div.c-listing-item-info');
    var elDiv = element.querySelector('div.fsapanel');
    if (elDiv) {
        container.removeChild(elDiv);
    }
    element.parentElement.dataset.fsarank=fsaRating;
    container.insertAdjacentHTML('afterbegin',ratingContent);
};

var updateElementNoScore = function (element) {
    var fsaImgLink = chrome.extension.getURL('/images/ratings/fhrs_nodataavailable_en-gb.jpg');
    var ratingContent = `
        <div class='fsapanel' alt="No inspection information available." style="float: right;margin-right: 20px;vertical-align: top;">
            <p class='fsarating' style="height: 31px;margin-top:0px;">
              <img src='` + escapeHtml(fsaImgLink) + `'>
            </p>
        </div>
    `;
    var container = element.querySelector('div.c-listing-item-info');
    var elDiv = element.querySelector('div.fsapanel');
    if (elDiv) {
        container.removeChild(elDiv);
    }
    element.parentElement.dataset.fsarank=-2;
    container.insertAdjacentHTML('afterbegin',ratingContent);
};

function getLink() {

}

switch (currentSite) {
    case 'justeat': {
        var restaurants = document.querySelectorAll('section.c-listing-item a');
        var count = restaurants.length;
        [].forEach.call(restaurants, function(v,i,a) {
            var name = v.querySelector('h3.c-listing-item-title').innerText;
            shiftLegendIcons();
            var container = v.querySelector('div.c-listing-item-info');
            container.insertAdjacentHTML('afterbegin', '<div class="fsapanel" alt="Loading FSA Hygiene Rating" ' +
              'style="float: right;margin-right: 20px;vertical-align: top;">' +
              '<p class="fsarating" style="height: 31px;margin-top:0px;">' +
              '<img src="https://previews.dropbox.com/p/orig/AANBEYhHB7n30rFgI8XNtuWj2KTPdiewvIaxjC18BP1g9dX9WmQM8qenHEn57IggeV3WEdZ-WX8otUs8SuALVtHt_3FslvqvSVZDg_r7uaf-wvtd4036las24ryc5a3XZnORTz-lrRhU9pq9R9ycjQgstvA5FCp_ZQCY7uXZSQ_E_UkZccBHt0L5a9sP2oH7j08zMVESO6ehxz19TUvo8Rrc/p.gif?size=2048x1536&size_mode=3">' +
              '</p></div>');

            var worker = new Worker(chrome.runtime.getURL('fsagetaddress.js'));

            worker.addEventListener('message', function(e) {

                if (ratingsLookup[e.data.stub]) {
                    updateElementWithScore(v,e.data.stub);
                } else {
                    chrome.runtime.sendMessage({
                        'name': e.data.name,
                        'street': e.data.street,
                        'city': e.data.city,
                        'postcode': e.data.postcode
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
                            ratingsLookup[e.data.stub] = {
                                key: fsaKey,
                                imageUrl: fsaImgLink,
                                date: fsaDateStr,
                                rating: fsaRating
                            };
                            window.localStorage.setItem('ratingsLookup', JSON.stringify(ratingsLookup));
                            updateElementWithScore(v,e.data.stub);

                        } else {
                            // nothing found
                            //console.log('no data for '+e.data.stub);
                            updateElementNoScore(v);
                        }
                    });
                }

            }, false);

            var dataForWorker = {
                stub: v.href.split('/')[3],
                name: name
            };
            worker.postMessage(dataForWorker); // Send data to our worker.
        });
        // TODO wait until everything complete
        /*document.querySelector('div.c-serp-filter__list[data-ft=sortByFilter] ul').insertAdjacentHTML('afterbegin','<li class="fsaranksort"><a href="#"><span class="o-radio"></span>Hygiene Rating</a></li>');
        document.querySelector('li.fsaranksort').onclick=function(e) {
            var filters = document.querySelectorAll('div.c-serp-filter__list[data-ft=sortByFilter] ul li'),i;
            for (i = 0; i < divs.length; ++i) {

            }
            document.querySelector('li.is-selected').removeAttribute('data-ft');
            document.querySelector('li.is-selected').classList.remove('is-selected');
            // TODO need to manually put back the A link for the now no longer selected sort
            e.target.parentElement.classList.add('is-selected');
        }*/
    }
};
