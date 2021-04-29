let webex;
const video = document.getElementById('self-view');
const testVideo = document.getElementById('local-video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext("2d");
let myStream;

let isVideo = false;

const modelParams = {
  flipHorizontal: false, // flip e.g for video
  maxNumBoxes: 2, // maximum number of boxes to detect
  iouThreshold: 0.5, // ioU threshold for non-max suppression
  scoreThreshold: 0.6, // confidence threshold for predictions.
}

handTrack.load(modelParams).then(lmodel => {
  model = lmodel
  console.log('loaded model!');
});


function startVideo() {
  isVideo = true
  runDetection()
}


function toggleVideo() {
  if (!isVideo) {
      startVideo();
  } else {
      handTrack.stopVideo(video)
      isVideo = false;
  }
}


function runDetection() {
  model.detect(testVideo).then(predictions => {
      console.log("Predictions: ", predictions);
      model.renderPredictions(predictions, canvas, context, testVideo);

      if (isVideo) {
          setTimeout(() => {
              runDetection()
          }, 10);
      }
      $("#local-video").hide();
  });
}


function bindMeetingEvents(meeting) {
  meeting.on('error', (err) => {
    console.error(err);
  });

  // Handle media streams changes to ready state
  meeting.on('media:ready', (media) => {
    if (!media) {
      return;
    }
    if (media.type === 'local') {
      //document.getElementById('self-view').srcObject = media.stream;
      toggleVideo();
    }
    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = media.stream;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = media.stream;
    }
  });

  // Handle media streams stopping
  meeting.on('media:stopped', (media) => {
    // Remove media streams
    if (media.type === 'local') {
      document.getElementById('local-video').srcObject = null;
    }
    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = null;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = null;
    }
  });


  document.getElementById('mute').addEventListener('click', () => {
    if(meeting.isAudioMuted()){
      meeting.unmuteAudio()
    } else {
      meeting.muteAudio();
    }
  });


  // Of course, we'd also like to be able to leave the meeting:
  document.getElementById('hangup').addEventListener('click', () => {
    isVideo = false;
    document.getElementById("local-video").srcObject = null;
    document.getElementById("remote-view-video").srcObject = null;
    document.getElementById("remote-view-audio").srcObject = null;
    meeting.leave(meeting.id);
    context.clearRect(0, 0, canvas.width, canvas.height);
    $("#local-video").show();
  });


  document.getElementById('updateVideo').addEventListener('click', () => {
    console.log('updated!');
    myStream = canvas.captureStream();
    meeting.updateVideo({sendVideo:true, receiveVideo: true, stream:myStream});
    setTimeout(() => {
      console.log('second update');
      meeting.updateVideo({sendVideo:true, receiveVideo: true, stream:myStream});
  }, 2000);
  });
}

// Join the meeting and add media
function joinMeeting(meeting) {

  return meeting.join().then(() => {
    const mediaSettings = {
      receiveVideo: true,
      receiveAudio: true,
      receiveShare: false,
      sendVideo: true,
      sendAudio: true,
      sendShare: false
    };

    // Get our local media stream and add it to the meeting
    return meeting.getMediaStreams(mediaSettings).then((mediaStreams) => {
      const [localStream, localShare] = mediaStreams;
      console.log(localStream);
      testVideo.srcObject = localStream;
      meeting.addMedia({
        localShare,
        localStream,
        mediaSettings
      });


    });
  });
}

$("#authorize").on('click', function(){
  console.log('auth!')
  webex = window.Webex.init({
    credentials: {
      access_token: document.getElementById('token').value
    }
  });

  webex.meetings.register()
    .catch((err) => {
      console.error(err);
      alert(err);
      throw err;
    });
});

$("#join").on('click', function(){
  console.log('join!')
  const destination = document.getElementById('invitee').value;

  return webex.meetings.create(destination).then((meeting) => {
    // Call our helper function for binding events to meetings
    bindMeetingEvents(meeting);
    return joinMeeting(meeting);
  })
  .catch((error) => {
    console.error(error);
  });
});
