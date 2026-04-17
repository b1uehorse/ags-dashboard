import Stack from "../primitives/Stack";
import CircularMeter from "../primitives/CircularMeter";
import { systemService } from "../services/system";

export default function SystemMeters() {
    return (
        <Stack orientation="v" spacing={10}>
            <Stack orientation="h" spacing={10}>
                <CircularMeter value={systemService.ramUsed} icon="" />
                <CircularMeter value={systemService.volume ?? systemService.ramUsed} icon="" />
            </Stack>
            <Stack orientation="h" spacing={10}>
                <CircularMeter value={systemService.batteryPercent} icon="" />
                <CircularMeter value={systemService.brightness} icon="" />
            </Stack>
        </Stack>
    );
}
