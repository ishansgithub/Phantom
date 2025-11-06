import AuthForm from '../components/AuthForm';

const Register = () => {
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
        <AuthForm />
      </div>
    </div>
  );
};

export default Register;