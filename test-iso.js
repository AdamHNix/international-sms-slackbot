import fetch from 'node-fetch';

const countryFull  = 'Canada'
async function fetchCountry(request){
    const countryInfo = await fetch(`https://restcountries.com/v3.1/name/${countryFull}`)
    const countryJson = await countryInfo.json()
    const countryISO = await countryJson[0].cca2
    const link = `https://www.twilio.com/guidelines/${countryISO}/sms`
    //const html = await RegulationGet(link)
    return countryISO
}


let test = await fetchCountry(countryFull)
console.log(test)