const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { token, nodes } = require("./config");
const { readdirSync } = require("fs");
const colors = require("colors");
const { Aqua } = require("aqualink");

const client = new Client({
    disableMentions: "everyone",
    partials: [Partials.Channel, Partials.Message],
    intents: [GatewayIntentBits.Guilds],
});

process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

const aqua = new Aqua(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytsearch",
    restVersion: "v4",
    shouldDeleteMessage: true,
    autoResume: false,
    infiniteReconnects: true,
}).on("nodeConnect", (node) => {
    console.log(`Connected to ${node.name}`);
}).on("nodeDisconnect", (node) => {
    console.log(`Disconnected from ${node.name}`);
});

client.aqua = aqua;
// Load events and log the count once
const eventFiles = readdirSync("./events/");
eventFiles.forEach((file) => {
    try {
        const event = require(`./events/${file}`);
        const eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
    } catch (error) {
        console.error(`Error loading event ${file}:`, error);
    }
});

// Log total events loaded
console.log(colors.green(`[EVENTS] Loaded [${eventFiles.length}] events`));

client.login(token);