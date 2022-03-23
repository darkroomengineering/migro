import { myDataMunging } from "./data-munging.js";
import { migrate } from "./src/migrator.js";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const TSVdataFileName = "data.tsv";
const entryTarget = "blogsPost";
const batchSize = 2;
const offset = 0;

/* Don't touch */

const config = {
  batchSize,
  offset,
  entryTarget,
  mungingHundler,
  pathFile: "./input/" + TSVdataFileName,
};
migrate(config);
