// Never trust data you didn't prepare yourself :P
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

var siteLookupTable = {
    'www.just-eat.co.uk': 'justeat',
};

var currentSite = siteLookupTable[location.hostname];
var businessName;

switch (currentSite) {
    case 'justeat': {
        //businessName = $('div.details > h1.name').text().trim();

        var ratingsLookup = window.localStorage.getItem('ratingsLookup');
        console.log(ratingsLookup);
        break;
    }
};
