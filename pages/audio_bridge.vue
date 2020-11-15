<template>
  <div class="container">
    <div>
      <button @click="createRoom">Create</button>
      <button @click="startSession">Start</button>
      <button @click="changeComic">Change Comic</button>
      <button @click="changeMusic">Change Music</button>
    </div>
    <div>
      <iframe
        ref="comicFrame"
        src="https://shonenjumpplus.com/episode/13933686331737374360/embed"
        width="560"
        height="400"
        frameborder="0"
        scrolling="no"
        allowfullscreen="allowfullscreen"
        style="max-width: 100%"
      ></iframe>
    </div>
    <div>
      <iframe
        ref="musicFrame"
        allow="autoplay *; encrypted-media *; fullscreen *"
        frameborder="0"
        height="450"
        style="
          width: 100%;
          max-width: 660px;
          overflow: hidden;
          background: transparent;
        "
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src="https://embed.music.apple.com/jp/playlist/%E3%83%8B%E3%83%A5%E3%83%BC-%E3%83%9F%E3%83%A5%E3%83%BC%E3%82%B8%E3%83%83%E3%82%AF-%E3%83%87%E3%82%A4%E3%83%AA%E3%83%BC/pl.2b0e6e332fdf4b7a91164da3162127b5"
      ></iframe>
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
const server = "wss://janus-001.vobby.net:8989";
const roomId = 1111;
const myId = Math.random().toString(32).substring(2);
const token =
  "1605402604,janus,janus.plugin.sfu,janus.plugin.audiobridge:u4XnnMoUbLq8lY5m00jxvJZtPr4=";
const plugin = new JanusPluginAudioBridge(myId, server, token);
export default {
  components: {
    Logo,
  },
  mounted() {
    plugin.createSession();
  },
  methods: {
    createRoom() {
      plugin.createRoom(roomId);
    },
    startSession() {
      plugin.joinRoom(roomId);
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
