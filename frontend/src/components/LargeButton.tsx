type Props = {
    name: string;
}

export function AuthenticateButton({ name }: Props) {
    return (
    <button
    type="submit"
    className="relative w-full flex items-center justify-center gap-2 mt-2"
    style={{
        background: '#c9a84c',
        color: '#0a0a0a',
        height: '52px',
        borderRadius: '50px',
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.02em',
    }}
    >
    {name} <span aria-hidden>→</span>
    </button>
    )
}
