import { Gtk } from "ags/gtk4";

type TileProps = {
    class?: string;
    orientation?: "horizontal" | "vertical";
    spacing?: number;
    hexpand?: boolean;
    vexpand?: boolean;
    children?: any;
};

export default function Tile({
    class: cls = "",
    orientation = "vertical",
    spacing = 8,
    hexpand = false,
    vexpand = false,
    children,
}: TileProps) {
    return (
        <box
            cssClasses={["tile", ...cls.split(" ").filter(Boolean)]}
            orientation={orientation === "vertical" ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL}
            spacing={spacing}
            hexpand={hexpand}
            vexpand={vexpand}
        >
            {children}
        </box>
    );
}
