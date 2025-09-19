import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-white border-t border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        {/* Left side - Copyright and branding */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <p>
            © {currentYear} CEO Final. Dashboard ejecutivo empresarial.
          </p>
          <span className="hidden md:inline text-gray-300">|</span>
          <p className="hidden md:inline flex items-center">
            Hecho con <Heart className="w-4 h-4 text-red-500 mx-1" /> para ejecutivos
          </p>
        </div>

        {/* Right side - Links and version */}
        <div className="flex items-center space-x-6 text-sm">
          {/* Quick Links */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/privacy" 
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Privacidad
            </Link>
            <Link 
              to="/terms" 
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Términos
            </Link>
            <Link 
              to="/support" 
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Soporte
            </Link>
            <a 
              href="/api/docs" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center"
            >
              API
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* Version */}
          <div className="hidden lg:block">
            <span className="text-gray-400 text-xs">
              v1.0.0
            </span>
          </div>
        </div>
      </div>

      {/* Mobile version info */}
      <div className="md:hidden mt-2 text-center">
        <span className="text-gray-400 text-xs">Versión 1.0.0</span>
      </div>
    </footer>
  );
};

