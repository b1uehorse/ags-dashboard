import { Gtk } from "ags/gtk4";

type StackProps = {
    orientation?: "h" | "v";
    spacing?: number;
    class?: string;
    hexpand?: boolean;
    vexpand?: boolean;
    halign?: "start" | "center" | "end" | "fill";
    valign?: "start" | "center" | "end" | "fill";
    children?: any;
};

const ALIGN = {
    start: Gtk.Align.START,
    center: Gtk.Align.CENTER,
    end: Gtk.Align.END,
    fill: Gtk.Align.FILL,
};

export default function Stack({
    orientation = "v",
    spacing = 0,
    class: cls = "",
    hexpand = false,
    vexpand = false,
    halign = "fill",
    valign = "fill",
    children,
}: StackProps) {
    return (
        <box
            cssClasses={cls.split(" ").filter(Boolean)}
            orientation={orientation === "v" ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL}
            spacing={spacing}
            hexpand={hexpand}
            vexpand={vexpand}
            halign={ALIGN[halign]}
            valign={ALIGN[valign]}
        >
            {children}
        </box>
    );
}
