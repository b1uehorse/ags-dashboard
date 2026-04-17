import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import { execAsync } from "ags/process";
import { createState } from "ags";

export default function QuickCmd() {
    const [text, setText] = createState("");
    const [last, setLast] = createState("");

    const run = (self: any) => {
        const cmd = self.text;
        if (!cmd.trim()) return;
        execAsync(["bash", "-c", cmd])
            .then((out: any) => setLast(String(out).slice(0, 80)))
            .catch((e: any) => setLast(`ERR: ${String(e).slice(0, 80)}`));
        setText("");
        self.text = "";
    };

    return (
        <window
            visible
            name="quickcmd"
            namespace="ags-quickcmd"
            application={app}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.BOTTOM}
            marginBottom={40}
            keymode={Astal.Keymode.ON_DEMAND}
        >
            <box cssClasses={["quickcmd"]} orientation={1} spacing={4}>
                <entry
                    cssClasses={["quickcmd-input"]}
                    placeholderText=">_ quick cmd (Enter exec, Esc close)..."
                    onActivate={run}
                    widthRequest={420}
                />
                <label cssClasses={["quickcmd-out"]} label={last} halign={1} />
            </box>
        </window>
    );
}
