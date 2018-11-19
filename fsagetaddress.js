function loadPage(href) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", href, false);
  xmlhttp.send();
  return xmlhttp.responseText;
}

function extractContent(html) {

  return (new DOMParser).parseFromString(html, "text/html") .
    documentElement . textContent;

}


self.addEventListener('message', function(e) {
  var name = e.data.name;
  var stub = e.data.stub;
  var url = "https://www.just-eat.co.uk/"+stub+"/menu";
  var pageHtml = loadPage(url);
  var postCodeRegEx= /\<span id=\"postcode\".*\<\/span\>/g;
  var cityRegEx= /\<span id=\"city\".*\<\/span\>/g;
  var streetRegEx= /\<span id=\"street\".*\<\/span\>/g;
  var postcode = pageHtml.match(postCodeRegEx)[0].replace(/(<([^>]+)>)/ig,"");
  var street = pageHtml.match(streetRegEx)[0].replace(/(<([^>]+)>)/ig,"");
  var city = pageHtml.match(cityRegEx)[0].replace(/(<([^>]+)>)/ig,"");

  var retData = {
    stub: stub,
    name: name,
    street: street,
    city: city,
    postcode: postcode
  };

  self.postMessage(retData);
}, false);