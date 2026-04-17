import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import Hyprland from "gi://AstalHyprland";
import { createBinding } from "ags";

const hypr = Hyprland.get_default();

export default function WorkspaceDots() {
    const focused = createBinding(hypr, "focusedWorkspace");
    const workspaces = createBinding(hypr, "workspaces");

    return (
        <window
            visible
            name="ws-dots"
            namespace="ags-ws-dots"
            application={app}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.BOTTOM}
            marginBottom={8}
        >
            <box cssClasses={["ws-dots"]} spacing={6}>
                {workspaces((list: any[]) =>
                    list
                        .sort((a, b) => a.id - b.id)
                        .map((ws) => (
                            <button
                                cssClasses={focused((f: any) =>
                                    f?.id === ws.id ? ["ws-dot", "active"] : ["ws-dot"]
                                )}
                                onClicked={() => hypr.dispatch("workspace", String(ws.id))}
                            >
                                <label label="●" />
                            </button>
                        ))
                )}
            </box>
        </window>
    );
}
