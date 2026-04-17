import { execAsync } from "ags/process";
import Tile from "../primitives/Tile";
import Stack from "../primitives/Stack";
import IconButton from "../primitives/IconButton";

const APPS = [
    { icon: "", cmd: "firefox", tooltip: "Firefox" },
    { icon: "", cmd: "telegram-desktop", tooltip: "Telegram" },
    { icon: "", cmd: "code", tooltip: "VSCode" },
    { icon: "", cmd: "kitty", tooltip: "Terminal" },
    { icon: "", cmd: "dolphin", tooltip: "Files" },
    { icon: "", cmd: "spotify", tooltip: "Music" },
];

export default function AppColumn() {
    return (
        <Tile class="app-tile" vexpand>
            <Stack orientation="v" spacing={14} halign="center" valign="center">
                {APPS.map((a) => (
                    <IconButton
                        icon={a.icon}
                        tooltip={a.tooltip}
                        onClick={() => execAsync(a.cmd)}
                    />
                ))}
            </Stack>
        </Tile>
    );
}
