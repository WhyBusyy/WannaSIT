import path from "path";
import url from "url";
import processJSONMain from "./process/processJSON.js";
import insertTrainAndStat from "./process/insertTrainAndStat.js";
import createTable from "./process/createTables.js";
import dropTrainAndStat from "./process/dropTrainAndStat.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const runBatch = async () => {
  try {
    await dropTrainAndStat();
    await createTable();
    await processJSONMain(path.join(__dirname, "data", "output", "processJSONResult.json"));
    await insertTrainAndStat();
    console.log("배치 작업 완료");
  } catch(err) {
    console.error("배치 작업 중 에러 발생", err);
  }
};

runBatch();