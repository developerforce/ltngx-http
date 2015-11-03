# ltngx-http
A sample HTTP proxy Lightning Component and JavaScript API.

##Description
Provides a proxy for accessing HTTP (REST) APIs via a Lightning Component. A Visualforce page and component are leveraged to provide access, currently restricted in Lightning Components (as of Winter '16) due to the Content Security Policy (CSP).

A sample HTTP browser is provided as an example. The core component (c:http) can be used in other applications to provide event- and attribute-based access. Additionally, an API is provided for programmatic and/or command-line access.

##Usage

###UI
1. Import/copy the Lightning Components into your org.
2. Import/copy the Visualforce Pages and Components into your org.
3. Go to https://yourdomain-dev-ed.lightning.force.com/c/httpTest.app
4. Enable the "Auto" checkbox.
5. Press the "Exec" button.
6. Select the desired URLs to browse the API.

###API
1. Access the UI as above.
2. Open the developer tools and navigate to the Console tab.
3. Type $ltngx.http("/services/data", function(result, status, headers) { console.warn(result, status, headers); });
4. Expand the results and headers to view the values.
5. Note that the API and UI are in-sync and may be used interchangeably.
