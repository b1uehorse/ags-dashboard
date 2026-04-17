import app from "ags/gtk4/app";
import style from "./style.scss";
import RxyhnDashboard from "./src/dashboards/rxyhn";

// experiments — раскомментировать для пробы
// import QuickCmd from "./src/experiments/QuickCmd";
// import NowPlayingTicker from "./src/experiments/NowPlayingTicker";
// import WorkspaceDots from "./src/experiments/WorkspaceDots";
// import NtfyLog from "./src/experiments/NtfyLog";
// import CpuSparkline from "./src/experiments/CpuSparkline";

app.start({
    css: style,
    main() {
        RxyhnDashboard();

        // experiments
        // QuickCmd();
        // NowPlayingTicker();
        // WorkspaceDots();
        // NtfyLog();
    },
});
