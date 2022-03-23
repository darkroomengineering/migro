import fs from "fs";
import request from "request";
import {
  createContent,
  readAndWriteJSon,
  readJson,
  sleep,
  writeJson,
} from "./utils.js";

// Variables
const pathAssets = "./assets/";
const pathJson = "./input/data.json";
const pathMainLogs = "./logs/logs.json";
const pathMungingLogs = "./logs/logs-munging-data.json";
let entryCounter = 0;
let mungingDataLogs = [];
let entryLogs = [];

// Download Images if needed
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

// Data Munging
const dataMunging = async (mungingHundler, rawData) => {
  let parsed = [];

  const parse = async () => {
    let rowCounter = 0;

    return await rawData.reduce(async (memo, row) => {
      const results = await memo;
      rowCounter++;
      console.log("Item inside Batch", rowCounter);

      await mungingHundler(row, parsed);

      return [...results, row];
    }, []);
  };
  await parse().catch((error) => mungingDataLogs.push({ errors: error }));
  return parsed;
};

// Migration Batch function
export const migrate = async ({
  entryTarget,
  mungingHundler,
  batchSize = 10,
  offset = 0,
  pathFile,
}) => {
  // Create and/or reset files
  writeJson([], pathJson);
  writeJson([], pathMungingLogs);
  writeJson([], pathMainLogs);
  // Load data
  const data = loadData(pathFile);

  await sleep(2000);
  console.log("Starting migration");

  // Create batch, load assets and linked entries
  for (
    let i = Math.floor(offset / batchSize);
    i <= Math.floor(data.length / batchSize);
    i++
  ) {
    // Mungle and export batch
    const min = Math.max(0, batchSize * i);
    const max = Math.min(data.length, batchSize * (i + 1));
    console.log("Working on batch:", `Init ${min} - Finish ${max}`);
    const parsedData = await dataMunging(mungingHundler, data.slice(min, max));
    writeJson(parsedData, pathJson);
    readAndWriteJSon(mungingDataLogs, pathMungingLogs);

    await sleep(5000);

    // Load Batch and create entry
    entryLogs = [];
    const loadBatch = readJson(pathJson);

    for (const row of loadBatch) {
      entryCounter++;
      console.log("Creating Entry Number:", entryCounter);

      await createContent(row, entryTarget)
        .then(() =>
          entryLogs.push({
            title: row.title["en-US"],
            status: "Entry created ✅",
          })
        )
        .catch((error) =>
          entryLogs.push({
            title: row.title["en-US"],
            status: "Entry created ❌",
            error: error,
          })
        );
      await sleep(2000);
    }
    await readAndWriteJSon(entryLogs, pathMainLogs);
  }
};
