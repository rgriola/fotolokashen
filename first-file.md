## purpose

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

...
Apr 9 2026

**_ Task _**
Location Cards (Grid View)

- The Photos in the Card Viewport should show the entire photo scaled to fit into the view port. This includes handling vertical photos the same way, reducing the scale to fit into the viewport.
  **_ Instructions _**
- Review how the Location Card render the photos in the viewport.
  There will need to be a space filler added to the background since the viewport and photo scale will always be different.
- show me a plan to impliment the changes before coding.

...
**_ Task _**
Panel Components details, edit amd save panels

- Impliment the same photo treatment in the viewport as the Location Cards.
- The Photos in the Panel Components should show the entire photo scaled to fit into the view port. This includes handling vertical photos the same way, reducing the scale to fit into the viewport.
  **_ Instructions _**
- Review how the Panel components render the photos in the viewport.
  There will need to be a space filler added to the background since the viewport and photo scale will always be different.
- show me a plan to impliment the changes before coding.

...

Specifically when Editing a location through the edit location panel. If I click "Delete" to delete a location I get an alert from "URL" says ... this location will be deleted.

- there are 2 issues:
  1st The alert is in the middle of the screen and it should be over the panel so the user's eyes see it squarely, brining focus to the important message. This would also work with mobile browser but I am less concerned there because we have iOS app. The idea is to make sure the users attention is brought to the alert about losing data.

  2nd Issue is the alert dialog is styled with a white background and no information about what is being deleted; it should be Specific ie; [Location Name] with all photos and data will be permently removed. Continue? . The Alert should be Red like an Error warning etc.

  ..
  The delete notice looks much better, much more clear what is happening. Next is Validation and Sanitation of user Text inputs. I web app has one set of standards and the iOS app has another. I know this because I was able to enter an @ symbol in the Location Name in iOS when creating a location, but when I viewed the location on the Web and tried to save it the web with an update it was rejected. I need to make sure both Validate and Sanitize the in the same process. I also feel I need to be able to allow more charecters since I found myself using % as in "50% power" but I cannot use the % symbold. What is the best solution to aligning the validation and sanitizing user input and allowing users to keep the context of their infomation and considering security. Review and explain a Plan before any code changes.

**_ issue _**

- I recieved the below notice from Apple Develper Review for the iOS app. Can we plan and address this issue below.

Note from Apple

Issue Description

We noticed that the user is taken to the default web browser to sign in or register for an account, which provides a poor user experience.

Next Steps

To resolve this issue, please revise the app to enable users to sign in or register for an account in the app.

You may also choose to implement the Safari View Controller API to display web content within the app. The Safari View Controller allows the display of a URL and inspection of the certificate from an embedded browser in an app so that customers can verify the webpage URL and SSL certificate to confirm they are entering their sign in credentials into a legitimate page.

Resources

- For additional information on the Safari View Controller API, please review the What's New in Safari webpage.
- Note that apps that support account creation must also offer account deletion, per guideline 4. Learn more about offering account deletion in the app.
  Guideline 2.3.6 - Performance - Accurate Metadata

Issue Description

The content description selected for the app’s Age Rating indicates that the app includes In-App Controls. However, we were unable to find either Parental Controls or Age Assurance mechanisms in the app.

Next Steps

If the app currently includes these features, reply to this message and let us know how to locate them.

Otherwise, update the Age Rating selections to "None" for "Parental Controls." Age Rating selections can be found on the App Information page after selecting the app in App Store Connect.

Resources

- Learn more about In-App Controls in Age ratings values and definitions.
- Learn more about age rating requirements in guideline 2.3.6.
  Support

###

- Please review our Fotolokashen web app file by file and comment into files as needed where business logic may be missing.
- In the review evaluate the coding Architecture, the Swift.view Architecture and styling Architecture. Point out the parts that work and need improvement.
- I want to make feature changes and I believe we need a comprehensive assesment how this app can be better and be ready for more dynamic features;
- A feature update is iOS location creation; iOS needs a photo upload UI Pipeline using iOS Photo Library images + also allowing adding Camera Photos directly. this feature will need a separate implimentation plan as I will use this going forward for another app.
- Any suggestions to make this app stronger.
  -- And place this into a markdown file.

  - look for opportunities to create reusable components and utlity functions. 

...
*** issue ***
- the web app login doubles for the login for iOS. The issue is in the view the web page header [fotolokashen] [login] [Register] float on top of the login panel (dialog) and really make it hard to use this UI on iOS. Can we lose the header on mobile login so the user con focus on the view. 
- Also on mobile can we adjust the styling to make the UI more compact. There is too much scrolling. 
- We can lose the Fotolokashen Logo + Text above the Create Account panel on mobile. 

- Also the Date of Birth Calendar picker needs to go MM - DD - YYYY with a calend component, something better than what is there now - in the UI the user click on the field and automatically chooses today as their Date of Birth, Humans are not born today... but you know that. It can be changed but is not intuitive enough. In the United States and Canada the format is MM - DD - YYYY. The rest of the world it is DD - MM - YYYY but should map to MM-DD-YYYY for the backend.

- Read this back to me then I will approve. 


...
*** issue ***
- Can you review the login sequence for the iOS app. A user said they never got their confirmation emaila for > "Verification Email". When I checked Resend both the Verification Email had been sent and their email "Email confirmed" was also sent. 
- I checked the database and their email was confirmed, they were listed as active.
- When I told them to just goahead and login then they said it would not let them. 
-  Yesterday when I tried the new iOS Create Account Process it was confusing, but I also did get my emails. But my emails were to gmail his was to a corporate email with spam catchers that lock emails away for a few days. I have the same corporate email system.

- But the iOS create account, confirm email, login is difficult to follow as a user. 
 
 *** Task ***
 - Redesign of the iOS Profile View and subview structure. 
 - Attached is a screenshot of a mock up of what I am looking for. 
 - The main Profile View should list options of what the user can do here. 
 - Logout button should be on the main Profile View at the very bottom. 
 - Delete Account should be in a subview, not on the main Profile View. 
 - Can you review the Profile View and subview structure and make sure it is logical and easy to use, show me a plan and I will approve.

 ...

 Looks Good. on iOS Profile > Account & Security > Change "Account Info" to Personal details
 Under Personal details create a summary:

 Peronsal Details (each field should be on its own line as shown below)
 [User Name]
 [Email Address]
[City], [State]
[Country]
  Heading: Birthday
 [Date of Birth]
 Joined
 [Date Joined]

 Move Edit Profile to the Security Subheading

 ....
in the iOS App we  should also display the user timezone using the GPS data user allows if allowed or IP if no GPS. 

... 
*** Task ***
- iOS Profile > Account & Security > Personal Details > Edit Profile > Move Preferences up one level to Account & Security > Preferences. 
- We also need to add a Permissions section for GPS, Camera, Photo Library, and Notifications. 
In the Permissions Section add on/off toggles. 


...

MY TO-DO Apr 17
Continue Security Review and implimentations 

- Change iOS login to GPS location if permitted or home if not. 
- Finish Profile redesign. 
- Finish Create Location Basic Set ups
- Create Unit Tests for APIs and IOS


