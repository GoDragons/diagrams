const { WEBSOCKET_API_NAME, REST_API_NAME } = require("../constants");

const data = {
  WebSocketApiId: {
    Value: {
      Ref: WEBSOCKET_API_NAME,
    },
  },
  RESTSocketApiId: {
    Value: {
      Ref: REST_API_NAME,
    },
  },
};

module.exports = data;
