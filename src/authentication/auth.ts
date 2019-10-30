import { Response, Request } from "express";
import request from "request";
import jwt from "jsonwebtoken";
import path from "path";

import {cache} from "./cache";
import config from "../util/config";

//If you want to learn more about Azure Active Directory login, read this article:
//This Demo is (contrary to the demo implementation of a Teams Bot on Microsoft GitHub) not implemented using Implicit flow.
export function loginRedirect(res: Response) {
    res.redirect(
        //[Tenant ID] Can be "common" to support multi-tenant login (meaning every person with every Microsoft-Account can log into the app) or a specific tenant ID to only allow logins from that tenant
        //[Version] Currently v1.0 and v2.0 exist. v1.0 only allows login from organizational accounts, v2.0 allows login from organizational and personal accounts
        "https://login.microsoftonline.com/" + config.tenantId + "/oauth2/v2.0/authorize?" +
        //[client_id] Enter the ID of the enterprise application or application registration you want to use
        "client_id=" + config.botId +
        //[response_type] Specifies what Active Directory will return after a successful login action. Must at least be "code" for the OAuth 2.0 flow and "id_token" for the OpenIdConnect flow and can have "token" as an additional value
        "&response_type=code" +
        //[redirect_uri] The URL which will be called with the registration code as a query parameter
        "&redirect_uri=" + config.baseUrl + config.redirectUrl +
        //[response_mode] Specifies with which method the code should be returned to the application. Can be query, form_post or fragment
        "&response_mode=query" +
        //[state] The state parameter gets passed through the whole authorization workflow and can be used to store information that is important for your own application
        "&state= " +
        //[scope] The scope parameter specifies the permissions that the token received has to call different Microsoft services
        "&scope=" + config.scope
        //Optional parameters
        //[Prompt] Can has the values "login", "consent" and "none" and determines which prompt will be shown to the user when he logs in
        //[Login_hint] Can be used to auto fill-in the email adress or user name of the user who wants to authenticate
        //[Domain_hint] Can has the values "consumers" or "organizations" and determines which type of account can log in
    );
}

export function callbackHandler(req: Request, res: Response) {
    //The authentification code is passed to the redirect url as a query parameter called 'code'
    const authCode = req.query.code;
    //Simple check if the url was called with an authentification code to prevent unnecessary HTTP calls
    if (!authCode) {
        res.status(500).send("There was no authorization code provided in the query. No Bearer token can be requested");
        return;
    }

    requestToken(authCode).then(tokenJSON => {
        //We render a different payload for our final page depending on whether all checks were successful or not.
        if(validateToken(tokenJSON.access_token)) {
            res.render(path.join(__dirname,"..","..","views","callbackFrontend"), {
                successfulAuth: true
            })
        }
        else {
            res.render(path.join(__dirname,"..","..","views","callbackFrontend"), {
                successfulAuth: false
            })
        }
    })
}

async function requestToken(code: string): Promise<{ [key: string]: any }> {
    const options = {
        method: "POST",
        //[url] Tenant and version must match the code retrieval parameters
        url: "https://login.microsoftonline.com/" + config.tenantId + "/oauth2/v2.0/token",
        form: {
            //TODO: Used to specify that we want a Bearer token
            grant_type: "authorization_code",
            //[code] The code we got from the authorize-call which will be traded for a bearer token
            code: code,
            //[client_id] Enter the ID of the enterprise application or application registration you want to use
            client_id: config.botId,
            //[client_secret] Secret string that is used to prove your app has admin access to the application you want to log in, only necessary for Web Apps
            client_secret: config.botSecret,
            //[redirect_uri] The URL which was called with the authorization code (aka usually the current URL)
            //@ts-ignore
            redirect_uri: config.baseUrl + config.redirectUrl
        }
    };

    return new Promise((resolve, reject) => {
        //Execute the HTTP Post call with the options set above
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            try {
                //Parse JSON string from HTTP response to JSON object
                const json = JSON.parse(body);
                //If Active Directory couldn't hand out a Bearer token it will return a JSON object containing an error description
                if (json.error) {
                    console.error(json.error);
                    reject(json.error);
                }
                else {
                    resolve(json);
                }
            }
            catch (e) {
                console.error(e);
                reject(e);
            }
        })
    })
}

function validateToken(token:string):boolean {
    let parsedToken = jwt.decode(token);

    //Here you can do whatever validation you want to do to make sure the token comes from a valid source
    //@ts-ignore
    cache.set(parsedToken.oid,parsedToken.exp);
    return true;
}