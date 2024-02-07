import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });
const stationCodes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "stationCodes.json"), "utf-8"));
const dows = [];
const hhs = [];
const appKey = process.env.APP_KEY;

const makeRequest = async (stationCode, dow, hh) => {
  const url = `https://apis.openapi.sk.com/puzzle/subway/congestion/stat/get-off/stations/${stationCode}?dow=${dow}&hh=${hh}`;
  const headers = {
    appkey: appKey,
    Accept: "application/json",
  };

  try {
    const response = await axios.get(url, { headers, timeout: 30000 });
    const filePath = path.join(__dirname, "..", "data", "input", "apiResponses", `하차_${stationCodes[stationCode]}_${dow}_${hh}.json`);
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));

    const { code, message } = response.data.status;
    console.log(`응답코드: ${code}, 메시지: ${message}`);
    console.log(`역명: ${stationCodes[stationCode]}, 요일: ${dow}, 시간: ${hh} 하차 데이터 진행중`);
  } catch (err) {
    console.error(`${stationCodes[stationCode]}역 API 요청 중 에러 발생`, err);
    process.exit(1); // 에러 발생 시 프로세스 종료
  }
};

const getOffRateData = async () => {
  for (const stationCode in stationCodes) {
    for (const dow of dows) {
      for (const hh of hhs) {
        await makeRequest(stationCode, dow, hh);
        await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5초 대기
      }
    }
  }
};

getOffRateData();
