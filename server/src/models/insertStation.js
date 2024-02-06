import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";

dotenv.config({ path: path.join("..", "..", ".env") });

const insertStation = async () => {
  const connection = await getConnection();
  const rows = [];
  const csvFilePath = path.join("..", "data", "stationTravelTime.csv");

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      const formattedRow = [
        parseInt(row.id),
        row.station_name,
        parseInt(row.prev_station_time),
        parseInt(row.next_station_time)
      ];
      rows.push(formattedRow);
    })
    .on("end", async () => {
      try {
        await connection.beginTransaction();
        console.log("station 테이블 transaction start");
        const query =`
          INSERT INTO station (id, station_name, prev_station_time, next_station_time)
          VALUES (?, ?, ?, ?);`;

        for (let row of rows) {
          await executeQuery(connection, query, row);
        }
        await connection.commit();
        console.log("station 테이블 transaction done");
      } catch (err) {
        console.error("station 테이블 insert 중 에러 발생: ", err);
        await connection.rollback();
      } finally {
        endConnection(connection);
      }
    });
};

insertStation();