module.exports.root = (req, res, next) => {
    res.send('webrtc');
}
module.exports.ascii = (req, res, next) => {
    res.render('webrtc/ascii');
}