import express from "express";
import teamsBotbuilder from "botbuilder-teams";
import * as botbuilder from "botbuilder";
import dotenv from "dotenv";
import { callbackHandler, loginRedirect } from "./authentication/auth";
import * as auth from "./authentication/cache";

const app = express();
app.set('view engine', 'ejs');
dotenv.config();

var adapter = new botbuilder.BotFrameworkAdapter({
    appId: process.env.BOTAPPID,
    appPassword: process.env.BOTAPPSECRET
});
app.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async (turnContext) => {
        const utterance = turnContext.activity.text;
        if(turnContext.activity.type === "invoke") {
            if (turnContext.activity.value.state.accessToken !== "invalid") {
                await turnContext.sendActivity("You are successfully logged in!");
            }
            else {
                await turnContext.sendActivity("You could not be logged in. Please try again!");
            }
        }
        else {
            if(!auth.cache.get(turnContext.activity.from.aadObjectId || "false")) {
                //@ts-ignore
                const card = botbuilder.CardFactory.signinCard("Log in", process.env.BASEURL + "/api/login", "Log in to get started!");
                const message = botbuilder.MessageFactory.attachment(card);
                await turnContext.sendActivity(message);
            }
            else {
                if (utterance) {
                    await turnContext.sendActivity(`I heard you say ${utterance}`);
                }
            }
        }
        
        

    })
})

app.get("/api/callback", (req, res) => {
    callbackHandler(req, res);
})

app.get("/api/login", (req, res) => {
    loginRedirect(res);
})

app.listen(process.env.PORT || 8000, () => {
    console.info("Server running!");
})