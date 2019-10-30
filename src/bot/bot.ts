import * as botbuilder from "botbuilder";
import * as auth from "../authentication/cache";
import config from "../util/config";

export async function handle(turnContext: botbuilder.TurnContext) {
    //The turnContext can contain a variety of properties, and especially the payload of the bot message can differ significantly. Therefore we can check a variety of properties that are only available for example when the bot received a text message

    //The first thing to check is if we received an auth flow callback, meaning a proof that an user just logged in.
    if (processSignin(turnContext)) return;

    //Before handling any request, we have to check if the user is already logged in. In this example, an in-memory user cache is used that stores signed in users and the expiry time of their logins.
    if (authenticate(turnContext)) return;

    //Here we can implement the actual Bot logic.
    processMessage(turnContext);
}

/**
 * Handler function to determine if the request contains an accessToken for login.
 * @param turnContext 
 * @returns boolean indicator if the message was a signin callback.
 */
function processSignin(turnContext: botbuilder.TurnContext): boolean {
    if (turnContext.activity.type === "invoke" && turnContext.activity.value.state.accessToken) {
        if (turnContext.activity.value.state.accessToken !== "invalid") {
            turnContext.sendActivity("You are successfully logged in!");
        }
        else {
            turnContext.sendActivity("You could not be logged in. Please try again!");
        }
        return true;
    }
    return false;
}

function authenticate(turnContext: botbuilder.TurnContext): boolean {
    if (!auth.cache.get(turnContext.activity.from.aadObjectId || "false")) {
        //If the user has to sign in again, we send a signinCard. This is a pre-formatted Adaptive Card that contains some text and a button that launches a popup.
        //@ts-ignore
        const card = botbuilder.CardFactory.signinCard("Log in", config.baseUrl + "/api/login", "Log in to get started!");
        const message = botbuilder.MessageFactory.attachment(card);
        turnContext.sendActivity(message);
        return true;
    }
    return false;
}

function processMessage(turnContext: botbuilder.TurnContext) {
    const utterance = turnContext.activity.text;
    if (utterance) {
        turnContext.sendActivity(`I heard you say ${utterance}`);
    }
}