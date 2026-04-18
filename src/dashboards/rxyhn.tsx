import app from "ags/gtk4/app";
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
            title="ags-dashboard"
            name="rxyhn-dashboard"
            application={app}
        >
            <box cssClasses={["dashboard"]} spacing={16}>

                <Stack orientation="v" spacing={10} vexpand halign="fill" valign="fill">
                    <Profile />
                    <Quote vexpand />
                </Stack>

                <Stack orientation="v" spacing={10} homogeneous vexpand>
                    <Stack orientation="h" spacing={10} vexpand>
                        <Stack orientation="v" spacing={10} vexpand>
                            <SystemMeters />
                            <Clock vexpand />
                        </Stack>
                        <Music />
                    </Stack>
                    <Stack orientation="h" spacing={10} vexpand>
                        <Weather />
                        <TaskList />
                    </Stack>
                </Stack>

                <AppColumn />
            </box>
        </window>
    );
}
