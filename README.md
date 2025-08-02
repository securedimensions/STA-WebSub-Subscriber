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

## Appreciation
This implementation has received funding from the European Union's Horizon Europe research and innovation program through participation in the CitiObs project.