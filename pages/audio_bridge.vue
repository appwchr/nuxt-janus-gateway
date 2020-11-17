<template>
  <div class="container">
    <div v-if="allowMicPermission">
      <div v-if="connecting">接続中...</div>
      <div v-if="connected">
        <div>{{ myId }}</div>
        <div>{{ mySessionId }}</div>
        <div v-for="item in participants" :key="`participants_${item}`">
          {{ item }}
        </div>
      </div>
      <button v-if="!connecting && !connected" @click="createRoom">
        Create And Join
      </button>
      <button v-if="!connecting && !connected" @click="joinRoom">Join</button>
      <button v-if="connected" @click="toggleMute">ToggleMute</button>
      <button v-if="connected" @click="leaveRoom">Leave</button>
    </div>
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
import JanusPluginAudioBridge from "~/components/janus_plugin_audio_bridge";

export default {
  components: {
    Logo,
  },
  data() {
    return {
      roomId: 1111,
      myId: Math.random().toString(32).substring(2),
      url: "",
      token: "",
      plugin: null,
      participants: [],
      allowMicPermission: false,
      connected: false,
      connecting: false,
      muted: false,
    };
  },
  async mounted() {
    this.$nextTick(() => {
      this.checkPermission();
    });
  },
  methods: {
    async setupUserMedia() {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
      }
      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = (constraints) => {
          const getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

          if (!getUserMedia) {
            return Promise.reject(
              new Error("getUserMedia is not implemented in this browser")
            );
          }

          return new Promise(function (resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
    },
    async checkPermission() {
      try {
        await this.setupUserMedia();
        this.allowMicPermission = true;
      } catch (e) {
        this.allowMicPermission = false;
      }
    },
    async createSession() {
      const res = await this.$axios.$post(
        "https://webrtcbase-api-production-dq27y4dblq-an.a.run.app/api/v1/servers/select",
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer N2a2qPzcEWtj2S2oQv1BT2fvovyHSu2v",
          },
        }
      );
      const url = `wss://${res.host}:${res.port}`;
      const token = res.token;
      this.plugin = new JanusPluginAudioBridge(this.myId, url, token);
      await this.plugin.createSession((state, msg) => {
        console.log(msg);
        switch (state) {
          case "connected":
            this.connecting = false;
            this.connected = true;
            break;
          case "joined":
            if (msg.id != null) {
              this.mySessionId = msg.id;
            }
            if (msg.participants != null) {
              this.participants = msg.participants;
            }
            break;
          case "disconnected":
            this.connecting = false;
            this.mySessionId = null;
            this.participants = [];
            this.connected = false;
            break;
          case "left":
            this.mySessionId = null;
            this.participants = [];
            this.connected = false;
            break;
          case "event":
            if (msg.participants != null) {
              for (let a of msg.participants) {
                const find = this.participants.findIndex((b) => b.id == a.id);
                console.log(find);
                if (find >= 0) {
                  this.participants.splice(find, 1);
                }
                this.participants.push(a);
              }
            }
            if (msg.leaving != null) {
              this.participants.forEach((a, index, object) => {
                if ((a) => a.id == msg.leaving) {
                  object.splice(index, 1);
                  this.participants = this.participants;
                }
              });
            }
            break;
          default:
            break;
        }
      });
    },
    async createRoom() {
      await this.createSession();
      await this.plugin.createRoom(this.roomId);
      this.connecting = true;
      await this.plugin.joinRoom(this.roomId);
    },
    async joinRoom() {
      await this.createSession();
      this.connecting = true;
      await this.plugin.joinRoom(this.roomId);
    },
    async leaveRoom() {
      await this.plugin.leaveRoom();
    },
    async toggleMute() {
      await this.plugin.configure(!this.muted, 100);
      this.muted = !this.muted;
    },
    changeComic() {
      this.$refs.comicFrame.src =
        "https://shonenjumpplus.com/episode/13933686331737378690/embed";
    },
    changeMusic() {
      this.$refs.musicFrame.src =
        "https://embed.music.apple.com/jp/playlist/j-pop-now/pl.dc16cb58902342cba9711cbcd9bf2840";
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
