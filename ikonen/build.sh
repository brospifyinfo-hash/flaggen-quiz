#!/usr/bin/env bash
# Baut aus ikonen/svg/*.svg die Farbschrift public/fonts/Ikonen.woff2 (COLRv0).
# Voraussetzungen: python3, `pip install nanoemoji fonttools brotli`
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"

python3 generate.py svg
rm -rf build && mkdir -p build
nanoemoji --color_format glyf_colr_0 --family "Weltwissen Ikonen" \
  --output_file Ikonen.ttf --build_dir build svg/*.svg >/dev/null 2>build/nanoemoji.log || {
  tail -30 build/nanoemoji.log; exit 1; }

mkdir -p ../public/fonts
python3 - <<'EOF'
from fontTools.ttLib import TTFont
f = TTFont('build/Ikonen.ttf')
f.flavor = 'woff2'
f.save('../public/fonts/Ikonen.woff2')
cmap = f.getBestCmap()
print(f"{len(f['CPAL'].palettes[0])} Farben, {len(f.getGlyphOrder())} Glyphen, {len(cmap)} direkte Zeichen")
EOF
ls -la ../public/fonts/Ikonen.woff2
