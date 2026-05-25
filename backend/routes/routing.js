const express = require("express");
const router = express.Router();
const axios = require("axios");

// @desc    Get street route through multiple waypoints
// @route   POST /api/routing/directions
router.post("/directions", async (req, res) => {
  const { waypoints } = req.body; // array of { lat, lng }
  if (!waypoints || waypoints.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least 2 waypoints",
    });
  }

  try {
    const coordinates = waypoints.map((wp) => [wp.lng, wp.lat]);

    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const routeCoords = response.data.features[0].geometry.coordinates.map(
      ([lng, lat]) => ({ lat, lng }),
    );

    res.json({ success: true, coordinates: routeCoords });
  } catch (error) {
    console.error("ORS routing error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch route" });
  }
});

module.exports = router;
