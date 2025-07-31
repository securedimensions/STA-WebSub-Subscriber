module.exports = {
    /* Example function to process the notification */
  call: function(body) {
    /* The body is a byte array */
    /* This example subscription is registered with content-type application/json */
    const data = JSON.parse(body);
    console.log(data);
  }
}