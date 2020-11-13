<template>
  <div class="container">
    <button @click="startSession">Start</button>
    <audio
      class="rounded centered"
      id="audio"
      width="100%"
      height="100%"
      autoplay
      playsinline
    />
  </div>
</template>

<script>
import Logo from "~/components/Logo.vue";
import Janus from "~/components/janus";

const server = "wss://janus-001.vobby.net:8989";
const opaqueId = "streamingtest-" + Janus.randomString(12);
const roomId = "test";
const myId = Janus.randomString(12);
const users = {};
const create = (userId) => {
  let streaming = null;
  users[userId] = false;
  console.log("start connect User " + userId);
  Janus.init({
    debug: "all",
    callback: function () {
      let janus = new Janus({
        server: server,
        token: "1605358995,janus,janus.plugin.sfu:f+F+JcX2ByYhTO34z8poODDgv4c=",
        success: function () {
          janus.attach({
            plugin: "janus.plugin.sfu",
            success: function (pluginHandle) {
              console.log("attached plugin");
              streaming = pluginHandle;

              console.log("create offer");
              streaming.createOffer({
                media: {
                  audioSend: myId == userId,
                  audioRecv: myId != userId,
                  video: false,
                  data: myId == userId,
                },
                success: function (jsep) {
                  console.log("send offer");
                  console.log(jsep);
                  var body = {};
                  streaming.send({
                    message: body,
                    jsep: jsep,
                    success: function (jsep) {
                      console.log("success send offer");
                    },
                    error: function (error) {
                      console.log("WebRTC error... " + JSON.stringify(error));
                    },
                  });
                },
                error: function (error) {
                  console.log("WebRTC error... " + JSON.stringify(error));
                },
              });
            },
            error: function (error) {
              console.log("Error attaching plugin... " + error);
            },
            iceState: (state) => {
              console.log("ice state " + state);
            },
            mediaState: (type, receiving) => {
              console.log("media state " + type);
              console.log(receiving);
            },
            onmessage: function (msg, jsep) {
              const result = msg["result"];
              console.log("receive message");
              console.log(msg);
              console.log(jsep);
              if (msg !== undefined && msg.event !== undefined) {
                console.log("receive event " + msg.event);
                switch (msg.event) {
                  case "join":
                    create(msg.user_id);
                    break;

                  case "leave":
                    break;
                  default:
                    break;
                }
              } else if (
                msg !== undefined &&
                msg !== null &&
                msg.response !== undefined &&
                msg.response.users !== undefined
              ) {
                for (let user of msg.response.users[roomId]) {
                  if (!users[user]) {
                    create(user);
                  }
                }
              }
              if (jsep !== undefined && jsep !== null && jsep.type !== null) {
                console.log("receive jsep " + jsep.type);
                switch (jsep.type) {
                  case "offer":
                    console.log("create answer");
                    streaming.createAnswer({
                      jsep: jsep,
                      media: {
                        audio: true,
                        video: false,
                        data: false,
                      },
                      success: function (jsep) {
                        console.log("success answer");
                      },
                      error: function (error) {
                        console.log("WebRTC error... " + JSON.stringify(error));
                      },
                    });
                    break;
                  case "answer":
                    console.log("handle answer");
                    streaming.handleRemoteJsep({
                      jsep: jsep,
                      success: function () {
                        console.log("success handle jsep");
                      },
                      error: function (error) {
                        console.log(
                          "WebRTC handle jsep... " + JSON.stringify(error)
                        );
                        console.log(error);
                      },
                    });
                    break;
                  default:
                    break;
                }
              }
            },
            webrtcState: function (webrtcup) {
              console.log("on webrtc status " + userId);
              console.log("on webrtc user my: " + (userId == myId));

              if (webrtcup) {
                users[userId] = true;
                let subscribe = {};
                if (userId == myId) {
                  subscribe = {
                    notifications: true,
                    data: true,
                  };
                } else {
                  subscribe = {
                    media: userId,
                  };
                }
                streaming.send({
                  message: {
                    kind: "join",
                    room_id: roomId,
                    user_id: userId,
                    subscribe: subscribe,
                  },
                  success: function (jsep) {
                    console.log("success join");
                  },
                  error: function (error) {
                    console.log("WebRTC error... " + JSON.stringify(error));
                  },
                });
              }
            },
            onlocalstream: function (stream) {
              console.log("on local stream");
            },
            onremotestream: function (stream) {
              console.log("on remote stream");
              console.log(stream);
              var tracks = stream.getAudioTracks();
              console.log("has audio tracks " + tracks.length);
              if (
                tracks === null ||
                tracks === undefined ||
                myId == userId ||
                tracks.length === 0
              )
                return;

              console.log("set stream");
              Janus.attachMediaStream(document.getElementById("audio"), stream);
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
};
export default {
  components: {
    Logo,
  },
  mounted() {},
  methods: {
    startSession() {
      create(myId);
    },
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
