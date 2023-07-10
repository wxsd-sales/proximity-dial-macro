/********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 07/10/23
 * 
 * This is an example Webex Device macro which automatically dials
 * a destination if a user stands in front of the device for 
 * a period of time.
 *
 * Full Readme, source code and license agreement available on Github:
 * https://github.com/wxsd-sales/proximity-dial-macro
 * 
 ********************************************************/

import xapi from 'xapi';

const config = {
  target: '<target SIP address>'
}

/*********************************************************
 * Subscribe to status and events
**********************************************************/

let listeners = []

// Check if kiosk mode is available first before applying config and starting listeners
xapi.Config.UserInterface.Kiosk.Mode.get()
.then( mode => {
  console.log(`Kiosk Mode currently set to [${mode}]`)
  xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
  xapi.Config.RoomAnalytics.PeoplePresenceDetector.set('On');
  if(mode == 'On'){ startListeners() }
})
.catch(error=>console.log('Kiosk Mode not available on this device - this macro will not work - Error: ', error.message))


// Start or Stop listeners if Kiosk mode changes
xapi.Config.UserInterface.Kiosk.Mode.on(mode =>{
  if(mode == 'On'){ startListeners()} 
  else { stopListeners() }
})

function startListeners(){
  console.log('Setting up listners')
  listeners.push( xapi.Status.RoomAnalytics.Engagement.CloseProximity.on(state => processChange('CloseProximity', state)))
  listeners.push( xapi.Status.RoomAnalytics.PeopleCount.Current.on(status => processChange('PeopleCount', status)))
  listeners.push( xapi.Status.UserInterface.WebView.on(processWebViews))
}

function stopListeners(){
  console.log('Stopping listners')
  const lenght = listeners.length
  for(let i = 0; i < lenght; i++){
    const listener = listeners.shift()
    listener();
  }
}

/*********************************************************
 * Main functions and event subscriptions
**********************************************************/

let currentState = 'Standby';

async function processChange(type, status) {

  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  if (calls > 0) return;

  let close = null;
  let count = null;

  switch (type) {
    case 'CloseProximity':
      close = status;
      count = await xapi.Status.RoomAnalytics.PeopleCount.Current.get();
      break;
    case 'PeopleCount':
      count = status;
      close = await xapi.Status.RoomAnalytics.Engagement.CloseProximity.get()
      break;
  }

  if ((count < 1 || close == 'False') && currentState != 'Standby') {
    updateState('Standby')
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - Detection Ended - Entering Standby`);
    return;
  } else if (count > 0 && close == 'True' && currentState != 'Countdown') {
    updateState('Countdown')
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - New detection detected, starting countdown`);
    return;
  } else {
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - Ignoring`);
    return;
  }
}

function updateState(newState){
  currentState = newState
  xapi.Config.UserInterface.Kiosk.URL.get()
  .then(url=>{
    const prehash = url.split('#')[0]
    const newUrl = prehash + '#state=' + newState;
    xapi.Config.UserInterface.Kiosk.URL.set(newUrl);
  })
}

async function processWebViews(event) {
  if (!event.hasOwnProperty('URL')) return;
  const splitURL = event.URL.split('#')
  if(splitURL.length < 2) return;
  const hash = splitURL.pop();
  if(hash != 'countdown-completed') return;
  console.log('Countdown completed detected in URL hash, closing webview')
  await placeCall();
  updateState('Standby')
}

async function placeCall() {
  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  if (calls > 0) {
    console.log(`Timer for dialling destination return`)
    return;
  }
  console.log(`Dialling target [${config.target}]`)
  xapi.Command.Dial({ Number: config.target })
}