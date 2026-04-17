import Battery from "gi://AstalBattery";
import Wp from "gi://AstalWp";
import { createBinding, createPoll } from "ags";

const batt = Battery.get_default();
const wp = Wp.get_default();

export const systemService = {
    batteryPercent: createBinding(batt, "percentage"),
    batteryCharging: createBinding(batt, "charging"),
    batteryAvailable: createBinding(batt, "isPresent"),

    volume: wp ? createBinding(wp.audio.defaultSpeaker, "volume") : null,
    volumeMuted: wp ? createBinding(wp.audio.defaultSpeaker, "mute") : null,

    ramUsed: createPoll(0, 2000, "awk '/MemTotal/{t=$2} /MemAvailable/{a=$2} END{print (t-a)/t}' /proc/meminfo"),
    cpuUsed: createPoll(0, 2000, "bash -c \"top -bn1 | awk '/Cpu/{print (100-\\$8)/100; exit}'\""),

    brightness: createPoll(0.5, 3000, "bash -c 'b=$(brightnessctl g 2>/dev/null || echo 50); m=$(brightnessctl m 2>/dev/null || echo 100); echo \"scale=2; $b/$m\" | bc'"),

    uptime: createPoll("", 60_000, "bash -c \"uptime -p | sed s/up.//\""),
    diskFree: createPoll("", 30_000, "bash -c \"df -h / | awk 'NR==2{print \\$4\\\" / \\\"\\$2}'\""),
};
