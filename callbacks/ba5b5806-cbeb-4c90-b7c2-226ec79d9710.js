module.exports = {
    /* Example function to process the notification */
  call: function(body) {
    /* This example subscription is registered with content-type application/json */
    const data = JSON.parse(body);
    console.log(data);
  }
}