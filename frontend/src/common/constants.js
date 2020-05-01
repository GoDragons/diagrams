import { getCloudFormationOuputByName } from "common/outputParser.js";
const REST_API_ID = getCloudFormationOuputByName("RESTSocketApiId");
export const REST_API_URL = `https://${REST_API_ID}.execute-api.eu-west-2.amazonaws.com/Prod`;
