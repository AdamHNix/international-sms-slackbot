//for slack auth
import 'dotenv/config'
//slack API library
import App from '@slack/bolt';
//using jsdom to scrape Twilio's regulatory page
import { JSDOM } from "jsdom"
//using fetch for restcountries api
import fetch from 'node-fetch';

//function to get regulatory page

async function RegulationGet(url) {
    try{
        return JSDOM.fromURL(url).then(dom => {
        return (dom);
    });

    }catch(e){
      console.log("ERROR", e)
    }
  }

  //convert country to cca2 code
  async function fetchCountry(request){
    const countryInfo = await fetch(`https://restcountries.com/v3.1/name/${request}`)
    const countryJson = await countryInfo.json()
    const countryISORes = countryJson[0].cca2
    return countryISORes
  }

  function countryChecker(countryCheck){
    if(countryCheck.toLowerCase() === 'china' || countryCheck.toLowerCase() === "people's republic of china" || countryCheck.toLowerCase() === "peoples republic of china"){
      countryCheck = 'cn'
    }
    if(countryCheck.toLowerCase() === 'dominica'){
      countryCheck = 'dm'
    }
    if(countryCheck.toLowerCase() === 'democratic republic of congo' || countryCheck.toLowerCase() === 'republic of congo'){
      countryCheck = 'cd'
    }
    if(countryCheck.toLowerCase() === 'india'){
      countryCheck = 'in'
    }
    if(countryCheck.toLowerCase() === 'iran'){
      countryCheck = 'ir'
    }
    if(countryCheck.toLowerCase() === 'mali'){
      countryCheck = 'ml'
    }
    if(countryCheck.toLowerCase() === 'namibia'){
      countryCheck = 'na'
    }

    return countryCheck
  }

  function isoChecker(isoCheck){
    if (isoCheck.length === 2){
      return isoCheck
    } else{
      //convert to ISO
      try{
        isoCheck = fetchCountry(isoCheck)
        return isoCheck
      }catch(e){
        //catch error if country doesnt exist
        console.log('ERROR!!', e)
        isoCheck = "country not found"
        say("country not found")
        return isoCheck
      }
    }
  }
  
  // Initializes your app with your bot token and signing secret
  const app = new App.App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: false,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN
  });
  
  // Listens to incoming messages that contain "hello"
  app.message( async ({ message, say }) => {
    // say() sends a message to the channel where the event was triggered
    let countryFull = message.text
    ///check for one-off use-cases where RESTcountries fails
    countryFull = countryChecker(countryFull)
    console.log('countryFull after country checker', countryFull)

    let countryISO = ''
    //initialize all fields that will be displayed in slack message
    let html
    let alphaNetwork
    let longCode
    let longCodeInternational
    let shortCode
    let tollFree
    let case5 = false
    //index counter for object array
    let i = 0
    //initialize object array to hold final result
    const regulatoryItems = {}
    //table values array initialized
    const tdArrText = []
    //table keys array initialized
    const thArrText = []
    //objectArrayCount keeps track of the indexes in the array below. thArr logs a lot of keys from the regulatory page that we don't need. No need to log anything after index 46
    let objectArrayCount = 0
    //check for non-ISO responses and convert if necessary
    countryISO = await isoChecker(countryFull)
    console.log("countryFull after isoChecker", countryFull)
    //end call if response is "country not fonud"
    if (countryISO === "country not found"){
      return
    }
    //plug ISO into twilio regulatory link
    const link = `https://www.twilio.com/guidelines/${countryISO}/sms`
    try{
      html = await RegulationGet(link)
    }catch(e){
      //catch 404 pages
      console.log("error on jsdom fetch", e)
      say("country not found")
      html = "country not found"
      return
    }
    if(html === "country not found"){
      return
    }
    const dom = html.window.document
    //get array from specific table on twilio webpage
    let tableArr = Array.from(dom.getElementsByClassName("guideline-box"))
    //set html object values from webpage scrape to td and th arrays.
    tableArr.forEach(item =>{
        let thtd = new JSDOM(item.outerHTML)
        const tdArr = Array.from(thtd.window.document.querySelectorAll("td"))
        const thArr = Array.from(thtd.window.document.querySelectorAll("th"))
        //convert to arrays with text
        tdArr.forEach(td =>{
            tdArrText.push(td.textContent)
        })
        thArr.forEach(th =>{        
            if(th.textContent === '' || th.textContent === "Alphanumeric"|| th.textContent === "Long Code"|| th.textContent === "Short Code"|| th.textContent === "Toll Free"|| th.textContent === "Pre-registration"|| th.textContent === "Dynamic"|| th.textContent === "Domestic"|| th.textContent === "International"){
              if (th.textContent === "Toll Free"){
                case5 = true
              }
                i++
            }
            else if( th.textContent === '' || th.textContent === "Operator network capability"|| th.textContent === "Twilio supported"|| th.textContent === "Sender ID preserved"|| th.textContent === "Provisioning time"|| th.textContent === "UCS-2 support"|| th.textContent === "Use case restrictions"|| th.textContent === "Best practices"){
                let y = 0
                do{
                switch (y){
                    case 0:
                        thArrText.push("Alphanumeric Pre-registration " + th.textContent)
                        break
                    case 1:
                        thArrText.push("Alphanumeric Dynamic " + th.textContent)
                        break
                    case 2:
                        thArrText.push("Long Code Domestic " + th.textContent)
                        break
                    case 3:
                        thArrText.push("Long Code International " + th.textContent)
                        break
                    case 4:
                        thArrText.push("Short Code " + th.textContent)
                        break
                    case 5:
                      if(case5){
                        thArrText.push("Toll Free " + th.textContent)
                      }
                      break
                  }
                      y ++
                  }while(y< 6)

            } 
            //write all regular key value pairs
            else {
                thArrText.push(th.textContent)
                i++
            }
        })
    })
    thArrText.forEach((element, index) => {
      regulatoryItems[(element)] = (tdArrText[index]);
      objectArrayCount++
      if(case5 == false){
          if(objectArrayCount === 46){
              thArrText.length = index + 1
          }
      } else if (objectArrayCount === 52){
          thArrText.length = index + 1
      }
  })
    //categorize alphanumeric functionality
    //if statement needed to trim "supported" responses on Alphanumeric Dynamic Twilio supported due to extra spaces and '\n'
    //trim included on all items due to html from web page sometimes having spaces before and after a given word
    if(regulatoryItems['Alphanumeric Dynamic Twilio supported'].length > 11){
      regulatoryItems['Alphanumeric Dynamic Twilio supported'] = regulatoryItems['Alphanumeric Dynamic Twilio supported'].slice(11,21)
  }
  if(regulatoryItems['Alphanumeric Pre-registration Twilio supported'].length > 9){
      regulatoryItems['Alphanumeric Pre-registration Twilio supported'] = regulatoryItems['Alphanumeric Pre-registration Twilio supported'].slice(11,21)
  }
  if((regulatoryItems['Alphanumeric Pre-registration Operator network capability'].trim() === ('Required') || 
  regulatoryItems['Alphanumeric Pre-registration Operator network capability'].trim() === ('Supported')) && 
  (regulatoryItems['Alphanumeric Pre-registration Twilio supported'].trim() === ("Required") ||
  regulatoryItems['Alphanumeric Pre-registration Twilio supported'].trim() === ("Supported"))){
      alphaNetwork = 'Supported - Pre-registration required'
  } else if ((regulatoryItems['Alphanumeric Dynamic Operator network capability'] === ('Supported'))
  && (regulatoryItems['Alphanumeric Dynamic Twilio supported'].trim() === ('Supported'))){
      alphaNetwork = 'Supported'
  }else {
      alphaNetwork = 'Not Supported'
  }
  //categorize long code functionality
  if((regulatoryItems['Long Code Domestic Operator network capability'].trim() === ('Supported') )&& 
  (regulatoryItems['Long Code Domestic Twilio supported'].trim() === ("Supported"))){
      longCode = 'Supported'
  } else {
      longCode = 'Not Supported'
  }
  //categorize international long code functionality
  if((regulatoryItems['Long Code International Operator network capability'].trim() === ('Supported') )&& 
  (regulatoryItems['Long Code International Twilio supported'].trim() === ("Supported"))){
      longCodeInternational = 'Supported'
  } else {
      longCodeInternational = 'Not Supported'
  }
  //categorize short code functionality
  if((regulatoryItems['Short Code Operator network capability'].trim() === ('Supported') )&& 
  (regulatoryItems['Short Code Twilio supported'].trim() === ("Supported"))){
      shortCode = 'Supported'
  } else {
      shortCode = 'Not Supported'
  }
  //categorize toll free functionality
  if(case5 == true){
    if ((regulatoryItems['Toll Free Operator network capability'].trim() === ('Supported') )&& 
    (regulatoryItems['Toll Free Twilio supported'].trim() === ("Supported"))){
      tollFree = 'Supported'
    }
  } else {
    tollFree = 'Not Supported'   
  }
    await say(`Phone number availability for ${regulatoryItems['Locale name']} \n
    *Alphanumeric*\n
    ${alphaNetwork}\n
    *Long Code *\n
    ${longCode}\n
    *International Long Code*\n
    ${longCodeInternational}\n
    *Short Code*\n
    ${shortCode}\n
    *Toll Free*\n
    ${tollFree}\n
    _<${link}|Learn More>_
    `)
  });
//start slack app
(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();