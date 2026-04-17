// Snippet: новый тайл с реактивной метрикой.
// Скопировать в src/widgets/MyTile.tsx, подставить своё.

import Tile from "../primitives/Tile";
import { createPoll } from "ags";

// polling-команда: что угодно возвращающее одну строку/число
const myValue = createPoll(0, 2000, "echo 42");

export default function MyTile() {
    return (
        <Tile class="mytile">
            <label cssClasses={["mytile-label"]} label="Title" />
            <label cssClasses={["mytile-value"]} label={myValue((v: any) => `${v}%`)} />
        </Tile>
    );
}

// + в style.scss:
// .mytile { min-width: 120px; }
// .mytile-label { color: $muted; font-size: $font-sm; }
// .mytile-value { color: $fg; font-size: $font-lg; }
