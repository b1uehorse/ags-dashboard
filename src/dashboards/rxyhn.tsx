import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import Stack from "../primitives/Stack";
import Profile from "../widgets/Profile";
import Quote from "../widgets/Quote";
import Clock from "../widgets/Clock";
import SystemMeters from "../widgets/SystemMeters";
import Music from "../widgets/Music";
import Weather from "../widgets/Weather";
import TaskList from "../widgets/TaskList";
import AppColumn from "../widgets/AppColumn";

export default function RxyhnDashboard() {
    return (
        <window
            visible
            name="rxyhn-dashboard"
            namespace="ags-dashboard"
            application={app}
            layer={Astal.Layer.BACKGROUND}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            marginTop={120}
            marginLeft={240}
            exclusivity={Astal.Exclusivity.IGNORE}
            keymode={Astal.Keymode.NONE}
        >
            <box cssClasses={["dashboard"]} spacing={10}>

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
