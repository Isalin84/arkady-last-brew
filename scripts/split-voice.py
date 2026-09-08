"""Split the approved Arkady Clone take at the 14 deliberately generated pauses."""
from pathlib import Path
import subprocess, re, json
root = Path(__file__).resolve().parents[1]
source = root / 'assets/audio/voice/Arkady Voice.mp3'
r = subprocess.run(['ffmpeg','-hide_banner','-i',str(source),'-af','silencedetect=noise=-35dB:d=0.8','-f','null','-'],capture_output=True,text=True,check=True)
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)',r.stderr)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)',r.stderr)]
assert len(starts)==len(ends)==14, 'Review silence boundaries before splitting another take'
duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(source)],text=True))
manifest=[]
for i,(start,end) in enumerate(zip([0]+[max(0,t-.09) for t in ends],[t+.12 for t in starts]+[duration]),1):
    out=source.parent/f'{i:02}.mp3'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-to',str(end),'-i',str(source),'-af','loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.008','-ar','44100','-codec:a','libmp3lame','-b:a','128k',str(out)],check=True)
    manifest.append({'file':out.name,'sourceStart':round(start,3),'sourceEnd':round(end,3)})
(source.parent/'segments.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Split {len(manifest)} voice lines, original retained.')
