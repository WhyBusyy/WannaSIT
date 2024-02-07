import { saveRecentRoute, getRouteAndDirection, getRouteDetail } from "../services/routeService.js";
import { calculateRanking, calculateChanceByRoute, determineHighTraffic, findHighCars } from "../services/carService.js";

// 추천 호차 랭킹
async function rank(req, res) {
  try {
    const { startStation, endStation } = req.query;
    const { route, direction } = await getRouteAndDirection(startStation, endStation);
    const routeDetail = await getRouteDetail(route, direction);
    const carRank = calculateRanking(routeDetail);
    await saveRecentRoute(req, startStation, endStation);

    res.send(carRank);
  } catch (error) {
    console.error("Error in rank function:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function info(req, res) {
  const { startStation, endStation, carNumber } = req.query;
  const { route, direction } = await getRouteAndDirection(startStation, endStation);
  const routeDetail = await getRouteDetail(route, direction);
  const chanceByRoute = calculateChanceByRoute(routeDetail, carNumber);
  const trafficArr = await determineHighTraffic(routeDetail);
  const highCarArr = findHighCars(routeDetail);

  const result = [];

  routeDetail.forEach((route, index) => {
    const station = route.station_name;
    const traffic = trafficArr[index];
    const feature = route.station_info;
    const character = route.passenger_info;
    const tip = { feature, character };
    const chance = chanceByRoute[index];
    const highCars = highCarArr[index];

    const data = { station, traffic, tip, chance, highCars };
    result.push(data);
  });

  res.send(result);
}

export default { rank, info };
