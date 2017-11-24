var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');

callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

var startTime;

var localVideo = document.getElementById('video1');
var remoteVideo = document.getElementById('video2');

localVideo.addEventListener('loadedmetadata', () => {
    console.log(`Local video videoWidth: ${localVideo.videoWidth} px, videoHeight: ${localVideo.videoHeight} px`);
});

remoteVideo.onresize = () => {
    console.log(`Remote video size changed to ${remoteVideo.videoWidth} x ${remoteVideo.videoHeight}`);
    if(startTime) {
        let elapsedTime = window.performance.now() - startTime;
        console.log(`setup time: ${elapsedTime.toFixed(3)} ms`);
        startTime = null;
    }
}

var localStream;
var pc1;
var pc2;
var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};

function getName(pc) {
    return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
    return (pc === pc1) ? pc2 : pc1;
}

function gotStream(stream) {
    console.log('received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
}

function start() {
    console.log('requesting local stream');
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia({
        video: true,
    })
    .then(gotStream)
    .catch((e) => { alert(`getUserMedia() err: ${e.name}`);});
}

function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    console.log('starting call');
    startTime = window.performance.now();
    let videoTracks = localVideo.srcObject.getVideoTracks();
    let audioTracks = localVideo.srcObject.getAudioTracks();
    if(videoTracks.length > 0) {
        console.log(`using video device: ${videoTracks[0].label}`);
    }
    if(audioTracks.length > 0) {
        console.log(`using audio device: ${audioTracks[0].label}`);
    }
    
    let server = null;

    pc1 = new RTCPeerConnection(server);
    console.log('created local peer connection object pc1');
    pc1.onicecandidate = (e) => { onIceCandidate(pc1, e);};
    
    pc2 = new RTCPeerConnection(server);
    console.log('created remote peer connection object pc2');
    pc2.onicecandidate = (e) => { onIceCandidate(pc2, e);};

    pc1.oniceconnectionstatechange = (e) => { onIceStateChange(pc1, e);};
    pc2.oniceconnectionstatechange = (e) => { onIceStateChange(pc2, e);};

    pc2.ontrack = gotRemoteStream;

    localStream.getTracks().forEach(
        (track) => {
            pc1.addTrack(track, localStream);
        }
    )
    console.log('added local stream to pc1');

    console.log('pc1 createOffer start');
    pc1.createOffer(offerOptions).then(onCreateOfferSuccess, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
    console.log(`failed to create session description: ${error.toString()}`);
}

function onCreateOfferSuccess(desc) {
    console.log(`offer from pc1 \n ${desc.sdp}`);
    
    console.log('pc1 setLocalDescription start');
    pc1.setLocalDescription(desc).then(() => { onSetLocalSuccess(pc1);}, onSetSessionDescriptionError);

    console.log('pc2 setRemoteDescription start');
    pc2.setRemoteDescription(desc).then(() => { onsetRemoteSuccess(pc2);}, onSetSessionDescriptionError);

    console.log('pc2 createAnswer start');
    pc2.createAnswer().then(onCreateAnswerSuccess, onCreateSessionDescriptionError);
}

function onSetLocalSuccess(pc) {
    console.log(`${getName(pc)} setLocalDescription complete`);
}

function onsetRemoteSuccess(pc) {
    console.log(`${getName(pc)} setRemoteDescription complete`);
}

function onSetSessionDescriptionError(error) {
    console.log(`failed to set session description: ${error.toString()}`);
}

function gotRemoteStream(e) {
    if(remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        console.log('pc2 received remote stream');
    }
}

function onCreateAnswerSuccess(desc) {
    console.log(`answer from pc2: \n ${desc.sdp}`);

    console.log('pc2 setLocalDescription start');
    pc2.setLocalDescription(desc).then(() => { onSetLocalSuccess(pc2);}, onSetSessionDescriptionError);

    console.log('pc1 setRemoteDescription start');
    pc1.setRemoteDescription(desc).then(() => { onsetRemoteSuccess(pc1);}, onSetSessionDescriptionError);
}

function onIceCandidate(pc, event) {
    getOtherPc(pc).addIceCandidate(event.candidate).then(
        () => { onAddIceCandidateSuccess(pc);},
        (err) => { onAddIceCandidateError(pc, err);}
    );

    console.log(`${getName(pc)} ICE candidate: \n ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(pc) {
    console.log(`${getName(pc)} addIceCandidate Success`);
}

function onAddIceCandidateError(pc, error) {
    console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(pc, event) {
    if(pc) {
        console.log(`${getName(pc)} ICE state ${pc.iceConnectionState}`);
        console.log(`ICE State change event: ${event}`);
    }
}

function hangup() {
    console.log('ending call');

    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
}