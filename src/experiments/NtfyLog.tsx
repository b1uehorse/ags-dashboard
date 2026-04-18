import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import { createPoll } from "ags/time";

const last = createPoll(
    "",
    10_000,
    "bash -c 'curl -s --max-time 3 ntfy.sh/kk_alert/json?poll=1\\&since=1m | tail -1 | python3 -c \"import sys,json; d=json.loads(sys.stdin.read() or \\\"{}\\\"); print((d.get(\\\"title\\\",\\\"\\\")+\\\": \\\"+d.get(\\\"message\\\",\\\"\\\"))[:80])\" 2>/dev/null'"
);

export default function NtfyLog() {
    return (
        <window
            visible
            name="ntfy-log"
            namespace="ags-ntfy"
            application={app}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
            marginBottom={8}
            marginRight={16}
        >
            <box cssClasses={["ntfy-log"]} spacing={6}>
                <label cssClasses={["ntfy-icon"]} label="" />
                <label cssClasses={["ntfy-text"]} label={last} />
            </box>
        </window>
    );
}
