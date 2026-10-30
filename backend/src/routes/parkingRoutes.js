const express = require('express');
const router = express.Router();
const { getFloors, getLocations, getFloorSlots } = require('../controllers/parkingController');

router.get('/floors', getFloors);
router.get('/locations', getLocations);
router.get('/floors/:floorKey/slots', getFloorSlots);

module.exports = router;
