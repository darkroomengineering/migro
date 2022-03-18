import { richTextFromMarkdown } from "@contentful/rich-text-from-markdown";
import fs from "fs";
import request from "request";
import TurndownService from "turndown";
import {
  createAndPublishContent,
  createContent,
  getEntriesByField,
  months,
  readAndWriteJSon,
  readJson,
  saveAsset,
  saveJSon,
  sleep,
} from "./utils.js";

// Variables
const pathAssets = "./assets/";
const pathFile = "./input/clyde-blogs-clean.tsv";
const pathJson = "./input/data.json";
let embeddedCounter = 0;
let blogCounter = 0;
const mungingDataLogs = [];
const blogsLogs = [];

// Download Images
const download = (featuredImage, slug) => {
  const imageExtension = row.featuredImage.split(".").pop();
  const path = pathAssets + slug["en-US"] + `.${imageExtension}`;

  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on("close", () => {
        console.log("✅ Done!");
      });
  });
};

// Load Data from File
const loadData = (pathFile) => {
  const data = fs.readFileSync(pathFile, "utf8");
  const fields = data.split("\r\n").map((row) => row.split("\t"));
  return fields
    .slice(2)
    .map((row) =>
      Object.assign({}, ...fields[1].map((key, idx) => ({ [key]: row[idx] })))
    );
};

// Handler for non supported content types i.e. embedded Assets
const embeddedHandler = async (name, url) => {
  if (!["png", "jpg", "jpeg"].includes(url.split(".").pop())) {
    return null;
  }

  const assetID = await saveAsset(`${name}-${embeddedCounter}`, url);

  return {
    nodeType: "embedded-asset-block",
    content: [],
    data: {
      target: {
        sys: {
          type: "Link",
          linkType: "Asset",
          id: assetID,
        },
      },
    },
  };
};

//Search if author already exist if not create and publish it
const fetchAuthor = async (authorName) => {
  let authorId = await getEntriesByField(authorName, "fullName", "author");
  if (!authorId) {
    const authorData = {
      fullName: {
        "en-US": authorName,
      },
      internalReferenceTitle: {
        "en-US": authorName,
      },
    };
    authorId = await createAndPublishContent(authorData, "author");
  }
  return authorId;
};

//Search if Tag already exist if not create and publish it
const fetchTag = async (tagValue) => {
  let tagId = await getEntriesByField(tagValue, "tag", "blogsTags");
  if (!tagId) {
    const tagData = {
      tag: {
        "en-US": tagValue,
      },
    };
    tagId = await createAndPublishContent(tagData, "blogsTags");
    return tagId;
  }
  return tagId;
};

// Data Munging
const dataMunging = async (rawData) => {
  const turndownService = new TurndownService();
  let parsed = [];
  const parse = async () => {
    let rowCounter = 0;

    return await rawData.reduce(async (memo, row) => {
      const results = await memo;
      rowCounter++;
      console.log("Item inside Batch", rowCounter);

      const bodyMd = await turndownService.turndown(row.body);
      // Try & catch is mandatory because richTextFromMarkdown Lib has a
      //Promise.all which may overcame Contentful Api Rate limit
      const richTextBody = await richTextFromMarkdown(bodyMd, async (node) => {
        try {
          console.log("Embedded format", node.url);
          if (node.url === undefined) {
            return null;
          }
          embeddedCounter += 1;
          return await embeddedHandler(row.title, node.url);
        } catch {
          return null;
        }
      });
      const featuredImageId = await saveAsset(row.title, row.featuredImage);
      const authorId = await fetchAuthor(
        row.author
          .replace("-", " ")
          .toLowerCase()
          .split(" ")
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(" ")
      );
      const tagId = await fetchTag(row.contentTypes);
      const tempDate = row.publishDate.split(" ").slice(1, 4);

      await sleep((4 + embeddedCounter) * 1750);

      parsed.push({
        title: {
          "en-US": row.title,
        },
        internalReferenceTitle: {
          "en-US": row.internalReferenceTitle,
        },
        urlSlug: {
          "en-US": row.urlSlug,
        },
        contentTypes: { "en-US": [row.contentTypes] },
        publishDate: {
          "en-US": [tempDate[2], months[tempDate[0]], tempDate[1]].join("-"),
        },
        body: {
          "en-US": richTextBody,
        },
        tag: {
          "en-US": {
            sys: {
              id: tagId,
              linkType: "Entry",
              type: "Link",
            },
          },
        },
        featuredImage: {
          "en-US": {
            sys: {
              id: featuredImageId,
              linkType: "Asset",
              type: "Link",
            },
          },
        },
        author: {
          "en-US": {
            sys: {
              id: authorId,
              linkType: "Entry",
              type: "Link",
            },
          },
        },
      });

      embeddedCounter = 0;
      return [...results, row];
    }, []);
  };
  await parse().catch((error) => mungingDataLogs.push({ errors: error }));
  return parsed;
};

// Actions
const exportParsedDataJson = async (batchGroup) => {
  const parsedData = await dataMunging(batchGroup);
  saveJSon(parsedData, pathJson);
  readAndWriteJSon(mungingDataLogs, "./logs/logs-munging-data.json");
};

export const migrate = async (groupPack = 10, offset = 0) => {
  const data = loadData(pathFile);

  for (
    let i = Math.floor(offset / groupPack);
    i <= Math.floor(data.length / groupPack);
    i++
  ) {
    // Mungle and export batch
    const min = Math.max(0, groupPack * i);
    const max = Math.min(data.length, groupPack * (i + 1));
    console.log("Working on batch", `Init ${min} - Finish ${max}`);
    await exportParsedDataJson(data.slice(min, max));
    await sleep(5000);

    // Load Batch and create Blogs
    blogsLogs = [];
    const blogs = readJson(pathJson);
    for (const row of blogs) {
      console.log("Creating Blog Number", blogCounter);
      await createContent(row, "blogPost")
        .then(() =>
          blogsLogs.push({
            title: row.title["en-US"],
            status: "Entry created ✅",
          })
        )
        .catch((error) =>
          blogsLogs.push({
            title: row.title["en-US"],
            status: "Entry created ❌",
            error: error,
          })
        );
      await sleep(2000);
      blogCounter++;
      await readAndWriteJSon(blogsLogs, "./logs/logs.json");
    }
  }
};
