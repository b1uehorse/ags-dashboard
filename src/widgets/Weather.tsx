import Tile from "../primitives/Tile";
import Stack from "../primitives/Stack";
import { clockService } from "../services/clock";

export default function Weather() {
    return (
        <Tile class="weather-tile">
            <Stack halign="center" spacing={4}>
                <label cssClasses={["weather-day"]} label={clockService.weekday} />
                <label cssClasses={["weather-icon"]} label="" />
                <label cssClasses={["weather-placeholder"]} label="placeholder" />
                <label cssClasses={["weather-temp"]} label="— °C" />
            </Stack>
        </Tile>
    );
}
