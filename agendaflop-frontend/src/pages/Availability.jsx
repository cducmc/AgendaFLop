import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Trash2, Save, Check } from 'lucide-react';
import { availabilityAPI, professionalsAPI, businessAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const WEEKDAYS = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

function Availability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [professionals, setProfessionals] = useState([]);
  const [rules, setRules] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const [minNoticeHours, setMinNoticeHours] = useState(2);
  const [maxDaysAhead, setMaxDaysAhead] = useState(60);

  const [ruleForm, setRuleForm] = useState({
    professional: '',
    weekdays: [],
    start_time: '09:00',
    end_time: '18:00',
    is_online_bookable: true,
  });

  const [exceptionForm, setExceptionForm] = useState({
    professional: '',
    date: '',
    start_time: '',
    end_time: '',
    exception_type: 'blocked',
    reason: '',
  });

  const professionalMap = useMemo(() => {
    const map = {};
    professionals.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [professionals]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [prosRes, rulesRes, exRes, businessRes] = await Promise.all([
        professionalsAPI.getAll(),
        availabilityAPI.getRules(),
        availabilityAPI.getExceptions(),
        businessAPI.getMy(),
      ]);

      const pros = Array.isArray(prosRes.data) ? prosRes.data : prosRes.data.results || [];
      const rulesData = Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data.results || [];
      const exData = Array.isArray(exRes.data) ? exRes.data : exRes.data.results || [];

      setProfessionals(pros);
      setRules(rulesData);
      setExceptions(exData);
      setMinNoticeHours(businessRes.data.booking_min_notice_hours ?? 2);
      setMaxDaysAhead(businessRes.data.booking_max_days_ahead ?? 60);
    } catch (err) {
      setError('No se pudo cargar la configuración de disponibilidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBusinessWindow = async () => {
    try {
      setSaving(true);
      await businessAPI.update({
        booking_min_notice_hours: Number(minNoticeHours),
        booking_max_days_ahead: Number(maxDaysAhead),
      });
    } catch (err) {
      setError('Error al guardar la ventana de reserva.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (ruleForm.weekdays.length === 0) {
      setError('Selecciona al menos un día de la semana');
      return;
    }
    try {
      // Crear una regla para cada día seleccionado
      for (const weekday of ruleForm.weekdays) {
        const payload = {
          professional: ruleForm.professional || null,
          weekday: Number(weekday),
          start_time: ruleForm.start_time,
          end_time: ruleForm.end_time,
          is_online_bookable: ruleForm.is_online_bookable,
        };
        await availabilityAPI.createRule(payload);
      }
      setRuleForm({
        professional: '',
        weekdays: [],
        start_time: '09:00',
        end_time: '18:00',
        is_online_bookable: true,
      });
      setError('');
      await loadData();
    } catch (err) {
      setError('Error al crear horarios de trabajo.');
    }
  };

  const toggleWeekday = (dayValue) => {
    setRuleForm((s) => {
      const isSelected = s.weekdays.includes(dayValue);
      return {
        ...s,
        weekdays: isSelected
          ? s.weekdays.filter((d) => d !== dayValue)
          : [...s.weekdays, dayValue].sort((a, b) => a - b),
      };
    });
  };

  const applyPreset = (preset) => {
    setRuleForm((s) => ({
      ...s,
      weekdays: preset,
    }));
  };

  const handleDeleteRule = async (id) => {
    try {
      await availabilityAPI.deleteRule(id);
      await loadData();
    } catch (err) {
      setError('Error al eliminar regla.');
    }
  };

  const handleCreateException = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...exceptionForm,
        professional: exceptionForm.professional || null,
        start_time: exceptionForm.start_time || null,
        end_time: exceptionForm.end_time || null,
      };
      await availabilityAPI.createException(payload);
      setExceptionForm({
        professional: '',
        date: '',
        start_time: '',
        end_time: '',
        exception_type: 'blocked',
        reason: '',
      });
      await loadData();
    } catch (err) {
      setError('Error al crear excepción.');
    }
  };

  const handleDeleteException = async (id) => {
    try {
      await availabilityAPI.deleteException(id);
      await loadData();
    } catch (err) {
      setError('Error al eliminar excepción.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Disponibilidad</h1>
            <p className="text-gray-600">Horarios de trabajo, excepciones y ventana de reserva online</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ventana de Reserva</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm text-gray-700">Anticipación mínima (horas)</label>
              <input
                type="number"
                min="0"
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Máximo días a futuro</label>
              <input
                type="number"
                min="1"
                value={maxDaysAhead}
                onChange={(e) => setMaxDaysAhead(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={handleSaveBusinessWindow}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Horarios de Trabajo</h2>
            
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona el profesional</label>
                <select
                  value={ruleForm.professional}
                  onChange={(e) => setRuleForm((s) => ({ ...s, professional: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">General del negocio</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Días de la semana</label>
                
                {/* Presets rápidos */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => applyPreset([0, 1, 2, 3, 4])}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      JSON.stringify(ruleForm.weekdays) === JSON.stringify([0, 1, 2, 3, 4])
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lunes-Viernes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([0, 1, 2, 3, 4, 5])}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      JSON.stringify(ruleForm.weekdays) === JSON.stringify([0, 1, 2, 3, 4, 5])
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lunes-Sábado
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([0, 1, 2, 3, 4, 5, 6])}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      JSON.stringify(ruleForm.weekdays) === JSON.stringify([0, 1, 2, 3, 4, 5, 6])
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lunes-Domingo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([5])}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      JSON.stringify(ruleForm.weekdays) === JSON.stringify([5])
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Solo Sábado
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([6])}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      JSON.stringify(ruleForm.weekdays) === JSON.stringify([6])
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Solo Domingo
                  </button>
                </div>

                {/* Checkboxes individuales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {WEEKDAYS.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={ruleForm.weekdays.includes(day.value)}
                        onChange={() => toggleWeekday(day.value)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Inicio</label>
                  <input
                    type="time"
                    value={ruleForm.start_time}
                    onChange={(e) => setRuleForm((s) => ({ ...s, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Fin</label>
                  <input
                    type="time"
                    value={ruleForm.end_time}
                    onChange={(e) => setRuleForm((s) => ({ ...s, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" /> Agregar para {ruleForm.weekdays.length} día{ruleForm.weekdays.length !== 1 ? 's' : ''}
              </button>
            </form>

            <div className="space-y-2 max-h-80 overflow-auto">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {r.professional_name || 'General'} - {WEEKDAYS.find((d) => d.value === r.weekday)?.label}
                    </div>
                    <div className="text-sm text-gray-600">{r.start_time} - {r.end_time}</div>
                  </div>
                  <button onClick={() => handleDeleteRule(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {rules.length === 0 && <p className="text-sm text-gray-500">Sin horarios. Agrega tu disponibilidad arriba ↑</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Excepciones por Fecha</h2>
            <form onSubmit={handleCreateException} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={exceptionForm.professional}
                onChange={(e) => setExceptionForm((s) => ({ ...s, professional: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">General del negocio</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={exceptionForm.exception_type}
                onChange={(e) => setExceptionForm((s) => ({ ...s, exception_type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="blocked">Bloqueado</option>
                <option value="available">Disponible</option>
              </select>
              <input
                type="date"
                value={exceptionForm.date}
                onChange={(e) => setExceptionForm((s) => ({ ...s, date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                value={exceptionForm.reason}
                onChange={(e) => setExceptionForm((s) => ({ ...s, reason: e.target.value }))}
                placeholder="Motivo"
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="time"
                value={exceptionForm.start_time}
                onChange={(e) => setExceptionForm((s) => ({ ...s, start_time: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="time"
                value={exceptionForm.end_time}
                onChange={(e) => setExceptionForm((s) => ({ ...s, end_time: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 md:col-span-2">
                <Plus className="w-4 h-4" /> Agregar excepción
              </button>
            </form>

            <div className="space-y-2 max-h-80 overflow-auto">
              {exceptions.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {ex.date} - {ex.exception_type === 'blocked' ? 'Bloqueado' : 'Disponible'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {ex.professional_name || 'General'} | {ex.start_time && ex.end_time ? `${ex.start_time} - ${ex.end_time}` : 'Todo el día'}
                      {ex.reason ? ` | ${ex.reason}` : ''}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteException(ex.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {exceptions.length === 0 && <p className="text-sm text-gray-500">No hay excepciones configuradas.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Availability;
