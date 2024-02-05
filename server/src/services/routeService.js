import { getStations } from "./stationService.js";
import { getTime, truncateToNearestTen } from "../services/timeService.js";
import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";

// 최근 경로 저장하는 함수
async function saveRecentRoute(req, startStation, endStation) {
  const recentRoutes = req.session.recentRoutes || [];

  // 최근 검색 경로 중복 방지
  const isLatestRoute = recentRoutes[0].startStation === startStation && recentRoutes[0].endStation === endStation;

  if (!isLatestRoute) {
    recentRoutes.unshift({ startStation, endStation });
    if (recentRoutes.length > 3) {
      recentRoutes.pop();
    }
  }
  req.session.recentRoutes = recentRoutes;
}

// 출발/도착역에 따른 경로, 내외선 방향 계산 함수
async function getRouteAndDirection(startStation, endStation) {
  const stations = await getStations();
  const startIndex = stations.indexOf(startStation);
  const endIndex = stations.indexOf(endStation);
  const lastIndex = stations.length - 1;

  let direction;
  let route = [];

  // 출발/도착역 위치 비교 -> 경로, 내외선 방향 결정
  if (startIndex < endIndex) {
    if (endIndex - startIndex < lastIndex - endIndex + startIndex) {
      // 내선
      // 서울대입구 -> 신도림
      direction = 1;
      route.push(...stations.slice(startIndex, endIndex + 1));
    } else {
      // 외선
      // 을지로입구 -> 아현
      direction = 0;
      route.push(...stations.slice(0, startIndex + 1).reverse());
      route.push(...stations.slice(endIndex).reverse());
    }
  } else {
    if (startIndex - endIndex < lastIndex - startIndex + endIndex) {
      // 신도림 -> 서울대입구
      // 외선
      direction = 0;
      route.push(...stations.slice(endIndex, startIndex + 1).reverse());
    } else {
      // 내선
      // 아현 -> 을지로입구
      direction = 1;
      route.push(...stations.slice(startIndex));
      route.push(...stations.slice(0, endIndex + 1));
    }
  }

  const result = {
    route,
    direction,
  };

  return result;
}

// 경로별 디테일 정보 DB에서 가져오는 함수
async function getRouteDetail(route, direction) {
  let { day, arrivalHour, arrivalMin } = getTime();

  const routeInfo = [];

  const connection = await getConnection();
  const query = `SELECT * FROM station s JOIN train t ON s.id = t.station_id JOIN car c ON t.id = c.train_id WHERE s.station_name = ? AND t.direction = ? AND t.arrival_day = ? AND t.arrival_hour = ? AND t.arrival_min = ?`;

  for (const station of route) {
    // const params = [station, direction, day, arrivalHour, roundDownToNearestTen(arrivalMin)];
    const params = [station, direction, "MON", 8, truncateToNearestTen(arrivalMin)]; // 테스트 입력값
    const [rows, fields] = await executeQuery(connection, query, params);

    routeInfo.push(rows);

    // 시간 대 바뀌기 전까지(8시, 13시 데이터만 있기 때문)
    if (arrivalMin / 10 <= 5) {
      // 내외선에 맞는 역 간 소요시간(초 / 60 => 분) 더해줌
      arrivalMin += direction ? rows[0].next_station_time / 60 : rows[0].prev_station_time / 60;
    }
  }

  await endConnection(connection);

  return routeInfo;
}

export { saveRecentRoute, getRouteAndDirection, getRouteDetail };
