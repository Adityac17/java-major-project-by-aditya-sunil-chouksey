"""Merges the four separately embedded Inter files into one 'Inter' font entry.

docx-js can only embed a *regular* face per font name, so the build embeds Inter, Inter__B, Inter__I and
Inter__BI. This script rewrites word/fontTable.xml so the 'Inter' entry carries embedBold / embedItalic /
embedBoldItalic pointing at the other three files, and drops the helper entries. Word then uses the real
bold and italic glyphs instead of synthesising them.

usage: python3 fixfonts.py file.docx [more.docx ...]
"""
import os
import re
import shutil
import sys
import tempfile
import zipfile


def fix(path):
    with zipfile.ZipFile(path) as z:
        items = {n: z.read(n) for n in z.namelist()}
        infos = {i.filename: i for i in z.infolist()}
    xml = items['word/fontTable.xml'].decode('utf8')
    fonts = re.findall(r'<w:font w:name="([^"]+)">(.*?)</w:font>', xml, re.S)
    embeds = {}
    for name, body in fonts:
        m = re.search(r'<w:embedRegular (r:id="[^"]+") (w:fontKey="[^"]+")\s*/>', body)
        if m:
            embeds[name] = m.group(1) + ' ' + m.group(2)
    if 'Inter__B' not in embeds:
        return False  # already fixed or no helper faces
    extra = ''.join('<w:%s %s/>' % (tag, embeds[n]) for tag, n in
                    (('embedBold', 'Inter__B'), ('embedItalic', 'Inter__I'), ('embedBoldItalic', 'Inter__BI')))

    def repl(m):
        name, body = m.group(1), m.group(2)
        if name in ('Inter__B', 'Inter__I', 'Inter__BI'):
            return ''
        if name == 'Inter':
            body = re.sub(r'(<w:embedRegular [^>]*/>)', lambda mm: mm.group(1) + extra, body)
        return '<w:font w:name="%s">%s</w:font>' % (name, body)

    xml = re.sub(r'<w:font w:name="([^"]+)">(.*?)</w:font>', repl, xml, flags=re.S)
    items['word/fontTable.xml'] = xml.encode('utf8')
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.docx').name
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as out:
        for name, data in items.items():
            out.writestr(infos[name], data)
    shutil.move(tmp, path)
    os.chmod(path, 0o644)
    return True


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p, 'fonts merged' if fix(p) else 'unchanged')
