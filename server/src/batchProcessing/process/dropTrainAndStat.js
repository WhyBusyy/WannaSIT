import dotenv from "dotenv";
import path from "path";
import url from "url";
import { getConnection, executeQuery, endConnection } from "../../services/databaseService.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const dropTrainAndStat = async () => {
  const connection = await getConnection();
  try {
    const query = `DROP TABLE IF EXISTS statistics, train;`;

    await executeQuery(connection, query);
    console.log("테이블 drop 성공");
  } catch(err) {
    console.error("테이블 drop 에러", err);
    throw err;
  } finally {
    endConnection(connection);
  }
};

export default dropTrainAndStat;