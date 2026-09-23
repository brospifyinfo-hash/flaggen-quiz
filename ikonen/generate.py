#!/usr/bin/env python3
"""Erzeugt die eigenen Ikonen-SVGs für Weltwissen.

Jedes Zeichen ist ein flaches, rundes Piktogramm im 128×128-Raster ohne
Verläufe, damit nanoemoji daraus eine COLRv0-Farbschrift bauen kann
(siehe ikonen/build.sh). Die Dateinamen folgen dem nanoemoji-Schema
`emoji_u<codepoint>[_<codepoint>…].svg`; U+FE0F wird weggelassen.
"""
from __future__ import annotations

import os
import sys

# ---------------------------------------------------------------- Farben
INK = '#232a36'
DUNKEL = '#3a4250'
GRAU = '#98a2ad'
HELL = '#e3e8ee'
WEISS = '#ffffff'
PAPIER = '#eef1f5'
ROT = '#e04b3f'
ROT2 = '#b8332c'
ORANGE = '#f08a33'
GELB = '#f5c542'
GELB2 = '#d9a021'
GOLD = '#e4a83a'
GRUEN = '#4caf68'
GRUEN2 = '#37874f'
BLAU = '#3d7edb'
BLAU2 = '#2a5fb0'
HIMMEL = '#8fc6f0'
LILA = '#8a5cd6'
ROSA = '#ea6d9d'
TUERKIS = '#2ab3a6'
BRAUN = '#8b5a2b'
BRAUN2 = '#6a4220'
BEIGE = '#e9cfa4'
HAUT = ['#f3c9a2', '#dba576', '#a76a41']
HAAR = {'schwarz': '#2b2320', 'braun': '#6b4326', 'blond': '#e3b64a', 'rot': '#c8622d', 'grau': '#b9bec6', 'weiss': '#eceef1'}


def rr(x, y, w, h, r=0, f=INK, o=None):
    op = f' fill-opacity="{o}"' if o is not None else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{f}"{op}/>'


def ci(cx, cy, r, f=INK, o=None):
    op = f' fill-opacity="{o}"' if o is not None else ''
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{f}"{op}/>'


def el(cx, cy, rx, ry, f=INK, o=None):
    op = f' fill-opacity="{o}"' if o is not None else ''
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{f}"{op}/>'


def pa(d, f=INK, o=None):
    op = f' fill-opacity="{o}"' if o is not None else ''
    return f'<path d="{d}" fill="{f}"{op}/>'


def st(d, s=INK, w=8, o=None):
    op = f' stroke-opacity="{o}"' if o is not None else ''
    return (f'<path d="{d}" fill="none" stroke="{s}" stroke-width="{w}" '
            f'stroke-linecap="round" stroke-linejoin="round"{op}/>')


def pg(pts, f=INK, o=None):
    op = f' fill-opacity="{o}"' if o is not None else ''
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in pts) + ' Z'
    return f'<path d="{d}" fill="{f}"{op}/>'


def ln(x1, y1, x2, y2, s=INK, w=8):
    return st(f'M{x1} {y1} L{x2} {y2}', s, w)


def stern(cx, cy, r, f=GELB, zacken=5, innen=0.45):
    import math
    pts = []
    for i in range(zacken * 2):
        rad = r if i % 2 == 0 else r * innen
        a = -math.pi / 2 + i * math.pi / zacken
        pts.append((round(cx + math.cos(a) * rad, 1), round(cy + math.sin(a) * rad, 1)))
    return pg(pts, f)


def funkel(cx, cy, r, f=GELB):
    k = r * 0.22
    return pa(f'M{cx} {cy - r} Q{cx + k} {cy - k} {cx + r} {cy} Q{cx + k} {cy + k} {cx} {cy + r} '
              f'Q{cx - k} {cy + k} {cx - r} {cy} Q{cx - k} {cy - k} {cx} {cy - r} Z', f)


def ring(cx, cy, r, w, s=INK):
    return st(f'M{cx - r} {cy} a{r} {r} 0 1 0 {2 * r} 0 a{r} {r} 0 1 0 {-2 * r} 0', s, w)


# ---------------------------------------------------------- Menschen
def person(haut=0, haar='braun', frisur='kurz', hemd=BLAU, extras=(), kopf=(), bart=False):
    """Brustbild: Schultern, Hals, Kopf, Frisur. `extras` liegt vor dem Körper, `kopf` auf dem Kopf."""
    h = HAUT[haut]
    hf = HAAR[haar]
    t = [
        pa('M18 122 C18 96 38 86 64 86 C90 86 110 96 110 122 Z', hemd),
        rr(54, 68, 20, 24, 6, h),
        pa('M54 74 C58 84 70 84 74 74 Z', '#000', 0.12),
        ci(64, 52, 24, h),
    ]
    if frisur == 'lang':
        t.insert(1, pa('M36 60 C34 90 40 104 46 108 L82 108 C88 104 94 90 92 60 Z', hf))
        t.append(pa('M40 56 C38 30 90 30 88 56 C82 44 74 40 64 40 C54 40 46 44 40 56 Z', hf))
    elif frisur == 'locken':
        t.append(pa('M38 58 C30 30 98 28 90 58 C88 46 78 38 64 38 C50 38 40 46 38 58 Z', hf))
        for cx, cy in ((40, 46), (48, 36), (60, 30), (72, 31), (84, 38), (90, 48)):
            t.append(ci(cx, cy, 8, hf))
    elif frisur == 'glatze':
        t.append(pa('M42 46 C46 40 54 36 64 36 C74 36 82 40 86 46 C84 42 76 34 64 34 C52 34 44 42 42 46 Z', hf))
    elif frisur == 'bob':
        t.insert(1, pa('M38 56 C36 78 40 90 46 92 L82 92 C88 90 92 78 90 56 Z', hf))
        t.append(pa('M40 58 C38 30 90 30 88 58 C84 46 76 42 64 42 C52 42 44 46 40 58 Z', hf))
    elif frisur == 'dutt':
        t.append(ci(64, 30, 11, hf))
        t.append(pa('M40 56 C38 32 90 32 88 56 C82 44 74 40 64 40 C54 40 46 44 40 56 Z', hf))
    else:  # kurz
        t.append(pa('M40 54 C40 32 88 32 88 54 C84 44 76 40 64 40 C52 40 44 44 40 54 Z', hf))
    if bart:
        t.append(pa('M44 56 C44 74 52 82 64 82 C76 82 84 74 84 56 C80 66 74 70 64 70 C54 70 48 66 44 56 Z', hf))
    # Augen und Mund
    t.append(ci(56, 54, 2.6, INK))
    t.append(ci(72, 54, 2.6, INK))
    t.append(st('M58 63 Q64 68 70 63', INK, 3))
    t.extend(kopf)
    t.extend(extras)
    return t


def helm(f=GELB):
    return [pa('M38 50 C38 28 90 28 90 50 Z', f), rr(34, 48, 60, 8, 4, f), rr(59, 26, 10, 14, 4, f)]


def muetze_koch():
    return [pa('M42 44 C34 44 34 26 46 28 C48 16 80 16 82 28 C94 26 94 44 86 44 Z', PAPIER), st('M42 44 C34 44 34 26 46 28 C48 16 80 16 82 28 C94 26 94 44 86 44 Z', GRAU, 3), rr(42, 42, 44, 8, 2, GRAU)]


def brille():
    return [ring(56, 55, 7, 3, INK), ring(72, 55, 7, 3, INK), ln(63, 55, 65, 55, INK, 3)]


def abzeichen(teile):
    """Kleines Requisit rechts unten vor der Schulter."""
    return teile


def stethoskop():
    return [st('M52 90 C52 104 60 110 68 104', GRAU, 4), ci(70, 104, 5, GRAU), st('M84 92 C84 100 80 104 76 104', GRAU, 4)]


def hut_pilot():
    return [pa('M36 44 C40 30 88 30 92 44 Z', INK), rr(34, 42, 60, 10, 4, '#1c2230'), rr(50, 44, 28, 6, 3, GOLD)]


def hut_absolvent():
    return [pg([(64, 22), (100, 36), (64, 50), (28, 36)], INK), rr(60, 36, 8, 12, 2, INK), rr(88, 42, 4, 16, 2, GOLD), ci(90, 60, 4, GOLD)]


def kochjacke():
    return [st('M18 122 C18 96 38 86 64 86 C90 86 110 96 110 122', GRAU, 3), ci(56, 100, 3, GRAU), ci(56, 112, 3, GRAU), ci(72, 100, 3, GRAU), ci(72, 112, 3, GRAU)]


def kittel():
    return [pa('M64 88 L48 122 L80 122 Z', PAPIER), st('M64 88 L48 122 M64 88 L80 122', GRAU, 2), rr(60, 96, 8, 26, 2, HELL)]


def laptop_klein():
    return [rr(74, 96, 34, 22, 3, DUNKEL), rr(78, 100, 26, 14, 1, HIMMEL)]


def schraubenschluessel_klein():
    return [st('M78 118 L100 96', GRAU, 8), ci(102, 94, 9, GRAU), ci(104, 92, 4, WEISS)]


def kolben_klein():
    return [rr(82, 90, 10, 20, 2, HELL), pa('M80 108 L94 108 L104 122 L70 122 Z', TUERKIS)]


def krawatte(f=ROT):
    return [pg([(60, 90), (68, 90), (70, 112), (64, 120), (58, 112)], f)]


def buch_klein(f=ROT):
    return [rr(78, 96, 30, 22, 3, f), rr(82, 100, 22, 14, 1, HELL)]


def strohhut():
    return [el(64, 44, 38, 8, GELB), pa('M42 44 C42 26 86 26 86 44 Z', GELB2), rr(42, 40, 44, 5, 2, ROT)]


def pinsel_klein():
    return [st('M104 92 L84 112', BRAUN, 6), pa('M82 108 L90 116 L78 122 Z', ROSA)]


def kappe(f=BLAU):
    return [pa('M40 50 C40 30 88 30 88 50 Z', f), rr(60, 48, 40, 7, 3, f)]


# ---------------------------------------------------------- Fahrzeuge
def auto(f=ROT, dach=None, blau=False, lang=False):
    if f == WEISS:
        f = PAPIER
    dach = dach or f
    t = [
        rr(10, 68, 108, 32, 10, f),
        pa('M26 70 C30 52 44 44 64 44 C84 44 98 52 102 70 Z' if not lang else 'M20 70 C22 52 34 44 60 44 L98 44 C104 52 106 60 106 70 Z', dach),
        pa('M36 68 C40 56 50 50 62 50 L62 68 Z', HIMMEL),
        pa('M68 50 C80 50 90 56 94 68 L68 68 Z', HIMMEL),
        ci(34, 100, 13, INK), ci(94, 100, 13, INK), ci(34, 100, 5, GRAU), ci(94, 100, 5, GRAU),
        rr(108, 74, 10, 10, 3, GELB), rr(10, 74, 10, 10, 3, ROT2),
    ]
    if blau:
        t.append(rr(52, 36, 24, 10, 3, BLAU))
    return t


def bus(f=PAPIER, streifen=None):
    t = [rr(8, 40, 112, 60, 10, f), st('M18 40 L110 40 C116 40 120 44 120 50 L120 90 C120 96 116 100 110 100 L18 100 C12 100 8 96 8 90 L8 50 C8 44 12 40 18 40 Z', GRAU if f == PAPIER else f, 3), rr(14, 48, 100, 24, 4, HIMMEL),
         ln(40, 48, 40, 72, f, 4), ln(66, 48, 66, 72, f, 4), ln(92, 48, 92, 72, f, 4),
         ci(32, 100, 12, INK), ci(96, 100, 12, INK), ci(32, 100, 4, GRAU), ci(96, 100, 4, GRAU),
         rr(110, 78, 8, 8, 2, GELB), rr(10, 78, 8, 8, 2, ROT2)]
    if streifen:
        t.append(rr(8, 78, 112, 8, 0, streifen))
    return t


def zug(f=ROT):
    return [pa('M14 100 L14 60 C14 40 30 30 50 30 L114 30 L114 100 Z', f),
            pa('M22 62 C22 48 34 40 50 40 L60 40 L60 62 Z', HIMMEL), rr(68, 40, 18, 22, 3, HIMMEL), rr(92, 40, 16, 22, 3, HIMMEL),
            rr(14, 72, 100, 6, 0, INK, 0.25), rr(8, 100, 112, 10, 3, DUNKEL),
            ci(36, 110, 8, INK), ci(64, 110, 8, INK), ci(92, 110, 8, INK), ci(28, 88, 5, GELB)]


# ---------------------------------------------------------- Gebäude
def fenster(x, y, w=12, h=14, f=HIMMEL):
    return rr(x, y, w, h, 2, f)


def haus(wand=BEIGE, dach=ROT, tuer=BRAUN2, garten=False):
    t = [rr(28, 60, 72, 56, 2, wand), pg([(20, 64), (64, 22), (108, 64)], dach), rr(84, 28, 10, 18, 1, DUNKEL),
         rr(56, 84, 16, 32, 2, tuer), ci(69, 100, 1.8, GELB), fenster(36, 70), fenster(80, 70)]
    if garten:
        t = [ci(22, 90, 16, GRUEN), rr(19, 96, 6, 22, 2, BRAUN)] + t + [rr(10, 112, 108, 8, 3, GRUEN2), rr(72, 106, 8, 6, 1, ROSA), rr(84, 106, 8, 6, 1, GELB)]
    return t


def hochhaus(f=BLAU2, fenster_f=HIMMEL, breite=(30, 68), hoehe=(18, 118), schild=None):
    x0, w = breite
    y0, h = hoehe
    t = [rr(x0, y0, w, h - y0, 3, f)]
    y = y0 + 8
    while y + 12 < h - 16:
        x = x0 + 7
        while x + 10 < x0 + w - 4:
            t.append(rr(x, y, 10, 12, 1.5, fenster_f))
            x += 15
        y += 18
    t.append(rr(x0 + w // 2 - 7, h - 16, 14, 16, 2, DUNKEL))
    if schild:
        t.append(rr(x0 + 8, y0 - 4, w - 16, 12, 3, schild))
    return t


# =============================================================== Zeichen
Z: dict[str, list[str]] = {}


def z(name, *teile):
    flach = [x for grp in teile for x in (grp if isinstance(grp, list) else [grp])]
    Z[name] = [x for x in flach if '-opacity="0.0"' not in x and 'stroke-width="0.0"' not in x]


# ---- Symbole
z('23e9', pg([(14, 30), (64, 64), (14, 98)], BLAU), pg([(60, 30), (112, 64), (60, 98)], BLAU))
z('23f1', rr(56, 10, 16, 12, 3, DUNKEL), rr(88, 20, 14, 8, 3, DUNKEL), ci(64, 72, 46, DUNKEL), ci(64, 72, 38, WEISS),
  st('M64 72 L64 46', INK, 6), st('M64 72 L82 84', ROT, 5), ci(64, 72, 4, INK))
z('23f3', rr(30, 8, 68, 12, 4, BRAUN), rr(30, 108, 68, 12, 4, BRAUN),
  pa('M36 20 L92 20 L92 30 C92 50 70 56 70 64 C70 72 92 78 92 98 L92 108 L36 108 L36 98 C36 78 58 72 58 64 C58 56 36 50 36 30 Z', HIMMEL, 0.7),
  pa('M46 30 L82 30 C82 44 70 50 64 56 C58 50 46 44 46 30 Z', GELB), pa('M40 106 L88 106 C88 92 72 84 64 80 C56 84 40 92 40 106 Z', GELB),
  rr(62, 62, 4, 30, 2, GELB))
z('23f8', rr(30, 22, 24, 84, 8, BLAU), rr(74, 22, 24, 84, 8, BLAU))
z('2600', *[st(f'M64 64 L{64 + 54 * __import__("math").cos(a * 0.7854):.1f} {64 + 54 * __import__("math").sin(a * 0.7854):.1f}', GELB, 9) for a in range(8)],
  ci(64, 64, 42, WEISS), ci(64, 64, 32, GELB))
z('2604', pa('M118 10 C90 20 50 50 14 98 C50 76 80 62 108 46 Z', HIMMEL, 0.8), pa('M118 10 C96 26 60 66 30 108 C66 80 92 60 112 40 Z', GELB, 0.8), ci(32, 96, 20, ORANGE), ci(30, 98, 12, GELB))
z('2615', rr(18, 36, 76, 60, 10, PAPIER), st('M18 46 L18 86 C18 92 24 96 30 96 L82 96 C88 96 94 92 94 86 L94 46', GRAU, 4), rr(18, 36, 76, 16, 6, BRAUN2), st('M94 50 C118 50 118 82 94 82', GRAU, 10), st('M94 50 C114 50 114 82 94 82', PAPIER, 4), rr(12, 100, 96, 12, 6, GRAU),
  st('M40 12 Q48 20 40 28', GRAU, 5), st('M58 8 Q66 18 58 28', GRAU, 5), st('M76 12 Q84 20 76 28', GRAU, 5))
z('2693', ring(64, 22, 10, 7, DUNKEL), rr(60, 30, 8, 70, 4, DUNKEL), rr(36, 44, 56, 8, 4, DUNKEL), st('M22 74 C22 108 106 108 106 74', DUNKEL, 10),
  pg([(12, 78), (32, 70), (28, 90)], DUNKEL), pg([(116, 78), (96, 70), (100, 90)], DUNKEL))
z('2694', st('M22 18 L92 88', HELL, 12), st('M106 18 L36 88', HELL, 12), st('M80 96 L100 76', GOLD, 12), st('M48 96 L28 76', GOLD, 12),
  st('M92 88 L108 104', BRAUN2, 12), st('M36 88 L20 104', BRAUN2, 12))
z('2696', rr(60, 14, 8, 90, 3, GOLD), rr(40, 102, 48, 10, 4, GOLD), rr(20, 30, 88, 8, 4, GOLD), ci(64, 22, 8, GOLD),
  st('M24 34 L12 68', INK, 3), st('M24 34 L36 68', INK, 3), st('M104 34 L92 68', INK, 3), st('M104 34 L116 68', INK, 3),
  pa('M6 68 L42 68 C42 82 6 82 6 68 Z', GOLD), pa('M86 68 L122 68 C122 82 86 82 86 68 Z', GOLD))
z('26a0', pa('M64 12 L120 110 L8 110 Z', GELB), pa('M64 30 L106 102 L22 102 Z', GELB2, 0.35), rr(58, 44, 12, 36, 6, INK), ci(64, 92, 7, INK))
z('26a1', pg([(72, 6), (30, 72), (58, 72), (48, 122), (98, 52), (68, 52)], GELB))
z('26cf', st('M22 106 L88 40', BRAUN, 10), pa('M56 22 C78 14 104 26 116 46 C100 40 84 42 74 58 Z', GRAU), pa('M56 22 C70 20 84 24 96 32 L74 58 Z', HELL))
z('26f0', pg([(6, 112), (50, 30), (94, 112)], DUNKEL), pg([(60, 112), (92, 52), (124, 112)], GRAU),
  pg([(50, 30), (36, 56), (44, 52), (52, 58), (60, 52), (64, 56)], WEISS), pg([(92, 52), (82, 70), (90, 66), (96, 72), (102, 70)], WEISS))
z('26f2', rr(20, 98, 88, 16, 6, GRAU), rr(30, 88, 68, 12, 4, HELL), rr(58, 60, 12, 30, 3, GRAU),
  st('M64 30 C40 34 30 60 34 88', HIMMEL, 6), st('M64 30 C88 34 98 60 94 88', HIMMEL, 6), st('M64 30 L64 60', HIMMEL, 6), ci(64, 26, 8, HIMMEL),
  ci(44, 92, 5, HIMMEL), ci(84, 92, 5, HIMMEL))
z('26fd', rr(18, 22, 64, 92, 6, ROT), rr(26, 30, 48, 30, 3, HIMMEL), rr(12, 110, 76, 10, 4, DUNKEL), rr(38, 70, 24, 8, 3, WEISS),
  st('M82 40 L98 40 L98 90 C98 104 116 104 116 90 L116 50 L106 40', GRAU, 8), rr(102, 34, 14, 12, 3, GRAU))
z('2705', rr(12, 12, 104, 104, 22, GRUEN), st('M36 66 L56 86 L94 44', WEISS, 12))
z('2708', pa('M110 60 C120 60 120 68 110 68 L74 74 L46 112 L34 112 L46 76 L30 78 L18 92 L10 92 L14 66 L10 40 L18 40 L30 54 L46 56 L34 20 L46 20 L74 58 Z', HELL),
  pa('M74 58 L110 60 C118 60 118 62 110 62 L74 64 Z', GRAU))
z('270d', st('M100 20 L52 68', BLAU, 12), pa('M52 68 L40 92 L64 80 Z', HELL), pa('M40 92 L46 84 L48 90 Z', INK),
  pa('M28 100 C36 84 60 90 70 100 C74 112 60 122 44 120 C32 118 22 110 28 100 Z', HAUT[0]), rr(20, 90, 12, 30, 5, HAUT[0]), st('M14 116 L112 116', INK, 4))
z('270f', st('M24 104 L92 36', GELB, 16), st('M92 36 L102 26', ROSA, 16), pa('M22 106 L12 116 L28 110 Z', BEIGE), pa('M12 116 L16 112 L14 110 Z', INK),
  st('M24 104 L92 36', GELB2, 4))
z('2728', funkel(48, 52, 36, GELB), funkel(96, 30, 16, GELB), funkel(96, 92, 20, GELB))
z('2744', *[st(f'M64 64 L{64 + 50 * __import__("math").cos(a * 1.0472):.1f} {64 + 50 * __import__("math").sin(a * 1.0472):.1f}', HIMMEL, 8) for a in range(6)],
  *[ci(64 + 30 * __import__("math").cos(a * 1.0472), 64 + 30 * __import__("math").sin(a * 1.0472), 5, HIMMEL) for a in range(6)],
  ci(64, 64, 10, WEISS))
z('2753', ci(64, 64, 54, ROT), st('M46 50 C46 30 82 30 82 50 C82 62 64 62 64 76', WEISS, 11), ci(64, 96, 7, WEISS))
z('2b1c', rr(14, 14, 100, 100, 14, HELL), rr(24, 24, 80, 80, 8, WEISS))
z('2b50', stern(64, 66, 56, GELB), stern(64, 66, 34, GELB2, innen=0.5))
z('1f0cf', rr(26, 10, 76, 108, 8, WEISS), rr(30, 14, 68, 100, 6, HELL), pa('M64 44 C48 24 26 44 40 64 L64 62 L88 64 C102 44 80 24 64 44 Z', ROT),
  ci(64, 70, 12, HAUT[0]), pg([(50, 80), (78, 80), (64, 104)], LILA), ci(40, 64, 5, GELB), ci(88, 64, 5, GELB), ci(64, 34, 5, GELB))
# ---- Flaggen
z('1f1e9_1f1ea', rr(8, 24, 112, 27, 0, INK), rr(8, 51, 112, 26, 0, ROT), rr(8, 77, 112, 27, 0, GELB))
z('1f1eb_1f1f7', rr(8, 24, 38, 80, 0, BLAU), rr(46, 24, 36, 80, 0, WEISS), rr(82, 24, 38, 80, 0, ROT))
z('1f1ec_1f1e7', rr(8, 24, 112, 80, 0, BLAU2), st('M8 24 L120 104', WEISS, 14), st('M120 24 L8 104', WEISS, 14), st('M8 24 L120 104', ROT, 5), st('M120 24 L8 104', ROT, 5),
  rr(54, 24, 20, 80, 0, WEISS), rr(8, 54, 112, 20, 0, WEISS), rr(58, 24, 12, 80, 0, ROT), rr(8, 58, 112, 12, 0, ROT))
# ---- Natur & Landschaft
z('1f305', rr(8, 12, 112, 68, 6, ORANGE), rr(8, 12, 112, 30, 6, ROSA), ci(64, 74, 26, GELB), rr(8, 74, 112, 44, 6, BLAU), st('M20 92 Q32 86 44 92 T68 92 T92 92 T116 92', HIMMEL, 4))
z('1f306', rr(8, 12, 112, 106, 6, '#5a3a7a'), ci(64, 56, 20, ORANGE), rr(14, 60, 20, 58, 2, INK), rr(40, 44, 16, 74, 2, DUNKEL), rr(62, 70, 24, 48, 2, INK), rr(92, 52, 22, 66, 2, DUNKEL),
  *[rr(x, y, 5, 6, 1, GELB) for x, y in ((18, 66), (26, 78), (44, 50), (48, 66), (66, 76), (76, 90), (96, 58), (104, 72), (98, 88))])
z('1f307', rr(8, 12, 112, 106, 6, ORANGE), rr(8, 12, 112, 40, 6, ROT), ci(64, 66, 22, GELB), rr(8, 80, 112, 38, 6, DUNKEL),
  rr(20, 56, 18, 30, 2, INK), rr(46, 70, 22, 16, 2, INK), rr(78, 48, 14, 38, 2, INK), rr(98, 64, 16, 22, 2, INK))
z('1f30b', pg([(6, 116), (44, 40), (84, 40), (122, 116)], BRAUN2), pa('M44 40 L84 40 L78 56 C72 62 60 60 56 68 Z', ORANGE), pa('M50 40 L78 40 L72 50 C66 54 60 52 56 58 Z', GELB),
  st('M54 40 C50 24 60 18 62 8', GRAU, 8), st('M74 40 C80 30 76 22 84 14', GRAU, 6), ci(48, 22, 5, ROT), ci(88, 28, 4, ROT))
z('1f30d', ci(64, 64, 54, BLAU), pa('M38 30 C50 20 70 22 78 34 C72 44 60 46 56 56 C52 66 36 62 30 54 C26 44 30 36 38 30 Z', GRUEN),
  pa('M76 60 C90 56 102 64 104 78 C98 92 84 100 72 96 C66 86 70 72 76 60 Z', GRUEN), pa('M44 84 C50 80 58 84 56 92 C50 98 42 92 44 84 Z', GRUEN),
  ci(64, 64, 54, WEISS, 0.0))
z('1f310', ci(64, 64, 52, BLAU), ring(64, 64, 50, 4, WEISS), st('M14 64 L114 64', WEISS, 4), st('M64 14 L64 114', WEISS, 4),
  st('M64 14 C36 40 36 88 64 114', WEISS, 4), st('M64 14 C92 40 92 88 64 114', WEISS, 4), st('M22 40 L106 40', WEISS, 4), st('M22 88 L106 88', WEISS, 4))
z('1f31f', ci(64, 64, 58, GELB, 0.25), stern(64, 66, 52, GELB), funkel(104, 24, 12, WEISS), funkel(22, 100, 10, WEISS))
z('1f331', rr(30, 96, 68, 20, 8, BRAUN), st('M64 100 L64 64', GRUEN2, 8), pa('M64 66 C60 44 40 40 26 46 C30 62 46 72 64 66 Z', GRUEN),
  pa('M64 56 C68 36 86 30 100 36 C96 52 82 62 64 56 Z', GRUEN))
z('1f332', pg([(64, 8), (100, 52), (28, 52)], GRUEN2), pg([(64, 30), (110, 82), (18, 82)], GRUEN), pg([(64, 56), (118, 110), (10, 110)], GRUEN2), rr(56, 104, 16, 18, 3, BRAUN))
z('1f333', rr(56, 84, 16, 36, 4, BRAUN), ci(64, 50, 40, GRUEN), ci(36, 64, 24, GRUEN2), ci(92, 64, 24, GRUEN2), ci(64, 44, 26, GRUEN), ci(50, 40, 8, WEISS, 0.2))
z('1f334', st('M64 118 C64 90 68 70 76 50', BRAUN, 10), pa('M76 50 C60 38 34 40 22 54 C40 56 60 54 76 50 Z', GRUEN), pa('M76 50 C92 36 114 40 122 54 C104 56 88 56 76 50 Z', GRUEN),
  pa('M76 50 C70 30 76 14 92 8 C96 24 88 40 76 50 Z', GRUEN2), pa('M76 50 C62 34 44 30 30 34 C42 44 60 52 76 50 Z', GRUEN2), ci(70, 52, 5, BRAUN2), ci(82, 54, 5, BRAUN2),
  el(64, 118, 46, 8, BEIGE))
z('1f338', *[el(64 + 30 * __import__("math").cos(a * 1.2566 - 1.5708), 64 + 30 * __import__("math").sin(a * 1.2566 - 1.5708), 16, 26, ROSA) for a in range(5)], ci(64, 64, 14, GELB),
  *[ci(64 + 30 * __import__("math").cos(a * 1.2566 - 1.5708), 64 + 30 * __import__("math").sin(a * 1.2566 - 1.5708), 6, WEISS, 0.35) for a in range(5)])
z('1f33f', st('M56 118 C60 90 66 62 90 22', GRUEN2, 7), *[pa(f'M{62 + i * 5} {100 - i * 15} C{40 + i * 6} {96 - i * 16} {36 + i * 6} {80 - i * 16} {46 + i * 6} {74 - i * 15} Z', GRUEN) for i in range(4)],
  *[pa(f'M{66 + i * 5} {92 - i * 15} C{88 + i * 4} {90 - i * 16} {94 + i * 4} {74 - i * 16} {84 + i * 4} {68 - i * 15} Z', GRUEN) for i in range(4)])
# ---- Essen
z('1f355', pg([(64, 118), (14, 26), (114, 26)], GELB), pa('M14 26 L114 26 C112 44 16 44 14 26 Z', ROT), pa('M20 38 L108 38 L64 118 Z', GELB, 0.0),
  ci(50, 54, 9, ROT), ci(76, 60, 9, ROT), ci(62, 84, 8, ROT), ci(44, 42, 4, GRUEN2), ci(84, 44, 4, GRUEN2), ci(64, 68, 4, GRUEN2))
z('1f366', pg([(38, 62), (90, 62), (64, 122)], BEIGE), st('M46 74 L78 74 M50 86 L74 86 M56 98 L70 98', BRAUN, 3),
  pa('M40 62 C30 40 40 18 52 26 C56 6 84 6 86 22 C98 16 104 44 90 62 Z', WEISS), pa('M44 60 C36 50 40 34 50 38 C54 24 76 26 78 38 C88 34 92 52 84 60 Z', HELL, 0.6))
z('1f378', pg([(18, 14), (110, 14), (64, 70)], HIMMEL, 0.85), pg([(26, 20), (102, 20), (64, 60)], GELB, 0.5), rr(60, 68, 8, 38, 2, HELL), rr(38, 104, 52, 10, 5, HELL),
  st('M50 40 L90 12', ROT, 4), ci(50, 40, 8, GRUEN), ci(50, 40, 3, ROT))
z('1f37a', rr(24, 40, 68, 76, 8, GELB), st('M92 60 C114 60 114 96 92 96', GRAU, 9), pa('M18 44 C18 16 98 16 98 44 Z', WEISS), ci(34, 30, 12, WEISS), ci(60, 22, 14, WEISS), ci(86, 30, 12, WEISS),
  rr(34, 54, 8, 48, 3, GELB2, 0.5), rr(72, 54, 8, 48, 3, GELB2, 0.5))
z('1f37d', ci(64, 64, 36, WEISS), ring(64, 64, 42, 6, HELL), ci(64, 64, 22, HELL), st('M18 22 L18 106', GRAU, 6), st('M10 22 L10 44 C10 54 26 54 26 44 L26 22', GRAU, 5),
  st('M112 22 L112 106', GRAU, 6), pa('M104 22 C104 40 120 40 120 22 L120 58 L104 58 Z', GRAU))
# ---- Aktivitäten & Objekte
z('1f381', rr(14, 50, 100, 66, 6, ROT), rr(10, 40, 108, 20, 6, ROT2), rr(56, 40, 16, 76, 2, GELB), st('M64 40 C40 40 36 16 50 16 C60 16 62 30 64 40 C66 30 68 16 78 16 C92 16 88 40 64 40', GELB, 7))
z('1f389', pg([(14, 116), (30, 44), (86, 100)], GELB), pg([(14, 116), (24, 64), (70, 106)], ORANGE), st('M20 110 L30 44', GELB2, 3),
  ci(50, 30, 7, ROT), ci(90, 30, 7, BLAU), ci(104, 60, 7, GRUEN), rr(66, 12, 10, 10, 2, LILA), rr(108, 90, 10, 10, 2, ROSA), st('M74 40 Q84 30 94 44 T112 36', ROT, 5), st('M60 20 Q64 8 74 6', TUERKIS, 5))
z('1f392', rr(26, 34, 76, 84, 18, ROT), rr(40, 68, 48, 40, 8, ROT2), rr(48, 80, 32, 22, 4, ROT), st('M46 34 C46 14 82 14 82 34', DUNKEL, 8), rr(36, 46, 56, 14, 6, ROT2), rr(56, 84, 16, 6, 3, GELB))
z('1f393', pg([(64, 20), (120, 46), (64, 72), (8, 46)], INK), pa('M34 60 L34 84 C48 98 80 98 94 84 L94 60 C80 74 48 74 34 60 Z', DUNKEL), st('M112 48 L112 84', GOLD, 4), ci(112, 90, 6, GOLD))
z('1f396', pg([(40, 8), (64, 22), (88, 8), (88, 50), (40, 50)], ROT), rr(54, 8, 20, 42, 0, WEISS), ci(64, 84, 32, GOLD), ci(64, 84, 22, GELB), stern(64, 86, 14, GOLD))
z('1f39a', rr(18, 16, 92, 96, 8, DUNKEL), rr(36, 26, 8, 76, 4, INK), rr(84, 26, 8, 76, 4, INK), rr(26, 40, 28, 16, 4, GRAU), rr(74, 72, 28, 16, 4, GRAU), rr(60, 26, 8, 76, 4, INK), rr(50, 60, 28, 16, 4, GRAU))
z('1f3a7', st('M22 80 L22 62 C22 38 42 20 64 20 C86 20 106 38 106 62 L106 80', DUNKEL, 10), rr(12, 74, 24, 40, 8, ROT), rr(92, 74, 24, 40, 8, ROT), rr(18, 80, 12, 28, 4, ROT2), rr(98, 80, 12, 28, 4, ROT2))
z('1f3a8', pa('M64 12 C30 12 8 36 8 66 C8 92 30 108 50 100 C62 96 56 84 68 82 C82 80 84 96 96 96 C114 96 120 78 120 62 C120 34 96 12 64 12 Z', BEIGE),
  ci(34, 50, 9, ROT), ci(52, 32, 9, GELB), ci(80, 30, 9, GRUEN), ci(100, 48, 9, BLAU), ci(30, 76, 9, LILA))
z('1f3a9', el(64, 94, 52, 14, INK), rr(30, 24, 68, 72, 6, INK), el(64, 24, 34, 8, DUNKEL), rr(30, 76, 68, 10, 0, ROT))
z('1f3ac', rr(14, 52, 100, 62, 6, DUNKEL), pa('M14 30 L112 18 L116 44 L18 56 Z', INK), *[pg([(22 + i * 22, 30 - i * 2.6), (34 + i * 22, 28.5 - i * 2.6), (30 + i * 22, 54 - i * 2.6), (18 + i * 22, 55.5 - i * 2.6)], WEISS) for i in range(4)],
  *[rr(22 + i * 22, 56, 12, 6, 0, WEISS) for i in range(4)], rr(24, 70, 80, 34, 3, HIMMEL, 0.3))
z('1f3ad', pa('M14 34 C14 14 66 14 66 34 C66 70 54 88 40 92 C26 88 14 70 14 34 Z', GELB), pa('M62 44 C62 24 114 24 114 44 C114 80 102 98 88 102 C74 98 62 80 62 44 Z', LILA),
  el(30, 42, 6, 3, INK), el(50, 42, 6, 3, INK), st('M30 66 Q40 74 50 66', INK, 4), el(78, 52, 6, 3, INK), el(98, 52, 6, 3, INK), st('M78 84 Q88 76 98 84', INK, 4))
z('1f3af', ci(64, 64, 54, ROT), ci(64, 64, 42, WEISS), ci(64, 64, 30, ROT), ci(64, 64, 18, WEISS), ci(64, 64, 7, ROT), st('M64 64 L108 20', GRUEN2, 6), pg([(108, 20), (118, 26), (108, 34)], GELB), pg([(108, 20), (102, 10), (114, 10)], GELB))
z('1f3b0', rr(16, 20, 84, 96, 8, ROT), rr(24, 34, 68, 40, 4, WEISS), rr(24, 34, 22, 40, 2, HELL), rr(70, 34, 22, 40, 2, HELL), ci(35, 54, 7, GELB), ci(58, 54, 7, GELB), ci(81, 54, 7, GELB),
  rr(40, 86, 36, 12, 4, GELB), rr(104, 30, 6, 46, 3, GRAU), ci(107, 26, 9, BLAU))
z('1f3b2', rr(14, 14, 100, 100, 18, WEISS), rr(14, 14, 100, 100, 18, INK, 0.0), ci(38, 38, 9, INK), ci(90, 38, 9, INK), ci(64, 64, 9, INK), ci(38, 90, 9, INK), ci(90, 90, 9, INK), ring(64, 64, 50, 4, HELL))
z('1f3c1', rr(14, 10, 8, 110, 4, DUNKEL), rr(22, 14, 92, 60, 2, WEISS), *[rr(22 + x * 23, 14 + y * 15, 23, 15, 0, INK) for x in range(4) for y in range(4) if (x + y) % 2 == 0])
z('1f3c5', pg([(44, 6), (60, 52), (84, 52), (68, 6)], BLAU), pg([(60, 6), (76, 52), (84, 52), (84, 6)], ROT), ci(64, 84, 32, GOLD), ci(64, 84, 24, GELB), stern(64, 86, 16, GOLD))
z('1f3c6', pa('M30 14 L98 14 L98 46 C98 72 82 84 64 84 C46 84 30 72 30 46 Z', GOLD), st('M30 24 C10 24 12 56 34 58', GOLD, 8), st('M98 24 C118 24 116 56 94 58', GOLD, 8),
  rr(58, 82, 12, 18, 2, GOLD), rr(38, 98, 52, 12, 4, BRAUN2), rr(44, 104, 40, 12, 4, BRAUN), rr(36, 18, 12, 40, 4, GELB, 0.6))
z('1f3cb', rr(10, 34, 10, 40, 4, DUNKEL), rr(108, 34, 10, 40, 4, DUNKEL), rr(22, 40, 8, 28, 3, GRAU), rr(98, 40, 8, 28, 3, GRAU), rr(20, 50, 88, 8, 4, GRAU),
  ci(64, 72, 14, HAUT[1]), pa('M42 122 C42 96 52 86 64 86 C76 86 86 96 86 122 Z', BLAU), st('M40 58 L46 90', HAUT[1], 8), st('M88 58 L82 90', HAUT[1], 8), pa('M52 62 C52 50 76 50 76 62 Z', HAAR['schwarz']))
# ---- Gebäude
z('1f3d7', rr(14, 110, 100, 10, 3, DUNKEL), rr(22, 40, 10, 70, 2, GELB), st('M12 40 L110 22', GELB, 8), st('M30 40 L46 24 M46 42 L62 28 M62 40 L78 30', GELB2, 3),
  rr(102, 22, 8, 40, 2, GRAU), rr(96, 62, 20, 14, 3, ORANGE), rr(56, 74, 48, 36, 3, GRAU), rr(62, 80, 10, 10, 1, HIMMEL), rr(78, 80, 10, 10, 1, HIMMEL), rr(62, 96, 10, 10, 1, HIMMEL), rr(78, 96, 10, 10, 1, HIMMEL))
z('1f3d8', rr(10, 66, 44, 46, 2, BEIGE), pg([(6, 68), (32, 40), (58, 68)], ROT), fenster(18, 76, 10, 12), rr(36, 88, 12, 24, 2, BRAUN2),
  rr(58, 58, 60, 54, 2, HELL), pg([(54, 60), (88, 26), (122, 60)], BLAU), fenster(66, 70), fenster(96, 70), rr(80, 86, 16, 26, 2, BRAUN2), rr(6, 110, 116, 8, 3, GRUEN2))
z('1f3d9', rr(8, 40, 22, 78, 2, DUNKEL), rr(34, 20, 26, 98, 2, BLAU2), rr(64, 50, 20, 68, 2, DUNKEL), rr(88, 30, 30, 88, 2, BLAU2),
  *[rr(x, y, 6, 8, 1, HIMMEL) for x, y in ((12, 48), (22, 48), (12, 64), (22, 64), (12, 80), (22, 80), (40, 30), (50, 30), (40, 46), (50, 46), (40, 62), (50, 62), (40, 78), (50, 78), (68, 58), (76, 58), (68, 74), (76, 74), (94, 40), (104, 40), (94, 56), (104, 56), (94, 72), (104, 72), (94, 88), (104, 88))],
  rr(4, 116, 120, 6, 2, INK))
z('1f3da', rr(28, 62, 72, 54, 2, '#b9a98c'), pg([(20, 66), (64, 26), (108, 66)], '#6e6a5c'), rr(56, 86, 16, 30, 2, BRAUN2), pg([(36, 72), (52, 72), (48, 88), (40, 88)], DUNKEL), st('M78 74 L92 88 M92 74 L78 88', DUNKEL, 3),
  pa('M62 62 L64 82 L70 76 L72 98', INK, 0.0), st('M60 64 L64 84 L70 78 L72 100', DUNKEL, 3), pg([(90, 30), (92, 22), (96, 30)], '#6e6a5c'), st('M16 112 L30 106 M100 112 L112 104', GRUEN2, 4))
z('1f3db', pg([(64, 12), (118, 40), (10, 40)], HELL), rr(14, 40, 100, 10, 2, HELL), *[rr(x, 52, 12, 52, 2, HELL) for x in (18, 42, 66, 90)], *[rr(x, 52, 12, 52, 2, GRAU, 0.3) for x in (24, 48, 72, 96)],
  rr(10, 104, 108, 8, 2, HELL), rr(6, 112, 116, 8, 2, GRAU), pg([(64, 20), (100, 38), (28, 38)], GRAU, 0.3))
z('1f3dc', rr(8, 12, 112, 80, 6, ORANGE), ci(92, 40, 16, GELB), pa('M8 92 C30 76 60 84 80 78 C100 72 110 82 120 80 L120 116 L8 116 Z', BEIGE), pa('M8 100 C40 90 70 100 120 92 L120 116 L8 116 Z', GELB2, 0.4),
  st('M34 92 L34 60', GRUEN2, 8), st('M34 76 C24 76 22 62 24 58', GRUEN2, 6), st('M34 70 C44 70 46 56 44 52', GRUEN2, 6))
z('1f3dd', rr(8, 14, 112, 100, 6, HIMMEL), rr(8, 78, 112, 36, 6, BLAU), el(64, 92, 40, 14, BEIGE), st('M64 90 C62 70 66 56 74 44', BRAUN, 7), pa('M74 44 C60 34 40 36 30 46 C46 48 62 48 74 44 Z', GRUEN),
  pa('M74 44 C88 32 106 36 114 48 C98 50 84 50 74 44 Z', GRUEN), pa('M74 44 C70 28 78 16 92 12 C94 26 86 38 74 44 Z', GRUEN2), ci(96, 34, 10, GELB, 0.0), ci(24, 32, 10, GELB))
z('1f3e0', haus())
z('1f3e1', haus(wand=HELL, dach=GRUEN2, garten=True))
z('1f3e2', hochhaus(BLAU2, HIMMEL, (26, 76)), rr(50, 12, 10, 8, 1, DUNKEL))
z('1f3e5', rr(18, 40, 92, 78, 4, PAPIER), rr(18, 40, 92, 78, 4, GRAU, 0.0), st('M20 42 L108 42 L108 116 L20 116 Z', GRAU, 3), rr(42, 20, 44, 26, 4, PAPIER), st('M44 22 L84 22 L84 42 L44 42 Z', GRAU, 3), rr(60, 26, 8, 14, 1, ROT), rr(57, 29, 14, 8, 1, ROT), *[fenster(x, y, 10, 10) for x in (26, 44, 74, 92) for y in (52, 70)],
  rr(56, 92, 16, 26, 2, HIMMEL), rr(14, 116, 100, 6, 2, GRAU))
z('1f3e6', pg([(64, 10), (120, 36), (8, 36)], HELL), rr(12, 36, 104, 10, 2, GRAU), *[rr(x, 50, 12, 50, 2, HELL) for x in (18, 42, 66, 90)], rr(10, 100, 108, 8, 2, HELL), rr(6, 108, 116, 10, 2, GRAU),
  ci(64, 24, 8, GOLD), pa('M60 20 L68 20 L68 28 L60 28 Z', GELB2))
z('1f3e8', rr(18, 14, 92, 104, 4, '#c94f4f'), *[fenster(x, y, 12, 12, GELB) for x in (26, 46, 70, 90) for y in (30, 50, 70)], rr(50, 92, 28, 26, 3, HIMMEL), rr(30, 20, 68, 8, 2, WEISS, 0.0),
  rr(14, 116, 100, 6, 2, GRAU), rr(38, 4, 52, 12, 4, WEISS), rr(44, 8, 40, 4, 1, GRAU))
z('1f3ea', rr(18, 44, 92, 74, 4, HELL), pa('M12 30 L116 30 L116 50 L12 50 Z', ORANGE), *[rr(12 + i * 26, 30, 13, 20, 0, WEISS) for i in range(4)], rr(24, 20, 80, 12, 3, TUERKIS),
  rr(28, 60, 36, 40, 3, HIMMEL), rr(72, 66, 26, 52, 3, BRAUN2), ci(92, 92, 2, GELB), rr(14, 116, 100, 6, 2, GRAU))
z('1f3eb', rr(14, 50, 100, 66, 4, '#d9825a'), rr(44, 26, 40, 30, 3, '#d9825a'), pg([(40, 28), (64, 10), (88, 28)], ROT2), ci(64, 42, 8, WEISS), st('M64 42 L64 36 M64 42 L68 44', INK, 2),
  *[fenster(x, 62, 12, 14) for x in (22, 44, 72, 94)], rr(56, 90, 16, 26, 2, BRAUN2), rr(10, 114, 108, 6, 2, GRAU))
z('1f3ed', rr(12, 60, 104, 56, 3, GRAU), pa('M12 64 L40 44 L40 64 L68 44 L68 64 L96 44 L96 64 Z', GRAU), rr(20, 20, 16, 50, 2, DUNKEL), rr(46, 30, 12, 40, 2, DUNKEL),
  ci(30, 12, 8, HELL, 0.8), ci(42, 8, 10, HELL, 0.8), ci(58, 18, 8, HELL, 0.8), *[fenster(x, 80, 12, 14, GELB) for x in (24, 50, 76, 100)], rr(8, 114, 112, 6, 2, DUNKEL))
z('1f3f0', rr(20, 48, 88, 66, 3, GRAU), rr(12, 30, 24, 84, 2, HELL), rr(92, 30, 24, 84, 2, HELL), rr(48, 20, 32, 30, 2, HELL),
  *[rr(x, 22, 6, 10, 0, HELL) for x in (12, 21, 30, 92, 101, 110)], *[rr(x, 12, 6, 10, 0, HELL) for x in (48, 57, 66, 75)], pg([(60, 4), (72, 8), (60, 12)], ROT),
  rr(56, 80, 16, 34, 8, DUNKEL), fenster(20, 44, 8, 10, DUNKEL), fenster(100, 44, 8, 10, DUNKEL), fenster(60, 32, 8, 10, DUNKEL))
z('1f3f4', rr(20, 10, 8, 110, 4, DUNKEL), pa('M28 14 L110 14 C104 30 104 46 110 62 L28 62 Z', INK))
# ---- Tiere
z('1f41b', ci(96, 62, 18, GRUEN), ci(78, 72, 16, GRUEN2), ci(62, 78, 16, GRUEN), ci(46, 84, 15, GRUEN2), ci(30, 90, 14, GRUEN), ci(102, 58, 4, INK), st('M100 46 L92 30 M108 46 L116 32', INK, 4),
  *[st(f'M{x} {y} L{x - 4} {y + 12}', GRUEN2, 4) for x, y in ((76, 86), (60, 92), (44, 98))])
z('1f422', el(64, 70, 44, 30, GRUEN2), el(64, 66, 34, 22, GRUEN), *[ci(x, y, 6, GRUEN2) for x, y in ((50, 60), (78, 60), (64, 76))], ci(108, 62, 14, GRUEN), ci(112, 58, 3, INK),
  rr(26, 92, 14, 14, 5, GRUEN), rr(88, 92, 14, 14, 5, GRUEN), st('M22 74 L12 80', GRUEN, 8))
z('1f989', el(64, 74, 40, 46, BRAUN), el(64, 84, 26, 30, BEIGE), ci(64, 40, 34, BRAUN), pg([(34, 22), (44, 4), (52, 22)], BRAUN), pg([(94, 22), (84, 4), (76, 22)], BRAUN),
  ci(50, 42, 12, WEISS), ci(78, 42, 12, WEISS), ci(50, 42, 6, INK), ci(78, 42, 6, INK), pg([(58, 54), (70, 54), (64, 64)], ORANGE), *[st(f'M{x} 80 L{x} 88', BRAUN, 3) for x in (54, 64, 74)])
# ---- Körper
z('1f442', pa('M42 20 C30 30 30 60 42 80 C50 94 66 108 80 96 C92 86 86 70 76 60 C86 44 80 22 66 16 C56 12 48 14 42 20 Z', HAUT[0]),
  pa('M50 30 C44 36 46 56 56 66 C64 74 74 74 74 66 C74 58 62 50 62 42 C62 32 56 26 50 30 Z', HAUT[1], 0.6))
z('1f444', pa('M10 60 C30 34 50 44 64 52 C78 44 98 34 118 60 C98 88 78 96 64 96 C50 96 30 88 10 60 Z', ROT), pa('M18 62 L110 62 C94 84 78 92 64 92 C50 92 34 84 18 62 Z', WEISS, 0.9), pa('M22 66 L106 66 C90 86 74 90 64 90 C54 90 38 86 22 66 Z', ROT2))
z('1f44b', pa('M36 118 C26 96 30 74 34 56 C36 46 46 46 46 56 L46 70 L48 34 C48 24 58 24 58 34 L58 68 L60 24 C60 14 70 14 70 24 L70 68 L72 34 C72 24 82 24 82 34 L82 70 L84 46 C84 36 94 36 94 46 L94 96 C94 112 80 122 64 122 Z', HAUT[0]),
  st('M14 58 L22 62 M12 72 L20 72 M14 86 L22 82', HIMMEL, 5))
z('1f44d', pa('M46 56 L46 116 L28 116 L28 56 Z', HIMMEL), pa('M46 60 L60 60 L74 20 C76 10 90 12 90 24 L84 56 L110 56 C118 56 118 68 110 70 L112 70 C120 70 120 84 112 86 C118 88 118 100 110 102 C116 104 114 116 106 116 L46 116 Z', HAUT[0]))
z('1f44e', pa('M46 72 L46 12 L28 12 L28 72 Z', HIMMEL), pa('M46 68 L60 68 L74 108 C76 118 90 116 90 104 L84 72 L110 72 C118 72 118 60 110 58 L112 58 C120 58 120 44 112 42 C118 40 118 28 110 26 C116 24 114 12 106 12 L46 12 Z', HAUT[0]))
z('1f457', pa('M44 12 L84 12 L80 44 C96 60 110 100 112 116 L16 116 C18 100 32 60 48 44 Z', ROSA), pa('M48 44 L80 44 L74 56 L54 56 Z', ROSA, 0.0), rr(46, 40, 36, 10, 3, '#c94b7c'), st('M52 14 L46 40 M76 14 L82 40', WEISS, 3))
z('1f464', ci(64, 44, 26, DUNKEL), pa('M18 122 C18 90 38 76 64 76 C90 76 110 90 110 122 Z', DUNKEL))
z('1f465', ci(80, 42, 24, DUNKEL), pa('M42 116 C42 84 60 70 80 70 C100 70 118 84 118 116 Z', DUNKEL), ci(40, 50, 20, GRAU), pa('M8 116 C8 90 22 78 40 78 C50 78 56 80 60 86 C46 92 40 104 40 116 Z', GRAU))
z('1f4aa', pa('M16 116 C16 84 32 68 58 66 L70 66 L70 40 L98 40 L98 68 C110 74 114 92 114 116 Z', HAUT[0]), pa('M24 100 C26 80 40 72 58 72 C46 78 36 88 32 100 Z', HAUT[1], 0.35),
  rr(66, 10, 36, 36, 14, HAUT[0]), st('M72 22 L96 22 M72 32 L96 32', HAUT[1], 3), rr(60, 26, 12, 24, 6, HAUT[0]))
z('1f483', ci(66, 22, 13, HAUT[1]), pa('M50 24 C50 8 84 8 82 26 C76 18 60 18 50 24 Z', HAAR['schwarz']), pa('M56 36 L76 36 L92 78 C110 84 118 110 108 118 L34 118 C24 104 44 84 56 78 Z', ROT),
  st('M76 44 L102 30', HAUT[1], 8), st('M56 44 L38 62', HAUT[1], 8), st('M50 118 L46 108 M84 118 L90 106', HAUT[1], 7))
z('1f576', pa('M8 44 L120 44 L116 54 C110 56 108 60 108 64 C108 84 94 90 80 88 C68 86 62 74 62 62 L66 62 C66 74 60 86 48 88 C34 90 20 84 20 64 C20 60 18 56 12 54 Z', INK),
  pa('M26 56 L60 56 C60 72 52 82 40 82 C30 82 26 72 26 56 Z', DUNKEL, 0.5), pa('M68 56 L102 56 C102 72 94 82 82 82 C72 82 68 72 68 56 Z', DUNKEL, 0.5))
z('1f9e2', pa('M20 76 C20 36 108 36 108 76 Z', BLAU), pa('M60 76 L124 82 C124 92 108 92 100 90 L60 84 Z', BLAU2), rr(20, 72, 88, 8, 4, BLAU2), ci(64, 40, 5, BLAU2))
# ---- Menschen
z('1f467', person(0, 'braun', 'lang', ROSA))
z('1f468_200d_1f373', person(1, 'schwarz', 'kurz', PAPIER, kopf=muetze_koch(), extras=kochjacke()))
z('1f468_200d_1f469_200d_1f467', ci(30, 46, 16, HAUT[0]), pa('M30 36 C20 22 44 22 40 36 Z', HAAR['braun']), pa('M8 110 C8 80 20 66 30 66 C40 66 52 80 52 110 Z', BLAU),
  ci(98, 46, 16, HAUT[1]), pa('M84 44 C82 22 116 24 112 46 C106 36 96 36 84 44 Z', HAAR['schwarz']), pa('M82 46 C82 70 84 80 88 82 L108 82 C112 80 114 70 114 46 Z', HAAR['schwarz']), pa('M76 110 C76 80 88 66 98 66 C108 66 120 80 120 110 Z', ROSA),
  ci(64, 70, 12, HAUT[0]), pa('M52 68 C52 52 78 52 76 68 C70 62 60 62 52 68 Z', HAAR['blond']), pa('M46 116 C46 96 54 88 64 88 C74 88 82 96 82 116 Z', GELB))
z('1f468_200d_1f4bc', person(0, 'braun', 'kurz', DUNKEL, extras=krawatte(ROT)))
z('1f468_200d_1f527', person(2, 'schwarz', 'kurz', BLAU2, extras=schraubenschluessel_klein()))
z('1f468_200d_1f52c', person(0, 'grau', 'kurz', HIMMEL, extras=kittel() + kolben_klein(), kopf=brille()))
z('1f468_200d_1f9b3', person(1, 'weiss', 'kurz', GRUEN2, bart=True))
z('1f469', person(0, 'braun', 'lang', LILA))
z('1f469_200d_2695', person(1, 'schwarz', 'dutt', HIMMEL, extras=kittel() + stethoskop()))
z('1f469_200d_1f33e', person(2, 'schwarz', 'lang', GRUEN, kopf=strohhut()))
z('1f469_200d_1f373', person(0, 'rot', 'lang', PAPIER, kopf=muetze_koch(), extras=kochjacke()))
z('1f469_200d_1f393', person(1, 'braun', 'lang', ROT, kopf=hut_absolvent()))
z('1f469_200d_1f3a8', person(0, 'blond', 'dutt', TUERKIS, extras=pinsel_klein()))
z('1f469_200d_1f3eb', person(2, 'schwarz', 'bob', ORANGE, extras=buch_klein(ROT), kopf=brille()))
z('1f469_200d_1f466', ci(48, 40, 22, HAUT[0]), pa('M26 40 C26 62 30 74 36 76 L60 76 C66 74 70 62 70 40 Z', HAAR['braun']), pa('M28 42 C26 14 70 14 68 42 C62 30 54 26 48 26 C42 26 34 30 28 42 Z', HAAR['braun']),
  pa('M8 120 C8 90 26 76 48 76 C60 76 68 80 74 86 C64 92 60 104 60 120 Z', ROSA), ci(90, 72, 16, HAUT[0]), pa('M74 70 C74 50 106 50 106 70 C100 62 92 60 74 70 Z', HAAR['blond']), pa('M64 120 C64 100 76 90 90 90 C104 90 116 100 116 120 Z', BLAU),
  ci(44, 42, 2.4, INK), ci(54, 42, 2.4, INK), ci(86, 72, 2, INK), ci(94, 72, 2, INK))
z('1f469_200d_1f4bb', person(1, 'schwarz', 'lang', ROSA, extras=laptop_klein()))
z('1f469_200d_1f4bc', person(0, 'blond', 'bob', DUNKEL, extras=[rr(56, 90, 16, 10, 2, WEISS)]))
z('1f469_200d_1f52c', person(2, 'schwarz', 'locken', HIMMEL, extras=kittel() + kolben_klein(), kopf=brille()))
z('1f469_200d_1f9b0', person(0, 'rot', 'lang', GRUEN))
z('1f469_200d_1f9b1', person(1, 'schwarz', 'locken', ORANGE))
z('1f474', person(0, 'grau', 'glatze', BRAUN, kopf=brille(), extras=[st('M96 92 L104 122', BRAUN2, 6)]))
z('1f475', person(0, 'weiss', 'dutt', LILA, kopf=brille()))
z('1f477', person(1, 'braun', 'kurz', ORANGE, kopf=helm(GELB), extras=[rr(30, 96, 68, 8, 3, GELB), rr(30, 108, 68, 8, 3, GELB)]))
z('1f575', person(0, 'schwarz', 'kurz', DUNKEL, kopf=[pa('M40 44 C40 22 88 22 88 44 Z', DUNKEL), rr(28, 42, 72, 8, 4, DUNKEL), rr(48, 56, 32, 6, 3, INK)],
  extras=[pa('M64 88 L48 122 L80 122 Z', BEIGE), ring(100, 100, 12, 5, INK), st('M108 108 L118 118', INK, 6)]))
z('1f6b6', ci(64, 22, 13, HAUT[0]), pa('M52 22 C52 6 78 6 76 22 C72 16 60 16 52 22 Z', HAAR['braun']), rr(52, 36, 24, 40, 8, BLAU), st('M56 42 L40 70', HAUT[0], 8), st('M72 42 L90 62', HAUT[0], 8),
  st('M58 74 L44 108 L52 118', DUNKEL, 10), st('M70 74 L82 100 L98 108', DUNKEL, 10))
z('1f9b9', person(1, 'schwarz', 'kurz', LILA, kopf=[pa('M38 50 L90 50 L88 60 L70 60 L64 56 L58 60 L40 60 Z', INK), rr(50, 24, 28, 12, 6, INK, 0.0)],
  extras=[pa('M18 122 C18 100 30 88 40 86 L34 122 Z', INK), pa('M110 122 C110 100 98 88 88 86 L94 122 Z', INK)]))
z('1f9d1', person(1, 'braun', 'kurz', TUERKIS))
z('1f9d1_200d_2695', person(2, 'schwarz', 'kurz', HIMMEL, extras=kittel() + stethoskop()))
z('1f9d1_200d_2708', person(0, 'braun', 'kurz', '#1c2230', kopf=hut_pilot(), extras=[rr(44, 92, 40, 6, 3, GOLD)]))
z('1f9d1_200d_1f373', person(2, 'schwarz', 'kurz', PAPIER, kopf=muetze_koch(), extras=kochjacke()))
z('1f9d1_200d_1f393', person(0, 'blond', 'kurz', BLAU, kopf=hut_absolvent()))
z('1f9d1_200d_1f3eb', person(1, 'braun', 'kurz', GRUEN2, extras=buch_klein(BLAU), kopf=brille()))
z('1f9d1_200d_1f3ed', person(0, 'braun', 'kurz', BLAU2, kopf=helm(BLAU), extras=[rr(44, 92, 40, 30, 3, BLAU, 0.0), rr(60, 92, 8, 30, 2, GELB)]))
z('1f9d1_200d_1f4bb', person(2, 'schwarz', 'kurz', GRUEN, extras=laptop_klein()))
z('1f9d1_200d_1f4bc', person(1, 'braun', 'kurz', DUNKEL, extras=krawatte(BLAU)))
z('1f9d1_200d_1f527', person(0, 'rot', 'kurz', BLAU2, extras=schraubenschluessel_klein()))
z('1f9d1_200d_1f52c', person(1, 'braun', 'kurz', HIMMEL, extras=kittel() + kolben_klein(), kopf=brille()))
z('1f9d1_200d_1f9b1', person(2, 'schwarz', 'locken', GELB))
z('1f9d3', person(1, 'grau', 'kurz', BRAUN, kopf=brille()))
z('1f9d4', person(0, 'braun', 'kurz', GRUEN2, bart=True))
# ---- Objekte
z('1f488', rr(40, 10, 48, 108, 12, WEISS), rr(34, 6, 60, 12, 6, GRAU), rr(34, 110, 60, 12, 6, GRAU), *[pa(f'M40 {24 + i * 22} L88 {14 + i * 22} L88 {24 + i * 22} L40 {34 + i * 22} Z', ROT if i % 2 == 0 else BLAU) for i in range(5)])
z('1f48a', pa('M28 60 L100 60 C120 60 120 96 100 96 L28 96 Z', ROT), pa('M28 60 L64 60 L64 96 L28 96 C8 96 8 60 28 60 Z', WEISS), rr(24, 68, 8, 20, 4, HELL))
z('1f48b', pa('M12 58 C30 30 50 42 64 52 C78 42 98 30 116 58 C96 92 78 102 64 102 C50 102 32 92 12 58 Z', ROT), pa('M24 62 L104 62 C88 88 74 96 64 96 C54 96 40 88 24 62 Z', ROT2, 0.4))
z('1f48e', pg([(24, 34), (104, 34), (120, 58), (64, 118), (8, 58)], TUERKIS), pg([(24, 34), (44, 58), (8, 58)], HIMMEL), pg([(104, 34), (120, 58), (84, 58)], HIMMEL), pg([(44, 58), (84, 58), (64, 118)], '#1e8f86'), pg([(24, 34), (64, 34), (44, 58)], WEISS, 0.4))
z('1f490', st('M64 118 L64 74', GRUEN2, 8), pa('M42 74 L86 74 L76 118 L52 118 Z', BEIGE), ci(64, 40, 16, ROT), ci(36, 50, 14, GELB), ci(92, 50, 14, ROSA), ci(46, 74, 12, LILA), ci(82, 74, 12, ORANGE),
  ci(64, 40, 5, GELB2), ci(36, 50, 4, ORANGE), ci(92, 50, 4, WEISS), ci(46, 74, 4, GELB), ci(82, 74, 4, GELB))
z('1f4a1', ci(64, 50, 38, GELB), pa('M40 74 L88 74 L80 98 L48 98 Z', GELB), rr(46, 96, 36, 10, 3, GRAU), rr(50, 108, 28, 10, 4, GRAU), st('M30 20 L22 12 M98 20 L106 12 M64 6 L64 2', GELB2, 5), pa('M52 60 L60 74 L68 74 L76 60', GELB2, 0.0), st('M56 62 L60 76 L68 76 L72 62', GELB2, 4))
z('1f4a2', *[pa(f'M{64 + 22 * __import__("math").cos(a * 1.5708 + 0.7854):.1f} {64 + 22 * __import__("math").sin(a * 1.5708 + 0.7854):.1f} L{64 + 54 * __import__("math").cos(a * 1.5708 + 0.5):.1f} {64 + 54 * __import__("math").sin(a * 1.5708 + 0.5):.1f} L{64 + 54 * __import__("math").cos(a * 1.5708 + 1.07):.1f} {64 + 54 * __import__("math").sin(a * 1.5708 + 1.07):.1f} Z', ROT) for a in range(4)])
z('1f4a7', pa('M64 10 C50 40 26 58 26 82 C26 104 44 118 64 118 C84 118 102 104 102 82 C102 58 78 40 64 10 Z', BLAU), pa('M42 84 C42 96 50 104 60 106 C48 102 46 92 46 84 Z', WEISS, 0.7))
z('1f4ac', pa('M64 16 C30 16 10 36 10 60 C10 74 18 86 30 94 L26 114 L50 100 C54 101 59 102 64 102 C98 102 118 84 118 60 C118 36 98 16 64 16 Z', BLAU), ci(44, 60, 6, WEISS), ci(64, 60, 6, WEISS), ci(84, 60, 6, WEISS))
z('1f4ad', el(70, 52, 46, 36, HELL), ci(34, 96, 10, HELL), ci(18, 114, 6, HELL))
z('1f4af', st('M12 92 L12 40 M28 40 L28 92', ROT, 0.0), st('M20 38 L20 90', ROT, 10), st('M10 46 L20 38', ROT, 10), ring(50, 64, 20, 10, ROT), ring(96, 64, 20, 10, ROT), st('M10 106 L118 106 M20 116 L108 116', ROT, 7))
z('1f4b0', pa('M28 50 L100 50 C116 66 118 100 100 116 L28 116 C10 100 12 66 28 50 Z', BEIGE), pa('M36 30 L92 30 L100 52 L28 52 Z', BEIGE), st('M40 30 C52 36 76 36 88 30', BRAUN, 6), st('M64 62 L64 106', GRUEN2, 6),
  st('M76 72 C76 64 52 64 52 74 C52 84 76 82 76 94 C76 104 52 104 52 96', GRUEN2, 6))
z('1f4b3', rr(8, 30, 112, 70, 8, BLAU2), rr(8, 44, 112, 14, 0, INK), rr(18, 70, 40, 8, 3, WEISS), rr(18, 84, 24, 6, 3, HELL), rr(92, 72, 18, 14, 3, GOLD))
z('1f4b6', rr(8, 34, 112, 60, 4, TUERKIS), ring(64, 64, 18, 6, HELL), rr(14, 40, 100, 48, 2, HELL, 0.0), rr(18, 44, 18, 40, 2, '#1e8f86', 0.5), rr(92, 44, 18, 40, 2, '#1e8f86', 0.5),
  st('M74 54 C62 46 50 54 50 64 C50 74 62 82 74 74 M44 60 L58 60 M44 68 L58 68', WEISS, 5))
z('1f4b8', rr(20, 40, 88, 50, 4, GRUEN), rr(28, 48, 72, 34, 2, GRUEN2, 0.5), ring(64, 65, 12, 5, HELL), st('M44 12 Q56 22 44 32 M64 8 Q76 20 64 30 M84 12 Q96 22 84 32', HIMMEL, 5),
  st('M26 102 L60 102 M26 112 L48 112', GRUEN2, 5))
z('1f4bb', rr(20, 22, 88, 60, 5, DUNKEL), rr(26, 28, 76, 48, 2, HIMMEL), pa('M8 96 L120 96 L116 108 L12 108 Z', GRAU), rr(52, 96, 24, 4, 1, DUNKEL), rr(32, 34, 40, 4, 1, WEISS, 0.6), rr(32, 44, 26, 4, 1, WEISS, 0.6))
z('1f4bc', rr(12, 40, 104, 70, 8, BRAUN), rr(12, 66, 104, 8, 0, BRAUN2), rr(54, 62, 20, 14, 3, GOLD), st('M46 40 L46 30 C46 24 50 22 56 22 L72 22 C78 22 82 24 82 30 L82 40', BRAUN2, 7))
z('1f4be', rr(16, 16, 96, 96, 6, BLAU2), rr(34, 16, 60, 34, 2, HELL), rr(72, 20, 12, 24, 2, BLAU2), rr(30, 66, 68, 46, 4, GRAU), rr(38, 74, 52, 6, 2, DUNKEL), rr(38, 86, 36, 6, 2, DUNKEL))
z('1f4bf', ci(64, 64, 54, HELL), pa('M64 10 A54 54 0 0 1 118 64 L96 64 A32 32 0 0 0 64 32 Z', HIMMEL, 0.6), pa('M64 118 A54 54 0 0 1 10 64 L32 64 A32 32 0 0 0 64 96 Z', ROSA, 0.4), ci(64, 64, 14, WEISS), ring(64, 64, 20, 4, GRAU))
z('1f4c8', rr(10, 10, 108, 108, 6, WEISS), st('M22 100 L22 26 M22 100 L106 100', GRAU, 5), st('M30 88 L50 66 L66 78 L98 40', GRUEN, 8), pg([(98, 26), (110, 40), (90, 44)], GRUEN))
z('1f4ca', rr(10, 10, 108, 108, 6, WEISS), st('M22 100 L106 100', GRAU, 5), rr(28, 60, 18, 40, 2, BLAU), rr(54, 34, 18, 66, 2, ROT), rr(80, 48, 18, 52, 2, GELB))
z('1f4da', rr(16, 26, 26, 84, 3, ROT), rr(42, 18, 24, 92, 3, BLAU), rr(66, 34, 22, 76, 3, GRUEN), pa('M88 30 L108 26 L116 106 L96 110 Z', GELB), rr(20, 40, 18, 4, 1, WEISS, 0.7), rr(46, 32, 16, 4, 1, WEISS, 0.7), rr(70, 48, 14, 4, 1, WEISS, 0.7))
z('1f4dd', rr(24, 10, 80, 108, 6, PAPIER), st('M30 10 L98 10 C102 10 104 12 104 16 L104 112 C104 116 102 118 98 118 L30 118 C26 118 24 116 24 112 L24 16 C24 12 26 10 30 10 Z', GRAU, 3), rr(36, 30, 56, 6, 3, GRAU), rr(36, 46, 56, 6, 3, GRAU), rr(36, 62, 40, 6, 3, GRAU), st('M70 106 L110 66', GELB, 12), st('M110 66 L118 58', ROSA, 12), pa('M68 108 L60 118 L74 114 Z', BEIGE))
z('1f4de', pa('M28 12 C18 14 12 26 14 40 C20 76 52 108 88 114 C102 116 114 110 116 100 L118 90 L92 78 L80 90 C64 84 44 64 38 48 L50 36 L38 10 Z', DUNKEL), st('M16 108 L112 108', DUNKEL, 0.0))
z('1f4e1', pa('M18 42 C18 90 60 122 100 110 C104 80 84 48 44 32 C34 30 22 32 18 42 Z', HELL), st('M52 76 L100 28', DUNKEL, 8), ci(102, 26, 10, ROT), st('M18 42 C18 90 60 122 100 110', GRAU, 6), st('M108 12 Q124 24 116 48', GRAU, 5), st('M120 4 Q128 20 124 40', GRAU, 0.0))
z('1f4e6', pa('M64 20 L112 42 L112 96 L64 118 L16 96 L16 42 Z', BRAUN), pa('M16 42 L64 64 L64 118 L16 96 Z', BRAUN2), pa('M64 64 L112 42 L112 96 L64 118 Z', BRAUN), pa('M64 20 L88 30 L40 52 L16 42 Z', BEIGE, 0.5), st('M64 64 L64 118', GELB, 5), st('M16 42 L64 64 L112 42', GELB, 5))
z('1f4f1', rr(34, 8, 60, 112, 12, DUNKEL), rr(40, 18, 48, 84, 3, HIMMEL), ci(64, 110, 5, GRAU), rr(56, 12, 16, 3, 1, GRAU), rr(46, 26, 36, 8, 2, WEISS, 0.6), rr(46, 40, 24, 8, 2, WEISS, 0.6))
z('1f4fa', rr(10, 22, 108, 74, 8, DUNKEL), rr(18, 30, 92, 58, 3, HIMMEL), rr(48, 96, 32, 8, 2, DUNKEL), rr(34, 104, 60, 8, 3, DUNKEL), pa('M18 88 L110 88 L110 66 C80 52 50 76 18 62 Z', GRUEN, 0.6), ci(90, 44, 8, GELB))
z('1f501', st('M30 54 L30 44 C30 36 36 30 44 30 L90 30', BLAU, 10), pg([(90, 18), (108, 30), (90, 42)], BLAU), st('M98 74 L98 84 C98 92 92 98 84 98 L38 98', BLAU, 10), pg([(38, 86), (20, 98), (38, 110)], BLAU))
z('1f50a', pa('M14 48 L36 48 L66 22 L66 106 L36 80 L14 80 Z', DUNKEL), st('M80 50 Q90 64 80 78', BLAU, 7), st('M94 38 Q112 64 94 90', BLAU, 7), st('M106 26 Q132 64 106 102', BLAU, 7))
z('1f50e', ring(52, 52, 32, 10, DUNKEL), ci(52, 52, 27, HIMMEL, 0.5), st('M76 76 L110 110', DUNKEL, 14), st('M36 42 C38 34 44 30 50 30', WEISS, 5))
z('1f511', ring(40, 40, 24, 12, GOLD), ci(40, 40, 8, WEISS, 0.0), st('M58 58 L112 112', GOLD, 12), st('M96 96 L108 84 M84 84 L96 72', GOLD, 10), ci(40, 40, 6, GELB, 0.0))
z('1f512', rr(22, 56, 84, 60, 10, GOLD), st('M40 56 L40 42 C40 26 88 26 88 42 L88 56', GRAU, 12), ci(64, 80, 8, DUNKEL), rr(60, 84, 8, 16, 3, DUNKEL))
z('1f513', rr(22, 56, 84, 60, 10, GOLD), st('M40 56 L40 42 C40 26 88 26 88 42 L88 26', GRAU, 0.0), st('M40 56 L40 40 C40 24 84 22 88 34', GRAU, 12), ci(64, 80, 8, DUNKEL), rr(60, 84, 8, 16, 3, DUNKEL))
z('1f517', st('M56 72 L72 56', BLAU, 10), st('M48 80 L36 92 C24 104 8 88 20 76 L40 56 C46 50 54 50 60 56', BLAU, 10), st('M80 48 L92 36 C104 24 120 40 108 52 L88 72 C82 78 74 78 68 72', BLAU, 10))
z('1f525', pa('M64 8 C70 34 96 46 96 78 C96 102 82 118 64 118 C46 118 32 102 32 78 C32 62 40 54 44 42 C50 54 54 56 58 52 C56 38 58 22 64 8 Z', ORANGE), pa('M64 60 C72 76 82 80 82 96 C82 108 74 116 64 116 C54 116 46 108 46 96 C46 86 54 80 56 72 C58 78 62 80 64 76 C62 70 62 66 64 60 Z', GELB))
z('1f527', st('M34 94 L78 50', GRAU, 14), pa('M70 22 C84 12 104 14 114 26 L96 44 L100 58 L112 62 C118 76 110 96 96 100 C82 104 64 94 62 78 L70 60 L58 52 Z', GRAU, 0.0),
  pa('M116 40 C120 26 112 12 96 10 L88 30 L74 30 L66 10 C52 14 46 30 52 44 C58 56 72 60 84 56 L108 80 C114 86 122 86 126 80 Z', GRAU, 0.0),
  pa('M60 30 C60 12 84 6 94 16 L78 32 L84 46 L100 42 C110 52 104 76 86 76 C74 76 66 70 62 60 Z', GRAU), ci(28, 100, 12, GRAU))
z('1f528', st('M28 112 L74 66', BRAUN, 14), pa('M50 30 L88 30 L112 46 L112 66 L98 66 L88 56 L50 56 Z', GRAU), pa('M42 26 L54 26 L54 60 L42 60 Z', DUNKEL))
z('1f529', pa('M40 12 L88 12 L96 30 L32 30 Z', GRAU), rr(48, 30, 32, 80, 4, GRAU), *[rr(48, 42 + i * 14, 32, 6, 2, DUNKEL, 0.4) for i in range(5)], pa('M64 110 L48 110 L64 122 L80 110 Z', GRAU), rr(56, 14, 16, 10, 2, DUNKEL))
z('1f52d', st('M20 66 L96 30', GRAU, 24), st('M14 70 L28 62', DUNKEL, 20), st('M96 30 L110 24', BLAU2, 18), st('M60 84 L44 118 M60 84 L76 118 M60 84 L60 118', DUNKEL, 8), ci(60, 82, 8, DUNKEL))
z('1f534', ci(64, 64, 52, ROT), ci(50, 48, 14, WEISS, 0.25))
z('1f535', ci(64, 64, 52, BLAU), ci(50, 48, 14, WEISS, 0.25))
z('1f552', ci(64, 64, 54, DUNKEL), ci(64, 64, 46, WEISS), st('M64 64 L64 34', INK, 7), st('M64 64 L88 64', INK, 7), ci(64, 64, 5, INK), *[ci(64 + 38 * __import__("math").cos(a * 1.5708), 64 + 38 * __import__("math").sin(a * 1.5708), 3, GRAU) for a in range(4)])
z('1f58b', st('M96 22 L46 72', INK, 14), pa('M46 72 L24 104 L56 82 Z', GOLD), pa('M24 104 L34 96 L30 92 Z', INK), st('M100 12 L116 28', INK, 12), st('M12 118 L116 118', BLAU2, 4))
z('1f5a5', rr(12, 16, 104, 72, 6, DUNKEL), rr(18, 22, 92, 60, 2, HIMMEL), rr(56, 88, 16, 14, 2, GRAU), rr(36, 102, 56, 8, 4, GRAU), rr(26, 30, 40, 6, 1, WEISS, 0.6), rr(26, 42, 28, 6, 1, WEISS, 0.6), rr(26, 54, 34, 6, 1, WEISS, 0.6))
z('1f5a8', rr(16, 52, 96, 46, 8, GRAU), rr(34, 20, 60, 36, 3, WEISS), rr(42, 28, 44, 4, 1, GRAU), rr(42, 38, 32, 4, 1, GRAU), rr(34, 86, 60, 30, 3, WEISS), rr(42, 94, 44, 4, 1, HELL), ci(100, 64, 5, GRUEN), rr(26, 64, 24, 6, 3, DUNKEL, 0.3))
z('1f5c4', rr(22, 10, 84, 108, 6, GRAU), rr(30, 18, 68, 30, 3, HELL), rr(30, 52, 68, 30, 3, HELL), rr(30, 86, 68, 26, 3, HELL), rr(54, 30, 20, 6, 3, DUNKEL), rr(54, 64, 20, 6, 3, DUNKEL), rr(54, 96, 20, 6, 3, DUNKEL))
z('1f5de', pa('M18 22 L110 22 L110 96 C110 106 100 112 92 112 L18 112 Z', WEISS), pa('M18 22 L34 22 L34 112 L18 112 Z', HELL), rr(42, 30, 60, 8, 2, INK), rr(42, 46, 26, 26, 2, GRAU), rr(74, 46, 28, 5, 2, GRAU), rr(74, 56, 28, 5, 2, GRAU), rr(74, 66, 20, 5, 2, GRAU), rr(42, 80, 60, 5, 2, GRAU), rr(42, 90, 50, 5, 2, GRAU))
z('1f5e3', pa('M28 20 C10 26 10 52 20 60 C16 72 20 84 30 90 L30 118 L74 118 L74 96 L86 92 L80 76 C92 64 90 40 74 28 C60 18 40 16 28 20 Z', DUNKEL), st('M96 44 Q106 62 96 80', DUNKEL, 6), st('M108 32 Q124 62 108 92', DUNKEL, 6))
z('1f5fa', pa('M12 30 L44 18 L84 34 L116 22 L116 98 L84 110 L44 94 L12 106 Z', BEIGE), pa('M44 18 L84 34 L84 110 L44 94 Z', '#dcc08c'), st('M20 60 C40 50 60 80 100 60', BLAU, 5), st('M30 84 C50 80 70 100 104 88', ROT, 3), ci(64, 48, 6, ROT))
z('1f5fc', pg([(64, 6), (76, 60), (52, 60)], DUNKEL), pg([(52, 60), (76, 60), (96, 118), (32, 118)], DUNKEL), pg([(56, 50), (72, 50), (72, 62), (56, 62)], ROT), pg([(40, 96), (88, 96), (96, 118), (32, 118)], HELL, 0.0), st('M44 86 L84 86 M36 104 L92 104', ROT, 5), st('M64 14 L64 4', DUNKEL, 4))
z('1f5ff', pa('M40 118 L36 40 C36 18 92 18 92 40 L88 118 Z', GRAU), pa('M48 44 L80 44 L78 60 L50 60 Z', DUNKEL, 0.3), pa('M58 52 L70 52 L66 80 L60 80 Z', DUNKEL, 0.4), st('M50 96 L78 96', DUNKEL, 4), pa('M44 30 L84 30 L82 40 L46 40 Z', DUNKEL, 0.5))
# ---- Gesichter
z('1f60a', ci(64, 64, 54, GELB), st('M40 56 Q46 46 52 56 M76 56 Q82 46 88 56', INK, 5), st('M40 78 Q64 100 88 78', INK, 6), ci(34, 74, 7, ROSA, 0.7), ci(94, 74, 7, ROSA, 0.7))
z('1f620', ci(64, 64, 54, GELB), st('M36 46 L54 54 M92 46 L74 54', INK, 6), ci(48, 64, 5, INK), ci(80, 64, 5, INK), st('M46 92 Q64 80 82 92', INK, 6))
z('1f621', ci(64, 64, 54, ROT), st('M36 46 L54 54 M92 46 L74 54', INK, 6), ci(48, 64, 5, INK), ci(80, 64, 5, INK), st('M46 92 Q64 80 82 92', INK, 6))
z('1f624', ci(64, 64, 54, GELB), st('M36 48 L54 56 M92 48 L74 56', INK, 6), st('M42 68 L54 68 M74 68 L86 68', INK, 6), st('M50 92 L78 92', INK, 6), st('M14 96 Q22 100 14 108 M28 100 Q36 104 28 112', GRAU, 5), st('M114 96 Q106 100 114 108 M100 100 Q92 104 100 112', GRAU, 5))
z('1f642', ci(64, 64, 54, GELB), ci(48, 56, 5, INK), ci(80, 56, 5, INK), st('M44 82 Q64 96 84 82', INK, 6))
z('1f916', rr(22, 36, 84, 70, 12, GRAU), rr(30, 46, 68, 40, 8, DUNKEL), ci(48, 66, 9, HIMMEL), ci(80, 66, 9, HIMMEL), rr(48, 94, 32, 6, 3, HIMMEL), rr(60, 12, 8, 24, 3, GRAU), ci(64, 12, 7, ROT), rr(10, 56, 12, 30, 4, GRAU), rr(106, 56, 12, 30, 4, GRAU))
z('1f91d', pa('M8 60 L40 40 L64 60 L52 78 L26 90 L8 82 Z', HAUT[0]), pa('M120 60 L88 40 L64 60 L76 78 L102 90 L120 82 Z', HAUT[1]), pa('M44 62 L66 54 L86 62 L86 76 L74 84 L54 84 L44 76 Z', HAUT[1]), pa('M52 66 L72 60 L80 66 L80 74 L72 80 L58 80 Z', HAUT[0]),
  rr(0, 50, 20, 40, 4, BLAU), rr(108, 50, 20, 40, 4, DUNKEL))
# ---- Verkehr
z('1f680', pa('M64 6 C40 26 34 60 40 92 L88 92 C94 60 88 26 64 6 Z', HELL), ci(64, 50, 11, HIMMEL), ring(64, 50, 12, 4, GRAU), pa('M40 70 L18 92 L26 104 L42 92 Z', ROT), pa('M88 70 L110 92 L102 104 L86 92 Z', ROT),
  pa('M52 92 L76 92 L64 118 Z', ORANGE), pa('M58 92 L70 92 L64 108 Z', GELB), pa('M64 6 C52 16 46 30 44 46 C50 34 56 24 64 16 Z', WEISS, 0.5))
z('1f684', pa('M10 92 L10 58 C10 46 18 40 30 40 L96 40 C112 40 120 60 120 92 Z', PAPIER), st('M10 92 L10 58 C10 46 18 40 30 40 L96 40 C112 40 120 60 120 92 Z', GRAU, 3), rr(10, 60, 110, 16, 0, HIMMEL), pa('M100 60 C110 62 116 72 118 76 L100 76 Z', WEISS, 0.0), rr(10, 78, 110, 8, 0, BLAU), rr(6, 92, 116, 10, 3, DUNKEL), ci(30, 106, 7, INK), ci(60, 106, 7, INK), ci(90, 106, 7, INK))
z('1f686', zug(BLAU))
z('1f690', bus())
z('1f691', bus(PAPIER, ROT), rr(52, 20, 24, 8, 2, ROT), rr(58, 82, 12, 4, 1, WEISS), rr(62, 78, 4, 12, 1, WEISS))
z('1f692', bus(ROT, GELB), rr(20, 30, 88, 12, 3, GRAU), rr(40, 26, 48, 6, 2, DUNKEL), rr(20, 48, 88, 24, 3, HIMMEL, 0.0))
z('1f693', auto(WEISS, DUNKEL, blau=True))
z('1f694', auto(WEISS, DUNKEL, blau=True), rr(10, 84, 108, 8, 0, BLAU2))
z('1f697', auto(ROT))
z('1f698', auto(BLAU), rr(48, 82, 32, 10, 3, HIMMEL, 0.5))
z('1f6a8', pa('M28 96 L100 96 L100 60 C100 36 28 36 28 60 Z', ROT), rr(20, 96, 88, 14, 5, DUNKEL), rr(48, 22, 32, 16, 4, GRAU), pa('M40 88 L88 88 L88 60 C88 46 40 46 40 60 Z', WEISS, 0.3), st('M14 50 L6 42 M114 50 L122 42 M8 74 L0 74 M120 74 L128 74', ROT, 5))
z('1f6a9', rr(22, 8, 8, 112, 4, DUNKEL), pa('M30 12 L106 12 L92 40 L106 68 L30 68 Z', ROT))
z('1f6ab', ci(64, 64, 54, ROT), ci(64, 64, 40, WEISS), st('M36 36 L92 92', ROT, 14))
z('1f6cd', pa('M20 48 L108 48 L100 118 L28 118 Z', ROSA), pa('M28 48 L100 48 L96 60 L32 60 Z', '#c94b7c', 0.5), st('M46 48 C46 20 82 20 82 48', BRAUN, 6), pa('M40 66 L88 66 L84 106 L44 106 Z', WEISS, 0.3))
z('1f6ce', pa('M18 92 L110 92 C110 62 90 44 64 44 C38 44 18 62 18 92 Z', GOLD), rr(10, 92, 108, 12, 6, DUNKEL), rr(58, 32, 12, 14, 4, GOLD), pa('M30 88 C30 66 44 52 60 50 C42 56 34 72 34 88 Z', GELB, 0.6))
z('1f6cf', rr(10, 88, 108, 14, 4, BRAUN), rr(10, 100, 10, 18, 3, BRAUN2), rr(108, 100, 10, 18, 3, BRAUN2), rr(14, 40, 12, 50, 3, BRAUN2), rr(26, 62, 90, 28, 6, HELL), rr(26, 58, 90, 14, 6, BLAU), rr(30, 46, 30, 18, 6, WEISS))
z('1f6d2', st('M8 24 L26 24 L40 88 L100 88 L112 44 L34 44', DUNKEL, 8), ci(46, 106, 9, DUNKEL), ci(94, 106, 9, DUNKEL), st('M50 56 L104 56 M46 70 L100 70', DUNKEL, 4), st('M60 46 L62 86 M84 46 L82 86', DUNKEL, 4))
z('1f6d6', pa('M64 10 C30 20 16 50 16 74 L112 74 C112 50 98 20 64 10 Z', GELB2), pa('M64 20 C40 28 30 50 28 68 L100 68 C98 50 88 28 64 20 Z', BEIGE, 0.5), rr(16, 74, 96, 44, 4, BRAUN), rr(52, 84, 24, 34, 10, BRAUN2), st('M20 74 L108 74', BRAUN2, 5))
z('1f6df', ring(64, 64, 42, 22, ORANGE), *[st(f'M{64 + 32 * __import__("math").cos(a * 1.5708 + 0.7854):.1f} {64 + 32 * __import__("math").sin(a * 1.5708 + 0.7854):.1f} L{64 + 54 * __import__("math").cos(a * 1.5708 + 0.7854):.1f} {64 + 54 * __import__("math").sin(a * 1.5708 + 0.7854):.1f}', WEISS, 14) for a in range(4)])
z('1f6e0', st('M22 106 L70 58', BRAUN, 12), pa('M48 24 L82 24 L104 38 L104 56 L92 56 L82 48 L48 48 Z', GRAU), pa('M40 20 L52 20 L52 52 L40 52 Z', DUNKEL),
  st('M106 106 L60 60', GRAU, 12), pa('M40 30 C40 14 62 8 72 18 L58 32 L64 44 L78 40 C86 50 78 70 62 70 C50 70 42 62 40 52 Z', GRAU, 0.0))
z('1f6e1', pa('M64 8 L110 26 L108 66 C106 94 86 112 64 122 C42 112 22 94 20 66 L18 26 Z', BLAU2), pa('M64 20 L98 34 L96 66 C94 88 80 102 64 110 Z', BLAU), st('M46 64 L58 76 L84 50', WEISS, 8))
z('1f6e3', pg([(44, 10), (84, 10), (120, 118), (8, 118)], DUNKEL), st('M64 20 L64 34 M64 50 L64 68 M64 84 L64 110', GELB, 6), st('M44 10 L8 118 M84 10 L120 118', WEISS, 4))
# ---- Essen 2
z('1f950', pa('M12 84 C6 72 20 62 34 70 C40 56 56 46 64 46 C72 46 88 56 94 70 C108 62 122 72 116 84 C110 96 96 90 90 82 C80 94 48 94 38 82 C32 90 18 96 12 84 Z', GOLD), st('M40 76 C52 62 76 62 88 76', GELB2, 4), pa('M26 76 C36 66 54 56 64 56 C74 56 92 66 102 76 C92 78 78 70 64 70 C50 70 36 78 26 76 Z', GELB, 0.35))
z('1f956', pa('M12 84 C8 74 20 64 34 62 L102 42 C114 40 122 52 116 60 L44 96 C28 104 16 96 12 84 Z', GOLD), st('M30 70 L40 86 M50 64 L60 80 M70 58 L80 74 M90 50 L100 66', GELB, 4), st('M14 86 C24 96 34 96 40 92', GELB2, 0.0))
z('1f959', pa('M34 30 C20 60 20 90 40 118 L88 118 C108 90 108 60 94 30 Z', BEIGE), pa('M40 30 L88 30 C92 36 86 40 82 40 L46 40 C42 40 36 36 40 30 Z', BRAUN, 0.0), ci(50, 40, 10, GRUEN), ci(66, 34, 10, ROT), ci(82, 42, 9, GRUEN), ci(60, 46, 8, BRAUN), ci(76, 50, 7, GELB), pa('M40 60 L88 60 L86 70 L42 70 Z', BEIGE, 0.0), st('M44 74 C54 66 74 66 84 74', BEIGE, 6), st('M46 92 C56 84 72 84 82 92', BEIGE, 6))
# ---- Objekte 2
z('1f9e0', pa('M24 60 C10 44 30 18 50 26 C56 12 84 12 88 28 C108 24 120 46 108 60 C120 74 104 94 88 88 C80 104 56 108 48 92 C28 98 12 78 24 60 Z', ROSA), st('M64 24 L64 100', '#c94b7c', 5), st('M40 44 C50 50 50 66 40 76 M88 40 C76 48 78 66 88 76 M30 62 L50 62 M78 60 L100 60', '#c94b7c', 4))
z('1f9e9', pa('M20 20 L52 20 C48 6 68 6 64 20 L96 20 L96 52 C110 48 110 68 96 64 L96 96 L64 96 C68 110 48 110 52 96 L20 96 L20 64 C6 68 6 48 20 52 Z', GRUEN), pa('M28 28 L48 28 L48 88 L28 88 Z', GRUEN2, 0.25))
z('1f9ea', pa('M44 10 L84 10 L84 64 L106 104 C110 112 104 120 96 120 L32 120 C24 120 18 112 22 104 L44 64 Z', HELL, 0.7), pa('M40 78 L88 78 L106 108 C108 112 104 116 96 116 L32 116 C26 116 22 112 24 108 Z', TUERKIS), ci(56, 96, 5, WEISS, 0.5), ci(76, 104, 4, WEISS, 0.5), rr(40, 6, 48, 10, 4, GRAU))
z('1f9ee', rr(14, 12, 100, 104, 8, BRAUN), rr(20, 18, 88, 92, 4, BEIGE), *[rr(28 + i * 20, 22, 4, 84, 2, GRAU) for i in range(4)], *[ci(30 + i * 20, y, 7, ROT if i % 2 else BLAU) for i in range(4) for y in (34, 50)], *[ci(30 + i * 20, y, 7, GELB if i % 2 else GRUEN) for i in range(4) for y in (82, 98)], rr(20, 62, 88, 6, 0, BRAUN))
z('1f9ef', rr(38, 34, 52, 84, 12, ROT), rr(46, 60, 36, 24, 4, WEISS), rr(52, 20, 24, 16, 4, DUNKEL), rr(56, 8, 16, 12, 4, DUNKEL), st('M88 30 C104 32 106 56 100 72', DUNKEL, 6), pa('M96 72 L112 68 L110 84 Z', DUNKEL), rr(30, 116, 68, 6, 3, GRAU))
z('1f9f1', rr(10, 16, 108, 96, 4, BEIGE), *[rr(10, 16 + i * 32, 108, 32, 0, '#c0603f') for i in range(3)], *[rr(10, 46 + i * 32, 108, 4, 0, BEIGE) for i in range(2)], rr(60, 16, 4, 32, 0, BEIGE), rr(36, 48, 4, 32, 0, BEIGE), rr(88, 48, 4, 32, 0, BEIGE), rr(60, 80, 4, 32, 0, BEIGE))
z('1f9f2', pa('M24 16 L52 16 L52 70 C52 84 76 84 76 70 L76 16 L104 16 L104 70 C104 122 24 122 24 70 Z', ROT), rr(24, 16, 28, 26, 0, HELL), rr(76, 16, 28, 26, 0, HELL))
z('1f9f3', rr(24, 34, 80, 82, 10, BRAUN), rr(24, 34, 80, 82, 10, BRAUN), st('M46 34 L46 22 L82 22 L82 34', DUNKEL, 8), rr(36, 46, 56, 4, 2, BRAUN2), rr(36, 96, 56, 4, 2, BRAUN2), rr(56, 66, 16, 12, 3, GOLD), rr(36, 114, 12, 8, 3, DUNKEL), rr(80, 114, 12, 8, 3, DUNKEL))
z('1f9f9', st('M92 10 L56 72', BRAUN, 8), pa('M60 66 L36 84 C24 94 24 110 34 116 L96 116 C104 108 100 88 88 78 Z', GELB2), st('M44 92 L44 114 M56 88 L56 114 M68 88 L68 114 M80 90 L80 114', GELB, 4), rr(48, 66, 24, 12, 4, ROT))
z('1f9fa', pa('M14 50 L114 50 L106 116 L22 116 Z', BEIGE), st('M30 44 C30 20 98 20 98 44', BRAUN, 7), *[st(f'M{24 + i * 4} {58 + i * 11} L{104 - i * 4} {58 + i * 11}', BRAUN2, 3, 0.35) for i in range(5)], rr(14, 46, 100, 10, 4, BRAUN))
z('1f9fe', pa('M28 10 L100 10 L100 118 L92 110 L84 118 L76 110 L68 118 L60 110 L52 118 L44 110 L36 118 L28 110 Z', PAPIER), st('M28 10 L100 10 L100 118 L92 110 L84 118 L76 110 L68 118 L60 110 L52 118 L44 110 L36 118 L28 110 Z', GRAU, 3), rr(38, 24, 52, 6, 3, GRAU), rr(38, 40, 36, 5, 2, GRAU), rr(38, 52, 40, 5, 2, GRAU), rr(38, 64, 32, 5, 2, GRAU), rr(38, 84, 52, 6, 3, INK))
z('1fa7a', st('M30 12 L30 50 C30 70 44 80 58 80 C72 80 86 70 86 50 L86 12', GRAU, 8), st('M58 80 L58 96 C58 112 90 116 96 100', GRAU, 8), ci(102, 94, 12, GRAU), ci(102, 94, 5, HELL), rr(24, 6, 12, 10, 3, DUNKEL), rr(80, 6, 12, 10, 3, DUNKEL))
z('1fa91', rr(30, 14, 12, 90, 4, BRAUN), rr(86, 14, 12, 90, 4, BRAUN), rr(30, 14, 68, 10, 4, BRAUN2), rr(30, 34, 68, 8, 3, BRAUN2), rr(24, 66, 80, 14, 5, BRAUN), rr(28, 80, 10, 38, 3, BRAUN2), rr(90, 80, 10, 38, 3, BRAUN2))
z('1fa99', ci(64, 64, 54, GOLD), ci(64, 64, 42, GELB), ring(64, 64, 42, 3, GELB2), rr(58, 42, 12, 44, 3, GOLD), rr(46, 50, 36, 10, 3, GOLD), rr(46, 68, 36, 10, 3, GOLD), pa('M64 10 A54 54 0 0 1 118 64 L104 64 A40 40 0 0 0 64 24 Z', WEISS, 0.25))
z('1faa8', pa('M20 100 L30 60 L54 40 L90 36 L112 62 L108 100 C100 112 30 112 20 100 Z', GRAU), pa('M30 60 L54 40 L74 62 L52 84 Z', HELL, 0.35), pa('M74 62 L90 36 L112 62 L96 76 Z', DUNKEL, 0.25))
z('1faa9', st('M64 4 L64 16', GRAU, 4), ci(64, 66, 50, HELL), *[rr(x, y, 12, 12, 1, GRAU, 0.5) for x in range(18, 104, 16) for y in range(20, 106, 16) if (x - 64) ** 2 + (y - 66) ** 2 < 2000 and ((x + y) // 16) % 2 == 0],
  *[rr(x, y, 12, 12, 1, HIMMEL, 0.6) for x in range(18, 104, 16) for y in range(20, 106, 16) if (x - 64) ** 2 + (y - 66) ** 2 < 2000 and ((x + y) // 16) % 2 == 1], funkel(90, 36, 8, WEISS), funkel(36, 84, 7, WEISS))
z('1fab4', pa('M30 76 L98 76 L90 120 L38 120 Z', '#c0603f'), rr(26, 72, 76, 10, 3, '#a24d30'), st('M64 76 L64 44', GRUEN2, 6), pa('M64 50 C58 30 40 26 26 34 C34 50 50 58 64 50 Z', GRUEN), pa('M64 42 C70 22 88 18 102 26 C94 42 78 50 64 42 Z', GRUEN), pa('M64 60 C56 48 44 46 34 52 C40 62 54 66 64 60 Z', GRUEN2))


def schreiben(ziel: str) -> int:
    os.makedirs(ziel, exist_ok=True)
    for name, teile in Z.items():
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">'
               + ''.join(teile) + '</svg>\n')
        with open(os.path.join(ziel, f'emoji_u{name}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg)
    return len(Z)


if __name__ == '__main__':
    ziel = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'svg')
    n = schreiben(ziel)
    print(f'{n} Ikonen nach {ziel} geschrieben')
