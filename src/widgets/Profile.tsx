import GLib from "gi://GLib";
import Tile from "../primitives/Tile";
import Avatar from "../primitives/Avatar";
import Stack from "../primitives/Stack";

const AVATAR_PATH = `${GLib.get_home_dir()}/.config/ags/assets/profile.png`;

export default function Profile() {
    return (
        <Tile class="profile-tile" vexpand>
            <Stack spacing={10} halign="center">
                <Avatar path={AVATAR_PATH} size={72} />
                <label cssClasses={["profile-name"]} label="bekh" />
                <label cssClasses={["profile-host"]} label="betrayersCurse" />
            </Stack>
        </Tile>
    );
}
