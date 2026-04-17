/**
 * Пример виджета, привязанного к конкретному workspace Hyprland.
 *
 * Стратегия: обычное окно (XDG top-level), без layer-shell, с уникальным class/title,
 * ловится Hyprland windowrule по title и кладётся на нужный workspace.
 *
 * В hyprland.conf:
 *   windowrule = float, title:^(ags-pinned-ws2)$
 *   windowrule = workspace 2 silent, title:^(ags-pinned-ws2)$
 *   windowrule = pin, title:^(ags-pinned-ws2)$
 *   windowrule = nodim, title:^(ags-pinned-ws2)$
 *   windowrule = noborder, title:^(ags-pinned-ws2)$
 */

import app from "ags/gtk4/app";
import Tile from "../primitives/Tile";
import { clockService } from "../services/clock";

export default function PinnedWidget({ workspace = 2 }: { workspace?: number } = {}) {
    return (
        <window
            visible
            title={`ags-pinned-ws${workspace}`}
            name={`ags-pinned-ws${workspace}`}
            application={app}
        >
            <Tile class="pinned-tile">
                <label label={`workspace ${workspace}`} />
                <label label={clockService.time} />
            </Tile>
        </window>
    );
}
