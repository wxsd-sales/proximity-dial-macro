# Proximity Dial Macro

This is an example Webex Device macro which automatically dials a destination if a person stands in front of the device for a period of time.

The macro comes in two variations for displaying the countdown timer when the person is detected.

### UI Extension Based Countdown:
<img width="960" alt="Proximity Dial UI Extension" src="https://github.com/wxsd-sales/proximity-dial-macro/assets/21026209/47476c62-bbaf-4d10-9b0b-3c74bd3cb030">

### Kiosk Web App Countdown:

<img width="960" alt="Proximity Dial Web App" src="https://github.com/wxsd-sales/proximity-dial-macro/assets/21026209/5342c402-555c-4f1f-86da-991fc7a73045">


## Overview

Theses macros leverages the camera intelligence of Webex RoomOS devices to monitor the current people count and close proximity detection. The macro monitors these two xStatus while not in a call and if a person is detected, the macro will display a notification with a countdown timer or in the case where it is operating in Kiosk mode, the macro will signal to the Kiosk web app to begin a countdown animation. If the person walks away before the countdown has completed, the UI and timers will reset.

Once the countdown timer has completed and if the person has hasn't moved away from the Webex Device, the macro will then dial a specified target destination.

The target number can be any destination including a member of staff, a meeting bridge or even a call queue.

## Setup

### Prerequisites & Dependencies: 

- RoomOS/CE 10.x or above Webex Desk or Board Device
- Web admin access to the device to upload the macro
- Network connectivity for your Webex Device to open the WebView content you want to display

### Installation Steps:

1. Download the ``proximity-dial-uiextension.js`` or ``proximity-dial-kiosk.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.

#### Kiosk Web App Example:

In the case of a Kiosk use case, you will need to set the Kiosk Web App URL and enable Kiosk Mode on your devices. Here is an example Kiosk Web App with a countdown animation to get started:
```
https://wxsd-sales.github.io/kiosk-demos/countdowndial
```

## Validation

Validated Hardware:

* Webex Desk Pro
* Webex Board

This macro should work on other Webex Devices with WebEngine support but has not been validated at this time.

## Demo

*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).


## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex usecases, but are not Official Cisco Webex Branded demos.


## Questions

Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=proximity-dial-macro) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team. 
