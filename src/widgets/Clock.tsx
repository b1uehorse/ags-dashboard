import Tile from "../primitives/Tile";
import Stack from "../primitives/Stack";
import { clockService } from "../services/clock";

export default function Clock({ vexpand = false }: { vexpand?: boolean } = {}) {
    return (
        <Tile class="clock-tile" vexpand={vexpand}>
            <Stack halign="center" spacing={2}>
                <label cssClasses={["clock-time"]} label={clockService.time} />
                <label cssClasses={["clock-date"]} label={clockService.date} />
            </Stack>
        </Tile>
    );
}
