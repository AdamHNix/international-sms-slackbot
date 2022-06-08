## name

    Phone Number Type Availability By Country - Slack Bot

## What is it

    This Slack bot provides for an easy way to get quick information on phone number type availability on a give country. 
    The bot scrapes the relevant sms guidlines page (i.e. https://www.twilio.com/guidelines/bt/sms) and provides relevant information to the slack user.

## Usage

    Users need to input the country name or the country cca2 code (i.e. "Canada" or "CA") in a private chat with the slack bot. 

    The following items will be returned via slack chat with information on whether each is supported or not:

        Alphanumeric

        Long Code

        International Long Code

        Short Code

        Toll Free

    Responses for each will either be "Supported" or "Not Supported" with one caveat being that Alphanumeric items may have the response of "Supported - Pre-registration required"


## Example

    Example response for Canada:

    Phone number availability for Canada
    Alphanumeric
    Not Supported
    Long Code
    Supported
    International Long Code
    Not Supported
    Short Code
    Supported
    Toll Free
    Supported
    Learn More
