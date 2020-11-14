import Janus from "~/components/janus";

const users = {};

class JanusPluginSFU {
  constructor(myUserId, server, token) {
    this.myUserId = myUserId;
    this.server = server;
    this.token = token;
    this.users = {};
  }
  createSession(roomId, userId) {
    let streaming = null;
    this.users[userId] = false;
    console.log("start connect User " + userId);
    Janus.init({
      debug: "all",
      callback: () => {
        let janus = new Janus({
          server: this.server,
          token: this.token,
          success: () => {
            janus.attach({
              plugin: "janus.plugin.sfu",
              success: pluginHandle => {
                console.log("attached plugin");
                streaming = pluginHandle;

                console.log("create offer");
                streaming.createOffer({
                  media: {
                    audioSend: this.myUserId == userId,
                    audioRecv: this.myUserId != userId,
                    video: false,
                    data: this.myUserId == userId
                  },
                  success: jsep => {
                    console.log("send offer");
                    console.log(jsep);
                    var body = {};
                    streaming.send({
                      message: body,
                      jsep: jsep,
                      success: jsep => {
                        console.log("success send offer");
                      },
                      error: error => {
                        console.log("WebRTC error... " + JSON.stringify(error));
                      }
                    });
                  },
                  error: error => {
                    console.log("WebRTC error... " + JSON.stringify(error));
                  }
                });
              },
              error: error => {
                console.log("Error attaching plugin... " + error);
              },
              iceState: state => {
                console.log("ice state " + state);
              },
              mediaState: (type, receiving) => {
                console.log("media state " + type);
                console.log(receiving);
              },
              onmessage: (msg, jsep) => {
                const result = msg["result"];
                console.log("receive message");
                console.log(msg);
                console.log(jsep);
                if (msg !== undefined && msg.event !== undefined) {
                  console.log("receive event " + msg.event);
                  switch (msg.event) {
                    case "join":
                      this.createSession(roomId, msg.user_id);
                      break;
                    case "leave":
                      this.users[msg.user_id] = false;
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
                      this.createSession(roomId, user);
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
                          data: false
                        },
                        success: jsep => {
                          console.log("success answer");
                        },
                        error: error => {
                          console.log(
                            "WebRTC error... " + JSON.stringify(error)
                          );
                        }
                      });
                      break;
                    case "answer":
                      console.log("handle answer");
                      streaming.handleRemoteJsep({
                        jsep: jsep,
                        success: () => {
                          console.log("success handle jsep");
                        },
                        error: error => {
                          console.log(
                            "WebRTC handle jsep... " + JSON.stringify(error)
                          );
                          console.log(error);
                        }
                      });
                      break;
                    default:
                      break;
                  }
                }
              },
              webrtcState: webrtcup => {
                console.log("on webrtc status " + userId);
                console.log("on webrtc user my: " + (userId == this.myUserId));

                if (webrtcup) {
                  this.users[userId] = true;
                  let subscribe = {};
                  if (userId == this.myUserId) {
                    subscribe = {
                      notifications: true,
                      data: true
                    };
                  } else {
                    subscribe = {
                      media: userId
                    };
                  }
                  streaming.send({
                    message: {
                      kind: "join",
                      room_id: roomId,
                      user_id: userId,
                      subscribe: subscribe
                    },
                    success: jsep => {
                      console.log("success join");
                    },
                    error: error => {
                      console.log("WebRTC error... " + JSON.stringify(error));
                    }
                  });
                }
              },
              onlocalstream: stream => {
                console.log("on local stream");
              },
              onremotestream: stream => {
                console.log("on remote stream");
                console.log(stream);
                var tracks = stream.getAudioTracks();
                console.log("has audio tracks " + tracks.length);
                if (
                  tracks === null ||
                  tracks === undefined ||
                  this.myUserId == userId ||
                  tracks.length === 0
                )
                  return;

                console.log("set stream");
                Janus.attachMediaStream(
                  document.getElementById("audio"),
                  stream
                );
              }
            });
          },
          error: error => {
            console.log(error);
          }
        });
      }
    });
  }
}

export default JanusPluginSFU;
