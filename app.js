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
  console.log("json", countryJson)
  const countryISO = await countryJson[0].cca2
  const link = `https://www.twilio.com/guidelines/${countryISO}/sms`
  //const html = await RegulationGet(link)
  return countryISO
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
    //need to change this to user input once slack is connec ted 
    const countryFull = message.text
    //convert to ISO
    const countryISO = await fetchCountry(countryFull)
    const link = `https://www.twilio.com/guidelines/${countryISO}/sms`
    const html = await RegulationGet(link)
    const dom = html.window.document
    //get array from specific table on twilio webpage
    let tableArr = Array.from(dom.getElementsByClassName("guideline-box"))
    //initialize object array to hold final result
    const regulatoryItems = {}
    //index counter for object array
    let i = 0
    //table values array initialized
    const tdArrText = []
    //table keys array initialized
    const thArrText = []
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
            if(th.textContent === '' || th.textContent === "Alphanumeric"|| th.textContent === "Long Code"|| th.textContent === "Short Code"|| th.textContent === "Pre-registration"|| th.textContent === "Dynamic"|| th.textContent === "Domestic"|| th.textContent === "International"){
                i++
            }
            //rename keys where there are duplicates in the guidelines table.
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
                }
                    y ++
                }while(y< 5)

            } 
            //write all regular key value pairs
            else {
                thArrText.push(th.textContent)
                i++
            }
        })
    })

    //objectArrayCount keeps track of the indexes in the array below. thArr logs a lot of keys from the regulatory page that we don't need. No need to log anything after index 46
    let objectArrayCount = 0
    thArrText.forEach((element, index) => {
        regulatoryItems[(element)] = (tdArrText[index]);
        objectArrayCount++
        if(objectArrayCount === 46){
            thArrText.length = index + 1
        }
    })

    //initialize all fields that will be displayed in slack message
    let alphaNetwork
    let longCode
    let longCodeInternational
    let shortCode

    //categorize alphanumeric functionality
    //if statement needed to trim "supported" responses on Alphanumeric Dynamic Twilio supported due to extra spaces and '\n'
    //trim included on all items due to html from web page sometimes having spaces before and after a given word
    console.log("TEST1", regulatoryItems['Alphanumeric Pre-registration Twilio supported'].slice(11,20))
1
    if(regulatoryItems['Alphanumeric Dynamic Twilio supported'].length > 11){
        regulatoryItems['Alphanumeric Dynamic Twilio supported'] = regulatoryItems['Alphanumeric Dynamic Twilio supported'].slice(11,20)
    }
    if(regulatoryItems['Alphanumeric Pre-registration Twilio supported'].length > 9){
      regulatoryItems['Alphanumeric Pre-registration Twilio supported'] = regulatoryItems['Alphanumeric Pre-registration Twilio supported'].slice(11,20)

    }
    if((regulatoryItems['Alphanumeric Pre-registration Operator network capability'].trim() === ('Required')) && 
    (regulatoryItems['Alphanumeric Pre-registration Twilio supported'].trim() === ("Required"))){
      alphaNetwork = 'Preregistration required'
    } else if (regulatoryItems['Alphanumeric Dynamic Operator network capability'] === ('Supported')
     && (regulatoryItems['Alphanumeric Dynamic Twilio supported'].trim() === ('Supported'))){
      alphaNetwork = 'Available'
    } else {
      alphaNetwork = 'Unavailable'
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
    
    //post text to slack bolt
    await say(`Phone number availability for ${regulatoryItems['Locale name']} \n
    *Alphanumeric*\n
    ${alphaNetwork}\n
    *Long Code *\n
    ${longCode}\n
    *International Long Code*\n
    ${longCodeInternational}\n
    *Short Code*\n
    ${shortCode}\n
    *Compliance Considerations*\n
     ${regulatoryItems['Compliance considerations']}\n
    _<${link}|Learn More>_
    `)
  });
//start slack app
(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();