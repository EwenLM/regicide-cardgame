import "@fontsource/archivo-black/400.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/700.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import { mount } from "svelte";
import App from "./App.svelte";
import { connect } from "./lib/game.svelte.js";

connect();
mount(App, { target: document.getElementById("app") });
