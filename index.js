import { Migrate } from "./src/migrator.js";
import { TSVtoObject } from "./src/utils.js";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const pathFile = "./input/" + "data.tsv";
const batchSize = 1;
const offset = 0;
const contentTypeId = "author";
const debug = false;
const publishJustOneBatchForTesting = false;

/* 
   The mungingHundler function provides each row of data from TSV file or CMA
   and a parsed object to pushed wrangled data.

   Below you can define function for munging data for each use case and helper functions
   whicih should be called inside the mungingHundler function.
*/

const updateData = await TSVtoObject(pathFile);

const myDataMunging = async (row, parsed) => {
  const newValue = updateData.find(
    (item) => item.name === row.fields.fullName["en-US"]
  );

  parsed.push({
    id: row.sys.id,
    target: "fullName",
    fields: [
      {
        key: "fullName",
        value: { "en-US": newValue.newName },
      },
      {
        key: "internalReferenceTitle",
        value: { "en-US": newValue.newName },
      },
    ],
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
// intoContentful.setDebug();

// For testing just one batcch to evaluate script creation in Contentful
// intoContentful.setPublishJustOneBatchForTesting();

// Execute script
await intoContentful.run("cma", "update");
