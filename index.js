import jsdom  from 'jsdom'
import { JSDOM } from "jsdom"

async function RegulationGet(url) {
    try{
        return JSDOM.fromURL(url).then(dom => {
        return (dom);
    });

    }catch(e){
        console.log("ERROR", e)
    }
}
const country = 'AU'
const html = await RegulationGet(`https://www.twilio.com/guidelines/${country}/sms`)
const dom = html.window.document
const title = dom.querySelector("h1").textContent
console.log("title", title)
//can get table from tbody > tr. Class is phone_numbers_table
const table = Array.from(dom.querySelectorAll("tbody"))
const regulatoryItems = {}
table.forEach(element => {
    //to do: Turn important items of each "element.outerhtml" into a key value pair in "regulatoryItems" array.
    console.log(element.outerHTML)
    console.log("\n\n\n\n\n\n")
});
