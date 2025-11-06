import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    
    return (
        <div className="retro-landing relative min-h-screen w-full overflow-hidden">
            {/* CRT Scanlines Effect */}
            <div className="scanlines fixed inset-0 pointer-events-none z-50"></div>
            
            {/* Retro Grid Background */}
            <div className="retro-grid fixed inset-0 opacity-20"></div>
            
            {/* Animated Background Gradient */}
            <div className="retro-bg fixed inset-0"></div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <div className="text-center">
                    <h1 className="retro-title text-9xl md:text-[12rem] font-bold mb-4 retro-text-glow">
                        404
                    </h1>
                    <p className="text-amber-200 text-xl md:text-2xl mb-8 font-mono">
                        PAGE NOT FOUND
                    </p>
                    <p className="text-amber-200/70 text-sm mb-8 font-mono">
                        THIS PAGE COULD NOT BE FOUND
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="retro-btn-primary px-8 py-3 text-sm tracking-wider"
                    >
                        RETURN HOME
                    </button>
                </div>
            </div>
        </div>
    );
}