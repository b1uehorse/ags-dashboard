import app from "ags/gtk4/app";
import { Astal, Gtk } from "ags/gtk4";
import Tile from "../primitives/Tile";
import IconButton from "../primitives/IconButton";

export default function RxyhnDashboard() {
    return (
        <window
            visible
            name="rxyhn-dashboard"
            namespace="ags-dashboard"
            application={app}
            layer={Astal.Layer.BOTTOM}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            marginTop={120}
            marginLeft={240}
            exclusivity={Astal.Exclusivity.IGNORE}
            keymode={Astal.Keymode.NONE}
        >
            <box cssClasses={["dashboard"]} spacing={10}>
                <Tile class="profile-tile" vexpand>
                    <label label="bekh" cssClasses={["profile-name"]} />
                    <label label="betrayersCurse" cssClasses={["profile-host"]} />
                </Tile>
                <Tile class="music-tile" vexpand>
                    <label label="Now Playing" />
                    <box spacing={8}>
                        <IconButton icon="" tooltip="prev" />
                        <IconButton icon="" tooltip="play" />
                        <IconButton icon="" tooltip="next" />
                    </box>
                </Tile>
            </box>
        </window>
    );
}
