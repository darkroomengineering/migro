import { Migrate } from "./src/migrator.js";
import TurndownService from "turndown";
import {
  createAndPublishContent,
  getEntriesByField,
  saveAsset,
  sleep,
} from "./src/utils.js";
import { richTextFromMarkdown } from "@contentful/rich-text-from-markdown";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const pathFile = "./input/" + "data.tsv";
const batchSize = 1;
const offset = 0;
const contentTypeId = "blogsPost";
const debug = false;
const publishJustOneBatchForTesting = false;

/* 
   The myDataMunging function provides each row of data from TSV file or CMA
   and a parsed object to pushed wrangled data. Do inside your magic to transform 
   data as needed.
*/

let embeddedCounter = 0;

const months = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
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

const createMarkDown = async (body) => {
  const turndownService = new TurndownService();
  return await turndownService.turndown(body);
};

const myDataMunging = async (row, parsed) => {
  console.log(row);

  parsed.push({
    title: {
      "en-US": row.title,
    },
  });
};

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const pathFile = "./input/" + "data.tsv";
const batchSize = 1;
const offset = 0;
const contentTypeId = "blogsPost";
const debug = false;
const publishJustOneBatchForTesting = false;

const intoContentful = new Migrate(
  mungingHundler,
  batchSize,
  offset,
  pathFile,
  contentTypeId
);

/* 
  Comment or uncomment following methods as needed:
*/

intoContentful.getContentTypeStructure(); // Save content Type API response for easier set up

intoContentful.setDebug(); // For console log inside myDataMunging without creating content type

intoContentful.setPublishJustOneBatchForTesting(); // For testing just one batch to evaluate script creation in Contentful

/* 
  Mandatory method.
*/

await intoContentful.run("file", "create"); // Execute script
