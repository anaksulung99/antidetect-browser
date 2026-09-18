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
    window.appRuntime.onMainProcessMessage((message) => {
      console.debug("Main process:", message);
    });
  });
