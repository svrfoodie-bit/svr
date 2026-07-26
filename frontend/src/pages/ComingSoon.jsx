import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title = 'Coming Soon', description = 'This feature is under development and will be available soon.' }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-primary-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary">
        Go Back
      </button>
    </div>
  );
};

export default ComingSoon;
