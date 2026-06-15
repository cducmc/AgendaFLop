/**
 * =============================================================================
 * FOOTER - Componente de Pie de Página
 * =============================================================================
 * 
 * Footer moderno con información de la aplicación:
 * - Nombre y año
 * - Enlaces rápidos
 * - Información de contacto
 * 
 * =============================================================================
 */

import { Calendar, Github, Mail, Heart } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Información de la aplicación */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-gray-900">AgendaFlop</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Sistema moderno de gestión de citas. 
              Organiza tu negocio de forma eficiente y profesional.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/" 
                  className="text-gray-600 hover:text-primary text-sm transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="/appointments" 
                  className="text-gray-600 hover:text-primary text-sm transition-colors"
                >
                  Citas
                </a>
              </li>
              <li>
                <a 
                  href="/calendar" 
                  className="text-gray-600 hover:text-primary text-sm transition-colors"
                >
                  Calendario
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase mb-3">
              Información
            </h4>
            <div className="space-y-2">
              <a 
                href="mailto:support@agendaflop.com"
                className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@agendaflop.com
              </a>
              <a 
                href="#"
                className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm flex items-center justify-center gap-2">
            © {currentYear} AgendaFlop. 
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
