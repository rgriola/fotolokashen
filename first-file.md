# This is my thoughts and notepad for creating prompts. You may read it to understand my tbinking. This file is not-canonicle, rather it helps me work out our process

July 26, 2026

**_ Issue _**
The custom email UI is hindering development of our core features. We want to switch to transactional emails for the auth system ie handled by the database. With the email texts (subject and body ) contained in one file as strings - email context resource file.

**_ Context _**
Custom emails are an Admin only feature.
Since it has been months our last update to this project a review of our project health should be conducted.

**_ Task _**
Evaluate the steps needed to remove the custom email UI and switch to transactional emails. The transactional emails will need a config file containing the - strings with email subject + body.

Consider how this affects the iOS app, though the iOS does not have admin features.

Other issues to consider;

- iOS and Web share the database
- Migration away from imageKit to a photo storage system, we are currently in a test feature mode with them. We would need to fully validate and sanitize images + accept short videos (future). What would this cost in terms of time, and what storage vendors could we use. How would this implementation look.

**_ Goal _**
Start to simplify both web + iOS app implementations.
Final assesment should be placed into a markdown file with clear phases tests for changes an agent can execute.
Include unit tests.

Migration Update;

Stick with ImageKit hold off on vendor migration;

Lets work on your recomendations;
First create a storage abstraction github branch then implement your plan to update it. Once it is tested and merged we will work on the virus-scan gap, the after the email.

The storage adapter abstraction then fix the virus-scan gap. We will tackle the Email plan after the above is cleanly implemented.
Email;

July 27
