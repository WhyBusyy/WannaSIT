// import dotenv from "dotenv";
// import fs from "fs";
// import path from "path";
// import url from "url";
// import getKeyByValue from "../../utils/getKeyByValue.js"
// import { getConnection, executeQuery, endConnection } from "../../services/databaseService.js";

// const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
// dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

// const insertTrainAndStat = async () => {
//   const connection = await getConnection();
//   const preprocessedData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "output", "processJSONResult.json")));
//   const stationList = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "stationCodes.json")));

//   try {
//     for (let station of preprocessedData) {
//       await connection.beginTransaction();
//       console.log(`train, statistics 테이블 ${station.stationName}역 transaction start`);

//       const trainQuery = `
//         INSERT INTO train (station_id, direction, arrival_day, arrival_hour, arrival_min)
//         VALUES (?, ?, ?, ?, ?);`;
//       const statQuery = `
//         INSERT INTO statistics (train_id, estimated_count, get_off_count)
//         VALUES (?, ?, ?);`;

//       for (let train of station.train) {
//         const trainParams = [getKeyByValue(stationList, station.stationName), train.updnLine, train.dow, train.hh, train.mm];
//         const [trainId] = await executeQuery(connection, trainQuery, trainParams);

//         const statParams = [trainId.insertId, train.estimatedCount, train.getOffCount];
//         await executeQuery(connection, statQuery, statParams);
//       }

//       await connection.commit();
//       console.log(`train, statistics 테이블 ${station.stationName}역 transaction done`);
//     }
//   } catch (err) {
//     console.error("train, statistics 테이블 insert 중 에러 발생: ", err);
//     await connection.rollback();
//   } finally {
//     endConnection(connection);
//   }
// };

// export default insertTrainAndStat;

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import url from "url";
import getKeyByValue from "../../utils/getKeyByValue.js"
import { getConnection, executeQuery, endConnection } from "../../services/databaseService.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const insertTrainAndStat = async () => {
  const preprocessedData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "output", "processJSONResult.json")));
  const stationList = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "stationCodes.json")));

  try {
    for (let station of preprocessedData) {
      console.log(`train, statistics 테이블 ${station.stationName}역 데이터 삽입 시작`);

      const trainQuery = `
        INSERT INTO train (station_id, direction, arrival_day, arrival_hour, arrival_min)
        VALUES (?, ?, ?, ?, ?);`;
      const statQuery = `
        INSERT INTO statistics (train_id, estimated_count, get_off_count)
        VALUES (?, ?, ?);`;

      for (let train of station.train) {
        const connection = await getConnection();
        const trainParams = [getKeyByValue(stationList, station.stationName), train.updnLine, train.dow, train.hh, train.mm];
        const [trainId] = await executeQuery(connection, trainQuery, trainParams);
        endConnection(connection);

        const connection2 = await getConnection();
        const statParams = [trainId.insertId, train.estimatedCount, train.getOffCount];
        await executeQuery(connection2, statQuery, statParams);
        endConnection(connection2);
      }

      console.log(`train, statistics 테이블 ${station.stationName}역 데이터 삽입 완료`);
    }
  } catch (err) {
    console.error("train, statistics 테이블 insert 중 에러 발생: ", err);
  }
};

export default insertTrainAndStat;
