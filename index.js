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
   The myDataMunging function provides each row of data from External Contentful which 
   is from where you have to migrate the data. The parsed object to pushed into the Contentful
   organization where you want to migrate and reshape the data.
   Do inside your magic to transform data as needed.
*/

const fetchAsset = async (id) => {
  const fetchAsset = await getAssetExternalEnv(id);

  const assetId = await saveAsset(
    fetchAsset.fields.title["en-US"],
    fetchAsset.fields.file["en-US"].url.replace("//", "https://")
  );
  return assetId;
};

const fetchMediaAnnotation = async (fields) => {
  let mediaAndNameContentID = await getEntriesByField(
    fields.name["en-US"],
    "name",
    "mediaAndNameContent"
  );

  if (!mediaAndNameContentID) {
    const mediaAndNameContentData = {
      name: fields.name,
      media: {
        "en-US": {
          sys: {
            type: "Link",
            linkType: "Asset",
            id: await fetchAsset(fields.thumbnail["en-US"].sys.id),
          },
        },
      },
    };

    mediaAndNameContentID = await createAndPublishContent(
      mediaAndNameContentData,
      "mediaAndNameContent"
    );
  }

  console.log("gettin mediaAnnotation", mediaAndNameContentID);

  return mediaAndNameContentID;
};

const myDataMunging = async (row, parsed) => {
  console.log(row);

  parsed.push({
    title: {
      "en-US": row.fields.title["en-US"],
    },
    mediaAndNameContent: {
      "en-US": {
        sys: {
          id: await fetchMediaAnnotation(row.fields),
          linkType: "Entry",
          type: "Link",
        },
      },
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

// await intoContentful.getContentTypeStructure(); // Save content Type API response for easier set up

// intoContentful.setDebug(); // For console log inside myDataMunging without creating content type

// intoContentful.setPublishJustOneBatchForTesting(); // For testing just one batch to evaluate script creation in Contentful

/* 
  Mandatory method.
*/

await intoContentful.run("externalCma", "create"); // Execute script
