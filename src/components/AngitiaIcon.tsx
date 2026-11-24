import { useId } from "react"

/**
 * Angitia AI icon — bold beating heart with live ECG sweep and multi-point telemetry dots.
 * Heart pumps with realistic lub-dub rhythm synced to the R-wave spike.
 * Features a bolder outline, thicker ECG line, and 13 synchronized biometric telemetry dots.
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
          41%      { transform: scale(1.02); } /* brief diastole    */
          49%      { transform: scale(1.10); } /* dub — T-wave      */
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

        /* ── Main Lead Dot: flares on R-wave / lub ── */
        @keyframes dot${u} {
          0%,100% { opacity: .45; r: 2.2; }
          33%      { opacity: 1;   r: 3.8; }
          55%      { opacity: .45; r: 2.2; }
        }
        .dot${u} { animation: dot${u} 1s ease-in-out infinite; }

        /* ── R-Peak Dot: sharp pulse on systole ── */
        @keyframes dotR${u} {
          0%,100% { opacity: .5; r: 2.6; }
          33%      { opacity: 1;  r: 4.2; }
          50%      { opacity: .5; r: 2.6; }
        }
        .dotR${u} { animation: dotR${u} 1s ease-in-out infinite; }

        /* ── T-Wave Dot: pulse on diastole ── */
        @keyframes dotT${u} {
          0%,100% { opacity: .45; r: 2.2; }
          49%      { opacity: 1;   r: 3.5; }
          70%      { opacity: .45; r: 2.2; }
        }
        .dotT${u} { animation: dotT${u} 1s ease-in-out infinite; }

        /* ── Contour Satellite Dots: gentle breathing shimmer ── */
        @keyframes dotC${u} {
          0%,100% { opacity: .55; transform: scale(1);    }
          33%      { opacity: .95; transform: scale(1.2);  }
          49%      { opacity: .75; transform: scale(1.08); }
        }
        .dotC${u} {
          transform-box: fill-box;
          transform-origin: center;
          animation: dotC${u} 1s ease-in-out infinite;
        }

        /* ── Outer glow ring on beat ── */
        @keyframes ring${u} {
          0%,100% { opacity: 0;   r: 3.5; }
          33%      { opacity: .6; r: 7.5; }
          55%      { opacity: 0;  r: 11;  }
        }
        .ring${u} { animation: ring${u} 1s ease-out infinite; }
      `}</style>

      <defs>
        {/* Clip ECG and interior telemetry nodes to heart interior */}
        <clipPath id={`hc${u}`}>
          <path d={heart} />
        </clipPath>

        {/* Soft radial glow for glowing dots */}
        <radialGradient id={`rg${u}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pulseColor} stopOpacity="1" />
          <stop offset="100%" stopColor={pulseColor} stopOpacity="0" />
        </radialGradient>

        {/* Soft inner heart tint for depth and boldness */}
        <linearGradient id={`hbg${u}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pulseColor} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* ── Beating Heart: Outline & Soft Inner Depth (Bolder 5px stroke) ── */}
      <g className={`hb${u}`}>
        {/* Subtle translucent fill so heart has physical presence */}
        <path d={heart} fill={`url(#hbg${u})`} />

        {/* Bold outer contour */}
        <path
          d={heart}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ── Biometric Contour Dots (Satellite nodes on lobes and perimeter) ── */}
        {/* Upper left lobe dot */}
        <circle className={`dotC${u}`} cx="32" cy="25" r="2.6" fill={pulseColor} />
        {/* Upper right lobe dot */}
        <circle className={`dotC${u}`} cx="68" cy="25" r="2.6" fill={pulseColor} />
        {/* Central notch accent dot */}
        <circle className={`dotC${u}`} cx="50" cy="21" r="2.2" fill={pulseColor} />
        {/* Left cardiac flank dot */}
        <circle className={`dotC${u}`} cx="21" cy="38" r="2.4" fill={pulseColor} />
        {/* Right cardiac flank dot */}
        <circle className={`dotC${u}`} cx="79" cy="38" r="2.4" fill={pulseColor} />
        {/* Lower left curve dot */}
        <circle className={`dotC${u}`} cx="34" cy="57" r="2.3" fill={pulseColor} />
        {/* Lower right curve dot */}
        <circle className={`dotC${u}`} cx="66" cy="57" r="2.3" fill={pulseColor} />
        {/* Apex bottom tip anchor dot */}
        <circle className={`dotC${u}`} cx="50" cy="71" r="2.8" fill={pulseColor} />
      </g>

      {/* ── Scrolling ECG Wave (Bolder 3.8px stroke, clipped inside heart) ── */}
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
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </g>

      {/* ── Synchronized ECG Telemetry Dots (Clipped inside heart) ── */}
      <g clipPath={`url(#hc${u})`}>
        {/* 1. ECG Entry baseline node */}
        <circle cx="22" cy="49" r="2.2" fill={pulseColor} opacity="0.8" />

        {/* 2. R-Wave peak spike dot (lub pulse) */}
        <circle
          className={`dotR${u}`}
          cx="39.5"
          cy="27"
          r="3.5"
          fill={pulseColor}
        />
        <circle
          cx="39.5"
          cy="27"
          r="6"
          fill={`url(#rg${u})`}
          opacity="0.75"
        />

        {/* 3. S-Wave trough node */}
        <circle cx="43.5" cy="60" r="2.2" fill={pulseColor} opacity="0.8" />

        {/* 4. T-Wave crest dot (dub pulse) */}
        <circle
          className={`dotT${u}`}
          cx="55"
          cy="43.5"
          r="2.8"
          fill={pulseColor}
        />

        {/* 5. Right Monitor Lead Trace Dot with expanding radar ring */}
        <circle
          className={`ring${u}`}
          cx="76"
          cy={ecgOriginY}
          fill={pulseColor}
        />
        <circle
          className={`dot${u}`}
          cx="76"
          cy={ecgOriginY}
          r="6"
          fill={`url(#rg${u})`}
        />
        <circle
          className={`dot${u}`}
          cx="76"
          cy={ecgOriginY}
          r="3"
          fill={pulseColor}
        />
      </g>
    </svg>
  )
}
