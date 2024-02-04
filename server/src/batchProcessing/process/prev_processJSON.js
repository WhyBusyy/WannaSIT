import fs from "fs";
import csv from "csv-parser";

async function main(outputFilePath) {
  let data = [];

  const stationList = getStationList("../../data/stationCodes.json");
  const dow = ["MON", "WED", "FRI"];
  const time = ["08", "13"];
  let getOffCountByTime;

  // 하차인원 CSV 읽어오기
  const headers = [
    "stationName",
    "dow",
    "b06",
    "h06",
    "h07",
    "h08",
    "h09",
    "h10",
    "h11",
    "h12",
    "h13",
    "h14",
    "h15",
    "h16",
    "h17",
    "h18",
    "h19",
    "h20",
    "h21",
    "h22",
    "h23",
    "a24",
  ];
  const getOffCSV = await readCSV(headers);

  // JSON 파일 읽기
  stationList.forEach((station) => {
    let trains = [];

    dow.forEach((dow) => {
      time.forEach((time) => {
        // 요일별 시간대 별 하차인원(csv)
        const searchTime = "h" + time;
        getOffCountByTime = getOffCSV.find((x) => x.stationName == station && x.dow == dow)[searchTime];

        // 혼잡도
        const CongestionData = getJSONData(`../data/input/apiResponses/혼잡_${station}_${dow}_${time}.json`);
        const CongestionGroups = groupData(CongestionData, "congestionCar");

        // 하차 비율
        const GetOffData = getJSONData(`../data/input/apiResponses/하차_${station}_${dow}_${time}.json`);
        const GetOffGroups = groupData(GetOffData, "getOffCarRate");

        // 최종 예측 인원
        const train = processCongestion(dow, getOffCountByTime, GetOffGroups, CongestionGroups);

        trains.push(...train);
      });
    });
    data.push({ stationName: station, train: trains });
  });
  const output = { data: data };
  saveDataToFile(output, outputFilePath);
}

// 데이터를 파일로 저장하는 함수
function saveDataToFile(data, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 데이터를 그룹화하는 함수(시간대 별로 열차 모음)
function groupData(group, standard) {
  return group.reduce((acc, cur) => {
    const key = cur.updnLine;

    if (!acc[key]) {
      acc[key] = {};
    }
    cur.data.forEach((dataItem) => {
      const time = `${dataItem.hh}:${dataItem.mm}`;
      if (!acc[key][time]) {
        acc[key][time] = [];
      }
      acc[key][time] = acc[key][time].concat(dataItem[standard]);
    });
    return acc;
  }, {});
}

// 그룹화된 데이터를 가공하는 함수
function processCongestion(dow, getOffCountByTime, getOffGroup, congestionGroup) {
  let train = [];

  Object.entries(getOffGroup).forEach(([updnLine, getOffTimes]) => {
    if (congestionGroup[updnLine]) {
      Object.entries(getOffTimes).forEach(([time, getOffCars]) => {
        if (congestionGroup[updnLine][time]) {
          // (1) 현재 인원
          const congestionByCar = groupIntoCars(congestionGroup[updnLine][time]);
          const congestionMedians = calculateMedians(congestionByCar);

          const multiplier = 1.6;
          const currentCount = congestionMedians.map((percentage) => Math.round(percentage * multiplier));

          // (2) 하차 인원
          const getOffByCar = groupIntoCars(getOffCars);
          const getOffAvg = calculateAverageByCar(getOffByCar);

          const getOffCount = Math.round(getOffCountByTime / 6 / 2);
          const getOffCarCount = getOffAvg.map((percentage) => Math.round(percentage * getOffCount));

          // 한 번에 push
          train.push({
            updnLine: parseInt(updnLine),
            dow,
            hh: parseInt(time.split(":")[0]),
            mm: parseInt(time.split(":")[1]),
            getOffCount: Math.round(getOffCountByTime),
            estimatedCount: getOffCarCount.map((count, i) => currentCount[i] - count),
          });
        }
      });
    }
  });

  return train;
}

main("../data/output/processJSONResult.json");

// ==========
// stationList 불러오기
function getStationList(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Object.values(data);
}

// CSV 파일 읽어오기
function readCSV(headers) {
  const result = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("../data/input/getOffCount.csv")
      .pipe(csv({ headers, skipLines: 1 }))
      .on("data", (data) => result.push(data))
      .on("end", () => {
        resolve(result);
      });
  });
}

// JSON 파일 읽어오기
function getJSONData(filePath) {
  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return jsonData.contents.stat;
}

// ========== 데이터 가공
// 배열을 칸 별로 모음
function groupIntoCars(arr) {
  return Array.from({ length: 10 }, (_, i) => Array.from({ length: Math.ceil(arr.length / 10) }, (_, j) => arr[j * 10 + i]));
}

// 칸 별 평균값 계산
function calculateAverageByCar(cars) {
  return cars.map((arr) => {
    const length = arr.length > 0 ? arr.length : 1;
    return (arr.reduce((a, b) => a + b, 0) / length / 100).toFixed(2);
  });
}

// 칸 별 중앙값 계산
function calculateMedians(cars) {
  return cars.map((arr) => {
    const sortedCongestion = arr.sort((a, b) => a - b);
    const length = sortedCongestion.length;
    const middleIndex = Math.floor(length / 2);

    if (length % 2 === 0) {
      return (sortedCongestion[middleIndex - 1] + sortedCongestion[middleIndex]) / 2;
    } else {
      return sortedCongestion[middleIndex];
    }
  });
}
