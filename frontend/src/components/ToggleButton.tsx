interface RememberToggleProps {
  checked: boolean;
  onToggle: () => void;
}

export function RememberButton({ checked, onToggle }: RememberToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative w-4 h-4 flex items-center justify-center"
      style={{
        border: `1px solid ${checked ? '#58A6FF' : 'rgba(255,255,255,0.2)'}`,
        background: checked ? '#58A6FF' : 'transparent',
        borderRadius: '2px',
        transition: 'all .2s',
      }}
    >
      {checked ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4 7L8 3" stroke="#0A0A0B" strokeWidth="1.6" strokeLinecap="square" />
        </svg>
      ) : null}
    </button>
  );
}