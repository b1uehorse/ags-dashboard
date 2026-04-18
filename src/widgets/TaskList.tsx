import Tile from "../primitives/Tile";
import Stack from "../primitives/Stack";
import { tasksService } from "../services/tasks";
import { systemService } from "../services/system";

function Row({ icon, value }: { icon: string; value: any }) {
    return (
        <Stack orientation="h" spacing={8}>
            <label cssClasses={["task-icon"]} label={icon} />
            <label cssClasses={["task-text"]} label={value} />
        </Stack>
    );
}

export default function TaskList() {
    return (
        <Tile class="task-tile" hexpand>
            <Stack spacing={6}>
                <label cssClasses={["task-header"]} label="Next: " halign="start" />
                <label cssClasses={["task-next"]} label={tasksService.next} halign="start" />
                <Row icon="★" value={tasksService.highPriority((n: any) => `${n} high priority, ${n} total`)} />
                <Row icon="⏱" value={systemService.uptime} />
                <Row icon="≡" value={tasksService.total((t: any) => `${t} tasks logged`)} />
                <Row icon="◆" value={systemService.diskFree} />
            </Stack>
        </Tile>
    );
}
