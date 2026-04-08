The Problem: CNN produces hundreds of shoots a year. Preplanning is essentially. But our institutional knowledge resides in two places 1) Our brains 2) Xytech.

Fotolokasen is developed for production crews to easily share planning information. Think of it as a repository for the work we have done. Teams can collect and share details about producitons, quickly and easily and accesabile via iOS.

The strength of Fotolokasen is: 1) A collective repository of productions details. 2) Visually shows the details, gps, and photos. 3) Shareable 4) Searchable 5) available on iOS on your Phone. 6) Access level control and permissions.

The opportunity here is to develop a planning platform that hits the sweet spot of features CNN needs.

- Features that can be implimmented:
  1. Slack integration - Unify produciton planning with direct #planning or @crew slack links. No more copy paste, reduce email traffic for long planning docs.

  2. Workspace, Projects, Assignments - distribute tasks and track changes to the plan.

  3. Clear emails generation and previews, with production specific info rather than long unfocued titles with no information.

  4. Brain dunmp AI enhanced feature - write out everything needed for planning and let an agent format it into a clear start of planning.

fotolokashen is a location intelligence platform purpose-built for production crews, photographers, and field teams who need to capture, organize, and share real-world location knowledge.
Born from decades of industry frustration with clunky SharePoint guides and lost institutional knowledge, fotolokashen turns every shoot into a reusable asset.

Snap a photo, and the platform automatically GPS-tags it, geocodes the address, and lets you annotate it with production notes—parking, access points, indoor/outdoor details, contacts, even nearby bathrooms.

An interactive Google Maps interface lets you discover locations around you at a glance, while social features like follow systems and privacy controls make sharing effortless between colleagues and across teams.

The companion iOS app puts a camera-first workflow in your pocket: capture on the go with live GPS tracking, auto-sync your scouting data, and deep-link locations to teammates instantly.

Every upload is secured with server-side virus scanning, format conversion, and metadata sanitization. AI-powered tools suggest tags and improve descriptions so your location library stays organized without the busywork.

    Whether you're a solo photojournalist or managing a nationwide field operation, fotolokashen replaces scattered notes, outdated spreadsheets, and forgotten emails with a living, searchable, shareable location knowledgebase—accessible anywhere, on any device.

...
**_ Task _**

- Accept and Save button at the bottom of Terms and Conditions does not display correctly in Safari
  **_ Context _**
- The save button for the terms and conditions in Mobile Browser does not show/ display on the Mobile Browser.
  **_ Instructions _**
- Review how this button is displayed, after the user checks the accept box, in mobile browsers
- Do not code show me the issue and a plan to correct

...
Apr 2 2026
**_ Task _**

- on the /search page > discover review how the search feature works
  **_ Context _**
- currently searching for users with Proper first and last names does not find all users. Search seems generally limited to only user names and is case sensitive
  **_ Instructions _**
- Review how search works.
- Allow search to find first and last names and return them in the discover panel as well as the usernames.
- When searching for a user do not return the logged in user under discover ie; A search of 'Rod' should return 3 accounts, but if @rodczaro is logged in, who is one of the 'Rod' users this account should not be returned. The other rod accounts should be returned.
- After review show me a plan to fix this issue

...
**_ issue _**

- on /map > info windows; When the user views other user public locations the info window is essentially static ie; @rodczaro is viewing the public locations owned by @allaccess on the map page the info window does not directly link to the details panel.
  **_ Context _**
- The only clickable item is the owners user name; a click on the owners username takes the user to the profile.
  **_ Change _**
- Add a direct link in the info window connected to the location details panel. This iOS works similar to this, but a click on the camera icon takes the user to the location details panel.
- the info window should show @locationowner, Title, Address, GPS metadata.
- There is a Directions Button - remove this - it takes the user out of the app and is confusing.
- Review the info window issue above then show me a plan to fix the issue before coding.
  ...

**_ Task _**

- Review the codebase for fotolokashen
  **_ Context _**
- The codebase has not had a review in many months
- I am looking for files where the code could be: improved, simplified, broken up logically ie 1500 lines is too long
- Also looking for places where there may be repetitve code.
- keep in mind iOS and Web Apps share some API endpoints.
- I am open to looking at large files first ie; /app/map/page.tsx is 1600 lines.
- The code is working as intended right now and I don't want to introduce new issues.
- Review and come up with suggestions for improvements.
- If at any time you have questions please ask.

- One issue I see is the Toast-Alerts-Success system is the messages are inconsistent and in some cases do not communicate effectively to the user. An example is the photo uploads, it does not show the stages of photo upload. It becomes confusing when adding the
