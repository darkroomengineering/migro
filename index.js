import { Migrate } from "./src/migrator.js";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const pathFile = "./input/" + "data.tsv";
const batchSize = 1;
const offset = 0;
const contentTypeId = "ContentTypeIdFromContentful";

// Only use when migrating from one Contentful Organization to other.
// This is the content Type from where exporting the data
const externalContentTypeId = "ContentTypeIdFromContentful";

/* 
   The myDataMunging function provides each row of data from TSV file or CMA
   and a parsed object to pushed wrangled data. Do inside your magic to transform 
   data as needed.
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
  contentTypeId,
  externalContentTypeId
);

/* 
  Comment or uncomment following methods as needed:
*/

await intoContentful.getContentTypeStructure(); // Save content Type API response for easier set up

intoContentful.setDebug(); // For console log inside myDataMunging without creating content type

intoContentful.setPublishJustOneBatchForTesting(); // For testing just one batch to evaluate script creation in Contentful

/* 
  Mandatory method.
*/

await intoContentful.run("file", "create"); // Execute script
