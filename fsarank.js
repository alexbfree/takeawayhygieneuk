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

                for(var r in sections) {
                    var section = sections[r];
                    if (section instanceof Node) {
                        container.appendChild(section);
                    } else {
                        //console.log('container '+i+', score '+scores[m]," section/restaurant was: ");
                        //console.dir(section);
                        //console.log(i,k,r);
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
              <img class='fsa${fsaRating}'>
            </p>
        </div>
    `; // src='` + escapeHtml(fsaImgLink) + `'
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
              <img class='fsaNA'> 
            </p>
        </div>
    `; // src='` + escapeHtml(fsaImgLink) + `'
    var container = element.querySelector('div.c-listing-item-info');
    var elDiv = element.querySelector('div.fsapanel');
    if (elDiv) {
        container.removeChild(elDiv);
    }
    element.parentElement.dataset.fsarank=-2;
    container.insertAdjacentHTML('afterbegin',ratingContent);
};

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
              '<img class="fsaloading">' +
              '</p></div>'); //src="http://bowdb.alexbowyer.com/fsa/reload-61px.gif"

            let stub = v.href.split('/')[3];

            if (ratingsLookup[stub]) {
                updateElementWithScore(v,stub);
            }
            else {
                var worker = new Worker(chrome.runtime.getURL('fsagetaddress.js'));

                worker.addEventListener('message', function (e) {

                    var namesToCheck = [e.data.name];
                    var punctRE = /[\u2000-\u206F\u2E00-\u2E7F\\!"#$@%&()*+,\-.\/:;<=>?@\[\]^_{|}~]/g;
                    var spaceRE = /\s+/g;
                    var cleanedName = e.data.name;
                    cleanedName = cleanedName.replace(punctRE, '').replace(spaceRE, ' ');
                    if (cleanedName!=e.data.name) {
                        namesToCheck.push(cleanedName);
                    }
                    var splitNameParts = cleanedName.split(' ');
                    var splitNamePartsCopy = splitNameParts.slice(0);
                    while (splitNameParts.length>1) {
                        splitNameParts = splitNameParts.slice(0, -1);
                        if (splitNameParts.length == 2) {
                            namesToCheck.push(splitNameParts[1]);
                        }
                        namesToCheck.push(splitNameParts.join(' '));
                    }
                    while (splitNamePartsCopy.length>1 && splitNamePartsCopy[0]!="The") {
                        splitNamePartsCopy = splitNamePartsCopy.slice(1);
                        if (splitNamePartsCopy.length == 2) {
                            namesToCheck.push(splitNamePartsCopy[1]);
                        }
                        namesToCheck.push(splitNamePartsCopy.join(' '));
                    }
                    for (var i in namesToCheck) {
                        var name = namesToCheck[i];
                        chrome.runtime.sendMessage({
                            'name': name,
                            'street': e.data.street,
                            'city': e.data.city,
                            'postcode': e.data.postcode
                        }, function (response) {
                            //console.dir(response);
                            if (response.success === true) {
                                var fsaRating  = parseInt(response.rating);
                                var fsaKey     = response.key;
                                var fsaDate    = new Date(response.date);
                                var fsaImgLink = chrome.extension.getURL('/images/ratings/' + fsaKey + '.jpg');
                                var fsaDateStr = fsaDate.getDate() + '/' + (fsaDate.getMonth() + 1) + '/' + fsaDate.getFullYear();

                                if (!fsaRating) {
                                    fsaRating = -1;
                                }
                                if (!ratingsLookup[e.data.stub]) {
                                    ratingsLookup[e.data.stub] = {
                                        key: fsaKey,
                                        imageUrl: fsaImgLink,
                                        date: fsaDateStr,
                                        rating: fsaRating
                                    };
                                }
                                window.localStorage.setItem('ratingsLookup', JSON.stringify(ratingsLookup));
                                //console.log('found score for '+e.data.stub+", ("+name+") - updating page");
                                updateElementWithScore(v, e.data.stub);

                            } else {
                                // nothing found
                                //console.log('no data for '+e.data.stub);
                                //console.log('no data found for '+e.data.stub+", ("+name+")");
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
            }
        });

        var ul = document.querySelector('ul.c-sortBy-popoverList');
        var hygieneLi = '<li class="c-sortBy-item"><label class="o-formControl-label" for="fsarank" tabindex=“-1">' +
            '<input class="o-formControl-input" type="radio" id="fsarank" name="sortbyColumn" value="fsarank">' +
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
