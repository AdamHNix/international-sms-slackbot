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
const table = Array.from(dom.querySelectorAll("tbody"))
console.log('table\n\n\n', table)
const regulatoryItems = []
const tdFinal = []
const spanFinal = []
table.forEach(element => {
    //to do: i'v egotten all the labels, but not the values. td items not showing up for some reason. Also need to single out the clasee ".guidelines-box" to get number specific info
    const elementDomFull = new JSDOM(element.outerHTML)
    const elementDom =  elementDomFull.window.document
    const spanNodeList = elementDom.querySelectorAll("span")
    const tdNodeList = elementDom.querySelectorAll("td")
    console.log("td node!", tdNodeList)
    var spanArr = [... spanNodeList]
    var tdArr = [... tdNodeList]
    console.log("td arr!!", tdArr)
    console.log("span arr" , spanArr)
    spanArr.forEach(element => {
        spanFinal.push(element.textContent)
    })
    tdArr.forEach(element => {
        console.log("td text", element.textContent)
        tdFinal.push(element.textContent)
    })
    var data = spanFinal.reduce((acc, value, i) => (
        acc[value] = tdFinal[i], acc), {})
        console.log(data)
    
});
console.log("reg itmes", regulatoryItems)