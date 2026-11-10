import { Check, ShieldAlert, ShieldCheck } from "lucide-react"
import { evaluatePasswordStrength } from "@/utils/passwordStrength"

interface PasswordStrengthIndicatorProps {
  password: string
  showCriteria?: boolean
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  showCriteria = true,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const result = evaluatePasswordStrength(password)

  if (!password) {
    return (
      <div className={`mt-2 space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Password strength</span>
          <span className="font-medium text-gray-400">Required</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-1.5 rounded-none bg-gray-200" />
          <div className="h-1.5 rounded-none bg-gray-200" />
          <div className="h-1.5 rounded-none bg-gray-200" />
        </div>
        <p className="text-[11px] text-gray-500">
          Must turn <strong className="text-emerald-700">green (strong)</strong> to enable confirmation.
        </p>
      </div>
    )
  }

  // Active bar colors
  const barColor =
    result.color === "green"
      ? "bg-emerald-500"
      : result.color === "yellow"
        ? "bg-amber-500"
        : "bg-red-500"

  const textColor =
    result.color === "green"
      ? "text-emerald-600"
      : result.color === "yellow"
        ? "text-amber-600"
        : "text-red-600"

  return (
    <div className={`mt-2 space-y-2 select-none ${className}`}>
      {/* Progress Bars */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Strength check:</span>
          <span className={`font-semibold flex items-center gap-1 ${textColor}`}>
            {result.color === "green" ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Strong (Green)
              </>
            ) : result.color === "yellow" ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Fair (Yellow)
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                Weak (Red)
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div
            className={`h-1.5 rounded-none transition-colors duration-300 ${
              result.score >= 1 ? barColor : "bg-gray-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-none transition-colors duration-300 ${
              result.score >= 2 ? barColor : "bg-gray-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-none transition-colors duration-300 ${
              result.score >= 3 ? barColor : "bg-gray-200"
            }`}
          />
        </div>
      </div>

      {/* Helper message */}
      <p className={`text-[11px] leading-tight ${textColor}`}>
        {result.feedback}
      </p>

      {/* Criteria Checklist Chips */}
      {showCriteria && (
        <div className="pt-1 border-t border-gray-100 flex flex-wrap gap-1.5">
          {result.criteria.map((c) => (
            <span
              key={c.id}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 border rounded-none transition-all ${
                c.satisfied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              {c.satisfied ? (
                <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
              <span>{c.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
