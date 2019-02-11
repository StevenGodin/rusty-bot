require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const Parser = require("rss-parser");
const { JSDOM } = require("jsdom");

const rustyBotWebHook = process.env.HOOK_RUSTY_BOT;
if (!rustyBotWebHook)
  throw Error("Missing HOOK_RUSTY_BOT environment variable.");

function readCompletedFile(path) {
  if (!fs.existsSync(path)) return new Set();

  const file = fs.readFileSync(path).toString();
  const lines = file.split(/[\r\n]+/);

  const set = new Set();
  lines.forEach(line => set.add(line));
  return set;
}

(async () => {
  // Read completed items from file
  const rustBlogFilePath = "./rust-blog-completed.txt";
  const rustBlogCompleted = readCompletedFile(rustBlogFilePath);

  // Parse RSS feed
  const parser = new Parser();
  const feed = await parser.parseURL("https://rust.facepunch.com/rss/blog");

  // Process RSS Items
  const guids = [];
  const embeds = [];
  await feed.items.forEach(async item => {
    // Skip Item if already completed
    if (rustBlogCompleted.has(item.guid)) return;

    // Parse item.content html to get imgSrc
    console.log(item);
    const contentDom = new JSDOM(item.content);
    const imgSrc = contentDom.window.document
      .querySelector("img")
      .getAttribute("src");
    console.log(imgSrc);

    // Create Discord embed
    const embed = {
      title: item.title,
      description: item.contentSnippet,
      url: item.link,
      color: 13059328,
      image: {
        url: imgSrc
      },
      author: {
        name: "Rust Blog",
        url: "https://rust.facepunch.com/blog/",
        icon_url: "https://files.facepunch.com/s/ba35193fed0f.png"
      }
    };
    embeds.push(embed);
    guids.push(item.guid);
  });

  // POST embeds to Discord if any exist
  if (!embeds.length) {
    console.log("No Embeds to message!");
  } else {
    const discordEmbeds = {
      embeds
    };
    console.log(discordEmbeds);
    const res = await fetch(rustyBotWebHook, {
      method: "POST",
      body: JSON.stringify(discordEmbeds),
      headers: { "Content-Type": "application/json" }
    });
    console.log(`Discord Response Status Code: ${res.status}`);

    // On Success
    if (res.status >= 200 && res.status < 300) {
      console.log("Discord POST Success!!!");
      guids.forEach(guid => rustBlogCompleted.add(guid));
      guidItemsString = guids.join("\n");
      await fs.appendFile(rustBlogFilePath, guidItemsString + "\n", err => {
        if (err) throw err;
        console.log(
          `Updated "${rustBlogFilePath}" with ${guids.length}x guids`
        );
      });
    }
  }
})();
