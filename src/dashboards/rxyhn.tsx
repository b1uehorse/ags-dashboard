import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding } from "ags";
import Hypr from "gi://AstalHyprland";
import Stack from "../primitives/Stack";
import Profile from "../widgets/Profile";
import Quote from "../widgets/Quote";
import Clock from "../widgets/Clock";
import SystemMeters from "../widgets/SystemMeters";
import Music from "../widgets/Music";
import Weather from "../widgets/Weather";
import TaskList from "../widgets/TaskList";
import AppColumn from "../widgets/AppColumn";

const PINNED_WORKSPACE = 1;

export default function RxyhnDashboard() {
    const hypr = Hypr.get_default();
    const visibleOnWs = createBinding(hypr, "focusedWorkspace").as(
        (ws: any) => ws?.id === PINNED_WORKSPACE
    );

    return (
        <window
            visible={visibleOnWs}
            name="rxyhn-dashboard"
            namespace="ags-dashboard"
            application={app}
            layer={Astal.Layer.BOTTOM}
            $={(self: any) => {
                self.hide();
                self.set_layer(Astal.Layer.BOTTOM);
                self.show();
                print("layer after show=", self.get_layer());
            }}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            marginTop={197}
            marginLeft={371}
            exclusivity={Astal.Exclusivity.IGNORE}
            keymode={Astal.Keymode.NONE}
        >
            <box cssClasses={["dashboard"]} spacing={16}>

                <Stack orientation="v" spacing={10}>
                    <Profile />
                    <Quote />
                </Stack>

                <Stack orientation="v" spacing={10}>
                    <Stack orientation="h" spacing={10}>
                        <Stack orientation="v" spacing={10}>
                            <SystemMeters />
                            <Clock />
                        </Stack>
                        <Music />
                    </Stack>
                    <Stack orientation="h" spacing={10}>
                        <Weather />
                        <TaskList />
                    </Stack>
                </Stack>

                <AppColumn />
            </box>
        </window>
    );
}
