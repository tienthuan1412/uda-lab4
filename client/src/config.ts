// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = '5tkqoe8p4b'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-kkvphh6gfckwj53u.us.auth0.com',
  clientId: 'cBlXuDaO0171RUXxNCFNGtawqdZrq6NX',
  callbackUrl: 'http://localhost:3000/callback'
}
