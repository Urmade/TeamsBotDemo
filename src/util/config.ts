import dotenv from "dotenv";
dotenv.config();


const config = {
    botId: process.env.BOTAPPID || "",
    botSecret: process.env.BOTAPPSECRET || "",
    baseUrl: process.env.BASEURL || "",
    tenantId: process.env.TENANT_ID || "",
    scope: process.env.SCOPE || "",
    redirectUrl: process.env.REDIRECT_URL || ""
}

export default config;