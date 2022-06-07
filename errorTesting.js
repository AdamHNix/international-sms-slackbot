
//using jsdom to scrape Twilio's regulatory page
import { JSDOM } from "jsdom"
//using fetch for restcountries api
import fetch from 'node-fetch';


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
    const countryISORes = countryJson[0].cca2
    console.log("made it", countryJson[0].cca2)
    return countryISORes
  }

    const countryFull = 'Albania'
    let countryISO = ''
    //initialize all fields that will be displayed in slack message
    let html
    let alphaNetwork
    let longCode
    let longCodeInternational
    let shortCode
    let tollFree
    //initialize object array to hold final result
    const regulatoryItems = {}
    //index counter for object array
    let i = 0
    //table values array initialized
    const tdArrText = []
    //table keys array initialized
    const thArrText = []
    //objectArrayCount keeps track of the indexes in the array below. thArr logs a lot of keys from the regulatory page that we don't need. No need to log anything after index 46
    let objectArrayCount = 0


    if (countryFull.length === 2){
      countryISO = countryFull
    } else{
      //convert to ISO
      try{
        countryISO = await fetchCountry(countryFull)
      }catch(e){
        //catch error if country doesnt exist
        console.log('ERROR!!', e)
         //say("country not found")
      }
    }
    if (countryISO === "country not found"){
      //end action
    }
    //plug ISO into twilio regulatory link
    const link = `https://www.twilio.com/guidelines/${countryISO}/sms`
    try{
      html = await RegulationGet(link)
    }catch(e){
      //catch 404 pages
      console.log("error on jsdom fetch", e)
      //say("country not found")
      html = "country not found"
    }
    if(html === "country not found"){
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
                    case 5:
                      thArrText.push("Toll Free " + th.textContent)
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
        if(objectArrayCount === 52){
            thArrText.length = index + 1
        }
    })

    console.log("reg items!", regulatoryItems)
    //categorize alphanumeric functionality
    //if statement needed to trim "supported" responses on Alphanumeric Dynamic Twilio supported due to extra spaces and '\n'
    //trim included on all items due to html from web page sometimes having spaces before and after a given word
    if(regulatoryItems['Alphanumeric Dynamic Twilio supported'].length > 11){
        console.log("check")
        regulatoryItems['Alphanumeric Dynamic Twilio supported'] = regulatoryItems['Alphanumeric Dynamic Twilio supported'].slice(2,20)
        console.log("before second slic dynamic", regulatoryItems['Alphanumeric Dynamic Twilio supported'])

    }
    
    if(regulatoryItems['Alphanumeric Pre-registration Twilio supported'].length > 9){
        regulatoryItems['Alphanumeric Pre-registration Twilio supported'] = regulatoryItems['Alphanumeric Pre-registration Twilio supported'].slice(11,21)
        console.log("before second slice", regulatoryItems['Alphanumeric Pre-registration Twilio supported'])
    }
    if((regulatoryItems['Alphanumeric Pre-registration Operator network capability'].trim() === ('Required')) && 
    (regulatoryItems['Alphanumeric Pre-registration Twilio supported'].trim(/['"]+/g, '') === ("Required"))){
      alphaNetwork = 'Preregistration required'
    } else if (regulatoryItems['Alphanumeric Dynamic Operator network capability'] === ('Supported')
     && (regulatoryItems['Alphanumeric Dynamic Twilio supported'].trim(/['"]+/g, '') === ('Supported'))){
      alphaNetwork = 'Available'
    } else {
      alphaNetwork = 'Unavailable'
    }
    //categorize long code functionality
    if((regulatoryItems['Long Code Domestic Operator network capability'].trim(/['"]+/g, '') === ('Supported') )&& 
    (regulatoryItems['Long Code Domestic Twilio supported'].trim(/['"]+/g, '') === ("Supported"))){
      longCode = 'Supported'
    } else {
      longCode = 'Not Supported'
    }
    //categorize international long code functionality
    if((regulatoryItems['Long Code International Operator network capability'].trim(/['"]+/g, '') === ('Supported') )&& 
    (regulatoryItems['Long Code International Twilio supported'].trim(/['"]+/g, '') === ("Supported"))){
      longCodeInternational = 'Supported'
    } else {
      longCodeInternational = 'Not Supported'
    }
    //categorize short code functionality
    if((regulatoryItems['Short Code Operator network capability'].trim(/['"]+/g, '') === ('Supported') )&& 
    (regulatoryItems['Short Code Twilio supported'].trim(/['"]+/g, '') === ("Supported"))){
      shortCode = 'Supported'
    } else {
      shortCode = 'Not Supported'
    }
    //categorize toll free functionality
    if((regulatoryItems['Toll Free Operator network capability'].trim(/['"]+/g, '') === ('Supported') )&& 
    (regulatoryItems['Toll Free Twilio supported'].trim(/['"]+/g, '') === ("Supported"))){
    tollFree = 'Supported'
    } else {
    tollFree = 'Not Supported'
    }
