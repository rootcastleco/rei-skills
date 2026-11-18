## Scene 1: Rotor Vibration Analysis: Severity & Physics

- **Slide Copy (EN):** Broad-band RMS velocity measured across 10 Hz - 1000 Hz establishes bearing housing severity [SRC-1]. 1x synchronous unbalance vs 2x misalignment separation prevents blind tear-downs. Physical rotor runs remain NOT VERIFIED until calibrated accelerometer telemetry is logged [SRC-2].
- **Narration (TR):** Birinci bölümde rotor titreşim analizinin temellerini ve ISO 10816-3 ile ISO 20816-1 standartlarına göre on hertz ile bin hertz bandındaki etkin hız eşiklerini inceliyoruz. [SRC-1]

## Scene 2: 4-Channel 10 kHz DAQ & Spectral Leakage Control

- **Slide Copy (EN):** Sample 4 synchronous channels at 10 kHz (f_max = 3.9 kHz with 2.56x anti-alias factor) [SRC-3]. Apply Hanning window with coherent gain compensation before peak RMS integration. Track bearing fault frequencies: BPFO, BPFI, BSF, and cage FTF sidebands [SRC-3].
- **Narration (TR):** İkinci bölümde dört kanallı on kilohertz eşzamanlı örnekleme mimarisini, Hanning pencereleme katsayılarını ve yatak arıza frekanslarını ele alıyoruz. [SRC-3]

## Scene 3: Single-Plane Vector Balancing & Safety Boundary

- **Slide Copy (EN):** Measure initial 1x phasor V0 and trial-weight response V1 at steady shaft speed (e.g., 1,800 RPM) [SRC-2]. Compute complex influence vector A = (V1 - V0) / Wt and correction mass Wc = -V0 / A. Hardware warning: COMPUTATIONAL_ONLY — lockout/tagout and operator signoff mandatory before adding mass [SRC-2].
- **Narration (TR):** Üçüncü bölümde bin sekiz yüz devir dakika hızda deneme kütlesi ile etki katsayısı hesabını ve kilitleme etiketleme güvenlik sınırını inceliyoruz. [SRC-2]
