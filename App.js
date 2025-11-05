// App.js
import "react-native-gesture-handler";
import "react-native-reanimated";
import { LogBox } from "react-native";
import AppNavigator from "./navigation/AppNavigator";

// Tắt error overlay - chỉ log vào console, không hiển thị lên UI
LogBox.ignoreAllLogs(false);
// Ignore specific warnings nếu cần
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Remote debugger",
]);

// Global error handler - chỉ log vào console, không hiển thị error banner
if (typeof ErrorUtils !== "undefined") {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Chỉ log vào console
    console.error("Global Error Handler:", error);
    if (isFatal) {
      console.error("Fatal Error:", error);
    }
    // KHÔNG gọi originalHandler để không hiển thị error overlay
    // Tất cả errors sẽ chỉ được log vào console
  });
}

// Handle unhandled promise rejections - chỉ log, không hiển thị
if (typeof globalThis !== "undefined" && globalThis.HermesInternal) {
  const HermesInternal = globalThis.HermesInternal;
  if (HermesInternal?.enablePromiseRejectionTracker) {
    HermesInternal.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (id, rejection) => {
        // Chỉ log vào console
        console.error("Unhandled Promise Rejection:", rejection);
        // Không hiển thị error overlay
      },
      onHandled: () => {
        // Promise đã được handle
      },
    });
  }
}

export default function App() {
  return <AppNavigator />;
}
