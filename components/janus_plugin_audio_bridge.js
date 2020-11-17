import Janus from "~/components/janus";

const users = {};

class JanusPluginAudioBridge {
  constructor(myUserId, server, token) {
    this.myUserId = myUserId;
    this.server = server;
    this.token = token;
    this.users = {};
  }
  createRoom(roomId) {
    return new Promise((success, reject) => {
      this.streaming.send({
        message: {
          request: "create",
          audio_level_average: 0,
          room: roomId
        },
        success: jsep => {
          console.log("success create");
          success();
        },
        error: error => {
          console.log("WebRTC error... " + JSON.stringify(error));
          reject();
        }
      });
    });
  }
  joinRoom(roomId) {
    return new Promise((success, reject) => {
      this.streaming.send({
        message: {
          request: "join",
          room: roomId,
          display: this.myUserId,
          quality: 10
        },
        success: jsep => {
          console.log("success join");
          success();
        },
        error: error => {
          console.log("WebRTC error... " + JSON.stringify(error));
          reject();
        }
      });
    });
  }
  leaveRoom() {
    return new Promise((success, reject) => {
      this.streaming.send({
        message: {
          request: "leave"
        },
        success: jsep => {
          console.log("success join");
          success();
        },
        error: error => {
          console.log("WebRTC error... " + JSON.stringify(error));
          reject();
        }
      });
    });
  }
  configure(muted, volume) {
    return new Promise((success, reject) => {
      this.streaming.send({
        message: {
          request: "configure",
          muted: muted,
          volume: volume
        },
        success: jsep => {
          console.log("success configure");
          success();
        },
        error: error => {
          console.log("WebRTC error... " + JSON.stringify(error));
          reject();
        }
      });
    });
  }
  createSession(statusCallback) {
    return new Promise((success, reject) => {
      this.streaming = null;
      statusCallback("initialize");
      Janus.init({
        debug: "all",
        callback: () => {
          let janus = new Janus({
            server: this.server,
            token: this.token,
            success: () => {
              console.log("janus initialized");

              statusCallback("initialized");
              janus.attach({
                plugin: "janus.plugin.audiobridge",
                success: pluginHandle => {
                  console.log("attached plugin");
                  this.streaming = pluginHandle;
                  success();
                  statusCallback("attached");
                },
                error: error => {
                  console.log("Error attaching plugin... " + error);
                  reject();
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
                  if (msg !== undefined && msg.janus !== undefined) {
                    console.log("receive event " + msg.janus);
                    switch (msg.janus) {
                      case "hangup":
                        statusCallback("hangup", msg);
                        break;
                    }
                  } else if (
                    msg !== undefined &&
                    msg.audiobridge !== undefined
                  ) {
                    console.log("receive event " + msg.audiobridge);
                    switch (msg.audiobridge) {
                      case "event":
                        statusCallback("event", msg);
                        break;
                      case "hangup":
                        statusCallback("hangup", msg);
                        break;
                      case "joined":
                        statusCallback("joined", msg);
                        this.streaming.createOffer({
                          media: {
                            audio: true,
                            video: false,
                            data: false
                          },
                          success: jsep => {
                            console.log("send offer");
                            console.log(jsep);
                            this.streaming.send({
                              message: { request: "configure", muted: false },
                              jsep: jsep,
                              success: jsep => {
                                console.log("success send offer");
                              },
                              error: error => {
                                console.log(
                                  "WebRTC error... " + JSON.stringify(error)
                                );
                              }
                            });
                          },
                          error: error => {
                            console.log(
                              "WebRTC error... " + JSON.stringify(error)
                            );
                          }
                        });
                        break;
                      case "left":
                        statusCallback("left");
                        break;
                      case "leave":
                        statusCallback("leaved");
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
                      if (!this.users[user]) {
                        this.createSession(roomId, user);
                      }
                    }
                  }
                  if (
                    jsep !== undefined &&
                    jsep !== null &&
                    jsep.type !== null
                  ) {
                    console.log("receive jsep " + jsep.type);
                    switch (jsep.type) {
                      case "answer":
                        console.log("handle answer");
                        this.streaming.handleRemoteJsep({
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
                  console.log("on webrtc status " + this.roomId + webrtcup);

                  if (webrtcup) {
                    statusCallback("connected");
                  } else {
                    statusCallback("disconnected");
                  }
                },
                onlocalstream: stream => {
                  console.log("on local stream");
                },
                onremotestream: stream => {
                  console.log("on remote stream");
                  console.log(stream);
                  const tracks = stream.getAudioTracks();
                  console.log("has audio tracks " + tracks.length);
                  if (
                    tracks === null ||
                    tracks === undefined ||
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
              reject();
            }
          });
        }
      });
    });
  }
}

export default JanusPluginAudioBridge;
