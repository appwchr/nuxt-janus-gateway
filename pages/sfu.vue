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
import JanusPluginSFU from "~/components/janus_plugin_sfu";
//const server = "wss://janus-001.vobby.net:8989";
const server = "ws://192.168.1.210:8188";
const roomId = "test";
const myId = Math.random().toString(32).substring(2);
const token =
  "1605402604,janus,janus.plugin.sfu,janus.plugin.audiobridge:u4XnnMoUbLq8lY5m00jxvJZtPr4=";
export default {
  components: {
    Logo,
  },
  mounted() {},
  methods: {
    startSession() {
      const plugin = new JanusPluginSFU(myId, server, token);
      plugin.createSession(roomId, myId);
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
