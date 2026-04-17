type IconButtonProps = {
    icon: string;
    onClick?: () => void;
    tooltip?: string;
    class?: string;
};

export default function IconButton({ icon, onClick, tooltip, class: cls = "" }: IconButtonProps) {
    return (
        <button
            cssClasses={["icon-btn", ...cls.split(" ").filter(Boolean)]}
            tooltipText={tooltip}
            onClicked={onClick}
        >
            <label label={icon} />
        </button>
    );
}
