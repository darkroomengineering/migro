import contentful from "contentful-management";
import dotenv from "dotenv";
import { promises as fs } from "fs";

dotenv.config();

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Download Images if needed
export const download = (featuredImage, slug) => {
  const pathAssets = "./assets/";
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

// Read file
export const readJson = async (path, parseIntoJSon = true) => {
  const read = await fs.readFile(path, "utf8");
  return parseIntoJSon ? JSON.parse(read) : read;
};

// Read TSV to object
export const TSVtoObject = async (pathFile) => {
  const data = await readJson(pathFile, false);
  const fields = data.split("\r\n").map((row) => row.split("\t"));
  return fields
    .slice(2)
    .map((row) =>
      Object.assign({}, ...fields[1].map((key, idx) => ({ [key]: row[idx] })))
    );
};

// Save file into Json
export const writeJson = async (data, path) => {
  const temp = JSON.stringify(data);
  await fs.writeFile(path, temp, "utf8");
};

// Read & Write file
export const readAndWriteJSon = async (data, path) => {
  const readData = await readJson(path);
  await writeJson([...readData, ...data], path);
};

// Contentful CMA helper functions
export const client = contentful.createClient({
  accessToken: process.env.ACCESS_TOKEN,
});

const loadAsset = async (name, path) => {
  return await client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) =>
      environment.createAsset({
        fields: {
          title: {
            "en-US": name,
          },
          description: {
            "en-US": "description",
          },
          file: {
            "en-US": {
              contentType: `image/${path.split(".").pop()}`,
              fileName: name,
              upload: path,
            },
          },
        },
      })
    )
    .then((asset) => asset.processForAllLocales())
    .then((asset) => asset.sys.id)
    .catch(console.error);
};

const publishAsset = async (assetId) => {
  client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) => environment.getAsset(assetId))
    .then((asset) => asset.publish())
    // .then((asset) => console.log(`Asset ${asset.sys.id} published.`))
    .catch(console.error);
};

export const saveAsset = async (name, path) => {
  const assetId = await loadAsset(name, path);
  await publishAsset(assetId);
  return assetId;
};

export const getAsset = async (assetId) => {
  return client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) => environment.getAsset(assetId))
    .catch(console.error);
};

export const getAssetExternalEnv = async (assetId) => {
  return client
    .getSpace(process.env.EXTERNAL_SPACE_ID)
    .then((space) => space.getEnvironment(process.env.EXTERNAL_ENVIRONMENT_ID))
    .then((environment) => environment.getAsset(assetId))
    .catch(console.error);
};

export const getEntryByIdExternalEnv = async (entryId) => {
  return client
    .getSpace(process.env.EXTERNAL_SPACE_ID)
    .then((space) => space.getEnvironment(process.env.EXTERNAL_ENVIRONMENT_ID))
    .then((environment) => environment.getEntry(entryId))
    .catch(console.error);
};

export const getEntriesExternalEnvs = async (contentType) => {
  return client
    .getSpace(process.env.EXTERNAL_SPACE_ID)
    .then((space) => space.getEnvironment(process.env.EXTERNAL_ENVIRONMENT_ID))
    .then((environment) =>
      environment.getEntries({ content_type: contentType, limit: 1000 })
    )
    .catch(console.error);
};

export const getEntries = async (contentType) => {
  return client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) =>
      environment.getEntries({ content_type: contentType, limit: 1000 })
    )
    .catch(console.error);
};

export const getEntryById = async (entryId) => {
  return client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) => environment.getEntry(entryId))
    .catch(console.error);
};

export const getEntriesByField = async (
  entryValue,
  contentTypeId,
  entryType
) => {
  let entryId = false;
  const fetchEntries = await getEntries(entryType);

  for (const entry of fetchEntries.items) {
    if (
      !!entry.fields[contentTypeId] &&
      entry.fields[contentTypeId]["en-US"] === entryValue
    ) {
      entryId = entry.sys.id;
      break;
    }
  }

  return entryId;
};

export const createContent = async (data, contentTypeID) => {
  return client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) =>
      environment.createEntry(contentTypeID, {
        fields: data,
      })
    )
    .catch(console.error);
};

export const updateContent = async (data) => {
  return client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) => environment.getEntry(data.id))
    .then((entry) => {
      data.fields.map((field) => (entry.fields[field.key] = field.value));
      return entry.update();
    })
    .catch(console.error);
};

export const publishEntry = async (entryId) => {
  client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) => environment.getEntry(entryId))
    .then((entry) => entry.publish())
    .then((entry) => console.log(`Entry ${entry.sys.id} published.`))
    .catch(console.error);
};

export const createAndPublishContent = async (data, contentType) => {
  let entryId;
  await createContent(data, contentType).then((response) => {
    entryId = response.sys.id;
  });
  await publishEntry(entryId);
  return entryId;
};
