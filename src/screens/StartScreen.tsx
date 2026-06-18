import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScaledStage from '../components/ScaledStage';
import { useTournamentStore } from '../store/useTournamentStore';
import { useTimerStore } from '../store/useTimerStore';
import { unlockAudio } from '../lib/audio';
import { formatBlind } from '../lib/time';
import { useSettingsStore } from '../store/useSettingsStore';
import './StartScreen.css';

export default function StartScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tournaments = useTournamentStore((s) => s.tournaments);
  const load = useTimerStore((s) => s.load);
  const language = useSettingsStore((s) => s.language);

  const start = (id: string) => {
    const tournament = tournaments.find((x) => x.id === id);
    if (!tournament || tournament.levels.length === 0) return;
    unlockAudio();
    load(tournament);
    navigate('/timer');
  };

  return (
    <ScaledStage>
      <div className="start-wrap">
        <button className="btn back-btn" onClick={() => navigate('/')}>‹ {t('common.back')}</button>
        <h1 className="start-title">{t('menu.selectTournament')}</h1>

        {tournaments.length === 0 ? (
          <div className="start-empty panel">
            <p>{t('menu.noTournament')}</p>
            <button className="btn primary" onClick={() => navigate('/config')}>
              {t('menu.configure')}
            </button>
          </div>
        ) : (
          <div className="start-list scroll">
            {tournaments.map((tn) => (
              <button
                key={tn.id}
                className="start-card panel"
                disabled={tn.levels.length === 0}
                onClick={() => start(tn.id)}
              >
                <div className="start-card-name">{tn.name}</div>
                <div className="start-card-meta">
                  {tn.levels.length} {t('config.level')}
                  {tn.levels[0] && (
                    <span className="start-card-blinds">
                      {' · '}
                      {formatBlind(tn.levels[0].smallBlind, language)} /{' '}
                      {formatBlind(tn.levels[0].bigBlind, language)}
                    </span>
                  )}
                </div>
                <span className="start-card-go">{t('menu.start')} ›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </ScaledStage>
  );
}
