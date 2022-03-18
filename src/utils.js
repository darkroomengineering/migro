import contentful from "contentful-management";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const months = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const readJson = (path) => {
  return JSON.parse(fs.readFileSync(path, "utf8"));
};

// Save file into Json
export const saveJSon = (data, path) => {
  const temp = JSON.stringify(data);

  fs.writeFile(path, temp, "utf8", (err) => {
    if (err) {
      console.log(`Error writing file: ${err}`);
    } else {
      console.log(`File is written successfully!`);
    }
  });
};

export const readAndWriteJSon = async (data, path) => {
  const readData = readJson(path);
  saveJSon([...readData, ...data], path);
};

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
    .then((asset) => console.log(`Asset ${asset.sys.id} published.`))
    .catch(console.error);
};

export const saveAsset = async (name, path) => {
  const assetId = await loadAsset(name, path);
  await publishAsset(assetId);
  return assetId;
};

export const getEntries = async (contentType) => {
  return client
    .getSpace(process.env.SPACE_ID)
    .then((space) => space.getEnvironment(process.env.ENVIRONMENT_ID))
    .then((environment) =>
      environment.getEntries({ content_type: contentType })
    );
};

export const getEntriesByField = async (entryValue, entryTarget, entryType) => {
  let entryId = false;
  const fetchEntries = await getEntries(entryType).then(
    (response) => response.items
  );
  for (const entry of fetchEntries) {
    if (entry.fields[entryTarget]["en-US"] === entryValue) {
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
    );
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
