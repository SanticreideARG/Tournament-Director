import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScaledStage from '../components/ScaledStage';
import { useTournamentStore, makeTournament, makeLevel } from '../store/useTournamentStore';
import type { Level, Tournament } from '../types/tournament';
import { parseTournamentCsv, tournamentToCsv } from '../lib/csv';
import { parseDuration, formatDuration } from '../lib/time';
import './ConfigScreen.css';

export default function ConfigScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tournaments, upsert, remove, duplicate } = useTournamentStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Tournament>(() => tournaments[0] ? structuredClone(tournaments[0]) : makeTournament());
  const [timeTexts, setTimeTexts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  // Inicializa los textos de tiempo cuando cambia el draft seleccionado.
  useEffect(() => {
    const map: Record<string, string> = {};
    draft.levels.forEach((l) => { map[l.id] = formatDuration(l.durationSeconds); });
    setTimeTexts(map);
  }, [draft.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSaved = useMemo(() => tournaments.some((x) => x.id === draft.id), [tournaments, draft.id]);

  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2500); };

  const selectTournament = (id: string) => {
    const found = tournaments.find((x) => x.id === id);
    if (found) setDraft(structuredClone(found));
  };

  const newTournament = () => setDraft(makeTournament(t('config.newTournament')));

  const updateLevel = (id: string, patch: Partial<Level>) =>
    setDraft((d) => ({ ...d, levels: d.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  const setTime = (id: string, text: string) => {
    setTimeTexts((m) => ({ ...m, [id]: text }));
    updateLevel(id, { durationSeconds: parseDuration(text) });
  };

  const addLevel = (isBreak: boolean) => {
    const prev = draft.levels[draft.levels.length - 1];
    const lvl = makeLevel({
      name: isBreak ? t('timer.break') : `${t('config.level')} ${draft.levels.filter((l) => !l.isBreak).length + 1}`,
      isBreak,
      durationSeconds: isBreak ? 10 * 60 : (prev?.durationSeconds ?? 20 * 60),
      smallBlind: isBreak ? null : (prev && prev.bigBlind ? prev.bigBlind : 50),
      bigBlind: isBreak ? null : (prev && prev.bigBlind ? prev.bigBlind * 2 : 100),
    });
    setDraft((d) => ({ ...d, levels: [...d.levels, lvl] }));
    setTimeTexts((m) => ({ ...m, [lvl.id]: formatDuration(lvl.durationSeconds) }));
  };

  const removeLevel = (id: string) =>
    setDraft((d) => ({ ...d, levels: d.levels.filter((l) => l.id !== id) }));

  const move = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const next = d.levels.slice();
      const j = index + dir;
      if (j < 0 || j >= next.length) return d;
      [next[index], next[j]] = [next[j], next[index]];
      return { ...d, levels: next };
    });

  const save = () => { upsert(draft); flash(t('config.saved')); };

  const onImport = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const levels = parseTournamentCsv(String(reader.result));
        if (levels.length === 0) { flash(t('config.importError')); return; }
        const name = file.name.replace(/\.csv$/i, '') || draft.name;
        setDraft((d) => ({ ...d, name: d.name === t('config.newTournament') ? name : d.name, levels }));
      } catch {
        flash(t('config.importError'));
      }
    };
    reader.readAsText(file);
  };

  const onExport = () => {
    const blob = new Blob([tournamentToCsv(draft)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.name || 'torneo'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = () => {
    if (window.confirm(t('config.confirmDelete'))) {
      remove(draft.id);
      newTournament();
    }
  };

  return (
    <ScaledStage>
      <div className="cfg-wrap">
        <button className="btn back-btn" onClick={() => navigate('/')}>‹ {t('common.back')}</button>
        <h1 className="cfg-title">{t('config.title')}</h1>

        <div className="cfg-layout">
          {/* Sidebar: torneos guardados */}
          <aside className="cfg-side panel">
            <div className="cfg-side-head">{t('config.savedTournaments')}</div>
            <div className="cfg-side-list scroll">
              {tournaments.map((tn) => (
                <button
                  key={tn.id}
                  className={`cfg-side-item ${tn.id === draft.id ? 'on' : ''}`}
                  onClick={() => selectTournament(tn.id)}
                >
                  <span>{tn.name}</span>
                  <small>{tn.levels.length}</small>
                </button>
              ))}
            </div>
            <button className="btn primary cfg-new" onClick={newTournament}>+ {t('config.newTournament')}</button>
            <div className="cfg-side-actions">
              <button className="btn" onClick={() => fileRef.current?.click()}>{t('config.importCsv')}</button>
              <button className="btn" onClick={onExport} disabled={draft.levels.length === 0}>{t('config.exportCsv')}</button>
              {isSaved && <button className="btn" onClick={() => { duplicate(draft.id); flash(t('config.duplicate')); }}>{t('config.duplicate')}</button>}
              {isSaved && <button className="btn danger" onClick={del}>{t('config.delete')}</button>}
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          </aside>

          {/* Editor */}
          <main className="cfg-editor panel">
            <label className="cfg-name-field">
              {t('config.tournamentName')}
              <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </label>

            <div className="cfg-table-head">
              <span className="c-idx">#</span>
              <span className="c-name">{t('config.level')}</span>
              <span className="c-time">{t('config.time')}</span>
              <span className="c-num">{t('config.smallBlind')}</span>
              <span className="c-num">{t('config.bigBlind')}</span>
              <span className="c-num">{t('config.ante')}</span>
              <span className="c-msg">{t('config.startMessage')} / {t('config.endMessage')}</span>
              <span className="c-act">{t('config.actions')}</span>
            </div>

            <div className="cfg-rows scroll">
              {draft.levels.length === 0 && <div className="cfg-empty">{t('config.empty')}</div>}
              {draft.levels.map((l, i) => (
                <div key={l.id} className={`cfg-row ${l.isBreak ? 'break' : ''}`}>
                  <span className="c-idx">{i + 1}</span>
                  <input className="c-name" value={l.name} onChange={(e) => updateLevel(l.id, { name: e.target.value })} />
                  <input className="c-time" value={timeTexts[l.id] ?? ''} onChange={(e) => setTime(l.id, e.target.value)} placeholder="00:20:00" />
                  <input className="c-num" type="number" value={l.smallBlind ?? ''} disabled={l.isBreak}
                    onChange={(e) => updateLevel(l.id, { smallBlind: e.target.value === '' ? null : Number(e.target.value) })} />
                  <input className="c-num" type="number" value={l.bigBlind ?? ''} disabled={l.isBreak}
                    onChange={(e) => updateLevel(l.id, { bigBlind: e.target.value === '' ? null : Number(e.target.value) })} />
                  <input className="c-num" type="number" value={l.ante ?? ''} disabled={l.isBreak}
                    onChange={(e) => updateLevel(l.id, { ante: e.target.value === '' ? null : Number(e.target.value) })} />
                  <div className="c-msg">
                    <input value={l.startMessage} placeholder={t('config.startMessage')} onChange={(e) => updateLevel(l.id, { startMessage: e.target.value })} />
                    <input value={l.endMessage} placeholder={t('config.endMessage')} onChange={(e) => updateLevel(l.id, { endMessage: e.target.value })} />
                  </div>
                  <div className="c-act">
                    <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                    <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === draft.levels.length - 1}>↓</button>
                    <button className="icon-btn danger" onClick={() => removeLevel(l.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cfg-editor-actions">
              <button className="btn" onClick={() => addLevel(false)}>+ {t('config.addLevel')}</button>
              <button className="btn" onClick={() => addLevel(true)}>+ {t('config.addBreak')}</button>
              <div style={{ flex: 1 }} />
              <button className="btn primary" onClick={save} disabled={!draft.name.trim()}>{t('config.save')}</button>
            </div>
          </main>
        </div>

        {toast && <div className="cfg-toast">{toast}</div>}
      </div>
    </ScaledStage>
  );
}
