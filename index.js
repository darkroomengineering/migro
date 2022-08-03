import { Migrate } from "./src/migrator.js";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const pathFile = "./input/" + "data.tsv";
const batchSize = 1;
const offset = 0;
const contentTypeId = "ContentTypeIdFromContentful";
const debug = false;
const publishJustOneBatchForTesting = false;

/* 
   The mungingHundler function provides each row of data from TSV file or CMA
   and a parsed object to pushed wrangled data.

   Below you can define function for munging data for each use case and helper functions
   whicih should be called inside the mungingHundler function.
*/

const myDataMunging = async (row, parsed) => {
  console.log(row);

  parsed.push({
    title: {
      "en-US": row.title,
    },
  });
};

const intoContentful = new Migrate(
  mungingHundler,
  batchSize,
  offset,
  pathFile,
  debug,
  publishJustOneBatchForTesting,
  contentTypeId
);

// Save content Type API response for easier set up
intoContentful.getContentTypeStructure();

// For console log inse myDataMunging without creating content type
intoContentful.setDebug();

// For testing just one batch to evaluate script creation in Contentful
// intoContentful.setPublishJustOneBatchForTesting();

// Execute script
await intoContentful.run("file", "create");
