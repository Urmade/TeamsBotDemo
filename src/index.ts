import express from "express";
import * as botbuilder from "botbuilder";

import { callbackHandler, loginRedirect } from "./authentication/auth";
import config from "./util/config";
import { handle } from "./bot/bot";

const app = express();
app.set('view engine', 'ejs');

var adapter = new botbuilder.BotFrameworkAdapter({
    appId: config.botId,
    appPassword: config.botSecret
});

//Chatbot servers always require an endpoint that can receive POST messages - the URL doesn't matter, as long as it is in sync with the Bot Framework registry.
app.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async (turnContext) => {
        handle(turnContext);
    })
})

/* ----- Authentication Endpoints ------ */

app.get("/api/login", (req, res) => {
    loginRedirect(res);
})

app.get(config.redirectUrl, (req, res) => {
    callbackHandler(req, res);
})

app.listen(process.env.PORT || 8000, () => {
    console.info("Server running!");
})