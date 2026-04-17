import { Astal } from "ags/gtk4";
import type { Accessor } from "ags";

type CircularMeterProps = {
    value: Accessor<number>;
    icon: string;
    size?: number;
    thickness?: number;
    class?: string;
};

export default function CircularMeter({
    value,
    icon,
    size = 56,
    thickness = 6,
    class: cls = "",
}: CircularMeterProps) {
    return (
        <box cssClasses={["meter", ...cls.split(" ").filter(Boolean)]}>
            <Astal.CircularProgress
                cssClasses={["meter-ring"]}
                widthRequest={size}
                heightRequest={size}
                startAt={0.75}
                endAt={0.75}
                inverted={false}
                value={value}
            >
                <label cssClasses={["meter-icon"]} label={icon} />
            </Astal.CircularProgress>
        </box>
    );
}
