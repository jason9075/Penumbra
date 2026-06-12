/* ── SVG helpers ── */
const arrow = (x1, y1, x2, y2, c = 'var(--warm)', op = 0.75) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-opacity="${op}" stroke-width="1.5" marker-end="url(#ah)"/>`;

const radialArrows = (n, r0, r1, c = 'var(--warm)') =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return arrow(
      +(Math.cos(a) * r0).toFixed(1), +(Math.sin(a) * r0).toFixed(1),
      +(Math.cos(a) * r1).toFixed(1), +(Math.sin(a) * r1).toFixed(1),
      c,
    );
  }).join('');

const SVG_DEFS = `<defs>
  <marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
    <path d="M0,0 L6,3 L0,6 Z" fill="var(--warm)" fill-opacity="0.8"/>
  </marker>
</defs>`;

/* ── Light source dataset ── */
export const LIGHT_DATA = [
  {
    id: 'distant',
    name: 'Distant',
    subtitle: 'Directional / Sun Light',
    icon: '◈',
    heroSvg: `<svg viewBox="-24 -24 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="0" cy="-12" r="4" fill="currentColor" opacity="0.6"/>
      <line x1="-16" y1="-8" x2="16" y2="14"/>
      <line x1="-8" y1="-8" x2="8" y2="14"/>
      <line x1="0" y1="-8" x2="0" y2="14"/>
      <line x1="8" y1="-8" x2="-8" y2="14"/>
      <line x1="16" y1="-8" x2="-16" y2="14"/>
    </svg>`,
    shape: 'Infinite plane — light rays travel in perfect parallel with zero divergence and zero distance attenuation.',
    uses: ['Sunlight & moonlight', 'Outdoor fill light', 'Key light from large distance'],
    params: [
      { id: 'angle', label: 'Angle', unit: '°', min: -90, max: 90, default: 45 },
    ],
    table: {
      shape: 'Infinite plane',
      direction: 'Unidirectional parallel',
      attenuation: 'None',
      shadowEdge: 'Sharp',
      use: 'Sun, moon',
    },
    miniSvg: `<svg viewBox="-32 -32 64 64" fill="none" stroke="var(--mist)" stroke-width="1">
      <circle cx="-18" cy="-18" r="5" fill="var(--warm)" stroke="none" opacity="0.7"/>
      ${[[-12,-12,20,20],[- 4,-18,28,14],[- 20,-6,12,26]].map(([x1,y1,x2,y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--warm)" opacity="0.5"/>`
      ).join('')}
      <line x1="-28" y1="24" x2="28" y2="24" stroke="var(--mist)" opacity="0.4"/>
    </svg>`,
    anatomySvg: `<svg viewBox="-120 -90 240 180" fill="none">
      ${SVG_DEFS}
      <circle cx="-70" cy="-50" r="16" fill="var(--warm)" opacity="0.85"/>
      ${[[-54,-50,80,30],[-54,-34,80,46],[-54,-66,80,14]].map(([x1,y1,x2,y2]) =>
        arrow(x1,y1,x2,y2)
      ).join('')}
      <line x1="-100" y1="62" x2="100" y2="62" stroke="var(--mist)" stroke-width="1.5"/>
      <text x="0" y="78" text-anchor="middle" font-size="10" fill="var(--mist)" font-family="monospace">no attenuation · parallel rays</text>
    </svg>`,
    mathEn: `<p>A directional light simulates an infinitely distant source. Every ray shares the same direction vector $\\hat{d}$, so surface irradiance is purely angle-dependent:</p>
      <p>$$E = L_i \\cdot \\max(0,\\;\\hat{n} \\cdot (-\\hat{d}))$$</p>
      <p>$L_i$ is radiance and $\\hat{n}$ is the surface normal. <strong>No distance attenuation</strong> — a surface 1 m or 1 km away receives identical irradiance.</p>
      <p>The sun qualifies because its distance (~150 million km) dwarfs any scene scale, making the subtended solid angle effectively zero.</p>`,
    mathZh: `<p>平行光模擬無限遠的光源，所有光線共用同一方向向量 $\\hat{d}$，表面照度僅取決於入射角：</p>
      <p>$$E = L_i \\cdot \\max(0,\\;\\hat{n} \\cdot (-\\hat{d}))$$</p>
      <p>$L_i$ 為輻射率，$\\hat{n}$ 為表面法向量。<strong>無距離衰減</strong> — 距離 1 m 或 1 km 的表面接收相同的照度。</p>
      <p>太陽光線幾乎完全平行，因為日地距離（約 1.5 億 km）遠大於任何場景尺度，對應的立體角趨近於零。</p>`,
  },

  {
    id: 'sphere',
    name: 'Sphere',
    subtitle: 'Point / Omni Light',
    icon: '●',
    heroSvg: `<svg viewBox="-24 -24 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="0" cy="0" r="4" fill="currentColor" opacity="0.7"/>
      ${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,x=Math.cos(a)*18,y=Math.sin(a)*18;return `<line x1="${+(Math.cos(a)*5).toFixed(1)}" y1="${+(Math.sin(a)*5).toFixed(1)}" x2="${+x.toFixed(1)}" y2="${+y.toFixed(1)}"/>`}).join('')}
    </svg>`,
    shape: 'A sphere radiating in all directions (360°). Intensity falls off with the inverse square of distance; a larger emitter radius widens the penumbra, softening shadow edges. At radius 0 it degenerates into an ideal point light with perfectly hard shadows.',
    uses: ['Bulbs & lamps', 'Candle / flame', 'Explosion flash'],
    params: [
      { id: 'intensity', label: 'Intensity', unit: '', min: 1, max: 20, step: 0.5, default: 5 },
      { id: 'radius', label: 'Radius', unit: ' m', min: 0, max: 0.5, step: 0.05, default: 0.2 },
      { id: 'posX', label: 'Position X', unit: ' m', min: -2.5, max: 2.5, step: 0.1, default: 1.6 },
    ],
    table: {
      shape: 'Point / sphere',
      direction: 'Omnidirectional 360°',
      attenuation: 'Inverse square',
      shadowEdge: 'Hard → soft with radius',
      use: 'Bulb, flame',
    },
    miniSvg: `<svg viewBox="-32 -32 64 64" fill="none">
      <circle cx="0" cy="0" r="5" fill="var(--warm)" opacity="0.85"/>
      <circle cx="0" cy="0" r="14" stroke="var(--warm)" stroke-opacity="0.2" stroke-width="1"/>
      <circle cx="0" cy="0" r="24" stroke="var(--warm)" stroke-opacity="0.1" stroke-width="1"/>
      ${Array.from({length:6},(_,i)=>{const a=i*Math.PI/3,x=Math.cos(a)*26,y=Math.sin(a)*26;return `<line x1="${+(Math.cos(a)*7).toFixed(1)}" y1="${+(Math.sin(a)*7).toFixed(1)}" x2="${+x.toFixed(1)}" y2="${+y.toFixed(1)}" stroke="var(--warm)" stroke-opacity="0.4" stroke-width="1"/>`}).join('')}
    </svg>`,
    anatomySvg: `<svg viewBox="-110 -110 220 220" fill="none">
      ${SVG_DEFS}
      <circle cx="0" cy="0" r="12" fill="var(--warm)" opacity="0.9"/>
      <circle cx="0" cy="0" r="35" stroke="var(--warm)" stroke-opacity="0.2" stroke-dasharray="4 3"/>
      <circle cx="0" cy="0" r="70" stroke="var(--warm)" stroke-opacity="0.1" stroke-dasharray="4 3"/>
      ${radialArrows(8, 14, 68)}
      <text x="0" y="92" text-anchor="middle" font-size="10" fill="var(--mist)" font-family="monospace">I ∝ 1/r²</text>
    </svg>`,
    mathEn: `<p>A point light obeys the <strong>inverse-square law</strong>. Irradiance at distance $r$:</p>
      <p>$$E(r) = \\frac{\\Phi}{4\\pi r^2}$$</p>
      <p>where $\\Phi$ is total luminous flux. Doubling the distance <em>quarters</em> the irradiance.</p>
      <p>Three.js encodes this with the <code>decay</code> parameter — setting <code>decay = 2</code> matches physical behaviour:</p>
      <pre><code class="language-js">const light = new THREE.PointLight(color, intensity, distance, 2);</code></pre>
      <p>A <strong>point light is the limit case of a sphere light</strong>: as the emitter radius $R \\to 0$, the source subtends zero solid angle from any occluder, the penumbra width $w \\approx R \\cdot d_2 / d_1$ collapses, and shadows become perfectly hard. Any $R > 0$ lets the occluder partially block the source, producing a penumbra that widens with $R$.</p>`,
    mathZh: `<p>點光源遵循<strong>平方反比定律</strong>，距離 $r$ 處的照度：</p>
      <p>$$E(r) = \\frac{\\Phi}{4\\pi r^2}$$</p>
      <p>$\\Phi$ 為總光通量。距離加倍，照度變為四分之一。</p>
      <p>Three.js 以 <code>decay</code> 參數控制衰減，設為 2 即符合物理定律：</p>
      <pre><code class="language-js">const light = new THREE.PointLight(color, intensity, distance, 2);</code></pre>
      <p><strong>Point Light 其實是球形光源的極限情況</strong>：當發光體半徑 $R \\to 0$，光源對任何遮蔽物的立體角趨近於零，半影寬度 $w \\approx R \\cdot d_2 / d_1$ 隨之消失，陰影邊緣完全銳利。只要 $R > 0$，遮蔽物就只能「部分遮住」光源，形成隨 $R$ 變寬的半影。</p>`,
  },

  {
    id: 'rect',
    name: 'Rect',
    subtitle: 'Rectangular Area Light',
    icon: '▬',
    heroSvg: `<svg viewBox="-24 -24 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="-14" y="-8" width="10" height="16" rx="1"/>
      <line x1="-4" y1="-6" x2="18" y2="-6"/>
      <line x1="-4" y1="0" x2="18" y2="0"/>
      <line x1="-4" y1="6" x2="18" y2="6"/>
      <line x1="-4" y1="-8" x2="20" y2="-12"/>
      <line x1="-4" y1="8" x2="20" y2="12"/>
    </svg>`,
    shape: 'A flat rectangular surface emitting light forward. Physically it produces soft shadows and wide even illumination — typical of a softbox. Note: three.js has no shadow support for area lights, so this demo casts no shadow.',
    uses: ['Softbox / key light', 'Monitor glow', 'Illuminated panel'],
    params: [
      { id: 'width', label: 'Width', unit: ' m', min: 0.5, max: 5, step: 0.1, default: 2.5 },
      { id: 'height', label: 'Height', unit: ' m', min: 0.5, max: 4, step: 0.1, default: 2 },
    ],
    table: {
      shape: 'Rectangle',
      direction: 'Unidirectional',
      attenuation: 'Yes',
      shadowEdge: 'Soft (no three.js support)',
      use: 'Softbox, screen',
    },
    miniSvg: `<svg viewBox="-32 -32 64 64" fill="none">
      <rect x="-28" y="-14" width="10" height="28" rx="1" stroke="var(--warm)" stroke-opacity="0.6" fill="var(--warm)" fill-opacity="0.12"/>
      ${[[-14,-10,24,-14],[-14,0,28,0],[-14,10,24,14]].map(([x1,y1,x2,y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--warm)" stroke-opacity="0.4" stroke-width="1"/>`
      ).join('')}
    </svg>`,
    anatomySvg: `<svg viewBox="-120 -90 240 180" fill="none">
      ${SVG_DEFS}
      <rect x="-100" y="-50" width="24" height="100" rx="2" fill="var(--warm)" fill-opacity="0.15" stroke="var(--warm)" stroke-opacity="0.8"/>
      ${[[-76,-40,80,-55],[-76,-20,80,-20],[-76,0,80,15],[-76,20,80,40],[-76,40,80,55]].map(([x1,y1,x2,y2]) =>
        arrow(x1,y1,x2,y2)
      ).join('')}
      <text x="0" y="76" text-anchor="middle" font-size="10" fill="var(--mist)" font-family="monospace">uniform · soft penumbra</text>
    </svg>`,
    mathEn: `<p>A rect area light has a finite emitting surface $A = w \\times h$. Irradiance at a point $P$ is computed by integrating over the surface:</p>
      <p>$$E(P) = \\int_A L_e \\frac{\\cos\\theta_e\\,\\cos\\theta_r}{\\pi r^2}\\,dA$$</p>
      <p>$\\theta_e$ is the emission angle from the light surface, $\\theta_r$ is the reception angle at $P$. This integral produces naturally soft penumbra — the shadow softness grows with distance from the receiver.</p>
      <p>Three.js implements this via <code>RectAreaLight</code> + <code>RectAreaLightUniformsLib</code> using LTC (Linearly Transformed Cosines) approximation.</p>
      <p><strong>Limitation:</strong> LTC evaluates the surface integral analytically for direct lighting only — there is no shadow-map implementation for area lights, so <code>RectAreaLight</code> casts no shadows and <code>castShadow</code> has no effect. Area-light shadows require integrating occluder visibility over the emitting surface, which real-time renderers approximate with multiple shadow-mapped sample lights (as this app's Sphere demo does) or ray tracing.</p>`,
    mathZh: `<p>矩形面光源有有限的發光面積 $A = w \\times h$，點 $P$ 的照度需對面積積分：</p>
      <p>$$E(P) = \\int_A L_e \\frac{\\cos\\theta_e\\,\\cos\\theta_r}{\\pi r^2}\\,dA$$</p>
      <p>$\\theta_e$ 為發光面的出射角，$\\theta_r$ 為 $P$ 點的接收角。此積分自然產生柔和半影——陰影柔化程度隨距離增加而增大。</p>
      <p>Three.js 透過 <code>RectAreaLight</code> + LTC（線性變換餘弦）近似法實現此效果。</p>
      <p><strong>限制：</strong>LTC 只解析計算直接光照，three.js 沒有面光源的 shadow map 實作，因此 <code>RectAreaLight</code> 不會投射陰影（<code>castShadow</code> 無效）。面光源陰影需要對發光面上的遮蔽可見性做積分，即時渲染通常以多顆帶陰影的取樣光源近似（如本站 Sphere demo 的做法）或改用光線追蹤。</p>`,
  },

  {
    id: 'cylinder',
    name: 'Cylinder',
    subtitle: 'Linear / Tube Light',
    icon: '⬡',
    heroSvg: `<svg viewBox="-24 -24 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="-18" y1="0" x2="18" y2="0" stroke-width="2.5"/>
      ${Array.from({length:5},(_,i)=>{const x=-12+i*6;return `<line x1="${x}" y1="0" x2="${x}" y2="16"/><line x1="${x}" y1="0" x2="${x}" y2="-16"/>`}).join('')}
    </svg>`,
    shape: 'A tube emitting light radially along its length — this demo simulates a fluorescent tube. Axial ends emit almost nothing. Shadows are soft along the axis even at radius 0 (an ideal line light); increasing the radius thickens the emitter and softens shadows across the axis too.',
    uses: ['Fluorescent tubes', 'Neon / LED strips', 'Backlit panel edges'],
    params: [
      { id: 'radius', label: 'Radius', unit: ' m', min: 0, max: 0.25, step: 0.01, default: 0.05 },
      { id: 'rotation', label: 'Rotation', unit: '°', min: 0, max: 180, default: 0 },
      { id: 'posX', label: 'Position X', unit: ' m', min: -2.5, max: 2.5, step: 0.1, default: 0 },
    ],
    table: {
      shape: 'Cylinder',
      direction: 'Radial (no axial)',
      attenuation: 'Yes',
      shadowEdge: 'Soft along axis · radius softens across',
      use: 'Fluorescent, neon',
    },
    miniSvg: `<svg viewBox="-32 -32 64 64" fill="none">
      <line x1="-22" y1="0" x2="22" y2="0" stroke="var(--chalk)" stroke-opacity="0.7" stroke-width="2.5"/>
      ${[-16,-8,0,8,16].map(x =>
        `<line x1="${x}" y1="0" x2="${x}" y2="20" stroke="var(--warm)" stroke-opacity="0.4" stroke-width="1"/>` +
        `<line x1="${x}" y1="0" x2="${x}" y2="-20" stroke="var(--warm)" stroke-opacity="0.4" stroke-width="1"/>`
      ).join('')}
    </svg>`,
    anatomySvg: `<svg viewBox="-120 -80 240 160" fill="none">
      ${SVG_DEFS}
      <line x1="-90" y1="0" x2="90" y2="0" stroke="var(--chalk)" stroke-opacity="0.9" stroke-width="3"/>
      <rect x="-90" y="-6" width="180" height="12" rx="3" fill="var(--warm)" fill-opacity="0.12"/>
      ${[-70,-42,-14,14,42,70].map(x =>
        arrow(x,-2,x,-60) + arrow(x,2,x,60)
      ).join('')}
      <text x="-100" y="0" dominant-baseline="middle" font-size="9" fill="var(--mist)" font-family="monospace" text-anchor="middle">no end</text>
      <text x="100" y="0" dominant-baseline="middle" font-size="9" fill="var(--mist)" font-family="monospace" text-anchor="middle">light</text>
      <text x="0" y="76" text-anchor="middle" font-size="10" fill="var(--mist)" font-family="monospace">radial emission only</text>
    </svg>`,
    mathEn: `<p>A cylinder light emits only in the radial direction. Its emission follows a <strong>directional cosine distribution</strong> perpendicular to the tube axis $\\hat{a}$:</p>
      <p>$$L(\\hat{\\omega}) = L_0\\,\\max(0,\\;\\hat{\\omega} \\cdot \\hat{n}_\\perp)$$</p>
      <p>where $\\hat{n}_\\perp$ is the normal from the tube surface to the emitted direction. This produces characteristic long-streak highlights and direction-dependent shadows — shadow is sharp across the tube but soft along it.</p>
      <p>The tube <strong>radius</strong> controls the second axis of softness: at $R = 0$ the source is an ideal line, so shadows stay hard across the axis while the tube length alone softens them along it. A thicker tube ($R > 0$) subtends a wider angle from every occluder, widening the penumbra across the axis as well — the same $w \\approx R \\cdot d_2/d_1$ relation as the sphere light, applied per direction. This demo approximates the tube with shadow-mapped sample lights distributed along the axis and pushed outward by $R$.</p>`,
    mathZh: `<p>圓柱光源僅向徑向發射，其發射遵循垂直管軸 $\\hat{a}$ 的<strong>方向性餘弦分布</strong>：</p>
      <p>$$L(\\hat{\\omega}) = L_0\\,\\max(0,\\;\\hat{\\omega} \\cdot \\hat{n}_\\perp)$$</p>
      <p>$\\hat{n}_\\perp$ 為管面到發射方向的法向量。這產生特有的長條形高光，以及方向性陰影——垂直管軸方向陰影清晰，平行方向柔和。</p>
      <p>管子的<strong>半徑</strong>控制第二個方向的柔化：$R = 0$ 時光源是理想線光源（日光燈管的極限近似），垂直管軸方向的陰影完全銳利，僅管長讓平行方向變柔。$R > 0$ 時管身對每個遮蔽物張出更大的立體角，垂直方向的半影也隨之變寬——與球形光源相同的 $w \\approx R \\cdot d_2/d_1$ 關係，只是按方向分別作用。本 demo 以沿軸分佈、再依 $R$ 向外推開的帶陰影取樣光源來近似管狀發光體。</p>`,
  },

  {
    id: 'dome',
    name: 'Dome',
    subtitle: 'Hemisphere / Environment Light',
    icon: '◠',
    heroSvg: `<svg viewBox="-24 -24 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M-18 8 A18 18 0 0 1 18 8"/>
      ${Array.from({length:7},(_,i)=>{const a=Math.PI*(i+1)/8,x=Math.cos(a)*18,y=Math.sin(a)*18,cx=Math.cos(a)*8,cy=Math.sin(a)*8;return `<line x1="${+x.toFixed(1)}" y1="${+(-y).toFixed(1)}" x2="${+cx.toFixed(1)}" y2="${+(-cy).toFixed(1)}"/>`}).join('')}
    </svg>`,
    shape: 'The surrounding environment itself is the light source: every pixel of a panoramic image contributes radiance from its direction. This demo uses real HDRI environment maps (CC0, Poly Haven) via image-based lighting — diffuse and specular both come from the image.',
    uses: ['HDRI environment', 'Overcast sky', 'Ambient fill'],
    params: [
      {
        id: 'preset',
        label: 'Environment',
        type: 'preset',
        options: [
          { value: 'neutral', label: 'Indoor' },
          { value: 'sunset', label: 'Sunset' },
          { value: 'night', label: 'Night' },
        ],
        default: 'neutral',
      },
      { id: 'intensity', label: 'Intensity', unit: '', min: 0, max: 3, step: 0.1, default: 1 },
      { id: 'tilt', label: 'Rotation', unit: '°', min: 0, max: 360, step: 1, default: 0 },
    ],
    table: {
      shape: 'Hemisphere',
      direction: 'Inward from upper half',
      attenuation: 'None',
      shadowEdge: 'Extremely soft / none',
      use: 'HDRI, sky light',
    },
    miniSvg: `<svg viewBox="-32 -32 64 64" fill="none">
      <path d="M-24 4 A24 24 0 0 1 24 4" stroke="var(--chalk)" stroke-opacity="0.5" stroke-width="1"/>
      ${Array.from({length:5},(_,i)=>{const a=Math.PI*(i+1)/6,x=Math.cos(a)*22,y=-Math.sin(a)*22,tx=Math.cos(a)*10,ty=-Math.sin(a)*10;return `<line x1="${+x.toFixed(1)}" y1="${+y.toFixed(1)}" x2="${+tx.toFixed(1)}" y2="${+ty.toFixed(1)}" stroke="var(--warm)" stroke-opacity="0.4" stroke-width="1"/>`}).join('')}
    </svg>`,
    anatomySvg: `<svg viewBox="-110 -110 220 180" fill="none">
      ${SVG_DEFS}
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stop-color="var(--warm)" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#88AAFF" stop-opacity="0.25"/>
        </radialGradient>
      </defs>
      <path d="M-90 10 A90 90 0 0 1 90 10" fill="url(#skyGrad)" stroke="var(--chalk)" stroke-opacity="0.4"/>
      ${Array.from({length:9},(_,i)=>{const a=Math.PI*(i+0.5)/9,x=Math.cos(a)*88,y=-Math.sin(a)*88,tx=Math.cos(a)*32,ty=-Math.sin(a)*32;return arrow(+x.toFixed(1),+y.toFixed(1),+tx.toFixed(1),+ty.toFixed(1),'#88AAFF',0.6)}).join('')}
      <circle cx="0" cy="10" r="20" fill="var(--ink)" stroke="var(--chalk)" stroke-opacity="0.3"/>
      <line x1="-90" y1="10" x2="90" y2="10" stroke="var(--mist)" stroke-opacity="0.3"/>
      <text x="0" y="55" text-anchor="middle" font-size="10" fill="var(--mist)" font-family="monospace">uniform upper-hemisphere</text>
    </svg>`,
    mathEn: `<p>A dome light integrates incoming radiance over the upper hemisphere. Using the rendering equation for a diffuse receiver:</p>
      <p>$$L_o = \\int_{\\Omega^+} L_i(\\hat{\\omega}_i)\\,f_r\\,\\cos\\theta_i\\,d\\omega_i$$</p>
      <p>For a uniform dome of radiance $L_{sky}$, this simplifies to $L_o = \\pi\\,L_{sky}\\,f_r$ — every visible surface receives an equal contribution from the sky. No directionality means <strong>no sharp shadows</strong>; only soft ambient occlusion remains.</p>
      <p>This demo implements the general case — <strong>image-based lighting (IBL)</strong>: $L_i(\\hat{\\omega}_i)$ is sampled from a real HDRI panorama assigned to <code>scene.environment</code>. Three.js prefilters the map (PMREM) so roughness maps to a blur level, giving both diffuse irradiance and glossy reflections. Like all environment lights in a rasterizer, it <strong>casts no shadows</strong> — production scenes pair an HDRI with one shadow-mapped <code>DirectionalLight</code> aligned to the sun.</p>
      <p><strong>Three.js IBL setup:</strong></p>
      <pre><code class="language-js">import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const loader = new RGBELoader();
const texture = await loader.loadAsync('scene.hdr');
texture.mapping = THREE.EquirectangularReflectionMapping;

// Drives both diffuse irradiance and specular reflections on
// MeshStandardMaterial / MeshPhysicalMaterial
scene.environment = texture;

// Optional: also use the panorama as the visible background
scene.background = texture;

// Fine-tune without reloading the texture (r163+)
scene.environmentIntensity = 1.0;
scene.environmentRotation.set(0, Math.PI / 2, 0); // rotate sun position
</code></pre>
      <p>Three.js automatically runs <code>PMREMGenerator</code> on the first frame to produce a prefiltered mip chain. Each mip level corresponds to a roughness value — roughness 0 samples the sharpest mip (mirror reflection), roughness 1 samples the most blurred (fully diffuse).</p>`,
    mathZh: `<p>穹頂光源對上半球的入射輻射進行積分。對於漫反射接收面，使用渲染方程：</p>
      <p>$$L_o = \\int_{\\Omega^+} L_i(\\hat{\\omega}_i)\\,f_r\\,\\cos\\theta_i\\,d\\omega_i$$</p>
      <p>對於均勻穹頂輻射 $L_{sky}$，化簡為 $L_o = \\pi\\,L_{sky}\\,f_r$ — 所有可見表面從天空獲得相同貢獻。無方向性意味著<strong>無清晰陰影</strong>，只剩下柔和的環境光遮蔽。</p>
      <p>本 demo 實作的是一般情況——<strong>影像式照明（IBL）</strong>：$L_i(\\hat{\\omega}_i)$ 直接取樣自指定給 <code>scene.environment</code> 的真實 HDRI 全景圖。Three.js 會對貼圖做預過濾（PMREM），讓粗糙度對應到模糊層級，同時提供漫反射照度與光澤反射。如同所有 rasterizer 的環境光，它<strong>不投射陰影</strong>——實務上會搭配一顆對齊太陽方位、帶 shadow map 的 <code>DirectionalLight</code>。</p>
      <p><strong>Three.js IBL 設置方式：</strong></p>
      <pre><code class="language-js">import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const loader = new RGBELoader();
const texture = await loader.loadAsync('scene.hdr');
texture.mapping = THREE.EquirectangularReflectionMapping;

// 同時驅動 MeshStandardMaterial / MeshPhysicalMaterial 的漫反射與鏡面反射
scene.environment = texture;

// 可選：也作為可見背景
scene.background = texture;

// 不重新載入貼圖即可微調（r163+）
scene.environmentIntensity = 1.0;
scene.environmentRotation.set(0, Math.PI / 2, 0); // 旋轉太陽位置
</code></pre>
      <p>Three.js 會在第一幀自動執行 <code>PMREMGenerator</code>，產生預過濾的 mip chain。每個 mip 層級對應一個粗糙度值——roughness 0 取樣最銳利的 mip（鏡面反射），roughness 1 取樣最模糊的 mip（完全漫反射）。</p>`,
  },
];
