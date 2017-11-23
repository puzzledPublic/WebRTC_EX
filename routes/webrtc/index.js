const router = require('express').Router();
const webrtc = require('./webrtc');

router.get('/', webrtc.root);

router.get('/ascii', webrtc.ascii);

module.exports = router;