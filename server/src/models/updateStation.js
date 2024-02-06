import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";

dotenv.config({ path: path.join("..", "..", ".env") });

const updateStation = async () => {
	const connection = await getConnection();
	// 이후 착석꿀팁 관련 수정사항은 stationTips.json 파일에 작성하고 updateStation 함수만 호출하면 DB UPDATE 가능
	const stationTipsData = JSON.parse(fs.readFileSync(path.join("..", "data", "stationTips.json")));

	try {
		await connection.beginTransaction();
		console.log(`station 테이블 transaction start`);
		const query =`
			UPDATE station
			SET station_info = ?, passenger_info = ?
			WHERE id = ?;`;

		for (let station of stationTipsData) {
			console.log(`${station.stationName}역 update start`);
			await executeQuery(connection, query, [station.stationInfo, station.passengerInfo, station.stationId]);
		}
		await connection.commit();
		console.log(`station 테이블 transaction done`);
	} catch (err) {
		console.error("station 테이블 update 중 에러 발생: ", err);
		await connection.rollback();
	} finally {
		endConnection(connection);
	}
};

updateStation();