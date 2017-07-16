# Takeaway Hygiene Ratings UK Chrome Extension
A simple browser extension for Google Chrome that looks up UK Food Standards Agency hygiene ratings for various sites, and displays them on popular takeaway sites.

Published extension is available for download on the [Chrome Web Store](https://chrome.google.com/webstore/detail/takeaway-hygiene-ratings/bkmnhmkibfcgcddfkgmgnecchilhbgmi).

Currently this supports:
* Just Eat
* Hungryhouse
* Deliveroo

Scrapes the menu pages of these sites for the name and address of the establishment, and makes a call to the Food Standards Agency API (documentation available here: http://api.ratings.food.gov.uk/help) with the establishment name and postcode for the latest rating for the establishment, before inserting a graphic and date for the rating into the page.

## Contributing

If you decide to contribute, such as by adding support for a new site, or by fixing layout changes for the current supported sites (who may of course change without warning at any time), please be sure to send a pull request so I can make sure it gets included in the extension on the Chrome Web Store!

## Attribution

Many thanks to the Food Standards Agency for providing an open API and the Food Standards Agency ratings graphics for use.

This project makes use of and includes the jQuery library, in order ease page scraping and API calls.
