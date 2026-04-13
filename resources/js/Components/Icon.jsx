// resources/js/Components/Icon.jsx

export default function Icon({ name, className = '', ...props }) {
    // Reference the public folder directly
    const spriteUrl = '/sprite.svg'; 

    return (
        <svg className={`icon ${className}`} {...props}>
            <use href={`${spriteUrl}#${name}`} />
        </svg>
    );
}