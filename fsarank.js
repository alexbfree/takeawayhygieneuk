function sortDivs() {
    var containerSelectors = ['div[data-test-id="openrestaurants"]',
        'div[data-test-id="closedrestaurants"]',
        'div[data-test-id="offlinerestaurants"]'];
    var scores         = ['-2', '-1', '1', '2', '3', '4', '5'];
    var rankedSections = [];
    for (var i in containerSelectors) {
        var containerSelector = containerSelectors[i];
        var container = document.querySelector(containerSelector);
        rankedSections[i] = [];
        if (container) {
            for (var j in scores) {
                var score    = scores[j];
                var selector = 'section[data-fsarank="' + score + '"]';
                var sections = container.querySelectorAll(selector);
                rankedSections[i].unshift(sections);
            }
        }
    }
    for (var i in rankedSections) {
        for (var k in rankedSections[i]) {
            var sections = rankedSections[i][k];
            var containerSelector = containerSelectors[i];
            var container = document.querySelector(containerSelector);
            if (container && sections && sections.length>0) {
                var reversedSections = [];
                for(var m in sections) {
                    reversedSections.push(sections[m]);
                }
                for(var r in reversedSections) {
                    var section = reversedSections[r];
                    if (section instanceof Node) {
                        container.appendChild(section);
                    } else {
                        console.log('container '+i+', score '+scores[m]," section/restaurant was: ");
                        console.dir(section);
                        console.log(i,k,r);
                    }
                }
            }
        }
    }

}

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
              '<p class="fsarating" style="height: 31px;width=110px;margin-top:0px;">' +
              '<img src="http://bowdb.alexbowyer.com/fsa/reload-61px.gif">' +
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

        var ul = document.querySelector('ul.c-sortBy-popoverList');
        var hygieneLi = '<li class="c-sortBy-item"><label class="o-formControl-label" for="fsarank" tabindex=“-1">' +
            '<input class="o-formControl-input" type="radio" id="fsarank" name="sortbyColumn" value="fsarank" checked="checked">' +
            '<span class="o-formControl-indicator o-formControl-indicator--radio"></span>Hygiene Rating</label></li>';
        ul.insertAdjacentHTML('afterbegin',hygieneLi);
        var hyLi = ul.querySelectorAll('ul.c-sortBy-popoverList li')[0];

        hyLi.addEventListener("click", function() {
            console.log('click');
            sortDivs();
        }, false);


        // TODO wait until everything complete

    }
};
