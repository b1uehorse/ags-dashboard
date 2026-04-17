import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import { musicService } from "../services/music";

export default function NowPlayingTicker() {
    const p = musicService.player;
    return (
        <window
            visible
            name="np-ticker"
            namespace="ags-np"
            application={app}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
            marginTop={8}
            marginRight={16}
        >
            <box cssClasses={["np-ticker"]} spacing={8}>
                <label cssClasses={["np-icon"]} label="" />
                <label
                    cssClasses={["np-text"]}
                    label={p((pl: any) => pl ? `${pl.artist} — ${pl.title}` : "— silence —")}
                />
            </box>
        </window>
    );
}
