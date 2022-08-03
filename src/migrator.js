import fs from "fs";
import { exit } from "process";
import request from "request";
import {
  getEntries,
  readAndWriteJSon,
  readJson,
  updateContent,
  createContent,
  writeJson,
  TSVtoObject,
} from "./utils.js";

// Variables
const pathJson = "./input/data.json";
const pathMainLogs = "./logs/logs.json";
const pathMungingLogs = "./logs/logs-munging-data.json";
let entryCounter = 0;
let mungingDataLogs = [];
let entryLogs = [];

// Data Munging
const sequentialProcess = async (mungingHundler, rawData) => {
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

export class Migrate {
  data;

  constructor(
    mungingHundler,
    batchSize = 10,
    offset,
    pathFile = "",
    contentTypeId
  ) {
    this.mungingHundler = mungingHundler;
    this.batchSize = batchSize;
    this.offset = offset;
    this.pathFile = pathFile;
    this.debug = false;
    this.publishJustOneBatchForTesting = false;
    this.contentTypeId = contentTypeId;
  }

  async resetFiles() {
    await writeJson([], pathJson);
    await writeJson([], pathMungingLogs);
    await writeJson([], pathMainLogs);
  }

  async loadFromFile() {
    if (!this.pathFile || typeof this.pathFile !== "string") {
      console.log("pathfile variable wrong", this.pathFile);
      exit();
    }

    this.data = await TSVtoObject(this.pathFile);
  }

  async loadFromCMA() {
    if (!this.contentTypeId || typeof this.contentTypeId !== "string") {
      console.log("pathfile variable wrong", this.contentTypeId);
      exit();
    }

    const fetchData = await getEntries(this.contentTypeId);
    this.data = fetchData.items;
  }

  setDebug() {
    this.debug = true;
  }

  setPublishJustOneBatchForTesting() {
    this.publishJustOneBatchForTesting = true;
  }

  async getContentTypeStructure() {
    const fetchData = await getEntries(this.contentTypeId);
    writeJson(
      fetchData.items.map((item) => item.fields),
      "./input/content-type-body.json"
    );
  }

  async create(row) {
    return await createContent(row, this.contentTypeId)
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
  }

  async update(row) {
    return await updateContent(row)
      .then(() =>
        entryLogs.push({
          title: row.id,
          status: "Entry updated ✅",
        })
      )
      .catch((error) =>
        entryLogs.push({
          title: row.id,
          status: "Entry updated ❌",
          error: error,
        })
      );
  }

  async run(source = "file", operation = "create") {
    await this.resetFiles();
    // Load data
    if (source === "file") {
      await this.loadFromFile();
    } else if (source === "cma") {
      await this.loadFromCMA();
    }

    console.log("Starting migration");
    // Create batch, load assets and linked entries
    for (
      let i = Math.floor(this.offset / this.batchSize);
      i <= Math.floor(this.data.length / this.batchSize);
      i++
    ) {
      // Mungle and export batch
      const min = Math.max(0, this.batchSize * i);
      const max = Math.min(this.data.length, this.batchSize * (i + 1));
      console.log("Working on batch:", `Init ${min} - Finish ${max}`);

      const parsedData = await sequentialProcess(
        this.mungingHundler,
        this.data.slice(min, max)
      );

      await writeJson(parsedData, pathJson);
      await readAndWriteJSon(mungingDataLogs, pathMungingLogs);

      if (this.debug) {
        console.log(
          "debug mode breaking before pushing Contentent Type into Contentful"
        );
        exit();
      }

      // Load Batch and create content type entry
      entryLogs = [];
      const loadBatch = await readJson(pathJson);

      for (const row of loadBatch) {
        entryCounter++;
        console.log("Creating Entry Number:", entryCounter);
        operation === "create";

        if (operation === "create") {
          await this.create(row);
        }
        if (operation === "update") {
          await this.update(row);
        }
      }

      if (this.publishJustOneBatchForTesting) {
        console.log("Publish one content type batch for testing");
        exit();
      }
      await readAndWriteJSon(entryLogs, pathMainLogs);
    }
  }
}
