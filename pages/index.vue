<template>
  <div class="container">
    rendering
    <video id="video" autoPlay playsInline />
  </div>
</template>

<script>
import Logo from "~/components/Logo.vue";
import Janus from "~/components/janus";

export default {
  components: {
    Logo,
  },
  mounted() {
    const server = "ws://192.168.1.210:8188";
    const opaqueId = "streamingtest-" + Janus.randomString(12);
    const roomId = "test";
    const userId = Janus.randomString(12);
    let streaming = null;

    Janus.init({
      debug: "all",
      callback: function () {
        let janus = new Janus({
          server: server,
          success: function () {
            janus.attach({
              plugin: "janus.plugin.sfu",
              session_id: opaqueId,
              success: function (pluginHandle) {
                console.log("success plugin");
                streaming = pluginHandle;
                streaming.createOffer({
                  media: { audio: true, video: false, data: true },
                  success: function (jsep) {
                    console.log("success offer");
                    console.log(jsep);
                    var body = {};
                    streaming.send({ message: body, jsep: jsep });
                  },
                  error: function (error) {
                    console.log("WebRTC error... " + JSON.stringify(error));
                  },
                });
              },
              error: function (error) {
                console.log("Error attaching plugin... " + error);
              },
              onmessage: function (msg, jsep) {
                const result = msg["result"];
                console.log("receive message");
                console.log(msg);
                console.log(jsep);
                if (jsep !== undefined && jsep !== null) {
                  streaming.handleRemoteJsep({
                    jsep: jsep,
                    success: function () {
                      console.log("success handle jsep");
                    },
                    error: function (error) {
                      console.log(
                        "WebRTC handle jsep... " + JSON.stringify(error)
                      );
                    },
                  });
                }
              },
              webrtcState: function (webrtcup) {
                console.log("on webrtc status ");
                if (webrtcup) {
                  streaming.send({
                    message: {
                      kind: "join",
                      room_id: roomId,
                      user_id: userId,
                      subscribe: {
                        notifications: true,
                        data: true,
                      },
                    },
                  });
                }
              },
              onlocalstream: function (stream) {
                console.log("on local stream");
              },
              onremotestream: function (stream) {
                var addButtons = false;
                addButtons = true;
                console.log("on remote stream");
                var videoTracks = stream.getVideoTracks();
                if (
                  videoTracks === null ||
                  videoTracks === undefined ||
                  videoTracks.length === 0
                )
                  return;

                let video = document.getElementById("video");
                video.srcObject = stream; // webinar or p2p
                console.log("rendering", stream);
                Janus.attachMediaStream(video, stream);
              },
            });
          },
          error: function (error) {
            bootbox.alert(error, function () {
              window.location.reload();
            });
          },
        });
      },
    });
  },
};
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
