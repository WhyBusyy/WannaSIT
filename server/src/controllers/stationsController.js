import path from "path";

const __dirname = path.resolve();

function getStations(req, res) {
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "src", "data", "stationCodes.json"));
}

function getRecentRoutes(req, res) {
  if (!req.session.recentRoutes) {
    res.json([]);
  } else {
    res.json(req.session.recentRoutes);
  }
}

export default { getStations, getRecentRoutes };
