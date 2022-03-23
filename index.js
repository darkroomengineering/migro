import { myDataMunging } from "./data-munging.js";
import { migrate } from "./src/migrator.js";

/* Setup config */
const mungingHundler = async (row, parsed) => myDataMunging(row, parsed);
const TSVdataFileName = "clyde-blogs-clean.tsv";
const batchSize = 2;
const offset = 0;
const entryTarget = "blogsPost";

/* Don't touch */

const config = {
  batchSize,
  offset,
  entryTarget,
  mungingHundler,
  pathFile: "./input/" + TSVdataFileName,
};
migrate(config);
