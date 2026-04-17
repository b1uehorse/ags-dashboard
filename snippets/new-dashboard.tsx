// Snippet: новый dashboard (отдельное окно).
// Скопировать в src/dashboards/my-screen.tsx, подключить в app.ts

import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";

export default function MyScreen() {
    return (
        <window
            visible
            name="my-screen"
            namespace="ags-my-screen"
            application={app}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
            marginTop={10}
            marginRight={10}
        >
            <box cssClasses={["my-screen"]}>
                {/* виджеты сюда */}
            </box>
        </window>
    );
}

// В app.ts:
//   import MyScreen from "./src/dashboards/my-screen";
//   app.start({ css: style, main() { RxyhnDashboard(); MyScreen(); }});

// В hyprland.conf (опционально):
//   bind = SUPER, M, exec, ags toggle-window my-screen
//   layerrule = blur, ags-my-screen
