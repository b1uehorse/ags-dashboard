type AvatarProps = {
    path: string;
    size?: number;
    class?: string;
};

export default function Avatar({ path, size = 72, class: cls = "" }: AvatarProps) {
    return (
        <box
            cssClasses={["avatar", ...cls.split(" ").filter(Boolean)]}
            widthRequest={size}
            heightRequest={size}
            css={`background-image: url("${path}"); background-size: cover; background-position: center; border-radius: ${size}px;`}
        />
    );
}
