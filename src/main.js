import { createApp } from "vue";
import LocalPortal from "./components/LocalPortal.vue";
import TrackingView from "./components/TrackingView.vue";
import "leaflet/dist/leaflet.css";
import App from "./App.vue";
import "../styles.css";
import "../app.css";
import "../platform.css";
import "../courier-registration.css";
import "../theme.css";
import { initTheme } from "./services/theme.js";
import { initInteractions } from "./services/interaction.js";
initTheme();
createApp(
  location.hash.startsWith("#/track/")
    ? TrackingView
    : ["admin", "outlet"].includes(
          new URLSearchParams(location.search).get("portal"),
        )
      ? LocalPortal
      : App,
).mount("#wasel-root");
initInteractions();
