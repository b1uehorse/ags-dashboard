import Tile from "../primitives/Tile";

export default function Quote() {
    return (
        <Tile class="quote-tile">
            <label cssClasses={["quote-text"]} label="— placeholder —" />
        </Tile>
    );
}
