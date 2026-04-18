import Tile from "../primitives/Tile";

export default function Quote({ vexpand = false }: { vexpand?: boolean } = {}) {
    return (
        <Tile class="quote-tile" vexpand={vexpand}>
            <label cssClasses={["quote-text"]} label="— placeholder —" />
        </Tile>
    );
}
