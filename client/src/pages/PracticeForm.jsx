import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Info } from 'lucide-react';
import { getAttempt, submitAttempt } from '../api';
import { ImprovementBanner } from '../components/ImprovementBanner';
import { DifficultyBadge } from '../components/AttemptStatusBadge';
import { LoadingPage, LoadingSpinner } from '../components/ui/States';

const FIELDS = [
  {
    key: 'requirements',
    label: 'Requirements / Assumptions',
    hint: 'List what the system must do. State any assumptions you are making about scope, scale, or context.',
    placeholder: 'e.g.\n- System must support multiple vehicle types (Motorcycle, Car, Bus)\n- Assuming single-site deployment, no distributed requirements\n- Fee calculation is time-based with configurable rates',
    rows: 6,
    required: true,
  },
  {
    key: 'classes',
    label: 'Classes / Entities',
    hint: 'List the main classes/entities in your design. One per line or comma-separated.',
    placeholder: 'e.g.\nParkingLot, Floor, ParkingSpot, Vehicle, Ticket, AllocationStrategy, FeeCalculator, PaymentProcessor',
    rows: 4,
    required: true,
  },
  {
    key: 'responsibilities',
    label: 'Class Responsibilities',
    hint: 'For each class, describe what it owns and is responsible for. Avoid God classes.',
    placeholder: 'e.g.\nParkingLot: Manages entry/exit flow, coordinates with AllocationStrategy\nParkingSpot: Tracks its own occupancy state, knows its type and location\nTicket: Immutable value object, stores vehicle, spot, and entry time\n...',
    rows: 8,
    required: true,
  },
  {
    key: 'relationships',
    label: 'Relationships',
    hint: 'How do classes interact? Use composition, aggregation, dependency, or association language.',
    placeholder: 'e.g.\nParkingLot HAS-MANY Floors\nFloor HAS-MANY ParkingSpots\nParkingLot USES AllocationStrategy (dependency injection)\nTicket references ParkingSpot and Vehicle (association)',
    rows: 6,
    required: true,
  },
  {
    key: 'interfaces',
    label: 'Interfaces / Abstractions',
    hint: 'Define interfaces and abstract classes. What contracts do they enforce? Why?',
    placeholder: 'e.g.\ninterface IAllocationStrategy { ParkingSpot allocate(Vehicle v, List<Floor> floors); }\ninterface IFeeCalculator { BigDecimal calculate(Ticket t); }\nAbstract Vehicle with abstract method getRequiredSpotType()',
    rows: 6,
    required: true,
  },
  {
    key: 'patterns',
    label: 'Design Patterns',
    hint: 'Which patterns did you use? Name them and explain WHY they fit here.',
    placeholder: 'e.g.\nStrategy — for AllocationStrategy (NearestFirst, RandomAllocation). Allows changing algorithm without modifying ParkingLot.\nFactory — VehicleFactory.create(type) maps string to concrete Vehicle subclass.\nSingleton — ParkingLot (only one lot instance in the system)',
    rows: 6,
    required: true,
  },
  {
    key: 'edgeCases',
    label: 'Edge Cases',
    hint: 'What edge cases did you consider? How does your design handle them?',
    placeholder: 'e.g.\n1. Lot full: ParkingLot.entry() returns NO_SPOT_AVAILABLE status\n2. Invalid ticket on exit: TicketValidator throws InvalidTicketException\n3. Concurrent allocation: synchronized spot reservation prevents double-booking\n4. Power failure: ticket issued only after spot marked occupied (atomic)\n5. Vehicle tries to enter twice: existing active ticket detected',
    rows: 6,
    required: true,
  },
  {
    key: 'explanation',
    label: 'Design Explanation & Trade-offs',
    hint: 'Explain your key decisions. What alternatives did you consider? What trade-offs did you make?',
    placeholder: 'e.g.\nI chose to separate AllocationStrategy from ParkingLot because the allocation algorithm is likely to change independently (e.g., prioritize accessible spots, nearest-to-exit). This follows OCP.\n\nTrade-off: Adding a Strategy interface adds a layer of indirection, which increases complexity for simple cases. However, for this system, the configurability benefit outweighs the cost...',
    rows: 8,
    required: true,
  },
  {
    key: 'optionalCode',
    label: 'Optional: Code Snippets',
    hint: 'Add any code to illustrate your key classes or interfaces. This is optional.',
    placeholder: '// Optional — paste key class definitions, interfaces, or method signatures',
    rows: 8,
    required: false,
  },
];

const PracticeForm = () => {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [problem, setProblem] = useState(null);
  const [previousImprovements, setPreviousImprovements] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAttempt(attemptId);
        setAttempt(data.attempt);
        setProblem(data.attempt.problemId);
        // If this is a retry, load previous priority improvements
        if (data.previousEvaluation?.priorityImprovements) {
          setPreviousImprovements(data.previousEvaluation.priorityImprovements);
        }
        // If already submitted, redirect to evaluation
        if (['SUBMITTED', 'EVALUATING', 'COMPLETED', 'FAILED'].includes(data.attempt.status)) {
          navigate(`/attempts/${attemptId}/evaluation`, { replace: true });
        }
      } catch (err) {
        setSubmitError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, navigate]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    FIELDS.filter((f) => f.required).forEach((f) => {
      if (!formData[f.key] || formData[f.key].trim().length < 20) {
        newErrors[f.key] = `Please provide more detail (at least a few sentences)`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error
      const firstErrorKey = FIELDS.find((f) => errors[f.key])?.key;
      if (firstErrorKey) {
        document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitAttempt(attemptId, formData);
      navigate(`/attempts/${attemptId}/evaluation`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingPage message="Loading practice form..." />;

  const completedFields = FIELDS.filter((f) => f.required && formData[f.key]?.trim().length >= 20).length;
  const totalRequired = FIELDS.filter((f) => f.required).length;
  const progress = Math.round((completedFields / totalRequired) * 100);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            {problem && <DifficultyBadge difficulty={problem.difficulty} />}
            <h1 className="text-2xl font-bold text-white mt-2">
              {problem?.title || 'Practice'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Fill all 8 sections to describe your design</p>
          </div>
          {/* Progress */}
          <div className="card px-4 py-3 text-right flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1">{completedFields}/{totalRequired} sections</p>
            <div className="w-32 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Previous improvements banner */}
      <ImprovementBanner improvements={previousImprovements} />

      {/* Info bar */}
      <div className="flex items-start gap-2 text-sm text-gray-400 bg-brand-900/20 border border-brand-800/30 rounded-lg p-4 mb-8">
        <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
        <p>
          Write your design in natural language. No code required — focus on <em>what</em> each class does, 
          <em>why</em> you made each decision, and <em>how</em> classes interact.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            id={`field-${field.key}`}
            className={`card p-6 transition-all duration-200 ${
              errors[field.key] ? 'border-red-500/40' : formData[field.key]?.trim().length >= 20 ? 'border-emerald-500/20' : ''
            }`}
          >
            <label className="form-label">
              {field.label}
              {field.required ? (
                <span className="text-brand-400 ml-1">*</span>
              ) : (
                <span className="text-gray-600 ml-2 font-normal">(optional)</span>
              )}
            </label>
            <p className="form-hint mb-3">{field.hint}</p>
            <textarea
              className="form-textarea"
              rows={field.rows}
              placeholder={field.placeholder}
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
            {errors[field.key] && (
              <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors[field.key]}
              </div>
            )}
            {/* Character count for long fields */}
            <div className="text-right text-xs text-gray-600 mt-1">
              {(formData[field.key] || '').length} chars
            </div>
          </div>
        ))}

        {/* Submit error */}
        {submitError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between py-4 border-t border-white/[0.06]">
          <p className="text-sm text-gray-500">
            {completedFields < totalRequired
              ? `${totalRequired - completedFields} required sections need more content`
              : '✓ All required sections filled'}
          </p>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                Submitting...
              </>
            ) : (
              <>
                Submit Design
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticeForm;
