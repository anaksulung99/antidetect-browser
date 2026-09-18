import { createPinia } from "pinia";
import { Field as FormField } from "vee-validate";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

const pinia = createPinia();

const app = createApp(App);
app.component("FormField", FormField);

app
  .use(pinia)
  .use(router)
  .mount("#app")
  .$nextTick(() => {
    // Use contextBridge
    window.ipcRenderer.on("main-process-message", (_event, message) => {
      console.log(message);
    });
  });
