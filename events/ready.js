const { EmbedBuilder, resolveColor } = require("discord.js");
const config = require("../config.js");
const prettyBytes = require("pretty-bytes");
const colors = require("colors");

// Function to chunk an array into smaller arrays of a specified size
const arrayChunker = (array, chunkSize = 5) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

// Function to convert milliseconds to a time format
const msToTime = (duration) => { 
    const days = Math.floor(duration / (1000 * 60 * 60 * 24)); 
    const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); 
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)); 
    const seconds = Math.floor((duration % (1000 * 60)) / 1000); 
    return `${days}d ${hours}h ${minutes}m ${seconds}s`; 
}; 

module.exports = async (client) => {
    try {
        const channel = await client.channels.fetch(config.channelId);
        const embed = new EmbedBuilder()
            .setColor(resolveColor("#2F3136"))
            .setDescription("Fetching Stats From Lavalink Server");

        // Clear previous messages
        const messages = await channel.messages.fetch({ limit: 1 });
        if (messages.size) {
            await channel.bulkDelete(messages);
        }

        // Send initial message
        const msg = await channel.send({ embeds: [embed] });

        // Set an interval to update the status every 10 seconds
        const intervalId = setInterval(async () => {
            const nodes = client.aqua.nodeMap;
            const all = [];

            // Gather node statistics
            nodes.forEach((node) => {
                const { stats, connected } = node;
                const { memory, cpu, players, playingPlayers, uptime } = stats;
                const uptimeFormatted = msToTime(uptime);
                const color = connected ? "+" : "-";

                all.push([
                    `${color} Node Name         :: ${node.name}`,
                    `${color} Status            :: ${connected ? "Connected [🟢]" : "Disconnected [🔴]"}`,
                    `${color} Players           :: ${players} (Playing: ${playingPlayers})`,
                    `${color} Uptime            :: ${uptimeFormatted}`,
                    `${color} Memory Usage      :: ${prettyBytes(memory.used)} / ${prettyBytes(memory.allocated)}`,
                    `${color} Cores             :: ${cpu.cores} Core(s)`,
                    `${color} System Load       :: ${(cpu.systemLoad * 100).toFixed(2)}%`,
                    `${color} Lavalink Load     :: ${(cpu.lavalinkLoadPercentage * 100).toFixed(2)}%`
                ].join("\n"));
            });

const chunked = arrayChunker(all, 8);
const statusembeds = chunked.map(data => {
    return new EmbedBuilder()
        .setColor(resolveColor("#2F3136"))
        .setAuthor({
            name: `Lavalink Monitor`,
            iconURL: client.user.displayAvatarURL({ forceStatic: false }),
        })
        .setDescription(`\`\`\`diff\n${data.join("\n\n")}\`\`\``)
});

            // Update the message with new embeds
            if (msg) {
                await msg.edit({ embeds: statusembeds, content: `Last update: <t:${Math.floor(Date.now() / 1000)}:R>` });
            } else {
                console.error("Message object is undefined.");
            }
        }, 60000);

        // Cleanup on shutdown
        process.on("SIGINT", () => {
            clearInterval(intervalId); // Clear the interval on shutdown
            client.destroy();
            console.log(colors.yellow("Shutting down..."));
            process.exit(0);
        });
        
        // Initialize Aqua and set bot presence
        client.aqua.init(client.user.id);
        client.user.setPresence({
            status: "online",
            activities: [{
                name: "🟢 Checking lavalink...",
                type: 2,
				state: "Hope its online"
            }],
        });

        console.log(colors.green(`[CLIENT] ${client.user.username} is now Online!`));
    } catch (error) {
        console.error("An error occurred:", error);
    }
};
