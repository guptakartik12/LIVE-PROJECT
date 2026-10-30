const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminCharts,
  toggleSlotMaintenance,
  updateFloorPrice,
  getAllBookings,
  getAllUsers,
  resetAllData
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/charts', getAdminCharts);
router.put('/slots/:id/maintenance', toggleSlotMaintenance);
router.put('/floors/:key/price', updateFloorPrice);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);
router.post('/reset-data', resetAllData);

module.exports = router;
