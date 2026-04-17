import { execAsync } from "ags/process";
import Tile from "../primitives/Tile";
import Stack from "../primitives/Stack";
import IconButton from "../primitives/IconButton";
import { musicService } from "../services/music";

export default function Music() {
    const player = musicService.player;

    return (
        <Tile class="music-tile" vexpand>
            <Stack halign="center" spacing={10}>
                <box cssClasses={["music-cover"]} widthRequest={120} heightRequest={120} />
                <label
                    cssClasses={["music-title"]}
                    label={player((p: any) => p?.title ?? "Nothing Playing")}
                />
                <label
                    cssClasses={["music-artist"]}
                    label={player((p: any) => p?.artist ?? "— offline —")}
                />
                <Stack orientation="h" spacing={12} halign="center">
                    <IconButton icon="" onClick={() => execAsync("playerctl previous")} />
                    <IconButton icon="" onClick={() => execAsync("playerctl play-pause")} />
                    <IconButton icon="" onClick={() => execAsync("playerctl next")} />
                    <IconButton icon="" onClick={() => execAsync("playerctl shuffle Toggle")} />
                </Stack>
            </Stack>
        </Tile>
    );
}
