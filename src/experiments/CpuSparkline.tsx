import Tile from "../primitives/Tile";
import { systemService } from "../services/system";
import { createState } from "ags";

const MAX = 30;

export default function CpuSparkline() {
    const [history, setHistory] = createState<number[]>([]);

    systemService.cpuUsed((v: any) => {
        setHistory((h) => {
            const next = [...h, v as number];
            return next.length > MAX ? next.slice(-MAX) : next;
        });
        return v;
    });

    return (
        <Tile class="spark-tile">
            <label cssClasses={["spark-title"]} label="CPU" />
            <box cssClasses={["sparkline"]} heightRequest={32} widthRequest={160}>
                {history((arr: number[]) =>
                    arr.map((v) => (
                        <box
                            cssClasses={["spark-bar"]}
                            widthRequest={4}
                            heightRequest={Math.max(1, Math.round((v as number) * 32))}
                            valign={2}
                        />
                    ))
                )}
            </box>
        </Tile>
    );
}
