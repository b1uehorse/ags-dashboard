import app from "ags/gtk4/app";
import style from "./style.scss";
import RxyhnDashboard from "./src/dashboards/rxyhn";

app.start({
    css: style,
    main() {
        RxyhnDashboard();
    },
});
