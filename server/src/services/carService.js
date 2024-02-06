import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";

const TOTAL_SEATS = 54;
const ZERO_PERCENTAGE_COUNT = 160;
const MAX_PERCENTAGE_COUNT = TOTAL_SEATS - 20;

// 랭킹 계산 함수
function calculateRanking(routeDetail) {
  const countByCar = gatherCountByCar(routeDetail); // 호차별로 예측인원 모으기
  const bestByCar = findBestByCar(countByCar);

  sortRanking(bestByCar);

  const carRank = bestByCar.map(({ carNum, stationIndex, bestCount }) => {
    const isSeatAvailable = convertCountToPercentage(bestCount);
    return {
      carNum,
      stationIndex,
      isSeatAvailable,
    };
  });

  return carRank;
}

function convertCountToPercentage(count) {
  let percentage;
  if (count <= MAX_PERCENTAGE_COUNT) {
    percentage = 99;
  } else if (count >= ZERO_PERCENTAGE_COUNT) {
    percentage = 0;
  } else {
    percentage = 99 - ((count - MAX_PERCENTAGE_COUNT) / (ZERO_PERCENTAGE_COUNT - MAX_PERCENTAGE_COUNT)) * 100;
  }

  return parseInt(percentage);
}

// 경로까지 역 별 착석 가능성
function calculateChanceByRoute(routeDetail, carNumber) {
  const countByCar = gatherCountByCar(routeDetail);
  const countCar = countByCar[carNumber - 1];
  countCar.forEach((count, index) => {
    countCar[index] = convertCountToPercentage(count); // 퍼센트 함수 호출
    // countCar[index] = count < TOTAL_SEATS ? "높음" : count <= TOTAL_SEATS * 2 ? "중간" : "낮음";
  });

  return countCar;
}

// 많이 내리는 역 여부 체크 함수
async function determineHighTraffic(routeDetail) {
  const traffic = [];
  const connection = await getConnection();
  const query = `
	SELECT stats.get_off_count 
	FROM statistics stats JOIN train t ON stats.train_id = t.id
	WHERE t.direction=0 AND t.arrival_day=? AND t.arrival_hour=? AND t.arrival_min=0 
	ORDER BY stats.get_off_count DESC 
	LIMIT 1 OFFSET 14;`;

  await Promise.all(
    routeDetail.map(async (route) => {
      const params = [route.arrival_day, route.arrival_hour];
      const [rows, fields] = await executeQuery(connection, query, params);
      const getOffThreshold = rows.get_off_count; // 해당 시간대 상위 15등에 해당하는 값

      if (route.get_off_count >= getOffThreshold) traffic.push(1);
      else traffic.push(0);
    })
  );

  connection.end();
  return traffic;
}

// 예측인원수 가장 적은 2개의 칸 구하는 함수
function findHighCars(routeDetail) {
  const highCars = [];
  const countByCar = gatherCountByCar(routeDetail);

  for (let i = 0; i < countByCar[0].length; i++) {
    const tempArr = countByCar.map((val) => val[i]);
    const minCar = tempArr.indexOf(Math.min(...tempArr)) + 1;
    tempArr[minCar - 1] = Infinity;
    const secondMinCar = tempArr.indexOf(Math.min(...tempArr)) + 1;

    highCars.push([minCar, secondMinCar]);
  }

  return highCars;
}

// 호차 추천 위한 호차별 인원 모으는 함수
function gatherCountByCar(routeDetail) {
  // estimated_count 모으기
  const estimatedCounts = routeDetail.map((detail) => detail.estimated_count);

  // 호차끼리 모으기
  const countByCar = estimatedCounts[0].map((_, i) => estimatedCounts.map((counts) => counts[i]));

  return countByCar;
}

// 호차 별 착석 가능성 높은 역 찾는 함수
function findBestByCar(countByCar) {
  const bestByCar = [];

  countByCar.forEach((car, index) => {
    let carNum = index + 1;
    let bestCount = car[0] <= TOTAL_SEATS ? car[0] : Math.min(...car); // 출발역에서 앉을 수 있다면 Best
    let stationIndex = car.indexOf(bestCount);

    bestByCar.push({ carNum, stationIndex, bestCount });
  });

  return bestByCar;
}

// 추천 호차 순서 결정 함수
function sortRanking(bestByCar) {
  console.log("정렬 전: ", bestByCar);

  // 우선순위 : bestCount  > index(역)
  bestByCar.sort((a, b) => {
    // 출발역에서 앉을 수 있다면 0순위
    if (a.stationIndex === 0 && a.bestCount <= TOTAL_SEATS) {
      return -1;
    } else if (b.stationIndex === 0 && b.bestCount <= TOTAL_SEATS) {
      return 1;
    } else {
      if (a.bestCount === b.bestCount) {
        return a.stationIndex - b.stationIndex;
      } else {
        return a.bestCount - b.bestCount;
      }
    }
  });

  console.log("정렬 후: ", bestByCar);
}

export { calculateRanking, calculateChanceByRoute, determineHighTraffic, findHighCars };
