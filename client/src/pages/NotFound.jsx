export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen retro-texture" style={{ backgroundColor: 'var(--retro-black)' }}>
            <h1 className="retro-title text-6xl mb-4" style={{ color: 'var(--retro-tan)' }}>404</h1>
            <p className="retro-text text-xl" style={{ color: 'var(--retro-beige)' }}>This page could not be found.</p>
        </div>
    )
}