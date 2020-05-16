import * as HTTP from "http";
import * as Url from "url";
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import { createTokenAuth } from "@octokit/auth-token";
import { request } from "@octokit/request";
import { Octokit } from "@octokit/rest";
//import { request } from "@octokit/request";

interface AccessTokenData {
  clientId: string;
  clientSecret: string;
  headers: {
    authorization: string
  };
}

const CLIENT_ID: string = "47db66f43b3e5e0c0b25";
const CLIENT_SECRET: string = "d1abfd3be9efe995399faad6a2f947b2dc4149a9";
const SCOPE: string = "repo, user";
//State is going to generate from the client
const STATE: string = "D9XGyXfLbrSnDrpshfp4CPc7";

export namespace GithubAPI {
  let server: HTTP.Server = HTTP.createServer();
  let port: number | string | undefined = process.env.PORT;

  if (port == undefined)
    port = 5001;

  server.listen(port);
  server.addListener("request", handleRequest);

  function handleRequest(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): void {
    if (_request.url) {
      let url: Url.UrlWithParsedQuery = Url.parse(_request.url, true);
      for (let key in url.query) {
        if (key == "action") {
          switch (url.query[key]) {
            case "authenticate":
              authenticate(_response);
              break;
            case "fetchAccessToken":
              fetchAccessToken(_request, _response);
              break;
            case "createNewRepository":
              createNewRepository(_request, _response);
              break;
            default:
              _response.write("No such action available");
              _response.end();
          }
        }
      }
    }
  }
  function authenticate(_response: HTTP.ServerResponse): void {
    let url: string = "https://github.com/login/oauth/authorize";
    let params: URLSearchParams = new URLSearchParams("client_id=" + CLIENT_ID + "&state=" + STATE + "&scope=" + SCOPE);
    url += "?" + params.toString();
    _response.writeHead(302, {
      "Location": url
    });
    _response.end();
  }
  async function fetchAccessToken(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let _code: string | null = null;
    let _state: string | null = null;

    _code = url.query["code"] ? <string>url.query["code"] : null;
    _state = url.query["state"] ? <string>url.query["state"] : null;

    //TODO if state dont matches the original state, abort the process

    if (_code && _state) {

      const auth = createOAuthAppAuth({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        code: _code
      });
      const appAuthentication: {} = await auth({
        type: "oauth-app"
      });

      let result: string = JSON.stringify(appAuthentication);
      let data: AccessTokenData = JSON.parse(result);

      _response.setHeader("Access-Control-Allow-Origin", "*");
      _response.setHeader("Content-Type", "json");
      _response.write(data ? data.headers.authorization : "Err:#10001: No data available");
      _response.end();
    }
  }
  async function createNewRepository(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let _name: string | null = null;
    let _private: string | null = null;
    let _accessToken: string | null = null;

    _name = url.query["name"] ? <string>url.query["name"] : null;
    _private = url.query["private"] ? <string>url.query["private"] : null;
    _accessToken = url.query["accessToken"] ? <string>url.query["accessToken"] : null;

    if (_name && _private && _accessToken) {

      let data = await fetch("http://api.github.com/AionixX/repos?name=HelloWorld", {
        method: "POST",
        headers: {
          "Authorization": _accessToken
        }
      });

      console.log(data);





      let auth = createTokenAuth(_accessToken);
      let requestWithAuth = request.defaults({
        request: {
          hook: auth.hook
        }
      });
      const { data: authorizations } = await requestWithAuth("GET /authorizations");
      console.log(authorizations);
     // _response.write(result.status);
    }
    _response.setHeader("Access-Control-Allow-Origin", "*");
    _response.setHeader("Content-Type", "json");
    _response.end();

  }
}