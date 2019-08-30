const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  res.send('This is great! hot reload test');
});

module.exports = router;
