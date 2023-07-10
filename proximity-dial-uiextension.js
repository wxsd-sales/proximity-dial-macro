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
  prompt: {
    waitTime: 10,
    title: `Person Detected`,
    text: ['Your call will begin in ', ' seconds'],
    panelId: 'proximity-calling'
  },
  target: '<target SIP number>'
}

/*********************************************************
 * Subscribe to status and events
**********************************************************/

createPanel(config.prompt)
xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
xapi.Config.RoomAnalytics.PeoplePresenceDetector.set('On');
xapi.Status.RoomAnalytics.Engagement.CloseProximity.on(state => processChange('CloseProximity', state));
xapi.Status.RoomAnalytics.PeopleCount.Current.on(state => processChange('PeopleCount', state));
xapi.Event.UserInterface.Extensions.Panel.Close.on(monitorPanel);
xapi.Event.UserInterface.Extensions.Widget.Action.on(proecessWidget);


/*********************************************************
 * Main functions and event subscriptions
**********************************************************/

let interval = null;
let timeRemaining = null;
let suspend = false;

async function processChange(type, state) {
  if(suspend) return;

  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  if (calls > 0) return;

  let close = null;
  let count = null;

  switch (type) {
    case 'CloseProximity':
      close = state;
      count = await xapi.Status.RoomAnalytics.PeopleCount.Current.get();
      break;
    case 'PeopleCount':
      count = state;
      close = await xapi.Status.RoomAnalytics.Engagement.CloseProximity.get()
      break;
  }

  if ((count < 1 || close == 'False') && interval != null) {
    stopCountDown();
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - Detection Ended, resetting timer`);
    return;
  } else if (count > 0 && close == 'True' && interval == null) {
    startCountDown();
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - New detection detected, starting timer`);
    return;
  } else {
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - Ignoring`);
    return;
  }
}

function monitorPanel(event){
  console.log('Panel Closed - TimeRemaining', timeRemaining)
  if(event.PanelId != config.prompt.panelId) return;
  if(timeRemaining == null) return;
  console.log('Reopening panel')
  openPanel();
}

function proecessWidget(event){
  if(event.Type != 'clicked' && event.WidgetId != config.prompt.panelId ) return;
  stopCountDown();
  suspsendMonitoring(60);
}

function suspsendMonitoring(seconds){
  suspend = true;
  console.log(`${config.prompt.title} suspended for ${seconds} seconds`)
  setTimeout(()=>{
    suspend = false;
    console.log(`${config.prompt.title} suspension finished, monitioring again`)
  }, seconds * 1000)
}

async function startCountDown(){
  timeRemaining = config.prompt.waitTime;
  await xapi.Command.Standby.Deactivate();
  await updateText(config.prompt.waitTime);
  await openPanel();
  interval = setInterval(countDown, 1000)
}

function stopCountDown(){
  clearInterval(interval)
  interval = null;
  closePanel();
}

function countDown() {
  if (timeRemaining == 0 && !suspend) {
    stopCountDown();
    placeCall();
  } else {
    timeRemaining = timeRemaining - 1;
    updateText(timeRemaining)
  }
}

function openPanel() {
  return xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: config.prompt.panelId })
}

function closePanel() {
  xapi.Command.UserInterface.Extensions.Panel.Close();
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

function updateText(text){
  text = `${config.prompt.text[0]} ${text} ${config.prompt.text[1]}`;
  console.log(`Updating Text [${text}]`)
  return xapi.Command.UserInterface.Extensions.Widget.SetValue(
    { Value: text, WidgetId: config.prompt.panelId+'-text' });
}

async function createPanel(prompt){
  const panel = `<Extensions><Panel>
                  <Location>Hidden</Location>
                  <Name>${prompt.title}</Name>
                  <ActivityType>Custom</ActivityType>
                  <Page>
                    <Name>${prompt.title}</Name>
                    <Row><Widget>
                        <WidgetId>${prompt.panelId}-text</WidgetId>
                        <Name>${prompt.text[0]} ${prompt.waitTime} ${prompt.text[1]}</Name>
                        <Type>Text</Type>
                        <Options>size=4;fontSize=normal;align=center</Options>
                    </Widget></Row>
                    <Row><Widget>
                        <WidgetId>${prompt.panelId}-cancel</WidgetId>
                        <Name>Cancel</Name>
                        <Type>Button</Type>
                        <Options>size=2</Options>
                    </Widget></Row>
                    <Options>hideRowNames=1</Options>
                  </Page>
                </Panel></Extensions>`;
  return xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: prompt.panelId }, panel);
} 