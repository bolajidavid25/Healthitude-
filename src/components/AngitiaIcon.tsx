import { useId } from "react"

/**
 * Angitia AI icon — beating heart with live ECG sweep.
 * Heart pumps with realistic lub-dub rhythm synced to the R-wave spike.
 * ECG scrolls left like a patient monitor, clipped inside the heart.
 */
export default function AngitiaIcon({
  size = 40,
  color = "#1a3fcf",
  pulseColor = "#0ea5e9",
}: {
  size?: number
  color?: string
  pulseColor?: string
}) {
  const raw = useId()
  const u = "ag" + raw.replace(/[^a-z0-9]/gi, "")

  // Heart outline — centered in 0 0 100 100 viewBox
  const heart =
    "M50,80 C50,80 12,60 12,37 C12,20 26,12 38,12 C44,12 50,18 50,24 C50,18 56,12 62,12 C74,12 88,20 88,37 C88,60 50,80 50,80Z"

  // One ECG cycle = 64 units wide, baseline at y=0
  // P wave (8-16), PQ flat (16-19), QRS complex (19-32), ST+T wave (32-50), TP rest (50-64)
  const ecg =
    "M0,0 L8,0 Q12,-4.5 16,0 L19,0 L21,2.5 L25.5,-22 L29.5,11 L33,0 Q41,-5.5 51,0 L64,0"

  // 3 tiled copies — animation translates -64px per cycle so the pattern loops seamlessly
  const copies = [0, 64, 128]

  // ECG group starts at x=14 in SVG space so the first copy is centred inside the heart
  const ecgOriginX = 14
  const ecgOriginY = 49 // centre height of heart

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>{`
        /* ── Heartbeat: realistic lub-dub ── */
        @keyframes hb${u} {
          0%,100% { transform: scale(1);    }
          33%      { transform: scale(1.16); } /* lub — R-wave peak */
          41%      { transform: scale(1.01); } /* brief diastole    */
          49%      { transform: scale(1.09); } /* dub — T-wave      */
          60%      { transform: scale(1);    } /* resting           */
        }
        .hb${u} {
          transform-box: fill-box;
          transform-origin: center;
          animation: hb${u} 1s cubic-bezier(.36,.07,.19,.97) infinite;
        }

        /* ── ECG sweep: scrolls left like a monitor ── */
        @keyframes es${u} {
          from { transform: translateX(0);     }
          to   { transform: translateX(-64px); }
        }
        .es${u} { animation: es${u} 1s linear infinite; }

        /* ── Dot: flares on R-wave / lub ── */
        @keyframes dot${u} {
          0%,100% { opacity: .35; r: 2;   }
          33%      { opacity: 1;   r: 3.5; }
          55%      { opacity: .35; r: 2;   }
        }
        .dot${u} { animation: dot${u} 1s ease-in-out infinite; }

        /* ── Outer glow ring on beat ── */
        @keyframes ring${u} {
          0%,100% { opacity: 0;   r: 3;  }
          33%      { opacity: .5; r: 6;  }
          50%      { opacity: 0;  r: 9;  }
        }
        .ring${u} { animation: ring${u} 1s ease-out infinite; }
      `}</style>

      <defs>
        {/* Clip ECG to heart interior */}
        <clipPath id={`hc${u}`}>
          <path d={heart} />
        </clipPath>

        {/* Radial glow for the dot */}
        <radialGradient id={`rg${u}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pulseColor} stopOpacity="1" />
          <stop offset="100%" stopColor={pulseColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Beating heart outline ── */}
      <g className={`hb${u}`}>
        <path
          d={heart}
          stroke={color}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </g>

      {/* ── Scrolling ECG, clipped inside heart ── */}
      <g clipPath={`url(#hc${u})`}>
        <g
          className={`es${u}`}
          transform={`translate(${ecgOriginX},${ecgOriginY})`}
        >
          {copies.map((dx) => (
            <path
              key={dx}
              d={ecg}
              transform={`translate(${dx},0)`}
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </g>

      {/* ── Pulsing dot — current trace position (right interior of heart) ── */}
      <g clipPath={`url(#hc${u})`}>
        {/* Outer glow ring */}
        <circle
          className={`ring${u}`}
          cx="76"
          cy={ecgOriginY}
          fill={pulseColor}
        />
        {/* Soft halo */}
        <circle
          className={`dot${u}`}
          cx="76"
          cy={ecgOriginY}
          r="5"
          fill={`url(#rg${u})`}
        />
        {/* Hard centre */}
        <circle
          className={`dot${u}`}
          cx="76"
          cy={ecgOriginY}
          r="2"
          fill={pulseColor}
        />
      </g>
    </svg>
  )
}
