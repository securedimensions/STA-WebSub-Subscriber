const parseHttpHeader = require('parse-http-header');

const websubGET = async (req, res, next) => {
    console.log("websub GET Middleware");
    next();
  };

  const websubPOST = async (req, res, next) => {
    console.log("websub POST Middleware");
  
    if (['PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'].includes(req.method)) {
        return res.status(405).contentType('text').send('method not implemented');
    }

    if (req.method === 'POST') {
        if (!req.header('content-type') === undefined) {
            console.log("request has no content-type header");
            return res.status(415).contentType('text').send('content type header missing');
        }

        let content_type = parseHttpHeader(req.headers['content-type'])[0];
        console.log(`content-type: ${content_type}`);

        if (content_type !== 'application/json') {
            console.log("request has wrong content-type: " + content_type);
            return res.status(415).contentType('text').send('content type must be `application/json`');
        }
    }
    next();
  };

module.exports = {websubGET, websubPOST}