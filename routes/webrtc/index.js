const router = require('express').Router();
const webrtc = require('./webrtc');

router.get('/', webrtc.root);

router.get('/ascii', webrtc.ascii);

router.get('/withoutSignalingServer', webrtc.withoutSignalingServer);
module.exports = router;