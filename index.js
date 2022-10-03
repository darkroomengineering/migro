import { Migrate } from "./src/migrator.js";
import { TSVtoObject } from "./src/utils.js";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const pathFile = "./input/" + "data.tsv";
const batchSize = 1;
const offset = 0;
const contentTypeId = "author";

/* 
   The myDataMunging function provides each row of data from TSV file or CMA
   and a parsed object to pushed wrangled data. Do inside your magic to transform 
   data as needed.
*/

const updateData = await TSVtoObject(pathFile);

const myDataMunging = async (row, parsed) => {
  console.log(row);

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
  contentTypeId
);

/* 
  Comment or uncomment following methods as needed:
*/

await intoContentful.getContentTypeStructure(); // Save content Type API response for easier set up

// intoContentful.setDebug(); // For console log inside myDataMunging without creating content type

// intoContentful.setPublishJustOneBatchForTesting(); // For testing just one batch to evaluate script creation in Contentful

/* 
  Mandatory method.
*/

await intoContentful.run("cma", "update"); // Execute script
