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

const checkRustBlog = async () => {
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
};

const checkRustafied = async () => {
  // Read completed items from file
  const completedFilePath = "./rustafied-completed.txt";
  const completed = readCompletedFile(completedFilePath);

  const res = await fetch("https://www.rustafied.com/");
  const html = await res.text();
  //console.log(html);

  // Parse articles
  const contentDom = new JSDOM(html);
  const articles = contentDom.window.document.querySelectorAll("article");
  const embeds = [];
  const links = [];
  articles.forEach(a => {
    const imgSrc =
      a.querySelector("img").getAttribute("data-src") + "?format=1500w";
    const title = a.querySelector("h1").textContent;
    const link = a
      .querySelector("h1")
      .querySelector("a")
      .getAttribute("href");

    // Skip Item if already completed
    if (completed.has(link)) return;

    // Create Discord embed
    const embed = {
      title: title,
      url: "https://www.rustafied.com" + link,
      color: 13059328,
      image: {
        url: imgSrc
      },
      author: {
        name: "Rustafied",
        url: "https://www.rustafied.com",
        icon_url:
          "https://static1.squarespace.com/static/5420d068e4b09194f76b2af6/t/5a8e03e308522948dff12426/favicon.ico"
      }
    };
    embeds.push(embed);
    links.push(link);
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
      links.forEach(link => completed.add(link));
      itemsString = links.join("\n");
      await fs.appendFile(completedFilePath, itemsString + "\n", err => {
        if (err) throw err;
        console.log(
          `Updated "${completedFilePath}" with ${links.length}x links`
        );
      });
    }
  }
};

const toMilliseconds = (h, m = 0, s = 0) => (h * 60 * 60 + m * 60 + s) * 1000;
const checkAll = () => {
  checkRustBlog();
  checkRustafied();
};

// Check every hour
setInterval(checkAll, toMilliseconds(1));
checkAll();
