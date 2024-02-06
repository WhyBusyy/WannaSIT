import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import url from "url";
import { getConnection, executeQuery, endConnection } from "../../services/databaseService.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const createTable = async () => {
  const connection = await getConnection();
  const sqlFile = fs.readFileSync(path.join(__dirname, "create_tables.sql"), "utf-8");
  const queries = sqlFile.split(";");

  for (let query of queries) {
    query = query.trim();

    if (query) {
      try {
        await executeQuery(connection, query);
        console.log("테이블 생성 성공");
      } catch (err) {
        console.error("테이블 생성 실패: ", err);
        endConnection(connection);
        throw err;
      }
    }
  }
  
  endConnection(connection);
};

export default createTable;