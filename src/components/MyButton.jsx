"use client";

export default function MyButton() {
  const handleClick = () => {
    alert("Clicked");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        padding: '0.5rem 1rem',
        background: '#111',
        color: '#fff',
        borderRadius: '6px',
        border: '1px solid #222',
        cursor: 'pointer'
      }}
    >
      My Button
    </button>
  );
}
