import { button } from "@/Utils/classes";

export default function PartButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <div
            {...props}
            className={
                `${button}  ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </div>
    );
}
