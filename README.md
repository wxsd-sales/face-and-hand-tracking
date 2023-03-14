# Face-and-Hand-Tracking
This demo uses [Handtrack.js](https://victordibia.com/handtrack.js/#/) to track objects locally 
and sends the capture canvas as the outgoing stream of a Webex meeting using the [Webex JS SDK](https://developer.webex.com/docs/sdks/browser).


Simply clone this repo, and open the index.html file in your browser.


To begin, enter your access token and click **authorize**. Then, start a meeting with the **join** button. 

Once the meeting is established, click the **startTracking** button.  The tracked object frames should be visible both locally and from the remote end.
