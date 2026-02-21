// Minimal synchronous polyfill — needed for UUID generation before anything else
import "react-native-get-random-values";

import { InteractionManager } from "react-native";
import { registerRootComponent } from "expo";

import App from "@/src/app/App";

registerRootComponent(App);

// Defer heavy polyfills until after the first frame renders.
// Buffer is only needed for Solana/wallet operations, not the initial Discovery screen.
InteractionManager.runAfterInteractions(() => {
  require("./setupPolyfill");
});
