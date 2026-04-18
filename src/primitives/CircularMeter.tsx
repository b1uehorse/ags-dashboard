import Stack from "./Stack";
import type { Accessor } from "ags";

type CircularMeterProps = {
    value: Accessor<number>;
    icon: string;
    size?: number;
    class?: string;
};

export default function CircularMeter({
    value,
    icon,
    size = 56,
    class: cls = "",
}: CircularMeterProps) {
    return (
        <Stack
            class={`meter ${cls}`}
            orientation="v"
            spacing={2}
            halign="center"
            valign="center"
        >
            <label cssClasses={["meter-icon"]} label={icon} />
            <label
                cssClasses={["meter-value"]}
                label={value((v: any) => `${Math.round((v as number) * 100)}%`)}
            />
            <levelbar
                cssClasses={["meter-bar"]}
                widthRequest={size}
                heightRequest={4}
                minValue={0}
                maxValue={1}
                value={value}
            />
        </Stack>
    );
}
