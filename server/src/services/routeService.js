import { getStations } from "./stationService.js";
import { getTime, getNextDay, adjustTime } from "../services/timeService.js";
import { getConnection, executeQuery, endConnection } from "../services/databaseService.js";

// 최근 경로 저장하는 함수
async function saveRecentRoute(req, startStation, endStation) {
  const recentRoutes = req.session.recentRoutes || [];

  // 최근 검색 경로 중복 방지
  const isLatestRoute = recentRoutes[0]?.startStation === startStation && recentRoutes[0]?.endStation === endStation;

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
  let { actualDay, actualHour, actualMin } = getTime();
  const routeInfo = [];
  const connection = await getConnection();
  const query = `
    SELECT * FROM station AS s
    JOIN train AS t
    ON s.id = t.station_id
    JOIN statistics AS stat ON t.id = stat.train_id
    WHERE s.station_name = ? AND t.direction = ? AND t.arrival_day = ? AND t.arrival_hour = ? AND t.arrival_min = ?`;

  for (const station of route) {
    const { arrivalDay, arrivalHour, arrivalMin } = adjustTime(actualDay, actualHour, actualMin);
    const params = [station, direction, arrivalDay, arrivalHour, arrivalMin];
    const [rows, fields] = await executeQuery(connection, query, params);

    routeInfo.push(rows);

    actualMin += direction ? rows[0].next_station_time / 60 : rows[0].prev_station_time / 60;

    if (actualMin >= 60) {
      actualMin %= 60;
      actualHour += 1;
    }

    if (actualHour >= 24) {
      actualHour %= 24;
      actualDay = getNextDay(actualDay);
    }
  }

  await endConnection(connection);
  return routeInfo;
}

// console.log("routeinfo", await getRouteDetail(["시청", "을지로입구", "을지로3가", "을지로4가", "동대문역사문화공원", "신당"], 1));

export { saveRecentRoute, getRouteAndDirection, getRouteDetail };