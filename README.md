# STA-WebSub-Subscriber
This repository contains an implementation of the [W3C WebSub](https://www.w3.org/TR/websub) Subscriber. An admin can create new subscriptions based on a random callback URL created by the implementation. The processing of received notifications take place based on a callback function that can be uploaded as a Javascript file. The subscription can be set active, inactive and allowed for unsubscribe by a W3C Hub.

The implementation is used in the Horizon Europe CitiObs project to operate with an [implementation](https://github.com/securedimensions/STA-WebSub-Hub) of the  [OGC STA-WebSub](https://portal.ogc.org/files/?artifact_id=110354&version=1)[^1] Standard to support asynchronous messaging with the [OGC SensorThings API v1.1](https://docs.ogc.org/is/18-088/18-088.html) Standard, [implemented](https://github.com/FraunhoferIOSB/FROST-Server) by Fraunhofer.

[^1]: Currently in draft state

## Limitation
The current implementation does not support topic discovery and supports one pre-configured W3C Hub only.

## Installation
The implementation starts an ExpressJS server on a configurable port. The Use of a Web Server in reverse-proxy configuration is recommended for TLS hosting. The implementation is tested on NodeJS v24.1.0.

### Prerequisites
STA-WebSub-Subscriber requires `Node.js v24.1.0` or higher.  Node.js can be downloaded [here](https://nodejs.org/en/download/). Alternatively you can use a Node.js version manager like [`nvm`](https://github.com/nvm-sh/nvm) or [`nvm-windows`](https://github.com/coreybutler/nvm-windows).

### .env File
The following startup parameters (environment variables) must be set in a `.env` file to ensure that the controller is starting correctly.

```
COOKIE_SECRET=<your strong unique secret>
PORT=<3000 or whatever you think fits>
APP_NAME=STA-WebSub Subscription Management
LOGIN=<the username for administration>
PASSWORD=<...>
LOG_LEVEL={DEBUG, INFO, WARN, etc.} any valid Node.js loglevel - default: WARN
HUB_URL=<the URL to the WebSub Hub implementation>
ROOT_URL=<The URL of the STA-WebSub Subscriber> important if behind Web Server
```

### Starting the Application locally
From the `STA-WebSub-Subscriber` root directory, simply install the application node modules then call `npm start`

For example on Linux:

```SHELL
npm install
npm start
```

You can now open your browser and connect to `localhost:3000` to see the application. After login with the configured user / password, you can start managing subscriptions.

### Starting the Application via Docker
After creating a meaningful `.env` file, simply start with 

```SHELL
docker-compose up -d
```

## Using the STA-WebSub-Subscriber
The functionality is simplified as much as possible. After login, the admin user gets displayed the existing subscriptions (empty list at first start). 

### Creating a new Subscription
The `New` menu opens the page for the creation of a new subscription.

The callback URL is created based on a random UUIDv4. Each time, the `New` menu is clicked, the implementation creates a new callback URL. This is following the recommendation from the W3C WebSub.

The `Topic` is the URL that you want to receive notifications from.

The `Content-Type` is the media type that you expect for the notification. This value will be checked against an incoming notification, received on the callback URL. If there is a no match, then the middleware implementation prevents further processsing.

The `Lease Seconds` is the period in seconds that the subscription shall be active. To prevent that the Hub prunes the subscription, the STA-WebSub-Subscriber starts a timer that will renew the subscription after the `Lease Seconds` are passed. Upon validation of intent made by the Hub, the timer is started again (assuming the subscription state is `active`). This ensures that the actual `Lease Seconds` set by the Hub is used. The minimum lease seconds is `60`.

The `Secret` is an optional, random string of up to 200 characters that the Hub shall use to create the `X-HubSignature` HMAC value when sending notifications to the callback URL.

The `State` for a new subscription can be set to `active` or `inactive`. When selecting `active` the implementation submits the subscription request to the Hub immediately. This enables the immediate receiving of notifications. When selecting `inavtive` the Hub is not contacted and therefore no notifications can be received.

### Updating a Subscription
From the list of subscriptions (`/subscriptions`) an individual subscription can be selected by clicking on the identifier.

After that click, the page for the individual subscription opens. The values for `Callback`, `Topic`, `Content-Type` and `Function File` are read only.

You can modify the values for `Lease Seconds`, `Secret`, `State`.

When you update the `Lease Seconds`, the timer for renewing subscriptions is restarted respecting the new value.

When updating the `Secret` value, the notification middleware will immediately use the new secret to verify the `X-Hub-Signature` HMAC value.

When updating the `State` to `inactive`, the implementation sends an `unsubscribe` to the Hub.

When the `State` is set to `unsubscribe` the subscription gets automatically deleted once an `unsubscribe` is received from the Hub. This `State` allows that any caller to the Hub can delete a subscription.

### Deleting a Subscription
After the `delete` button is clicked, the subscription is deleted in the database and an `unsubscribe` is send to the Hub. The renewal timer for the subscription is cleared. Also, the `Function File` is removed.

Any future notifications that are received on the associated (no longer existing) callback are acknowledged with HTTP status code 404 (not found). This implementation does not support the HTTP status code 410 (gone) as a subscription is really deleted from the database.

Note: Technically, it is literally impossible to recreate the same callback again as the implementation automatically generates a new UUIDv4 when the `new` link is followed. 

## Appreciation
This implementation has received funding from the European Union's Horizon Europe research and innovation program through participation in the CitiObs project.